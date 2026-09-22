// ==================== 主入口：步骤切换 & 布局渲染 ====================

// 每一步的配置：左侧菜单 + 主区域渲染函数
const stepConfig = {
  1: {
    title: "项目工程",
    menus: [
      { id: "project-overview", name: "项目概览", icon: "📁" }
    ],
    renderMain: () => renderProjectOverview()
  },
  2: {
    title: "游戏配置",
    menus: [
      { id: "game-config", name: "基础配置", icon: "⚙️" }
    ],
    renderMain: () => renderConfigPage()
  },
  3: {
    title: "游戏数据",
    menus: [
      { id: "item", name: "🎒 物品道具", type: "item" },
      { id: "npc", name: "👤 交互NPC", type: "npc" },
      { id: "monster", name: "👾 游戏怪物", type: "monster" },
      { id: "skill", name: "✨ 游戏技能", type: "skill" }
    ],
    renderMain: () => renderDataEditArea()
  },
  4: {
    title: "地图场景",
    menus: [
      { id: "map-list", name: "🗺️ 地图列表", type: "maps" }
    ],
    renderMain: () => renderMapEditArea()
  },
  5: {
    title: "动画资源",
    menus: [
      { id: "anim-list", name: "🎞️ 动画列表", type: "anims" }
    ],
    renderMain: () => renderAnimEditArea()
  },
  6: {
    title: "导出发布",
    menus: [
      { id: "export", name: "📦 打包导出" }
    ],
    renderMain: () => renderExportPage()
  }
};

// 切换步骤
function switchStep(stepNum) {
  state.currentStep = stepNum;
  state.selectedId = null;

  // 更新顶部导航
  document.querySelectorAll(".step-item").forEach(el => {
    el.classList.toggle("active", Number(el.dataset.step) === stepNum);
  });

  renderStepUI();
  log(`📍 切换到第 ${stepNum} 步：${stepConfig[stepNum].title}`);
}

// 渲染整个步骤界面
function renderStepUI() {
  renderSidebar();
  renderMainArea();
}

// 渲染左侧边栏
function renderSidebar() {
  const cfg = stepConfig[state.currentStep];
  const sidebar = document.getElementById("leftSidebar");

  let html = `<div class="sidebar-title">${cfg.title}</div>`;

  // 步骤3/4/5 显示搜索框
  if ([3, 4, 5].includes(state.currentStep)) {
    html += `<div class="search-box"><input type="text" placeholder="搜索ID/名称..." oninput="filterList(this.value)"></div>`;
  }

  html += `<div class="menu-list">`;
  cfg.menus.forEach((menu, idx) => {
    const active = (idx === 0 && !state.currentMenu) || state.currentMenu === menu.id;
    html += `
      <div class="menu-item ${active ? 'active' : ''}" data-menu="${menu.id}" onclick="selectMenu('${menu.id}', '${menu.type || ''}')">
        <span>${menu.icon || '•'}</span>
        <span>${menu.name}</span>
      </div>
    `;
  });
  html += `</div>`;

  // 底部新建按钮（数据类模块）
  if ([3, 4, 5].includes(state.currentStep)) {
    html += `
      <div class="sidebar-footer">
        <button class="tool-btn btn-primary" style="width:100%" onclick="addNewItem()">➕ 新建条目</button>
      </div>
    `;
  }

  sidebar.innerHTML = html;
}

// 选择左侧菜单
function selectMenu(menuId, type) {
  state.currentMenu = menuId;
  state.selectedId = null;

  // 更新菜单高亮
  document.querySelectorAll(".menu-item").forEach(el => {
    el.classList.toggle("active", el.dataset.menu === menuId);
  });

  renderMainArea();
}

// 渲染主区域
function renderMainArea() {
  const cfg = stepConfig[state.currentStep];
  document.getElementById("editorMain").innerHTML = cfg.renderMain();

  // 如果是地图编辑器，渲染画布
  if (state.currentStep === 4 && state.selectedId) {
    setTimeout(renderMapCanvas, 10);
  }
  // 如果是怪物/技能动画，渲染帧列表
  if ((state.currentStep === 3) && ["monster", "skill"].includes(state.currentMenu)) {
    const item = findById(state.currentMenu, state.selectedId);
    if (item) setTimeout(() => renderAnimPreview(item), 10);
  }
  // 如果是动画资源步骤
  if (state.currentStep === 5 && state.selectedId) {
    const item = findById("anims", state.selectedId);
    if (item) setTimeout(() => renderAnimPreview(item), 10);
  }
}

