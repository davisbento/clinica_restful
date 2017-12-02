const mongoose = require('mongoose');

const convenioSchema = new mongoose.Schema({
    nome: { type: String, uppercase: true },
    valor: { type: Number },
    medico_id: { type: mongoose.Schema.Types.ObjectId }
})

const clinicaSchema = new mongoose.Schema({
    nome: { type: String, uppercase: true },
    cidade: { type: String, uppercase: true },
    endereco: { type: String, uppercase: true },
    telefone: { type: String },
    especialidades: [],
    convenios: [convenioSchema]
});

module.exports = mongoose.model('Clinica', clinicaSchema);