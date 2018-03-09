const express = require('express');
const moment = require('moment');
const router = express.Router();
const pacienteModel = require('../models/paciente');
const usuarioModel = require('../models/usuario');
const clinicaModel = require('../models/clinica');
const checkAuth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('util');

function validForm(payload) {
    var errors = {};
    var isValidForm = true;

    if (Object.keys(payload).length === 0 && payload.constructor === Object) {
        errors["form"] = "O formulário deve ser preenchido!";
        isValidForm = false;
    }
    else {
        for (atr in payload) {
            if (payload[atr] == '') {
                errors[atr] = `O campo ${atr} não pode ser nulo`
                isValidForm = false;
            }
        }
    }

    return {
        success: isValidForm,
        errors
    }
}

function validPacienteForm(payload) {
    var errors = {};
    var isValidForm = true;

    if (Object.keys(payload).length === 0 && payload.constructor === Object) {
        errors["form"] = "O formulário deve ser preenchido!";
        isValidForm = false;
    }
    else {

        if (payload.cpf === undefined || payload.cpf.length < 11 || payload.cpf === '') {
            errors["cpf"] = "O campo cpf não pode ser vazio ou menos de 11 caracteres"
            isValidForm = false;
        }

        if (payload.telefone === undefined || payload.telefone.length < 8 || payload.telefone === '') {
            errors["telefone"] = "O campo telefone não pode ser vazio ou menos de 8 caracteres"
            isValidForm = false;
        }

        if (payload.data_nascimento === undefined || payload.data_nascimento === '') {
            errors["data_nascimento"] = "O campo data de nascimento não pode ser vazio"
            isValidForm = false;
        }
    }

    return {
        success: isValidForm,
        errors
    }
}

router.get('/listar/', checkAuth, function (req, res) {
    pacienteModel.find({}, function (err, result) {
        if (err) {
            res.status(500).json({ "errors": err });
        }
        else if (!result) {
            res.status(200).json({ data: [], success: true });
        }
        else {
            res.status(200).json({ data: result, success: true });
        }
    });
});

router.get('/listar/:id', checkAuth, function (req, res) {
    pacienteModel.findById(req.params.id, function (err, result) {
        if (err) {
            res.status(500).json({ "errors": err });
        }
        else if (!result) {
            res.status(200).json({ data: [], success: true });
        }
        else {
            res.status(200).json({ data: result, success: true });
        }
    });
});

router.get('/listarPacienteClinica/:clinica_id', checkAuth, function (req, res) {
    pacienteModel.find(
        { "clinica_id": req.params.clinica_id },
        { "agendamentos": 0, "historico": 0 },
        function (err, result) {
            if (err) {
                res.status(500).json({ err });
            }
            else if (result.length == 0) {
                res.status(200).json({ data: [], success: true });
            }
            else {
                res.status(200).json({ data: result, success: true });
            }
        });
});

