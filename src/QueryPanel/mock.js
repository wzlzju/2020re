import { COLOR_RED as COLOR_PRIVATE,
		 COLOR_BLUE as COLOR_PUBLIC } from './config'

export const taxiSearchCondition =  () => {
	return {
		  "condNodeId": 0,
		  "source": {
				name : 'taxi' ,
				color : COLOR_PRIVATE , 
				icon : 	'icon-chuzuche'
			},
		  "time": {
		    "start": "01:22",
		    "end": "08:45"
		  },
		  "regions": [
		    [
		      120.60172173806302,
		      28.03901714020917
		    ],
		    [
		      120.7091164652158,
		      28.03901714020917
		    ],
		    [
		      120.7091164652158,
		      27.987819597085878
		    ],
		    [
		      120.60172173806302,
		      27.987819597085878
		    ],
		    [
		      120.60172173806302,
		      28.03901714020917
		    ]
		  ]
		}
}

export const taxiGraphCondition =  (resNodeId , condNodeId ) => {
	return {
		  "id": resNodeId,
		  "condNodeId": condNodeId,
		  "k": 5,
		  "timeInterval": 10,
		  "region": [
		    [
		      120.60466748065197,
		      28.0314177803758
		    ],
		    [
		      120.70310305847188,
		      28.0314177803758
		    ],
		    [
		      120.70310305847188,
		      27.983296387860495
		    ],
		    [
		      120.60466748065197,
		      27.983296387860495
		    ],
		    [
		      120.60466748065197,
		      28.0314177803758
		    ]
		  ],
		  "timeRange": [
		    "Sat Jan 01 2000 01:22:00 GMT+0800 (中国标准时间)",
		    "Sat Jan 01 2000 08:34:07 GMT+0800 (中国标准时间)"
		  ],
		  "source":{
		  	"name":"taxi",
		  	"color": COLOR_PRIVATE ,
		  	"icon":"icon-chuzuche"
		  }
	}
}


export const weiboSearchCondition = () =>{
	return {
	  "condNodeId": 0,
	  "source":{
			name : 'weibo' ,
			color : COLOR_PRIVATE, 
			icon : 	'icon-weibo'
		},
	  "time": {
	    "start": "07:22",
	    "end": "08:45"
	  },
	  "regions": [
	    [
	      120.60172173806302,
	      28.03901714020917
	    ],
	    [
	      120.7091164652158,
	      28.03901714020917
	    ],
	    [
	      120.7091164652158,
	      27.987819597085878
	    ],
	    [
	      120.60172173806302,
	      27.987819597085878
	    ],
	    [
	      120.60172173806302,
	      28.03901714020917
	    ]
	  ]
	}	
}

export const weiboGraphCondition = ( resNodeId , condNodeId )=>{
	return {
		  "id": resNodeId,
		  "condNodeId": condNodeId,
		  "k": 5,
		  "timeInterval": 10,
		  "region": [
		    [
		      120.60466748065197,
		      28.0314177803758
		    ],
		    [
		      120.70310305847188,
		      28.0314177803758
		    ],
		    [
		      120.70310305847188,
		      27.983296387860495
		    ],
		    [
		      120.60466748065197,
		      27.983296387860495
		    ],
		    [
		      120.60466748065197,
		      28.0314177803758
		    ]
		  ],
		  "timeRange": [
		    "Sat Jan 01 2000 01:22:00 GMT+0800 (中国标准时间)",
		    "Sat Jan 01 2000 08:34:07 GMT+0800 (中国标准时间)"
		  ]
		}
}


export const  poiQueryCondition = () =>{
	return {
	  "condNodeId": 0,
	  "source":{
			name : 'poi' ,
			color : COLOR_PUBLIC, 
			icon : 	'icon-poi'
		}
	}
}