var express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var router = express.Router();

const url = 'mongodb+srv://roma:1A2basdf@chatdb-53u3w.mongodb.net/test?retryWrites=true';
const dbName = "ChatProject";

/* GET users listing. */
router.get('/login', function(req, res, next) {
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
        if (!result.username){
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

router.post('/registrar', function(req, res, next) {
  var username = req.body.user;
  var password = req.body.password;
  var nombre = req.body.nombre;
  var apellido = req.body.apellido;
  var fechaNacimiento = req.body.fechaNacimiento;
  var correo = req.body.correo;

  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({status: 502});
    var collection = cliente.db(dbName).collection("usuarios");
    collection.insertOne({
      username: username,
      password: password,
      nombre: nombre,
      apellido: apellido,
      fechaNacimiento: fechaNacimiento,
      correo: correo
    }, function(error, result) {
      if (error) res.send({status: 502});
      res.send({status: 201});
    });
  });

});

module.exports = router;
