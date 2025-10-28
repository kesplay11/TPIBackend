const router = require("express").Router();
const db = require("../../../conexion");
const verifyRole = require('../../middlewares/verifyRole')

router.post("/", verifyRole([1]), function(req, res, next){
    const { nombre } = req.body;
    let sql = "INSERT INTO categorias (nombre)";
    sql += "VALUES (?)"

    db.query(sql,[nombre])
    .then(() => {
        res.status(201).send("La categoria se guardo corrrectamente");
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
});

router.get("/", function(req, res, next){
    const { borrado } = req.query;
    let valores = [ borrado === "1" ? 1 : 0]
    let sql = "SELECT * FROM categorias WHERE borrado_logico = ?";
    db.query(sql,valores)
    .then(([rows, fields]) => {
        res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

router.put("/:categoria_id", verifyRole([1]),function(req, res, next){
    const { categoria_id } = req.params;
    const { nombre } = req.body;
    let sql = `
    UPDATE categorias
    SET nombre = ?
    WHERE categoria_id = ?
    `;
    db.query(sql,[nombre, categoria_id])
    .then(() => {
        res.status(200).send("Se actualizo la categoria correctamente");
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un erro al actualizar la categoria");
    })
})

router.put("/estado/:categoria_id", verifyRole([1]), function(req, res, next){
    const { categoria_id } = req.params;
    const { borrado_logico } = req.body;
    let sql = `
    UPDATE categorias
    SET borrado_logico = ?
    WHERE categoria_id = ?
    `;
    db.query(sql,[borrado_logico, categoria_id])
    .then(() => {
        const mensaje = borrado_logico == 1 ? `Se 'borro' correctamne` : `Se reactivo la categoria`;
        res.status(200).send("Se actualizo la categoria correctamente");
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un erro al actualizar la categoria");
    })
})

module.exports = router