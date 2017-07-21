var usuarioController = require('../api/controllers/usuario');
var pacienteController = require('../api/controllers/paciente');
var authController = require('../api/controllers/auth');


module.exports = function(server){
    server.use('/api/usuario', usuarioController);
    server.use('/api/paciente', pacienteController);
    server.use('/', authController);    
}