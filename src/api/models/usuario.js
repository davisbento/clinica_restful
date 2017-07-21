const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const usuarioSchema = mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true },
    email_confirm: { type: Boolean, default: false },
    password: { type: String, required: true },
    data_cad: { type: Date, default: Date.now },
    admin: { type: Boolean, default: false},
    token: String,
});

usuarioSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

usuarioSchema.methods.comparePassword = function (password, passwordStored) {
    return bcrypt.compareSync(password, passwordStored, null);
}

module.exports = mongoose.model('Usuario', usuarioSchema);