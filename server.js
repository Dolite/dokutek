/*global
    exports, global, module, process, require, console
*/

var bodyParser = require('body-parser');
var routing = require('./app/routes/index');
var configurationService = require('./app/services/configuration');
var parseArgs = require('minimist');
var express = require('express');
var MongodbServices = require('./app/services/mongodb');
var log4js = require('log4js');
var fs = require('fs');
var https = require('https');
var Exceptions = require('./app/models/exceptions');


/**************** Chargement de la configuration, de manière synchrone ************************/

var args = parseArgs(process.argv.slice(2),{
    "string": 'file',
    "alias": { f: 'file' },
    "default": { file: './config/local/server.json' },
    "stopEarly": true, /* populate _ with first non-option */
    "unknown": function (arg) {
        logger.fatal("ERROR : unknown argument : "+arg);
        process.exit(1);
    } /* invoked on unknown param */
});

var config;
var logger;
var reload = function () {

    if (logger !== undefined) {
        logger.info("--------------------------------------------------------");
        logger.info("Rechargement de la configuration");
    }

    try {
        log4js.configure('./config/local/logs.json');
    }
    catch (e) {
        console.error("Erreur lors de la configuration du logger");
        console.error(e.message);
        process.exit(1);
    }

    logger = log4js.getLogger("logger");

    config = configurationService.load(
        args.file,
        function(err){
            if (err) {process.exit(1);}
            logger.info('Dokutek ready to be used on port ' + port);
        }
    );
};

reload();


/******************************* Interprétation des signaux ***********************************/

var clean = function () {
    logger.info('Shutdown');
    MongodbServices.disconnectDB();
    process.exit(0);
};

process.on('SIGINT', clean);
process.on('SIGTERM', clean);
process.on('SIGQUIT', clean);
process.on('SIGHUP', reload);

/***************************** On configure le serveur maintenant *****************************/

var port = config.server.port;

var app = express();

app.use(bodyParser.urlencoded({
    extended: true,
    parameterLimit: 10000,
    limit: '5mb'
}));
app.use(bodyParser.json({
    parameterLimit: 10000,
    limit: '5mb'
}));
app.use (function (error, req, res, next){
    res.status(400).json(new Exceptions.BadRequestException("Unvalid JSON body"));
});

app.use('/', routing);

app.on('close',clean);


/*
//**************************** Configuration HTTPS *****************************

var options = {};
try {
    var hskey = fs.readFileSync('https-files/dokutek-key.pem');
    options.key = hskey;
    var hscert = fs.readFileSync('https-files/dokutek-cert.pem');
    options.cert = hscert;
}
catch(e) {
    logger.error("Erreur lors du chargement des configurations HTTPS");
    logger.error(e.message);
    process.exit(1);
}

var serverHttps = https.createServer(options, app);
serverHttps.listen(port);
*/

//**************************** Configuration HTTP *****************************

app.listen(port);

