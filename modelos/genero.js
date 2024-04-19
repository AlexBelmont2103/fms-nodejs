const mongoose = require('mongoose');

var generoSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: [true, '* Nombre obligatorio']},
    }
);
module.exports = mongoose.model('Genero', generoSchema, 'generos');