const AppState = {
  currentStep:1,
  currentModule:null,
  project:null,
  logBox:null,
  previewBox:null
};
const StepConfig = {
  1:{title:"新建项目",menus:[{group:"项目",items:[{id:"overview",label:"项目概览",icon:"📁"}]}]},
  2:{title:"基础配置",menus:[{group:"游戏设置",items:[{id:"game-config",label:"基础配置",icon:"⚙️"}]}]},
  3:{title:"数据编辑",menus:[{group:"游戏数据",items:[
    {id:"item",label:"物品",icon:"🎒"},
    {id:"npc",label:"NPC",icon:"👤"},
    {id:"monster",label:"怪物",icon:"👾"},
    {id:"skill",label:"技能",icon:"✨"}
  ]}]},
  4:{title:"地图编辑",menus:[{group:"地图",items:[{id:"map-list",label:"地图列表",icon:"🗺️"}]}]},
  5:{title:"动画制作",menus:[{group:"动画资源",items:[{id:"anim-list",label:"动画列表",icon:"🎞️"}]}]},
  6:{title:"导出项目",menus:[{group:"打包",items:[{id:"export",label:"打包导出",icon:"📦"}]}]}
};
const ProjectManager = {
  storageKey:"gameStudioProject",
  currentProject:null,
  create(name,gameType,desc){
    this.currentProject = {
      name:name,
      type:gameType,
      description:desc,
      createTime:new Date().toISOString(),
      config:{gameTitle:name,bgColor:"#111111",maxLevel:99,version:"1.0.0",startGold:100,startHp:100},
      items:[],
      npcs:[],
      monsters:[],
      skills:[],
      maps:[],
      animations:[]
    };
    this.saveLocal();
    return this.currentProject;
  },
  saveLocal(){
    if(!this.currentProject) return;
    localStorage.setItem(this.storageKey,JSON.stringify(this.currentProject));
  },
  loadLocal(){
    const raw = localStorage.getItem(this.storageKey);
    if(!raw) return null;
    try{
      this.currentProject = JSON.parse(raw);
      return this.currentProject;
    }catch(e){return null;}
  },
  exportJson(){
    if(!this.currentProject) return null;
    return JSON.stringify(this.currentProject,null,2);
  },
  importJson(text){
    try{
      const d = JSON.parse(text);
      this.currentProject = d;
      this.saveLocal();
      return true;
    }catch(e){return false;}
  }
};

function log(type,msg){
  const box = document.getElementById("logBox");
  if(!box) return;
  const t = new Date().toLocaleTimeString();
  box.innerText += `[${t}] [${type}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}
function clearLog(){
  document.getElementById("logBox").innerText="[系统] 日志已清空\n";
}
function openModal(id){document.getElementById(id).classList.add("show");}
function closeModal(){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("show"));}
function newProject(){openModal("newProjectModal");}
function confirmNewProject(){
  const name = document.getElementById("projName").value.trim();
  const gtype = document.getElementById("projType").value;
  const desc = document.getElementById("projDesc").value.trim();
  if(!name){log("警告","项目名称不能为空");return;}
  ProjectManager.create(name,gtype,desc);
  document.getElementById("projectNameDisplay").innerText = ProjectManager.currentProject.name;
  closeModal();
  log("项目",`创建项目：${name}`);
  switchStep(2);
}
function saveProject(){
  ProjectManager.saveLocal();
  log("项目","已保存本地");
}
function importProject(){
  const inp = document.createElement("input");
  inp.type="file";inp.accept=".json";
  inp.onchange=e=>{
    const f = e.target.files[0];
    const r = new FileReader();
    r.onload=ev=>{
      const ok = ProjectManager.importJson(ev.target.result);
      if(ok){
        document.getElementById("projectNameDisplay").innerText = ProjectManager.currentProject.name;
        log("项目","导入成功");
        switchStep(1);
      }else log("错误","导入JSON失败");
    };
    r.readAsText(f);
  };
  inp.click();
}
function exportProjectJson(){
  const txt = ProjectManager.exportJson();
  if(!txt){log("警告","请先创建项目");return;}
  const blob = new Blob([txt],{type:"application/json"});
  saveAs(blob,ProjectManager.currentProject.name+".json");
  log("导出","下载配置JSON完成");
}

function bindStepNav(){
  document.querySelectorAll("#stepNav .step").forEach(el=>{
    el.onclick = ()=>{
      const s = Number(el.dataset.step);
      switchStep(s);
    };
  });
}
function switchStep(stepNum){
  AppState.currentStep = stepNum;
  AppState.currentModule = null;
  document.querySelectorAll("#stepNav .step").forEach(s=>s.classList.remove("active"));
  document.querySelector(`.step[data-step="${stepNum}"]`).classList.add("active");
  renderSidebar(stepNum);
  renderEmptyEditor();
  log("导航",`切换步骤：${StepConfig[stepNum].title}`);
}
function renderSidebar(step){
  const menuDom = document.getElementById("sidebarMenu");
  menuDom.innerHTML = "";
  const cfg = StepConfig[step];
  cfg.menus.forEach(g=>{
    const gt = document.createElement("div");
    gt.className="sidebar-group-title";gt.innerText=g.group;menuDom.appendChild(gt);
    g.items.forEach(it=>{
      const div = document.createElement("div");
      div.className="sidebar-item";
      div.dataset.modId = it.id;
      div.innerHTML = `<span class="icon">${it.icon}</span><span>${it.label}</span>`;
      div.onclick=()=>{selectModule(it.id);};
      menuDom.appendChild(div);
    });
  });
}
function selectModule(modId){
  AppState.currentModule = modId;
  document.querySelectorAll(".sidebar-item").forEach(i=>i.classList.remove("active"));
  document.querySelector(`.sidebar-item[data-mod-id="${modId}"]`).classList.add("active");
  renderEditorPanel(modId);
}
function renderEmptyEditor(){
  const ed = document.getElementById("editor");
  ed.innerHTML = `
<div class="editor-header">
  <div class="editor-title">${StepConfig[AppState.currentStep].title}</div><div></div>
</div>
<div class="editor-body">
  <div class="empty-state"><div class="big-icon">📂</div><p>请点击左侧菜单选择功能模块</p></div>
</div>`;
}

window.addEventListener("DOMContentLoaded",()=>{
  bindStepNav();
  const p = ProjectManager.loadLocal();
  if(p){
    document.getElementById("projectNameDisplay").innerText = p.name;
    log("系统","读取本地项目："+p.name);
  }
  switchStep(1);
});
