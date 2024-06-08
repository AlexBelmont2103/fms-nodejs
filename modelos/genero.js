const mongoose = require('mongoose');

var generoSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: [true, '* Nombre obligatorio'], maxlenght: [50, '*Maximo 50 caracteres']},
    }
);
module.exports = mongoose.model('Genero', generoSchema, 'generos');