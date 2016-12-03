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
    request.get('https://drive.google.com/uc?export=download&id=0B0Jkuy0hWLAMdk1SUk54VUJzMm8', function (error, response, body) {
      console.log(body);
      global.xml = body;
      xml2js.parseString(global.xml, function(err, parsedResult) {
        if (err) {
          console.log('000', err);
        }
        global.parsedResult = parsedResult;    
        console.log('111', global.parsedResult);
        console.log('222', JSON.stringify(global.parsedResult));    
      });  
    });  
    res.send(JSON.stringify(global.parsedResult));
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