var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var xml2js = require('xml2js');
var https = require('https');
var Buffer = require('buffer').Buffer;
var pako = require('pako');
var userIdToVertexId = {};

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    parseTree();
    userIdToVertexId = {};
    res.send(':-)');
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    this.vertices || parseTree();
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (!userIdToVertexId[event.sender.id]) {
          userIdToVertexId[event.sender.id] = 1;
        }
        if (event.message && event.message.text) {
          if (userIdToVertexId[event.sender.id] <= 1) {
            sendMessage(event.sender.id, {text: 'Hello! Welcome to BOBO\'s chatbot!'});
            userIdToVertexId[event.sender.id] = Object.keys(vertices)[0];
            sendQuickReply(event.sender.id, vertices[userIdToVertexId[event.sender.id]]);            
          } else {
            previousVertex = vertices[userIdToVertexId[event.sender.id]];
            answerVertex = previousVertex.children[event.message.text];
            console.log('111', answerVertex);
            if (typeof answerVertex == 'undefined') {
              console.log('Previous vertex: ', previousVertex);
              sendMessage(event.sender.id, {text: 'Unknown answer ' + event.message.text + ' - Try again!'});              
            } else if (answerVertex.children.length == 0) {
              sendMessage(event.sender.id, {text: 'Thanks and bye bye!'});
              userIdToVertexId[event.sender.id] = 1;
            } else {
              nextQuestionVertex = answerVertex.children[Object.keys(answerVertex.children)[0]];
              userIdToVertexId[event.sender.id] = nextQuestionVertex.id;
              sendQuickReply(event.sender.id, vertices[userIdToVertexId[event.sender.id]]);            
            }
          }
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    console.log('%%%', process.env.PAGE_ACCESS_TOKEN);
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

function sendQuickReply(recipientId, currentVertex) {
  quick_replies = [];
  for (index in currentVertex.children) {
    child = currentVertex.children[index];
    quick_replies.push({title: child.value, content_type: 'text', payload: index});
  }
  var message = {
    text: currentVertex.value,
    quick_replies: quick_replies
  };

  sendMessage(recipientId, message);
}

function parseTree() {
  console.log('INFO: Starting to parse tree');
  request.get('https://drive.google.com/uc?export=download&id=0B0Jkuy0hWLAMYTNnQ2NjN3o2WUU', function (error, response, body) {
    xml2js.parseString(body, function(err, parsedResult) {
      if (err) {
        console.log('Error:  ', err);
      }
      var treeRoot = parsedResult.mxGraphModel.root[0].mxCell;
      this.vertices = {};
      this.edges = {};
      for (var i = 0, len = treeRoot.length; i < len; i++) {
        var node = treeRoot[i].$;
        var vertex = {};
        if (typeof node.value !== 'undefined') { // node
          if (node.style.indexOf('ellipse') !== -1) {
            vertex.type = 'ANSWER';
          } else {
            vertex.type = 'QUESTION';
          }
          vertex.value = node.value;
          vertex.children = [];
          vertex.id = node.id;
          vertices[node.id] = vertex;
        } else if (typeof node.source !== 'undefined') { // edge
          edges[node.source] = edges[node.source] || [];
          edges[node.source].push(node.target);
        }
      }

      for (source in edges) {
        for (var i = edges[source].length - 1; i >= 0; i--) {
          target = vertices[edges[source][i]];
          vertices[source].children[target.value] = target;
        }
      }

      console.log('INFO: Finished parsing tree');
    });  
  });  
}

parseTree();
return;
