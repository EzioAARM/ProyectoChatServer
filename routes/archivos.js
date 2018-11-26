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

router.get('/download/archivo/:username/:nombre', middlewareJWT.Auth, function(req, res){
    var ruta =  __dirname + '\\uploads\\' + req.params.nombre;
    res.download(ruta).status(200).send({
        token : utilidadToken.crearToken(req.params.username)
    });
});

router.get('/download/imagen/:username/:nombre', middlewareJWT.Auth, function(req, res){
    var ruta =  __dirname + '\\uploads\\' + req.params.nombre;
    res.download(ruta).status(200).send({
        token : utilidadToken.crearToken(req.params.username)
    });
});

router.get('/download/imagenPerfil/:username', middlewareJWT.Auth, function(req, res){
    var username = req.params.username;
    var ruta = "";
    MongoClient.connect(settings.DB_CONNECTION_STRING, function(error, client) {
        if (error) {
            res.status(502).send({
                token: utilidadToken.crearToken(username)
            });
        }
        var dataBase = client.db(settings.DB_NAME);
        dataBase
            .collection(settings.ImageCollection)
            .findOne({
                perfil : username
            }, function(error, documento){
                if (error) {
                    res.status(502).send({
                        token: utilidadToken.crearToken(username)
                    });
                } else {
                    if (!documento) {
                        res.status(404).send({
                            token: utilidadToken.crearToken(username)
                        });
                    } else {
                        documento.token = utilidadToken.crearToken(username)
                        ruta = documento.ruta;
                        res.download(ruta).status(200).send({
                            token : utilidadToken.crearToken(username)
                        });
                    }
                }
            });
        client.close();
    });
});

router.post('/upload/imagenPerfil', middlewareJWT.Auth, function(req, res){
    var ruta = "";
    var nombre = "";
    var username = req.body.user;
    var emisor = req.body.emisor;
    var receptor = req.body.receptor;
    var perfil = true;
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
            'perfil' : username,
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

router.post('/upload/imagen', middlewareJWT.Auth, function(req, res){
    var ruta = "";
    var nombre = "";
    var username = req.body.user;
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

router.post('/upload/archivo', middlewareJWT.Auth, function(req, res){
    var ruta = "";
    var nombre = "";
    var username = req.body.username;
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
            var collection = client.db(settings.DB_NAME).collection(settings.FilesCollection);
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

module.exports = router;