import {  PolygonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core'

import { PathStyleExtension } from '@deck.gl/extensions';

import { hexToRGBArray } from '../../util.js'

import circle from '@turf/circle';

//import Event from '@/util/event'

import { createBarChart } from './BarChartLayer'

//import {  } from '../config'

const SAC = require("./data-util/visualization/spatial-autocorrelation")

export function createGlyph( subProps , mapId , layerId ) {
	// console.log( subProps , mapId , layerId)
	let {
		data = {},
		visible = true,
		strokeOpacity,
		strokeWidth = 1,
		strokeColor,
		fillOpacity = 0.6,
	} = subProps

	console.log("Data show ...")
	console.log(data)
	if(!data) return

	let vdata = data 
	// let vdata = data['voronois']//.slice(0,2)
	// let tdata = data['vectors']//.slice(0,2)
	
	// get the circles
	let innerCircle = [], outerCircle = []
	let stepnum = 64
	let innerRadius = 1
	let ioDist = 0
	let outerRadius = 1

	data = {}

	let radiusList, colorList
	radiusList = [1,1.1,1.3,1.4]
	colorList = [[115,140,184,0],[115,140,184,255],[115,140,184,255],[115,140,184,0]]
	//radiusList = [1,1.1]
	//colorList = [[115,140,184,0],[115,140,184,255]]
	//data['outerCircle'] = getMultiColorGradientFixedLoop(vdata, stepnum, radiusList, colorList)


	let regionNum = vdata.length
	let attr = Array(regionNum).fill(0).map((e,i)=>{return [0,0]}) 	// [SupportIn, SupportOut]
	// tdata.forEach(e => {
	// 	console.log('data')
	// 	console.log(e)
	// 	console.log('attr')
	// 	console.log(attr)
	// 	attr[e.from][1] += e.support
	// 	attr[e.to][0] += e.support
	// })
	let weights = new Map()
	vdata.forEach((e,i) =>{
		let weightList = new Map(Array(regionNum).fill([]).map((e,i)=>{return [i,0]}))
		e['voronoi'].adjacents.forEach(v => weightList.set(v, 1))
		weights.set(i, weightList)
	})
	//console.log('weights', weights)
	//console.log(weights.get(0))
	//console.log(weights.get(0).get(1))
	let sacValue = {}
	sacValue['LMI'] = SAC.SAC("LMI", attr, weights, 1)
	sacValue['LGC'] = SAC.SAC("LGC", attr, weights, 1)
	sacValue['GO'] = SAC.SAC("GO", attr, weights, 1)
	sacValue['GOstar'] = SAC.SAC("GOstar", attr, weights, 1)
	outerRadius = sacValue['LMI'].map((e,i) => { return e*outerRadius })
	//console.log('LMI', sacValue['LMI'])
	//console.log('outer radius', outerRadius)

	/* fix all values in a range */
	let upper = 0.5, lower = 0.05
	let max = Math.max(...outerRadius), min = Math.min(...outerRadius)
	outerRadius = outerRadius.map(e => { return (e-min)/(max-min)*(upper-lower)+lower})
	
	let gradientRadius = [[],[]]
	vdata.map((v,i) => {
		let { lng, lat } = v.centroid['point']
		let radius = innerRadius
		// console.log(lng,lat,radius, v)
		let circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
		let circleData = circleGeoJson['geometry']['coordinates']
		let icir = {}
		icir['circle'] = circleData[0]
		innerCircle.push(icir)
		
		radius += ioDist
		gradientRadius[1].push(radius)
		circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
		let oCircleData1 = circleGeoJson['geometry']['coordinates']
		radius += outerRadius[i]
		gradientRadius[0].push(radius)

		radius = innerRadius + 1
		circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
		let oCircleData2 = circleGeoJson['geometry']['coordinates']
		let ocir = {}
		ocir['circle'] = [oCircleData2[0], oCircleData1[0]]
		outerCircle.push(ocir)

		/* negative value will be a inner loop */
		/*radius += ioDist * (outerRadius[i]>=0 ? 1 : -1)
		circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
		let oCircleData1 = circleGeoJson['geometry']['coordinates']
		radius += outerRadius[i]
		circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
		let oCircleData2 = circleGeoJson['geometry']['coordinates']
		let ocir = {}
		ocir['circle'] = outerRadius[i]>=0 ? [oCircleData2[0], oCircleData1[0]] : [oCircleData1[0], oCircleData2[0]]
		outerCircle.push(ocir)*/
	})
	data['innerCircle'] = innerCircle
	data['outerCircle'] = outerCircle

	let radiusRatio = [0.3,0.4,0.3]
	data['outerCircle'] = getMultiColorGradientLoop(vdata, gradientRadius, stepnum, radiusRatio, colorList)

	if(!data) return
	
	console.log(data)

	return new GlyphLayer({
		...subProps,
		data,
		visible,
		opacity : strokeOpacity ,
		width : strokeWidth,
		fillOpacity: fillOpacity,
		strokeColor,
		layerId
	})
	//new createBarChart(subProps , mapId , layerId)
}

class GlyphLayer extends CompositeLayer {
	renderLayers() {
	    return [
	      	// innerCircle
			new PolygonLayer({
			    //id: `${id}-polygon-layer-${this.props['layerId']}`,
				visible :  this.props['visible'],
			    data : this.props['data'].innerCircle,
			    pickable: true,
			    stroked: true,
			    filled: false,
			    dashJustified: true,
			    wireframe: true,
			    lineWidthMinPixels: 1,
			    extruded: false,
			    getPolygon: d =>  d['circle'],
				/*updateTriggers: {
				    getFillColor: this.props['highLightId']
				},*/
			    getFillColor : d => d['color'],
			    getLineColor: hexToRGBArray(this.props['strokeColor'], this.props.opacity ),
			    getLineWidth: this.props['width'],
			    onHover: ({object, x, y}) => {
			    	if(object){
			    		// console.log( object['id'] , object['neighbors'] )
			    	}
			    },
				lineWidthUnits: 'meters',
				getDashArray: [this.props['width']*1, this.props['width']*0.5],
				extensions: [new PathStyleExtension({dash: true})]
		  	}),
		  	/*new PolygonLayer({
			    //id: `${id}-polygon-layer-${this.props['layerId']}`,
				visible :  this.props['visible'],
			    data : this.props['data'].outerCircle,
			    pickable: true,
			    stroked: false,
			    filled: true,
			    dashJustified: false,
			    wireframe: true,
			    lineWidthMinPixels: 1,
			    extruded: false,
			    getPolygon: d =>  d['circle'],
				updateTriggers: {
				    getFillColor: this.props['highLightId']
				},
			    getFillColor : d => [115,140,184,200],//d['color']
			    getLineColor: hexToRGBArray(this.props['strokeColor'], this.props.opacity ),
			    getLineWidth: this.props['width'],
			    onHover: ({object, x, y}) => {
			    	if(object){
			    		// console.log( object['id'] , object['neighbors'] )
			    	}
			    },
				lineWidthUnits: 'meters'
		  	})*/
		  	new SolidPolygonLayer({
			    //id: `${id}-polygon-layer-${this.props['layerId']}`,
		  		visible :  this.props['visible'],
			    data : this.props['data'].outerCircle,
			    pickable: true,
			    stroked: false,
			    filled: true,
			    extruded: false,
			    onHover: ({object, x, y}) => {
			    	if(object){
			    		// console.log( object['id'] , object['neighbors'] )
			    	}
			    },
				lineWidthUnits: 'meters'
		  	})
	   ]
  }
}

// https://jsfiddle.net/symbolixau/on7432fj/70/
// https://deck.gl/#/documentation/deckgl-api-reference/layers/solid-polygon-layer?section=use-binary-attributes
function getMultiColorGradientLoop(vdata, Radius, stepnum, radiusRatio, colorList){
	if(radiusRatio.length+1 != colorList.length || radiusRatio.length < 1){
		console.log("Params error in getMultiColorGradientLoop. ")
		return
	}	

	/* generate radius list */
	let outerRadius = Radius[0], innerRadius = Radius[1]
	let radiusList = outerRadius.map((e,i) => {
		let r1 = innerRadius[i], rn = outerRadius[i]
		let rlist = [r1], rc = r1
		radiusRatio.map(e => {
			rc += (rn-r1)*e
			rlist = [...rlist, rc]
		})

		return rlist
	})
	//console.log(radiusList)

	let length = radiusList[0].length
	
	let data = {
		length: 0,
		startIndices: [],
		attributes: {
			getPolygon: {value: [], size: 2},
			getFillColor: {value: [], size: 4}
		}
	}
	//data.length = vdata.length*length*2

	let binaryPolygon = []
	let binaryColor = []
	let starts = []
	
	vdata.map((v,j) => {
		let lng, lat, circleGeoJson, circleData, ncircleData, radius, color, ncolor
		//console.log('Processing',j,'th region ... ')
		for(let i=0; i<length-1; i++){
			if(i==0){
				lng = v.centroid['point'].lng
				lat = v.centroid['point'].lat
				radius = radiusList[j][i]
				radius = innerRadius 
				console.log( lng , lat )
				circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
				circleData = circleGeoJson['geometry']['coordinates'][0]  // Array(stepnum+1)
				color = colorList[i]
			}
			lng = v.centroid['point'].lng
			lat = v.centroid['point'].lat
			console.log( lng , lat )
			radius = radiusList[j][i+1]
			radius = innerRadius 
			circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
			ncircleData = circleGeoJson['geometry']['coordinates'][0]  // Array(stepnum+1)
			ncolor = colorList[i+1]

			// alignment
			let index = 0, min = Infinity, se = ncircleData[0]
			circleData.forEach((e,i) => {
				let dist = spatialDistance({'lng':se[0],'lat':se[1]},{'lng':e[0],'lat':e[1]})
				if(dist < min){
					min = dist
					index = i
				}
			})
			circleData = [...circleData.slice(index,circleData.length),...circleData.slice(0,index)]
			
			let bound = Math.floor(stepnum/2)
			let innerhalf1 = circleData.slice(0, bound+1)
			let innerhalf2 = circleData.slice(bound, stepnum+1)
			let outerhalf1 = ncircleData.slice(0, bound+1).reverse()
			let outerhalf2 = ncircleData.slice(bound, stepnum+1).reverse()
			/*console.log("Start ...")
			console.log(innerhalf1)
			console.log(innerhalf2)
			console.log(innerhalf1.flat())
			console.log(circleData)
			console.log(outerhalf1)
			console.log(outerhalf2)
			console.log(ncircleData)
			console.log("End ...")*/

			binaryPolygon = [...binaryPolygon, 
			...innerhalf1.flat(), 
			...outerhalf1.flat(),
			...innerhalf1[0], 
			...innerhalf2.flat(), 
			...outerhalf2.flat(),
			...innerhalf2[0].flat()]
			binaryColor = [...binaryColor, 
			...Array(bound+1).fill(color).flat(), 
			...Array(bound+1).fill(ncolor).flat(), 
			...color,
			...Array(stepnum+1-bound).fill(color).flat(), 
			...Array(stepnum+1-bound).fill(ncolor).flat(),
			...color]
			starts.push(starts.length==0 ? 0 : starts[starts.length-1]+(stepnum+1-bound)*2+1)
			starts.push(starts.length==0 ? 0 : starts[starts.length-1]+(bound+1)*2+1)
			data.length += 1

			circleData = [...ncircleData]
			color = [...ncolor]
		}
	})
	
	data.startIndices = starts
	data.attributes.getPolygon.value = new Float32Array(binaryPolygon)
	data.attributes.getFillColor.value = new Uint8Array(binaryColor)

	return data
}

function getMultiColorGradientFixedLoop(vdata, stepnum, radiusList, colorList){
	if(radiusList.length != colorList.length || radiusList.length < 2){
		console.log("Params error in getMultiColorGradientFixedLoop. ")
		return
	}
	let length = radiusList.length
	
	let data = {
		length: 0,
		startIndices: [],
		attributes: {
			getPolygon: {value: [], size: 2},
			getFillColor: {value: [], size: 4}
		}
	}
	//data.length = vdata.length*length*2

	let binaryPolygon = []
	let binaryColor = []
	let starts = []
	
	vdata.map(v => {
		let lng, lat, circleGeoJson, circleData, ncircleData, radius, color, ncolor
		for(let i=0; i<length-1; i++){
			if(i==0){
				lng = v.centroid.lng
				lat = v.centroid.lat
				radius = radiusList[i]
				circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
				circleData = circleGeoJson['geometry']['coordinates'][0]  // Array(stepnum+1)
				color = colorList[i]
			}
			lng = v.centroid.lng
			lat = v.centroid.lat
			radius = radiusList[i+1]
			circleGeoJson = circle([lng, lat], radius, { steps: stepnum } )
			ncircleData = circleGeoJson['geometry']['coordinates'][0]  // Array(stepnum+1)
			ncolor = colorList[i+1]

			// alignment
			let index = 0, min = Infinity, se = ncircleData[0]
			circleData.forEach((e,i) => {
				let dist = spatialDistance({'lng':se[0],'lat':se[1]},{'lng':e[0],'lat':e[1]})
				if(dist < min){
					min = dist
					index = i
				}
			})
			circleData = [...circleData.slice(index,circleData.length),...circleData.slice(0,index)]
			
			let bound = Math.floor(stepnum/2)
			let innerhalf1 = circleData.slice(0, bound+1)
			let innerhalf2 = circleData.slice(bound, stepnum+1)
			let outerhalf1 = ncircleData.slice(0, bound+1).reverse()
			let outerhalf2 = ncircleData.slice(bound, stepnum+1).reverse()
			/*console.log("Start ...")
			console.log(innerhalf1)
			console.log(innerhalf2)
			console.log(innerhalf1.flat())
			console.log(circleData)
			console.log(outerhalf1)
			console.log(outerhalf2)
			console.log(ncircleData)
			console.log("End ...")*/

			binaryPolygon = [...binaryPolygon, 
			...innerhalf1.flat(), 
			...outerhalf1.flat(),
			...innerhalf1[0], 
			...innerhalf2.flat(), 
			...outerhalf2.flat(),
			...innerhalf2[0].flat()]
			binaryColor = [...binaryColor, 
			...Array(bound+1).fill(color).flat(), 
			...Array(bound+1).fill(ncolor).flat(), 
			...color,
			...Array(stepnum+1-bound).fill(color).flat(), 
			...Array(stepnum+1-bound).fill(ncolor).flat(),
			...color]
			starts.push(starts.length==0 ? 0 : starts[starts.length-1]+(stepnum+1-bound)*2+1)
			starts.push(starts.length==0 ? 0 : starts[starts.length-1]+(bound+1)*2+1)
			data.length += 1

			circleData = [...ncircleData]
			color = [...ncolor]
		}
	})
	
	data.startIndices = starts
	data.attributes.getPolygon.value = new Float32Array(binaryPolygon)
	data.attributes.getFillColor.value = new Uint8Array(binaryColor)

	return data
}

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
      }, []);
    }
});

const turf = require('@turf/turf')
function spatialDistance(a,b){
	var from = turf.point([a['lng'],a['lat']]);
	var to = turf.point([b['lng'],b['lat']]);
	var options = {
		units: 'kilometers'   //单位 千米
	};
	var distance = turf.distance(from, to, options);
	return distance
}