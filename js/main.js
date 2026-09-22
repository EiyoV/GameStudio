let currentEditItemIndex=-1;
let currentEditNpcIndex=-1;
let currentEditMonsterIndex=-1;
let currentEditSkillIndex=-1;
let currentEditMapIndex=-1;
let currentEditAnimIndex=-1;
let mapCanvas,mapCtx;
let mapData=[];
const tileSize=24;
let animFrames=[];
let animPreviewTimer=null;
let animPreviewCanvas,animPreviewCtx;

function renderEditorPanel(modId){
  const ed = document.getElementById("editor");
  let title="";
  let bodyHtml="";
  if(modId==="overview"){
    title="项目概览";
    const prj = ProjectManager.currentProject;
    if(!prj){
      bodyHtml=`<div class="card"><div class="empty-state"><div class="big-icon">🚧</div><p>暂无打开的项目，请新建项目</p></div></div>`;
    }else{
      bodyHtml=`
<div class="card">
<div class="card-title">项目信息</div>
<div class="form-grid">
<div class="form-row"><label>项目名称</label><input value="${prj.name}" disabled></div>
<div class="form-row"><label>游戏类型</label><input value="${prj.type}" disabled></div>
<div class="form-row full"><label>描述</label><textarea disabled rows="3">${prj.description||""}</textarea></div>
<div class="form-row"><label>创建时间</label><input value="${prj.createTime||""}" disabled></div>
</div>
</div>`;
    }
  }else if(modId==="game-config"){
    title="游戏基础配置";
    const p = ProjectManager.currentProject;
    if(!p){
      bodyHtml=`<div class="card"><div class="empty-state"><p>请先新建项目</p></div></div>`;
    }else{
      const c = p.config;
      bodyHtml=`
<div class="card">
<div class="card-title">全局游戏设置</div>
<div class="form-grid">
<div class="form-row"><label>游戏标题</label><input id="cf_gameTitle" value="${c.gameTitle||""}"></div>
<div class="form-row"><label>最大等级</label><input type="number" id="cf_maxLevel" value="${c.maxLevel||99}"></div>
<div class="form-row"><label>背景色</label><input type="color" id="cf_bgColor" value="${c.bgColor||"#111111"}"></div>
<div class="form-row"><label>版本号</label><input id="cf_version" value="${c.version||"1.0.0"}"></div>
<div class="form-row"><label>初始金币</label><input type="number" id="cf_startGold" value="${c.startGold||100}"></div>
<div class="form-row"><label>初始血量</label><input type="number" id="cf_startHp" value="${c.startHp||100}"></div>
</div>
<div class="btn-group" style="margin-top:16px">
<button class="btn btn-primary" onclick="saveGameConfig()">保存配置</button>
</div>
</div>`;
    }
  }else if(modId==="item"){
    title="物品管理";
    bodyHtml=`
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">物品列表</div>
<button class="btn btn-primary" onclick="openItemEditor()">新建物品</button>
</div>
<div id="itemListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="itemEditCard">
<h4>编辑物品</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="itemId"></div>
<div class="form-row"><label>名称</label><input id="itemName"></div>
<div class="form-row full"><label>描述</label><textarea id="itemDesc" rows="3"></textarea></div>
<div class="form-row"><label>类型</label>
<select id="itemType">
<option value="consume">消耗品</option>
<option value="weapon">武器</option>
<option value="armor">防具</option>
<option value="material">材料</option>
</select>
</div>
<div class="form-row"><label>售价</label><input type="number" id="itemPrice" value="0"></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveItem()">保存</button>
<button class="btn" onclick="closeItemEditor()">取消</button>
</div>
</div>`;
  }else if(modId==="npc"){
    title="NPC管理";
    bodyHtml=`
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">NPC列表</div>
<button class="btn btn-primary" onclick="openNpcEditor()">新建NPC</button>
</div>
<div id="npcListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="npcEditCard">
<h4>编辑NPC</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="npcId"></div>
<div class="form-row"><label>名称</label><input id="npcName"></div>
<div class="form-row full"><label>对话文本</label><textarea id="npcDialog" rows="4"></textarea></div>
<div class="form-row"><label>NPC类型</label>
<select id="npcType">
<option>商店NPC</option>
<option>任务NPC</option>
<option>剧情NPC</option>
</select>
</div>
<div class="form-row"><label>所属地图ID</label><input id="npcMapId"></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveNpc()">保存</button>
<button class="btn" onclick="closeNpcEditor()">取消</button>
</div>
</div>`;
  }else if(modId==="monster"){
    title="怪物管理";
    bodyHtml=`
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">怪物列表</div>
<button class="btn btn-primary" onclick="openMonsterEditor()">新建怪物</button>
</div>
<div id="monsterListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="monsterEditCard">
<h4>编辑怪物</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="monsterId"></div>
<div class="form-row"><label>名称</label><input id="monsterName"></div>
<div class="form-row full"><label>描述</label><textarea id="monsterDesc" rows="3"></textarea></div>
<div class="form-row"><label>HP</label><input type="number" id="monsterHp" value="100"></div>
<div class="form-row"><label>ATK</label><input type="number" id="monsterAtk" value="10"></div>
<div class="form-row"><label>击杀金币</label><input type="number" id="monsterGold" value="10"></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveMonster()">保存</button>
<button class="btn" onclick="closeMonsterEditor()">取消</button>
</div>
</div>`;
  }else if(modId==="skill"){
    title="技能管理";
    bodyHtml=`
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">技能列表</div>
<button class="btn btn-primary" onclick="openSkillEditor()">新建技能</button>
</div>
<div id="skillListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="skillEditCard">
<h4>编辑技能</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="skillId"></div>
<div class="form-row"><label>名称</label><input id="skillName"></div>
<div class="form-row full"><label>描述</label><textarea id="skillDesc" rows="3"></textarea></div>
<div class="form-row"><label>类型</label>
<select id="skillType">
<option>攻击技能</option>
<option>治疗技能</option>
<option>增益BUFF</option>
<option>减益DEBUFF</option>
</select>
</div>
<div class="form-row"><label>威力</label><input type="number" id="skillPower" value="20"></div>
<div class="form-row"><label>消耗MP</label><input type="number" id="skillMpCost" value="10"></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveSkill()">保存</button>
<button class="btn" onclick="closeSkillEditor()">取消</button>
</div>
</div>`;
  }else if(modId==="map-list"){
    title="地图编辑器";
    bodyHtml=`
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">地图列表</div>
<button class="btn btn-primary" onclick="openMapCreator()">新建地图</button>
</div>
<div id="mapListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="mapEditCard">
<h4>地图绘制</h4>
<div class="form-grid">
<div class="form-row"><label>地图ID</label><input id="mapId"></div>
<div class="form-row"><label>地图名称</label><input id="mapName"></div>
<div class="form-row"><label>宽度(格子)</label><input type="number" id="mapW" value="20"></div>
<div class="form-row"><label>高度(格子)</label><input type="number" id="mapH" value="15"></div>
<div class="form-row full">
<label>选择图块</label>
<select id="tileSelect">
<option value="0">0-空地</option>
<option value="1">1-草地</option>
<option value="2">2-墙壁</option>
<option value="3">3-水域</option>
</select>
</div>
</div>
<canvas id="mapCanvas" style="border:1px solid var(--border-2);background:#111;margin:10px 0;"></canvas>
<div class="btn-group">
<button class="btn btn-primary" onclick="saveMap()">保存地图</button>
<button class="btn" onclick="closeMapEditor()">关闭</button>
<button class="btn" onclick="clearMapCanvas()">清空画布</button>
</div>
</div>`;
  }else if(modId==="anim-list"){
    title="动画资源";
    bodyHtml=`
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">动画列表</div>
<button class="btn btn-primary" onclick="openAnimCreator()">新建动画</button>
</div>
<div id="animListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="animEditCard">
<h4>帧动画编辑器</h4>
<div class="form-grid">
<div class="form-row"><label>动画ID</label><input id="animId"></div>
<div class="form-row"><label>动画名称</label><input id="animName"></div>
<div class="form-row"><label>帧间隔ms</label><input type="number" id="animFrameDelay" value="150"></div>
<div class="form-row full"><label>上传帧图片(多选)</label><input type="file" id="animFileInput" accept="image/*" multiple onchange="addAnimFrames(this)"></div>
</div>
<div id="animFramePreviewWrap" style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;"></div>
<div class="btn-group">
<button class="btn" onclick="playAnimPreview()">播放预览</button>
<button class="btn" onclick="stopAnimPreview()">停止</button>
</div>
<canvas id="animPreviewCanvas" width="128" height="128" style="border:1px solid var(--border-2);background:#000;margin:10px 0;"></canvas>
<div class="btn-group">
<button class="btn btn-primary" onclick="saveAnimation()">保存动画</button>
<button class="btn" onclick="closeAnimEditor()">关闭</button>
</div>
</div>`;
  }else if(modId==="export"){
    title="项目导出";
    bodyHtml=`
<div class="card">
<div class="card-title">导出与备份</div>
<div class="btn-group">
<button class="btn btn-primary" onclick="downloadJson()">下载JSON配置</button>
<button class="btn btn-success" onclick="generateGameZip()">打包完整游戏ZIP</button>
</div>
<div class="form-row full" style="margin-top:16px;">
<label>导入JSON文件</label>
<input type="file" id="importJsonFile" accept=".json" onchange="importJsonFile(this)">
</div>
<div class="form-row full" style="margin-top:16px;">
<label>JSON预览</label>
<textarea id="jsonPreview" style="width:100%;height:280px;background:var(--bg-2);color:#eee;"></textarea>
<button class="btn" onclick="refreshJsonPreview()" style="margin-top:8px;">刷新预览</button>
</div>
</div>`;
  }

  ed.innerHTML=`
<div class="editor-header"><div class="editor-title">${title}</div><div></div></div>
<div class="editor-body">${bodyHtml}</div>`;

  setTimeout(()=>{
    if(modId==="item") renderItemList();
    if(modId==="npc") renderNpcList();
    if(modId==="monster") renderMonsterList();
    if(modId==="skill") renderSkillList();
    if(modId==="map-list") renderMapList();
    if(modId==="anim-list") renderAnimList();
  },60);
}

