const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuario');
const checkAuth = require('../middleware/authMiddleware');

function validaUsuarioForm(payload) {
    var errors = {};
    var isValidForm = true;

    if (Object.keys(payload).length === 0 && payload.constructor === Object) {
        errors["form"] = "O formulário deve ser preenchido!";
        isValidForm = false;
    } else {

        if (payload.nome === undefined || payload.nome.length < 4 || payload.nome === '') {
            errors["nome"] = "O campo nome não pode ser vazio ou menos de 4 caracteres"
            isValidForm = false;
        }

        if (payload.username === undefined || payload.username.length < 6 || payload.username === '') {
            errors["username"] = "O campo username não pode ser vazio ou menos de 6 caracteres"
            isValidForm = false;
        }

        if (payload.password === undefined || payload.password.length < 6 || payload.password === '') {
            errors["password"] = "O campo password não pode ser vazio ou menos de 6 caracteres"
            isValidForm = false;
        }
    }

    return {
        success: isValidForm,
        errors
    }
}

router.get('/list', checkAuth, function (req, res) {
    usuarioModel.find({}, function (err, result) {
        if (err) {
            res.status(500).json({
                err
            });
        } else if (result.length == 0) {
            res.status(200).json({
                message: "Nenhum usuário cadastrado",
                success: true
            });
        } else {
            res.status(200).json({
                data: result,
                success: true
            });
        }
    });
});

router.post('/', function (req, res) {
    const validationResult = validaUsuarioForm(req.body)

    if (!validationResult.success) {
        return res.status(400).json({
            errors: validationResult.errors
        })
    }

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
            res.status(500).json({
                message: err.message
            });
        } else {
            res.status(200).json({
                "message": "Usuário criado com sucesso!",
                success: true
            });
        }
    })
});

router.get('/list/:id', checkAuth, function (req, res) {
    usuarioModel.findById(req.params.id, {
            nome: 1,
            email: 1,
            admin: 1,
            data_cad: 1,
            clinica_id: 1,
            username: 1,
            cargo: 1,
            _id: 0
        },
        function (err, result) {
            if (err) {
                res.status(500).json({
                    err
                });
            } else if (!result) {
                res.status(400).json({
                    message: "Nenhum usuário encontrado"
                });
            } else {
                res.status(200).json({
                    data: result,
                    success: true
                });
            }
        });
});

router.put('/:id', function (req, res) {
    usuarioModel.findOne({
        "_id": req.params.id
    }, function (err, usuario) {
        if (err) {
            res.status(500).json({
                err
            });
        } else {
            usuario.nome = req.body.nome || usuario.nome;
            usuario.email = req.body.email || usuario.email;
            usuario.password = req.body.password || usuario.password
            usuario.username = req.body.username || usuario.username
            usuario.cargo = req.body.cargo || usuario.cargo

            usuario.save(function (err) {
                if (err) {
                    res.status(500).json({
                        message: err.message
                    });
                } else {
                    res.status(200).json({
                        message: "Usuário alterado com sucesso!",
                        success: true
                    })
                }
            });
        }
    });
});

router.delete('/:id', function (req, res) {
    usuarioModel.findByIdAndRemove(req.params.id, function (err, result) {
        if (err) {
            res.status(500).json({
                err
            });
        } else {
            var response = {
                message: "Usuario removido com sucesso!",
                id: req.params.id
            };

            res.status(200).json({
                data: response,
                success: true
            });
        }
    });
});

router.get('/listarMedicos/:clinica_id', checkAuth, function (req, res) {
    const criteria = [{
        "clinica_id": req.params.clinica_id
    }, {
        "cargo": "Medico"
    }]

    usuarioModel.find({
            $and: criteria
        }, {
            "_id": 1,
            "nome": 1,
            "clinica_id": 1,
            "email": 1,
            "cargo": 1
        },
        function (err, medicos) {
            if (err) {
                res.status(500).json({
                    "message": "Erro ao localizar médico" + err
                });
            } else {
                res.status(200).json({
                    data: medicos,
                    success: true
                })
            }
        });
});

router.get('/listarUsuarios/:clinica_id', checkAuth, function (req, res) {

    usuarioModel.find({
            "clinica_id": req.params.clinica_id
        }, {
            "token": 0,
            "password": 0
        },
        function (err, usuarios) {
            if (err) {
                res.status(500).json({
                    "message": "Erro: " + err
                })
            } else if (usuarios.length == 0) {
                res.status(500).json({
                    "message": "Nenhum usuário encontrado para essa clinica!"
                })
            } else {
                res.status(200).json({
                    data: usuarios,
                    success: true
                })
            }
        })

});

router.put('/changeAdmin/:usuario_id', checkAuth, function (req, res) {
    usuarioModel.findOneAndUpdate({
            "_id": req.params.usuario_id
        }, {
            $set: {
                "admin": req.body.isAdmin
            }
        },
        function (err, usuario) {
            if (err) {
                res.status(500).json({
                    "message": "Erro: " + err
                })
            } else {
                res.status(200).json({
                    success: true,
                    message: "Usuário alterado com sucesso!"
                })
            }
        })
});

router.put('/changeAtivo/:usuario_id', function (req, res) {
    usuarioModel.findOneAndUpdate({
            "_id": req.params.usuario_id
        }, {
            $set: {
                "ativo": req.body.isAtivo
            }
        },
        function (err, usuario) {
            if (err) {
                res.status(500).json({
                    "message": "Erro: " + err
                })
            } else {
                res.status(200).json({
                    message: "Usuário alterado com sucesso!",
                    success: true
                })
            }
        }
    )
});

router.get('/pesquisarUsuario/:clinica_id/:busca', function (req, res) {
    const clinica_id = req.params.clinica_id;
    const busca = req.params.busca.toUpperCase();

    usuarioModel.find({
        "clinica_id": clinica_id
    }, function (err, usuarios) {
        if (err) {
            res.status(500).json({
                "errors": "Medico não localizado com essa clinica"
            })
        } else {
            // FILTRA TODOS PACIENTES COM A STRING DA BUSCA NO NOME
            function filtroLike(usuario) {
                if (usuario.nome.indexOf(busca) >= 0) {
                    return true;
                } else {
                    return false;
                }
            }

            // RETORNA O ARRAY FILTRADO APENAS COM OS PACIENTES COM NOME LIKE 'BUSCA'  
            const usuarioFiltrado = usuarios.filter(filtroLike)

            res.status(200).json({
                data: usuarioFiltrado,
                success: true
            });
        }
    })
})

module.exports = router