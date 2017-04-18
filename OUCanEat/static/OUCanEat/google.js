var map;
var service;
var infowindow;
var clicked_place;
var searchBox;
var markers = [];
var searched = false;

function initMap() {
	// var pyrmont = {lat: -33.867, lng: 151.195};
	var pittsburgh = {lat: 40.4446, lng: -79.9450};

	map = new google.maps.Map(document.getElementById('map'), {
		center: pittsburgh,
		zoom: 15
	});

	infowindow = new google.maps.InfoWindow();

	//nearby search
	service = new google.maps.places.PlacesService(map);
	service.nearbySearch({
		location: pittsburgh,
		radius: 20000,
		types: ['restaurant', 'cafe']
	}, callback);

	//search box
	var input = document.getElementById('keyword');
	searchBox = new google.maps.places.SearchBox(input);

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

}

function callback(results, status) {
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i], 'red');
		}
	}
}

function showMapResult() {
	clearMarkers();
	var places = searchBox.getPlaces();
	if (places=== undefined || places.length==0) {
		return;
	}

	searched = true;
	var bounds = new google.maps.LatLngBounds();
	places.forEach(function(place) {
		if (!place.geometry) {
			console.log("Returned place contains no geometry");
			return;
		}
		createMarker(place, 'red');
		if (place.geometry.viewport) {
			bounds.union(place.geometry.viewport);
		} else {
			bounds.extend(place.geometry.location);
		}
	});
	map.fitBounds(bounds);
}

function profileMap() {
	var userName = $("#userName").html();
	$.ajax({
		url: "/OUCanEat/profile-map/" + userName,
		type: "GET",
		data: {},
		dataType: "json",
		success: function(response) {
			restaurants = JSON.parse(response.restaurants);
			showMapEvents(restaurants, true);
		}
	})
}
function showMapEvents(event_restaurants, clear) {
	var bounds = map.getBounds();
	if (clear) {
		bounds = new google.maps.LatLngBounds();
		clearMarkers();
	}
	// console.log(bounds);
	searched = true;
	var google_ids = new Set();

	$(event_restaurants).each(function() {
		// console.log(this.fields.google_id);
		if (this.fields.google_id in google_ids) return;
		service.getDetails({placeId: this.fields.google_id}, function (result, status) {
			if (status==google.maps.places.PlacesServiceStatus.OK) {
				createMarker(result, 'purple');
				if (result.geometry.viewport) {
					bounds.union(result.geometry.viewport);
				} else {
					bounds.extend(result.geometry.location);
				}
				map.fitBounds(bounds);
				google_ids.add(result.place_id);

			}
		});
	});
}

function createMarker(place, color) {
	var placeLoc = place.geometry.location;
	var marker = new google.maps.Marker({
		map: map,
		position: place.geometry.location,
		icon: 'http://maps.google.com/mapfiles/ms/icons/'+color+'-dot.png'
	});

	google.maps.event.addListener(marker, 'click', function() {
		clicked_place = place;
		show_restaurant_info();

		infowindow.setContent(place.name);
		infowindow.open(map, this);
	});

	markers.push(marker);
}

function clearMarkers() {
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];
}
