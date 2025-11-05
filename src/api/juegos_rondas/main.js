const express = require("express");
const router = express.Router();
const db = require("../../../conexion");


const JuegosRondasController = require("../controllers/juegosRondasController")

router.post("/", async (req, res) => {
  const { juego_id, rondas } = req.body;
  const connection = await db.getConnection();

  try {
    const controller = new JuegosRondasController(connection);
    const result = await controller.insertarRondas(juego_id, rondas);
    res.status(201).json({ message: "Rondas creadas", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

router.get("/:juego_id/rondas/activas", function(req, res, next) {
    const { juego_id } = req.params;
    let valores = [juego_id];

    const sql = `
        SELECT
            jr.juego_ronda_id,
            jr.numero_ronda,
            e.nombre AS nombre_estado_ronda  -- ✅ Procesado: Nombre del estado de la ronda
        FROM
            juegos_rondas jr
        LEFT JOIN
            estados e ON jr.estado_ronda_id = e.estado_id
        WHERE
            jr.juego_id = ? 
            AND jr.borrado_logico = 0        -- 🚨 Filtro Clave: Solo rondas activas
        ORDER BY
            jr.numero_ronda ASC
    `;

    db.query(sql, valores)
    .then(([rows]) => {
        return res.json(rows);
    })
    .catch((err) => {
        console.error(`Error al obtener rondas activas para juego ${juego_id}:`, err);
        res.status(500).send("Ocurrió un error al listar las rondas.");
    });
});

router.get("/:juego_id/rondas/borradas", function(req, res, next) {
    const { juego_id } = req.params;
    let valores = [juego_id];

    const sql = `
        SELECT
            jr.juego_ronda_id,
            jr.numero_ronda,
            e.nombre AS nombre_estado_ronda 
        FROM
            juegos_rondas jr
        LEFT JOIN
            estados e ON jr.estado_ronda_id = e.estado_id
        WHERE
            jr.juego_id = ? 
            AND jr.borrado_logico = 1        -- 🚨 Filtro Clave: Solo rondas borradas lógicamente
        ORDER BY
            jr.numero_ronda ASC
    `;

    db.query(sql, valores)
    .then(([rows]) => {
        return res.json(rows);
    })
    .catch((err) => {
        console.error(`Error al obtener rondas borradas para juego ${juego_id}:`, err);
        res.status(500).send("Ocurrió un error al listar las rondas borradas.");
    });
});

module.exports = router;