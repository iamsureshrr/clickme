const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create HTTP server
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// Ensure server starts only once
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error("❌ MongoDB URI is missing! Set MONGO_URI in environment variables.");
    process.exit(1);
}

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// Define Schema
const DeviceDataSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    screenResolution: { type: String, required: true },
    platform: { type: String, required: true },
    browser: { type: String, required: true },
    batteryLevel: { type: String, required: true },
    chargingStatus: { type: String, required: true },
    touchSupport: { type: Boolean, required: true },
    orientation: { type: String, required: true },
    language: { type: String, required: true },
    timezone: { type: String, required: true },
    darkMode: { type: Boolean, required: true },
    deviceMemory: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const DeviceData = mongoose.model("DeviceData", DeviceDataSchema);

// Handle WebSocket Connection
io.on('connection', (socket) => {
    console.log("🔗 Client Connected:", socket.id);

    socket.on("deviceData", async (data) => {
        try {
            console.log("📥 Received Data:", data);
            
            // Validate data before saving
            if (!data.ip || !data.platform || !data.browser) {
                console.error("❌ Missing required fields, data not saved.");
                return;
            }

            const newDeviceData = new DeviceData(data);
            await newDeviceData.save();

            console.log("✅ Data saved successfully");
        } catch (error) {
            console.error("❌ Error saving data:", error);
        }
    });

    socket.on("disconnect", () => console.log("❌ Client Disconnected:", socket.id));
});
