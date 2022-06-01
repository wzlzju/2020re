const  util = require('./util')


test('spatialDistance',() => {
	let p1 = {'lng' : 114.43978062510536,'lat' : 38.07268032783493},
		p2 = {'lng' : 114.43578062510536,'lat' : 38.17268032783493}
	let res = util.spatialDistance(p1,p2)
    expect(res).toBeGreaterThan(0)
})


test('_timeDuration',() => {
	let ts = "2019-01-03 05:49:57",
		te = "2019-01-03 05:50:59"
	let res = util._timeDuration(ts,te)
    expect(res).toBeGreaterThanOrEqual(0)
})
