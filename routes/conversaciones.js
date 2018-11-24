var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
var router = express.Router();
var middlewareJWT = require('./middleware');
var utilidadToken = require('./services');
var settings = require('./config');

router.post('/nueva', middlewareJWT.Auth, function(req, res, next) {
    var user1 = req.body.user1;
    var user2 = req.body.user2;
    var esGrupo = req.body.esGrupo;
    var fotoUser1 = req.body.fotoUser1;
    var fotoUser2 = req.body.fotoUser2;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, cliente) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = cliente.db(settings.DB_NAME);
        var buscarConversacionExistentePromise = () => {
            return new Promise((resolve, reject) => {
                dataBase
                    .collection(settings.ConversationsCollection)
                    .findOne({
                        $and: [ {
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
                        error
                            ? reject(error)
                            : resolve(result)
                    });
            });
        };
        var callBuscarConversacionExistentePromise = async() => {
            var data = await (buscarConversacionExistentePromise());
            return data;
        };
        callBuscarConversacionExistentePromise().then(function(resultado) {
            if (resultado != null) {
                res.status(302).send({
                    token: utilidadToken.crearToken(user1)
                });
            } else {
                dataBase
                    .collection(settings.ConversationsCollection)
                    .insertOne({
                        user1: user1,
                        user2: user2,
                        esGrupo: esGrupo,
                        fotoUser1: fotoUser1,
                        fotoUser2: fotoUser2,
                        nuevos: 0,
                        ultimoMensaje: "",
                        eliminoUser1: false,
                        eliminoUser2: false
                    }, function(error, result) {
                        if (error) {
                            res.status(502).send({
                                token: utilidadToken.crearToken(user1)
                            });
                        } else {
                            res.status(201).send({
                                token: utilidadToken.crearToken(user1)
                            });
                        }
                    });
            }
        }).catch((error) => {
            res.status(502).send({
                token: utilidadToken.crearToken(user1)
            });
        });
    });
});

router.get('/todas/:username', middlewareJWT.Auth, function(req, res, next) {
    var username = req.params.username;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, cliente) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = cliente.db(settings.DB_NAME);
        var buscarConversacionesPromise = () => {
            return new Promise((resolve, reject) => {
                dataBase.
                    collection('conversaciones')
                    .find({
                    $or: [ {
                            user1: username
                        }, {
                            user2: username
                        }
                    ]
                })
                .toArray(function (error, result) {
                    error
                        ? reject(error)
                        : resolve(result)
                });
            });
        };
        var callBuscarConversacionesPromise = async() => {
            var data = await (buscarConversacionesPromise());
            return data;
        };

        callBuscarConversacionesPromise().then(function (resultado) {
            if (resultado) {
                resultado[0].token = utilidadToken.crearToken(username);
                res.status(200).send(
                    resultado
                );
            } else {
                res.status(404).send({
                    token: utilidadToken.crearToken(username)
                });
            }
        });
    });
});

router.put('/reiniciar/:conversacion/:usernameEmisor/:username', middlewareJWT.Auth, function(req, res, next) {
    var idConversacion = req.params.conversacion;
    var emisor = req.params.usernameEmisor;
    var username = req.params.username;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, cliente) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = cliente.db(settings.DB_NAME);
        dataBase
            .collection(settings.ConversationsCollection)
            .updateOne({
                _id: new ObjectID(idConversacion),
                sender: emisor
            }, {
                $set: {
                    nuevos: 0,
                    sender: ""
                }
            }, function(error, updatedDocument) {
                if (error) {
                    console.log(error);
                    
                    res.status(502).send({
                        token: utilidadToken.crearToken(username)
                    });
                } else {
                    res.status(204).send({
                        token: utilidadToken.crearToken(username)
                    });
                    cliente.close();
                }
            });
    });
});

module.exports = router;