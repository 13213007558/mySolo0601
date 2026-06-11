import{o as y,p as f,q as x,t as g,r as a,_ as S,v as i,n as e,O as w,M as j,L as M,S as k}from"./components-DDxTwQnv.js";/**
 * @remix-run/react v2.17.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function N({getKey:t,...c}){let{isSpaMode:u}=y(),n=f(),h=x();g({getKey:t,storageKey:l});let m=a.useMemo(()=>{if(!t)return null;let s=t(n,h);return s!==n.key?s:null},[]);if(u)return null;let p=((s,d)=>{if(!window.history.state||!window.history.state.key){let o=Math.random().toString(32).slice(2);window.history.replaceState({key:o},"")}try{let r=JSON.parse(sessionStorage.getItem(s)||"{}")[d||window.history.state.key];typeof r=="number"&&window.scrollTo(0,r)}catch(o){console.error(o),sessionStorage.removeItem(s)}}).toString();return a.createElement("script",S({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${p})(${i(JSON.stringify(l))}, ${i(JSON.stringify(m))})`}}))}const O="/assets/tailwind-B9uENSV7.css",v=()=>[{rel:"preconnect",href:"https://fonts.googleapis.com"},{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"},{rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap"},{rel:"stylesheet",href:O}];function L({children:t}){return e.jsxs("html",{lang:"zh-CN",children:[e.jsxs("head",{children:[e.jsx("meta",{charSet:"utf-8"}),e.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"}),e.jsx("meta",{name:"theme-color",content:"#0A1628"}),e.jsx(j,{}),e.jsx(M,{})]}),e.jsxs("body",{className:"bg-nautical-900 text-slate-100 antialiased overflow-x-hidden selection:bg-indicator-cyan/30",children:[t,e.jsx(N,{}),e.jsx(k,{})]})]})}function E(){return e.jsx(w,{})}export{L as Layout,E as default,v as links};
