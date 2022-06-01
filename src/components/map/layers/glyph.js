import React, { Component,useRef,useEffect } from 'react';
import * as d3 from 'd3';
import * as turf from '@turf/turf'
import { DEFAULT_STROKE_COLOR,
		 widthScaleBase }  from '../config.js'
import { widthScale as utilWidthScale }  from '../util.js'
import './assets/layer.scss'

export default (props) => {
	let { 
		viewport,
		data,
		visible = true,
	}  = props
	if(!viewport || !data ) return null 
	let { width,height,project,getDistanceScales } = viewport
  	const inputEl = useRef(null);

  	let points = data.map((g)=>{
  		// let c = g['centroid']
  		let centroid = g['centroid']['point'] || g['centroid'] 
  		let polygon = g['voronoi']['polygon']

  		let { lng,lat } = centroid
  		let centerPoint = project( [lng,lat] )
  		let radius = _getRadius( centerPoint ,centroid , polygon , project )
  		let r  = radius['pixelDist']
  		let { l,rw,rh } = _getBlock(r)
  		let rhp1 = g['centrality'] / radius['lnglatDist']   // rect1 height percent 
  		let rhp2 = g['dispersion'] / radius['lnglatDist']	// rect2 height percent
  		let rhp3 = (rhp1 + rhp2 ) /2

  		return {
  			cx : centerPoint[0],
  			cy : centerPoint[1],
  			r,l,
  			rw,rh,
  			rhp1,rhp2,rhp3,
  			radiusWidth : g['radiusWidth']
  		}
  	})

  	const render = () => {
		let { width,height,project } = viewport
  		const selected = d3.select(inputEl.current).select('g')
  			.selectAll('.circle')
  			.data(points)

  		selected.exit().remove()
	      .style("transform" , d => `rotate3d(1, 0, 0, ${viewport.pitch}deg)`)

	    const enter = selected
	    	.enter()
	    	.append('circle')
	    	.attr('class' , "circle")

	   	selected.merge(enter)
	      	.style("transform-origin" , d => `0px  ${d['cy']}px`)   
	        .style("transform" , d => `rotate3d(1, 0, 0, ${viewport.pitch}deg)`)
	   		.attr('cx', d => d['cx'])
	   		.attr('cy', d => d['cy'])
	   		.attr('r',  d => d['r'])
	   		.style('stroke',"#758CB9")
	   		.style('stroke-width',d=>d['radiusWidth'])
	   		.style('fill','none')

	   	const selectedBlocks = d3.select(inputEl.current)
	   		.selectAll('.block')
	   		.data( points )

  		selectedBlocks.exit().remove()
	      .style("transform" , d => `rotate3d(1, 0, 0, ${viewport.pitch}deg)`)

	    const enterBlock = selectedBlocks
	    	.enter()
	    	.append('g')
	    	.attr('class' , "block")

	   	selectedBlocks.merge(enterBlock)
	      	// .style("transform-origin" , d => `${d['cx']}px  ${d['cy']}px`)   
	        // .style("transform" , d => `rotate3d(1, ${d['cx']}px, ${d['cy']}px, ${viewport.pitch}deg)`)
	        .style("transform" , d => `translate(${d['cx']-d['l']}px, ${d['cy']-d['l']}px)`)
	        .selectAll('rect').remove()

	    selectedBlocks.append('rect')
	    	.attr('class', 'static-rect')
	    	.attr('x' , 0)
	    	.attr('y' , d => d['rh'] *(1- d['rhp1']))
	    	.attr('width' , d => d['rw'])
	    	.attr('height', d => d['rh'] * d['rhp1'])

	    selectedBlocks.append('rect')
	    	.attr('class', 'static-rect')
	    	.attr('x' , d => d['rw'] * 1.5)
	    	.attr('y' , d => d['rh'] * (1 - d['rhp2']))
	    	.attr('width' , d => d['rw'])
	    	.attr('height', d => d['rh'] * d['rhp2'])


	    selectedBlocks.append('rect')
	    	.attr('class', 'static-rect')
	    	.attr('x' , d => d['rw'] * 3)
	    	.attr('y' , d => d['rh'] * (1- d['rhp3']))
	    	.attr('width' , d => d['rw'])
	    	.attr('height', d => d['rh'] * d['rhp3'])
  	}


	// 每次更新都渲染
	useEffect(() => {
		 render()
	})

	return(
		<svg 
			style={{ 
				'position':'absolute',
				'pointerEvents':'none',
				'visibility' : visible ? 'visible' : 'hidden'
			}}
			viewBox={`0 0 ${width} ${height}`}
			ref={inputEl}>
	      	<g />
		</svg> 		
	)
}

const _getBlock = ( r ) =>{
	let l = r / Math.sqrt(2),
		rw = 2 * l / 4,  // rect width
		rh = 2 * l      // max rect height
	return {
		l, rw ,rh 
	}
}
// 中心点到边的距离 取最小的
const _getRadius = ( centerPoint , centroid ,  polygon, project ) =>{
	let distances = [],
		p1,
		p2,
		centenOfOnePolygonEdge
	for(let i = 0;i < polygon.length;i++){
		p1 = (i - 1) < 0 ? polygon.length - 1 : i-1
		p2 = i
		p1 = polygon[p1]
		p2 = polygon[p2]
		centenOfOnePolygonEdge = turf.midpoint( p1, p2 );
  		centenOfOnePolygonEdge = centenOfOnePolygonEdge['geometry']['coordinates']	
  		let lnglatDist = _spatialDistance( centroid , centenOfOnePolygonEdge)
  		centenOfOnePolygonEdge = project( centenOfOnePolygonEdge )
  		distances.push({
  			pixelDist : _getLength(centerPoint, centenOfOnePolygonEdge),
  			lnglatDist ,
  		})
	}
	distances.sort((a,b)=> a['pixelDist'] - b['pixelDist'])
	return distances[0]
}
const _getLength = (p1 , p2) =>{
	var a = p1[0] - p2[0];
	var b = p1[1] - p2[1];
	var c = Math.sqrt( a*a + b*b );	
	return c
}

function _spatialDistance(a,b){
	var from = turf.point([a['lng'],a['lat']]);
	var to = turf.point(b);
	var options = {
		units: 'kilometers'   //单位 千米
	};
	var distance = turf.distance(from, to, options);
	return distance
}