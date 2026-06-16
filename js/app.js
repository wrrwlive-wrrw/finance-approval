// 主控逻辑
let currentPage = 'dashboard';

function initApp() {
  Store.initDefault();
  const user = Store.getCurrentUser();
  if (!user) { showLogin(); return; }
  renderApp();
}

function showLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <h2>财务审批系统</h2>
        <p style="text-align:center;color:#888;font-size:12px;margin-bottom:20px">费用报销管理平台</p>
        <div class="form-group"><label>用户名</label>
          <input id="loginUser" placeholder="请输入用户名"></div>
        <div class="form-group"><label>密码</label>
          <input id="loginPass" type="password" placeholder="请输入密码"></div>
        <button class="btn btn-primary" style="width:100%;padding:10px;font-size:15px" onclick="doLogin()">登 录</button>
        <p style="margin-top:16px;font-size:11px;color:#999;text-align:center">
          默认管理员账号：admin / admin123</p>
      </div>
    </div>`;
}

function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!username) { alert('请输入用户名'); return; }
  const users = Store.getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) { alert('用户名或密码错误'); return; }
  Store.setCurrentUser(user);
  renderApp();
}

function doLogout() { Store.logout(); showLogin(); }

function renderApp() {
  const user = Store.getCurrentUser();
  document.getElementById('app').innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>财务审批</h2><p>费用报销管理</p></div>
        <nav class="nav-menu" id="navMenu"></nav>
      </aside>
      <main class="main" id="mainContent"></main>
    </div>`;
  renderNav();
  navigate('dashboard');
}

function renderNav() {
  const user = Store.getCurrentUser();
  const items = [
    { id: 'dashboard', icon: '&#9776;', label: '工作台' },
    { id: 'submit', icon: '&#9997;', label: '提交报销' },
    { id: 'mylist', icon: '&#128196;', label: '我的报销' },
    { id: 'approve', icon: '&#9989;', label: '待我审批' },
    { id: 'all', icon: '&#128202;', label: '全部单据' },
  ];
  if (user.role === '总经理' || user.role === '财务经理') {
    items.push({ id: 'users', icon: '&#128101;', label: '用户管理' });
    items.push({ id: 'settings', icon: '&#9881;', label: '系统设置' });
  }
  const nav = document.getElementById('navMenu');
  nav.innerHTML = items.map(it => `
    <div class="nav-item ${it.id===currentPage?'active':''}" onclick="navigate('${it.id}')">
      <span class="icon">${it.icon}</span><span>${it.label}</span>
    </div>`).join('') + `
    <div class="nav-divider"></div>
    <div class="nav-item" onclick="doLogout()">
      <span class="icon">&#10140;</span><span>退出登录</span>
    </div>`;
}

function navigate(page) {
  currentPage = page;
  renderNav();
  const el = document.getElementById('mainContent');
  const user = Store.getCurrentUser();
  el.innerHTML = `<div class="topbar"><h1>${getPageTitle(page)}</h1>
    <div class="user-info">当前用户：<b>${user.name}</b>（${user.role}）</div></div>`;
  switch(page) {
    case 'dashboard': renderDashboard(el); break;
    case 'submit': renderSubmit(el); break;
    case 'mylist': renderMyList(el); break;
    case 'approve': renderApprove(el); break;
    case 'all': renderAll(el); break;
    case 'users': renderUsers(el); break;
    case 'settings': renderSettings(el); break;
  }
}

function getPageTitle(p) {
  const map = { dashboard:'工作台', submit:'提交报销', mylist:'我的报销', approve:'待我审批', all:'全部单据', users:'用户管理', settings:'系统设置' };
  return map[p] || '';
}
