let dataname = "";

function showSelectedContract() {
    const contractList = document.getElementById("contractList");
    const selectedContract = contractList.value;
    dataname = selectedContract.replace(/\.sol$/, ""); // Remove .sol extension

    if (!selectedContract) {
        alert("Please select a contract.");
        return;
    }

    // Reset the table to reflect new data
    resetTable();

    const contentBox = document.getElementById('contractContent');
    contentBox.innerHTML = `<code>Loading...</code>`;
    contentBox.style.display = "block";
    
    fetch(`/${selectedContract}`)
        .then(response => {
            console.log("Response status:", response.status);
            if (!response.ok) throw new Error('Contract not found');
            return response.text();
        })
        .then(content => {
            contentBox.innerHTML = `<h3><strong>Solidity Code:</strong></h3><code>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
        })
        .catch(error => {
            console.error("Fetch error:", error);
            contentBox.innerHTML = `<code>Error: ${error.message}</code>`;
        });

    const vulnerabilityBox = document.getElementById('vulnerabilityInfo');
    vulnerabilityBox.innerHTML = `<p>Loading vulnerability details...</p>`;
    vulnerabilityBox.style.display = "block";

    fetch(`/${selectedContract}/label`)
        .then(response => {
            if (!response.ok) throw new Error('Vulnerability details not found');
            return response.json();
        })
        .then(labelData => {
            vulnerabilityBox.innerHTML = `
                <h3><strong>Ground Truth Vulnerability:</strong></h3>
                <p><strong>Vulnerability Type:</strong> ${labelData.vulnerability_type}</p>
                <p><strong>Vulnerable Function:</strong> ${labelData.vulnerable_function_name}</p>
                <p><strong>Description:</strong> ${labelData.description}</p>
            `;
        })
        .catch(error => {
            console.error("Fetch error:", error);
            vulnerabilityBox.innerHTML = `<p>Error loading vulnerability details: ${error.message}</p>`;
        });
}

function resetTable() {
    console.log("🔄 Resetting table for new contract:", dataname);

    // Reset headers and table body
    let tableHeader = document.getElementById("tableHeader");
    let tableBody = document.getElementById("tableBody");

    tableHeader.innerHTML = "<th>Model/Experiment</th>"; // Reset headers
    tableBody.innerHTML = ""; // Clear table body

    // Fetch currently selected checkboxes
    let selectedModels = Array.from(document.querySelectorAll('input[name="model"]:checked')).map(el => el.value);
    let selectedExperiments = Array.from(document.querySelectorAll('input[name="experiment"]:checked')).map(el => el.value);

    // Reset stored headers to prevent duplication
    let existingHeaders = new Set();
    
    // **Update Columns First** to prevent duplication
    selectedExperiments.forEach(exp => {
        if (!existingHeaders.has(exp)) {
            let th = document.createElement("th");
            th.innerText = exp;
            tableHeader.appendChild(th);
            existingHeaders.add(exp); // Track added headers
            console.log(`✅ Added column header: ${exp}`);
        }
    });

    // **Update Rows & Fetch Data**
    selectedModels.forEach(model => {
        updateRow(model);
    });
}


let outputStep = "critic_summary";

// Function to update a full row when a model is selected
function updateRow(model) {
    console.log(`🔄 Updating row for model: ${model}`);

    let tableBody = document.getElementById("tableBody");
    let selectedExperiments = Array.from(document.querySelectorAll('input[name="experiment"]:checked')).map(el => el.value);

    if (selectedExperiments.length === 0) {
        console.log(`⚠ No experiments selected, skipping update for model: ${model}`);
        return;
    }

    let tr = document.createElement("tr");
    let modelTh = document.createElement("th");
    modelTh.innerText = model;
    tr.appendChild(modelTh);
    tableBody.appendChild(tr);

    selectedExperiments.forEach(exp => {
        updateCell(tr, model, exp);
    });
}

// Function to update a full column when an experiment is selected
function updateColumn(exp) {
    console.log(`🔄 Updating column for experiment: ${exp}`);

    let tableHeader = document.getElementById("tableHeader");
    let tableBody = document.getElementById("tableBody");
    let selectedModels = Array.from(document.querySelectorAll('input[name="model"]:checked')).map(el => el.value);

    let th = document.createElement("th");
    th.innerText = exp;
    tableHeader.appendChild(th);
    console.log(`✅ Added new column header for experiment: ${exp}`);

    selectedModels.forEach(model => {
        let tr = Array.from(tableBody.children).find(row => row.firstChild.innerText === model);
        if (!tr) {
            updateRow(model);
        } else {
            updateCell(tr, model, exp);
        }
    });
}

// Function to update a specific table cell with API data
function updateCell(tr, model, exp) {
    let td = document.createElement("td");
    td.dataset.exp = exp;
    td.style.width = "300px";

    let scrollDiv = document.createElement("div");
    scrollDiv.classList.add("scrollable-content");
    scrollDiv.innerText = "Loading...";
    
    td.appendChild(scrollDiv);
    tr.appendChild(td);
    
    console.log(`Fetching: /result/${exp}/${model}/${dataname}/${outputStep}`);
    
    fetch(`/result/${exp}/${model}/${dataname}/${outputStep}`)
        .then(response => response.json())
        .then(data => {
            scrollDiv.innerText = JSON.stringify(data, null, 2);
            console.log(`🎯 Data updated for Model: ${model}, Experiment: ${exp}`);
        })
        .catch(error => {
            scrollDiv.innerText = "Error";
            console.error(`❌ Error fetching data for Model: ${model}, Experiment: ${exp}:`, error);
        });
}

// Remove row when a model is unchecked
function removeRow(model) {
    let tableBody = document.getElementById("tableBody");
    let row = Array.from(tableBody.children).find(tr => tr.firstChild.innerText === model);
    
    if (row) {
        tableBody.removeChild(row);
        console.log(`❌ Removed row for model: ${model}`);
    }
}

// Remove column when an experiment is unchecked
function removeColumn(exp) {
    let tableHeader = document.getElementById("tableHeader");
    let tableBody = document.getElementById("tableBody");

    let headerCells = Array.from(tableHeader.children);
    let headerToRemove = headerCells.find(th => th.innerText === exp);
    if (headerToRemove) {
        tableHeader.removeChild(headerToRemove);
        console.log(`❌ Removed column header for experiment: ${exp}`);
    }

    Array.from(tableBody.children).forEach(tr => {
        let cells = Array.from(tr.children);
        let cellToRemove = cells.find(td => td.dataset?.exp === exp);
        if (cellToRemove) {
            tr.removeChild(cellToRemove);
        }
    });
}

// Add event listeners for models
document.querySelectorAll('input[name="model"]').forEach(input => {
    input.addEventListener('change', function() {
        if (this.checked) {
            updateRow(this.value);
        } else {
            removeRow(this.value);
        }
    });
});

// Add event listeners for experiments
document.querySelectorAll('input[name="experiment"]').forEach(input => {
    input.addEventListener('change', function() {
        if (this.checked) {
            updateColumn(this.value);
        } else {
            removeColumn(this.value);
        }
    });
});
