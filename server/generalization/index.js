const segment = require('./segment')
const util = require('./util')
const clusterModule = require('./cluster')
const tessilationModule = require('./tessilation')
const graph = require('./graph')
var aggregatedTrajs = []

// defakut
let kValue = 5
let maxRadius = 0.05
let pVaule = 0.6

const cacheTrajs = {}
const cachePoints = {}
function pointsSpatialPartition( points , { radius = 1 ,id = 1 , timeInterval } ){
    console.log( points )
	
	const {  groups,grid } =  clusterModule.clustering( points , radius )
	tessilationModule.partition( groups , grid )
	cachePoints[id] = {
		points,
		groups,
		grid
	}
	return groups.map((group)=>{
		return group['voronoi']
	})
}

function pointsInformationGraph({ id = 1 ,timeInterval = 10 , region ,timeRange }){
	let _cache = cachePoints[id]
	if(!_cache)  return null

	let { points,groups } = _cache
	let IG  = graph.buidIGPoints( points , groups , timeInterval )
	let _IG = graph.filter( IG['nodes'] , IG['edges'] , groups , region , timeRange , timeInterval) 
	let edges = _IG['edges']
	let groupsMap =  util.buildSet( groups )

	return edges.map((edge)=>{
		let { start, end, support } = edge  // start == end
		let group = groupsMap.get( start )
		return {
			...group['voronoi'],
			support
		}
	})
}

function trajsSpatialPartition( trajs , { radius = 0.3 ,id = 1 , timeInterval } ) {
	console.log( radius )
	let _cache = cacheTrajs[id]
	let points = []
	for(let i = 0;i < trajs.length;i++){
		let traj = trajs[i]
		for(let j = 0; j < traj.length;j++)
			points.push( traj[j] )
	}
	console.log( trajs )
	const { groups, grid } =  clusterModule.clustering( points , radius )
	tessilationModule.partition( groups , grid )
	cacheTrajs[id] = {
		trajs,
		groups,
		grid,
		points,
	}
	// console.log("Groups Num : ", groups.length)

	return groups.map((group)=>{
		return group['voronoi']
	})
	/* 
      [{
		polygon: (7) [ [120.63036254202729, 27.960186300111502] , Array(2), Array(2), Array(2), Array(2), Array(2), Array(2)]
		adjacents: (6) [136, 25, 1, 26, 55, 53]
		id: 0
	   }]
	*/
}
function informationGraph( { id = 1 ,timeInterval = 10 , region ,timeRange, k = 5 , maxRadius = 2 }) {
	// console.time('IG')
	console.log( id , timeInterval , region , timeRange , k , maxRadius )

	k = +k
	maxRadius = +maxRadius

	let _cache = cacheTrajs[id]
	if(!_cache)  return null
	let { trajs,groups,grid } = _cache

	let IG  = graph.buidIGTrajs( trajs , groups , timeInterval )
	let _IG = graph.filter( IG['nodes'] , IG['edges'] , groups , region , timeRange , timeInterval) 
	console.log('into anonymity' , groups )
	let join = graph.anonymity( _IG['nodes'] , _IG['edges'] , groups , k , maxRadius ,  grid )
	groups = join['groups']
	let edges = join['edges']
	let nodes = join['nodes']
	console.log( groups )
	let groupsMap =  util.buildSet( groups )
	let groupsGraph = util.builfVoronoiGraph( groups )
	
	let middleVectors = []

	let sum1 = 0
	edges.map((edge)=>{ sum1+= edge['support']})
	console.log("SUM1" , sum1 )
	console.log('start Voronoi Interpolat...')
	console.time('voronoi interpolat')

	let vectors = edges.map((vector)=>{
	  let { start, end, support } = vector
	  let fromGroup = groupsMap.get( start )
	  if(!fromGroup){
	  	// console.log(vector)
	  	return null
	  }
	  // 不是邻接的区域 Interpolate OR 直接舍去
	  if( fromGroup['voronoi']['adjacents'].indexOf(end) == -1 ){
	  		let middles  = util.interpolateVoronoi(start , end , groupsGraph)
	  		for(let i = 1;i < middles.length;i++){
	  			start = middles[i-1]
	  			end = middles[i]
	  			let v = _getVector( { start, end } , groupsMap )
	  			middleVectors.push( {
	  				...v,
	  				support
	  			})
	  		}
	  		return null
	  }
	  return _getVector( vector , groupsMap )
	}).filter((v) => v!=null)
	console.timeEnd('voronoi interpolat')
	vectors = vectors.concat( middleVectors )

	let combineVectors = []
	for(let i =0;i < vectors.length;i++){
		let vector = vectors[i]
		let { start, end } = vector
		if( combineVectors.find((v) => v['start'] == start && v['end'] ==end) )
			continue
		for(let j=i+1;j<vectors.length;j++){
			let _vector = vectors[j]
			if(vector['start'] == _vector['start'] && vector['end'] == _vector['end']){
				vector['support'] += _vector['support']
			}
		}
		combineVectors.push(vector)
	}
	// console.timeEnd('IG')
	console.log(nodes , groupsMap)
	let choropleths = nodes.map((node)=>{
		let group = groupsMap.get(node['psr'])
		if(!group) return null
		let voronoi =  group['voronoi']

		let support = group['members'].length
		// let support = node['count']
		// support = 0
		// combineVectors.map((v)=>{
		// 	if(v['start'] == psr || v['end'] == psr)
		// 		support += v['support']
		// })
		if(support < k) return null
		return {
			...voronoi,
			support,
			members : group['members']
		}
	}).filter((a)=>a)
	console.log( vectors , choropleths )

	let sum2 = 0
	combineVectors.map((edge)=>{ sum2+= edge['support']})
	combineVectors = combineVectors.filter((edge)=> edge['support'] >= k)
	
	groups.map((group , i)=>{
		group['centrality'] = 0.3
		group['dispersion'] = 0.9
		// group['centrality'] = _getCentrality(group)
		// group['dispersion'] = _getDispersion(group)
	})

	console.log("SUM2" , sum2 )
	return {
		vectors : combineVectors,
		choropleths,
		utility:groups
	}
}
const _getVector = ( edge , groupsMap ) => {
	  let { start, end } = edge
	  let fromPoint =  groupsMap.get(start)['centroid']['point']
	  let toPoint = groupsMap.get(end)['centroid']['point']
	  return {
	    ...edge,
	    fromPoint,
	    toPoint
	  }
}
const _getDispersion = (group) =>{
	let { members } = group
	let dist = 0
	for(let i = 0;i < members.length;i++){
		let p1 = members[i]
		for(let j = 0;j < members.length;j++){
			let p2 = members[j]
			dist += util.spatialDistance(p1 , p2)
		}
	}	
	return dist/members.length/members.length
}
const _getCentrality = (group) => {
	let { centroid,members } = group
	centroid = centroid['point']
	let dist = 0
	members.map((p)=>{
		dist += util.spatialDistance(p , centroid)
	})
	return dist/members.length
}

