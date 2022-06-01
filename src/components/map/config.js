import { NumRow, ColorRow, circleRadiusRow } from  '@/components/config/ConfigRow'

export const MAP_STYLE = 'mapbox://styles/mapbox/light-v9'
export const MAPBOX_TOKEN = 'pk.eyJ1IjoieWtqYWdlIiwiYSI6ImNrNnp5dzZhbjFhMHczbm12OTR5bmU4ankifQ.cOEClSRYNtYFUAFhnUEXhA';

export const INITIAL_VIEW_STATE = {
  	longitude: 120.66714,
    latitude: 28.01308 ,   // 温州 
	  // longitude: 121.4282297911128 , latitude: 31.12090037100896 , // 上海
  	zoom: 12,
  	maxZoom: 16,
  	pitch: 0,
  	bearing: 0
};

export const widthScaleBase = 10


// export const CONSOLE_PRINT =  true   
export const CONSOLE_PRINT =  false 

export const SELECT_STROKE_COLOR = '#000000'
export const SELECT_STROKE_OPACITY = 0.7
export const SELECT_FILL_COLOR = '#1f78b4'
export const SELECT_FILL_OPACITY = 0.1
export const DEFAULT_STROKE_COLOR =  "#5c5050"


export const VORONOI_LAYER = "VORONOI_LAYER"
export const POI_LAYER = "POI_LAYER"
export const CHOROPLETH_MAP_LAYER = "CHOROPLETH_MAP_LAYER"
export const FRAME_SELECT_LAYER = "FRAME_SELECT_LAYER"
export const CIRCLE_RADIUS_LAYER = "CIRCLE_RADIUS_LAYER"
export const HEATMAP_LAYER = "HEATMAP_LAYER"
export const MOVEMENT_FLOW_LAYER = "MOVEMENT_FLOW_LAYER"
export const UTILITY_LAYER = "UTILITY_LAYER"
export const SIMULATAION_LAYER = "SIMULATAION_LAYER"
export const TRAJECTORY_LAYER = "TRAJECTORY_LAYER"
export const GLYPH_LAYER = "GLYPH_LAYER"

