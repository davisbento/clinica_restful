const mongoose = require('mongoose');

const convenioSchema = new mongoose.Schema({
    nome: { type: String },
    valor: { type: Number },
    medico_id: { type: mongoose.Schema.Types.ObjectId }
})

const clinicaSchema = new mongoose.Schema({
    nome: { type: String },
    configuracoes: [],
    convenios: [convenioSchema]
});

module.exports = mongoose.model('Clinica', clinicaSchema);