var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');

const url = 'mongodb+srv://roma:1A2basdf@chatdb-53u3w.mongodb.net/test?retryWrites=true';
const dbName = "ChatProject";

/* GET home page. */
router.get('/:emisor', function(req, res) {
var emisor = req.params.emisor;
  MongoClient.connect(url, function(err, client) {
    var collection = client.db(dbName).collection("usuarios");
    collection.find({emisor:emisor}).toArray(function(err, documento){
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
      var collection = client.db(dbName).collection("usuarios");
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
    var collection = client.db(dbName).collection("usuarios");
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
    var collection = client.db(dbName).collection("usuarios");
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
module.exports = router;
