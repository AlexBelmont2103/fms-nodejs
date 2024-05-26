const mongoose = require("mongoose");
const admin = require("firebase-admin");
const Cliente = require("../modelos/cliente");
const Direccion = require("../modelos/direccion");
const Pedido = require("../modelos/pedido");
const Genero = require("../modelos/genero");
const Album = require("../modelos/album");
async function subirImagen(req) {
  return new Promise((resolve, reject) => {
    const fileName = `Avatares/${req.body.login}.png`; // Modifica el nombre del archivo para que coincida con el email del usuario
    const file = admin.storage().bucket().file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on("error", (err) => {
      reject(err);
    });

    stream.on("finish", async () => {
      await file.makePublic();
      resolve(getPublicUrl(fileName));
    });

    stream.end(req.file.buffer);
  });
}

module.exports = {
  recuperarColecciones: async function (req, res) {
    try {
      console.log("RecuperarColecciones...");
      //Recuperar los nombres de las colecciones
      const _colecciones = await mongoose.connection.db
        .listCollections()
        .toArray();
      //Recuperar los nombres de las colecciones
      let nombresColecciones = _colecciones.map((item) => item.name);
      res.status(200).send({
        codigo: 0,
        mensaje: "Colecciones recuperadas...",
        error: null,
        otrosdatos: nombresColecciones,
        datoscliente: null,
        jwt: null,
      });
    } catch (error) {
      console.log("Error al intentar recuperar modelos...", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar recuperar modelos...",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
        jwt: null,
      });
    }
  },
};
