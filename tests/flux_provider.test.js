`use strict`
const FluxProvider = require('../src/FluxProvider');
const nearlib = require('nearlib');
const testUtils = require('./test_utils');
const BN = require("bn.js");
import 'whatwg-fetch';

const keyStore = new nearlib.keyStores.BrowserLocalStorageKeyStore();
let nearjs;
let contractId;
let testAccount; 
let workingAccount;

let flux;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;

beforeAll(async () => {
	nearjs = await testUtils.setUpTestConnection();
	contractId = testUtils.generateUniqueString('test');
	testAccount = await testUtils.createAccount(await nearjs.account(testUtils.testAccountName), { amount: testUtils.INITIAL_BALANCE.mul(new BN(100)), name:testUtils.generateUniqueString('test'), trials: 5 });
	workingAccount = await testUtils.createAccount(testAccount, {amount: new BN(100000000), trials: 5, name: testUtils.generateUniqueString('test') });
	await testUtils.deployContract(workingAccount, contractId);
});

test("Is able to connect to the NEAR blockchain & initiate Flux smart contract instance", async () => {
	flux = new FluxProvider(workingAccount);
	await keyStore.setKey(testUtils.networkId, contractId, nearlib.utils.KeyPair.fromString('ed25519:2wyRcSwSuHtRVmkMCGjPwnzZmQLeXLzLLyED1NDMt4BjnKgQL6tF85yBx6Jr26D2dUNeC716RBoTxntVHsegogYw'));
	const config = Object.assign(require('./config')(process.env.NODE_ENV || 'test'), {
		networkId: testUtils.networkId,
		deps: { keyStore },
	});
	await flux.connect(config, contractId)
});

test("Is able to retrieve the accountId ", () => {
	const accountId = flux.getAccountId();
	expect(accountId).toBe("");
});

test("Is able to claim fdai", async () => {
	await flux.claimFDai()
});

test("Is able to retrieve fdai balance of caller", async () => {
	const balance = await flux.getFDaiBalance();
	expect(balance).toBeGreaterThan(0);
});

test("Is able to create a market", async () => {
	await flux.createBinaryMarket("This is a test binary market", new Date().getTime() + 10000);
	await flux.createCategoricalMarket("This is a test categorical market", ["yes", "no", "maybe"], new Date().getTime() + 10000);
});

test("Is able to fetch all markets", async () => {
	const allMarkets = await flux.getAllMarkets();
	expect(Object.keys(allMarkets).length).toBe(2);
});

test("Is able to place a limit order", async () => {
	await flux.placeOrder(0, 0, 5000, 10);
	await flux.placeOrder(1, 0, 5000, 10);
});

test("Is able to fetch open limit orders", async () => {
	const openBinaryOrders = await flux.getOpenOrders(0, 0);
	const openCategoricalOrders = await flux.getOpenOrders(1, 0);
	expect(Object.keys(openBinaryOrders)).not.toBe(0);
	expect(Object.keys(openCategoricalOrders)).not.toBe(0);
});

// TODO: ASK WHAT THIS METHOD DOES
test("Is able to fetch open market orders", async () => {
	await flux.getMarketOrder(0, 0);
	await flux.getMarketOrder(1, 0);
});

test("Is able to cancel an order", async () => {
	await flux.cancelOrder(0, 0, 0);
	await flux.cancelOrder(1, 0, 0);
});

test("Is able to delete a market", async () => {
	await flux.createBinaryMarket("This market will be deleted", new Date().getTime() + 10000);
	await flux.createCategoricalMarket("This market will be deleted",["yes", "no", "maybe"], new Date().getTime() + 10000);
	await flux.deleteMarket(2);
	await flux.deleteMarket(3);

	// TODO: Clean up "expects" to handle undefined behaviour
	//expect(flux.placeOrder(2, 0, 100, 50)).rejects.toEqual(new Error("send_tx_commit has timed out"));
	//expect(flux.placeOrder(3, 0, 100, 50)).rejects.toEqual(new Error("send_tx_commit has timed out"));
});

test("Is able to fill a limit order", async () => {
	await flux.placeOrder(0, 0, 100, 50);
	await flux.placeOrder(1, 1, 100, 50);
});

test("Is able to fill a market order", async () => {
	await flux.placeOrder(0, 0, 200, 50);
	await flux.placeOrder(1, 0, 200, 50);
	const binaryPrice = await flux.getMarketPrice(0, 1);
	const categoricalPrice = await flux.getMarketPrice(1, 1);
	await flux.placeOrder(0, 1, 200, binaryPrice);
	await flux.placeOrder(1, 1, 200, categoricalPrice);
});

test("Is able to fetch filled orders", async () => {
	const filledBinaryOrders = await flux.getFilledOrders(0, 0);
	const filledCategoricalOrders = await flux.getFilledOrders(1, 0);
	expect(Object.keys(filledBinaryOrders)).not.toBe(0);
	expect(Object.keys(filledCategoricalOrders)).not.toBe(0);
});

test("Is able to fetch claimable fdai", async () => {
	await flux.resolute(0, 1);
	await flux.resolute(1, 1);
	const binaryClaimable = await flux.getClaimable(0);
	const categoricalClaimable = await flux.getClaimable(0);
	expect(Object.keys(binaryClaimable)).not.toBe(0);
	expect(Object.keys(categoricalClaimable)).not.toBe(0);
});