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

router.post('/upload/imagen', middlewareJWT.Auth, function(req, res){
    var ruta = "";
    var nombre = "";
    var username = req.body.username;
    var emisor = req.body.emisor;
    var receptor = req.body.receptor;
    var form = new formidable.IncomingForm();
    form.type = true;
    form.parse(req);
    form.on('fileBegin', function(name, file){
        var fechaUnica = moment.unix();
        var nombreOriginal = file.name;
        nombre = fechaUnica + "_" + file.name;
        file.path = __dirname + '\\uploads\\' + file.name;
        ruta = file.path;
    });
    form.on('end', function(){
        var json = {
            'nombre': nombre,
            'ruta'  : ruta,
            'nombreOriginal': nombreOriginal,
            'emisor' : emisor,
            'receptor' : receptor

        };
        MongoClient.connect(settings.DB_CONNECTION_STRING, function(err, client) {
            var collection = client.db(settings.DB_NAME).collection(settings.ImageCollection);
            collection.insertOne(json, function(err, result){
                if (err){
                    res.status(502).send({
                        token: utilidadToken.crearToken(username)   
                    });
                    console.log(err);
                } else {
                    res.status(200).send({
                        token : utilidadToken.crearToken(username)
                    });
                }
            });
            client.close();
        });
    });
});

router.put('/leer/:conversacion/:receptor/:username', middlewareJWT.Auth, function(req, res, next) {
    var idConversacion = req.params.conversacion;
    var receptor = req.params.receptor;
    var username = req.params.username;
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, cliente) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = cliente.db(settings.DB_NAME);
        dataBase
            .collection(settings.MessagesCollection)
            .updateMany({
                leido: false,
                idConversacion: new ObjectID(idConversacion),
                receptor: receptor
            }, {
                $set: {
                    leido: true
                }
            }, function(error, updatedDocument) {
                if (error) {
                    console.log(error);
                    
                    res.status(502).send({
                        token: utilidadToken.crearToken(username)
                    });
                } else {
                    res.status(200).send({
                        token: utilidadToken.crearToken(username)
                    });
                    cliente.close();
                }
            });
    });
});

io.on('connection', (socket) => {
    socket.on('join', function(username) {
        console.log(username + " : has joined the chat");
    });
    socket.on('EnviarMensaje', (emisor, receptor, mensaje, tieneArchivo, ubicacionArchivo, hayGrupo, leido, idConversacion, numero) => {
        var json = {
            emisor : emisor,
            receptor : receptor,
            mensaje : mensaje,
            tieneArchivo : tieneArchivo,
            ubicacionArchivo : ubicacionArchivo,
            hayGrupo : hayGrupo,
            leido : leido,
            idConversacion: new ObjectID(idConversacion),
            fechaEnviado : moment().unix(),
            horaEnviado: moment().unix(),
            numero: numero
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
                                sender: emisor,
                                numero: numero
                            },
                            $inc: {
                                nuevos: 1
                            }
                        }, function(error, updatedDocument) {
                            json.token = utilidadToken.crearToken(emisor);
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

server.listen(3001, function(){
    console.log('Socket running on port 3001');
});

module.exports = router;