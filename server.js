require("dotenv").config();
const express = require("express");
var serverExpress = express();
const config_pipeline = require("./config_server_express/config_pipeline");

const mongoose = require("mongoose");
const uri = process.env.MONGO_URI;
//Conexion de express
serverExpress.listen(5000, () => console.log("Server running on port 5000"));
config_pipeline(serverExpress);

//Conexion a mongodbatlas con mongoose
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a la base de datos de mongodbatlas..."))
  .catch((error) => console.log("Error al conectar a la base de datos...", error));
