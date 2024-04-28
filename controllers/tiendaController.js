const Genero = require("../modelos/genero");
const Album = require("../modelos/album");
module.exports = {
  recuperarGeneros: async function (req, res) {
    try {
      //Recuperamos todos los generos en un array
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
  recuperarAlbumesGenero: async function (req, res) {
    try {
      let genero = req.params.genero;
      let albumes = await Album.find({ genero: genero });
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
  recuperarAlbumesArtista: async function (req, res) {
    try {
      let artista = req.params.artista;
      let albumes = await Album.find({ artista: artista });
      res.status(200).send({
        codigo: 0,
        mensaje: "Albumes recuperados",
        error: null,
        otrosdatos: null,
        datosalbumes: albumes,
      });
      console.log("Albumes recuperados: ", albumes);
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
};
