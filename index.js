const express = require("express");
const path = require('path');


require('dotenv').config();//nos levantar todas las vatriables de memeoria del .env
const {PORT} = process.env;
const app = express();

app.use(express.json());

const apiRouter = require('./src/app');

app.use('/api', apiRouter);
app.listen(PORT, function(error){
    if(error){
        console.error(error);
        process.exit(1);//el uno es que salio mal
    }
    console.log(`Escuchando en el puerto ${PORT}`);
})
