// ==================== 步骤3：怪物模块 ====================

function createNewMonster() {
  return {
    id: genId("monster"),
    name: "新怪物",
    desc: "暂无描述",
    icon: "",
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 1,
    expReward: 20,
    goldReward: 15,
    dropItemId: "",
    dropRate: 0.2,
    frames: [],
    frameDelay: 150
  };
}

function renderMonsterList() {
  const list = GameData.monster;
  if (list.length === 0) {
    return `<div class="empty-tip">暂无怪物，点击左侧【新建怪物】创建</div>`;
  }
  return list.map(m => `
    <div class="list-item ${state.selectedId === m.id ? 'selected' : ''}" onclick="selectDataItem('monster','${m.id}')">
      <div style="display:flex;align-items:center;gap:10px;">
        ${m.icon ? `<img src="${m.icon}" style="width:36px;height:36px;object-fit:contain;">` : `<div style="width:36px;height:36px;background:#333;border-radius:4px;display:grid;place-items:center;">👾</div>`}
        <div>
          <div><b>${m.name}</b></div>
          <div style="font-size:12px;color:var(--text-gray);">HP:${m.hp} · 攻:${m.attack} · ${m.id}</div>
        </div>
      </div>
      <button class="tool-btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();deleteDataItem('monster','${m.id}')">删除</button>
    </div>
  `).join("");
}

function renderMonsterEditor() {
  const m = findById("monster", state.selectedId);
  if (!m) {
    return `<div class="empty-tip">从左侧列表选择一个怪物进行编辑，或新建怪物</div>`;
  }
  return `
    <div class="edit-card">
      <div class="card-title">编辑怪物：${m.name}</div>
      <div class="form-grid">
        <div class="form-item">
          <label>怪物ID</label>
          <input value="${m.id}" disabled>
        </div>
        <div class="form-item">
          <label>怪物名称</label>
          <input value="${m.name}" onchange="updateField('monster','name',this.value)">
        </div>
        <div class="form-item full-col">
          <label>怪物描述</label>
          <textarea rows="2" onchange="updateField('monster','desc',this.value)">${m.desc}</textarea>
        </div>
        <div class="form-item">
          <label>怪物图标</label>
          <div style="display:flex;gap:8px;align-items:center;">
            ${m.icon ? `<img src="${m.icon}" style="width:48px;height:48px;object-fit:contain;">` : ""}
            <button class="tool-btn btn-default" onclick="uploadIconForMonster()">上传图标</button>
          </div>
        </div>
        <div class="form-item">
          <label>生命值</label>
          <input type="number" value="${m.hp}" onchange="updateField('monster','hp',Number(this.value));updateField('monster','maxHp',Number(this.value))">
        </div>
        <div class="form-item">
          <label>攻击力</label>
          <input type="number" value="${m.attack}" onchange="updateField('monster','attack',Number(this.value))">
        </div>
        <div class="form-item">
          <label>防御力</label>
          <input type="number" value="${m.defense}" onchange="updateField('monster','defense',Number(this.value))">
        </div>
        <div class="form-item">
          <label>移动速度</label>
          <input type="number" step="0.1" value="${m.speed}" onchange="updateField('monster','speed',Number(this.value))">
        </div>
        <div class="form-item">
          <label>经验奖励</label>
          <input type="number" value="${m.expReward}" onchange="updateField('monster','expReward',Number(this.value))">
        </div>
        <div class="form-item">
          <label>金币奖励</label>
          <input type="number" value="${m.goldReward}" onchange="updateField('monster','goldReward',Number(this.value))">
        </div>
        <div class="form-item">
          <label>掉落物品ID</label>
          <input value="${m.dropItemId}" onchange="updateField('monster','dropItemId',this.value)">
        </div>
        <div class="form-item">
          <label>掉落概率 (0-1)</label>
          <input type="number" step="0.01" value="${m.dropRate}" onchange="updateField('monster','dropRate',Number(this.value))">
        </div>
      </div>
    </div>

    <div class="edit-card">
      <div class="card-title">怪物动画配置</div>
      <div class="form-grid">
        <div class="form-item">
          <label>帧间隔 (ms)</label>
          <input type="number" value="${m.frameDelay}" onchange="updateField('monster','frameDelay',Number(this.value))">
        </div>
        <div class="form-item">
          <label>上传动画帧（多张）</label>
          <button class="tool-btn btn-default" onclick="uploadFramesForMonster()">选择图片</button>
        </div>
      </div>
      <div class="anim-preview-wrap">
        <div style="font-size:13px;color:var(--text-gray);margin-bottom:8px;">动画帧预览（点击图片删除该帧）</div>
        <div class="anim-frame-list" id="animFrameList"></div>
        <div class="btn-group">
          <button class="tool-btn btn-primary" onclick="playAnim()">▶ 播放</button>
          <button class="tool-btn btn-default" onclick="stopAnim()">⏹ 停止</button>
        </div>
      </div>
    </div>
  `;
}

function uploadIconForMonster() {
  uploadImage((base64) => {
    updateField("monster", "icon", base64);
    renderDataEditArea();
    log("👾 怪物图标已更新");
  });
}

function uploadFramesForMonster() {
  uploadMultiImages((base64) => {
    const m = findById("monster", state.selectedId);
    if (!m.frames) m.frames = [];
    m.frames.push(base64);
    saveLocal();
    renderAnimPreview(m);
    log(`🎞️ 添加动画帧，当前共 ${m.frames.length} 帧`);
  });
}
