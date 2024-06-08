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
      console.log("Error al intentar recuperar generos: ", error);
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
      console.log("Error al intentar recuperar albumes: ", error);
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
  recuperarAlbum: async function (req, res) {
    try {
      let id = req.params.id;
      let album = await Album.findById(id);
      //Buscamos en spotify un album con el artista y el nombre
      let albumSpotify = await req.spotifyApi.searchAlbums(
        "album:" + album.nombre + " artist:" + album.artista
      );
      let token = req.spotifyApi.getAccessToken();
      res.status(200).send({
        codigo: 0,
        mensaje: "Album recuperado",
        datosalbum: album,
        datosSpotify: albumSpotify.body.albums.items[0],
        tokenSpotify:token,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar recuperar album",
        error: error.message,
        otrosdatos: null,
        datosalbum: null,
      });
    }
  },
};
