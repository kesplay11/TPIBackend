const router = require('express').Router();
const db = require('../../../conexion');


router.post('/', function(req,res,next){
    const { documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, persona_contraseña, nombre } = req.body;
    const hash_contraseña = persona_contraseña;
    const valores = [ documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, hash_contraseña, nombre ]
    let sql = "INSERT INTO personas (documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, hash_contraseña, nombre)";
    sql += "VALUES (?,?,?,?,?,?,?,?,?)"
    db.query(sql,valores)
    .then(() => {
        res.status(201).send('Guardado');
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Ocurrio un error');
    })
});

router.get('/', function(req, res, next){
    const {busqueda} = req.query;
    let sql = "SELECT * FROM personas WHERE borrado_logico = 0";
    let valores = [];
    if(busqueda){
        sql += " AND nombre like ?"
        valores.push(`%${busqueda}%`);
    }
    db.query(sql,valores)
    .then(([rows, fields]) => {
        console.log("test 1");
        res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrrio un error");
    })
})

router.get("/:documento", function(req,res,next){
    const { documento } = req.params;
    const sql = "SELECT * FROM personas WHERE documento = ?";

    db.query(sql, [documento])
    .then(([rows, fields]) => {
        if (rows.length === 0) return res.status(404).send("Persona no encontrada");
        res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

router.put("/:persona_id", function(req, res, next){
    const {persona_id} = req.params;
    const {documento, rol_id, equipo_id, correo, nombre} = req.body;
    const valores = [documento, rol_id, equipo_id, correo, nombre, persona_id]
    const sql = `UPDATE personas
    SET documento = ?, rol_id = ?, equipo_id = ?, correo = ?, nombre = ?
    WHERE persona_id = ?
    `
    db.query(sql, valores)
    .then(() => {
        res.status(200).send("Usuario actualizado")
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error al actualizar la persona");
    })
})

//crear otra ruta aparte para el "eliminar" (borrado logico)
router.put("/estado/:persona_id", function(req, res, next){
    const { persona_id } = req.params;
    const { borrado_logico } = req.body;
    let sql = `
    UPDATE personas
    SET borrado_logico = ?
    WHERE persona_id = ?
    `;
    db.query(sql,[borrado_logico, persona_id])
    .then(() => {
        const mensaje = borrado_logico == 1 ? `Se 'borro' correctamente` : `Se reactivo correctamente`;
        res.status(200).send(mensaje);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrio un error");
    })
})

module.exports = router;