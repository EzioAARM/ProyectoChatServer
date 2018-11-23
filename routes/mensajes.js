var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
http = require('http');
server = http.createServer(express),
io = require('socket.io').listen(server);
var formidable = require('formidable');

const url = 'mongodb+srv://roma:1A2basdf@chatdb-53u3w.mongodb.net/test?retryWrites=true';
const dbName = "ChatProject";

router.get('/:emisor', function(req, res) {
var emisor = req.params.emisor;
  MongoClient.connect(url, function(err, client) {
    var collection = client.db(dbName).collection("mensajes");
    collection.find({
      emisor:emisor
    }).toArray(function(err, documento){
      if (err){
        res.send({
          status: 502,
          message: "Hubo un error al obtener los mensajes"
        });
      }
      else {
        res.send({
          data: documento,
          status: 302
        });
      }
    });
    client.close();
  });
});

router.get('/:emisor/:receptor', function(req, res) {
  var emisor = req.params.emisor;
  var receptor = req.params.receptor;
  var clave = req.params.clave;
  MongoClient.connect(url, function(err, client) {
    var collection = client.db(dbName).collection("mensajes");
    collection.find({emisor:emisor, receptor:receptor}).toArray(function(err, documento){
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

  console.log('user connected');
  
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
  
    socket.on('disconnect', function(username) {
      console.log(username +' has left ')
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
        }
        else {
          res.send({
            status: 200,
            data: result
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
  });
});


server.listen(3001, function(){

  console.log('Socket running on port 3001')
  
  });

module.exports = router;
