// 系统内置兜底放置挂机游戏模板
const IDLE_GAME_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>放置挂机游戏</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;}
body{background:#0f121b;color:#e4e8f1;padding:16px;max-width:920px;margin:0 auto;}
.panel{background:#191e2d;border:1px solid #2c3348;border-radius:12px;padding:16px;margin-bottom:14px;}
h2{margin-bottom:10px;font-size:16px;color:#fff;}
button{padding:9px 14px;border-radius:8px;border:none;background:#5c78ff;color:#fff;margin:4px;cursor:pointer;font-size:13px;}
button:hover{background:#708aff;}
button.danger{background:#c83c3c;}
textarea,select{background:#242a3b;color:#fff;border:1px solid #384059;padding:8px;border-radius:8px;font-size:13px;}
.info-line{margin:6px 0;font-size:13px;}
.bag-item{display:inline-block;background:#242a3b;padding:6px 10px;border-radius:6px;margin:4px;font-size:12px;}
</style>
</head>
<body>
<h1>🎮放置挂机游戏</h1>
<div class="panel">
<h2>角色状态</h2>
<div id="playerStatus"></div>
</div>
<div class="panel">
<h2>挂机战斗</h2>
<div id="battleInfo"></div>
<button id="btnNextStage">手动下一关</button>
</div>
<div class="panel">
<h2>背包</h2>
<div id="bagBox"></div>
</div>
<div class="panel">
<h2>操作</h2>
<button onclick="savePlayerData()">保存进度</button>
<button class="danger" onclick="resetPlayer()">重置游戏存档</button>
</div>
<script>
let gameData = null;
let player = null;
let battleTimer = null;
async function loadGameData(){
  try{
    const res = await fetch("./game-data.json");
    if(!res.ok) throw new Error("not found");
    gameData = await res.json();
  }catch(e){
    document.body.innerHTML = "<div style='padding:30px;text-align:center;color:#ff8888;'><h2>❌缺少game‑data.json游戏资源文件</h2><p>请确认打包的zip完整，此文件是编辑器导出的游戏数据</p></div>";
    return;
  }
  loadPlayerData();
  startBattleLoop();
  renderUi();
}
function getDefaultPlayer(){
  const cfg = gameData.config;
  return {
    level: cfg.startLevel||1,
    hp: cfg.startHp||100,
    maxHp: cfg.startHp||100,
    gold: cfg.startGold||0,
    exp:0,
    bag:[],
    battleIndex:0,
    lastOnlineTime:Date.now()
  };
}
function loadPlayerData(){
  const raw = localStorage.getItem("idleGameSave");
  if(!raw){
    player = getDefaultPlayer();
    return;
  }
  try{
    player = JSON.parse(raw);
  }catch{
    player = getDefaultPlayer();
  }
  calcOfflineReward();
}
function savePlayerData(){
  player.lastOnlineTime = Date.now();
  localStorage.setItem("idleGameSave",JSON.stringify(player));
}
function resetPlayer(){
  if(!confirm("确定清空全部游戏进度？")) return;
  localStorage.removeItem("idleGameSave");
  player = getDefaultPlayer();
  renderUi();
}
function getGoldPerSec(){
  const cfg = gameData.config;
  return cfg.baseGoldPerSec * Math.pow(player.level, cfg.levelRate||1.15);
}
function calcOfflineReward(){
  const cfg = gameData.config;
  if(!cfg.enableOffline) return;
  const now = Date.now();
  const deltaMs = now - player.lastOnlineTime;
  const maxMs = cfg.maxOfflineSec * 1000;
  const realDelta = Math.min(deltaMs,maxMs);
  const sec = realDelta /1000;
  const goldAdd = sec * getGoldPerSec();
  player.gold += goldAdd;
}
function getMonsterById(id){
  return gameData.monsters.find(m=>m.id===id);
}
function getItemById(id){
  return gameData.items.find(it=>it.id===id);
}
function startBattleLoop(){
  const cfg = gameData.config;
  if(battleTimer) clearInterval(battleTimer);
  battleTimer = setInterval(battleTick, cfg.battleTickMs||2000);
}
function battleTick(){
  const cfg = gameData.config;
  const idList = cfg.battleMonsterIdList||[];
  if(idList.length===0) return;
  const mid = idList[player.battleIndex];
  const monster = getMonsterById(mid);
  if(!monster) return;
  const playerDmg = player.level * 8;
  const monsterDmg = monster.atk;
  if(playerDmg > monster.def){
    player.gold += monster.gold||0;
    player.exp += monster.exp||0;
    if(monster.dropItemIds){
      monster.dropItemIds.forEach(dropId=>{
        const it = getItemById(dropId);
        if(it) player.bag.push({...it});
      });
    }
    player.battleIndex++;
    if(player.battleIndex >= idList.length){
      player.battleIndex = 0;
    }
  }else{
    if(cfg.deathResetStage){
      player.battleIndex =0;
    }
  }
  savePlayerData();
  renderUi();
}
function renderUi(){
  const cfg = gameData.config;
  const perSec = getGoldPerSec().toFixed(1);
  document.getElementById("playerStatus").innerHTML = \`
<div>等级:\${player.level}/\${cfg.maxLevel} | 每秒金币:\${perSec}</div>
<div>HP:\${Math.floor(player.hp)}/\${player.maxHp} | 金币:\${Math.floor(player.gold)} | EXP:\${Math.floor(player.exp)}</div>
<button onclick="levelUp()">升级(消耗\${Math.floor(player.level*120)}金币)</button>
\`;
  const idList = cfg.battleMonsterIdList||[];
  const mid = idList[player.battleIndex];
  const m = getMonsterById(mid);
  if(m){
    document.getElementById("battleInfo").innerHTML = \`
<div>当前挑战:【\${m.name}】</div>
<div>怪物HP:\${m.hp} ATK:\${m.atk} DEF:\${m.def||0}</div>
<div>击败奖励:金币\${m.gold} EXP\${m.exp}</div>
\`;
  }else{
    document.getElementById("battleInfo").innerText = "无怪物";
  }
  const bagBox = document.getElementById("bagBox");
  if(player.bag.length===0){
    bagBox.innerText = "背包为空";
  }else{
    bagBox.innerHTML = player.bag.map(x=>\`<span class="bag-item">\${x.name}</span>\`).join(" ");
  }
}
window.levelUp = function(){
  const cost = player.level * 120;
  const cfg = gameData.config;
  if(player.gold >= cost && player.level < cfg.maxLevel){
    player.gold -= cost;
    player.level +=1;
    savePlayerData();
    renderUi();
  }
};
document.getElementById("btnNextStage").onclick = function(){
  const cfg = gameData.config;
  const list = cfg.battleMonsterIdList||[];
  player.battleIndex = (player.battleIndex+1) % list.length;
  renderUi();
};
window.onload = loadGameData;
</script>
</body>
</html>`;

// 用户自定义AI游戏模板持久化
let userCustomGameTemplate = "";
const CUSTOM_TPL_STORAGE_KEY = "editor_custom_game_template";
function loadCustomTemplateFromStorage(){
  const tpl = localStorage.getItem(CUSTOM_TPL_STORAGE_KEY) || "";
  userCustomGameTemplate = tpl;
}
function saveCustomTemplate(htmlStr){
  userCustomGameTemplate = htmlStr;
  localStorage.setItem(CUSTOM_TPL_STORAGE_KEY, htmlStr);
  log("模板","✅已保存自定义游戏模板");
}
function resetCustomTemplate(){
  userCustomGameTemplate = "";
  localStorage.removeItem(CUSTOM_TPL_STORAGE_KEY);
  log("模板","已重置为系统默认内置模板");
}
function getActiveGameTemplate(){
  if(userCustomGameTemplate && userCustomGameTemplate.trim().length>10){
    return userCustomGameTemplate;
  }
  return IDLE_GAME_TEMPLATE_HTML;
}

let currentEditItemIndex = -1;
let currentEditNpcIndex = -1;
let currentEditMonsterIndex = -1;
let currentEditSkillIndex = -1;
let currentEditMapIndex = -1;
let currentEditAnimIndex = -1;
let mapCanvas, mapCtx;
let mapData = [];
const tileSize = 24;
let animFrames = [];
let animPreviewTimer = null;
let animPreviewCanvas, animPreviewCtx;
let selectedRowIndex = -1;

function isIdDuplicate(arr, id, skipIndex = -1) {
  const tid = id.trim();
  for (let i = 0; i < arr.length; i++) {
    if (i === skipIndex) continue;
    if (arr[i].id === tid) return true;
  }
  return false;
}

function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function setSelectedRow(domWrap, idx) {
  selectedRowIndex = idx;
  const trs = domWrap.querySelectorAll("tbody tr");
  trs.forEach(tr => tr.classList.remove("row-active"));
  if (idx >= 0 && trs[idx]) {
    trs[idx].classList.add("row-active");
  }
}

function renderEditorPanel(modId) {
  currentEditItemIndex = -1;
  currentEditNpcIndex = -1;
  currentEditMonsterIndex = -1;
  currentEditSkillIndex = -1;
  currentEditMapIndex = -1;
  currentEditAnimIndex = -1;
  selectedRowIndex = -1;

  const ed = document.getElementById("editor");
  let title = "";
  let bodyHtml = "";

  if (modId === "overview") {
    title = "项目概览";
    const prj = ProjectManager.currentProject;
    if (!prj) {
      bodyHtml = `<div class="card"><div class="empty-state"><div class="big-icon">🚧</div><p>暂无打开的项目，请新建项目</p></div></div>`;
    } else {
      bodyHtml = `
<div class="card">
<div class="card-title">项目信息</div>
<div class="form-grid">
<div class="form-row"><label>项目名称</label><input value="${prj.name}" disabled></div>
<div class="form-row"><label>游戏类型</label><input value="${prj.type}" disabled></div>
<div class="form-row full"><label>描述</label><textarea disabled rows="3">${prj.description || ""}</textarea></div>
<div class="form-row"><label>创建时间</label><input value="${prj.createTime || ""}" disabled></div>
</div>
</div>`;
    }
  } else if (modId === "game-config") {
    title = "游戏基础配置（放置挂机）";
    const p = ProjectManager.currentProject;
    if (!p) {
      bodyHtml = `<div class="card"><div class="empty-state"><p>请先新建项目</p></div></div>`;
    } else {
      const c = p.config;
      bodyHtml = `
<div class="card">
<div class="card-title">全局游戏设置</div>
<div class="form-grid">
<div class="form-row"><label>游戏标题</label><input id="cf_gameTitle" value="${c.gameTitle || ""}"></div>
<div class="form-row"><label>版本号</label><input id="cf_version" value="${c.version || "1.0.0"}"></div>
<div class="form-row"><label>背景色</label><input type="color" id="cf_bgColor" value="${c.bgColor || "#111111"}"></div>
<div class="form-row"><label>最大等级上限</label><input type="number" id="cf_maxLevel" value="${c.maxLevel || 99}"></div>
<div class="form-row"><label>初始玩家等级</label><input type="number" id="cf_startLevel" value="${c.startLevel || 1}"></div>
<div class="form-row"><label>初始金币</label><input type="number" id="cf_startGold" value="${c.startGold || 100}"></div>
<div class="form-row"><label>初始血量HP</label><input type="number" id="cf_startHp" value="${c.startHp || 100}"></div>
<div class="form-row"><label>基础每秒金币产出</label><input type="number" id="cf_baseGoldPerSec" value="${c.baseGoldPerSec || 10}"></div>
<div class="form-row"><label>每级产出增长系数(1.15)</label><input type="number" step="0.01" id="cf_levelRate" value="${c.levelRate || 1.15}"></div>
<div class="form-row"><label>挂机战斗间隔(毫秒)</label><input type="number" id="cf_battleTickMs" value="${c.battleTickMs || 2000}"></div>
<div class="form-row"><label>开启离线收益</label>
<select id="cf_enableOffline">
<option value="true">开启</option>
<option value="false">关闭</option>
</select>
</div>
<div class="form-row"><label>离线收益最大时长(秒)</label><input type="number" id="cf_maxOfflineSec" value="${c.maxOfflineSec || 3600}"></div>
<div class="form-row"><label>战斗失败是否重置推图</label>
<select id="cf_deathResetStage">
<option value="true">是</option>
<option value="false">否</option>
</select>
</div>
<div class="form-row full">
<label>推图怪物ID序列，逗号分隔(例:m001,m002,m003)</label>
<input id="cf_battleMonsterIdList" value="${(c.battleMonsterIdList||[]).join(",")}">
</div>
</div>
<div class="btn-group" style="margin-top:16px">
<button class="btn btn-primary" onclick="saveGameConfig()">保存配置</button>
</div>
</div>`;
    }
  } else if (modId === "item") {
    title = "物品管理";
    bodyHtml = `
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">物品列表</div>
<div>
<button class="btn btn-primary" onclick="openItemEditor()">新建物品</button>
<button class="btn" onclick="duplicateItem()">复制选中</button>
</div>
</div>
<div class="form-row">
<label>搜索(ID / 名称)</label>
<input placeholder="输入关键词过滤" oninput="filterItemList(this.value)">
</div>
<div id="itemListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="itemEditCard">
<h4>编辑物品</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="itemId"></div>
<div class="form-row"><label>名称</label><input id="itemName"></div>
<div class="form-row full"><label>描述</label><textarea id="itemDesc" rows="2"></textarea></div>
<div class="form-row"><label>类型</label>
<select id="itemType">
<option value="consume">消耗品</option>
<option value="weapon">武器</option>
<option value="armor">防具</option>
<option value="material">材料</option>
</select>
</div>
<div class="form-row"><label>售价</label><input type="number" id="itemPrice" value="0"></div>
<div class="form-row"><label>最大堆叠</label><input type="number" id="itemStackMax" value="99"></div>
<div class="form-row"><label>图标动画ID</label><input id="itemIconAnimId"></div>
<div class="form-row"><label>是否可使用</label>
<select id="itemUsable">
<option value="false">否</option>
<option value="true">是</option>
</select>
</div>
<div class="form-row full"><label>备注</label><textarea id="itemNote" rows="2"></textarea></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveItem()">保存</button>
<button class="btn" onclick="closeItemEditor()">取消</button>
</div>
</div>`;
  } else if (modId === "npc") {
    title = "NPC管理";
    bodyHtml = `
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">NPC列表</div>
<div>
<button class="btn btn-primary" onclick="openNpcEditor()">新建NPC</button>
<button class="btn" onclick="duplicateNpc()">复制选中</button>
</div>
</div>
<div class="form-row">
<label>搜索(ID / 名称)</label>
<input placeholder="输入关键词过滤" oninput="filterNpcList(this.value)">
</div>
<div id="npcListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="npcEditCard">
<h4>编辑NPC</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="npcId"></div>
<div class="form-row"><label>名称</label><input id="npcName"></div>
<div class="form-row full"><label>对话文本</label><textarea id="npcDialog" rows="3"></textarea></div>
<div class="form-row"><label>NPC类型</label>
<select id="npcType">
<option>商店NPC</option>
<option>任务NPC</option>
<option>剧情NPC</option>
</select>
</div>
<div class="form-row"><label>所属地图ID</label><input id="npcMapId"></div>
<div class="form-row"><label>图标动画ID</label><input id="npcIconAnimId"></div>
<div class="form-row full"><label>商店物品ID(逗号分隔)</label><input id="npcShopItemIds"></div>
<div class="form-row full"><label>备注</label><textarea id="npcNote" rows="2"></textarea></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveNpc()">保存</button>
<button class="btn" onclick="closeNpcEditor()">取消</button>
</div>
</div>`;
  } else if (modId === "monster") {
    title = "怪物管理";
    bodyHtml = `
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">怪物列表</div>
<div>
<button class="btn btn-primary" onclick="openMonsterEditor()">新建怪物</button>
<button class="btn" onclick="duplicateMonster()">复制选中</button>
</div>
</div>
<div class="form-row">
<label>搜索(ID / 名称)</label>
<input placeholder="输入关键词过滤" oninput="filterMonsterList(this.value)">
</div>
<div id="monsterListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="monsterEditCard">
<h4>编辑怪物</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="monsterId"></div>
<div class="form-row"><label>名称</label><input id="monsterName"></div>
<div class="form-row full"><label>描述</label><textarea id="monsterDesc" rows="2"></textarea></div>
<div class="form-row"><label>HP血量</label><input type="number" id="monsterHp" value="100"></div>
<div class="form-row"><label>ATK攻击</label><input type="number" id="monsterAtk" value="10"></div>
<div class="form-row"><label>DEF防御</label><input type="number" id="monsterDef" value="0"></div>
<div class="form-row"><label>击杀金币</label><input type="number" id="monsterGold" value="10"></div>
<div class="form-row"><label>击杀经验EXP</label><input type="number" id="monsterExp" value="20"></div>
<div class="form-row"><label>图标动画ID</label><input id="monsterIconAnimId"></div>
<div class="form-row full"><label>掉落物品ID(逗号分隔)</label><input id="monsterDropItemIds"></div>
<div class="form-row full"><label>备注</label><textarea id="monsterNote" rows="2"></textarea></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveMonster()">保存</button>
<button class="btn" onclick="closeMonsterEditor()">取消</button>
</div>
</div>`;
  } else if (modId === "skill") {
    title = "技能管理";
    bodyHtml = `
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div class="card-title">技能列表</div>
<div>
<button class="btn btn-primary" onclick="openSkillEditor()">新建技能</button>
<button class="btn" onclick="duplicateSkill()">复制选中</button>
</div>
</div>
<div class="form-row">
<label>搜索(ID / 名称)</label>
<input placeholder="输入关键词过滤" oninput="filterSkillList(this.value)">
</div>
<div id="skillListWrap"></div>
</div>
<div class="card" style="margin-top:16px;display:none" id="skillEditCard">
<h4>编辑技能</h4>
<div class="form-grid">
<div class="form-row"><label>ID</label><input id="skillId"></div>
<div class="form-row"><label>名称</label><input id="skillName"></div>
<div class="form-row full"><label>描述</label><textarea id="skillDesc" rows="2"></textarea></div>
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
<div class="form-row"><label>冷却CD(帧)</label><input type="number" id="skillCd" value="0"></div>
<div class="form-row"><label>目标类型</label>
<select id="skillTargetType">
<option value="enemy">敌方</option>
<option value="self">自身</option>
<option value="ally">友方</option>
</select>
</div>
<div class="form-row"><label>图标动画ID</label><input id="skillIconAnimId"></div>
<div class="form-row full"><label>备注</label><textarea id="skillNote" rows="2"></textarea></div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="saveSkill()">保存</button>
<button class="btn" onclick="closeSkillEditor()">取消</button>
</div>
</div>`;
  } else if (modId === "map-list") {
    title = "地图编辑器";
    bodyHtml = `
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
<option value="0">0‑空地</option>
<option value="1">1‑草地</option>
<option value="2">2‑墙壁</option>
<option value="3">3‑水域</option>
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
  } else if (modId === "anim-list") {
    title = "动画资源";
    bodyHtml = `
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
  } else if (modId === "export") {
    title = "项目导出 / 游戏模板管理";
    bodyHtml = `
<div class="card">
<div class="card-title">导出与备份</div>
<div class="btn-group">
<button class="btn btn-primary" onclick="downloadJson()">下载JSON配置</button>
<button class="btn btn-success" onclick="generateGameZip()">打包成品游戏ZIP</button>
</div>
<div class="form-row full" style="margin-top:16px;">
<label>导入JSON文件</label>
<input type="file" id="importJsonFile" accept=".json" onchange="importJsonFile(this)">
</div>
<div class="form-row full" style="margin-top:16px;">
<label>JSON预览</label>
<textarea id="jsonPreview" style="width:100%;height:180px;background:var(--bg-2);color:#eee;"></textarea>
<button class="btn" onclick="refreshJsonPreview()" style="margin-top:8px;">刷新预览</button>
</div>
</div>
<div class="card">
<div class="card-title">🎮 AI游戏模板管理</div>
<p>将AI生成的完整单页面HTML游戏模板粘贴下方文本框，点击【应用此模板】。打包游戏将使用该模板，无需修改源码文件。</p>
<div class="form-row full" style="margin-top:12px;">
<label>粘贴AI输出完整HTML模板代码</label>
<textarea id="customTplInput" style="width:100%;height:320px;background:var(--bg-2);color:#eee;"></textarea>
</div>
<div class="btn-group" style="margin-top:10px;">
<button class="btn btn-primary" onclick="applyCustomTemplate()">✅应用此模板</button>
<button class="btn btn-danger" onclick="resetCustomTemplateUi()">🔄重置为系统默认模板</button>
</div>
<div style="margin-top:10px;color:var(--text-3);font-size:12px;">
当前状态：<span id="tplStatusText">未使用自定义AI模板，使用系统内置模板</span>
</div>
</div>
<div class="card">
<div class="card-title">🌐 多人后端配置同步</div>
<div class="form-grid">
<div class="form-row full">
<label>后端API地址</label>
<input id="backendApiUrlInput" value="${localStorage.getItem('backendApiUrl') || 'http://localhost:3000'}">
</div>
</div>
<div class="btn-group" style="margin-top:12px">
<button class="btn btn-primary" onclick="publishConfigToBackend()">📤发布配置到游戏后端</button>
</div>
<div id="publishBackendStatus" style="margin-top:8px;font-size:12px;"></div>
<p style="margin-top:8px;font-size:12px;color:var(--text-3)">
修改怪物/技能/物品后，点击按钮热更新后端游戏配置；玩家刷新前端即可生效。
</p>
</div>`;
  }

  ed.innerHTML = `
<div class="editor-header"><div class="editor-title">${title}</div><div></div></div>
<div class="editor-body">${bodyHtml}</div>`;

  setTimeout(() => {
    if (modId === "item") renderItemList();
    if (modId === "npc") renderNpcList();
    if (modId === "monster") renderMonsterList();
    if (modId === "skill") renderSkillList();
    if (modId === "map-list") renderMapList();
    if (modId === "anim-list") renderAnimList();
  }, 60);
}

// 导出模块模板UI交互
function applyCustomTemplate(){
  const tplText = document.getElementById("customTplInput").value;
  if(!tplText || tplText.trim().length < 50){
    alert("模板内容太短，请粘贴AI输出完整HTML代码！");
    return;
  }
  saveCustomTemplate(tplText);
  document.getElementById("tplStatusText").innerText = "✅已启用用户自定义AI生成模板（浏览器本地已保存，刷新页面不丢失）";
}

function resetCustomTemplateUi(){
  if(!confirm("确定要重置为系统默认放置模板？自定义粘贴的AI模板会被清空！")) return;
  resetCustomTemplate();
  document.getElementById("customTplInput").value = "";
  document.getElementById("tplStatusText").innerText = "未使用自定义AI模板，使用系统内置模板";
}

// 打包函数
async function generateGameZip() {
  const p = ProjectManager.currentProject;
  if (!p) {
    log("警告", "请先新建项目");
    alert("请先创建/打开一个游戏项目！");
    return;
  }
  log("导出", "开始打包成品游戏ZIP");
  const zip = new JSZip();
  const jsonStr = ProjectManager.exportJson();
  zip.file("game-data.json", jsonStr);
  const useTemplateHtml = getActiveGameTemplate();
  zip.file("index.html", useTemplateHtml);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, (p.name || "game_release") + ".zip");
  log("导出", "✅成品游戏ZIP打包完成，已经开始下载！");
}

function saveGameConfig() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "无打开项目"); return; }
  const c = p.config;
  c.gameTitle = document.getElementById("cf_gameTitle").value.trim();
  c.version = document.getElementById("cf_version").value.trim();
  c.bgColor = document.getElementById("cf_bgColor").value;
  c.maxLevel = Number(document.getElementById("cf_maxLevel").value);
  c.startLevel = Number(document.getElementById("cf_startLevel").value);
  c.startGold = Number(document.getElementById("cf_startGold").value);
  c.startHp = Number(document.getElementById("cf_startHp").value);
  c.baseGoldPerSec = Number(document.getElementById("cf_baseGoldPerSec").value);
  c.levelRate = Number(document.getElementById("cf_levelRate").value);
  c.battleTickMs = Number(document.getElementById("cf_battleTickMs").value);
  c.enableOffline = document.getElementById("cf_enableOffline").value === "true";
  c.maxOfflineSec = Number(document.getElementById("cf_maxOfflineSec").value);
  c.deathResetStage = document.getElementById("cf_deathResetStage").value === "true";

  const rawMonsterIds = document.getElementById("cf_battleMonsterIdList").value.split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  c.battleMonsterIdList = rawMonsterIds;

  ProjectManager.saveLocal();
  log("配置", "游戏基础配置已保存（放置挂机参数已写入）");
}

// 物品
function openItemEditor() {
  currentEditItemIndex = -1;
  document.getElementById("itemId").value = "";
  document.getElementById("itemName").value = "";
  document.getElementById("itemDesc").value = "";
  document.getElementById("itemType").value = "consume";
  document.getElementById("itemPrice").value = 0;
  document.getElementById("itemStackMax").value = 99;
  document.getElementById("itemIconAnimId").value = "";
  document.getElementById("itemUsable").value = "false";
  document.getElementById("itemNote").value = "";
  document.getElementById("itemEditCard").style.display = "block";
}

function closeItemEditor() {
  document.getElementById("itemEditCard").style.display = "none";
}

function saveItem() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "请新建项目"); return; }
  const items = p.items;
  const d = {
    id: document.getElementById("itemId").value.trim(),
    name: document.getElementById("itemName").value.trim(),
    desc: document.getElementById("itemDesc").value.trim(),
    type: document.getElementById("itemType").value,
    price: Number(document.getElementById("itemPrice").value),
    stackMax: Number(document.getElementById("itemStackMax").value),
    iconAnimId: document.getElementById("itemIconAnimId").value.trim(),
    usable: document.getElementById("itemUsable").value === "true",
    note: document.getElementById("itemNote").value.trim()
  };
  if (!d.id || !d.name) { log("警告", "ID和名称不能为空"); return; }
  if (isIdDuplicate(items, d.id, currentEditItemIndex)) {
    log("错误", `物品ID【${d.id}】已存在，请更换ID`);
    alert(`物品ID【${d.id}】已存在，请更换ID！`);
    return;
  }
  if (currentEditItemIndex === -1) {
    items.push(d);
    log("物品", `新增：${d.name} | ID:${d.id}`);
  } else {
    items[currentEditItemIndex] = d;
    log("物品", `修改：${d.name} | ID:${d.id}`);
  }
  ProjectManager.saveLocal();
  closeItemEditor();
  renderItemList();
}

function filterItemList(keyword) {
  renderItemList(keyword);
}

function renderItemList(filter = "") {
  const wrap = document.getElementById("itemListWrap");
  const arr = ProjectManager.currentProject?.items || [];
  let list = arr;
  const kw = filter.toLowerCase().trim();
  if (kw) list = arr.filter(x => x.id.toLowerCase().includes(kw) || x.name.toLowerCase().includes(kw));
  if (list.length === 0) {
    wrap.innerHTML = "<p class='empty-state'>暂无匹配物品</p>";
    return;
  }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>售价</th><th>堆叠</th><th>操作</th></tr></thead><tbody>`;
  list.forEach((it, idx) => {
    h += `<tr class="${selectedRowIndex === idx ? 'row-active' : ''}" onclick="setSelectedRow(document.getElementById('itemListWrap'),${idx})" style="border-bottom:1px solid var(--border);cursor:pointer;">
<td>${it.id}</td>
<td>${it.name}</td>
<td>${it.type}</td>
<td>${it.price}</td>
<td>${it.stackMax ?? 99}</td>
<td>
<button class="btn" onclick="event.stopPropagation();editItem(${arr.indexOf(it)})">编辑</button>
<button class="btn btn-danger" onclick="event.stopPropagation();deleteItem(${arr.indexOf(it)})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>";
  wrap.innerHTML = h;
}

function editItem(idx) {
  const it = ProjectManager.currentProject.items[idx];
  currentEditItemIndex = idx;
  document.getElementById("itemId").value = it.id;
  document.getElementById("itemName").value = it.name;
  document.getElementById("itemDesc").value = it.desc || "";
  document.getElementById("itemType").value = it.type || "consume";
  document.getElementById("itemPrice").value = Number(it.price || 0);
  document.getElementById("itemStackMax").value = Number(it.stackMax ?? 99);
  document.getElementById("itemIconAnimId").value = it.iconAnimId || "";
  document.getElementById("itemUsable").value = it.usable ? "true" : "false";
  document.getElementById("itemNote").value = it.note || "";
  document.getElementById("itemEditCard").style.display = "block";
}

function deleteItem(idx) {
  const it = ProjectManager.currentProject.items[idx];
  if (!confirm(`确定删除物品【${it.name}】?`)) return;
  ProjectManager.currentProject.items.splice(idx, 1);
  ProjectManager.saveLocal();
  renderItemList();
  log("物品", `删除：${it.name} | ID:${it.id}`);
}

function duplicateItem() {
  if (currentEditItemIndex === -1) { alert("请先编辑/选中一条物品再复制"); return; }
  const src = ProjectManager.currentProject.items[currentEditItemIndex];
  const cp = cloneObj(src);
  cp.id = cp.id + "_copy";
  cp.name = cp.name + "(副本)";
  ProjectManager.currentProject.items.push(cp);
  ProjectManager.saveLocal();
  log("物品", `复制生成副本 ID:${cp.id}`);
  renderItemList();
}

// NPC
function openNpcEditor() {
  currentEditNpcIndex = -1;
  document.getElementById("npcId").value = "";
  document.getElementById("npcName").value = "";
  document.getElementById("npcDialog").value = "";
  document.getElementById("npcType").value = "商店NPC";
  document.getElementById("npcMapId").value = "";
  document.getElementById("npcIconAnimId").value = "";
  document.getElementById("npcShopItemIds").value = "";
  document.getElementById("npcNote").value = "";
  document.getElementById("npcEditCard").style.display = "block";
}

function closeNpcEditor() {
  document.getElementById("npcEditCard").style.display = "none";
}

function saveNpc() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "请新建项目"); return; }
  const arr = p.npcs;
  const shopStr = document.getElementById("npcShopItemIds").value.trim();
  const d = {
    id: document.getElementById("npcId").value.trim(),
    name: document.getElementById("npcName").value.trim(),
    dialog: document.getElementById("npcDialog").value.trim(),
    type: document.getElementById("npcType").value,
    mapId: document.getElementById("npcMapId").value.trim(),
    iconAnimId: document.getElementById("npcIconAnimId").value.trim(),
    shopItemIds: shopStr ? shopStr.split(",").map(s => s.trim()) : [],
    note: document.getElementById("npcNote").value.trim()
  };
  if (!d.id || !d.name) { log("警告", "NPC ID、名称不能为空"); return; }
  if (isIdDuplicate(arr, d.id, currentEditNpcIndex)) {
    log("错误", `NPC ID【${d.id}】已存在`);
    alert(`NPC ID【${d.id}】已存在！`);
    return;
  }
  if (currentEditNpcIndex === -1) {
    arr.push(d);
    log("NPC", `新增：${d.name} | ID:${d.id}`);
  } else {
    arr[currentEditNpcIndex] = d;
    log("NPC", `修改：${d.name} | ID:${d.id}`);
  }
  ProjectManager.saveLocal();
  closeNpcEditor();
  renderNpcList();
}

