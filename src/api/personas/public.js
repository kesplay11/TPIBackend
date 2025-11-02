// const router = require('express').Router();
// const db = require('../../../conexion');
// const { hashPass } = require("@damianegreco/hashpass");

// router.put('/:persona_id/set-password', function(req, res, next){
//     const { persona_id } = req.params;
//     const { pass } = req.body;

//     let hash_contraseña = hashPass(pass);

//     let sql = "UPDATE personas SET hash_contraseña = ? WHERE persona_id = ?"

//     db.query(sql, [hash_contraseña, persona_id])
//     .then(() => {
//         res.status(201).send("Contraseña hasheada guardada");
//     })
//     .catch((err) => {
//         console.error(err);
//         res.status(500).send("Ocurrio un error");
//     })
// })

// module.exports = router;




// router.post('/mailtest', verifyRole([1]), async (req, res) => {
//     try {
//         const { to, subject, message } = req.body;

//         // Validar datos básicos
//         if (!to || !subject || !message) {
//             return res.status(400).json({ error: 'Faltan campos requeridos: to, subject o message' });
//         }

//         // Enviar correo
//         await sendEmail(to, subject, message);

//         res.status(200).json({ success: true, message: 'Correo enviado correctamente' });
//     } catch (error) {
//         console.error('Error enviando correo:', error);
//         res.status(500).json({ error: 'Error al enviar el correo' });
//     }
// });