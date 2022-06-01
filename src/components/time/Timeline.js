import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

import './Timeline.scss'


const GAP_VALUE = 15,
	  ELEMENT_TOP = 20


class Timeline extends Component{
	constructor(props){
		super(props)
		this.state = {
			width : 360,
			height : 60,
		}

	}
	componentWillMount(){
	}

	componentWillReceiveProps( nextProps ){
		// console.log( nextProps )
		if( !isSameTime( this.props , nextProps ) ){
			this.renderTimeline( nextProps ) 
		}
	}
	componentDidMount(){
		let self = this
		let { clientWidth, clientHeight  } = this.containRef
		
		// console.log( clientWidth, clientHeight  )
		clientHeight = 60 

		
		this.setState({
			width : clientWidth,
			height : clientHeight
		},()=>{
			self.renderTimeline()
		})
	}
	renderTimeline( nextProps ){
		this.clearTimeline()
		this.setTimeScale( nextProps )
		this.setAxis()
		this.setZoom()
		this.setBrush()	
	}

	setTimeScale( nextProps ){
		let { width,height } = this.state
		let { startTime,endTime } = nextProps || this.props
		
		const DATE = "2000-01-01 "
		if( !startTime || !endTime ){
			startTime =  "2000-01-01 00:00:00"
			endTime =  "2000-01-01 12:00:00"
		}else{
			startTime = DATE + startTime
			endTime = DATE + endTime
		}

		let timeStart = new Date( startTime ),
			timeEnd = new Date( endTime )
		// https://github.com/d3/d3-scale#scaleTime
		let timeRange = [
			timeStart,
			timeEnd
		]
		let timeScale = d3.scaleTime()
			.range([0, width - 2*GAP_VALUE])
		let timeScale2 = d3.scaleTime()
			.range([0, width - 2*GAP_VALUE])

		timeScale.domain(timeRange)
		timeScale2.domain(timeRange)

		this.timeScale = timeScale
		this.timeScale2 = timeScale2

		this.timeStart = timeStart
		this.timeEnd = timeEnd
	}
	setAxis(){
		let { timeScale } = this
		let { width,height } = this.state

		let axisFunc =  d3.axisBottom(timeScale)

			axisFunc.ticks(  4 )  //显示的个数
				.tickFormat(  d3.timeFormat("%H:%M")  ) // https://github.com/d3/d3-time-format  
		
		let topAxis =  d3.select( this.refs.axisSvg )
							.append('g')
						    .call(axisFunc);
		
		topAxis.attr("transform" , `translate(${GAP_VALUE}, -2 )`)

		this.syncAsix = function(){
			topAxis.call(axisFunc)
		}
	}
	setZoom( item ){
		let svg = d3.select(this.refs.zoomSvg)
		let zoomFunc = d3.zoom()
			.scaleExtent([0.5, 100])
			.on('zoom',()=>{
				// console.log('zoom')
				this.zoomedFunc()
			})
		svg.call( zoomFunc )
	}
	zoomedFunc(){
		let { timeScale,timeScale2,s } = this
		let t = d3.event.transform
		if(!s) return
		let s_t = [ timeScale.invert(s[0]),timeScale.invert(s[1]) ]
		//更新 timeScale
		timeScale.domain(t.rescaleX(timeScale2).domain())   //  timeScal2 不变

		let s_ = [ timeScale(s_t[0]) , timeScale(s_t[1]) ]	
		
		this.syncAsix() 	
		this.syncBrush( s_ )
	}

