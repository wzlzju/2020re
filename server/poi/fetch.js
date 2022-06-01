const fetch = require('node-fetch')

// https://lbs.amap.com/api/webservice/guide/api/search

const baseUrl = 'https://restapi.amap.com/v3/place/around'  // 周边搜索 api
const key = '43c9cb89ad81d10f36e9aa7c04043e91'
const LOCATION = '120.66714,28.01308'  // 中心位置
const radius = '10000'   // 半径 M 0-50000
const offset = 20

// 组装 url 
function getUrl(page , type , location){
	let params = {
		key,
		location,
		radius,
		types: type,    // POI 编码表 https://a.amap.com/lbs/static/amap_poicode.xlsx.zip
		page,
		offset
	}
	let url = baseUrl + '?'
	Object.keys(params).map((key)=>{
		url +=  ( key + '=' + (''+params[key]) +'&') 
	})
	url = url.slice(0,-1)
	return url
}


const allTypes = [
	'050100' ,  // 餐饮
	'060000' ,  // 购物
	'090100' ,  // 医院
]
let pageNum = 10   //最好不要太大 ，否则请求数过大

async function getPOIofOneType(typeCode,location = LOCATION ) {
	if(!typeCode){
		console.error('no type code')
		return
	}
	let promises = []

	// 发第一次请求
	let pre =  await fetch( getUrl(1 , typeCode , location) )
				.then((res)=>res.json())
				.then((res)=>{
					return res
				})
    let { count } = pre

    pageNum = Math.ceil( count / offset )

    console.log(`count : ${count} , pageNum : ${pageNum} , typeCode : ${typeCode}`)

    // 后面发好多次请求
	for(let i = 2 ;i <= pageNum;i++){
	  promises.push(
		new Promise(function(resolve, reject) {
			fetch( getUrl(i , typeCode , location) )
				.then((res)=>res.json())
				.then((res)=>{
					resolve( res['pois'] )
				})
				.catch((err)=>{
					reject(err)
				})
		})
	  )
	}

	// 请求合并
	let pois = await Promise.all( promises )
		.then((poiArray)=>{
			return poiArray
		})
		.catch((err)=>{
			console.error(err)
		})
	
	// 转换格式
	const poiGetter = (poi) => {
		let {
			location,
			name,
			type : typeName
		} = poi

		let lng = parseFloat(location.split(',')[0]),
			lat = parseFloat(location.split(',')[1])
		
		return {
			name,
			lng,
			lat,
			typeName
		}
	}

	pois.push( pre['pois'] )
    pois = pois.map((poisGroup)=>{
				if(!poisGroup)  return
				return poisGroup.map( poiGetter )
			})
			.reduce((a,b)=>{  // flat arr
				return a.concat(b)
			},[])
			
    return pois
}


async function get(){
	let res = []
	for(let i = 0;i < allTypes.length;i++){
		let _res = await getPOIofOneType( allTypes[i] )
		res = res.concat( _res )
	}
	return res
}

module.exports = {
	getPois : get
}