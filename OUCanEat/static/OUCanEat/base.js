var map;
var infowindow;

function initMap() {
	var pyrmont = {lat: -33.867, lng: 151.195};

	map = new google.maps.Map(document.getElementById('map'), {
		center: pyrmont,
		zoom: 15
	});

	infowindow = new google.maps.InfoWindow();

	var service = new google.maps.places.PlacesService(map);
	service.nearbySearch({
		location: pyrmont,
		radius: 500,
		types: ['restaurant', 'cafe']
	}, callback);
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
	
 //  	document.getElementById('topEvent').style.display='block';
	document.getElementById('topEvent').style.display='none';
	document.getElementById('upcomingEvent').style.display='none';
	//document.getElementById('topEvent_info').style.display='none';
	//document.getElementById('upcomingEvent_info').style.display='none';

	document.getElementById('info').innerHTML = place.name;
	document.getElementById('rating').innerHTML = "Rating: "+place.rating;
	document.getElementById('address').innerHTML = "Address: " +place.vicinity;
	if(place.opening_hours.open_now){
		var open = "open now"
	}else{
		var open = "closed now"
	}
	document.getElementById('open').innerHTML = open ;
	// document.getElementById('map_info').style.display='block';
	document.getElementById('create').style.display='block';
	document.getElementById('join').style.display='block';
    infowindow.setContent(place.name);
    // infowindow.setContent(place.opening_hours);
    infowindow.open(map, this);
  });
}

function createEvents() {
	document.getElementById('map_info').style.display='none';
	document.getElementById('join').style.display='none';
	document.getElementById('create').style.display='none';
	document.getElementById('event_form').style.display='block';
 	// document.getElementById('map_info').style.display='event_buttons';

}



