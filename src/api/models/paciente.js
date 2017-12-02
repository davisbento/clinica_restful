const mongoose = require('mongoose');


const agendamentoSchema = new mongoose.Schema({
    exame: { type: String, uppercase: true  },
    start: { type: String },
    end: { type: String },
    title: { type: String, uppercase: true  },
    convenio: { type: String },
    status: { type: String, default: 'Agendado' },
    paciente_id: mongoose.Schema.Types.ObjectId
});

const historicoSchema = new mongoose.Schema({
    anamnese: { type: String },
    url_imagem: { type: String },
    ref_din_esf: { type: String },
    ref_din_cil: { type: String },
    ref_din_eixo: { type: String },
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
    profissao: { type: String, uppercase: true },
    rua: { type: String, uppercase: true },
    bairro: { type: String, uppercase: true },
    cidade: { type: String, uppercase: true },
    UF: { type: String, uppercase: true },
    medico_id: { type: mongoose.Schema.Types.ObjectId },
    agendamentos: [agendamentoSchema],
    historico: [historicoSchema]
});

module.exports = mongoose.model('Paciente', pacienteSchema);
