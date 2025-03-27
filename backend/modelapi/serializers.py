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
    userId = serializers.CharField(source='writing_task.userId', read_only=True)
    raterName = serializers.CharField(source='rater.name', read_only=True)
    trait = serializers.CharField(source='writing_task.trait', read_only=True)
    response = serializers.CharField(source='writing_task.response', read_only=True)
    startedTime = serializers.CharField(source='writing_task.startedTime', read_only=True)
    class Meta:
        model = ReviewAssignment
        fields = ['id', 'userId', 'trait', 'startedTime', 'raterName',  'ta', 'gra', 'voc', 'coco', 'completed']