const express = require("express");
const router = express.Router();
const tiendaController = require("../controllers/tiendaController");
router.get("/RecuperarGeneros", tiendaController.recuperarGeneros);
router.get("/RecuperarAlbumes", tiendaController.recuperarAlbumes);
module.exports = router;