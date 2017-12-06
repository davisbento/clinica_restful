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

router.get('/home', function (req, res) {
    res.render('home/home')
})

router.get('/pesquisa', function (req, res) {
    res.render('home/pesquisa')
})


router.get('/localizarClinica', function (req, res) {
    console.log('localizarCLinica')
    const search = [{ "cidade": req.query.cidade.toUpperCase() },
    { especialidades: req.query.especialidade.toLowerCase() }]
    clinicaModel.find({ $and: search }, function (err, clinica) {
        if (err) {
            res.status(500).json(err)
        }
        else {
            res.json(clinica)
        }
    })
})

module.exports = router;