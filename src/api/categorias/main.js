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
})
