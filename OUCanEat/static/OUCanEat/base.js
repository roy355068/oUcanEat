function show_restaurant_info(events, events_status, profile_stream) {

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
	var address = clicked_place.vicinity;
	if (!("vicinity" in clicked_place)) address = clicked_place.formatted_address;

	html += "<dd style='font-size: 14pt'>Address: "+address+"</dd>";
	if ("rating" in clicked_place) {
		html += "<dd style='font-size: 14pt'>Rating: "+clicked_place.rating+"</dd></dl>";
	}

	html += "<div><table style='width:100%'>";
	
	$(events).each(function(index) {
		var event_dt = new Date(this.fields.event_dt);
		
		html += "<tr><td>"+event_dt.toLocaleString()+"</td>";
		if (profile_stream === 'upcoming') {
			if (events_status[index]=='host'){
				html+="<button type='button' class='btn btn-default btn-lg' onclick=\"window.location.href='/OUCanEat/edit_event/"+this.pk+"'\">Edit Event</button></td></tr>"
			}else if (events_status[index]=='joined'){
				html+="<button type='button' class='btn btn-default btn-lg' onclick='leave_event("+this.pk+", 0)'>Leave Event</button></td></tr>"
			}else{
				html+="<button type='button' class='btn btn-default btn-lg' onclick='join_event("+this.pk+", 0)'>Join Event</button></td></tr>"
			}
		}
	});
	

	html += "</table></div>"
	$("#info").append(html);
}

function show_restaurant_events(username, profile_stream) {
	var data = {'restaurant_id':clicked_place.place_id, 'username': username, 'csrfmiddlewaretoken': getCSRFToken(),
				'profile_stream': profile_stream};
    $.ajax({
        url: "/OUCanEat/get_restaurant_events",
        type: "GET",
        data: data,
        dataType : "json",
        success: function(response) {
			events = JSON.parse(response.events);
			events_status = response.events_status;
			show_restaurant_info(events, events_status, profile_stream);
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
				show_restaurant_events('', 'upcoming');
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
				show_restaurant_events('', 'upcoming');
			} else {
				show_default();
			}
        }
    });
}

function show_event_page(event_id){
	show_comments(event_id);
	show_event_pictures(event_id);
	$.ajax({
		url:"/OUCanEat/get_event_restaurant/"+event_id,
		type:"GET",
		success: function(response){
			var restaurants = JSON.parse(response.restaurant);
			showMapEvents(restaurants, true, false, '');
		}
	});
}

function create_event_form() {
	$("#info").html("");
	var html = "<div>"+
					"Event Date and Time<br>"+
					"<div id='datetimepicker' class='input-append date'>"+
					"<input type='name' id='event_name' placeholder= 'Name'><br><br>"+
      				"<input type='date' id='event_date' placeholder= 'Date' min= '1900-01-01' ><br><br>"+
      				"<input type='time' id='event_time' placeholder= 'time'><br><br>"+
					"Event Description:<br>"+
					"<input type='text' id='event_desc' placeholder= 'Description'><br><br>"+
					"<input type='submit' value='Create' onclick='create_event()'>"+
				"</div>"
				;   

	$("#info").prepend(html);
	getTomorrow();
}

function create_event() {
	var event_form_name = $("#event_name").val();
	var event_form_date = $("#event_date").val();
	var event_form_time = $("#event_time").val();
	var event_form_desc = $("#event_desc").val();
	var event_dt_utc = new Date(event_form_date+" "+event_form_time).toISOString().replace(/\..+/, '');
	var data = {'event_name': event_form_name, 'event_dt':event_dt_utc, 'event_desc':event_form_desc,
		'event_restaurant':clicked_place.name, 'google_id': clicked_place.place_id, 
		'event_lat':clicked_place.geometry.location.lat(), 'event_lng':clicked_place.geometry.location.lng(),
		'csrfmiddlewaretoken': getCSRFToken()}
    $.ajax({
        url: "/OUCanEat/create_event",
        type: "POST",
        data: data,
        success: function(response) {
			window.location="/OUCanEat/";
        }
    });
}

