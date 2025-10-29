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