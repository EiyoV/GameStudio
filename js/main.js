// ==================== Game Studio 主逻辑 ====================

// 全局状态
let AppState = {
  currentStep: 1,
  currentModule: null,
  project: null,
  selectedId: null,
  mapTool: "wall"
};

// 全局游戏数据
let GameData = {
  project: { name: "", type: "idle", desc: "", createTime: "" },
  config: { gameTitle: "", bgColor: "#111111", maxLevel: 99, startGold: 100, startHp: 100 },
  item: [],
  npc: [],
  monster: [],
  skill: [],
  maps: [],
  anims: []
};

// 每一步的菜单配置
const stepMenuConfig = {
  1: [
    { group: "项目", items: [{ id: "overview", label: "项目概览", icon: "📁" }] }
  ],
  2: [
    { group: "游戏设置", items: [{ id: "game-config", label: "基础配置", icon: "⚙️" }] }
  ],
  3: [
    { group: "游戏数据", items: [
      { id: "item", label: "物品道具", icon: "🎒" },
      { id: "npc", label: "交互NPC", icon: "👤" },
      { id: "monster", label: "游戏怪物", icon: "👾" },
      { id: "skill", label: "游戏技能", icon: "✨" }
    ]}
  ],
  4: [
    { group: "地图", items: [{ id: "map-list", label: "地图列表", icon: "🗺️" }] }
  ],
  5: [
    { group: "动画资源", items: [{ id: "anim-list", label: "动画列表", icon: "🎞️" }] }
  ],
  6: [
    { group: "打包", items: [{ id: "export", label: "打包导出", icon: "📦" }] }
  ]
};

// 模块标题映射
const moduleTitles = {
  "overview": "项目概览",
  "game-config": "游戏基础配置",
  "item": "物品道具管理",
  "npc": "NPC管理",
  "monster": "怪物管理",
  "skill": "技能管理",
  "map-list": "地图编辑器",
  "anim-list": "动画资源",
  "export": "打包导出"
};

// ==================== 初始化 ====================
window.addEventListener("DOMContentLoaded", () => {
  bindStepNav();
  loadLocalData();
  renderSidebar();
  log("系统", "Game Studio 编辑器初始化完成");
});

// ==================== 步骤导航 ====================
function bindStepNav() {
  const steps = document.querySelectorAll(".step-nav .step");
  steps.forEach(el => {
    el.addEventListener("click", () => {
      const step = parseInt(el.dataset.step);
      switchStep(step);
    });
  });
}

function switchStep(stepNum) {
  AppState.currentStep = stepNum;
  AppState.currentModule = null;
  AppState.selectedId = null;

  // 更新步骤激活样式
  document.querySelectorAll(".step-nav .step").forEach(s => s.classList.remove("active"));
  document.querySelector(`.step-nav .step[data-step="${stepNum}"]`).classList.add("active");

  renderSidebar();
  renderEmptyEditor();
  log("导航", `切换到【${getStepName(stepNum)}】`);
}

function getStepName(step) {
  const names = { 1: "新建项目", 2: "基础配置", 3: "数据编辑", 4: "地图编辑", 5: "动画制作", 6: "导出项目" };
  return names[step] || step;
}

// ==================== 左侧边栏渲染 ====================
function renderSidebar() {
  const menu = document.getElementById("sidebarMenu");
  menu.innerHTML = "";

  const groups = stepMenuConfig[AppState.currentStep];
  groups.forEach(g => {
    const groupTitle = document.createElement("div");
    groupTitle.className = "sidebar-group-title";
    groupTitle.textContent = g.group;
    menu.appendChild(groupTitle);

    g.items.forEach(item => {
      const div = document.createElement("div");
      div.className = "sidebar-item";
      div.dataset.moduleId = item.id;
      div.innerHTML = `<span class="icon">${item.icon}</span><span>${item.label}</span>`;
      div.addEventListener("click", () => selectModule(item.id));
      menu.appendChild(div);
    });
  });
}

function selectModule(moduleId) {
  AppState.currentModule = moduleId;
  AppState.selectedId = null;

  // 更新菜单高亮
  document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
  document.querySelector(`.sidebar-item[data-module-id="${moduleId}"]`).classList.add("active");

  renderEditorPanel(moduleId);
  log("导航", `打开模块：${moduleTitles[moduleId] || moduleId}`);
}

// ==================== 中间编辑区渲染 ====================
function renderEmptyEditor() {
  const editor = document.getElementById("editor");
  editor.innerHTML = `
    <div class="editor-header">
      <div class="editor-title">${getStepName(AppState.currentStep)}</div>
      <div></div>
    </div>
    <div class="editor-body">
      <div class="empty-state">
        <div class="big-icon">🎮</div>
        <p>从左侧选择一个模块开始编辑</p>
      </div>
    </div>
  `;
}