function update_event(event_id) {
	var event_date = $("#event_date").val();
	var event_time = $("#event_time").val();
	var event_desc = $("#event_desc").val();
	var event_dt_utc = new Date(event_date+" "+event_time).toISOString().replace(/\..+/, '');
	var data = {'event_id': event_id, 'event_dt':event_dt_utc, 'event_desc':event_desc,
		'csrfmiddlewaretoken': getCSRFToken()}
    $.ajax({
        url: "/OUCanEat/update_event",
        type: "POST",
        data: data,
        success: function(response) {
			window.location="/OUCanEat/";
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
			showMapEvents(upcoming_events_restaurant, true, false, '');
			showMapEvents(top_events_restaurant, false, false, '');
		}
	});
}

function show_upcoming_event(upcoming_events,upcoming_events_restaurant,upcoming_events_status,upcoming_events_length) {
	$("#upcoming_events").html("");
	var html = "<h2> Upcomping Events: </h2>";
    html+= "<table style='width:100%'>";
    if (upcoming_events){
		for (i = 0; i < Math.min(upcoming_events_length, upcoming_events.length); i++){
			var event_name = upcoming_events[i].fields.name;
    		var restaurant_name = upcoming_events_restaurant[i].fields.name;
    		var datetime = new Date(upcoming_events[i].fields.event_dt);
    		var event_id = upcoming_events[i].pk;
    		var status = upcoming_events_status[i];
    		html+= "<tr><td style='font-size: 16pt'><a href='/OUCanEat/show_event_page/"+event_id+"'>"+event_name+"</a></td><td>"+datetime.toLocaleString()+"</td><td style='text-align: right;'>";

    		if (status=='host'){
    			html+="<button type='button' class='btn btn-default btn-lg' onclick=\"window.location.href='/OUCanEat/edit_event/"+event_id+"'\">Edit Event</button></td></tr>"
    		}else if (status=='joined'){
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='leave_event("+event_id+", 1)'>Leave Event</button></td></tr>";
    		}else{
    			html+="<button type='button' class='btn btn-default btn-lg' onclick='join_event("+event_id+", 1)'>Join Event</button></td></tr>";
    		}
    	}   
	}
	html+= "</table>";
	$("#upcoming_events").prepend(html);
}

