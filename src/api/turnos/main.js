const router = require("express").Router();
const db = require("../../../conexion");

// 🟢 Crear turno
router.post("/", function (req, res, next) {
const { nombre, hora_inicio, hora_fin } = req.body;
let sql = `
    INSERT INTO turnos (nombre, hora_inicio, hora_fin)
    VALUES (?, ?, ?)
`;

db.query(sql, [nombre, hora_inicio, hora_fin])
    .then(() => {
    res.status(201).send("El turno se guardó correctamente");
    })
    .catch((error) => {
    console.error(error);
    res.status(500).send("Ocurrió un error al guardar el turno");
    });
});

router.get("/", function (req, res, next) {
const { busqueda } = req.query;
let sql = "SELECT * FROM turnos WHERE borrado_logico = 0";
let parametros = [];

if (busqueda) {
    sql += " AND nombre LIKE ?";
    parametros.push(`%${busqueda}%`);
}

db.query(sql, parametros)
    .then(([rows]) => {
    res.json(rows);
    })
    .catch((error) => {
    console.error(error);
    res.status(500).send("Ocurrió un error al obtener los turnos");
    });
});

// 🟠 Actualizar turno por ID
router.put("/:turno_id", function (req, res, next) {
const { turno_id } = req.params;
const { nombre, hora_inicio, hora_fin } = req.body;

let sql = `
    UPDATE turnos
    SET nombre = ?, hora_inicio = ?, hora_fin = ?
    WHERE turno_id = ?
`;

db.query(sql, [nombre, hora_inicio, hora_fin, turno_id])
    .then(() => {
    res.status(200).send("Se actualizó el turno correctamente");
    })
    .catch((error) => {
    console.error(error);
    res.status(500).send("Ocurrió un error al actualizar el turno");
    });
});

// 🔴 Cambiar estado lógico (borrado / reactivado)
router.put("/estado/:turno_id", function (req, res, next) {
const { turno_id } = req.params;
const { borrado_logico } = req.body;

let sql = `
    UPDATE turnos
    SET borrado_logico = ?
    WHERE turno_id = ?
`;

db.query(sql, [borrado_logico, turno_id])
    .then(() => {
    const mensaje =
        borrado_logico == 1
        ? "Se 'borró' el turno correctamente"
        : "Se reactivó el turno correctamente";
    res.status(200).send(mensaje);
    })
    .catch((error) => {
    console.error(error);
    res.status(500).send("Ocurrió un error al cambiar el estado del turno");
    });
});

module.exports = router;
