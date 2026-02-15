// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReserveOracle {
    function updateReserveStatus(
        uint256 exchangeId,
        bool verified,
        uint256 discrepancyPct,
        uint256 timestamp
    ) external;

    function getReserveStatus(
        uint256 exchangeId
    ) external view returns (bool, uint256, uint256);
}
