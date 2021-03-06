'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');
var http = require('http');
let cfenv = require('cfenv');
let appEnv = cfenv.getAppEnv();
let mongoose = require('mongoose');



//Connect to MongoDB
require('./mongo-connect')(appEnv);

//Models
var staff = require('./db/models/staffModel');
var opportunity = require('./db/models/opportunityModel');

var presalesConsultant = function Constructor(settings)
{
  this.settings = settings;
  this.settings.name = this.settings.name || 'hcpbot';
};

// inherits methods and properties from the Bot constructor
util.inherits(presalesConsultant, Bot);

module.exports = presalesConsultant;

//Create Server
http.createServer(function (req, res) {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.send('it is running\n');
}).listen(process.env.PORT || 5000);

presalesConsultant.prototype.run = function (){
  presalesConsultant.super_.call(this, this.settings);
  this.on('start', this._onStart);
  this.on('message', this._onMessage);
};

presalesConsultant.prototype._onStart = function() {
  var self = this;
  this._loadBotUser();
  self._welcomeMessage();
  this.postMessageToChannel(this.channels[0].name, 'Welcome', {as_user: true});
};


presalesConsultant.prototype._loadBotUser = function() {
  var self = this;
  this.user = this.users.filter(function (user){
    return user.name === self.name;
  })[0];
};

presalesConsultant.prototype._welcomeMessage = function() {

  this.postMessageToChannel("hcp", "Hi, I'm here to help!" +
  ' Here are some sample commands:' +
  '\n hcpbot search John Smith' +
  '\n hcpbot What are my top three opportunities' +
  '\n hcpbot Search opportunity Temple of Groom' +
  '\n hcpbot Help!', {as_user: true});
};


presalesConsultant.prototype._onMessage = function (message) {
      if(this._isChatMessage(message)
      && this._isChannelConversation(message)
      && !this._isFromMyself(message)){
        this._replyWithMessage(message);
      }
};

presalesConsultant.prototype._isFromMyself = function (message) {
    return message.user === this.user.id;
};

presalesConsultant.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

presalesConsultant.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};

presalesConsultant.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};


presalesConsultant.prototype._response = function (message, queryObject){
  var self = this;
  var reply = "";
  var channel = message.channel.name;

  staff.find(queryObject, '-_id Name Phone Email Role', function(err, salesResult) {
    if (err) return console.error(err);
    var number = salesResult.length;
    if (number == 0) return null;

    var attachments = self._responseBuilder(salesResult, number, channel)

    //Push the fields to the chat
    var channel = self._getChannelById(message.channel);
    self.postMessageToChannel(channel.name, reply, {as_user: true, attachments:attachments});
  });

  opportunity.find(queryObject, '-_id', function(err, opporturtunityResult){
    if (err) return console.error(err);
    var number = opporturtunityResult.length;
    if (number == 0) return null;


    var attachments = self._responseBuilder(opporturtunityResult, number, channel)

    //Push the fields to the chat
    var channel = self._getChannelById(message.channel);
    self.postMessageToChannel(channel.name, reply, {as_user: true, attachments:attachments});
  });

}

presalesConsultant.prototype._responseBuilder = function(queryResult, number, channel) {
  var number = queryResult.length;
  var attachments = {};

  attachments = [{
    "fallback": "None",
    "color": "#439FE0",
    "pretext": `Found (${number}) result(s)`,
    "fields": []
  }];

  //Go through each Search Result
  queryResult.forEach(function(result) {
    //Convert Mongoose Object to JSON
    result = result.toJSON();

    //Traverse through all the properties in the Object and create a field
    for (var key in result) {
      if(result.hasOwnProperty(key)){
        var field = {
          "title": `${key}`,
          "value": `${result[key]}`,
          "short":  true,
        }
        
        attachments[0].fields.push(field);
      }
    }
  });

  console.log(attachments);
  return attachments;
}

