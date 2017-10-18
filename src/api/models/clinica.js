const mongoose = require('mongoose');

const clinicaSchema = new mongoose.Schema({
    nome: { type: String },
    configuracoes: [],
    convenios: []
});

module.exports = mongoose.model('Clinica', clinicaSchema);