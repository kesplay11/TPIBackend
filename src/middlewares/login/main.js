const router = require('express').Router();
const db = require('../../../conexion');

const { verificarPass, generarToken } = require("@damianegreco/hashpass");
const { TOKEN_SECRET } = process.env;

router.post('/', function(req, res, next) {
    const { correo, pass } = req.body;

    const sql = `SELECT 
    p.persona_id, 
    p.nombre, 
    p.correo, 
    p.rol_id, 
    p.equipo_id,
    e.nombre AS nombre_equipo, -- Renombramos la columna 'nombre' de equipos
    p.documento, 
    p.hash_contraseña, 
    p.primer_login 
FROM 
    personas p
INNER JOIN 
    equipos e ON p.equipo_id = e.equipo_id
WHERE 
    p.correo = ? 
    AND p.borrado_logico = 0`;

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
                        primer_login: true,
                        equipo_id: persona.equipo_id,
                        equipo: persona.nombre_equipo                    
                    });
                    return res.status(200).json({
                        status: "ok",
                        rol_id: persona.rol_id,
                        token,
                        es_primer_login: true
                    })
                }
            
        
            // contraseña correcta, generamos token sin cambiar el primer_login
            const token = generarToken(TOKEN_SECRET, 4, {
                persona_id: persona.persona_id,
                nombre: persona.nombre,
                correo: persona.correo,
                rol_id: persona.rol_id,
                equipo_id: persona.equipo_id,
                equipo: persona.nombre_equipo
            });

            res.status(200).json({ 
                status: "ok", 
                rol_id: persona.rol_id,
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
