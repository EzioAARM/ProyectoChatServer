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

router.get('/download/:username/:nombre', middlewareJWT.Auth, function(req, res){
    var ruta =  __dirname + '\\uploads\\' + req.params.nombre;
    res.download(ruta);
});

router.post('/upload', function(req, res){
    var ruta = "";
    var nombre = "";
    var username = req.body.username;
    var form = new formidable.IncomingForm();
    form.type = true;
    form.parse(req);
    form.on('fileBegin', function(name, file){
        file.path = __dirname + '\\uploads\\' + moment.unix() + file.name;
        ruta = file.path;
        nombre = file.name;
    });
    form.on('end', function(){
        var json = {
            'nombre': nombre,
            'ruta'  : ruta
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