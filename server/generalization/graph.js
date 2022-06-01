const util = require('./util')
const cluster = require('./cluster')
const tessilationModule = require('./tessilation')

/*
	将一天的时间平均分成 n 块 ; 单位 分钟
	n * minutesInterval = 24 * 60
*/
class TimeSlot{
	constructor( minutesInterval = 10 ){
		this.minutesInterval = minutesInterval
		this.n = Math.ceil( 24 * 60 / minutesInterval )
		this.idxs = this.makeIndexs( this.n )
	}
	/* idx:0  =>  0:00 ~ 0:10 */
	makeIndexs(n){
		let idxs = []
		for(let i = 0;i < n;i++){
				idxs.push(i)
		}
		return idxs
	}
	/* time : "2014-01-14 01:00:12"  =>  idx : 6*/
	getIdx( time ){
		let reg = /(\d\d):(\d\d):(\d\d)/
		let match  = time.match(reg)
		if( !match) return -1
		let hour = parseInt( match[1] )
		let minute = parseInt( match[2] )
		return Math.floor( (hour * 60 + minute) / this.minutesInterval )
	}
	getIdxs( [start,end] ){
		let startIdx = this.getIdx(start),
			endIdx = this.getIdx(end)
		let idxs = []
		for(let i = startIdx;i <= endIdx;i++){
			idxs.push( i )
		}
		return idxs
	}
	getTimeRange(idx){
		if(idx<0 || idx>this.n){
			console.error('idx out of range')
			return
		}
		let start = this._getTimeRange(idx)
		let end = this._getTimeRange(idx+1)
		let res = `[ ${start} ~ ${end} )`
		console.log(res)
	}
	_getTimeRange( idx ){
		let minutes = idx * this.minutesInterval
		let hour = Math.floor( minutes / 60 )
		let minute = minutes % 60
		hour = hour > 9 ? `${hour}` : `0${hour}`
		minute = minute > 9 ? `${minute}` : `0${minute}`
		return `${hour}:${minute}:00`
	}
}	

class GraphNode{
	constructor(psr , t ,count = 1){
		this.psr =  psr
		this.t =  t 
		this.id = GraphNode.makeId(psr , t)
		this.edges = {
			from : new Set(),  // this -> others
			to : new Set()  // others -> this
		}
		this.count = count
	}
	add(count = 1){
		this.count+= count
	}
	static resolveId( psrt ){
		let arr = psrt.split(',')
		return { 
			psr : parseInt( arr[0] ),
			t : parseInt( arr[1] )
		}
	}
	static makeId(psr , t ){
		return `${psr},${t}`
	}
	addEdge( edge ){
		if( edge['start'] == this.id ){
			this.edges['from'].add( edge['end'] )
		}else{
			this.edges['to'].add( edge['start'] )
		}
	}
}
class GraphEdge{
	constructor( startNodeId , endNodeId , count = 1){
		this.start = startNodeId
		this.end = endNodeId
		this.id = GraphNode.makeId(startNodeId,endNodeId)
		this.count = count
	}
	static makeId(startId , endId ){
		return `${startId};${endId}`
	}
	add( count = 1){
		this.count += count
	}
}
class Graph{
	constructor(){
		this.nodes = new Map()
		this.edges = new Map()
	}
	add( psr1, t1, psr2, t2 , count = 1){  // 1 => 2
		// console.log( psr1, t1, psr2, t2 )
		let nodeId1 = GraphNode.makeId(psr1,t1)
		let nodeId2 = GraphNode.makeId(psr2,t2)
		let node1 = this.nodes.get( nodeId1 )
		let node2 = this.nodes.get( nodeId2 )
		if(node1){
			node1.add(count)
		}else{
			node1 = new GraphNode(psr1 ,t1,count)
			this.nodes.set(nodeId1 , node1)
		}
		if(node2){
			node2.add(count)
		}else{
			node2 = new GraphNode( psr2 ,t2 ,count)
			this.nodes.set(nodeId2 , node2)
		}
		let edgeId = GraphEdge.makeId( nodeId1,nodeId2 )
		let edge = this.edges.get( edgeId )
		if(edge){
			edge.add(count)
		}else{
			edge = new GraphEdge(nodeId1 , nodeId2,count)
			this.edges.set(edgeId , edge)
		}
		node1.addEdge( edge )
		node2.addEdge( edge )
	}
	getNodes(){
		return Array.from( this.nodes , ([id,node])=> {
			let { psr, t, edges, count } = node
			edges = {
				'from' : [...edges['from']],
				'to'   : [...edges['to']]
			}
			return {
				psr,
				t,
				edges,
				count
			}
		})
	}
	getEdges(){
		return Array.from( this.edges , ([id,edge])=> {
			let { start, end, count } = edge
			return {
				start,
				end,
				support : count 
			}
		})
	}
}

