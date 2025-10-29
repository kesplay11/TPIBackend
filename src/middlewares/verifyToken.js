const { verificarToken } = require("@damianegreco/hashpass");
require('dotenv').config();
const { TOKEN_SECRET } = process.env;

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ error: "Token no proporcionado" });

  // extrae el token sin el "Bearer"
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Formato de token inválido" });

  try {
    // console.log("TOKEN_SECRET:", TOKEN_SECRET);
    const verificacion = verificarToken(token, TOKEN_SECRET);

    if (verificacion?.data) {
      req.user = verificacion.data;
      next();
    } else {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }
  } catch (err) {
    console.error("Error en token:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = verifyToken;
