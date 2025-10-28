const express = require("express");
const router = express.Router();
const db = require("../db/connection");
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

module.exports = router;
