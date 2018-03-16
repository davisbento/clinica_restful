var usuarioController = require('../api/controllers/usuario');
var pacienteController = require('../api/controllers/paciente');
var clinicaController = require('../api/controllers/clinica')
var financeiroController = require('../api/controllers/financeiro')
var authController = require('../api/controllers/auth');
var dashboardController = require('../api/controllers/dashboard');
var pagesController = require('../api/controllers/pages');

module.exports = function (server) {
    server.use('/api/usuario', usuarioController);
    server.use('/api/paciente', pacienteController);
    server.use('/api/clinica', clinicaController);
    server.use('/api/financeiro', financeiroController);
    server.use('/api/dashboard', dashboardController);
    server.use('/api/', authController);
    server.use('/', pagesController);
}