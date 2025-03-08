const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../public/data_full/0.8splitCVE_clean/');
const DATA_LABEL = path.join(__dirname, '../public/data_full/CVE_label/CVE2label_with_description_final.json');
DATA_DESCRIPTION =  path.join(__dirname, '../public/data_full/CVE_label/CVE2description.json');
let contractsDB = {};
let labelDB = {};

// Load contracts into memory
function loadContracts() {
    const files = fs.readdirSync(DATA_DIR);
    
    contractsDB = files
        .filter(file => file.endsWith('.sol'))
        .reduce((acc, file) => {
            acc[file] = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
            return acc;
        }, {});

    console.log("✅ Contracts loaded into memory:", Object.keys(contractsDB)); // Debug
}

// Load contracts when the server starts
loadContracts();



// Load contracts into memory
function loadLabel() {
        // ✅ Read and parse Labels JSON
        const rawLabels = fs.readFileSync(DATA_LABEL, 'utf-8');
        const labels = JSON.parse(rawLabels);

        // ✅ Read and parse Descriptions JSON
        const rawDescriptions = fs.readFileSync(DATA_DESCRIPTION, 'utf-8');
        const descriptions = JSON.parse(rawDescriptions);
        const files = fs.readdirSync(DATA_DIR);
    
        labelDB = files.reduce((acc, file) => {
                // Extract metadata based on the CVE ID from filename
                const cveID = 'CVE-'+file.replace('.sol', ''); // Remove .sol extension
                const labelEntry = labels[cveID]; // Directly access JSON object by key
                const description = descriptions[cveID] || "No description available";
                acc[file] = { // ✅ Store by filename (key)
                  vulnerability_type: labelEntry ? labelEntry.vulnerability_type : "Unknown",
                  vulnerable_function_name: labelEntry ? labelEntry.vulnerable_function_name : "Unknown",
                  description
              };
    
              return acc;
            }, {});

}

// Load contracts when the server starts
loadLabel();


// Get contract content
function getContractContent(name) {
    console.log("🔍 Looking for contract:", name);
    return contractsDB[name] || null;
}

// Get contract content
function getLabel(name) {
  console.log("🔍 Looking for label:", name);
  return labelDB[name] || null;
}




// const fs = require('fs');
// const path = require('path');

const RESULT_DIR = '/Users/yifeiwang/Desktop/LLMBugScanner-2/GUI/public/result';
let resultDB = {};

// Function to recursively load files within a directory
function loadFilesRecursively(directory) {
    let result = {};

    const items = fs.readdirSync(directory, { withFileTypes: true });

    items.forEach(item => {
        const fullPath = path.join(directory, item.name);

        if (item.isDirectory()) {
            // Recursively load subdirectories
            result[item.name] = loadFilesRecursively(fullPath);
        } else {
            // Read file content
            result[item.name] = fs.readFileSync(fullPath, 'utf-8');
        }
    });

    return result;
}

// Load result folders
function loadResults() {
    const subfolders = fs.readdirSync(RESULT_DIR, { withFileTypes: true })
        .filter(item => item.isDirectory()) // Ensure it's a directory
        .slice(0, 5); // Only take the first five subfolders

    resultDB = subfolders.reduce((acc, folder) => {
        const folderPath = path.join(RESULT_DIR, folder.name);
        acc[folder.name] = loadFilesRecursively(folderPath);
        return acc;
    }, {});

    console.log("✅ Results loaded into memory:", Object.keys(resultDB)); // Debugging
}

// Load results at startup
loadResults();

// Function to get all available results (top-level folders)
function getAllResults() {
    return Object.keys(resultDB).map(name => ({ name }));
}

// Function to get specific result data
function getResult(folderName) {
    console.log("🔍 Looking for result in:", folderName);
    return resultDB[folderName] || null;
}

// Function to safely retrieve result data
function getResult_only(model_name, experiment_name, dataname, aorc) {
    console.log("🔍 Looking for result in:", experiment_name, model_name, dataname);

    // Ensure the experiment, model, and dataname exist in resultDB
    if (!resultDB?.[experiment_name]?.[model_name]?.[dataname]?.['final_output']) {
        console.warn("⚠️ Data not found in resultDB for given parameters.");
        return null;
    }

    // Select correct summary type based on `aorc`
    return aorc === "auditor"
        ? resultDB[experiment_name][model_name][dataname]['final_output']['auditor_summary'] || null
        : resultDB[experiment_name][model_name][dataname]['final_output']['critic_summary'] || null;
}







module.exports = { getAllContracts: () => Object.keys(contractsDB).map(name => ({ name })), getContractContent,getLabel,getAllResults, getResult,getResult_only };