//基础配置
function saveGameConfig(){
  const p = ProjectManager.currentProject;
  if(!p){log("警告","无打开项目");return;}
  p.config.gameTitle = document.getElementById("cf_gameTitle").value;
  p.config.maxLevel = Number(document.getElementById("cf_maxLevel").value);
  p.config.bgColor = document.getElementById("cf_bgColor").value;
  p.config.version = document.getElementById("cf_version").value;
  p.config.startGold = Number(document.getElementById("cf_startGold").value);
  p.config.startHp = Number(document.getElementById("cf_startHp").value);
  ProjectManager.saveLocal();
  log("配置","游戏基础配置已保存");
}

//物品
function openItemEditor(){
  currentEditItemIndex=-1;
  document.getElementById("itemId").value="";
  document.getElementById("itemName").value="";
  document.getElementById("itemDesc").value="";
  document.getElementById("itemType").value="consume";
  document.getElementById("itemPrice").value=0;
  document.getElementById("itemEditCard").style.display="block";
}
function closeItemEditor(){document.getElementById("itemEditCard").style.display="none";}
function saveItem(){
  const p = ProjectManager.currentProject;if(!p){log("警告","请新建项目");return;}
  const d = {
    id:document.getElementById("itemId").value.trim(),
    name:document.getElementById("itemName").value.trim(),
    desc:document.getElementById("itemDesc").value.trim(),
    type:document.getElementById("itemType").value,
    price:Number(document.getElementById("itemPrice").value)
  };
  if(!d.id||!d.name){log("警告","ID和名称不能为空");return;}
  if(currentEditItemIndex===-1){
    p.items.push(d);log("物品","新增："+d.name);
  }else{
    p.items[currentEditItemIndex]=d;log("物品","修改："+d.name);
  }
  ProjectManager.saveLocal();closeItemEditor();renderItemList();
}
function renderItemList(){
  const wrap = document.getElementById("itemListWrap");
  const arr = ProjectManager.currentProject?.items||[];
  if(arr.length===0){wrap.innerHTML="<p class='empty-state'>暂无物品，点击新建物品</p>";return;}
  let h=`<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>售价</th><th>操作</th></tr></thead><tbody>`;
  arr.forEach((it,idx)=>{
    h+=`<tr style="border-bottom:1px solid var(--border);">
<td>${it.id}</td><td>${it.name}</td><td>${it.type}</td><td>${it.price}</td>
<td>
<button class="btn" onclick="editItem(${idx})">编辑</button>
<button class="btn btn-danger" onclick="deleteItem(${idx})">删除</button>
</td></tr>`;
  });
  h+="</tbody></table>";wrap.innerHTML=h;
}
function editItem(idx){
  const it = ProjectManager.currentProject.items[idx];
  currentEditItemIndex=idx;
  document.getElementById("itemId").value=it.id;
  document.getElementById("itemName").value=it.name;
  document.getElementById("itemDesc").value=it.desc||"";
  document.getElementById("itemType").value=it.type;
  document.getElementById("itemPrice").value=Number(it.price||0);
  document.getElementById("itemEditCard").style.display="block";
}
function deleteItem(idx){
  const it = ProjectManager.currentProject.items[idx];
  if(!confirm(`确定删除【${it.name}】?`)) return;
  ProjectManager.currentProject.items.splice(idx,1);
  ProjectManager.saveLocal();renderItemList();log("物品","删除："+it.name);
}

