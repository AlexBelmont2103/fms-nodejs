const admin = require("firebase-admin");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const Mailjet = require("node-mailjet");
const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);
const jsonwebtoken = require("jsonwebtoken");
const Cliente = require("../modelos/cliente");
const Direccion = require("../modelos/direccion");
const Pedido = require("../modelos/pedido");
//#region funciones auxiliares
async function borrarImagen(urlImagen) {
  const bucket = admin.storage().bucket();

  // Extrae el nombre del archivo de la URL
  const nombreArchivo = urlImagen.split("/").pop();

  try {
    await bucket.file(nombreArchivo).delete();
    console.log(`Archivo ${nombreArchivo} borrado.`);
  } catch (error) {
    console.error(`Error al borrar el archivo ${nombreArchivo}:`, error);
  }
}
async function subirImagen(req) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const idImagen = uuid.v4(); // Genera un ID único para la imagen
    const fileName = `Avatares/${idImagen}_${timestamp}.png`;
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET.split("/")[2];
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on("error", (err) => {
      req.file.cloudStorageError = err;
      reject(err);
    });

    stream.on("finish", () => {
      req.file.cloudStorageObject = fileName;
      file.makePublic().then(() => {
        req.file.cloudStoragePublicUrl = getPublicUrl(bucket, fileName);
        resolve(req.file.cloudStoragePublicUrl);
      });
    });

    stream.end(req.file.buffer);
  });
}

