const cluster = require('./cluster')
const util = require('./util')
const Graph = require("graph-data-structure")  // https://github.com/datavis-tech/graph-data-structure#creating-a-graph


function Visit(pStart , pEnd , vId){
	this.tStart = pStart['time']
	this.tEnd = pEnd['time']
	this.voronoiId = vId

	this.stayTime = util.timeDuration(this.tStart , this.tEnd)
	this.pathLength = util.spatialDistance(pStart, pEnd )
	this.speed = ( this.stayTime==0 )? 0 : this.pathLength / this.stayTime
}

function Move(pStart , pEnd , vStartId , vEndId ){
	this.tStart = pStart['time']
	this.tEnd = pEnd['time']
	this.voronoiStartId = vStartId
	this.voronoisEndId = vEndId

	this.duraTime = util.timeDuration(this.tStart , this.tEnd)
	this.pathLength = util.spatialDistance(pStart, pEnd )
	this.speed = ( this.duraTime==0 )? 0 : this.pathLength / this.duraTime
}

// Aggregation of visits
function VisitVectors(){
	this.vectors = new Map()  // 存同一个 cell 里的 visit 的数组
	let _idMake = ( a ) =>  a  + ''
	let _idUnpack = ( aStr ) =>  parseInt(aStr)
	this.add = function( visit ){
		let id = _idMake( visit['voronoiId'])
		let vArr = this.vectors.get( id )
		if(vArr){
			vArr.push( visit )
		}else{
			this.vectors.set( id , [visit] )
		}
	}
	this.setAggregatedVectors = function(voronoisMap){
		let vId , v ,
			voronois = []

		for (let [id, vArr] of this.vectors.entries()) {
			vId =  _idUnpack(id)
			v = voronoisMap.get(vId)
			v['visitArr'] = vArr   // set inplace
		}
	}
}

// Aggregation of moves
function MoveVectors(){
	this.vectors = new Map()  // 存同类型move的数组
	let _idMake = ( a ,b ) => (a + '') + '-' +  (b + '')
	let _idUnpack = ( abStr ) =>  abStr.split('-').map((i)=>parseInt(i))
	this.add = function(move){
		let id = _idMake( move['voronoiStartId'] , move['voronoisEndId'] )
		let mArr = this.vectors.get( id )
		if(mArr){
			mArr.push( move )
		}else{
			this.vectors.set( id , [move] )
		}
	}
	this.setAggregatedVectors = function(voronoisMap){
		let vStart
		for (let [id, mArr] of this.vectors.entries()) {
			let [ sId , eId ] = _idUnpack(id)
			vStart = voronoisMap.get(sId)
			if(!vStart['movesVectors'])
				vStart['movesVectors'] = {} 
			vStart['movesVectors'][ eId ] = mArr
		}
	}
}

/*
	Main Function
	Segment traj's points into Cells
	Then Aggregate them
*/
function segmentTrajs(  trajs , groups , grid ) {

	console.log('Segmentation Input' , trajs)
	console.log('start Segmentation. trajs.length: ' , trajs.length )
	console.time('Segmentation One Generation')

	let groupSet = util.buildSet( groups )
	let voronoisGraph = builfVoronoiGraph( groups )
	let p ,v , i ,visit , move,
		n = trajs.length , m,
		traj

	let aggregatedTrajs = []

	for(i = 0; i < n ;i++){
		traj = trajs[i]
		m = traj.length

		let lastV = null,
			lastPStart = null,
			lastPEnd = null ,
			visits = [],
			passByVoronoiIds = []

		for(j = 0;j < m;j++){
			p = traj[j]
			// curV
			v =	_getPsVoronoi( p , groupSet )
			
			if(!v) break  // null
			if(lastV == null){ // first 
				lastV = v 
				lastPStart = p
				lastPEnd = p
				continue
			}
			if(lastV['id'] == v['id']){  // same voronio
				lastPEnd = p
				continue
			}else{
				// passByVoronoiIds = passByVoronoiIds.concat(
				// 	interpolateVoronoi(lastV['id'] , v['id'] , voronoisGraph )
				// )
				passByVoronoiIds.push( lastV['id'] )
				lastV = v

				lastPStart = p
				lastPEnd = p

			}
		}

		if(lastV){
			passByVoronoiIds.push( lastV['id'] )
		}
		if(passByVoronoiIds.length > 0)
			aggregatedTrajs.push( passByVoronoiIds )

	}
	// console.log(aggregatedTrajs)
	console.timeEnd('Segmentation One Generation')
	return aggregatedTrajs
}

function builfVoronoiGraph( groups ){
	let neighborGraph = new Graph()
	groups.map((g)=>{
		let { voronoi } = g
		let { adjacents , id : i } = voronoi
		adjacents.map((n)=>{
			neighborGraph.addEdge(i , n)
			neighborGraph.addEdge(n , i)
		})
	})
	// console.log(neighborGraph.serialize())
	return neighborGraph
}
function interpolateVoronoi(last , cur , graph ){
	let res
	try {
	  res = graph.shortestPath( ""+last , ""+cur )
	  res = res.slice(0,-1)
	}catch(error) {
	  console.error(last , cur , error);
	  res = []
	}
	return res.map((i)=> parseInt(i))
}

function _getPsVoronoi( p  , groupSet ){
	let { belongGroupId } = p
	let group = groupSet.get( belongGroupId )
	if( group == undefined || group == null ){
		console.error(`cant find point's voronois`)	
		return null
	}
	return group['voronoi']
}



module.exports = {
	segmentTrajs
}	