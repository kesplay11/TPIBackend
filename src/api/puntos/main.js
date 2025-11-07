const router = require('express').Router();
const db = require("../../../conexion");
const verifyRole = require('../../middlewares/verifyRole')
const emitNotification = require("../../services/websocket/websocket") 

router.post("/", verifyRole([1, 2]), function(req, res, next){
    const { equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion } = req.body;
    let sql = "INSERT INTO puntos (equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion) VALUES ( ?, ?, ?, ?, ?)";

    db.query(sql, [equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion])
        .then(() => {
            emitNotification("nuevo_punto",
                {
                    mensaje: `El capitan ${capitan_id} ha agregado puntos, a la ${juego_ronda_id}, para el equipo ${equipo_id}`,
                    capitan_id,
                    equipo_id,
                    juego_ronda_id,
                    fecha: new Date().toISOString(),
                }
            )
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

        if (estado_punto_id === 2){
            emitNotification("punto_confirmado",{mensaje:`Punto: ${punto_id}, ha sido confirmado por coordinador`})
        } else if (estado_punto_id === 3){
            emitNotification(`punto rechazado`,{mensaje:`Punto ${punto_id} fue rechazado y debe reenviarse`})
        }
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
            return res.json(rows);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error al obtener los puntos");
        });
});

router.get("/:juego_ronda_id", function (req, res, next) {
    const { busqueda } = req.query;
    let sql = `
        SELECT 
            p.*, 
            e.nombre AS nombre_equipo,
            ep.desc_estado_punto 
        FROM puntos p
        JOIN equipos e ON p.equipo_id = e.equipo_id
        JOIN estado_punto ep ON p.estado_punto_id = ep.estado_punto_id -- Nueva unión
        WHERE p.borrado_logico = 0
    `;

    const valores = [];

    // Si se pasa algo por ?busqueda=, filtramos por id de equipo, nombre de equipo, o descripcion del estado
    if (busqueda) {
        sql += " AND (p.equipo_id LIKE ? OR e.nombre LIKE ? OR ep.desc_estado_punto LIKE ?)";
        valores.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }
    
    // Si se decidiera usar el filtro por juego_ronda_id (tal como se mencionó en la nota anterior)
    /* if (req.params.juego_ronda_id) {
        sql += " AND p.juego_ronda_id = ?";
        valores.push(req.params.juego_ronda_id);
    }
    */

    db.query(sql, valores)
        .then(([rows, fields]) => {
            return res.json(rows);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error al obtener los puntos");
        });
});


module.exports = router;