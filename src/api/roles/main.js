const router = require('express').Router();
const db = require('../../../conexion');

router.get('/', function(req, res, next){
    let sql = `SELECT * FROM roles`;

    db.query(sql)
    .then(([rows, fields]) => {
        return res.json(rows);
    })
    .catch((err) => {
        console.error("Ha ocurrido un error", err);
        res.status(500).send("Ocurrio un error");
    })
})

module.exports = router;