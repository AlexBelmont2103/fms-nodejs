var mongoose=require('mongoose');

var pedidoSchema= new mongoose.Schema(
    {
        fechaPedido:{type:Date, default:Date.now()},
        estadoPedido:{type:String, default:'pendiente de pago'},
        elementosPedido:[
            {
                album:{type: mongoose.Schema.Types.ObjectId, ref:'Libro'},
                cantidad:{type: Number, required:true, default:1}
            }
        ],
        subtotalPedido:{type:Number, default:0},
        gastosPedido:{type:Number, default:0},
        totalPedido:{type:Number, default:0},
        direccionEnvio:{type: mongoose.Schema.Types.ObjectId, ref:'Direccion'},
        direccionFacturacion:{type: mongoose.Schema.Types.ObjectId, ref:'Direccion'}
    }
);

//Crear método para calcular el total del pedido en el esquema
pedidoSchema.methods.CalcularTotalPedido=function(){
    //Recorrer el array de elementosPedido e ir acumulando (precio * cantidad) <--- subtotal
    //Despues sumar gastos de envío en funcion de la dirección, y a campeonar
    var total=0;
    this.elementosPedido.forEach(
        (elemento)=>{
            total+=elemento.libroElemento.Precio * elemento.cantidadElemento;
        }
    );
    total+=this.gastosPedido;
}

module.exports=mongoose.model('Pedido', pedidoSchema, 'pedidos');