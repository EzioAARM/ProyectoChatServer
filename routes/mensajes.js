var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
http = require('http');
server = http.createServer(express),
io = require('socket.io').listen(server);
var formidable = require('formidable');
var middlewareJWT = require('./middleware');
var utilidadToken = require('./services');
var settings = require('./config');
var moment = require('moment');

// Obtiene todos los mensajes de una conversación
router.get('/:username/:conversacion',middlewareJWT.Auth, function(req, res) {
    var id = req.params.conversacion;
    var username = req.params.username;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, client) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = client.db(settings.DB_NAME);
        dataBase
            .collection(settings.MessagesCollection)
            .find({
                idConversacion: new ObjectID(id)
            }).toArray(function(error, documento){
                if (error) {
                    res.status(502).send({
                        token: utilidadToken.crearToken(username)
                    });
                } else {
                    if (documento.length == 0) {
                        res.status(404).send({
                            token: utilidadToken.crearToken(username)
                        });
                    } else {
                        documento[0].token = utilidadToken.crearToken(username)
                        res.status(200).send(
                            documento
                        );
                    }
                }
            });
        client.close();
    });
});

io.on('connection', (socket) => {
    socket.on('join', function(username) {
        console.log(username + " : has joined the chat");
    });
    socket.on('EnviarMensaje', (emisor, receptor, mensaje, tieneArchivo, ubicacionArchivo, hayGrupo, leido, idConversacion) => {
        var json = {
            emisor : emisor,
            receptor : receptor,
            mensaje : mensaje,
            tieneArchivo : tieneArchivo,
            ubicacionArchivo : ubicacionArchivo,
            hayGrupo : hayGrupo,
            leido : leido,
            idConversacion: new ObjectID(idConversacion),
            fechaEnviado : moment.unix().format("DD/MM/YY"),
            horaEnviado: moment.unix().format("HH:mm")
        };
        MongoClient.connect(settings.DB_CONNECTION_STRING, function(err, client) {
            var dataBase = client.db(settings.DB_NAME);
            dataBase
                .collection(settings.MessagesCollection)
                .insertOne(json, function(error, result) {
                    if (err){ 
                        console.log(error);
                    }
                    dataBase
                        .collection(settings.ConversationsCollection)
                        .updateOne({
                            _id: new ObjectID(idConversacion)
                        }, {
                            $set: {
                                ultimoMensaje: mensaje,
                                sender: emisor
                            },
                            $inc: {
                                nuevos: 1
                            }
                        }, function(error, updatedDocument) {
                            socket.broadcast.emit("RecibirMensaje", json);
                        });
                });
        });
    });
    socket.on('disconnect', function(){
        console.log("user has left");
        socket.broadcast.emit('userDisconnect', 'has left');
    });
});

router.get('/:emisor/:clave', middlewareJWT.Auth, function(req, res) {
    var emisor = req.params.emisor;
    var clave = req.params.clave;
    MongoClient.connect(url, function(err, client) {
    var collection = client.db(dbName).collection("mensajes");
    collection.find({emisor:emisor,mensaje:{$regex : clave}}).toArray(function(err, documento){
        if (err){
            res.status(404).send({
                token: utilidadToken.crearToken(emisor)
            });
        }
        else {
            res.status(200).send({
                token: utilidadToken.crearToken(emisor),
                data: documento
            });
        }
    });
    client.close();
    });
});

router.get('/:emisor/:receptor/:clave', middlewareJWT.Auth, function(req, res) {
    var emisor = req.params.emisor;
    var receptor = req.params.receptor;
    var clave = req.params.clave;
    MongoClient.connect(url, function(err, client) {
    var collection = client.db(dbName).collection("mensajes");
    collection.find({emisor:emisor, receptor:receptor,mensaje:{$regex : clave}}).toArray(function(err, documento){
    if (err){
        res.status(404).send({
            token: utilidadToken.crearToken(emisor)
        });
    }
    else {
        res.status(200).send({
            token: utilidadToken.crearToken(emisor),
            data: documento
        });
    }
    });
    client.close();
    });
});

router.post('/', middlewareJWT.Auth, function(req, res) {
    var json = {
        emisor : req.body.emisor,
        receptor : req.body.receptor,
        mensaje : req.body.mensaje,
        tieneArchivo : req.body.tieneArchivo,
        ubicacionArchivo : req.body.ubicacionArchivo,
        hayGrupo : req.body.hayGrupo,
        leido : req.body.leido,
        fechaEnviado : req.body.fechaEnviado,
        horaEnviado : req.body.horaEnviado
    };
    MongoClient.connect(url, function(err, client) {
    var collection = client.db(dbName).collection("mensajes");
    collection.findOne({username: req.body.receptor}, function(err, result) {
    if (err){ 
        res.status(502).send({
            token: utilidadToken.crearToken(emisor)
        });
    }
    if (!result){
        res.status(404).send({
            token: utilidadToken.crearToken(emisor)
        });
    } else {
    collection.insertOne(json, function(err, result){
    if (err){
        res.status(404).send({
            token: utilidadToken.crearToken(username)
        });
    console.log(err);
    }
    else {
        res.status(200).send({
            token: utilidadToken.crearToken(username)
        });
    }
    });
    client.close();
    }
    });
    //aqui estaba antes
    });
});

server.listen(3001, function(){
    console.log('Socket running on port 3001');
});

module.exports = router;