const geoapi_key = process.env.GEOAPI_KEY;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Funciones auxiliares
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
async function crearPagoStripe(pedido) {
  try {
    console.log("Pedido", pedido.total);
    const customer = await stripe.customers.create({
      name: pedido.nombreEnvio + " " + pedido.apellidosEnvio,
      email: pedido.emailEnvio,
      phone: pedido.telefonoContacto,
      address: {
        line1: pedido.direccionEnvio.calle,
        city: pedido.direccionEnvio.municipio.DMUN50,
        state: pedido.direccionEnvio.provincia.PRO,
        country: pedido.direccionEnvio.pais,
        postal_code: pedido.direccionEnvio.cp,
      },
      source: "tok_visa",
    });
    // Asociar el método de pago con el cliente
    const paymentMethod = await stripe.paymentMethods.attach("pm_card_visa", {
      customer: customer.id,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pedido.total.toFixed(2) * 100), // Stripe requiere el monto en centavos
      currency: "eur",
      customer: customer.id,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
    });

    console.log("PaymentIntent", paymentIntent);
  } catch (error) {
    console.log(error);
  }
}
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
    //El token
    try {
      const pedido = req.body;
      pedido.subTotal = calcularSubtotal(pedido.ElementosPedido);
      pedido.gastosEnvio = calcularGastosEnvio(pedido.direccionEnvio);
      pedido.total = calcularTotal(pedido.subTotal, pedido.gastosEnvio);
      const fechaCaducidad = pedido.mescard + "/" + pedido.aniocard;
      console.log(pedido);

      let respuestaStripe = await crearPagoStripe(pedido);
      console.log(respuestaStripe);
      //res.status(200).send({pedido: pedido});
    } catch (error) {
      console.log(error);
      //res.status(500).send({});
    }
  },
};
