var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
var router = express.Router();

const url = 'mongodb+srv://roma:1A2basdf@chatdb-53u3w.mongodb.net/test?retryWrites=true';
const dbName = "ChatProject";

/* GET users listing. */
router.get('/login/:username/:password', function(req, res, next) {
  var user = req.params.username;
  var password = req.params.password;
  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({status: 502});
    var collection = cliente.db(dbName).collection("usuarios");
      collection.findOne({
        username: user,
        password: password
      }, function(error, result) {
        if (error) res.send({status: 502});
        if (!result){
          res.send({
            status: 404
          });
        } else {
          res.send({
            status: 200,
            data: result
          });
        }
      });
  });
});

router.get('/mensajes/:user', function(req, res) {
  var user = req.params.user;
    MongoClient.connect(url, function(err, client) {
      var collection = client.db(dbName).collection("usuarios");
      collection.find({emisor:user}).toArray(function(err, documento){
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

router.post('/registrar', function(req, res, next) {
  var username = req.body.user;
  var password = req.body.password;
  var nombre = req.body.nombre;
  var apellido = req.body.apellido;
  var fechaNacimiento = req.body.fechaNacimiento;
  var correo = req.body.correo;
  var telefono = req.body.telefono;

  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({status: 502});
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOne({
      username: username
    }, function(error, result) {
      if (error) res.send({status: 502});
      if (!result){
        collection.insertOne({
          username: username,
          password: password,
          nombre: nombre,
          apellido: apellido,
          fechaNacimiento: fechaNacimiento,
          correo: correo,
          telefono: telefono
        }, function(error, result) {
          if (error) res.send({status: 502});
          res.send({status: 201});
        });
      } else {
        res.send({
          status: 409
        });
      }
    });    
  });
});

router.put('/modificar/:user', function(req, res){
  var username = req.params.user;
  var id;
  
  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({status: 502});
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOne({username:username},function(error, result) {
      if (error) res.send({status: 502});
      id = result._id;

      var json = {
        "_id" : new ObjectID (id),
        "username" : username,
        "password" : req.body.password,
        "nombre" : req.body.nombre,
        "apellido" : req.body.apellido,
        "fechaNacimiento" : req.body.fechaNacimiento,
        "correo" : req.body.correo,
        "status" : req.body.status,
        "imagen" : req.body.imagen
      }

      collection.findOneAndReplace({
        username: username
      },json, function(error, result) {
        if (error) res.send({status: 502});
        else {
          res.send({
            status: 200,
            data: result
          });
        }
      });
    });    
  });
});

router.delete('/borrar/:user', function(req, res){
  var username = req.params.user;

  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({status: 502});
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOneAndUpdate({
      username: username
    },{$set:{"status": false}} ,function(error, result) {
      if (error) res.send({status: 502});
      else {
        res.send({
          status: 200
        });
      }
    });    
  });
});

module.exports = router;
