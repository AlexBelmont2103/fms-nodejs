const geoapi_key = process.env.GEOAPI_KEY;
module.exports = {
    recuperarProvincias: async function(req, res) {
        try {
            const axios = require('axios');
            const respuesta = await axios.get(`https://apiv1.geoapi.es/provincias?type=JSON&key=${geoapi_key}&sandbox=0`);
            const provincias = respuesta.data.data;
            res.status(200).send({provincias: provincias});
        } catch (error) {
            res.status(500).send([]);
        }
    },
    recuperarMunicipios: async function(req, res) {
        try {
            const axios = require('axios');
            let CPRO = req.params.CPRO;
            console.log(CPRO);
            const respuesta = await axios.get(`https://apiv1.geoapi.es/municipios?CPRO=${CPRO}&type=JSON&key=${geoapi_key}&sandbox=0`);
            const municipios = respuesta.data.data;
            res.status(200).send({municipios: municipios});
        } catch (error) {
            res.status(500).send([]);
        }
    }

}