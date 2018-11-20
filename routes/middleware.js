var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');

exports.Auth = function(req, res, next) {
    if(!req.headers.authorization) {
        return res.send({status: 403, message: "Tu petición no tiene cabecera de autorización"});
    }

    var token = req.headers.authorization.split(" ")[1];
    var payload = jwt.decode(token, config.TOKEN_SECRET);
    if(payload.exp <= moment().unix()) {
        return res.send({status: 401, message: "El token expiró"});
    }
    req.user = payload.sub;
    next();
}