/******************************
		main 
******************************/
function buidIGTrajs( trajs , groups  , timeInterval){
	// console.log( trajs , groups)
	console.log('start Graph...')
	console.time('Graph')
	let groupSet = util.buildSet( groups )
	let t = new TimeSlot( timeInterval )
	let g = new Graph()

	let i,j,
		n = trajs.length , m,traj,
		lastP , lastT , lastV,
		curtP , curtT , curtV

	for(i = 0; i < n ;i++){
		traj = trajs[i]
		m = traj.length

		lastP = traj[0]
		lastV = _getPsVoronoiId( lastP , groupSet )
		lastT = t.getIdx( lastP['time'] )

		for(j = 1;j < m;j++){
			curtP = traj[j]
			curtV = _getPsVoronoiId( curtP ,groupSet )
			curtT = t.getIdx( curtP['time'] )

			g.add( lastV , lastT , curtV ,curtT )

			lastV = curtV
			lastT = curtT
		}
	}
	let edges = g.getEdges()
	let nodes = g.getNodes()
	let sum = edges.reduce((sum,edge)=> sum+=edge['support'] , 0)
	console.timeEnd('Graph')
	return { nodes,edges }
}

function buidIGPoints(points , groups , timeInterval ){
	let groupSet = util.buildSet( groups )
	let t = new TimeSlot( timeInterval )
	let g = new Graph()

	let i,m = points.length,point,
		curtV,curtT

	// console.log( points)
	// return
	for(i = 0;i < m;i++){
		point = points[i]
		curtV = _getPsVoronoiId( point , groupSet )
		curtT = t.getIdx( point['time'] )
		g.add( curtV , curtT , curtV ,curtT )
	}
	let edges = g.getEdges()
	let nodes = g.getNodes()
	let sum = edges.reduce((sum,edge)=> sum+=edge['support'] , 0)
	// console.log(sum)
	// console.log( edges,nodes )
	return { nodes,edges }
}


