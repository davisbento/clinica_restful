const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
    exame: { type: String },
    start: { type: String },
    end: { type: String },
    title: { type: String, uppercase: true },
    convenio_id: mongoose.Schema.Types.ObjectId,
    status: { type: String, default: 'Agendado' },
    paciente_id: mongoose.Schema.Types.ObjectId,
    medico_id: mongoose.Schema.Types.ObjectId
});

const historicoSchema = new mongoose.Schema({
    anamnese: { type: String },
    url_imagem: { type: String },
    ref_din_esf_esq: { type: String },
    ref_din_cil_esq: { type: String },
    ref_din_eixo_esq: { type: String },
    ref_din_av_esq: { type: String },
    ref_est_esf_esq: { type: String },
    ref_est_cil_esq: { type: String },
    ref_est_eixo_esq: { type: String },
    ref_est_av_esq: { type: String },
    ref_din_esf_dir: { type: String },
    ref_din_cil_dir: { type: String },
    ref_din_eixo_dir: { type: String },
    ref_din_av_dir: { type: String },
    ref_est_esf_dir: { type: String },
    ref_est_cil_dir: { type: String },
    ref_est_eixo_dir: { type: String },
    ref_est_av_dir: { type: String },
    adicao: { type: String },
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
    clinica_id: { type: mongoose.Schema.Types.ObjectId },
    agendamentos: [agendamentoSchema],
    historico: [historicoSchema]
});

module.exports = mongoose.model('Paciente', pacienteSchema);
