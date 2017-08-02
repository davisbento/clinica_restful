const mongoose = require('mongoose');


const agendamentoSchema = new mongoose.Schema({
    exame: { type: String },
    start: { type: String },
    end: { type: String },
    title: { type: String }
});

const pacienteSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cpf: { type: String, required: true },
    telefone: { type: String },
    email: { type: String },
    data_cad: { type: Date, default: Date.now },
    agendamentos: [agendamentoSchema]
});

module.exports = mongoose.model('Paciente', pacienteSchema);
