const router = require('express').Router();
const db = require("../../../conexion");
const verifyRole = require('../../middlewares/verifyRole')

router.post("/", verifyRole([1, 2]), function(req, res, next){
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

router.put("/:punto_id", verifyRole([1, 2]), async function (req, res, next) {
    const { punto_id } = req.params;
    const { puntos } = req.body;
    const rol = req.user.rol_id; // suponiendo que tu verifyRole agrega los datos del usuario
    try {
        // 1️⃣ Obtenemos el estado actual del punto
        const [rows] = await db.query("SELECT estado_punto_id FROM puntos WHERE punto_id = ?", [punto_id]);
        if (!rows.length) return res.status(404).send("El punto no existe");

        const estadoActual = rows[0].estado_punto_id;

        // 2️⃣ Lógica por rol y estado
        if (rol === 2) {
            // 🧩 Rol 2 = Capitán
            if (estadoActual === 3) { 
                // 3 = rechazado (por ejemplo)
                await db.query("UPDATE puntos SET puntos = ?, estado_punto_id = 1 WHERE punto_id = ?", [puntos, punto_id]);
                return res.status(200).send("El punto fue reenviado y quedó en estado pendiente nuevamente");
            } else {
                return res.status(403).send("No podés modificar un punto que no esté rechazado");
            }
        }

        if (rol === 1) {
            // 🧩 Rol 1 = Coordinador (puede editar en cualquier caso)
            await db.query("UPDATE puntos SET puntos = ? WHERE punto_id = ?", [puntos, punto_id]);
            return res.status(200).send("El punto fue actualizado correctamente por el coordinador");
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Ocurrió un error al actualizar el punto");
    }
});


router.put("/estado/:punto_id", verifyRole([1]), async function (req, res, next) {
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