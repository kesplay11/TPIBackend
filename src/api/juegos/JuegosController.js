const db = require("../../../conexion");

async function obtenerResultadosPorJuego(req, res) {
    const { juego_id } = req.params;

    try {
        //
        // 1️⃣ Traer TODAS las rondas del juego (solo activas)
        //
        const [rondas] = await db.query(
            `
            SELECT 
                jr.juego_ronda_id,
                jr.numero_ronda,
                e.nombre AS estado_ronda
            FROM juegos_rondas jr
            LEFT JOIN estados e ON jr.estado_ronda_id = e.estado_id
            WHERE jr.juego_id = ?
            AND jr.borrado_logico = 0
            ORDER BY jr.numero_ronda ASC
            `,
            [juego_id]
        );

        if (rondas.length === 0) {
            return res.json([]);
        }

        //
        // 2️⃣ Traer todos los equipos + puntos relacionados a esas rondas
        //
        const juegoRondasIds = rondas.map(r => r.juego_ronda_id);

        const [equiposYRondas] = await db.query(
            `
            SELECT 
                re.juego_ronda_id,
                e.equipo_id,
                e.nombre AS nombre_equipo,
                p.puntos,
                p.punto_id
            FROM rondas_equipos re
            JOIN equipos e ON re.equipo_id = e.equipo_id
            LEFT JOIN puntos p 
                ON p.equipo_id = e.equipo_id
                AND p.juego_ronda_id = re.juego_ronda_id
                AND p.borrado_logico = 0
            WHERE re.juego_ronda_id IN (?)
            `,
            [juegoRondasIds]
        );

        //
        // 3️⃣ Armar la estructura final
        //
        const resultadoFinal = rondas.map(ronda => {
            const equiposDeLaRonda = equiposYRondas
                .filter(eq => eq.juego_ronda_id === ronda.juego_ronda_id)
                .map(eq => ({
                    equipo_id: eq.equipo_id,
                    nombre: eq.nombre_equipo,
                    puntos: eq.puntos ?? 0,
                    yaCargado: eq.punto_id ? true : false
                }));

            return {
                ronda: ronda.numero_ronda,
                estado: ronda.estado_ronda,
                equipos: equiposDeLaRonda
            };
        });

        return res.json(resultadoFinal);

    } catch (error) {
        console.error("ERROR en obtener resultados:", error);
        return res.status(500).send("Ocurrió un error al obtener los resultados.");
    }
}

// JuegosController.js

const actualizarRonda = function (req, res, next) {
    const { juego_ronda_id } = req.params;
    const { estado_ronda_id, equipos } = req.body;

    // Función para obtener los equipos actuales de la ronda
    const obtenerEquiposActuales = () => {
        return db.query("SELECT equipo_id FROM rondas_equipos WHERE juego_ronda_id = ?", [juego_ronda_id])
            .then(([rows]) => rows.map(row => row.equipo_id));
    };

    // Función para verificar si hay puntos
    const verificarPuntos = () => {
        return db.query("SELECT COUNT(*) AS count FROM puntos WHERE juego_ronda_id = ?", [juego_ronda_id])
            .then(([rows]) => rows[0].count > 0);
    };

    // Función para comparar arrays de equipos (sin importar el orden)
    const sonEquiposIguales = (equipos1, equipos2) => {
        if (equipos1.length !== equipos2.length) return false;
        const set1 = new Set(equipos1);
        const set2 = new Set(equipos2);
        return equipos1.length === equipos2.length && 
               [...set1].every(id => set2.has(id));
    };

    // Si mandaron 'equipos', verificamos si realmente cambiaron
    if (Array.isArray(equipos)) {
        Promise.all([verificarPuntos(), obtenerEquiposActuales()])
            .then(([hayPuntos, equiposActuales]) => {
                // Si hay puntos Y los equipos son diferentes, entonces bloqueamos
                if (hayPuntos && !sonEquiposIguales(equipos, equiposActuales)) {
                    return res.status(400).json({
                        mensaje: "No se pueden modificar los equipos porque ya existen puntos cargados en esta ronda.",
                    });
                }
                // Si no hay puntos, o si los equipos son iguales, procedemos
                return proceedUpdate(!hayPuntos || sonEquiposIguales(equipos, equiposActuales));
            })
            .catch((err) => {
                console.error("Error al verificar puntos o equipos:", err);
                return res.status(500).send("Error al verificar datos de la ronda");
            });
    } else {
        // No vienen equipos -> sólo actualizar estado
        proceedUpdate(true);
    }

    function proceedUpdate(permitirActualizarEquipos) {
        db.getConnection()
        .then((connection) => {
            return connection
            .beginTransaction()
            .then(() => {
                // 1) Preparar updates para estado_ronda_id
                const updates = [];
                const vals = [];

                if (estado_ronda_id !== undefined) {
                updates.push("estado_ronda_id = ?");
                vals.push(estado_ronda_id);
                }
                
                const updatePromise = updates.length
                ? connection.query(`UPDATE juegos_rondas SET ${updates.join(", ")} WHERE juego_ronda_id = ?`, [...vals, juego_ronda_id])
                : Promise.resolve();

                return updatePromise
                .then(() => {
                    // 2) Si vienen equipos Y está permitido actualizarlos, reemplazamos
                    if (Array.isArray(equipos) && permitirActualizarEquipos) {
                    return connection
                        .query("DELETE FROM rondas_equipos WHERE juego_ronda_id = ?", [juego_ronda_id])
                        .then(() => {
                        if (equipos.length === 0) return Promise.resolve();
                        const values = equipos.map((id) => [id, juego_ronda_id]);
                        return connection.query("INSERT INTO rondas_equipos (equipo_id, juego_ronda_id) VALUES ?", [values]);
                        });
                    }
                    return Promise.resolve();
                })
                .then(() => connection.commit())
                .then(() => {
                    // 3) Devolver la ronda actualizada y sus equipos
                    return connection
                    .query("SELECT * FROM juegos_rondas WHERE juego_ronda_id = ?", [juego_ronda_id])
                    .then(([rondasRows]) => {
                        return connection
                        .query("SELECT e.equipo_id, e.nombre FROM rondas_equipos re JOIN equipos e ON re.equipo_id = e.equipo_id WHERE re.juego_ronda_id = ?", [juego_ronda_id])
                        .then(([equiposRows]) => {
                            res.status(200).json({
                            message: "Ronda actualizada correctamente",
                            ronda: rondasRows[0] || null,
                            equipos: equiposRows || [],
                            });
                        });
                    });
                })
                .catch((err) => {
                    // rollback en caso de error durante la transacción
                    return connection.rollback().then(() => {
                    console.error("Error en transacción al actualizar ronda:", err);
                    res.status(500).send("Error al actualizar la ronda");
                    });
                })
                .finally(() => {
                    connection.release();
                });
            })
            .catch((err) => {
                // error al iniciar transaccion
                console.error("Error al iniciar transacción:", err);
                connection.release();
                res.status(500).send("Error al procesar la actualización de la ronda");
            });
        })
        .catch((err) => {
            console.error("Error al obtener conexión:", err);
            res.status(500).send("Error al conectar con la base");
        });
    }
};

module.exports = {
    obtenerResultadosPorJuego,
    actualizarRonda // Asegúrate de exportar la nueva función
};
