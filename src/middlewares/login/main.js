const router = require('express').Router();
const db = require('../../../conexion');

const { verificarPass, generarToken } = require("@damianegreco/hashpass");
const { TOKEN_SECRET } = process.env;

router.post('/', function(req, res, next) {
    const { correo, pass } = req.body;

    const sql = "SELECT persona_id, nombre, correo, rol_id , documento, hash_contraseña, primer_login FROM personas WHERE correo = ? AND borrado_logico = 0";

    db.query(sql, [correo])
    .then(async ([personas]) => {
        if (personas && personas.length === 1) {
            const persona = personas[0];

            if(verificarPass(pass, persona.hash_contraseña)){

                if(persona.primer_login) {
                    const updateSql = "UPDATE personas set primer_login = 0 WHERE persona_id = ?";
                    await db.query(updateSql, [persona.persona_id]);
                    const token = generarToken(TOKEN_SECRET, 4 ,{
                        persona_id: persona.persona_id,
                        nombre: persona.nombre,
                        correo: persona.correo,
                        rol_id: persona.rol_id,
                        primer_login: true
                    });
                    return res.status(200).json({
                        status: "ok",
                        token,
                        es_primer_login: true
                    })
                }
            
        
            // contraseña correcta, generamos token sin cambiar el primer_login
            const token = generarToken(TOKEN_SECRET, 4, {
                persona_id: persona.persona_id,
                nombre: persona.nombre,
                correo: persona.correo,
                rol_id: persona.rol_id
            });

            res.status(200).json({ 
                status: "ok", 
                token, 
                es_primer_login: false
            });

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
