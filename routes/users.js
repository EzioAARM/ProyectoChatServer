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
    if (error) res.send({
      status: 502, 
      message: "Hubo un error conectandose a la base de datos"
    });
    var collection = cliente.db(dbName).collection("usuarios");
      collection.findOne({
        username: user,
        password: password
      }, function(error, result) {
        if (error) res.send({
          status: 502, 
          message: "Hubo un error verificando su usuario"
        });
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

router.get('/buscarExacto/:user', function(req, res) {
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

router.get('/mostrar/:user', function(req, res) {
  var user = req.params.user;
  try {
    MongoClient.connect(url, function(err, client) {
      if (err) {
        res.send({
        status: 502, 
        message: "Hubo un error conectandose a la base de datos",
        token: utilidadToken.crearToken(user)
        });
      }
      var dataBase = client.db(dbName);
      var buscarPerfilPromise = () => {
        return new Promise((resolve, reject) => {
          dataBase
            .collection("usuarios")
            .findOne({
              username: user
            }, function(error, result){
              error
                ? reject(error)
                : resolve(result);
            });
        });
      };
      
      var callBuscarPerfilPromise = async() => {
        var data = await (buscarPerfilPromise());
        return data;
      };
      callBuscarPerfilPromise().then(function (resultado) {
        console.log(resultado);
        
        res.send({
          status: 302,
          message: "Perfil encontrado con éxito",
          username: resultado.username,
          nombre: resultado.nombre,
          apellido: resultado.apellido,
          fechaNacimiento: resultado.fechaNacimiento,
          correo: resultado.correo,
          telefono: resultado.telefono,
          imagen: resultado.imagen,
          token: utilidadToken.crearToken(user)
        });
      });
    });
  } catch (error) {
    res.send({
      status: 502,
      message: "Hubo un error",
      error: error,
      token: utilidadToken.crearToken(user)
    });
  }
});

router.get('/buscarImagenPerfil/:user', middlewareJWT.Auth, function(req, res) {
  var user = req.params.user;
  try {
    MongoClient.connect(url, function(err, client) {
      if (err) res.send({
        status: 502, 
        message: "Hubo un error conectandose a la base de datos",
        token: utilidadToken.crearToken(user)
      });
      var dataBase = client.db(dbName);
      var buscarFotoPerfilPromise = () => {
        return new Promise((resolve, reject) => {
          dataBase.
            collection("usuarios")
            .findOne({
              username: user
            }, {
              imagen: 1
            }, function(error, result) {
              error
                ? reject(error)
                : resolve(result)
            });
        });
      };
      var callBuscarFotoPerfilPromise = async() => {
        var fotoPerfil = await (buscarFotoPerfilPromise())
        return fotoPerfil;
      };
      callBuscarFotoPerfilPromise().then(function(resultado) {
        res.send({
          status: 302,
          data: resultado.imagen
        });
      });
    });
  } catch (error) {
    res.send({
      status: 502,
      message: "Hubo un error",
      error: error
    });
  }
});

router.get('/buscarContiene/:user', middlewareJWT.Auth, function(req, res) {
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
      else
      {
        id = result._id;
        password = result.password;
        var json = {
          "_id" : new ObjectID (id),
          "username" : username,
          "password" : password,
          "nombre" : req.body.nombre,
          "apellido" : req.body.apellido,
          "fechaNacimiento" : req.body.fechaNacimiento,
          "correo" : req.body.correo,
          "status" : req.body.status,
          "imagen" : req.body.imagen
        }
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

router.put('/:user', middlewareJWT.Auth, function(req, res){
  var username = req.params.user;
  var contraseña = req.body.contraseña;

  MongoClient.connect(url, function(error, cliente) {
    if (error) res.send({
      status: 502,  
      message: "Error al conectar con el servidor",
      token: utilidadToken.crearToken(username)
    });
    var collection = cliente.db(dbName).collection("usuarios");
    collection.findOneAndUpdate({
      username: username
    },{$set:{"password": contraseña}} ,function(error, result) {
      if (error) res.send({
        status: 502, 
        message: "Error al actualizar contraseña",
        token: utilidadToken.crearToken(username)
      });
      else {
        res.send({
          status: 200,
          message: "La contraseña fue actualizada correctamente",
          token: utilidadToken.crearToken(username)
        });
      }
    });    
  });
});

module.exports = router;
