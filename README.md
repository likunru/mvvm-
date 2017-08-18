> #### 本例拷贝于 [DMQ的github——剖析Vue实现原理 - 如何实现双向绑定mvvm](https://github.com/DMQ/mvvm)
**原例有bug，做了微调，主要在原例代码上加了很多阅读注释**

**等有时间会把该例子用ES6重写**

## 原文：
> #### 本文基于 [DMQ的github——剖析Vue实现原理 - 如何实现双向绑定mvvm](https://github.com/DMQ/mvvm)
> **感谢原文作者从Vue提取出来的简化代码，使得理解原理更加方便。
但是鉴于原文作者的注释比较少，有些部分内容叙述得不够详细，不利于记忆，故本人详细阅读后重新记录一遍方便记忆。**

#### 首先如果我们要使用双向绑定这个功能，应该如何写代码？
仿造Vue：
```html
<div id="mvvm-app">
    <input type="text" v-model="someStr">
    <h1>{{ someStr }}</h1>
    <h2 v-text="someStr"></h2>
    <button v-on:click="change">click me to change vm</button>
  </div>
```
```Javascript
<script src="./observer.js"></script>
<script src="./watcher.js"></script>
<script src="./compile.js"></script>
<script src="./mvvm.js"></script>
<script>
var vm = new MVVM({
      el: '#mvvm-app',
      data: {
        someStr: 'hello'
      },
      methods: {
        change: function(e){
          this.someStr = "10086";
        }
      }
    });
</script>
```
那么这个双向绑定到底是如何运作的呢？

![运行模式图](http://upload-images.jianshu.io/upload_images/4111182-c0b9c7c96f93a2f0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

1. 首先我们了解到Vue采用的是**发布者-订阅者模式**来实现双向数据绑定，这里我们就需要了解其中的两个角色，发布者和订阅者。
![发布者-订阅者模式](http://upload-images.jianshu.io/upload_images/4111182-47b4a6c21026a3bd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
这里所说的data中的某个属性，就对应着上面代码的someStr，someStr拥有一个调度中心Dep，而每个挂载着someStr属性的节点，就是所谓的订阅者（watcher），每当someStr的值发生了改变，someStr属性的setter函数就会被触发，然后Dep通知各个订阅者更新视图。
2. 那么我们现在需要知道为什么vm的data属性上会有setter，为什么每个节点都会变成订阅者，这些是如何实现的？来看`mvvm.js`入口文件[详细代码](https://github.com/yozosann/mvvm-/blob/master/mvvm.js)做了什么：
![mvvm.js](http://upload-images.jianshu.io/upload_images/4111182-97b4dc049f4f8b62.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
将编译mvvm上的#mvvm-app元素及其子元素，遍历`data: {someStr: 'hello'},`添加getter与setter。 
3.  编译元素又具体是如何处理的呢（[详细代码](https://github.com/yozosann/mvvm-/blob/master/complie.js)）：
![complie.js](http://upload-images.jianshu.io/upload_images/4111182-e240f4d5b964060c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
执行到最后到元素会进行实例化watcher，在了解实例化流程之前，我们先了解一下data是如何进行具体添加getter 和 setter的（[详细代码](https://github.com/yozosann/mvvm-/blob/master/observer.js)）：
![observer.js](http://upload-images.jianshu.io/upload_images/4111182-389af578070a42c0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
4. 那么实例化watcher会进行哪些操作，又会和getter，setter有什么交互呢？（[详细代码](https://github.com/yozosann/mvvm-/blob/master/watcher.js)）
![watcher.js](http://upload-images.jianshu.io/upload_images/4111182-51da9d0896b427b2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
如果仔细阅读图片，那么你对mvvm双向绑定一定有了一个深刻的理解，如果还是不清楚，可以点击对应的详细代码，查看具体代码及注释。