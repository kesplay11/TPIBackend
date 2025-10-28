function verifyRole(allowedRoles = []) {
return (req, res, next) => {
    console.log("datos", req.user);
    console.log("Rol en token:", req.user?.rol_id);
    console.log("Roles permitidos:", allowedRoles);

    if (!req.user) {
    return res.status(401).send('No autenticado');
    }

    const userRole = Number(req.user.rol_id);
    const allowed = allowedRoles.map(r => Number(r));

    if (!allowed.includes(userRole)) {
    return res.status(403).send('No tienes permisos');
    }

    next();
};
}

module.exports = verifyRole;
