from django.urls import path
from .views import ValidatePolygonView

urlpatterns = [
    path('validate/', ValidatePolygonView.as_view(), name='validate_polygon'),
]
