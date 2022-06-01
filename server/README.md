## 接口定义

### 1.   原始轨迹

##### 1.1  接口说明

`basicTrajs`    获取原始**轨迹数据**（未经过处理的）

### 2.   模糊轨迹

##### 2.1  接口说明

`geneTrajs`    获取经过整合且匿名化的轨迹

具体参考 ` ./generalization`	 路径下的 `geneTrajs` 函数

### 3.  原始微博点

##### 3.1 接口说明

`weiboPoints`  获取原始**点数据**

### 4.  模糊微博点

##### 4.1 接口说明

`genePoints`  获取经过整和的点数据 ，

具体参考 ` ./generalization`	 路径下的 `genePoints` 函数

### 5. POI 公共点获取

##### 5.1 接口说明

调用 [高德API](https://lbs.amap.com/api/webservice/guide/api/search) ，用于获取 温州 指定区域内的公开POI点

具体配置 参考 ` ./poi/fetch`

----



## 文件结构

- `router.js`     websocket api 接口对应路由的函数，具体实现逻辑用新的文件实现
- `util/`     用的到的公共的函数
  - `source.js`   用于数据读取、存储
    1. 本地csv 、json ：可将文件存入 public\  下，不把文件传到代码库
    2. 远程 csv、json ： 使用 **七牛云**  ，把小的文件传上去，添加链接就可以跑了，方便**远程协作**。需要**注意** 文件的版本（缓存问题） ，同时注意七牛空间域名变更
    3. 远程 mysql  ： 数据量大的情况比较慢
    4. 本地 mysql ： 不把自己本地的账户密码上传，需要注意成员间数据同步问题

- `index.js`   express 框架启动文件 ，端口号 3001

- `generalizationDataPrepare.js  轨迹数据获取和预处理