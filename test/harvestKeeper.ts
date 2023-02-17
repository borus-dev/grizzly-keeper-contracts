import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { e18, SIX_HOURS, ZERO_ADDRESS } from './utils/web3-utils';
import config from '../addresses.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { Contract, ContractFactory } from 'ethers';

const mainnetAccounts = config.accounts.mainnet;
const mainnetContracts = config.contracts.mainnet;

import keep3rABI from '../abi/keep3r.json';
import lpTokenABI from '../abi/lpToken.json';
import stratABI from '../abi/strategy.json';

describe('HarvestV2KeeperJob', () => {
    let owner: SignerWithAddress;

    before('Setup accounts and contracts', async () => {
        [owner] = await ethers.getSigners();
    });

    it('Should work a strategy on mainnet fork', async function () {
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [mainnetAccounts.multiSig],
        });
        const multiSig = ethers.provider.getUncheckedSigner(mainnetAccounts.multiSig);

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [mainnetAccounts.yfiMultiSig],
        });
        const yfiMultiSig = ethers.provider.getUncheckedSigner(mainnetAccounts.yfiMultiSig);

        // Keeper from Keep3r network
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [mainnetAccounts.keeper],
        });
        const keeper = ethers.provider.getUncheckedSigner(mainnetAccounts.keeper);
        console.log('keeper: ', keeper._address);

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [mainnetAccounts.keep3rGovernance],
        });
        const keep3rGovernance = ethers.provider.getUncheckedSigner(mainnetAccounts.keep3rGovernance);

        // Fund the accounts
        (await ethers.getContractFactory('ForceETH')).deploy(keep3rGovernance._address, {
            value: e18.mul(100),
        });
        (await ethers.getContractFactory('ForceETH')).deploy(keeper._address, {
            value: e18.mul(100),
        });
        (await ethers.getContractFactory('ForceETH')).deploy(multiSig._address, {
            value: e18.mul(100),
        });

        const HarvestV2Keep3rJob = await ethers.getContractFactory('HarvestV2KeeperJob');
        const harvestV2Keep3rJob = await HarvestV2Keep3rJob.deploy(owner.address);
        console.log('harvestV2Keep3rJob: ', harvestV2Keep3rJob.address);

        // Set Keep3rJob as keeper in the strategy
        const fraxStrat = ContractFactory.getContract(mainnetContracts.strategy, stratABI, multiSig);
        await fraxStrat.connect(multiSig).setKeeper(harvestV2Keep3rJob.address);
        console.log('strategyKeeper: ', await fraxStrat.keeper());

        // Approve the lpToken
        const lpToken = await ethers.getContractAt(lpTokenABI, mainnetContracts.lpToken, yfiMultiSig);
        await lpToken.connect(yfiMultiSig).approve(mainnetContracts.keep3r, e18.mul(200));
        console.log('lpToken: ', mainnetContracts.lpToken);

        // Add liquidity to job
        const keep3r = await ethers.getContractAt(keep3rABI, mainnetContracts.keep3r, keep3rGovernance);
        await keep3r.connect(yfiMultiSig).addJob(harvestV2Keep3rJob.address);
        await keep3r
            .connect(yfiMultiSig)
            .addLiquidityToJob(harvestV2Keep3rJob.address, mainnetContracts.lpToken, e18.mul(200));
        console.log('keep3r: ', keep3r.address);

        const strategies = [
            {
                address: '0x6E643824285A6E7786d04021495C4B8dd9E31209',
                requiredAmount: 0,
            },
            {
                address: '0xd0076bfef326a1845d8edCbA67DEC7D2D370574D',
                requiredAmount: 0,
            },
            {
                address: '0xC86ca7DaDB191d4424Be9D42Eb46198b2720a13a',
                requiredAmount: 0,
            },
            {
                address: '0x6823D0B6505D657AA1563016D4DFD64E4cfcfce3',
                requiredAmount: 0,
            },
        ];

        const _strategies = [
            strategies[0].address,
            strategies[1].address,
            strategies[2].address,
            strategies[3].address,
        ];
        const _requiredAmounts = [
            strategies[0].requiredAmount,
            strategies[1].requiredAmount,
            strategies[2].requiredAmount,
            strategies[3].requiredAmount,
        ];

        // Add strategies to job
        await harvestV2Keep3rJob.addStrategies(_strategies, _requiredAmounts);

        const mainStrategy = strategies[0].address; // FRAX
        console.log('fraxStrategy: ', mainStrategy);

        const jobStrategies = await harvestV2Keep3rJob.strategies();
        expect(jobStrategies[0]).to.be.deep.eq(mainStrategy);

        expect(await harvestV2Keep3rJob.workable(mainStrategy)).to.be.false;

        await fraxStrat.connect(multiSig).setForceHarvestTriggerOnce(true);
        console.log('harvestTrigger: ', await fraxStrat.harvestTrigger(0));

        const workable = await harvestV2Keep3rJob.workable(mainStrategy);
        expect(workable).to.be.true;

        // Mint some blocks in order to generate credits
        await network.provider.send('evm_increaseTime', [SIX_HOURS]);
        await network.provider.send('evm_mine');

        const jobLiquidityCredits = await keep3r.jobLiquidityCredits(harvestV2Keep3rJob.address);
        console.log('jobLiquidityCredits: ', +jobLiquidityCredits);

        const jobCredits = await keep3r.totalJobCredits(harvestV2Keep3rJob.address);
        console.log('jobCredits: ', +jobCredits);

        const workTx = await harvestV2Keep3rJob.connect(keeper).work(mainStrategy);
        const workTxData = await workTx.wait();
        console.log('gasUsed:', workTxData.cumulativeGasUsed.toNumber()); // 1994631

        expect(await harvestV2Keep3rJob.workable(mainStrategy)).to.be.false;
        expect(jobCredits).to.be.greaterThan(await keep3r.totalJobCredits(harvestV2Keep3rJob.address));
    });
});
