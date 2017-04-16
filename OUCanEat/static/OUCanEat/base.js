
function show_restaurant_info() {
	$("#info").html("");
	$("#upcoming_events").html("");
	$("#top_events").html("");
	var html = "<dl><dt style='font-size: 20pt'>"+clicked_place.name+"</dt><button type='button' class='btn btn-default btn-lg' onclick='create_event_form()'>Create Event</button>";
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

	var data = {'restaurant_id':clicked_place.place_id, 'csrfmiddlewaretoken': getCSRFToken()}
    $.ajax({
        url: "/OUCanEat/show_restaurant_info",
        type: "GET",
        data: data,
        dataType : "json",
        success: function(response) {
			html += "<div><table style='width:100%'>";
			events = JSON.parse(response.events);
			events_status = response.events_status;
			$(events).each(function(index) {
				html += "<tr><td>"+this.fields.event_dt+"</td>";
				if (events_status[index]=='host'){
					html+="<button type='button' class='btn btn-default btn-lg' onclick='edit_event("+this.pk+", 0)'>Edit Event</button></td></tr>"
				}else if (events_status[index]=='joined'){
					html+="<button type='button' class='btn btn-default btn-lg' onclick='leave_event("+this.pk+", 0)'>Leave Event</button></td></tr>"
				}else{
					html+="<button type='button' class='btn btn-default btn-lg' onclick='join_event("+this.pk+", 0)'>Join Event</button></td></tr>"
				}
			});
			html += "</table></div>"
			$("#info").prepend(html);
        }
    });
}

function join_event(event_id, page_type) {
	var data = {'event_id': event_id, 'csrfmiddlewaretoken': getCSRFToken()};
	$.ajax({
		url: "/OUCanEat/join_event",
		type: "POST",
		data: data,
		success: function(response) {
			if (page_type==0) {
				show_restaurant_info();
			} else {
				show_default();
			}
        }
    });
}


function leave_event(event_id, page_type) {
	var data = {'event_id': event_id, 'csrfmiddlewaretoken': getCSRFToken()};
	$.ajax({
		url: "/OUCanEat/leave_event",
		type: "POST",
		data: data,
		success: function(response) {
			if (page_type==0) {
				show_restaurant_info();
			} else {
				show_default();
			}
        }
    });
}


function show_event_page(event_id){
	$("#info").html("");
	$("#upcoming_events").html("");
	$("#top_events").html("");
	var html =""	
	var data = {'event_id':event_id, 'csrfmiddlewaretoken': getCSRFToken()}
	$.ajax({
		url:"/OUCanEat/show_event_page",
		type:"POST",
		data:data,
		success: function(response){
			var events = JSON.parse(response.event);
			var hosts = JSON.parse(response.event_host);
			var restaurants = JSON.parse(response.event_restaurant);
			var joins = JSON.parse(response.event_join);
			var participants = JSON.parse(response.event_participant);
			restaurant_name = restaurants[0].fields.name
			event_dt = events[0].fields.event_dt
			event_desc = events[0].fields.desc
			event_host = hosts[0].fields.first_name
			var event_participants = []
			
			for(i = 0; i< participants.length; i++){
				if (participants[i].fields.first_name != event_host){
					event_participants.push(participants[i].fields.first_name)	
				}			
			}
			html+= "<h3>"+restaurant_name+"</h3><table style='width:100%''><tr><td>Time: </td><td>"+event_dt+"</td></tr>"+
			"<tr><td>Description: </td><td>"+event_desc+"</td></tr><tr><td>Host: </td><td>"+event_host+"</td></tr><tr><td>Participants: </td></tr>"
			for(i = 0; i<event_participants.length; i++){
				html+="<tr><td></td><td>"+event_participants[i]+"</td></tr>"
			} 
			$("#info").prepend(html);

			showMapEvents(restaurants, true, false);
		}

	});
}

function create_event_form() {
	$("#info").html("");
	var html = "<div>"+
					"Event Date and Time<br>"+
					"<div id='datetimepicker' class='input-append date'>"+
      				"<input type='date' id='event_date' placeholder= 'Date'><br><br>"+
      				"<input type='time' id='event_time' placeholder= 'time'><br><br>"+
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
		'event_restaurant':clicked_place.name, 'google_id': clicked_place.place_id, 
		'event_lat':clicked_place.geometry.location.lat(), 'event_lng':clicked_place.geometry.location.lng(),
		'csrfmiddlewaretoken': getCSRFToken()}
    $.ajax({
        url: "/OUCanEat/create_event",
        type: "POST",
        data: data,
        success: function(response) {
        	event_id = JSON.parse(response.event_id)

			show_event_page(event_id);
        }
    });
}

