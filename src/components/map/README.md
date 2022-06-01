
## 整体介绍

当前模块主要提供基于地图的图层绘制以及交互功能，其中

- `layers/`  针对项目中需要展示的各类型图层 基于 deck.gl 进行二次封装
- `Layers.js`  对上述的 各 layer 按照 id 进行简单映射
- `Map.js`  作为向外开发的地理组件。实现了地图模块以及图层模块，并注册了地理交互事件
- `index.js`   通过 设置了各图层的参数（数据查询、展示参数） ，并从后端获取数据 ， 将数据和参数一并传给 `Map` 组件，实现整体效果的展示
- `Panel.js `   用于通过 `config ` 配置各 Layer 的参数





## Map 组件

为方便使用，将常用的一些地理功能进行封装 ，支持项目中需要的 **各种图层** 以及 **交互方式** 。

#### 使用方法

```javascript
import MyMap from './Map'

<MyMap 
	onRef={this.onRef}
	params={this.state.renderConfigParams}
	datas={this.state.datas} />

```



#### 参数介绍

参数具体结构参考 `./config.sample.js`

| 参数名 | 介绍                                      |
| ------ | ----------------------------------------- |
| onRef  | 获得 Map 实例，例如拿到其 Id 用于绑定事件 |
| params | 图层展示配置，参考 ConfigPanel.js         |
| datas  | 图层数据                                  |



#### 当前实现的各地理图层

具体参考 `./layers/`

| 图层名                 | 介绍                                            | 对应数据类型      |
| ---------------------- | ----------------------------------------------- | ----------------- |
| WeiboSinglePoint       | 原始微博点                                      | 点数据            |
| PublicPolylineLayer    | 公开轨迹数据对应的轨迹线条                      | 轨迹数据          |
| PublicGeoLocationLayer | 公开的地理点数据（带Icon)                       | 点数据（带类型）  |
| ChoroplethMapLayer     | Voronoi 地理区块                                | 面数据            |
| RegionMoveLayer        | Voronoi 区块之间移动                            | 线数据（ a => b） |
| FrameSelect            | 框选交互图层                                    | 选择地理范围      |
| CircleLayer            | 圈选交互图层                                    | 选择搜索直径大小  |
| ArrowLayer             | 将上述的 Move 使用箭头表示，需要自己编写 shader | 代实现            |
| GlyphLayer             | 用于表示较复杂的自定义glyph ，拟使用 SVG 来实现 | 代实现            |



#### 交互实现

##### 1. 矩形框选操作

- `startMapFrameSelect` 地图框选开始
	
	```javascript
	let { mapId } =  this.props || this.state
	let ev = Event.get()
ev.emit(mapId + 'startMapFrameSelect')
	
	registerCallBackFuncToMap() // 用户注册框选介绍后的回调函数
	```

-  `endMapFrameSelect` 地图框选结束  
	
	```javascript
	let { mapId } =  this.props || this.state
	let ev = Event.get()
	let name = mapId + 'endMapFrameSelect'
	ev.once( name , ( bounds )=>{
	    console.log( bounds )
	}, this)
	```


-  `changeMapFrameSelectVisible`  选择是否展示地图上的选择框 
	```javascript
	let { visible : v ,mapId } = this.state || this.props
	let ev = Event.get()
	let name = mapId + 'changeMapFrameSelectVisible'
	ev.emit( name , v )
	```

##### 2. 半径调整操作 （ 使用同上 ）

- `changeMapCircleSelectVisible`  在地图上展示圆形框
- `startMoveCircleHandle`  开始移动点(onDragStart)
- `endCircleRadiusChange`  当修改半径完成后触发



#### 实现原理

##### 实现方法

- 每个 Map 实例都有自己的**唯一 id** 
- 把 `params` + `datas`  按照图层的 id 合并 ，向下分发给各 layer 
- 事件管理通过全局**单例**的  `event emiter` 进行管理，主要用于 **交互** 和 **联动** 操作

##### 地理绘制

采用 [deck.gl](https://deck.gl/#/documentation/developer-guide/using-layers)  ，基于 react 思想，并可用于大数据量的绘制，底图使用 Mapbox 

针对每个 Layer ，其内部会维护[生命周期](https://deck.gl/#/documentation/developer-guide/writing-custom-layers/layer-lifecycle?section=deck-gl-rendering-cycles)（根据 layer id 区别），因此每次修改参数重新调即可

参考： 1. [Custom-Layer](http://vis.academy/#/custom-layers/setup)  2. [Composite-Layer](https://deck.gl/#/documentation/developer-guide/writing-custom-layers/composite-layers)

其中地图上的交互 (如框选等) 采用 [nebula.gl](https://nebula.gl/docs)  





## 其它

- `config.js`  下  `CONSOLE_PRINT = true`   来查看当前 `params` 和 `datas` 参数