presalesConsultant.prototype._presales = function(message) {
  var self = this;
  var attachments = {};
  var reply = "";


  if (message.text.toLowerCase().indexOf('all') > - 1){
    var queryObject = {};
    queryObject["Job"] = "Presales";
    this._response(message, queryObject);
    /**
    attachments = [{
      "fallback": "Required Fallback",
      "color": "#439FE0",
      "pretext": "Management",
      "fields": [
        {
          "title": "Mike Duddy",
          "value": "Hana Cloud Platform Specialist"
        },
        {
          "title": "Phone",
          "value": "604-232-3334",
          "short": true
        },
        {
          "title": "Email",
          "value": "Mike.Duddy@sap.com",
          "short": true
        }]
      },

      {
          "color": "#439FE0",
          "pretext": "\nHana Cloud Platform",
          "fallback": "Required Fallback",
          "fields": [
            {
              "title": "Jathavan Arumugam",
              "value": "Hana Cloud Platform Specialist"
            },
            {
              "title": "Phone",
              "value": "604-221-2321",
              "short": true
            },
            {
              "title": "Email",
              "value": "Jathavan.Arumugam@sap.com",
              "short": true
            },
            {
              "title": "Tyler Franks",
              "value": "Hana Cloud Platform Specialist"
            },
            {
              "title": "Phone",
              "value": "480-333-7751",
              "short": true
            },
            {
              "title": "Email",
              "value": "Tyler.Franks@sap.com",
              "short": true
            }]
        },
        {
        "pretext": "\nHybris",
        "color": "#439FE0",
        "fallback": "Required Fallback",
        "fields": [
            {
              "title": "Brydon Chan",
              "value": "Hybris Commerce"
            },
            {
              "title": "Phone",
              "value": "604-454-8786",
              "short": true
            },
            {
              "title": "Email",
              "value": "Brydon.Chan@sap.com",
              "short": true
            },

            {
              "title": "Jennifer Baron",
              "value": "Hybris Retail"
            },
            {
              "title": "Phone",
              "value": "480-444-6565",
              "short": true
            },
            {
              "title": "Email",
              "value": "Jennifer.Baron@sap.com",
              "short": true
            },
            {
              "title": "Lyndsay Tilston",
              "value": "Hybris Marketing"
            },
            {
              "title": "Phone",
              "value": "604-665-7852",
              "short": true
            },
            {
              "title": "Email",
              "value": "Lyndsay.Tilston@sap.com",
              "short": true
            },

            {
              "title": "Pablo Hennique",
              "value": "Hybris"
            },
            {
              "title": "Phone",
              "value": "604-787-6652",
              "short": true
            },
            {
              "title": "Email",
              "value": "Pablo.Hennique@sap.com",
              "short": true
            }],
          },
            {
              "pretext": "\nAnalytics",
              "fallback": "Required Fallback",
              "color":"#439FE0",
              "fields": [
            {
              "title": "Michael Pereira",
              "value": "Business Objects Analytics"
            },
            {
              "title": "Phone",
              "value": "604-883-4215",
              "short": true
            },
            {
              "title": "Email",
              "value": "Michael.Pereira@sap.com",
              "short": true
            },
            {
              "title": "Kevin Lee",
              "value": "Business Objects Analytics"
            },
            {
              "title": "Phone",
              "value": "604-343-3454",
              "short": true
            },
            {
              "title": "Email",
              "value": "Kevin.Lee@sap.com",
              "short": true
            },
            {
              "title": "Garett Buckley",
              "value": "Business Objects Cloud"
            },
            {
              "title": "Phone",
              "value": "604-234-8791",
              "short": true
            },
            {
              "title": "Email",
              "value": "Garrett.Buckley@sap.com",
              "short": true
            }
          ],
          "color:": "#36A64F"
      }]**/

  };

/**
  if (message.text.toLowerCase().indexOf('hcp') > - 1){
    attachments = [{
      "fallback": "Required Fallback",
      "color": "#439FE0",
      "pretext": "Here are your Hana Cloud Platform specialists",
      "fields": [
        {
          "title": "Jathavan Arumugam",
          "value": "Hana Cloud Platform Specialist"
        },
        {
          "title": "Phone",
          "value": "604-221-2321",
          "short": true
        },
        {
          "title": "Email",
          "value": "Jathavan.Arumugam@sap.com",
          "short": true
        },
        {
          "title": "Tyler Franks",
          "value": "Hana Cloud Platform Specialist"
        },
        {
          "title": "Phone",
          "value": "480-333-7751",
          "short": true
        },
        {
          "title": "Email",
          "value": "Tyler.Franks@sap.com",
          "short": true
        }]
      }];
  }

  if (message.text.toLowerCase().indexOf('Manager') > - 1){
    attachments = [{
      "fallback": "Required Fallback",
      "color": "#439FE0",
      "pretext": "Here comes the Boss himself",
      "fields": [
        {
          "title": "Mike Duddy",
          "value": "Hana Cloud Platform Specialist"
        },
        {
          "title": "Phone",
          "value": "604-232-3334",
          "short": true
        },
        {
          "title": "Email",
          "value": "Mike.Duddy@sap.com",
          "short": true
        }]
      }];
  }

  if (message.text.toLowerCase().indexOf('hybris') > - 1){
    attachments = [{
      "fallback": "Here are your hybris specialists:",
      "color": "#439FE0",
      "pretext": "Here are your hybris specialists:",
      "fields": [
          {
            "title": "Brydon Chan",
            "value": "Hybris Commerce"
          },
          {
            "title": "Phone",
            "value": "604-454-8786",
            "short": true
          },
          {
            "title": "Email",
            "value": "Brydon.Chan@sap.com",
            "short": true
          },

          {
            "title": "Jennifer Baron",
            "value": "Hybris Retail"
          },
          {
            "title": "Phone",
            "value": "480-444-6565",
            "short": true
          },
          {
            "title": "Email",
            "value": "Jennifer.Baron@sap.com",
            "short": true
          },
          {
            "title": "Lyndsay Tilston",
            "value": "Hybris Marketing"
          },
          {
            "title": "Phone",
            "value": "604-665-7852",
            "short": true
          },
          {
            "title": "Email",
            "value": "Lyndsay.Tilston@sap.com",
            "short": true
          },

          {
            "title": "Pablo Hennique",
            "value": "Hybris"
          },
          {
            "title": "Phone",
            "value": "604-787-6652",
            "short": true
          },
          {
            "title": "Email",
            "value": "Pablo.Hennique@sap.com",
            "short": true
          }]
      }];

  }

  if (message.text.toLowerCase().indexOf('analytics') > - 1){
    attachments = [{
      "fallback": "Required Fallback",
      "color": "#439FE0",
      "pretext": "Here are your Analytics specialists: ",
      "fields": [
        {
          "title": "Michael Pereira",
          "value": "Business Objects Analytics"
        },
        {
          "title": "Phone",
          "value": "604-883-4215",
          "short": true
        },
        {
          "title": "Email",
          "value": "Michael.Pereira@sap.com",
          "short": true
        },
        {
          "title": "Kevin Lee",
          "value": "Business Objects Analytics"
        },
        {
          "title": "Phone",
          "value": "604-343-3454",
          "short": true
        },
        {
          "title": "Email",
          "value": "Kevin.Lee@sap.com",
          "short": true
        },
        {
          "title": "Garett Buckley",
          "value": "Business Objects Cloud"
        },
        {
          "title": "Phone",
          "value": "604-234-8791",
          "short": true
        },
        {
          "title": "Email",
          "value": "Garrett.Buckley@sap.com",
          "short": true
        }]
      }];
  }

  if (message.text.toLowerCase().indexOf('bleed') > - 1){
    reply = "yes";
  }
**/
  var channel = self._getChannelById(message.channel);
  self.postMessageToChannel(channel.name, reply, {as_user: true, attachments: attachments});
}