function show_default(){
	$.ajax({
		url: "/OUCanEat/show_default",
		typy: "GET",
		success: function(response){
			var upcoming_events = JSON.parse(response.upcoming_events);
    		var upcoming_events_restaurant = JSON.parse(response.upcoming_events_restaurant);
    		var upcoming_events_status = response.upcoming_events_status;
    		var top_events = JSON.parse(response.top_events);
   			var top_events_restaurant = JSON.parse(response.top_events_restaurant);
   			var top_events_status = response.top_events_status;
   			var top_events_num_participants = response.top_events_num_participants;
   			show_upcoming_event(upcoming_events,upcoming_events_restaurant,upcoming_events_status,5);
			show_top_event(top_events,top_events_restaurant,top_events_status,top_events_num_participants,5);
			showMapEvents(upcoming_events_restaurant, true, false);
			showMapEvents(top_events_restaurant, false, false);
		}
	});
}


function show_upcoming_event(upcoming_events,upcoming_events_restaurant,upcoming_events_status,upcoming_events_length) {
	$("#upcoming_events").html("");
	var html = "<h2> Upcomping Events: </h2>"
    html+= "<table style='width:100%'>"		
    if (upcoming_events){
		for (i = 0; i < Math.min(upcoming_events_length, upcoming_events.length); i++){
    		var restaurant_name = upcoming_events_restaurant[i].fields.name
    		var datetime = upcoming_events[i].fields.event_dt
    		var event_id = upcoming_events[i].pk
    		var status = upcoming_events_status[i]
    		html+= "<tr><td style='font-size: 16pt' onclick='show_event_page("+event_id+")'>"+restaurant_name + "</td><td>"+datetime+"</td><td style='text-align: right;'>"
    		if (status=='host'){
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='edit_event("+event_id+", 1)'>Edit Event</button></td></tr>"
    		}else if (status=='joined'){
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='leave_event("+event_id+", 1)'>Leave Event</button></td></tr>"
    		}else{
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='join_event("+event_id+", 1)'>Join Event</button></td></tr>"
    		}
    	}   
	}
	html+= "</table>"
	$("#upcoming_events").prepend(html);
}


function show_top_event(top_events,top_events_restaurant,top_events_status,top_events_num_participants,top_events_length) {
	$("#top_events").html("");
	var html = "<h2> Top Events: </h2>"
    html+= "<table style='width:100%'>"		
    if (top_events){
    	for (i = 0; i < Math.min(top_events_length, top_events.length); i++){
    		var restaurant_name = top_events_restaurant[i].fields.name
    		var event_id = top_events[i].pk
    		var num_participants = top_events_num_participants[i]
    		var status = top_events_status[i]
    		html+= "<tr><td style='font-size: 16pt' onclick='show_event_page("+event_id+")'>"+restaurant_name + "</td><td>"+num_participants+"</td><td style='text-align: right;'>"
    		if (status=='host'){
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='edit_event("+event_id+", 1)'>Edit Event</button></td></tr>"
    		}else if (status=='joined'){
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='leave_event("+event_id+", 1)'>Leave Event</button></td></tr>"
    		}else{
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='join_event("+event_id+", 1)'>Join Event</button></td></tr>"
    		}
    	}   
	}
	html+= "</table>"
	$("#top_events").prepend(html);
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

//init
$(function () {
	$("#search_btn").click(function(){
    	var search_date = $("#search_date").val();
    	var keyword = $("#keyword").val();
		var place_ids = []

		if (search_date.trim().length==0 && keyword.trim().length==0) {
			return;
		}
		service.textSearch({
			query: keyword,
			types: ['restaurant', 'cafe']
		}, function(places, status) {
			clearMarkers();
			if (status === google.maps.places.PlacesServiceStatus.OK) {
				$(places).each(function() {
					place_ids.push(this.place_id);
				});
				searchBox.set('places', places || [])
				showMapResult();
			}

			$.ajax({
				url: "/OUCanEat/search_events",
				type: "GET",
				data: {'search_date': search_date, 'search_places': JSON.stringify(place_ids)},
				dataType: "json",
				success: function(response) {
					events = JSON.parse(response.events);
					restaurants = JSON.parse(response.restaurants);
					events_status = response.events_status;
					show_upcoming_event(events, restaurants, events_status, 5);
					showMapEvents(restaurants, place_ids.length==0, true);
					$("#info").html("");
					$("#top_events").html("");
				}
			});
		});
	});
});
