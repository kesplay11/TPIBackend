const router = require('express').Router();
const db = require("../../../conexion");
const verifyRole = require('../../middlewares/verifyRole')
const { emitNotification  } = require("../../services/websocket/websocket") 

router.post("/", async function(req, res, next){
    const { equipo_id, juego_ronda_id, capitan_id, puntos } = req.body;

    try {
        // ✅ Verificar si ya hay un punto para esta ronda y equipo
        const [existing] = await db.query(
            "SELECT * FROM puntos WHERE equipo_id = ? AND juego_ronda_id = ? AND borrado_logico = 0",
            [equipo_id, juego_ronda_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ mensaje: "Ya existe un punto para este equipo en esta ronda." });
        }

        // Insertar el punto
        await db.query(
            `INSERT INTO puntos (equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion)
             VALUES (?, ?, ?, ?, NOW())`,
            [equipo_id, juego_ronda_id, capitan_id, puntos]
        );

        emitNotification("nuevo_punto", {
            mensaje: `El capitan ${capitan_id} ha agregado puntos, a la ${juego_ronda_id}, para el equipo ${equipo_id}`,
            capitan_id,
            equipo_id,
            juego_ronda_id,
            fecha: new Date().toISOString(),
        });

        res.status(201).send("El punto fue registrado correctamente");
    } catch (error) {
        console.error(error);
        res.status(500).send("Ocurrió un error al registrar el punto");
    }
});


router.put("/:punto_id", async function (req, res, next) {
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


router.put("/estado/:punto_id", async function (req, res, next) {
    const { punto_id } = req.params;
    const { estado_punto_id } = req.body;

    try {
        if (![1, 2, 3].includes(Number(estado_punto_id))) {
            return res.status(400).json({ message: "Estado no válido" });
        }

        // 1️⃣ Actualizamos el estado del punto
        await db.query("UPDATE puntos SET estado_punto_id = ? WHERE punto_id = ?", [estado_punto_id, punto_id]);

        // 2️⃣ Lógica de notificación
        if (estado_punto_id === 2) {
            emitNotification("punto_confirmado", { mensaje: `Punto ${punto_id} ha sido confirmado por coordinador` });
        } else if (estado_punto_id === 3) {
            emitNotification("punto_rechazado", { mensaje: `Punto ${punto_id} fue rechazado y debe reenviarse` });
        }

        // 3️⃣ Si pasa a pendiente, reiniciamos puntos
        if (estado_punto_id === 1) {
            await db.query("UPDATE puntos SET puntos = 0 WHERE punto_id = ?", [punto_id]);
        }

        // 4️⃣ Devolvemos el registro actualizado
        const [rows] = await db.query(
            `SELECT punto_id, equipo_id, estado_punto_id, puntos 
             FROM puntos 
             WHERE punto_id = ?`,
            [punto_id]
        );

        res.status(200).json({
            message: "Estado actualizado correctamente",
            punto: rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Ocurrió un error al actualizar el punto");
    }
});


router.get("/", function (req, res, next) {
    const { busqueda, estado } = req.query;

    let sql = `
        SELECT 
            p.punto_id,
            p.puntos,
            p.fecha_de_creacion,
            e.equipo_id,
            e.nombre AS nombre_equipo,
            j.juego_id,
            c.nombre AS nombre_categoria,
            jr.juego_ronda_id,
            jr.numero_ronda,
            ep.estado_punto_id,
            ep.desc_estado_punto
        FROM puntos p
        INNER JOIN equipos e ON p.equipo_id = e.equipo_id
        INNER JOIN juegos_rondas jr ON p.juego_ronda_id = jr.juego_ronda_id
        INNER JOIN juegos j ON jr.juego_id = j.juego_id
        INNER JOIN categorias c ON j.categoria_id = c.categoria_id
        INNER JOIN estado_punto ep ON p.estado_punto_id = ep.estado_punto_id
        WHERE p.borrado_logico = 0
    `;

    const valores = [];

    // 🎯 Filtro por estado (por texto o por ID)
    if (estado) {
        sql += " AND (ep.desc_estado_punto = ? OR p.estado_punto_id = ?)";
        valores.push(estado, estado);
    }

    // 🔍 Filtro opcional por texto (nombre del equipo, categoría o juego)
    if (busqueda) {
        sql += `
            AND (
                e.nombre LIKE ?
                OR c.nombre LIKE ?
                OR j.juego_id LIKE ?
            )
        `;
        valores.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    // 🕒 Ordenar del más reciente al más antiguo
    sql += " ORDER BY p.fecha_de_creacion DESC";

    db.query(sql, valores)
        .then(([rows]) => res.json(rows))
        .catch((error) => {
            console.error("❌ Error en /api/puntos:", error);
            res.status(500).send("Ocurrió un error al obtener los puntos");
        });
});



router.get("/:juego_ronda_id", function (req, res, next) {
    const { juego_ronda_id } = req.params;
    const { busqueda } = req.query;

    let valores = [juego_ronda_id];

    // Traemos todos los equipos de la ronda (rondas_equipos) y sus puntos si existen
    let sql = `
        SELECT 
            re.ronda_equipo_id,
            e.equipo_id,
            e.nombre AS nombre_equipo,
            p.puntos,
            p.punto_id,
            p.capitan_id,
            p.estado_punto_id,
            ep.desc_estado_punto,
            p.fecha_de_creacion,
            p.borrado_logico
        FROM rondas_equipos re
        JOIN equipos e ON re.equipo_id = e.equipo_id
        LEFT JOIN puntos p 
            ON re.equipo_id = p.equipo_id 
            AND re.juego_ronda_id = p.juego_ronda_id 
            AND p.borrado_logico = 0
        LEFT JOIN estado_punto ep ON p.estado_punto_id = ep.estado_punto_id
        WHERE re.juego_ronda_id = ?
    `;

    if (busqueda) {
        sql += " AND (e.nombre LIKE ? OR ep.desc_estado_punto LIKE ?)";
        valores.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    db.query(sql, valores)
        .then(([rows]) => res.json(rows))
        .catch(error => {
            console.error(error);
            res.status(500).send("Ocurrió un error al obtener los puntos");
        });
});



module.exports = router;