function filter(nodes, edges , groups , region , timeRange , timeInterval){
	// console.log("filter", region ,timeInterval)
	nodes = filterNodes( nodes , groups , region , timeRange , timeInterval)
	edges = filterEdges( nodes, edges)
	let subGraph = combineNodeAndEdge( nodes , edges )
	return subGraph
}

	
function anonymity( nodes , edges , groups ,  k = 5  , maxRadius = 2 ,grid) {
	
	let iteration = 1,
		lastGroups = groups,
		newGroups,
		lastGroupNum = groups.length,
		curGroupNum = 0,
		join 

	// console.log( iteration , lastGroups , nodes ,edges )
	while( lastGroupNum != curGroupNum ){
		lastGroupNum = lastGroups.length
		tessilationModule.partition( lastGroups , grid )
		join = _joinGroup( nodes , edges , lastGroups , k , maxRadius)
		newGroups = join['groups']
		nodes = join['nodes']
		edges = join['edges']
		console.log(edges)
		curGroupNum = newGroups.length
		lastGroups = newGroups
		iteration++
	}
	tessilationModule.partition( lastGroups , grid )

	console.log( iteration , lastGroups , nodes ,edges )
	return {
		groups : lastGroups,
		nodes,
		edges
	}
	// console.log( iteration , lastGroups , nodes ,edges )
}
function _joinGroup(nodes , edges , groups , k , maxRadius ) {
	nodes = nodes.map((node) =>{
		node['id'] = node['psr']
		return node 
	})
	let i , n = nodes.length,
		node , count , group , 
		joinGroupId , joinGroup, joinNode , 
		groupsSet = util.buildSet( groups )
		nodeSet = util.buildSet( nodes )

	// console.log( groupsSet )
	for(i = 0;i < n;i++){
		node = nodes[i]
		group = groupsSet.get( node['psr'] )
		if(!group){
			// console.log( node , groups )
			continue
		}
		count = node['count']
		if( count < k){
			joinGroupId = _findAdjacentGroupWhichCanbeJoined(group, node , groupsSet , nodeSet , k , maxRadius )
			if(joinGroupId != null) break
		}
	}
	if( joinGroupId ){
		// console.log("ID" , joinGroupId , node['id'])
		groups = groups.filter((g) => ( g['id']!=group['id'] && g['id']!=joinGroupId ))
		joinGroup = groupsSet.get( joinGroupId )
		let newGroup = new cluster.Group()
		newGroup.addPoints( group['members'].concat( joinGroup['members'] ) )
		groups.push( newGroup )

		joinNode = nodeSet.get( joinGroupId )
		let newPSR = newGroup['id']
		// console.log("New ID" , newPSR)
		let fromPSRs1 = node['edges']['from'].map((psr) => parseInt(psr.split(',')[0]))
		let fromPSRs2 = joinNode['edges']['from'].map((psr) => parseInt(psr.split(',')[0]))
		let toPSRs1 = node['edges']['to'].map((psr) => parseInt(psr.split(',')[0]))
		let toPSRs2 = joinNode['edges']['to'].map((psr) => parseInt(psr.split(',')[0]))
		let fromPSRs = fromPSRs1.concat(fromPSRs2)
		let toPSRs = toPSRs1.concat(toPSRs2)
		edges = edges.map((edge)=>{
			let { start, end ,support } = edge
			if( fromPSRs.indexOf(end) != -1){
				start = newPSR
			}
			if( toPSRs.indexOf(start) != -1){
				end = newPSR
			}
			return {
				start,
				end,
				support
			}
		})
		nodes = nodes.filter((_node) => (_node['psr'] != node['psr'] && _node['psr']!=joinNode['psr']))
		nodes.push({
			count : node['count'] + joinNode['count'],
			edges : {
				from : node['edges']['from'].concat( joinNode['edges']['from'] ),
				to : node['edges']['to'].concat( joinNode['edges']['to'] ),
			},
			psr : newPSR,
		})
	}

	return {
		nodes,
		edges,
		groups
	}
}
const _getNodeCount = (node) => ( node['edges']['from'].length + node['edges']['to'].length )

function _findAdjacentGroupWhichCanbeJoined( group , node ,  groupSet , nodeSet ,k ,  maxRadius ){
	const { adjacents } = group['voronoi']
	let options = [],
		adjacentGroup,
		adjacentNode 

	adjacents.map((id)=>{
		adjacentGroup = groupSet.get(id)
		adjacentNode = nodeSet.get(id)
		if(!adjacentGroup || !adjacentNode )
			return true
		options.push({
			dist : util.spatialDistance(
				group.getCenroid()['point'],
				adjacentGroup.getCenroid()['point']
			),
			sum :  node['count'] +  adjacentNode['count'],
			adjacentGroupId : id 
		})
	})
	options.sort((a,b) =>  a['dist'] - b['dist'])
	for(let i=0;i < options.length;i++){
		let { dist,sum , adjacentGroupId } = options[i]
		if( dist <= maxRadius && sum >= k )
			return adjacentGroupId
	}
	return null
}


let defaultRegion = {
	lngMin : 120.59829097400781,
	lngMax : 120.73082637085011,
	latMin : 27.95320128009288,
	latMax : 28.024161225902056
}
/*
[120.64536850942632, 28.02777891223006]
[120.70138644470246, 28.02777891223006]
[120.70138644470246, 27.99436199860011]
[120.64536850942632, 27.99436199860011]
[120.64536850942632, 28.02777891223006]
*/
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
let defaultTimeRange = [
	'Sat Jan 01 2000 04:16:25 GMT+0800 (中国标准时间) ',
	'Sat Jan 01 2000 12:00:00 GMT+0800 (中国标准时间)'
]

