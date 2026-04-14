document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('#tetris-grid');
  const nextGrid = document.querySelector('#next-grid');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const finalScoreEl = document.getElementById('final-score');
  const width = 10;
  let cells = [], nextCells = [];
  let score = 0, level = 1, speed = 800, timerId = null;

  // Inicializar tablero principal y preview
  for (let i = 0; i < 200; i++) {
    const c = document.createElement('div'); 
    c.className = 'cell';
    grid.appendChild(c); 
    cells.push(c);
  }
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('div'); 
    c.className = 'n-cell';
    nextGrid.appendChild(c); 
    nextCells.push(c);
  }

  // Definición de piezas
  const shapes = {
    'I': [[1, width+1, width*2+1, width*3+1], [width, width+1, width+2, width+3]],
    'L': [[1, width+1, width*2+1, width*2+2], [width, width+1, width+2, width*2], [0, 1, width+1, width*2+1], [2, width, width+1, width+2]],
    'O': [[0, 1, width, width+1]],
    'T': [[1, width, width+1, width+2], [1, width+1, width+2, width*2+1], [width, width+1, width+2, width*2+1], [1, width, width+1, width*2+1]],
    'Z': [[0, 1, width+1, width+2], [1, width, width+1, width*2]],
    'S': [[1, 2, width, width+1], [0, width, width+1, width*2+1]]
  };

  const colors = ['p-i', 'p-l', 'p-o', 'p-t', 'p-z', 'p-s'];
  const keys = Object.keys(shapes);
  let curType, curRot, curPos, curColor;
  let nType = keys[Math.floor(Math.random() * keys.length)], 
      nColor = colors[Math.floor(Math.random() * colors.length)];

  // --- Rotación segura (Wall Kick) ---
  function isRotationSafe(newRotation, newPos) {
    const centerCol = newPos % width;
    return newRotation.every(idx => {
      const targetIdx = newPos + idx;
      const targetCol = targetIdx % width;
      if (targetIdx < 0 || targetIdx >= 200) return false;
      if (cells[targetIdx].classList.contains('taken')) return false;
      if (Math.abs(targetCol - centerCol) > 2 && curType !== 'I') return false;
      if (Math.abs(targetCol - centerCol) > 3 && curType === 'I') return false;
      return true;
    });
  }

  function rotate() {
    const nextRotIndex = (curRot + 1) % shapes[curType].length;
    const nextRotation = shapes[curType][nextRotIndex];
    if (isRotationSafe(nextRotation, curPos)) {
      curRot = nextRotIndex;
    } else if (isRotationSafe(nextRotation, curPos + 1)) {
      curPos += 1; curRot = nextRotIndex;
    } else if (isRotationSafe(nextRotation, curPos - 1)) {
      curPos -= 1; curRot = nextRotIndex;
    }
  }

  // --- Colisiones ---
  function checkCollision(move) {
    return shapes[curType][curRot].some(idx => {
      const nextIdx = curPos + idx + move;
      const nextCol = nextIdx % width;
      if (nextIdx >= 200 || nextIdx < 0) return true;
      if (cells[nextIdx].classList.contains('taken')) return true;
      if (move === 1 && nextCol === 0) return true;
      if (move === -1 && nextCol === 9) return true;
      return false;
    });
  }

  // --- Spawning ---
  function spawn() {
    curType = nType; curColor = nColor;
    curRot = 0; curPos = 3;
    nType = keys[Math.floor(Math.random() * keys.length)];
    nColor = colors[Math.floor(Math.random() * colors.length)];
    drawNext();
    if (checkCollision(0)) gameOver();
  }

  function drawNext() {
    nextCells.forEach(c => c.className = 'n-cell');
    shapes[nType][0].forEach(idx => {
      const r = Math.floor(idx / width), c = idx % width;
      const ni = r * 4 + c;
      if(nextCells[ni]) nextCells[ni].classList.add(nColor);
    });
  }

  // --- Dibujar piezas ---
  function draw(active) {
    shapes[curType][curRot].forEach(idx => {
      if(cells[curPos + idx]) {
        if(active) cells[curPos + idx].classList.add(curColor);
        else cells[curPos + idx].classList.remove(curColor);
      }
    });
  }

  // --- Congelar pieza y limpiar líneas ---
  function freeze() {
    shapes[curType][curRot].forEach(idx => cells[curPos + idx].classList.add('taken', curColor));
    clearLines();
    spawn();
    draw(true);
  }

  function clearLines() {
    for (let i = 0; i < 200; i += width) {
      const row = Array.from({length: width}, (_, k) => i + k);
      if (row.every(idx => cells[idx].classList.contains('taken'))) {
        score += 100;
        scoreEl.innerText = score;
        if (score % 500 === 0 && level < 20) {
          level++;
          levelEl.innerText = level;
          speed = Math.max(100, speed - 70);
          startLoop();
        }
        row.forEach(idx => cells[idx].className = 'cell');
        const removed = cells.splice(i, width);
        cells = removed.concat(cells);
        cells.forEach(c => grid.appendChild(c));
      }
    }
  }

  // --- Controles ---
  window.control = (dir) => {
    if (!timerId) return;
    draw(false);
    if (dir === 'LEFT' && !checkCollision(-1)) curPos--;
    if (dir === 'RIGHT' && !checkCollision(1)) curPos++;
    if (dir === 'DOWN') { 
      if (!checkCollision(width)) curPos += width; 
      else freeze(); 
    }
    if (dir === 'UP' || dir === 'Z') rotate();
    if (dir === 'SPACE') { 
      while (!checkCollision(width)) curPos += width; 
      freeze(); 
    }
    draw(true);
  };

  // --- Loop principal ---
  function startLoop() {
    clearInterval(timerId);
    timerId = setInterval(() => control('DOWN'), speed);
  }

  window.startGame = () => {
    document.getElementById('start-overlay').style.display = 'none';
    spawn(); draw(true); startLoop();
  };

  function gameOver() {
    clearInterval(timerId);
    timerId = null;
    finalScoreEl.innerText = score;
    document.getElementById('game-over-modal').style.display = 'flex';
  }

  // --- Controles por teclado ---
  document.onkeydown = (e) => {
    const k = {37:'LEFT', 39:'RIGHT', 40:'DOWN', 38:'UP', 90:'Z', 32:'SPACE'};
    if(k[e.keyCode]) {
      e.preventDefault();
      control(k[e.keyCode]);
    }
  };
});
