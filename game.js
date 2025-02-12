const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const runButton = document.getElementById("runButton");
const pauseButton = document.getElementById("pauseButton");
const scoreDisplay = document.getElementById("scoreDisplay");

// Initially hide the pause button.
pauseButton.style.display = "none";

// Responsive Canvas
function updateCanvasSize() {
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.7;

  // If a game is running, reset its dimensions.
  game?.reset();
}
window.addEventListener("resize", updateCanvasSize);

// Game State Variables
let keys = { ArrowRight: false, ArrowLeft: false };
let game = null;
let isPaused = false;

// Handle Key Events
document.addEventListener("keydown", (e) => {
  if (keys[e.key] !== undefined) keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  if (keys[e.key] !== undefined) keys[e.key] = false;
});

// Paddle Class
class Paddle {
  constructor() {
    this.width = canvas.width * 0.15;
    this.height = 10;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 10;
    this.speed = 7;
  }

  move() {
    if (keys.ArrowRight && this.x < canvas.width - this.width)
      this.x += this.speed;
    if (keys.ArrowLeft && this.x > 0) this.x -= this.speed;
  }

  draw() {
    ctx.save();
    // Glow effect for the paddle
    ctx.shadowColor = "#2ecc71";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}

// Ball Class
class Ball {
  constructor() {
    this.radius = Math.max(canvas.width * 0.015, 5);
    this.reset();
  }

  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height - 30;
    this.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
    this.dy = -3;
  }

  move() {
    this.x += this.dx;
    this.y += this.dy;

    // Bounce off left/right walls
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width)
      this.dx *= -1;
    // Bounce off the top wall
    if (this.y - this.radius < 0) this.dy *= -1;
  }

  draw() {
    ctx.save();
    // Glow effect for the ball
    ctx.shadowColor = "#f1c40f";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Brick Class
class Brick {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = canvas.width / Math.floor(canvas.width / 90) - 10;
    this.height = 20;
    this.status = 1;
  }

  draw() {
    if (this.status === 1) {
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

// Game Class
class Game {
  constructor() {
    this.paddle = new Paddle();
    this.ball = new Ball();
    this.bricks = [];
    this.score = 0;
    this.gameOver = false;
    this.initBricks();
  }

  initBricks() {
    this.bricks = [];
    const columns = Math.floor(canvas.width / 90);
    for (let c = 0; c < columns; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < 5; r++) {
        this.bricks[c][r] = new Brick(
          c * (this.bricks[c]?.[r - 1]?.width + 10),
          r * (20 + 10) + 40
        );
      }
    }
  }

  reset() {
    this.paddle = new Paddle();
    this.ball = new Ball();
    this.initBricks();
    this.score = 0;
    this.gameOver = false;
    scoreDisplay.textContent = "Score: 0";
  }

  checkCollisions() {
    // Check collision with bricks
    this.bricks.forEach((col) =>
      col.forEach((brick) => {
        if (
          brick.status === 1 &&
          this.ball.x > brick.x &&
          this.ball.x < brick.x + brick.width &&
          this.ball.y > brick.y &&
          this.ball.y < brick.y + brick.height
        ) {
          this.ball.dy *= -1;
          brick.status = 0;
          this.score += 10;
          scoreDisplay.textContent = `Score: ${this.score}`;
        }
      })
    );

    // Check collision with paddle
    if (this.ball.y + this.ball.dy > canvas.height - this.ball.radius) {
      if (
        this.ball.x > this.paddle.x &&
        this.ball.x < this.paddle.x + this.paddle.width
      ) {
        let angle =
          (((this.ball.x - (this.paddle.x + this.paddle.width / 2)) /
            this.paddle.width) *
            Math.PI) /
          3;
        this.ball.dy = -Math.abs(this.ball.dy);
        this.ball.dx = 5 * Math.sin(angle);
      } else {
        this.gameOver = true;
      }
    }
  }

  checkWin() {
    // Win if all bricks are cleared.
    return this.bricks.flat().every((brick) => brick.status === 0);
  }

  update() {
    if (this.gameOver || isPaused) return;
    this.paddle.move();
    this.ball.move();
    this.checkCollisions();

    if (this.checkWin()) this.gameOver = true;
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.paddle.draw();
    this.ball.draw();
    this.bricks.forEach((col) => col.forEach((brick) => brick.draw()));
  }

  loop() {
    if (!this.gameOver) {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.loop());
    } else {
      alert("Game Over! Your Score: " + this.score);
      // When the game ends, hide the pause button and show the start button.
      pauseButton.style.display = "none";
      runButton.style.display = "block";
    }
  }

  start() {
    isPaused = false;
    this.loop();
  }

  togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
    if (!isPaused) this.loop();
  }
}

// Event Listeners

// Start Game: Hide start button and show pause button.
runButton.addEventListener("click", () => {
  runButton.style.display = "none";
  pauseButton.style.display = "block";
  updateCanvasSize();
  game = new Game();
  game.start();
});

// Toggle Pause/Resume
pauseButton.addEventListener("click", () => {
  if (game) game.togglePause();
});

// Initialize the canvas size on load.
updateCanvasSize();
