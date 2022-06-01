import React, { Component } from 'react';
import './Step.scss'
import { MyIcon } from '@/components/iconfont'


export class Steps extends Component {
	static defaultProps = {
		current : 1,
		steps : [
			{ title : 'Spatial Partition', },
			{ title : 'Information Graph', },
			{ title : 'Exploration', }
		],
	}
	handleChange = (i) =>{
		let { changeStep } = this.props
		changeStep && changeStep(i)
	}
	render(){
		const self = this
		let { steps , current } = this.props
		return (
			<div className='steps-contain'>
				{
					steps.map((step,i)=>{
						let checked = i < current
						let arrow =  i != (steps.length - 1)  ? <Arrow  checked={ checked } /> : null
						return(
							<>
								<Step 
									title={step['title']}
									i={i} 
									checked={ checked }
									handleClick={self.handleChange}
									/>
								{ arrow }
							</>
						)
					})
				}
			</div>
		)
	}
}


export function Step(props){
	let { checked, title, handleClick, i  } = props
	return (
		<div
			className={ checked ? 'step-contain' : 'step-contain unchecked' }
			onClick={handleClick.bind(null,i+1)}
			>
			{ title }
		</div>
	)
}


export function Arrow(props){
	let { checked } = props
	return (
		<div 
			className={ checked ? 'arrow-contain' : 'arrow-contain unchecked' }
		>
			<MyIcon type='icon-arrow-'/>
		</div>
	)
}