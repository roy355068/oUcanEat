var map;
var service;
var clicked_place;
var searchBox;
var markers = [];
var marker_ids = new Set();
var profile_stream = 'upcoming';

function initMap() {
	// var pyrmont = {lat: -33.867, lng: 151.195};
	var pittsburgh = {lat: 40.4446, lng: -79.9450};

	map = new google.maps.Map(document.getElementById('map'), {
		center: pittsburgh,
		zoom: 15
	});

	//nearby search
	service = new google.maps.places.PlacesService(map);
	/*
	service.nearbySearch({
		location: pittsburgh,
		radius: 20000,
		types: ['restaurant', 'cafe']
	}, callback);
	*/

	//search box only for homepage
	var input = document.getElementById('keyword');
	if (input!==null) searchBox = new google.maps.places.SearchBox(input);

	map.addListener('drag', function() {
		service.nearbySearch({
			location: map.getCenter(),
			radius: 500,
			types: ['restaurant', 'cafe']
		}, callback);
		if (input!==null) searchBox.setBounds(map.getBounds());
	});
}

function callback(results, status) {
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i], 'red', '');
		}
	}
}

function showMapResult() {
	clearMarkers();
	var places = searchBox.getPlaces();
	if (places=== undefined || places.length==0) {
		return;
	}

	var bounds = new google.maps.LatLngBounds();
	places.forEach(function(place) {
		if (!place.geometry) {
			console.log("Returned place contains no geometry");
			return;
		}
		createMarker(place, 'green', '');
		if (place.geometry.viewport) {
			bounds.union(place.geometry.viewport);
		} else {
			bounds.extend(place.geometry.location);
		}
	});
	map.fitBounds(bounds);
}


function change_stream(username) {
	if (profile_stream === 'upcoming') {
		profile_stream = 'past';
	} else {
		profile_stream = 'upcoming';
	}
	profileMap(username);

}

function profileMap(username) {
	$('#mapPanel').html("");
	var html = "";
	if (profile_stream === 'upcoming') {
		html += '<button class="btn btn-info btn-lg skyblue transparentBorder" onclick="change_stream(\''+username+'\')">Past Events</button>';
	}
	else {
		html += '<button class="btn btn-info btn-lg skyblue transparentBorder" onclick="change_stream(\''+username+'\')">Upcoming Events</button>';
	}
	$('#mapPanel').prepend(html);
	$.ajax({
		url: "/OUCanEat/profile-map/" + username + '/' + profile_stream,
		type: "GET",
		data: {},
		dataType: "json",
		success: function(response) {
			var restaurants = JSON.parse(response.restaurants);
			showMapEvents(restaurants, true, false, username);
		}
	})
}

function showMapEvents(event_restaurants, clear, fromSearch, username) {
	var color = fromSearch ? 'green': 'purple';
	var bounds = map.getBounds();
	if (bounds===undefined || clear) {
		bounds = new google.maps.LatLngBounds();
		clearMarkers();

	}

	var google_ids = new Set();

	$(event_restaurants).each(function() {
		if (google_ids.has(this.fields.google_id)) return;
		service.getDetails({placeId: this.fields.google_id}, function (result, status) {
			if (status==google.maps.places.PlacesServiceStatus.OK) {
				createMarker(result, color, username);
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

function createMarker(place, color, username) {
	if (marker_ids.has(place.place_id)) return;

	var placeLoc = place.geometry.location;
	var marker = new google.maps.Marker({
		map: map,
		position: place.geometry.location,
		icon: 'http://maps.google.com/mapfiles/ms/icons/'+color+'-dot.png' //red: general, purple: event, green: search
	});

	google.maps.event.addListener(marker, 'click', function() {
		clicked_place = place;
		show_restaurant_events(username, profile_stream);
	});

	markers.push(marker);
	marker_ids.add(place.place_id);
}

function clearMarkers() {
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];
	marker_ids = new Set();
}
