from django import forms
from django.contrib.auth.models import User
from .models import *
from django.db.models.fields.files import FieldFile
MAX_UPLOAD_SIZE = 2500000

class RegistrationForm(forms.Form):
	first_name = forms.CharField(max_length = 30)
	last_name  = forms.CharField(max_length = 30)
	username   = forms.CharField(max_length = 30)
	email      = forms.CharField(max_length = 50, 
							     widget = forms.EmailInput())
	password1  = forms.CharField(max_length = 150,
								 label = 'Password',
								 widget = forms.PasswordInput())
	password2  = forms.CharField(max_length = 150,
								 label = 'Confirm password',
								 widget = forms.PasswordInput())
	age 	   = forms.IntegerField(min_value = 0)
	bio		   = forms.CharField(max_length = 430,
							     widget = forms.Textarea)

	def clean(self):

		cleaned_data = super(RegistrationForm, self).clean()
		password1 = cleaned_data.get('password1')
		password2 = cleaned_data.get('password2')
		if password1 and password2 and password1 != password2:
			raise forms.ValidationError("Passwords did not match.")
		return cleaned_data

	def clean_username(self):
		username = self.cleaned_data.get('username')
		if User.objects.filter(username__exact = username):
			raise forms.ValidationError("Username is already taken.")
		return username

	
