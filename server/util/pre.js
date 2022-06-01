const turf = require('@turf/turf')
const moment = require('moment')

/* 轨迹预处理 
	1. 地理位置过滤
	2. 时间过滤
	3. 抽取代表点
*/
function filterTrajs(trajs , params){
	console.log("filterTrajs params :", params )
	let { regions , time } = params
	if( regions ){
		trajs = filterInRegion( trajs , _regions2bounds(regions) )
	}
	if( time ){
		let { start,end } = time
		trajs = filterInTime( trajs , [ start, end] )
	}
	return characteristic( trajs )
}

/* 坐标点预处理
	1. 地理位置过滤
	2. 时间过滤
*/
function filterPoints(points , params){
	let { regions,time } = params
	if( regions ){
		bound = _regions2bounds(regions)
		points = points.filter((point) =>  _isWithinBouding(point, bound) )
	}
	if( time ){
		let { start, end } = time
		points = points.filter((point) =>  _isInTimeRange(point['time'], start, end) )
	}
	return points
}

/*  仅返回 region 区域内的轨迹 ，超出范围时截断  */
const defaultBounds = {
	lngMin: 120.4071273804,
	lngMax: 120.8490524292,
	latMin: 27.5287208557,
	latMax: 28.1678504944
}

/*
	[120.64536850942632, 28.02777891223006]
	1: (2) [120.70138644470246, 28.02777891223006]
	2: (2) [120.70138644470246, 27.99436199860011]
	3: (2) [120.64536850942632, 27.99436199860011]
	4: (2) [120.64536850942632, 28.02777891223006]
*/
const _regions2bounds = ( regions ) => {
	let p1 = regions[0]
	let  bounds = {
		lngMin : p1[0],
		lngMax : p1[0],
		latMin : p1[1],
		latMax : p1[1]
	}
	regions.map((p)=>{
		let { lngMin,lngMax,latMin,latMax } = bounds
		lngMin = ( lngMin > p[0] ? p[0] : lngMin )
		lngMax = ( lngMax < p[0] ? p[0] : lngMax )
		latMin = ( latMin > p[1] ? p[1] : latMin )
		latMax = ( latMax < p[1] ? p[1] : latMax )
		bounds = { lngMin,lngMax,latMin,latMax }
	})
	return bounds
}
function filterInRegion( trajs , bound = defaultBounds ) {
	if( !bound || bound['lngMin'] == undefined 
			|| bound['latMin'] == undefined ){
		console.error('input bounds error')
		return
	}
	if( !trajs[0] || !trajs[0][0] 
			|| !trajs[0][0]['lng'] == undefined 
			|| !trajs[0][0]['lat'] == undefined){
		console.error('input trajs error')
		return
	}

	let i,j,
		n = trajs.length,m,
		traj,_traj,_trajs = [],
		p 

	const _addSubTraj = ( subtraj ) => {
		if( subtraj.length > 2)
			_trajs.push( subtraj )
	}

	for(i = 0;i < n;i++){
		traj = trajs[i]
		m = traj.length
		_traj = []
		for(j =0;j < m;j++){
			p = traj[j]
			if( _isWithinBouding(p , bound) ){
				_traj.push(p)
			}else{
				_addSubTraj( _traj )
				_traj = []
			}
		}
		_addSubTraj( _traj )
		// _traj = []
	}

	return _trajs
}


/*  仅返回 [start,end] 范围内的轨迹 ，超出范围时截断  */
const defaultTimeRange = ['07:14' , '09:25']
function filterInTime(trajs , [start , end]){
	let i,j,
		n = trajs.length ,m,
		traj,_traj,_trajs = [],
		p,ps,pe

	const _addSubTraj = ( subtraj ) => {
		if( subtraj.length > 2)
			_trajs.push( subtraj )
	}
	for(i = 0;i < n;i++){
		traj = trajs[i]
		m = traj.length
		_traj = []

		ps = traj[0]
		pe = traj[m-1]
		if(!ps || !pe) continue
		if( _isInTimeRange(ps['time'] , start , end)
			&& _isInTimeRange(pe['time'] , start , end) ){
			_addSubTraj( traj )
			// console.log( ps['time'] , pe['time'] ,  start ,end)
			continue
		}
		for(j = 0;j < m;j++){
			p = traj[j]
			if( _isInTimeRange( p['time'] , start , end ) ){
				// console.log( p['time'] ,  start ,end)
				_traj.push( p )
			}else{
				break
			}
		}
		_addSubTraj( _traj )
	}

	return _trajs
}


