import React, { Component, useEffect, useState, useRef} from 'react';
import {render} from 'react-dom';
import MapGL ,{ StaticMap , FullscreenControl} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { MapController, WebMercatorViewport } from '@deck.gl/core';

import './index.css'

import { INITIAL_VIEW_STATE,
          MAPBOX_TOKEN,
          MAP_STYLE,
          CONSOLE_PRINT  } from './config'
import { createSimulationLayer } from './layers/data-utility/SimulationLayer.js'; 
import { createGlyph }           from './layers/data-utility/GlyphLayer.js'; 
import { createBarChart }     from './layers/data-utility/BarChartLayer.js'
import { simulationLayer }    from './layers/simulation'
import { voronoiRegionLayer } from './layers/voronoi' 
import { poiLayer }           from './layers/poi' 
import { heatmapLayer }       from './layers/heatmap'
import { trajsLayer }         from './layers/path'
import { choroplethMapLayer } from './layers/choroplethMap'
import { circleRadiusLayer }  from './layers/selectRadius'
import { frameSelectLayer }   from './layers/selectFrame'

import FlowLayer from './layers/flow'
import GlyphLayer from './layers/glyph'
import { VORONOI_LAYER,
         POI_LAYER,
         HEATMAP_LAYER,
         CHOROPLETH_MAP_LAYER,
         FRAME_SELECT_LAYER,
         CIRCLE_RADIUS_LAYER,
         MOVEMENT_FLOW_LAYER,
         UTILITY_LAYER,
         SIMULATAION_LAYER,
         TRAJECTORY_LAYER,
         GLYPH_LAYER } from './config' 

const Layers = (props) => {
    let { mapId } = props
    let layers = getLayers( props['params'] , mapId )
    // print( props , layers)

    const [viewport, setViewport] = useState()
    const mapRef = useRef();
    // 第一次渲染完成后 获取 长宽 更新 
    useEffect(()=>{
        let { clientWidth, clientHeight } = mapRef.current  
        let state = {
          ...INITIAL_VIEW_STATE,
          width : props['width'] || clientWidth ,
          height : props['height'] || clientHeight
        }
        setViewport( new WebMercatorViewport( state ))
    }, [])
  
    const cursor = getCursor( props['params'] )

  	return (
  		<div id="map" ref={mapRef}>
  			<DeckGL 
  				controller={  props['controller'] }
  				layers={ layers } 
  				initialViewState={ INITIAL_VIEW_STATE }
          getCursor={()=>cursor}
          onViewStateChange={ v => {
            let { viewState } = v  // 更新 viewport
            setViewport( new WebMercatorViewport(viewState) )
          }}
  			>
  				<MapGL
  				  reuseMaps
  				  mapStyle={MAP_STYLE}
  				  preventStyleDiffing={true}
  				  mapboxApiAccessToken={MAPBOX_TOKEN}
  				>
  				</MapGL>
  			</DeckGL>
        
        {  getSVGLayer(props['params'] , viewport)}

        <div
  				id={`tooltip${mapId}`}
  				style={{
  					position: 'absolute',
  					'zIndex': 1,
  					'pointerEvents': 'none'
  				}}
  			></div>
  		 </div>
  	);
}

const getLayers =  function( layerDatas , mapId ){
    if(!layerDatas || layerDatas.length == 0) return []

    let layers = []
    layerDatas.map((layer)=> {
        let { type, id } = layer

        switch( type ){
            case VORONOI_LAYER : 
              layers.push( voronoiRegionLayer( layer) )
              break

            case UTILITY_LAYER:
              layers.push( createBarChart(layer) )
              break 
              
            case SIMULATAION_LAYER :
              layers.push( simulationLayer(layer) )
              break              

            case POI_LAYER:
              layers.push( poiLayer(layer) )
              break

            case HEATMAP_LAYER:
              layers.push( heatmapLayer(layer) )
              break
              
            case CHOROPLETH_MAP_LAYER:
              layers.push( choroplethMapLayer(layer) )
              break

            case TRAJECTORY_LAYER:
              layers.push( trajsLayer(layer) )
              break 

            case CIRCLE_RADIUS_LAYER:
              let inner = circleRadiusLayer( 
                  { ...layer, radius:layer['innerRadius'], nest:'inner'},
                   mapId 
              )
              let outer = circleRadiusLayer( 
                  { ...layer, radius:layer['outerRadius'], nest:'outer'}, 
                  mapId 
                )
              layers.push(inner)
              layers.push(outer)
              break

            case FRAME_SELECT_LAYER:
              layers.push( frameSelectLayer(layer, mapId) )
              break
        }
    })

    return layers
}

const getSVGLayer = function(layerDatas , viewport ){

  return layerDatas.map((layer)=> {
        let { type, id , data } = layer

        switch(type){
          case MOVEMENT_FLOW_LAYER:
              return ( <FlowLayer {...layer} data={data} viewport={viewport} />  )

          case GLYPH_LAYER:
              return ( <GlyphLayer {...layer} data={data} viewport={viewport} />  )
        }

  })

  return layerDatas
            .filter((layer) => layer['type']==MOVEMENT_FLOW_LAYER )
            .map((layer) => {
              let { data } = layer
              return (
                <FlowLayer {...layer} data={data} viewport={viewport} /> 
              )
            })
}

const print = ( props , layers ) =>{
     CONSOLE_PRINT && (()=>{
      console.log(`Layers of Map: ${props['mapId']} : ` )
      console.table( layers.map((layer)=>{
          if(!layer) return null
          let { id , lifecycle,props } = layer
          let layerName = layer['__proto__']['constructor']['layerName']
          return {
            id,lifecycle,
            layerName,
            longitude: -3.2943888952729092,
            latitude: 53.63605986631115,
          }
      }))
    })()  
}


const getCursor = ( params ) =>{
    let cursor = 'grab'
    params.map((layer) => {
      if( layer['type'] == FRAME_SELECT_LAYER){
        if( layer['cursor'] )
          cursor = 'crosshair'
        return false
      }
    })
    return cursor
}
export default  Layers