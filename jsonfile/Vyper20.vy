# First token written in Vyper language (ERC20 implemented)
# While Solidity dominates the space, Vyper emerges as a compelling alternative that prioritizes security, simplicity, and auditability.

# Github source code: https://github.com/Vyper20/VPR20
# Medium: https://medium.com/@vypercoin/building-a-sophisticated-erc20-token-with-uniswap-integration-in-vyper-vpr20-a-complete-guide-4486f390b322
# Telegram: https://t.me/Vyper20_eth
# X: https://x.com/vyper20_eth

# @version 0.3.9
# @license MIT

# Events
event Transfer:
    sender: indexed(address)
    receiver: indexed(address)
    value: uint256

event Approval:
    owner: indexed(address)
    spender: indexed(address)
    value: uint256

event OwnershipTransferred:
    previousOwner: indexed(address)
    newOwner: indexed(address)

event MaxTxAmountUpdated:
    maxTxAmount: uint256

# ERC20 Interface
interface IERC20:
    def totalSupply() -> uint256: view
    def balanceOf(account: address) -> uint256: view
    def transfer(recipient: address, amount: uint256) -> bool: nonpayable
    def allowance(owner: address, spender: address) -> uint256: view
    def approve(spender: address, amount: uint256) -> bool: nonpayable
    def transferFrom(sender: address, recipient: address, amount: uint256) -> bool: nonpayable

# Uniswap Interfaces
interface IUniswapV2Factory:
    def createPair(tokenA: address, tokenB: address) -> address: nonpayable

interface IUniswapV2Router02:
    def swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn: uint256,
        amountOutMin: uint256,
        path: DynArray[address, 2],
        to: address,
        deadline: uint256
    ): nonpayable
    def factory() -> address: view
    def WETH() -> address: view
    def addLiquidityETH(
        token: address,
        amountTokenDesired: uint256,
        amountTokenMin: uint256,
        amountETHMin: uint256,
        to: address,
        deadline: uint256
    ) -> (uint256, uint256, uint256): payable

# State Variables
balances: HashMap[address, uint256]
allowances: HashMap[address, HashMap[address, uint256]]
is_excluded_from_fee: HashMap[address, bool]
bots: HashMap[address, bool]

# Contract variables
owner: public(address)
tax_wallet: address
name: public(String[32])
symbol: public(String[32])
decimals: public(constant(uint8)) = 9
total_supply: public(constant(uint256)) = 420690000000 * 10**9

# Tax system
initial_buy_tax: uint256
initial_sell_tax: uint256
final_buy_tax: uint256
final_sell_tax: uint256
reduce_buy_tax_at: uint256
reduce_sell_tax_at: uint256
prevent_swap_before: uint256
buy_count: uint256

# Trading limits
max_tx_amount: public(uint256)
max_wallet_size: public(uint256)
tax_swap_threshold: public(uint256)
max_tax_swap: public(uint256)

# Uniswap variables
uniswap_v2_router: IUniswapV2Router02
uniswap_v2_pair: address
trading_open: bool
in_swap: bool
swap_enabled: bool
sell_count: uint256
last_sell_block: uint256

@external
def __init__(_name: String[32], _symbol: String[32]):
    """
    Initialize the token contract
    """
    self.name = _name
    self.symbol = _symbol
    self.owner = msg.sender
    self.tax_wallet = msg.sender

    # Initialize tax system
    self.initial_buy_tax = 20
    self.initial_sell_tax = 20
    self.final_buy_tax = 0
    self.final_sell_tax = 0
    self.reduce_buy_tax_at = 30
    self.reduce_sell_tax_at = 30
    self.prevent_swap_before = 20
    self.buy_count = 0

    # Initialize trading limits
    self.max_tx_amount = 8413800000 * 10**9
    self.max_wallet_size = 8413800000 * 10**9
    self.tax_swap_threshold = 4206900000 * 10**9
    self.max_tax_swap = 4206900000 * 10**9

    # Initialize balances and exclusions
    self.balances[msg.sender] = total_supply
    self.is_excluded_from_fee[self.owner] = True
    self.is_excluded_from_fee[self] = True
    self.is_excluded_from_fee[self.tax_wallet] = True

    # Initialize trading state
    self.trading_open = False
    self.in_swap = False
    self.swap_enabled = False
    self.sell_count = 0
    self.last_sell_block = 0

    log Transfer(empty(address), msg.sender, total_supply)
    log OwnershipTransferred(empty(address), msg.sender)

