const router = require('express').Router();
const db = require('../../../conexion');

router.post("/", function(req, res, next){
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
    const { busqueda } = req.query;
    let sql = "SELECT * FROM equipos"
    let busquedaParcial = busqueda;
    console.log(busquedaParcial);
    if(busqueda){
        sql += " WHERE nombre like ?";
        busquedaParcial = `%${busqueda}%`;
        console.log(sql);
    }
    db.query(sql,[busquedaParcial])
    .then(([rows,fields]) => {
        console.log("test1");
        res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

router.put("/:equipo_id", function(req, res, next){
    const { equipo_id } = req.params;

    const { nombre, borrado_logico } = req.body;

    const sql = `
    UPDATE equipos
    SET nombre = ?, borrado_logico = ? 
    WHERE equipo_id = ?
    `;

    db.query(sql, [nombre, borrado_logico, equipo_id])
    .then(() => {
        res.status(200).send("Equipo actualizado correctamente");
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error al actualizar el equipo");
    })
})


//ordenar como lo vamos a explicar, que vamos a explicar si nos vamos a presentar primero, explicar porque elegimos, jueves exposición final
//armarse la lista, analisis foda evaluaresmo las fortalezas las vamos pulir, fortalzea Oportunidades, Ddebilidades, Amenazas, (si el porfe no nos pregunto esto)
//pero si nos hubiera prguntado estabamos al horno
//pensar para el jueves como una exposicion final
//analisis foda antes y despues
//documentacion a tener en cuenta la gramatica, y errores gramaticales
//investigacion de campo, ir a visitar los espacios, ver diferentes paginas webs
module.exports = router;