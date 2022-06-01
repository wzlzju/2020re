import {  PolygonLayer, TextLayer } from '@deck.gl/layers';
import { hexToRGBArray,setTooltip  } from '../util.js'
import { DEFAULT_STROKE_COLOR }  from '../config.js'

const LAYER_NAME = 'CHOROPLETH_MAP_LAYER'

export function choroplethMapLayer( props ){
	let {
		data = [],
		visible = true,
		strokeOpacity = 1,
		strokeWidth = 1,
		strokeColor = DEFAULT_STROKE_COLOR,
		fillOpacity = 0.6,
		layerId
	} = props
	if(!data) return

	return new PolygonLayer({
	    id: `${LAYER_NAME}-${layerId}`,
		visible,
	    data,
	    getPolygon: d =>  d['polygon'],
		updateTriggers: {
		    getFillColor: fillOpacity
		},
	    getFillColor : d =>  hexToRGBArray( d['fillColor'] ,  fillOpacity) ,
	    getLineColor: hexToRGBArray( strokeColor , strokeOpacity ),
	    getLineWidth: strokeWidth,
	    onHover: ({object, x, y}) => {},
	    pickable: true,
	    stroked: true,
	    filled: true,
	    wireframe: true,
	    lineWidthMinPixels: 1,
	    extruded: false,
		lineWidthUnits: 'meters'
  	})
}