import L from "leaflet";

export function createPinIcon(label = ""): L.DivIcon {
  return L.divIcon({
    className: "vl-pin-icon",
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    html: `<div class="vl-pin"><span>${label}</span></div>`,
  });
}
