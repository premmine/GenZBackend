const socketIo = require('socket.io');

const initSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST"]
        }
    });

    global.io = io; // Make io globally accessible for controllers

    io.on('connection', (socket) => {
        console.log('🔌 New Admin Socket Connection:', socket.id);

        // In a more complex app, we'd join specific rooms
        // but since we only have one admin for now, we just emit globally 
        // or to specific authenticated sockets.

        socket.on('disconnect', () => {
            console.log('🔌 Socket Disconnected');
        });
    });

    return io;
};

module.exports = initSocket;
