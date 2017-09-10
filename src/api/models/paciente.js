const mongoose = require('mongoose');


const agendamentoSchema = new mongoose.Schema({
    exame: { type: String },
    start: { type: String },
    end: { type: String },
    title: { type: String },
    status: { type: String, default: 'Agendado' },
    paciente_id: mongoose.Schema.Types.ObjectId
});

const historicoSchema = new mongoose.Schema({
    anamnese: { type: String },
    data_consulta: { type: String }
});

const pacienteSchema = new mongoose.Schema({
    nome: { type: String, required: true, uppercase: true },
    cpf: { type: String, required: true },
    telefone: { type: String },
    recado: { type: String },
    sexo: { type: String },
    email: { type: String },
    data_cad: { type: Date, default: Date.now },
    data_nascimento: { type: String },
    nome_pai: { type: String },
    nome_mae: { type: String },
    profissao: { type: String },
    rua: { type: String },
    bairro: { type: String },
    cidade: { type: String },
    UF: { type: String },
    agendamentos: [agendamentoSchema],
    historico: [historicoSchema]
});

module.exports = mongoose.model('Paciente', pacienteSchema);
