const Genero = require("../modelos/genero");
const Album = require("../modelos/album");
module.exports = {
    recuperarGeneros: async function(req, res) {
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
    recuperarAlbumes: async function(req, res) {
        try {
            //1º vemos si hay algo en el query
            const genero = req.query.genero;
            console.log("Genero: ", genero);
            let albumes;
            if (genero !== undefined && genero !== null && genero !== ""){
                console.log("Recuperamos albumes de un genero");
                //Recuperamos los albumes de un genero
                albumes = await Album.find({ genero: genero });
            } else {
                console.log("Recuperamos todos los albumes");
                //Recuperamos todos los albumes
                albumes = await Album.find();
            }
            console.log("Albumes recuperados: ", albumes);
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
};