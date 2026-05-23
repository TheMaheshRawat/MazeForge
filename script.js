const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const sizeInput = document.getElementById("size");
const speedInput = document.getElementById("speed");
const bestTimeEl = document.getElementById("bestTime");

const generateBtn = document.getElementById("generateBtn");
const solveDFSBtn = document.getElementById("solveDFSBtn");
const solveBFSBtn = document.getElementById("solveBFSBtn");
const clearBtn = document.getElementById("clearBtn");

const WALL = 1;
const PASSAGE = 0;
const PATH = 3;
const VISITED = 4;
let maze = [];
let mazeSize = 31;
let cellSize = 20;
let solvingStartTime = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createMazeArray(size) {
  return Array.from({ length: size }, () =>
    Array(size).fill(WALL)
  );
}function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function generateMaze() {
  mazeSize = parseInt(sizeInput.value);

  if (mazeSize % 2 === 0) mazeSize++;

  maze = createMazeArray(mazeSize);

  canvas.width = mazeSize * cellSize;
  canvas.height = mazeSize * cellSize;

  await carve(1, 1);
  drawMaze();
}
async function carve(r, c) {
  maze[r][c] = PASSAGE;

  const dirs = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2]
  ];

  shuffle(dirs);

  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (
      nr > 0 &&
      nr < mazeSize - 1 &&
      nc > 0 &&
      nc < mazeSize - 1 &&
      maze[nr][nc] === WALL
    ) {
      maze[r + dr / 2][c + dc / 2] = PASSAGE;

      drawMaze();
      await sleep(101 - speedInput.value);

      await carve(nr, nc);
    }
  }
}function glowRect(x, y, size, color) {
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.shadowBlur = 0;
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < mazeSize; r++) {
    for (let c = 0; c < mazeSize; c++) {
      const x = c * cellSize;
      const y = r * cellSize;

      switch (maze[r][c]) {
        case WALL:
          ctx.fillStyle = "#1a1a1d";
          break;

        case PASSAGE:
          ctx.fillStyle = "#f2f2f3";
          break;

        case VISITED:
          glowRect(x, y, cellSize, "#00aeef");
          continue;

        case PATH:
          glowRect(x, y, cellSize, "#ff3366");
          continue;
      }

      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  glowRect(cellSize, cellSize, cellSize, "#6cff6c");

  glowRect(
    (mazeSize - 2) * cellSize,
    (mazeSize - 2) * cellSize,
    cellSize,
    "#ffe600"
  );
}function resetSolution() {
  for (let r = 0; r < mazeSize; r++) {
    for (let c = 0; c < mazeSize; c++) {
      if (maze[r][c] === VISITED || maze[r][c] === PATH) {
        maze[r][c] = PASSAGE;
      }
    }
  }

  drawMaze();
}

async function solveDFS() {
  resetSolution();

  solvingStartTime = performance.now();

  const visited = Array.from({ length: mazeSize }, () =>
    Array(mazeSize).fill(false)
  );

  await dfs(1, 1, visited);

  saveBestTime();
}

async function dfs(r, c, visited) {
  if (
    r < 0 ||
    c < 0 ||
    r >= mazeSize ||
    c >= mazeSize ||
    maze[r][c] === WALL ||
    visited[r][c]
  ) {
    return false;
  }

  visited[r][c] = true;

  if (!(r === 1 && c === 1)) {
    maze[r][c] = VISITED;
  }

  drawMaze();
  await sleep(101 - speedInput.value);

  if (r === mazeSize - 2 && c === mazeSize - 2) {
    maze[r][c] = PATH;
    drawMaze();
    return true;
  }

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (const [dr, dc] of dirs) {
    if (await dfs(r + dr, c + dc, visited)) {
      maze[r][c] = PATH;
      drawMaze();
      return true;
    }
  }

  return false;
}

async function solveBFS() {
  resetSolution();

  solvingStartTime = performance.now();

  const visited = Array.from({ length: mazeSize }, () =>
    Array(mazeSize).fill(false)
  );

  const queue = [];
  queue.push([1, 1, null]);

  while (queue.length) {
    const [r, c, prev] = queue.shift();

    if (
      r < 0 ||
      c < 0 ||
      r >= mazeSize ||
      c >= mazeSize ||
      visited[r][c] ||
      maze[r][c] === WALL
    ) {
      continue;
    }

    visited[r][c] = true;

    if (!(r === 1 && c === 1)) {
      maze[r][c] = VISITED;
    }

    drawMaze();
    await sleep(101 - speedInput.value);

    if (r === mazeSize - 2 && c === mazeSize - 2) {
      let current = { r, c, prev };

      while (current) {
        maze[current.r][current.c] = PATH;
        current = current.prev;
      }

      drawMaze();
      saveBestTime();
      return;
    }

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];

    for (const [dr, dc] of dirs) {
      queue.push([
        r + dr,
        c + dc,
        { r, c, prev }
      ]);
    }
  }
}

function saveBestTime() {
  const total = ((performance.now() - solvingStartTime) / 1000).toFixed(2);

  const best = localStorage.getItem("maze_best_time");

  if (!best || total < parseFloat(best)) {
    localStorage.setItem("maze_best_time", total);
    bestTimeEl.textContent = `${total}s`;
  }
}

function loadBestTime() {
  const best = localStorage.getItem("maze_best_time");

  if (best) {
    bestTimeEl.textContent = `${best}s`;
  }
}

generateBtn.addEventListener("click", generateMaze);
solveDFSBtn.addEventListener("click", solveDFS);
solveBFSBtn.addEventListener("click", solveBFS);
clearBtn.addEventListener("click", resetSolution);

loadBestTime();
generateMaze();