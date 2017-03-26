from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

class Post(models.Model):
	content    = models.TextField(max_length = 160)
	user 	   = models.ForeignKey(User, default = None)
	created_at = models.DateTimeField(auto_now_add = True)

	def __unicode__(self):
		return "id: " + self.id + " " + self.user + "create at " + self.created_at
		
class Profile(models.Model):
	user 		 = models.ForeignKey(User, default = None)
	age 		 = models.IntegerField()
	bio 		 = models.TextField(max_length = 430, blank = True)
	picture 	 = models.FileField(upload_to = "images", blank = True)
	content_type = models.CharField(max_length = 50, blank = True)

class Follow(models.Model):
	following = models.ForeignKey(User, default = None, related_name = "following") 
	follower  = models.ForeignKey(User, default = None, related_name = "follower")

class Comment(models.Model):
	user = models.ForeignKey(User, default = None)
	content = models.TextField(max_length = 160)
	created_at = models.DateTimeField(auto_now_add = True)
	commented_on = models.ForeignKey(Post, default = None)