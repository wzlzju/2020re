import React, { Component } from 'react';
import './MapList.scss'
import { Icon, Button  } from 'antd';
import { MyIcon } from '@/components/iconfont'

export class MapList extends Component {
	static defaultProps = {
		layers : [{
			name : '123',
		},{
			name : 12633,
		},{
			name : 53
		}],
		params : {}
	}
	handleChangeVisible = (i ,ifVisible) =>{
		let { changeVisible } = this.props
		changeVisible && changeVisible(i , ifVisible)
	}
	handleDelete = (i) => {
		let { deleteLayer } = this.props
		deleteLayer && deleteLayer(i)
	}
	render(){
		const self = this
		const { layers, params } = this.props
		return (
			<div className='list-contain'>
				<div className='header'>
					layers
				</div>
				{
					layers.map((layer)=>{
						let ifVisible = params[ layer['id'] ]
						ifVisible = ifVisible == undefined ? true : ifVisible['visible']
						return (
							<div className='list-row' key={layer['id']}>
							<div className='list-row__title'>
								{ layer['id']  }
							</div>
							<div className='list-row__icon-contain'>
									<Icon
										onClick={this.handleChangeVisible.bind(this , layer['id'] , ifVisible)}  
										className='list-row__icon' type={ ifVisible ? "eye" : 'eye-invisible'} />
									<MyIcon 
										onClick={this.handleDelete.bind(this, layer['id'])}  
										className='list-row__icon' type="icon-shanchu" />
							</div>
						</div>
					)})
				}
			</div>
		)
	}
}
