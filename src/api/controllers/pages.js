const express = require('express');
const moment = require('moment');
const router = express.Router();
const pacienteModel = require('../models/paciente');
const usuarioModel = require('../models/usuario');
const clinicaModel = require('../models/clinica');
const checkAuth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');


router.get('/', function (req, res) {
    res.render('home/home')
})

router.get('/pesquisa', function(req, res) {
    res.render('home/pesquisa', {
        dados: [
            {
                clinica: 'Clinica Teste',
                cidade: 'Sorocaba'
            },
            {
                clinica: 'Clinica Teste 2',
                cidade: 'Votorantim'
            }
        ]
    })
})


router.get('/localizarClinica', function (req, res) {
    const search = [{ "cidade": req.query.cidade.toUpperCase() },
    { especialidades: req.query.especialidade }]
    clinicaModel.find({ $and: search }, function (err, clinica) {
        if (err) {
            res.status(500).json(err)
        }
        else {
            res.status(200).json(clinica)
        }
    })
})

module.exports = router;