import {  PolygonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core'

import { PathStyleExtension } from '@deck.gl/extensions';

import { hexToRGBArray } from '../../util.js'

import circle from '@turf/circle';

//import Event from '@/util/event'

const turf = require('@turf/turf')

export function createSimulationLayer( subProps ){

	//return new SimulationLayer( subProps )
	console.log('subProps', subProps)

	return new SimulationLayer( {...subProps} )
}

export class SimulationLayer extends CompositeLayer {
	renderLayers() {
		const {region, simulation} = process(this.props['data'])
	    return [
			new PolygonLayer({
			    //id: `${id}-polygon-layer-${this.props['layerId']}`,
				visible :  true, 
			    data : region,
			    pickable: true,
			    stroked: true,
			    filled: true,
			    dashJustified: true,
			    wireframe: true,
			    lineWidthMinPixels: 1,
			    extruded: false,
			    getPolygon: d =>  d,
				/*updateTriggers: {
				    getFillColor: this.props['highLightId']
				},*/
			    getFillColor : d => [229,191,165,180],
			    onHover: ({object, x, y}) => {
			    	if(object){
			    		// console.log( object['id'] , object['neighbors'] )
			    	}
			    },
				lineWidthUnits: 'meters',
				getDashArray: [3, 2],
				extensions: [new PathStyleExtension({dash: true})]
		  	}),
		  	new ScatterplotLayer({
		        data : simulation ,
		        visible: true,
			    getPosition: d => d,
			    getFillColor: [255,255,255,255],
			    getLineColor: [0,0,0,255],
		        getRadius: 100,
			    pickable: true,
			    stroked: true,
			    filled: true,
			    radiusMinPixels: 4,
			    radiusMaxPixels: 100,
			    lineWidthMinPixels: 1,
			    //onHover : info =>  setTooltip(info.object, info.x, info.y)
			})
	   ]
  	}

}

function process(subProps){
  	if(!subProps){
  		console.log('undefined subProps in SimulationLayer')
 		return {region: [], simulation: []}
  	}
  	//console.log('subprops in process', subProps)

  	/*let {
		data = [],
		visible = true,
		radius,
		fillColor,
		strokeColor,
		opacity
	} = subProps*/
	let data = subProps

	//console.log("Data show ...")
	//console.log(data)
	if(data.length == 0){
		return {region: [], simulation: []}
	}
		
	// get the region
    // use a rectangle region to mock
	let pdata = data.map(e => { return e['coordinates']})
	//console.log('pdata[0][0] ',pdata[0][0],typeof(pdata[0][0]))
	//let bounds = pdata.slice(0,100)
	//let bbox = getBbox(bounds)
	let bbox = [120.32995, 120.74305, 27.8644295, 28.224756]
	pdata = pdata.filter(e => isWithinBouding(e,bbox,2))
	let bboxRegionData = getPolygonfromBbox(bbox)

	let sampleLength = 100, iterations = 10, step = 5, factor = 1.2
	console.log('bbox: ', bbox)
	let initPoints = randomPointList(sampleLength,...bbox,1)
	//console.log('init points: ', initPoints)
	let resPoints = simulate(initPoints, pdata, iterations, step, factor)

	data = {}
	data['region'] = [bboxRegionData]
	data['simulation'] = resPoints

	return data
}

function simulate(initPoints, data, iterLim, step=1000, factor=10){
	let lastPoints = [...initPoints], resPoints = [...initPoints]
	let epsilon = data.length/initPoints.length/factor
	for(let i=0; i<iterLim; i++){
		//console.log('last points: ', lastPoints)
		resPoints.forEach((e,i) => {
			let xaxis = 0, yaxis = 0

			// calculate attraction
			data.forEach((d,j) => {
				let dist = spatialDistance1(lastPoints[i], d)
				let angl = angle1(lastPoints[i], d)
				xaxis += 1/dist/dist*Math.cos(angl)
				yaxis += 1/dist/dist*Math.sin(angl)
			})

			// calculate repulsion
			lastPoints.forEach((v,j) => {
				if(i == j) return
				let dist = spatialDistance1(lastPoints[i], v)
				let angl = angle1(lastPoints[i], v)
				xaxis -= 1/dist/dist*Math.cos(angl)*epsilon
				yaxis -= 1/dist/dist*Math.sin(angl)*epsilon
			})

			// update
			//console.log(yaxis,xaxis)
			let bearing = 90-Math.atan2(yaxis,xaxis)/Math.PI*180
			//console.log('last point i: ', lastPoints[i], typeof(lastPoints[i][0]), typeof(lastPoints[i][1]))
			//console.log(step, bearing)
			let newPoint = turf.destination(turf.point(lastPoints[i]), step, bearing)
			
			resPoints[i] = newPoint['geometry']['coordinates']
		})
		lastPoints = [...resPoints]
	}
	return resPoints
}




function spatialDistance(a,b){
	var from = turf.point([a['lng'],a['lat']]);
	var to = turf.point([b['lng'],b['lat']]);
	var options = {
		units: 'kilometers'   //单位 千米
	};
	var distance = turf.distance(from, to, options);
	return distance
}

function spatialDistance1(a,b){
	var from = turf.point(a);
	var to = turf.point(b);
	var options = {
		units: 'kilometers'   //单位 千米
	};
	var distance = turf.distance(from, to, options);
	return distance
}

function angle1(a,b){ //rad, --->0 counterclockwiae => +
	var from = turf.point(a);
	var to = turf.point(b);
	
	var angle = (90-turf.bearing(from, to))/180*Math.PI;
	return angle
}

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

function isWithinBouding( p ,bound,mode) {
    let res
    if(mode == 1) res = ( p['lng'] > bound['lngMin'] && p['lng'] < bound['lngMax'] && p['lat'] > bound['latMin'] && p['lat'] < bound['latMax'] )
    else if(mode == 2) res = ( p[0] > bound[0] && p[0] < bound[1] && p[1] > bound[2] && p[1] < bound[3] )
    return res
}

function getBbox(bounds){
    let bbox = []
    bounds.map((p)=>{
      bbox[0] = ( !bbox[0] || p[0] < bbox[0] ) ? p[0] : bbox[0]  // min Longitude
      bbox[1] = ( !bbox[2] || p[0] > bbox[2] ) ? p[0] : bbox[2]  // max Longitude
      bbox[2] = ( !bbox[1] || p[1] < bbox[1] ) ? p[1] : bbox[1]  // min Latitude
      bbox[3] = ( !bbox[3] || p[1] > bbox[3] ) ? p[1] : bbox[3]  // mix Latitude
    })
    return bbox
}

function getPolygonfromBbox(bbox){
	return [[bbox[0],bbox[2]],[bbox[0],bbox[3]],[bbox[1],bbox[3]],[bbox[1],bbox[2]],[bbox[0],bbox[2]]]
}

function random(lower, upper){
	return lower + Math.random()*(upper-lower)
}

function randomList(length, lower, upper){
	return Array(length).fill(0).map(e => { return random(lower, upper)})
}

function randomPointList(length, lnglower, lngupper, latlower, latupper, mode){
	if(mode == 1){
		return Array(length).fill(0).map(e => { return [random(lnglower,lngupper),random(latlower,latupper)]})
	}
	else if(mode == 2){
		return Array(length).fill(0).map(e => { return {lng: random(lnglower,lngupper), lat: random(latlower,latupper)} })
	}
}
