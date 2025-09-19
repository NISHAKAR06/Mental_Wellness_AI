from django.db import models

class EmotionData(models.Model):
    happy = models.FloatField()
    neutral = models.FloatField()
    anxious = models.FloatField()
    stressed = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Emotions at {self.timestamp}"
