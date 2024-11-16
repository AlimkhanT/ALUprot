let chart; // Declare a variable to store the chart instance

// Function to handle data file upload
function uploadData() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files.length) {
        alert("Please select a file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append("dataFile", fileInput.files[0]);

    fetch('/upload', { // or use 'http://localhost:3000/upload' if needed
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayStatistics(data.stats); // Display the stats in HTML
            createChart(data.data); // Create a chart with the data
        } else {
            alert("File upload failed: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error uploading file:", error);
        alert("File upload failed due to a network error.");
    });
}

// Function to display statistics on the index page
function displayStatistics(stats) {
    document.getElementById("balance").textContent = `$${stats.balance.toFixed(2)}`;
    document.getElementById("profit").textContent = `$${stats.profit.toFixed(2)}`;
    document.getElementById("expenditures").textContent = `$${stats.expenditures.toFixed(2)}`;
    document.getElementById("revenueGrowth").textContent = `${stats.revenueGrowth.toFixed(2)}%`;
    document.getElementById("expenditureGrowth").textContent = `${stats.expenditureGrowth.toFixed(2)}%`;
}

// Function to create a chart with Chart.js
function createChart(data) {
    // Extract Balance, Profit, and Expenditures data as arrays
    const labels = Array.from({ length: data.length }, (_, i) => `Entry ${i + 1}`);
    const balanceData = data.map(entry => entry.balance);
    const profitData = data.map(entry => entry.profit);
    const expendituresData = data.map(entry => entry.expenditures);

    // Check if a chart already exists and destroy it before creating a new one
    if (chart) {
        chart.destroy();
    }

    // Create the chart
    const ctx = document.getElementById("budgetChart").getContext("2d");
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Balance",
                    data: balanceData,
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    fill: true,
                },
                {
                    label: "Profit",
                    data: profitData,
                    borderColor: "rgba(54, 162, 235, 1)",
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    fill: true,
                },
                {
                    label: "Expenditures",
                    data: expendituresData,
                    borderColor: "rgba(255, 99, 132, 1)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: "Entries"
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: "Amount ($)"
                    }
                }
            }
        }
    });
}


document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'login.html'; // Redirect to login page
        } else {
            alert('Logout failed!');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Logout failed!');
    });
});
// Function to generate AI recommendations based on data
function generateAIRecommendations(data) {
    if (data.length === 0) {
        document.getElementById("aiRecommendations").innerText = "No data available for recommendations.";
        return;
    }

    // Example calculations
    let totalExpenditure = 0;
    let luxuryExpenditure = 0;
    const marketingBudget = 150; // Example fixed amount for marketing suggestion
    const emergencyFund = 500; // Fixed emergency fund suggestion

    data.forEach(entry => {
        totalExpenditure += entry.expenditures;

        // Example: assuming 'luxury' is identifiable (you might need to adjust this)
        if (entry.category === 'luxury') {
            luxuryExpenditure += entry.expenditures;
        }
    });

    const recommendedLuxuryReduction = luxuryExpenditure * 0.15;
    const luxurySavings = Math.min(recommendedLuxuryReduction, 300);

    const recommendations = `
        Based on your recent expenditures, we recommend:
        - Reduce spending on luxury items by 15% to save approximately $${luxurySavings.toFixed(2)}.
        - Allocate an additional $${marketingBudget} for marketing to boost sales.
        - Consider setting up an emergency fund with $${emergencyFund}.
    `;

    document.getElementById("aiRecommendations").innerText = recommendations;
}

// Function to forecast expenditures
function forecastExpenditures(data) {
    if (data.length === 0) {
        document.getElementById("expenditureForecast").innerText = "No data available for forecast.";
        return;
    }

    let totalExpenditure = data.reduce((sum, entry) => sum + entry.expenditures, 0);
    let averageExpenditure = totalExpenditure / data.length;

    const forecast = [];
    for (let i = 1; i <= 3; i++) {
        forecast.push(`Month ${i}: $${(averageExpenditure * i).toFixed(2)}`);
    }

    document.getElementById("expenditureForecast").innerText = forecast.join("\n");
}

// Main function to handle data after upload
function handleDataUpload(data) {
    displayStatistics(data.stats);
    createChart(data.data);
    generateAIRecommendations(data.data);
    forecastExpenditures(data.data);
}

// Adjust the uploadData function to use handleDataUpload
function uploadData() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files.length) {
        alert("Please select a file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append("dataFile", fileInput.files[0]);

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            handleDataUpload(data);
        } else {
            alert("File upload failed: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error uploading file:", error);
        alert("File upload failed due to a network error.");
    });
}
