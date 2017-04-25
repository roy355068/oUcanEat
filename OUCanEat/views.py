from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from django.core import serializers
from django.db import transaction
from django.http import Http404
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.contrib import messages
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Count


import datetime
import json
from OUCanEat.models import *
from OUCanEat.forms import RegistrationForm, ProfileForm, NameForm, ChoiceForm, EventPicForm
from twilio.rest import Client

@ensure_csrf_cookie
@login_required
def home(request):

	return render(request, 'OUCanEat/home.html')

@login_required
def show_default(request):
	if request.method=='GET':
		upcoming_events = Event.objects.filter(event_dt__gte = datetime.date.today()).order_by('event_dt')
		upcoming_events_restaurant = [r.restaurant for r in upcoming_events]	
		upcoming_events_status= get_events_status(upcoming_events, request.user)

		top_events = upcoming_events.annotate(num_participants=Count('event_join')).order_by('-num_participants')		 
		top_events_restaurant = [t.restaurant for t in top_events]
		top_events_status= get_events_status(top_events, request.user)
		top_events_num_participants = [t.num_participants for t in top_events]

		response_text = serializers.serialize('json', upcoming_events)
		response_text2 = serializers.serialize('json', upcoming_events_restaurant)
		response_text3 = serializers.serialize('json', top_events)
		response_text4 = serializers.serialize('json',top_events_restaurant)
		data = { 'upcoming_events' : response_text, 'upcoming_events_restaurant': response_text2, 
				'top_events' :response_text3, 'top_events_restaurant': response_text4,
				'upcoming_events_status' : upcoming_events_status, 
				'top_events_status' : top_events_status, 'top_events_num_participants':top_events_num_participants}
		data = json.dumps(data)
		return HttpResponse(data, content_type='application/json')
	return HttpResponse()

@login_required
def show_profile(request, post_user):
	context = {}
	profile = Profile.objects.get(user__username = post_user)
	temp_events = Event.objects.filter(host__username = post_user)

	your_events = temp_events.filter(event_dt__gte = datetime.date.today()).annotate(num_participants = Count('event_join'))
	old_events = temp_events.filter(event_dt__lte = datetime.date.today())
	
	joined_temp = Join.objects.filter(participant__username = post_user)
	joined      = joined_temp.filter(event__event_dt__gte = datetime.date.today())

	my_prefer = profile.preference.all()

	context['joined'] = joined
	context['profile'] = profile
	context['prefer'] = my_prefer
	context['post_user'] = post_user
	context['curr_user'] = request.user.username
	context['your_events'] = your_events
	context['old_events'] = old_events
	return render(request, 'OUCanEat/profile.html', context)

@login_required
def profile_map(request, post_user, profile_stream):
	if request.method == 'GET':
		joined = Join.objects.filter(participant__username = post_user)
		if profile_stream == "upcoming":
			joined = joined.filter(event__event_dt__gte = datetime.date.today())
		elif profile_stream == "past":
			joined = joined.filter(event__event_dt__lte = datetime.date.today())
		restaurants = [e.event.restaurant for e in joined]
		restaurants = serializers.serialize('json', restaurants)
		response_text = json.dumps({'restaurants': restaurants})
		return HttpResponse(response_text, content_type="application/json")
	return HttpResponse()


@login_required
def get_picture(request, curr_user):
	profile = get_object_or_404(Profile, user__username = curr_user)

	if not profile.picture:
		raise Http404

	return HttpResponse(profile.picture, content_type=profile.content_type)

@login_required
@transaction.atomic
def edit_profile(request):
	user_profile = Profile.objects.get(user__username = request.user.username)
	name_form = NameForm(instance = request.user)
	profile_form = ProfileForm(instance = user_profile)
	context = {}
	
	pref_list = [p.choice for p in user_profile.preference.all()]

	context['choice_form'] = ChoiceForm(initial={'choice': pref_list})
	if request.method == "GET":
		context['name_form'] = name_form
		context['profile_form'] = profile_form
		context['user'] = request.user
		return render(request, "OUCanEat/edit.html", context)
	elif request.method == "POST":
		name_form = NameForm(request.POST, instance = request.user)
		profile_form = ProfileForm(request.POST, request.FILES, instance = user_profile)
		choice_form = ChoiceForm(request.POST)
		if choice_form.is_valid():
			choice = choice_form.cleaned_data['choice']
			
			if choice:
				user_profile.preference.all().delete()
				for i in choice:
					new_choice = Choice(choice = i)
					new_choice.save()
					user_profile.preference.add(new_choice)

		if profile_form.is_valid() and name_form.is_valid():
			if not request.FILES:
				name_form.save()
				profile_form.save()
			if profile_form.cleaned_data['picture'] and request.FILES:
				user_profile.content_type = profile_form.cleaned_data['picture'].content_type
				user_profile.save()
				name_form.save()
				profile_form.save()
		else:
			name_form.save()
			Profile.objects.filter(user__username = request.user.username).update(bio=request.POST['bio'], age=request.POST['age'])
            
	context['name_form'] = name_form
	context['profile_form'] = profile_form
	context['username'] = request.user.username
	context['user'] = request.user
	return redirect('show-profile/' + request.user.username)


