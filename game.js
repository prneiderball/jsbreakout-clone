const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Responsive scaling
let canvasWidth = window.innerWidth * 0.8;
let canvasHeight = window.innerHeight * 0.7;

// Adjusted paddle & ball sizes based on screen width
let paddleWidth, paddleHeight, paddleY, ballRadius;
let brickRowCount,
  brickColumnCount,
  brickWidth,
  brickHeight,
  brickPadding,
  brickOffsetTop,
  brickOffsetLeft;

const keys = {
  ArrowRight: false,
  ArrowLeft: false
};

document.addEventListener("keydown", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
});
document.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});

// Responsive Resize Function
function updateCanvasSize() {
  canvasWidth = window.innerWidth * 0.8;
  canvasHeight = window.innerHeight * 0.7;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Adjust sizes proportionally
  paddleWidth = canvasWidth * 0.15;
  paddleHeight = 10;
  paddleY = canvasHeight - paddleHeight - 10;
  ballRadius = Math.max(canvasWidth * 0.015, 5);

  // Brick grid adjustments
  brickRowCount = 5;
  brickColumnCount = Math.floor(canvasWidth / 90); // Adjust brick count per row
  brickWidth = canvasWidth / brickColumnCount - 10;
  brickHeight = 20;
  brickPadding = 10;
  brickOffsetTop = 40;
  brickOffsetLeft =
    (canvasWidth - brickColumnCount * (brickWidth + brickPadding)) / 2;

  if (currentGame) {
    currentGame.initBricks();
  }
}

// Paddle Class
class Paddle {
  constructor() {
    this.x = (canvasWidth - paddleWidth) / 2;
    this.y = paddleY;
    this.width = paddleWidth;
    this.height = paddleHeight;
    this.speed = 7;
  }

  draw(ctx) {
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    if (keys.ArrowRight && this.x < canvasWidth - this.width) {
      this.x += this.speed;
    }
    if (keys.ArrowLeft && this.x > 0) {
      this.x -= this.speed;
    }
  }
}

// Ball Class
class Ball {
  constructor() {
    this.x = canvasWidth / 2;
    this.y = canvasHeight - 30;
    this.dx = 3;
    this.dy = -3;
    this.radius = ballRadius;
  }

  draw(ctx) {
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;

    if (
      this.x + this.dx > canvasWidth - this.radius ||
      this.x + this.dx < this.radius
    ) {
      this.dx = -this.dx;
    }
    if (this.y + this.dy < this.radius) {
      this.dy = -this.dy;
    }
  }
}

// Brick Class
class Brick {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = brickWidth;
    this.height = brickHeight;
    this.status = 1;
  }

  draw(ctx) {
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
    this.gameOver = false;
    this.score = 0;
    this.initBricks();
  }

  initBricks() {
    this.bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        this.bricks[c][r] = new Brick(brickX, brickY);
      }
    }
  }

  collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        let b = this.bricks[c][r];
        if (b.status === 1) {
          if (
            this.ball.x > b.x &&
            this.ball.x < b.x + b.width &&
            this.ball.y > b.y &&
            this.ball.y < b.y + b.height
          ) {
            this.ball.dy = -this.ball.dy;
            b.status = 0;
            this.score += 10;
          }
        }
      }
    }
  }

  checkWin() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        if (this.bricks[c][r].status === 1) {
          return false;
        }
      }
    }
    return true;
  }

  update() {
    this.paddle.update();
    this.ball.update();
    this.collisionDetection();

    if (this.ball.y + this.ball.dy > canvasHeight - this.ball.radius) {
      if (
        this.ball.x > this.paddle.x &&
        this.ball.x < this.paddle.x + this.paddle.width
      ) {
        this.ball.dy = -this.ball.dy;
      } else {
        this.gameOver = true;
      }
    }

    if (this.checkWin()) {
      this.gameOver = true;
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.paddle.draw(ctx);
    this.ball.draw(ctx);
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        this.bricks[c][r].draw(ctx);
      }
    }
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + this.score, 8, 20);
  }

  loop() {
    if (!this.gameOver) {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.loop());
    }
  }

  start() {
    this.loop();
  }
}

// Start & Restart Game
let currentGame = null;
document.getElementById("runButton").addEventListener("click", function () {
  this.disabled = true;
  updateCanvasSize();
  currentGame = new Game();
  currentGame.start();
});

// Listen for window resize
window.addEventListener("resize", updateCanvasSize);
