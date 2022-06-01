const fetchPoi = require('./fetch')

async function testAll() {
	let r = await fetchPoi.getPois()
	console.log( r )
}

module.exports = {
	testAll
}