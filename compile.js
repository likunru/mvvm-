// 解析el
// vm :视图模型
// exp : 指令值对应的字符串

// MVVM中使用方法 this.$compile = new Compile(options.el || document.body, this)
// 主要功能：解析元素中的各种指令并赋予对应功能。

function Compile(el, vm) {
  // $vm MVVM实例本身
  this.$vm = vm;
  // 获取传入的根元素
  this.$el = this.isElementNode(el) ? el : document.querySelector(el);

  if (this.$el) {
    // 将所有实际元素转化为元素碎片，操作效率高
    this.$fragment = this.node2Fragment(this.$el);
    // 执行具体编译操作
    this.init();
    // 将碎步还原到实际dom上
    this.$el.appendChild(this.$fragment);
  }
}

// TODO:
Compile.prototype = {
  node2Fragment: function (el) {
    var fragment = document.createDocumentFragment(),
      child;

    while (child = el.firstChild) {
      fragment.appendChild(child);
    }

    return fragment;
  },

  // 编译碎步
  init: function () {
    this.compileElement(this.$fragment);
  },

  compileElement: function (el) {
    var childNodes = el.childNodes,
      me = this;

    // 递归编译每一个节点，如果是文本采用文本编译方式，元素采用元素编译方式，如果有子节点地柜下去
    [].slice.call(childNodes).forEach(function (node) {
      var text = node.textContent;
      var reg = /\{\{(.*)\}\}/;

      if (me.isElementNode(node)) {
        me.compile(node);
      } else if (me.isTextNode(node) && reg.test(text)) {
        me.compileText(node, trim(RegExp.$1));
      }

      if (node.childNodes && node.childNodes.length) {
        me.compileElement(node);
      }
    });
  },

  // 编译元素节点
  compile: function (node) {
    var nodeAttrs = node.attributes,
      me = this;

    // 遍历该元素所有属性节点
    [].slice.call(nodeAttrs).forEach(function (attr) {
      var attrName = attr.name;
      // isDirective为Complie类的静态方法，判断属性是否是vue属性
      // 例： v-html = "a.b.c"
      if (me.isDirective(attrName)) {
        // 获取属性值 a.b.c
        var exp = trim(attr.value);
        // 获取属性的具体含义 html
        var dir = attrName.substring(2);
        // 如果为事件指令
        // 例： v-on:click = "handler"
        if (me.isEventDirective(dir)) {
          // 执行事件指令的编译方式
          compileUtil.eventHandler(node, me.$vm, exp, dir);
        } else {
          // 执行普通指令的编译方式
          compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
        }

        // 最后渲染上真DOM时去掉vue指令
        node.removeAttribute(attrName);
      }
    });
  },

  // 编译文本节点
  compileText: function (node, exp) {
    // 采用文本编译包中的指令处理方法
    compileUtil.text(node, this.$vm, exp);
  },

  isDirective: function (attr) {
    return attr.indexOf('v-') == 0;
  },

  isEventDirective: function (dir) {
    return dir.indexOf('on') === 0;
  },

  isElementNode: function (node) {
    return node.nodeType == 1;
  },

  isTextNode: function (node) {
    return node.nodeType == 3;
  }
};

// 指令处理集合
var compileUtil = {
  // v-text 或 文本节点 {{ xxx }} 指令处理方式
  text: function (node, vm, exp) {

    this.bind(node, vm, exp, 'text');
  },

  // v-html的指令处理方式
  html: function (node, vm, exp) {
    this.bind(node, vm, exp, 'html');
  },

  // v-model的指令处理方式
  // 一般v-model都绑定在input上，由于数据是双向绑定，故input值改变，vm中的值也应该发生改变。
  model: function (node, vm, exp) {
    this.bind(node, vm, exp, 'model');

    var me = this,
      val = this._getVMVal(vm, exp);
    node.addEventListener('input', function (e) {
      var newValue = e.target.value;
      if (val === newValue) {
        return;
      }

      me._setVMVal(vm, exp, newValue);
      val = newValue;
    });
  },

  // v-class的指令处理方式
  class: function (node, vm, exp) {
    this.bind(node, vm, exp, 'class');
  },

  // v-bind的指令处理方式，及代理其他指令的处理方式
  bind: function (node, vm, exp, dir) {
    // 获取对应指令的内容更新函数，例：a元素挂载了v-html，得到updater[htmlUpdater]
    var updaterFn = updater[dir + 'Updater'];
    // 利用updater[htmlUpdater]给a元素的内容进行初始化
    updaterFn && updaterFn(node, this._getVMVal(vm, exp));

    // 添加观察实例，一旦有值变化则启动更新函数
    // TODO:
    new Watcher(vm, exp, function (value, oldValue) {
      updaterFn && updaterFn(node, value, oldValue);
    });
  },

  // 事件处理
  eventHandler: function (node, vm, exp, dir) {
    // 获取 v-on具体绑定的是什么事件
    var eventType = dir.split(':')[1],
      // 获取具体事件触发函数
      fn = vm.$options.methods && vm.$options.methods[exp];

    // 绑定原生事件
    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false);
    }
  },

  // 获取指令值字符串所对应到vm中的值， 例：v-html="a.b.c"，则a.b.c就是指令值字符串，则应该获得vm中的a.b.c的值
  // 例： vm = { a: { b: { c: 3 } } };
  _getVMVal: function (vm, exp) {
    var val = vm;
    exp = exp.split('.');
    // [a, b, c]
    exp.forEach(function (k) {
      val = val[k];
      // 第n次循环   val结果
      //  1. val = { b: { c: 3 } }
      //  2. val = { c: 3 }
      //  3. val = 3
    });
    return val;
  },

  // 设置指令值字符串所对应到vm中的值， 假设value为999
  _setVMVal: function (vm, exp, value) {
    var val = vm;
    exp = exp.split('.');
    exp.forEach(function (k, i) {
      // 非最后一个key，更新val的值
      if (i < exp.length - 1) {
        val = val[k];
      } else {
        val[k] = value;
      }
      // 第n次循环   val结果
      //  1.if: val = { b: { c: 3 } }
      //  2.if: val = { c: 3 }
      //  3.else: val[c] = 999
      //  结果 vm中的a.b.c被设置为999了
    });
  }
};

// 指令所对应更新函数
var updater = {
  textUpdater: function (node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value;
  },

  htmlUpdater: function (node, value) {
    node.innerHTML = typeof value == 'undefined' ? '' : value;
  },

  classUpdater: function (node, value, oldValue) {
    var className = node.className;
    className = className.replace(oldValue, '').replace(/\s$/, '');

    var space = className && String(value) ? ' ' : '';

    node.className = className + space + value;
  },

  modelUpdater: function (node, value, oldValue) {
    node.value = typeof value == 'undefined' ? '' : value;
  }
};

function trim(str) { 
  return str.replace(/(^\s*)|(\s*$)/g, ""); 
}
