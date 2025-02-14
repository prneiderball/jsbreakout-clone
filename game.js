const GAME_CONSTANTS = {
  PADDLE_SPEED: 7,
  PADDLE_WIDTH_RATIO: 0.15,
  PADDLE_HEIGHT: 10,
  BALL_RADIUS_RATIO: 0.015,
  BALL_MIN_RADIUS: 5,
  BALL_INITIAL_SPEED: 4,
  BRICK_ROWS: 5,
  BRICK_SPACING: 10,
  BRICK_HEIGHT: 20,
  SCORE_PER_BRICK: 10,
  CANVAS_WIDTH_RATIO: 0.8,
  CANVAS_HEIGHT_RATIO: 0.7,
  BRICK_BASE_WIDTH: 90
};

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const runButton = document.getElementById("runButton");
const pauseButton = document.getElementById("pauseButton");
const scoreDisplay = document.getElementById("scoreDisplay");

pauseButton.style.display = "none";

const backgroundMusic = new Audio("./audio/mainsong.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

let keys = { ArrowRight: false, ArrowLeft: false };
let game = null;
let resizeTimeout;

function updateCanvasSize() {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    canvas.width = window.innerWidth * GAME_CONSTANTS.CANVAS_WIDTH_RATIO;
    canvas.height = window.innerHeight * GAME_CONSTANTS.CANVAS_HEIGHT_RATIO;
    game?.reset();
  }, 100);
}

function preloadaudio(url) {
  const audio = new Audio(url);
  audio.preload = "auto";
  return audio;
}

window.addEventListener("resize", updateCanvasSize);

document.addEventListener("keydown", (e) => {
  if (keys[e.key] !== undefined) keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  if (keys[e.key] !== undefined) keys[e.key] = false;
});

