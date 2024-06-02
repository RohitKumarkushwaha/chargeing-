"use strict";
const express = require("express");
const UserService = require("../services/UserService");
const router = express.Router();
const { verifyToken, verifyTokenResetPassword } = require("../middleware/authMiddleware");

function getCorrectError(error, res) {
    switch (error.message) {
        case "Invalid email address":
        case "Invalid password":
        case "Invalid token":
        case "Missing email":
        case "Missing password":
            return res.status(400).json({ message: error.message });
        case "Invalid credentials":
        case "Email not registered":
            return res.status(401).json({ message: error.message });
        case "User not found":
            return res.status(404).json({ message: error.message });     
        case "Email already registered":
            return res.status(409).json({ message: error.message });     
        case "Missing email":
        case "Missing password":
            return res.status(400).json({ message: error.message });
        default:
            return res.status(500).json({ message: error.message });
    }
}

//TODO: Check status code
router.post("/register", async (req, res) => {
    try{
        const value = await UserService.add(
            req.body.name,
            req.body.surname,
            req.body.email,
            req.body.password,
            false
        );
        res.status(201).json(value);
    }catch(error){
        return getCorrectError(error, res);
    }
});

router.post("/login", async (req, res) => {
    if (!req.body.email) return getCorrectError({message: "Missing email"}, res);
    if (!req.body.password) return getCorrectError({message: "Missing password"}, res);

    try{
        const value = await UserService.login(req.body.email, req.body.password);
        res.json(value);
    }catch(error){
        return getCorrectError(error, res);
    }
});

router.get("/validateToken", verifyToken, async (req, res) => {
    res.json({ message: "Valid token" });
});

// API that sends an email with a link to reset the password
router.post("/resetPasswordToken", async (req, res) => {
    try{
        const value = await UserService.resetPasswordToken(req.body.email);
        res.json(value);
    }catch(error){
        return getCorrectError(error, res);
    }
});

// API that renders the reset password page
router.get("/resetPasswordPage", verifyTokenResetPassword, async (req, res) => {
    return res.render('resetPassword', { email: req.email, url: `http://${process.env.API_URL}:${process.env.PORT}/auth/resetPassword?token=${req.query.token}` });
});

// API that changes the password
router.post("/resetPassword", verifyTokenResetPassword, async (req, res) => {
    try{
        const value = await UserService.resetPassword(req.email, req.body.password, req.query.token);
        res.json(value);
    }catch(error){
        return getCorrectError(error, res);
    }
});

module.exports = router;
