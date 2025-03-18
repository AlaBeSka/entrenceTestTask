from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('polygons.urls')),     # API для полигонов
    path('validator/', include('validator.urls')),  # Эндпоинт валидатора
]

