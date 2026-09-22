// ==================== 全局数据结构 ====================
let GameData = {
  project: {
    name: "",
    type: "idle",
    desc: "",
    createTime: ""
  },
  config: {
    gameTitle: "",
    bgColor: "#111111",
    maxLevel: 99,
    startGold: 100,
    startHp: 100
  },
  item: [],
  npc: [],
  monster: [],
  skill: [],
  maps: [],
  anims: []
};

// 当前状态
let state = {
  currentStep: 1,
  currentMenu: "",
  selectedId: null,
  mapTool: "wall",
  animTimer: null
};

// ==================== 日志工具 ====================
function log(msg) {
  const box = document.getElementById("logArea");
  const time = new Date().toLocaleTimeString();
  box.textContent += `\n[${time}] ${msg}`;
  box.scrollTop = box.scrollHeight;
}

// ==================== 本地存储 ====================
function saveLocal() {
  try {
    localStorage.setItem("game_editor_data", JSON.stringify(GameData));
  } catch (e) {
    console.warn("保存失败:", e);
  }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem("game_editor_data");
    if (raw) {
      GameData = JSON.parse(raw);
      document.getElementById("curProjectName").textContent = GameData.project.name || "未创建";
      log("✅ 读取本地项目成功");
    }
  } catch (e) {
    console.warn("读取失败:", e);
  }
}

// ==================== 通用工具 ====================
function genId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function getTypeName(type) {
  const map = {
    config: "游戏配置",
    item: "物品道具",
    npc: "交互NPC",
    monster: "游戏怪物",
    skill: "游戏技能",
    map: "地图场景",
    anim: "动画资源"
  };
  return map[type] || type;
}

function findById(type, id) {
  return GameData[type].find(x => x.id === id);
}

function updateField(type, key, val) {
  const item = findById(type, state.selectedId);
  if (!item) return;
  item[key] = val;
  saveLocal();
}

// ==================== 图片上传转base64 ====================
function uploadImage(callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => callback(ev.target.result);
    reader.readAsDataURL(file);
  };
  input.click();
}

function uploadMultiImages(callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.onchange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => callback(ev.target.result, idx);
      reader.readAsDataURL(file);
    });
  };
  input.click();
}

// ==================== 动画预览公共逻辑 ====================
function renderAnimPreview(item) {
  const box = document.getElementById("animFrameList");
  if (!box) return;
  if (!item.frames || item.frames.length === 0) {
    box.innerHTML = '<span style="color:var(--text-gray)">暂无动画帧，请上传图片</span>';
    return;
  }
  box.innerHTML = item.frames.map((src, i) =>
    `<img class="anim-frame" src="${src}" onclick="removeFrame(${i})" title="点击删除">`
  ).join("");
}

function removeFrame(idx) {
  const type = state.currentMenu;
  const item = findById(type, state.selectedId);
  if (!item || !item.frames) return;
  item.frames.splice(idx, 1);
  saveLocal();
  renderAnimPreview(item);
  log(`🗑️ 删除第 ${idx + 1} 帧`);
}

function playAnim() {
  stopAnim();
  const type = state.currentMenu;
  const item = findById(type, state.selectedId);
  if (!item || !item.frames || item.frames.length === 0) {
    alert("请先上传动画帧！");
    return;
  }
  const delay = item.frameDelay || 150;
  const box = document.getElementById("animFrameList");
  let i = 0;
  state.animTimer = setInterval(() => {
    i = (i + 1) % item.frames.length;
    box.innerHTML = `<img class="anim-frame" src="${item.frames[i]}">`;
  }, delay);
}

function stopAnim() {
  if (state.animTimer) {
    clearInterval(state.animTimer);
    state.animTimer = null;
  }
  const type = state.currentMenu;
  const item = findById(type, state.selectedId);
  if (item) renderAnimPreview(item);
}
