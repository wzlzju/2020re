import {  PolygonLayer, IconLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core'
import { PathStyleExtension } from '@deck.gl/extensions';
import { hexToRGBArray } from '../util.js'
import circle from '@turf/circle';
import distance from '@turf/distance';
import * as ICON from './assets/arrow-circle.png'
import Event from '@/util/event'
import { SELECT_STROKE_COLOR,
         SELECT_STROKE_OPACITY,
         SELECT_FILL_COLOR,
         SELECT_FILL_OPACITY } from '../config'

const LAYER_NAME = 'CIRCLE_RADIUS_LAYER' 

const circleFillColor = '#1f78b4'

export let positionMoveCallBack

export const  circleRadiusLayer = ( subProps , mapId ) => {
  const { 
    visible = true
  } = subProps

  // console.log(subProps)
  let  ev = Event.get()

  const center = subProps['center']
  const radius = subProps['radius']
  const nest = subProps['nest']

  const circleGeoJson = circle(center, radius, { steps:64 } )
  const circleData = circleGeoJson['geometry']['coordinates'] 
  
  let iconData = center
  circleData[0].map((lnglat) => {
      if( lnglat[0] > iconData[0] )  iconData = lnglat
  })
  let data = {
    'icon' :   [{ id:'icon' ,  coordinates: iconData , nest  }] , 
    'circle' :  circleData
  }

  const handleDragStart = (info) => {
      const object = info['object']
      if(object && object['id'] == 'icon' ){ 
        ev.emit(mapId + 'startMoveCircleHandle')
      }
  }
  const handleDrag =  (info) => {
      const coor = info['coordinate']
      const object = info['object']
      if(object && object['id'] == 'icon'  ){ 
          var newRadius = distance(center , coor);
          ev.emit(mapId + 'movingCircleHanle' ,  { radius: newRadius , nest : object['nest'] } )
      }
  }
  const handleDragEnd = (info) => {
    ev.emit(mapId + 'endMoveCircleHandle')
  }

  const handleHover = (info) =>{
  }
  return new CircleSelectLayer({
     id : `${LAYER_NAME}-${nest}` ,
     data,
     handleDragStart,
     handleDrag,
     handleDragEnd,
     handleHover,
     visible,
     fillOpacity :  nest == 'inner' ?  SELECT_FILL_OPACITY+0.4 : SELECT_FILL_OPACITY
  })
}


class CircleSelectLayer extends CompositeLayer {
  initializeState() {

  }

  renderLayers(){
      return[
      // 圆形 
      new PolygonLayer({
        id:  `${LAYER_NAME}-circle-polygon-layer` + getRamdomStamp(),
        data : this.props.data['circle'],
        visible: this.props['visible'],
        pickable: false,
        stroked: true,
        filled: true,
        wireframe: true,
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 2,
        getPolygon: d => d,
        getFillColor: d => hexToRGBArray(SELECT_FILL_COLOR ,  this.props['fillOpacity'] ) , 
      getLineColor: hexToRGBArray(SELECT_STROKE_COLOR , SELECT_STROKE_OPACITY ),
        getLineWidth: 2,
      }),

      // handler
      new IconLayer({
        id : `${LAYER_NAME}-icon-layer` + getRamdomStamp(),
        data: this.props.data['icon'],
        visible: this.props['visible'],
        getIcon: (d) => { return {
          url: ICON,
          width: 128,
          height: 128,
        }},
        sizeScale: 2,
        getPosition: d => {
          let coor = d['coordinates']
          // console.log( coor )
          coor.push( 100 )
          return coor
        },
        getSize: 20,
        pickable: true,
        autoHighlight : true,
      })
    ]
  }
  onHover( info ){
    // console.log(info)
    this.props.handleHover(info)
  }
  onDragStart( info ){
    this.props.handleDragStart( info )
  } 
  onDrag(info){
    this.props.handleDrag(info)
  }
  onDragEnd(){
    this.props.handleDragEnd()
  }
}

CircleSelectLayer.layerName = 'CircleSelectLayer' 


function getRamdomStamp(argument) {
    return Math.random().toFixed(5).slice(2)
}