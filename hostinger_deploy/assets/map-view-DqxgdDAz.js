const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-BmqNQUO7.js","assets/index-DbgHH4Px.js","assets/index-CKCVcwmz.css","assets/leaflet-CIGW-MKW.css"])))=>i.map(i=>d[i]);
import{bw as s,ae as f,bu as w}from"./index-DbgHH4Px.js";function $({markers:c,onSelect:p,selectedId:d,center:h,zoom:g=11}){const l=s.useRef(null),r=s.useRef(null),n=s.useRef([]),m=h||[30.0444,31.2357];return s.useEffect(()=>{if(!(!l.current||r.current))return f(()=>import("./leaflet-src-BmqNQUO7.js").then(e=>e.l),__vite__mapDeps([0,1,2])).then(e=>{if(f(()=>Promise.resolve({}),__vite__mapDeps([3])),delete e.Icon.Default.prototype._getIconUrl,e.Icon.Default.mergeOptions({iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",iconUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"}),!l.current)return;const t=e.map(l.current,{center:m,zoom:g,zoomControl:!0});if(e.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(t),r.current=t,(a=>{n.current.forEach(o=>o.remove()),n.current=[],a.forEach(o=>{const i=o.id===d,b=e.divIcon({className:"",html:`<div style="
              background: ${i?"#c9a84c":"#0a1628"};
              color: white;
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 2px solid ${i?"#0a1628":"white"};
              transform: ${i?"scale(1.15)":"scale(1)"};
              transition: all 0.2s;
            ">${o.price}</div>`,iconAnchor:[30,16]}),v=e.popup({maxWidth:260,closeButton:!1}).setContent(`
            <div style="font-family: system-ui, sans-serif; direction: rtl; text-align: right;">
              ${o.image?`<img src="${o.image}" alt="${o.title}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`:""}
              <div style="font-weight:800;font-size:14px;color:#0a1628;margin-bottom:2px;">${o.title}</div>
              <div style="font-size:12px;color:#666;margin-bottom:4px;">${o.location}</div>
              <div style="font-size:13px;font-weight:700;color:#c9a84c;">${o.price}</div>
              <a href="/properties/${o.id}" style="display:inline-block;margin-top:8px;padding:5px 12px;background:#0a1628;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">عرض العقار ←</a>
            </div>
          `),x=e.marker([o.lat,o.lng],{icon:b}).addTo(t).bindPopup(v);x.on("click",()=>{p&&p(o.id)}),n.current.push(x)})})(c),c.length>1){const a=e.featureGroup(n.current);t.fitBounds(a.getBounds().pad(.1))}}),()=>{r.current&&(r.current.remove(),r.current=null)}},[]),s.useEffect(()=>{r.current&&f(()=>import("./leaflet-src-BmqNQUO7.js").then(e=>e.l),__vite__mapDeps([0,1,2])).then(e=>{n.current.forEach(t=>t.remove()),n.current=[],c.forEach(t=>{const u=t.id===d,a=e.divIcon({className:"",html:`<div style="
            background: ${u?"#c9a84c":"#0a1628"};
            color: white; padding: 5px 10px; border-radius: 20px;
            font-size: 12px; font-weight: 800; white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid ${u?"#0a1628":"white"};
          ">${t.price}</div>`,iconAnchor:[30,16]}),o=e.popup({maxWidth:260,closeButton:!1}).setContent(`
          <div style="font-family:system-ui,sans-serif;direction:rtl;text-align:right;">
            ${t.image?`<img src="${t.image}" alt="${t.title}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`:""}
            <div style="font-weight:800;font-size:14px;color:#0a1628;margin-bottom:2px;">${t.title}</div>
            <div style="font-size:12px;color:#666;margin-bottom:4px;">${t.location}</div>
            <div style="font-size:13px;font-weight:700;color:#c9a84c;">${t.price}</div>
            <a href="/properties/${t.id}" style="display:inline-block;margin-top:8px;padding:5px 12px;background:#0a1628;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">عرض العقار ←</a>
          </div>
        `),i=e.marker([t.lat,t.lng],{icon:a}).addTo(r.current).bindPopup(o);i.on("click",()=>{p&&p(t.id)}),n.current.push(i)})})},[c,d]),w.jsxDEV("div",{ref:l,className:"w-full h-full rounded-2xl overflow-hidden",style:{minHeight:400}},void 0,!1,{fileName:"/home/runner/workspace/src/components/osoulk/map-view.tsx",lineNumber:160,columnNumber:5},this)}export{$ as MapView};
