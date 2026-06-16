// 审批逻辑 & 详情页 & 工具函数

// 获取下一个审批人角色
function getNextApprover(expense) {
  const flow = Store.getFlow();
  const step = expense.currentStep || 0;
  // 根据金额决定需要走几级审批
  for (let i = step; i < flow.length; i++) {
    if (expense.amount >= flow[i].minAmount) return flow[i].role;
  }
  return null;
}

// 详情 & 审批弹窗
function showDetail(id) {
  const e = Store.getExpenseById(id);
  if (!e) return;
  const user = Store.getCurrentUser();
  const canApprove = e.status === '待审批' && getNextApprover(e) === user.role;

  const html = `
    <div style="margin-bottom:16px">
      <table style="font-size:13px">
        <tr><td style="color:#888;width:80px">报销人</td><td>${e.applicant}（${e.dept}）</td></tr>
        <tr><td style="color:#888">类型</td><td>${e.type}</td></tr>
        <tr><td style="color:#888">金额</td><td style="font-weight:600;color:#f5222d">¥${e.amount}</td></tr>
        <tr><td style="color:#888">说明</td><td>${e.description || '-'}</td></tr>
        <tr><td style="color:#888">发生日期</td><td>${e.expenseDate || '-'}</td></tr>
        <tr><td style="color:#888">附件</td><td>${e.attachments || 0} 张</td></tr>
        <tr><td style="color:#888">状态</td><td><span class="badge ${getStatusBadge(e.status)}">${e.status}</span></td></tr>
      </table>
    </div>
    <h4 style="margin-bottom:8px;font-size:14px">审批流程</h4>
    <div class="timeline">${renderTimeline(e)}</div>
    ${canApprove ? `<div style="margin-top:16px;border-top:1px solid #f0f0f0;padding-top:16px">
      <div class="form-group"><label>审批意见</label>
        <textarea id="approveComment" rows="2" placeholder="选填"></textarea></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-success" onclick="doApprove('${e.id}',true)">通过</button>
        <button class="btn btn-danger" onclick="doApprove('${e.id}',false)">驳回</button>
      </div>
    </div>` : ''}`;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-header"><h3>报销单详情</h3>
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
    <div class="modal-body">${html}</div></div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (ev) => { if (ev.target === overlay) overlay.remove(); };
}

// 执行审批
function doApprove(id, approved) {
  const user = Store.getCurrentUser();
  const e = Store.getExpenseById(id);
  const comment = document.getElementById('approveComment').value;
  const log = { action: approved ? '通过' : '驳回', user: user.name, role: user.role, time: new Date().toISOString(), comment };
  const logs = [...(e.logs || []), log];

  if (!approved) {
    Store.updateExpense(id, { status: '已驳回', logs });
  } else {
    const flow = Store.getFlow();
    const nextStep = (e.currentStep || 0) + 1;
    // 检查是否还有下一级需要审批
    let needMore = false;
    for (let i = nextStep; i < flow.length; i++) {
      if (e.amount >= flow[i].minAmount) { needMore = true; break; }
    }
    if (needMore) {
      Store.updateExpense(id, { currentStep: nextStep, logs });
    } else {
      Store.updateExpense(id, { status: '已通过', currentStep: nextStep, logs });
    }
  }

  document.querySelector('.modal-overlay').remove();
  alert(approved ? '已通过' : '已驳回');
  navigate(currentPage);
}

// 渲染时间线
function renderTimeline(e) {
  const logs = e.logs || [];
  return logs.map(log => {
    const dotClass = log.action === '提交' ? 'dot-submit' : log.action === '通过' ? 'dot-approve' : 'dot-reject';
    const icon = log.action === '提交' ? '&#9998;' : log.action === '通过' ? '&#10003;' : '&#10007;';
    return `<div class="timeline-item">
      <div class="timeline-dot ${dotClass}">${icon}</div>
      <div class="timeline-content">
        <div class="action">${log.user} ${log.action}</div>
        <div class="meta">${formatDate(log.time)}${log.role ? ' · ' + log.role : ''}</div>
        ${log.comment ? `<div class="comment">${log.comment}</div>` : ''}
      </div>
    </div>`;
  }).join('') + (e.status === '待审批' ? `<div class="timeline-item">
    <div class="timeline-dot dot-pending">?</div>
    <div class="timeline-content"><div class="action" style="color:#999">等待${getNextApprover(e)}审批</div></div>
  </div>` : '');
}

