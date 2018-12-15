import { Geom } from "./Geom.js";

export class Bike {

    createButton(text, click) {
        var btn = document.createElement('button');
        btn.textContent = text;
        btn.addEventListener('click', click);
        return btn;
    }

    fireWithTimeout(obj, timeout) {
        var r = this.fire.push(obj);
        setTimeout(() => {
            r.remove();
        }, timeout);
    }

    createMarker(p) {
        var icon = L.BeautifyIcon.icon({
            icon: 'eye', iconShape: 'marker', // iconAnchor: [13, 25],
            borderColor: 'Crimson', textColor: 'DarkRed', backgroundColor: 'CornflowerBlue', //borderWidth: p.num
        });
        var marker = L.marker(p.latlng, { icon }).addTo(this.map);
        var tstr = new Date(p.time).toLocaleTimeString();
        var popup = document.createElement('div');
        var popstr = popup.appendChild(document.createElement('center'));
        popstr.innerHTML = 'היה כאן פקח<br>' + tstr;

        popup.appendChild(this.createButton('עדיין יש', () => {
            marker.closePopup();
            this.fireWithTimeout({ latlng: p.latlng, num: 1, time: Date.now() }, Bike.removeAfter);
        }));

        popup.appendChild(this.createButton('לא רואה', () => {
            marker.closePopup();
            this.fireWithTimeout({ latlng: p.latlng, num: -0.35, time: Date.now() }, Bike.removeAfter);
        }));

        return marker.bindPopup(popup);
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
        console.log('snapshot ', snapshot.val());

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
        this.features = positions.map(this.createMarker.bind(this));
    }

    showYouAreHere(latlng) {
        if (!this.youarehere) {
            var txt = "<center>אתם כאן<br>לחצו על המפה במקום עליו תרצו לדווח<br>או על דיווח קיים בשביל לראות פרטים</center>";
            var icon = L.BeautifyIcon.icon({
                icon: 'bicycle', iconShape: 'marker', // iconAnchor: [13, 25],
                borderColor: 'green', textColor: 'green', backgroundColor: 'yellow', borderWidth: 2
            });
            this.youarehere = L.marker(latlng, { icon: icon }).addTo(this.map).bindPopup(txt).openPopup();
        } else {
            this.youarehere.setLatLng(latlng);
        }
    }

    init() {
        // Initialize Firebase
        var config = { apiKey: "AIzaSyCVAm6jto4LrnfJD90IZozZN2gJps_ota8", authDomain: "bikewarn-223907.firebaseapp.com", databaseURL: "https://bikewarn-223907.firebaseio.com", projectId: "bikewarn-223907", storageBucket: "bikewarn-223907.appspot.com", messagingSenderId: "638058417911" };
        firebase.initializeApp(config);
        this.fire = firebase.database().ref();

        this.map = L.map('map', { attributionControl: true, zoomControl: false });
        var tileurl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(tileurl, { id: 'mapbox.light', attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' }).addTo(this.map);

        this.map.on('locationerror', () => {
            var latlng = new L.LatLng(32.07, 34.78);
            this.map.setView(latlng, 15);
            this.showYouAreHere(latlng);
        });
        this.map.on('locationfound', (e) => { this.showYouAreHere(e.latlng); })
        this.map.locate({ watch: true, setView: true, maxZoom: 25, timeout: 500 });

        this.features = [];

        this.map.on('click', this.clickMap, this);

        this.fire.on('value', this.fireValues, this);
    }

}

Bike.removeAfter = 1000 * 60 * 60 * 6; // 6 hours

window.onload = () => { new Bike().init(); };