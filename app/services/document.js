/*global
    exports, global, module, process, require, console
*/

var MongodbServices = require('./mongodb');
var ConfigurationServices = require('./configuration');
var Exceptions = require('../models/exceptions');
var Path = require('path');
var Fs = require('fs');
var Logger = require('log4js').getLogger("logger");


var collectionName = "documents";
var pageSize = 3;

/************************************** UTILITAIRES **************************************/

var deleteSpecialFields = function (obj) {

    obj._file = null;
    delete obj._file;
    obj._filetype = null;
    delete obj._filetype;
    
    obj._id = null;
    delete obj._id;
    
    obj._timestamp = null;
    delete obj._timestamp;

    return obj;
}

var checkDocumentObject = function (obj) {

    // Les champs possibles sont contraints
    var fields = Object.getOwnPropertyNames(obj);

    var wrongFields = fields.filter(ConfigurationServices.notAField);
    if (wrongFields.length != 0) {
        return "Wrong attributes: " + wrongFields.join(",");
    }

    // Les mots clés possibles sont contraints
    if (obj.hasOwnProperty("keywords")) {
        if (! Array.isArray(obj.keywords)) {
            return "'keywords' have to be a string array";
        }
        var wrongKeywords = obj.keywords.filter(ConfigurationServices.notAKeyword);
        if (wrongKeywords.length != 0) {
            return "Wrong keywords: " + wrongKeywords.join(",");
        }
    }

    // On veut forcément un name
    if (! obj.hasOwnProperty("name")) {
        return "Missing 'name' attribute";
    }   

    return null;
}

/************************************** GESTION DES OBJETS **************************************/

module.exports.get = function (id, callback) {
    MongodbServices.findOne(collectionName, id, callback);
}


module.exports.getDistinct = function (field, callback) {

    if (ConfigurationServices.notAField(field)) {
        callback(new Exceptions.BadRequestException("Provided field for distinct values is not valid"), null);
        return;
    }

    if (field === "keywords") {
        callback(new Exceptions.BadRequestException("Cannot get distinct values for keywords"), null);
        return;
    }

    MongodbServices.distinct( collectionName, field, callback );
}

module.exports.gets = function (page, callback) {

    var skip = null;
    if (page !== null && ! isNaN(parseFloat(page)) && isFinite(page)) {
        skip = (page - 1) * pageSize;
    }

    Logger.info(page);
    Logger.info(skip);

    MongodbServices.findSeveral( collectionName, skip, pageSize, callback );
}

module.exports.create = function (rawObj, callback) {

    var object = deleteSpecialFields(rawObj);

    var paramErr = checkDocumentObject(object);
    if (paramErr != null) {
        callback(new Exceptions.BadRequestException(paramErr), null);
        return;
    }

    /* Le datage de l'objet est ajouté */
    object._timestamp = Date.now();

    MongodbServices.insertOne(
        collectionName, object, callback
    );
}

module.exports.update = function (id, rawObj, callback) {

    var newObject = deleteSpecialFields(rawObj);

    var paramErr = checkDocumentObject(newObject);
    if (paramErr != null) {
        callback(new Exceptions.BadRequestException(paramErr), null);
        return;
    }

    /* Le datage de l'objet est ajouté */
    newObject._timestamp = Date.now();

    // On commence par récupérer le document que l'on veut modifier

    MongodbServices.findOne(
        collectionName, id,
        function(exception, oldObject) {
            if (exception) {
                callback(exception, null);
            }
            else if (oldObject === null) {
                callback(new Exceptions.NotFoundException("No document with id "+id), null);
            } else {

                if (oldObject.hasOwnProperty("_file")) {
                    newObject._file = oldObject._file;
                    newObject._filetype = oldObject._filetype;
                }

                MongodbServices.updateOne( collectionName, id, newObject, callback );
            }
        }
    );
}

module.exports.delete = function (id, callback) {
    MongodbServices.deleteOne(collectionName, id, callback);
}

/************************************** GESTION DES FICHIERS **************************************/

module.exports.calculateFilePath = function (object) {
    var docDir = ConfigurationServices.getDirectory();
    var filePath = docDir;

    filePath = Path.join(filePath, object._id.toString().substring(0, 2));
    filePath = Path.join(filePath, object._id.toString());

    return filePath;
}

module.exports.getFileInfos = function (id, callback) {

    MongodbServices.findOne(
        collectionName, id,
        function(exception, obj) {
            if (exception) {
                callback(exception, null, null);
            }
            else if (obj === null) {
                callback(new Exceptions.NotFoundException("No document with id "+id), null, null);
            } else {
                if (! obj.hasOwnProperty("_file")) {
                    callback(new Exceptions.NotFoundException("No file for the document with id "+id), null, null);
                    return;
                }

                try {
                    Fs.statSync(obj._file);
                } catch (e) {
                    Logger.error("File for document " + id + " should be " + obj._file + " but this file doesn't exist");
                    callback(new Exceptions.NotFoundException("No file for the document with id "+id), null, null);
                    return;
                }

                callback(null, obj._file, obj._filetype);
            }
        }
    );
}

module.exports.deleteFile = function (id, callback) {

    MongodbServices.findOne(
        collectionName, id,
        function(exception, obj) {
            if (exception) {
                callback(exception, null);
            }
            else if (obj === null) {
                callback(new Exceptions.NotFoundException("No document with id "+id), null);
            } else {
                if (! obj.hasOwnProperty("_file")) {
                    callback(new Exceptions.ConflictException("Document with id "+id+" doesn't own a file, cannot delete it"), null);
                    return;
                }

                var filePath = obj._file;

                MongodbServices.deleteOneKey(collectionName, id, "_file");
                MongodbServices.deleteOneKey(collectionName, id, "_filetype");

                try {
                    Fs.unlinkSync(filePath);
                } catch (e) {
                    // Si une erreur survient lors de la suppression, on le logge mais ne ressort pas en erreur
                    Logger.error(e);
                }

                callback(null, null);
            }
        }
    );
 
}