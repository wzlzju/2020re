import * as d3Scale from 'd3-scale'
import * as d3Interpolate from 'd3-interpolate'

// https://css-tricks.com/converting-color-spaces-in-javascript/
export function hexToRGBArray(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    let arr 

    if ( alpha >= 0 ) {
       arr =  [r , g , b , Math.round( 255 * alpha) ] 
    } else {
       arr =  [r , g , b , 255] 
    }
    return arr
}

export function setTooltip( object, x, y , mapId ) {
  const el = document.getElementById('tooltip'+mapId);
  if (object) {
    el.innerHTML = object['message'];
    el.style.display = 'block';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  } else {
    el.style.display = 'none';
  }
}

export function rgbToHex( rgbString ){
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  let reg = /\d+/g
  let r  = parseInt(reg.exec( rgbString )[0])
  let g  = parseInt(reg.exec( rgbString )[0])
  let b  = parseInt(reg.exec( rgbString )[0])
  return rgbToHex( r , g , b)
}
// console.log( rgbToHex("rgb(152, 67, 98)") )


export function _precision( flaotNum   ){
  const bitCount = 5
  return parseFloat( flaotNum.toFixed(bitCount) )
}


const ids = []
export function generateMapId(){
    let fn = () =>  Math.random().toFixed(5).slice(2),
        id = fn()
    while( ids.indexOf(id) != -1 ){
       id = fn()
    }
    ids.push( id )
    return id 
} 

export const COLORS_TAXI = [
  'rgb(255,245,240)',
  'rgb(254,224,210)',
  'rgb(252,187,161)',
  'rgb(252,146,114)',
  'rgb(251,106,74)',
  'rgb(239,59,44)',
  'rgb(203,24,29)',
  'rgb(165,15,21)',
  'rgb(103,0,13)',
]
export const COLORS_WEIBO = [
  'rgb(255,247,251)',
  'rgb(236,231,242)',
  'rgb(208,209,230)',
  'rgb(166,189,219)',
  'rgb(116,169,207)',
  'rgb(54,144,192)',
  'rgb(5,112,176)',
  'rgb(4,90,141)',
  'rgb(2,56,88)',
]
export const EXTENT_TAXI = [0,2000]
export const EXTENT_WEIBO = [0,100]
export function colorScale( numbers , valueof , type ){
    let colors =  type =='weibo' ? COLORS_WEIBO : COLORS_TAXI 
    colors = colors.map( (rgb) => rgbToHex(rgb) )
    let extent = _extent(numbers , valueof)
    var scale = d3Scale.scaleQuantize()
      .domain( type=='weibo' ? EXTENT_WEIBO : EXTENT_TAXI   )
      .range( colors )
    return { extent , scale }
}

export function widthScale( numbers , valueof , maxWidth ) {
    let extent = _extent(numbers , valueof)
    let scale = d3Scale.scaleLinear( )
      .domain(extent)
      .range([0,maxWidth])
    return scale
}

function  _extent(values, valueof) {
  let min;
  let max;
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null) {
        if (min === undefined) {
          if (value >= value) min = max = value;
        } else {
          if (min > value) min = value;
          if (max < value) max = value;
        }
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null) {
        if (min === undefined) {
          if (value >= value) min = max = value;
        } else {
          if (min > value) min = value;
          if (max < value) max = value;
        }
      }
    }
  }
  return [min, max];
}