presalesConsultant.prototype._opportunity = function (message) {
  var self = this;
  var attachments = {};
  var reply = "";

  if (message.text.toLowerCase().indexOf('opp') > -1){
    reply = "Here are your top three opportunities in your pipeline."
    attachments = [{
      "fallback": "Required Fallback",
      "color": "good",
      "pretext": "Opportunity #1",
      "fields": [
        {
          "title": "Opportunity",
          "value": "Movers not shakers",
          "short": true
        },
        {
          "title": "Phase",
          "value": "D",
          "short": true
        },
        {
          "title": "Closing Quarter",
          "value": "Q4",
          "short": true
        },
        {
          "title": "Amount",
          "value": "$675,000.00",
          "short": true
        }]
      },
      {
        "fallback": "Required Fallback",
        "color": "warning",
        "pretext": "Opportunity #2",
        "fields": [
          {
            "title": "Opportunity",
            "value": "Sherri's Berries",
            "short": true
          },
          {
            "title": "Phase",
            "value": "E",
            "short": true
          },
          {
            "title": "Closing Quarter",
            "value": "Q4",
            "short": true
          },
          {
            "title": "Amount",
            "value": "$150,000.00",
            "short": true
          }]
        },
        {
          "fallback": "Required Fallback",
          "color": "good",
          "colour:": "danger",
          "pretext": "Opportunity #3",
          "fields": [
            {
              "title": "Opportunity",
              "value": "Temple of Groom",
              "short": true
            },
            {
              "title": "Phase",
              "value": "E",
              "short": true
            },
            {
              "title": "Closing Quarter",
              "value": "Q4",
              "short": true
            },
            {
              "title": "Amount",
              "value": "$125,000.00",
              "short": true
            }]
          }
    ];
    }

    var channel = self._getChannelById(message.channel);
    self.postMessageToChannel(channel.name, reply, {as_user: true, attachments:attachments});
};

