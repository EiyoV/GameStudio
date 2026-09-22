// ==================== 步骤3：物品道具模块 ====================

function createNewItem() {
  return {
    id: genId("item"),
    name: "新道具",
    desc: "暂无描述",
    icon: "",
    type: "consume",
    stackMax: 99,
    price: 10,
    hpRestore: 0,
    mpRestore: 0,
    attackBonus: 0,
    defenseBonus: 0,
    usable: true
  };
}

function renderItemList() {
  const list = GameData.item;
  if (list.length === 0) {
    return `<div class="empty-tip">暂无物品，点击左侧【新建物品】创建</div>`;
  }
  return list.map(item => `
    <div class="list-item ${state.selectedId === item.id ? 'selected' : ''}" onclick="selectDataItem('item','${item.id}')">
      <div style="display:flex;align-items:center;gap:10px;">
        ${item.icon ? `<img src="${item.icon}" style="width:36px;height:36px;object-fit:contain;">` : `<div style="width:36px;height:36px;background:#333;border-radius:4px;display:grid;place-items:center;">📦</div>`}
        <div>
          <div><b>${item.name}</b></div>
          <div style="font-size:12px;color:var(--text-gray);">${item.id} · ${getItemTypeName(item.type)}</div>
        </div>
      </div>
      <button class="tool-btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();deleteDataItem('item','${item.id}')">删除</button>
    </div>
  `).join("");
}

function getItemTypeName(type) {
  const map = { consume: "消耗品", equip: "装备", material: "材料" };
  return map[type] || type;
}

function renderItemEditor() {
  const item = findById("item", state.selectedId);
  if (!item) {
    return `<div class="empty-tip">从左侧列表选择一个物品进行编辑，或新建物品</div>`;
  }
  return `
    <div class="edit-card">
      <div class="card-title">编辑物品：${item.name}</div>
      <div class="form-grid">
        <div class="form-item">
          <label>物品ID</label>
          <input value="${item.id}" disabled>
        </div>
        <div class="form-item">
          <label>物品名称</label>
          <input value="${item.name}" onchange="updateField('item','name',this.value)">
        </div>
        <div class="form-item full-col">
          <label>物品描述</label>
          <textarea rows="2" onchange="updateField('item','desc',this.value)">${item.desc}</textarea>
        </div>
        <div class="form-item">
          <label>物品图标</label>
          <div style="display:flex;gap:8px;align-items:center;">
            ${item.icon ? `<img src="${item.icon}" style="width:48px;height:48px;object-fit:contain;">` : ""}
            <button class="tool-btn btn-default" onclick="uploadIconForItem()">上传图标</button>
          </div>
        </div>
        <div class="form-item">
          <label>物品类型</label>
          <select onchange="updateField('item','type',this.value)">
            <option value="consume" ${item.type === 'consume' ? 'selected' : ''}>消耗品</option>
            <option value="equip" ${item.type === 'equip' ? 'selected' : ''}>装备</option>
            <option value="material" ${item.type === 'material' ? 'selected' : ''}>材料</option>
          </select>
        </div>
        <div class="form-item">
          <label>堆叠上限</label>
          <input type="number" value="${item.stackMax}" onchange="updateField('item','stackMax',Number(this.value))">
        </div>
        <div class="form-item">
          <label>售卖价格</label>
          <input type="number" value="${item.price}" onchange="updateField('item','price',Number(this.value))">
        </div>
        <div class="form-item">
          <label>是否可使用</label>
          <input type="checkbox" ${item.usable ? 'checked' : ''} onchange="updateField('item','usable',this.checked)">
        </div>
        <div class="form-item">
          <label>恢复生命值</label>
          <input type="number" value="${item.hpRestore}" onchange="updateField('item','hpRestore',Number(this.value))">
        </div>
        <div class="form-item">
          <label>恢复魔法值</label>
          <input type="number" value="${item.mpRestore}" onchange="updateField('item','mpRestore',Number(this.value))">
        </div>
        <div class="form-item">
          <label>攻击加成</label>
          <input type="number" value="${item.attackBonus}" onchange="updateField('item','attackBonus',Number(this.value))">
        </div>
        <div class="form-item">
          <label>防御加成</label>
          <input type="number" value="${item.defenseBonus}" onchange="updateField('item','defenseBonus',Number(this.value))">
        </div>
      </div>
    </div>
  `;
}

function uploadIconForItem() {
  uploadImage((base64) => {
    updateField("item", "icon", base64);
    renderDataEditArea();
    log("🖼️ 物品图标已更新");
  });
}
