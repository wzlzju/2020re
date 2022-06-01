const util = require('./util.js')
const turf = require('@turf/turf')

class Grid{
	constructor( maxRadius ){
		this.bounds = {
			xMin: undefined,
			xMax: undefined,
			yMin: undefined,
			yMax: undefined	
		}
		this.maxRadius = maxRadius ? maxRadius : 0
		this.cells = [] 
		this.nRows = 0   
		this.nColumns = 0
	}
	init( points ){
		let n = points.length
		if(n < 1) return
		let { lng ,lat } = points[0]

		// 计算 bounds 
		let xMin = lng ,
			xMax = lng ,
			yMin = lat ,
			yMax = lat 
		for(let i = 1;i < n;i++){
			let { lng,lat } = points[i]
			xMin = 	( lng < xMin ) ? lng : xMin
			xMax = 	( lng > xMax ) ? lng : xMax
			yMin = 	( lat < yMin ) ? lat : yMin
			yMax = 	( lat > yMax ) ? lat : yMax
		}
		this.bounds = { xMin,xMax,yMin,yMax }

		// 初始化 cells 
		let rightTop = { 'lng':xMax ,'lat':yMax }
		let [ nColumns , nRows ] = this.getPosition( rightTop )
		nColumns += 1
		nRows += 1

		//  过大的 nColumns 和 nRows 会造成 out-of-memory  crash 
		//  可提前退出
		// console.log( nColumns , nRows)

		for(let k = 0;k <= nColumns;k++){
			this['cells'][k] = []
			for(let m =0;m <= nRows ;m++){
				this['cells'][k][m] = []
			}
		}
		this.nRows = nRows
		this.nColumns = nColumns

		// console.log( nColumns , nRows)
	}
	getPosition( p ){
		if(!p || p['lat'] == undefined || p['lng'] == undefined){
			console.error('params err')
			return [0,0]
		}
		let { maxRadius,bounds } = this
		if( maxRadius <= 0 || maxRadius == undefined || !bounds || bounds['xMin'] == undefined){
			console.error('inner props err')
			return [0,0]
		}
		return this._getGridPosition(p)
	}
	/*
		x => lng , y => lat
		// lnglat
		(xMin,yMax) ----- (xMax,yMax)
			|                 |
			|                 |
			|                 |
			|                 |
		(xMin,yMin) ----- (xMax,yMin)
		// idx
		( 0, j) - - - - - ( i, j)
		   |                 | 
		   |                 |
		   |                 |
		   |                 |
		( 0, 0) - - - - - ( i, 0)

		// todo 计算正方形经纬度误差
	*/
	_getGridPosition( p ){
		let { maxRadius,bounds } = this
		let xDistance = util.spatialDistance( { 'lng': p['lng'] , 'lat' : bounds['yMin'] } , { 'lng':bounds['xMin'] , 'lat': bounds['yMin'] } )
		let yDistance = util.spatialDistance( p , { 'lng':p['lng'] , 'lat': bounds['yMin'] } )
		let i = Math.floor( xDistance / maxRadius )
		let j = Math.floor( yDistance / maxRadius )
		return [i,j]
	}
	getCell( i , j ){
		let { nColumns , nRows } = this
		if( i > nColumns || j > nRows || i < 0 || j < 0){
			console.error('getCell error ' , i , j )
			return []
		}
		return this['cells'][i][j]
	}
	addCentoridToCell( centroid ){
		let { point } = centroid
		let position = this.getPosition( point )
		let [ i , j ] = position
		this.getCell(i , j)

		try{
			this['cells'][i][j].push( centroid )
		}catch{
			console.error('getCell error' , point , position ,  this )
		}
		centroid.updatePosition( position )
	}
	printCells(){
		let { nColumns , nRows } = this
		let i ,j 
		let availableCells = []
		for(i = 0;i < nColumns; i++){
			for(j = 0;j < nRows; j++){
				let cell = this.getCell(i ,j )
				if(cell.length > 0)
					availableCells = availableCells.concat( cell )
			}	
		}
		console.log( availableCells )
	}
}

var idBase = 0
class Group{
	constructor( member ){
		this.id = idBase++
		this.members = []
		this.centroid = new Centroid( this.id )
		if(member) this.addPoint( member )
	}
	addPoint( point ){
		this.members.push( point )
		let centroidPoint = util.getCentroid( this.members )
		this.centroid.update( centroidPoint )
	}
	addPoints( points ){
		this.members = this.members.concat( points )
		let centroidPoint = util.getCentroid( this.members )
		this.centroid.update( centroidPoint )
	}
	injectIdToMemberPoint(){
		this.members.map((p)=>{
			p['belongGroupId'] = this.id
		})
	}
	getCenroid(){
		return this.centroid
	}
	clearMembers(){
		this.members = []
	}
}


class Centroid{
	constructor( belongGroupId ){
		this.belongGroupId = belongGroupId
		this.point = null
		this.position = [ 0 ,0 ]  // cell position
	}
	update( p ){     // { lng,lat }
		this.point = p
	}
	updatePosition( position ){   // [i , j]
		this.position = position
	}
}


