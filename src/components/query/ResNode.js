import React, { Component } from 'react';
import { connect } from 'react-redux'

import Node from './Node.js'
import MyMap from '@/components/map/index.js'
import NumberRow from '@/components/config/NumberRow'
import './ResNode.scss'
import { Steps,Popover,Button, Divider} from 'antd';
import { MyIcon } from '@/components/iconfont'
import Timeline from '@/components/time/Timeline'
import Event from '@/util/event'
import { Steps as MySteps } from '@/components/config/Step'

const { Step } = Steps;


class ResNode extends Component{
	constructor( props ){
		super(props)
		this.state = {
			current: 3,
			steps : [
				{ title : 'Spatial Partition', },
				{ title : 'Information Graph', },
				{ title : 'Exploration', }
			],
			running : false , 
			params : [
				{ 
					id : 'minRaidus' , 
					title: 'Minimum Distance Within a Aroup' ,
					value :  0.3,
					unit : 'km',
					step: 1,
				},
				{ 
					id : 'maxRadius' , 
					title: 'Maximum Region Radius' ,
					value :  2,
					unit : 'km',
					step: 1,
				},
				{ 
					id : 'time' , 
					title: 'Time Interval' ,
					value :  10,
					unit : 'min',
					step: 2,
				},
				{ 
					id : 'k' , 
					title: 'K in K-Anonymity' ,
					value :  5,
					unit : '',
					step: 3,
				},
			],
			timeRange : null,
			region : null
		}
	}
	changeStep = current => {
		this.setState({ current });
	}
	handleValueChange = ( paramId , value ) => {
		let { params } = this.state
		params.map((param) => {
			if(param['id'] == paramId)
				param['value'] = value
		})
		this.setState({ params })
	}
	handleRun = async () =>{
		const { current,params  } = this.state
		const { id, condNodeId, source } = this.props
		let condition
		switch( current ){
			case 1:
				let minRaidus = getParamsValue( params , 'minRaidus') 
				this.setState({ running:true })
				condition = { 
					radius : minRaidus,
					id,
					condNodeId,
					source
				} 
				await this.props.onSpatialPartition( condition )
				this.setState({ running:false })
				break

			case 2:
				this.setState({ running:true })
				condition = this.getCondition()
				await this.props.onInformationGraph( condition )
				this.setState({ running:false })
				break

			case 3:
				this.setState({ running:true })
				condition = this.getCondition()
				await this.props.onVisualization( condition )
				this.setState({ running:false })
				break
		}
	}
	handleTimeChange = ( start , end ) =>{
		const { params,region  } = this.state
		let timeRange = [ 
			start.toString(),
			end.toString()
		]
		let condition = this.getCondition({ timeRange })
		this.props.onVisualization( condition )
		this.setState({ timeRange })
	}
	handleRegionSelect = () => {
		const self  = this
		const { id } = this.props
		const ev = Event.get()
		const eventName =  id + 'finishGlobalFrameRegion'
		
		// 注册回调
		ev.once(eventName , ( data )=>{
			let region = data['features'][0]['geometry']['coordinates'][0]
			let condition = self.getCondition( {region} )
			self.props.onVisualization( condition )
			self.setState({ region })
		})
		// 触发
		ev.emit('globalSetFrameRegion' , id)	
	}
	getCondition = ( extra ) => {
		const { params , timeRange , region  } = this.state
		const { id,condNodeId,source } = this.props
		const  condition ={
			k : getParamsValue(params , 'k'),
			timeInterval : getParamsValue(params , 'time'),
			maxRadius : getParamsValue( params , 'maxRadius') ,
			id,
			condNodeId,
			region,
			timeRange,
			source,
			...extra // 覆盖
		}
		return condition
	}
	switchToGlobalMap = () =>{
		let { data,id } = this.props
		this.props.switchToGlobalMap( { data,id } )
	}
	render(){
		const { props } = this
		const { current,steps,params,running } = this.state
		return(
			<Node {...props}> 
				<div className="naviga">
					<MySteps
						current={current}
						changeStep={this.changeStep}
						steps={ steps }
					/>
		        </div>

		        <div className='left'>
		        	<div className='config'>
		        		
		        		{
		        			current == 1 ? (
		        				<div className='select-contain'>
								<Divider className='header'> Partition Method </Divider>
				        		<select>
								  <option value ="1">density-based clustering</option>
								  <option value ="2">NxN grid clustering</option>
								  <option value ="3">using station region</option>
								</select>
								</div>) : null
		        		}

						<Divider className='header'> Parameters </Divider>
		        		{
		        			params.filter((param) => param['step'] == current )
		        				.map((param)=>(
				        		<NumberRow
				        			key={ param['id'] }
				        			{...param}
				        			onChange={this.handleValueChange} />
		        		))}
		        	</div>

					<div className='bottom'>
	        			<Button type='primary'
		        				color={'red'}

		        			loading={this.state['running'] }
	        				onClick={ this.handleRun }
	        				className='submit-btn type-public'> 
	        					{ current != 3 ? 'Run' : 'Visualization' } 
						</Button>
	        		</div>
		        </div>


	        	{ current != 3 
		          ?	(<div className='right float-box'>
			        	<MyMap {...props['data']} />
						<div className='open-btn'>
							<Button 
								onClick={this.switchToGlobalMap}
								size='small'>
								<MyIcon type='icon-open_in_new-px'/>
							</Button>
						</div>
					</div>)
				  : (
				  	<div className='right config divide-left'>
						<Divider className='header'> Region Selection </Divider>
						<div className='config__icon'>
							<div className='config__icon__title'>
								Rectangle
							</div>
							<div className='config__icon__entity'>
								<Button 
									onClick={ this.handleRegionSelect }
									size='small'>
									<MyIcon type='icon-box-select'/>
								</Button>
							</div>
						</div>

						<Divider className='header'> Timeline  </Divider>
						
						<div className='config__time'>
							<Timeline 
								startTime={ props['timeRange'] && props['timeRange']['start'] }
								endTime={   props['timeRange'] && props['timeRange']['end'] }
								onChange={this.handleTimeChange}
								/>
						</div>
						<div className='bottom'
			        			style={{
			        				paddingLeft : '5px'
			        			}}
						>
		        			<Button type='primary'
			        			loading={ false }
		        				onClick={null}
		        				className='submit-btn type-public'> Save as Picture </Button>
		        		</div>
				  	</div>
				  )
				}

			</Node>
		)
	}
}


const mapStateToProps = ({ map }) => {
	return {
	}
}
const mapDispatchToProps = dispatch => {
	return {
		switchToGlobalMap : ( argvs ) => dispatch({
			type : 'SWITCH_TO_GLOBAL_MAP',
			payload : argvs
		})
	}
}

let HOC = connect(mapStateToProps, mapDispatchToProps)(ResNode)
export default HOC


var customDot = (dot, { status, index }) => (
  <Popover
    content={
      <span>
        step {index} status: {status}
      </span>
    }
  >
    {dot}
  </Popover>
);


const getParamsValue = (params ,  paramId ) =>{
	const set = new Map()
  	params.map(( item ) => set.set( item['id'] , item ))
  	let param = set.get( paramId )
  	if( param )
  		return param['value']
  	return null
}
