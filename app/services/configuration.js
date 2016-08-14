/*global
    exports, global, module, process, require, console
*/

var MongodbServices = require('./mongodb');
var fs = require('fs');
var path = require('path');
var logger = require('log4js').getLogger("logger");

var port;
module.exports.getPort = function () {
    return port;
};

var documentsDirectory;
module.exports.getDirectory = function () {
    return documentsDirectory;
};

var keywordsFile;
var keywordsObj;
module.exports.getKeywords = function () {
    return keywordsObj;
};
module.exports.notAKeyword = function (k) {
    return ! keywordsObj.hasOwnProperty(k);
};

var fieldsFile;
var fieldsObj;
module.exports.getFields = function () {
    return fieldsObj;
};
module.exports.notAField = function (f) {
    return ! fieldsObj.hasOwnProperty(f);
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

    if (config.server.directory === undefined) {
        logger.fatal("Directory to store documents have to be provided in the configuration file (server / directory) : " + file);
        callback(1);
        return;
    }

    documentsDirectory = path.resolve(process.cwd(), config.server.directory);

    try {
        fs.statSync(documentsDirectory);
    } catch (e3) {
        logger.fatal("Documents' directory does not exist : " + documentsDirectory);
        callback(1);
        return;
    }

    // Le fichier des mots clé

    if (config.server.keywords === undefined) {
        logger.fatal("Keywords file have to be provided in the configuration file (server / keywords) : " + file);
        callback(1);
        return;
    }

    keywordsFile = path.resolve(process.cwd(), config.server.keywords);

    try {
        fs.statSync(keywordsFile);
    } catch (e4) {
        logger.fatal("Keywords' file does not exist : " + keywordsFile);
        callback(1);
        return;
    }

    try{
        keywordsObj = JSON.parse(fs.readFileSync(keywordsFile, 'utf8'));
    } catch (e5) {
        logger.fatal("Keywords file is not a valid JSON file : " + keywordsFile);
        callback(1);
        return;
    }

    // Le fichier des champs

    if (config.server.fields === undefined) {
        logger.fatal("Fields file have to be provided in the configuration file (server / fields) : " + file);
        callback(1);
        return;
    }

    fieldsFile = path.resolve(process.cwd(), config.server.fields);

    try {
        fs.statSync(fieldsFile);
    } catch (e6) {
        logger.fatal("Fields' file does not exist : " + fieldsFile);
        callback(1);
        return;
    }

    try{
        fieldsObj = JSON.parse(fs.readFileSync(fieldsFile, 'utf8'));
    } catch (e7) {
        logger.fatal("Fields file is not a valid JSON file : " + fieldsFile);
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
