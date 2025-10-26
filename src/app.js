const router = require('express').Router();

const personasRouter = require('./api/personas/main');
const equiposRouter = require('./api/equipos/main');
const categoriasRouter = require('./api/categorias/main');
const juegosRouter = require('./api/juegos/main');
const turnosRouter = require('./api/turnos/main');
const puntosRouter = require('./api/puntos/main');

router.use('/personas', personasRouter);
router.use('/equipos', equiposRouter);
router.use('/categorias', categoriasRouter);
router.use('/juegos', juegosRouter);
router.use('/turnos', turnosRouter);
router.use('/puntos', puntosRouter);

router.get('/', function (req,res,next){
    res.send('Archivo principal de la api');
})

module.exports = router;