presalesConsultant.prototype._search = function (message) {
  var attachments = {};
  var query = message.text;
  var reply = "";
  var searchString = query.slice(13);
  searchString = searchString.trim();


  var queryObject = {}
  queryObject["Name"] = searchString;
  this._response(message, queryObject);


  if(message.text.toLowerCase().indexOf('temple of groom') > -1){
    //LMAO WHERE U AT HOMIE!?
    attachments = [
      {
      "fallback": "Required Fallback",
      "color": "good",
      "colour:": "danger",
      "pretext": "Found 1 Temple of Groom(s)",
      "fields": [
        {
          "title": "Opportunity",
          "value": "Temple of Groom",
          "short": true
        },
        {
          "title": "Phase",
          "value": "E",
          "short": true
        },
        {
          "title": "Closing Quarter",
          "value": "Q4",
          "short": true
        },
        {
          "title": "Amount",
          "value": "$125,000.00",
          "short": true
        },
        {
          "title": "Name",
          "value": "Deyan Ivanov",
          "short": true
        },
        {
          "title": "Role",
          "value": "BoC Account Executive",
          "short": true
        },
        {
          "title": "VAT",
          "value": "Garrett Buckley",
          "short": true
        },
        {
          "title": "Phone",
          "value": "Garrett.Buckley@sap.com",
          "short": true
        }]
      }];
  }

  //var channel = self._getChannelById(message.channel);
  //self.postMessageToChannel(channel.name, reply, {as_user: true, attachments:attachments});
};

