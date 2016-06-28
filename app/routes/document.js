/*global
    exports, global, module, process, require, console
*/

var express = require('express');
var router = express.Router();
var Exceptions = require('../models/exceptions');
var Logger = require('log4js').getLogger("logger");

var DocumentServices = require('../services/document');

router.route('/')
    .post(function(req, res) {
        try {
            DocumentServices.create(req, res);
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    })
    .get(function(req, res) {
        try {
            DocumentServices.gets(req, res);
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    });

router.route('/:id')
    .get(function(req, res) {
        try {
            DocumentServices.get(req, res);
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    })
    .put(function(req, res) {
        try {
            DocumentServices.update(req, res);
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    })
    .delete(function(req, res) {
        try {
            DocumentServices.delete(req, res);
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    });

router.route('/:id/file')
    .get(function(req, res) {
        try {
            DocumentServices.getFile(req, res);
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    })
    .post(function(req, res) {
        try {
            DocumentServices.addFile(req, res);
            Logger.debug("là");
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    })
    .delete(function(req, res) {
        try {
            DocumentServices.deleteFile(req, res);
        } catch (e) {
            if (e instanceof Exceptions.BadRequestException) {
                res.status(400).json(e);
            } else if (e instanceof Exceptions.NotFoundException) {
                res.status(404).json(e);
            } else if (e instanceof Exceptions.ConflictException) {
                res.status(409).json(e);
            } else {
                res.status(500).json(e);
            }
        }
    });

module.exports = router;