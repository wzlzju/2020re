const gene = require('./index')
const graph = require('./graph')
const source = require('../util/source')
const dataProvider = require('../util/data')
const dataPreprocess = require('../util/pre')

async function testAll(){
      let res 
      // res  = await testPoint()
	    res = await testTraj()
}

async function testTraj(argument) {
      let param = {
        k : 3 , 
        p : 0.6,
        maxRadius : 1,
        bounds : [
           [121.3046380719896, 31.328184453845363],
           [121.76499465276387, 31.328184453845363],
           [121.76499465276387, 31.089438912857887],
           [121.3046380719896, 31.089438912857887],
           [121.3046380719896, 31.328184453845363]
        ],
      }
      // console.log('params' , param)
      let trajs = await dataProvider.taxiTrajs()
      console.log( trajs )
      trajs = dataPreprocess.filterTrajs( trajs , {} ) // 按搜索条件过滤
      console.log( trajs )
      source.writeJson( `taxi_characteristic_${trajs.length}.json` , trajs )
      let res = await gene.trajsSpatialPartition( trajs , param )       
      console.log( res )
      // console.timeEnd('轨迹匿名化')
      res = await gene.informationGraph({} ) 
}

async function testPoint(){
      let param = {
        k : 3 , 
        radius : 0.1,
        regions : [
            [120.60172173806302, 28.03901714020917],
            [120.7091164652158, 28.03901714020917],
            [120.7091164652158, 27.987819597085878],
            [120.60172173806302, 27.987819597085878],
            [120.60172173806302, 28.03901714020917],
        ],
        time : {
          start : '12:00',
          end : '22:23'
        }
      }
    let points = await dataProvider.weiboPoints()
    points = dataPreprocess.filterPoints( points , param )
    let pointsGroups = gene.pointsSpatialPartition(points, param )
    // console.log( pointsGroups )
    let voronois =  gene.pointsInformationGraph({})
    console.log( voronois )
}


module.exports = {
	testAll
}