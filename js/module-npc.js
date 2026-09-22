function createNewNpc(){
  return {
    id:"game_"+Date.now(),
    name:"新NPC",desc:"",avatar:"",dialog:"",
    posX:0,posY:0,isShop:false,interact:true
  };
}
function getNpcForm(item,type){
  return `
    <div class="edit-card">
      <div class="card-title">NPC交互配置</div>
      <div class="form-grid">
        <div class="form-item full-col"><label>对话文本</label><textarea rows="4" onchange="updateItemField('${type}','dialog',this.value)">${item.dialog||""}</textarea></div>
        <div class="form-item"><label>场景X坐标</label><input type="number" value="${item.posX}" onchange="updateItemField('${type}','posX',Number(this.value))"></div>
        <div class="form-item"><label>场景Y坐标</label><input type="number" value="${item.posY}" onchange="updateItemField('${type}','posY',Number(this.value))"></div>
        <div class="form-item"><label>是否商店NPC</label><input type="checkbox" ${item.isShop?'checked':''} onchange="updateItemField('${type}','isShop',this.checked)"></div>
        <div class="form-item"><label>是否可交互</label><input type="checkbox" ${item.interact?'checked':''} onchange="updateItemField('${type}','interact',this.checked)"></div>
      </div>
    </div>
  `;
}