function getPublicUrl(bucket, filename) {
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}
async function generarJWT(_cliente) {
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
//#endregion
module.exports = {
  registro: async function (req, res) {
    try {
      //1º registrar el cliente
      let cliente = await new Cliente({
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        cuenta: {
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10),
          cuentaActiva: false,
          login: req.body.login,
        },
        telefono: req.body.telefono,
        fechaNacimiento: req.body.fechaNacimiento,
      }).save();

      //2º manejar la subida de la imagen
      const urlImagen = await subirImagen(req);

      // Actualizar el cliente con la url de la imagen
      cliente.cuenta.imagenAvatar = urlImagen;
      await cliente.save();
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
      mensaje
        .then((result) => {
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
  activarCuenta: async function (req, res) {
    try {
      let idCliente = req.params.id;
      let cliente = await Cliente.findByIdAndUpdate(idCliente, {
        "cuenta.cuentaActiva": true,
      });
      res.status(200).redirect("http://localhost:5173/Tienda/Albumes");
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar activar cuenta",
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
  login: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.body);
      let { email, password } = req.body;
      //1º Comprobar si existe el cliente
      let cliente = await Cliente.findOne({ "cuenta.email": email }).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album"}
      ]);
      if (!cliente) throw new Error("Email o contraseña incorrectos");
      //2º Comprobar si la contraseña es correcta
      let iguales = bcrypt.compareSync(password, cliente.cuenta.password);
      if (!iguales) throw new Error("Email o contraseña incorrectos");
      //3º Comprobar si la cuenta está activa
      if (!cliente.cuenta.cuentaActiva) throw new Error("Cuenta no activa");
      //4º Generar token de sesión
      let _jwt = await generarJWT(cliente);

      res.status(200).send({
        codigo: 0,
        mensaje: "Cliente logueado correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar loguear cliente",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
        tokensesion: null,
      });
    }
  },
  recuperarCliente: async function (req, res) {
    try {
      let cliente = await Cliente.findById(req.params.id).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album" }
      ]);
      if (!cliente) throw new Error("Cliente no encontrado");
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Cliente recuperado correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar recuperar cliente",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
        tokensesion: null,
      });
    }
  },
  actualizarDatosCliente: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.payload);
      console.log("datos recibidos en el servidor...", req.body);
      let { nombre, apellidos, email } = req.body;
      let cliente = await Cliente.findByIdAndUpdate(
        req.payload.idCliente,
        {
          nombre: nombre,
          apellidos: apellidos,
          "cuenta.email": email,
        },
        { new: true }
      ).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album" }
      ]);
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Datos cliente actualizados correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar actualizar datos cliente",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  actualizarAvatar: async function (req, res) {
    try {
      //1ºBorrar la imagen anterior
      await borrarImagen(req.body.idCliente);
      //2ºSubir la nueva imagen
      const urlImagen = await subirImagen(req, req.body.idCliente);
      console.log("urlImagen", urlImagen);
      //3ºActualizar el cliente con la nueva imagen
      let cliente = await Cliente.findById(req.body.idCliente).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album" }
      ]);
      console.log("Url de la imagen anterior...", cliente.cuenta.imagenAvatar);
      console.log("Url de la imagen nueva...", urlImagen);
      cliente.cuenta.imagenAvatar = urlImagen;
      await cliente.save();
      let _jwt = await generarJWT(cliente);
      console.log("cliente actualizado...", cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Avatar actualizado correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar actualizar avatar",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  agregarDireccion: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.body);
      let direccion = await new Direccion(req.body).save();
      let cliente = await Cliente.findByIdAndUpdate(
        req.payload.idCliente,
        {
          $push: { direcciones: direccion._id },
        },
        { new: true }
      ).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album" }
      ]);
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Dirección agregada correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar agregar dirección",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  modificarDireccion: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.body);
      let direccion = await Direccion.findByIdAndUpdate(
        req.body._id,
        req.body,
        { new: true }
      );
      let cliente = await Cliente.findById(req.payload.idCliente).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album" }
      ]);
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Dirección modificada correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar modificar dirección",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  eliminarDireccion: async function (req, res) {
    try {
      console.log("datos recibidos en el servidor...", req.body);
      let direccion = await Direccion.findByIdAndDelete(req.body.idDireccion);
      let cliente = await Cliente.findByIdAndUpdate(
        req.payload.idCliente,
        {
          $pull: { direcciones: req.body.idDireccion },
        },
        { new: true }
      ).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album" }
      ]);
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Dirección eliminada correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });
    } catch (error) {
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar eliminar dirección",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  cancelarPedido: async function (req, res) {
    try{
      console.log("datos recibidos en el servidor...", req.body);
      let pedido = await Pedido.findByIdAndUpdate(req.body.idPedido,{
        estadoPedido: "Cancelado"
      },{new:true});

      let cliente = await Cliente.findById(req.payload.idCliente).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album" }
      ]);
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Pedido cancelado correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });

    }catch(error){
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar cancelar pedido",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }

  },
  agregarFavorito: async function (req, res) {
    try{
      console.log("datos recibidos en el servidor...", req.body);
      let cliente = await Cliente.findByIdAndUpdate(req.payload.idCliente,{
        $push: {favoritos: req.body.idAlbum}
      },{new:true}).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album"}
      ]);
      console.log("cliente", cliente);
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Álbum añadido a favoritos correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });

    }catch(error){
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar añadir álbum a favoritos",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  eliminarFavorito: async function (req, res) {
    try{
      console.log("datos recibidos en el servidor...", req.body);
      let cliente = await Cliente.findByIdAndUpdate(req.payload.idCliente,{
        $pull: {favoritos: req.body.idAlbum}
      },{new:true}).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album"}
      ]);
      console.log("cliente", cliente);
      let _jwt = await generarJWT(cliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Álbum eliminado de favoritos correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: cliente,
        tokensesion: _jwt,
      });

    }catch(error){
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar eliminar álbum de favoritos",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
  hacerDireccionPrincipal: async function (req, res) {
    try{
      console.log("datos recibidos en el servidor...", req.body);
      let cliente = await Cliente.findById(req.payload.idCliente).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album"}
      ]);
      console.log("cliente", cliente);
      //1º Recorrer las direcciones del cliente y poner a false la principal
      cliente.direcciones.forEach(async (direccion)=>{
        direccion.esPrincipal = false;
        await direccion.save();
      });
      //2º Poner a true la dirección principal
      let direccion = await Direccion.findByIdAndUpdate
      (req.body.idDireccion,{
        esPrincipal: true
      },{new:true});
      let nueoCliente = await Cliente.findById(req.payload.idCliente).populate([
        { path: "direcciones", model: "Direccion" },
        { path: "pedidos", model: "Pedido" },
        { path: "favoritos", model: "Album"}
      ]);
      let _jwt = await generarJWT(nueoCliente);
      res.status(200).send({
        codigo: 0,
        mensaje: "Dirección principal actualizada correctamente",
        error: null,
        otrosdatos: null,
        datoscliente: nueoCliente,
        tokensesion: _jwt,
      });
    }catch(error){
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar hacer dirección principal",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
      });
    }
  },
};