/*
    @params: nome_paciente, nome_exame, cpf, start, data_nascimento
*/
router.post('/agendarExame/:clinica_id', checkAuth, function (req, res) {
    var validationResult = validPacienteForm(req.body);

    if (!validationResult.success) {
        return res.status(400).json({ "errors": validationResult.errors, "success": false })
    }

    var start_date = moment(req.body.start).format();
    // ADICIONA 30MIN A DATA INICIAL
    var end_date = moment(start_date).add(30, 'm');
    end_date = moment(end_date).format();

    pacienteModel.findOne({ 'cpf': req.body.cpf }, function (err, paciente) {
        if (err) {
            res.status(500).json({ "errors": err });
        }
        else if (!paciente) {
            var p = new pacienteModel();
            var dn = req.body.data_nascimento.split("/").reverse().join("-");
            var data_nascimento = dn + 'T00:00:00';

            p.nome = req.body.nome_paciente || '';
            p.cpf = req.body.cpf || '';
            p.telefone = req.body.telefone || '';
            p.data_nascimento = moment(data_nascimento).format() || '';
            p.clinica_id = req.params.clinica_id;

            p.save(function (err) {
                if (err) {
                    res.status(500).json({ "errors": "Erro ao salvar agendamento" });
                }
                else {
                    var agendamento = {
                        exame: req.body.nome_exame,
                        start: start_date,
                        end: end_date,
                        title: req.body.nome_paciente,
                        convenio_id: req.body.convenio_id,
                        paciente_id: p._id,
                        medico_id: req.body.medico_id
                    };

                    p.agendamentos = [...p.agendamentos, agendamento];

                    p.save();

                    res.status(200).json({ "message": "Paciente e agendamento criado com sucesso!", success: true });


                }
            });
        }
        else {
            var agendamento = {
                exame: req.body.nome_exame,
                start: start_date,
                end: end_date,
                title: req.body.nome_paciente.toUpperCase(),
                convenio_id: req.body.convenio_id,
                paciente_id: paciente._id,
                medico_id: req.body.medico_id
            };

            paciente.nome = req.body.nome_paciente.toUpperCase() || '';
            paciente.cpf = req.body.cpf || '';
            paciente.telefone = req.body.telefone || '';
            paciente.clinica_id = req.params.clinica_id;

            var dn = req.body.data_nascimento.split("/").reverse().join("-");
            var data_nascimento = dn + 'T00:00:00';

            paciente.data_nascimento = moment(data_nascimento).format() || '';

            paciente.agendamentos = [...paciente.agendamentos, agendamento];

            paciente.save(function (err) {
                if (err) {
                    res.status(500).json({ "message": "Erro ao salvar agendamento" });
                }
                else {
                    res.status(200).json({ "message": "Agendamento criado com sucesso!", success: true });
                }
            });
        }
    })

});

router.delete('/:id', function (req, res) {
    pacienteModel.findByIdAndRemove(req.params.id, function (err, result) {
        if (err) {
            res.status(500).json({ "message": err.message });
        }
        else {
            res.status(200).json({ message: "Usuario removido com sucesso!" });
        }
    });
})

router.put('/:id', function (req, res) {
    const validationResult = validPacienteForm(req.body);

    if (!validationResult.success) {
        return res.status(400).json({
            errors: validationResult.errors
        })
    }

    pacienteModel.findById(req.params.id, function (err, paciente) {
        if (err) {
            err["form"] = "Erro ao atualizar paciente"
            res.status(500).json({ "message": err["form"] });
        }
        else if (!paciente) {
            res.status(500).json({ "message": "Erro ao localizar paciente" });
        }
        else {
            // VERIFICA SE O A DATA DE NASCIMENTO JÁ ESTÁ FORMATADA  
            if (req.body.data_nascimento !== '') {
                var index = req.body.data_nascimento.indexOf('T')
                // SE A DATA JÁ TIVER "T" ESTÁ OK, USE A MESMA VINDO DA APLICAÇÃO
                if (index > 0) {
                    paciente.data_nascimento = req.body.data_nascimento;
                }
                // SE NÃO, FORMATE A DATA
                else {
                    var dn = req.body.data_nascimento.split("/").reverse().join("-");
                    var data_nascimento = dn + 'T00:00:00';
                    paciente.data_nascimento = moment(data_nascimento).format() || '';
                }
            }

            paciente.nome = req.body.nome || '';
            paciente.cpf = req.body.cpf || '';
            paciente.email = req.body.email || '';
            paciente.telefone = req.body.telefone || '';
            paciente.recado = req.body.recado || '';
            paciente.sexo = req.body.sexo || ''
            paciente.profissao = req.body.profissao || '';
            paciente.nome_mae = req.body.nome_mae || '';
            paciente.rua = req.body.rua || '';
            paciente.bairro = req.body.bairro || '';
            paciente.cidade = req.body.cidade || '';
            paciente.UF = req.body.UF || '';

            paciente.save(function (err) {
                if (err) {
                    res.status(500).json({ "message": err.message });
                }
                else {
                    res.status(200).json({ "message": "Paciente alterado com sucesso!" });
                }
            })
        }
    })
})

