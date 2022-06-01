import * as React from 'react';
import './index.scss'
import Event from '@/util/event'
import PropTypes from 'prop-types';
import { generateMapId } from './util'
import { INITIAL_VIEW_STATE,CONSOLE_PRINT  } from './config'
import Layers from './Layers'
import { VORONOI_LAYER,
         POI_LAYER,
         HEATMAP_LAYER,
         CHOROPLETH_MAP_LAYER,
         FRAME_SELECT_LAYER,
         CIRCLE_RADIUS_LAYER } from './config' 

export default class Map extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            id : generateMapId(),
            params : {},
            layersParams : {},
            controller : true
        }
    }
    componentWillMount(){
        let { id: mapId,layersParams } = this.state
        let { params,datas } = this.props

        let ev = Event.get()
        // // 地图框选部分
        ev.on(mapId + 'startMapFrameSelect', this.setFrameSelect , this)
        ev.on(mapId + 'endMapFrameSelect', this.finishFrameSelect , this)
        ev.on(mapId + 'changeMapFrameSelectVisible',this.showFrameSelect , this)
        // ev.on(mapId + '地图更新结束',this.updateFrameSelect , this)

        // // 地图圆选部分
        ev.on(mapId + 'changeMapCircleSelectVisible' , this.changeCircleSelectVisible , this)
        ev.on(mapId + 'movingCircleHanle', this.updatePoint , this)
        ev.on(mapId + 'endMoveCircleHandle',this.handleDragEnd , this)
        ev.on(mapId + 'startMoveCircleHandle',this.handleDragStart , this)

        layersParams = mixParamsAndData(datas, params)
        this.setState({ layersParams  })
        if( !params ) this.setState({ params })
        // this.updatePoint( {} )
    }
    componentDidMount(){
        // 配合 getId 用于把 mapId 回传给父组件
        this.props.onRef && this.props.onRef( this )
        // this.setFrameSelect()
    }
    getId = () => {
        return this.state['id']
    }
    
    componentWillUnmount() {}

    componentWillReceiveProps(nextProps){
        let { params, layersParams } = this.state
        if( !nextProps['datas'] ) return 
        layersParams = mixParamsAndData( nextProps['datas'] , nextProps['params'] )
        this.setState({ 
            params,
            layersParams
        })
    }
    render() {
        const { layersParams,controller,id } = this.state
        const { props } = this

        return (
            <div className='deck-map'>
                <Layers
                    { ...props }
                    params={ layersParams }
                    controller={ controller }
                    mapId = { id }
                />
            </div>
        );
    }

    /*****************************
            地图框选部分 
    *****************************/
        // 可以开始框选
    setFrameSelect( method = 'rect' , data ){
        let { id: mapId,layersParams } = this.state
        let existLayer = false
        let defaultLayer = {
            'cursor' : true,
            method,
            data : data || {
              type: 'FeatureCollection',
              features: []
            },
            visible : true,
            type : FRAME_SELECT_LAYER,
            id : "FRAME_SELECT_LAYER" + mapId
        }

        layersParams = layersParams.map((layer)=>{
            if(layer['type'] == FRAME_SELECT_LAYER){
                existLayer = true
                return defaultLayer
            }
            return layer
        })
        if(!existLayer){
            layersParams.push( defaultLayer )
        }
        this.setState({ layersParams })
    }
        // 框选完成后触发
    finishFrameSelect(data){
        let { layersParams } = this.state
        let newFeatures = data['features'], originFeatures
        layersParams = layersParams.map((layer)=>{
            if(layer['type'] == FRAME_SELECT_LAYER){
                originFeatures = layer['data']['features']
                layer = {
                    ...layer,
                    cursor : false,
                    draw : false,
                    visible : true,
                    data : {
                        type: 'FeatureCollection',
                        features: originFeatures.concat( newFeatures )
                    }
                }
            }
            return layer
        })
        this.setState({ layersParams })
    }
        // will apply later
    updateFrameSelect( data ){
        let { layersParams } = this.state
        layersParams = layersParams.map((layer)=>{
            if(layer['type'] == FRAME_SELECT_LAYER){
                layer = {
                    ...layer,
                    cursor : false,
                    draw : false,
                    visible : true,
                    data,
                }
            }
            return layer
        })

        this.setState({ layersParams })
    }
        // Change Visible
    showFrameSelect(visible){
        let { layersParams } = this.state
        layersParams = layersParams.map((layer)=>{
            if(layer['type'] == FRAME_SELECT_LAYER){
                layer = {
                    ...layer,
                    visible
                }
            }
            return layer
        }) 
        this.setState({ layersParams })
    }

    /******************************
                圆形选择部分部分 
    *******************************/
    updatePoint( { center , radius , nest }  ){
        let { layersParams   } = this.state

        const GAP = 0.1

        let lng = INITIAL_VIEW_STATE['longitude'] , 
            lat = INITIAL_VIEW_STATE['latitude']
            
        center = center ?  center : [ lng , lat ]
        radius = radius ?  radius : 2

        if(!nest){  // default
            layersParams['circle'] = {
                center , 
                innerRadius : radius , 
                outerRadius : radius + 1 , 
                visible : false
            }
        }else{
            let { innerRadius,outerRadius } = layersParams['circle']
            if(nest == 'inner'){
                if( radius <= outerRadius - GAP && radius > 0)
                    layersParams['circle']['innerRadius'] = radius
            }else if(nest == 'outer'){
                if( radius >= innerRadius + GAP )
                    layersParams['circle']['outerRadius'] = radius
            }
        }
        this.setState({ 
            layersParams
        })
    }
        // Chnage Visible
    changeCircleSelectVisible( visible ){   
        const { layersParams } = this.state
        layersParams['circle']['visible'] = visible
        this.setState({
            layersParams
        })
    }  
        // 拖动开始
    handleDragStart(){
        this.setState({ controller:false })
    }
        // 拖动结束
    handleDragEnd(){
        let { id: mapId , layersParams } = this.state

        this.setState({ controller:true })

        let ev = Event.get()
        ev.emit(mapId + 'endCircleRadiusChange' , layersParams['circle'] )
    }
    print( obj ){
        if( CONSOLE_PRINT ){
            console.clear()
            console.log(`Map: ${this.state['id']} Props :` )
            console.table( obj )
        }
    }
}