function filterNpcList(kw) {
  renderNpcList(kw);
}

function renderNpcList(filter = "") {
  const wrap = document.getElementById("npcListWrap");
  const arr = ProjectManager.currentProject?.npcs || [];
  let list = arr;
  const k = filter.toLowerCase().trim();
  if (k) list = arr.filter(x => x.id.toLowerCase().includes(k) || x.name.toLowerCase().includes(k));
  if (list.length === 0) {
    wrap.innerHTML = "<p class='empty-state'>暂无匹配NPC</p>";
    return;
  }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>地图ID</th><th>操作</th></tr></thead><tbody>`;
  list.forEach((it, idx) => {
    h += `<tr class="${selectedRowIndex === idx ? 'row-active' : ''}" onclick="setSelectedRow(document.getElementById('npcListWrap'),${idx})" style="border-bottom:1px solid var(--border);cursor:pointer;">
<td>${it.id}</td>
<td>${it.name}</td>
<td>${it.type}</td>
<td>${it.mapId || ""}</td>
<td>
<button class="btn" onclick="event.stopPropagation();editNpc(${arr.indexOf(it)})">编辑</button>
<button class="btn btn-danger" onclick="event.stopPropagation();deleteNpc(${arr.indexOf(it)})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>";
  wrap.innerHTML = h;
}

