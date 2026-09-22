// 定义每一步对应的侧边菜单、主面板渲染函数
const stepConfig = {
  1: {
    title: "新建项目",
    sidebar: [
      { id: "project-info", name: "项目工程信息", icon: "📁" },
      { id: "project-setting", name: "工程文件管理", icon: "📄" }
    ],
    renderMain: () => {
      return `
        <div class="panel">
          <h2>新建 / 管理游戏工程</h2>
          <p>在这里创建新项目、导入已有工程、管理工程文件</p>
          <div>项目名称：<input type="text" /></div>
          <div>工程保存路径：<input type="text" /></div>
        </div>
      `
    }
  },
  2: {
    title: "游戏基础配置",
    sidebar: [
      { id: "game-base", name: "游戏全局基础配置", icon: "⚙️" }
    ],
    renderMain: () => {
      return `
        <div class="panel">
          <h2>游戏全局基础配置</h2>
          <div class="form-row">
            <label>游戏标题</label>
            <input type="text" value="vv">
            <label>游戏最大等级</label>
            <input type="number" value="99">
          </div>
          <div class="form-row">
            <label>游戏背景色</label>
            <input type="color">
            <label>游戏类型</label>
            <input type="text" value="idle">
          </div>
          <div class="form-row">
            <label>游戏玩法简介</label>
            <textarea></textarea>
          </div>
        </div>
      `
    }
  },
  3: {
    title: "游戏数据编辑",
    sidebar: [
      { id: "item", name: "游戏物品/道具", icon: "🎁" },
      { id: "npc", name: "交互NPC", icon: "👤" },
      { id: "monster", name: "游戏怪物", icon: "👾" },
      { id: "skill", name: "游戏技能", icon: "✨" },
      { id: "mapdata", name: "地图场景", icon: "🗺️" }
    ],
    renderMain: () => {
      return `<div class="panel"><h2>游戏数据编辑</h2><p>选择左侧菜单编辑道具、NPC、怪物、技能数据</p></div>`
    }
  },
  4: {
    title: "地图场景编辑",
    sidebar: [
      { id: "map-layer", name: "图层管理", icon: "📑" },
      { id: "tileset", name: "瓦片素材库", icon: "🧱" },
      { id: "map-obj", name: "地图对象管理", icon: "📍" }
    ],
    renderMain: () => {
      return `<div class="panel"><h2>地图场景编辑器</h2><p>瓦片绘制、图层、碰撞区域、对象放置</p></div>`
    }
  },
  5: {
    title: "动画资源制作",
    sidebar: [
      { id: "frame-anim", name: "帧动画编辑器", icon: "🎞️" },
      { id: "atlas", name: "图集资源管理", icon: "🖼️" }
    ],
    renderMain: () => {
      return `<div class="panel"><h2>动画资源制作</h2><p>导入图片，切割图集，制作角色/怪物帧动画</p></div>`
    }
  },
  6: {
    title: "导出游戏项目",
    sidebar: [
      { id: "build-setting", name: "打包配置", icon: "📦" },
      { id: "export-option", name: "导出选项", icon: "💾" }
    ],
    renderMain: () => {
      return `<div class="panel"><h2>导出游戏项目</h2><p>配置打包参数，导出HTML完整游戏包</p></div>`
    }
  }
}

let currentStep = 1;
const $stepItems = document.querySelectorAll('.step-item');
const $sidebar = document.getElementById('leftSidebar');
const $mainEditor = document.getElementById('editorMain');

// 切换步骤函数
function switchStep(stepNum) {
  currentStep = stepNum;
  const cfg = stepConfig[stepNum];
  // 更新顶部激活状态
  $stepItems.forEach(el => {
    el.classList.toggle('active', Number(el.dataset.step) === stepNum)
  })

  // 渲染左侧侧边栏菜单
  let sidebarHtml = `<h3>游戏资源模块</h3><input placeholder="搜索ID/名称" class="search-input">`
  cfg.sidebar.forEach(menu => {
    sidebarHtml += `
      <div class="sidebar-menu-item" data-id="${menu.id}">
        ${menu.icon} ${menu.name}
      </div>
    `
  })
  $sidebar.innerHTML = sidebarHtml;

  // 渲染中间主面板
  $mainEditor.innerHTML = cfg.renderMain();
}

// 绑定顶部点击事件
$stepItems.forEach(item => {
  item.addEventListener('click', () => {
    const step = Number(item.dataset.step);
    switchStep(step);
  })
})

// 初始化，默认加载步骤1
switchStep(1);