presalesConsultant.prototype._pipeline = function (message) {
  var self = this;
  var reply = "We could not find anything in your pipeline for that quarter. :sob:";
  var attachments = {};

  if (message.text.toLowerCase().indexOf('q4') > -1){
    reply = "Here are your the opportunities in your pipeline";
    attachments = [{
      "fallback": "Required Fallback",
      "color": "good",
      "pretext": "Opportunity #1",
      "fields": [
        {
          "title": "Opportunity",
          "value": "Movers not shakers",
          "short": false
        },
        {
          "title": "Phase",
          "value": "D",
          "short": true
        },
        {
          "title": "Closing Quarter",
          "value": "Q4",
          "short": true
        },
        {
          "title": "Amount",
          "value": "$675,000.00",
          "short": true
        },
        {
          "title": "Probability",
          "value": "95%",
          "short": true
        }]
      },
      {
        "fallback": "Required Fallback",
        "color": "green",
        "pretext": "Opportunity #2",
        "fields": [
          {
            "title": "Opportunity",
            "value": "Sherri's Berries",
            "short": false
          },
          {
            "title": "Phase",
            "value": "E",
            "short": true
          },
          {
            "title": "Closing Quarter",
            "value": "Q4",
            "short": true
          },
          {
            "title": "Amount",
            "value": "$150,000.00",
            "short": true
          },
          {
            "title": "Probability",
            "value": "75%",
            "short": true
          }]
        },
        {
          "fallback": "Required Fallback",
          "color": "good",
          "pretext": "Opportunity #3",
          "fields": [
            {
              "title": "Opportunity",
              "value": "Temple of Groom",
              "short": false
            },
            {
              "title": "Phase",
              "value": "E",
              "short": true
            },
            {
              "title": "Closing Quarter",
              "value": "Q4",
              "short": true
            },
            {
              "title": "Amount",
              "value": "$125,000.00",
              "short": true
            },
            {
              "title": "Probability",
              "value": "75%",
              "short": true
            }]
          },
          {
            "fallback": "Required Fallback",
            "color": "warning",
            "pretext": "Opportunity #4",
            "fields": [
              {
                "title": "Opportunity",
                "value": "Bits & PC's",
                "short": false
              },
              {
                "title": "Phase",
                "value": "E",
                "short": true
              },
              {
                "title": "Closing Quarter",
                "value": "Q4",
                "short": true
              },
              {
                "title": "Amount",
                "value": "$75,000.00",
                "short": true
              },
              {
                "title": "Probability",
                "value": "60%",
                "short": true
              }]
            },
            {
              "fallback": "Required Fallback",
              "color": "danger",
              "pretext": "Opportunity #5",
              "fields": [
                {
                  "title": "Opportunity",
                  "value": "Bread Pit",
                  "short": false
                },
                {
                  "title": "Phase",
                  "value": "E",
                  "short": true
                },
                {
                  "title": "Closing Quarter",
                  "value": "Q4",
                  "short": true
                },
                {
                  "title": "Amount",
                  "value": "$55,000.00",
                  "short": true
                },
                {
                  "title": "Probability",
                  "value": "35%",
                  "short": true
                }]
              }
    ];
    }
};


presalesConsultant.prototype._help = function (message) {
  var self = this;

    var reply = "Other commands: \n Presales All \n Presales Manager \n Presales [Hana Cloud Platform]";
    reply += "\n \n This app was built with Hana Cloud Platform";
    var channel = self._getChannelById(message.channel);
    self.postMessageToChannel(channel.name, reply, {as_user: true, color: "#36a64f"});
};

presalesConsultant.prototype._replyWithMessage = function (message) {

  var self = this;
  var reply = "I'm sorry that is not a valid entry";

  //Send to presales method
  if (message.text.toLowerCase().indexOf('hcpbot presales') > -1){
    self._presales(message);
  }

  //Top opp
  if (message.text.toLowerCase().indexOf('hcpbot top') > -1){
    self._opportunity(message);
  }

  //Search
  if (message.text.toLowerCase().indexOf('hcpbot search') > -1){
    self._search(message);
  }

  //Pipeline Report
  if (message.text.toLowerCase().indexOf('hcpbot pipeline') > -1){
    self._pipeline(message);
  }

  //win thing
  if (message.text.toLowerCase().indexOf('hcpbot help') > -1){
    self._help(message);
  }


};
