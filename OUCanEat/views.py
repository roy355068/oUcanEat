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
from OUCanEat.forms import RegistrationForm

@ensure_csrf_cookie
@login_required
def home(request):
	context = {}
	upcoming_events = Event.objects.filter(event_dt__gte=datetime.date.today()).order_by('-event_dt')
	top_events = upcoming_events.annotate(num_participators=Count('event_join')).order_by('-num_participators')
	context['top_events'] = top_events
	context['upcoming_events'] = upcoming_events
	return render(request, 'OUCanEat/home.html', context)

@login_required
def create_event(request):
	response_text = ''
	if request.method=='POST':
		user = request.user
		event_form = EventForm(request.POST, instance=user)
		if event_form.is_valid():
			event_form.save()
			events = Event.objects.filter(event_dt__gte=datetime.date.today()).order_by('-event_dt')
			response_text = serializers.serialize('json', events)
	return HttpResponse(response_text, content_type='application/json')

@login_required
def join_event(request, event_id):
	if request.method=='POST':
		user = request.user
		try:
			event = Event.objects.get(id=event_id)
			join = Join(event, user)
			join.save()
		except:
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



    new_user_profile = Profile(user = new_user,
                               age = form.cleaned_data['age'],
                               bio = form.cleaned_data['bio'])
    new_user_profile.save()

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
