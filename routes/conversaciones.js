var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
var router = express.Router();
var middlewareJWT = require('./middleware');
var utilidadToken = require('./services');

const url = 'mongodb+srv://roma:1A2basdf@chatdb-53u3w.mongodb.net/test?retryWrites=true';
const dbName = "ChatProject";

router.post('/nueva', middlewareJWT.Auth, function(req, res, next) {
    var user1 = req.body.user1;
    var user2 = req.body.user2;
    var esGrupo = req.body.esGrupo;
    MongoClient.connect(url, function(error, cliente) {
        if (error) res.send({
            status: 502, 
            message: "Error al conectar con el servidor",
            token: utilidadToken.crearToken(username)
        });
        var collection = cliente.db(dbName).collection("conversaciones");
        collection.findOne({
            $or: [ {
                    user1: {
                        $in: [user1, user2]
                    }
                }, {
                    user2: {
                        $in: [user1, user2]
                    }
                }
            ]
        }, function(error, result) {
            if (error) res.send({
                status: 502, 
                message: "Error al verificar la existencia de la conversación",
                token: utilidadToken.crearToken(username)
            });
            if (!result) {
                collection.insertOne({
                    user1: user1,
                    user2: user2,
                    esGrupo: esGrupo
                }, function(error, result) {
                    if (error) res.send({
                        status: 502, 
                        message: "Error al crear la conversación",
                        token: utilidadToken.crearToken(username)
                    });
                    res.send({
                        status: 201,
                        message: "La conversación se creo con éxito",
                        token: utilidadToken.crearToken(username)
                    });
                });
            } else {
                res.send({
                    status: 302,
                    message: "La conversación ya fue creada",
                    token: utilidadToken.crearToken(username)
                });
            }
        });
        cliente.close();
    });
});

router.get('/todas/:username', middlewareJWT.Auth, function(req, res, next) {
    var username = req.params.username;
    MongoClient.connect(url, function(error, cliente) {
        if (error) res.send({
            status: 502, 
            message: "Error al conectar con el servidor",
            token: utilidadToken.crearToken(username)
        });
        var collection = cliente.db(dbName).collection("conversaciones");
        collection.find({
            $or: [ {
                    user1: {
                        $in: [user1, user2]
                    }
                }, {
                    user2: {
                        $in: [user1, user2]
                    }
                }
            ]
        }, function (error, result) {
            if (error) res.send({
                status: 502, 
                message: "Error al obtener las conversaciones",
                token: utilidadToken.crearToken(username)
            });
            if (result) {
                res.send({
                    status: 302,
                    message: "Se encontraron las conversaciones",
                    data: result,
                    token: utilidadToken.crearToken(username)
                });
            }
        });
    });
});

module.exports = router;