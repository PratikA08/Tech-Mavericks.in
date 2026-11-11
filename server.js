const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// FINAL SENSOR LIMITS
const TEMP_LIMIT = 60.0;
const VIBRATION_LIMIT = 0.150;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let latest = {
    temperature: null,
    vibration: null,
    status: "WAITING",
    alertMessage: "Waiting for ESP32 data",
    receivedAt: null,
    device: "ESP32"
};

let history = [];

function evaluate(temp, vib) {

    let reasons = [];

    if (temp >= TEMP_LIMIT) {
        reasons.push("HIGH TEMPERATURE");
    }

    if (vib >= VIBRATION_LIMIT) {
        reasons.push("HIGH VIBRATION");
    }

    if (reasons.length > 0) {

        return {
            status: "ALERT",
            alertMessage: reasons.join(" + ")
        };
    }

    return {
        status: "NORMAL",
        alertMessage: "Motor Parameters are Normal"
    };
}

// RECEIVE ESP32 DATA
app.post("/api/data", (req, res) => {

    const temp = Number(req.body.temperature);
    const vib = Number(req.body.vibration);

    if (
        !Number.isFinite(temp) ||
        !Number.isFinite(vib) ||
        temp < -55 ||
        temp > 125 ||
        vib < 0 ||
        vib > 4
    ) {

        return res.status(400).json({
            ok: false,
            message: "Invalid Sensor Data"
        });
    }

    const result = evaluate(temp, vib);

    const now = new Date().toISOString();

    latest = {
        temperature: Number(temp.toFixed(2)),
        vibration: Number(vib.toFixed(3)),
        status: result.status,
        alertMessage: result.alertMessage,
        receivedAt: now,
        device: "ESP32"
    };

    history.push({
        time: now,
        temperature: latest.temperature,
        vibration: latest.vibration,
        status: latest.status
    });

    if (history.length > 300) {
        history.shift();
    }

    res.json({
        ok: true,
        status: latest.status,
        alertMessage: latest.alertMessage
    });

});

// DASHBOARD STATUS
app.get("/api/status", (req, res) => {

    const age = latest.receivedAt
        ? Date.now() - new Date(latest.receivedAt).getTime()
        : Infinity;

    res.json({
        ...latest,

        online: age < 15000,

        limits: {
            temperature: TEMP_LIMIT,
            vibration: VIBRATION_LIMIT
        }
    });

});

// HISTORY
app.get("/api/history", (req, res) => {

    res.json(history);

});

// HEALTH CHECK
app.get("/health", (req, res) => {

    res.json({
        server: "Online",
        project: "IoT-Based Smart Motor Health Monitoring System"
    });

});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {

    console.log("Motor Monitoring Server Started");

    console.log("Port:", PORT);

});