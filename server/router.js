const express = require('express');
const router = express.Router();
const source = require('./util/source')
const gene = require('./generalization/index')
const poi = require('./poi/fetch')
const poiTest = require('./poi/poi.test.js')

// poiTest.testAll()

const geneTest = require('./generalization/index.test.js')

const dataPreprocess = require('./util/pre')
const dataProvider = require('./util/data.js')
// geneTest.testAll()

/* Public POI */
router.ws('/pois' ,async (ws, req)=> {
  ws.on('message', async (msg)=> {
      let param = {}
      if(msg) param = JSON.parse(msg) 
      let pois = await dataProvider.pois( param )
      let { data ,statics  } = pois
      let res = {
          data,
          num  : data.length,
          statics
      }
      ws.send(JSON.stringify( res ));
  });
});

/* Taxi Data Trans Flow */
const taxiCache = {}  // 缓存 ，同一个 CondNodeId 查的数据能保存下来 ( condition 相同 )
router.ws('/taxiSpatialPartition' ,async (ws, req)=> {
  ws.on('message', async (msg)=> {
      let param = {}
      if(msg) param = JSON.parse(msg) 
      // console.log( param )
      let { condNodeId : id } = param
      if( id == undefined ) console.error('input node ID  error')

      console.log( param )
      let trajs = taxiCache[id]
      if( trajs == undefined ){
        trajs = await dataProvider.taxiTrajs()
        trajs = dataPreprocess.filterTrajs( trajs , param ) // 按搜索条件过滤
        taxiCache[id] = trajs
      }
      let res = await gene.trajsSpatialPartition( trajs , param  )
      res = {
        data : res,
        num : trajs.length,
      }
      ws.send(JSON.stringify( res ));
  });
});
router.ws('/taxiInformationGraph' ,async (ws, req)=> {
  ws.on('message', async (msg)=> {
      let param = {}
      if(msg) param = JSON.parse(msg)
      let { condNodeId : id } = param
      let trajs = taxiCache[id]
      let res = await gene.informationGraph( param )
      ws.send(JSON.stringify( {
        ...res,
        trajs
      }));
  });
});
router.ws('/informationGraphAnonymity' ,async (ws, req)=> {
  ws.on('message', async (msg)=> {
      let param = {}
      if(msg) param = JSON.parse(msg)
      let res = await gene.informationGraph( param )
      ws.send(JSON.stringify( res ));
  });
});

/* Weibo Data Trans Flow */
const weiboCache = {}  // 缓存 ，同一个 CondNodeId 查的数据能保存下来 ( condition 相同 )
router.ws('/weiboSpatialPartition' ,async (ws, req)=> {
  ws.on('message', async (msg)=> {
      let param = {}
      if(msg) param = JSON.parse(msg) 
      let { condNodeId : id } = param
      if( id == undefined ) console.error('input node ID  error')
      let points = weiboCache[id]
      if( points == undefined ){
        points = await dataProvider.weiboPoints()
        points = dataPreprocess.filterPoints( points , param ) // 按条件过滤
        weiboCache[id] = points  //存下来 
      }
      let res = await gene.pointsSpatialPartition( points , param  )
      res = {
        data : res,
        num: points.length,
      }
      ws.send(JSON.stringify( res ));
  });
});
router.ws('/weiboInformationGraph' ,async (ws, req)=> {
  ws.on('message', async (msg)=> {
      let param = {}
      if(msg) param = JSON.parse(msg)
      let res =  gene.pointsInformationGraph( param )
      ws.send(JSON.stringify( res ));
  });
});



module.exports = router;