const Pedido = require("../modelos/pedido");
const Album = require("../modelos/album");
const geoapi_key = process.env.GEOAPI_KEY;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_ID,
});

// #region Funciones auxiliares
function calcularSubtotal(ElementosPedido) {
  let subtotal = 0;
  ElementosPedido.forEach((item) => {
    subtotal += item.album.precio * item.cantidad;
  });
  return Number(subtotal.toFixed(2));
}
function calcularGastosEnvio(direccionEnvio) {
  let gastosEnvioRaw = 0;
  switch (direccionEnvio.provincia.CPRO) {
    case "07":
      gastosEnvioRaw = 3;
      break;
    case "35":
    case "38":
    case "51":
    case "52":
      gastosEnvioRaw = 5;
      break;
    default:
      gastosEnvioRaw = 2;
      break;
  }
  return Number(gastosEnvioRaw.toFixed(2));
}
function calcularTotal(subtotal, gastosEnvio) {
  return Number((subtotal + gastosEnvio).toFixed(2));
}
// #endregion
// #region Funciones de pago
async function crearPagoStripe(datosPago, idPedido) {
  try {
    const customer = await stripe.customers.create({
      name: datosPago.nombreEnvio + " " + datosPago.apellidosEnvio,
      email: datosPago.emailEnvio,
      phone: datosPago.telefonoContacto,
      address: {
        line1: datosPago.direccionEnvio.calle,
        city: datosPago.direccionEnvio.municipio.DMUN50,
        state: datosPago.direccionEnvio.provincia.PRO,
        country: datosPago.direccionEnvio.pais,
        postal_code: datosPago.direccionEnvio.cp,
      },
      source: "tok_visa",
    });
    // Asociar el método de pago con el cliente
    const paymentMethod = await stripe.paymentMethods.attach("pm_card_visa", {
      customer: customer.id,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(datosPago.total.toFixed(2) * 100), // Stripe requiere el monto en centavos
      currency: "eur",
      customer: customer.id,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
      return_url: `http://localhost:5317/Pedido/PedidoFinalizado?idPedido=${idPedido}`,
    });

    console.log("PaymentIntent", paymentIntent);
    if (paymentIntent.status === "succeeded") {
      // Actualizar el pedido en la base de datos
      await Pedido.findByIdAndUpdate(idPedido, { estadoPedido: "pagado" });
      return {
        status: "succeeded",
        return_url: `/Pedido/PedidoFinalizado/${idPedido}`,
      };
    }
  } catch (error) {
    console.log(error);
  }
  async function finalizarPagoConPaypal(req, res) {
    // Crea un nuevo pedido en PayPal
    let request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "totalPedido", // reemplaza con el total del pedido
          },
        },
      ],
    });

    let order;
    try {
      order = await client.execute(request);
    } catch (err) {
      // maneja el error
      console.error(err);
      return res.status(500).send({ error: err.message });
    }

    // Aquí puedes redirigir al usuario a la página de pago de PayPal
    res.json({ orderID: order.result.id });
  }
  //#endregion
}
function finalizarPagoConPaypal(pedido, req, res) {
  var create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://return.url",
      "cancel_url": "http://cancel.url"
    },
    "transactions": [{
      "item_list": {
        "items": pedido.elementosPedido.map(item => ({
          "name": item.album.titulo,
          "sku": item.album._id.toString(),
          "price": item.album.precio.toString(),
          "currency": "EUR",
          "quantity": item.cantidad
        }))
      },
      "amount": {
        "currency": "EUR",
        "total": pedido.totalPedido.toString()
      },
      "description": "Pedido de FullmetalStore"
    }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.log(error);
      throw error;
    } else {
      for(let i = 0; i < payment.links.length; i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
}
// #endregion
module.exports = {
  recuperarProvincias: async function (req, res) {
    try {
      const axios = require("axios");
      const respuesta = await axios.get(
        `https://apiv1.geoapi.es/provincias?type=JSON&key=${geoapi_key}&sandbox=0`
      );
      const provincias = respuesta.data.data;
      res.status(200).send({ provincias: provincias });
    } catch (error) {
      res.status(500).send({});
    }
  },
  recuperarMunicipios: async function (req, res) {
    try {
      const axios = require("axios");
      let CPRO = req.params.CPRO;
      const respuesta = await axios.get(
        `https://apiv1.geoapi.es/municipios?CPRO=${CPRO}&type=JSON&key=${geoapi_key}&sandbox=0`
      );
      const municipios = respuesta.data.data;
      res.status(200).send({ municipios: municipios });
    } catch (error) {
      res.status(500).send({});
    }
  },
  finalizarPedido: async function (req, res) {
    try {
      const datosPago = req.body;
      datosPago.subTotal = calcularSubtotal(datosPago.ElementosPedido);
      datosPago.gastosEnvio = calcularGastosEnvio(datosPago.direccionEnvio);
      datosPago.total = calcularTotal(
        datosPago.subTotal,
        datosPago.gastosEnvio
      );
      const _pedido = new Pedido({
        fechaPedido: new Date(),
        estadoPedido: "pendiente de pago",
        elementosPedido: datosPago.ElementosPedido,
        subtotalPedido: datosPago.subTotal,
        gastosPedido: datosPago.gastosEnvio,
        totalPedido: datosPago.total,
        direccionEnvio: datosPago.direccionEnvio,
        direccionFacturacion: datosPago.direccionFactura,
      });
      //Guardar el pedido en la base de datos
      console.log(_pedido);
      await _pedido.save();
      if (datosPago.tipoPago === "pagoTarjeta") {
        let respuestaStripe = await crearPagoStripe(datosPago, _pedido._id);
        console.log(respuestaStripe);
        res.status(200).send({ return_url: respuestaStripe.return_url });
      }else{
        finalizarPagoConPaypal(_pedido, req, res);
      }
    } catch (error) {
      console.log(error);
      //res.status(500).send({});
    }
  },
  actualizarPedido: async function (req, res) {
    try {
      let idPedido = req.params.idPedido;
      console.log("idPedido", idPedido);
      let pedido = await Pedido.findById(idPedido);
      pedido.estadoPedido = "pagado";
      //Actualizar el stock de los álbumes
      pedido.elementosPedido.forEach(async (elemento) => {
        let album = await Album.findById(elemento.album);
        album.stock -= elemento.cantidad;
        await album.save();
      });
      await pedido.save();
      res.status(200).send({ mensaje: "Pedido actualizado correctamente", pedido: pedido});
    } catch (error) {
      res.status(500).send({ mensaje: "Error al intentar actualizar el pedido" });
    }
  },
};