function filterNodes(nodes, groups, region , timeRange ,  timeInterval ){
	// console.log("filter nodes" , nodes, groups, region , timeRange ,  timeInterval  )
	if(region) region = _regions2bounds( region )
	// filter in spatial 
	let filterGroups = region ? groups.filter((group)=>{
		return util.isGroupWhthinBounding(group , region)
	}) : groups
	let filterGroupsIds = filterGroups.map((group)=>group['id'])

	// filter in temporal
	const isInRange = timeRange ? (()=>{
		let ts = new TimeSlot( timeInterval )
		let filterTimeSlots = ts.getIdxs( timeRange )
		return ( {psr,t} ) => {
			return ( filterGroupsIds.indexOf( psr ) != -1 
				 && filterTimeSlots.indexOf( t ) != -1 )
		}
	})() : () => true  // timeRange == undefined 为无限制

	let filteredNodes = nodes.filter((node)=>{
		let isRetain = isInRange( node )
		if(isRetain){
			let { edges } = node
			let { from,to } = edges
			from = from.filter((nodeIdStr) => isInRange( GraphNode.resolveId(nodeIdStr) ) )
			to = to.filter((nodeIdStr) => isInRange( GraphNode.resolveId(nodeIdStr) ) )
			node['edges'] = { from,to }

			if( from.length + to.length == 0 )
				isRetain = false
		}
		return isRetain
	})
	return filteredNodes
}
function filterEdges(nodes, edges){
	let filteredEdges = [],
		filteredEdge, edgeId 

	let edgesMap = util.buildSet( edges.map((edge)=>{
		let { start,end } = edge
		edgeId = GraphEdge.makeId( start,end )
		return {
			...edge,
			id : edgeId
		} 
	}))
	nodes.map((node)=>{
		let { psr,t,edges }  = node
		let nodeId = GraphNode.makeId( psr , t )
		let { from,to } = edges
		from.map((endNodeId)=>{
			edgeId = GraphEdge.makeId( nodeId , endNodeId )
			filteredEdge = edgesMap.get( edgeId )
			if(filteredEdge)
				filteredEdges.push( filteredEdge )
			else
				console.error('cant find')
		})
		to.map((startNodeId)=>{
			edgeId = GraphEdge.makeId( startNodeId , nodeId )
			filteredEdge = edgesMap.get( edgeId )
			if(filteredEdge)
				filteredEdges.push( filteredEdge )
			else
				console.error('cant find')
		})
	})
	return filteredEdges
}
// combine with same PSR
function combineNodeAndEdge(nodes,edges){
	let edge ,edgeId,nodeId

	let edgesMap = util.buildSet( edges.map((edge)=>{
		let { start,end } = edge
		edgeId = GraphEdge.makeId( start,end )
		return {
			...edge,
			id : edgeId
		} 
	}))
	let subGraph = new Graph
	for(let i=0;i<nodes.length;i++){
		let { psr, t, edges } = nodes[i]
		nodeId =  GraphNode.makeId( psr , t )
		let { from } = edges
		from.map((endNodeId)=>{
			let { psr:psr2  } = GraphNode.resolveId( endNodeId )
			edgeId = GraphEdge.makeId( nodeId , endNodeId )
			edge = edgesMap.get( edgeId )
			subGraph.add( psr, 0 , psr2, 0 , edge['support'] )
		})
	}
	edges = subGraph.getEdges()
	nodes = subGraph.getNodes()
	edges = edges.map((edge)=>{
		// console.log( edge )	
		let { start, end, support } = edge
		start = GraphNode.resolveId( start  )['psr']
		end =  GraphNode.resolveId( end )['psr']
		return {
			start,end,support
		}
	})
	// let sum = edges.reduce((sum,edge)=> sum+=edge['support'] , 0)
	// console.log(sum)
	// console.log('combine',nodes,edges)
	return { nodes,edges }
}


function _getPsVoronoiId( p  , groupSet ){
	let { belongGroupId } = p
	let group = groupSet.get( belongGroupId )
	if( group == undefined || group == null ){
		console.error(`cant find point's voronois`)	
		return null
	}
	return group['voronoi']['id']
}

function test(argument) {
	let t = new TimeSlot(30)
	t.getTimeRange(0)
}

module.exports = {
	test ,
	buidIGTrajs,
	buidIGPoints,
	filter,
	anonymity
}