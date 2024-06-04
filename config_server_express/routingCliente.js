const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const multer = require("multer");
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
const upload = multer({ storage: multer.memoryStorage() });
const clienteController = require("../controllers/clienteController");
router.post(
  "/Registro",
  upload.single("imagenAvatar"),
  clienteController.registro
);
router.get("/ActivarCuenta/:id", clienteController.activarCuenta);
router.post("/ComprobarEmail", clienteController.comprobarEmail);
router.post("/ComprobarLogin", clienteController.comprobarLogin);
router.post("/Login", clienteController.login);
router.get("/RecuperarCliente/:id", clienteController.recuperarCliente);
router.post("/ActualizarDatosCliente",checkJWT,clienteController.actualizarDatosCliente);
router.post("/ActualizarAvatar",checkJWT,upload.single("imagenAvatar"),clienteController.actualizarAvatar);
router.post("/AgregarDireccion",checkJWT,clienteController.agregarDireccion);
router.post("/ModificarDireccion",checkJWT,clienteController.modificarDireccion);
router.post("/EliminarDireccion",checkJWT,clienteController.eliminarDireccion);
router.post("/CancelarPedido",checkJWT,clienteController.cancelarPedido);

module.exports = router;
