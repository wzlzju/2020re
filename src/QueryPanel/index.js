import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Button } from 'antd';
import { DropTarget } from 'react-dnd'
import { RES_NODE, COND_NODE, TYPE_RES_PUBLIC_NODE,
		TYPE_RES_NODE, TYPE_COND_NODE } from './config'
import ResNode from '@/components/query/ResNode.js'
import ResNodePublic from '@/components/query/ResNodePublic.js'
import CondNode from '@/components/query/CondNode.js'
import Links from '@/components/query/Links.js'
import { MyIcon } from '@/components/iconfont'
import { fetchWS } from '@/util/query.js'
import * as util from './util'
import './index.scss'
import { colorScale }  from '@/components/map/util'
import { taxiSearchCondition,
		 taxiGraphCondition,
		 weiboSearchCondition,
		 weiboGraphCondition,
		 poiQueryCondition } from './mock.js'

import { VORONOI_LAYER,
         POI_LAYER,
         HEATMAP_LAYER,
         CHOROPLETH_MAP_LAYER,
         FRAME_SELECT_LAYER,
         CIRCLE_RADIUS_LAYER,
         MOVEMENT_FLOW_LAYER,
         UTILITY_LAYER,
         TRAJECTORY_LAYER,
         GLYPH_LAYER } from '@/components/map/config' 

import { randomPointsInPolygon } from '@/components/map/layers/simulation'

