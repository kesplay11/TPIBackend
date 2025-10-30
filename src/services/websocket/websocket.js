const { Server } = require("socket.io");

let io = null;

function initWebSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
    console.log(`Usuario conectafo: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        })
    })
    
    console.log("WebSocket inicializado")
}

function emitNotification(event, data) {
    if(!io) {
        console.error("WebSokcet no inicializado")
        return;
    }
    io.emit(event, data);
}

module.exports = { initWebSocket, emitNotification };