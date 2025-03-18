from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PolygonRecordViewSet

router = DefaultRouter()
router.register(r'polygons', PolygonRecordViewSet, basename='polygon')

urlpatterns = [
    path('', include(router.urls)),
]

