export class Bike {

    randomColor() {
        return '#' + [(~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16)].join('');
    }

    // createMarker(latlng) {
    //     return L.circleMarker(latlng, {
    //         // icon: L.icon({ 'marker-color': randomColor() })
    //     }).bindPopup("Clicked at " + latlng.toString()).addTo(this.map).openPopup();
    //     // }).bindPopup('<input type="text" id="message" /><br /><button id="add-button">Add</button>').addTo(this.map).openPopup();
    // }

    clickMap(e) {
        this.fire.push({ latlng: e.latlng, num: 1 });
    }

    dist(p, q) {
        var dlat = p.latlng.lat - q.latlng.lat;
        var dlng = p.latlng.lng - q.latlng.lng;
        return Math.sqrt(dlat * dlat + dlng * dlng);
    }

    mergePositions(positions) {
        var ret = [];
        positions.forEach((p) => {
            var found = ret.find((q) => this.dist(p, q) < 0.0005);
            if (found) {
                ++found.num;
                found.latlng.lat = (found.latlng.lat + p.latlng.lat) / 2.0;
                found.latlng.lng = (found.latlng.lng + p.latlng.lng) / 2.0;
            } else {
                ret.push(p);
            }
        });
        return ret;
    }

    fireValues(snapshot) {
        // Clean
        this.features.forEach(m => {
            this.map.removeLayer(m);
        });

        // Flatten
        var positions = [];
        for (var k in snapshot.val()) {
            positions.push(snapshot.val()[k]);
        }

        // Merge
        var positions = this.mergePositions(positions);

        // Show and save
        this.features = positions.map((p) => {
            return L.circleMarker(p.latlng, { weight: p.num }).addTo(this.map);
        });
    }

    init() {
        // Initialize Firebase
        var config = { apiKey: "AIzaSyAD1oxPPPZRb64TJcADtRENkWS5ZcrtJ3Y", authDomain: "bikewarn-223907.firebaseapp.com", databaseURL: "https://bikewarn-223907.firebaseio.com", projectId: "bikewarn-223907", storageBucket: "bikewarn-223907.appspot.com", messagingSenderId: "638058417911" };
        firebase.initializeApp(config);
        this.fire = firebase.database().ref('pos');

        this.map = L.map('map', { attributionControl: true, zoomControl: true, });
        var tileurl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(tileurl, { id: 'mapbox.light', attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' }).addTo(this.map);

        this.map.on('locationerror', () => { this.map.setView(new L.LatLng(32.07, 34.78), 15); });
        this.map.on('locationfound', (e) => { L.marker(e.latlng).addTo(this.map); });
        this.map.locate({ setView: true, maxZoom: 18 });

        this.features = [];

        this.map.on('click', this.clickMap.bind(this));

        this.fire.on('value', this.fireValues.bind(this));

    }

}

window.onload = () => { new Bike().init(); };