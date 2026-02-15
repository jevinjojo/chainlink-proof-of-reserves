// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AlertContract {
    event AlertTriggered(
        uint256 indexed exchangeId,
        string issue,
        uint256 timestamp
    );

    function triggerAlert(uint256 exchangeId, string calldata issue) external {
        emit AlertTriggered(exchangeId, issue, block.timestamp);
    }
}
