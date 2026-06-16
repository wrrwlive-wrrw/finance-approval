// 数据存储层
const Store = {
  _get(key) { return JSON.parse(localStorage.getItem('fa_' + key) || '[]'); },
  _set(key, data) { localStorage.setItem('fa_' + key, JSON.stringify(data)); },
  _id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  // 用户
  getUsers() { return this._get('users'); },
  addUser(u) { const list = this._get('users'); u.id = this._id(); list.push(u); this._set('users', list); return u; },
  updateUser(id, data) {
    const list = this._get('users');
    const i = list.findIndex(u => u.id === id);
    if (i >= 0) { list[i] = { ...list[i], ...data }; this._set('users', list); }
  },
  removeUser(id) { this._set('users', this._get('users').filter(u => u.id !== id)); },

  // 报销单
  getExpenses() { return this._get('expenses'); },
  getExpenseById(id) { return this._get('expenses').find(e => e.id === id); },
  addExpense(e) {
    const list = this._get('expenses');
    e.id = this._id();
    e.createdAt = new Date().toISOString();
    e.status = '待审批';
    e.logs = [{ action: '提交', user: e.applicant, time: e.createdAt, comment: '' }];
    list.push(e);
    this._set('expenses', list);
    return e;
  },
  updateExpense(id, data) {
    const list = this._get('expenses');
    const i = list.findIndex(e => e.id === id);
    if (i >= 0) { list[i] = { ...list[i], ...data }; this._set('expenses', list); }
  },

  // 审批流程配置
  getFlow() {
    const flow = localStorage.getItem('fa_flow');
    return flow ? JSON.parse(flow) : [
      { role: '部门主管', minAmount: 0 },
      { role: '财务经理', minAmount: 0 },
      { role: '总经理', minAmount: 5000 }
    ];
  },
  setFlow(flow) { localStorage.setItem('fa_flow', JSON.stringify(flow)); },

  // 当前登录用户
  getCurrentUser() {
    const u = localStorage.getItem('fa_currentUser');
    return u ? JSON.parse(u) : null;
  },
  setCurrentUser(u) { localStorage.setItem('fa_currentUser', JSON.stringify(u)); },
  logout() { localStorage.removeItem('fa_currentUser'); },

  // 导入导出
  exportAll() {
    return JSON.stringify({ users: this.getUsers(), expenses: this.getExpenses(), flow: this.getFlow() }, null, 2);
  },
  importAll(json) {
    const d = JSON.parse(json);
    if (d.users) this._set('users', d.users);
    if (d.expenses) this._set('expenses', d.expenses);
    if (d.flow) this.setFlow(d.flow);
  },
  clearAll() { ['users','expenses'].forEach(k => localStorage.removeItem('fa_' + k)); localStorage.removeItem('fa_flow'); },

  // 初始化默认用户
  initDefault() {
    const users = this.getUsers();
    // 如果旧用户没有username字段，清除并重建
    if (users.length === 0 || (users.length > 0 && !users[0].username)) {
      this._set('users', []);
      this.addUser({ name: '张三', role: '员工', dept: '市场部', phone: '', username: 'zhangsan', password: '123456' });
      this.addUser({ name: '李主管', role: '部门主管', dept: '市场部', phone: '', username: 'lizg', password: '123456' });
      this.addUser({ name: '王财务', role: '财务经理', dept: '财务部', phone: '', username: 'wangcw', password: '123456' });
      this.addUser({ name: '赵总', role: '总经理', dept: '总经办', phone: '', username: 'admin', password: 'admin123' });
    }
  }
};
