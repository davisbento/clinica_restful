const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const router = express.Router();
const clinicaModel = require('../models/clinica');
const usuarioModel = require('../models/usuario');
const emailService = require('../services/emailService');
const checkAuth = require('../middleware/authMiddleware');

router.get('/listar/:clinica_id', checkAuth, function (req, res) {
    clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
        if (err) {
            res.status(500).json({ message: err });
        }
        else {
            res.status(200).json({ data: clinica, success: true });
        }
    })
});

router.put('/atualizarClinica/:clinica_id', checkAuth, function (req, res) {
    console.log(req.body)
    clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
        if (err) {
            res.status(500).json({ "message": "Erro ao localizar a clinica" });
        }
        else {

            clinica.nome = req.body.nome;
            clinica.cidade = req.body.cidade;
            clinica.endereco = req.body.endereco;
            clinica.telefone = req.body.telefone;


            if (req.body.especialidades.length > 0) {
                // limpa o array para receber um novo
                clinica.especialidades = [];
                // percorre o array e insere cada um no banco  
                clinica.especialidades = clinica.especialidades.concat(req.body.especialidades);
            }
            else {
                // se o array estiver vazio, zera o array atual
                clinica.especialidades = [];
            }

            clinica.save(function (err) {
                if (err) {
                    res.status(500).json({ "message": err.message });
                }
                else {
                    res.status(200).json({ "message": "Clinica alterada com sucesso!", success: true });
                }
            })
        }

    })

})

router.post('/cadastrarConvenio/:clinica_id', checkAuth, function (req, res) {
    clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
        if (err) {
            res.status(500).json({ "message": err.message });
        }
        else {
            const convenios = {
                nome: req.body.nome,
                valor: req.body.valor || 0,
                medico_id: req.body.medico_id
            };

            clinica.convenios = [...clinica.convenios, convenios];

            clinica.save(function (err) {
                if (err) {
                    res.status(500).json({ "message": err.message })
                }
                else {
                    res.status(200).json({ "message": "Convenio criado com sucesso!", success: true });
                }
            })


        }
    })
})

router.get('/listarConveniosPorMedico/:medico_id', checkAuth, function (req, res) {
    const id = req.params.medico_id;
    usuarioModel.findById(id, function (err, medico) {
        if (err) {
            res.status(500).json({ "message": err.message });
        }
        else if (!medico) {
            res.status(200).json({ data: [], success: true })
        }
        else {
            clinicaModel.findById(medico.clinica_id, function (err, clinica) {
                if (err) {
                    res.status(500).json({ "message": err.message });
                }
                else {
                    const convenios = clinica.convenios.filter(e => e.medico_id == id)
                    res.json({ data: convenios, success: true })
                }
            })
        }
    })
})

router.get('/listarConveniosClinica/:clinica_id', checkAuth, function (req, res) {
    clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
        if (err) {
            res.status(500).json({ "message": err.message });
        }
        else {
            const convenios = clinica.convenios.map(e => e.nome);
            res.json({ data: convenios, success: true });
        }
    })
})

router.put('/atualizarConvenio/:convenio_id', checkAuth, function (req, res) {
    clinicaModel.findOneAndUpdate(
        { "convenios._id": req.params.convenio_id },
        {
            "$set": {
                "convenios.$.nome": req.body.nome.toUpperCase(),
                "convenios.$.valor": req.body.valor,
                "convenios.$.medico_id": req.body.medico_id
            }
        },
        function (err, doc) {
            if (err) {
                res.status(500).json({ message: err.message })
            }
            else {
                res.status(200).json({ message: "Convênio atualizado com sucesso!", success: true })
            }
        }
    );
})

router.post('/emailContato', function (req, res) {
    const nome = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const message = req.body.message;

    const emailMessage = `
        'Nome: '${nome}
        'Email: '${email}
        'Telefone: '${phone}
        ----------------------
        ${message}
    `

    emailService.emailContato(email, emailMessage, function (result) {
        if (!result) {
            res.status(400).json({ message: "Erro ao enviar e-mail" });
        }
        else {
            res.status(200).json({ message: "Email enviado com sucesso. Obrigado pelo contato!" });
        }
    });
})

module.exports = router