function editNpc(idx) {
  const it = ProjectManager.currentProject.npcs[idx];
  currentEditNpcIndex = idx;
  document.getElementById("npcId").value = it.id;
  document.getElementById("npcName").value = it.name;
  document.getElementById("npcDialog").value = it.dialog || "";
  document.getElementById("npcType").value = it.type;
  document.getElementById("npcMapId").value = it.mapId || "";
  document.getElementById("npcIconAnimId").value = it.iconAnimId || "";
  document.getElementById("npcShopItemIds").value = (it.shopItemIds || []).join(",");
  document.getElementById("npcNote").value = it.note || "";
  document.getElementById("npcEditCard").style.display = "block";
}

function deleteNpc(idx) {
  const it = ProjectManager.currentProject.npcs[idx];
  if (!confirm(`删除NPC【${it.name}】?`)) return;
  ProjectManager.currentProject.npcs.splice(idx, 1);
  ProjectManager.saveLocal();
  renderNpcList();
  log("NPC", `删除：${it.name} | ID:${it.id}`);
}

function duplicateNpc() {
  if (currentEditNpcIndex === -1) { alert("请先编辑选中NPC"); return; }
  const src = ProjectManager.currentProject.npcs[currentEditNpcIndex];
  const cp = cloneObj(src);
  cp.id += "_copy";
  cp.name += "(副本)";
  ProjectManager.currentProject.npcs.push(cp);
  ProjectManager.saveLocal();
  log("NPC", `复制副本 ID:${cp.id}`);
  renderNpcList();
}

