
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
				html += "<button type='button' class='btn btn-default btn-lg' onclick='join_event("+this.pk+", 0)'>Join Event</button>";
			});
			html += "</div>"
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
			
			}
        }
    });
}

function create_event_form() {
	$("#info").html("");

	var html = "<div>"+
					"Event Date and Time<br>"+
					"<div id='datetimepicker' class='input-append date'>"+
      				"<input type='text' id='event_date' placeholder= 'Date'><br><br>"+
      				"<input type='text' id='event_tiime' placeholder= 'time'><br><br>"+
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
			show_restaurant_info();
        }
    });
}


function show_upcoming_event() {
	$("#info").html("");
	var html = "<h2> Upcomping Events: </h2>"


	$.ajax({
		url: "/OUCanEat/show_default",
		type: "GET",
		success: function(response){
			    var upcoming_events = JSON.parse(response.upcoming_events);
    			var upcoming_events_restaurant = JSON.parse(response.upcoming_events_restaurant);
    			var top_events = JSON.parse(response.top_events);
    			var upcoming_events_status = response.upcoming_events_status;
    			html+= "<table style='width:100%'>"		
    			var length
    			
    			if (upcoming_events.length>5){
    				length = 5
    			}else {
    				length = upcoming_events.length
    			}	

    			if (upcoming_events){

    				for (i = 0; i < length; i++){
    					var restaurant_name = upcoming_events_restaurant[i].fields.name
    					var event_id = upcoming_events[i].id
    					var status = upcoming_events_status[i]
    					html+= "<tr><td style='font-size: 16pt'>"+restaurant_name + "</td><td style='text-align: right;'>"
    					if (status=='host'){
    						html+="<button type='button' class='btn btn-default btn-lg' onclick='edit_event(event_id, 1)'>Edit Event</button></td></tr>"
    					}else if (status=='joined'){
    						html+="<button type='button' class='btn btn-default btn-lg' onclick='edit_event(event_id, 1)'>Leave Event</button></td></tr>"
    					}else{
    						html+="<button type='button' class='btn btn-default btn-lg' onclick='edit_event(event_id, 1)'>Join Event</button></td></tr>"
    					}
    				}
    			html+= "</table>"

				}
			$("#info").prepend(html);
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
