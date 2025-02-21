from rest_framework import serializers
from .models import Raters, ReviewAssignment, WritingTasks

class RatersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Raters
        fields = '__all__'

class WritingTasksSerializer(serializers.ModelSerializer):
    class Meta:
        model = WritingTasks
        fields = '__all__'

class ReviewAssignmentSerializer(serializers.ModelSerializer):
    itemId = serializers.CharField(source='writing_task.itemId', read_only=True)
    raterName = serializers.CharField(source='rater.name', read_only=True)
    class Meta:
        model = ReviewAssignment
        fields = ['itemId', 'testId', 'rater', 'raterName', 'day', 'rate1', 'rate2', 'rate3', 'rate4']