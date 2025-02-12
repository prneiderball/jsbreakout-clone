// Ensure the canvas element is present
const canvas = document.getElementById("myCanvas");
if (!canvas) {
  throw new Error("Canvas element not found!");
}
const ctx = canvas.getContext("2d");

// ----------------------------------------------------
// Key Handling: Using a simple key map for arrow keys
// ----------------------------------------------------
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

// ----------------------------------------------------
// Game Entity Classes
// ----------------------------------------------------

// Ball class with enhanced visual styling
class Ball {
  constructor(x, y, radius, dx, dy, color = "#f1c40f") {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dx = dx;
    this.dy = dy;
    this.color = color;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update(canvas) {
    // Bounce off the left and right walls
    if (
      this.x + this.dx > canvas.width - this.radius ||
      this.x + this.dx < this.radius
    ) {
      this.dx = -this.dx;
    }
    // Bounce off the top wall
    if (this.y + this.dy < this.radius) {
      this.dy = -this.dy;
    }
    this.x += this.dx;
    this.y += this.dy;
  }
}

// Paddle class with gradient fill and shadow
class Paddle {
  constructor(x, y, width, height, speed = 7) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    // Create a gradient for the paddle
    let paddleGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x + this.width,
      this.y + this.height
    );
    paddleGradient.addColorStop(0, "#2ecc71");
    paddleGradient.addColorStop(1, "#27ae60");
    ctx.fillStyle = paddleGradient;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update(canvas, keys) {
    if (keys.ArrowRight && this.x < canvas.width - this.width) {
      this.x += this.speed;
    }
    if (keys.ArrowLeft && this.x > 0) {
      this.x -= this.speed;
    }
  }
}

// Brick class with gradient fill and a drop shadow effect
class Brick {
  constructor(x, y, width, height, status = 1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.status = status;
  }

  draw(ctx) {
    if (this.status === 1) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 5;
      // Create a gradient for the brick
      let brickGradient = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x + this.width,
        this.y + this.height
      );
      brickGradient.addColorStop(0, "#e74c3c");
      brickGradient.addColorStop(1, "#c0392b");
      ctx.fillStyle = brickGradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.restore();
    }
  }
}

// ----------------------------------------------------
// Game Settings and the Game Class
// ----------------------------------------------------
const ballRadius = 10;
const initialBallX = canvas.width / 2;
const initialBallY = canvas.height - 30;
const initialDx = 3;
const initialDy = -3;

const paddleHeight = 10;
const paddleWidth = 75;
const paddleY = canvas.height - paddleHeight;

const brickRowCount = 5;
const brickColumnCount = 7;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.ball = new Ball(
      initialBallX,
      initialBallY,
      ballRadius,
      initialDx,
      initialDy
    );
    this.paddle = new Paddle(
      (canvas.width - paddleWidth) / 2,
      paddleY,
      paddleWidth,
      paddleHeight
    );
    this.bricks = [];
    this.gameOver = false;
    this.initBricks();
  }

  // Initialize bricks with pre-calculated positions
  initBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        this.bricks[c][r] = new Brick(brickX, brickY, brickWidth, brickHeight);
      }
    }
  }

  // Draw a gradient background
  drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#2c3e50");
    gradient.addColorStop(1, "#3498db");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Check collision between the ball and the bricks
  collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const brick = this.bricks[c][r];
        if (brick.status === 1) {
          if (
            this.ball.x > brick.x &&
            this.ball.x < brick.x + brick.width &&
            this.ball.y > brick.y &&
            this.ball.y < brick.y + brick.height
          ) {
            this.ball.dy = -this.ball.dy;
            brick.status = 0;
          }
        }
      }
    }
  }

  // Update game logic
  update() {
    this.ball.update(this.canvas);
    this.paddle.update(this.canvas, keys);
    this.collisionDetection();

    // Check collision between ball and paddle (or game over)
    if (this.ball.y + this.ball.dy > this.canvas.height - this.ball.radius) {
      if (
        this.ball.x > this.paddle.x &&
        this.ball.x < this.paddle.x + this.paddle.width
      ) {
        this.ball.dy = -this.ball.dy;
      } else {
        this.gameOver = true;
      }
    }
  }

  // Render all game entities with enhanced visuals
  draw() {
    // Draw the gradient background first
    this.drawBackground();

    // Draw bricks
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        this.bricks[c][r].draw(this.ctx);
      }
    }
    // Draw ball and paddle
    this.ball.draw(this.ctx);
    this.paddle.draw(this.ctx);
  }

  // The main game loop: update and render
  loop() {
    if (!this.gameOver) {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.loop());
    } else {
      this.showGameOver();
    }
  }

  // Display a simple Game Over message with styling
  showGameOver() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = "bold 24px Arial";
    this.ctx.fillStyle = "#f1c40f";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Game Over",
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  }

  // Start the game loop
  start() {
    this.loop();
  }
}

// ----------------------------------------------------
// Start the Game on Button Click
// ----------------------------------------------------
document.getElementById("runButton").addEventListener("click", function () {
  this.disabled = true; // Disable the run button once clicked
  const game = new Game(canvas, ctx);
  game.start();
});
