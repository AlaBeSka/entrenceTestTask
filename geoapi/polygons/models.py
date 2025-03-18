from django.contrib.gis.db import models

class PolygonRecord(models.Model):
    name = models.CharField(max_length=255)
    polygon = models.PolygonField()
    crosses_antimeridian = models.BooleanField(default=False)

    def __str__(self):
        return self.name
