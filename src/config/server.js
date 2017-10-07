require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const allowCors = require('./cors');
const queryParser = require('express-query-int');
const logger = require('morgan');
const moment = require('moment');
const server = require('http').createServer(app);  
const io = require('socket.io')(server);
const PORT = process.env.PORT || 5000;


// SET MOMENT AS PT-BR LOCALE
moment.locale('pt-br');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(allowCors);
app.use(queryParser());
app.use(logger('dev'));

io.on('connection', socket => {
    console.log('USER CONNECTED');

    socket.on('AGENDAMENTO_INSERIDO', function(data) {

        console.log('DADOS RECEBIDOS COM SUCESSO!')

        socket.broadcast.emit('AGENDAMENTO_INSERIDO_SUCESSO')

    })
    
})

server.listen(PORT, function(){
    console.log('BACKEND RUNNING ON PORT', PORT);
})

module.exports = app