/*
	Main Function
************************************
Input : 	
	points:[{
		lng: 120.6130218506
		lat: 27.9677295685
		time: "2014-01-14 00:00:12"
		belongGroupId: 0
	}]
	maxRadius: 3
**********************************
Output :
	groups:[{
		id : 0
		members: []
		centroid:{
			belongGroupId: 0,
			point: {
				lng: 120.621547699,
				lat: 27.9673547745
			}
			position: [21, 48]
		},
		voronoi:{
			belongGroupId: 0
			polygon: [Array(2), Array(2), Array(2), Array(2), Array(2), Array(2), Array(2)]
			adjacents: [136, 25, 1, 26, 55, 53]
			id: 0
		}
	}],
	grid:{
		bounds: {
			xMin: 120.4071273804,
			xMax: 120.8490524292,
			yMin: 27.5287208557,
			yMax: 28.1678504944
		},
		maxRadius: 3
		cells: []
		nRows: 72
		nColumns: 44
	}
*/
function clustering( points , maxRadius) {
	idBase = 0
	points = _filterPointsInBounds( points )

	maxRadius = maxRadius ? maxRadius : 1

	console.log('Start Clustering...')
	console.time('Clustering')

	const grid = new Grid( maxRadius )
	grid.init(points)
	const groups = [] , groupSet = new Map()

	let i , n = points.length , p
	for(i = 0;i < n;i++){
		p = points[i]
		_putInProperGroup( p , groups , groupSet , grid)
	}
	// console.log( groups )
	// grid.printCells()

	groups.map((g) => g.injectIdToMemberPoint())

	console.timeEnd('Clustering')

	return { groups , grid }
}


/*
	合并两个 Group
*/
function join( groups  , maxRadius , K ){
	// console.log( groups )
	let i,
		n = groups.length,
		group,
		members,
		joinGroupId,
		joinGroup

	let newGroups = [],
		groupSet = util.buildSet( groups )

	for(i=0;i<n;i++){
		group = groups[i]
		members = group['members']
		if( members.length < K ){
			joinGroupId =  _findAdjacentGroupWhichCanbeJoined( group , groupSet , maxRadius , K )
			// console.log( joinGroupId )
			if(joinGroupId != null) break
		}
	}
	if( joinGroupId ){
		newGroups = groups.filter((g) =>  (g['id']!=group['id'] && g['id']!=joinGroupId) )
		joinGroup = groupSet.get( joinGroupId )
		let newGroup = new Group()
		newGroup.addPoints( group['members'].concat( joinGroup['members'] ) )
		newGroups.push( newGroup )
		// console.log( group , joinGroupId )
	}else{
		newGroups = groups
	}
	return newGroups
}
function _findAdjacentGroupWhichCanbeJoined( group , groupSet , maxRadius , k ){
	const { adjacents } = group['voronoi']
	let options = [],
		adjacentGroup 

	adjacents.map((id)=>{
		adjacentGroup = groupSet.get(id)
		options.push({
			dist : util.spatialDistance(
				group.getCenroid()['point'],
				adjacentGroup.getCenroid()['point']
			),
			sum :  group['members'].length + adjacentGroup['members'].length,
			adjacentGroupId : id 
		})
	})
	options.sort((a,b) =>  a['dist'] - b['dist'])
	// console.log(options)
	for(let i=0;i < options.length;i++){
		let { dist,sum , adjacentGroupId } = options[i]
		if( dist <= maxRadius && sum >= k )
			return adjacentGroupId
	}
	return null
}


function clear(groups , K ){
	return groups.map((group)=>{
		if( group['members'].length < K)
			group.clearMembers()
	})
}


/*
	辅助函数
*/
const preDefinedBounds = {
	'latMax' : 50 ,
	'latMin' : 20,
	'lngMax' : 130 ,
	'lngMin' : 100 ,
}
function _filterPointsInBounds( points ){
	let i , n = points.length , point

	let filteredPoints = []
	
	for(i = 0;i < n ;i++){
		point = points[i]
		if( util.isWithinBouding(point , preDefinedBounds) )
			filteredPoints.push( point )
	}
	return filteredPoints
}

function _putInProperGroup( p , groups , groupSet , grid ){
	let centroid = _getClosestCentroid( p , grid )
	let group

	if( centroid == null ){
		group = new Group( p )
		groups.push( group )
		groupSet.set( group['id'] , group )
		// console.log( group , groupSet)
	}else{
		let { position,belongGroupId } = centroid
		let [ i,j ] = position  // origin centroid position 
		// console.log( belongGroupId , groupSet )
		group = groupSet.get( belongGroupId )
		group.addPoint( p )  // centroid will update
		let cell = grid.getCell(i , j)
		grid['cells'][i][j] = cell.filter((centroid)=>  centroid['belongGroupId'] != belongGroupId )
	}

	centroid = 	group.getCenroid()
	grid.addCentoridToCell( centroid )

}

function _getClosestCentroid( p , grid ){
	let [ i ,j ] = grid.getPosition( p )
	let { nRows,nColumns } = grid

	let k,kMax,kMin, m,mMax,mMin
	kMax = ( i+1 > nColumns ) ? nColumns : i+1
	kMin = ( i-1 < 0 ) ?  0 : i-1
	mMax = ( j+1 > nRows ) ? nRows : j+1
	mMin = ( j-1 < 0 ) ?  0 : j-1


	let cellArr ,
		centroidsInCircle = [] // { centroid , dist }

	for(k = kMin ; k <= kMax ;k++){
		for(m = mMin ;m <= mMax;m++){
			cellArr = grid.getCell(k ,m)
			_findCentroidsWithCircle( p , cellArr , centroidsInCircle , grid['maxRadius'] )
		}
	}

	if(centroidsInCircle.length == 0 )  return null
	centroidsInCircle.sort((a,b)=> a.dist - b.dist)  // 升序
	return centroidsInCircle[0]['centroid']
}
function _findCentroidsWithCircle( p ,  cellArr , centroids , circleRadius ){
	if(cellArr.length <= 0) return
	cellArr.map(( centroid )=>{
		let dist = util.spatialDistance(p , centroid['point'])
		if( dist <= circleRadius ){  //按照 maxRadius 为半径画圆
			centroids.push({
				centroid,
				dist
			})
		}
	})
}
	



module.exports = {
	clustering ,
	join,
	clearMembersBelowK : clear,
	Group
}