from django import forms
from django.contrib.auth.models import User
from .models import *
from django.db.models.fields.files import FieldFile
MAX_UPLOAD_SIZE = 2500000


RESTAURANT_TYPE = (
	('japanese', 'Japanese'),
	('chinese', 'Chinese'),
	('mexican', 'Mexican'),
	('american', 'American'),
	('indian', 'Indian'),

) 

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
	preference = forms.MultipleChoiceField(
			        required=False,
			        widget=forms.CheckboxSelectMultiple,
			        choices=RESTAURANT_TYPE,
			    )

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
	
class NameForm(forms.ModelForm):
	class Meta:
		model = User
		fields = (
			'first_name',
			'last_name',
		)
		
class ChoiceForm(forms.Form):
	choice = forms.MultipleChoiceField(
			        required=False,
			        widget=forms.CheckboxSelectMultiple,
			        choices=RESTAURANT_TYPE,
			)
		
class ProfileForm(forms.ModelForm):
	picture = forms.FileField(required=False, widget=forms.FileInput)
	age = forms.IntegerField(min_value = 0)
	class Meta:
		model = Profile
		exclude = (
			'user',
			'content_type',
			'preference',
		)

	def clean_picture(self):
		picture = self.cleaned_data['picture']
		if not isinstance(picture, FieldFile):
			if not picture:
				raise forms.ValidationError("You must upload a picture")
			if not picture.content_type or not picture.content_type.startswith('image'):
				raise forms.ValidationError('File type is not image')
			if picture.size > MAX_UPLOAD_SIZE:
				raise forms.ValidationError('File too big (max size is {0} bytes)'.format(MAX_UPLOAD_SIZE))
		return picture

class EventPicForm(forms.ModelForm):
	picture = forms.FileField(required=True, widget=forms.FileInput)
	class Meta:
		model = EventPicture
		fields = ('picture',)

	def clean_picture(self):
		picture = self.cleaned_data['picture']
		if picture and hasattr(self.cleaned_data['picture'],'content_type'):
			if not picture.content_type or not picture.content_type.startswith('image'):
				raise forms.ValidationError('File type is not image')
			if picture.size > MAX_UPLOAD_SIZE:
				raise forms.ValidationError('File too big (max size is {0} bytes)'.format(MAX_UPLOAD_SIZE))
		return picture
