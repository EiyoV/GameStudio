// ==================== 步骤2：游戏基础配置 ====================

function renderConfigPage() {
  if (!GameData.project.name) {
    return renderNoProjectTip();
  }
  const c = GameData.config;
  return `
    <div class="edit-card">
      <div class="card-title">游戏全局基础配置</div>
      <div class="form-grid">
        <div class="form-item">
          <label>游戏标题</label>
          <input value="${c.gameTitle}" onchange="updateConfig('gameTitle', this.value)">
        </div>
        <div class="form-item">
          <label>游戏背景色</label>
          <input type="color" value="${c.bgColor}" onchange="updateConfig('bgColor', this.value)">
        </div>
        <div class="form-item">
          <label>玩家最大等级</label>
          <input type="number" value="${c.maxLevel}" onchange="updateConfig('maxLevel', Number(this.value))">
        </div>
        <div class="form-item">
          <label>初始金币</label>
          <input type="number" value="${c.startGold}" onchange="updateConfig('startGold', Number(this.value))">
        </div>
        <div class="form-item">
          <label>初始生命值</label>
          <input type="number" value="${c.startHp}" onchange="updateConfig('startHp', Number(this.value))">
        </div>
        <div class="form-item">
          <label>游戏类型</label>
          <input value="${GameData.project.type}" disabled>
        </div>
        <div class="form-item full-col">
          <label>游戏玩法描述</label>
          <textarea rows="4" onchange="GameData.project.desc=this.value; saveLocal()">${GameData.project.desc}</textarea>
        </div>
      </div>
      <div class="btn-group">
        <button class="tool-btn btn-default" onclick="switchStep(1)">← 上一步</button>
        <button class="tool-btn btn-primary" onclick="switchStep(3)">下一步：游戏数据编辑 →</button>
      </div>
    </div>
  `;
}

function updateConfig(key, val) {
  GameData.config[key] = val;
  saveLocal();
  log(`⚙️ 更新配置：${key} = ${val}`);
}

function renderNoProjectTip() {
  return `
    <div class="edit-card">
      <div class="empty-tip">
        <p style="font-size:18px;">⚠️ 请先创建项目</p>
        <p>点击上方【新建项目】按钮开始</p>
        <button class="tool-btn btn-primary" onclick="newProject()">立即新建项目</button>
      </div>
    </div>
  `;
}
