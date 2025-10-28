// controllers/JuegosRondasController.js
class JuegosRondasController {
  constructor(connection) {
    this.connection = connection;
  }

  async insertarRondas(juegoId, rondas) {
    if (!rondas || rondas.length === 0) return null;

    const valuesRondas = rondas.map(r => [juegoId, r.estado_ronda_id, r.numero_ronda]);
    const sqlRondas = `
      INSERT INTO juegos_rondas (juego_id, estado_ronda_id, numero_ronda)
      VALUES ?
    `;
    const [result] = await this.connection.query(sqlRondas, [valuesRondas]);
    return result;
  }
}

module.exports = JuegosRondasController;
