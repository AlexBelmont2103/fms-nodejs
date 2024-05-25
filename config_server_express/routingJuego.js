const express = require("express");
const router = express.Router();
const juegoController = require("../controllers/juegoController");
router.get("/EmpezarJuego", juegoController.empezarJuego);