// ==================== 步骤6：导出游戏项目 ====================

function renderExportPage() {
  if (!GameData.project.name) {
    return renderNoProjectTip();
  }
  const stats = {
    item: GameData.item.length,
    npc: GameData.npc.length,
    monster: GameData.monster.length,
    skill: GameData.skill.length,
    map: GameData.maps.length,
    anim: GameData.anims.length
  };
  return `
    <div class="edit-card">
      <div class="card-title">项目打包导出</div>
      <div class="form-grid">
        <div class="form-item">
          <label>项目名称</label>
          <input value="${GameData.project.name}" disabled>
        </div>
        <div class="form-item">
          <label>游戏类型</label>
          <input value="${GameData.project.type}" disabled>
        </div>
        <div class="form-item">
          <label>物品数量</label>
          <input value="${stats.item} 个" disabled>
        </div>
        <div class="form-item">
          <label>NPC数量</label>
          <input value="${stats.npc} 个" disabled>
        </div>
        <div class="form-item">
          <label>怪物数量</label>
          <input value="${stats.monster} 个" disabled>
        </div>
        <div class="form-item">
          <label>技能数量</label>
          <input value="${stats.skill} 个" disabled>
        </div>
        <div class="form-item">
          <label>地图数量</label>
          <input value="${stats.map} 张" disabled>
        </div>
        <div class="form-item">
          <label>动画数量</label>
          <input value="${stats.anim} 个" disabled>
        </div>
      </div>
      <div class="btn-group">
        <button class="tool-btn btn-success" onclick="generateGameZip()" style="padding:12px 24px;font-size:16px;">📦 打包下载完整游戏项目</button>
        <button class="tool-btn btn-primary" onclick="exportProjectJson()">📄 仅导出配置JSON</button>
      </div>
    </div>

    <div class="edit-card">
      <div class="card-title">导出说明</div>
      <div style="line-height:1.8;color:var(--text-gray);font-size:14px;">
        <p>📦 <b>完整游戏项目</b>：包含 index.html 游戏入口 + game-data.json 配置文件 + README 说明文档，下载后解压即可运行。</p>
        <p>📄 <b>仅导出JSON</b>：只导出项目配置数据，方便备份和导入恢复。</p>
        <p style="margin-top:12px;color:var(--warning);">⚠️ 注意：当前导出的是配置数据和基础游戏模板，后续可根据你的玩法描述接入豆包生成完整游戏逻辑。</p>
      </div>
    </div>
  `;
}

async function generateGameZip() {
  if (!GameData.project.name) {
    alert("请先创建项目！");
    return;
  }
  log("📦 正在打包游戏项目...");

  try {
    const zip = new JSZip();

    // 1. 游戏数据配置文件
    zip.file("game-data.json", JSON.stringify(GameData, null, 2));

    // 2. 游戏入口 HTML
    const gameHtml = generateGameHtml();
    zip.file("index.html", gameHtml);

    // 3. README 说明
    const readme = `# ${GameData.project.name}

## 游戏信息
- 类型：${GameData.project.type}
- 创建时间：${GameData.project.createTime}
- 简介：${GameData.project.desc}

## 文件说明
- index.html：游戏主入口，浏览器直接打开即可运行
- game-data.json：游戏全量配置数据（物品/NPC/怪物/技能/地图/动画）

## 运行方式
1. 解压本项目
2. 直接用浏览器打开 index.html
3. 或上传到 GitHub Pages 在线运行

## 数据统计
- 物品：${GameData.item.length} 个
- NPC：${GameData.npc.length} 个
- 怪物：${GameData.monster.length} 个
- 技能：${GameData.skill.length} 个
- 地图：${GameData.maps.length} 张
- 动画：${GameData.anims.length} 个
`;
    zip.file("README.md", readme);

    // 生成并下载
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, GameData.project.name + "_游戏项目.zip");
    log("✅ 打包完成，已开始下载");
    alert("游戏项目打包完成！已开始下载 ZIP 文件。");
  } catch (e) {
    console.error(e);
    alert("打包失败：" + e.message);
  }
}

function generateGameHtml() {
  const p = GameData.project;
  const c = GameData.config;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.name}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; font-family:system-ui; }
body { background:${c.bgColor}; color:#fff; min-height:100vh; padding:20px; }
.container { max-width:1000px; margin:0 auto; }
h1 { margin-bottom:10px; }
.game-info { background:rgba(255,255,255,0.05); padding:16px; border-radius:8px; margin-bottom:20px; }
.map-grid { display:grid; gap:1px; background:#333; width:fit-content; margin-top:10px; }
.map-cell { width:32px; height:32px; background:#222; }
.map-cell.wall { background:#702020; }
.map-cell.spawn { background:#166534; }
.data-section { margin:20px 0; padding:16px; background:rgba(255,255,255,0.05); border-radius:8px; }
.data-section h3 { margin-bottom:10px; }
.item-card { display:inline-block; padding:8px 12px; margin:4px; background:#334155; border-radius:4px; }
</style>
</head>
<body>
<div class="container">
  <h1>${p.name}</h1>
  <div class="game-info">
    <p>类型：${p.type}</p>
    <p>简介：${p.desc}</p>
  </div>

  <div class="data-section">
    <h3>🗺️ 地图预览</h3>
    <div id="mapPreview"></div>
  </div>

  <div class="data-section">
    <h3>🎒 物品列表</h3>
    <div id="itemList"></div>
  </div>

  <div class="data-section">
    <h3>👾 怪物列表</h3>
    <div id="monsterList"></div>
  </div>
</div>

<script>
let GAME_DATA = {};

fetch("./game-data.json")
  .then(res => res.json())
  .then(data => {
    GAME_DATA = data;
    console.log("游戏数据加载完成", GAME_DATA);
    renderMap();
    renderItems();
    renderMonsters();
  });

function renderMap() {
  const preview = document.getElementById("mapPreview");
  if (!GAME_DATA.maps || GAME_DATA.maps.length === 0) {
    preview.innerHTML = "<p>暂无地图</p>";
    return;
  }
  const map = GAME_DATA.maps[0];
  let html = '<div class="map-grid" style="grid-template-columns:repeat(' + map.width + ',32px)">';
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = map.cells[y][x];
      let cls = "map-cell";
      if (cell.type === "wall") cls += " wall";
      if (cell.type === "spawn") cls += " spawn";
      html += '<div class="' + cls + '"></div>';
    }
  }
  html += '</div>';
  preview.innerHTML = html;
}

function renderItems() {
  const box = document.getElementById("itemList");
  if (!GAME_DATA.item || GAME_DATA.item.length === 0) {
    box.innerHTML = "<p>暂无物品</p>";
    return;
  }
  box.innerHTML = GAME_DATA.item.map(i =>
    '<div class="item-card">' + i.name + '</div>'
  ).join("");
}

function renderMonsters() {
  const box = document.getElementById("monsterList");
  if (!GAME_DATA.monster || GAME_DATA.monster.length === 0) {
    box.innerHTML = "<p>暂无怪物</p>";
    return;
  }
  box.innerHTML = GAME_DATA.monster.map(m =>
    '<div class="item-card">' + m.name + ' (HP:' + m.hp + ')</div>'
  ).join("");
}
</script>
</body>
</html>`;
}
