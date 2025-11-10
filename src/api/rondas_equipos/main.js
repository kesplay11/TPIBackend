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

router.get("/:juego_ronda_id/equipos", function(req, res, next) {
    const { juego_ronda_id } = req.params;
    const valores = [juego_ronda_id];

    // Solo traemos todos los equipos asociados a la ronda
    const sql = `
        SELECT 
            re.ronda_equipo_id,
            e.equipo_id,
            e.nombre AS nombre_equipo
        FROM rondas_equipos re
        JOIN equipos e ON re.equipo_id = e.equipo_id
        WHERE re.juego_ronda_id = ?
    `;

    db.query(sql, valores)
        .then(([rows]) => res.json(rows))
        .catch(error => {
            console.error(error);
            res.status(500).send("Ocurrió un error al obtener los equipos");
        });
});



module.exports = router;
