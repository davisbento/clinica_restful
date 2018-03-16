const mongoose = require('mongoose');

const notificacoesSchema = mongoose.Schema({
    conteudo: { type: String },
    tipo: { type: String, enum: ['Usuarios', 'Pacientes', 'Medicos'] },
    clinica_id: { type: mongoose.Schema.Types.ObjectId },
    data_cad: { type: Date, default: Date.now},
    lida: { type: Boolean, default: false }
})

module.exports = mongoose.model('Notificacoes', usuarioSchema);