class QueryPanel extends Component {
	constructor( props ){
		super(props)
		this.state = {
			nodes : [],
			width : 100,
			height : 100,
			links : []
		}
	}
	componentDidMount(){
      	let { clientWidth, clientHeight } = this.panelRef  // after Did Mount

      	this.setState({
      		width : clientWidth,
      		height : clientHeight
      	})

      	// let condNodeId = this.addCondNode()
      	// this.mockTaxi()
      	// this.mockWeibo()
      	// this.mockPOI()
	}
	moveNode(id,x,y){
      	let { scrollHeight , scrollWidth } = this.panelRef
      	// console.log( scrollHeight , scrollWidth )
	  	let { nodes,links }  = this.state

	  	nodes = nodes.map((node)=>{
	  		if(node['id'] == id){
	  			node['x'] = x
	  			node['y'] = y
	  		}
	  		return node
	  	})
	  	links = links.map((link)=>{
	  		let { start,end } = link
	  		if(start['id'] == id  || end['id'] == id){
	  			let startNode = nodes.find((node)=> node['id'] == start['id'])
	  			let endNode   = nodes.find((node)=> node['id'] == end['id'])
	  			return util.geneLink( startNode,endNode )
	  		}
	  		return link
	  	})

		this.setState({ 
			nodes,links,
			width : scrollWidth,
			height : scrollHeight
		})
	}
	handleRunAll = async ( condition  ) =>{
		if(condition['source']['name'] != "poi")
			condition['regions'] = [
				    [
				      120.63844828703986,
				      28.00380883416421
				    ],
				    [
				      120.71116891707047,
				      28.00380883416421
				    ],
				    [
				      120.71116891707047,
				      27.983301684701836
				    ],
				    [
				      120.63844828703986,
				      27.983301684701836
				    ],
				    [
				      120.63844828703986,
				      28.00380883416421
				    ]
				]
		let resNodeId = await this.handleQuery( condition )

		condition = {
			...condition,
			id : resNodeId,
		}	
		function sleep(ms) {
		    return new Promise(resolve => setTimeout(resolve, ms));
		}
		await sleep(1000)
		await this.handleInformationGraph( condition )
		await this.handleVisualization( condition )
	}
	// For Cond Node to Query 
	handleQuery = async ( condition ) => { 
		let { nodes } = this.state
		let { source, time, regions, condNodeId } = condition
		let condNode = nodes.find((node)=>node['id'] == condNodeId)
		let node
		if( source['name'] == 'poi'){
			node = this.geneNode(TYPE_RES_PUBLIC_NODE , condNode)
		}else{
			node = this.geneNode(TYPE_RES_NODE , condNode)
		}
	    node['timeRange'] = condition['time']
	    node['source'] = source
	    let id = node['id']

		const params = {
			...condition,
			id : node['id']
		}

		let data, num, mapData 
		switch(source['name']){
			case "taxi":
				data = await fetchWS('/taxiSpatialPartition' , params )
				num = data['num']
				mapData = {
		    		type : VORONOI_LAYER,
		    		id :   "VORONOI_LAYER-TAXI"+id,
		    		data : data['data'],
		    	}
		    	data = {
		    		datas :[mapData]
		    	}
			    break

			case "weibo":
				data = await fetchWS('/weiboSpatialPartition' , params )
				num = data['num']
				mapData = {
		    		type : VORONOI_LAYER,
		    		id :   "VORONOI_LAYER-WEIBO"+id,
		    		data : data['data'],
		    	}
		    	data = {
		    		datas :[mapData]
		    	}
				break

			case "poi":
				let datas = await fetchWS('/pois',params)
				num = datas['num']
				let data1 = {
		    		type : POI_LAYER,
		    		id :   "POIS"+id,
		    		data : datas['data'],
		    	}
		    	let data2 = {
		    		type : HEATMAP_LAYER,
		    		id : "POI HEAYMAP" + id,
		    		data : datas['data']
		    	}
				data = {
			    	datas : [ data2 ],
			    	statics : datas['statics'],
			    	pois : datas['data']
				}
				break
			default:
				data = []

		}
		node['num'] = num
		this.addResNode( node , data , condNodeId )
		return node['id']
	}
	// Res Node first Run Btn 
	handleSpatialPartition = async (condition) => {
		let { id, source } = condition
		let { nodes } = this.state

		let data 
		switch(source['name']){
			case "taxi":
				data = await fetchWS('/taxiSpatialPartition' , condition )
			    break
			case "weibo":
				data = await fetchWS('/weiboSpatialPartition' , condition )
				break
			default:
				data = []
		}
		
	    nodes.map((node)=>{
	    	if(node['id'] == id){
				node['num'] = data['num']
				let mapData = {
		    		type : VORONOI_LAYER,
		    		id :   "VORONOI_LAYER-"+ source['name'].toUpperCase() + id,
		    		data : data['data'],
		    	}
		    	node['data']['datas'] = [mapData]
	    	}
	    })
	    this.setState({  nodes })
	    return
	}
	// Res Node Second Run Btn
	handleInformationGraph = async (condition) => {
		let { nodes } = this.state
		let { id,source } = condition
		let data, retNode, exist, mapData
	    nodes.map((node)=>{
	    	if(node['id'] == id){
	    		retNode = node
	    	}
	    })

		switch(source['name']){
			case "taxi":
				let { choropleths, vectors, utility , trajs } = await fetchWS('/taxiInformationGraph' , condition )
	    		exist = false
				let { extent:__extent, } = colorScale(  vectors , (d)=>d['support'] , 'taxi')
	    		mapData = {
	    			type : MOVEMENT_FLOW_LAYER,
	    			data: vectors ,
	    			id : "MOVEMENT_FLOW_LAYER" + id
	    		}
	    		retNode['data']['datas'] = retNode['data']['datas'].map((layer)=>{
	    			if(layer['type'] == MOVEMENT_FLOW_LAYER){  //更新
	    				exist = true
	    				return mapData
	    			}
	    			return layer
	    		})
	    		if(!exist){  // 添加
	    			retNode['data']['datas'].push(mapData)
	    		}
	    		/***************/
	    		exist = false
				let { extent:_extent, scale:_scale } = colorScale(  choropleths , (d)=>d['support'] ,'taxi' )
				// console.log("choropleths" , _extent)
				choropleths = choropleths.map((d)=> {
					d['fillColor'] = _scale( d['support'] )
					return d
				})
	    		mapData = {
	    			type : CHOROPLETH_MAP_LAYER,
	    			data: choropleths ,
	    			id : "CHOROPLETH_MAP_LAYER-TAXI" + id
	    		}
	    		retNode['data']['datas'] = retNode['data']['datas'].map((layer)=>{
	    			if(layer['type'] == CHOROPLETH_MAP_LAYER){  //更新
	    				exist = true
	    				return mapData
	    			}
	    			return layer
	    		})
	    		if(!exist){  // 添加
	    			retNode['data']['datas'].push(mapData)
	    		}
	    		/***************/
	    		exist = false
	    		let points = [],_points
	    		const percent = 0.5
				choropleths.map((group)=>{
					let { members , polygon , support} = group
					_points = randomPointsInPolygon( polygon , support*percent )
					points = points.concat(_points)
					_points = members.slice(0,support*(1-percent)).map((p)=> [p['lng'],p['lat']])
					points = points.concat(_points)
				})
	    		mapData = {
	    			type : 'SIMULATAION_LAYER',
	    			data: points ,
	    			id : "SIMULATAION_LAYER-TAXI" + id
	    		}
	    		retNode['data']['datas'] = retNode['data']['datas'].map((layer)=>{
	    			if(layer['type'] == UTILITY_LAYER){  //更新
	    				exist = true
	    				return mapData
	    			}
	    			return layer
	    		})
	    		if(!exist){  // 添加
	    			retNode['data']['datas'].push(mapData)
	    		}
	    		/***************/
	    		// exist = false
	    		// mapData = {
	    		// 	type : 'TRAJECTORY_LAYER',
	    		// 	data: trajs ,
	    		// 	id : "TRAJECTORY_LAYER-TAXI" + id
	    		// }
	    		// retNode['data']['datas'] = retNode['data']['datas'].map((layer)=>{
	    		// 	if(layer['type'] == TRAJECTORY_LAYER){  //更新
	    		// 		exist = true
	    		// 		return mapData
	    		// 	}
	    		// 	return layer
	    		// })
	    		// if(!exist){  // 添加
	    		// 	retNode['data']['datas'].push(mapData)
	    		// }
	    		/***************/
	    		exist = false
	    		mapData = {
	    			type : 'GLYPH_LAYER',
	    			data: utility ,
	    			id : "GLYPH_LAYER-TAXI" + id
	    		}
				utility.map((d)=>{
	    			let radiusWidth = 4 * Math.random()
	    			radiusWidth = radiusWidth < 1 ? 1  : radiusWidth
	    			d['radiusWidth'] = radiusWidth
	    		})
	    		retNode['data']['datas'] = retNode['data']['datas'].map((layer)=>{
	    			if(layer['type'] == GLYPH_LAYER){  //更新
	    				exist = true
	    				return mapData
	    			}
	    			return layer
	    		})
	    		if(!exist){  // 添加
	    			retNode['data']['datas'].push(mapData)
	    		}

			    break


			case "weibo":
				data = await fetchWS('/weiboInformationGraph' , condition )
				let { extent, scale } = colorScale(  data , (d)=>d['support'] , 'weibo')
				// console.log("choropleths weibo", extent )
				data = data.map((d)=> {
					d['fillColor'] = scale( d['support'] )
					return d
				})
				exist = false
				mapData = {
					type : CHOROPLETH_MAP_LAYER,
					id : "CHOROPLETH_MAP_LAYER-WEIBO" + id,
					data
				}
	    		retNode['data']['datas'] = retNode['data']['datas'].map((layer)=>{
	    			if(layer['type'] == CHOROPLETH_MAP_LAYER){ 
	    				exist = true
	    				return mapData
	    			}
	    			return layer
	    		})
	    		if(!exist){
	    			retNode['data']['datas'].push( mapData )
	    		}
				break
			default:
				data = []
		}  

	    this.setState({  nodes })
	    return retNode
	}
	// Res Node Third Step
	handleVisualization = async (condition) =>{
		let { id } = condition
 		let node = await this.handleInformationGraph( condition )
 		let { data } = node
 		data['datas'].map((mapData)=>{
 			// console.log(mapData)
 			if(mapData['type'] == VORONOI_LAYER) return true
 			this.props.deleteGlobalMap({ id:mapData['id'] }) 			
 			this.props.addToGlobalMap({ data:mapData }) 			
 		})
		return
	}
	geneNode = ( type = TYPE_COND_NODE , condNode ) => {
		// let { clientWidth, clientHeight } = this.panelRef  // after Did Mount
      	let { scrollHeight , scrollWidth } = this.panelRef
		let node = util.geneNode(type, scrollWidth ,scrollHeight , condNode)	
		return node 
	}
	addResNode = (node , data , condNodeId) => {
		let { nodes } = this.state 
		node['data'] = data
		node['condNodeId'] = condNodeId
		nodes.push( node )
		this.setState({ nodes })

		let startNode = nodes.find((node)=>node['id'] == condNodeId)
		this.addLink( startNode , node )
	}	
	addCondNode = () =>{
		let { nodes } = this.state 
		let node = this.geneNode( TYPE_COND_NODE )
		nodes.push( node )	
		this.setState({ nodes })
		return node['id']
	}
	addLink = (startNode , endNode ) =>{
		let { links } = this.state
		links.push(  util.geneLink( startNode , endNode ) )
		this.setState({ links })
	}
	handleDeleteNode = ( id ) =>{
		let { nodes,links } = this.state
		nodes = nodes.filter((node)=> node['id'] != id )
		links = links.filter((link)=> link['start']['id'] != id && link['end']['id'] != id )
		this.setState({ nodes,links })
	}
	render(){
		const self = this
    	const { connectDropTarget } = this.props
		const { nodes } = this.state
		return connectDropTarget(
			<div className='query-app' ref={ref => self.panelRef = ref }> 

				{
					nodes.map((node,i)=>{
						let { type } = node
						if(type == TYPE_RES_NODE){
							return ( 
								<ResNode  
									key={i} {...node} 
									onNodeDelete={this.handleDeleteNode}
									onSpatialPartition={this.handleSpatialPartition}
									onInformationGraph={this.handleInformationGraph}
									onVisualization={this.handleVisualization}
								/> 
							)
						}else if(type == TYPE_RES_PUBLIC_NODE){
							return (
								<ResNodePublic 
									key={i} {...node} 
									onNodeDelete={this.handleDeleteNode}
									/>
							)
						}
						else{
							return ( 
								<CondNode  
									onNodeDelete={this.handleDeleteNode}
									key={i} {...node}
									onQuery={this.handleRunAll}
								/> 
							)
						}
					})
				}

				<Links
					links={this.state.links}
					width={this.state.width}
					height={this.state.height}
				/>
				
				<div className='add-btn'>
					<Button 
						onClick={self.addCondNode}
						type="primary" shape="circle"  size='large'>
						<MyIcon type='icon-add'/>
					</Button>
				</div>

			</div>
		)
	}
	async mockTaxi(){
      	let condNodeId = this.addCondNode()
      	let cond = taxiSearchCondition()
      	this.handleRunAll( cond )
		// let resNodeId = await this.handleQuery( cond )
		// cond = taxiGraphCondition( condNodeId , resNodeId )
		// this.handleVisualization( cond )
	}
	async mockWeibo(){
      	let condNodeId = this.addCondNode()
      	let cond = weiboSearchCondition()
		let resNodeId = await this.handleQuery( cond )
		// cond = weiboGraphCondition( condNodeId,resNodeId )
		// this.handleVisualization( cond )
	}
	async mockPOI(){
      	let condNodeId = this.addCondNode()
      	let cond = poiQueryCondition()
		let resNodeId = await this.handleQuery(  cond )
	}
}

