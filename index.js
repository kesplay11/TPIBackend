require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const verifyToken = require('./src/middlewares/verifyToken');
const { initWebSocket } = require("./src/services/websocket/websocket");

const { PORT } = process.env;
const app = express();
const server = http.createServer(app);

// Configuración CORS para Express
const corsOptions = {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const apiRouter = require('./src/app');
const apiRouterPublic = require('./src/appPublic');
  
app.use('/api/public', apiRouterPublic);
app.use('/api', verifyToken, apiRouter);

// Inicializar WebSocket con el servidor
initWebSocket(server);

server.listen(PORT, function(error) {
    if (error) {
        console.error(error);
        process.exit(1);
    }
    console.log(`🚀 Backend escuchando en puerto ${PORT}`);
});