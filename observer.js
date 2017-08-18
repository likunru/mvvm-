// 给vm的data添加观测者
function Observer(data) {
  this.data = data;
  // 遍历data
  this.walk(data);
}

Observer.prototype = {
  walk: function (data) {
    var me = this;
    // 遍历data的每个属性
    Object.keys(data).forEach(function (key) {
      me.convert(key, data[key]);
    });
  },
  convert: function (key, val) {
    this.defineReactive(this.data, key, val);
  },

  // 具体给每个属性添加setter和getter
  defineReactive: function (data, key, val) {
    // 每次遍历都生成一个订阅器
    var dep = new Dep();
    // 对象的属性值可能还是对象，所以需要继续遍历下去
    var childObj = observe(val);

    Object.defineProperty(data, key, {
      enumerable: true, // 可枚举
      configurable: false, // 不能再define
      get: function () {
        // 由watcher.js转入 
        // Dep.target 代表当前watcher
        if (Dep.target) {
          dep.depend();
        }
        return val;
      },
      set: function (newVal) {
        if (newVal === val) {
          return;
        }
        val = newVal;
        // 新的值是object的话，进行监听
        childObj = observe(newVal);
        // 通知订阅者
        dep.notify();
      }
    });
  }
};

function observe(value, vm) {
  // 不是对象则退出
  if (!value || typeof value !== 'object') {
    return;
  }

  // 是对象则继续遍历观测属性
  return new Observer(value);
};


var uid = 0;

function Dep() {
  this.id = uid++;
  this.subs = [];
}

Dep.prototype = {
  addSub: function (sub) {
    this.subs.push(sub);
  },

  depend: function () {
    // Dep.target 代表的是watcher， 转入watcher addDep方法
    // this代表Dep实例  
    // 这里明明可以直接执行 this.addSub(Dep.target) 为什么还要将执行权交回给Watcher实例？
    // 这里watcher实例的addDep方法可以得到订阅器Dep实例，
    // 从而watcher实例可以判断dep.id是否存在于 [watcher实例的被添加进入的订阅器id对象](this.depIds)
    // 如果存在，则该订阅器不重复添加该watcher作为订阅者
    // 如果不存在， 该订阅器添加watcher作为订阅者，并将该dep.id添加入this.depIds里
    Dep.target.addDep(this);
  },

  removeSub: function (sub) {
    var index = this.subs.indexOf(sub);
    if (index != -1) {
      this.subs.splice(index, 1);
    }
  },

  notify: function () {
    this.subs.forEach(function (sub) {
      sub.update();
    });
  }
};

Dep.target = null;