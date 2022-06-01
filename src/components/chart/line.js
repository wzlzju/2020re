import React from "react";
import {
  G2,
  Chart,
  Geom,
  Axis,
  Tooltip,
  Coord,
  Label,
  Legend,
  View,
  Guide,
  Shape,
  Facet,
  Util
} from "bizcharts";
import DataSet from "@antv/data-set";
import { POI_COLOR_MAP }  from '@/../server/config'


const styles ={
  mainTitle:{
    fontSize:18,
    color:'#707070',
    textAlign:"center"
  }
}

class Basic extends React.Component {
  render() {
    let { statics  } = this.props

    let data = Object.keys( statics ).map((type)=>{
      return {
         type,
         count : statics[type]
      }
    })

    const scale = {
      count:{
        alias: 'Numbers'
      },
      type:{
        alias: "Types"
      }

    };

    const ds = new DataSet();
    const dv = ds.createView().source(data);
    dv.source(data).transform({
      type: "sort",
      callback(a, b) {
        // 排序依据，和原生js的排序callback一致
        return  b.count - a.count;
      }
    });
    return (
        <Chart
          scale={scale}
          data={dv} forceFit
          height={220}
          padding={[ 20, 30, 30, 20]}
        >
          <h3 className='main-title' style={styles.mainTitle}>
            The Distirbuion of POI's Types
          </h3>
          <Coord />
          <Axis
            title={{
              offset: 10,
              position: 'end'
            }}
            label={null}
            name="type"
          />
          <Axis
            title={{
              offset: 5,
              position: 'end'
            }}
            label={null}
            name="count" />
          <Tooltip 

          />
          <Geom 
            type="interval"
            position="type*count"
            color={"#FB8072"}
            tooltip={['type*count', (type, count) => {
              return {
                name: type,
                value: count
              };
            }]}
            />
          {/*<Legend name='type' position='top-center' offsetX={5}/>*/}
        </Chart>
    );
  }
}

export default Basic