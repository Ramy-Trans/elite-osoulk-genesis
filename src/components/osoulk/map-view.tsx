import { useEffect, useRef } from "react";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: string;
  location: string;
  type: string;
  image?: string;
};

type Props = {
  markers: MapMarker[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  center?: [number, number];
  zoom?: number;
};

export function MapView({ markers, onSelect, selectedId, center, zoom = 11 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const defaultCenter: [number, number] = center || [30.0444, 31.2357];

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (!mapRef.current) return;
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;

      const addMarkers = (markerList: MapMarker[]) => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        markerList.forEach((item) => {
          const isSelected = item.id === selectedId;

          const icon = L.divIcon({
            className: "",
            html: `<div style="
              background: ${isSelected ? "#c9a84c" : "#0a1628"};
              color: white;
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 2px solid ${isSelected ? "#0a1628" : "white"};
              transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
              transition: all 0.2s;
            ">${item.price}</div>`,
            iconAnchor: [30, 16],
          });

          const popup = L.popup({ maxWidth: 260, closeButton: false }).setContent(`
            <div style="font-family: system-ui, sans-serif; direction: rtl; text-align: right;">
              ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
              <div style="font-weight:800;font-size:14px;color:#0a1628;margin-bottom:2px;">${item.title}</div>
              <div style="font-size:12px;color:#666;margin-bottom:4px;">${item.location}</div>
              <div style="font-size:13px;font-weight:700;color:#c9a84c;">${item.price}</div>
              <a href="/properties/${item.id}" style="display:inline-block;margin-top:8px;padding:5px 12px;background:#0a1628;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">عرض العقار ←</a>
            </div>
          `);

          const marker = L.marker([item.lat, item.lng], { icon })
            .addTo(map)
            .bindPopup(popup);

          marker.on("click", () => {
            if (onSelect) onSelect(item.id);
          });

          markersRef.current.push(marker);
        });
      };

      addMarkers(markers);

      if (markers.length > 1) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current) return;
    import("leaflet").then((L) => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      markers.forEach((item) => {
        const isSelected = item.id === selectedId;
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background: ${isSelected ? "#c9a84c" : "#0a1628"};
            color: white; padding: 5px 10px; border-radius: 20px;
            font-size: 12px; font-weight: 800; white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid ${isSelected ? "#0a1628" : "white"};
          ">${item.price}</div>`,
          iconAnchor: [30, 16],
        });

        const popup = L.popup({ maxWidth: 260, closeButton: false }).setContent(`
          <div style="font-family:system-ui,sans-serif;direction:rtl;text-align:right;">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;">` : ""}
            <div style="font-weight:800;font-size:14px;color:#0a1628;margin-bottom:2px;">${item.title}</div>
            <div style="font-size:12px;color:#666;margin-bottom:4px;">${item.location}</div>
            <div style="font-size:13px;font-weight:700;color:#c9a84c;">${item.price}</div>
            <a href="/properties/${item.id}" style="display:inline-block;margin-top:8px;padding:5px 12px;background:#0a1628;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">عرض العقار ←</a>
          </div>
        `);

        const marker = L.marker([item.lat, item.lng], { icon })
          .addTo(leafletMapRef.current)
          .bindPopup(popup);

        marker.on("click", () => { if (onSelect) onSelect(item.id); });
        markersRef.current.push(marker);
      });
    });
  }, [markers, selectedId]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 400 }} />
  );
}
