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
from OUCanEat.forms import RegistrationForm, ProfileForm, NameForm, ChoiceForm

@ensure_csrf_cookie
@login_required
def home(request):
	context = {}
	user = request.user
	upcoming_events = Event.objects.filter(event_dt__gte=datetime.date.today()).order_by('event_dt')
	top_events = upcoming_events.annotate(num_participants=Count('event_join')).order_by('-num_participants')
	context['top_events'] = top_events
	context['upcoming_events'] = upcoming_events
	context['user'] = user
	return render(request, 'OUCanEat/home.html', context)

@login_required
def show_profile(request, post_user):
	context = {}
	profile = Profile.objects.get(user__username = post_user)
	temp_events = Event.objects.filter(host__username = post_user)

	your_events = temp_events.filter(event_dt__gte = datetime.date.today()).annotate(num_participants = Count('event_join'))
	old_events = temp_events.filter(event_dt__lte = datetime.date.today())
	
	
	my_prefer = profile.preference.all()

	context['profile'] = profile
	context['prefer'] = my_prefer
	context['curr_user'] = post_user
	context['your_events'] = your_events
	context['old_events'] = old_events
	return render(request, 'OUCanEat/profile.html', context)
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
	context['choice_form'] = ChoiceForm()

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
	return redirect(reverse('home'))

@login_required
def show_info(request):
	if request.method=='POST':
		#need to verify content
		restaurant_name = request.POST['event_restaurant']
		lng = request.POST['event_lng']
		lat = request.POST['event_lat']
		events = Event.objects.filter(restaurant__name=restaurant_name, restaurant__lng=lng, restaurant__lat=lat, 
					event_dt__gte=datetime.date.today()).order_by('event_dt')
		response_text = serializers.serialize('json', events)
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

		try:
			restaurant = Restaurant.objects.get(google_id=google_id)
		except:
			restaurant = Restaurant(name=restaurant_name, google_id=google_id, lng=lng, lat=lat)
			restaurant.save()
		dt = datetime.datetime.strptime(request.POST['event_date']+' '+request.POST['event_time'], '%Y/%m/%d %H:%M')
		event = Event(host = request.user, restaurant = restaurant, event_dt = dt, desc=request.POST['event_desc'])
		event.save()
		join = Join(event=event, participant=request.user)
		join.save()

		#should add himself

	return HttpResponse()

@login_required
def join_event(request):
	if request.method=='POST':
		user = request.user
		try:
			event = Event.objects.get(id=request.POST['event_id'])
			join = Join(event=event, participant=user)
			join.save()
		except Exception as e:
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
    	print(i)
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
