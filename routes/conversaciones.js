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
    MongoClient.connect(url, function(error, cliente) {
        if (error) {
                res.send({
                status: 502, 
                message: "Error al conectar con el servidor",
                token: utilidadToken.crearToken(username)
            });
        }
        var collection = cliente.db(dbName).collection("conversaciones");
        var collectionMensajes = cliente.db(dbName).collection("conversaciones");
        var collectionUsers = cliente.db(dbName).collection("usuarios");
        collection.find({
            $or: [ {
                    user1: username
                }, {
                    user2: username
                }
            ]
        }).toArray(function (error, result) {
            if (error) {
                    res.send({
                    status: 502, 
                    message: "Error al obtener las conversaciones",
                    token: utilidadToken.crearToken(username)
                });
            }
            if (result) {
                var arrayConversaciones = new Array();
                var jsonAgregar = {};
                var userDif = "";
                result.forEach(function(JsonActual) {
                    if (JsonActual.user1 === username){
                        userDif = JsonActual.user2;
                    } else {
                        userDif = JsonActual.user1;
                    }
                    jsonAgregar.ConversationId = JsonActual._id;
                    jsonAgregar.Emisor = userDif;
                    // Obtener cantidad de mensajes no leidos
                    collection.find({
                        idConversation: JsonActual._id,
                        leido: true
                    }, function(error, result) {
                        if (error) {
                            res.send({
                            status: 502, 
                            message: "Error al obtener la cantidad de mensajes nuevos",
                            token: utilidadToken.crearToken(username)
                            });
                        }
                        var cont = 0;
                        result.forEach(function(elemento){
                            cont = cont + 1;
                        });
                        jsonAgregar.Nuevos = cont;
                        collectionMensajes.find({
                            idConversation: jsonAgregar.ConversationId
                        },
                        {
                            $orderby: {
                                FechaServidor: -1
                            }
                        }).toArray(function(error, result) {
                            if (error) {
                                res.send({
                                    status: 502, 
                                    message: "Error al obtener el último mensaje de la conversación con " + userDif,
                                    token: utilidadToken.crearToken(username)
                                });
                            }
                            try {
                                jsonAgregar.LastMessage = result[0].message;
                                jsonAgregar.FechaMensaje = result[0].fecha;
                            } catch {
                                jsonAgregar.FechaMensaje = "";
                                jsonAgregar.LastMessage = "";
                            }
                            collectionUsers.findOne({
                                username: userDif
                            }, function(error, result) {
                                if (error) {
                                    res.send({
                                        status: 502, 
                                        message: "Error al obtener la foto de perfil de " + userDif,
                                        token: utilidadToken.crearToken(username)
                                    });
                                }
                                jsonAgregar.Imagen = result.imagen;
                                console.log(jsonAgregar);
                            });
                        });
                    });
                    arrayConversaciones.push(jsonAgregar);
                });
                res.send({
                    status: 302,
                    message: "Se encontraron las conversaciones",
                    data: arrayConversaciones,
                    token: utilidadToken.crearToken(username)
                });
            } else {
                res.send({
                    status: 404,
                    message: "No tiene conversaciones",
                    token: utilidadToken.crearToken(username)
                });
            }
        });
    });
});

module.exports = router;