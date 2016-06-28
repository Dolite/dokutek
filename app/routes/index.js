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
        next();
    }
)

router.use('/api/document', require('./document'));

module.exports = router;