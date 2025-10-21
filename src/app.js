const router = require('express').Router();

const personasRouter = require('./api/personas/main');

router.use('/personas', personasRouter);

router.get('/', function (req,res,next){
    res.send('Archivo principal de la api');
})

module.exports = router;