import { IconLayer  } from '@deck.gl/layers';
import { hexToRGBArray,setTooltip  } from '../util.js'
import * as POIIcon from './assets/position.png'

const LAYER_NAME = 'POI_LAYER'

export const poiLayer = (subProps , mapId)=>{
	let { 
		visible = true,
		data = [],
		opacity = 1,
		size = 20,
		layerId
	} = subProps
	
	return new IconLayer({
	    id: `${LAYER_NAME}-${layerId}`,
		data,
		visible,
	    getIcon: d => ({
	      url: POIIcon,
	      width: 128,
	      height: 128,
	    }),
		sizeScale: 1,
		getColor: d => hexToRGBArray( '#ffffff' , opacity) ,
		getPosition: d => [d['lng'] , d['lat']],
		getSize: d => size,
		pickable: true,
	    // onHover : info =>  setTooltip(info.object, info.x, info.y)
	});
}

