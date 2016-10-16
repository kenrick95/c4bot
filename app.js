var restify = require('restify');
var builder = require('botbuilder');
var c4game = require('./game');

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
        // session.beginDialog('/new');
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
        var game = new c4game.Game();
        session.userData.gameState = game.gameState;
        session.beginDialog("/move");
    }
]);

bot.dialog('/move', [
    function (session) {
        builder.Prompts.number(session, "Which column?");
    },
    function (session, results) {
        var game = new c4game.Game();
        // restore state
        game.gameState = session.userData.gameState;

        // resume game
        game.gameState.paused = false;

        // do action
        game.action(results.response, function () {
            this.ai.bind(this)(-1);
        }.bind(game));
        
        // save state
        session.userData.gameState = game.gameState;


        // print image
        var canvasStr = game.canvas.toDataURL();
        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/png",
                contentUrl: canvasStr
            }]);
        session.send(msg);
        
        // next move
        if (!session.userData.gameState.won) {
            session.replaceDialog("/move");
        }
    }
]);
bot.dialog('/end', [
    function (session) {
        session.send("Game ended...");
    }
]);