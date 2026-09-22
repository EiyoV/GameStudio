// ==================== 步骤4：地图场景编辑器 ====================

function createNewMap() {
  const width = 20;
  const height = 15;
  const cells = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({ type: "ground", collide: false });
    }
    cells.push(row);
  }
  return {
    id: genId("map"),
    name: "新地图",
    desc: "",
    bgColor: "#1a2744",
    width: width,
    height: height,
    cells: cells,
    objects: []
  };
}

function renderMapList() {
  const list = GameData.maps;
  if (list.length === 0) {
    return `<div class="empty-tip">暂无地图，点击左侧【新建地图】创建</div>`;
  }
  return list.map(m => `
    <div class="list-item ${state.selectedId === m.id ? 'selected' : ''}" onclick="selectDataItem('maps','${m.id}')">
      <div>
        <div><b>${m.name}</b></div>
        <div style="font-size:12px;color:var(--text-gray);">${m.width}×${m.height} · ${m.id}</div>
      </div>
      <button class="tool-btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();deleteDataItem('maps','${m.id}')">删除</button>
    </div>
  `).join("");
}

function renderMapEditor() {
  const map = findById("maps", state.selectedId);
  if (!map) {
    return `<div class="empty-tip">从左侧选择一张地图进行编辑，或新建地图</div>`;
  }
  return `
    <div class="edit-card">
      <div class="card-title">地图属性：${map.name}</div>
      <div class="form-grid">
        <div class="form-item">
          <label>地图名称</label>
          <input value="${map.name}" onchange="updateField('maps','name',this.value)">
        </div>
        <div class="form-item">
          <label>背景色</label>
          <input type="color" value="${map.bgColor}" onchange="updateField('maps','bgColor',this.value)">
        </div>
        <div class="form-item">
          <label>宽度（格）</label>
          <input type="number" value="${map.width}" onchange="resizeMap(this.value, ${map.height})">
        </div>
        <div class="form-item">
          <label>高度（格）</label>
          <input type="number" value="${map.height}" onchange="resizeMap(${map.width}, this.value)">
        </div>
        <div class="form-item full-col">
          <label>地图描述</label>
          <textarea rows="2" onchange="updateField('maps','desc',this.value)">${map.desc}</textarea>
        </div>
      </div>
    </div>

    <div class="edit-card">
      <div class="card-title">地图绘制</div>
      <div class="map-toolbar">
        <button class="tool-btn ${state.mapTool === 'ground' ? 'btn-primary' : 'btn-default'}" onclick="setMapTool('ground')">🌱 地面</button>
        <button class="tool-btn ${state.mapTool === 'wall' ? 'btn-danger' : 'btn-default'}" onclick="setMapTool('wall')">🧱 碰撞墙</button>
        <button class="tool-btn ${state.mapTool === 'spawn' ? 'btn-success' : 'btn-default'}" onclick="setMapTool('spawn')">📍 出生点</button>
        <span style="color:var(--text-gray);font-size:13px;align-self:center;">点击格子绘制，当前工具：${state.mapTool}</span>
      </div>
      <div class="map-canvas-wrap">
        <div id="mapCanvas"></div>
      </div>
    </div>
  `;
}

function setMapTool(tool) {
  state.mapTool = tool;
  renderDataEditArea();
  log(`🖌️ 切换地图工具：${tool}`);
}

function resizeMap(newW, newH) {
  const map = findById("maps", state.selectedId);
  if (!map) return;
  newW = Math.max(5, Math.min(40, Number(newW)));
  newH = Math.max(5, Math.min(30, Number(newH)));

  const newCells = [];
  for (let y = 0; y < newH; y++) {
    const row = [];
    for (let x = 0; x < newW; x++) {
      if (map.cells[y] && map.cells[y][x]) {
        row.push(map.cells[y][x]);
      } else {
        row.push({ type: "ground", collide: false });
      }
    }
    newCells.push(row);
  }
  map.width = newW;
  map.height = newH;
  map.cells = newCells;
  saveLocal();
  renderDataEditArea();
  log(`📐 地图调整为 ${newW} × ${newH}`);
}

function renderMapCanvas() {
  const map = findById("maps", state.selectedId);
  if (!map) return;
  const canvas = document.getElementById("mapCanvas");
  canvas.style.gridTemplateColumns = `repeat(${map.width}, 32px)`;
  canvas.style.background = map.bgColor;

  let html = "";
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = map.cells[y][x];
      let cls = "map-cell";
      if (cell.type === "wall") cls += " wall";
      if (cell.type === "spawn") cls += " spawn";
      const label = cell.type === "wall" ? "墙" : (cell.type === "spawn" ? "始" : "");
      html += `<div class="${cls}" onclick="paintCell(${x},${y})">${label}</div>`;
    }
  }
  canvas.innerHTML = html;
}

function paintCell(x, y) {
  const map = findById("maps", state.selectedId);
  if (!map) return;
  map.cells[y][x].type = state.mapTool;
  map.cells[y][x].collide = state.mapTool === "wall";
  saveLocal();
  renderMapCanvas();
}
