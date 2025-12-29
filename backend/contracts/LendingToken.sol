// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LendingToken is ERC20 {
    constructor() ERC20("DApp Dollar", "DUSD") {}

    // Faucet for testing: Anyone can mint 1000 tokens
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}