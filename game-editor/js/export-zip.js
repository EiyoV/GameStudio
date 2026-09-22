async function generateGameZip(){
  if(!GameEditorData.project.name) return alert("请先创建游戏项目！");
  log("📦 正在打包完整游戏项目...");
  const zip = new JSZip();
  zip.file("game-config.json", JSON.stringify(GameEditorData,null,2));
  const gameHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${GameEditorData.project.name}</title>
<style>
body{margin:0;padding:20px;background:${GameEditorData.config.bgColor};color:#fff;}
.container{max-width:1200px;margin:0 auto;}
.map-grid{display:grid;gap:1px;background:#333;width:fit-content;margin-top:10px;}
.map-cell{width:32px;height:32px;background:#222;}
.map-cell.wall{background:#702020;}
</style>
</head>
<body>
<div class="container">
  <h1>${GameEditorData.project.name}</h1>
  <p>游戏类型：${GameEditorData.project.type}</p>
  <p>游戏简介：${GameEditorData.project.desc}</p>
  <h3>地图预览</h3>
  <div id="mapPreview"></div>
</div>
<script>
let GAME_DATA = {};
fetch("./game-config.json")
.then(res=>res.json())
.then(data=>{
  GAME_DATA = data;
  console.log("✅ 游戏数据加载完成",GAME_DATA);
  renderFirstMap();
})

function renderFirstMap(){
  const mapPreview = document.getElementById("mapPreview");
  if(!GAME_DATA.maps || GAME_DATA.maps.length===0){
    mapPreview.innerText = "暂无地图";
    return;
  }
  const map = GAME_DATA.maps[0];
  let html = \`<div class="map-grid" style="grid-template-columns:repeat(\${map.width},32px)">\`;
  for(let y=0;y<map.height;y++){
    for(let x=0;x<map.width;x++){
      const cell = map.cells[y][x];
      html += \`<div class="map-cell \${cell.collide?'wall':''}"></div>\`;
    }
  }
  html += \`</div>\`;
  mapPreview.innerHTML = html;
}
</script>
</body>
</html>`;
  zip.file("index.html",gameHtml);
  const readme = `# ${GameEditorData.project.name}
## 游戏项目说明
创建时间：${GameEditorData.project.createTime}
游戏类型：${GameEditorData.project.type}
玩法简介：${GameEditorData.project.desc}

## 项目结构
- index.html 游戏主入口
- game-config.json 全量游戏数据配置（物品/NPC/怪物/技能/地图）

## 使用方式
1. 解压项目
2. 直接打开 index.html 运行游戏
3. 可将项目上传至 GitHub Pages 在线运行

## 编辑器制作
本项目由【专业网页游戏开发编辑器】一键生成`;
  zip.file("README.md",readme);
  const zipBlob = await zip.generateAsync({type:"blob"});
  saveAs(zipBlob, GameEditorData.project.name+"_完整游戏项目.zip");
  log("✅ 完整游戏项目打包下载成功！");
  alert("游戏项目导出成功！包含地图数据，预览页面可直接渲染第一张地图！");
}
