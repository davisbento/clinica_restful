const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuario');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

router.post('/signup', function (req, res) {
    usuarioModel.findOne({ "email": req.body.email }, function (err, result) {
        var errors = {};
        if (err) {
            message = err;
            res.status(500).json({ message });
        }
        else if (result) {
            errors.email = "E-mail já cadastrado no sistema!";
            message = "Tente um outro endereço de e-mail ou recupere sua senha.";
            res.status(400).json({ errors, message });
        }
        else {
            var usuario = new usuarioModel();
            usuario.nome = req.body.nome;
            usuario.email = req.body.email;
            usuario.password = usuario.generateHash(req.body.password);
            usuario.token = usuario.generateHash(Date.now());

            var link = req.protocol + '://' +
                req.hostname + ':4000' + '/auth/confirm_account?token=' +
                usuario.token;

            usuario.save(function (err) {
                if (err) {
                    res.status(500).json({ message: "Erro ao salvar usuário" + err });
                }
                else {
                    res.status(200).json({ message: "Usuário criado com sucesso! Confirme seu e-mail antes de logar!" });
                }
            });

            // emailService.signupEmail(usuario, link, function (result) {
            //     if (!result) {
            //         res.status(400).json({ message: "Erro ao cadastrar usuário, verifique seu email e senha!" });
            //     }
            //     else {
            //         usuario.save(function (err) {
            //             if (err) {
            //                 res.status(500).json({ message: "Erro ao salvar usuário" + err });
            //             }
            //             else {
            //                 res.status(200).json({ message: "Usuário criado com sucesso! Confirme seu e-mail antes de logar!" });
            //             }
            //         });
            //     }
            // });
        }
    })
});

router.post('/authenticate', function (req, res) {
    var pass = req.body.password;
    var email = req.body.email;

    var usuario = new usuarioModel();

    usuarioModel.findOne({ "email": email }, function (err, user) {
        var errors = {};
        if (err) {
            res.status(500).json({ err });
        }
        else if (!user) {
            errors.email = "E-mail não encontrado no sistema";
            message = "Valide o formulário";
            res.status(400).json({ errors, message });
        }
        else if (!usuario.comparePassword(pass, user.password)) {
            errors.password = "A senha não confere";
            message = "Valide o formulário";
            res.status(400).json({ errors, message });
        }
        else if (!user.email_confirm) {
            errors.email = "E-mail não confirmado, confirme seu e-mail antes de logar";
            message = "Valide o formulário";
            res.status(400).json({ errors, message });
        }
        else {
            const payload = {
                sub: user._id,
                //admin: user.admin --> boolean
            };

            // create a token string
            const token = jwt.sign(payload, process.env.SECRET_KEY);

            res.status(200).json({
                token,
                _id: user._id,
                message: "Usuário autenticado, redirecionando..."
            });
        }
    });
});

router.get('/confirm_account', function (req, res) {
    var token = req.query.token;

    usuarioModel.findOne({ token: token }, function (err, user) {
        if (err) {
            res.status(500).json({ err });
        }
        else if (!user.token) {
            res.status(200).json({ message: "Token não encontrado" });
        }
        else {
            user.email_confirm = true;
            user.token = 0;
            user.save();
            res.status(200).json({ message: "Email confirmado com sucesso!" });
        }
    });

});

module.exports = router