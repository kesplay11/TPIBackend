const router = require('express').Router();
const db = require("../../../conexion");
const verifyRole = require('../../middlewares/verifyRole')

router.post("/", verifyRole([1]), function (req, res, next) {
const { persona_id, categoria_id, turno_id, estado_juego_id, fecha_de_creacion, visible, rondas } = req.body;

db.getConnection()
    .then((connection) => {
    return connection
        .beginTransaction()
        .then(() => {
        // 1️⃣ Insertar el juego principal
        const sqlJuego = `
            INSERT INTO juegos (persona_id, categoria_id, turno_id, estado_juego_id, fecha_de_creacion, visible)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        return connection.query(sqlJuego, [
            persona_id,
            categoria_id,
            turno_id,
            estado_juego_id,
            fecha_de_creacion,
            visible
        ]);
        })
        .then(([result]) => {
        const nuevoJuegoId = result.insertId;

        // 2️⃣ Insertar las rondas del juego
        if (rondas && rondas.length > 0) {
            const valuesRondas = rondas.map(r => [nuevoJuegoId, r.estado_ronda_id, r.numero_ronda]);
            const sqlRondas = `
            INSERT INTO juegos_rondas (juego_id, estado_ronda_id, numero_ronda)
            VALUES ?
            `;
            return connection.query(sqlRondas, [valuesRondas])
            .then(([rondasResult]) => {
                const primerIdRonda = rondasResult.insertId; // primer ID generado
                const valuesEquipos = [];

                // 3️⃣ Insertar los equipos de cada ronda
                rondas.forEach((r, i) => {
                if (r.equipos && r.equipos.length > 0) {
                    const juegoRondaId = primerIdRonda + i; // calculamos el ID de la ronda
                    r.equipos.forEach(equipoId => {
                    valuesEquipos.push([equipoId, juegoRondaId]);
                    });
                }
                });

                if (valuesEquipos.length > 0) {
                const sqlEquipos = `
                    INSERT INTO rondas_equipos (equipo_id, juego_ronda_id)
                    VALUES ?
                `;
                return connection.query(sqlEquipos, [valuesEquipos]);
                }
            });
        }
        })
        .then(() => connection.commit())
        .then(() => {
        res.status(201).json({
            message: "Juego, rondas y equipos creados exitosamente"
        });
        })
        .catch((error) => {
        return connection.rollback().then(() => {
            console.error("Error en la creación del juego:", error);
            res.status(500).json({
            error: "Error al crear el juego completo",
            detalle: error.message,
            });
        });
        })
        .finally(() => connection.release());
    })
    .catch((error) => {
    res.status(500).json({
        error: "Error al obtener conexión",
        detalle: error.message
    });
    });
});

router.get("/all", function(req, res, next){
    const { borrado } = req.query;
    // La consulta buscará '0' si borrado no es '1' (por defecto: juegos no borrados)
    let valores = [borrado === "1" ? 1 : 0];
    
    // Consulta SQL refactorizada con JOINs
    const sql = `
        SELECT
            j.juego_id,
            j.fecha_de_creacion,
            j.visible,
            -- Datos procesados (nombres en lugar de IDs)
            p.nombre AS nombre_creador,       -- Nombre de la persona que creó el juego
            c.nombre AS nombre_categoria,     -- Nombre de la categoría del juego
            t.nombre AS nombre_turno,         -- Nombre del turno asignado
            e.nombre AS nombre_estado         -- Nombre del estado actual del juego
        FROM
            juegos j
        LEFT JOIN
            personas p ON j.persona_id = p.persona_id
        LEFT JOIN
            categorias c ON j.categoria_id = c.categoria_id
        LEFT JOIN
            turnos t ON j.turno_id = t.turno_id
        LEFT JOIN
            estados e ON j.estado_juego_id = e.estado_id
        WHERE
            j.borrado_logico = ?
    `;

    db.query(sql, valores)
    .then(([rows]) => {
        return res.json(rows); // Devuelve la lista de juegos procesados
    })
    .catch((err) => { 
        console.error("Error al obtener listado de juegos:", err);
        res.status(500).send("Ocurrió un error en el servidor.");
    });
});

// GET /visible - Muestra solo juegos visibles (j.visible = 1)
router.get("/visible", function(req, res, next){
    const { borrado } = req.query;
    // La consulta buscará '0' si borrado no es '1' (por defecto: juegos no borrados)
    let valores = [borrado === "1" ? 1 : 0];
    
    const sql = `
        SELECT
            j.juego_id,
            j.fecha_de_creacion,
            j.visible,
            p.nombre AS nombre_creador,
            c.nombre AS nombre_categoria,
            t.nombre AS nombre_turno,
            e.nombre AS nombre_estado
        FROM
            juegos j
        LEFT JOIN personas p ON j.persona_id = p.persona_id
        LEFT JOIN categorias c ON j.categoria_id = c.categoria_id
        LEFT JOIN turnos t ON j.turno_id = t.turno_id
        LEFT JOIN estados e ON j.estado_juego_id = e.estado_id
        WHERE
            j.borrado_logico = ?
            AND j.visible = 1   -- 🚨 Filtro Clave: Solo juegos visibles
    `;

    db.query(sql, valores)
    .then(([rows]) => {
        return res.json(rows);
    })
    .catch((err) => { 
        console.error("Error al obtener listado de juegos visibles:", err);
        res.status(500).send("Ocurrió un error en el servidor.");
    });
});


router.put("/:juego_id", verifyRole([1]), function (req, res, next) {
    const { juego_id } = req.params;
    const { categoria_id, turno_id } = req.body;

    const sql = `
        UPDATE juegos
        SET categoria_id = ?, turno_id = ?
        WHERE juego_id = ?
    `;

    db.query(sql, [ categoria_id, turno_id, juego_id])
        .then(() => {
            res.status(200).send("Juego actualizado correctamente");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error al actualizar el juego");
        });
});


router.put("/estado/:juego_id", verifyRole([1]), function (req, res, next) {
    const { juego_id } = req.params;
    const { estado_juego_id } = req.body;

    const sql = `
        UPDATE juegos
        SET estado_juego_id = ?
        WHERE juego_id = ?
    `;

    db.query(sql, [estado_juego_id, juego_id])
        .then(() => {
            res.status(200).send("Estado del juego actualizado correctamente");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error al cambiar el estado del juego");
        });
});


router.put("/visible/:juego_id", verifyRole([1]), function (req, res, next) {
    const { juego_id } = req.params;
    const { visible } = req.body;

    const sql = `
        UPDATE juegos
        SET visible = ?
        WHERE juego_id = ?
    `;

    db.query(sql, [visible, juego_id])
        .then(() => {
            res.status(200).send("Visibilidad del juego actualizada");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error al actualizar la visibilidad");
        });
});

/* ================================================
   4️⃣ BORRAR (lógico) UN JUEGO
================================================ */
router.put("/borrar/:juego_id", verifyRole([1]), function (req, res, next) {
    const { juego_id } = req.params;
    const { borrado_logico } = req.body;

    const sql = `
        UPDATE juegos
        SET borrado_logico = ?
        WHERE juego_id = ?
    `;

    db.query(sql, [borrado_logico, juego_id])
        .then(() => {
            const msg = borrado_logico === 1 ? "Juego borrado lógicamente" : "Juego restaurado";
            res.status(200).send(msg);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error al cambiar el estado de borrado del juego");
        });
});



router.post("/:juego_id/rondas", verifyRole([1]), function (req, res, next) {
    const { juego_id } = req.params;
    const { estado_ronda_id, numero_ronda, equipos } = req.body;

    db.getConnection()
        .then((connection) => {
            return connection.beginTransaction()
                .then(() => {
                    const sqlRonda = `
                        INSERT INTO juegos_rondas (juego_id, estado_ronda_id, numero_ronda)
                        VALUES (?, ?, ?)
                    `;

                    return connection.query(sqlRonda, [juego_id, estado_ronda_id, numero_ronda])
                        .then(([result]) => {
                            const nuevaRondaId = result.insertId;

                            if (equipos && equipos.length > 0) {
                                const values = equipos.map(e => [e, nuevaRondaId]);
                                const sqlEquipos = `
                                    INSERT INTO rondas_equipos (equipo_id, juego_ronda_id)
                                    VALUES ?
                                `;
                                return connection.query(sqlEquipos, [values]);
                            }
                        });
                })
                .then(() => connection.commit())
                .then(() => {
                    res.status(201).send("Ronda agregada correctamente al juego");
                })
                .catch((error) => {
                    connection.rollback();
                    console.error(error);
                    res.status(500).send("Error al agregar la ronda al juego");
                })
                .finally(() => connection.release());
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error al obtener conexión con la base de datos");
        });
});

//"editar" los equipos de una ronda
router.put("/ronda/:juego_ronda_id", verifyRole([1]), async (req, res) => {
const { juego_ronda_id } = req.params;
const { equipos } = req.body;

try {
    // 1️⃣ Verificar si ya existen puntos cargados para esta ronda
    const [rows] = await db.query(
    "SELECT COUNT(*) AS count FROM puntos WHERE juego_ronda_id = ?",
    [juego_ronda_id]
    );

    if (rows[0].count > 0) {
    return res.status(400).json({
        mensaje: "No se pueden modificar los equipos porque ya existen puntos cargados en esta ronda.",
    });
    }

    // 2️⃣ Si no hay puntos, actualizar los equipos normalmente
    await db.query("DELETE FROM rondas_equipos WHERE juego_ronda_id = ?", [juego_ronda_id]);

    const values = equipos.map((id) => [id, juego_ronda_id]);
    await db.query(
    "INSERT INTO rondas_equipos (equipo_id, juego_ronda_id) VALUES ?",
    [values]
    );

    res.json({ mensaje: "Equipos actualizados correctamente" });
} catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
}
});

router.put("/estado-ronda/:juego_ronda_id", verifyRole([1]),function (req, res, next) {
    const { juego_ronda_id } = req.params;
    const { estado_ronda_id } = req.body;

    const sql = `
        UPDATE juegos_rondas
        SET estado_ronda_id = ?
        WHERE juego_ronda_id = ?
    `;

    db.query(sql, [estado_ronda_id, juego_ronda_id])
        .then(() => {
            res.status(200).send("Estado de la ronda actualizado correctamente");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error al cambiar el estado de la ronda");
        });
});


router.put("/borrar-ronda/:juego_ronda_id", verifyRole([1]), function (req, res, next) {
    const { juego_ronda_id } = req.params;
    const { borrado_logico } = req.body;

    const sql = `
        UPDATE juegos_rondas
        SET borrado_logico = ?
        WHERE juego_ronda_id = ?
    `;

    db.query(sql, [borrado_logico, juego_ronda_id])
        .then(() => {
            const msg = borrado_logico === 1 ? "Ronda borrada lógicamente" : "Ronda restaurada";
            res.status(200).send(msg);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error al cambiar el estado de borrado de la ronda");
        });
});




module.exports = router;