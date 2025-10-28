const express = require("express");
const path = require('path');
const verifyToken = require('./src/middlewares/verifyToken')


require('dotenv').config();//nos levantar todas las vatriables de memeoria del .env
const { PORT } = process.env;
const app = express();

app.use(express.json());

const apiRouter = require('./src/app');
const apiRouterPublic = require('./src/appPublic');
const { verificarPass } = require("@damianegreco/hashpass");

app.use('/api/public', apiRouterPublic);
app.use('/api', verifyToken, apiRouter);

app.listen(PORT, function(error){
    if(error){
        console.error(error);
        process.exit(1);//el uno es que salio mal
    }
    console.log(`Escuchando en el puerto ${PORT}`);
})
