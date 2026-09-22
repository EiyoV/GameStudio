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

// ---------------------- 公共工具函数 ----------------------
/**
 * ID重复检测
 * @param {Array} arr 数组
 * @param {string} id 待检测ID
 * @param {number} skipIndex 跳过当前编辑下标(编辑模式)
 * @returns {boolean}
 */
function isIdDuplicate(arr, id, skipIndex = -1) {
  const tid = id.trim();
  for (let i = 0; i < arr.length; i++) {
    if (i === skipIndex) continue;
    if (arr[i].id === tid) return true;
  }
  return false;
}

/** 深拷贝对象，用于复制条目 */
function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** 设置表格选中行 */
function setSelectedRow(domWrap, idx) {
  selectedRowIndex = idx;
  const trs = domWrap.querySelectorAll("tbody tr");
  trs.forEach(tr => tr.classList.remove("row-active"));
  if (idx >= 0 && trs[idx]) {
    trs[idx].classList.add("row-active");
  }
}
// ----------------------------------------------------------


function renderEditorPanel(modId) {
  // 切换模块时全部重置编辑下标，防止串数据BUG
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
    title = "游戏基础配置";
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
<div class="form-row"><label>最大等级</label><input type="number" id="cf_maxLevel" value="${c.maxLevel || 99}"></div>
<div class="form-row"><label>背景色</label><input type="color" id="cf_bgColor" value="${c.bgColor || "#111111"}"></div>
<div class="form-row"><label>版本号</label><input id="cf_version" value="${c.version || "1.0.0"}"></div>
<div class="form-row"><label>初始金币</label><input type="number" id="cf_startGold" value="${c.startGold || 100}"></div>
<div class="form-row"><label>初始血量</label><input type="number" id="cf_startHp" value="${c.startHp || 100}"></div>
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
    title = "项目导出";
    bodyHtml = `
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

// ---------------------- 基础配置 ----------------------
function saveGameConfig() {
  const p = ProjectManager.currentProject;
  if (!p) { log("警告", "无打开项目"); return; }
  p.config.gameTitle = document.getElementById("cf_gameTitle").value;
  p.config.maxLevel = Number(document.getElementById("cf_maxLevel").value);
  p.config.bgColor = document.getElementById("cf_bgColor").value;
  p.config.version = document.getElementById("cf_version").value;
  p.config.startGold = Number(document.getElementById("cf_startGold").value);
  p.config.startHp = Number(document.getElementById("cf_startHp").value);
  ProjectManager.saveLocal();
  log("配置", "游戏基础配置已保存");
}

// ---------------------- 物品模块 ----------------------
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
function closeItemEditor() { document.getElementById("itemEditCard").style.display = "none"; }

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
    items.push(d); log("物品", `新增：${d.name} | ID:${d.id}`);
  } else {
    items[currentEditItemIndex] = d; log("物品", `修改：${d.name} | ID:${d.id}`);
  }
  ProjectManager.saveLocal();
  closeItemEditor();
  renderItemList();
}

function filterItemList(keyword) { renderItemList(keyword); }
function renderItemList(filter = "") {
  const wrap = document.getElementById("itemListWrap");
  const arr = ProjectManager.currentProject?.items || [];
  let list = arr;
  const kw = filter.toLowerCase().trim();
  if (kw) list = arr.filter(x => x.id.toLowerCase().includes(kw) || x.name.toLowerCase().includes(kw));
  if (list.length === 0) { wrap.innerHTML = "<p class='empty-state'>暂无匹配物品</p>"; return; }

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

// ---------------------- NPC模块 ----------------------
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
function closeNpcEditor() { document.getElementById("npcEditCard").style.display = "none"; }
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
    log("错误", `NPC ID【${d.id}】已存在`); alert(`NPC ID【${d.id}】已存在！`); return;
  }
  if (currentEditNpcIndex === -1) { arr.push(d); log("NPC", `新增：${d.name} | ID:${d.id}`); }
  else { arr[currentEditNpcIndex] = d; log("NPC", `修改：${d.name} | ID:${d.id}`); }
  ProjectManager.saveLocal(); closeNpcEditor(); renderNpcList();
}
function filterNpcList(kw) { renderNpcList(kw); }
function renderNpcList(filter = "") {
  const wrap = document.getElementById("npcListWrap");
  const arr = ProjectManager.currentProject?.npcs || [];
  let list = arr;
  const k = filter.toLowerCase().trim();
  if (k) list = arr.filter(x => x.id.toLowerCase().includes(k) || x.name.toLowerCase().includes(k));
  if (list.length === 0) { wrap.innerHTML = "<p class='empty-state'>暂无匹配NPC</p>"; return; }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>地图ID</th><th>操作</th></tr></thead><tbody>`;
  list.forEach((it, idx) => {
    h += `<tr class="${selectedRowIndex === idx ? 'row-active' : ''}" onclick="setSelectedRow(document.getElementById('npcListWrap'),${idx})" style="border-bottom:1px solid var(--border);cursor:pointer;">
<td>${it.id}</td><td>${it.name}</td><td>${it.type}</td><td>${it.mapId || ""}</td>
<td>
<button class="btn" onclick="event.stopPropagation();editNpc(${arr.indexOf(it)})">编辑</button>
<button class="btn btn-danger" onclick="event.stopPropagation();deleteNpc(${arr.indexOf(it)})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>"; wrap.innerHTML = h;
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
  ProjectManager.currentProject.npcs.splice(idx, 1); ProjectManager.saveLocal(); renderNpcList();
  log("NPC", `删除：${it.name} | ID:${it.id}`);
}
function duplicateNpc() {
  if (currentEditNpcIndex === -1) { alert("请先编辑选中NPC"); return; }
  const src = ProjectManager.currentProject.npcs[currentEditNpcIndex];
  const cp = cloneObj(src); cp.id += "_copy"; cp.name += "(副本)";
  ProjectManager.currentProject.npcs.push(cp); ProjectManager.saveLocal();
  log("NPC", `复制副本 ID:${cp.id}`); renderNpcList();
}

// ---------------------- 怪物模块 ----------------------
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
function closeMonsterEditor() { document.getElementById("monsterEditCard").style.display = "none"; }
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
    log("错误", `怪物ID【${d.id}】已存在`); alert(`怪物ID【${d.id}】已存在！`); return;
  }
  if (currentEditMonsterIndex === -1) { arr.push(d); log("怪物", `新增：${d.name} | ID:${d.id}`); }
  else { arr[currentEditMonsterIndex] = d; log("怪物", `修改：${d.name} | ID:${d.id}`); }
  ProjectManager.saveLocal(); closeMonsterEditor(); renderMonsterList();
}
function filterMonsterList(kw) { renderMonsterList(kw); }
function renderMonsterList(filter = "") {
  const wrap = document.getElementById("monsterListWrap");
  const arr = ProjectManager.currentProject?.monsters || [];
  let list = arr;
  const k = filter.toLowerCase().trim();
  if (k) list = arr.filter(x => x.id.toLowerCase().includes(k) || x.name.toLowerCase().includes(k));
  if (list.length === 0) { wrap.innerHTML = "<p class='empty-state'>暂无匹配怪物</p>"; return; }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>HP</th><th>ATK</th><th>DEF</th><th>金币</th><th>EXP</th><th>操作</th></tr></thead><tbody>`;
  list.forEach((it, idx) => {
    h += `<tr class="${selectedRowIndex === idx ? 'row-active' : ''}" onclick="setSelectedRow(document.getElementById('monsterListWrap'),${idx})" style="border-bottom:1px solid var(--border);cursor:pointer;">
<td>${it.id}</td><td>${it.name}</td><td>${it.hp}</td><td>${it.atk}</td><td>${it.def??0}</td><td>${it.gold}</td><td>${it.exp??20}</td>
<td>
<button class="btn" onclick="event.stopPropagation();editMonster(${arr.indexOf(it)})">编辑</button>
<button class="btn btn-danger" onclick="event.stopPropagation();deleteMonster(${arr.indexOf(it)})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>"; wrap.innerHTML = h;
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
  ProjectManager.currentProject.monsters.splice(idx, 1); ProjectManager.saveLocal(); renderMonsterList();
  log("怪物", `删除：${it.name} | ID:${it.id}`);
}
function duplicateMonster() {
  if (currentEditMonsterIndex === -1) { alert("请先编辑选中怪物"); return; }
  const src = ProjectManager.currentProject.monsters[currentEditMonsterIndex];
  const cp = cloneObj(src); cp.id += "_copy"; cp.name += "(副本)";
  ProjectManager.currentProject.monsters.push(cp); ProjectManager.saveLocal();
  log("怪物", `复制副本 ID:${cp.id}`); renderMonsterList();
}

// ---------------------- 技能模块 ----------------------
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
function closeSkillEditor() { document.getElementById("skillEditCard").style.display = "none"; }
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
    log("错误", `技能ID【${d.id}】已存在`); alert(`技能ID【${d.id}】已存在！`); return;
  }
  if (currentEditSkillIndex === -1) { arr.push(d); log("技能", `新增：${d.name} | ID:${d.id}`); }
  else { arr[currentEditSkillIndex] = d; log("技能", `修改：${d.name} | ID:${d.id}`); }
  ProjectManager.saveLocal(); closeSkillEditor(); renderSkillList();
}
function filterSkillList(kw) { renderSkillList(kw); }
function renderSkillList(filter = "") {
  const wrap = document.getElementById("skillListWrap");
  const arr = ProjectManager.currentProject?.skills || [];
  let list = arr;
  const k = filter.toLowerCase().trim();
  if (k) list = arr.filter(x => x.id.toLowerCase().includes(k) || x.name.toLowerCase().includes(k));
  if (list.length === 0) { wrap.innerHTML = "<p class='empty-state'>暂无匹配技能</p>"; return; }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>类型</th><th>威力</th><th>耗蓝</th><th>CD</th><th>操作</th></tr></thead><tbody>`;
  list.forEach((it, idx) => {
    h += `<tr class="${selectedRowIndex === idx ? 'row-active' : ''}" onclick="setSelectedRow(document.getElementById('skillListWrap'),${idx})" style="border-bottom:1px solid var(--border);cursor:pointer;">
<td>${it.id}</td><td>${it.name}</td><td>${it.type}</td><td>${it.power}</td><td>${it.mpCost}</td><td>${it.cd??0}</td>
<td>
<button class="btn" onclick="event.stopPropagation();editSkill(${arr.indexOf(it)})">编辑</button>
<button class="btn btn-danger" onclick="event.stopPropagation();deleteSkill(${arr.indexOf(it)})">删除</button>
</td></tr>`;
  });
  h += "</tbody></table>"; wrap.innerHTML = h;
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
  ProjectManager.currentProject.skills.splice(idx, 1); ProjectManager.saveLocal(); renderSkillList();
  log("技能", `删除：${it.name} | ID:${it.id}`);
}
function duplicateSkill() {
  if (currentEditSkillIndex === -1) { alert("请先编辑选中技能"); return; }
  const src = ProjectManager.currentProject.skills[currentEditSkillIndex];
  const cp = cloneObj(src); cp.id += "_copy"; cp.name += "(副本)";
  ProjectManager.currentProject.skills.push(cp); ProjectManager.saveLocal();
  log("技能", `复制副本 ID:${cp.id}`); renderSkillList();
}

// ---------------------- 地图模块 ----------------------
function openMapCreator() {
  currentEditMapIndex = -1;
  document.getElementById("mapId").value = "";
  document.getElementById("mapName").value = "";
  document.getElementById("mapW").value = 20;
  document.getElementById("mapH").value = 15;
  document.getElementById("mapEditCard").style.display = "block";
  initMapCanvas();
}
function closeMapEditor() { document.getElementById("mapEditCard").style.display = "none"; }
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
    mapData[y][x] = tile; drawMap();
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
  mapData = Array.from({ length: h }, () => Array(w).fill(0)); drawMap();
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
    log("错误", `地图ID【${d.id}】已存在`); alert(`地图ID【${d.id}】已存在！`); return;
  }
  if (currentEditMapIndex === -1) { arr.push(d); log("地图", `新建：${d.name} | ID:${d.id}`); }
  else { arr[currentEditMapIndex] = d; log("地图", `修改：${d.name} | ID:${d.id}`); }
  ProjectManager.saveLocal(); closeMapEditor(); renderMapList();
}
function renderMapList() {
  const wrap = document.getElementById("mapListWrap");
  const arr = ProjectManager.currentProject?.maps || [];
  if (arr.length === 0) { wrap.innerHTML = "<p class='empty-state'>暂无地图</p>"; return; }
  let h = `<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:var(--bg-3);"><th>ID</th><th>名称</th><th>尺寸</th><th>操作</th></tr></thead><tbody>`;
  arr.forEach((m, idx) => {
    h += `<tr style="border-bottom:1px solid var(--border);">
<td>${m.id}</td><td>${m.name}</td><td>${m.width}×${m.height}</td>
<td><button class="btn" onclick="editMap(${idx})">编辑</button><button class="btn btn-danger" onclick="deleteMap(${idx})">删除</button></td></tr>`;
  });
  h += "</tbody></table>"; wrap.innerHTML = h;
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
  mapData = m.tiles; drawMap();
}
function deleteMap(idx) {
  const m = ProjectManager.currentProject.maps[idx];
  if (!confirm(`删除地图【${m.name}】?`)) return;
  ProjectManager.currentProject.maps.splice(idx, 1); ProjectManager.saveLocal(); renderMapList();
  log("地图", `删除：${m.name} | ID:${m.id}`);
}

// ---------------------- 动画模块 ----------------------
function openAnimCreator() {
  currentEditAnimIndex = -1;
  document.getElementById("animId").value = "";
  document.getElementById("animName").value = "";
  document.getElementById("animFrameDelay").value = 150;
  animFrames = []; refreshAnimFramePreview();
  document.getElementById("animEditCard").style.display = "block";
  animPreviewCanvas = document.getElementById("animPreviewCanvas");
  animPreviewCtx = animPreviewCanvas.getContext("2d");
  stopAnimPreview();
}
function closeAnimEditor() { stopAnimPreview(); document.getElementById("animEditCard").style.display = "none"; }
function addAnimFrames(input) {
  const files = Array.from(input.files);
  files.forEach(f => {
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image(); img.src = ev.target.result;
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
<img src="${fr.src}" style="width:100%;height:100%;object‑fit:contain;">
<button style="width:100%;font‑size:10px;" onclick="removeAnimFrame(${i})">删除</button>
</div>`;
  });
  wrap.innerHTML = h;
}
function removeAnimFrame(idx) { animFrames.splice(idx, 1); refreshAnimFramePreview(); }
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
  if (animPreviewTimer) clearInterval(animPreviewTimer); animPreviewTimer = null;
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
    log("错误", `动画ID【${d.id}】已存在`); alert(`动画ID【${d.id}】已存在！`); return;
  }
  if (currentEditAnimIndex === -1) { arr.push(d); log("动画", `新建：${d.name} | ID:${d.id}`); }
  else { arr[currentEditAnimIndex] = d; log("动画", `修改：${d.name} | ID:${d.id}`); }
  ProjectManager.saveLocal(); closeAnimEditor(); renderAnimList();
}
function renderAnimList() {
  const wrap = document.getElementById("animListWrap");
  const arr = ProjectManager.currentProject?.animations || [];
  if (arr.length === 0) { wrap.innerHTML = "<p class='empty‑state'>暂无动画</p>"; return; }
  let h = `<table style="width:100%;border‑collapse:collapse;">
<thead><tr style="background:var(--bg‑3);"><th>ID</th><th>名称</th><th>帧数</th><th>操作</th></tr></thead><tbody>`;
  arr.forEach((a, idx) => {
    h += `<tr style="border‑bottom:1px solid var(--border);">
<td>${a.id}</td><td>${a.name}</td><td>${a.frames.length}</td>
<td><button class="btn" onclick="editAnim(${idx})">编辑</button><button class="btn btn‑danger" onclick="deleteAnim(${idx})">删除</button></td></tr>`;
  });
  h += "</tbody></table>"; wrap.innerHTML = h;
}
function editAnim(idx) {
  const a = ProjectManager.currentProject.animations[idx];
  currentEditAnimIndex = idx;
  document.getElementById("animId").value = a.id;
  document.getElementById("animName").value = a.name;
  document.getElementById("animFrameDelay").value = a.frameDelay;
  animFrames = [];
  a.frames.forEach(f => {
    const img = new Image(); img.src = f.src;
    animFrames.push({ src: f.src, img: img });
  });
  refreshAnimFramePreview();
  document.getElementById("animEditCard").style.display = "block";
  animPreviewCanvas = document.getElementById("animPreviewCanvas");
  animPreviewCtx = animPreviewCanvas.getContext("2d");
  stopAnimPreview();
}
function deleteAnim(idx) {
  const a = ProjectManager.currentProject.animations[idx];
  if (!confirm(`删除动画【${a.name}】?`)) return;
  ProjectManager.currentProject.animations.splice(idx, 1); ProjectManager.saveLocal(); renderAnimList();
  log("动画", `删除：${a.name} | ID:${a.id}`);
}

// ---------------------- 导出模块 ----------------------
function downloadJson() { exportProjectJson(); }
function importJsonFile(input) {
  const f = input.files[0];
  const r = new FileReader();
  r.onload = ev => {
    const ok = ProjectManager.importJson(ev.target.result);
    if (ok) {
      document.getElementById("projectNameDisplay").innerText = ProjectManager.currentProject.name;
      log("导出", "导入JSON成功");
    } else {
      log("错误", "JSON解析失败");
    }
  };
  r.readAsText(f);
}
function refreshJsonPreview() {
  const txt = ProjectManager.exportJson();
  document.getElementById("jsonPreview").value = txt ?? "";
}
function generateGameZip() {
  alert("ZIP打包逻辑待实现");
  log("导出", "打包ZIP功能后续实现");
}
