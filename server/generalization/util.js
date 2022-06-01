const turf = require('@turf/turf')
const moment = require('moment')
const Graph = require("graph-data-structure")  // https://github.com/datavis-tech/graph-data-structure#creating-a-graph


/* 计算两个点之间的距离 
* @param a {Object} 起点
* 	@param lng {float}
* 	@param lat {float}
* @param b 终点
* 	@param lng
* 	@param lat
* @return {float}
*/
function spatialDistance(a,b){
	var from = turf.point([a['lng'],a['lat']]);
	var to = turf.point([b['lng'],b['lat']]);
	var options = {
		units: 'kilometers'   //单位 千米
	};
	var distance = turf.distance(from, to, options);
	return distance
}


/* 计算 ab , bc 之间的夹角
* @param a {Object}
* 	@param lng {float}
* 	@param lat {float}
* @param b、c
* 	@param lng
* 	@param lat
* @return angle {Number}
*/
function spatialAngle( a ,b ,c){
	let ab = spatialDistance(a,b)
	let bc = spatialDistance(b,c)
	let ac = spatialDistance(c,a)

	// 反余弦函数
	let radians = Math.acos((ab*ab+bc*bc-ac*ac)/(2*ab*bc))
	let degree =  radians * ( 180/ Math.PI );
	return Math.round(degree)
}


/* 查看点 p 是否在 点围成的 polygon 中
*	@param p : point {Object}
* 		@param lng {float}	114.43978062510536
* 		@param lat {float}   38.07268032783493
*	@param polygon {Array}
* 			[{lng ,lat},
*			{lng ,lat},
*			{lng ,lat},
*			{lng ,lat}]
*/
function isPointWithinPolygon( p , polygon ){
	var points = turf.points([
		[ p['lng'],p['lat'] ]
	]);

	var searchWithin = turf.polygon([
		polygon.map((p)=> [p['lng'],p['lat']])
	]);

	var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
	
	if(ptsWithin['features'].length > 0)
		return true
	return false
}

/* 找到一些点的中心点
* @return point {Object}
* 		@param lng {float}	114.43978062510536
* 		@param lat {float}   38.07268032783493
* refer =>  https://turfjs.org/docs/#center
*/
function getCentroid(pointsArray) {
	let fs = pointsArray.map((p)=>  turf.point([ p['lng'],p['lat']]) )

	var features = turf.featureCollection(fs);
	var center = turf.center(features);
	let coor = center.geometry.coordinates
	return {
		'lng' : coor[0],
		'lat' : coor[1]
	}
}


/* 计算时间间隔
* @param ts {String} 开始时间	
* @param te {String} 结束时间	
* @return {float}  
*/
function timeDuration(ts,te){
	let ms = moment(ts)
	let me = moment(te)
	return moment.duration(me-ms).asSeconds()
}



/*
	最长公共子串（连续）
	https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/string/longest-common-substring/longestCommonSubstring.js
*/
function _LCS(string1, string2  ) {
  // Convert strings to arrays to treat unicode symbols length correctly.
  
  const s1 = [...string1];
  const s2 = [...string2];

  // Init the matrix of all substring lengths to use Dynamic Programming approach.
  const substringMatrix = Array(s2.length + 1).fill(null).map(() => {
    return Array(s1.length + 1).fill(null);
  });

  // Fill the first row and first column with zeros to provide initial values.
  for (let columnIndex = 0; columnIndex <= s1.length; columnIndex += 1) {
    substringMatrix[0][columnIndex] = 0;
  }

  for (let rowIndex = 0; rowIndex <= s2.length; rowIndex += 1) {
    substringMatrix[rowIndex][0] = 0;
  }

  // Build the matrix of all substring lengths to use Dynamic Programming approach.
  let longestSubstringLength = 0;
  let longestSubstringColumn = 0;
  let longestSubstringRow = 0;

  for (let rowIndex = 1; rowIndex <= s2.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= s1.length; columnIndex += 1) {
      if (s1[columnIndex - 1] === s2[rowIndex - 1]) {
        substringMatrix[rowIndex][columnIndex] = substringMatrix[rowIndex - 1][columnIndex - 1] + 1;
      } else {
        substringMatrix[rowIndex][columnIndex] = 0;
      }

      // Try to find the biggest length of all common substring lengths
      // and to memorize its last character position (indices)
      if (substringMatrix[rowIndex][columnIndex] > longestSubstringLength) {
        longestSubstringLength = substringMatrix[rowIndex][columnIndex];
        longestSubstringColumn = columnIndex;
        longestSubstringRow = rowIndex;
      }
    }
  }

  if (longestSubstringLength === 0) {
    // Longest common substring has not been found.
    return [];
  }

  // Detect the longest substring from the matrix.
  let longestSubstring = [];

  while (substringMatrix[longestSubstringRow][longestSubstringColumn] > 0) {
    // longestSubstring = s1[longestSubstringColumn - 1] + longestSubstring;
    longestSubstring = [s1[longestSubstringColumn - 1]].concat( longestSubstring )
    longestSubstringRow -= 1;
    longestSubstringColumn -= 1;
  }

  return longestSubstring;
}


function LCS(arr1 , arr2){
    return _LCS(arr1 ,arr2 )
}


function isWithinBouding(p ,bound) {
    let res = ( p['lng'] > bound['lngMin'] && p['lng'] < bound['lngMax'] && p['lat'] > bound['latMin'] && p['lat'] < bound['latMax'] )
    return res
}

function isGroupWhthinBounding( group , bound){
    let { centroid,voronoi } = group
    centroid = centroid['point']
    voronoi = voronoi['polygon'].map((p)=> { return {'lng':p[0] ,'lat':p[1]} })
    if( isWithinBouding( centroid , bound ) ){
      for(let i=0;i<voronoi.length;i++){
          if(!isWithinBouding( voronoi[i] , bound))
            return false
      }
      return true
    }else{
      return false
    }
}

function buildSet( arr ){
  const set = new Map()
  arr.map(( item ) => set.set( item['id'] , item ))
  return set
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


module.exports = {
	spatialDistance,
	spatialAngle,
	isPointWithinPolygon,
	getCentroid,
	timeDuration,
	LCS,
  isWithinBouding,
  isGroupWhthinBounding,
  buildSet,
  builfVoronoiGraph,
  interpolateVoronoi
}