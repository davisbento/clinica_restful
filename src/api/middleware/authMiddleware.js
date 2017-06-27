const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){
     var token = req.headers.authorization;

     if(token){
        token = token.split(' ')[1];
        jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {      
            if (err) {
                return res.json({ success: false, message: 'Falha ao tentar autenticar o token! ' + err });    
            } else {
            //se tudo correr bem, salver a requisição para o uso em outras rotas
            req.decoded = decoded;    
            next();
            }
        });
     }

     else{
         res.send({message: "Nenhum token existente"});
     }

}