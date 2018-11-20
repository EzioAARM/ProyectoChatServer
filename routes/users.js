var express = require('express');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
var router = express.Router();
var middlewareJWT = require('./middleware');
var utilidadToken = require('./services');

const url = 'mongodb+srv://roma:1A2basdf@chatdb-53u3w.mongodb.net/test?retryWrites=true';
const dbName = "ChatProject";

/* GET users listing. */
router.get('/login/:user/:password', function(req, res, next) {
  var user = req.params.user;
  var password = req.params.password;
  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({status: 502, message: "Hubo un error conectandose a la base de datos"});
    var collection = cliente.db(dbName).collection("usuarios");
      collection.findOne({
        username: user,
        password: password
      }, function(error, result) {
        if (error) res.send({status: 502, message: "Hubo un error verificando su usuario"});
        if (!result){
          res.send({
            status: 404,
            message: "Los datos que ingreso son incorrectos"
          });
        } else {
          res.send({
            status: 200,
            message: "El usuario que ingresó si existe",
            token: utilidadToken.crearToken(user)
          });
        }
      });
  });
});

router.get('buscarExacto/:user', middlewareJWT.Auth, function(req, res) {
  var user = req.params.user;
  MongoClient.connect(url, function(err, client) {
    if (err) res.send({
      status: 502, 
      message: "Hubo un error conectandose a la base de datos",
      token: utilidadToken.crearToken(user)
    });
    var collection = client.db(dbName).collection("usuarios");
    collection.find({emisor: user}).toArray(function(err, documento){
      if (err){
        res.send({
          status: 404,
          message: "El usuario no existe",
          token: utilidadToken.crearToken(user)
        });
      }
      else {
        res.send({
          message: "El usuario ya existe",
          status: 200,
          token: utilidadToken.crearToken(user)
        });
      }
    });
    client.close();
  });
});

router.get('buscarContiene/:user', middlewareJWT.Auth, function(req, res) {
  var user = req.params.user;
  MongoClient.connect(url, function(err, client) {
    if (err) res.send({
      status: 502, 
      message: "Hubo un error conectandose a la base de datos",
      token: utilidadToken.crearToken(user)});
    var collection = client.db(dbName).collection("usuarios");
    collection.find({emisor: "/" + user + "/"}).toArray(function(err, documento){
      if (err){
        res.send({
          status: 404,
          message: "No se encontraron coincidencias",
          token: utilidadToken.crearToken(user)
        });
      }
      else {
        res.send({
          data: documento,
          status: 200,
          message: "Hay coincidencias",
          token: utilidadToken.crearToken(user)
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
    if (error) res.send({status: 502, message: "Error al conectar con el servidor"});
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOne({
      username: username
    }, function(error, result) {
      if (error) res.send({status: 502, message: "Error al validar el usuario"});
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
          if (error) res.send({status: 502, message: "Error al insertar el usuario en la base de datos"});
          res.send({status: 201, message: "El usuario se insertó correctamente"});
        });
      } else {
        res.send({
          message: "El usuario " + username + " ya existe",
          status: 409
        });
      }
    });    
  });
});

router.put('/modificar/:user', middlewareJWT.Auth, function(req, res){
  var username = req.params.user;
  var id;
  
  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({
      status: 502, 
      message: "Error al conectar con el servidor",
      token: utilidadToken.crearToken(username)
    });
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOne({username:username},function(error, result) {
      if (error) res.send({
        status: 502, 
        message: "Error al buscar el usuario",
        token: utilidadToken.crearToken(username)
      });
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
        if (error) res.send({
          status: 502, 
          message: "Error al actualizar el usuario",
          token: utilidadToken.crearToken(username)});
        else {
          res.send({
            status: 200,
            data: result,
            message: "El usuario se actualizó con éxito",
            token: utilidadToken.crearToken(username)
          });
        }
      });
    });    
  });
});

router.delete('/borrar/:user', middlewareJWT.Auth, function(req, res){
  var username = req.params.user;

  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({
      status: 502,  
      message: "Error al conectar con el servidor",
      token: utilidadToken.crearToken(username)
    });
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOneAndUpdate({
      username: username
    },{$set:{"status": false}} ,function(error, result) {
      if (error) res.send({
        status: 502, 
        message: "Error al borrar el usuario",
        token: utilidadToken.crearToken(username)
      });
      else {
        res.send({
          status: 200,
          message: "El usuario se borró correctamente",
          token: utilidadToken.crearToken(username)
        });
      }
    });    
  });
});

module.exports = router;
