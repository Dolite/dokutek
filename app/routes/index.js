/*global
    exports, global, module, process, require, console
*/

var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("logger");
var ConfigurationServices = require('../services/configuration');
var Exceptions = require('../models/exceptions');

router.use(
    function(req, res, next) {

        logger.info(req.method, req.url);

        // Case insensitive for request query
        for (var key in req.query) { 
            req.query[key.toLowerCase()] = req.query[key];
        }
                
        try {
        	next();
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
    }
)

router.route('/api/list/keywords')
    .get(function(req, res) {
        res.status(200).json(ConfigurationServices.getKeywords());
    });

router.route('/api/list/fields')
    .get(function(req, res) {
        res.status(200).json(ConfigurationServices.getFields());
    });

router.route('/api/serverdate')
    .get(function(req, res) {
        res.status(200).json({"date":new Date(Date.now())});
    });

router.use('/api/document', require('./document'));

module.exports = router;