const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const config_router_middleware = require("./config_routing_middleware");
module.exports = function (serverExpress) {
  //Middleware de terceros
  serverExpress.use(cookieParser());
  serverExpress.use(bodyParser.json());
  serverExpress.use(bodyParser.urlencoded({ extended: true }));
  serverExpress.use(cors({ origin: '*' }));

  //Middleware propios
  config_router_middleware(serverExpress);
};
