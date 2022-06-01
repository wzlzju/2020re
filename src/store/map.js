import groupsData from './groupsMock.json'
console.log( groupsData )

const INITIAL_STATE = {
	currentMapId : -1,
	// datas : [{
	// 	type : 'GLYPH_LAYER',
	// 	data : groupsData,
	// 	id : 'asdknbidsndlnczxca'
	// }],
	datas : []
}

export default function update( state = INITIAL_STATE , action) {
	switch( action.type ){
		case 'SWITCH_TO_GLOBAL_MAP':
			return {
				...state,
				currentMapId : action.payload['id'],
				data : action.payload['data']
			}
		case "ADD_TO_GLOBAL_MAP":
			return {
				...state,
				datas : state['datas'].concat([action.payload['data']])
			}
		case "DELETE_GLOBAL_MAP":
			return {
				...state,
				datas : state['datas'].filter((data) => data['id']!= action.payload['id'] )
			}
		default: 
			return state
	}
}

