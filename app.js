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
bot.dialog('/', [
    function (session) {
        session.send("Hi there, welcome to c4bot, a bot that plays Connect Four game with you.");
        builder.Prompts.choice(session, "What would you like to do?", "New game|Help");
    },
    function (session, results) {
        if (results.response && results.response.entity.toLowerCase() != 'help') {
            session.beginDialog('/new');
        } else {
            session.beginDialog('/help');
        }
    }
]);

bot.dialog('/help', [
    function (session) {
        session.send("This bot will play a Connect Four game with you.");
        var msg = new builder.Message(session)
            .text("A GIF worth a thousand words.")
            .attachments([{
                contentType: "image/gif",
                contentUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Connect_Four.gif"
            }]);
        session.send(msg);
        session.send("If you encounter any issue, please report it at my GitHub repo: https://github.com/kenrick95/c4bot/issues");
        session.endDialog();
    }
]);
bot.dialog('/new', [
    function (session) {
        session.send("Game started...");
        var game = new c4game.Game();
        session.userData.gameState = game.gameState;
        session.beginDialog("/move");
    },
    function (session) {
        session.send("Game over. Thank you for playing.");
        session.endDialog();
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
        } else {
            session.endDialog();
        }
    }
]);
