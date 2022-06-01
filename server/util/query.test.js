const Query = require('./query')

async function testAll() {
	let q = new Query()
	// let res = await q.weibo()
	let res = await q.station()
	console.log(res)
}

module.exports = {
	testAll
}