//NPC
function openNpcEditor(){
  currentEditNpcIndex=-1;
  document.getElementById("npcId").value="";
  document.getElementById("npcName").value="";
  document.getElementById("npcDialog").value="";
  document.getElementById("npcType").value="商店NPC";
  document.getElementById("npcMapId").value="";
  document.getElementById("npcEditCard").style.display="block";
}
function closeNpcEditor(){document.getElementById("npcEditCard").style.display="none";}
function saveNpc(){
  const p=ProjectManager.currentProject;if(!p){log("警告","请新建项目");return;}
  const d={
    id:document.getElementById("npcId").value.trim(),
    name:document.getElementById("npcName").value.trim(),
    dialog:document.getElementById("npcDialog").value.trim(),
    type:document.getElementById("npcType").value,
    mapId:document.getElementById("npcMapId").value.trim()
  };
  if(!d.id||!d.name){log("警告","ID、名称不能为空");return;}
  if(currentEditNpcIndex===-1){p.npcs.push(d);log("NPC","新增："+d.name);}
  else{p.npcs[currentEditNpcIndex]=d;log("NPC","修改："+d.name);}
  ProjectManager.saveLocal();closeNpcEditor();renderNpcList();
}
function renderNpcList(){
  const wrap=document.getElementById("npcListWrap");
  const arr=ProjectManager.currentProject?.npcs||[];
  if(arr.length===0){wrap.innerHTML="<p class='empty-state'>暂无NPC</p>";return;}
  let h=`<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>地图ID</th><th>操作</th></tr></tbody><tbody>`;
  arr.forEach((it,idx)=>{
    h+=`<tr style="border-bottom:1px solid var(--border);">
<td>${it.id}</td><td>${it.name}</td><td>${it.type}</td><td>${it.mapId||""}</td>
<td><button class="btn" onclick="editNpc(${idx})">编辑</button><button class="btn btn-danger" onclick="deleteNpc(${idx})">删除</button></td></tr>`;
  });
  h+="</tbody></table>";wrap.innerHTML=h;
}
function editNpc(idx){
  const it=ProjectManager.currentProject.npcs[idx];
  currentEditNpcIndex=idx;
  document.getElementById("npcId").value=it.id;
  document.getElementById("npcName").value=it.name;
  document.getElementById("npcDialog").value=it.dialog||"";
  document.getElementById("npcType").value=it.type;
  document.getElementById("npcMapId").value=it.mapId||"";
  document.getElementById("npcEditCard").style.display="block";
}
function deleteNpc(idx){
  const it=ProjectManager.currentProject.npcs[idx];
  if(!confirm(`删除【${it.name}】?`)) return;
  ProjectManager.currentProject.npcs.splice(idx,1);ProjectManager.saveLocal();renderNpcList();log("NPC","删除："+it.name);
}