	setBrush(){
		let self = this

		let { width,height } = this.state

		let brushFunc = d3.brushX()
		    .extent([[0, 0], [ width-2*GAP_VALUE, 10 ]])
		    // .extent([[0, 0], [w * 0.9, Config.vRectHeight]])
		    .on("start", ()=>{
		    	this.setBrushStyle()
		    })
		    .on("brush",()=>{
		    	this.s = d3.event.selection
		    	this.setBrushStyle()
		    })
		    .on("end", self.hanldeTimeChange.bind(self) );

		this.setBrushStyle()

		let brushG = d3.select(this.refs.brushSvg)
				.append('g')
		      	.call(brushFunc)
      			.call(brushFunc.move, [0 , width-2*GAP_VALUE ]);  //拖动框
		
		brushG.attr("transform" , `translate(${GAP_VALUE},${ELEMENT_TOP})`)


		this.syncBrush = ( move )=>{
			d3.select( self.refs.brushSvg ).select('g')
				.call( brushFunc.move , move )
		}
	}
	hanldeTimeChange(){
		let { height,width,brushRadius  } = this.state
		let { timeStart, timeEnd , timeScale } = this
		let { onChange } = this.props

		let brushG = d3.select( this.refs.brushSvg ),
			rectStart = +brushG.select('.handle--w').attr('x') + 3,
			rectEnd = +brushG.select('.handle--e').attr('x') + 3,	
			newTimeStart = timeScale.invert(rectStart),
			newTimeEnd = timeScale.invert(rectEnd)


		if( timeStart.toString() == newTimeStart.toString() 
			&& timeEnd.toString() == newTimeEnd.toString()){
			// console.log('time unchange ')
		}else{
			this.timeStart = newTimeStart
			this.timeEnd  = newTimeEnd

			onChange && onChange( newTimeStart , newTimeEnd)
			// onChange && debounce( 1000 , ()=>{
				// onChange( newTimeStart , newTimeEnd )
			// })
		}	
	}
	clearTimeline(){
		d3.select(this.refs.axisSvg).selectAll('*').remove()
		d3.select(this.refs.brushSvg).selectAll('*').remove()
		d3.select(this.refs.zoomSvg).selectAll('*').remove()
	}
	render(){
		const self = this
		let { width,height } = this.state

		return (
			<div className='timeline-contain'
				ref={ref => self.containRef = ref}
			>
				{width >= 10 && height >= 10 
					? (
						<>
						<svg  ref="axisSvg" 
							width={width}
							height={height}
						/>				
						<svg  ref="zoomSvg" 
							className="zoom-contain"
							width={width}
							height={height}
						/>
						<svg  ref="brushSvg"
							className='brush-contain'
							width={width}
							height={height}
						/>
						</>
					)
					: null
				}

			</div>
		)
	}

	setBrushStyle(){
		let { height } = this.state

		let radius = height - ELEMENT_TOP*2
		radius = ( radius > 10 ) ? radius : 10

		let brushG = d3.select( this.refs.brushSvg )
    	brushG.select('.selection')
    			.attr('height', radius)


    	brushG.select('.overlay')
    		.attr('height', radius)

    	brushG.select('.handle--e')
    		.attr('width', radius)
    		.attr('height', radius)
    	   	.attr('transform',`translate(-${radius/2},0)`)
    		.attr('rx',radius)
    		.attr('ry',radius)
    		.attr('y',0)

    	brushG.select('.handle--w')
    	   	.attr('width',radius)
    		.attr('height',radius)
    	   	.attr('transform',`translate(-${radius/2},0)`)
    		.attr('rx',radius)
    		.attr('ry',radius)
    		.attr('y',0)
	}

}

Map.propTypes = {
    startTime : PropTypes.string,   //  "2007-02-20 00:00:22"
    endTime: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    onChange  : PropTypes.func  
}

let debounceTimer
function debounce( delay , fn ){
	let delaySecond = delay || 2000
	let context = this
	clearTimeout( debounceTimer )
	debounceTimer = setTimeout( function(){
		fn()
	} , delaySecond )
}

function isSameTime( prevProps , nextProps ) {
	let timeStart = prevProps['startTime'],
		timeEnd = prevProps['endTime'],
		newTimeStart = nextProps['startTime'],
		newTimeEnd = nextProps['endTime']

	// console.log( timeStart ,timeEnd ,newTimeStart , newTimeEnd )
	if( !timeStart && !timeEnd && !newTimeStart && !newTimeEnd)
		return true
	
	if( !timeStart && !timeEnd && newTimeStart && newTimeEnd)
		return false

	return timeStart.toString() == newTimeStart.toString()  
		&& timeEnd.toString() == newTimeEnd.toString()
}


export default Timeline