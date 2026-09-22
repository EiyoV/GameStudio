function createNewMap(){
  const newItem = {
    id:"game_"+Date.now(),
    name:"新地图",
    desc:"",
    bgColor:"#181825",
    width:16,
    height:12,
    bgm:"",
    cells:[],
    objects:[]
  };
  for(let y=0;y<newItem.height;y++){
    let row = [];
    for(let x=0;x<newItem.width;x++){
      row.push({type:"empty",collide:false,refId:""});
    }
    newItem.cells.push(row);
  }
  return newItem;
}
function getMapForm(item,type){
  return `
    <div class="edit-card">
      <div class="card-title">地图基础属性</div>
      <div class="form-grid">
        <div class="form-item"><label>地图宽度(格子)</label><input type="number" value="${item.width}" onchange="resizeMap('${item.id}',Number(this.value),${item.height})"></div>
        <div class="form-item"><label>地图高度(格子)</label><input type="number" value="${item.height}" onchange="resizeMap('${item.id}',${item.width},Number(this.value))"></div>
        <div class="form-item"><label>地图背景色</label><input type="color" value="${item.bgColor}" onchange="updateItemField('map','bgColor',this.value)"></div>
        <div class="form-item"><label>BGM标记</label><input value="${item.bgm||""}" onchange="updateItemField('map','bgm',this.value)"></div>
      </div>
    </div>
    <div class="edit-card">
      <div class="card-title">地图画笔工具</div>
      <div class="map-toolbar">
        <button class="tool-btn btn-default" onclick="setMapTool('empty')">清空格子</button>
        <button class="tool-btn btn-danger" onclick="setMapTool('wall')">碰撞墙</button>
      </div>
      <div class="map-editor-container">
        <div class="map-canvas-wrap">
          <div id="mapCanvas"></div>
        </div>
      </div>
    </div>
  `;
}
function setMapTool(toolName){
  currentState.mapTool = toolName;
  log(`🖌️ 切换画笔工具：${toolName}`);
}
function resizeMap(mapId,newW,newH){
  const map = GameEditorData.maps.find(m=>m.id === mapId);
  if(!map) return;
  newW = Math.max(4,Math.min(32,newW));
  newH = Math.max(4,Math.min(24,newH));
  map.width = newW;
  map.height = newH;
  let newCells = [];
  for(let y=0;y<newH;y++){
    let row = [];
    for(let x=0;x<newW;x++){
      if(map.cells[y] && map.cells[y][x]){
        row.push(map.cells[y][x]);
      }else{
        row.push({type:"empty",collide:false,refId:""});
      }
    }
    newCells.push(row);
  }
  map.cells = newCells;
  saveLocalData();
  renderEditArea();
  log(`📐 地图调整尺寸：${newW} × ${newH}`);
}
function renderMapCanvas(map){
  const canvasWrap = document.getElementById("mapCanvas");
  canvasWrap.style.gridTemplateColumns = `repeat(${map.width},32px)`;
  let html = "";
  for(let y=0;y<map.height;y++){
    for(let x=0;x<map.width;x++){
      const cell = map.cells[y][x];
      let cls = "map-cell";
      if(cell.collide) cls += " collide";
      html += `<div class="${cls}" data-x="${x}" data-y="${y}" onclick="paintCell('${map.id}',${x},${y})">${cell.collide?"墙":""}</div>`;
    }
  }
  canvasWrap.innerHTML = html;
}
function paintCell(mapId,x,y){
  const map = GameEditorData.maps.find(m=>m.id === mapId);
  if(!map) return;
  const cell = map.cells[y][x];
  if(currentState.mapTool === "wall"){
    cell.type = "wall";
    cell.collide = true;
  }else if(currentState.mapTool === "empty"){
    cell.type = "empty";
    cell.collide = false;
  }
  saveLocalData();
  renderMapCanvas(map);
}
