const router = require('express').Router();
const db = require('../../../conexion');
const verifyRole = require('../../middlewares/verifyRole')

router.post("/", verifyRole([1]), function(req, res, next){
    const { nombre } = req.body;
    let sql = "INSERT INTO equipos (nombre)";
    sql += " VALUES (?)"

    db.query(sql, [nombre])
    .then(() => {
        res.status(201).send("Equipo guardado");
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Ocurrio un error');
    })
})


router.get("/", function(req, res, next){
    const {borrado} = req.query;
    let sql = "SELECT * FROM equipos WHERE borrado_logico = ?";
    let valores = [borrado === "1" ? 1 : 0];
    
    db.query(sql,valores)
    .then(([rows,fields]) => {
        return res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

router.get("/:equipo_id", function(req, res, next){
    const { equipo_id } = req.params;
    let sql = "SELECT * FROM equipos WHERE equipo_id = ?";
    let valores = [equipo_id   ];
    
    db.query(sql,valores)
    .then(([rows,fields]) => {
        return res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

router.put("/:equipo_id", verifyRole([1]), function(req, res, next){
    const { equipo_id } = req.params;

    const { nombre } = req.body;

    const sql = `
    UPDATE equipos
    SET nombre = ?
    WHERE equipo_id = ?
    `;

    db.query(sql, [nombre, equipo_id])
    .then(() => {
        res.status(200).send("Equipo actualizado correctamente");
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error al actualizar el equipo");
    })
})

router.put("/estado/:equipo_id", verifyRole([1]), function(req, res, next){
    const { equipo_id } = req.params;
    const { borrado_logico } = req.body;
    let sql = "UPDATE equipos SET borrado_logico = ? WHERE equipo_id = ?";
    db.query(sql,[borrado_logico, equipo_id])
    .then(() => {
        const mensaje = borrado_logico == 1 ? `El equipo se "borro" correctamente` : `El equipo se reactivo`;
        res.status(200).send(mensaje)
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

module.exports = router;