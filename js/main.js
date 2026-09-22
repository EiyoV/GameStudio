// js/main.js
const AppState = {
  currentStep: 1,
  currentModule: null,
  project: null,
  logBox: null,
  previewBox: null,
};

// 初始化
window.addEventListener('DOMContentLoaded', () => {
  AppState.logBox = document.getElementById('logBox');
  AppState.previewBox = document.getElementById('previewBox');
  bindStepNav();
  log("系统", "编辑器UI加载完成，准备就绪");
});

// 绑定顶部步骤导航
function bindStepNav() {
  const steps = document.querySelectorAll('.step-nav .step');
  steps.forEach(el => {
    el.onclick = () => {
      const step = parseInt(el.dataset.step);
      switchStep(step);
    }
  })
}

// 切换步骤
function switchStep(stepNum) {
  AppState.currentStep = stepNum;
  // 更新步骤激活样式
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.step[data-step="${stepNum}"]`).classList.add('active');

  // 清空侧边栏与编辑区
  const sidebarMenu = document.getElementById('sidebarMenu');
  const editorWrap = document.getElementById('editor');
  sidebarMenu.innerHTML = "";
  editorWrap.innerHTML = "";

  // 根据步骤渲染侧边菜单
  renderSidebarByStep(stepNum);
  log("系统", `已切换至【${getStepName(stepNum)}】`);
}

function getStepName(step) {
  const map = {
    1: "新建项目",
    2: "基础配置",
    3: "数据编辑",
    4: "地图编辑",
    5: "动画制作",
    6: "导出项目"
  }
  return map[step];
}

// 按步骤渲染左侧菜单
function renderSidebarByStep(step) {
  const menu = document.getElementById('sidebarMenu');
  const menuData = {
    1: [
      {group:"项目", items: [{id:"overview", label:"项目概览", icon:"📁"}]}
    ],
    2: [
      {group:"游戏设置", items: [{id:"game-config", label:"基础配置", icon:"⚙️"}]}
    ],
    3: [
      {group:"游戏数据", items: [
        {id:"item", label:"物品", icon:"🎒"},
        {id:"npc", label:"NPC", icon:"👤"},
        {id:"monster", label:"怪物", icon:"👾"},
        {id:"skill", label:"技能", icon:"✨"}
      ]}
    ],
    4: [
      {group:"地图", items: [{id:"map-list", label:"地图列表", icon:"🗺️"}]}
    ],
    5: [
      {group:"动画资源", items: [{id:"anim-list", label:"动画列表", icon:"🎞️"}]}
    ],
    6: [
      {group:"打包", items: [{id:"export", label:"打包导出", icon:"📦"}]}
    ]
  }

  const groups = menuData[step];
  groups.forEach(g => {
    const groupTitle = document.createElement('div');
    groupTitle.className = "sidebar-group-title";
    groupTitle.innerText = g.group;
    menu.appendChild(groupTitle);

    g.items.forEach(item => {
      const div = document.createElement('div');
      div.className = "sidebar-item";
      div.dataset.moduleId = item.id;
      div.innerHTML = `<span class="icon">${item.icon}</span><span>${item.label}</span>`;
      div.onclick = ()=>{
        selectModule(item.id);
      }
      menu.appendChild(div);
    })
  })
}

// 选中模块，渲染中间编辑面板
function selectModule(moduleId) {
  AppState.currentModule = moduleId;
  // 菜单激活样式
  document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
  document.querySelector(`.sidebar-item[data-module-id="${moduleId}"]`).classList.add('active');

  renderEditorPanel(moduleId);
  log("导航", `打开模块：${moduleId}`);
}

// 渲染中间编辑区
function renderEditorPanel(moduleId) {
  const editor = document.getElementById('editor');
  editor.innerHTML = `
    <div class="editor-header">
      <div class="editor-title">${getModuleTitle(moduleId)}</div>
      <div></div>
    </div>
    <div class="editor-body" id="editorBody">
      ${getModuleContent(moduleId)}
    </div>
  `;
}

function getModuleTitle(id) {
  const titles = {
    "overview":"项目概览",
    "game-config":"游戏基础配置",
    "item":"物品管理",
    "npc":"NPC管理",
    "monster":"怪物管理",
    "skill":"技能管理",
    "map-list":"地图编辑器",
    "anim-list":"动画资源",
    "export":"打包导出"
  }
  return titles[id] || id;
}

function getModuleContent(id) {
  const emptyHtml = `
    <div class="empty-state">
      <div class="big-icon">📋</div>
      <p>模块功能等待加载，对应js文件会渲染表单与列表</p>
      <button class="btn btn-primary">新建条目</button>
    </div>
  `
  return emptyHtml;
}

// 日志输出
function log(type, msg) {
  const box = AppState.logBox;
  const time = new Date().toLocaleTimeString();
  box.innerText += `[${time}] [${type}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}
function clearLog() {
  document.getElementById('logBox').innerText = "[系统] 日志已清空\n";
}

// 弹窗控制
function openModal(id) {
  document.getElementById(id).classList.add("show");
}
function closeModal() {
  document.querySelectorAll('.modal').forEach(m=>m.classList.remove("show"));
}

// 占位函数，后续在project.js实现
function newProject(){ openModal("newProjectModal"); }
function confirmNewProject(){ log("项目", "新项目创建成功"); closeModal(); }
function saveProject(){ log("项目", "项目已本地保存"); }
function importProject(){ log("项目", "打开导入窗口"); }
function exportProjectJson(){ log("导出", "导出JSON配置"); }
function generateGameZip(){ log("导出", "开始打包ZIP"); }
function openProjectFolder(){ log("文件", "打开项目目录"); }
