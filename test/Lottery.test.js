const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require(('../compile'));

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await  web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode})
        .send({from: accounts[0], gas: '1000000'});
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    })

    it('allows one accoutn to enter', async() => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1','ether')
        })

        const players = await lottery.methods.getPlayers().call();
        assert.equal(players.length, 1);
        assert.equal(players[0], accounts[0]);
    })

    it('allows multiple accounts to enter', async() => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('1','ether')
        })
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('1','ether')
        })
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('1','ether')
        })
        const players = await lottery.methods.getPlayers().call();
        assert.equal(players.length, 3);
        assert.equal(players[0], accounts[0]);
    })

    it('requites a minium amount of ether to entr',async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 1
            })
            assert(false);
        }
        catch (err) {
            assert(err);
        }
    })

    it('only manager can call pickWinner',async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            })
            assert(false);
        }
        catch (err) {
            assert(err);
        }
    })

    it('end to end', async() => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2','ether')
        })

        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        })

        const finalBalance = await web3.eth.getBalance(accounts[0]);
        assert(finalBalance-initialBalance>web3.utils.toWei('1.8','ether'));

    })


})