function informationGraphAnonymity({ id , timeInterval ,region ,timeRange , k = 5 }){
	
}


function geneTrajs(trajs , params){
	/* 0. PreProcess */  
	kValue = params['k'] ? params['k'] : kValue
	maxRadius = params['maxRadius'] ? params['maxRadius'] :maxRadius 
	pVaule = params['p'] ? params['p'] : pVaule

	// if( params['bounds'] ){
	// 	trajs = util.clip(trajs , params['bounds'])
	// }

	console.log('Trajs total Number :' , trajs.length )

	/*  1. 点聚类 Clustering  */
	let points = []
	for(let i = 0;i < trajs.length;i++){
		let traj = trajs[i]
		for(let j = 0; j < traj.length;j++)
			points.push( traj[j] )
	}
	console.log('Trajs Points total Number :' ,points.length )
	const { 
		groups,
		grid 
	} =  clusterModule.clustering( points , maxRadius )

	console.log( groups[0] , grid )


	/*  2. Voronoi Partition */
	tessilationModule.partition( groups , grid )



	/*  3. Trajectory Segmentation */
	let trajsSegments = segment.segmentTrajs( 
	  trajs,  groups,  grid
	)

	let IG  = graph.main( trajs , groups )
	graph.filter( IG['nodes'] , IG['edges'] , groups  )
	// console.log( IG )
	// console.log( trajsSegments )

	return {
		graph : IG,
		groups,
		grid
	}

	/* 5. K-Anomity */
	// let anonyTrajs = anonymity.kamRec(trajsSegments , kValue , pVaule ) 

	/* 6. Utility Statics  */
	// let statics = voronoisStatics( trajsSegments , util.buildSet( ) )
	// let vectors = traj2Vector( anonyTrajs , util.buildSet( groups )  )
	
	// console.log(  anonyTrajs )
	// console.log( vectors )

	/* 7. Format Return Data */
	// return {
	// 	voronois : _voronoisGetter( groups ),
	// 	vectors : _vectorsGetter( vectors , util.buildSet(groups) )
	// }
}


