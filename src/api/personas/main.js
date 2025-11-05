const router = require('express').Router();
const db = require('../../../conexion');
const verifyRole = require('../../middlewares/verifyRole');
const { sendEmail } = require('../../services/nodemailer/nodemailer');
const { hashPass } = require("@damianegreco/hashpass");


router.post('/mail', verifyRole([1]), async (req, res, next) => {
    // 1. Desestructuración de los datos necesarios
    const { documento, rol_id, equipo_id, correo, anio_escolar, nombre } = req.body;
    
    // Asumimos que la función hashPass está definida y disponible.
    // Generamos el hash de la contraseña usando el documento como valor inicial.
    let hash_contraseña = hashPass(documento); 
    
    // 2. Definición de la consulta SQL y los valores
    const sql = `
        INSERT INTO personas (documento, rol_id, equipo_id, correo, anio_escolar, fecha_de_creacion, nombre, hash_contraseña)
        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?) 
    `;
    
    // Usamos 'NOW()' directamente en SQL para fecha_de_creacion
    const valores = [ documento, rol_id, equipo_id, correo, anio_escolar, nombre, hash_contraseña ];

    try {
        // 3. Ejecutar la Inserción en la Base de Datos
        const [result] = await db.query(sql, valores);
        
        // 4. Enviar Correo Electrónico
        await sendEmail(
            correo,
            'Bienvenido a Intertecnos',
            `<h1>Hola ${nombre} 👋</h1>
            <p>Tu cuenta fue creada. Haz clic en el siguiente enlace para establecer tu contraseña inicial, usando tu documento como contraseña temporal:</p>
            <p><strong>Contraseña Temporal:</strong> ${documento}</p>
            <a href="https://intertecnos.app/api/public/login">Haz clic aquí para iniciar sesión</a>`
        );

        // 5. Respuesta exitosa
        res.status(201).json({ 
            message: 'Persona creada, hash guardado y correo enviado',
            persona_id: result.insertId // Opcional: devolver el ID insertado
        });
        
    } catch (error) {
        // 6. Manejo de Errores
        console.error("Error en POST /mail (Creación de persona):", error);
        
        // Puedes añadir lógica para detectar si el error fue por duplicidad (ej. correo duplicado)
        // en el catch, pero por defecto devolvemos un error 500.
        res.status(500).json({ message: 'Error al crear persona o enviar correo' });
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
    const { busqueda } = req.query;
    let valores = [];

    // 1. Define la base de la consulta SQL con JOINs y SELECT específicos
    let sql = `
        SELECT
            p.persona_id,       -- Mantener el ID para operaciones de edición/estado
            p.documento,
            p.correo,
            p.nombre,
            p.anio_escolar,
            r.rol_nombre AS nombre_rol,     -- ✅ Procesado: Nombre del Rol
            e.nombre AS nombre_equipo       -- ✅ Procesado: Nombre del Equipo
        FROM
            personas p
        LEFT JOIN
            roles r ON p.rol_id = r.rol_id
        LEFT JOIN
            equipos e ON p.equipo_id = e.equipo_id
        WHERE
            p.borrado_logico = 0
    `;

    // 2. Aplica la cláusula de búsqueda (si existe)
    if (busqueda) {
        // Se busca en el campo 'nombre' de la tabla 'personas' (p.nombre)
        sql += " AND p.nombre LIKE ?"; 
        valores.push(`%${busqueda}%`);
    }

    // 3. Ejecuta la consulta
    db.query(sql, valores)
    .then(([rows]) => {
        // No es necesario el console.log("test 1") en producción.
        return res.json(rows); // Devuelve la lista de personas procesadas
    })
    .catch((error) => {
        console.error("Error al obtener listado de personas:", error);
        res.status(500).send("Ocurrió un error al obtener el listado.");
    });
});

router.get("/:persona_id", function(req, res, next) {
    const { persona_id } = req.params;

    // Consulta SQL refactorizada para obtener datos procesados y excluir sensibles.
    const sql = `
        SELECT
            p.documento,
            p.correo,
            p.anio_escolar,
            p.fecha_de_creacion,
            p.nombre,
            r.rol_nombre AS nombre_rol,         -- ✅ Procesado: trae el nombre del rol
            e.nombre AS nombre_equipo           -- ✅ Procesado: trae el nombre del equipo
        FROM
            personas p
        LEFT JOIN
            roles r ON p.rol_id = r.rol_id
        LEFT JOIN
            equipos e ON p.equipo_id = e.equipo_id
        WHERE
            p.persona_id = ?
            AND p.borrado_logico = 0            -- 🚫 Excluir usuarios borrados lógicamente
    `;

    db.query(sql, [persona_id])
    .then(([rows]) => {
        // rows es un array, nos interesa el primer (y único) resultado
        const persona = rows[0];

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada o borrada." });
        }
        
        // Devolvemos el objeto persona procesado
        return res.json(persona); 
    })
    .catch((error) => {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ message: "Ocurrió un error en el servidor." });
    });
});

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