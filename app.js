var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var xml2js = require('xml2js');
var https = require('https');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    request.get('https://drive.google.com/uc?export=download&id=0B0Jkuy0hWLAMVEtFZFUxd0x4ZnM', function (error, response, body) {
      xml2js.parseString(body, function(err, parsedResult) {
        if (err) {
          console.log('Error: ', err);
        }
        var treeRoot = parsedResult.mxGraphModel.root[0].mxCell;
        nodes = {};
        edges = {};
        for (var i = 0, len = treeRoot.length; i < len; i++) {
          var node = treeRoot[i].$;
          if (typeof node.value !== 'undefined') { // node
            nodes[node.id] = node.value;
          } else if (typeof node.source !== 'undefined') { // edge
            edges[node.source] = edges[node.source] || [];
            edges[node.source].push(node.target);
          }
        }
        console.log('NODES ', nodes);
        console.log('EDGES ', edges);        
      });  
    });  
    res.send(':-)');
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error, recipientId, message);
        }
    });
};