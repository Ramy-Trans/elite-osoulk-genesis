const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-BzmFvS7N.js","assets/index-BamA_BAT.js","assets/leaflet-CIGW-MKW.css"])))=>i.map(i=>d[i]);
import{r as s,_ as f,j as w}from"./index-BamA_BAT.js";function $({markers:c,onSelect:p,selectedId:d,center:h,zoom:g=11}){const l=s.useRef(null),r=s.useRef(null),i=s.useRef([]),m=h||[30.0444,31.2357];return s.useEffect(()=>{if(!(!l.current||r.current))return f(()=>import("./leaflet-src-BzmFvS7N.js").then(o=>o.l),__vite__mapDeps([0,1])).then(o=>{if(f(()=>Promise.resolve({}),__vite__mapDeps([2])),delete o.Icon.Default.prototype._getIconUrl,o.Icon.Default.mergeOptions({iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",iconUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"}),!l.current)return;const t=o.map(l.current,{center:m,zoom:g,zoomControl:!0});if(o.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(t),r.current=t,(a=>{i.current.forEach(e=>e.remove()),i.current=[],a.forEach(e=>{const n=e.id===d,v=o.divIcon({className:"",html:`<div style="
              background: ${n?"#c9a84c":"#0a1628"};
              color: white;
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 2px solid ${n?"#0a1628":"white"};
              transform: ${n?"scale(1.15)":"scale(1)"};
              transition: all 0.2s;
            ">${e.price}</div>`,iconAnchor:[30,16]}),b=o.popup({maxWidth:260,closeButton:!1}).setContent(`
            <div style="font-family: system-ui, sans-serif; direction: rtl; text-align: right;">
              ${e.image?`<img src="${e.image}" alt="${e.title}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`:""}
              <div style="font-weight:800;font-size:14px;color:#0a1628;margin-bottom:2px;">${e.title}</div>
              <div style="font-size:12px;color:#666;margin-bottom:4px;">${e.location}</div>
              <div style="font-size:13px;font-weight:700;color:#c9a84c;">${e.price}</div>
              <a href="/properties/${e.id}" style="display:inline-block;margin-top:8px;padding:5px 12px;background:#0a1628;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">عرض العقار ←</a>
            </div>
          `),x=o.marker([e.lat,e.lng],{icon:v}).addTo(t).bindPopup(b);x.on("click",()=>{p&&p(e.id)}),i.current.push(x)})})(c),c.length>1){const a=o.featureGroup(i.current);t.fitBounds(a.getBounds().pad(.1))}}),()=>{r.current&&(r.current.remove(),r.current=null)}},[]),s.useEffect(()=>{r.current&&f(()=>import("./leaflet-src-BzmFvS7N.js").then(o=>o.l),__vite__mapDeps([0,1])).then(o=>{i.current.forEach(t=>t.remove()),i.current=[],c.forEach(t=>{const u=t.id===d,a=o.divIcon({className:"",html:`<div style="
            background: ${u?"#c9a84c":"#0a1628"};
            color: white; padding: 5px 10px; border-radius: 20px;
            font-size: 12px; font-weight: 800; white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid ${u?"#0a1628":"white"};
          ">${t.price}</div>`,iconAnchor:[30,16]}),e=o.popup({maxWidth:260,closeButton:!1}).setContent(`
          <div style="font-family:system-ui,sans-serif;direction:rtl;text-align:right;">
            ${t.image?`<img src="${t.image}" alt="${t.title}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`:""}
            <div style="font-weight:800;font-size:14px;color:#0a1628;margin-bottom:2px;">${t.title}</div>
            <div style="font-size:12px;color:#666;margin-bottom:4px;">${t.location}</div>
            <div style="font-size:13px;font-weight:700;color:#c9a84c;">${t.price}</div>
            <a href="/properties/${t.id}" style="display:inline-block;margin-top:8px;padding:5px 12px;background:#0a1628;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">عرض العقار ←</a>
          </div>
        `),n=o.marker([t.lat,t.lng],{icon:a}).addTo(r.current).bindPopup(e);n.on("click",()=>{p&&p(t.id)}),i.current.push(n)})})},[c,d]),w.jsx("div",{ref:l,className:"w-full h-full rounded-2xl overflow-hidden",style:{minHeight:400}})}export{$ as MapView};
