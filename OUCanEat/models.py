from __future__ import unicode_literals
from django.db import models
from django.contrib.auth.models import User

class Choice(models.Model):
	choice = models.CharField(max_length=500, blank=True)
	
class Profile(models.Model):
	user = models.ForeignKey(User, default=None)
	age = models.IntegerField()
	bio = models.TextField(max_length=500, blank=True)
	picture = models.FileField(upload_to="images", blank=True)
	content_type = models.CharField(max_length=50, blank=True)
	preference = models.ManyToManyField(Choice)

class Restaurant(models.Model):
	name = models.CharField(max_length=500, blank=True)
	google_id = models.CharField(max_length=500, blank=True)
	desc = models.CharField(max_length=500, blank=True)
	lat = models.FloatField()
	lng = models.FloatField()

class Event(models.Model):
	name = models.CharField(max_length=500, blank=True)
	host = models.ForeignKey(User, default=None)
	restaurant = models.ForeignKey(Restaurant, default=None)
	desc = models.CharField(max_length=500, blank=True)
	event_dt = models.DateTimeField()
	create_dt = models.DateTimeField(auto_now=True)

class Join(models.Model):
	event = models.ForeignKey(Event, default=None, related_name='event_join')
	participant = models.ForeignKey(User, default=None)
	class Meta:
		unique_together = ('event', 'participant')

class Comment(models.Model):
	user = models.ForeignKey(User, default=None)
	event = models.ForeignKey(Event, default=None)
	content = models.CharField(max_length=500)
	create_dt = models.DateTimeField(auto_now=True)

class Review(models.Model):
	user = models.ForeignKey(User, default=None)
	event = models.ForeignKey(Event, default=None)
	rating = models.FloatField(default=None)
	create_dt = models.DateTimeField(auto_now=True)

class EventPicture(models.Model):
	event = models.ForeignKey(Event, default=None)
	uploader = models.ForeignKey(User, default=None)
	create_dt = models.DateTimeField(auto_now=True)
	picture = models.FileField(upload_to="event_pics")
	content_type = models.CharField(max_length=50)