@login_required
def show_history(request, post_user):
	context = {}
	joined= Join.objects.filter(participant__username = post_user)
	upcoming_joined= joined.filter(event__event_dt__gte = datetime.date.today())
	upcoming_events = [u.event for u in upcoming_joined]

	past_joined= joined.filter(event__event_dt__lte = datetime.date.today())
	past_events = [p.event for p in past_joined]

	context['upcoming_event'] = upcoming_events
	context['past_event'] = past_events

	return render(request, 'OUCanEat/history.html', context)


@login_required
def get_restaurant_events(request):
	if request.method=='GET':
		#need to verify content
		restaurant_google_id = request.GET.get('restaurant_id')
		profile_stream = request.GET.get('profile_stream')
		if profile_stream == "upcoming":
			events = Event.objects.filter(restaurant__google_id=restaurant_google_id, 
				event_dt__gte = datetime.date.today()).order_by('event_dt')
		elif profile_stream == "past":
			events = Event.objects.filter(restaurant__google_id=restaurant_google_id, 
				event_dt__lte = datetime.date.today()).order_by('event_dt')

		isPersonal = request.GET.get('isPersonal')
		if isPersonal.lower()=='true':
			join = Join.objects.filter(participant=request.user, event__in=events)
			events = [j.event for j in join]
		events_status= get_events_status(events, request.user)

		response_text1 = serializers.serialize('json', events)
		response_text = {'events': response_text1, 'events_status' : events_status}
		response_text = json.dumps(response_text)
		return HttpResponse(response_text, content_type='application/json')

@login_required
def create_event(request):
	response_text = ''
	if request.method=='POST':
		#need to verify content
		google_id = request.POST['google_id']
		restaurant_name = request.POST['event_restaurant']
		lng = request.POST['event_lng']
		lat = request.POST['event_lat']
		event_name = request.POST['event_name']
		try:
			dt = datetime.datetime.strptime(request.POST['event_date']+' '+request.POST['event_time'], '%Y-%m-%d %H:%M')
			if dt>=datetime.datetime.now():
				try:
					restaurant = Restaurant.objects.get(google_id=google_id)
				except:
					restaurant = Restaurant(name=restaurant_name, google_id=google_id, lng=lng, lat=lat)
					restaurant.save()
				event = Event(name= event_name, host = request.user, restaurant = restaurant, event_dt = dt, desc=request.POST['event_desc'])
				event.save()
				join = Join(event=event, participant=request.user)
				join.save()
				data = json.dumps({"event_id":event.id})
				return HttpResponse(data, content_type='application/json')
		except:
			pass
	return HttpResponse()

@login_required
def update_event(request):
	response_text = ''
	if request.method=='POST':
		event_id = request.POST['event_id']

		try:
			dt = datetime.datetime.strptime(request.POST['event_date']+' '+request.POST['event_time'], '%Y-%m-%d %H:%M')
			if dt>=datetime.datetime.now():
				Event.objects.filter(id=event_id).update(event_dt=dt, desc=request.POST['event_desc'])
		except Exception as e:
			pass
	return HttpResponse()

@login_required
def add_review(request):
	if request.method=='POST' and 'event_id' in request.POST and 'new_review' in request.POST and request.POST['new_review']:
		try:
			event = Event.objects.get(id=request.POST['event_id'])
			new_review = Review(user=request.user, event=event, rating=request.POST['new_review'])
			new_review.save()

			reviews = Review.objects.filter(event=event)
			sum_rating = 0
			count = reviews.count()
			avg_rating = 0

			for r in reviews:
				sum_rating = sum_rating + r.rating

			avg_rating = round(sum_rating/count, 1)
			data = json.dumps({"avg_rating":avg_rating})

		except Exception as error:
			pass		
	return HttpResponse(data, content_type='application/json')

