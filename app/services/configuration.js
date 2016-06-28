/*global
    exports, global, module, process, require, console
*/

var MongodbServices = require('./mongodb');
var fs = require('fs');
var path = require('path');
var logger = require('log4js').getLogger("logger");

var port;
var documentsDirectory;

module.exports.getPort = function () {
    return port;
};

module.exports.getDirectory = function () {
    return documentsDirectory;
};

function load (file, callback) {

    file = path.resolve(process.cwd(), file);

    try {
        fs.statSync(file);
    } catch (e1) {
        logger.fatal("Configuration file does not exist : " + file);
        callback(1);
        return;
    }

    logger.info("Loading server configuration from file " + file);

    var config;
    try{
        config = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e2) {
        logger.fatal("Configuration file is not a valid JSON file : " + file);
        callback(1);
        return;
    }

    // Le port

    if (config.server.port === undefined || isNaN(parseFloat(config.server.port)) || ! isFinite(config.server.port)) {
        logger.fatal("Port have to be provided in the configuration file (server / port) and have to be an integer : " + file);
        callback(1);
        return;
    }

    port = config.server.port;

    // Le répertoire de stockage des documents (fichiers)

    if (config.files.directory === undefined) {
        logger.fatal("Directory to store documents have to be provided in the configuration file (files / directory) : " + file);
        callback(1);
        return;
    }

    documentsDirectory = path.resolve(process.cwd(), config.files.directory);

    try {
        fs.statSync(documentsDirectory);
    } catch (e1) {
        logger.fatal("Documents' directory does not exist : " + documentsDirectory);
        callback(1);
        return;
    }

    // Les paramètres de connexion à la base MongoDB

    if (config.db.host === undefined) {
        logger.fatal("DB host have to be provided in the configuration file (db / host) : " + file);
        callback(1);
        return;
    }

    if (config.db.port === undefined) {
        logger.fatal("DB port have to be provided in the configuration file (db / port) : " + file);
        callback(1);
        return;
    }

    if (config.db.database === undefined) {
        logger.fatal("DB name have to be provided in the configuration file (db / database) : " + file);
        callback(1);
        return;
        callback
    }

    MongodbServices.connectDB(
        config.db,
        callback
    );

    return config;
}

module.exports.load = load;