/*
    @params: start, end
*/
router.put('/atualizarExame/:id', checkAuth, function (req, res) {
    var start_date = moment(req.body.start).format();
    var end_date = moment(req.body.end).format();
    pacienteModel.findOneAndUpdate(
        { "agendamentos._id": req.params.id },
        {
            "$set": {
                "agendamentos.$.start": start_date,
                "agendamentos.$.end": end_date,
                "agendamentos.$.status": req.body.status,
                "agendamentos.$.convenio": req.body.convenio
            }
        },
        function (err, result) {
            if (err) {
                res.status(500).json({ "message": "Erro ao atualizar agendamento" });
            }
            else if (!result) {
                res.status(500).json({ "message": "Nenhum agendamento encontrado" });
            }
            else {
                res.status(200).json({ data: { "message": "Agendamento atualizado com sucesso!" }, success: true });
            }
        }
    );
});

/*
    @params: ?nome_exame=String
*/
router.get('/listarExames/:clinica_id', checkAuth, function (req, res) {
    const rules = [
        { "agendamentos.exame": req.query.nome_exame },
        { "clinica_id": mongoose.Types.ObjectId(req.params.clinica_id) }
    ]

    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": { $and: rules } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                "$group": {
                    _id: null,
                    agendamentos: {
                        "$push":
                            {
                                "exame": "$agendamentos.exame",
                                "agendamento_id": "$agendamentos._id",
                                "paciente_id": "$agendamentos.paciente_id",
                                "title": "$agendamentos.title",
                                "start": "$agendamentos.start",
                                "end": "$agendamentos.end",
                                "status": "$agendamentos.status",
                                "convenio": "$agendamentos.convenio"
                            }
                    }
                }
            },
            {
                "$project": { _id: 0, agendamentos: 1 }
            }
        ],
        function (err, docs) {
            if (err) {
                res.json({ "message": err.message })
            }
            else {
                res.json({ data: docs, success: true })
            }
        });
});

router.get('/listarExamesMedico/:medico_id', checkAuth, function (req, res) {
    const medico_id = mongoose.Types.ObjectId(req.params.medico_id)

    const rules = [{ "agendamentos.exame": req.query.nome_exame }, { "agendamentos.medico_id": medico_id }]

    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": { $and: rules } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                "$group": {
                    _id: null,
                    agendamentos: {
                        "$push":
                            {
                                "exame": "$agendamentos.exame",
                                "agendamento_id": "$agendamentos._id",
                                "paciente_id": "$agendamentos.paciente_id",
                                "medico_id": "$agendamentos.medico_id",
                                "title": "$agendamentos.title",
                                "start": "$agendamentos.start",
                                "end": "$agendamentos.end",
                                "status": "$agendamentos.status",
                                "convenio": "$agendamentos.convenio"
                            }
                    }
                }
            },
            {
                "$project": { _id: 0, agendamentos: 1 }
            }
        ],
        function (err, docs) {
            if (err) {
                res.status(500).json({ "message": err.message })
            }
            else {
                res.json({ data: docs, success: true })
            }
        });
})

router.get('/pesquisarPaciente/:clinica_id/:busca', function (req, res) {
    const clinica_id = req.params.clinica_id;
    const busca = req.params.busca.toUpperCase();

    pacienteModel.find({ "clinica_id": clinica_id }, function (err, pacientes) {
        if (err) {
            res.status(500).json({ "errors": "Erro ao localizar paciente" })
        }
        else {
            // FILTRA TODOS PACIENTES COM A STRING DA BUSCA NO NOME
            function filtroLike(paciente) {
                if (paciente.nome.indexOf(busca) >= 0) {
                    return true;
                }
                else {
                    return false;
                }
            }

            // RETORNA O ARRAY FILTRADO APENAS COM OS PACIENTES COM NOME LIKE 'BUSCA'  
            const pacienteFiltrado = pacientes.filter(filtroLike)

            res.status(200).json({ data: pacienteFiltrado, success: true });
        }
    });
})