@login_required
def show_event_page(request, event_id):
	context = {}
	try:
		event = Event.objects.get(id=event_id)
		now_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
		event_time = event.event_dt.strftime('%Y-%m-%d %H:%M:%S')

		# events_status = event.filter(event__event_dt__lte = datetime.date.today())
		event_join = Join.objects.filter(event__id=event_id)
		event_participants = [j.participant for j in event_join if j.participant!=event.host]
		comments = Comment.objects.filter(event__id=event_id)
		review = Review.objects.filter(event__id = event_id)
		count = review.count()

		event_status = 'toRate'
		sum_rating = 0
		avg_rating = 0
		if now_time > event_time:
			if(len(review)>0):
				for r in review:
					if r.user == request.user:
						event_status = 'rated'
					sum_rating = sum_rating + r.rating
				avg_rating = round(sum_rating / count,1)
			else:
				avg_rating = 'Be the first one to rate'
		else:
			event_status = 'cantRate'
			avg_rating = 'Not Available'


		pic_users = Profile.objects.exclude(picture__isnull=True).exclude(picture__exact='')
		pic_users = [u.user for u in pic_users]
		context['event'] = event
		context['event_participants'] = event_participants
		context['comments'] = comments
		context['pic_users'] = pic_users
		context['form'] = EventPicForm()
		context['rating'] = avg_rating
		context['event_status'] = event_status		

	except Exception as e:
		pass
	return render(request, 'OUCanEat/event_page.html', context)

@login_required
def join_event(request):
	if request.method=='POST':
		user = request.user
		try:
			event = Event.objects.get(id=request.POST['event_id'])
			if event.event_dt>=datetime.datetime.now():
				join = Join(event=event, participant=user)
				join.save()
		except Exception as e:
			pass
	return HttpResponse()

@login_required
def search_events(request):
	if request.method=='GET':
		events = Event.objects.filter(event_dt__gte=datetime.date.today()).order_by('event_dt')
		if 'search_places' in request.GET:
			search_places = json.loads(request.GET.get('search_places'))
			if len(search_places)>0: events = Event.objects.filter(restaurant__google_id__in=search_places)
		if 'search_date' in request.GET:
			search_date = request.GET.get('search_date')
			try:
				dt = datetime.datetime.strptime(search_date, '%Y-%m-%d')
				events = events.filter(event_dt__year=dt.year,
							event_dt__month=dt.month,
							event_dt__day=dt.day)
			except Exception as e:
				pass
		restaurants = [e.restaurant for e in events]
		
		response_text1 = serializers.serialize('json', events)
		response_text2 = serializers.serialize('json', restaurants)
		events_status= get_events_status(events, request.user)
		response_text = {'events': response_text1, 'restaurants': response_text2, 'events_status' : events_status}
		response_text = json.dumps(response_text)
		return HttpResponse(response_text, content_type='application/json')
	return HttpResponse()



@login_required
def leave_event(request):
	if request.method != 'POST' or "event_id" not in request.POST:
		raise Http404
	user = request.user
	unjoin = get_object_or_404(Join, event__id=request.POST['event_id'], participant=user)
	if unjoin.event.event_dt>=datetime.datetime.now():
		unjoin.delete()
	return HttpResponse()

@login_required
def edit_event(request, event_id):
	context = {}
	try:
		event = Event.objects.get(id=event_id, host=request.user) #check host is current user
		event_join = Join.objects.filter(event__id=event_id)
		event_participants = [j.participant for j in event_join if j.participant!=event.host]

		context['event'] = event
		context['event_participants'] = event_participants
	except Exception as e:
		pass
	return render(request, 'OUCanEat/edit_event.html', context)
	

@login_required
def add_comment(request):
	if request.method=='POST' and 'event_id' in request.POST and 'new_comment' in request.POST and request.POST['new_comment']:
		try:
			event = Event.objects.get(id=request.POST['event_id'])
			new_comment = Comment(user=request.user, event=event, content=request.POST['new_comment'])
			new_comment.save()
		except Exception as error:
			pass
	return HttpResponse()

@login_required
def get_updated_comments(request):
	if request.method=='GET' and 'event_id' in request.GET and 'latest' in request.GET:
		latest = request.GET['latest']
		event_id = request.GET['event_id']

		comments = Comment.objects.filter(id__gt=latest, event__id=event_id).order_by('create_dt')
		users = [c.user for c in comments]
		profiles = [Profile.objects.get(user=u) for u in users]

		response_text1 = serializers.serialize('json', comments)
		response_text2 = serializers.serialize('json', users)
		response_text3 = serializers.serialize('json', profiles)
		response_text = {'comments': response_text1, 'users': response_text2, 'profiles': response_text3}
		response_text = json.dumps(response_text)
		return HttpResponse(response_text, content_type='application/json')
	return HttpResponse()

