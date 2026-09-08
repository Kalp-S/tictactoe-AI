import React, { Component } from 'react';
import './App.css';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

class App extends Component {
  constructor() {
    super();
    this.state = {
      board: Array(9).fill(''),
      turn: 'X',
      winner: null,
      winnerLine: 'Your turn (X)',
      gameEnded: false,
      gameLocked: false,
      aiMode: 'minimax', // 'minimax' (unbeatable) or 'casual' (random)
      scores: {
        player: 0,
        ai: 0,
        draws: 0
      }
    };
    // Keep gameState reference for backward compatibility
    this.gameState = {
      turn: 'X',
      gameLocked: false,
      gameEnded: false,
      board: Array(9).fill(''),
      totalMoves: 0
    };
  }

  checkWinnerForBoard(board) {
    for (let combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== '')) {
      return 'draw';
    }
    return null;
  }

  minimax(board, depth, isMaximizing) {
    const result = this.checkWinnerForBoard(board);
    if (result === 'O') return 10 - depth; // AI winning
    if (result === 'X') return depth - 10; // Human winning
    if (result === 'draw') return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
          board[i] = 'O';
          const score = this.minimax(board, depth + 1, false);
          board[i] = '';
          maxScore = Math.max(score, maxScore);
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
          board[i] = 'X';
          const score = this.minimax(board, depth + 1, true);
          board[i] = '';
          minScore = Math.min(score, minScore);
        }
      }
      return minScore;
    }
  }

  getBestMove(board) {
    let bestScore = -Infinity;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        const score = this.minimax(board, 0, false);
        board[i] = '';
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  getRandomMove(board) {
    const emptyIndices = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') emptyIndices.push(i);
    }
    if (emptyIndices.length === 0) return -1;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  makeMove(index) {
    const { board, gameEnded, gameLocked, turn, scores, aiMode } = this.state;
    if (gameEnded || gameLocked || board[index] !== '') return;

    const newBoard = [...board];
    newBoard[index] = turn;
    const nextTurn = turn === 'X' ? 'O' : 'X';
    const result = this.checkWinnerForBoard(newBoard);

    // Sync legacy gameState
    this.gameState.board = newBoard;
    this.gameState.turn = nextTurn;
    this.gameState.totalMoves = newBoard.filter(c => c !== '').length;

    if (result) {
      this.gameState.gameEnded = true;
      let winnerText = 'Match is drawn';
      const updatedScores = { ...scores };
      if (result === 'X') {
        winnerText = 'Match won by X!';
        updatedScores.player += 1;
      } else if (result === 'O') {
        winnerText = 'Match won by O (AI)!';
        updatedScores.ai += 1;
      } else {
        updatedScores.draws += 1;
      }

      this.setState({
        board: newBoard,
        winner: result,
        winnerLine: winnerText,
        gameEnded: true,
        scores: updatedScores
      });
      return;
    }

    // AI's turn
    if (nextTurn === 'O') {
      this.gameState.gameLocked = true;
      this.setState({
        board: newBoard,
        turn: 'O',
        winnerLine: 'AI is thinking...',
        gameLocked: true
      });

      setTimeout(() => {
        const move = aiMode === 'minimax' ? this.getBestMove(newBoard) : this.getRandomMove(newBoard);
        if (move !== -1) {
          const aiBoard = [...newBoard];
          aiBoard[move] = 'O';
          const aiResult = this.checkWinnerForBoard(aiBoard);

          this.gameState.board = aiBoard;
          this.gameState.turn = 'X';
          this.gameState.gameLocked = false;
          this.gameState.totalMoves = aiBoard.filter(c => c !== '').length;

          if (aiResult) {
            this.gameState.gameEnded = true;
            let aiWinnerText = 'Match is drawn';
            const aiScores = { ...this.state.scores };
            if (aiResult === 'O') {
              aiWinnerText = 'Match won by O (AI)!';
              aiScores.ai += 1;
            } else if (aiResult === 'X') {
              aiWinnerText = 'Match won by X!';
              aiScores.player += 1;
            } else {
              aiScores.draws += 1;
            }

            this.setState({
              board: aiBoard,
              winner: aiResult,
              winnerLine: aiWinnerText,
              gameEnded: true,
              gameLocked: false,
              scores: aiScores
            });
          } else {
            this.setState({
              board: aiBoard,
              turn: 'X',
              winnerLine: 'Your turn (X)',
              gameLocked: false
            });
          }
        }
      }, 250);
    } else {
      this.setState({
        board: newBoard,
        turn: nextTurn,
        winnerLine: 'Your turn (X)'
      });
    }
  }

  clicked(boxOrTarget) {
    if (!boxOrTarget) return;
    const index = boxOrTarget.dataset ? parseInt(boxOrTarget.dataset.square, 10) : undefined;
    if (index !== undefined && !isNaN(index)) {
      this.makeMove(index);
    }
  }

  resetGame = () => {
    this.gameState = {
      turn: 'X',
      gameLocked: false,
      gameEnded: false,
      board: Array(9).fill(''),
      totalMoves: 0
    };
    this.setState({
      board: Array(9).fill(''),
      turn: 'X',
      winner: null,
      winnerLine: 'Your turn (X)',
      gameEnded: false,
      gameLocked: false
    });
  };

  toggleMode = (mode) => {
    if (this.state.aiMode === mode) return;
    this.setState({ aiMode: mode }, () => {
      this.resetGame();
    });
  };

  render() {
    const { board, winnerLine, aiMode, scores } = this.state;

    return (
      <div id="game">
        <div id="head">tic tac toe AI</div>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${aiMode === 'minimax' ? 'active' : ''}`}
            onClick={() => this.toggleMode('minimax')}
          >
            Unbeatable (Minimax)
          </button>
          <button
            className={`mode-btn ${aiMode === 'casual' ? 'active' : ''}`}
            onClick={() => this.toggleMode('casual')}
          >
            Casual (Random)
          </button>
        </div>

        <div className="scoreboard">
          <div className="score-item">
            <span className="score-label">Player (X)</span>
            <span className="score-val">{scores.player}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Ties</span>
            <span className="score-val">{scores.draws}</span>
          </div>
          <div className="score-item">
            <span className="score-label">AI (O)</span>
            <span className="score-val">{scores.ai}</span>
          </div>
        </div>

        <div id="status" className="status-badge">
          {winnerLine}
        </div>

        <div id="board">
          {board.map((val, i) => (
            <div
              key={i}
              className={`square ${val ? 'filled ' + val.toLowerCase() : ''}`}
              data-square={i}
              onClick={() => this.makeMove(i)}
            >
              {val}
            </div>
          ))}
        </div>

        <button className="reset-btn" onClick={this.resetGame}>
          Reset Game
        </button>
      </div>
    );
  }
}

export default App;
