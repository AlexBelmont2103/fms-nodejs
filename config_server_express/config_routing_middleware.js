const routingCliente = require('./routingCliente');
const routingTienda = require('./routingTienda');
const routingPedido = require('./routingPedido');
const routingJuego = require('./routingJuego');

module.exports = function (serverExpress) {
    serverExpress.use('/api/Cliente', routingCliente);
    serverExpress.use('/api/Tienda', routingTienda);
    serverExpress.use('/api/Pedido', routingPedido);
    serverExpress.use('/api/Juego',routingJuego);
};