// 怪物
function openMonsterEditor() {
  currentEditMonsterIndex = -1;
  document.getElementById("monsterId").value = "";
  document.getElementById("monsterName").value = "";
  document.getElementById("monsterDesc").value = "";
  document.getElementById("monsterHp").value = 100;
  document.getElementById("monsterAtk").value = 10;
  document.getElementById("monsterDef").value = 0;
  document.getElementById("monsterGold").value = 10;
  document.getElementById("monsterExp").value = 20;
  document.getElementById("monsterIconAnimId").value = "";
  document.getElementById("monsterDropItemIds").value = "";
  document.getElementById("monsterNote").value = "";
  document.getElementById("monsterEditCard").style.display = "block";
}

function closeMonsterEditor() {
  document.getElementById("monsterEditCard").style.display = "none";
}

function saveMonster() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "请新建项目"); return; }
  const arr = p.monsters;
  const dropStr = document.getElementById("monsterDropItemIds").value.trim();
  const d = {
    id: document.getElementById("monsterId").value.trim(),
    name: document.getElementById("monsterName").value.trim(),
    desc: document.getElementById("monsterDesc").value.trim(),
    hp: Number(document.getElementById("monsterHp").value),
    atk: Number(document.getElementById("monsterAtk").value),
    def: Number(document.getElementById("monsterDef").value),
    gold: Number(document.getElementById("monsterGold").value),
    exp: Number(document.getElementById("monsterExp").value),
    iconAnimId: document.getElementById("monsterIconAnimId").value.trim(),
    dropItemIds: dropStr ? dropStr.split(",").map(s => s.trim()) : [],
    note: document.getElementById("monsterNote").value.trim()
  };
  if (!d.id || !d.name) { log("警告", "怪物ID、名称不能为空"); return; }
  if (isIdDuplicate(arr, d.id, currentEditMonsterIndex)) {
    log("错误", `怪物ID【${d.id}】已存在`);
    alert(`怪物ID【${d.id}】已存在！`);
    return;
  }
  if (currentEditMonsterIndex === -1) {
    arr.push(d);
    log("怪物", `新增：${d.name} | ID:${d.id}`);
  } else {
    arr[currentEditMonsterIndex] = d;
    log("怪物", `修改：${d.name} | ID:${d.id}`);
  }
  ProjectManager.saveLocal();
  closeMonsterEditor();
  renderMonsterList();
}