class Paddle {
  constructor() {
    this.width = canvas.width * GAME_CONSTANTS.PADDLE_WIDTH_RATIO;
    this.height = GAME_CONSTANTS.PADDLE_HEIGHT;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - this.height - 10;
    this.speed = GAME_CONSTANTS.PADDLE_SPEED;
  }
  move() {
    if (keys.ArrowRight && this.x < canvas.width - this.width) {
      this.x += this.speed;
    }
    if (keys.ArrowLeft && this.x > 0) {
      this.x -= this.speed;
    }
  }
  draw() {
    ctx.save();
    ctx.shadowColor = "#2ecc71";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}

class Ball {
  constructor() {
    this.radius = Math.max(
      canvas.width * GAME_CONSTANTS.BALL_RADIUS_RATIO,
      GAME_CONSTANTS.BALL_MIN_RADIUS
    );
    this.reset();
  }
  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height - 30;
    this.dx =
      GAME_CONSTANTS.BALL_INITIAL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    this.dy = -GAME_CONSTANTS.BALL_INITIAL_SPEED;
  }
  move() {
    this.x += this.dx;
    this.y += this.dy;
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
      this.dx *= -1;
    }
    if (this.y - this.radius < 0) {
      this.dy *= -1;
    }
  }
  draw() {
    ctx.save();
    ctx.shadowColor = "#f1c40f";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Brick {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = GAME_CONSTANTS.BRICK_HEIGHT;
    this.status = 1;
  }
  draw() {
    if (this.status === 1) {
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

class FloatingNumber {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.lifetime = 60;
    this.opacity = 1;
  }
  update() {
    this.y -= 1;
    this.lifetime--;
    this.opacity = this.lifetime / 60;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = "#00c3ff";
    ctx.font = "20px Arial";
    ctx.fillText(this.value, this.x, this.y);
    ctx.restore();
  }
}

class Game {
  constructor() {
    this.paddle = new Paddle();
    this.ball = new Ball();
    this.bricks = [];
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.animationFrameId = null;
    this.floatingNumbers = [];
    this.initBricks();
    this.loop = this.loop.bind(this);
  }
  initBricks() {
    this.bricks = [];
    const columns = Math.floor(canvas.width / GAME_CONSTANTS.BRICK_BASE_WIDTH);
    const brickWidth = canvas.width / columns - GAME_CONSTANTS.BRICK_SPACING;
    this.bricksRemaining = 0;
    for (let c = 0; c < columns; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < GAME_CONSTANTS.BRICK_ROWS; r++) {
        const x = c * (brickWidth + GAME_CONSTANTS.BRICK_SPACING);
        const y =
          r * (GAME_CONSTANTS.BRICK_HEIGHT + GAME_CONSTANTS.BRICK_SPACING) + 40;
        this.bricks[c][r] = new Brick(x, y, brickWidth);
        this.bricksRemaining++;
      }
    }
  }
  reset() {
    this.paddle = new Paddle();
    this.ball = new Ball();
    this.initBricks();
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.floatingNumbers = [];
    scoreDisplay.textContent = "Score: 0";
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.loop();
  }
  checkCollisions() {
    const ballX = this.ball.x,
      ballY = this.ball.y,
      ballRadius = this.ball.radius;
    let collisionFound = false;
    for (let c = 0; c < this.bricks.length && !collisionFound; c++) {
      for (let r = 0; r < this.bricks[c].length; r++) {
        const brick = this.bricks[c][r];
        if (
          brick.status === 1 &&
          ballX > brick.x &&
          ballX < brick.x + brick.width &&
          ballY > brick.y &&
          ballY < brick.y + brick.height
        ) {
          this.ball.dy *= -1;
          brick.status = 0;
          this.score += GAME_CONSTANTS.SCORE_PER_BRICK;
          scoreDisplay.textContent = `Score: ${this.score}`;
          this.bricksRemaining--;
          this.floatingNumbers.push(
            new FloatingNumber(brick.x, brick.y, GAME_CONSTANTS.SCORE_PER_BRICK)
          );
          collisionFound = true;
          break;
        }
      }
    }
    if (this.ball.y + this.ball.dy > canvas.height - this.ball.radius) {
      if (
        this.ball.x > this.paddle.x &&
        this.ball.x < this.paddle.x + this.paddle.width
      ) {
        const paddleCenter = this.paddle.x + this.paddle.width / 2;
        const relativeIntersect = this.ball.x - paddleCenter;
        const normalizedRelativeIntersect =
          relativeIntersect / (this.paddle.width / 2);
        const bounceAngle = normalizedRelativeIntersect * (Math.PI / 3);
        this.ball.dy = -Math.abs(this.ball.dy);
        this.ball.dx =
          GAME_CONSTANTS.BALL_INITIAL_SPEED * Math.sin(bounceAngle);
      } else {
        this.gameOver = true;
      }
    }
  }
  checkWin() {
    return this.bricksRemaining === 0;
  }
  update() {
    if (this.gameOver || this.paused) return;
    this.paddle.move();
    this.ball.move();
    this.checkCollisions();
    this.floatingNumbers = this.floatingNumbers.filter((fn) => {
      fn.update();
      return fn.lifetime > 0;
    });
    if (this.checkWin()) {
      this.gameOver = true;
    }
  }
  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.paddle.draw();
    this.ball.draw();
    for (let c = 0; c < this.bricks.length; c++) {
      for (let r = 0; r < this.bricks[c].length; r++) {
        this.bricks[c][r].draw();
      }
    }
    this.floatingNumbers.forEach((fn) => fn.draw(ctx));
  }
  loop() {
    if (this.gameOver) {
      alert("Game Over! Your Score: " + this.score);
      pauseButton.style.display = "none";
      runButton.style.display = "block";
      return;
    }
    if (!this.paused) {
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  }
  start() {
    this.paused = false;
    this.gameOver = false;
    this.loop();
    backgroundMusic.play();
  }
  togglePause() {
    this.paused = !this.paused;
    pauseButton.textContent = this.paused ? "Resume" : "Pause";
    if (!this.paused) {
      this.loop();
    } else if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

runButton.addEventListener("click", () => {
  runButton.style.display = "none";
  pauseButton.style.display = "block";
  updateCanvasSize();
  game = new Game();
  game.start();
});

pauseButton.addEventListener("click", () => {
  if (game) game.togglePause();
});

updateCanvasSize();
