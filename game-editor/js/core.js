let GameEditorData = {
  project:{
    name:"",
    type:"idle",
    desc:"",
    createTime:""
  },
  config:{ bgColor:"#111111", gameTitle:"", maxLevel:99 },
  item:[],
  npc:[],
  monster:[],
  skill:[],
  maps:[],
  animSource:{}
};

let currentState = {
  activeType:"config",
  selectId:null,
  mapTool:"empty",
};
let animTimer = null;

// 日志打印
function log(msg){
  try{
    const box = document.getElementById("logBox");
    const time = new Date().toLocaleTimeString();
    box.innerHTML += `[${time}] ${msg}\n`;
    box.scrollTop = box.scrollHeight;
  }catch(e){console.log(msg)}
}

// 本地持久化
function saveLocalData(){
  try{
    localStorage.setItem("GameEditorPro", JSON.stringify(GameEditorData));
    log("✅ 项目数据自动保存");
  }catch(e){
    log("⚠️ 保存失败:"+e.message);
  }
}
function loadLocalData(){
  try{
    const data = localStorage.getItem("GameEditorPro");
    if(data){
      GameEditorData = JSON.parse(data);
      document.getElementById("curProjectName").innerText = GameEditorData.project.name || "未创建";
      log("✅ 读取本地项目数据成功");
    }
    renderModuleUI();
    bindStepEvent();
  }catch(e){
    log("⚠️ 读取本地数据失败:"+e.message);
  }
}

// 工作流步骤切换
function bindStepEvent(){
  document.querySelectorAll(".step-item").forEach(step=>{
    step.onclick = ()=>{
      document.querySelectorAll(".step-item").forEach(s=>s.classList.remove("active"));
      step.classList.add("active");
    }
  })
}

// 模块列表渲染
function renderModuleUI(){
  document.querySelectorAll(".module-item").forEach(item=>{
    item.onclick = ()=>{
      document.querySelectorAll(".module-item").forEach(i=>i.classList.remove("active"));
      item.classList.add("active");
      currentState.activeType = item.dataset.type;
      currentState.selectId = null;
      renderEditArea();
    }
  })
}
function filterModuleList(){
  renderEditArea();
}

// 选中条目
function selectItem(type,id){
  currentState.activeType = type;
  currentState.selectId = id;
  renderEditArea();
}
// 删除条目
function delItem(type,id){
  GameEditorData[type] = GameEditorData[type].filter(x=>x.id!==id);
  currentState.selectId = null;
  saveLocalData();
  renderEditArea();
  log(`🗑️ 删除${getTypeName(type)}条目成功`);
}
// 更新字段
function updateItemField(type,key,val){
  const idx = GameEditorData[type].findIndex(x=>x.id===currentState.selectId);
  if(idx>-1){
    GameEditorData[type][idx][key] = val;
    saveLocalData();
  }
}
function updateConfig(key,val){
  GameEditorData.config[key] = val;
  saveLocalData();
}

// 模块中文名
function getTypeName(type){
  const map = {
    item:"物品道具",npc:"交互NPC",monster:"游戏怪物",
    skill:"游戏技能",map:"地图场景"
  };
  return map[type]||type;
}

// 动画预览公共函数
function renderAnimPreview(item){
  const box = document.getElementById("animFrameList");
  if(!box) return;
  let html = "";
  if(!item.frames||item.frames.length===0){
    html = "<span style='color:var(--text-gray)'>暂无动画帧</span>";
  }else{
    item.frames.forEach((src,i)=>{
      html += `<img class="anim-frame" src="${src}" onclick="delAnimFrame('${item.id}',${i})">`;
    })
  }
  box.innerHTML = html;
}
function delAnimFrame(id,idx){
  const type = currentState.activeType;
  const item = GameEditorData[type].find(x=>x.id===id);
  item.frames.splice(idx,1);
  saveLocalData();
  renderAnimPreview(item);
}
function uploadAnimFrame(type,e){
  const files = Array.from(e.target.files);
  const target = GameEditorData[type].find(x=>x.id===currentState.selectId);
  if(!target.frames) target.frames = [];
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = res=>{
      target.frames.push(res.target.result);
      saveLocalData();
      renderAnimPreview(target);
    }
    reader.readAsDataURL(file);
  })
}
function playAnimPreview(){
  stopAnimPreview();
  const type = currentState.activeType;
  const item = GameEditorData[type].find(x=>x.id===currentState.selectId);
  if(!item.frames||item.frames.length===0) return alert("请先上传动画帧！");
  const delay = item.frameDelay||150;
  const box = document.getElementById("animFrameList");
  let i=0;
  animTimer = setInterval(()=>{
    i = (i+1)%item.frames.length;
    box.innerHTML = `<img class="anim-frame" src="${item.frames[i]}">`;
  },delay);
}
function stopAnimPreview(){
  if(animTimer) clearInterval(animTimer);
  animTimer = null;
  const type = currentState.activeType;
  const item = GameEditorData[type].find(x=>x.id===currentState.selectId);
  renderAnimPreview(item);
}

// 主渲染入口，分发到各个模块
function renderEditArea(){
  const area = document.getElementById("editArea");
  const type = currentState.activeType;
  if(type === "config"){
    area.innerHTML = `
    <div class="edit-card">
      <div class="card-title">游戏全局基础配置</div>
      <div class="form-grid">
        <div class="form-item">
          <label>游戏标题</label>
          <input value="${GameEditorData.config.gameTitle}" onchange="updateConfig('gameTitle',this.value)">
        </div>
        <div class="form-item">
          <label>游戏最大等级</label>
          <input type="number" value="${GameEditorData.config.maxLevel}" onchange="updateConfig('maxLevel',Number(this.value))">
        </div>
        <div class="form-item">
          <label>游戏背景色</label>
          <input type="color" value="${GameEditorData.config.bgColor}" onchange="updateConfig('bgColor',this.value)">
        </div>
        <div class="form-item">
          <label>游戏类型</label>
          <input value="${GameEditorData.project.type}" disabled>
        </div>
        <div class="form-item full-col">
          <label>游戏玩法简介</label>
          <textarea rows="4" disabled>${GameEditorData.project.desc}</textarea>
        </div>
      </div>
    </div>
    `;
    return;
  }
  const list = GameEditorData[type];
  if(list.length === 0){
    area.innerHTML = `
    <div class="edit-card">
      <div class="card-title">${getTypeName(type)} 配置</div>
      <div class="empty-tip">暂无配置条目，点击左侧【新建配置条目】创建</div>
    </div>
    `;
    return;
  }
  const target = list.find(x=>x.id === currentState.selectId);
  if(!target){
    let listHtml = `<div class="edit-card"><div class="card-title">${getTypeName(type)} 列表（点击编辑）</div><div style="display:grid;gap:8px;">`;
    list.forEach(item=>{
      listHtml += `
      <div style="padding:12px;background:var(--dark-bg);border-radius:6px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);cursor:pointer;" onclick="selectItem('${type}','${item.id}')">
        <div><b>${item.name}</b> <span style="color:var(--text-gray);font-size:12px;">${item.id}</span></div>
        <button class="tool-btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="delItem('${type}','${item.id}');event.stopPropagation()">删除</button>
      </div>
      `;
    })
    listHtml += `</div></div>`;
    area.innerHTML = listHtml;
    return;
  }
  // 调用对应模块的表单渲染函数
  area.innerHTML = getItemEditForm(type,target);
  renderAnimPreview(target);
  if(type === "map") renderMapCanvas(target);
}
