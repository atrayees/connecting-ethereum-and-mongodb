const Web3 = require('web3');
const MongoClient = require('mongodb').MongoClient;

const myContractAddress = '0x1234567890123456789012345678901234567890'; // address of the deployed Solidity contract

const web3 = new Web3('http://localhost:8545'); // URL of the local Ethereum node

MongoClient.connect('mongodb+srv://atrayee:A1t2r3a4@data.mongodb.net/sample_weatherdata', function(err, client) {
    if (err) throw err;
    const db = client.db('sample_weatherdata');
    const myCollection = db.collection('data');

    const changeStream = myCollection.watch();
    changeStream.on('change', function(change) {
        const newValue = change.fullDocument.myValue;
        myContract.methods.setMyValue(newValue).send();
    });
});
