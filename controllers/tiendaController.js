const Genero = require("../modelos/genero");
const Album = require("../modelos/album");
const Comentario = require("../modelos/comentario");

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
      let comentarios = await Comentario.find({ idAlbum: id });
      //Buscamos en spotify un album con el artista y el nombre
      let albumSpotify = await req.spotifyApi.searchAlbums(
        "album:" + album.nombre + " artist:" + album.artista
      );
      let albumIdSpotify = albumSpotify.body.albums.items[0].id;
      let pistasDelAlbum = await req.spotifyApi.getAlbumTracks(albumIdSpotify);

      console.log("Datos Spotify: ", albumSpotify.body.albums.items[0]);
      res.status(200).send({
        codigo: 0,
        mensaje: "Album recuperado",
        datosalbum: album,
        datosSpotify: albumSpotify.body.albums.items[0],
        pistasSpotify: pistasDelAlbum.body.items,
        datosComentario: comentarios,
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
  recuperarComentariosAlbum: async function (req, res) {
    try {
      let id = req.params.id;
      let album = await Album.findById(id);
      res.status(200).send({
        codigo: 0,
        mensaje: "Comentarios recuperados",
        error: null,
        otrosdatos: null,
        datoscomentarios: album.comentarios,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar recuperar comentarios",
        error: error.message,
        otrosdatos: null,
        datoscomentarios: null,
      });
    }
  },
  insertarComentarioAlbum: async function (req, res) {
    try {
      console.log("req.body: ", req.body);
      let id = req.body.id;
      let comentario = new Comentario({
        nombre: req.body.nombre,
        texto: req.body.texto,
        idCliente: req.body.idCliente,
        idAlbum: req.body.idAlbum,
        imagenAvatar: req.body.imagenAvatar,
      });
      await comentario.save();
      let recuperarComentariosAlbum = await Comentario.find({ idAlbum: id });
      res.status(200).send({
        codigo: 0,
        mensaje: "Comentario insertado",
        error: null,
        otrosdatos: null,
        datoscomentarios: recuperarComentariosAlbum,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar insertar comentario",
        error: error.message,
        otrosdatos: null,
        datoscomentarios: null,
      });
    }
  },
  buscarAlbumes: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.params);
      //Recuperamos albumes con nombre o artista que contenga la cadena de búsqueda
      let albumes = await Album.find({
        $or: [
          { nombre: { $regex: req.params.busqueda, $options: "i" } },
          { artista: { $regex: req.params.busqueda, $options: "i" } },
        ],
      });
      //Solo enviamos los 5 primeros resultados
      albumes = albumes.slice(0, 5);
      res.status(200).send({
        codigo: 0,
        mensaje: "Álbumes recuperados correctamente",
        error: null,
        otrosdatos: null,
        datosalbumes: albumes,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar buscar álbumes",
        error: error.message,
        otrosdatos: null,
        datosalbumes: null,
      });
    }
  },
};