function filterMonsterList(kw) {
  renderMonsterList(kw);
}

function renderMonsterList(filter = "") {
  const wrap = document.getElementById("monsterListWrap");
  const arr = ProjectManager.currentProject?.monsters || [];
  let list = arr;
  const k = filter.toLowerCase().trim();
  if (k) list = arr.filter(x => x.id.toLowerCase().includes(k) || x.name.toLowerCase().includes(k));
  if (list.length === 0) {
    wrap.innerHTML = "<p class='empty-state'>暂无匹配怪物</p>";
    return;
  }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>HP</th><th>ATK</th><th>DEF</th><th>金币</th><th>EXP</th><th>操作</th></tr></thead><tbody>`;
  list.forEach((it, idx) => {
    h += `<tr class="${selectedRowIndex === idx ? 'row-active' : ''}" onclick="setSelectedRow(document.getElementById('monsterListWrap'),${idx})" style="border-bottom:1px solid var(--border);cursor:pointer;">
<td>${it.id}</td>
<td>${it.name}</td>
<td>${it.hp}</td>
<td>${it.atk}</td>
<td>${it.def ?? 0}</td>
<td>${it.gold}</td>
<td>${it.exp ?? 20}</td>
<td>
<button class="btn" onclick="event.stopPropagation();editMonster(${arr.indexOf(it)})">编辑</button>
<button class="btn btn-danger" onclick="event.stopPropagation();deleteMonster(${arr.indexOf(it)})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>";
  wrap.innerHTML = h;
}

