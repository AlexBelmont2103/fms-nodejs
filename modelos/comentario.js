const mongoose = require('mongoose');

var comentarioSchema = new mongoose.Schema(
    {
        texto: {type: String, required: [true, '* El texto del comentario es obligatorio'], maxlenght: [2000, '*Maximo 2000 caracteres']},
        nombre: {type: String, required: [true, '* El nombre del autor es obligatorio'], maxlenght: [200, '*Maximo 200 caracteres']},
        idCliente:{type:String},
        idAlbum:{type:String},
        imagenAvatar: {type: String},
    }
);
module.exports = mongoose.model('Comentario', comentarioSchema, 'comentarios');