import { ethers, run, network } from 'hardhat';

const MULTI_SIG_GRIZZLY_ETH = '0xcE88F73FAA2C8de5fdE0951A6b80583af4C14265';

async function main() {
    const HarvestV2KeeperJob = await ethers.getContractFactory('HarvestV2KeeperJob');
    const deployArgs = [MULTI_SIG_GRIZZLY_ETH];

    const harvestV2KeeperJob = await HarvestV2KeeperJob.deploy(...deployArgs);
    console.log('Deploying HarvestV2KeeperJob...');
    await harvestV2KeeperJob.deployed();
    console.log('HarvestV2KeeperJob deployed to:', harvestV2KeeperJob.address);

    if (network.config.chainId === 1 && process.env.ETHERSCAN_API) {
        console.log('Waiting for block confirmations...');
        await harvestV2KeeperJob.deployTransaction.wait(5);
        await verify(harvestV2KeeperJob.address, deployArgs);
    }
}

const verify = async (contractAddress: string, args: any) => {
    console.log('Verifying contract...');
    try {
        await run('verify:verify', {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e: any) {
        if (e.message.toLowerCase().includes('already verified')) {
            console.log('Already Verified!');
        } else {
            console.log(e);
        }
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