Map.propTypes = {
    // 各 layers 的展示属性
    params : PropTypes.object,
    // 各 layers 的 数据
    datas  : PropTypes.object 
}

/*
    datas : [{   // 数据
        type,  // LayerName 
        id,
        data,
    }],
    params : {   // 绘制参数调整
        'types' : {
            type : { ... } , 
        }
        'ids' : {
            id : { ... } , 
        }
    },
    layersParams : [   // 最终往下传给 layers 的参数
        {
            type,
            id,
            data,
            {...param of type}
        }
    ]
----------------------------------------
    datas : {
        'layerName1' : data,
        'layerName2' : data,
    }
    params : {
        'layerName' : {...},
    }
    layersParams : {
        'layerName' : {
            {...params['layerName']},
            data : datas['layerName']
        }
    }
*/
const mixParamsAndData = ( datas , params ) => {
    if(!params) return datas
    if( params['types'] == undefined || params['ids'] == undefined) return datas
    let paramTypes = Object.keys(params['types'])
    let paramIds =  Object.keys(params['ids'])
    let layersParams = datas.map((layer)=>{
        let { type , id  } = layer
        let retLayer = layer
        if( paramTypes.indexOf(type) != -1 ){
            retLayer =  {
                ...retLayer,
                ...params['types'][type]
            }
        }
        if( paramIds.indexOf(id) != -1){
            retLayer = {
                ...retLayer,
                ...params['ids'][id]
            }
        }
        return retLayer
    })
    console.log( layersParams )
    return layersParams
}

const _mixParamsAndData = (datas , params , layersParams) =>{
        if(!datas || !params ) return layersParams
        Object.keys(params).map((key)=>{
            if( !layersParams[key] ) 
                layersParams[key] = {}
            layersParams[key] = params[key]
        })
        Object.keys(datas).map((key)=>{
            if( !layersParams[key] ) 
                layersParams[key] = {}
            layersParams[key]['data'] = datas[key]   // data key
        })

        return layersParams
}
