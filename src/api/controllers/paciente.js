const express = require('express');
var moment = require('moment');
const router = express.Router();
const pacienteModel = require('../models/paciente');
const checkAuth = require('../middleware/authMiddleware');

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

        if (payload.cpf === undefined || payload.cpf === '') {
            errors["cpf"] = "O campo cpf não pode ser vazio"
            isValidForm = false;
        }

        if (payload.telefone === undefined || payload.cpf === '') {
            errors["telefone"] = "O campo telefone não pode ser vazio"
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


router.get('/list', function (req, res) {
    pacienteModel.find({}, { "agendamentos": 0 }, function (err, result) {
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

    var p = new pacienteModel();
    var start_date = moment(req.body.start).format();
    // ADICIONA 30MIN A DATA INICIAL
    var end_date = moment(start_date).add(30, 'm');
    end_date = moment(end_date).format();

    pacienteModel.findOne({ 'cpf': req.body.cpf }, function (err, paciente) {
        if (err) {
            res.status(500).json(err);
        }
        else if (!paciente) {
            var dn = req.body.data_nascimento.split("/").reverse().join("-");
            var data_nascimento = dn + 'T00:00:00';

            p.nome = req.body.nome_paciente || '';
            p.cpf = req.body.cpf || '';
            p.telefone = req.body.telefone || '';
            p.recado = req.body.recado || '';
            p.data_nascimento = moment(data_nascimento).format() || '';
            p.nome_mae = req.body.nome_mae || '';
            p.endereco = req.body.endereco || '';
            p.bairro = req.body.bairro || '';
            p.cidade = req.body.cidade || '';
            p.UF = req.body.UF || '';

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
                title: req.body.nome_paciente,
                paciente_id: paciente._id
            };

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
                "agendamentos.$.status": req.body.status
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
router.get('/listarExames', function (req, res) {
    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": { "agendamentos.exame": req.query.nome_exame } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Match the specific array element
            { "$match": { "agendamentos.exame": req.query.nome_exame } },

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
                            "status": "$agendamentos.status"
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
                res.send(err)
            }
            else {
                res.send(docs)
            }
        }
    );
});

router.get('/listarProximosPacientes/', function (req, res) {
    const query = {
        $and: [
            { "agendamentos.start": { $gte: moment().format() } },
            { "agendamentos.status": { $in: ["Aguardando Atendimento", "Em atendimento"] } }
        ]
    }

    pacienteModel.find(
        query,
        { "telefone": 1, "cpf": 1, "nome": 1, "data_nascimento": 1, "profissao": 1, "agendamentos.$": 1, "historico": 1 },
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

router.get('/listarProximosPacientes/:nome', function (req, res) {
    const nome = req.params.nome.toUpperCase()
    const query = {
        "agendamentos.start": { $gte: moment().format() },
        "nome": nome
    }
    pacienteModel.find(
        query,
        { "telefone": 1, "email": 1, "cpf": 1, "nome": 1, "data_nascimento": 1, "agendamentos.$": 1, "historico": 1 },
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

    p.nome = req.body.nome || '';
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

router.get('/summary', function (req, res) {
    var counter = {};
    pacienteModel.aggregate([
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
                res.send(counter);
            });
        }
    });
});

router.get('/list/:id', function (req, res) {
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

router.get('/listarPacienteExame/:agendamento_id', function (req, res) {
    pacienteModel.findOne(
        { "agendamentos._id": req.params.agendamento_id },
        {
            "telefone": 1, "email": 1, "cpf": 1, "nome": 1, "profissao": 1, "recado": 1, "nome_mae": 1,
            "data_nascimento": 1, "agendamentos.$": 1, "historico": 1
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

router.post('/finalizarAtendimento/:agendamento_id', function (req, res) {
    const historico = {
        anamnese: req.body.obs,
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
                res.status(200).json({ "message": "Atendimento finalizado com sucesso!" });
            }
        }
    );
});

module.exports = router;
