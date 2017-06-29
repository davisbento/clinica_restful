var usuarioController = require('../api/controllers/usuario');
var authController = require('../api/controllers/auth')

module.exports = function(server){
    server.use('/api/usuario', usuarioController);
    server.use('/', authController);
}