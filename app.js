/*global
    exports, global, module, process, require, console
*/

var express = require('express');
var bodyParser = require('body-parser');
var routing = require('./app/routes/index');
var configurationService = require('./app/services/configuration');
var parseArgs = require('minimist');
var MongodbServices = require('./app/services/mongodb');
var log4js = require('log4js');


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

// Case insensitive for request query
app.use(function(req, res, next) {
    for (var key in req.query) { 
        req.query[key.toLowerCase()] = req.query[key];
    }
    next();
});

app.use('/', routing);

app.on('close',clean);

app.listen(port);
