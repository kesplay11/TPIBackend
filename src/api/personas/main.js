const router = require('express').Router();
const db = require('../../../conexion');
const verifyRole = require('../../middlewares/verifyRole');
const { sendEmail } = require('../../services/nodemailer/nodemailer');
const { hashPass } = require("@damianegreco/hashpass");


router.post('/', verifyRole([1]), function(req,res,next){
    const { documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, nombre } = req.body;

    let hash_contraseña = hashPass(documento);
    const valores = [ documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, nombre, hash_contraseña ]
    let sql = "INSERT INTO personas (documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, nombre, hash_contraseña)";
    sql += "VALUES (?,?,?,?,?,?,?,?)"
    db.query(sql,valores)
    .then(() => {
        res.status(201).send('Guardado');
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Ocurrio un error');
    })
});

router.post('/mail', verifyRole([1]), async (req, res, next) => {
  const { documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, nombre } = req.body;
  const valores = [documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, nombre];

  const sql = `
    INSERT INTO personas (documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, nombre)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await db.query(sql, valores);
    await sendEmail(
      correo,
      'Bienvenido a Intertecnos',
      `<h1>Hola ${nombre} 👋</h1>
       <p>Tu cuenta fue creada. Haz clic en el siguiente enlace para establecer tu contraseña:</p>
       <a href="https://intertecnos.app/api/public/login">Configurar contraseña</a>`
    );

    res.status(201).send('Persona creada y correo enviado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear persona o enviar correo');
  }
});


router.get("/verificar/:dni", verifyRole([1]), function(req, res, next) {
const { dni } = req.params;

db.query("SELECT * FROM personas WHERE documento = ?", [dni])
    .then(([rows]) => {
    if (rows.length === 0) {
        return res.status(200).json({ message: 'Ningún usuario registrado con ese DNI' });
    }

    const persona = rows[0];

    if (persona.borrado_logico === 0) {
        return res.status(200).json({ message: 'La persona ya está registrada en el sistema.' });
    } else {
        return res.status(200).json({
        message: 'La persona existe pero está dada de baja. ¿Desea reactivarla?',
        puedeReactivar: true
        });
    }
    })
    .catch(error => {
    console.error('Error al verificar el DNI:', error);
    res.status(500).json({ error: 'Error al verificar el DNI' });
    });
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
        return res.json(rows);
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
        return res.json(rows);
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
router.put("/estado/:persona_id", verifyRole([1]), function(req, res, next){
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

router.put('/:persona_id/set-password', function(req, res, next){
    const { persona_id } = req.params;
    const { pass } = req.body;

    let hash_contraseña = hashPass(pass);

    let sql = "UPDATE personas SET hash_contraseña = ? WHERE persona_id = ?"

    db.query(sql, [hash_contraseña, persona_id])
    .then(() => {
        res.status(201).send("Contraseña hasheada guardada");
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Ocurrio un error");
    })
})

module.exports = router;