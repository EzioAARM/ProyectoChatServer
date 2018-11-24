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

router.get('/download/:nombre',function(req, res){
    var ruta =  __dirname + '\\uploads\\' + req.params.nombre;
    res.download(ruta, function(err){
        if(err){
            res.send({
                status: 404  
            });
        }
    });
});

router.post('/upload', function(req, res){
    var ruta = "";
    var nombre = "";
    var form = new formidable.IncomingForm();
    form.type = true;
    form.parse(req);
    form.on('fileBegin', function(name, file){
        file.path = __dirname + '\\uploads\\' + file.name;
        ruta = file.path;
        nombre = file.name;
    });
    form.on('end', function(){
        var json = {
            'nombre': nombre,
            'ruta'  : ruta
        };
        MongoClient.connect(settings.DB_CONNECTION_STRING, function(err, client) {
            var collection = client.db(settings.DB_NAME).collection(settings.MessagesCollection);
            collection.insertOne(json, function(err, result){
                if (err){
                    res.send({
                        status: 502    
                    });
                    console.log(err);
                } else {
                    res.send({
                    status: 200,
                    data: json
                    });
                }
            });
            client.close();
        });
    });
});

module.exports = router;