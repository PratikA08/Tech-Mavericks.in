// ----------------------------------
// NAVIGATION
// ----------------------------------

const navButtons = document.querySelectorAll(".nav-btn");

const pages = document.querySelectorAll(".page");

navButtons.forEach(button => {

    button.addEventListener("click", () => {

        navButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        pages.forEach(page => {
            page.classList.remove("active");
        });

        button.classList.add("active");

        const pageId = button.dataset.page;

        document.getElementById(pageId).classList.add("active");

    });

});


// ----------------------------------
// HTML ELEMENTS
// ----------------------------------

const temperatureElement =
    document.getElementById("temperature");

const vibrationElement =
    document.getElementById("vibration");

const motorCondition =
    document.getElementById("motorCondition");

const alertMessage =
    document.getElementById("alertMessage");

const connectionText =
    document.getElementById("connectionText");

const connectionDot =
    document.getElementById("connectionDot");

const tempStatus =
    document.getElementById("tempStatus");

const vibrationStatus =
    document.getElementById("vibrationStatus");

const lastUpdate =
    document.getElementById("lastUpdate");


// ----------------------------------
// CHART CONFIGURATION
// ----------------------------------

const labels = [];

const temperatureData = [];

const vibrationData = [];


const temperatureChart = new Chart(

    document.getElementById("temperatureChart"),

    {
        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Temperature (°C)",

                data: temperatureData,

                borderColor: "#e67e22",

                backgroundColor: "rgba(230,126,34,0.12)",

                fill: true,

                tension: 0.3

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: false,

            scales: {

                y: {

                    beginAtZero: false,

                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }

                }

            }

        }

    }

);


const vibrationChart = new Chart(

    document.getElementById("vibrationChart"),

    {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Vibration (g RMS)",

                data: vibrationData,

                borderColor: "#2563eb",

                backgroundColor: "rgba(37,99,235,0.12)",

                fill: true,

                tension: 0.3

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: false,

            scales: {

                y: {

                    beginAtZero: true,

                    title: {
                        display: true,
                        text: "Vibration (g RMS)"
                    }

                }

            }

        }

    }

);


// ----------------------------------
// CONNECTION STATUS
// ----------------------------------

function setConnectionStatus(online) {

    if (online) {

        connectionText.textContent = "ESP32 Connected";

        connectionDot.className = "dot online";

    } else {

        connectionText.textContent = "ESP32 Offline";

        connectionDot.className = "dot offline";

    }

}


// ----------------------------------
// MOTOR STATUS
// ----------------------------------

function updateStatus(data) {

    const temperature = Number(data.temperature);

    const vibration = Number(data.vibration);

    const tempLimit = Number(data.limits.temperature);

    const vibrationLimit = Number(data.limits.vibration);


    temperatureElement.textContent =
        temperature.toFixed(2);

    vibrationElement.textContent =
        vibration.toFixed(3);


    // Temperature Status

    if (temperature >= tempLimit) {

        tempStatus.textContent = "HIGH TEMPERATURE";

        tempStatus.className = "status-badge alert";

    } else {

        tempStatus.textContent = "NORMAL";

        tempStatus.className = "status-badge normal";

    }


    // Vibration Status

    if (vibration >= vibrationLimit) {

        vibrationStatus.textContent = "HIGH VIBRATION";

        vibrationStatus.className = "status-badge alert";

    } else {

        vibrationStatus.textContent = "NORMAL";

        vibrationStatus.className = "status-badge normal";

    }


    // Overall Condition

    if (data.status === "ALERT") {

        motorCondition.textContent = "ALERT";

        motorCondition.className = "condition alert";

    } else {

        motorCondition.textContent = "NORMAL";

        motorCondition.className = "condition normal";

    }


    alertMessage.textContent = data.alertMessage;


    if (data.receivedAt) {

        const date = new Date(data.receivedAt);

        lastUpdate.textContent =
            "Last Update: " + date.toLocaleString();

    }

}


// ----------------------------------
// UPDATE CHARTS
// ----------------------------------

function updateCharts(history) {

    if (!Array.isArray(history)) return;

    const recent = history.slice(-30);

    labels.length = 0;

    temperatureData.length = 0;

    vibrationData.length = 0;


    recent.forEach(item => {

        const time = new Date(item.time);

        labels.push(

            time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            })

        );

        temperatureData.push(item.temperature);

        vibrationData.push(item.vibration);

    });


    temperatureChart.update();

    vibrationChart.update();

}


// ----------------------------------
// FETCH LIVE STATUS
// ----------------------------------

async function fetchStatus() {

    try {

        const response = await fetch("/api/status", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Server Error");
        }

        const data = await response.json();

        setConnectionStatus(data.online);

        if (data.online && data.temperature !== null) {

            updateStatus(data);

        } else {

            motorCondition.textContent = "WAITING";

            motorCondition.className = "condition waiting";

            alertMessage.textContent =
                "Waiting for ESP32 sensor data";

        }

    } catch (error) {

        setConnectionStatus(false);

        motorCondition.textContent = "SERVER OFFLINE";

        motorCondition.className = "condition waiting";

        alertMessage.textContent =
            "Unable to connect to monitoring server";

    }

}


// ----------------------------------
// FETCH HISTORY
// ----------------------------------

async function fetchHistory() {

    try {

        const response = await fetch("/api/history", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("History Error");
        }

        const history = await response.json();

        updateCharts(history);

    } catch (error) {

        console.log("History loading failed:", error);

    }

}


