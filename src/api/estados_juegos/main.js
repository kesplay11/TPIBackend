const router = require('express').Router();
const db = require("../../../conexion");
const verifyRole = require('../../middlewares/verifyRole')

router.get("/", function(req, res, next){
    let sql = "SELECT * FROM estados"
    db.query(sql)
    .then(([rows]) => {
        return res.json(rows); // Devuelve la lista de juegos procesados
    })
    .catch((err) => { 
        console.error("Error al obtener listado de juegos:", err);
        res.status(500).send("Ocurrió un error en el servidor.");
    });
})

module.exports = router;