/*global
    exports, global, module, process, require, console
*/

var MongodbServices = require('./mongodb');
var ConfigurationServices = require('./configuration');
var Exceptions = require('../models/exceptions');
var Path = require('path');
var Fs = require('fs');
var Mkdirp = require("mkdirp")
var Logger = require('log4js').getLogger("logger");
var Multer = require('multer');

var collectionName = "documents";

/************************************** GESTION DES OBJETS **************************************/

module.exports.get = function (req, res) {
    MongodbServices.findOne(
        collectionName, req.params.id,
        function(err,item) {
            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
            }
            else if (item === null) {
                res.status(404).json(new Exceptions.NotFoundException("No document with id "+req.params.id));
            } else {
                res.status(200).json(item);
            }
        }
    );
}

module.exports.gets = function (req, res) {
    MongodbServices.findSeveral(
        collectionName, 10,
        function(err,items) {
            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
            } else {
                res.status(200).json(items);
            }
        }
    );
}

module.exports.create = function (req, res) {

    var object = req.body;

    /* La clé _file est interdite, l'upload du fichier se fait de manière séparée */
    object._file = null;
    delete object._file;

    /* Le datage de l'objet est ajouté */
    object._timestamp = Date.now();

    MongodbServices.insertOne(
        collectionName, object,
        function(err,item) {
            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
            }
            else if (item === null) {
                res.status(404).json(new Exceptions.NotFoundException("No document with id "+req.params.id));
            } else {
                res.status(200).json(item);
            }
        }
    );
}

module.exports.update = function (req, res) {

    var newObject = req.body;
    /* La clé _file est interdite, l'upload du fichier se fait de manière séparée */
    newObject._file = null;
    delete newObject._file;

    /* Le datage de l'objet est ajouté */
    newObject._timestamp = Date.now();

    // On commence par récupérer le document que l'on veut modifier

    MongodbServices.findOne(
        collectionName, req.params.id,
        function(err, oldObject) {
            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
            }
            else if (oldObject === null) {
                res.status(404).json(new Exceptions.NotFoundException("No document with id "+req.params.id));
            } else {

                if (oldObject.hasOwnProperty("_file")) {
                    newObject._file = oldObject._file;
                }

                MongodbServices.updateOne(
                    collectionName, req.params.id, newObject,
                    function(err,result) {
                        if (err) {
                            res.status(500).json(new Exceptions.InternalServerErrorException(err));
                        } else {
                            res.status(200).json(newObject);
                        }
                    }
                );
            }
        }
    );
}

module.exports.delete = function (req, res) {

    MongodbServices.deleteOne(
        collectionName, req.params.id,
        function(err,result) {
            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
            } else {
                res.status(204).send();
            }
        }
    );
}

/************************************** GESTION DES FICHIERS **************************************/

var calculateFilePath = function (object) {
    var docDir = ConfigurationServices.getDirectory();
    var filePath = docDir;
    if(object.hasOwnProperty("category") && object.category !== null && object.category !== "") {
        filePath = Path.join(filePath, object.category);
    } else {
        filePath = Path.join(filePath, "none");
    }

    if(object.hasOwnProperty("subcategory") && object.subcategory !== null && object.subcategory !== "") {
        filePath = Path.join(filePath, object.subcategory);
    } else {
        filePath = Path.join(filePath, "none");
    }

    filePath = Path.join(filePath, object._id.toString());

    return filePath;
}

module.exports.getFile = function (req, res) {

    MongodbServices.findOne(
        collectionName, req.params.id,
        function(err,doc) {
            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
            }
            else if (doc === null) {
                res.status(404).json(new Exceptions.NotFoundException("No document with id "+req.params.id));
            } else {
                if (! doc.hasOwnProperty("_file")) {
                    res.status(404).json(new Exceptions.NotFoundException("No file for the document with id "+req.params.id));
                    return;
                }
                var filePath = doc._file;

                try {
                    Fs.statSync(filePath);
                } catch (e) {
                    Logger.error("File for document " + req.params.id + " should be " + filePath + " but this file doesn't exist");
                    res.status(404).json(new Exceptions.NotFoundException("No file for the document with id "+req.params.id));
                    return;
                }

                res.status(200).contentType(doc._filetype).sendFile(filePath);
            }
        }
    );
}

module.exports.addFile = function (req, res) {

    MongodbServices.findOne( collectionName, req.params.id, function(err,doc) {

        if (err) {
            res.status(500).json(new Exceptions.InternalServerErrorException(err));
        } else if (doc === null) {
            res.status(404).json(new Exceptions.NotFoundException("No document with id "+req.params.id));
        } else {
            if (doc.hasOwnProperty("_file")) {
                res.status(409).json(new Exceptions.ConflictException("Document with id "+req.params.id+" own already a file, delete it before"));
                return;
            }
            var filePath = calculateFilePath(doc);
            var fileType;

            var err = MongodbServices.updateOneKey(collectionName, req.params.id, "_file", filePath);

            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
                return;
            }

            var storage = Multer.diskStorage({
                destination: function (req, file, callback) {
                    Mkdirp( Path.dirname(filePath), function (err) {
                        if(err) {
                            callback(err, null);
                        } else {
                            callback(null, Path.dirname(filePath));
                        }
                    });
                },
                filename: function (req, file, callback) {
                    fileType = file.mimetype;
                    callback(null, Path.basename(filePath));
                }
            });

            var upload = Multer({
                storage: storage,
                limits: {
                    fileSize: 5*1024*1024,
                    files: 1
                }
            }).single("document");

            upload(req, res, function(err) {
                if(err) {
                    // L'upload a échoué, on supprime la clé _file dans mongodb

                    MongodbServices.deleteOneKey(collectionName, req.params.id, "_file");
                    Logger.error(err.code);

                    switch(err.code) {
                        case "LIMIT_UNEXPECTED_FILE":
                            res.status(400).json(new Exceptions.InternalServerErrorException(
                                "Error uploading file: the SINGLE field name is 'document' for the file to upload"
                            ));
                            break;
                        case "LIMIT_FILE_SIZE":
                            res.status(400).json(new Exceptions.InternalServerErrorException(
                                "Error uploading file: the max size for the file is 5 Mb"
                            ));
                            break;
                        default:
                            res.status(500).json(new Exceptions.InternalServerErrorException("Error uploading file: " + err));       
                    }
                } else {
                    var err = MongodbServices.updateOneKey(collectionName, req.params.id, "_filetype", fileType);
                    res.status(200).json({message:"File is uploaded"});
                }
            });
        }

    });
}

module.exports.deleteFile = function (req, res) {

    MongodbServices.findOne(
        collectionName, req.params.id,
        function(err,doc) {
            if (err) {
                res.status(500).json(new Exceptions.InternalServerErrorException(err));
            }
            else if (doc === null) {
                res.status(404).json(new Exceptions.NotFoundException("No document with id "+req.params.id));
            } else {
                if (! doc.hasOwnProperty("_file")) {
                    res.status(409).json(new Exceptions.ConflictException("Document with id "+req.params.id+" doesn't own a file, cannot delete it"));
                    return;
                }

                var filePath = doc._file;

                var err = MongodbServices.deleteOneKey(collectionName, req.params.id, "_file");

                if (err) {
                    res.status(500).json(new Exceptions.InternalServerErrorException(err));
                    return;
                }

                try {
                    Fs.unlinkSync(filePath);
                } catch (e) {
                    // Si une erreur survient lors de la suppression, on le logge mais ne ressort pas en erreur
                    logger.error(e);
                    res.status(204).send();
                    return;
                }

                res.status(204).send();
            }
        }
    );
 
}