router.get('/listarProximosPacientes/:medico_id', function (req, res) {
    const medico_id = req.params.medico_id
    var d = new Date()

    const query = {
        $and: [
            { "agendamentos.start": { $gte: moment(d.setHours(0, 0, 0, 0)).format() } },
            { "agendamentos.status": { $in: ["Aguardando Atendimento", "Em Atendimento"] } },
            { "agendamentos.medico_id": medico_id }
        ]
    }

    pacienteModel.find(
        query,
        {
            "telefone": 1, "status": 1, "cpf": 1, "nome": 1, "data_nascimento": 1,
            "profissao": 1, "medico_id": 1, "agendamentos.$": 1, "historico": 1
        },
        { sort: { "agendamentos.start": 1 } },
        function (err, paciente) {
            if (err) {
                res.status(500).json({ "message": err.message });
            }
            else if (paciente.length > 0) {
                res.status(200).json({ data: paciente, success: true })
            }
            else {
                res.status(200).json({ data: [], success: true })
            }
        });
});

router.get('/listarProximosPacientes/:medico_id/:nome', function (req, res) {
    const busca = req.params.nome.toUpperCase()
    const id = req.params.medico_id
    const query = {
        $and: [
            { "agendamentos.start": { $gte: moment().format() } },
            { "agendamentos.status": { $in: ["Aguardando Atendimento", "Em atendimento"] } },
            { "medico_id": id }
        ]
    }
    pacienteModel.find(
        query,
        {
            "telefone": 1, "url_imagem": 1, "status": 1, "cpf": 1, "nome": 1, "data_nascimento": 1,
            "profissao": 1, "medico_id": 1, "agendamentos.$": 1, "historico": 1
        },
        { sort: { "agendamentos.start": 1 } },
        function (err, paciente) {
            if (err) {
                res.status(500).json({ err });
            }
            else if (paciente.length > 0) {

                // FILTRA TODOS PACIENTES COM A STRING DA "BUSCA" NO NOME
                function filtroLike(paciente) {
                    if (paciente.nome.indexOf(busca) >= 0) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }

                const pacienteFiltrado = paciente.filter(filtroLike)

                res.status(200).json({ data: pacienteFiltrado, success: true })
            }
            else {
                res.status(200).json([])
            }
        });
});

router.post('/:clinica_id', function (req, res) {

    const validationResult = validPacienteForm(req.body);

    if (!validationResult.success) {
        return res.status(400).json({ errors: validationResult.errors })
    }

    var p = new pacienteModel();
    var dn = req.body.data_nascimento.split("/").reverse().join("-");
    var data_nascimento = dn + 'T00:00:00';

    p.nome = req.body.nome.toUpperCase() || '';
    p.cpf = req.body.cpf || '';
    p.email = req.body.email || '';
    p.telefone = req.body.telefone || '';
    p.recado = req.body.recado || '';
    p.sexo = req.body.sexo || ''
    p.profissao = req.body.profissao || 'NÃO INFORMADO';
    p.data_nascimento = moment(data_nascimento).format() || '';
    p.nome_mae = req.body.nome_mae || '';
    p.rua = req.body.rua || '';
    p.bairro = req.body.bairro || '';
    p.cidade = req.body.cidade || '';
    p.clinica = req.params.clinica_id;
    p.UF = req.body.UF || '';

    p.save(function (err) {
        if (err) {
            const errors = {}
            errors["form"] = err.message
            res.status(500).json({ "message": errors });
        }
        else {
            res.status(200).json({ "message": "Usuário criado com sucesso!", success: true });
        }
    })

});

router.get('/summary/:clinica_id', checkAuth, function (req, res) {
    const clinica_id = mongoose.Types.ObjectId(req.params.clinica_id);
    let counter = {};
    pacienteModel.aggregate([
        { "$match": { "clinica_id": clinica_id } },
        // unwind binding collection
        { $unwind: "$agendamentos" },

        // group and count by relevant attributes
        {
            $group: {
                _id: 1,
                count: { $sum: 1 }
            }
        }
    ], function (err, docs) {
        if (err) {
            res.status(500).json({ message: err.message })
        }
        else if (docs.length == 0) {
            res.status(200).json({ data: [], success: true })
        }
        else {
            counter["agendamentos"] = docs[0].count;
            pacienteModel.count({}, function (err, dados) {
                counter["pacientes"] = dados;
                res.json({ data: counter, success: true });
            });
        }
    });
});

