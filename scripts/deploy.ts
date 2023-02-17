import { ethers } from 'hardhat';

async function deploy(name: string, args: string[] = []) {
    const Contract = await ethers.getContractFactory(name);
    const contract = await Contract.deploy(...args);
    await contract.deployed();
    return contract;
}

const owner: string = '0xD3C2cBF18101DC0230a784F3f928d1842fC1bBFF';

async function main() {
    const harvestV2KeeperJob = await deploy('HarvestV2KeeperJob', [owner]);
    console.log('HarvestV2KeeperJob deployed to:', harvestV2KeeperJob.address);
}

// We recommend this pattern to be able to use async/await everywhere and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
