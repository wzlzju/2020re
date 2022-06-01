import {
    EditableGeoJsonLayer,
    DrawPolygonMode,
    DrawRectangleMode,
    DrawCircleFromCenterMode,
    ModifyMode,
    ViewMode,
    ScaleMode
} from 'nebula.gl';
import Event from '@/util/event'
import { hexToRGBArray } from '../util.js'
import {
    SELECT_STROKE_COLOR,
    SELECT_STROKE_OPACITY,
    SELECT_FILL_COLOR,
    SELECT_FILL_OPACITY
} from '../config'

const LAYER_NAME = 'FRAME_SELECT_LAYER'
//// https://nebula.gl/docs/api-reference/layers/editable-geojson-layer

export const frameSelectLayer = (subProps, mapId) => {
    let selectedFeatureIndexes = []
    let ev = Event.get()

    let method = subProps['method']
    let mode
    switch (method) {
        case "polygon":
            mode = DrawPolygonMode
            break

        case "rect":
            mode = DrawRectangleMode
            break

        case 'circle':
            mode = DrawCircleFromCenterMode
            break

        default:
            mode = ViewMode
            selectedFeatureIndexes = [0]
            break
    }

    return new EditableGeoJsonLayer({
        id : LAYER_NAME + Math.random(),
        visible: subProps['visible'],
        data: subProps['data'],
        mode,
        selectedFeatureIndexes,
        getFillColor: hexToRGBArray(SELECT_FILL_COLOR, SELECT_FILL_OPACITY),
        getLineColor: hexToRGBArray(SELECT_STROKE_COLOR, SELECT_STROKE_OPACITY),
        getLineWidth: 1,
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 2,
        getTentativeFillColor: [255, 255, 255, 0],
        getLineDashArray: [1, 2],
        onEdit: ({ updatedData, editType, featureIndexes }) => {
            if (editType == "addFeature")
                ev.emit(mapId + 'endMapFrameSelect', updatedData)
        },
    })
}



/**************************************************/

const defaultProps1 = {
    "cursor": true,
    "method": "rect",
    "data": {
        "type": "FeatureCollection",
        "features": []
    },
    "visible": true,
}
const defaultProps2 = {  
    "cursor": false,
    "draw": false,
    "data": { 
         "type": "FeatureCollection", 
         "features": [
            { 
               "type": "Feature", 
               "properties": {}, 
               "geometry": { 
                  "type": "Polygon", 
                  "coordinates": [
                    [
                        [120.65702003062492, 28.022439362641567],
                        [120.67078422623482, 28.022439362641567],
                        [120.67078422623482, 28.007001009810725],
                        [120.65702003062492, 28.007001009810725],
                        [120.65702003062492, 28.022439362641567]
                    ]
                  ] 
               } 
            }
         ] 
   },
   "visible": true
}