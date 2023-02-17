# Grizzly Keeper

This repository contains the contracts and tests for the integration with the Keep3r Network.

The Keep3r Network will automate the autocompounding via periodical harvests in the different strategies.

## What you'll find here

- `HarvestV2KeeperJob`

To work HarvestV2KeeperJob, the keeper must be a valid keeper on [Keep3r V2](https://etherscan.io/address/0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC)

- Have at least 50 KP3R bonded
- Should not be a contract

The cooldown per strategy is initially set in 5 days. Once the actual timestamp per strategy is over 5 days, then the trigger will controlled by:

```javascript
IBaseStrategy(_strategy).harvestTrigger(_getCallCosts(_strategy));
```

Which will be represented by a profit in USDT threshold. If the `claimable profit > threshold` it will be `true`

`Goerli Testing deployments`

- HarvestV2Keeper: 0xeecdE45B2286fFE7677E209DC3C149Cd160a242E

## Basic Use

Steps for Common Repo usage

```
cd grizzly-keeper-contracts
```

```
yarn
```

## Installation

To install Hardhat, go to an empty folder, initialize an `npm` project (i.e. `npm init`), and run

```
npm install --save-dev hardhat
```

Once it's installed, just run this command and follow its instructions:

```
npx hardhat
```

## Testing

To run the tests:

```
npx hardhat test
```

or for a specific test

```
npx hardhat test tests/<test>.ts
```

in the case of the harvestKeeper test

```
npx hardhat test tests/harvestKeeper.ts --network hardhat
```
