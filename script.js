let transactions = [];
const form = document.getElementById('transactionForm');
const typeRadios = document.querySelectorAll('input[name="type"]');
const categorySelect = document.getElementById('category');
const table = document.getElementById('transactionTable').getElementsByTagName('tbody')[0];
const analyzeButton = document.getElementById('analyzeButton');
const chartContainer = document.getElementById('chartContainer');

// Enable/disable category based on transaction type
typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        categorySelect.disabled = radio.value === 'income';
    });
});

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.querySelector('input[name="type"]:checked').value;
    const category = type === 'expense' ? categorySelect.value : 'N/A';

    transactions.push({ type, amount, category });
    updateTable();
    form.reset();
    categorySelect.disabled = true;
    document.getElementById('income').checked = true;
});

// Update the transaction table
function updateTable() {
    table.innerHTML = '';
    transactions.forEach((t, index) => {
        const row = table.insertRow();
        row.insertCell(0).textContent = t.type;
        row.insertCell(1).textContent = `$${t.amount.toFixed(2)}`;
        row.insertCell(2).textContent = t.category;
        
        const deleteCell = row.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteTransaction(index);
        deleteCell.appendChild(deleteButton);
    });
}

// Delete a transaction
function deleteTransaction(index) {
    transactions.splice(index, 1);
    updateTable();
    // Clear the chart when a transaction is deleted
    if (window.expenseChart instanceof Chart) {
        window.expenseChart.destroy();
    }
    chartContainer.innerHTML = '';
}

// Analyze expenses and show chart
analyzeButton.addEventListener('click', () => {
    const expenseData = {};
    let totalExpenses = 0;
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
        totalExpenses += t.amount;
    });

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    chartContainer.style.display = 'block';
    
    // Check if a chart instance already exists and destroy it
    if (window.expenseChart instanceof Chart) {
        window.expenseChart.destroy();
    }

    // Clear previous chart and create a new canvas
    chartContainer.innerHTML = '<canvas id="expenseChart"></canvas>';
    const ctx = document.getElementById('expenseChart').getContext('2d');

    window.expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                title: {
                    display: true,
                    text: `Expense Distribution - Total: $${totalExpenses.toFixed(2)}`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const value = context.raw;
                            const percentage = ((value / totalExpenses) * 100).toFixed(1);
                            label += `$${value.toFixed(2)} (${percentage}%)`;
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Set the size of the chart (responsive)
    const chartSize = Math.min(300, window.innerWidth - 40);
    ctx.canvas.parentNode.style.height = `${chartSize}px`;
    ctx.canvas.parentNode.style.width = `${chartSize}px`;

    // Display detailed breakdown
    const breakdownDiv = document.createElement('div');
    breakdownDiv.innerHTML = `
        <h3>Expense Breakdown:</h3>
        <ul>
            ${labels.map(label => `<li>${label}: $${expenseData[label].toFixed(2)}</li>`).join('')}
        </ul>
        <p><strong>Total Expenses: $${totalExpenses.toFixed(2)}</strong></p>
    `;
    chartContainer.appendChild(breakdownDiv);
});

// Initial setup
updateTable();

// Resize chart on window resize
window.addEventListener('resize', () => {
    if (window.expenseChart instanceof Chart) {
        const chartSize = Math.min(300, window.innerWidth - 40);
        window.expenseChart.canvas.parentNode.style.height = `${chartSize}px`;
        window.expenseChart.canvas.parentNode.style.width = `${chartSize}px`;
        window.expenseChart.resize();
    }
});