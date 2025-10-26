const router = require('express').Router();
const db = require("../../../conexion");


router.post("/", function (req, res, next) {
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


module.exports = router;