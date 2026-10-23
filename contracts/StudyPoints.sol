// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StudyPoints is ERC20 {
    constructor(address recipient) ERC20("Study Points", "STUDY") {
        require(recipient != address(0), "StudyPoints: recipient is zero address");
        _mint(recipient, 1_000_000 * 10 ** decimals());
    }
}
