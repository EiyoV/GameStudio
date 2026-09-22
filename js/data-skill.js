// ==================== 步骤3：技能模块 ====================

function createNewSkill() {
  return {
    id: genId("skill"),
    name: "新技能",
    desc: "暂无描述",
    icon: "",
    damage: 20,
    healAmount: 0,
    cooldown: 3000,
    mpCost: 10,
    targetType: "enemy",
    frames: [],
    frameDelay: 150
  };
}

function renderSkillList() {
  const list = GameData.skill;
  if (list.length === 0) {
    return `<div class="empty-tip">暂无技能，点击左侧【新建技能】创建</div>`;
  }
  return list.map(s => `
    <div class="list-item ${state.selectedId === s.id ? 'selected' : ''}" onclick="selectDataItem('skill','${s.id}')">
      <div style="display:flex;align-items:center;gap:10px;">
        ${s.icon ? `<img src="${s.icon}" style="width:36px;height:36px;object-fit:contain;">` : `<div style="width:36px;height:36px;background:#333;border-radius:4px;display:grid;place-items:center;">✨</div>`}
        <div>
          <div><b>${s.name}</b></div>
          <div style="font-size:12px;color:var(--text-gray);">伤害:${s.damage} · 冷却:${s.cooldown}ms · ${s.id}</div>
        </div>
      </div>
      <button class="tool-btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();deleteDataItem('skill','${s.id}')">删除</button>
    </div>
  `).join("");
}

function renderSkillEditor() {
  const s = findById("skill", state.selectedId);
  if (!s) {
    return `<div class="empty-tip">从左侧列表选择一个技能进行编辑，或新建技能</div>`;
  }
  return `
    <div class="edit-card">
      <div class="card-title">编辑技能：${s.name}</div>
      <div class="form-grid">
        <div class="form-item">
          <label>技能ID</label>
          <input value="${s.id}" disabled>
        </div>
        <div class="form-item">
          <label>技能名称</label>
          <input value="${s.name}" onchange="updateField('skill','name',this.value)">
        </div>
        <div class="form-item full-col">
          <label>技能描述</label>
          <textarea rows="2" onchange="updateField('skill','desc',this.value)">${s.desc}</textarea>
        </div>
        <div class="form-item">
          <label>技能图标</label>
          <div style="display:flex;gap:8px;align-items:center;">
            ${s.icon ? `<img src="${s.icon}" style="width:48px;height:48px;object-fit:contain;">` : ""}
            <button class="tool-btn btn-default" onclick="uploadIconForSkill()">上传图标</button>
          </div>
        </div>
        <div class="form-item">
          <label>作用目标</label>
          <select onchange="updateField('skill','targetType',this.value)">
            <option value="enemy" ${s.targetType === 'enemy' ? 'selected' : ''}>敌方单体</option>
            <option value="all_enemy" ${s.targetType === 'all_enemy' ? 'selected' : ''}>敌方全体</option>
            <option value="self" ${s.targetType === 'self' ? 'selected' : ''}>自身</option>
            <option value="ally" ${s.targetType === 'ally' ? 'selected' : ''}>友方单体</option>
          </select>
        </div>
        <div class="form-item">
          <label>技能伤害</label>
          <input type="number" value="${s.damage}" onchange="updateField('skill','damage',Number(this.value))">
        </div>
        <div class="form-item">
          <label>治疗量</label>
          <input type="number" value="${s.healAmount}" onchange="updateField('skill','healAmount',Number(this.value))">
        </div>
        <div class="form-item">
          <label>冷却时间 (ms)</label>
          <input type="number" value="${s.cooldown}" onchange="updateField('skill','cooldown',Number(this.value))">
        </div>
        <div class="form-item">
          <label>魔法消耗</label>
          <input type="number" value="${s.mpCost}" onchange="updateField('skill','mpCost',Number(this.value))">
        </div>
      </div>
    </div>

    <div class="edit-card">
      <div class="card-title">技能特效动画</div>
      <div class="form-grid">
        <div class="form-item">
          <label>帧间隔 (ms)</label>
          <input type="number" value="${s.frameDelay}" onchange="updateField('skill','frameDelay',Number(this.value))">
        </div>
        <div class="form-item">
          <label>上传特效帧（多张）</label>
          <button class="tool-btn btn-default" onclick="uploadFramesForSkill()">选择图片</button>
        </div>
      </div>
      <div class="anim-preview-wrap">
        <div style="font-size:13px;color:var(--text-gray);margin-bottom:8px;">特效帧预览（点击图片删除该帧）</div>
        <div class="anim-frame-list" id="animFrameList"></div>
        <div class="btn-group">
          <button class="tool-btn btn-primary" onclick="playAnim()">▶ 播放</button>
          <button class="tool-btn btn-default" onclick="stopAnim()">⏹ 停止</button>
        </div>
      </div>
    </div>
  `;
}

function uploadIconForSkill() {
  uploadImage((base64) => {
    updateField("skill", "icon", base64);
    renderDataEditArea();
    log("✨ 技能图标已更新");
  });
}

function uploadFramesForSkill() {
  uploadMultiImages((base64) => {
    const s = findById("skill", state.selectedId);
    if (!s.frames) s.frames = [];
    s.frames.push(base64);
    saveLocal();
    renderAnimPreview(s);
    log(`🎞️ 添加技能特效帧，当前共 ${s.frames.length} 帧`);
  });
}
