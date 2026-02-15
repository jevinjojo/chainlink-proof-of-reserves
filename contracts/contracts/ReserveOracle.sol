// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReserveOracle {
    struct ReserveStatus {
        bool verified;
        uint256 discrepancyPct;
        uint256 timestamp;
    }

    // exchangeId => ReserveStatus
    mapping(uint256 => ReserveStatus) public reserves;

    event ReserveUpdated(
        uint256 indexed exchangeId,
        bool verified,
        uint256 discrepancyPct,
        uint256 timestamp
    );

    function updateReserveStatus(
        uint256 exchangeId,
        bool verified,
        uint256 discrepancyPct,
        uint256 timestamp
    ) external {
        reserves[exchangeId] = ReserveStatus(verified, discrepancyPct, timestamp);
        emit ReserveUpdated(exchangeId, verified, discrepancyPct, timestamp);
    }

    function getReserveStatus(uint256 exchangeId)
        external
        view
        returns (ReserveStatus memory)
    {
        return reserves[exchangeId];
    }
}
