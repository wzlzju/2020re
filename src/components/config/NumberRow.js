import React, { Component } from 'react';
import './NumberRow.scss'

class NumberRow extends Component {
	constructor(props){
		super(props)
		this.state = {}
	}
	static defaultProps = {
		title : 'xxx',
		value : 123,
		unit : 'km',
		onChange:()=>{}
	}
	onChange = ( event )=>{
		let value = event.target.value
		let { onChange,id } = this.props
		onChange && onChange.call( null , id , value )
	}
	render(){
		const { title,value,unit } = this.props
		return (
			<div className='config__row'>
				<div className='config__row__title'>
					{ title }
				</div>
				<input 
					className='config__row__number'
					onChange={this.onChange}
					defaultValue={ value } />
				<div className='config__row__unit'>
					{ unit }
				</div>
			</div>
		)
	}
}

export default NumberRow