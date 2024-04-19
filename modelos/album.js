const mongoose=require('mongoose');

var albumSchema=new mongoose.Schema(
    {
        nombre: {type: String, required:[true,'* Nombre obligatorio'],maxLenght:[50,'*Maximo 50 caracteres']},
        artista: {type: String, required:[true,'* Artista obligatorio'], maxLenght:[200,'*Maximo 200 caracteres']},
        anhoLanzamiento: {type: Number, required:[true,'* Año de lanzamiento obligatorio']},
        genero: {type: String, required:[true,'* Genero obligatorio'], maxLenght:[50,'*Maximo 50 caracteres']},
        imagenPortada: {type: String},
        numCanciones: {type: Number, required:[true,'* Número de canciones obligatorio']},
        precio: {type: Number, required:[true,'* Precio obligatorio']},
    }
);

module.exports=mongoose.model('Album',albumSchema,'albumes');