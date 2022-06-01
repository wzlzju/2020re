import React, { Component } from 'react';
import { Row,
         Col,
         Slider,
         Card,
         Tabs,
         Select,
         Drawer,
         Button,
         Collapse,
         Icon  } from 'antd';
import { defaultLayerConfigs }  from './config'

const { Panel } = Collapse;


export default class MyPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
        	configs : defaultLayerConfigs
        }
    }

    componentWillMount(){
        let { configs } = this.state
        configs.map((config)=>{
            config['renderParam']['visible'] = {  value:true }
        })
    }
    componentDidMount( propName ){
        let { handleRenderParamChange } = this.props
        let { configs } = this.state

        handleRenderParamChange && handleRenderParamChange(  configRenderParamsGetter(configs) )

    }
    onParamChange( id  , propName , value){
    	let { configs } = this.state
    	let [ layerId , paramCategory ] = resolveId( id )
    	configs.map((config)=>{
    		if( config['layerId'] == layerId ){
    			config[ paramCategory ][ propName ]['value'] = value
    		}
    	})
    	this.setState({ configs })

    	let { handleRenderParamChange } = this.props
    	if( paramCategory == 'renderParam')
    		handleRenderParamChange && handleRenderParamChange(  configRenderParamsGetter(configs) )
    }
    geneRenderPanel(layerId ,  renderParam ){
    	let self = this
    	return iterateObj( renderParam , ( renderPropName , paramObject )=>{
    		let id = composeId(layerId, 'renderParam') ,
    			prop = renderPropName,
    			param = {
    				id,prop,
    				...paramObject
    			}

            if( !paramObject['renderFunc'] ) return
    		return paramObject['renderFunc'].call( null , param , self )		
    	})
    }
    geneQueryPanel(layerId ,  queryParam ){
    	let { mapId } = this.props
    	
        if('circleRadius' in queryParam )
            queryParam['circleRadius']['mapId'] = mapId

    	let self = this
    	return iterateObj( queryParam , ( renderPropName , paramObject )=>{
    		let id = composeId( layerId, 'dataQueryParam' ) ,
    			prop = renderPropName,
    			param = {
    				id,prop,
    				...paramObject
    			}
    		return paramObject['renderFunc'].call( null , param , self )		
    	})
    }

    async handleQueryData(layerId){
    	let { configs } = this.state 
    	let { handleQuery } = this.props

    	let params = {}

        let i 
    	for(i = 0;i < configs.length;i++ ){
    		let configObj = configs[i]
    		if( configObj['layerId'] == layerId ){
    			params = configObj['dataQueryParam']
                configObj['loading'] = true
    			break
    		}
    	}
		params = paramsValueGetter(params)

        this.setState({ configs })
		if( handleQuery ){
            configs[i]['length'] =  await handleQuery( layerId , params )
            configs[i]['loading'] = false
            this.setState({ configs })
        }
    }
    geneOneLayer( layerConfig ){
    	let { layerId,renderParam,dataQueryParam,loading,length  } = layerConfig
    	return (
    		<Panel 
    			key={ composeId( layerId, 'renderParam' ) }
   				header={ layerId }
             	showArrow={false}
                extra={ genExtraVisibleIcon( composeId( layerId, 'renderParam' )   , renderParam['visible']['value'] , this) }
  			>
  			  { this.geneRenderPanel(layerId , renderParam ) }
    		</Panel>
    	)
    }

    render(){
    	let { configs } = this.state
    	return (
    		<Collapse
                expandIconPosition='right'
                defaultActiveKey={[ configs[0]['layerId'] ]}>
              { configs.map((config)=> this.geneOneLayer(config)) }
            </Collapse>
		  )
    }
}



const formKey = ";"
const composeId = ( id , paramCategory ) =>  `${id}${formKey}${paramCategory}`
const resolveId = ( composed ) =>  composed.split(formKey)

function iterateObj( obj , fn ){
	let keys = Object.keys( obj ),
		value
	return keys.map((key)=>{
		value = obj[key]
		return fn( key , value )
	})
}
const paramsValueGetter = ( paramObj ) =>  {
	let newPamraObj = {}
	Object.keys(paramObj).map((key)=>{
		newPamraObj[key] = paramObj[key]['value']
	})
	return newPamraObj 
}
const configRenderParamsGetter = (configs) => {
	let res = {}
	configs.map((config)=>{
		res[ config['layerId'] ] =  paramsValueGetter( config['renderParam'] )
	})
	return res
}

const genExtraDataNum = (num ) => {
  if(num == undefined) return ( <div></div> )
  return (
    <h4> Length : { num } </h4>
  )
}

const genExtraVisibleIcon = (id , visible , self) => (
  <Icon
    type={ visible ?  "eye" : "eye-invisible"}
    onClick={event => {
      visible = !visible
      self.onParamChange( id , 'visible' , visible )
      // 避免触发 折叠事件
      event.stopPropagation();
    }}
  />
);


