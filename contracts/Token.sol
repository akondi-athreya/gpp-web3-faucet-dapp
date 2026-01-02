// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1 million tokens
    address public minter;

    constructor(address _minter) ERC20("Faucet Token", "FAUCET") {
        require(_minter != address(0), "Minter address cannot be zero");
        minter = _minter;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only minter can mint tokens");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        _mint(to, amount);
    }

    function transferMinterRole(address newMinter) external {
        require(msg.sender == minter, "Only current minter can transfer role");
        require(newMinter != address(0), "New minter cannot be zero address");
        minter = newMinter;
    }
}
