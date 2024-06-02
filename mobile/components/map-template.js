import { TOMTOM_API_KEY } from '@env';
export default `
<div>
    <style>
            html, body {
                margin: 0;
            }

            #map {
                height: 100%;
                width: 100%;
            }

            .marker-icon {
                background-position: center;
                background-size: 22px 22px;
                border-radius: 50%;
                height: 22px;
                left: 4px;
                position: absolute;
                text-align: center;
                top: 3px;
                transform: rotate(45deg);
                width: 22px;
            }
            .marker {
                height: 50px;
                width: 50px;
            }
            .marker-content {
                background: #c30b82;
                border-radius: 50% 50% 50% 0;
                height: 50px;
                left: 50%;
                margin: -15px 0 0 -15px;
                position: absolute;
                top: 50%;
                transform: rotate(-45deg);
                width: 50px;
            }
            .marker-content::before {
                border-radius: 50%;
                content: "";
                height: 24px;
                margin: 3px 0 0 3px;
                position: absolute;
                width: 24px;
            }
        </style>
    </style>
    
    <div id='map' class='map'></div>

    <!-- load TomTom Maps Web SDK from CDN -->
    <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.13.0/maps/maps.css'/>
    <script src='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.13.0/maps/maps-web.min.js'></script>

    <script>
        function addMarker(lng, lat, id, color) {

            var markerElement = document.createElement('div');
            markerElement.className = 'marker';

            var markerContentElement = document.createElement('div');
            markerContentElement.className = 'marker-content';
            markerContentElement.style.backgroundColor = color;
            markerElement.appendChild(markerContentElement);
            // add marker to map
            let marker = new tt.Marker({element: markerElement})
                .setLngLat([lng, lat])
                .addTo(map);
 
            marker.getElement().addEventListener('click', function (e) {
                let msg = JSON.stringify({type: "marker_click", id: id});
                window.ReactNativeWebView.postMessage(msg);
            });
        }

        function setCenter(lng, lat) {
            map.setCenter([lng, lat])
        }

        // create the map
        tt.setProductInfo('TomTom Maps React Native Demo', '1.0');
        let map = tt.map({
            key: '${TOMTOM_API_KEY}',
            container: 'map',
            center: [8.93413, 44.40757],
            zoom: 16
        });
        
        map.on('dragend', function() {
            let center = map.getCenter();
            let msg = JSON.stringify({type: "drag_map", lon: center.lng.toFixed(3), lat: center.lat.toFixed(3)});
            window.ReactNativeWebView.postMessage(msg);
        });

        map.on('dragstart', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: "drag_start"}));
        });
    </script>
</div>
`;
