"use strict";
const express = require("express");
const ConnectorService = require("../services/ConnectorService");
const router = express.Router();

router.get("/", async (req, res) => {
    res.json(await ConnectorService.getAll());
});

module.exports = router;
