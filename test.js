// Note: getBoardScale reads from "window.innerWidth"
global.window = {
  innerWidth: 1024
};
var PImage = require('pureimage');
var canvas = PImage.make(640, 480).getContext('2d');
var c4game = require('@kenrick95/c4');

const { GameBase, PlayerAi, PlayerHuman, BoardPiece, BoardBase } = c4game;

class Game extends GameBase {
  constructor(players, board) {
    super(players, board);
  }
  afterMove() {
    // no-op
  }
}

const board = new BoardBase(canvas);
const playerHuman = new PlayerHuman(BoardPiece.PLAYER_1);
const game = new Game(
  [playerHuman, new PlayerAi(BoardPiece.PLAYER_2)],
  board
);
game.start();
playerHuman.doAction(4);
