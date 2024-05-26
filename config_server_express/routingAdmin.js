const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const adminController = require("../controllers/adminController");
router.get('/RecuperarColecciones', adminController.recuperarColecciones);

module.exports = router;