router.get('/listarPacienteExame/:agendamento_id', checkAuth, function (req, res) {
    pacienteModel.findOne(
        { "agendamentos._id": req.params.agendamento_id },
        {
            "telefone": 1, "email": 1, "cpf": 1, "nome": 1, "profissao": 1, "recado": 1, "nome_mae": 1,
            "data_nascimento": 1, "sexo": 1, "rua": 1, "endereco": 1, "bairro": 1, "cidade": 1,
            "UF": 1, "medico_id": 1, "agendamentos.$": 1, "historico": 1
        },
        function (err, paciente) {
            if (err) {
                res.status(500).json({ "message": err.message });
            }
            else if (!paciente) {
                res.status(500).json({ "message": "Nenhum paciente encontrado" });
            }
            else {
                res.json({ data: paciente, success: true })
            }
        });
});

router.post('/salvarImagemAtendimento/:historico_id', checkAuth, (req, res) => {
    const id = req.params.historico_id;

    const url_imagem = id + '_atendimentoscan.jpeg';

    var base64Data = req.body.picture.replace(/^data:image\/(png|jpeg);base64,/, "");

    fs.writeFile('./uploads/' + url_imagem, base64Data, 'base64',
        function (err) {
            if (err) {
                res.status(500).json({ "errors": err })
            }
            pacienteModel.findOneAndUpdate(
                { "historico._id": id },
                { $set: { "historico.$.url_imagem": url_imagem } },
                function (err, result) {
                    if (err) {
                        res.status(500).json({ "message": err.message })
                    }
                    else {
                        res.status(200).json({ "message": "Imagem salva com sucesso!", success: true })
                    }
                })
        });
})

router.post('/alterarAgendamento/:agendamento_id', checkAuth, function (req, res) {
    pacienteModel.findOneAndUpdate(
        { "agendamentos._id": req.params.agendamento_id },
        {
            "$set": { "agendamentos.$.status": req.query.status }
        },
        function (err, result) {
            if (err) {
                res.status(500).json({ "message": "Erro ao atualizar agendamento" });
            }
            else if (!result) {
                res.status(500).json({ "message": "Nenhum agendamento encontrado" });
            }
            else {
                res.status(200).json(
                    {
                        "message": "Atendimento atualizado com sucesso!",
                        success: true
                    }
                );
            }
        }
    );
});

router.post('/finalizarAtendimento/:agendamento_id', checkAuth, function (req, res) {
    const id = mongoose.Types.ObjectId();

    const historico = {
        _id: id,
        anamnese: req.body.obs,
        ref_din_esf_esq: req.body.rdesf_esq,
        ref_din_cil_esq: req.body.rdcil_esq,
        ref_din_eixo_esq: req.body.rdeixo_esq,
        ref_din_av_esq: req.body.rdAV_esq,
        ref_est_esf_esq: req.body.reesf_esq,
        ref_est_cil_esq: req.body.recil_esq,
        ref_est_eixo_esq: req.body.reeixo_esq,
        ref_est_av_esq: req.body.reAV_esq,
        ref_din_esf_dir: req.body.rdesf_dir,
        ref_din_cil_dir: req.body.rdcil_dir,
        ref_din_eixo_dir: req.body.rdeixo_dir,
        ref_din_av_dir: req.body.rdAV_dir,
        ref_est_esf_dir: req.body.reesf_dir,
        ref_est_cil_dir: req.body.recil_dir,
        ref_est_eixo_dir: req.body.reeixo_dir,
        ref_est_av_dir: req.body.reAV_dir,
        adicao: req.body.adicao,
        url_imagem: '',
        data_consulta: moment().format()
    }

    pacienteModel.findOneAndUpdate(
        { "agendamentos._id": req.params.agendamento_id },
        {
            "$set": { "agendamentos.$.status": "Finalizado" },
            "$push": { "historico": historico }
        },
        function (err, result) {
            if (err) {
                res.status(500).json({ "message": "Erro ao atualizar agendamento" });
            }
            else if (!result) {
                res.status(500).json({ "message": "Nenhum agendamento encontrado" });
            }
            else {
                res.status(200).json(
                    {
                        "message": "Atendimento finalizado com sucesso!",
                        historico_id: id,
                        success: true
                    }
                );
            }
        }
    );
});

