const mongoose = require('mongoose');

const convenioSchema = new mongoose.Schema({
    nome: { type: String, uppercase: true, required: true },
    valor: { type: Number },
    medico_id: { type: mongoose.Schema.Types.ObjectId }
})

const clinicaSchema = new mongoose.Schema({
    nome: { type: String, uppercase: true, required: true },
    cidade: { type: String, uppercase: true, required: true },
    endereco: { type: String, uppercase: true },
    ativo: { type: Boolean, default: true },
    telefone: { type: String },
    especialidades: [],
    imgs: [],
    convenios: [convenioSchema]
});

module.exports = mongoose.model('Clinica', clinicaSchema);