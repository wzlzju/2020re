import {HeatmapLayer} from '@deck.gl/aggregation-layers';
import { hexToRGBArray,setTooltip  } from '../util.js'

const LAYER_NAME = 'HEATMAP_LAYER'


export const heatmapLayer = (props) =>{
	const {
		data ,
		intensity = 1,
		threshold = 0.03,
		radiusPixels = 30,
		layerId,
		visible = true,
	} = props;
	return new HeatmapLayer({
	    id: `${LAYER_NAME}-${layerId}-${Math.random()}`,
	    data,
	    visible,
	    pickable: false,
		getPosition: d => [d['lng'] , d['lat']],
	    getWeight: 1,
	    radiusPixels,
	    intensity,
	    threshold,
	    colorRange: colorRange
	 })
}


// https://colorbrewer2.org/#type=sequential&scheme=Blues&n=6
const colorRange = [
	[239,243,255],
	[198,219,239],
	[158,202,225],
	[107,174,214],
	[49,130,189],
	[8,81,156]
]