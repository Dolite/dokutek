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
        DocumentServices.create(req, res);
    })
    .get(function(req, res) {
        DocumentServices.gets(req, res);
    });

router.route('/:id')
    .get(function(req, res) {
        DocumentServices.get(req, res);
    })
    .put(function(req, res) {
        DocumentServices.update(req, res);
    })
    .delete(function(req, res) {
        DocumentServices.delete(req, res);
    });

router.route('/:id/file')
    .get(function(req, res) {
        DocumentServices.getFile(req, res);
    })
    .post(function(req, res) {
        DocumentServices.addFile(req, res);
    })
    .delete(function(req, res) {
        DocumentServices.deleteFile(req, res);
    });

module.exports = router;