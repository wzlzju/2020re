import React, { Component } from 'react';
import { DragSource } from 'react-dnd'
import './Node.scss'
import { Button } from 'antd';
import { MyIcon } from '@/components/iconfont'
import { TYPE_RES_NODE, TYPE_COND_NODE, TYPE_RES_PUBLIC_NODE } from '@/QueryPanel/config'

const THEME_COLOR = '#AFABAB'
const iconMap = {
	'people' : 'icon-xingren',
	'weibo'  : 'icon-weibo',
	'taxi'   : 'icon-chuzuche',
	'poi'	 : 'icon-points-mall'
}

class Node extends Component {
	constructor( props ){
		super(props)
		this.state = {}
	}
	static defaultProps = {
		x : 20,
		y : 20
	}
	handleNodeDelete = () =>{
		let { id, onNodeDelete } = this.props
		onNodeDelete && onNodeDelete(id)
	}
	render(){
		const { props }  = this
		const { connectDragSource } = this.props
		let { type,x,y,width,height,source,num } = props
		return connectDragSource(
			<div className='node'
				style={{
					width,
					height,
					left : x,
					top :  y,
					border: `2px solid ${source ? source['color'] : THEME_COLOR }`
				}}
			>	
				{  type == TYPE_COND_NODE ? 
					(
						<div className='node-header'>
							<div style={{ width:'50px'}}></div>
							<input className='node-header__title' defaultValue={'Condition Node'}/>

							<div className='node-header__btn-area'>
								<Button className='zoom-btn'>
									<MyIcon  type='icon-zuixiaohua'/>
								</Button>
								<Button
									className='close-btn'
									onClick={ this.handleNodeDelete }>
									<MyIcon  type='icon-guanbi'/>
								</Button>
							</div>

						</div>
					)
					:(
						<div className='node-header'
								style={{
									'backgroundColor': source['color']
								}}
						>
							<MyIcon className='node-header__type-icon'
								type={source['icon']} />
							<div className='node-header__title'>
								{ nameMap(source['name']) } x { _formatNumber(num , type) }
							</div>
							<Button
								className='close-btn'
								onClick={ this.handleNodeDelete }>
								<MyIcon  type='icon-guanbi'/>
							</Button>
						</div>
					)
				}
				{props.children}
			</div>	
		)
	}
}

const nameMap = (name) => {
	if(name == 'weibo') return "Twitter"
	if(name == 'taxi')  return "Taix"
	return name
}
const _formatNumber = ( num , type) => {
	if( type == TYPE_RES_PUBLIC_NODE ) return num
	if( num <= 10){
		return '(below 10)'
	}else{
		num = Math.floor(num / 10)
		return num + '0+'
	}
}

const sourceSpec =  {
    beginDrag(props) {   // Required  
      const { id, x, y } = props   // component's current props
      return { id, x, y }    // 返回的 obj 会传给 dropTarget 
    },
}

// pass dragging state to  component 
function dragCollect( connect , monitor ){
  return {
    connectDragSource: connect.dragSource(),   // 到 props, 然后在 render 里面包裹 dom ; 
    // connect this source DOM to Dnd backend   ; connectDragSource 的 实例
    isDragging: monitor.isDragging(),
    //  DragSourceMonitor 的 实例 ； 获取当前 state 
  }
} 

Node = DragSource( 'NODE' , sourceSpec , dragCollect)(Node)
export default Node