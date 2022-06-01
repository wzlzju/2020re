const source = require('./source')
const geneUtil = require('../generalization/util.js')
const CoordinateConvert =  require('./coordinateConvert')
const fs = require('fs')
const Query = require('./query')
const CONFIG = require('../config')



async function _buildStationMap(){
    console.time('station')
    let map = new Map(),
         i , n , station ,
         lacs  
    let stations = await source.readJson('basestation.json')

    n = stations.length 
    for( i = 0;i < n;i++){
      station = stations[i]
      let { lac , cell ,longitude ,latitude } = station   
      lacs = map.get( lac )
      if(!lacs){
        lacs = new Map()
      }
      lacs.set( cell ) = { longitude , latitude }
      map.set( lac ) = lacs
    }
    console.timeEnd('station')

    return map
}

/* 获取行人数据 */
async function peopleTrajs() {
    let stationMap = await _buildStationMap()
    console.log( stationMap )
    // let trajs = await source.readJson('mpt2014114 1140020sortbyid.txt_425662_2020040617.json')
    // console.log(trajs , stations )
}

// peopleTrajs()

/* 获取轨迹数据 */
async function taxiTrajs() {
    // let trajs = await source.readJson('taxi_3692_2020040618.json')
    let trajs = await source.readJson('taxi_characteristic_3597.json')
    // let trajs = await source.readJson('taxi_594_2020040621.json')
    // let trajs = await source.readJson('taxi_20_2020040620.json')

    console.log( trajs )
    // return trajs
  let newTrajs = []
  let leastPointsInTraj = 4
  let leastDistance = 2

  let i,j,
    n = trajs.length,
    m,
    traj
  for(i = 0;i < n;i++){
    traj = trajs[i]
    m = traj.length

    let newTraj = []
    let lastP 
    for(j = 0;j < m;j++){
      p = traj[j]
      if(!lastP){
        lastP = p
        newTraj.push(p)
        continue
      } 
      // 计算前后两点间距离
      let dist= geneUtil.spatialDistance(p,lastP)
      if(dist == 0) continue  // 同一点删去
      
      if(dist < leastDistance){
        lastP = p
        newTraj.push(p)
      }else{
        // 截断 添加
        if(newTraj.length > leastPointsInTraj){
          newTrajs.push(newTraj)
          newTraj = []
        }
      }
    }
    // 添加
    if(newTraj.length > leastPointsInTraj){
      newTrajs.push(newTraj)
    }
  }

  console.log( newTrajs )
  return newTrajs
}

/* 获取微博点数据 */
async function weiboPoints() {
    // let points = await source.readCsv('weibo_2014014_2428.csv')
    let points = await source.readCsv('weibo_2014014_42845.csv')
    console.log( points )
    points = points.map((p)=>{
        return {
          'lng' : parseFloat( p['lng'] ),
          'lat' : parseFloat( p['lat'] ),
          'time': p['time'] + ':00'
        }
    })
    return points
}

/* 获取手机基站轨迹数据 */
async function phoneTrajs(){
  let dir = './data/'
  let fileList = fs.readdirSync(dir); 
  fileList =  fileList.filter((file)=>{
    let reg = /^mpt2014114.*/
    return reg.test(file)
  })

  let lacMap = await _buildStationMap()


  let res = []
  for(let i = 0 ;i < fileList.length;i++){
    trajs = await _getFileRecords( fileList[i] , lacMap)
    res = res.concat( trajs )
  }
  return res
}
async function _buildStationMap(){

  let q = new Query()
  let stations = await q.station()

  let lacMap = new Map()
  
  stations.map((s)=>{
    let lac = lacMap.get( s['lac'] )
    if(!lac){
      lac = new Map()
    }
    let { longitude,latitude } = s
    if( lac.get( s['cell']) ) console.error('Duplicated')
    lac.set( s['cell'] , { longitude,latitude } )
    lacMap.set(s['lac'] , lac)
  })
  return lacMap
}

async function _getFileRecords( fileName , lacMap ) {
  let trajs = await source.readJson( fileName )
  let filter = trajs.filter((t)=> t['points'].length > 1)
  filter = filter.filter((t)=>{
    let { pid,points } = t
    let filterSign = false
    points = points.map((p)=>{
      let lnglat = _getLnglat(p , lacMap)
      if(!lnglat) filterSign = true
      return lnglat
    })

    t['points'] = points
    return !filterSign
  })
  return filter.map((t)=>{
    return t['points'].map((p)=>{
      return {
        'lng' : p['longitude'],
        'lat' : p['latitude']
      }
    })
  })
}
const _getLnglat = ( { lac , cell } , map) => {
  let cells = map.get( parseInt(lac) )
  if(!cells){
    return null
  }
  let lnglat = cells.get( parseInt(cell) )
  if(!lnglat){
  }
  return lnglat
}



const _regions2bounds = ( regions ) => {
  let p1 = regions[0]
  let  bounds = {
    lngMin : p1[0],
    lngMax : p1[0],
    latMin : p1[1],
    latMax : p1[1]
  }
  regions.map((p)=>{
    let { lngMin,lngMax,latMin,latMax } = bounds
    lngMin = ( lngMin > p[0] ? p[0] : lngMin )
    lngMax = ( lngMax < p[0] ? p[0] : lngMax )
    latMin = ( latMin > p[1] ? p[1] : latMin )
    latMax = ( latMax < p[1] ? p[1] : latMax )
    bounds = { lngMin,lngMax,latMin,latMax }
  })
  return bounds
}
async function pois({ checkedList:typeList ,regions }){
  let bbox = regions ? _regions2bounds( regions ) : null
  let q = new Query()
  let res = await q.poi( typeList , bbox )

  let n = CONFIG.POI_TYPES.length,
      curtType, i , color ,count,
      statics = {}

  let data = res.map((poi)=>{
      let { name,type,longitude,latitude } = poi 

      for(i = 0; i < n;i++){
        curtType = CONFIG.POI_TYPES[i]
        curtTypeChinese = CONFIG.POI_TYPES[i][0]
        curtTypeEnglish = CONFIG.POI_TYPES[i][1]
        if( type.includes( curtTypeChinese ) ){
          // color = CONFIG.POI_COLOR_MAP[ type ]
          color = '#b15928'
          type = curtTypeEnglish
          count = statics[ type ]
          count = count ? count+1 : 1
          statics[type] = count
          break
        }
      }
      return {
        message: poi['type'] + ' | ' + name,
        name,
        type,
        color,
        lng : longitude,
        lat : latitude
      }
  })
  return { data ,statics }
}


module.exports = {
  taxiTrajs,
	weiboPoints,
  phoneTrajs,
  pois
}