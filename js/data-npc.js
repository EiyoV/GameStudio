// ==================== 步骤3：NPC模块 ====================

function createNewNpc() {
  return {
    id: genId("npc"),
    name: "新NPC",
    desc: "暂无描述",
    avatar: "",
    dialog: "你好，冒险者！",
    posX: 0,
    posY: 0,
    isShop: false,
    isQuestGiver: false,
    interact: true
  };
}

function renderNpcList() {
  const list = GameData.npc;
  if (list.length === 0) {
    return `<div class="empty-tip">暂无NPC，点击左侧【新建NPC】创建</div>`;
  }
  return list.map(npc => `
    <div class="list-item ${state.selectedId === npc.id ? 'selected' : ''}" onclick="selectDataItem('npc','${npc.id}')">
      <div style="display:flex;align-items:center;gap:10px;">
        ${npc.avatar ? `<img src="${npc.avatar}" style="width:36px;height:36px;object-fit:contain;border-radius:50%;">` : `<div style="width:36px;height:36px;background:#333;border-radius:50%;display:grid;place-items:center;">👤</div>`}
        <div>
          <div><b>${npc.name}</b></div>
          <div style="font-size:12px;color:var(--text-gray);">${npc.id} · ${npc.isShop ? '商店' : '普通'}</div>
        </div>
      </div>
      <button class="tool-btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();deleteDataItem('npc','${npc.id}')">删除</button>
    </div>
  `).join("");
}

function renderNpcEditor() {
  const npc = findById("npc", state.selectedId);
  if (!npc) {
    return `<div class="empty-tip">从左侧列表选择一个NPC进行编辑，或新建NPC</div>`;
  }
  return `
    <div class="edit-card">
      <div class="card-title">编辑NPC：${npc.name}</div>
      <div class="form-grid">
        <div class="form-item">
          <label>NPC ID</label>
          <input value="${npc.id}" disabled>
        </div>
        <div class="form-item">
          <label>NPC名称</label>
          <input value="${npc.name}" onchange="updateField('npc','name',this.value)">
        </div>
        <div class="form-item full-col">
          <label>NPC描述</label>
          <textarea rows="2" onchange="updateField('npc','desc',this.value)">${npc.desc}</textarea>
        </div>
        <div class="form-item">
          <label>头像</label>
          <div style="display:flex;gap:8px;align-items:center;">
            ${npc.avatar ? `<img src="${npc.avatar}" style="width:48px;height:48px;object-fit:contain;border-radius:50%;">` : ""}
            <button class="tool-btn btn-default" onclick="uploadAvatarForNpc()">上传头像</button>
          </div>
        </div>
        <div class="form-item">
          <label>场景坐标 X</label>
          <input type="number" value="${npc.posX}" onchange="updateField('npc','posX',Number(this.value))">
        </div>
        <div class="form-item">
          <label>场景坐标 Y</label>
          <input type="number" value="${npc.posY}" onchange="updateField('npc','posY',Number(this.value))">
        </div>
        <div class="form-item">
          <label>是否商店NPC</label>
          <input type="checkbox" ${npc.isShop ? 'checked' : ''} onchange="updateField('npc','isShop',this.checked)">
        </div>
        <div class="form-item">
          <label>是否任务NPC</label>
          <input type="checkbox" ${npc.isQuestGiver ? 'checked' : ''} onchange="updateField('npc','isQuestGiver',this.checked)">
        </div>
        <div class="form-item">
          <label>是否可交互</label>
          <input type="checkbox" ${npc.interact ? 'checked' : ''} onchange="updateField('npc','interact',this.checked)">
        </div>
        <div class="form-item full-col">
          <label>对话文本</label>
          <textarea rows="4" onchange="updateField('npc','dialog',this.value)">${npc.dialog}</textarea>
        </div>
      </div>
    </div>
  `;
}

function uploadAvatarForNpc() {
  uploadImage((base64) => {
    updateField("npc", "avatar", base64);
    renderDataEditArea();
    log("👤 NPC头像已更新");
  });
}
