const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const Mailjet = require("node-mailjet");
const jsonwebtoken = require("jsonwebtoken");
const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);
const Cliente = require("../modelos/cliente");
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  ),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
async function subirImagen(req) {
  return new Promise((resolve, reject) => {
    const fileName = `Avatares/${req.body.login}.png`; // Modifica el nombre del archivo para que coincida con el email del usuario
    const file = admin.storage().bucket().file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on("error", (err) => {
      reject(err);
    });

    stream.on("finish", async () => {
      await file.makePublic();
      resolve(getPublicUrl(fileName));
    });

    stream.end(req.file.buffer);
  });
}

function getPublicUrl(filename) {
  return `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${filename}`;
}
module.exports = {
  registro: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.body);
      console.log("imagen recibida en el servidor...", req.file);
      //1º manejar la subida de la imagen
      const urlImagen = await subirImagen(req);
      console.log("urlImagen", urlImagen);
      //2º registrar el cliente
      let cliente = await new Cliente({
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        cuenta: {
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10),
          cuentaActiva: false,
          login: req.body.login,
          imagenAvatar: urlImagen,
        },
        telefono: req.body.telefono,
        fechaNacimiento: req.body.fechaNacimiento,
      }).save();
      //3º enviar email de confirmación
      const idCliente = cliente._id;
      const mensaje = mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "alejandromgarcia90@gmail.com",
              Name: "FullMetal Store",
            },
            To: [
              {
                Email: cliente.cuenta.email,
                Name: `${cliente.nombre} ${cliente.apellidos}`,
              },
            ],
            Subject: "Activa tu cuenta",
            TextPart: "Bienvenido a FullMetal Store",
            HTMLPart: `<h3>Bienvenido a FullMetal Store</h3><br/><p>Para activar tu cuenta, haz click en el siguiente enlace: <a href="http://localhost:5000/api/Cliente/ActivarCuenta/${idCliente}">Activar cuenta</a></p>`,
          },
        ],
      });
      mensaje.then((result) => {
        console.log(result.body);
      })
      .catch((err) => {
        console.log(err.statusCode);
      });
      res.status(200).send({
        codigo: 0,
        mensaje: "Cliente registrado correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar registrar cliente",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  comprobarEmail: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.body);
      let cliente = await Cliente.findOne({ "cuenta.email": req.body.email });
      if (cliente) {
        res.status(200).send({
          codigo: 0,
          mensaje: "Email ya registrado",
          error: null,
          otrosdatos: null,
          datoscliente: null,
        });
      }
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar comprobar email",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  comprobarLogin: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.body);
      let cliente = await Cliente.findOne({ "cuenta.login": req.body.login });
      if (cliente) {
        res.status(200).send({
          codigo: 0,
          mensaje: "Login ya registrado",
          error: null,
          otrosdatos: null,
          datoscliente: null,
        });
      }
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar comprobar login",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
};