function editMonster(idx) {
  const it = ProjectManager.currentProject.monsters[idx];
  currentEditMonsterIndex = idx;
  document.getElementById("monsterId").value = it.id;
  document.getElementById("monsterName").value = it.name;
  document.getElementById("monsterDesc").value = it.desc || "";
  document.getElementById("monsterHp").value = Number(it.hp || 100);
  document.getElementById("monsterAtk").value = Number(it.atk || 10);
  document.getElementById("monsterDef").value = Number(it.def ?? 0);
  document.getElementById("monsterGold").value = Number(it.gold || 10);
  document.getElementById("monsterExp").value = Number(it.exp ?? 20);
  document.getElementById("monsterIconAnimId").value = it.iconAnimId || "";
  document.getElementById("monsterDropItemIds").value = (it.dropItemIds || []).join(",");
  document.getElementById("monsterNote").value = it.note || "";
  document.getElementById("monsterEditCard").style.display = "block";
}

function deleteMonster(idx) {
  const it = ProjectManager.currentProject.monsters[idx];
  if (!confirm(`删除怪物【${it.name}】?`)) return;
  ProjectManager.currentProject.monsters.splice(idx, 1);
  ProjectManager.saveLocal();
  renderMonsterList();
  log("怪物", `删除：${it.name} | ID:${it.id}`);
}

function duplicateMonster() {
  if (currentEditMonsterIndex === -1) { alert("请先编辑选中怪物"); return; }
  const src = ProjectManager.currentProject.monsters[currentEditMonsterIndex];
  const cp = cloneObj(src);
  cp.id += "_copy";
  cp.name += "(副本)";
  ProjectManager.currentProject.monsters.push(cp);
  ProjectManager.saveLocal();
  log("怪物", `复制副本 ID:${cp.id}`);
  renderMonsterList();
}

// 技能
function openSkillEditor() {
  currentEditSkillIndex = -1;
  document.getElementById("skillId").value = "";
  document.getElementById("skillName").value = "";
  document.getElementById("skillDesc").value = "";
  document.getElementById("skillType").value = "攻击技能";
  document.getElementById("skillPower").value = 20;
  document.getElementById("skillMpCost").value = 10;
  document.getElementById("skillCd").value = 0;
  document.getElementById("skillTargetType").value = "enemy";
  document.getElementById("skillIconAnimId").value = "";
  document.getElementById("skillNote").value = "";
  document.getElementById("skillEditCard").style.display = "block";
}

function closeSkillEditor() {
  document.getElementById("skillEditCard").style.display = "none";
}

function saveSkill() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "请新建项目"); return; }
  const arr = p.skills;
  const d = {
    id: document.getElementById("skillId").value.trim(),
    name: document.getElementById("skillName").value.trim(),
    desc: document.getElementById("skillDesc").value.trim(),
    type: document.getElementById("skillType").value,
    power: Number(document.getElementById("skillPower").value),
    mpCost: Number(document.getElementById("skillMpCost").value),
    cd: Number(document.getElementById("skillCd").value),
    targetType: document.getElementById("skillTargetType").value,
    iconAnimId: document.getElementById("skillIconAnimId").value.trim(),
    note: document.getElementById("skillNote").value.trim()
  };
  if (!d.id || !d.name) { log("警告", "技能ID、名称不能为空"); return; }
  if (isIdDuplicate(arr, d.id, currentEditSkillIndex)) {
    log("错误", `技能ID【${d.id}】已存在`);
    alert(`技能ID【${d.id}】已存在！`);
    return;
  }
  if (currentEditSkillIndex === -1) {
    arr.push(d);
    log("技能", `新增：${d.name} | ID:${d.id}`);
  } else {
    arr[currentEditSkillIndex] = d;
    log("技能", `修改：${d.name} | ID:${d.id}`);
  }
  ProjectManager.saveLocal();
  closeSkillEditor();
  renderSkillList();
}

function filterSkillList(kw) {
  renderSkillList(kw);
}

