'use strict';

const express = require('express');
const db = require('../db/db');

const router = express.Router();

// Serve Solidity contract content from memory
router.get('/:name', (req, res) => {  // ✅ Match `/contract/:name`
    console.log("📢 Received request for contract:", req.params.name);

    const contractContent = db.getContractContent(req.params.name);

    if (!contractContent) {
        console.error("❌ Contract not found in database:", req.params.name);
        return res.status(404).send('Contract not found');
    }

    console.log("✅ Contract found, serving content.");
    res.setHeader("Content-Type", "text/plain"); // Explicitly set content type
    res.send(contractContent);
});



router.get('/:name/label', (req, res) => {  // ✅ Match `/contract/:name`
  console.log("📢 Received request for contract:", req.params.name);

  const contractContent = db.getLabel(req.params.name);

  if (!contractContent) {
      console.error("❌ Contract not found in database:", req.params.name);
      return res.status(404).send('Contract not found');
  }

  console.log("✅ Contract found, serving content.");
  res.setHeader("Content-Type", "text/plain"); // Explicitly set content type
  res.send(contractContent);
});


// New dynamic API to fetch result content at different levels
router.get('/result/:folderName/:subfolderName/:dataName?/:outputStep?', (req, res) => {
    const { folderName, subfolderName, dataName, outputStep } = req.params;
    console.log(`📢 Received request for result in folder: ${folderName}, subfolder: ${subfolderName}`);

    const folderContent = db.getResult(folderName);
    if (!folderContent) {
        console.error(`❌ Folder not found in results database: ${folderName}`);
        return res.status(404).send('Folder not found');
    }

    let result = folderContent[subfolderName];
    if (!result) {
        console.error(`❌ Subfolder not found: ${subfolderName}`);
        return res.status(404).send('Subfolder not found');
    }
    
    if (dataName) {
        result = result[dataName];
        if (!result) {
            console.error(`❌ Data name not found: ${dataName}`);
            return res.status(404).send('Data name not found');
        }
    }
    
    if (outputStep) {
        result = result[outputStep];
        if (!result) {
            console.error(`❌ Output step not found: ${outputStep}`);
            return res.status(404).send('Output step not found');
        }
    }
    
    function fixNewlines(obj) {
        if (typeof obj === 'string') {
            let cleanedString = obj.replace(/\\n/g, '\n');
            const jsonMatch = cleanedString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error("❌ Failed to parse JSON from string:", e);
                    return cleanedString;
                }
            }
            return cleanedString;
        } else if (Array.isArray(obj)) {
            return obj.map(item => fixNewlines(item));
        } else if (typeof obj === 'object' && obj !== null) {
            return Object.keys(obj).reduce((acc, key) => {
                acc[key] = fixNewlines(obj[key]);
                return acc;
            }, {});
        }
        return obj;
    }
    
    console.log("✅ Result found, serving content.", result);
    const cleanedOutput = fixNewlines(result);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(cleanedOutput, null, 2));
});


module.exports = router;
