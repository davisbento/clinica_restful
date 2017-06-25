const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuario');

router.get('/', function(req, res){

    usuarioModel.find({}, function(err, result){
        if(err) {
            res.status(500).json({err});
        }
        else if(result.length == 0){
            res.status(200).json({message: "Nenhum usuário cadastrado"});
        }
        else{
            res.status(200).json(result);
        }
    });

});

router.post('/', function(req, res){
    var usuario = new usuarioModel();
    usuario.nome = req.body.nome;
    usuario.email = req.body.email;
    usuario.password = usuario.generateHash(req.body.password);
    usuario.token = usuario.generateHash(Date.now());

    usuario.save(function(err){
        if(err){
            res.status(500).json({err});
        }
        else{
            res.status(200).json({"message": "Usuário criado com sucesso!"});
        }
    })
});

router.get('/:id', function(req, res){
    usuarioModel.findById(req.params.id, function(err, result){
        if(err){            
            res.status(500).json({err});
        }
        else if(!result){
            res.status(200).json({message: "Nenhum usuário encontrado"});
        }
        else{          
            res.status(200).json(result);            
        }
    });
});

router.put('/:id', function(req, res){
    usuarioModel.findOne({"_id": req.params.id}, function(err, result){
        if(err){
            res.status(500).json({err});
        }
        else{
            result.nome = req.body.nome || result.nome;
            result.email = req.body.email || result.email;
            result.save(function(err){
                if(err){
                    res.status(500).json({err});
                }
                else{
                    res.status(200).json({message: "Usuário alterado com sucesso!"})
                }
            });     
        }
    });
});

router.delete('/:id', function(req, res){
    usuarioModel.findByIdAndRemove(req.params.id, function(err, result){
        if(err){
            res.status(500).json({err});
        }
        else{
            var response = {
                message: "Usuario removido com sucesso!",
                id: req.params.id
            };

            res.status(200).json(response);
        }
    });
});


module.exports = router

