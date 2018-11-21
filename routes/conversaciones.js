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
    var username = user1;
    MongoClient.connect(url, function(error, cliente) {
        if (error) {
                res.send({
                status: 502, 
                message: "Error al conectar con el servidor",
                token: utilidadToken.crearToken(username)
            });
        }
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
            if (error) {
                res.send({
                    status: 502, 
                    message: "Error al verificar la existencia de la conversación",
                    token: utilidadToken.crearToken(username)
                });
            }
            if (!result) {
                collection.insertOne({
                    user1: user1,
                    user2: user2,
                    esGrupo: esGrupo
                }, function(error, result) {
                    if (error) {
                            res.send({
                            status: 502, 
                            message: "Error al crear la conversación",
                            token: utilidadToken.crearToken(username)
                        });
                    }
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
    });
});

router.get('/todas/:username', middlewareJWT.Auth, function(req, res, next) {
    var username = req.params.username;
    try{
        MongoClient.connect(url, function(error, cliente) {
            if (error) {
                res.send({
                status: 502, 
                message: "Error al conectar con el servidor",
                token: utilidadToken.crearToken(username)
                });
            }
            var dataBase = cliente.db(dbName);
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
            var buscarNuevosCount = (resultado) => {
                return new Promise((resolve, reject) => {
                    dataBase.
                        collection('mensajes')
                        .find({
                            receptor: resultado.receptor,
                            emisor: resultado.emisor,
                            leido: false,
                            idConversacion: new ObjectID(resultado.idConversacion)
                        })
                        .count(function (error, result) {
                            error
                                ? reject(error)
                                : resolve({
                                    idConversacion: resultado.idConversacion,
                                    emisor: resultado.emisor,
                                    receptor: resultado.receptor,
                                    esGrupo: resultado.esGrupo,
                                    nuevos: result
                                })
                        });
                });
            };
            var buscarLastMessage = (resultado) => {
                return new Promise((resolve, reject) => {
                    dataBase.
                        collection('mensajes')
                        .find({
                            receptor: username,
                            emisor: resultado.emisor,
                            leido: false,
                            idConversacion: new ObjectID(resultado.idConversacion)
                        }).sort({
                            horaEnviado: 1
                        }).limit(1).toArray(function (error, result) {
                            if (error){
                                reject(error);
                            } else {
                                resolve({
                                    idConversacion: resultado.idConversacion,
                                    emisor: resultado.emisor,
                                    receptor: resultado.receptor,
                                    esGrupo: resultado.esGrupo,
                                    nuevos: resultado.nuevos,
                                    lastMessage: result
                                });
                            }
                        });
                });
            };

            var callBuscarConversacionesPromise = async() => {
                var data = await (buscarConversacionesPromise());
                return data;
            };
            var callBuscarNuevosCount = async() => {
                var data = await (buscarNuevosCount());
                return data;
            };
            var callBuscarLastMessage = async() => {
                var data = await (buscarLastMessage());
                return data;
            };

            callBuscarConversacionesPromise().then(function (resultado) {
                resultado = resultado[0];
                var userDif = resultado.user1;
                if (userDif === username) {
                    userDif = resultado.user2;
                }
                return buscarNuevosCount({
                    emisor: userDif,
                    receptor: username,
                    idConversacion: resultado._id,
                    esGrupo: resultado.esGrupo
                });
            }).then(function(resultadoCount) {
                return buscarLastMessage(resultadoCount);
            }).then(function(resultadoLastMessage) {
                var dato = "";
                try {
                    dato = resultadoLastMessage.lastMessage[0].mensaje;
                } catch (error) {
                    dato = "";
                }
                if (typeof dato === 'undefined') {
                    dato = "";
                }
                console.log(dato);
                
                res.send({
                    status: 302,
                    data: {
                            idConversacion: resultadoLastMessage.idConversacion,
                            emisor: resultadoLastMessage.emisor,
                            receptor: resultadoLastMessage.receptor,
                            esGrupo: resultadoLastMessage.esGrupo,
                            nuevos: resultadoLastMessage.nuevos,
                            lastMessage: dato
                        }
                });
            });
        });
    } catch (error) {
        res.send({
            status: 502,
            message: "Hubo un error",
            error: error
        });
    }
});

module.exports = router;