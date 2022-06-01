import * as turf from '@turf/turf'

export function filterInTime( datas , time , timeGetter ) {
	if(!time) return datas
	let [ ts , te ] = time
	if( !ts || !te ) return datas
	return datas.filter(( data )=>{
		let time = timeGetter ? timeGetter(data) : data
		time = new Date(time)
		return time >= ts && time <= te 
	})
}

export function timeExtent(datas , timeGetter ) {
	let start = timeGetter ? timeGetter(datas[0]) : datas[0],
		end = timeGetter ? timeGetter(datas[0]) : datas[0],
		cur
	start = new Date( start )
	end = new Date( end )

	for(let i = 0;i < datas.length;i++){
		cur = timeGetter ? timeGetter(datas[i]) : datas[i]
		cur = new Date( cur )
		start =  cur < start ? cur : start
		end = cur > end ? cur : end
	}
	return [ start.toString() , end.toString() ] 
}

export function filterInLngLat( datas , bounds , lnglatGetter ){
	if( !bounds ) return datas
	return datas.filter((data)=>{
		let p = lnglatGetter ? lnglatGetter(data) : data
		return isPointWithinRect( p , bounds )
	})
}


function isPointWithinRect( p , rect ){
	// var points = turf.points([
 //    	[-46.6318, -23.5523],
	// ]);

	// var searchWithin = turf.polygon([[
	//     [-46.653,-23.543],
	//     [-46.634,-23.5346],
	//     [-46.613,-23.543],
	//     [-46.614,-23.559],
	//     [-46.631,-23.567],
	//     [-46.653,-23.560],
	//     [-46.653,-23.543]
	// ]]);

	// var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);

	let points = turf.points([p])
	let searchWithin = turf.polygon([ rect ])
	let ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
	return ptsWithin['features'].length > 0
}