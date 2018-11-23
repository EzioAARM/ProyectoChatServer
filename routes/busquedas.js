var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
var router = express.Router();
var middlewareJWT = require('./middleware');
var utilidadToken = require('./services');
var settings = require('./config');

router.get('/user/:user', middlewareJWT.Auth, function(req, res) {
    var user = req.params.user;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, client) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = client.db(settings.DB_NAME);
        var buscarPerfilPromise = () => {
            return new Promise((resolve, reject) => {
                dataBase
                    .collection(settings.UsersCollection)
                    .find({
                        username: {
                            $regex: user
                        }
                    }).toArray(function(error, result){
                        error
                        ? reject(error)
                        : resolve(result);
                    });
            });
        };

        var callBuscarPerfilPromise = async() => {
            var data = await (buscarPerfilPromise());
            return data;
        };
        callBuscarPerfilPromise().then(function (resultado) {
            res.status(302).send({
                token: utilidadToken.crearToken(user),
                data: resultado
            });
        });
    });
});

module.exports = router;