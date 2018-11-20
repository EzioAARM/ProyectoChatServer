var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');

exports.crearToken = function(username) {
    var payload = {
        sub: username,
        iat: moment().unix(),
        exp: moment().add("15", "days").unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
};