function show_top_event(top_events,top_events_restaurant,top_events_status,top_events_num_participants,top_events_length) {
	$("#top_events").html("");
	var html = "<h2> Top Events: </h2>"
    html+= "<table style='width:100%'>"		
    if (top_events){
    	for (i = 0; i < Math.min(top_events_length, top_events.length); i++){
    		var event_name = top_events[i].fields.name;
    		var restaurant_name = top_events_restaurant[i].fields.name;
    		var event_id = top_events[i].pk;
    		var num_participants = top_events_num_participants[i];
    		var status = top_events_status[i];
			html+= "<tr><td style='font-size: 16pt'><a href='/OUCanEat/show_event_page/"+event_id+"'>"+event_name + "</a></td><td>"+num_participants+"</td><td style='text-align: right;'>"
    		if (status=='host'){
    			html+="<button type='button' class='btn btn-default btn-lg' onclick=\"window.location.href='/OUCanEat/edit_event/"+event_id+"'\">Edit Event</button></td></tr>"
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





function show_comments(event_id) {
	var latestCommentId = 0;
	var url = window.location.pathname;
	$("[id^='comments_']").each(function() {
		idx = parseInt(this.id.split('_')[1]);
		if (idx>latestCommentId) latestCommentId = idx;
	});
	$.ajax({
		url: "/OUCanEat/get_updated_comments",
		type: "GET",
		data: {"event_id": event_id, "latest": latestCommentId},
		dataType: "json",
		success: function(response) {
			var comments = JSON.parse(response.comments);
			var users = JSON.parse(response.users);
			var profiles = JSON.parse(response.profiles);
			$(comments).each(function(index) {
				if (this.pk>latestCommentId) {
					event_id = this.fields.event;
					var dt = new Date(this.fields.create_dt).toLocaleString();

					var html = "<li class='list-group-item' id='comments_"+this.pk+"'>";
					if (profiles[index].fields.picture!="") {
						html += "<div class='col-md-2'>"+
									"<img src='/OUCanEat/picture/"+users[index].fields.username+"' width='30px'>"+
								"</div>"+
								"<div class='col-md-10'><h4 class='list-group-item-heading'>"+
								users[index].fields.username+
								"</h4></div>";
					} else {
						html += "<h4 class='list-group-item-heading'>"+
						users[index].fields.username+"</h4>";
					}

					html += "<p class='list-group-item-heading'>"+dt+"</p>"+
							this.fields.content+
						"</li>";
					$("#comments").append(html);
					latestCommentId = this.pk;
				}
			});
		}
    });
}

function add_comment(event_id) {
	var commentElement = $("#new_comment_"+event_id);
	var commentValue = commentElement.val();
	commentElement.val('');

	$.ajax({
		url: "/OUCanEat/add_comment",
		type: "POST",
		data: "new_comment="+commentValue+"&event_id="+event_id+"&csrfmiddlewaretoken="+getCSRFToken(),
		success: function(response) {
			show_comments(event_id);
		}
	});
}

function upload_event_pic(event_id) {
	var file = $("#id_picture")[0].files[0];
	$("#pic_btn").off().click(function(){
		var formData = new FormData($('#pic_form')[0]);
		$.ajax({
			url: "/OUCanEat/upload_event_pic",
			type: "POST",
			data: formData,
			processData: false,
			contentType: false,
			success : function(response) {
				show_event_pictures(event_id);
			}
		});
		$("#pic_form")[0].reset();
	});
}

function show_event_pictures(event_id) {
	var latestPicId = 0;
	$("[id^='pictures_']").each(function() {
		idx = parseInt(this.id.split('_')[1]);
		if (idx>latestPicId) latestPicId = idx;
	});

	$.ajax({
        url: "/OUCanEat/get_event_pictures",
        type: "GET",
		dataType: "json",
        data: {"event_id": event_id, "latestPicId": latestPicId},
        success: function(response) {
			pictures = JSON.parse(response.pictures);

			html = ""
			$(pictures).each(function(){
				if (this.pk>latestPicId) {
					html += "<td id='pictures_"+this.pk+"'><img src='/OUCanEat/event_picture/"+this.pk+"' width='100px'></td>";
					latestPicId = this.pk;
				}
			});

			$("#pictures").append(html);
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

function getTomorrow(){
	var tmr = new Date();
	var dd = tmr.getDate()+1;
	var mm = tmr.getMonth()+1;
	var yyyy = tmr.getFullYear();
	 if(dd<10){
	        dd='0'+dd
	    } 
	    if(mm<10){
	        mm='0'+mm
	    } 
	tmr = yyyy+'-'+mm+'-'+dd;
	document.getElementById("event_date").setAttribute("min", tmr);

}

function getToday(){
	var tmr = new Date();
	var dd = tmr.getDate();
	var mm = tmr.getMonth()+1;
	var yyyy = tmr.getFullYear();
	 if(dd<10){
	        dd='0'+dd
	    } 
	    if(mm<10){
	        mm='0'+mm
	    } 
	tmr = yyyy+'-'+mm+'-'+dd;
	document.getElementById("search_date").setAttribute("min", tmr);

}


function add_review(event_id) {
	var checked_rating = $( "input:checked" ).val();
	var html;
	$("#error").html("");
	if(!checked_rating){
		html = "<span>give a rating number</span>";
		$("#error").append(html);
		return;
	}

	$.ajax({
		url: "/OUCanEat/add_review",
		type: "POST",
		data: "new_review="+checked_rating+"&event_id="+event_id+"&csrfmiddlewaretoken="+getCSRFToken(),
		success: function(response) {
			rating = JSON.parse(response.avg_rating)
			$("#latest_rating").html("");
			$("#latest_rating").html(rating);
			$("#review").html("");
		}
	});
}

function sanitizer(keyword) {
	return keyword.replace(/&/g, '&amp;')
				  .replace(/</g, '&lt;')
				  .replace(/>/g, '&gt;')
				  .replace(/"/g, '&quot;');
}

//init
$(function () {
	$("#search_btn").click(function(){
    	var search_date = $("#search_date").val().trim();
    	var keyword = $("#keyword").val().trim();
		var place_ids = []
		
		search_date = sanitizer(search_date);
		keyword = sanitizer(keyword);

		if (search_date.length==0 && keyword.length==0) {
			return;
		}
		service.textSearch({
			query: keyword,
			types: ['restaurant', 'cafe']
		}, function(places, status) {
			clearMarkers();
			if (keyword.length>0 && status === google.maps.places.PlacesServiceStatus.OK) {
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
					showMapEvents(restaurants, place_ids.length==0, true, '');
					$("#info").html("");
					$("#top_events").html("");
				}
			});
		});
	});
});
