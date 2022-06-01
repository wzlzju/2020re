const POI_TYPES = [
  ['交通设施', 'Transport'],
  ['休闲娱乐', 'Entertainment'],
  ['公司企业', 'Enterprise'],
  ['医疗', 'Hostipal'],
  ['政府机构', 'Goverment'],
  ['旅游景点', 'Tourist Attraction'],
  ['生活服务', 'Living Service'],
  ['美食', 'Restaurant'],
  ['购物', 'Shopping'],
  ['运动健身', 'Gym']
]

const POI_COLORS = [
	'#a6cee3',
	'#1f78b4',
	'#b2df8a',
	'#33a02c',
	'#fb9a99',
	'#e31a1c',
	'#fdbf6f',
	'#ff7f00',
	'#cab2d6',
	'#6a3d9a',
	'#ffff99',
	'#b15928',
]

const POI_COLOR_MAP = {}

POI_TYPES.map((type,i)=>{
	POI_COLOR_MAP[ type ] = POI_COLORS[i]
})

module.exports = {
	POI_TYPES,
	POI_COLOR_MAP
}