function renderEditorPanel(moduleId) {
  const editor = document.getElementById("editor");
  const title = moduleTitles[moduleId] || moduleId;
  let bodyHtml = "";

  switch (moduleId) {
    case "overview":
      bodyHtml = renderOverviewPanel();
      break;
    case "game-config":
      bodyHtml = renderConfigPanel();
      break;
    case "item":
      bodyHtml = renderItemPanel();
      break;
    case "npc":
      bodyHtml = renderNpcPanel();
      break;
    case "monster":
      bodyHtml = renderMonsterPanel();
      break;
    case "skill":
      bodyHtml = renderSkillPanel();
      break;
    case "map-list":
      bodyHtml = renderMapPanel();
      break;
    case "anim-list":
      bodyHtml = renderAnimPanel();
      break;
    case "export":
      bodyHtml = renderExportPanel();
      break;
    default:
      bodyHtml = `<div class="empty-state"><p>模块开发中...</p></div>`;
  }

  editor.innerHTML = `
    <div class="editor-header">
      <div class="editor-title">${title}</div>
      <div class="card-actions" id="editorActions"></div>
    </div>
    <div class="editor-body">${bodyHtml}</div>
  `;
}

// ==================== 各模块面板 ====================

// 1. 项目概览
function renderOverviewPanel() {
  if (!GameData.project.name) {
    return `
      <div class="empty-state">
        <div class="big-icon">📁</div>
        <p>还没有项目，点击上方【新建项目】开始</p>
        <button class="btn btn-primary" onclick="newProject()">立即新建项目</button>
      </div>
    `;
  }
  const p = GameData.project;
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">项目信息</div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label>项目名称</label><input value="${p.name}" disabled></div>
        <div class="form-row"><label>游戏类型</label><input value="${p.type}" disabled></div>
        <div class="form-row"><label>创建时间</label><input value="${p.createTime}" disabled></div>
        <div class="form-row"><label>物品数量</label><input value="${GameData.item.length} 个" disabled></div>
        <div class="form-row"><label>NPC数量</label><input value="${GameData.npc.length} 个" disabled></div>
        <div class="form-row"><label>怪物数量</label><input value="${GameData.monster.length} 个" disabled></div>
        <div class="form-row full"><label>项目描述</label><textarea disabled>${p.desc}</textarea></div>
      </div>
    </div>
  `;
}

// 2. 游戏基础配置
function renderConfigPanel() {
  if (!GameData.project.name) return `<div class="empty-state"><p>请先创建项目</p></div>`;
  const c = GameData.config;
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">基础配置</div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>游戏标题</label>
          <input value="${c.gameTitle}" onchange="updateConfig('gameTitle', this.value)">
        </div>
        <div class="form-row">
          <label>背景色</label>
          <input type="color" value="${c.bgColor}" onchange="updateConfig('bgColor', this.value)">
        </div>
        <div class="form-row">
          <label>最大等级</label>
          <input type="number" value="${c.maxLevel}" onchange="updateConfig('maxLevel', Number(this.value))">
        </div>
        <div class="form-row">
          <label>初始金币</label>
          <input type="number" value="${c.startGold}" onchange="updateConfig('startGold', Number(this.value))">
        </div>
        <div class="form-row">
          <label>初始生命</label>
          <input type="number" value="${c.startHp}" onchange="updateConfig('startHp', Number(this.value))">
        </div>
      </div>
    </div>
  `;
}

// 3. 物品面板
function renderItemPanel() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">物品列表</div>
        <button class="btn btn-primary" onclick="addNewItem()">+ 新建物品</button>
      </div>
      <div class="data-list" id="dataList">
        ${GameData.item.length === 0 ? '<div class="empty-state"><p>暂无物品</p></div>' :
          GameData.item.map(item => `
            <div class="data-item ${AppState.selectedId === item.id ? 'active' : ''}" onclick="selectDataItem('item','${item.id}')">
              <div class="icon-box">📦</div>
              <div class="info">
                <div class="name">${item.name}</div>
                <div class="sub">${item.id} · ${item.type}</div>
              </div>
              <button class="btn btn-danger" onclick="event.stopPropagation();deleteDataItem('item','${item.id}')">删除</button>
            </div>
          `).join("")
        }
      </div>
    </div>
    <div id="itemEditor"></div>
  `;
}

// NPC面板（简化版）
function renderNpcPanel() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">NPC列表</div>
        <button class="btn btn-primary" onclick="addNewNpc()">+ 新建NPC</button>
      </div>
      <div class="empty-state"><p>NPC编辑模块开发中...</p></div>
    </div>
  `;
}

// 怪物面板
function renderMonsterPanel() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">怪物列表</div>
        <button class="btn btn-primary" onclick="addNewMonster()">+ 新建怪物</button>
      </div>
      <div class="empty-state"><p>怪物编辑模块开发中...</p></div>
    </div>
  `;
}

// 技能面板
function renderSkillPanel() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">技能列表</div>
        <button class="btn btn-primary" onclick="addNewSkill()">+ 新建技能</button>
      </div>
      <div class="empty-state"><p>技能编辑模块开发中...</p></div>
    </div>
  `;
}

