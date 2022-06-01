import React,{ Component } from 'react'

import './Links.scss'

class Links extends React.Component{
  constructor() {
    super(...arguments)
    this.state = {}
  }
  static defaultProps = {
    width : 100,
    height : 100,
  }
  render(){
    let { width,height,links } = this.props
    return (
     <svg className='links-panel' 
          width={width} 
          height={height}  >
          <ArrowDefine />
          {
            links.map((link,i)=>(
              <Link key={i} link={link} />
            ))
          }
      </svg>
    )
  }
}



class Link extends Component{
  constructor() {
    super(...arguments)
    this.state = {}
  }
  static defaultProps = {
    link : {
        start : {
          x : 100 ,
          y : 100
        },
        end : {
          x : 250,
          y : 250
        }
    }
  }
  render(){
    let { link } = this.props
    let { start,end } = link

    let _path = svgPathCurv(start , end , 1 )

    return(
        <path
          d={_path}
          className="link"
          markerEnd={ "url(#arrow)" }
          strokeDasharray={"10, 5"}
        >  
        </path>
    )
  }
}


const ArrowDefine = () => {
  const ID = "arrow"
  return (
    <defs>
      <marker
        id={ ID }
        markerWidth="26"
        markerHeight="26"
        viewBox="0 0 36 36"
        refX="18"
        refY="18"
        markerUnits="userSpaceOnUse"
        orient="auto">
        <path 
          d="M6,6 L30,18 L6,30 L18,18 L6,6" 
          style={{ 'fill':'#bfbfbf' }}></path>
      </marker>
    </defs>
  )
}


// https://blog.csdn.net/ouyang111222/article/details/51153638
function svgPathCurv(a,b,curv) {
    /*
     * 弯曲函数.
     * a:a点的坐标{x:10,y:10}
     * b:b点的坐标{x:10,y:20}
     * curv:弯曲程度 取值 -5 到 5 
     */
    curv = curv ? curv : 0;
    var s, q, l, path = '',k2
    var s = 'M' + a.x + ',' + a.y + ' ';

    /*
     * 控制点必须在line的中垂线上
     * **求出k2的中垂线(中垂线公式)**
     */
    k2 = -(a['x'] - b['x']) / (b['y'] - a['y']);
    /*
     * 弯曲程度是根据中垂线斜率决定固定控制点的X坐标或者Y坐标,通过中垂线公式求出另一个坐标
     * 默认A/B中点的坐标+curv*30,可以通过改基数30改变传入的参数范围
     */

     const _center = ( s ,e ) => {
      return {
          x : (s['x'] + e['x']) / 2,
          y : (s['y'] + e['y']) / 2
       }
     }

     let c0 = _center(a , b) ,
         c1 = _center(a , c0),
         c2 = _center(c0 , b)


     if( k2 > 50 || k2 < -50){
        k2 = 50
     } 

     c1['x']  = c1['x'] + curv  
     c1['y']  = k2 * curv + c1['y']

     c2['x']  = c2['x'] - curv  
     c2['y']  = -k2 * curv + c2['y']


    //定义控制点的位置

    q = 'C' + c1['x'] + ',' + c1['y'] + ' ' + c2['x'] + ',' + c2['y'] + ' ';
    //l=lineto
    l = b['x'] + ',' + b['y'] + ' ';
    //结果例: M10,10Q35,15,10,20 
    path = s + q + l ;
    return path;
}

export default Links