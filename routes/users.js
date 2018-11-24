var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
var router = express.Router();
var middlewareJWT = require('./middleware');
var utilidadToken = require('./services');
var settings = require('./config');

// Login
router.get('/login/:user/:password', function(req, res, next) {
    var user = req.params.user;
    var password = req.params.password;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, cliente) {
        if (error) {
            res.status(502).send();
        }
        var dataBase = cliente.db(settings.DB_NAME);
        dataBase
            .collection(settings.UsersCollection)
            .findOne({
                username: user,
                password: password
            }, function(error, result) {
                if (error) {
                    res.status(502).send();
                }
                if (!result) {
                    res.status(404).send();
                } else {
                    res.status(202).send({
                        token: utilidadToken.crearToken(user)
                    });
                }
                cliente.close();
            });
    });
});

// Busqueda de usuarios en el registro
router.get('/buscar/:user', function(req, res) {
    var user = req.params.user;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, client) {
        if (error) {
            res.status(502).send();
        }
        var dataBase = client.db(settings.DB_NAME);
        var buscarExactoPromise = () => {
            return new Promise((resolve, reject) => {
                dataBase
                    .collection(settings.UsersCollection)
                    .findOne({
                        username: user
                    }, function(error, result) {
                        error
                            ? reject(error)
                            : resolve(result);
                    });
            });
        };
        var callBuscarExactoPromise = async() => {
            var data = await (buscarExactoPromise());
            return data;
        };
        callBuscarExactoPromise().then((resultado) => {
            client.close();
            if (resultado == null) {
                res.status(404).send();
            } else {
                res.status(200).send(
                    resultado
                );
            }
        }).catch((error) => {
            res.status(500).send();
        });
    });
});

// Función de mostrar usuarios
router.get('/:user', middlewareJWT.Auth, function(req, res) {
    var user = req.params.user;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, client) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(user)
            });
        }
        var dataBase = client.db(settings.DB_NAME);
        var buscarPerfilPromise = () => {
            return new Promise((resolve, reject) => {
                dataBase
                    .collection(settings.UsersCollection)
                    .findOne({
                        username: user
                    }, function(error, result) {
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
            resultado.token = utilidadToken.crearToken(user);
            client.close();
            res.status(200).send(
                resultado
            );
        }).catch(function(error) {
            res.status(502).send();
        });
    });
});

// Función de obtener usuarios
router.get('/all/:user', middlewareJWT.Auth, function(req, res) {
    var user = req.params.user;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, client) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(user)
            });
        }
        var dataBase = client.db(settings.DB_NAME);
        var buscarPerfilPromise = () => {
            return new Promise((resolve, reject) => {
                dataBase
                    .collection(settings.UsersCollection)
                    .find().toArray(function(error, result) {
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
            resultado.token = utilidadToken.crearToken(user);
            client.close();
            res.status(200).send(
                resultado
            );
        }).catch(function(error) {
            res.status(502).send();
        });
    });
});

// Registra un usuario
router.post('/registrar', function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var nombre = req.body.nombre;
    var apellido = req.body.apellido;
    var fechaNacimiento = req.body.fechaNacimiento;
    var correo = req.body.correo;
    var telefono = req.body.telefono;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, cliente) {
        if (error) {
            res.status(502).send();
        }
        var dataBase = cliente.db(settings.DB_NAME);
        dataBase
            .collection(settings.UsersCollection)
            .findOne({
                    username: username
                }, function(error, result) {
                    if (error) {
                        res.status(502).send();
                    } else {
                        if (!result) {
                            dataBase
                            .collection(settings.UsersCollection)
                            .insertOne({
                                username: username,
                                password: password,
                                nombre: nombre,
                                apellido: apellido,
                                fechaNacimiento: fechaNacimiento,
                                correo: correo,
                                telefono: telefono,
                                activo: true
                            }, function(error, result) {
                                if (error) {
                                    res.status(502).send();
                                } else {
                                    res.status(201).send();
                                }
                                cliente.close();
                            });
                        }
                    }
                });
    });
});

// Edita el perfil de un usuario
router.put('/:user', middlewareJWT.Auth, function(req, res){
    var username = req.params.user;
    MongoClient.connect(url, function(error, cliente) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = cliente.db(settings.DB_CONNECTION_STRING);
        dataBase.findOneAndUpdate({
            username: username
        }, {
            username: username,
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            fechaNacimiento: req.body.fechaNacimiento,
            correo: req.body.correo,
            telefono: req.body.telefono,
            imagen: req.body.imagen
        }).then(function(updatedDocument) {
            res.status(200).send({
                token: utilidadToken.crearToken(username)
            });
        });
    });
});

// Borra el perfil de un usuario
router.delete('/:user', middlewareJWT.Auth, function(req, res){
    var username = req.params.user;
    MongoClient.connect(url, function(error, cliente) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = cliente.db(settings.DB_CONNECTION_STRING);
        dataBase.findOneAndUpdate({
            username: username
        }, {
            status: false
        }).then(function(updatedDocument) {
            res.status(200).send({
                token: utilidadToken.crearToken(username)
            });
        }).catch(function(error) {
            res.status(500).send();
        });  
    });
});

// Cambia la contraseña
router.put('/recuperar/:user', function(req, res){
    var username = req.params.user;
    var password = req.body.password;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, cliente) {
        if (error) {
            res.status(502);
        }
        var dataBase = cliente.db(settings.DB_NAME);
        dataBase
            .collection(settings.UsersCollection)
            .findOneAndUpdate({
                "username": username
            }, {
                $set: {
                    "password": password
                }
            }, function(error, updatedDocument) {
                if (error) {
                    res.status(500).send();
                } else {
                    res.status(200).send();
                }
            });  
    });
});

module.exports = router;