export const defaultLayerConfigs = [
  {
    layerId : 'AnonymousTrajectoryLayer',
    renderParam : {
        widthScale : {
            "value": -5 , "min": -20, "max": 5, "step": 1 ,
            renderFunc : NumRow
        },
        arrowSize : {
            "value": 0.5, "min": 0.1, "max": 1, "step": 0.01 ,
            renderFunc : NumRow
        },
        translate : {
            "value": 10 , "min": 0, "max": 1000, "step": 1,
            renderFunc : NumRow
        },
        scale : {
            "value": 0.8 , "min": 0.1, "max": 1, "step": 0.05,
            renderFunc : NumRow
        },
        "strokeColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        strokeOpacity : {
            "value": 1, "min": 0.1, "max": 1, "step": 0.01 ,
            renderFunc : NumRow
        },
    }
  },
  {
    layerId : 'ChoroplethMap',
    renderParam : {
        strokeWidth : {
            "value": 10, "min": 0, "max": 60, "step": 0.1 ,
            renderFunc : NumRow
        },
        "strokeColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        strokeOpacity : {
            "value": 0.5, "min": 0 , "max": 1, "step": 0.01 ,
            renderFunc : NumRow
        },
        fillOpacity : {
            "value": 0.45, "min": 0, "max": 1, "step": 0.01 ,
            renderFunc : NumRow
        },
    }
  },
  {
    layerId : 'VoronoiRegion',
    renderParam : {
        strokeWidth : {
            "value": 10, "min": 0.1, "max": 30, "step": 0.1 ,
            renderFunc : NumRow
        },
        "strokeColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        strokeOpacity : {
            "value": 0.5, "min": 0.1, "max": 1, "step": 0.01 ,
            renderFunc : NumRow
        },
        // fillColor : {
        //     "value": "#5c5050",
        //     renderFunc : ColorRow
        // },
        // fillOpacity : {
        //     "value": 1, "min": 0.1, "max": 1, "step": 0.01 ,
        //     renderFunc : NumRow
        // },
    }
  },
  {
    layerId : 'PublicPoiPointsLayer',
    renderParam : {
        size : {
            "value": 20, "min": 1, "max": 100, "step": 1 ,
            renderFunc : NumRow
        },
        opacity : {
            "value": 1, "min": 0, "max": 1, "step": 0.01 ,
            renderFunc : NumRow
        },
    }
  }
]
export const defaultLayerConfigsBack = [
{
	layerId : 'PublicTrajectoryLayer',
	renderParam : {
        "strokeWidth": {
            "value": 10,
            "min": 0.1,
            "max": 30,
            "step": 0.1,
            renderFunc : NumRow
        },
        "strokeColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        "strokeOpacity": {
            "value": 1,
            "min": 0.1,
            "max": 1,
            "step": 0.01,
            renderFunc : NumRow
        }
	},
	dataQueryParam : {}
},
{
  layerId : 'AnonymousTrajectoryLayer',
  renderParam : {
        "strokeWidth": {
            "value": 10,
            "min": 0.1,
            "max": 50,
            "step": 0.1,
            renderFunc : NumRow
        },
        "vectorWidth": {
            "value": 10,
            "min": 0.1,
            "max": 50,
            "step": 0.1,
            renderFunc : NumRow
        },
        "vectorColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        "arrowColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        "strokeColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        "vectorOpacity": {
            "value": 1,
            "min": 0.1,
            "max": 1,
            "step": 0.01,
            renderFunc : NumRow
        },
        "strokeOpacity": {
            "value": 1,
            "min": 0.1,
            "max": 1,
            "step": 0.01,
            renderFunc : NumRow
        },
  },
  dataQueryParam : {
        'maxRadius' : {
          label : 'maxRadius',
          value : 6,
          min : 0,
          max : 10,
          unit : 'KM',
          step: 0.01,
          renderFunc: NumRow
        },
        'k' : {
          label : 'kAnonymity',
          value : 5,
          min : 1,
          max : 20,
          unit : '',
          renderFunc: NumRow
        },
        'p' : {
          label : 'pValue',
          value : 0.2,
          min : 0.1,
          max : 1,
          step: 0.1,
          unit : '',
          renderFunc: NumRow
        },
        'circleRadius' : {
          renderFunc : circleRadiusRow,
          mapId : 0 ,
          value : [ 1, 3 ],
          unit : 'm'
        }
  },
},
{
  layerId : 'AnonymousPointsLayer',
  renderParam : {
        "strokeColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        "strokeOpacity": {
            "value": 1,
            "min": 0.01,
            "max": 1,
            "step": 0.01,
            renderFunc : NumRow
        }
  },
  dataQueryParam : {
        'k' : {
          label : 'kAnonymity',
          value : 5,
          min : 1,
          max : 20,
          unit : '',
          renderFunc: NumRow
        },
        'circleRadius' : {
          renderFunc : circleRadiusRow,
          mapId : 0 ,
          value : [ 1, 3 ],
          unit : 'm'
        }
  },
},
{
  layerId : 'PublicPoiPointsLayer',
  renderParam : {
        "opacity": {
            "value": 1,
            "min": 0.01,
            "max": 1,
            "step": 0.01,
            renderFunc : NumRow
        },
        "size": {
            "value": 5,
            "min": 1,
            "max": 20,
            "step": 1,
            renderFunc : NumRow
        }
  },
  dataQueryParam : {
  },
},
{
  layerId : 'PublicWeiboPointsLayer',
  renderParam : {
        "strokeColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        "opacity": {
            "value": 1,
            "min": 0.01,
            "max": 1,
            "step": 0.01,
            renderFunc : NumRow
        },
        "fillColor": {
            "value": "#5c5050",
            renderFunc : ColorRow
        },
        "radius": {
            "value": 5,
            "min": 1,
            "max": 20,
            "step": 1,
            renderFunc : NumRow
        }
  },
  dataQueryParam : {
  },
},
]
