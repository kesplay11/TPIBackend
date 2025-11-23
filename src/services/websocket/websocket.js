// websocket.js - VERSIÓN SIMPLIFICADA
const { Server } = require("socket.io");

let io = null;

function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`);
    
    socket.on("disconnect", (reason) => {
      console.log(`❌ Cliente desconectado: ${socket.id} - Razón: ${reason}`);
    });

    // 🟢 MANEJAR ERRORES INTERNOS
    socket.on("error", (error) => {
      console.error(`💥 Error en socket ${socket.id}:`, error);
    });
  });

  // 🟢 MANEJAR ERRORES DEL SERVER
  io.engine.on("connection_error", (err) => {
    console.log('❌ Error de conexión WebSocket:', err);
  });

  console.log("✅ WebSocket inicializado");
}

function emitNotification(event, data) {
  if (!io) {
    console.error("❌ WebSocket no inicializado");
    return;
  }
  
  console.log(`📢 Emitiendo: ${event}`, data);
  
  // 🟢 ENVIAR A TODOS TEMPORALMENTE (para testing)
  io.emit(event, data);
  console.log(`📨 Notificación ${event} enviada a todos los clientes`);
}

module.exports = { initWebSocket, emitNotification };