@external
@view
def totalSupply() -> uint256:
    """
    Returns the total supply of tokens
    """
    return total_supply

@external
@view
def balanceOf(account: address) -> uint256:
    """
    Returns the balance of the specified account
    """
    return self.balances[account]

@external
@view
def allowance(owner: address, spender: address) -> uint256:
    """
    Returns the allowance of spender for owner's tokens
    """
    return self.allowances[owner][spender]

@external
def approve(spender: address, amount: uint256) -> bool:
    """
    Approves spender to spend amount of tokens
    """
    self._approve(msg.sender, spender, amount)
    return True

@external
def transfer(recipient: address, amount: uint256) -> bool:
    """
    Transfers amount of tokens to recipient
    """
    self._transfer(msg.sender, recipient, amount)
    return True

@external
def transferFrom(sender: address, recipient: address, amount: uint256) -> bool:
    """
    Transfers amount of tokens from sender to recipient
    """
    current_allowance: uint256 = self.allowances[sender][msg.sender]
    assert current_allowance >= amount, "ERC20: transfer amount exceeds allowance"

    self._transfer(sender, recipient, amount)
    self._approve(sender, msg.sender, current_allowance - amount)
    return True

@internal
def _approve(owner: address, spender: address, amount: uint256):
    """
    Internal approve function
    """
    assert owner != empty(address), "ERC20: approve from the zero address"
    assert spender != empty(address), "ERC20: approve to the zero address"

    self.allowances[owner][spender] = amount
    log Approval(owner, spender, amount)

@internal
def _transfer(sender: address, recipient: address, amount: uint256):
    """
    Internal transfer function with tax logic
    """
    assert sender != empty(address), "ERC20: transfer from the zero address"
    assert recipient != empty(address), "ERC20: transfer to the zero address"
    assert amount > 0, "Transfer amount must be greater than zero"

    tax_amount: uint256 = 0

    # Apply taxes if not owner
    if sender != self.owner and recipient != self.owner:
        assert not self.bots[sender] and not self.bots[recipient], "Bot detected"

        # Calculate buy tax
        if sender == self.uniswap_v2_pair and recipient != self.uniswap_v2_router.address and not self.is_excluded_from_fee[recipient]:
            assert amount <= self.max_tx_amount, "Exceeds the max transaction amount"
            assert self.balances[recipient] + amount <= self.max_wallet_size, "Exceeds the max wallet size"

            if self.buy_count > self.reduce_buy_tax_at:
                tax_amount = amount * self.final_buy_tax / 100
            else:
                tax_amount = amount * self.initial_buy_tax / 100

            self.buy_count += 1

        # Calculate sell tax
        elif recipient == self.uniswap_v2_pair and sender != self:
            if self.buy_count > self.reduce_sell_tax_at:
                tax_amount = amount * self.final_sell_tax / 100
            else:
                tax_amount = amount * self.initial_sell_tax / 100

        # Handle contract token swap
        contract_token_balance: uint256 = self.balances[self]
        if (not self.in_swap and
            recipient == self.uniswap_v2_pair and
            self.swap_enabled and
            contract_token_balance > self.tax_swap_threshold and
            self.buy_count > self.prevent_swap_before):

            if block.number > self.last_sell_block:
                self.sell_count = 0

            assert self.sell_count < 3, "Only 3 sells per block!"

            swap_amount: uint256 = min(amount, min(contract_token_balance, self.max_tax_swap))
            self._swap_tokens_for_eth(swap_amount)

            contract_eth_balance: uint256 = self.balance
            if contract_eth_balance > 0:
                self._send_eth_to_fee(contract_eth_balance)

            self.sell_count += 1
            self.last_sell_block = block.number

    # Apply tax to balances
    if tax_amount > 0:
        self.balances[self] += tax_amount
        log Transfer(sender, self, tax_amount)

    # Update balances
    self.balances[sender] -= amount
    self.balances[recipient] += (amount - tax_amount)

    log Transfer(sender, recipient, amount - tax_amount)

@internal
def _swap_tokens_for_eth(token_amount: uint256):
    """
    Swaps tokens for ETH using Uniswap
    """
    self.in_swap = True

    path: DynArray[address, 2] = [self, self.uniswap_v2_router.WETH()]
    self._approve(self, self.uniswap_v2_router.address, token_amount)

    self.uniswap_v2_router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        token_amount,
        0,
        path,
        self,
        block.timestamp
    )

    self.in_swap = False

