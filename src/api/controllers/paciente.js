const express = require('express');
var moment = require('moment');
const router = express.Router();
const pacienteModel = require('../models/paciente');
const checkAuth = require('../middleware/authMiddleware');

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

router.post('/agendarExame', function (req, res) {
    /*
        @params: nome_paciente, nome_exame, cpf, start
    */
    var p = new pacienteModel();
    var start_date = req.body.start;
    console.log(req.body.start);
    // ADICIONA 30MIN A DATA INICIAL
    var end_date = moment(start_date).add(30, 'm');
    console.log(end_date);


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

router.get('/listarExames/', function (req, res) {
    /*
        @params: ?nome_exame=String
    */
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
    var paciente = new pacienteModel();
    paciente.nome = req.body.nome;
    paciente.telefone = req.body.telefone;
    paciente.email = req.body.email;

    paciente.save(function (err) {
        if (err) {
            res.status(500).json({ err });
        }
        else {
            res.status(200).json({ "message": "Usuário criado com sucesso!" });
        }
    })

});

router.get('/count', function (req, res) {
    pacienteModel.count({}, function (err, result) {
        if (err) {
            res.status(500).json({ err });
        }
        else {
            res.status(200).json(result);
        }
    })
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
