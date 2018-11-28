'use strict';

function slippymap_init() {
    var map;
    map = new OpenLayers.Map("map", {
        // controls: [new OpenLayers.Control.Navigation(), new OpenLayers.Control.PanZoom(), new OpenLayers.Control.Attribution()],
        // maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
        // maxResolution: 156543.0399,
        // units: 'meters',
        // projection: "EPSG:900913"
    });
    var layer = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
    map.addLayer(layer);
    // var epsg4326 = new OpenLayers.Projection("EPSG:4326");
    var lonLat = new OpenLayers.LonLat(34.0738525390, 32.433350262414404);//.transform(epsg4326, map.getProjectionObject());
    map.setCenter(lonLat, 7);
    // map.setView(new L.LatLng(32.433350262414404, 34.0738525390), 7);
    // var panel = new OpenLayers.Control.Panel({ displayClass: "buttonsPanel" });
    // map.addControl(panel);
}
window.onload = slippymap_init;