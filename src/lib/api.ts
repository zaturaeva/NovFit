const API = import.meta.env.VITE_API_URL || ''
export const getToken = () => localStorage.getItem('novfit-token') || ''
export const setSession = (token:string,user:any) => {
 localStorage.setItem('novfit-token',token)
 localStorage.setItem('novfit-user',JSON.stringify(user))
}
export const clearSession = () => { localStorage.removeItem('novfit-token'); localStorage.removeItem('novfit-user'); localStorage.removeItem('novfit-auth') }
export const getUser = () => { try{return JSON.parse(localStorage.getItem('novfit-user')||'null')}catch{return null} }
export async function api<T=any>(path:string, options:RequestInit={}) : Promise<T> {
 const headers = new Headers(options.headers || {})
 headers.set('Content-Type','application/json')
 if(getToken()) headers.set('Authorization',`Bearer ${getToken()}`)
 const response=await fetch(`${API}/api${path}`,{...options,headers})
 const data=await response.json().catch(()=>({}))
 if(!response.ok) throw new Error(data.error || 'Ошибка сервера')
 return data as T
}
export const websocketUrl = () => {
 const base=API || window.location.origin
 return `${base.replace(/^http/,'ws')}/ws?token=${encodeURIComponent(getToken())}`
}
