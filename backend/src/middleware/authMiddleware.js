const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ResetPasswordToken = require("../models/ResetPasswordToken");

async function verifyToken(req, res, next) {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.getById(decoded.userId);
        if (!user || user.token_reset_time > new Date(decoded.iat * 1000))
            return res.status(401).json({ error: "Invalid token" });
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
}

async function verifyTokenAdmin(req, res, next) {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.getById(decoded.userId);
        if (
            !user ||
            !user.is_admin ||
            user.token_reset_time > new Date(decoded.iat * 1000)
        )
            return res.status(401).json({ error: "Invalid token" });
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
}

async function verifyTokenResetPassword(req, res, next) {
    const token = req.query.token;
    if (!token) return res.status(400).render('resetPasswordFail');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if(!decoded.email)
            return res.status(400).render('resetPasswordFail');
               
        const user = await User.getByEmail(decoded.email);
        if (!user)
            return res.status(400).render('resetPasswordFail');

        const resetPasswordToken = await ResetPasswordToken.getByToken(token);
        if(!resetPasswordToken || resetPasswordToken.used)
            return res.status(400).render('resetPasswordFail');
        
        req.email = decoded.email;
        next();
    } catch (error) {
        return res.status(400).render('resetPasswordFail');
    }
}

module.exports = { verifyToken, verifyTokenAdmin, verifyTokenResetPassword };
