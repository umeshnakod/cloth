var express = require('express');
var app  = express();

app.get('/',function(req, res){
  res.send("Welcome to zoooo")
})

var port = 80;
app.listen(port);
console.log("Listening port", port)