// 用户管理
function renderUsers(el) {
  const users = Store.getUsers();
  el.innerHTML += `<div class="card">
    <div style="margin-bottom:12px"><button class="btn btn-primary" onclick="showAddUser()">+ 添加用户</button></div>
    <table><tr><th>姓名</th><th>角色</th><th>部门</th><th>操作</th></tr>
    ${users.map(u => `<tr><td>${u.name}</td><td>${u.role}</td><td>${u.dept || '-'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="delUser('${u.id}')">删除</button></td></tr>`).join('')}
    </table></div>`;
}

function showAddUser() {
  const html = `
    <div class="form-group"><label>姓名</label><input id="uName"></div>
    <div class="form-row">
      <div class="form-group"><label>角色</label>
        <select id="uRole"><option>员工</option><option>部门主管</option><option>财务经理</option><option>总经理</option></select></div>
      <div class="form-group"><label>部门</label><input id="uDept"></div>
    </div>`;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal-header"><h3>添加用户</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
    <div class="modal-body">${html}</div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">取消</button>
      <button class="btn btn-primary" onclick="saveUser()">保存</button></div></div>`;
  document.body.appendChild(overlay);
}

function saveUser() {
  const name = document.getElementById('uName').value;
  if (!name) { alert('请输入姓名'); return; }
  Store.addUser({ name, role: document.getElementById('uRole').value, dept: document.getElementById('uDept').value });
  document.querySelector('.modal-overlay').remove();
  navigate('users');
}

function delUser(id) { if (confirm('确定删除？')) { Store.removeUser(id); navigate('users'); } }

// 系统设置
function renderSettings(el) {
  const flow = Store.getFlow();
  el.innerHTML += `<div class="card">
    <h3 style="margin-bottom:12px">审批流程配置</h3>
    <p style="color:#888;font-size:12px;margin-bottom:12px">设置各级审批人及金额阈值（金额>=阈值时需该级审批）</p>
    <div id="flowList">${flow.map((f,i) => `<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
      <span style="font-size:12px;color:#888;width:40px">第${i+1}级</span>
      <input style="flex:1;padding:6px;border:1px solid #d9d9d9;border-radius:4px" value="${f.role}" data-idx="${i}" class="flow-role">
      <input style="width:100px;padding:6px;border:1px solid #d9d9d9;border-radius:4px" type="number" value="${f.minAmount}" data-idx="${i}" class="flow-amount" placeholder="金额阈值">
    </div>`).join('')}</div>
    <button class="btn btn-primary" onclick="saveFlow()">保存配置</button>
  </div>
  <div class="card">
    <h3 style="margin-bottom:12px">数据管理</h3>
    <button class="btn btn-ghost" onclick="exportData()">导出数据</button>
    <button class="btn btn-danger" style="margin-left:8px" onclick="clearData()">清空数据</button>
  </div>`;
}

function saveFlow() {
  const roles = document.querySelectorAll('.flow-role');
  const amounts = document.querySelectorAll('.flow-amount');
  const flow = [];
  roles.forEach((r, i) => { flow.push({ role: r.value, minAmount: parseInt(amounts[i].value) || 0 }); });
  Store.setFlow(flow);
  alert('审批流程已更新');
}

function exportData() {
  const blob = new Blob([Store.exportAll()], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `finance-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
}

function clearData() {
  if (confirm('确定清空所有数据？不可恢复！')) { Store.clearAll(); Store.initDefault(); alert('已清空'); navigate('dashboard'); }
}

// 工具函数
function formatDate(iso) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-'; }
function getStatusBadge(s) {
  const map = { '待审批':'badge-pending', '已通过':'badge-approved', '已驳回':'badge-rejected', '已付款':'badge-paid' };
  return map[s] || 'badge-pending';
}
