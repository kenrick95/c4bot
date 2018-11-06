var restify = require('restify');
var builder = require('botbuilder');
var c4game = require('@kenrick95/c4');
var PImage = require('pureimage');
const image = PImage.make(640, 480);
var canvas = image.getContext('2d');

const { GameBase, PlayerAi, PlayerHuman, BoardPiece, BoardBase } = c4game;

class Game extends GameBase {
  constructor(players, board) {
    super(players, board);
  }
  afterMove() {
    // no-op
  }
}

require('dotenv').config();

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
var port = process.env.PORT || 3978;
server.listen(port, function() {
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

intents.matches(/^(new|play|start)/i, [
  function(session) {
    session.beginDialog('/new');
  }
]);
intents.matches(/^(help|how|guide)/i, [
  function(session) {
    session.beginDialog('/help');
  }
]);
intents.onDefault([
  function(session) {
    session.send(
      'Hi there, I am c4bot, a bot that plays Connect Four game with you. Click here https://bots.botframework.com/bot?id=c4bot to find out more about me and my policies.'
    );
    builder.Prompts.choice(
      session,
      'What would you like to do?',
      'New game|Help',
      {
        retryPrompt: 'Sorry, I didn\'t understand that. "New game" or "help"?'
      }
    );
  },
  function(session, results) {
    if (results.response && results.response.entity.toLowerCase() != 'help') {
      session.beginDialog('/new');
    } else {
      session.beginDialog('/help');
    }
  }
]);

bot.dialog('/help', [
  function(session) {
    session.send('I will play a Connect Four game with you.');
    var msg = new builder.Message(session)
      .text('A GIF worth a thousand words.')
      .attachments([
        {
          contentType: 'image/gif',
          contentUrl:
            'https://upload.wikimedia.org/wikipedia/commons/a/ad/Connect_Four.gif'
        }
      ]);
    session.send(msg);
    session.send(
      'If you encounter any issue, please report it to my GitHub repo: https://github.com/kenrick95/c4bot/issues'
    );
    session.endDialog();
  }
]);
bot.dialog('/new', [
  function(session) {
    session.send('Game started...');

    const board = new BoardBase(canvas);
    const game = new Game(
      [new PlayerHuman(BoardPiece.PLAYER_1), new PlayerAi(BoardPiece.PLAYER_2)],
      board
    );
    game.start();
    session.userData.gameState = {
      board: game.board,
      players: game.players,
      currentPlayerId: game.currentPlayerId,
      isMoveAllowed: game.isMoveAllowed,
      isGameWon: game.isGameWon
    };
    session.send(canvasToMessage(session, board, 0));
    session.beginDialog('/move');
  },
  function(session) {
    var wonPlayer = session.userData.gameState.currentPlayerId;
    var gameEnded = session.userData.gameState.isGameWon;

    var msg = '';
    if (gameEnded) {
      msg = "It's a draw";
      if (wonPlayer > 0) {
        msg = 'You won!';
      } else if (wonPlayer < 0) {
        msg = 'Computer won!';
      }
      msg += '\n';
    }

    session.send();
    session.endDialog(
      msg +
        "Game over. Thank you for playing.\nSay 'hi' again to restart the game."
    );
  }
]);
bot.dialog('/invalid', [
  function(session) {
    session.send('Invalid move, please choose another column');
    session.replaceDialog('/move');
  }
]);

bot.dialog('/move', [
  function(session) {
    builder.Prompts.text(session, 'Please choose a column (1-7)');
  },
  function(session, results) {
    if (/^(end|restart)/i.test(results.response)) {
      session.endDialog();
      return;
    }

    var choice = builder.EntityRecognizer.parseNumber(results.response) - 1;
    if (isNaN(choice) || choice < 0 || choice > 6) {
      session.replaceDialog('/invalid');
      return;
    }

    const board = new BoardBase(canvas);
    const game = new Game(
      [new PlayerHuman(BoardPiece.PLAYER_1), new PlayerAi(BoardPiece.PLAYER_2)],
      board
    );
    // restore state
    game.board = session.userData.board;
    game.players = session.userData.players;
    game.currentPlayerId = session.userData.currentPlayerId;
    game.isMoveAllowed = session.userData.board;
    game.isGameWon = session.userData.isGameWon;

    // do action
    // TODO: Idk what this piece of code is about ...
    var valid = game.action(
      choice,
      function() {
        // print state (after user move)
        session.send(canvasToMessage(session, game.canvas, 1));
        session.sendBatch();

        if (!game.gameState.won) {
          this.ai.bind(this)(-1);

          // print state (after AI move)
          session.send(canvasToMessage(session, game.canvas, -1));
        }
      }.bind(game)
    );

    if (valid < 1) {
      session.replaceDialog('/invalid');
      return;
    }

    // save state
    session.userData.gameState = {
        board: game.board,
        players: game.players,
        currentPlayerId: game.currentPlayerId,
        isMoveAllowed: game.isMoveAllowed,
        isGameWon: game.isGameWon
      };

    // next move
    if (!session.userData.gameState.won) {
      session.replaceDialog('/move');
    } else {
      session.endDialog();
    }
  }
]);

function canvasToMessage(session, canvas, player) {
  return new builder.Message(session)
    .text(
      player != 0
        ? player > 0
          ? 'You moved 🔴'
          : 'Computer moved 🔵'
        : 'Waiting for your move'
    )
    .attachments([
      {
        contentType: 'image/png',
        // TODO: Convert this "stream" to "base64"
        contentUrl: PImage.encodePNGToStream(image)
      }
    ]);
}
