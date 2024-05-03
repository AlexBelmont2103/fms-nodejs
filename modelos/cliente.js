const mongoose=require('mongoose');

var clienteSchema=new mongoose.Schema(
    {
        nombre: {type: String, required:[true,'* Nombre obligatorio'],maxLenght:[50,'*Maximo 50 caracteres']},
        apellidos: {type: String, required:[true,'* Apellidos obligatorios'], maxLenght:[200,'*Maximo 200 caracteres']},
        cuenta: {
            email:{type:String, required:[true, '* Email obligatorio']}, 
            password:{type:String,required:[true,'* La contraseña es obligatoria'],minlength:[8,"* la contraseña debe tener al menos 8 caracteres"]}, 
            cuentaActiva:{type: Boolean,required:true, default:false}, 
            login:{type:String}, 
            imagenAvatar:{type:String}
        },
        telefono:{type:String,required:false},
        fechaNacimiento:{type:Date,required:false},
        direcciones:[
            {type:mongoose.Schema.Types.ObjectId, ref:'Direccion'}
        ],
        pedidos:[
            {type:mongoose.Schema.Types.ObjectId, ref:'Pedido'}
        ]
    }
);
module.exports=mongoose.model('Cliente',clienteSchema,'clientes');