// ==================== 项目管理 ====================

function newProject() {
  document.getElementById("newProjectModal").style.display = "grid";
}

function closeModal() {
  document.getElementById("newProjectModal").style.display = "none";
}

function confirmNewProject() {
  const name = document.getElementById("projName").value.trim();
  const type = document.getElementById("projType").value;
  const desc = document.getElementById("projDesc").value.trim();

  if (!name) {
    alert("请输入项目名称！");
    return;
  }

  GameData = {
    project: {
      name: name,
      type: type,
      desc: desc,
      createTime: new Date().toLocaleString()
    },
    config: {
      gameTitle: name,
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

  state.selectedId = null;
  document.getElementById("curProjectName").textContent = name;
  closeModal();
  saveLocal();
  renderStepUI();
  log(`🎉 创建项目成功：${name}`);
  alert("项目创建成功！请开始配置游戏。");
}

function saveProject() {
  saveLocal();
  log("✅ 项目已保存到浏览器本地");
  alert("项目已保存！");
}

function importProject() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        GameData = JSON.parse(ev.target.result);
        state.selectedId = null;
        document.getElementById("curProjectName").textContent = GameData.project.name;
        saveLocal();
        renderStepUI();
        log("✅ 导入项目成功");
        alert("项目导入成功！");
      } catch (err) {
        alert("JSON 解析失败，请检查文件格式！");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportProjectJson() {
  if (!GameData.project.name) {
    alert("请先创建项目！");
    return;
  }
  const blob = new Blob([JSON.stringify(GameData, null, 2)], { type: "application/json" });
  saveAs(blob, GameData.project.name + "_项目配置.json");
  log("📤 导出项目配置成功");
}

// ==================== 步骤1：项目概览页 ====================
function renderProjectOverview() {
  const hasProject = !!GameData.project.name;
  return `
    <div class="edit-card">
      <div class="card-title">项目概览</div>
      ${hasProject ? `
        <div class="form-grid">
          <div class="form-item">
            <label>项目名称</label>
            <input value="${GameData.project.name}" disabled>
          </div>
          <div class="form-item">
            <label>游戏类型</label>
            <input value="${GameData.project.type}" disabled>
          </div>
          <div class="form-item">
            <label>创建时间</label>
            <input value="${GameData.project.createTime}" disabled>
          </div>
          <div class="form-item">
            <label>物品数量</label>
            <input value="${GameData.item.length} 个" disabled>
          </div>
          <div class="form-item">
            <label>NPC数量</label>
            <input value="${GameData.npc.length} 个" disabled>
          </div>
          <div class="form-item">
            <label>怪物数量</label>
            <input value="${GameData.monster.length} 个" disabled>
          </div>
          <div class="form-item">
            <label>技能数量</label>
            <input value="${GameData.skill.length} 个" disabled>
          </div>
          <div class="form-item">
            <label>地图数量</label>
            <input value="${GameData.maps.length} 张" disabled>
          </div>
          <div class="form-item full-col">
            <label>游戏玩法简介</label>
            <textarea rows="4" disabled>${GameData.project.desc}</textarea>
          </div>
        </div>
        <div class="btn-group">
          <button class="tool-btn btn-primary" onclick="switchStep(2)">下一步：游戏基础配置 →</button>
          <button class="tool-btn btn-danger" onclick="confirmResetProject()">重置项目</button>
        </div>
      ` : `
        <div class="empty-tip">
          <p style="font-size:18px;">👋 欢迎使用游戏开发编辑器</p>
          <p>点击上方【新建项目】按钮，创建你的第一个游戏工程</p>
          <p style="color:var(--text-gray);font-size:13px;">所有数据自动保存在浏览器本地，刷新不丢失</p>
        </div>
      `}
    </div>
  `;
}

function confirmResetProject() {
  if (!confirm("确定要清空当前项目数据吗？此操作不可恢复！")) return;
  GameData = {
    project: { name: "", type: "idle", desc: "", createTime: "" },
    config: { gameTitle: "", bgColor: "#111111", maxLevel: 99, startGold: 100, startHp: 100 },
    item: [], npc: [], monster: [], skill: [], maps: [], anims: []
  };
  state.selectedId = null;
  document.getElementById("curProjectName").textContent = "未创建";
  saveLocal();
  renderStepUI();
  log("🔄 项目已重置");
}
