const admin = require("firebase-admin");
const uuid = require("uuid");
const Cliente = require("../modelos/cliente");
const Direccion = require("../modelos/direccion");
const Pedido = require("../modelos/pedido");
const Genero = require("../modelos/genero");
const Album = require("../modelos/album");

//#region Funciones auxiliares
async function borrarImagen(urlImagen) {
  const bucket = admin.storage().bucket();

  // Extrae el nombre del archivo de la URL
  const nombreArchivo = urlImagen.split("/").pop();

  try {
    await bucket.file(nombreArchivo).delete();
    console.log(`Archivo ${nombreArchivo} borrado.`);
  } catch (error) {
    console.error(`Error al borrar el archivo ${nombreArchivo}:`, error);
  }
}
async function subirImagen(req) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const idImagen = uuid.v4(); // Genera un ID único para la imagen
    const fileName = `Portadas/${idImagen}_${timestamp}.png`;
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET.split("/")[2];
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on("error", (err) => {
      req.file.cloudStorageError = err;
      reject(err);
    });

    stream.on("finish", () => {
      req.file.cloudStorageObject = fileName;
      file.makePublic().then(() => {
        req.file.cloudStoragePublicUrl = getPublicUrl(bucket, fileName);
        resolve(req.file.cloudStoragePublicUrl);
      });
    });

    stream.end(req.file.buffer);
  });
}

function getPublicUrl(bucket, filename) {
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

//#endregion


module.exports = {
  recuperarGeneros: async function (req, res) {
    try {
      let generos = await Genero.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Generos recuperados",
        error: null,
        otrosdatos: null,
        datosgeneros: generos,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar recuperar generos",
        error: error.message,
        otrosdatos: null,
        datosgeneros: null,
      });
    }
  },
  recuperarAlbumes  : async function (req, res) {
    try {
      const albumes = await Album.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Albumes recuperados",
        error: null,
        otrosdatos: null,
        datosalbumes: albumes,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar recuperar albumes",
        error: error.message,
        otrosdatos: null,
        datosalbumes: null,
      });
    }
  },
  agregarGenero: async function (req, res) {},
  modificarGenero: async function (req, res) {},
  eliminarGenero: async function (req, res) {},
  agregarAlbum: async function (req, res) {},
  modificarAlbum: async function (req, res) {},
  eliminarAlbum: async function (req, res) {},
};
