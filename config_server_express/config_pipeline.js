const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const config_router_middleware = require("./config_routing_middleware");
const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: "http://localhost:5000/spotify/callback",
});
const renovarToken = () => {
  spotifyApi.clientCredentialsGrant().then(
    function (data) {
      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    function (err) {
      console.log("Algo salió mal al obtener el token de acceso", err);
    }
  );
};
// Renovar el token inmediatamente al iniciar
renovarToken();

// Renovar el token cada 10 minutos
setInterval(renovarToken, 1000 * 60 * 10);
module.exports = function (serverExpress) {
  //Middleware de terceros
  serverExpress.use(cookieParser());
  serverExpress.use(bodyParser.json());
  serverExpress.use(bodyParser.urlencoded({ extended: true }));
  serverExpress.use(cors({ origin: "*" }));
  serverExpress.use((req, res, next) => {
    req.spotifyApi = spotifyApi;
    next();
  });

  //Middleware propios
  config_router_middleware(serverExpress);
};
