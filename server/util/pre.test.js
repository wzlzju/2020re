const source = require('./source')
const pre = require('./pre')

async function main() {
	console.time('pre test')
    let trajs = await source.readJson('taxi_594_2020040621.json')
    // let trajs = await source.readJson('taxi_3692_2020040618.json')
    console.log( trajs )
    trajs = pre.preInRegion( trajs , )
    let timeRange = ['07:14' , '09:25']
    trajs = pre.preInTime( trajs , timeRange )
    // trajs = trajs.slice(0,2)
    console.log( trajs )
    trajs = pre.characteristic( trajs )
    console.log( trajs )
	console.timeEnd('pre test')
}



let sampleTraj = [
    {"time":"2019-01-03 06:58:53","lng":114.51707317590808,"lat":38.000812038568824},
    {"time":"2019-01-03 07:00:28","lng":114.49550975048892,"lat":38.002034116088126},
    {"time":"2019-01-03 07:01:30","lng":114.48326064684976,"lat":38.00266778491615},
    {"time":"2019-01-03 07:03:47","lng":114.47106885956116,"lat":38.012846862341306},
    {"time":"2019-01-03 07:05:01","lng":114.47072058914648,"lat":38.00707088068197},
    {"time":"2019-01-03 07:05:49","lng":114.47106885956116,"lat":38.012846862341306},
    {"time":"2019-01-03 07:07:11","lng":114.46947176175168,"lat":38.017859460166754},
    {"time":"2019-01-03 07:09:15","lng":114.47133557192649,"lat":38.024514754944946},
    {"time":"2019-01-03 07:10:34","lng":114.47304718083716,"lat":38.03078818469622},
    {"time":"2019-01-03 07:10:42","lng":114.49178458875179,"lat":38.034297828606704},
    {"time":"2019-01-03 07:16:04","lng":114.47080638580647,"lat":38.04497490334006},
    {"time":"2019-01-03 07:17:15","lng":114.4714514985582,"lat":38.04836724494221},
    {"time":"2019-01-03 07:19:24","lng":114.46388164135561,"lat":38.04604635383216},
    {"time":"2019-01-03 07:21:02","lng":114.45976805631432,"lat":38.05149974230375},
    {"time":"2019-01-03 07:21:16","lng":114.46332795267267,"lat":38.0487317332138},
    {"time":"2019-01-03 07:21:55","lng":114.45976805631432,"lat":38.05149974230375},
    {"time":"2019-01-03 07:25:11","lng":114.46388164135561,"lat":38.04604635383216}
]
function testCharacteristic(){
    let traj = sampleTraj
    let trajRes = pre.characteristic( [traj] )
    // console.log(traj , trajRes[0] )
}


module.exports = {
	main
}