function renderSkillList(filter = "") {
  const wrap = document.getElementById("skillListWrap");
  const arr = ProjectManager.currentProject?.skills || [];
  let list = arr;
  const k = filter.toLowerCase().trim();
  if (k) list = arr.filter(x => x.id.toLowerCase().includes(k) || x.name.toLowerCase().includes(k));
  if (list.length === 0) {
    wrap.innerHTML = "<p class='empty-state'>暂无匹配技能</p>";
    return;
  }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>威力</th><th>耗蓝</th><th>CD</th><th>操作</th></tr></thead><tbody>`;
  list.forEach((it, idx) => {
    h += `<tr class="${selectedRowIndex === idx ? 'row-active' : ''}" onclick="setSelectedRow(document.getElementById('skillListWrap'),${idx})" style="border-bottom:1px solid var(--border);cursor:pointer;">
<td>${it.id}</td>
<td>${it.name}</td>
<td>${it.type}</td>
<td>${it.power}</td>
<td>${it.mpCost}</td>
<td>${it.cd ?? 0}</td>
<td>
<button class="btn" onclick="event.stopPropagation();editSkill(${arr.indexOf(it)})">编辑</button>
<button class="btn btn-danger" onclick="event.stopPropagation();deleteSkill(${arr.indexOf(it)})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>";
  wrap.innerHTML = h;
}

function editSkill(idx) {
  const it = ProjectManager.currentProject.skills[idx];
  currentEditSkillIndex = idx;
  document.getElementById("skillId").value = it.id;
  document.getElementById("skillName").value = it.name;
  document.getElementById("skillDesc").value = it.desc || "";
  document.getElementById("skillType").value = it.type;
  document.getElementById("skillPower").value = Number(it.power || 20);
  document.getElementById("skillMpCost").value = Number(it.mpCost || 10);
  document.getElementById("skillCd").value = Number(it.cd ?? 0);
  document.getElementById("skillTargetType").value = it.targetType || "enemy";
  document.getElementById("skillIconAnimId").value = it.iconAnimId || "";
  document.getElementById("skillNote").value = it.note || "";
  document.getElementById("skillEditCard").style.display = "block";
}

function deleteSkill(idx) {
  const it = ProjectManager.currentProject.skills[idx];
  if (!confirm(`删除技能【${it.name}】?`)) return;
  ProjectManager.currentProject.skills.splice(idx, 1);
  ProjectManager.saveLocal();
  renderSkillList();
  log("技能", `删除：${it.name} | ID:${it.id}`);
}

function duplicateSkill() {
  if (currentEditSkillIndex === -1) { alert("请先编辑选中技能"); return; }
  const src = ProjectManager.currentProject.skills[currentEditSkillIndex];
  const cp = cloneObj(src);
  cp.id += "_copy";
  cp.name += "(副本)";
  ProjectManager.currentProject.skills.push(cp);
  ProjectManager.saveLocal();
  log("技能", `复制副本 ID:${cp.id}`);
  renderSkillList();
}

// 地图
function openMapCreator() {
  currentEditMapIndex = -1;
  document.getElementById("mapId").value = "";
  document.getElementById("mapName").value = "";
  document.getElementById("mapW").value = 20;
  document.getElementById("mapH").value = 15;
  document.getElementById("mapEditCard").style.display = "block";
  initMapCanvas();
}

function closeMapEditor() {
  document.getElementById("mapEditCard").style.display = "none";
}

function initMapCanvas() {
  mapCanvas = document.getElementById("mapCanvas");
  mapCtx = mapCanvas.getContext("2d");
  const w = Number(document.getElementById("mapW").value);
  const h = Number(document.getElementById("mapH").value);
  mapCanvas.width = w * tileSize;
  mapCanvas.height = h * tileSize;
  mapData = Array.from({ length: h }, () => Array(w).fill(0));
  drawMap();
  mapCanvas.onmousedown = e => paintTile(e);
  mapCanvas.onmousemove = e => { if (e.buttons === 1) paintTile(e); };
}

function paintTile(e) {
  const rect = mapCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / tileSize);
  const y = Math.floor((e.clientY - rect.top) / tileSize);
  const tile = Number(document.getElementById("tileSelect").value);
  if (y >= 0 && y < mapData.length && x >= 0 && x < mapData[0].length) {
    mapData[y][x] = tile;
    drawMap();
  }
}

function drawMap() {
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  const colorMap = { "0": "#222222", "1": "#487a38", "2": "#777777", "3": "#3068aa" };
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[y].length; x++) {
      const t = mapData[y][x];
      mapCtx.fillStyle = colorMap[t] || "#000";
      mapCtx.fillRect(x * tileSize, y * tileSize, tileSize - 1, tileSize - 1);
    }
  }
}

function clearMapCanvas() {
  const w = Number(document.getElementById("mapW").value);
  const h = Number(document.getElementById("mapH").value);
  mapData = Array.from({ length: h }, () => Array(w).fill(0));
  drawMap();
  log("地图", "画布清空");
}

function saveMap() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "请新建项目"); return; }
  const arr = p.maps;
  const d = {
    id: document.getElementById("mapId").value.trim(),
    name: document.getElementById("mapName").value.trim(),
    width: Number(document.getElementById("mapW").value),
    height: Number(document.getElementById("mapH").value),
    tiles: mapData
  };
  if (!d.id || !d.name) { log("警告", "地图ID、名称不能为空"); return; }
  if (isIdDuplicate(arr, d.id, currentEditMapIndex)) {
    log("错误", `地图ID【${d.id}】已存在`);
    alert(`地图ID【${d.id}】已存在！`);
    return;
  }
  if (currentEditMapIndex === -1) {
    arr.push(d);
    log("地图", `新建：${d.name} | ID:${d.id}`);
  } else {
    arr[currentEditMapIndex] = d;
    log("地图", `修改：${d.name} | ID:${d.id}`);
  }
  ProjectManager.saveLocal();
  closeMapEditor();
  renderMapList();
}

function renderMapList() {
  const wrap = document.getElementById("mapListWrap");
  const arr = ProjectManager.currentProject?.maps || [];
  if (arr.length === 0) {
    wrap.innerHTML = "<p class='empty-state'>暂无地图</p>";
    return;
  }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>尺寸</th><th>操作</th></tr></thead><tbody>`;
  arr.forEach((m, idx) => {
    h += `<tr style="border-bottom:1px solid var(--border);">
<td>${m.id}</td>
<td>${m.name}</td>
<td>${m.width}×${m.height}</td>
<td>
<button class="btn" onclick="editMap(${idx})">编辑</button>
<button class="btn btn-danger" onclick="deleteMap(${idx})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>";
  wrap.innerHTML = h;
}

function editMap(idx) {
  const m = ProjectManager.currentProject.maps[idx];
  currentEditMapIndex = idx;
  document.getElementById("mapId").value = m.id;
  document.getElementById("mapName").value = m.name;
  document.getElementById("mapW").value = m.width;
  document.getElementById("mapH").value = m.height;
  document.getElementById("mapEditCard").style.display = "block";
  initMapCanvas();
  mapData = m.tiles;
  drawMap();
}

function deleteMap(idx) {
  const m = ProjectManager.currentProject.maps[idx];
  if (!confirm(`删除地图【${m.name}】?`)) return;
  ProjectManager.currentProject.maps.splice(idx, 1);
  ProjectManager.saveLocal();
  renderMapList();
  log("地图", `删除：${m.name} | ID:${m.id}`);
}

