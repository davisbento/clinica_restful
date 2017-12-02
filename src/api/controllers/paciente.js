const express = require('express');
const moment = require('moment');
const router = express.Router();
const pacienteModel = require('../models/paciente');
const usuarioModel = require('../models/usuario');
const checkAuth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('util')

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

const encontrarMedicosPorClinica = (clinica_id) => {
    const rules = [{ "clinica_id": clinica_id }, { "cargo": "Medico" }];
    let medicosIds = [];

    usuarioModel.find({ $and: rules }, function (err, medicos) {
        if (err) {
            console.log(err)
        }
        else {
            medicosIds = medicos.map(e => e._id)
            console.log(medicosIds)
            return medicosIds
        }
    })
}

router.get('/listar/', function (req, res) {
    pacienteModel.find({}, function (err, result) {
        if (err) {
            res.status(500).json({ err });
        }
        else if (!result) {
            res.status(400).json({ message: "Nenhum paciente encontrado" });
        }
        else {
            res.status(200).json(result);
        }
    });
});

router.get('/listar/:id', function (req, res) {
    pacienteModel.findById(req.params.id, function (err, result) {
        if (err) {
            res.status(500).json({ err });
        }
        else if (!result) {
            res.status(400).json({ message: "Nenhum paciente encontrado" });
        }
        else {
            res.status(200).json(result);
        }
    });
});

router.get('/teste/:clinica_id', function (req, res) {
    const { medicosIds } = encontrarMedicosPorClinica(req.params.clinica_id)
    res.json(medicosIds)
})


router.get('/listarPacienteClinica/:clinica_id', function (req, res) {
    const criteria = [{ "clinica_id": req.params.clinica_id }, { "cargo": "Medico" }]
    usuarioModel.find({ $and: criteria }, function (err, dados) {
        if (err) {
            res.json(err)
        }
        else {
            const medicosIds = dados.map(e => e._id)
            pacienteModel.find(
                { "medico_id": { $in: medicosIds } },
                { "agendamentos": 0, "historico": 0 },
                function (err, result) {
                    if (err) {
                        res.status(500).json({ err });
                    }
                    else if (result.length == 0) {
                        res.status(200).json({ message: "Nenhum paciente cadastrado" });
                    }
                    else {
                        res.status(200).json(result);
                    }
                });
        }
    })
});

/*
    @params: nome_paciente, nome_exame, cpf, start, data_nascimento
*/
router.post('/agendarExame', function (req, res) {

    var validationResult = validPacienteForm(req.body);

    if (!validationResult.success) {
        return res.status(400).json({
            errors: validationResult.errors
        })
    }

    var start_date = moment(req.body.start).format();
    // ADICIONA 30MIN A DATA INICIAL
    var end_date = moment(start_date).add(30, 'm');
    end_date = moment(end_date).format();

    pacienteModel.findOne({ 'cpf': req.body.cpf }, function (err, paciente) {
        if (err) {
            res.status(500).json(err);
        }
        else if (!paciente) {
            var p = new pacienteModel();
            var dn = req.body.data_nascimento.split("/").reverse().join("-");
            var data_nascimento = dn + 'T00:00:00';

            p.nome = req.body.nome_paciente || '';
            p.cpf = req.body.cpf || '';
            p.telefone = req.body.telefone || '';
            p.data_nascimento = moment(data_nascimento).format() || '';
            p.medico_id = req.body.medico_id;

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
                        convenio: req.body.convenio,
                        paciente_id: p._id
                    };

                    p.agendamentos.push(agendamento);

                    p.save();

                    res.status(200).json({ "message": "Paciente e agendamento criado com sucesso!" });


                }
            });
        }
        else {
            var agendamento = {
                exame: req.body.nome_exame,
                start: start_date,
                end: end_date,
                title: req.body.nome_paciente.toUpperCase(),
                convenio: req.body.convenio.toUpperCase(),
                paciente_id: paciente._id
            };

            paciente.nome = req.body.nome_paciente.toUpperCase() || '';
            paciente.cpf = req.body.cpf || '';
            paciente.telefone = req.body.telefone || '';
            paciente.medico_id = req.body.medico_id;

            var dn = req.body.data_nascimento.split("/").reverse().join("-");
            var data_nascimento = dn + 'T00:00:00';

            paciente.data_nascimento = moment(data_nascimento).format() || '';

            paciente.agendamentos.push(agendamento);

            paciente.save(function (err) {
                if (err) {
                    res.status(500).json({ "errors": "Erro ao salvar agendamento" });
                }
                else {
                    res.status(200).json({ "message": "agendamento criado com sucesso!" });
                }
            });
        }
    })

});

router.delete('/:id', function (req, res) {
    pacienteModel.findByIdAndRemove(req.params.id, function (err, result) {
        if (err) {
            res.status(500).json({ err });
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
            res.status(500).json({ "errors": err["form"] });
        }
        else if (!paciente) {
            res.status(400).json({ "error": "Erro ao localizar paciente" });
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
                    res.status(500).json({ err });
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
router.put('/atualizarExame/:id', function (req, res) {
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
                res.status(500).json({ "errors": "Erro ao atualizar agendamento" });
            }
            else if (!result) {
                res.status(400).json({ "errors": "Nenhum agendamento encontrado" });
            }
            else {
                res.status(200).json({ "message": "Agendamento atualizado com sucesso!" });
            }
        }
    );
});

/*
    @params: ?nome_exame=String
*/
router.get('/listarExames/:clinica_id', function (req, res) {
    const clinica_id = mongoose.Types.ObjectId(req.params.clinica_id);
    const criteria = [{ "clinica_id": clinica_id }, { "cargo": "Medico" }];

    usuarioModel.find({ $and: criteria }, function (err, dados) {
        if (err) {
            res.status(500).json({ "errors": "Medico não localizado com essa clinica" })
        }
        else {
            const medicosIds = dados.map(e => mongoose.Types.ObjectId(e._id))

            const rules = [{ "agendamentos.exame": req.query.nome_exame }, { "medico_id": { $in: medicosIds } }]

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
                        res.json(err)
                    }
                    else {
                        res.json(docs)
                    }
                });
        }
    });
});