function characteristic( trajs ){
	console.log("trajs Characteristicing...")
	console.time("characteristic")
	trajs = trajs.map((traj) => extracCharacteristicPoints(traj))
		   .filter((traj) => traj.length > 1)
	console.timeEnd("characteristic")
	return trajs
}
/*
	Extracting characteristic points from a trajectory
* @param trajectory {Array}
* 	@param point {Obj}
* 		@param lng {float}	114.43978062510536
* 		@param lat {float}   38.07268032783493
* 		@param time {String}  "2019-01-03 05:49:57"
* @return {Array}
*/
function extracCharacteristicPoints(trajectory) {
	if(!trajectory) return []

	const minAngle = 20   // 线段夹角 
	const minStopDuration =  600  // 时间间隔 300 秒
	const minDistance = 0.5  // 最小距离 km
	const maxDistance = 3    // 最大距离 km
	const T = []  // 返回的轨迹

	const n = trajectory.length
	if(n < 2) return T

	T.push( trajectory[0] )

	let i , j , k, m,
		pi , pj , pk, pm , 
		dTime
	for(i=0 , j=i+1 , k=i+2;i < n - 1;i++){
		pi = trajectory[i]
		pj = trajectory[j]
		if( _spatialDistance(pi,pj) >= maxDistance ){
			T.push( pj )
			continue
		}

		while(k < n){
			pk = trajectory[k]
			if( _spatialDistance(pj,pk) >= minDistance && k-j>1){
				dTime = _timeDuration(pj['time'] , pk['time'])
				if( dTime >= minStopDuration ){
					T.push( pj )
					i = j
					j = k
					break
				}else{
					let amongPoints = trajectory.slice(j,k) // j ~ k-1
					let pAvg = _getAverageSpatialPosition(amongPoints)
					let amongPointsDistances = amongPoints.map((p,i) => {
						return {
							dis : _spatialDistance(p,pAvg),
							idx : i
						}
					}).sort((x,y)=> x.dis - y.dis)  //升序
					m =  amongPointsDistances[0]['idx'] + j
					pm = trajectory[m]
					let aTurn = _spatialAngle( pi , pm , pk )
					if(aTurn >= minAngle ){
						T.push( pm )
						i = j
						j = k
					}else{
						j = j + 1
					}
					break
				}
			}
			k++
		}
	}
	T.push( trajectory[n-1] )
	return T 
}







function _isWithinBouding(p ,bound) {
	if(!bound) return false
    let res = ( p['lng'] >= bound['lngMin'] 
    		&& p['lng'] <= bound['lngMax'] 
    		&& p['lat'] >= bound['latMin'] 
    		&& p['lat'] <= bound['latMax'] )
    return res
}
function _isInTimeRange( t , start , end){
	if( t == undefined ){
		console.error("input time error")
		return false
	}
	return ( _compareTime(t , start) == true  
		&&  _compareTime(t , end ) == false )
}
/*
	t1 : "2014-01-14 01:36:03" ,
	t2 : "01:36"

	true   t2 , t1 ( t1 晚于 t2)
	flase  t1 , t2 ( t1 早于 t2)
*/
function _compareTime( t1 , t2) {
	const DATE = '2014-01-14 '
	const simpleTimeReg = /^\d\d:\d\d$/   // "01:20"
	if(simpleTimeReg.test( t2 )){
		t2 = DATE + t2
	}

	t1 = new Date(t1)
	t2 = new Date(t2)

	// console.log( t1 , t2 )
	if( t1 == 'Invalid Date' || t2 == 'Invalid Date'){
		console.error('Invalid Date')
		return
	}
	return t1 > t2
}
/* 计算时间间隔
* @param ts {String} 开始时间	
* @param te {String} 结束时间	
* @return {float}  
*/
function _timeDuration(ts,te){
	let ms = moment(ts)
	let me = moment(te)
	return moment.duration(me-ms).asSeconds()
}
/* 计算多个点的中心点
* @param points {Array} 
* 	@param point {Object} 
* 		@param lng {float}
* 		@param lat {float}
* @return center {Object}
* 		@param lng {float}
* 		@param lat {float}
*/
function _getAverageSpatialPosition( points ){
	let n = points.length
	if(n < 1) return -1

	let collectons = points.map((point)=>{
		return turf.point([
			point['lng'],
			point['lat']
		])
	})

	var features = turf.featureCollection( collectons );
	var center = turf.center(features)

	let coor = center.geometry.coordinates
	return {
		'lng' : coor[0],
		'lat' : coor[1]
	}
}
/* 计算两个点之间的距离 
* @param a {Object} 起点
* 	@param lng {float}
* 	@param lat {float}
* @param b 终点
* 	@param lng
* 	@param lat
* @return {float}
*/
function _spatialDistance(a,b){
	var from = turf.point([a['lng'],a['lat']]);
	var to = turf.point([b['lng'],b['lat']]);
	var options = {
		units: 'kilometers'   //单位 千米
	};
	var distance = turf.distance(from, to, options);
	return distance
}
/* 计算 ab , bc 之间的夹角
* @param a {Object}
* 	@param lng {float}
* 	@param lat {float}
* @param b、c
* 	@param lng
* 	@param lat
* @return angle {Number}
*/
function _spatialAngle( a ,b ,c){
	let ab = _spatialDistance(a,b)
	let bc = _spatialDistance(b,c)
	let ac = _spatialDistance(c,a)

	// 反余弦函数
	let radians = Math.acos((ab*ab+bc*bc-ac*ac)/(2*ab*bc))
	let degree =  radians * ( 180/ Math.PI );
	return Math.round(degree)
}

module.exports = {
	filterTrajs,
	filterPoints,
	filterInRegion,
	filterInTime,
	characteristic
}