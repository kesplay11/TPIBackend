const router = require('express').Router();
const db = require('../../../conexion');



router.post('/', function(req,res,next){
    const { documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, persona_contraseña, nombre, borrado_logico } = req.body;

    const hash_contraseña = persona_contraseña;

    const valores = [ documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, hash_contraseña, nombre, borrado_logico]

    let sql = "INSERT INTO personas (documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, hash_contraseña, nombre, borrado_logico)";
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
    let sql = "SELECT * FROM personas";
    let busquedaParcial = busqueda;
    if(busqueda){
        sql += " WHERE nombre like ?"
        busquedaParcial = `%${busqueda}%`
        
    }
    db.query(sql,[busquedaParcial])
    .then(([rows, fields]) => {
        console.log("test 1");
        res.json(rows);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Ocurrrio un error");
    })
})

router.put("/:persona_id", function(req, res, next){
    const {persona_id} = req.params;
    const {documento, rol_id, equipo_id, correo, nombre, borrado_logico} = req.body;
    const valores = [documento, rol_id, equipo_id, correo, nombre, borrado_logico, persona_id]
    const sql = `UPDATE personas
    SET documento = ?, rol_id = ?, equipo_id = ?, correo = ?, nombre = ?, borrado_logico = ?
    WHERE persona_id = ?
    `
    db.query(sql, valores)
    .then(() => {
        res.status(200).send("Usuario actualizado")
    })
})

//crear otra ruta aparte para el "eliminar" (borrado logico)
// router.put("/eliminar/:persona_id", function(req, res, next){

// })

module.exports = router;