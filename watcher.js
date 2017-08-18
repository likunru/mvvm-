function Watcher(vm, expOrFn, cb) {
  this.cb = cb; // 回调函数
  this.vm = vm; // vm实例
  // 指令值字符串， v-html = " a ? b : c" 或者 v-html = "a.b.c"
  // 所以该指令字符串 可以是一个表达式字符串，通过某种转换，传进来的可能为function
  this.expOrFn = expOrFn; 
  this.depIds = {};

  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = this.parseGetter(expOrFn);
  }

  // 触发属性都getter ，从而在dep添加自己
  this.value = this.get();
}

Watcher.prototype = {
  update: function () {
    // 当有值发生改变时
    this.run();
  },
  run: function () {
    var value = this.get();
    var oldValue = this.value;
    if (value !== oldValue) {
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  },
  addDep: function (dep) {
    // TODO:
    // 每个订阅器器都有一个id
    if (!this.depIds.hasOwnProperty(dep.id)) {
      // 订阅器将该watcher实例添加到了订阅者数组中
      dep.addSub(this);
      this.depIds[dep.id] = dep;
    }
  },
  get: function () {
    // Dep是一个订阅器，Dep.target为一个全局属性，默认为null，代表本次所添加进订阅器中的目标
    // 将本次订阅器的目标指定为该watcher
    Dep.target = this;
    // 获取vm中指令字符串所对应的值，例如a.b.c ，此时触发了observer.js 中 24行
    // 即触发了 a.b.c的 getter函数
    var value = this.getter.call(this.vm, this.vm);
    Dep.target = null;
    return value;
  },
  parseGetter: function (exp) {
    // if (/[^\w.$]/.test(exp)) return;
    // 获取vm中 dom节点指令值所对应的data属性，从而触发getter
    var exps = exp.split('.');

    return function (obj) {
      for (var i = 0, len = exps.length; i < len; i++) {
        if (!obj) return;
        obj = obj[exps[i]];
      }
      return obj;
    }
  }
}