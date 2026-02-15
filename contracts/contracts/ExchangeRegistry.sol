// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ExchangeRegistry {
    struct WalletInfo {
        string chain;
        address wallet;
    }

    // exchangeId => list of wallets
    mapping(uint256 => WalletInfo[]) public exchangeWallets;

    event WalletRegistered(uint256 indexed exchangeId, string chain, address wallet);

    function registerWallet(
        uint256 exchangeId,
        string calldata chain,
        address wallet
    ) external {
        exchangeWallets[exchangeId].push(WalletInfo(chain, wallet));
        emit WalletRegistered(exchangeId, chain, wallet);
    }

    function getWallets(uint256 exchangeId)
        external
        view
        returns (WalletInfo[] memory)
    {
        return exchangeWallets[exchangeId];
    }
}
