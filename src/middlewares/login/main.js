const router = require('express').Router();
const db = require('../../../conexion');

const { verificarPass, generarToken } = require("@damianegreco/hashpass");
const { TOKEN_SECRET } = process.env;

router.post('/', function(req, res, next) {
    const { documento, pass } = req.body;

    const sql = "SELECT persona_id, nombre, correo, rol_id , documento, hash_contraseña FROM personas WHERE documento = ? AND borrado_logico = 0";

    db.query(sql, [documento])
    .then(([personas]) => {
        if (personas && personas.length === 1) {
            const persona = personas[0];

            if (verificarPass(pass, persona.hash_contraseña)) {
                // contraseña correcta, generamos token
                const token = generarToken(TOKEN_SECRET, 4, {
                    persona_id: persona.persona_id,
                    nombre: persona.nombre,
                    correo: persona.correo,
                    rol_id: persona.rol_id
                });

                res.status(200).json({ status: "ok", token });
            } else {
                res.status(401).send("Documento o contraseña incorrectos");
            }
        } else {
            res.status(401).send("Documento123 o contraseña incorrectos");
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send("Ocurrió un error en el servidor");
    });
});

module.exports = router;
