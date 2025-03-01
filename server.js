const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Define Schema
const DeviceDataSchema = new mongoose.Schema({
    ip: String,
    screenResolution: String,
    platform: String,
    browser: String,
    batteryLevel: String,
    chargingStatus: String,
    touchSupport: Boolean,
    orientation: String,
    language: String,
    timezone: String,
    darkMode: Boolean,
    deviceMemory: String,
    timestamp: { type: Date, default: Date.now }
});

const DeviceData = mongoose.model("DeviceData", DeviceDataSchema);

io.on('connection', (socket) => {
    console.log("🔗 Client Connected:", socket.id);

    socket.on("deviceData", async (data) => {
        try {
            console.log("📥 Received Data:", data);
            const newDeviceData = new DeviceData(data);
            await newDeviceData.save();
            console.log("✅ Data saved successfully");
        } catch (error) {
            console.error("❌ Error saving data:", error);
        }
    });

    socket.on("disconnect", () => console.log("❌ Client Disconnected:", socket.id));
});

server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
