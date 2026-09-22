// ==================== 步骤5：动画资源制作 ====================

function createNewAnim() {
  return {
    id: genId("anim"),
    name: "新动画",
    desc: "",
    frames: [],
    frameDelay: 150,
    loop: true
  };
}

function renderAnimList() {
  const list = GameData.anims;
  if (list.length === 0) {
    return `<div class="empty-tip">暂无动画资源，点击左侧【新建动画】创建</div>`;
  }
  return list.map(a => `
    <div class="list-item ${state.selectedId === a.id ? 'selected' : ''}" onclick="selectDataItem('anims','${a.id}')">
      <div>
        <div><b>${a.name}</b></div>
        <div style="font-size:12px;color:var(--text-gray);">${a.frames.length} 帧 · ${a.frameDelay}ms/帧 · ${a.id}</div>
      </div>
      <button class="tool-btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();deleteDataItem('anims','${a.id}')">删除</button>
    </div>
  `).join("");
}

function renderAnimEditor() {
  const a = findById("anims", state.selectedId);
  if (!a) {
    return `<div class="empty-tip">从左侧选择一个动画进行编辑，或新建动画</div>`;
  }
  return `
    <div class="edit-card">
      <div class="card-title">动画编辑：${a.name}</div>
      <div class="form-grid">
        <div class="form-item">
          <label>动画ID</label>
          <input value="${a.id}" disabled>
        </div>
        <div class="form-item">
          <label>动画名称</label>
          <input value="${a.name}" onchange="updateField('anims','name',this.value)">
        </div>
        <div class="form-item">
          <label>帧间隔 (ms)</label>
          <input type="number" value="${a.frameDelay}" onchange="updateField('anims','frameDelay',Number(this.value))">
        </div>
        <div class="form-item">
          <label>是否循环播放</label>
          <input type="checkbox" ${a.loop ? 'checked' : ''} onchange="updateField('anims','loop',this.checked)">
        </div>
        <div class="form-item full-col">
          <label>动画描述</label>
          <textarea rows="2" onchange="updateField('anims','desc',this.value)">${a.desc}</textarea>
        </div>
        <div class="form-item full-col">
          <label>上传帧图片（按顺序选择）</label>
          <button class="tool-btn btn-default" onclick="uploadFramesForAnim()">选择多张图片</button>
        </div>
      </div>
      <div class="anim-preview-wrap">
        <div style="font-size:13px;color:var(--text-gray);margin-bottom:8px;">帧列表（点击图片删除该帧）</div>
        <div class="anim-frame-list" id="animFrameList"></div>
        <div class="btn-group">
          <button class="tool-btn btn-primary" onclick="playAnim()">▶ 播放预览</button>
          <button class="tool-btn btn-default" onclick="stopAnim()">⏹ 停止</button>
        </div>
      </div>
    </div>
  `;
}

function uploadFramesForAnim() {
  uploadMultiImages((base64) => {
    const a = findById("anims", state.selectedId);
    if (!a.frames) a.frames = [];
    a.frames.push(base64);
    saveLocal();
    renderAnimPreview(a);
    log(`🎞️ 添加帧，当前共 ${a.frames.length} 帧`);
  });
}
