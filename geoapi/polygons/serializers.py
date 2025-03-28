import json
from django.contrib.gis.geos import GEOSGeometry
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import PolygonRecord

class PolygonRecordSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PolygonRecord
        geo_field = "polygon"
        fields = ('id', 'name', 'crosses_antimeridian')

    def update(self, instance, validated_data):
        if 'polygon' in validated_data:
            polygon_data = validated_data['polygon']
            if isinstance(polygon_data, dict):
                validated_data['polygon'] = GEOSGeometry(json.dumps(polygon_data))
        return super().update(instance, validated_data)
