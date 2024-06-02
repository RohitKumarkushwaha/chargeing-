"use strict";
const express = require("express");
const UserService = require("../services/UserService");
const { verifyToken, verifyTokenAdmin } = require("../middleware/authMiddleware");
const router = express.Router();
const jwt = require("jsonwebtoken");


function getCorrectError(error, res) {
    switch (error.message) {
        case "User not found":
            return res.status(404).json({ message: error.message });
        /*case "Station is currently not available for reservation":
        case "Station is currently not available for cancelling reservation":
        case "You can't cancel reservation for another user":
        case "Station is currently not available for charging":
        case "Station is currently not available for stopping charging":
        case "You can't stop charging for another user":
            return res.status(409).json({ message: error.message });*/
        default:
            return res.status(500).json({ message: error.message });
    }
}

router.get("/all", verifyTokenAdmin, async (req, res) => {
    res.json(await UserService.getAll());
});


router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserService.getById(userId);
        res.json(user);
    } catch (error) {
        return getCorrectError(error, res);
    }
});

router.get("/last_usage", verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserService.getLastUsageByUserId(userId);
        res.json(user);
    } catch (error) {
        return getCorrectError(error, res);
    }
});

//TODO: Check status code
router.patch("/", verifyToken, async (req, res) => {
    try {
        const value = await UserService.update(
            req.userId,
            req.body.name,
            req.body.surname,
            req.body.email,
            req.body.password,
            undefined
        );
        res.status(201).json(value);
    } catch (error) {
        return getCorrectError(error, res);
    }
});

router.patch("/:id/set_user_admin/", verifyTokenAdmin, async (req, res) => {
    try {
        const value = await UserService.update(
            req.params.id,
            undefined,
            undefined,
            undefined,
            undefined,
            req.body.is_admin
        );
        res.status(201).json(value);
    } catch (error) {
        return getCorrectError(error, res);
    }
});

module.exports = router;
