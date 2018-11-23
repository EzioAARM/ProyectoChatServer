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
router.get('/:username/:conversacion', function(req, res) {
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
                    documento.token = utilidadToken.crearToken(username)
                    res.status(502).send(
                        documento
                    );
                }
            });
        client.close();
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
        MongoClient.connect(url, function(err, client) {
            var collection = client.db(dbName).collection("mensajes");
            collection.insertOne(json, function(err, result){
                if (err){
                    res.send(502);
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

router.get('/upload/:nombre', function(req, res){
var ruta = "";
var name = req.params.nombre;

MongoClient.connect(url, function(err, client) {
var collection = client.db(dbName).collection("mensajes");
collection.FindOne({nombre:name}, function(err, result){
if (err){
res.send(502);
console.log(err);
}
else {
res.send({
status: 200,
data: result
});
ruta = result.ruta;
}
});
client.close();
});
});

router.get('/:emisor/:clave', function(req, res) {
var emisor = req.params.emisor;
var clave = req.params.clave;
MongoClient.connect(url, function(err, client) {
var collection = client.db(dbName).collection("mensajes");
collection.find({emisor:emisor,mensaje:{$regex : clave}}).toArray(function(err, documento){
if (err){
res.send(404);
}
else {
res.send({
data: documento,
status: 200
});
}
});
client.close();
});
});

router.get('/:emisor/:receptor/:clave', function(req, res) {
var emisor = req.params.emisor;
var receptor = req.params.receptor;
var clave = req.params.clave;
MongoClient.connect(url, function(err, client) {
var collection = client.db(dbName).collection("mensajes");
collection.find({emisor:emisor, receptor:receptor,mensaje:{$regex : clave}}).toArray(function(err, documento){
if (err){
res.send(404);
}
else {
res.send({
data: documento,
status: 200
});
}
});
client.close();
});
});

router.post('/', function(req, res) {
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
res.send({status: 502});
}
if (!result){
res.send({
status: 404
});
} else {
collection.insertOne(json, function(err, result){
if (err){
res.send(404);
console.log(err);
}
else {
res.send({
status: 200
});
}
});
client.close();
}
});
//aqui estaba antes
});
});

io.on('connection', (socket) => {
    socket.on('join', function(username) {
        console.log(username +" : has joined the chat "  );
    });
    socket.on('messagedetection', (emisor,receptor,mensaje, tieneArchivo, ubicacionArchivo, hayGrupo, leido, fechaEnviado, horaEnviado) => {
        console.log(emisor+" : " +mensaje);
        var message = {
            "emisor":emisor,
            "mensaje":mensaje
        };
        socket.emit('message', message);
        var json = {
            emisor : emisor,
            receptor : receptor,
            mensaje : mensaje,
            tieneArchivo : tieneArchivo,
            ubicacionArchivo : ubicacionArchivo,
            hayGrupo : hayGrupo,
            leido : leido,
            fechaEnviado : fechaEnviado,
            horaEnviado : horaEnviado
        };
        MongoClient.connect(url, function(err, client) {
            var collection = client.db(dbName).collection("mensajes");
            collection.findOne({username: emisor}, function(err, result) {
                if (err){ 
                    res.send({status: 502});
                }
                if (!result){
                    res.send({
                    status: 404
                    });
                } else {
                    collection.insertOne(json, function(err, result){
                        if (err){
                            res.send(404);
                        }
                        else {
                            res.send({
                                status: 200
                            });
                        }
                    });
                    client.close();
                }
            });
            //aqui estaba antes
        });
    });

    socket.on('disconnect', function(username) {
    console.log(username +' has left ')
    });
});


server.listen(3001, function(){
    console.log('Socket running on port 3001')
});

module.exports = router;
