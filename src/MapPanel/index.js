import React, { Component } from 'react';
import { connect } from 'react-redux'
import MyMap from '@/components/map/index.js'
import Event from '@/util/event'
import { Drawer, Button } from 'antd'
import './index.scss'
import ConfigPanel from '@/components/map/Panel'
import Legend from './legend'
import { MyIcon } from '@/components/iconfont'
import { MapList } from '@/components/config/MapList'
import { colorScale } from '@/components/map/util'
class MapPanel extends Component {
	constructor( props ){
		super(props)
		this.state = {
			configVisible : false,
			params : {
				types : {},
				ids : {},
			},
			maxSupport : 0
		}
	}
	componentWillMount(){
		console.log(' global map init ')
	}
	componentDidMount(){
		let mapId = this.mapRef.getId()
		this.setState({ mapId })
		const ev = Event.get()
        ev.on("globalSetFrameRegion", this.handleGlobalSetFrameRegion , this)

	}
	handleGlobalSetFrameRegion = ( fromId ) =>{
		const mapId = this.mapRef.getId()
		const ev = Event.get()
		ev.emit( mapId + 'changeMapFrameSelectVisible' , true )
      	ev.emit( mapId + 'startMapFrameSelect')
      	this.handleGlobalFrameRegionCallBack( fromId )
	}
	handleGlobalFrameRegionCallBack = ( fromId )=>{
		let { mapId } = this.state
		const  ev = Event.get()
		const  eventName = mapId + 'endMapFrameSelect'
		ev.once( eventName , ( data )=>{
			ev.emit( fromId + 'finishGlobalFrameRegion' , data)
			ev.emit( mapId + 'changeMapFrameSelectVisible' , false )
		}, this)
	}
	handleDeleteLayer = (id) =>{
		this.props.deleteGlobalMap( {id} )
	}
	handleChangeVisible = (id , ifVisible) =>{
		let { params } = this.state 
		let param = params['ids'][id]
		if(param){
			param['visible'] = !ifVisible
		}else{
			param = {
				visible : !ifVisible
			}
		}
		params['ids'][id] = param
		this.setState({ params })	
	}
	handleChangeRenderParam = ( type , paramName , value ) =>{
		let { params } = this.state 
		if(!params['types'][type]){
			params['types'][type] = {}
		}
		params['types'][type][paramName] = value
		this.setState({ params })
	}
	render(){
		let { map } = this.props
		let { datas } = map 
		const self = this
		let { configVisible , params } = this.state
		return (
			<div className='app'>
				<MyMap
					params={ params }
					datas={ datas }
					ref={ref => self.mapRef = ref}/>

	            <Drawer
	              placement="right"
	              onClose={() => this.setState({ configVisible:false }) }
	              mask={false}
	              visible={ configVisible }
	              getContainer={false}
	              style={{ position: 'absolute' , 
	                       opacity : 0.9,
	                       'pointerEvents':  configVisible ? 'all' : 'none',
	                       'backgroundColor' : '#FFFBF5'
	                    }}
	              width={450}
	            >
	            	<MapList  
	            		layers={datas}
	            		params={ params['ids'] }
						deleteLayer={this.handleDeleteLayer}
						changeVisible={this.handleChangeVisible}
	            	/>
	            </Drawer>

				{!configVisible ? (<div className='config-btn'>
					<Button 
						onClick={() => this.setState({ configVisible:true })}
						type="primary"
						shape="circle"
						size='large'>
						<MyIcon type='icon-layer'/>
					</Button>
				</div>) : null }

				<div className='legend-area'>
					<Legend
						maxSupport={ getMaxTaxiSupport(datas) }
						onChangeRenderParam={this.handleChangeRenderParam}
						/>
				</div>
			</div>
		)
	}
}

const getMaxTaxiSupport = (datas) => {
	for(let i = 0;i < datas.length;i++){
		let  layer = datas[i]
		if( layer['type'] == 'MOVEMENT_FLOW_LAYER' ){
			let { extent } = colorScale( layer['data'] ,  (d)=>d['support'] , 'taxi' )
			return extent[1]
		}
	}
	return 0
}


const mapStateToProps = ({ map }) => {
	return {
		map 
	}
}
const mapDispatchToProps = dispatch => {
	return {
		deleteGlobalMap : (argvs) => dispatch({
			type : 'DELETE_GLOBAL_MAP',
			payload : argvs
		})
	}
}

let HOC = connect(mapStateToProps, mapDispatchToProps)(MapPanel)
export default HOC 

























