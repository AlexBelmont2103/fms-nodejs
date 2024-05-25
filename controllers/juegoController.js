const SpotifyWebApi = require('spotify-web-api-node');
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: 'http://localhost:5000/spotify/callback'
  });

module.exports = {
    empezarJuego: async function (req, res) {
        try{
            const datosJuego = spotifyApi.getPlaylistTracks(process.env.PLAYLIST_ID, { limit: 4 });
            console.log('datosJuego',datosJuego.body);
            const cancionElegida = data.body.items[Math.floor(Math.random()* data.body.items.length)];
            res.status(200).json({
                canciones: datosJuego.body.items.map(item => item.track),
                cancionElegida: cancionElegida
            });
        }catch(error){
            console.log('Error al intentar empezar el juego...',error);
            res.status(500).send(
                {codigo:1,
                    mensaje:'Error al intentar empezar el juego...', 
                    error:error.message,
                    otrosdatos:null,
                    datoscliente:null,
                    jwt: null
                });
        }
    }
};