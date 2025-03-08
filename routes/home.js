'use strict';

const db = require('../db/db');

module.exports = function (req, res) {
  // Fetch Solidity contracts from the database
  const contracts = db.getAllContracts();

  res.render('index.ejs', {
    title: 'LLM BugScanner Experiment Visualizer',
    contracts: contracts
  });
}
