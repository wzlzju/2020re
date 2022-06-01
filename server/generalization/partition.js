const turf = require('@turf/turf')

const util = require('./util')

const d3Delaunay = require("d3-delaunay")

// https://github.com/datavis-tech/graph-data-structure#creating-a-graph
const Graph = require("graph-data-structure")


let idBase = 0
function Voronoi( groupId ,  polygon , neighbors ){
	this.groupId = groupId
	this.polygon = polygon
	this.neighbors = neighbors 
	this.id = idBase++

	this.getId = function(){
		return this.id
	}
}

/* 按照 分组对象 及 边界对象 对区域进行划分
*
* @param groupSet {Array}
* 		@param group {Object}
* 			@param id {Int}
* 			@param centroid {Object}
* 				@param belongsGroupId {Int}
* 				@param p {Object}   point lnglat
* 			@param members {Array}
* 				@param p {Object}  point lnglat time
* @param grid {Object}
*		@param bound {Object}
*		@param cells {Ayyay}
*		@param ...
*
* @return voronoiSet {Array}
*		@param voronoi {Object}
*			@param id {Int}
*			@param groupId {Int}
*			@param polygon {Array}
*				@param p {Objet}  point lnglat
*/
function partition( groupSet , grid ){
	idBase = 0
	let centroidPointsArr = groupSet.map((g) => g['centroid']['p'] )
	let b = grid['bound']
	let bbox = [ b['xMin'] , b['yMin'] , b['xMax'] , b['yMax'] ]
	let voronoiPolygons =  _getVoronoi(centroidPointsArr , bbox )

	let neighborGraph = new Graph()


	let voronoiSet  = voronoiPolygons.map(( voronoi , i)=>{
		voronoi['neighbors'].map((n)=>{
			// neighborGraph.addNode(i)
			// neighborGraph.addNode(n)
			neighborGraph.addEdge(i , n)
			neighborGraph.addEdge(n , i)
		})
		return new Voronoi( groupSet[i]['id'] ,voronoi['polygon'] , voronoi['neighbors'] )
	})

	console.log(neighborGraph.serialize())
	return { 
		voronois : voronoiSet,
		voronoisGraph: neighborGraph
	} 
}


/*
	find group's  voronoi , build connetion between these two set
*/
function _findGroupsVoronoi( groupSet , voronoiPolygons ){
	let n = groupSet.length,
		g , v ,
		newVoronoi,
		voronoiSet = []

	for(let i = 0; i < n; i++){
		g = groupSet[i]
		for(let j = 0;j < n; j++){
			let polygon = voronoiPolygons[j]
			if(polygon == -1 || polygon == undefined) continue
			if( util.isPointWithinPolygon( g['centroid']['p'] , polygon) ){
				newVoronoi = new Voronoi( g['id'] ,polygon )
				voronoiSet.push( newVoronoi )
				g['voronoiId'] = newVoronoi.getId()
				voronoiPolygons[j] = -1
				break
			}
		}
	}
	return voronoiSet
}


/*
refer https://github.com/d3/d3-delaunay 

输出 voronoiPolygons 以及 邻近的 id

*/
function _getVoronoi(pointsArray , bbox ){
	let delaunay = d3Delaunay.Delaunay.from( pointsArray , p => p['lng'] , p => p['lat'])
	let voronoi = delaunay.voronoi(bbox)
	let polygons = Array.from(voronoi.cellPolygons())

	let voronoiPolygons = []

	for(let i = 0;i < polygons.length;i++){
		let neighbors = Array.from(voronoi.neighbors(i))

		voronoiPolygons.push({
			polygon : polygons[i].map((p)=> { return {'lng':p[0] , 'lat':p[1]} }),
			neighbors
		})
	}
	return voronoiPolygons
}




/* 弃用
refer https://turfjs.org/docs/#voronoi
bbox : [min Longitude , min Latitude , max Longitude , max Latitude]

输出 voronoiPolygons { Array }

function _getVoronoi(pointsArray , bbox){
	// console.log(pointsArray,bbox)
	var options = {
  		// bbox: [-70, 40, -60, 60]
  		bbox
	};
	let fs = pointsArray.map((p)=>  turf.point([ p['lng'],p['lat']]) )
	var features = turf.featureCollection(fs);
	// var features = turf.randomPoint(100, options);
	var voronoiPolygons = turf.voronoi(features, options);

	// console.log( voronoiPolygons['features'] )
	// return voronoiPolygons
	return voronoiPolygons['features'].map((feature)=>{
		return feature['geometry']['coordinates'][0].map((coor)=>{
			return {
				'lng' : coor[0],
				'lat' : coor[1]
			}
		})
	})
}
*/


module.exports = {
	partition
}