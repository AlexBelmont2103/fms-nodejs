const express = require("express");
const router = express.Router();
const pedidoController = require("../controllers/pedidoController");

router.get("/RecuperarProvincias", pedidoController.recuperarProvincias);
router.get("/RecuperarMunicipios/:CPRO", pedidoController.recuperarMunicipios);
router.post("/FinalizarPedido", pedidoController.finalizarPedido);
module.exports = router;