const mongoose = require('mongoose')
const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost/clinica_restful'
mongoose.Promise = global.Promise
module.exports = mongoose.connect(mongoURL, function(err){
    if(err){
        console.log("Erro ao conectar no mongodb: " + err);
    }
    else {
        console.log("Conexão mongoDB efetuada com sucesso!");
    }
});

mongoose.Error.messages.general.required = "O atributo '{PATH}' é obrigatório"
mongoose.Error.messages.Number.min = "O '{VALUE}' informado é menor que o limite de '{MIN}'"
mongoose.Error.messages.Number.max = "O '{VALUE}' informado é maior que o limite de '{MAX}'"
mongoose.Error.messages.String.enum = "'{VALUE}' não é válido para o atributo '{PATH}'"