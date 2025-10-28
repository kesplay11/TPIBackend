const express = require("express");
const router = express.Router();
const db = require("../db/connection");
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

module.exports = router;