const mapStateToProps = ({}) => {
	return {}
}
const mapDispatchToProps = dispatch => {
	return {
		switchToGlobalMap : ( argvs ) => dispatch({
			type : 'SWITCH_TO_GLOBAL_MAP',
			payload : argvs
		}),
		addToGlobalMap : ( argvs ) => dispatch({
			type : 'ADD_TO_GLOBAL_MAP',
			payload : argvs
		}),
		deleteGlobalMap : (argvs) => dispatch({
			type : 'DELETE_GLOBAL_MAP',
			payload : argvs
		})
	}
}

const targetSpec =  {
	// called when a item is dropped on target
  drop(props, monitor, component) { 
    if (!component) {   //该组件的实例     
      return null
    }
    const item = monitor.getItem()   //  获取 drag 对象 ，来自与 dragsource 的 beginDrag的返回    // monitor 为 DropTargetMonitor 的实例
    const delta = monitor.getDifferenceFromInitialOffset()
    if(!delta || !item)  return
    const x = Math.round(item.x + delta.x)
    const y = Math.round(item.y + delta.y)
    component.moveNode(item.id, x, y)  //调用本组件的函数

  },
	// 拖动的时候也触发
  hover(props, monitor, component) {  
    if (!component) {     
      return null
    }

    return
    
    const item = monitor.getItem() 
    const delta = monitor.getDifferenceFromInitialOffset()
    const x = Math.round(item.x + delta.x)
    const y = Math.round(item.y + delta.y)
    component.moveNode(item.id, x, y) 
  },
}

function collect( connect , monitor ){
  return {
    connectDropTarget: connect.dropTarget(),
  }
} 

QueryPanel = DropTarget('NODE' , targetSpec , collect )(QueryPanel)
QueryPanel = connect(mapStateToProps, mapDispatchToProps)(QueryPanel)

export default QueryPanel