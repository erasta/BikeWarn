import { Geom } from "./Geom.js";

export class Bike {

    clickMarker(e, p) {
        L.DomEvent.stopPropagation(e);
        var tstr = new Date(p.time).toLocaleTimeString();
        var btn = '<center>היה כאן פקח<br>' + tstr + '</center><br><button id="add-button">עדיין יש</button><button id="no-button">לא רואה</button>';
        var popup = L.popup().setLatLng(e.target.getLatLng()).setContent(btn).openOn(this.map);
        setTimeout(() => {
            document.getElementById('add-button').addEventListener('click', () => {
                popup.remove();
                var r = this.fire.push({ latlng: e.target.getLatLng(), num: 1, time: Date.now() });
                setTimeout(() => {
                    r.remove();
                }, Bike.removeAfter);
            });
            document.getElementById('no-button').addEventListener('click', () => {
                popup.remove();
                var r = this.fire.push({ latlng: e.target.getLatLng(), num: -0.35, time: Date.now() });
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
                    firebase.database().ref(k).remove();
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
                if (p.num > 0) {
                    found.time = Math.max(found.time, p.time);
                }
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
        var positions = positions.filter((pos) => pos.num > 0);

        // Show and save
        this.features = positions.map((p) => {
            return L.circleMarker(p.latlng, { color: 'red', weight: p.num }).addTo(this.map).on('click', (e) => {
                this.clickMarker(e, p)
            });
        });
    }

    // randomColor() {
    //     return '#' + [(~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16), (~~(Math.random() * 16)).toString(16)].join('');
    // }

    init() {
        // Initialize Firebase
        var config = { apiKey: "AIzaSyAD1oxPPPZRb64TJcADtRENkWS5ZcrtJ3Y", authDomain: "bikewarn-223907.firebaseapp.com", databaseURL: "https://bikewarn-223907.firebaseio.com", projectId: "bikewarn-223907", storageBucket: "bikewarn-223907.appspot.com", messagingSenderId: "638058417911" };
        firebase.initializeApp(config);
        this.fire = firebase.database().ref();

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