@login_required
def upload_event_pic(request):
	if request.method=='POST':
		try:
			event = Event.objects.get(id=request.POST['event_id'])
			event_pic_form = EventPicForm(request.POST, request.FILES)
			if event_pic_form.is_valid():
				event_pic = event_pic_form.save(commit=False)
				event_pic.uploader = request.user
				event_pic.event = event
				event_pic.content_type = event_pic_form.cleaned_data['picture'].content_type
				event_pic.save()
		except Exception as error:
			pass
	return HttpResponse()

@login_required
def get_event_pictures(request):
	if request.method=='GET' and 'event_id' in request.GET and 'latestPicId' in request.GET:
		event_id = request.GET['event_id']
		latest = request.GET['latestPicId']

		pictures = EventPicture.objects.filter(id__gt=latest, event__id=event_id).order_by('create_dt')

		response_text = serializers.serialize('json', pictures)
		response_text = {'pictures': response_text}
		response_text = json.dumps(response_text)
		return HttpResponse(response_text, content_type='application/json')
	return HttpResponse()

@login_required
def get_event_picture(request, event_pic_id):
	event_pic = get_object_or_404(EventPicture, id=event_pic_id)
	if not event_pic.picture:
		raise Http404
	return HttpResponse(event_pic.picture, content_type=event_pic.content_type)

@login_required
def get_event_restaurant(request, event_id):
	if request.method=='GET':
		try:
			event = Event.objects.get(id=event_id)
			response_text = serializers.serialize('json', [event.restaurant])
			response_text = {'restaurant': response_text}
			response_text = json.dumps(response_text)
			return HttpResponse(response_text, content_type='application/json')
		except Exception as error:
			pass
	return HttpResponse()


@transaction.atomic
def register(request):
    context = {}

    # Just display the registration form if it is a GET request
    if request.method == 'GET':
        context['form'] = RegistrationForm()
        return render(request, 'OUCanEat/register.html', context)

    
    form = RegistrationForm(request.POST)
    context['form'] = form

    if not form.is_valid():
        return render(request, 'OUCanEat/register.html', context)

    # Creates the new user from the valid form data
    new_user = User.objects.create_user(username = form.cleaned_data['username'],
                                        password = form.cleaned_data['password1'],
                                        first_name = form.cleaned_data['first_name'],
                                        last_name = form.cleaned_data['last_name'],
                                        email = form.cleaned_data['email'])
    new_user.is_active = False
    new_user.save()

    token = default_token_generator.make_token(new_user)
    email_body = """
        Welcome to the WebApp Class Address Book.  Please click the link below to
        verify your email address and complete the registration of your account:
        http://%s%s
    """ % (request.get_host(),
            reverse('confirm', args = (new_user.username, token)))

    send_mail(subject = "Verify your email address",
              message = email_body, 
              from_email = "yko1@andrew.cmu.edu",
              recipient_list = [new_user.email])

    choice = form.cleaned_data['preference']

    new_user_profile = Profile(user = new_user,
                               age = form.cleaned_data['age'],
                               bio = form.cleaned_data['bio'],
                               )

    new_user_profile.save()
    for i in choice:
    	new_choice = Choice(choice = i)
    	new_choice.save()
    	new_user_profile.preference.add(new_choice)
    
    context['email'] = form.cleaned_data['email']
    return render(request, 'OUCanEat/need-confirmation.html', context)
    # Logs in the new user and redirects to his/her todo list
    # new_user = authenticate(username=form.cleaned_data['username'],
    #                         password=form.cleaned_data['password1'],)
    
    # login(request, new_user)
    # return redirect(reverse('home'))
def confirm_registration(request, username, token):
    user = get_object_or_404(User, username = username)

    if not default_token_generator.check_token(user, token):
        raise Http404
    user.is_active = True
    user.save()
    return render(request, 'OUCanEat/confirmed.html', {})

def get_events_status(events, user):
	events_status= []
	for e in events:
		try:
			j = Join.objects.get(event = e, participant = user)
			if e.host == user:
				events_status.append('host')
			else:
				events_status.append('joined')
		except:
			events_status.append('notJoined')
	return events_status


from twilio.rest import Client
import os, configparser

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config = configparser.ConfigParser()
config.read(os.path.join(BASE_DIR, 'config.ini'))

account_sid = config.get('Twilio', 'sid')
auth_token = config.get('Twilio', 'auth_token')
from_number = config.get('Twilio', 'from_number')


def send_notification(recipients):
	client = Client(account_sid, auth_token)
	content = ''
	for recipient in recipients:
		message = client.messages.create(to=recipient,	from_=from_number, body=content)
		print(message.sid)

