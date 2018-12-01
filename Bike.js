import { Geom } from "./Geom.js";

export class Bike {

    // randomColor() {
    //     return '#' + [(~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16)].join('');
    // }

    clickMarker(e) {
        L.DomEvent.stopPropagation(e);
        var btn = '<center>היה כאן פקח</center><br><button id="add-button">עדיין יש</button>';
        var popup = L.popup().setLatLng(e.latlng).setContent(btn).openOn(this.map);
        setTimeout(() => {
            document.getElementById('add-button').addEventListener('click', () => {
                popup.remove();
                var r = this.fire.push({ latlng: e.target.getLatLng(), num: 1, time: Date.now() });
                setTimeout(() => {
                    r.remove();
                }, Bike.removeAfter);
            });
        }, 1);
    }

    clickMap(e) {
        var btn = '<center>ראיתי פקח</center><br><button id="add-button"">אשר</button>';
        var popup = L.popup().setLatLng(e.latlng).setContent(btn).openOn(this.map);
        setTimeout(() => {
            document.getElementById('add-button').addEventListener('click', () => {
                popup.remove();
                var r = this.fire.push({ latlng: e.latlng, num: 1, time: Date.now() });
                setTimeout(() => {
                    r.remove();
                }, Bike.removeAfter);
            });
        }, 1);
    }

    flattenAndRemoveOld(snapval) {
        var ret = [];
        var now = Date.now();
        for (var k in snapval) {
            var v = snapval[k];
            if (!v.time || v.time < now - Bike.removeAfter || v.time > now) {
                setTimeout(() => {
                    firebase.database().ref('pos/' + k).remove();
                }, 1);
                continue;
            }
            ret.push(Object.assign({ id: k }, v));
        }
        return ret;
    }

    mergePoints(points) {
        var ret = [];
        points.forEach((p) => {
            var found = ret.find((q) => Geom.dist(p.latlng, q.latlng) < 0.0005);
            if (!found) {
                ret.push(p);
            } else {
                found.num += p.num;
                found.latlng = Geom.lerp(found.latlng, p.latlng, p.num / found.num);
                found.time = Math.min(found.time, p.time);
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
        var positions = this.flattenAndRemoveOld(snapshot.val());

        // Merge
        var positions = this.mergePoints(positions);

        // Show and save
        this.features = positions.map((p) => {
            return L.circleMarker(p.latlng, { color: 'red', weight: p.num }).addTo(this.map).on('click', this.clickMarker, this);
        });
    }

    init() {
        // Initialize Firebase
        var config = { apiKey: "AIzaSyAD1oxPPPZRb64TJcADtRENkWS5ZcrtJ3Y", authDomain: "bikewarn-223907.firebaseapp.com", databaseURL: "https://bikewarn-223907.firebaseio.com", projectId: "bikewarn-223907", storageBucket: "bikewarn-223907.appspot.com", messagingSenderId: "638058417911" };
        firebase.initializeApp(config);
        this.fire = firebase.database().ref('pos');

        this.map = L.map('map', { attributionControl: true, zoomControl: false });
        var tileurl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(tileurl, { id: 'mapbox.light', attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' }).addTo(this.map);

        this.map.on('locationerror', () => { this.map.setView(new L.LatLng(32.07, 34.78), 15); });
        this.map.on('locationfound', (e) => { L.marker(e.latlng).addTo(this.map); });
        this.map.locate({ setView: true, maxZoom: 25 });

        this.features = [];

        this.map.on('click', this.clickMap, this);

        this.fire.on('value', this.fireValues, this);

    }

}

Bike.removeAfter = 1000 * 60 * 60 * 6; // 6 hours

window.onload = () => { new Bike().init(); };