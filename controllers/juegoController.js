//#region funciones
//Funcion para elegir cuatro tracks aleatorios
function elegirCuatroTracksAleatorios(tracks) {
  let tracksAleatorios = [];
  let indicesUsados = [];
  for (let i = 0; i < 4; i++) {
    let random;
    do {
      random = Math.floor(Math.random() * tracks.length);
    } while (indicesUsados.includes(random));
    indicesUsados.push(random);
    tracksAleatorios.push(tracks[random]);
  }
  return tracksAleatorios;
}

//#endregion

module.exports = {
  empezarJuego: async function (req, res) {
    try {
      const datosJuego = await req.spotifyApi.getPlaylistTracks(
        process.env.PLAYLIST_ID,
        (options = {
          offset: 0,
        })
      );
      const tracksSimplificados = datosJuego.body.tracks.items.map((track) => {
        return {
          id: track.track.id,
          name: track.track.name,
          preview_url: track.track.preview_url,
          artist: track.track.artists[0].name,
        };
      });
      let tracksAleatorios = elegirCuatroTracksAleatorios(tracksSimplificados);
      //Uno de estos tracks aleatorios será el correcto
      let correcto = Math.floor(Math.random() * tracksAleatorios.length);

      let juego = {
        tracks: tracksAleatorios,
        correcto: tracksAleatorios[correcto].id,
      };
      res.status(200).send({
        codigo: 0,
        mensaje: "Juego iniciado con éxito",
        error: null,
        otrosdatos: juego,
        datoscliente: null,
        jwt: null,
      });
    } catch (error) {
      console.log("Error al intentar empezar el juego...", error);
      res.status(500).send({
        codigo: 1,
        mensaje: "Error al intentar empezar el juego...",
        error: error.message,
        otrosdatos: null,
        datoscliente: null,
        jwt: null,
      });
    }
  },
};
