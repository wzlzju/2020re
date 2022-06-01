import { PathLayer } from '@deck.gl/layers';
import { hexToRGBArray } from '../util.js'
import { DEFAULT_STROKE_COLOR }  from '../config.js'

const LAYER_NAME = 'TRAJECTORY_LAYER'


export const  trajsLayer = ( props ) => {
	let {
		data = [],
		visible = true,
		strokeOpacity = 0.4,
		strokeWidth = 4,
		strokeColor = DEFAULT_STROKE_COLOR,
		layerId 
	} = props
	
	// console.log(data)

	// layer 
	return new PathLayer({
	    id: `${LAYER_NAME}-${layerId}`,
	    data : data ,
	    visible,
	    pickable: true,
	    getWidth:  strokeWidth ,
	    getPath: d => d.map((p)=>[p['lng'],p['lat']]),
	    getColor: hexToRGBArray(strokeColor , strokeOpacity),
	    onHover: ({object, x, y}) => {
	    }
	});
}