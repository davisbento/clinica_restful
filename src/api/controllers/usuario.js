const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuario');
const checkAuth = require('../middleware/authMiddleware');

router.get('/list', checkAuth, function (req, res) {

    usuarioModel.find({}, function (err, result) {
        if (err) {
            res.status(500).json({ err });
        }
        else if (result.length == 0) {
            res.status(200).json({ message: "Nenhum usuário cadastrado" });
        }
        else {
            res.status(200).json(result);
        }
    });

});

router.post('/', function (req, res) {
    var usuario = new usuarioModel();

    usuario.nome = req.body.nome;
    usuario.email = req.body.email || ' ';
    usuario.username = req.body.username;
    usuario.email_confirm = true;
    usuario.clinica_id = req.body.clinica_id;
    usuario.cargo = req.body.cargo;
    usuario.password = usuario.generateHash(req.body.password);

    usuario.save(function (err) {
        if (err) {
            console.log(err)
        }
        else {
            res.status(200).json({ "message": "Usuário criado com sucesso!" });
        }
    })
});

router.get('/list/:id', checkAuth, function (req, res) {
    usuarioModel.findById(req.params.id,
        { nome: 1, email: 1, admin: 1, data_cad: 1, clinica_id: 1, username: 1, cargo: 1, _id: 0 },
        function (err, result) {
            if (err) {
                res.status(500).json({ err });
            }
            else if (!result) {
                res.status(400).json({ message: "Nenhum usuário encontrado" });
            }
            else {
                res.status(200).json(result);
            }
        });
});

router.put('/:id', function (req, res) {
    usuarioModel.findOne({ "_id": req.params.id }, function (err, result) {
        if (err) {
            res.status(500).json({ err });
        }
        else {
            result.nome = req.body.nome || result.nome;
            result.email = req.body.email || result.email;
            result.save(function (err) {
                if (err) {
                    res.status(500).json({ err });
                }
                else {
                    res.status(200).json({ message: "Usuário alterado com sucesso!" })
                }
            });
        }
    });
});

router.delete('/:id', function (req, res) {
    usuarioModel.findByIdAndRemove(req.params.id, function (err, result) {
        if (err) {
            res.status(500).json({ err });
        }
        else {
            var response = {
                message: "Usuario removido com sucesso!",
                id: req.params.id
            };

            res.status(200).json(response);
        }
    });
});

router.get('/listarMedicos/:clinica_id', function (req, res) {
    const criteria = [{ "clinica_id": req.params.clinica_id }, { "cargo": "Medico" }]

    usuarioModel.find({ $and: criteria },
        { "_id": 1, "nome": 1, "clinica_id": 1, "email": 1, "cargo": 1 },
        function (err, medicos) {
            if (err) {
                console.log(err)
            }
            else {
                res.status(200).json(medicos)
            }
        });
});

router.get('/listarUsuarios/:clinica_id', function (req, res) {

    usuarioModel.find(
        { "clinica_id": req.params.clinica_id },
        { "_id": 1, "nome": 1, "clinica_id": 1, "email": 1, "cargo": 1, "username": 1, "admin": 1 },
        function (err, usuarios) {
            if (err) {
                res.status(500).json({ "errors": "Erro: " + err })
            }
            else if (usuarios.length == 0) {
                res.status(500).json({ "errors": "Nenhum usuário encontrado para essa clinica!" })
            }
            else {
                res.status(200).json(usuarios)
            }
        })

});

module.exports = router

