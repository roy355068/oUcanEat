var map;
var infowindow;
var clicked_place;


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
	clicked_place = place;
	show_restaurant_info();

    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}

function show_restaurant_info() {
	$("#info").html("");
	var html = "<dl><dt style='font-size: 20pt'>"+clicked_place.name+"</dt>";
	if ("opening_hours" in clicked_place) {
		if(clicked_place.opening_hours.open_now){
			var open = "open now";
		} else {
			var open = "closed now";
		}
		html += "<dd style='font-size: 18pt'>"+open+"</dd>";
	}
	html += "<dd style='font-size: 14pt'>Address: "+clicked_place.vicinity+"</dd>";
	if ("rating" in clicked_place) {
		html += "<dd style='font-size: 14pt'>Rating: "+clicked_place.rating+"</dd></dl>";
	}

	var data = {'event_restaurant':clicked_place.name, 'event_lat':clicked_place.geometry.location.lat(),
		'event_lng':clicked_place.geometry.location.lng(), 'csrfmiddlewaretoken': getCSRFToken()}
    $.ajax({
        url: "/OUCanEat/show_info",
        type: "POST",
        data: data,
        dataType : "json",
        success: function(response) {
			html += "<div class='btn-group' style='padding-left: 65pt;'>"+
					"<button type='button' class='btn btn-default btn-lg' onclick='create_event_form()'>Create Event</button>";
			$(response).each(function() {
				html += this.fields.event_dt;
				html += "<button type='button' class='btn btn-default btn-lg' >Join Event</button>";
			});
			html += "</div>"
			$("#info").prepend(html);
        }
    });
}

function create_event_form() {
	$("#info").html("");
	var html = "<div>"+
					"Event Date:<br>"+
					"<input type='text' id='event_date' placeholder= 'date'><br>"+
					"Event Time:<br>"+
					"<input type='text' id='event_time' placeholder= 'time'><br>"+
					"Event Description:<br>"+
					"<input type='text' id='event_desc' placeholder= 'Description'><br><br>"+
					"<input type='submit' value='Create' onclick='create_event()'>"+
				"</div>";
	$("#info").prepend(html);
}

function create_event() {
	var event_form_date = $("#event_date").val();
	var event_form_time = $("#event_time").val();
	var event_form_desc = $("#event_desc").val();
	var data = {'event_date':event_form_date, 'event_time':event_form_time, 'event_desc':event_form_desc,
		'event_restaurant':clicked_place.name, 'event_lat':clicked_place.geometry.location.lat(),
		'event_lng':clicked_place.geometry.location.lng(), 'csrfmiddlewaretoken': getCSRFToken()}
    $.ajax({
        url: "/OUCanEat/create_event",
        type: "POST",
        data: data,
        success: function(response) {
			show_restaurant_info();
        }
    });

}

function getCSRFToken() {
	var cookies = document.cookie.split(";");
	for (var i = 0; i < cookies.length; i++) {
		if (cookies[i].startsWith("csrftoken=")) {
			return cookies[i].substring("csrftoken=".length, cookies[i].length);
		}
	}
	return "unknown";
}
