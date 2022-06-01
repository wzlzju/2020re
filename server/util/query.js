const 	mysql      = require('mysql')
const  	QueryBase  = require('./query')

const CONFIG = require('../config')
const DB_CONFIG_SERVER = {
	host     : '116.62.46.132',   // 数据库地址
	user     : 'root',          // 数据库用户
	password : 'root' ,       	// 数据库密码
	database : 'vis2020',         // 选中数据库
	connectionLimit: 1000,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
}

const DB_CONFIG_LOCAL = {
	host     : 'localhost',   // 数据库地址
	user     : 'root',          // 数据库用户
	password : 'ykj199743' ,       	// 数据库密码
	database : 'visi2020',         // 选中数据库
	connectionLimit: 1000,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
}

const DB_CONFIG = DB_CONFIG_LOCAL


class QuerySql {
	constructor() {
    	this._init()
  	}
  	_init(){
		let pool = mysql.createPool( DB_CONFIG )
		this.query = ( sql, values )  => {
		  return new Promise(( resolve, reject ) => {
		    pool.getConnection((err, connection) =>{
		      if (err) {
		        reject( err )
		      } else {
		        connection.query(sql, values, ( err, rows) => {
		          if ( err ) {
		            reject( err )
		          } else {
		            resolve( rows )
		          }
		          
		          connection.release()
		        })
		      }
		    })
		  })
		}
  	}

  	async weibo(){
	    const  tableName  = 'weibo20140114'
	    let sql = `SELECT *  FROM ${tableName}`
	    let res =  await this.query( sql );
	    return res
	}

	async station(){
		const tableName = 'basestation'
		let sql = `SELECT *  FROM ${tableName}`
		let res =  await this.query( sql );
	    return res.map((item)=>{
	    	return {
	    		...item,
	    		'lng' : item['longitude'],
	    		'lat' : item['latitude'],
	    	}
	    })
	}

	async poi( types , bbox ){
		types = null
		const typeCondition =  types ? 
			'(' + types.map((type) => `type like '%${type}%'`).join(' OR ')  + ')'
			: null
		const regionCondition = bbox ?  
			`longitude > ${bbox['lngMin']} AND longitude < ${bbox['lngMax']} AND latitude > ${bbox['latMin']} AND latitude < ${bbox['latMax']}`
			 : null

		let conditions = [ typeCondition , regionCondition ].filter((cond)=> cond)
		let condition = conditions.length ? " WHERE " + conditions.join(" AND ") : ""

		const tableName = 'poi_region'
		// let sql = `SELECT *  FROM ${tableName} ${condition} LIMIT 1,1000`
		let sql = `SELECT *  FROM ${tableName} ${condition}`


		console.log( sql )
		let res =  await this.query( sql );

		return res 
	}
}


module.exports = QuerySql




/*
	Create table `poi_region` (
	Select * from `poi` WHERE 
		`longitude` > 120.52615492589692 AND 
		`longitude` < 120.88484148600844 AND 
        `latitude`  > 27.839332569287993 AND
        `latitude`  < 28.068424566577406
	);

*/