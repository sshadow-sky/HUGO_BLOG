import { welcomeCities } from './home-welcome-data.js'

export function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = value => value * Math.PI / 180
  const a = Math.sin(rad(lat2-lat1)/2)**2 + Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(rad(lon2-lon1)/2)**2
  return 6371 * 2 * Math.asin(Math.sqrt(Math.max(0,Math.min(1,a))))
}

export function visitorPlace(position) {
  if (!position || !Number.isFinite(position.latitude) || !Number.isFinite(position.longitude) || Math.abs(position.latitude)>90 || Math.abs(position.longitude)>180 || position.accuracy>50000) return null
  const {latitude,longitude} = position
  let city = null, nearest = 45
  if (!(position.accuracy>20000)) for (const candidate of welcomeCities) {
    const km = distanceKm(latitude,longitude,candidate.latitude,candidate.longitude)
    if (km<nearest) { city=candidate;nearest=km }
  }
  return {city,km:distanceKm(30.58,114.27,latitude,longitude)}
}

export function greeting(hour) {
  if(hour<5 || hour>=23)return '夜深了'
  if(hour<11)return '早上好'
  if(hour<14)return '中午好'
  if(hour<18)return '下午好'
  return '晚上好'
}

export function welcomeCopy(place, hour) {
  const city=place?.city, friend=city ? `${city.name}的朋友` : '朋友'
  const first=city?.foods[0] || '热干面', second=city?.foods[1] || '家乡小吃'
  const hello=`${greeting(hour)}，${friend}。`
  if(hour<5 || hour>=23)return `${hello}把${first}的念想留给明天，读几行喜欢的文字，也记得早些休息。`
  if(hour<11)return `${hello}借${first}的香气，和你开启新的一天。欢迎来坐坐。`
  if(hour<14)return `${hello}午饭吃好了吗？聊聊${first}，也聊聊今天的新鲜事。`
  if(hour<18)return `${hello}歇一会儿吧，借${second}的滋味，陪你度过这段闲暇。`
  return `${hello}忙碌了一天，聊聊${second}和街巷故事，让晚风陪你慢慢读。`
}

export function mountHomeWelcome(card) {
  if(!card)return {updateLocation(){},updateTime(){},cleanup(){}}
  let place=null,disposed=false,hour=new Date().getHours()
  const write=(selector,value)=>{const el=card.querySelector(selector);if(el && el.textContent!==value)el.textContent=value}
  const render=()=>{
    if(disposed)return
    write('[data-welcome-destination]',place?.city ? `${place.city.name}附近` : place ? '远方的你' : '屏幕那端的你')
    write('[data-welcome-distance]',place ? place.km<5 ? '就在武汉身边' : `距武汉约 ${Math.round(place.km).toLocaleString('zh-CN')} 公里` : '相逢，不必问远近')
    write('[data-welcome-copy]',welcomeCopy(place,hour))
  }
  render()
  return {
    updateLocation(position){place=visitorPlace(position);render()},
    updateTime(now){if(now.getHours()!==hour){hour=now.getHours();render()}},
    cleanup(){disposed=true;place=null},
  }
}
