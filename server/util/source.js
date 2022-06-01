const fs = require('fs')
const csv = require('csv-parser')
// const PATH = './public/'
const PATH = './data/'
const fetch = require('node-fetch')

const baseUrl = 'https://qiniu.aggge.cn/'

async function readJson(file) {
	return new Promise(( resolve, reject ) => {
	  	fs.readFile(PATH + file , (err, data) => {
				if (err) {
		        reject( err )
	      	} else {
	     		resolve( JSON.parse(data) )
	        }
		})
	  })
}

async function readRemoteJson(file) {
	return new Promise(( resolve, reject ) => {
		fetch( baseUrl + file )
		  .then(function(response) {
		    return response.json();
		  })
		  .then(function(myJson) {
		  	 // console.log(myJson)
		  	 resolve(myJson)
		  })
		 .catch(error => console.error(error))
	})
}


async function readCsv( file ) {
 return new Promise(( resolve, reject ) => {
  	let res = []
  	fs.createReadStream( PATH + file )
	  .pipe(csv())
	  .on('data', (data) => res.push(data))
	  .on('end', () => {
	  		resolve(res)
	  });
  })
}


function writeJson( file , data ){
	data = JSON.stringify(data);
	fs.writeFileSync( PATH + file , data);
}


module.exports =  {
	readJson,
	readRemoteJson,
	readCsv,
	writeJson
}