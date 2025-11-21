const router = require('express').Router();
const db = require("../../../conexion");
const verifyRole = require('../../middlewares/verifyRole')
const { emitNotification  } = require("../../services/websocket/websocket") 

router.post("/", async function(req, res, next){
    const { equipo_id, juego_ronda_id, capitan_id, puntos } = req.body;

    try {
        // 1️⃣ Verificar si ya existe punto en esa ronda/equipo
        const [existing] = await db.query(
            "SELECT * FROM puntos WHERE equipo_id = ? AND juego_ronda_id = ? AND borrado_logico = 0",
            [equipo_id, juego_ronda_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ mensaje: "Ya existe un punto para este equipo en esta ronda." });
        }

        // 2️⃣ Insertar el punto
        const [result] = await db.query(
            `INSERT INTO puntos (equipo_id, juego_ronda_id, capitan_id, puntos, fecha_de_creacion)
            VALUES (?, ?, ?, ?, NOW())`,
            [equipo_id, juego_ronda_id, capitan_id, puntos]
        );

        const punto_id = result.insertId;

        // 3️⃣ Obtener info completa del juego/ronda
        const [[info]] = await db.query(`
            SELECT 
                jr.juego_id,
                jr.numero_ronda,
                j.turno,
                j.nombre AS nombre_juego,
                e.nombre AS nombre_equipo
            FROM juegos_rondas jr
            JOIN juegos j ON j.juego_id = jr.juego_id
            JOIN equipos e ON e.equipo_id = ?
            WHERE jr.juego_ronda_id = ?
        `, [equipo_id, juego_ronda_id]);

        // 4️⃣ Obtener coordinadores
        const [coordinadores] = await db.query(`
            SELECT persona_id 
            FROM personas 
            WHERE rol_id = 1
        `);

        // 5️⃣ Emitir notificación a TODOS los coordinadores
        emitNotification("nuevo_punto", {
            usuarios_destino: coordinadores.map(c => c.persona_id),
            tipo: "nuevo_punto",
            mensaje: `Un capitán registró un punto`,
            punto_id,
            equipo_id,
            juego_id: info.juego_id,
            ronda: info.numero_ronda,
            turno: info.turno,
            juego: info.nombre_juego,
            fecha: new Date().toISOString()
        });

        res.status(201).json({
            message: "Punto registrado correctamente",
            punto_id
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Ocurrió un error al registrar el punto");
    }
});



router.put("/:punto_id", async (req, res) => {
    const { punto_id } = req.params;
    const { puntos } = req.body;
    const rol = req.user?.rol_id; // el middleware verifyRole debe adjuntar req.user

    try {
        // 1️⃣ Verificamos existencia
        const [rows] = await db.query(
        "SELECT estado_punto_id FROM puntos WHERE punto_id = ? AND borrado_logico = 0",
        [punto_id]
        );
        if (!rows.length) {
        return res.status(404).json({ message: "El punto no existe" });
        }

        const estadoActual = rows[0].estado_punto_id;

        // 2️⃣ Lógica de permisos
        if (rol === 2) {
        // 🧩 Capitán
        if (estadoActual === 3) {
            await db.query(
            "UPDATE puntos SET puntos = ?, estado_punto_id = 1 WHERE punto_id = ?",
            [puntos, punto_id]
            );
            return res.json({
            message: "✅ El punto fue reenviado y quedó en estado pendiente nuevamente",
            });
        } else {
            return res.status(403).json({
            message: "Solo podés modificar puntos que estén en estado rechazado",
            });
        }
        }

        if (rol === 1) {
        // 🧩 Coordinador
        await db.query(
            "UPDATE puntos SET puntos = ? WHERE punto_id = ?",
            [puntos, punto_id]
        );
        return res.json({
            message: "✅ El punto fue actualizado correctamente por el coordinador",
        });
    }

    // 🚫 Otros roles no pueden modificar
    return res.status(403).json({ message: "No tenés permisos para modificar puntos" });

  } catch (error) {
    console.error("❌ Error en PUT /api/puntos/:punto_id:", error);
    res.status(500).json({ message: "Ocurrió un error al actualizar el punto" });
  }
});



router.put("/estado/:punto_id", async function (req, res, next) {
    const { punto_id } = req.params;
    const { estado_punto_id } = req.body;

    try {
        // Validación del estado
        if (![1, 2, 3].includes(Number(estado_punto_id))) {
            return res.status(400).json({ message: "Estado no válido" });
        }

        // 1️⃣ Actualizar estado
        await db.query(
            "UPDATE puntos SET estado_punto_id = ? WHERE punto_id = ?",
            [estado_punto_id, punto_id]
        );

        // 2️⃣ Si vuelve a pendiente => puntos = 0
        if (estado_punto_id === 1) {
            await db.query("UPDATE puntos SET puntos = 0 WHERE punto_id = ?", [punto_id]);
        }

        // 3️⃣ Obtener info completa del punto
        const [[info]] = await db.query(`
            SELECT 
                p.equipo_id,
                p.puntos,
                jr.juego_id,
                jr.numero_ronda,
                j.turno,
                j.nombre AS nombre_juego
            FROM puntos p
            JOIN juegos_rondas jr ON p.juego_ronda_id = jr.juego_ronda_id
            JOIN juegos j ON jr.juego_id = j.juego_id
            WHERE p.punto_id = ?
        `, [punto_id]);

        // 4️⃣ Obtener capitanes del equipo
        const [capitanes] = await db.query(`
            SELECT persona_id 
            FROM personas 
            WHERE equipo_id = ? AND rol_id = 2
        `, [info.equipo_id]);

        // 5️⃣ Notificaciones según estado
        if (estado_punto_id === 2) {
            // Confirmado
            emitNotification("punto_confirmado", {
                usuarios_destino: capitanes.map(c => c.persona_id),
                tipo: "punto_confirmado",
                mensaje: `Tu punto fue confirmado`,
                juego: info.nombre_juego,
                ronda: info.numero_ronda,
                turno: info.turno,
                puntos: info.puntos,
                equipo_id: info.equipo_id,
                juego_id: info.juego_id,
                fecha: new Date().toISOString()
            });
        }

        if (estado_punto_id === 3) {
            // Rechazado
            emitNotification("punto_rechazado", {
                usuarios_destino: capitanes.map(c => c.persona_id),
                tipo: "punto_rechazado",
                mensaje: `Un punto del equipo fue rechazado`,
                juego: info.nombre_juego,
                ronda: info.numero_ronda,
                turno: info.turno,
                equipo_id: info.equipo_id,
                juego_id: info.juego_id,
                fecha: new Date().toISOString()
            });
        }

        res.status(200).json({
            message: "Estado actualizado correctamente",
            punto_id,
            estado: estado_punto_id
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