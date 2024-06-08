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
  recuperarAlbumes: async function (req, res) {
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
  agregarGenero: async function (req, res) {
    try {
      let genero = new Genero({
        nombre: req.body.nombre,
      });
      await genero.save();
      let generos = await Genero.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Genero agregado",
        error: null,
        otrosdatos: null,
        datosgeneros: generos,
      });
    } catch (error) {
      console.log("Error en AdminRESTService.agregarGenero", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar agregar genero",
        error: error.message,
        otrosdatos: null,
        datosgeneros: null,
      });
    }
  },
  modificarGenero: async function (req, res) {
    try {
      let genero = await Genero.findByIdAndUpdate(req.body._id, {
        nombre: req.body.nombre,
      });
      let generos = await Genero.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Genero modificado",
        error: null,
        otrosdatos: null,
        datosgeneros: generos,
      });
    } catch (error) {
      console.log("Error en AdminRESTService.modificarGenero", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar modificar genero",
        error: error.message,
        otrosdatos: null,
        datosgeneros: null,
      });
    }
  },
  eliminarGenero: async function (req, res) {
    try {
      console.log(req.body);
      let genero = await Genero.findByIdAndDelete(req.body.idGenero);
      let generos = await Genero.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Genero eliminado",
        error: null,
        otrosdatos: null,
        datosgeneros: generos,
      });
    } catch (error) {
      console.log("Error en AdminRESTService.eliminarGenero", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar eliminar genero",
        error: error.message,
        otrosdatos: null,
        datosgeneros: null,
      });
    }
  },
  agregarAlbum: async function (req, res) {
    try {
      console.log("Datos recibidos...", req.body);
      console.log("Archivo recibido...", req.file);
      //1º Subir la imagen a Firebase Storage
      let urlImagen = await subirImagen(req);
      console.log("URL de la imagen subida...", urlImagen);
      //2º Crear el documento Album
      let album = new Album({
        nombre: req.body.nombre,
        artista: req.body.artista,
        anhoLanzamiento: req.body.anhoLanzamiento,
        genero: req.body.genero,
        imagenPortada: urlImagen,
        numCanciones: req.body.numCanciones,
        precio: req.body.precio,
        stock: req.body.stock,
      });
      await album.save();
      let albumes = await Album.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Album agregado",
        error: null,
        otrosdatos: null,
        datosalbumes: albumes,
      });
    } catch (error) {
      console.log("Error en AdminRESTService.agregarAlbum", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar agregar album",
        error: error.message,
        otrosdatos: null,
        datosalbumes: null,
      });
    }
  },
  modificarAlbum: async function (req, res) {
    try {
      console.log("Datos recibidos...", req.body);
      //1º Comprobar si se ha subido una nueva imagen
      if (req.file) {
        console.log("Archivo recibido...", req.file);
        //Borrar la imagen anterior
        let album = await Album.findById(req.body._id);
        await borrarImagen(album.imagenPortada);
        //Subir la nueva imagen
        let urlImagen = await subirImagen(req);
        let albumNuevo = await Album.findByIdAndUpdate(req.body._id, {
          imagenPortada: urlImagen,
        })
      }
      //Modificar el documento Album
      let album = await Album.findByIdAndUpdate(req.body._id, {
        nombre: req.body.nombre,
        artista: req.body.artista,
        anhoLanzamiento: req.body.anhoLanzamiento,
        genero: req.body.genero,
        numCanciones: req.body.numCanciones,
        precio: req.body.precio,
        stock: req.body.stock,
      });
      let albumes = await Album.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Album modificado",
        error: null,
        otrosdatos: null,
        datosalbumes: albumes,
      });
    } catch (error) {
      console.log("Error en AdminRESTService.modificarAlbum", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar modificar album",
        error: error.message,
        otrosdatos: null,
        datosalbumes: null,
      });
    }
  },
  eliminarAlbum: async function (req, res) {
    try {
      console.log(req.body);
      let album = await Album.findByIdAndDelete(req.body.idAlbum);
      await borrarImagen(album.imagenPortada);
      let albumes = await Album.find();
      res.status(200).send({
        codigo: 0,
        mensaje: "Album eliminado",
        error: null,
        otrosdatos: null,
        datosalbumes: albumes,
      });
    } catch (error) {
      console.log("Error en AdminRESTService.eliminarAlbum", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar eliminar album",
        error: error.message,
        otrosdatos: null,
        datosalbumes: null,
      });
    }
  },
};
