import React, { Component } from 'react';
import { connect } from 'react-redux'
import Node from './Node.js'
import MyMap from '@/components/map/index.js'
import { Tabs, Select, Button } from 'antd';
import './ResNodePublic.scss'
import LineChart from '@/components/chart/line.js'
import { MyIcon } from '@/components/iconfont'
import { POI_LAYER } from '@/components/map/config' 

const { TabPane } = Tabs;
const { Option } = Select;

const cutNum = 50  //列表 只渲染这部分 ， 先不做 scroll 递增了

class ResNodePublic extends Component{
	constructor( props ){
		super(props)
		this.state = {
			mode : 1 || 2,
			subMode : 2 ,
			poisCheck:[],
			selecAll : false
		}
	}


	switchToGlobalMap = () =>{
		let { data,id } = this.props
		this.props.switchToGlobalMap( { data,id } )
	}

	handleCheck = (i) =>{
		let { poisCheck, selecAll } = this.state
		if(i == '*'){
			selecAll = !selecAll
			poisCheck = selecAll ? new Array(cutNum).fill(true) : []
		}else{
			poisCheck[i] = poisCheck[i] == undefined ? true : !poisCheck[i]
		}
		this.setState({ poisCheck,selecAll })

 		this.handleAddToMap( selecAll )
	}
	handleAddToMap = ( ifAdd ) =>{
		let { data,id } = this.props
		let pois = data['pois']
		
		id = "POIS"+id
		let data1 = {
    		type : POI_LAYER,
    		id,
    		data : pois,
    	}
    	if( ifAdd ){
 			this.props.addToGlobalMap( {data : data1} )		
 		}else{
			this.props.deleteGlobalMap( {id} )
 		}
	}
	render(){
		const { props } = this
		const { mode } = this.state
		return (
			<Node {...props} > 
				<div className='public'>
					<div className='left'>
						<div 
							className={ mode == 1 ? 'sub choose' : 'sub'}
							onClick={()=>{this.setState({ mode:1 })}}
						>
							Data Records
						</div>
						<div 
							className={ mode == 2 ? 'sub choose' : 'sub'}
							onClick={()=>{this.setState({ mode:2 })}}
						>
							Data Statistics
						</div>
					</div>
					<div className='right'>
						{
							mode == 1 
							? this.geneRecords()
							: this.geneStatics()
						}
					</div>
				</div>
			</Node>
		)
	}
	geneRecords = () => {
		const { poisCheck, selecAll } = this.state
		const { props } = this
		let { data } = props
		let pois = data['pois'] 
		return(
			<div className='record-contain'>
				<div className='head-row record-row'>
					<div className='record-row__check'>
						<input type="checkbox" 
							onClick={this.handleCheck.bind(this,'*')}	
							checked={selecAll}
							id='all' />
      					<label htmlFor='all'> </label>
					</div>
					<div className='record-row__title' >
						Select ALL
					</div>
				</div>
				<div className='record-area' >
					{
						pois.slice(0,cutNum).map((poi,i)=>(
							<div className='record-row' key={i}>
								<div className='record-row__check' key={i}>
									<input type="checkbox" 
										onClick={this.handleCheck.bind(this,i)}
										checked={poisCheck[i]}
										id={i} />
			      					<label htmlFor={i}> </label>
								</div>
								<div className='record-row__title'>
									{ poi['name'] }
								</div>
							</div>
						))
					}
				</div>
			</div>			
		)
	}

	geneStatics = () => {
		let { subMode } = this.state
		return(
		<div
			style={{
				position:'relative',
				width : '100%',
				height : '100%',
			}}
		>
			<div className='middle'>
				{
					subMode == 1
						? this.geneMa()
						: this.geneChart()
				}
			</div>
			<div className='left'
				style={{
					'float' : 'right'
				}}
			>
				<div 
					className={ subMode == 1 ? 'sub choose' : 'sub'}
					onClick={()=>{this.setState({ subMode:1 })}}
				>
					HeatMap
				</div>
				<div 
					className={ subMode == 2 ? 'sub choose' : 'sub'}
					onClick={()=>{this.setState({ subMode:2 })}}
				>
					Types
				</div>
			</div>
		</div>
		)
	}
	geneMa = () =>{
		const { props } = this
		return (
   			<MyMap {...props['data']} />
		)
	}
	geneChart = ()=>{
		const { props } = this

		return (
			<LineChart {...props['data']} />
		)
	}
}

const mapStateToProps = ({ map }) => {
	return {
	}
}
const mapDispatchToProps = dispatch => {
	return {
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

let HOC = connect(mapStateToProps, mapDispatchToProps)(ResNodePublic)
export default HOC