import { ethers } from "hardhat";

async function main() {
    // Deploy ReserveOracle
    const ReserveOracle = await ethers.getContractFactory("ReserveOracle");
    const reserveOracle = await ReserveOracle.deploy();
    await reserveOracle.waitForDeployment();
    console.log("ReserveOracle deployed to:", reserveOracle.target);

    // Deploy ExchangeRegistry
    const ExchangeRegistry = await ethers.getContractFactory("ExchangeRegistry");
    const exchangeRegistry = await ExchangeRegistry.deploy();
    await exchangeRegistry.waitForDeployment();
    console.log("ExchangeRegistry deployed to:", exchangeRegistry.target);

    // Deploy AlertContract
    const AlertContract = await ethers.getContractFactory("AlertContract");
    const alertContract = await AlertContract.deploy();
    await alertContract.waitForDeployment();
    console.log("AlertContract deployed to:", alertContract.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
