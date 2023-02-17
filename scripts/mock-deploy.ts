import { ethers, run, network } from 'hardhat';

async function main() {
    const MockStrategy = await ethers.getContractFactory('MockStrategy');
    let deployArgs;

    const mockStrategy = await MockStrategy.deploy();
    console.log('Deploying MockStrategy...');
    await mockStrategy.deployed();
    console.log('MockStrategy deployed to:', mockStrategy.address);

    if (network.config.chainId === 5 && process.env.ETHERSCAN_API) {
        console.log('Waiting for block confirmations...');
        await mockStrategy.deployTransaction.wait(5);
        await verify(mockStrategy.address, deployArgs);
    }
}

const verify = async (contractAddress: string, args: any) => {
    console.log('Verifying contract...');
    try {
        await run('verify:verify', {
            address: contractAddress,
            // constructorArguments: args,
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
