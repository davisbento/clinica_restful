const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuario');
const clinicaModel = require('../models/clinica');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');
const fs = require('fs');

function validaLoginForm(payload) {
    var errors = {};
    var isValidForm = true;

    if (Object.keys(payload).length === 0 && payload.constructor === Object) {
        errors["form"] = "O formulário deve ser preenchido!";
        isValidForm = false;
    }
    else {

        if (payload.nome === undefined || payload.nome.length < 3 || payload.nome === '') {
            errors["nome"] = "O campo nome não pode ser vazio ou menos de 3 caracteres"
            isValidForm = false;
        }

        if (payload.email === undefined || payload.email.length < 8 || payload.email === '') {
            errors["email"] = "O campo email não pode ser vazio ou menos de 8 caracteres"
            isValidForm = false;
        }

        if (payload.nome_clinica === undefined || payload.nome_clinica === '') {
            errors["nome_clinica"] = "O nome da clinica pode ser nulo"
            isValidForm = false;
        }

        if (payload.password === undefined || payload.password === '') {
            errors["password"] = "O campo senha não pode ser vazio"
            isValidForm = false;
        }
    }

    return {
        success: isValidForm,
        errors
    }
}


router.get('/uploads/:imagem', function (req, res) {
    var img = req.params.imagem;

    fs.readFile('./uploads/' + img, function (err, conteudo) {
        if (err) {
            res.status(400).json(err);
            return;
        }

        res.writeHead(200, { 'content-type': 'image/png' });
        res.end(conteudo);
    });
});

router.post('/signup', function (req, res) {
    var validationResult = validaLoginForm(req.body);

    if (!validationResult.success) {
        return res.status(400).json({
            errors: validationResult.errors
        })
    }


    usuarioModel.findOne({ "email": req.body.email }, function (err, result) {
        var errors = {};
        if (err) {
            message = err;
            res.status(500).json({ message });
        }
        else if (result) {
            errors.identificador = "E-mail já cadastrado no sistema!";
            message = "Tente um outro endereço de e-mail ou recupere sua senha.";
            res.status(400).json({ errors, message });
        }
        else {
            // CRIA A CLINICA
            var clinica = new clinicaModel();

            clinica.nome = req.body.nome_clinica;
            clinica.cidade = req.body.cidade;
            clinica.endereco = '';
            clinica.telefone = '';

            clinica.save(function (err) {
                if (err) {
                    res.status(500).json({ message: "Erro ao criar clinica" + err });
                }
                else {
                    var usuario = new usuarioModel();

                    usuario.nome = req.body.nome;
                    usuario.email = req.body.email;
                    usuario.password = usuario.generateHash(req.body.password);
                    usuario.token = usuario.generateHash(Date.now());
                    usuario.cargo = req.body.cargo;
                    usuario.clinica_id = clinica._id;
                    usuario.email_confirm = true;
                    usuario.admin = true;

                    var link = req.protocol + '://' +
                        req.hostname + ':4000' + '/auth/confirm_account?token=' +
                        usuario.token;

                    usuario.save(function (err) {
                        if (err) {
                            res.status(500).json({ message: "Erro ao salvar usuário" + err });
                        }
                        else {
                            res.status(200).json({ message: "Clinica criada com sucesso! Confirme seu e-mail antes de logar!" });
                        }
                    });
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
    const pass = req.body.password;

    const identificador = req.body.identificador.toLowerCase();

    const criteria = (identificador.indexOf('@') === -1) ? { username: identificador } : { email: identificador };

    const usuario = new usuarioModel();

    usuarioModel.findOne(criteria, function (err, user) {
        let errors = {};
        if (err) {
            res.status(500).json({ err });
        }
        else if (!user) {
            errors.identificador = "E-mail/usuário não encontrado no sistema";
            message = "Valide o formulário";
            res.status(400).json({ errors, message });
        }
        else if (!usuario.comparePassword(pass, user.password)) {
            errors.password = "A senha não confere";
            message = "Valide o formulário";
            res.status(400).json({ errors, message });
        }
        else if (!user.email_confirm) {
            errors.identificador = "E-mail não confirmado, confirme seu e-mail antes de logar";
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
                clinica_id: user.clinica_id,
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