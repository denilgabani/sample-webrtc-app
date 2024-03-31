// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the client-side code
app.use(express.static(__dirname + "/public"));

// Handle WebSocket connections
io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle messages from clients
    socket.on("message", (message) => {
        console.log("Received message:", message);

        // Broadcast the message to all other clients
        socket.broadcast.emit("message", message);
    });

    // Handle disconnections
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

const PORT = process.env.PORT || 3000;

//starting the serve on PORT
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