//怪物
function openMonsterEditor(){
  currentEditMonsterIndex=-1;
  document.getElementById("monsterId").value="";
  document.getElementById("monsterName").value="";
  document.getElementById("monsterDesc").value="";
  document.getElementById("monsterHp").value=100;
  document.getElementById("monsterAtk").value=10;
  document.getElementById("monsterGold").value=10;
  document.getElementById("monsterEditCard").style.display="block";
}
function closeMonsterEditor(){document.getElementById("monsterEditCard").style.display="none";}
function saveMonster(){
  const p=ProjectManager.currentProject;if(!p){log("警告","请新建项目");return;}
  const d={
    id:document.getElementById("monsterId").value.trim(),
    name:document.getElementById("monsterName").value.trim(),
    desc:document.getElementById("monsterDesc").value.trim(),
    hp:Number(document.getElementById("monsterHp").value),
    atk:Number(document.getElementById("monsterAtk").value),
    gold:Number(document.getElementById("monsterGold").value)
  };
  if(!d.id||!d.name){log("警告","ID、名称不能为空");return;}
  if(currentEditMonsterIndex===-1){p.monsters.push(d);log("怪物","新增："+d.name);}
  else{p.monsters[currentEditMonsterIndex]=d;log("怪物","修改："+d.name);}
  ProjectManager.saveLocal();closeMonsterEditor();renderMonsterList();
}
function renderMonsterList(){
  const wrap=document.getElementById("monsterListWrap");
  const arr=ProjectManager.currentProject?.monsters||[];
  if(arr.length===0){wrap.innerHTML="<p class='empty-state'>暂无怪物</p>";return;}
  let h=`<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>HP</th><th>ATK</th><th>金币</th><th>操作</th></tr></tbody><tbody>`;
  arr.forEach((it,idx)=>{
    h+=`<tr style="border-bottom:1px solid var(--border);">
<td>${it.id}</td><td>${it.name}</td><td>${it.hp}</td><td>${it.atk}</td><td>${it.gold}</td>
<td><button class="btn" onclick="editMonster(${idx})">编辑</button><button class="btn btn-danger" onclick="deleteMonster(${idx})">删除</button></td></tr>`;
  });
  h+="</tbody></table>";wrap.innerHTML=h;
}
function editMonster(idx){
  const it=ProjectManager.currentProject.monsters[idx];
  currentEditMonsterIndex=idx;
  document.getElementById("monsterId").value=it.id;
  document.getElementById("monsterName").value=it.name;
  document.getElementById("monsterDesc").value=it.desc||"";
  document.getElementById("monsterHp").value=Number(it.hp||100);
  document.getElementById("monsterAtk").value=Number(it.atk||10);
  document.getElementById("monsterGold").value=Number(it.gold||10);
  document.getElementById("monsterEditCard").style.display="block";
}
function deleteMonster(idx){
  const it=ProjectManager.currentProject.monsters[idx];
  if(!confirm(`删除【${it.name}】?`)) return;
  ProjectManager.currentProject.monsters.splice(idx,1);ProjectManager.saveLocal();renderMonsterList();log("怪物","删除："+it.name);
}

