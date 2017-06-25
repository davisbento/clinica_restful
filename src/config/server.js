const port = 3000;

require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const server = express();
const allowCors = require('./cors');
const queryParser = require('express-query-int');
const logger = require('morgan');

server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());
server.use(allowCors);
server.use(queryParser());
server.use(logger('dev'));

server.listen(port, function(){
    console.log(`BACKEND RUNNING ON PORT ${port}`);
})

module.exports = server