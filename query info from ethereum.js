var mysql = require('mysql'); // to connect to the database
var Web3 = require('web3'); // to connect to ethereum
var web3 = new Web3();
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); 
var latestSyncedBlock = 0;
var txcount = 0;
//var txsql=[];
function synced() {
  console.log("SYNCED");
  setInterval(function() {
    console.log("Waiting for blocks....");
  }, 20000)
  var filter = web3.eth.filter('latest');
  filter.watch(function(error, result) {
    console.log(result)
    console.log("RESULT")
    var block = web3.eth.getBlock(result);
    syncBlock(block['number']);
  });
}
var con = mysql.createConnection({
  host: "host",
  user: "user",
  password: "password",
  database: "database"
});
con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT * FROM block", function(err, result, fields) {
    if (err) throw err;
    console.log("LAST SYNCED BLOCK " + result[result.length - 1].id);
    latestSyncedBlock = parseInt(result[result.length - 1].id);
    if (latestSyncedBlock < web3.eth.blockNumber) {
      syncBlock(latestSyncedBlock);
    } else {
      synced();
    }
  });
  console.log("Connected to mysql!");
});

function syncBlock(block) { // takes a block number as argument and retrieves the block information from the ethereum node
  var blockToSync = block;
  block = web3.eth.getBlock(blockToSync, true);
  var sql = "INSERT INTO block (id,blockhash, miner, timestamp, size, transactions, number, uncle_hash, data, gasused) VALUES ('" + block['number'] + "','" + block.hash + "', '" + block.miner +
    "', '" + block.timestamp + "', '" + block.size + "', '" + block.transactions.length + "', '" + block['number'] + "', '" + block.sha3Uncles + "', '" + block.extraData + "', '" + block.gasUsed +
    "') ON DUPLICATE KEY UPDATE id=id";
  console.log("SYNCING BLOCK NUMBER " + blockToSync);
  var timestamp = block.timestamp;
  if (block.transactions.length != 0) {
    con.query(sql, function(err, result) {
      if (err) throw err;
      console.log("BLOCK " + block['number'] + " INSERTED!");
      for (var i = 0; i < block.transactions.length; i++) {
        var tx = block.transactions[i]
        var txsql = "INSERT INTO transaction (txid, value, gas, gasprice, nonce, txdata, block_id,sender,receiver,timestamp) VALUES ('" + tx.hash + "', '" + tx['value'] + "', '" + tx.gas + "', '" +
          tx.gasPrice + "', '" + tx.nonce + "', '" + tx['input'] + "', '" + blockToSync + "','" + tx["from"] + "','" + tx["to"] + "','" + timestamp + "')";
        addTx(txsql, tx.hash);
        var tosql = "INSERT INTO address (address,inputcount,outputcount) VALUES ('" + tx["to"] + "',0,0) ON DUPLICATE KEY UPDATE id=id";
        var fromsql = "INSERT INTO address (address,outputcount,inputcount) VALUES ('" + tx["from"] + "',0,0) ON DUPLICATE KEY UPDATE id=id";
        addAddress(tosql, fromsql, tx["to"], tx["from"]);
      }
      latestSyncedBlock++;
      if (latestSyncedBlock < web3.eth.blockNumber) {
        syncBlock(latestSyncedBlock);
      } else {
        synced();
      }
    });
    console.log("BLOCK HASH: " + block.hash);
    //console.log('current block #' + block.number);
  } else {
    console.log('EMPTY BLOCK #' + block.number);
    latestSyncedBlock++;
    if (latestSyncedBlock < web3.eth.blockNumber) {
      syncBlock(latestSyncedBlock);
    } else {
      synced();
    }
  }
}

function addTx(txsql, hash) { //insert transaction data into the MySql database
  con.query(txsql, function(err, result) {
    if (err) throw err;
    txcount++;
    console.log("TX " + hash + " INSERTED!");
  });
}

function addAddress(to, fr, toad, frad) { //insert the address of the ethereum node into the MySql database
  con.query(fr, function(err, result) {
    if (err) throw err;
    console.log("Address " + frad + " inserted.");
  });
  con.query(to, function(err, result) {
    if (err) throw err;
    console.log("Address " + toad + " inserted.");
  });
  con.query("UPDATE address SET inputcount = inputcount + 1 WHERE address = '" + toad + "'", function(err, result) {
    if (err) throw err;
    console.log(toad + " input count updated");
  });
  con.query("UPDATE address SET outputcount = outputcount + 1 WHERE address = '" + frad + "'", function(err, result) {
    if (err) throw err;
    console.log(frad + " output count updated");
  });
}