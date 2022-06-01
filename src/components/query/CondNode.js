import React, { Component } from 'react';

import Node from './Node.js'
import MyMap from '@/components/map/index.js'
import NumberRow from '@/components/config/NumberRow'
import './CondNode.scss'
import { Collapse, Button, Popover, Divider, Checkbox, Row, Col} from 'antd';
import Event from '@/util/event'
import { MyIcon } from '@/components/iconfont'
import { POI_TYPES,POI_COLOR_MAP }  from '@/../server/config'
import { COLOR_RED,COLOR_BLUE } from '@/QueryPanel/config'

import { VORONOI_LAYER,
         POI_LAYER,
         HEATMAP_LAYER,
         CHOROPLETH_MAP_LAYER,
         FRAME_SELECT_LAYER,
         CIRCLE_RADIUS_LAYER } from '@/components/map/config' 

const CheckboxGroup = Checkbox.Group;



class CondNode extends Component{
	constructor( props ){
		super(props)
		this.state = {
			dataSource : [{
				name :  'people',
				color : COLOR_RED, 
				icon : 	'icon-7',
			},
			{
				name : 'weibo' ,
				color : COLOR_RED, 
				icon : 	'icon-weibo'
			},
			{
				name : 'taxi' ,
				color : COLOR_RED, 
				icon : 	'icon-chuzuche'
			},
			{
				name : 'poi' ,
				color : COLOR_BLUE, 
				icon : 	'icon-poi'
			}],
			selected: null,
			time : {
				start : '00:00',
				end : '23:59'
			},
			regions : [],
			querying : false,
			maps: [],
    		checkedList: POI_TYPES.slice(2,6) ,
    		indeterminate: true,
    		checkAll: false,
		}
	}
	componentWillMount(){
		let { dataSource,selected } = this.state

		this.setState({ selected:dataSource[3] })
	}
	handleTimeChange = ( label , event) => {
		let value = event.target.value
		let { time } = this.state
		time[ label ] = value
		this.setState({ time })
	}
	handleRegionSelect = () =>{
		const self  = this
		const { maps } = this.state
		const { id } = this.props
		const ev = Event.get()
		const eventName =  id + 'finishGlobalFrameRegion'
		
		ev.once(eventName , ( data )=>{
			let { regions } = self.state
			let layerData = {
				"cursor": false,
				"draw": false,
   				"visible": true,
            	type : FRAME_SELECT_LAYER,
            	id : "FRAME_SELECT_LAYER" + id,
            	data 
			}
			maps.push( { datas: [layerData] } )
			let region = data['features'][0]['geometry']['coordinates'][0]
			regions.push( region )
			self.setState({ maps,regions })
		})
		ev.emit('globalSetFrameRegion' , id)
	}
	handleCondDelete = (map , e)=>{
		let { regions } = this.state
		e.preventDefault() 
		let { maps } = this.state 
		maps = maps.filter((_map,i) =>{
			if(_map != map){
				return true
			}else{
				regions.splice(i,1)
				return false
			}
		})
		this.setState({ maps,regions })
	}
	handleQuery = async () =>{
		let { selected,time,regions,checkedList } = this.state
		let { onQuery,id } = this.props
		const condition = {
			condNodeId : id , 
			source : selected,
			time,
			checkedList,
			regions : regions[0]  // to do later
		}
		if( onQuery ){
			this.setState({ querying :true })
			let res = await onQuery( condition )
			this.setState({ querying : false })
		}
	}

	  onChangeType = checkedList => {
	    this.setState({
	      checkedList,
	      indeterminate: !!checkedList.length && checkedList.length < POI_TYPES.length,
	      checkAll: checkedList.length === POI_TYPES.length,
	    });
	  };

	  onCheckAllChange = e => {
	    this.setState({
	      checkedList: e.target.checked ? POI_TYPES : [],
	      indeterminate: false,
	      checkAll: e.target.checked,
	    });
	  };

