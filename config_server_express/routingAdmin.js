const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const adminController = require("../controllers/adminController");
router.get("/RecuperarGeneros", adminController.recuperarGeneros);
router.get("/RecuperarAlbumes", adminController.recuperarAlbumes);
router.post("/AgregarGenero", adminController.agregarGenero);
router.post("/ModificarGenero", adminController.modificarGenero);
router.post("/EliminarGenero", adminController.eliminarGenero);
router.post(
  "/AgregarAlbum",
  upload.single("imagenPortada"),
  adminController.agregarAlbum
);
router.post(
  "/ModificarAlbum",
  upload.single("imagenPortada"),
  adminController.modificarAlbum
);
router.post("/EliminarAlbum", adminController.eliminarAlbum);

module.exports = router;
