const Pedido = require("../modelos/pedido");
const Album = require("../modelos/album");
const Cliente = require("../modelos/cliente");
const geoapi_key = process.env.GEOAPI_KEY;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET_ID
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
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
async function generarJWT(cliente) {
  let _jwt = jsonwebtoken.sign(
    {
      nombre: _cliente.nombre,
      apellidos: _cliente.apellidos,
      email: _cliente.cuenta.email,
      idCliente: _cliente._id,
    },
    process.env.JWT_SECRETKEY,
    { expiresIn: "1h", issuer: "http://localhost:5000" }
  );
  return _jwt;
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
        mensaje: "Pago realizado correctamente",
        return_url: `Pedido/PedidoFinalizado?idPedido=${idPedido}`,
      };
    }
  } catch (error) {
    console.log(error);
  }
}
async function finalizarPagoConPaypal(pedido, req, res) {
  try {
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: pedido.totalPedido,
          },
        },
      ],
      application_context: {
        return_url: `http://localhost:5000/api/Pedido/PaypalCallback?idPedido=${pedido._id}`,
        cancel_url: "https://www.google.es",
      },
    });
    const response = await client.execute(request);
    for (let link of response.result.links) {
      console.log(link);
      if (link.rel === "approve") {
        res.status(200).send({ approval_url: link.href });
      }
    }
  } catch (error) {
    res.status(500).send({});
  }
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
      console.log(req.payload);
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
      await _pedido.save();
      //añadir el id del pedido al array de pedidos del cliente
      const idCliente = req.payload.idCliente;
      const cliente = await Cliente.findByIdAndUpdate(idCliente, {
        $push: { pedidos: _pedido._id },
      });
      if (datosPago.tipoPago === "pagoTarjeta") {
        let respuestaStripe = await crearPagoStripe(datosPago, _pedido._id);
        console.log(respuestaStripe);
        res.status(200).send(respuestaStripe);
      } else {
        await finalizarPagoConPaypal(_pedido, req, res);
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
      // Recuperar cliente por el id del pedido
      const cliente = await Cliente.findOne({ pedidos: idPedido }).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
      ]);
      const jwt = await generarJWT(cliente);
      res
        .status(200)
        .send({ 
          codigo: 0,
          mensaje: "Pedido actualizado correctamente", 
          pedido: pedido ,
          datoscliente: cliente,
          tokensesion: jwt
        });
    } catch (error) {
      res
        .status(500)
        .send({ mensaje: "Error al intentar actualizar el pedido" });
    }
  },
  paypalCallback: async function (req, res) {
    try {
      const idPedido = req.query.idPedido;
      const token = req.query.token;
      const payerId = req.query.PayerID;
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(token);
      request.requestBody({});
      const response = await client.execute(request);
      console.log("Redirigiendo a la página de pedido finalizado");
      res
        .status(200)
        .redirect(
          `http://localhost:5173/Pedido/PedidoFinalizado?idPedido=${idPedido}`
        );
    } catch (error) {
      console.log(error);
      res.status(500).send({});
    }
  },
};
