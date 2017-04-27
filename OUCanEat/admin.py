from django.contrib import admin

from .models import *

admin.site.register(Restaurant)
admin.site.register(Event)
admin.site.register(Join)
admin.site.register(Comment)
admin.site.register(Review)
admin.site.register(EventPicture)
admin.site.register(Profile)

# Register your models here.
