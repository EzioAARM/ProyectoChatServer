var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');

/* GET home page. */
router.get('/:emisor', function(req, res, next) {
var emisor = req.params.emisor;
  MongoClient.connect(url, function(err, client) {
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOne({emisor:emisor}, function(err, documento){
      if (err)
        res.send(404);
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

router.get('/:emisor/:receptor', function(req, res, next) {
  var emisor = req.params.emisor;
  var receptor = req.params.receptor;
  MongoClient.connect(url, function(err, client) {
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOne({emisor:emisor, receptor:receptor}, function(err, documento){
      if (err)
        res.send(404);
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

router.post('/:emisor', function(req, res, next) {
  var json = {
    "emisor" : req.params.emisor,
    "receptor" : req.body.receptor,
    "mensaje" : req.body.mensaje,
    "archivo" : req.body.archivo
  };
  MongoClient.connect(url, function(err, client) {
    var collection = cliente.db(dbName).collection("usuarios");
    collection.insertOne(json, function(err, documento){
      if (err)
        res.send(404);
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
module.exports = router;
