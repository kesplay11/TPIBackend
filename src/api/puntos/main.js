const router = require('express').Router();
const db = require("../../../conexion");

router.post("/", function(req, res, next){
    const { equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion } = req.body;
    let sql = "INSERT INTO puntos (equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion) VALUES ( ?, ?, ?, ?, ?)";

    db.query(sql, [equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion])
        .then(() => {
            res.status(201).send("El punto fue registrado correctamente");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error al registrar el punto");
        });

})

router.put("/:punto_id", function (req, res, next) {
    const { punto_id } = req.params;
    const { puntos } = req.body;

    const sql = `
        UPDATE puntos
        SET puntos = ?
        WHERE punto_id = ?
    `;

    db.query(sql, [puntos, punto_id])
        .then(() => {
            res.status(200).send("El punto fue actualizado correctamente");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error al actualizar el punto");
        });
});

router.put("/estado/:punto_id", async function (req, res, next) {
    const { punto_id } = req.params;
    const { estado_punto_id } = req.body;

    try {
        // 1️⃣ Actualizamos el estado del punto
        await db.query("UPDATE puntos SET estado_punto_id = ? WHERE punto_id = ?", [estado_punto_id, punto_id]);

        // 2️⃣ Si el estado cambia a "pendiente" (1), ponemos los puntos en 0
        if (estado_punto_id === 1) {
            await db.query("UPDATE puntos SET puntos = 0 WHERE punto_id = ?", [punto_id]);
            return res.status(200).send("El estado se cambió a pendiente y los puntos fueron reiniciados a 0");
        }

        // 3️⃣ Si es otro estado, simplemente confirmamos la actualización
        res.status(200).send("El estado del punto fue actualizado correctamente");
    } catch (error) {
        console.error(error);
        res.status(500).send("Ocurrió un error al actualizar el punto");
    }
});

router.get("/", function (req, res, next) {
    const { busqueda } = req.query;
    let sql = `
        SELECT * FROM puntos 
        WHERE borrado_logico = 0
    `;

    const valores = [];

    // Si se pasa algo por ?busqueda=, filtramos por nombre del equipo o id
    if (busqueda) {
        sql += " AND equipo_id LIKE ?";
        valores.push(`%${busqueda}%`);
    }

    db.query(sql, valores)
        .then(([rows, fields]) => {
            res.json(rows);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error al obtener los puntos");
        });
});


module.exports = router;