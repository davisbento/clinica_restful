const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const router = express.Router();
const clinicaModel = require('../models/clinica');
const usuarioModel = require('../models/usuario');

router.get('/listar/:clinica_id', function (req, res) {
    clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
        if (err) {
            res.status(500).json({ err });
        }
        else {
            res.status(200).json(clinica)
        }
    })
});

router.post('/cadastrarConvenio/:clinica_id', function (req, res) {
    clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
        if (err) {
            res.status(500).json({ err });
        }
        else {
            const convenios = {
                nome: req.body.nome_convenio,
                valor: req.body.valor_convenio || 0,
                medico_id: req.body.medico_id
            };

            // const index = clinica.convenios.findIndex(e => e.nome = convenios.nome)

            // if (index > 0) {
            //     clinica.convenios.push(convenios);
            // }

            clinica.convenios.push(convenios);

            clinica.save(function (err) {
                if (err) {
                    res.status(500).json({ err })
                }
                else {
                    res.status(200).json({ "message": "Convenio criado com sucesso!" });
                }
            })


        }
    })
})

router.get('/listarConveniosPorMedico/:medico_id', function (req, res) {
    const id = req.params.medico_id;
    usuarioModel.findById(id, function (err, medico) {
        if (err) {
            console.log(err)
        }
        else if (!medico) {
            res.status(200).json({ convenios: [] })
        }
        else {
            clinicaModel.findById(medico.clinica_id, function (err, clinica) {
                if (err) {
                    console.log(err)
                }
                else {
                    const convenios = clinica.convenios.filter(e => e.medico_id == id)
                    res.json(convenios)
                }
            })
        }
    })
})

module.exports = router