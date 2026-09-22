function newProject(){
  document.getElementById("newProjectModal").style.display = "grid";
}
function closeModal(){
  document.getElementById("newProjectModal").style.display = "none";
}
function confirmNewProject(){
  const name = document.getElementById("projName").value.trim();
  const type = document.getElementById("projType").value;
  const desc = document.getElementById("projDesc").value.trim();
  if(!name) return alert("请输入项目名称！");

  GameEditorData = {
    project:{ name, type, desc, createTime:new Date().toLocaleString() },
    config:{ bgColor:"#111111", gameTitle:name, maxLevel:99 },
    item:[],npc:[],monster:[],skill:[],maps:[],animSource:{}
  };

  document.getElementById("curProjectName").innerText = name;
  closeModal();
  saveLocalData();
  renderModuleUI();
  renderEditArea();
  log(`🎉 成功创建新项目：${name}`);
  alert("项目创建成功！现在可以开始配置游戏数据了");
}

function saveProject(){
  saveLocalData();
  alert("项目已手动保存！");
}
function importProject(){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = e=>{
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = res=>{
      try{
        GameEditorData = JSON.parse(res.target.result);
        document.getElementById("curProjectName").innerText = GameEditorData.project.name;
        saveLocalData();
        renderModuleUI();
        renderEditArea();
        log("✅ 导入项目配置成功");
        alert("项目导入成功！");
      }catch(err){
        alert("JSON解析失败！");
      }
    }
    reader.readAsText(file);
  }
  input.click();
}
function exportProjectJson(){
  try{
    const blob = new Blob([JSON.stringify(GameEditorData,null,2)],{type:"application/json"});
    saveAs(blob, GameEditorData.project.name+"_游戏配置.json");
    log("📤 导出项目配置文件成功");
  }catch(e){
    alert("导出失败，检查JSZip/FileSaver是否加载成功");
  }
}

// 根据类型新建条目入口
function addNewModuleItem(){
  const type = currentState.activeType;
  if(type === "config") return alert("配置模块无需新建条目！");
  const id = "game_"+Date.now();
  let newItem = {};
  if(type === "item") newItem = createNewItem();
  if(type === "npc") newItem = createNewNpc();
  if(type === "monster") newItem = createNewMonster();
  if(type === "skill") newItem = createNewSkill();
  if(type === "map") newItem = createNewMap();

  GameEditorData[type].push(newItem);
  currentState.selectId = id;
  saveLocalData();
  renderEditArea();
  log(`✅ 新建${getTypeName(type)}配置条目成功`);
}
