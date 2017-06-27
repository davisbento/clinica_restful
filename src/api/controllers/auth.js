const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuario');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

router.post('/signup', function(req, res){
    usuarioModel.findOne({"email": req.body.email}, function(err, result){
        if(err){
            res.status(500).json({err});
        }
        else if(result){
            res.status(200).json({message: "Email já cadastrado, tente outro endereço de e-mail"});
        }
        else{
            var usuario = new usuarioModel();                    
            usuario.nome = req.body.nome;
            usuario.email = req.body.email;
            usuario.password = usuario.generateHash(req.body.password);
            usuario.token = usuario.generateHash(Date.now());

            var link = req.protocol + '://' + 
                       req.hostname + ':3000' + '/api/auth/confirm_account?token=' +
                       usuario.token;

            emailService.signupEmail(usuario, link, function(result){
                if(!result){
                    res.status(500).json({message: "Erro ao cadastrar usuário" + err});
                }
                else{
                    usuario.save(function(err){
                        if(err){
                            res.status(500).json({message: "Erro ao salvar usuário" + err});
                        }
                        else{
                            res.status(200).json({message: "Usuário salvo com sucesso!"});
                        }
                    });
                }
            });
        }
    })
});

router.post('/authenticate', function(req, res){
    var pass = req.body.password;
    var email = req.body.email;

    var usuario = new usuarioModel();

    usuarioModel.findOne({"email": email}, function(err, user){
        if(err){
            res.status(500).json({err});
        }
        else if(!user){
            res.status(500).json({message: "Email não encontrado no sistema!"});
        }
        else if(!usuario.comparePassword(pass, user.password)){
            res.status(500).json({message: "A senha não confere!"});
        }
        else if(!user.email_confirm){
            res.status(500).json({message: "Email não confirmado, confirme seu email antes de logar!"});
        }
        else{
            const payload = {
                sub: user._id
            };

            // create a token string
            const token = jwt.sign(payload, process.env.SECRET_KEY);

            res.status(200).json({
                 token,
                 message: "Usuário autenticado, redirecionando..."
            });
        }
    });
});

router.get('/confirm_account', function(req, res){
    var token = req.query.token;

    usuarioModel.findOne({token: token}, function(err, user){
        if(err){
            res.status(500).json({err});
        }
        else if(!user.token){
            res.status(200).json({message: "Token não encontrado"});
        }
        else{
            user.email_confirm = true;
            user.token = 0;
            user.save();
            res.status(200).json({message: "Email confirmado com sucesso!"});
        }
    });

});

module.exports = router