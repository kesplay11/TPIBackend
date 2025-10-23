const router = require("express").Router();
const db = require("../../../conexion");



router.post("/", function(req, res, next){
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
    const { busqueda } = req.query;
    let sql = "SELECT * FROM categorias";
    let busquedaParcial = busqueda;
    if(busqueda){
        sql += " WHERE nombre like ?"
        busquedaParcial = `%${busqueda}%`;
    }
    db.query(sql,[busquedaParcial])
    .then(([rows, fields]) => {
        res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

router.put("/:categoria_id",function(req, res, next){
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

module.exports = router