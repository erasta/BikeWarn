export class Bike {

    randomColor() {
        return '#' + [(~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16)].join('');
    }

    createMarker(latlng) {
        return L.marker(latlng, {
            // icon: L.icon({ 'marker-color': randomColor() })
        }).bindPopup("Clicked at " + latlng.toString()).addTo(this.map).openPopup();
        // }).bindPopup('<input type="text" id="message" /><br /><button id="add-button">Add</button>').addTo(this.map).openPopup();
    }

    init() {
        // Initialize Firebase
        var config = { apiKey: "AIzaSyAD1oxPPPZRb64TJcADtRENkWS5ZcrtJ3Y", authDomain: "bikewarn-223907.firebaseapp.com", databaseURL: "https://bikewarn-223907.firebaseio.com", projectId: "bikewarn-223907", storageBucket: "bikewarn-223907.appspot.com", messagingSenderId: "638058417911" };
        firebase.initializeApp(config);

        this.map = L.map('map', { attributionControl: true, zoomControl: true, });
        this.map.setView(new L.LatLng(32.07, 34.78), 15);
        var tileurl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(tileurl, { id: 'mapbox.light', attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' }).addTo(this.map);

        this.features = [];

        this.map.on('click', (e) => {
            firebase.database().ref('pos').push(L.marker(e.latlng, {}).toGeoJSON());
        });

        firebase.database().ref('pos').on('value', (snapshot) => {
            this.features.forEach(m => {
                this.map.removeLayer(m);
            });

            this.features.length = 0;
            for (var k in snapshot.val()) {
                var m = L.geoJSON(snapshot.val()[k]).addTo(this.map);
                this.features.push(m);
            }
        });

    }

}

window.onload = () => { new Bike().init(); };