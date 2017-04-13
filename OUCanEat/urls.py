"""webapps URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
	url(r'^$', views.home, name='home'),
	url(r'^login$', auth_views.login, {'template_name':'OUCanEat/login.html'}, name='login'),
    url(r'^logout$', auth_views.logout_then_login, name="logout"),
    url(r'^register$', views.register, name="register"),
    url(r'^confirm-registration/(?P<username>[a-zA-Z0-9_@\+\-]+)/(?P<token>[a-z0-9\-]+)$',
        views.confirm_registration, name='confirm'),
    url(r'^create_event$', views.create_event),
    url(r'^join_event$', views.join_event),
    url(r'^leave_event$', views.leave_event),
    url(r'^show_info$', views.show_info),
    url(r'^show_default$', views.show_default),
    url(r'^show_event_page$', views.show_event_page,name="show_event_page"),
    url(r'^show-profile/(?P<post_user>\w+)$', views.show_profile, name="show-profile"),
]