router.get('/listarExamesMedico/:medico_id', function (req, res) {
    const medico_id = mongoose.Types.ObjectId(req.params.medico_id)

    const rules = [{ "agendamentos.exame": req.query.nome_exame }, { "medico_id": medico_id }]

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
                                "medico_id": "$medico_id",
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
                res.json(err)
            }
            else {
                res.json(docs)
            }
        });
})

router.get('/pesquisarPaciente/:clinica_id/:busca', function (req, res) {
    const clinica_id = req.params.clinica_id;
    const busca = req.params.busca.toUpperCase();
    const criteria = [{ "clinica_id": clinica_id }, { "cargo": "Medico" }];

    usuarioModel.find({ $and: criteria }, function (err, dados) {
        if (err) {
            res.status(500).json({ "errors": "Medico não localizado com essa clinica" })
        }
        else {
            const medicosIds = dados.map(e => mongoose.Types.ObjectId(e._id))

            pacienteModel.find({ "medico_id": { $in: medicosIds } }, function (err, pacientes) {
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

                    res.status(200).json(pacienteFiltrado);
                }
            });

        }
    })
})

router.get('/listarProximosPacientes/:medico_id', function (req, res) {
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
                res.status(200).json(paciente)
            }
            else {
                res.status(200).json([])
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

                res.status(200).json(pacienteFiltrado)
            }
            else {
                res.status(200).json([])
            }
        });
});

router.post('/', function (req, res) {

    const validationResult = validPacienteForm(req.body);

    if (!validationResult.success) {
        return res.status(400).json({
            errors: validationResult.errors
        })
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
    p.UF = req.body.UF || '';

    p.save(function (err) {
        if (err) {
            const errors = {}
            errors["form"] = err
            res.status(500).json(errors);
        }
        else {
            res.status(200).json({ "message": "Usuário criado com sucesso!" });
        }
    })

});

router.get('/summary/:clinica_id', function (req, res) {
    const id = mongoose.Types.ObjectId(req.params.clinica_id);
    let counter = {};
    const criteria = [{ "clinica_id": req.params.clinica_id }, { "cargo": "Medico" }]
    usuarioModel.find({ $and: criteria }, function (err, dados) {
        if (err) {
            res.json(err)
        }
        else {
            const medicosIds = dados.map(e => mongoose.Types.ObjectId(e._id))
            pacienteModel.find(
                { "medico_id": { $in: medicosIds } },
                { "agendamentos": 0 },
                function (err, result) {
                    if (err) {
                        res.status(500).json({ err });
                    }
                    else if (result.length == 0) {
                        res.status(200).json({ message: "Nenhum paciente cadastrado" });
                    }
                    else {
                        pacienteModel.aggregate([
                            { "$match": { "medico_id": { $in: medicosIds } } },
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
                                res.send(err)
                            }
                            else {
                                counter["agendamentos"] = docs[0].count;
                                pacienteModel.count({}, function (err, dados) {
                                    counter["pacientes"] = dados;
                                    res.json(counter);
                                });
                            }
                        });
                    }
                });
        }
    })
});

router.get('/listarPacienteExame/:agendamento_id', function (req, res) {
    pacienteModel.findOne(
        { "agendamentos._id": req.params.agendamento_id },
        {
            "telefone": 1, "email": 1, "cpf": 1, "nome": 1, "profissao": 1, "recado": 1, "nome_mae": 1,
            "data_nascimento": 1, "sexo": 1, "rua": 1, "endereco": 1, "bairro": 1, "cidade": 1,
            "UF": 1, "medico_id": 1, "agendamentos.$": 1, "historico": 1
        },
        function (err, paciente) {
            if (err) {
                res.status(500).json({ err });
            }
            else if (!paciente) {
                res.status(400).json({ message: "Nenhum paciente encontrado" });
            }
            else {
                res.json(paciente)
            }
        });
});

router.post('/salvarImagemAtendimento/:historico_id', (req, res) => {
    const id = req.params.historico_id;

    const url_imagem = id + '_atendimentoscan.jpeg';

    var base64Data = req.body.picture.replace(/^data:image\/(png|jpeg);base64,/, "");

    fs.writeFile('./uploads/' + url_imagem, base64Data, 'base64',
        function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('SUCESSO!')
            pacienteModel.findOneAndUpdate(
                { "historico._id": id },
                { $set: { "historico.$.url_imagem": url_imagem } },
                function (err, result) {
                    if (err) {
                        res.status(500).json({ "errors": err })
                    }
                    else {
                        res.status(200).json({ "message": "Imagem salva com sucesso!" })
                    }
                })
        });
})

router.post('/finalizarAtendimento/:agendamento_id', function (req, res) {
    const id = mongoose.Types.ObjectId();

    const historico = {
        _id: id,
        anamnese: req.body.obs,
        ref_din_esf: req.body.rdesf,
        ref_din_cil: req.body.rdcil,
        ref_din_eixo: req.body.rdeixo,
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
                res.status(500).json({ "errors": "Erro ao atualizar agendamento" });
            }
            else if (!result) {
                res.status(400).json({ "errors": "Nenhum agendamento encontrado" });
            }
            else {
                res.status(200).json(
                    {
                        "message": "Atendimento finalizado com sucesso!",
                        historico_id: id
                    }
                );
            }
        }
    );
});

module.exports = router;
