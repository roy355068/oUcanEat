from __future__ import unicode_literals
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
	user = models.ForeignKey(User, default=None)
	age = models.IntegerField()
	bio = models.TextField(max_length=500, blank=True)
	picture = models.FileField(upload_to="images", blank=True)
	content_type = models.CharField(max_length=50, blank=True)
	preference = models.TextField(max_length=500, blank=True)

class Event(models.Model):
	host = models.ForeignKey(User, default=None, related_name='host')
	restaurant = models.TextField(max_length=500)
	participator = models.ForeignKey(User, default=None, related_name='participator')
	event_dt = models.DateTimeField()
	create_dt = models.DateTimeField(auto_now=True)

class Comment(models.Model):
	user = models.ForeignKey(User, default=None)
	event = models.ForeignKey(Event, default=None)
	content = models.CharField(max_length=500)
	create_dt = models.DateTimeField(auto_now=True)

