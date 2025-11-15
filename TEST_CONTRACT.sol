// SPDX-License-Identifier: MIT
// TEST CONTRACT WITH KNOWN VULNERABILITIES
// This contract should trigger multiple security findings

pragma solidity ^0.7.6; // Using older version to test unchecked arithmetic

contract VulnerableContract {
    address public owner;
    uint256 public balance;
    mapping(address => uint256) public deposits;
    
    constructor() {
        owner = msg.sender;
    }
    
    // VULNERABILITY 1: Missing Access Control
    // This function should be flagged - it modifies state without access control
    function setBalance(uint256 newBalance) public {
        balance = newBalance;
    }
    
    // VULNERABILITY 2: Missing Access Control + Low-Level Call
    // Should flag both missing access control and low-level call usage
    function withdraw(uint256 amount) public {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount; // State change before external call - reentrancy risk
        balance -= amount;
        
        // VULNERABILITY 3: Low-Level Call Usage
        // This should be flagged as a low-level call
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    // VULNERABILITY 4: Missing Access Control
    function updateOwner(address newOwner) public {
        owner = newOwner; // Should have onlyOwner modifier
    }
    
    // VULNERABILITY 5: Unchecked Arithmetic (Solidity <0.8)
    // Should be flagged because we're using Solidity 0.7.6 without SafeMath
    function unsafeAdd(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b; // Can overflow in Solidity <0.8
    }
    
    // VULNERABILITY 6: Reentrancy
    // State change happens after external call
    function withdrawReentrant(uint256 amount) public {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        
        // External call before state update - reentrancy vulnerability
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        // State update after external call - vulnerable to reentrancy
        deposits[msg.sender] -= amount;
        balance -= amount;
    }
    
    // This function should NOT be flagged (it's a view function)
    function getBalance() public view returns (uint256) {
        return balance;
    }
    
    // This function should NOT be flagged (it has access control check)
    function adminOnlyFunction() public {
        require(msg.sender == owner, "Not owner");
        balance = 0;
    }
    
    receive() external payable {
        deposits[msg.sender] += msg.value;
        balance += msg.value;
    }
}

