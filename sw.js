if(!self.define){let e,i={};const n=(n,s)=>(n=new URL(n+".js",s).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(s,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(i[o])return;let t={};const c=e=>n(e,o),d={module:{uri:o},exports:t,require:c};i[o]=Promise.all(s.map((e=>d[e]||c(e)))).then((e=>(r(...e),t)))}}define(["./workbox-3625d7b0"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-39a121fb.css",revision:null},{url:"assets/index-8a6df1b1.js",revision:null},{url:"index.html",revision:"e0e660b4e6d19750386c39e6a3328cdd"},{url:"registerSW.js",revision:"402b66900e731ca748771b6fc5e7a068"},{url:"favicon.png",revision:"1faee7ff937d8c6dcb78462c02d71aca"},{url:"favicon-192.png",revision:"0e8c5d19e29d709cbc3af96d1da1e3f9"},{url:"favicon-512.png",revision:"bbc3e559b3107ef842127aef49965dc8"},{url:"manifest.webmanifest",revision:"e5b5e369a06e796063244824015a43d9"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
