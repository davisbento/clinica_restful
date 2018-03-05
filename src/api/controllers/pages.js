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
    res.render('home/home');
});

router.get('/pesquisa', function (req, res) {
    res.render('home/pesquisa');
});

router.get('/localizarClinica', function (req, res) {
    const search = [
        { "cidade": req.query.cidade.toUpperCase() },
        { especialidades: req.query.especialidade.toLowerCase() },
        { ativo: true }
    ];

    clinicaModel.find({ $and: search }, function (err, clinica) {
        if (err) {
            res.status(500).json(err);
        }
        else {
            res.json(clinica);
        }
    })
});

router.get('/confirm_account', function (req, res) {
    var token = req.query.token;

    usuarioModel.findOne({ token: token }, function (err, user) {
        if (err) {
            res.status(500).json({ err });
        }
        else if (!user.token) {
            res.render('home/confirm_account', { message: "Token inválido", className: "alert alert-danger" })
        }
        else {
            user.email_confirm = true;
            user.token = 0;
            user.save();
            res.render('home/confirm_account', { message: "E-mail confirmado, efetue o login com seu usuário e senha!", className: "alert alert-success" })
        }
    });
});

router.get('/detalhe/:clinica_id', function (req, res) {
    clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
        if (err) {
            res.render('errors/error', { message: "Erro ao localizar a clinica, tente novamente ou verifique a url!" });
        }
        else {
            res.render('clinica/detalhe', { clinica });
        }
    });
});

module.exports = router;