@internal
def _send_eth_to_fee(amount: uint256):
    """
    Sends ETH to the tax wallet
    """
    raw_call(self.tax_wallet, b"", value=amount)

@external
def removeLimits():
    """
    Removes transaction and wallet limits (only owner)
    """
    assert msg.sender == self.owner, "Ownable: caller is not the owner"

    self.max_tx_amount = total_supply
    self.max_wallet_size = total_supply

    log MaxTxAmountUpdated(total_supply)

@external
def addBots(bot_addresses: DynArray[address, 100]):
    """
    Adds addresses to the bot list (only owner)
    """
    assert msg.sender == self.owner, "Ownable: caller is not the owner"

    for bot_address in bot_addresses:
        self.bots[bot_address] = True

@external
def delBots(not_bot_addresses: DynArray[address, 100]):
    """
    Removes addresses from the bot list (only owner)
    """
    assert msg.sender == self.owner, "Ownable: caller is not the owner"

    for not_bot_address in not_bot_addresses:
        self.bots[not_bot_address] = False

@external
@view
def isBot(account: address) -> bool:
    """
    Checks if an address is marked as a bot
    """
    return self.bots[account]

@external
def openTrading():
    """
    Opens trading by setting up Uniswap pair and adding liquidity (only owner)
    """
    assert msg.sender == self.owner, "Ownable: caller is not the owner"
    assert not self.trading_open, "Trading is already open"

    # Initialize Uniswap router
    self.uniswap_v2_router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D)

    # Approve and transfer tokens
    self._approve(self, msg.sender, max_value(uint256))
    transfer_amount: uint256 = self.balances[msg.sender] * 95 / 100
    self._transfer(msg.sender, self, transfer_amount)

    # Create Uniswap pair
    factory: IUniswapV2Factory = IUniswapV2Factory(self.uniswap_v2_router.factory())
    self.uniswap_v2_pair = factory.createPair(self, self.uniswap_v2_router.WETH())

    # Add liquidity
    self._approve(self, self.uniswap_v2_router.address, max_value(uint256))
    self.uniswap_v2_router.addLiquidityETH(
        self,
        self.balances[self],
        0,
        0,
        self.owner,
        block.timestamp,
        value=self.balance
    )

    # Approve pair for router
    IERC20(self.uniswap_v2_pair).approve(self.uniswap_v2_router.address, max_value(uint256))

    # Enable trading
    self.swap_enabled = True
    self.trading_open = True

@external
def reduceFee(new_fee: uint256):
    """
    Reduces the final buy and sell tax (only tax wallet)
    """
    assert msg.sender == self.tax_wallet, "Only tax wallet can call this"
    assert new_fee <= self.final_buy_tax and new_fee <= self.final_sell_tax, "New fee too high"

    self.final_buy_tax = new_fee
    self.final_sell_tax = new_fee

@external
def manualSwap():
    """
    Manually swaps contract tokens for ETH (only tax wallet)
    """
    assert msg.sender == self.tax_wallet, "Only tax wallet can call this"

    token_balance: uint256 = self.balances[self]
    if token_balance > 0:
        self._swap_tokens_for_eth(token_balance)

    eth_balance: uint256 = self.balance
    if eth_balance > 0:
        self._send_eth_to_fee(eth_balance)

@external
def manualSend():
    """
    Manually sends contract ETH to tax wallet (only tax wallet)
    """
    assert msg.sender == self.tax_wallet, "Only tax wallet can call this"

    eth_balance: uint256 = self.balance
    if eth_balance > 0:
        self._send_eth_to_fee(eth_balance)

@external
def renounceOwnership():
    """
    Renounces ownership and transfers any remaining ETH to current owner
    """
    assert msg.sender == self.owner, "Ownable: caller is not the owner"

    # Transfer remaining ETH to owner
    if self.balance > 0:
        raw_call(self.owner, b"", value=self.balance)

    log OwnershipTransferred(self.owner, empty(address))
    self.owner = empty(address)

@external
@payable
def __default__():
    """
    Fallback function to receive ETH
    """
    pass

@internal
@pure
def min(a: uint256, b: uint256) -> uint256:
    """
    Returns the minimum of two numbers
    """
    if a > b:
        return b
    return a