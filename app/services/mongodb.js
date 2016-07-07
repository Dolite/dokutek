/*global
    exports, global, module, process, require, console
*/

var MongoClient = require('mongodb').MongoClient;
var logger = require('log4js').getLogger("logger");
var Exceptions = require('../models/exceptions');
var BSON = require('bson').BSONPure;
var schedule = require('node-schedule');

var mongodbClient;
var connected = false;
var dbConfig = null;

/*************************************************************************************************/

// CRON DE VÉRIFICATION DE LA CONNEXION

var checkConnectionDB = function (config) {
    if (connected) {
        logger.debug("Connection already opened");
        return;
    }

    logger.debug("Connection closed, we try to reopen it");

    if (mongodbClient !== null) {
        mongodbClient.close();
        mongodbClient = null;
    }

    if (dbConfig === null) {
        logger.debug("Connection unusable but no config to open one");
        return;
    }

    connectDB(dbConfig, function(err){});
}

var job = schedule.scheduleJob('* * * * *', checkConnectionDB);

/*************************************************************************************************/

// FONCTIONS DE CONNEXION ET DÉCONNECTION

var connectDB = function (config, callback) {

    logger.info("Connection to mongodb...");

    dbConfig = config;

    var conString = "mongodb://"+dbConfig.host+":"+dbConfig.port+"/"+dbConfig.database;

    MongoClient.connect(
        conString,
        { server: { socketOptions: { connectTimeoutMS: 500 }}},
        function(err, db) {
            if (err) {
                logger.error("... NOK");
                logger.error("mongodb error : " + err);
                callback(1);
                return;
            }
            logger.info("... OK");

            db.on('close', function() {
                logger.warn("Connection closed");
                connected = false;
            });

            mongodbClient = db;
            connected = true;
            callback(0);
        }
    );

};

module.exports.connectDB = connectDB;

module.exports.disconnectDB = function () {
    mongodbClient.close();
    logger.info("Mongodb disconnection OK");
};

/*************************************************************************************************/

// FONCTIONS D'ACCÈS À LA BASE DE DONNÉES

module.exports.findOne = function (colName, id, callback) {

    var bsonID;
    try {
        bsonID = new BSON.ObjectID(id);
    } catch (e) {
        throw new Exceptions.BadRequestException("ID is not a valid ObjectID");
    }

    if (! connected) {
        callback("No connection to mongodb", null);
        return;
    }

    mongodbClient.collection(colName).findOne(
        {'_id': bsonID},
        function(err, item) {
            if (err) {
                console.error(err);
                callback("Problem with mongodb connection: cannot get an object", null);
            } else {
                callback(null, item);
            }
        }
    );
};

module.exports.findSeveral = function (colName, max, callback) {

    if (! connected) {
        callback("No connection to mongodb", null);
        return;
    }

    mongodbClient.collection(colName).find({},{'name': true, 'keywords':true}).toArray(
        function(err, items) {
            if (err) {
                logger.error(err);
                callback("Problem with mongodb connection: cannot get objects", null);
            } else {
                callback(null, items);
            }
        }
    );
};


module.exports.insertOne = function (colName, object, callback) {

    if (! connected) {
        callback("No connection to mongodb", null);
        return;
    }

    mongodbClient.collection(colName).insertOne(
        object,
        {safe:true},
        function(err, item) {
            if (err) {
                console.error(err);
                callback("Problem with mongodb connection: cannot insert an object", null);
            } else {
                callback(null, object);
            }
        }
    );
};

module.exports.updateOne = function (colName, id, newObject, callback) {

    if (! connected) {
        callback("No connection to mongodb", null);
        return;
    }

    var bsonID;
    try {
        bsonID = new BSON.ObjectID(id);
    } catch (e) {
        throw new Exceptions.BadRequestException("ID is not a valid ObjectID");
    }

    mongodbClient.collection(colName).replaceOne(
        {'_id': bsonID},
        newObject,
        function(err, result) {
            if (err) {
                console.error(err);
                callback("Problem with mongodb connection: cannot update an object", null);
            } else {
                callback(null, result);
            }
        }
    );
};


module.exports.updateOneKey = function (colName, id, key, value) {

    if (! connected) {
        return "No connection to mongodb";
    }

    var bsonID;
    try {
        bsonID = new BSON.ObjectID(id);
    } catch (e) {
        throw new Exceptions.BadRequestException("ID is not a valid ObjectID");
    }

    var setter = { $set : {}};
    setter["$set"][key] = value;

    mongodbClient.collection(colName).update(
        {'_id': bsonID},
        setter
    );

    return null;
};

module.exports.deleteOneKey = function (colName, id, key) {

    if (! connected) {
        return "No connection to mongodb";
    }

    var bsonID;
    try {
        bsonID = new BSON.ObjectID(id);
    } catch (e) {
        throw new Exceptions.BadRequestException("ID is not a valid ObjectID");
    }

    var unsetter = { $unset : {}};
    unsetter["$unset"][key] = "";

    mongodbClient.collection(colName).update(
        {'_id': bsonID},
        unsetter
    );

    return null;
};


module.exports.deleteOne = function (colName, id, callback) {

    if (! connected) {
        callback("No connection to mongodb", null);
        return;
    }

    var bsonID;
    try {
        bsonID = new BSON.ObjectID(id);
    } catch (e) {
        throw new Exceptions.BadRequestException("ID is not a valid ObjectID");
    }

    mongodbClient.collection(colName).deleteOne(
        {'_id': bsonID},
        function(err, result) {
            if (err) {
                console.error(err);
                callback("Problem with mongodb connection: cannot delete an object", null);
            } else {
                callback(null, result);
            }
        }
    );
};

