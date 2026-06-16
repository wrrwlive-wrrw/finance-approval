// 页面渲染模块

// 工作台
function renderDashboard(el) {
  const user = Store.getCurrentUser();
  const expenses = Store.getExpenses();
  const mine = expenses.filter(e => e.applicant === user.name);
  const pending = expenses.filter(e => e.status === '待审批' && getNextApprover(e) === user.role);

  el.innerHTML += `
    <div class="stats-grid">
      <div class="stat-card"><div class="num num-blue">${mine.length}</div><div class="label">我的报销单</div></div>
      <div class="stat-card"><div class="num num-orange">${pending.length}</div><div class="label">待我审批</div></div>
      <div class="stat-card"><div class="num num-green">${mine.filter(e=>e.status==='已通过').length}</div><div class="label">已通过</div></div>
      <div class="stat-card"><div class="num num-red">${mine.filter(e=>e.status==='已驳回').length}</div><div class="label">已驳回</div></div>
    </div>
    ${pending.length > 0 ? `<div class="card"><h3 style="margin-bottom:12px">待审批（${pending.length}）</h3>
      <table><tr><th>报销人</th><th>类型</th><th>金额</th><th>提交时间</th><th>操作</th></tr>
      ${pending.slice(0,5).map(e => `<tr>
        <td>${e.applicant}</td><td>${e.type}</td><td>¥${e.amount}</td>
        <td>${formatDate(e.createdAt)}</td>
        <td><button class="btn btn-primary btn-sm" onclick="showDetail('${e.id}')">审批</button></td>
      </tr>`).join('')}</table></div>` : ''}
    <div class="card">
      <h3 style="margin-bottom:12px">快捷操作</h3>
      <button class="btn btn-primary" onclick="navigate('submit')">提交报销</button>
      <button class="btn btn-ghost" style="margin-left:8px" onclick="navigate('mylist')">查看我的报销</button>
    </div>`;
}

// 提交报销
function renderSubmit(el) {
  el.innerHTML += `<div class="card">
    <h3 style="margin-bottom:16px">填写报销单</h3>
    <div class="form-row">
      <div class="form-group"><label>报销类型</label>
        <select id="exType">
          <option>交通费</option><option>餐饮费</option><option>办公用品</option>
          <option>通讯费</option><option>差旅费</option><option>培训费</option><option>其他</option>
        </select></div>
      <div class="form-group"><label>金额（元）</label>
        <input id="exAmount" type="number" placeholder="请输入金额"></div>
    </div>
    <div class="form-group"><label>费用说明</label>
      <textarea id="exDesc" rows="3" placeholder="请描述费用用途"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>发生日期</label>
        <input id="exDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group"><label>附件数量</label>
        <input id="exAttach" type="number" value="0" min="0"></div>
    </div>
    <button class="btn btn-primary" onclick="submitExpense()">提交报销单</button>
  </div>`;
}

function submitExpense() {
  const user = Store.getCurrentUser();
  const amount = parseFloat(document.getElementById('exAmount').value);
  if (!amount || amount <= 0) { alert('请输入有效金额'); return; }
  const expense = {
    applicant: user.name,
    applicantId: user.id,
    dept: user.dept,
    type: document.getElementById('exType').value,
    amount: amount,
    description: document.getElementById('exDesc').value,
    expenseDate: document.getElementById('exDate').value,
    attachments: document.getElementById('exAttach').value,
    currentStep: 0
  };
  Store.addExpense(expense);
  alert('报销单提交成功！');
  navigate('mylist');
}

// 我的报销
function renderMyList(el) {
  const user = Store.getCurrentUser();
  const expenses = Store.getExpenses().filter(e => e.applicant === user.name).reverse();
  el.innerHTML += `<div class="card">${renderExpenseTable(expenses)}</div>`;
}

// 待我审批
function renderApprove(el) {
  const user = Store.getCurrentUser();
  const expenses = Store.getExpenses().filter(e => e.status === '待审批' && getNextApprover(e) === user.role);
  el.innerHTML += `<div class="card">
    ${expenses.length === 0 ? '<p style="color:#aaa;text-align:center;padding:40px">暂无待审批单据</p>' :
    renderExpenseTable(expenses, true)}</div>`;
}

// 全部单据
function renderAll(el) {
  const expenses = Store.getExpenses().reverse();
  el.innerHTML += `<div class="card">
    <div style="margin-bottom:12px">
      <select class="btn btn-ghost" onchange="filterAll(this.value)">
        <option value="">全部状态</option>
        <option value="待审批">待审批</option>
        <option value="已通过">已通过</option>
        <option value="已驳回">已驳回</option>
      </select>
    </div>
    <div id="allTable">${renderExpenseTable(expenses)}</div></div>`;
}

function filterAll(status) {
  let list = Store.getExpenses().reverse();
  if (status) list = list.filter(e => e.status === status);
  document.getElementById('allTable').innerHTML = renderExpenseTable(list);
}

function renderExpenseTable(expenses, showApproveBtn) {
  if (expenses.length === 0) return '<p style="color:#aaa;text-align:center;padding:40px">暂无记录</p>';
  return `<table><tr><th>报销人</th><th>类型</th><th>金额</th><th>状态</th><th>提交时间</th><th>操作</th></tr>
    ${expenses.map(e => `<tr>
      <td>${e.applicant}</td><td>${e.type}</td><td>¥${e.amount}</td>
      <td><span class="badge ${getStatusBadge(e.status)}">${e.status}</span></td>
      <td>${formatDate(e.createdAt)}</td>
      <td>${showApproveBtn ? `<button class="btn btn-primary btn-sm" onclick="showDetail('${e.id}')">审批</button>` :
        `<button class="btn btn-ghost btn-sm" onclick="showDetail('${e.id}')">详情</button>`}</td>
    </tr>`).join('')}</table>`;
}
