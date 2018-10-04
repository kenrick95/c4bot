var PImage = require('pureimage');
var canvas = PImage.make(640, 480).getContext('2d');
var c4game = require('@kenrick95/c4');

const { GameBase, PlayerAi, Player, BoardPiece } = c4game;

class Game extends GameBase {
  constructor(players, canvas) {
    super(players, canvas)
  }
}

class PlayerHuman extends Player {
  constructor(boardPiece, canvas) {
    super(boardPiece, canvas)
    this.clickPromiseResolver = null
  }

  doAction(column) {
    if (this.clickPromiseResolver && 0 <= column && column < Board.COLUMNS) {
      this.clickPromiseResolver(column)
    }
  }

  async getAction(board) {
    return new Promise(r => (this.clickPromiseResolver = r))
  }
}


const game = new Game(
  [
    new PlayerHuman(BoardPiece.PLAYER_1, canvas),
    new PlayerAi(BoardPiece.PLAYER_2, canvas),
  ],
  canvas
);
game.start();
