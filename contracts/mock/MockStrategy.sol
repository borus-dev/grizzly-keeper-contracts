// SPDX-License-Identifier: MIT

pragma solidity 0.8.14;

import "../interfaces/IERC20.sol";

contract MockStrategy {
    address public keep3r = 0xeecdE45B2286fFE7677E209DC3C149Cd160a242E;
    address public mockToken = 0xAE89e6Bd3823228933e7Cb17bb04E2005576Fc96;

    address public owner;

    event Harvest(address indexed sender);

    error OnlyKeep3r();

    constructor() {
        owner = msg.sender;
    }

    function setKeeper(address _keeper) external {
        require(msg.sender == owner);
        keep3r = _keeper;
    }

    modifier onlyKeep3r() {
        if (msg.sender != keep3r) revert OnlyKeep3r();
        _;
    }

    function harvest() external onlyKeep3r {
        IERC20(mockToken).transfer(msg.sender, 1e18);
        emit Harvest(msg.sender);
    }

    function harvestTrigger(uint256 _callCost) external pure returns (bool) {
        return true;
    }
}