// 动画
function openAnimCreator() {
  currentEditAnimIndex = -1;
  document.getElementById("animId").value = "";
  document.getElementById("animName").value = "";
  document.getElementById("animFrameDelay").value = 150;
  animFrames = [];
  refreshAnimFramePreview();
  document.getElementById("animEditCard").style.display = "block";
  animPreviewCanvas = document.getElementById("animPreviewCanvas");
  animPreviewCtx = animPreviewCanvas.getContext("2d");
  stopAnimPreview();
}

function closeAnimEditor() {
  stopAnimPreview();
  document.getElementById("animEditCard").style.display = "none";
}

function addAnimFrames(input) {
  const files = Array.from(input.files);
  files.forEach(f => {
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.src = ev.target.result;
      animFrames.push({ src: ev.target.result, img: img });
      refreshAnimFramePreview();
    };
    r.readAsDataURL(f);
  });
}

function refreshAnimFramePreview() {
  const wrap = document.getElementById("animFramePreviewWrap");
  let h = "";
  animFrames.forEach((fr, i) => {
    h += `<div style="width:60px;height:60px;border:1px solid var(--border-2);border-radius:6px;overflow:hidden;">
<img src="${fr.src}" style="width:100%;height:100%;object-fit:contain;">
<button style="width:100%;font-size:10px;" onclick="removeAnimFrame(${i})">删除</button>
</div>`;
  });
  wrap.innerHTML = h;
}

function removeAnimFrame(idx) {
  animFrames.splice(idx, 1);
  refreshAnimFramePreview();
}

function playAnimPreview() {
  stopAnimPreview();
  const delay = Number(document.getElementById("animFrameDelay").value);
  let fi = 0;
  animPreviewTimer = setInterval(() => {
    const fr = animFrames[fi];
    animPreviewCtx.clearRect(0, 0, 128, 128);
    if (fr && fr.img.complete) animPreviewCtx.drawImage(fr.img, 0, 0, 128, 128);
    fi = (fi + 1) % animFrames.length;
  }, delay);
}

function stopAnimPreview() {
  if (animPreviewTimer) clearInterval(animPreviewTimer);
  animPreviewTimer = null;
  if (animPreviewCtx) animPreviewCtx.clearRect(0, 0, 128, 128);
}

function saveAnimation() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "请新建项目"); return; }
  const arr = p.animations;
  const d = {
    id: document.getElementById("animId").value.trim(),
    name: document.getElementById("animName").value.trim(),
    frameDelay: Number(document.getElementById("animFrameDelay").value),
    frames: animFrames.map(x => ({ src: x.src }))
  };
  if (!d.id || !d.name) { log("警告", "动画ID、名称不能为空"); return; }
  if (isIdDuplicate(arr, d.id, currentEditAnimIndex)) {
    log("错误", `动画ID【${d.id}】已存在`);
    alert(`动画ID【${d.id}】已存在！`);
    return;
  }
  if (currentEditAnimIndex === -1) {
    arr.push(d);
    log("动画", `新建：${d.name} | ID:${d.id}`);
  } else {
    arr[currentEditAnimIndex] = d;
    log("动画", `修改：${d.name} | ID:${d.id}`);
  }
  ProjectManager.saveLocal();
  closeAnimEditor();
  renderAnimList();
}

function renderAnimList() {
  const wrap = document.getElementById("animListWrap");
  const arr = ProjectManager.currentProject?.animations || [];
  if (arr.length === 0) {
    wrap.innerHTML = "<p class='empty-state'>暂无动画</p>";
    return;
  }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>帧数</th><th>操作</th></tr></thead><tbody>`;
  arr.forEach((a, idx) => {
    h += `<tr style="border-bottom:1px solid var(--border);">
<td>${a.id}</td>
<td>${a.name}</td>
<td>${a.frames?.length || 0}</td>
<td>
<button class="btn" onclick="editAnimation(${idx})">编辑</button>
<button class="btn btn-danger" onclick="deleteAnimation(${idx})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>";
  wrap.innerHTML = h;
}

function editAnimation(idx) {
  const a = ProjectManager.currentProject.animations[idx];
  currentEditAnimIndex = idx;
  document.getElementById("animId").value = a.id;
  document.getElementById("animName").value = a.name;
  document.getElementById("animFrameDelay").value = a.frameDelay || 150;
  animFrames = (a.frames || []).map(f => ({ src: f.src, img: null }));
  refreshAnimFramePreview();
  document.getElementById("animEditCard").style.display = "block";
  animPreviewCanvas = document.getElementById("animPreviewCanvas");
  animPreviewCtx = animPreviewCanvas.getContext("2d");
  stopAnimPreview();
}

function deleteAnimation(idx) {
  const a = ProjectManager.currentProject.animations[idx];
  if (!confirm(`删除动画【${a.name}】?`)) return;
  ProjectManager.currentProject.animations.splice(idx, 1);
  ProjectManager.saveLocal();
  renderAnimList();
  log("动画", `删除：${a.name} | ID:${a.id}`);
}

// 后端配置上传函数
async function publishConfigToBackend() {
  const p = ProjectManager.currentProject;
  if (!p) {
    log("警告", "请先新建/打开项目！");
    return;
  }

  const input = document.getElementById("backendApiUrlInput");
  let baseUrl = "http://localhost:3000";
  if (input) {
    baseUrl = input.value.trim() || baseUrl;
    localStorage.setItem("backendApiUrl", baseUrl);
  }

  const jsonRaw = ProjectManager.exportJson();
  const statusDom = document.getElementById("publishBackendStatus");

  try {
    const resp = await fetch(`${baseUrl}/api/upload-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonRaw
    });

    const resData = await resp.json();

    if (resData.ok) {
      log("后端同步", `✅成功：${resData.msg || '配置已上传'}`);
      if (statusDom) statusDom.innerHTML = `<span style="color:#4cd964">✅${resData.msg || '配置已上传'}</span>`;
    } else {
      log("后端同步", `❌失败：${resData.msg || '后端返回失败'}`);
      if (statusDom) statusDom.innerHTML = `<span style="color:#ff5555">❌${resData.msg || '后端返回失败'}</span>`;
    }
  } catch (err) {
    log("后端同步", `❌网络错误：${err.message}`);
    if (statusDom) statusDom.innerHTML = `<span style="color:#ff5555">❌网络错误，无法连接后端</span>`;
    console.error(err);
  }
}

// 工具函数
function downloadJson() {
  const p = ProjectManager.currentProject;
  if (!p) { alert("请先新建项目"); return; }
  const blob = new Blob([ProjectManager.exportJson()], { type: "application/json" });
  saveAs(blob, (p.name || "game-project") + ".json");
  log("导出", "✅JSON配置已下载");
}

function importJsonFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      ProjectManager.loadFromJson(ev.target.result);
      log("导入", "✅JSON配置已导入");
    } catch (e) {
      alert("JSON格式错误：" + e.message);
    }
  };
  reader.readAsText(file);
}

function refreshJsonPreview() {
  const p = ProjectManager.currentProject;
  if (!p) {
    document.getElementById("jsonPreview").value = "";
    return;
  }
  document.getElementById("jsonPreview").value = ProjectManager.exportJson();
}
