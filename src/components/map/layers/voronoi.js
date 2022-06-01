import { PolygonLayer } from '@deck.gl/layers';
import { hexToRGBArray,setTooltip  } from '../util.js'
import { DEFAULT_STROKE_COLOR }  from '../config.js'

const LAYER_NAME = 'VORONOI_LAYER'

export function voronoiRegionLayer( props ){
	let {
		data = [],
		visible = true,
		strokeOpacity = 1,
		strokeWidth = 1,
		strokeColor = DEFAULT_STROKE_COLOR,
		layerId 
	} = props

	if(!data) return

	return	new PolygonLayer({
	    id: `${LAYER_NAME}-${layerId}`,
		visible,
	    data,
	    getPolygon: d =>  d['polygon'],
	    getLineWidth: strokeOpacity,
	    getLineColor: hexToRGBArray( strokeColor , strokeOpacity ),
	    pickable: true,
	    stroked: true,
	    filled: false,
	    wireframe: true,
	    lineWidthMinPixels: 1,
	    extruded: false,
		updateTriggers: {
		    // getFillColor: this.props['highLightId']
		},
	    onHover: ({object, x, y}) => {},
		lineWidthUnits: 'meters'
	})
}

