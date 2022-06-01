const ADDRESS = (process.env.NODE_ENV == "development") 
    ?  'localhost'
    : '116.62.46.132'
    
const PORT = 3001

/** 用于向后端发起查询请求的辅助类 */
export class Query {
  data = {};
  queryData = {};
  url = `ws://${ADDRESS}:${PORT}/ws`;
  ws = null;
  /**
   * 构造函数，初始化查询url。
   * @param {url} url 查询路径
   * @param {queryData} queryData 发送给服务区的数据
   */
  constructor(url = '', queryData  = null) {
    this.url += url;
    this.queryData = queryData;
  }

  /**
   * 私有函数，向服务器端发送数据，构造异步迭代器。
   */
  async _connect() {
    this.ws = await connect(this.url);
    this.queryData = JSON.stringify(this.queryData)
    this.ws.send(this.queryData);
    const that = this;
    this.data[Symbol.asyncIterator] = async function* () {
      while (that.ws.readState != 3) {
        yield (await oncePromise(that.ws, 'message')).data;
      }
    };
  }

  /**
   * 获取服务端传输的数据。
   * @return {data} 返回异步的可迭代对象data。
   */
  async getData() {
    await this._connect();
    return this.data;
  } 
}


export async function fetchWS( router , param = null ){

  const q = new Query(router, param )
  const data = await q.getData()
  for await (const d of data) {
      const res = JSON.parse(d)
      return res
  }
}

/**
 * Promise封装的WebSocket函数，用于向后端建立连接。
 * @param {url} url 查询路径
 * @return {PromiseObject} 返回Promise封装的WebSocket对象
*/
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = function() {
      resolve(ws);
    };
    ws.onerror = function() {
      reject(ws);
    };
  });
}

/**
 * Promise封装添加事件函数，每个事件仅触发一次。
 * @param {emitter} emitter 监听事件的对象
 * @param {event} event 监听的事件
 * @return {PromiseObject} 返回Promise封装的对象
 */
const oncePromise = (emitter, event) => {
  return new Promise((resolve) => {
    const handler = (...args) => {
      emitter.removeEventListener(event, handler);
      resolve(...args);
    };
    emitter.addEventListener(event, handler);
  });
};