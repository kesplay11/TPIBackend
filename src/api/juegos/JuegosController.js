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

module.exports = {
    obtenerResultadosPorJuego,
};
