const mongoose = require('mongoose');
const prodURL = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@ds125146.mlab.com:25146/my-clinic-db`;
const devURL = 'mongodb://localhost/clinica_restful';
const mongoURL = process.env.NODE_ENV !== 'production' ? devURL : prodURL;

mongoose.Promise = global.Promise
module.exports = mongoose.connect(mongoURL, function (err) {
    if (err) {
        console.log("Erro ao conectar no mongodb: " + err);
    }
    else {
        console.log("Conexão mongoDB efetuada com sucesso!");
    }
});

mongoose.Error.messages.general.required = "O atributo '{PATH}' é obrigatório";
mongoose.Error.messages.Number.min = "O '{VALUE}' informado é menor que o limite de '{MIN}'";
mongoose.Error.messages.Number.max = "O '{VALUE}' informado é maior que o limite de '{MAX}'";
mongoose.Error.messages.String.enum = "'{VALUE}' não é válido para o atributo '{PATH}'";