//技能
function openSkillEditor(){
  currentEditSkillIndex=-1;
  document.getElementById("skillId").value="";
  document.getElementById("skillName").value="";
  document.getElementById("skillDesc").value="";
  document.getElementById("skillType").value="攻击技能";
  document.getElementById("skillPower").value=20;
  document.getElementById("skillMpCost").value=10;
  document.getElementById("skillEditCard").style.display="block";
}
function closeSkillEditor(){document.getElementById("skillEditCard").style.display="none";}
function saveSkill(){
  const p=ProjectManager.currentProject;if(!p){log("警告","请新建项目");return;}
  const d={
    id:document.getElementById("skillId").value.trim(),
    name:document.getElementById("skillName").value.trim(),
    desc:document.getElementById("skillDesc").value.trim(),
    type:document.getElementById("skillType").value,
    power:Number(document.getElementById("skillPower").value),
    mpCost:Number(document.getElementById("skillMpCost").value)
  };
  if(!d.id||!d.name){log("警告","ID、名称不能为空");return;}
  if(currentEditSkillIndex===-1){p.skills.push(d);log("技能","新增："+d.name);}
  else{p.skills[currentEditSkillIndex]=d;log("技能","修改："+d.name);}
  ProjectManager.saveLocal();closeSkillEditor();renderSkillList();
}
function renderSkillList(){
  const wrap=document.getElementById("skillListWrap");
  const arr=ProjectManager.currentProject?.skills||[];
  if(arr.length===0){wrap.innerHTML="<p class='empty-state'>暂无技能</p>";return;}
  let h=`<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>威力</th><th>耗蓝</th><th>操作</th></tr></tbody><tbody>`;
  arr.forEach((it,idx)=>{
    h+=`<tr style="border-bottom:1px solid var(--border);">
<td>${it.id}</td><td>${it.name}</td><td>${it.type}</td><td>${it.power}</td><td>${it.mpCost}</td>
<td><button class="btn" onclick="editSkill(${idx})">编辑</button><button class="btn btn-danger" onclick="deleteSkill(${idx})">删除</button></td></tr>`;
  });
  h+="</tbody></table>";wrap.innerHTML=h;
}
function editSkill(idx){
  const it=ProjectManager.currentProject.skills[idx];
  currentEditSkillIndex=idx;
  document.getElementById("skillId").value=it.id;
  document.getElementById("skillName").value=it.name;
  document.getElementById("skillDesc").value=it.desc||"";
  document.getElementById("skillType").value=it.type;
  document.getElementById("skillPower").value=Number(it.power||20);
  document.getElementById("skillMpCost").value=Number(it.mpCost||10);
  document.getElementById("skillEditCard").style.display="block";
}
function deleteSkill(idx){
  const it=ProjectManager.currentProject.skills[idx];
  if(!confirm(`删除【${it.name}】?`)) return;
  ProjectManager.currentProject.skills.splice(idx,1);ProjectManager.saveLocal();renderSkillList();log("技能","删除："+it.name);
}

