const routingCliente = require('./routingCliente');

module.exports = function (serverExpress) {
    serverExpress.use('/api/Cliente', routingCliente)
};