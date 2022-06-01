数据源

### 1. 出租车数据  `taxi`

#### 源文件描述

文件包： `201401TRK.rar`  

大小：`800M`  ，每天约 `500M`

记录数：每天约 3000 条(辆车)

#### 读取方法

每条记录占 `39 bytes` ，格式如下

```
|longitude|latitude| time |occupation| speed |direction| others 
|--  4B --|-- 4B --|--8B--|-   2B   -|-  2B -|-  2B   -| ......
```

#### 过滤方法

- [x] 去除停止点 ( 抽取 characsteric points )
- [ ] 偏移距离过小，间隔时间较短
- [ ] 偏移距离过大

#### 数据处理

`data/taxi_pre.ipynb`

#### 处理后文件

`taxi_xxx_xxxxx.json`



---

### 2. 手机基站数据  `phone`

#### 源文件描述

`basestation.json`   基站数据

`phonetraj14-15.rar `   用户轨迹数据

#### 包含字段：

- pid
- 轨迹点
  - datetime
  - LAI(Location Area Identification)  +  CID(Cell Identity)
  - [基站定位查询](http://www.cellid.cn/) 

#### 存储方式

分库分表：垂直切分、水平切分

#### 查询方式

1. 按照时间间隔 获得轨迹 ID 
2. 过滤轨迹ID 
3. 按照轨迹ID列表查询轨迹

#### 过滤方法

#### 数据处理

`data/basestation_pre.ipynb`
`data/phoneraj_pre.ipynb`

#### 处理后文件

`basestation.json`
`mpt2014114 1140020sortbyid.txt_xxxx_xxxx.json`



----

### 3. 微博数据  `weibo`

#### 源文件描述

`2014-01-14.txt`  ~  `2014.02-28.txt` ，其中每天包含约 2500 条

选取 `2014-01-14.txt` 数据，共 2400 条

#### 包含字段

- 时间 
- 地点（经纬度），温州范围内
- 用户名 及 内容



-----

### 4. POI数据  `poi`

可使用 高德API 获取 

#### 选取类别