const express = require("express");
const router = express.Router();
const MoMoController = require("./momoController");
router.post("/test", MoMoController.paymentTest);
module.exports = router;
