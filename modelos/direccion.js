var mongoose=require('mongoose');
//Invocacion restapi publico GEO-api para obtener provincias (En propiedad .data de la respuesta están los datos)
//invoke-restmethod -Method get -Uri 'https://apiv1.geoapi.es/provincias?type=JSON&key=&sandbox=1' 

//Para obtener municipios
//'https://apiv1.geoapi.es/municipios?CPRO=28&type=JSON&key=&sandbox=1'

var direccionSchema= new mongoose.Schema(
    {
        calle:{type:String, required:[true, '* calle requerida']},
        cp:{type:Number, required:[true, '* cp requerid0'], match:[/^\d{5}$/, '*cp no válido']},
        pais:{type:String, default:'España'},
        provincia:{ 
            CPRO:{type:String, required:true},
            CCOM:{type:String, required:false},
            PRO:{type:String, required:true}
         },
        municipio:{ 
            CPRO:{type:String, required:true},
            CMUM:{type:String, required:true},
            DMUN50:{type:String, required:true},
            CUN:{type:String, required:true}

         },
        esPrincipal:{type:Boolean, default:false},
    }
);

module.exports=mongoose.model('Direccion', direccionSchema, 'direcciones');