	render(){
		const self = this
		const { props } = this
		const { dataSource, selected, time, regions, maps,checkedList  } = this.state

		return(
			<Node {...props} > 
				<div  className='data-source'>
					{
						dataSource.map((source,i)=>{
							return(
								<Popover content={ source['name'] } title={null} key={i} >
									<Button 
										style={{ 
											backgroundColor : source['color'] , 
											opacity :  source['name'] == selected['name'] ? 1 : 0.3
										}}
										onClick={() => { self.setState({ selected:source })}}
										type="primary" 
										size='large'
									>
										<MyIcon type={source['icon']}/>
									</Button>
								</Popover>
							)
						})
					}	
				</div>

				<Divider className='header'>Input Tools</Divider>
					
				<div  className='input'>
					<div className='input__row'>
						<div className='input__row__title'>
							Region Selection
						</div>
						<div className='input__row__selectbtn'
							onClick={this.handleRegionSelect}
						>
							<MyIcon type='icon-frame-select'/>
						</div>
					</div>

					{
						selected['name'] != 'poi' ? (
							<div className='input__row'>
								<div className='input__row__title'>
									Time Selection
								</div>
								<div className='input__row__time'>
									<input
										onChange={this.handleTimeChange.bind(this,'start')}
										defaultValue={ time['start'] }
										className={`input__row__time--start  ${( checkTime(time['start']) ? '' : 'error' )}`}/>
									~
									<input 
										onChange={this.handleTimeChange.bind(this,'end')}
										defaultValue={ time['end'] }
										className={`input__row__time--end  ${( checkTime(time['end']) ? '' : 'error' )}`}/>
								</div>
							</div>
						): null
							/*<div className='input__blcok'>
							          <Checkbox
							            indeterminate={this.state.indeterminate}
							            onChange={this.onCheckAllChange}
							            checked={this.state.checkAll}
							          >
							          	Select All Types			
							          </Checkbox>
							        <br />
							        <CheckboxGroup
									  value={this.state.checkedList}
							          onChange={this.onChangeType}
							        >
							            <Row>
									      {POI_TYPES.map((type)=>(
									      	<Col span={8} key={type}>
												<Checkbox value={type}>{type}</Checkbox>
												<span
													 style={{ 
													 	backgroundColor: POI_COLOR_MAP[type],
													 	width : '20px',
    													height: '10px',
    													display: 'inline-block'
													 }}
												/>
									       	</Col>
									       ))} 
									    </Row>
							        </CheckboxGroup>
							</div>*/
						
					}

				</div>

				<Divider className='header'>Condition List</Divider>

				<div  className='cond'>
					{ maps.map((map,i)=>(
						<details className='cond__row' key={i}>
				            <summary>
				            	<div className='cond__row__title'>
				            		Region
				            	</div>
				            	<div className='cond__row__btn'
				            		onClick={this.handleCondDelete.bind(this , map)}
				            	>
				            		<MyIcon  type='icon-shanchu' />
				            	</div>
				            </summary>
			            	<div className='cond__row__map float-box'>
			            		<MyMap  { ...map }
			            			ref={ref => map.mapRef = ref}/>
				            </div>
				        </details>
					))}


				</div>	

				<div className='bottom'>
		        	<Button
		        		loading={this.state['querying'] }
		        		disabled={ !checkCondition(selected , time , regions ,checkedList ) }
		        		onClick={this.handleQuery} 
		        		type='primary' 
		        		className='submit-btn'> 
		        		Query  
		        	</Button>
				</div>

			</Node>
		)
	}
}

export default CondNode

/*  Check hour and minutes */
// e.g. checkTime('05:20')
const checkTime = (timeStr) =>{
	let reg = /^(\d\d):(\d\d)$/
	let res = timeStr.match(reg)
	if(!res) return false

	let hours = parseInt(res[1])
	let minutes = parseInt(res[2])
	if( minutes >= 0 && minutes < 60 && hours>=0 && hours < 24)
		return true
	return false
}

const checkCondition = ( source , time , regions ,checkedList ) => {
	if(source['name'] == 'poi'){
		return checkedList.length > 0
	}
	let cSource = ( source != null)
	let cTime = ( checkTime( time['start'] ) && checkTime( time['end'] ) )
	let cRegion = regions.length > 0

	return ( cSource && cTime && cRegion )
}