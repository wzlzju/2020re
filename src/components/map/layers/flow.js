import React, { Component,useRef,useEffect } from 'react';
import * as d3 from 'd3';
import * as turf from '@turf/turf'
import { DEFAULT_STROKE_COLOR,
		 widthScaleBase }  from '../config.js'
import { widthScale as utilWidthScale }  from '../util.js'
const minmalWidth = 0.01

export default (props) => {
	let { 
		viewport,
		data,
		widthScale = -2,
		strokeColor = DEFAULT_STROKE_COLOR ,
		strokeOpacity = 1,
		visible = true,
		translate = 50,
		scale = 0.8,
		arrowSize = 0.9,
		maxWidth = 40
	} = props
	if(!viewport || !data ) return null 
	let { width,height,project } = viewport
  	const inputEl = useRef(null);
  	data = data.filter((d)=> d['start'] != d['end'])
  	let widthScaleFunc = utilWidthScale( data , (v)=>v['support'] , maxWidth )

	let points = data.map( d => {
		let { fromPoint,toPoint } = d
		let [ _fromPoint,_toPoint ] = scaleLine( fromPoint,toPoint , scale , translate )		
		let from = _fromPoint
		let to = _toPoint
		return {
			from : project( [ from['lng'],from['lat'] ] ),
			to : project( [ to['lng'],to['lat'] ] ),
			support : d['support']
		}
	})

	const render = () => {
		let { width,height,project } = viewport
	    const selected = d3.select(inputEl.current).select('g')
	      .selectAll(".arrow-line")
	      .data(points)
	      .style("opacity", visible ? 1 : 0)

		selected.exit().remove()
	      .style("transform" , d => `rotate3d(1, 0, 0, ${viewport.pitch}deg)`)

	    const enter = selected
	      .enter()
	      .append("line")
	      .attr("class", "arrow-line")


	    let path = d3.select(inputEl.current)
	    	.select('defs')
	    	.select('#arrow')
	    	.select('path')
	    	.style('fill' , strokeColor)

	    selected
	      	.merge(enter)
		    .attr("x1", d => d['from'][0] )
		    .attr("y1", d => d['from'][1] )
		    .attr("x2", d => d['to'][0] )
		    .attr("y2", d => d['to'][1])
	      	.style("transform-origin" , d => `0px  ${d['to'][1]}px`)   
	        .style("transform" , d => `rotate3d(1, 0, 0, ${viewport.pitch}deg)`)
	        .attr("stroke-width", d => widthScaleFunc(d['support']))
	        .style('opacity' , visible ? strokeOpacity : 0 )
	      	.attr("stroke", strokeColor )
	        .attr("marker-end", "url(#arrow)")
	}


	// 每次更新都渲染
	useEffect(() => {
		 render()
	})

	return (
		<svg 
			style={{ 
				'position':'absolute',
				'pointerEvents':'none',
				'visibility' : visible ? 'visible' : 'hidden'
			}}
			viewBox={`0 0 ${width} ${height}`}
			ref={inputEl} 

			>
			<defs>
				<marker
				  id="arrow"
				  markerWidth="24"
				  markerHeight="24"
				  viewBox={`0 0 ${24 * 1/arrowSize} ${24 * 1/arrowSize}`}
				  refX="8"
				  refY="12"
				  style={{
				  	opacity:0.6
				  }}
				  markerUnits="userSpaceOnUse"
				  orient="auto">
				  <path 
				  	d="M4,4 L20,12 L4,20 L12,12 L4,4" 
				  	style={{ 'fill':'#f00' }}></path>
				</marker>				
			</defs>
	      	<g />
	    </svg>
	)
}


// https://deck.gl/#/documentation/deckgl-api-reference/viewports/web-mercator-viewport?section=project


function scaleLine(  p1 , p2 , scale , length){
	const scaleRatio  = scale || 0.8
	let p1Arr = [p1['lng'] , p1['lat']]
	let p2Arr = [p2['lng'] , p2['lat']]
  	let line = turf.lineString([ p1Arr , p2Arr ]);
	let scaleLine = turf.transformScale(line, scaleRatio );
    let angle = turf.bearing(  p1Arr , p2Arr ) + 90
	var translatedLine = turf.transformTranslate(scaleLine, length/1000, angle)
	let [ np1 , np2 ] = translatedLine['geometry']['coordinates']
	return [
		{ lng : np1[0] , lat: np1[1] },
		{ lng : np2[0] , lat: np2[1] }
	]
}

function degree2radian(degree){
  var pi = Math.PI;
  return degree * (pi/180);
}
