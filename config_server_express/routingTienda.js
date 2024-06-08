const express = require("express");
const router = express.Router();
const tiendaController = require("../controllers/tiendaController");
router.get("/RecuperarGeneros", tiendaController.recuperarGeneros);
router.get("/RecuperarAlbumes", tiendaController.recuperarAlbumes);
router.get("/RecuperarAlbumesGenero/:genero", tiendaController.recuperarAlbumesGenero);
router.get("/RecuperarAlbumesArtista/:artista", tiendaController.recuperarAlbumesArtista);
router.get("/RecuperarAlbum/:id", tiendaController.recuperarAlbum);
module.exports = router;