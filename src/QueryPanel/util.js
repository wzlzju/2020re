import { RES_NODE ,COND_NODE ,TYPE_RES_NODE, TYPE_COND_NODE } from './config'


let idBase = 0
const TIMES = 1000
export const geneNode = ( type,width,height , baseNode ) =>{

	let node = ( type == TYPE_COND_NODE ) ? COND_NODE : RES_NODE 

	width = ( type == TYPE_COND_NODE ) ? width/2 : width
	const _gen = () => {
		let x = width * Math.random()  - node['width'],
			y = height * Math.random() -  node['height']
		return { x ,y }
	}
	const rightThanBaseNode = (x,y) =>{
		if( baseNode ){
			return (  x > baseNode['x'] && Math.abs( y - baseNode['y'] ) < 200 )
		}
		return true
	}

	let { x , y } = _gen()

	let count = 0
	while( x < 0 || y < 0 || !rightThanBaseNode(x,y) ){
		let res = _gen()
		x = res['x']
		y = res['y']
		count++
		if(count > TIMES) break;
	}
	
	return {
		id : idBase++,
		type , 
		x,
		y,
		width : node['width'],
		height : node['height'],
	}
}


export const geneLink = ( nodeStart , nodeEnd ) =>{
	return {
		start : {
			 id : nodeStart['id'],
			 x : nodeStart['x'] + COND_NODE['width'] + 4,
			 y : nodeStart['y'] + COND_NODE['height'] / 2
		},
		end : {
			id : nodeEnd['id'],
			x  : nodeEnd['x'] - 4,
			y  : nodeEnd['y'] + RES_NODE['height'] / 2
		}
	}
}