// 地图面板
function renderMapPanel() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">地图列表</div>
        <button class="btn btn-primary" onclick="addNewMap()">+ 新建地图</button>
      </div>
      <div class="empty-state"><p>地图编辑模块开发中...</p></div>
    </div>
  `;
}

// 动画面板
function renderAnimPanel() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">动画资源列表</div>
        <button class="btn btn-primary" onclick="addNewAnim()">+ 新建动画</button>
      </div>
      <div class="empty-state"><p>动画编辑模块开发中...</p></div>
    </div>
  `;
}

// 导出版
function renderExportPanel() {
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">导出游戏项目</div>
      </div>
      <div class="empty-state">
        <p>点击右上角【打包游戏】按钮下载完整项目</p>
      </div>
    </div>
  `;
}

// ==================== 通用操作 ====================
function updateConfig(key, val) {
  GameData.config[key] = val;
  saveLocal();
  log("配置", `更新 ${key} = ${val}`);
}

function selectDataItem(type, id) {
  AppState.selectedId = id;
  document.querySelectorAll(".data-item").forEach(i => i.classList.remove("active"));
  event.currentTarget.classList.add("active");
  log("选择", `选中 ${type}: ${id}`);
}

function deleteDataItem(type, id) {
  if (!confirm("确定删除？")) return;
  GameData[type] = GameData[type].filter(x => x.id !== id);
  saveLocal();
  selectModule(AppState.currentModule);
  log("删除", `删除 ${type}: ${id}`);
}

function addNewItem() {
  const newItem = {
    id: "item_" + Date.now(),
    name: "新道具",
    desc: "",
    type: "consume",
    price: 10,
    stackMax: 99
  };
  GameData.item.push(newItem);
  saveLocal();
  selectModule("item");
  log("新建", `创建物品：${newItem.name}`);
}

function addNewNpc() { log("新建", "创建NPC"); }
function addNewMonster() { log("新建", "创建怪物"); }
function addNewSkill() { log("新建", "创建技能"); }
function addNewMap() { log("新建", "创建地图"); }
function addNewAnim() { log("新建", "创建动画"); }

// ==================== 项目操作 ====================
function newProject() {
  document.getElementById("newProjectModal").classList.add("show");
}

function closeModal() {
  document.querySelectorAll(".modal").forEach(m => m.classList.remove("show"));
}

function confirmNewProject() {
  const name = document.getElementById("projName").value.trim();
  const type = document.getElementById("projType").value;
  const desc = document.getElementById("projDesc").value.trim();
  if (!name) { alert("请输入项目名称！"); return; }

  GameData = {
    project: { name, type, desc, createTime: new Date().toLocaleString() },
    config: { gameTitle: name, bgColor: "#111111", maxLevel: 99, startGold: 100, startHp: 100 },
    item: [], npc: [], monster: [], skill: [], maps: [], anims: []
  };

  document.getElementById("projectNameDisplay").textContent = name;
  closeModal();
  saveLocal();
  log("项目", `创建成功：${name}`);
  alert("项目创建成功！");
}

function saveProject() {
  saveLocal();
  log("项目", "已保存到本地");
  alert("项目已保存！");
}

function importProject() {
  log("项目", "导入功能开发中");
}

function exportProjectJson() {
  if (!GameData.project.name) { alert("请先创建项目！"); return; }
  const blob = new Blob([JSON.stringify(GameData, null, 2)], { type: "application/json" });
  saveAs(blob, GameData.project.name + "_配置.json");
  log("导出", "配置JSON已导出");
}

function generateGameZip() {
  if (!GameData.project.name) { alert("请先创建项目！"); return; }
  log("导出", "开始打包ZIP...");
  alert("打包功能开发中，后续版本支持一键下载完整游戏项目！");
}

// ==================== 本地存储 ====================
function saveLocal() {
  try {
    localStorage.setItem("game_studio_data", JSON.stringify(GameData));
  } catch (e) {
    console.warn("保存失败:", e);
  }
}

function loadLocalData() {
  try {
    const raw = localStorage.getItem("game_studio_data");
    if (raw) {
      GameData = JSON.parse(raw);
      document.getElementById("projectNameDisplay").textContent = GameData.project.name || "未创建项目";
    }
  } catch (e) {
    console.warn("读取失败:", e);
  }
}

// ==================== 日志 ====================
function log(type, msg) {
  const box = document.getElementById("logBox");
  const time = new Date().toLocaleTimeString();
  box.textContent += `\n[${time}] [${type}] ${msg}`;
  box.scrollTop = box.scrollHeight;
}

function clearLog() {
  document.getElementById("logBox").textContent = "[系统] 日志已清空";
}
