var express = require('express');
var app = express();

app.post('/registrar', function(request, response) {
    response.send("Hola desde registrar");
});

app.get('/login', function(request, response) {
    response.send("Hola desde login");
});

app.post('/enviarMensaje', function(request, response) {
    response.send("Hola desde enviarMensaje");
});

app.get('/recibirMensaje', function(request, response) {
    response.send("Hola desde recibirMensaje");
});

app.listen(3000, function() {
    console.log("Escuchando el puerto 3000");
});