function genePoints( points , params ){
	if( !params )  return
	let {  
		innerRadius = 1,
		outerRadius = 2,
		k = 5
	} = params

	// console.log( innerRadius , outerRadius , k )

	// Step 1  聚类
	const { 
		groups,
		grid 
	} =  clusterModule.clustering( points , innerRadius )

	let lastGroups = groups ,
		newGroups 
	let lastGroupsNum = groups.length,
		curGroupsNum = 0

	// Step 2  合并聚类
	// console.log("initial groups" , groups)
	let iteration = 1
	while( lastGroupsNum != curGroupsNum ){
		lastGroupsNum = lastGroups.length
		tessilationModule.partition( lastGroups , grid )
		newGroups = clusterModule.join( lastGroups  , outerRadius , k )
		curGroupsNum =  newGroups.length
		lastGroups = newGroups
		// console.log("iteration", iteration++ )
	}
	// console.log("final groups" , lastGroups)

	// Step 3  删除找不到能够合并的（或合并不满足条件）
	clusterModule.clearMembersBelowK( lastGroups, k )
	console.log( groups )
	console.log( lastGroups )
	return lastGroups
}


const _voronoisGetter = ( groups ) =>  groups.map(( g )=> {
	return {
		...g['voronoi'] ,
		centroid : g['centroid']['point'],
	}
})

const _vectorsGetter = ( vectors , map ) => vectors.map((v)=>{
	return {
		...v,
		fromPoint : map.get(v['from'])['centroid']['point'],
		toPoint : map.get(v['to'])['centroid']['point']
	}
})


function traj2Vector(trajs , map ){
	console.log( trajs , map)

	let vectorsMap = new Map()

	for(let i = 0;i < trajs.length;i++){
		let traj = trajs[i]['sequence']
		let support = trajs[i]['support']

		if(traj.length <= 1) continue
		
		let lastP = traj[0]
		for(let j = 1;j < traj.length;j++){
			let curP = traj[j]

			let v = map.get(lastP)
			let neighbors = v['voronoi']['adjacents']
			if( neighbors.indexOf(curP) == -1) continue  // 不在邻近的点

			let key = lastP + ',' + curP    // lastP -> curP
			let value = vectorsMap.get(key)
			if(value)
				value += support
			else
				value = support

			vectorsMap.set( key , value )
		}
	}

	// console.log(vectorsMap)
	let vectors = [] 
	for(let [key, value] of vectorsMap){
		let from = parseInt(key.split(',')[0]),
			to = parseInt(key.split(',')[1])
		vectors.push({
			from , 
			to ,
			support : value
		})
	}
	// console.log( vectors  )
	return vectors
}


// 通过序列计算区域的轨迹情况
function voronoisStatics( vectors , groupsMap ){
	
	console.log(vectors , groupsMap)
	let  vectorStatics = new VectorStatics()

	let i = 0,
		n = vectors.length,
		vector 

	for(i = 0 ;i < n;i++){
		vector = vectors[i]
		let j,
			m = vector.length,
			last , cur 
		for(j = 1;j < m;j++){
			last = vector[ j -1 ]
			cur  = vector[ j ]
			vectorStatics.add( last , cur)
		}
	}

	return vectorStatics.get()

	function VectorStatics(){
		this.statics = new Map()
		this.add = ( from , to) => {
			let fromObj = this.statics.get( from )
			if( !fromObj )  fromObj =  { 'in' : 0 , 'out' : 0 }
			let toObj = this.statics.get( to )
			if( !toObj )  toObj =  { 'in' : 0 , 'out' : 0 }

			fromObj['out'] += 1
			toObj['in'] += 1

			this.statics.set( from  , fromObj)
			this.statics.set( to  , toObj)  
		}
		this.get = ()=>{
			return Array.from( this.statics , (obj )=>{
				let id = obj[0]
				let memberPoints = groupsMap.get( id )['members']
				let sumDist = memberPoints.reduce( (sum , p) => {
					return sum += p['toCentroidDist']
				}, 0 )
				// console.log( memberPoints , sumDist)
				return {
					id,
					...obj[1],
					sumDist,
					'meanDist' :  sumDist == 0 ? 0 : sumDist / memberPoints.length
				}
			})
		}
	}
}






module.exports = {
	geneTrajs,
	genePoints,
	pointsSpatialPartition,
	trajsSpatialPartition,
	informationGraph,
	pointsInformationGraph
}





















