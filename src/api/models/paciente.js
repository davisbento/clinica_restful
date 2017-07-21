const mongoose = require('mongoose');


const agendamentoSchema = new mongoose.Schema({
    exame: { type: String },
    start: { type: Date },
    end: { type: Date },
    title: { type: String }
});

const pacienteSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cpf: { type: String },
    telefone: { type: String },
    email: { type: String },
    data_cad: { type: Date, default: Date.now },
    agendamentos: [agendamentoSchema]
});

module.exports = mongoose.model('Paciente', pacienteSchema);