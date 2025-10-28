const router = require('express').Router();
const personasRouter = require('./api/personas/public')
const loginRouter = require('./middlewares/login/main');

// rutas sin token
router.use('/login', loginRouter);
router.use('/personas', personasRouter);

module.exports = router;
