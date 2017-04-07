var map;
var infowindow;
var clicked_place;
var markers = [];
var searched = false;

function initMap() {
	var pyrmont = {lat: -33.867, lng: 151.195};

	//map
	map = new google.maps.Map(document.getElementById('map'), {
		center: pyrmont,
		zoom: 15
	});

	infowindow = new google.maps.InfoWindow();

	//nearby search
	var service = new google.maps.places.PlacesService(map);
	service.nearbySearch({
		location: pyrmont,
		radius: 500,
		types: ['restaurant', 'cafe']
	}, callback);

	//search box
	var input = document.getElementById('keyword');
	var searchBox = new google.maps.places.SearchBox(input);

	map.addListener('bounds_changed', function() {
		if (!searched) {
			service.nearbySearch({
				location: map.getCenter(),
				radius: 500,
				types: ['restaurant', 'cafe']
			}, callback);
		}
		searchBox.setBounds(map.getBounds());
	});

	searchBox.addListener('places_changed', function() {
		searched = true;
		var places = searchBox.getPlaces();
		if (places.length==0) {
			return;
		}
		markers.forEach(function(marker) {
			marker.setMap(null);
		});
		markers = [];

		var bounds = new google.maps.LatLngBounds();
		places.forEach(function(place) {
			if (!place.geometry) {
				console.log("Returned place contains no geometry");
				return;
			}
			createMarker(place);
            if (place.geometry.viewport) {
				bounds.union(place.geometry.viewport);
			} else {
				bounds.extend(place.geometry.location);
			}
		});
		map.fitBounds(bounds);
	});
}

function callback(results, status) {
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i]);
		}
	}
}

function createMarker(place) {
	var placeLoc = place.geometry.location;
	var marker = new google.maps.Marker({
		map: map,
		position: place.geometry.location
	});

	google.maps.event.addListener(marker, 'click', function() {
		clicked_place = place;
		show_restaurant_info();

		infowindow.setContent(place.name);
		infowindow.open(map, this);
	});

	markers.push(marker);
}
