const d3Delaunay = require("d3-delaunay")



class Voronoi{
	constructor( belongGroupId , polygon ){
		this.belongGroupId = belongGroupId
		this.polygon = polygon
		this.adjacents  = []
		this.id = belongGroupId
	}

	getId(){
		return this.id 
	}
	setAdjacentIds( ids ){
		this.adjacents = ids
	}
}

let _bboxGetter = ( grid ) => {
	let b = grid['bounds']
	return [ b['xMin'] , b['yMin'] , b['xMax'] , b['yMax'] ]
}

/*
	Main Function
*/
function partition( groups , grid  ){
	const bbox = _bboxGetter( grid )
	let voronois = _generateVoronois( groups , bbox )
	// console.log( groups )
}


let _centroidGetterFromGroup = ( group ) => group['centroid']['point']
let _lngGetter = ( group )  =>  _centroidGetterFromGroup( group )['lng']
let _latGetter = ( group )  =>  _centroidGetterFromGroup( group )['lat']

function _generateVoronois( groups , bbox ){
	const delaunay = d3Delaunay.Delaunay.from( groups , _lngGetter , _latGetter ) 
	const voronois = delaunay.voronoi(bbox)
	const polygons = Array.from(voronois.cellPolygons())

	// console.log( polygons , voronois )
	let i,
		n = groups.length,
		neighbors,group,voronoi,
		myVoronois = []

	for(i=0;i<n;i++){
		neighbors = Array.from( voronois.neighbors(i) )
		group = groups[i]
		voronoi = new Voronoi( group['id'] , polygons[i] )
		neighborGroups = neighbors.map((idx)=> groups[idx])
		voronoi.setAdjacentIds(  neighborGroups.map((group) => group['id']) )
		myVoronois.push( voronoi )

		group['voronoi'] = voronoi // 侵入
	}
	// console.log(myVoronois)
	return myVoronois
}


module.exports = {
	partition 
}