import json
from django.http import JsonResponse
from django.views import View
from django.contrib.gis.geos import GEOSGeometry
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from polygons.models import PolygonRecord

@method_decorator(csrf_exempt, name='dispatch')
class ValidatePolygonView(View):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            polygon_data = data.get('polygon')
            new_polygon = GEOSGeometry(json.dumps(polygon_data))
            new_polygon.srid = 4326
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

        if not new_polygon.valid:
            return JsonResponse({
                'is_valid': False,
                'error': 'Самопересечение контура'
            }, status=400)

        intersections = []
        current_id = data.get('id')
        for existing in PolygonRecord.objects.all():
            if current_id and existing.id == current_id:
                continue
            try:
                if new_polygon.intersects(existing.polygon):
                    inter_geom = new_polygon.intersection(existing.polygon)
                    if inter_geom.area > 0:
                        intersections.append({
                            'name': existing.name,
                            'intersection': json.loads(inter_geom.geojson)
                        })
            except Exception as ex:
                continue

        if intersections:
            return JsonResponse({'is_valid': False, 'intersections': intersections})
        else:
            return JsonResponse({'is_valid': True})
