import React, { Component } from 'react';
import { Icon, Button  } from 'antd';
import { MyIcon } from '@/components/iconfont'
import './legend.scss'
import { COLORS_WEIBO, EXTENT_WEIBO,
		COLORS_TAXI , EXTENT_TAXI } from '@/components/map/util'

import {  MOVEMENT_FLOW_LAYER , widthScaleBase } from '@/components/map/config' 


export default class Legend extends Component {
	constructor( props ){
		super(props)
		this.state = {
			sliderValue : 40,
		}
	}

	static defaultProps = {
		layers : [{
			name : '123',
		},{
			name : 12633,
		},{
			name : 53
		}],
		params : {},
	}
	handleChangeRenderParam = ( value ) =>{
		let { onChangeRenderParam } = this.props
		this.setState({ sliderValue : value })
		onChangeRenderParam( MOVEMENT_FLOW_LAYER , 'maxWidth' , value )
	}
	render(){
		const self = this
		const { layers, params , maxSupport } = this.props
		const { sliderValue:value }  = this.state
		return (
			<div className='legend-contain'>
				<div className='legend-row'>
					<div className='legend-row__title'>
						Records Number Of Twitters
					</div>
					<div className='legend-row__legend'>
						<LegendColorItem 
							min={EXTENT_WEIBO[0]}
							max={EXTENT_WEIBO[1]}
							colors={COLORS_WEIBO}
						 />
					</div>
				</div>

				<div className='legend-row'>
					<div className='legend-row__title'>
						Records Number Of Trajecctories
					</div>
					<div className='legend-row__legend'>
						<LegendColorItem  
							min={EXTENT_TAXI[0]}
							max={EXTENT_TAXI[1]}
							colors={COLORS_TAXI}
						/>
					</div>
				</div>

				<div className='legend-row'>

					<div className='legend-row__title'>
						Support Number
					</div>
					<div className='legend-row__legend'>
						<LegendNumItem 
							max={ maxSupport }
						 />
					</div>
				</div>

				<div className='legend-row'>

					<div className='legend-row__title'>
						MaxWidth
					</div>
					<div className='legend-row__legend'>
						<LegendSliderItem 
							value={this.state['sliderValue']}
							handleChangeRenderParam={this.handleChangeRenderParam}
						/>
					</div>
				</div>
			</div>
		)
	}
}



class LegendColorItem extends Component{
	render(){
		let { min,max,colors } = this.props
		return (
			<div className='color-area'>
				<div className='color-num'>
					{min}
				</div>
				{colors.map((color)=>(
					<div
						className='color-block' 
						style={{
							backgroundColor : color
						}}
					/>
				))}
				<div className='color-num'>
					{max}
				</div>
			</div>
		)
	}
}

class LegendNumItem extends Component{
	render(){
		let { max } = this.props
		return (
			<div className='color-area'>
				<div className='color-num'>
					0
				</div>
				<div className='triangle-left' />

				<div 
					style={{width:'100px'}}
					className='color-num'>
					{ max }
				</div>
			</div>
		)
	}
}

const min = 0
const max = 50
class LegendSliderItem extends Component{
	handleChange = (event) => {
	  	let value = event.target.value
	  	this.props.handleChangeRenderParam(value)
	}
	render(){
		let { value } = this.props
		return (
			<div className='color-area'>
				<div className='color-num'>
					{/*{ Math.pow(widthScaleBase,min).toFixed(3) }*/}
					{ min }
				</div>
				<input 
					onChange={this.handleChange}
					className="number-slider" 
					type="range"
					min={min}
					max={max}
					defaultValue={value} 
					step="0.2"/>
				<div className='color-num'>
					{/*{ Math.pow(widthScaleBase,max).toFixed(3)}*/}
					{ max }	
				</div>
			</div>
		)
	}
}
