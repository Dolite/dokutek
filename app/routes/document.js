/*global
    exports, global, module, process, require, console
*/

var express = require('express');
var router = express.Router();
var Exceptions = require('../models/exceptions');
var Logger = require('log4js').getLogger("logger");

var DocumentServices = require('../services/document');
var MongodbServices = require('../services/mongodb');

var Multer = require('multer');
var Mkdirp = require("mkdirp");
var Path = require('path');

var collectionName = "documents";

router.route('/')
    .post(function(req, res) {
        DocumentServices.create(
            req.body,
            function (exception, objCreated) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(200).json(objCreated);
                }
            }
        );
    })
    .get(function(req, res) {
        DocumentServices.gets(
            function (exception, objs) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(200).json(objs);
                }
            }
        );
    });

router.route('/distinct/:field')
    .get(function(req, res) {
        DocumentServices.getDistinct(
            req.params.field,
            function (exception, list) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(200).json(list);
                }
            }
        );
    });

router.route('/:id')
    .get(function(req, res) {
        DocumentServices.get(
            req.params.id,
            function (exception, obj) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(200).json(obj);
                }
            }
        );
    })
    .put(function(req, res) {
        DocumentServices.update(
            req.params.id,
            req.body,
            function (exception, objUpdated) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(200).json(objUpdated);
                }
            }
        );
    })
    .delete(function(req, res) {
        DocumentServices.delete(
            req.params.id,
            function (exception, ret) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(204).send();
                }
            }
        );
    });

router.route('/:id/file')
    .get(function(req, res) {
        DocumentServices.getFileInfos(
            req.params.id,
            function (exception, filePath, fileType) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(200).contentType(fileType).sendFile(filePath);
                }
            }
        );
    })
    .post(function(req, res) {
        MongodbServices.findOne(
            collectionName, req.params.id,
            function(exception, obj) {

            if (exception) {
                res.status(exception.code).json(exception);
                return;
            }

            if (obj === null) {
                res.status(404).json(new Exceptions.NotFoundException("No document with id "+req.params.id));
                return;
            }

            if (obj.hasOwnProperty("_file")) {
                res.status(409).json(new Exceptions.ConflictException("Document with id "+req.params.id+" own already a file, delete it before"));
                return;
            }

            var filePath = DocumentServices.calculateFilePath(obj);
            var fileType;

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
                    Logger.info("File uploaded and store to "+filePath);
                    MongodbServices.updateOneKey(collectionName, req.params.id, "_file", filePath);
                    MongodbServices.updateOneKey(collectionName, req.params.id, "_filetype", fileType);
                    res.status(200).json({code:200, message:"File is uploaded"});
                }
            });

        });
    })
    .delete(function(req, res) {
        DocumentServices.deleteFile(
            req.params.id,
            function (exception, ret) {
                if (exception) {
                    res.status(exception.code).json(exception);
                } else {
                    res.status(204).send();
                }
            }
        );
    });

module.exports = router;