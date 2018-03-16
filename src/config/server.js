require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const allowCors = require('./cors');
const queryParser = require('express-query-int');
const morgan = require('morgan');
const moment = require('moment');
const server = require('http').createServer(app);  
const io = require('socket.io')(server);
const nunjucks = require('nunjucks');
const multiparty = require('connect-multiparty');
const path = require('path');
const PORT = process.env.PORT || 5000;


app.use(express.static(path.join(__dirname, '../app/public')));

nunjucks.configure(path.join(__dirname, '../app/views'), {
    autoescape: true,
    express: app
});

app.set('view engine', 'html');

// SET MOMENT AS PT-BR LOCALE
moment.locale('pt-br');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(allowCors);
app.use(queryParser());
app.use(morgan('combined'));
app.use(multiparty());

io.on('connection', socket => {
    socket.on('AGENDAMENTO_ATUALIZADO', function(data) {
        socket.broadcast.emit('AGENDAMENTO_ATUALIZADO_SUCESSO')
    })
});

server.listen(PORT, function(){
    console.log('BACKEND RUNNING ON PORT', PORT);
});

module.exports = app;