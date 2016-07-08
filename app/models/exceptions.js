/*global
    exports, global, module, process, require, console
*/

module.exports.NotFoundException = function NotFoundException (message) {
    this.message = message;
    this.code = 404;
};

module.exports.BadRequestException = function BadRequestException (message) {
    this.message = message;
    this.code = 400;
};

module.exports.ConflictException = function ConflictException (message) {
    this.message = message;
    this.code = 409;
};

module.exports.InternalServerErrorException = function InternalServerErrorException (message) {
    this.message = message;
    this.code = 500;
};

