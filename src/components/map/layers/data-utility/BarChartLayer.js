import {  PolygonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core'

import { PathStyleExtension } from '@deck.gl/extensions';

import { hexToRGBArray } from '../../util.js'
import { DEFAULT_STROKE_COLOR }  from '../../config.js'

import circle from '@turf/circle';
import * as turf from '@turf/turf'

//import Event from '@/util/event'

//import {  } from '../config'

//const SAC = require("./data-util/visualization/spatial-autocorrelation")

export function createBarChart( subProps , mapId , layerId ) {
	// console.log( subProps , mapId , layerId)
	let {
		data = {},
		visible = true,
		strokeOpacity,
		strokeWidth = 1,
		strokeColor = DEFAULT_STROKE_COLOR,
		fillOpacity = 0.6,
	} = subProps

	console.log("Data show ...")
	// console.log(data)
	data  = data.map((d)=>{
		return {
			id : d['id'],
			members: d['members'].length,
			centroid : d['centroid']['point'],
			voronoi: d['voronoi']	
		}
	})
	console.log( JSON.stringify(data) )
	if(!data) return

	// let vdata = data['voronois']//.slice(0,2)
	//let tdata = data['vectors']//.slice(0,2)
	
	let vdata = data.map((d)=>{
		return{
			...d,
			...d['voronoi']
		}
	})

	let valueData

	/* mock data */
	/* regard an adjacent region as a bar in chart, GroupId is the value */
	let mockData = vdata.map(e => {
		return e['adjacents']
	})
	valueData = mockData

	/* check values data */
	if(valueData.length != vdata.length){
		console.log("Data error in bar chart layer. ")
		return 
	}

	/* get the range to scale data */
	let maxBarsNum = 0, minBarsNum = 0, maxBarVal = 0, minBarVal = 0
	maxBarsNum = Math.max(...valueData.map(e => {return e.length}))
	minBarsNum = Math.min(...valueData.map(e => {return e.length}))
	maxBarVal = Math.max(...valueData.flat())
	minBarVal = Math.min(...valueData.flat())

	let scaleRange = {width: 1, height: 1}
	data = {}
	let barChartsList = []
	valueData.forEach((e,i) => {
		let w = scaleRange['width'], h = scaleRange['height']
		let barChart = {}, recData = []
		let { lng, lat } = vdata[i].centroid['point'], radius = Math.max(w, h)/1.4//14
		let circleGeoJson = circle([lng, lat], radius, { steps: 8 } )
		let circleData = circleGeoJson['geometry']['coordinates'][0]
		let corners = circleData.filter((e,i) => i%2==1)
		let P1 = {lng: corners[3][0], lat: corners[3][1]},
			P2 = {lng: corners[0][0], lat: corners[0][1]},
			P3 = {lng: corners[2][0], lat: corners[1][1]},
			P4 = {lng: corners[1][0], lat: corners[1][1]}
			/* 	1 - 2
				|   |
				3 - 4 	*/
		if(w > h){	//13,24
			[P1,P3] = scaleLine(P1,P3,h/w)
			[P2,P4] = scaleLine(P2,P4,h/w)
		}
		else if(w < h){	//12,34
			[P1,P2] = scaleLine(P1,P2,w/h)
			[P3,P4] = scaleLine(P3,P4,w/h)
		}

		/* draw bars using turf */
		let vnum = e.length, vunit = 1/(2*vnum-1)
		//console.log(P1,P2,P3,P4)
		//console.log('e: ',e)
		e.forEach((v,j) => {
			//console.log('v: ',v)
			let p11 = splitLine(P1, P2, vunit*2*j, 1)
			let p12 = splitLine(P1, P2, vunit*(2*j+1), 1)
			let p21 = splitLine(P3, P4, vunit*2*j, 1)
			let p22 = splitLine(P3, P4, vunit*(2*j+1), 1)
			let p31 = splitLine(p21, p11, v/maxBarVal, 1)
			let p32 = splitLine(p22, p12, v/maxBarVal, 1)
			recData = pointConvert([p21,p22,p32,p31,p21], 1)
			barChartsList.push({recData: recData, color: [115,140,184,255]})
		})
		//recData = recData.concat(pointConvert([P1,P2,P4,P3,P1], 1))
		
		/*barChart['recData'] = recData
		barChart['color'] = [115,140,184,255]
		barChartsList.push(barChart)*/
	})
	data['barCharts'] = barChartsList

	

	if(!data) return
	
	console.log(data)

	return new BarChartLayer({
		...subProps,
		data,
		visible,
		opacity : strokeOpacity ,
		width : strokeWidth,
		fillOpacity: fillOpacity,
		strokeColor,
		layerId
	})
}

class BarChartLayer extends CompositeLayer {
	renderLayers() {
	    return [
	      	// innerCircle
			new PolygonLayer({
			    //id: `${id}-polygon-layer-${this.props['layerId']}`,
				visible :  true,//this.props['visible'],
			    data : this.props['data'].barCharts,
			    pickable: true,
			    stroked: false,
			    filled: true,
			    dashJustified: false,
			    wireframe: true,
			    lineWidthMinPixels: 1,
			    extruded: false,
			    getPolygon: d =>  d['recData'],
				/*updateTriggers: {
				    getFillColor: this.props['highLightId']
				},*/
			    getFillColor : d => [115,140,184,255],//d['color'],
			    getLineColor: hexToRGBArray(this.props['strokeColor'], this.props.opacity ),
			    getLineWidth: this.props['width'],
			    onHover: ({object, x, y}) => {
			    	if(object){
			    		// console.log( object['id'] , object['neighbors'] )
			    	}
			    },
				lineWidthUnits: 'meters',
		  	}),
		  	
	   ]
  }
}


/*Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
      }, []);
    }
});*/


function spatialDistance(a,b){
	var from = turf.point([a['lng'],a['lat']]);
	var to = turf.point([b['lng'],b['lat']]);
	var options = {
		units: 'kilometers'   //单位 千米
	};
	var distance = turf.distance(from, to, options);
	return distance
}

function scaleLine(  p1 , p2 , scaleRatio){
	
	let p1Arr = [p1['lng'] , p1['lat']]
	let p2Arr = [p2['lng'] , p2['lat']]
  	let line = turf.lineString([ p1Arr , p2Arr ]);
	let scaleLine = turf.transformScale(line, scaleRatio );

	let [ np1 , np2 ] = scaleLine['geometry']['coordinates']

	return [
		{ lng : np1[0] , lat: np1[1] },
		{ lng : np2[0] , lat: np2[1] }
	]
}

function splitLine(  p1 , p2 , splitRatio, mode){
	let p1Arr = [p1['lng'] , p1['lat']]
	let p2Arr = [p2['lng'] , p2['lat']]
  	let line = turf.lineString([ p1Arr , p2Arr ]);
  	let length = turf.length(line)
	let along = turf.along(line, length * splitRatio)

	//console.log('along: ',along)
	let [ plng , plat ] = along['geometry']['coordinates']
	
	if(mode == 1){
		return { lng : plng , lat: plat }
	}
	else if(mode == 2){
		return [plng, plat]
	}	
}

function pointConvert(pList, mode){
	return pList.map(e => { return mode == 1 ? [e['lng'], e['lat']] : {lng:e[0], lat:e[1]}})
}