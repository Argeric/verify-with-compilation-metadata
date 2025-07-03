// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

contract TestVerification {
    string public constant name = "Test Contract";
    uint256 public immutable deployTime;

    constructor() {
        deployTime = 233;
    }

    function getMessage() external pure returns (string memory) {
        return "Hello Conflux!";
    }
}