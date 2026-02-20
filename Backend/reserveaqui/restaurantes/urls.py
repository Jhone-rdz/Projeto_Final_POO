from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestauranteViewSet, RestauranteUsuarioViewSet

app_name = 'restaurantes'

# Criar o router e registrar os viewsets
router = DefaultRouter()
router.register(r'restaurantes', RestauranteViewSet, basename='restaurante')
router.register(r'restaurantes-usuarios', RestauranteUsuarioViewSet, basename='restaurante-usuario')

urlpatterns = [
    path('', include(router.urls)),
]
