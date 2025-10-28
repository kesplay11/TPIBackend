const router = require('express').Router();
const db = require("../../../conexion");

router.get("/", function (req, res, next) {
    const estado_juego_id = req.query.estado_juego_id ? Number(req.query.estado_juego_id) : 3; // 3 = finalizado

    const sql = `
        SELECT 
            e.equipo_id,
            e.nombre AS equipo_nombre,
            COALESCE(SUM(p.puntos), 0) AS total_puntos
        FROM equipos e
        LEFT JOIN rondas_equipos re ON e.equipo_id = re.equipo_id
        LEFT JOIN juegos_rondas jr ON re.juego_ronda_id = jr.juego_ronda_id
        LEFT JOIN juegos j ON jr.juego_id = j.juego_id
            AND j.borrado_logico = 0
            AND j.estado_juego_id = ?
        LEFT JOIN puntos p ON 
            p.juego_ronda_id = jr.juego_ronda_id
            AND p.equipo_id = e.equipo_id       -- 🟩 FILTRAMOS POR EQUIPO CORRECTO
            AND p.borrado_logico = 0
        WHERE e.borrado_logico = 0
        GROUP BY e.equipo_id, e.nombre
        ORDER BY total_puntos DESC
    `;

    db.query(sql, [estado_juego_id])
        .then(([rows, fields]) => {
            res.json(rows);
        })
        .catch((error) => {
            console.error("Error al obtener los resultados:", error);
            res.status(500).send("Ocurrió un error al obtener los resultados de los juegos.");
        });
});

module.exports = router;
