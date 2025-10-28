// controllers/RondasEquiposController.js
class RondasEquiposController {
  constructor(connection) {
    this.connection = connection;
  }

  async insertarEquipos(rondas, primerIdRonda) {
    const valuesEquipos = [];

    rondas.forEach((r, i) => {
      if (r.equipos && r.equipos.length > 0) {
        const juegoRondaId = primerIdRonda + i;
        r.equipos.forEach(equipoId => {
          valuesEquipos.push([equipoId, juegoRondaId]);
        });
      }
    });

    if (valuesEquipos.length === 0) return null;

    const sqlEquipos = `
      INSERT INTO rondas_equipos (equipo_id, juego_ronda_id)
      VALUES ?
    `;
    await this.connection.query(sqlEquipos, [valuesEquipos]);
  }
}

module.exports = RondasEquiposController;
