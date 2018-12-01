export class Geom {
    static dist(p, q) {
        var dlat = p.lat - q.lat;
        var dlng = p.lng - q.lng;
        return Math.sqrt(dlat * dlat + dlng * dlng);
    }

    static lerp(p, q, t) {
        return {
            lat: p.lat * (1 - t) + q.lat * t,
            lng: p.lng * (1 - t) + q.lng * t
        }
    }
}