router.delete('/removerHistorico/:historico_id', function (req, res) {
    pacienteModel.findOne({ "historico._id": req.params.historico_id },
        {
            "cpf": 1, "nome": 1, "profissao": 1, "idade": 1, "historico": 1
        },
        function (err, paciente) {
            if (err) {
                res.status(500).json({ "errors": err });
            }
            else {
                const filtrarHistorico = (element) => {
                    if (element._id != req.params.historico_id) {
                        return true
                    }
                    return false
                }

                paciente.historico = paciente.historico.filter(filtrarHistorico);

                paciente.save(function (err) {
                    if (err) {
                        res.status(500).json({ "message": "Erro ao salvar historico alterado" });
                    }
                    else {
                        res.status(200).json({ "message": "Histórico removido com sucesso!", "paciente": paciente, success: true })
                    }
                })
            }
        })

});

router.get('/contagemPorConvenioMes/:clinica_id', checkAuth, function (req, res) {
    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": { "clinica_id": mongoose.Types.ObjectId(req.params.clinica_id) } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                $group: {
                    _id: { id: "$agendamentos.convenio_id", month: "$agendamentos.start" },
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, _id: "$_id.id", "mes": { $substr: ["$_id.month", 5, 2] }, count: "$count" } },
        ],
        function (err, result) {
            if (err) {
                res.json(err)
            }
            else if (result.length == 0) {
                res.status(200).json({ data: [], success: true })
            }
            else {
                // res.status(200).json({ data: result, success: true })
                clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
                    if (err) {
                        res.status(500).json({ "message": err.message })
                    }
                    else {
                        const resultado = []
                        for (i = 0; i < result.length; i++) {
                            for (j = 0; j < clinica.convenios.length; j++) {
                                if (result[i]._id.toString() == clinica.convenios[j]._id.toString()) {
                                    const value = Number(clinica.convenios[j].valor) * Number(result[i].count)
                                    const name = result[i].mes
                                    const obj = { value, name }
                                    resultado.push(obj)
                                }
                            }
                        }

                        res.status(200).json({ data: resultado, success: true })
                    }
                })
            }
        });
})

router.get('/contagemPorConvenio/:clinica_id', checkAuth, function (req, res) {
    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": { "clinica_id": mongoose.Types.ObjectId(req.params.clinica_id) } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                $group: {
                    _id: "$agendamentos.convenio_id",
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, _id: "$_id", count: "$count" } },
        ],
        function (err, result) {
            if (err) {
                res.json(err)
            }
            else if (result.length == 0) {
                res.status(200).json({ data: [], success: true })
            }
            else {
                // res.status(200).json({ data: result, success: true })
                clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
                    if (err) {
                        res.status(500).json({ "message": err.message })
                    }
                    else {
                        const resultado = []
                        for (i = 0; i < result.length; i++) {
                            for (j = 0; j < clinica.convenios.length; j++) {
                                if (result[i]._id.toString() == clinica.convenios[j]._id.toString()) {
                                    const name = clinica.convenios[j].nome
                                    const value = Number(clinica.convenios[j].valor) * Number(result[i].count)
                                    const obj = { name, value }
                                    resultado.push(obj)
                                }
                            }
                        }

                        res.status(200).json({ data: resultado, success: true })
                    }
                })
            }
        });
})

module.exports = router