var restify = require('restify');
var builder = require('botbuilder');
var game = require('./game');

require('dotenv').config({silent: true});

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
var port = process.env.PORT || 3978;
server.listen(port, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/c4bot/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);
var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.onDefault([
    function (session) {
        session.send("Hi there, welcome to c4bot.");
        builder.Prompts.choice(session, "New game or Help?", "new|help");
    },
    function (session, results) {
        if (results.response && results.response.entity != 'help') {
            session.beginDialog('/new');
        } else {
            session.beginDialog('/help');
        }
    }
]);

bot.dialog('/help', [
    function (session) {
        session.send("If you don't know how to play, read Wikipedia lolz.");
    }
]);
bot.dialog('/new', [
    function (session) {
        session.send("Game started...");
        session.userData.game = new game.Game();
        session.beginDialog("/move");
    }
]);

bot.dialog('/move', [
    function (session) {
        builder.Prompts.number(session, "Which column?");
    },
    function (session, results) {
        session.userData.game.action(results.response, function () {
            that.ai(-1);
        });

        var canvasStr = session.userData.game.canvas.toDataURL();
        console.log(canvasStr);

        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/png",
                contentUrl: canvasStr
            }]);
        
        if (!session.userData.game.won) {
            session.replaceDialog("/move");
        }
        
    }
]);
bot.dialog('/end', [
    function (session) {
        session.send("Game ended...");
    }
]);