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



router.get('/list', checkAuth, function (req, res) {
    pacienteModel.find({}, function (err, result) {
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
    @params: nome_paciente, nome_exame, cpf, start
*/
router.post('/agendarExame', function (req, res) {

    var validationResult = validForm(req.body);

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
            p.nome = req.body.nome_paciente;
            p.cpf = req.body.cpf;

            p.save(function (err) {
                if (err) {
                    res.status(500).json({ "error": "Erro ao salvar agendamento" });
                }
                else {
                    var agendamento = {
                        exame: req.body.nome_exame,
                        start: start_date,
                        end: end_date,
                        title: req.body.nome_paciente
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
                title: req.body.nome_paciente
            };

            paciente.agendamentos.push(agendamento);

            paciente.save(function (err) {
                if (err) {
                    res.status(500).json({ "error": "Erro ao salvar agendamento" });
                }
                else {
                    res.status(200).json({ "message": "agendamento criado com sucesso!" });
                }
            });
        }
    })

});


/*
    @params: start, end
*/
router.put('/atualizarExame/:id', function (req, res) {
    pacienteModel.findOneAndUpdate(
        { "agendamentos._id": req.params.id },
        {
            "$set": {
                "agendamentos.$.start": req.body.start,
                "agendamentos.$.end": req.body.end
            }
        },
        function (err, result) {
            if (err) {
                res.status(500).json({ "error": "Erro ao atualizar agendamento" });
            }
            else if (!result) {
                res.status(400).json({ error: "Nenhum agendamento encontrado" });
            }
            else {
                res.status(200).json({ message: "Agendamento atualizado com sucesso!" });
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
                            "title": "$agendamentos.title",
                            "start": "$agendamentos.start",
                            "end": "$agendamentos.end"
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


router.post('/', function (req, res) {

    const validationResult = validForm(req.body);

    if (!validationResult.success) {
        return res.status(400).json({
            errors: validationResult.errors
        })
    }

    var paciente = new pacienteModel();
    paciente.nome = req.body.nome;
    paciente.telefone = req.body.telefone;
    paciente.email = req.body.email;
    paciente.cpf = req.body.cpf;

    paciente.save(function (err) {
        if (err) {
            res.status(500).json({ err });
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

module.exports = router;
