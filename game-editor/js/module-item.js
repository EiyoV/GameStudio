function createNewItem(){
  return {
    id:"game_"+Date.now(),
    name:"新道具",desc:"",icon:"",type:"consume",
    stackMax:99,price:0,attr:"",usable:true
  };
}
function getItemEditForm(type,item){
  let html = `
  <div class="edit-card">
    <div class="card-title">编辑${getTypeName(type)}：${item.name}</div>
    <div class="form-grid">
      <div class="form-item"><label>唯一ID</label><input value="${item.id}" disabled></div>
      <div class="form-item"><label>名称</label><input value="${item.name}" onchange="updateItemField('${type}','name',this.value)"></div>
      <div class="form-item full-col"><label>描述说明</label><textarea rows="3" onchange="updateItemField('${type}','desc',this.value)">${item.desc||""}</textarea></div>
    </div>
  </div>
  `;
  if(type === "item"){
    html += `
    <div class="edit-card">
      <div class="card-title">物品属性配置</div>
      <div class="form-grid">
        <div class="form-item">
          <label>物品类型</label>
          <select onchange="updateItemField('${type}','type',this.value)">
            <option value="consume" ${item.type==='consume'?'selected':''}>消耗品</option>
            <option value="equip" ${item.type==='equip'?'selected':''}>装备</option>
            <option value="material" ${item.type==='material'?'selected':''}>材料</option>
          </select>
        </div>
        <div class="form-item"><label>堆叠上限</label><input type="number" value="${item.stackMax}" onchange="updateItemField('${type}','stackMax',Number(this.value))"></div>
        <div class="form-item"><label>售卖价格</label><input type="number" value="${item.price}" onchange="updateItemField('${type}','price',Number(this.value))"></div>
        <div class="form-item"><label>是否可使用</label><input type="checkbox" ${item.usable?'checked':''} onchange="updateItemField('${type}','usable',this.checked)"></div>
        <div class="form-item full-col"><label>属性加成文本</label><input value="${item.attr||""}" onchange="updateItemField('${type}','attr',this.value)"></div>
      </div>
    </div>
    `;
  }
  if(type === "npc"){
    html += getNpcForm(item,type);
  }
  if(type === "monster"){
    html += getMonsterForm(item,type);
  }
  if(type === "skill"){
    html += getSkillForm(item,type);
  }
  if(type === "map"){
    html += getMapForm(item,type);
  }
  return html;
}
