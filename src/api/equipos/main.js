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
        res.json(rows);
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

//router.put("/eliminar/:equipo_id",function(req, res, next){})


//ordenar como lo vamos a explicar, que vamos a explicar si nos vamos a presentar primero, explicar porque elegimos, jueves exposición final
//armarse la lista, analisis foda evaluaresmo las fortalezas las vamos pulir, fortalzea Oportunidades, Ddebilidades, Amenazas, (si el porfe no nos pregunto esto)
//pero si nos hubiera prguntado estabamos al horno
//pensar para el jueves como una exposicion final
//analisis foda antes y despues
//documentacion a tener en cuenta la gramatica, y errores gramaticales
//investigacion de campo, ir a visitar los espacios, ver diferentes paginas webs
module.exports = router;