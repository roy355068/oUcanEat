from django import forms
from django.contrib.auth.models import User
from .models import *
from django.db.models.fields.files import FieldFile
MAX_UPLOAD_SIZE = 2500000

RESTAURANT_TYPE = (
	('Japanese', 'Japanese'),
	('Chinese', 'Chinese'),
	('Mexican', 'Mexican'),
	('American', 'American'),
	('Indian', 'Indian'),

) 

class RegistrationForm(forms.Form):
	first_name = forms.CharField(max_length = 30, widget=forms.TextInput(attrs={'class': 'form-control'}))
	last_name  = forms.CharField(max_length = 30, widget=forms.TextInput(attrs={'class': 'form-control'}))
	username   = forms.CharField(max_length = 30, widget=forms.TextInput(attrs={'class': 'form-control'}))
	email      = forms.CharField(max_length = 50, 
							     widget = forms.EmailInput(attrs={'class': 'form-control'}))
	phone_number = forms.RegexField(regex= r'^\+?1?\d{9,15}$', 
		error_message = ("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
		, widget=forms.TextInput(attrs={'class': 'form-control'}))
	password1  = forms.CharField(max_length = 150,
								 label = 'Password',
								 widget = forms.PasswordInput(attrs={'class': 'form-control'}))
	password2  = forms.CharField(max_length = 150,
								 label = 'Confirm password',
								 widget = forms.PasswordInput(attrs={'class': 'form-control'}))
	age 	   = forms.IntegerField(min_value = 0, 
								widget = forms.NumberInput(attrs={'class': 'form-control'}))
	bio		   = forms.CharField(max_length = 430,
							     widget = forms.Textarea(attrs={'class': 'form-control'}))
	preference = forms.MultipleChoiceField(
			        required=False,
			        widget=forms.SelectMultiple(attrs={'class': 'form-check-input'}),
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
		widgets = {
			'first_name' : forms.TextInput(attrs={'class': 'form-control'}),
			'last_name' : forms.TextInput(attrs={'class': 'form-control'}),
		}
		
class ChoiceForm(forms.Form):
	choice = forms.MultipleChoiceField(
			        required=False,
			        widget=forms.SelectMultiple(attrs={'class': 'form-check-input'}),
			        choices=RESTAURANT_TYPE,
			)
	def __init__(self, *args, **kwargs):
		super(ChoiceForm, self).__init__(*args, **kwargs)
		self.fields['choice'].label = "Tell us your preference!"
		
class ProfileForm(forms.ModelForm):
	picture = forms.FileField(required=False, widget=forms.FileInput(attrs={'class': 'inputFile'}))
	age = forms.IntegerField(min_value = 0, widget = forms.NumberInput(attrs={'class': 'form-control'}))
	class Meta:
		model = Profile
		exclude = (
			'user',
			'content_type',
			'preference',
		)
		widgets = {
			'bio' : forms.Textarea(attrs={'class': 'form-control'}),
			'phone_number' : forms.TextInput(attrs={'class': 'form-control'}),
		}
	def __init__(self, *args, **kwargs):
		super(ProfileForm, self).__init__(*args, **kwargs)
		self.fields['picture'].label = "Upload your picture here!"
	
	def clean_picture(self):
		picture = self.cleaned_data['picture']
		if not isinstance(picture, FieldFile):
			if picture:
				if not picture.content_type or not picture.content_type.startswith('image'):
					raise forms.ValidationError('File type is not image')
				if picture.size > MAX_UPLOAD_SIZE:
					raise forms.ValidationError('File too big (max size is {0} bytes)'.format(MAX_UPLOAD_SIZE))
		return picture

class EventPicForm(forms.ModelForm):
	picture = forms.FileField(required=True, widget=forms.FileInput(attrs={'class': 'inputFile'}))
	class Meta:
		model = EventPicture
		fields = ('picture',)

	def __init__(self, *args, **kwargs):
		super(EventPicForm, self).__init__(*args, **kwargs)
		self.fields['picture'].label = "Pick a picture!"

	def clean_picture(self):
		picture = self.cleaned_data['picture']
		if picture and hasattr(self.cleaned_data['picture'],'content_type'):
			if not picture.content_type or not picture.content_type.startswith('image'):
				raise forms.ValidationError('File type is not image')
			if picture.size > MAX_UPLOAD_SIZE:
				raise forms.ValidationError('File too big (max size is {0} bytes)'.format(MAX_UPLOAD_SIZE))
		return picture
