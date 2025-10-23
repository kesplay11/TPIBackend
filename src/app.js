const router = require('express').Router();

const personasRouter = require('./api/personas/main');
const equiposRouter = require('./api/equipos/main');
const categoriasRouter = require('./api/categorias/main');

router.use('/personas', personasRouter);
router.use('/equipos', equiposRouter);
router.use('/categorias', categoriasRouter);

router.get('/', function (req,res,next){
    res.send('Archivo principal de la api');
})

module.exports = router;