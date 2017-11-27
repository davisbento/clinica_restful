const express = require('express');
const moment = require('moment');
const router = express.Router();
const pacienteModel = require('../models/paciente');
const usuarioModel = require('../models/usuario');
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

module.exports = router;