//地图
function openMapCreator(){
  currentEditMapIndex=-1;
  document.getElementById("mapId").value="";
  document.getElementById("mapName").value="";
  document.getElementById("mapW").value=20;
  document.getElementById("mapH").value=15;
  document.getElementById("mapEditCard").style.display="block";
  initMapCanvas();
}
function closeMapEditor(){document.getElementById("mapEditCard").style.display="none";}
function initMapCanvas(){
  mapCanvas = document.getElementById("mapCanvas");
  mapCtx = mapCanvas.getContext("2d");
  const w=Number(document.getElementById("mapW").value);
  const h=Number(document.getElementById("mapH").value);
  mapCanvas.width = w*tileSize;mapCanvas.height=h*tileSize;
  mapData = Array.from({length:h},()=>Array(w).fill(0));
  drawMap();
  mapCanvas.onmousedown=e=>paintTile(e);
  mapCanvas.onmousemove=e=>{if(e.buttons===1)paintTile(e);};
}
function paintTile(e){
  const rect = mapCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX-rect.left)/tileSize);
  const y = Math.floor((e.clientY-rect.top)/tileSize);
  const tile = Number(document.getElementById("tileSelect").value);
  if(y>=0&&y<mapData.length&&x>=0&&x<mapData[0].length){
    mapData[y][x]=tile;drawMap();
  }
}
function drawMap(){
  mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height);
  const colorMap={"0":"#222222","1":"#487a38","2":"#777777","3":"#3068aa"};
  for(let y=0;y<mapData.length;y++){
    for(let x=0;x<mapData[y].length;x++){
      const t=mapData[y][x];
      mapCtx.fillStyle=colorMap[t]||"#000";
      mapCtx.fillRect(x*tileSize,y*tileSize,tileSize-1,tileSize-1);
    }
  }
}
function clearMapCanvas(){
  const w=Number(document.getElementById("mapW").value);
  const h=Number(document.getElementById("mapH").value);
  mapData=Array.from({length:h},()=>Array(w).fill(0));drawMap();log("地图","画布清空");
}
function saveMap(){
  const p=ProjectManager.currentProject;if(!p){log("警告","请新建项目");return;}
  const d={
    id:document.getElementById("mapId").value.trim(),
    name:document.getElementById("mapName").value.trim(),
    width:Number(document.getElementById("mapW").value),
    height:Number(document.getElementById("mapH").value),
    tiles:mapData
  };
  if(!d.id||!d.name){log("警告","地图ID、名称不能为空");return;}
  if(currentEditMapIndex===-1){p.maps.push(d);log("地图","新建："+d.name);}
  else{p.maps[currentEditMapIndex]=d;log("地图","修改："+d.name);}
  ProjectManager.saveLocal();closeMapEditor();renderMapList();
}
function renderMapList(){
  const wrap=document.getElementById("mapListWrap");
  const arr=ProjectManager.currentProject?.maps||[];
  if(arr.length===0){wrap.innerHTML="<p class='empty-state'>暂无地图</p>";return;}
  let h=`<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>尺寸</th><th>操作</th></tr></thead><tbody>`;
  arr.forEach((m,idx)=>{
    h+=`<tr style="border-bottom:1px solid var(--border);">
<td>${m.id}</td><td>${m.name}</td><td>${m.width}×${m.height}</td>
<td><button class="btn" onclick="editMap(${idx})">编辑</button><button class="btn btn-danger" onclick="deleteMap(${idx})">删除</button></td></tr>`;
  });
  h+="</tbody></table>";wrap.innerHTML=h;
}
function editMap(idx){
  const m=ProjectManager.currentProject.maps[idx];
  currentEditMapIndex=idx;
  document.getElementById("mapId").value=m.id;
  document.getElementById("mapName").value=m.name;
  document.getElementById("mapW").value=m.width;
  document.getElementById("mapH").value=m.height;
  document.getElementById("mapEditCard").style.display="block";
  initMapCanvas();
  mapData = m.tiles;drawMap();
}
function deleteMap(idx){
  const m=ProjectManager.currentProject.maps[idx];
  if(!confirm(`删除地图【${m.name}】?`)) return;
  ProjectManager.currentProject.maps.splice(idx,1);ProjectManager.saveLocal();renderMapList();log("地图","删除："+m.name);
}

