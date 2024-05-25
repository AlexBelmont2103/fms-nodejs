const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pedidoController = require("../controllers/pedidoController");
async function checkJWT(req, res, next) {
  try {
    let _jwt = req.headers.authorization.split(" ")[1];
    console.log("jwt recibido en el servidor", _jwt);
    const _payload = jwt.verify(_jwt, process.env.JWT_SECRETKEY);
    req.payload = _payload;
    next();
  } catch (error) {
    console.log("Error al intentar validar JWT...", error);
    res
      .status(401)
      .send({
        codigo: 1,
        mensaje: "Error al intentar validar JWT...",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
        jwt: null,
      });
  }
}
router.get("/RecuperarProvincias", pedidoController.recuperarProvincias);
router.get("/RecuperarMunicipios/:CPRO", pedidoController.recuperarMunicipios);
router.post("/FinalizarPedido", checkJWT, pedidoController.finalizarPedido);
router.get("/ActualizarPedido/:idPedido",pedidoController.actualizarPedido);
router.get("/paypalCallback", pedidoController.paypalCallback);
module.exports = router;
