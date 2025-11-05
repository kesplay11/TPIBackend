const express = require("express");
const router = express.Router();
const db = require("../../../conexion");
const RondasEquiposController = require("../controllers/rondasEquiposController");

router.post("/", async (req, res) => {
  const { rondas, primerIdRonda } = req.body;
  const connection = await db.getConnection();

  try {
    const controller = new RondasEquiposController(connection);
    await controller.insertarEquipos(rondas, primerIdRonda);
    res.status(201).json({ message: "Equipos insertados" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

router.get("/rondas/:juego_ronda_id/equipos", function(req, res, next) {
    const { juego_ronda_id } = req.params;
    let valores = [juego_ronda_id];

    // Consulta SQL para unir rondas_equipos con equipos y obtener los nombres
    const sql = `
        SELECT
            re.ronda_equipo_id,
            re.equipo_id,
            e.nombre AS nombre_equipo  -- ✅ Procesado: Trae el nombre del equipo
        FROM
            rondas_equipos re
        LEFT JOIN
            equipos e ON re.equipo_id = e.equipo_id
        WHERE
            re.juego_ronda_id = ? 
    `;

    db.query(sql, valores)
    .then(([rows]) => {
        // La consulta trae los equipos involucrados en esa ronda
        return res.json(rows);
    })
    .catch((err) => {
        console.error(`Error al obtener equipos para juego_ronda ${juego_ronda_id}:`, err);
        res.status(500).send("Ocurrió un error al listar los equipos de la ronda.");
    });
});

module.exports = router;