//动画
function openAnimCreator(){
  currentEditAnimIndex=-1;
  document.getElementById("animId").value="";
  document.getElementById("animName").value="";
  document.getElementById("animFrameDelay").value=150;
  animFrames=[];refreshAnimFramePreview();
  document.getElementById("animEditCard").style.display="block";
  animPreviewCanvas=document.getElementById("animPreviewCanvas");
  animPreviewCtx=animPreviewCanvas.getContext("2d");
  stopAnimPreview();
}
function closeAnimEditor(){stopAnimPreview();document.getElementById("animEditCard").style.display="none";}
function addAnimFrames(input){
  const files = Array.from(input.files);
  files.forEach(f=>{
    const r = new FileReader();
    r.onload=ev=>{
      const img = new Image();img.src=ev.target.result;
      animFrames.push({src:ev.target.result,img:img});
      refreshAnimFramePreview();
    };
    r.readAsDataURL(f);
  });
}
function refreshAnimFramePreview(){
  const wrap = document.getElementById("animFramePreviewWrap");
  let h="";
  animFrames.forEach((fr,i)=>{
    h+=`<div style="width:60px;height:60px;border:1px solid var(--border-2);border-radius:6px;overflow:hidden;">
<img src="${fr.src}" style="width:100%;height:100%;object-fit:contain;">
<button style="width:100%;font-size:10px;" onclick="removeAnimFrame(${i})">删除</button>
</div>`;
  });
  wrap.innerHTML=h;
}
function removeAnimFrame(idx){
  animFrames.splice(idx,1);refreshAnimFramePreview();
}
function playAnimPreview(){
  stopAnimPreview();
  const delay = Number(document.getElementById("animFrameDelay").value);
  let fi=0;
  animPreviewTimer = setInterval(()=>{
    const fr = animFrames[fi];
    animPreviewCtx.clearRect(0,0,128,128);
    if(fr&&fr.img.complete) animPreviewCtx.drawImage(fr.img,0,0,128,128);
    fi=(fi+1)%animFrames.length;
  },delay);
}
function stopAnimPreview(){
  if(animPreviewTimer) clearInterval(animPreviewTimer);animPreviewTimer=null;
  if(animPreviewCtx) animPreviewCtx.clearRect(0,0,128,128);
}
function saveAnimation(){
  const p=ProjectManager.currentProject;if(!p){log("警告","请新建项目");return;}
  const d={
    id:document.getElementById("animId").value.trim(),
    name:document.getElementById("animName").value.trim(),
    frameDelay:Number(document.getElementById("animFrameDelay").value),
    frames:animFrames.map(x=>({src:x.src}))
  };
  if(!d.id||!d.name){log("警告","动画ID、名称不能为空");return;}
  if(currentEditAnimIndex===-1){p.animations.push(d);log("动画","新建："+d.name);}
  else{p.animations[currentEditAnimIndex]=d;log("动画","修改："+d.name);}
  ProjectManager.saveLocal();closeAnimEditor();renderAnimList();
}
function renderAnimList(){
  const wrap=document.getElementById("animListWrap");
  const arr=ProjectManager.currentProject?.animations||[];
  if(arr.length===0){wrap.innerHTML="<p class='empty-state'>暂无动画</p>";return;}
  let h=`<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>
