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
    var options = {
      host: 'drive.google.com',
      port: 443,
      path: '/uc?export=download&id=0B0Jkuy0hWLAMMU1RMmJHNUgyMHM'
    };
    var blabla = 'asdadas';
    https.get(options, function(response) {
      xml = '';
      response.on('data', (d) => {
        console.log('@@@000', d);
        xml .= d;
      });
      console.log('@@@111', xml);
      //xml2js.parseString(xml, function (err, parsedXml) {
      //  res.send(parsedXml);
      //});
    });     
    res.send(blabla);
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    console.log('@@@', req.body);  
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
    console.log('@@@', recipientId, message);
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