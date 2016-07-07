/*global
    exports, global, module, process, require, console
*/

var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger("logger");
var Exceptions = require('../models/exceptions');

router.use(
    function(req, res, next) {

        logger.info(req.method, req.url);
                
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

router.use('/api/document', require('./document'));

module.exports = router;