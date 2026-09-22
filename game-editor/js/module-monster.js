function createNewMonster(){
  return {
    id:"game_"+Date.now(),
    name:"新怪物",desc:"",icon:"",hp:100,atk:10,def:5,
    speed:1,dropItem:"",dropRate:0.2,frames:[],frameDelay:150
  };
}
function getMonsterForm(item,type){
  return `
    <div class="edit-card">
      <div class="card-title">怪物战斗配置</div>
      <div class="form-grid">
        <div class="form-item"><label>生命值</label><input type="number" value="${item.hp}" onchange="updateItemField('${type}','hp',Number(this.value))"></div>
        <div class="form-item"><label>攻击力</label><input type="number" value="${item.atk}" onchange="updateItemField('${type}','atk',Number(this.value))"></div>
        <div class="form-item"><label>防御力</label><input type="number" value="${item.def}" onchange="updateItemField('${type}','def',Number(this.value))"></div>
        <div class="form-item"><label>移动速度</label><input type="number" value="${item.speed}" onchange="updateItemField('${type}','speed',Number(this.value))"></div>
        <div class="form-item"><label>掉落物品ID</label><input value="${item.dropItem||""}" onchange="updateItemField('${type}','dropItem',this.value)"></div>
        <div class="form-item"><label>掉落概率</label><input type="number" step="0.01" value="${item.dropRate||0}" onchange="updateItemField('${type}','dropRate',Number(this.value))"></div>
      </div>
    </div>
    <div class="edit-card">
      <div class="card-title">怪物动画配置</div>
      <div class="form-grid">
        <div class="form-item"><label>帧间隔(ms)</label><input type="number" value="${item.frameDelay||150}" onchange="updateItemField('${type}','frameDelay',Number(this.value))"></div>
        <div class="form-item full-col">
          <label>上传动画帧（多张图片轮播）</label>
          <input type="file" accept="image/*" multiple onchange="uploadAnimFrame('${type}',event)">
        </div>
      </div>
      <div class="anim-preview-wrap">
        <div>动画帧预览（点击删除单帧）</div>
        <div class="anim-frame-list" id="animFrameList"></div>
        <div class="btn-group" style="margin-top:10px;">
          <button class="tool-btn btn-primary" onclick="playAnimPreview()">播放动画</button>
          <button class="tool-btn btn-default" onclick="stopAnimPreview()">停止动画</button>
        </div>
      </div>
    </div>
  `;
}
