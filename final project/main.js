d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson").then((geojson) => {
    d3.dsv(",", "Global_Music_Streaming_Listener_Preferences.csv", d => {
        return {
            country: d.Country,
            platform: d["Streaming Platform"],
            genre: d["Top Genre"]
        };
    }).then((data) => {
        console.log("loaded csv", data);
        console.log("loaded json", geojson);

        // join the data by country
        let datajoin = {};
        data.forEach(d => {
            if (!datajoin[d.country]) {
                datajoin[d.country] = {
                    platforms: {},
                    genres: {}
                };
            }
            datajoin[d.country].platforms[d.platform] = (datajoin[d.country].platforms[d.platform] || 0) + 1;
            datajoin[d.country].genres[d.genre] = (datajoin[d.country].genres[d.genre] || 0) + 1;
        });
        console.log(datajoin);

        // calculate top platform
        Object.keys(datajoin).forEach(country => {
            const platforms = datajoin[country].platforms;
            datajoin[country].topPlatform = Object.keys(platforms).reduce((a, b) =>
                platforms[a] > platforms[b] ? a : b
            );
            //top 3 genres
            const genres = datajoin[country].genres;
            datajoin[country].top3Genres = Object.entries(genres)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([genre]) => genre);
        });

        function getColor(d) {
            if(d=="Spotify") {
                return "#19e84d";
            } else if (d=="YouTube") {
                return '#e8191c';
            } else if (d=="Amazon Music") {
                return '#3519e8';
            } else if (d=="Apple Music") {
                return '#f77bea';
            } else if (d=="Deezer") {
                return '#8112d1';
            } else if (d=="Tidal") {
                return '#d9e812';
            } else {
                return '#555';
            }
        }

        geojson.features.forEach(feature => {
            const countryname = feature.properties.ADMIN;
            feature.properties.value = datajoin[countryname] || null;
        });




        const platforms = [...new Set(Object.values(datajoin).map(d => d.topPlatform))];
        const platformValues = platforms.map((p, i) => i);
        const minValue = Math.min(...platformValues);
        const maxValue = Math.max(...platformValues);
        const midValue = minValue + (maxValue - minValue) / 2;

        var colorScale = d3.scaleDiverging([minValue, midValue, maxValue], d3.interpolatePiYG);



        // Map platforms to numeric values
        const platformToValue = {};
        platforms.forEach((p, i) => platformToValue[p] = i);

        // Initialize Leaflet map
        let map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);



        // Style function for countries
        function style(feature) {
            //const data = feature.properties.data;
            //const value = data ? platformToValue[data.topPlatform] : null;
            //console.log(data);
            return {
                fillColor: getColor(feature),
                weight: 1,
                opacity: 0.8,
                color: "white",
                fillOpacity: 0.8,
            };
        }



        L.geoJSON(data, {
            style: function (feature) {
                return {color: feature.properties.color};
            }
        })




        // Create info control box
        var info = L.control();
        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };
        info.update = function (props) {
            //const data = props ? props.data : null;
            this._div.innerHTML = '<h2>Music Streaming by Country</h2>' + (props ?
                '<span>' + props.name + '</span><br />'
                : 'Hover over a country');
        };
        info.addTo(map);






        function highlightFeature(e) {
            var layer = e.target;
            //console.log(e.target.feature.properties.name);
            //console.log(datajoin["Japan"])
            layer.setStyle({
                weight: 5,
                color: '#7496fa',
                fillOpacity: 0.7
            });
            layer.bringToFront();
            info.update(layer.feature.properties);
        }

        function resetHighlight(e) {
            geojsonLayer.resetStyle(e.target);
            info.update();
        }

        function zoomToFeature(e) {
            map.fitBounds(e.target.getBounds());
        }

        //function

        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }

        let geojsonLayer = L.geoJSON(geojson, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);


        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                platform_names=["Spotify", "YouTube", "Amazon Music", "Apple Music", "Deezer", "Tidal","Other"];

            div.innerHTML = '<h4>Top Platforms</h4>';



            for (var i = 0; i < platform_names.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(platform_names[i]) + '"></i> ' + platform_names[i] + '<br>'
            }



            return div;
        };
        legend.addTo(map);


        //console.log("United States of America");








    });
});