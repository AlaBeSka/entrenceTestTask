import json
import requests
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.contrib.gis.geos import GEOSGeometry
from .models import PolygonRecord
from .serializers import PolygonRecordSerializer

def process_polygon(polygon_data):
    crosses = False
    coordinates = polygon_data.get('coordinates', [])
    new_coords = []
    for ring in coordinates:
        new_ring = []
        for coord in ring:
            lng, lat = coord
            if lng > 180:
                lng = lng - 360
                crosses = True
            new_ring.append([lng, lat])
        new_coords.append(new_ring)
    polygon_data['coordinates'] = new_coords
    return polygon_data, crosses

class PolygonRecordViewSet(viewsets.ModelViewSet):
    queryset = PolygonRecord.objects.all()
    serializer_class = PolygonRecordSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        processed_polygon, crosses_antimeridian = process_polygon(data.get('polygon'))
        data['polygon'] = json.dumps(processed_polygon)
        data['crosses_antimeridian'] = crosses_antimeridian

        validator_url = 'http://localhost:8000/validator/validate/'
        try:
            validator_response = requests.post(validator_url, json={
                'name': data.get('name'),
                'polygon': processed_polygon
            })
        except Exception as e:
            return Response({'error': 'Ошибка связи с валидатором: ' + str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if validator_response.status_code == 200:
            result = validator_response.json()
            if not result.get('is_valid'):
                return Response({
                    'error': 'Полигон пересекается с существующими',
                    'details': result.get('intersections')
                }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
