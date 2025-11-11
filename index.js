
require('dotenv').config();//nos levantar todas las vatriables de memeoria del .env
const path = require('path');
const express = require("express");
const http = require("http");
const cors = require("cors");

const verifyToken = require('./src/middlewares/verifyToken');
const { initWebSocket } = require("./src/services/websocket/websocket");

const { PORT } = process.env;
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const apiRouter = require('./src/app');
const apiRouterPublic = require('./src/appPublic');

app.use('/api/public', apiRouterPublic);
app.use('/api', verifyToken, apiRouter);

initWebSocket(server);

app.listen(PORT, function(error){
    if(error){
        console.error(error);
        process.exit(1);//el uno es que salio mal
    }
    console.log(`Escuchando en el puerto ${PORT}`);
})
