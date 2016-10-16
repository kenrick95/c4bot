# c4bot

Connect Four chatbot.

## TODO

- modify game.js, so that the game methods not depending on class state
  - game state shall be tracked separately, and should be serializable in JSON.stringify
  - Current issue: if stringify whole Game class, circular dependency is found.
- then modify app.js