// ==================== 步骤3：数据编辑区域 ====================
function renderDataEditArea() {
  const type = state.currentMenu;
  if (!type) return "<div class='empty-tip'>请从左侧选择一个数据类型</div>";

  let listHtml = "";
  let editorHtml = "";

  if (type === "item") {
    listHtml = renderItemList();
    editorHtml = renderItemEditor();
  } else if (type === "npc") {
    listHtml = renderNpcList();
    editorHtml = renderNpcEditor();
  } else if (type === "monster") {
    listHtml = renderMonsterList();
    editorHtml = renderMonsterEditor();
  } else if (type === "skill") {
    listHtml = renderSkillList();
    editorHtml = renderSkillEditor();
  }

  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:16px;height:100%;">
      <div class="edit-card" style="overflow-y:auto;max-height:calc(100vh - 220px);">
        <div class="card-title">${getTypeName(type)}列表</div>
        ${listHtml}
      </div>
      <div style="overflow-y:auto;max-height:calc(100vh - 220px);">
        ${editorHtml}
      </div>
    </div>
  `;
}

// ==================== 步骤4：地图编辑区域 ====================
function renderMapEditArea() {
  const type = "maps";
  const listHtml = renderMapList();
  const editorHtml = renderMapEditor();

  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:16px;height:100%;">
      <div class="edit-card" style="overflow-y:auto;max-height:calc(100vh - 220px);">
        <div class="card-title">地图列表</div>
        ${listHtml}
      </div>
      <div style="overflow-y:auto;max-height:calc(100vh - 220px);">
        ${editorHtml}
      </div>
    </div>
  `;
}

// ==================== 步骤5：动画编辑区域 ====================
function renderAnimEditArea() {
  const listHtml = renderAnimList();
  const editorHtml = renderAnimEditor();

  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:16px;height:100%;">
      <div class="edit-card" style="overflow-y:auto;max-height:calc(100vh - 220px);">
        <div class="card-title">动画资源列表</div>
        ${listHtml}
      </div>
      <div style="overflow-y:auto;max-height:calc(100vh - 220px);">
        ${editorHtml}
      </div>
    </div>
  `;
}

// ==================== 通用：新建/删除/选择条目 ====================
function addNewItem() {
  const typeMap = {
    "item": "item",
    "npc": "npc",
    "monster": "monster",
    "skill": "skill",
    "map-list": "maps",
    "anim-list": "anims"
  };
  const type = typeMap[state.currentMenu];
  if (!type) return;

  let newItem;
  if (type === "item") newItem = createNewItem();
  else if (type === "npc") newItem = createNewNpc();
  else if (type === "monster") newItem = createNewMonster();
  else if (type === "skill") newItem = createNewSkill();
  else if (type === "maps") newItem = createNewMap();
  else if (type === "anims") newItem = createNewAnim();

  GameData[type].push(newItem);
  state.selectedId = newItem.id;
  saveLocal();
  renderMainArea();
  log(`✅ 新建${getTypeName(type)}：${newItem.name}`);
}

function selectDataItem(type, id) {
  state.selectedId = id;
  renderMainArea();
}

function deleteDataItem(type, id) {
  if (!confirm("确定删除这个条目吗？")) return;
  GameData[type] = GameData[type].filter(x => x.id !== id);
  state.selectedId = null;
  saveLocal();
  renderMainArea();
  log(`🗑️ 删除${getTypeName(type)}成功`);
}

function filterList(keyword) {
  // 简单实现：过滤左侧列表
  console.log("搜索:", keyword);
}

// ==================== 初始化 ====================
window.onload = () => {
  loadLocalData();
  bindStepNav();
  renderStepUI();
  log("🎮 游戏编辑器初始化完成");
};

function loadLocalData() {
  try {
    const raw = localStorage.getItem("game_editor_data");
    if (raw) {
      GameData = JSON.parse(raw);
      document.getElementById("curProjectName").textContent = GameData.project.name || "未创建";
      log("✅ 读取本地项目数据成功");
    }
  } catch (e) {
    console.warn(e);
  }
}

function bindStepNav() {
  document.querySelectorAll(".step-item").forEach(el => {
    el.addEventListener("click", () => {
      switchStep(Number(el.dataset.step));
    });
  });
}
