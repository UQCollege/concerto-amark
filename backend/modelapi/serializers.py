from rest_framework import serializers
from .models import Rater, AssessmentTask, WritingTask

class RaterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rater
        fields = '__all__'

class WritingTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = WritingTask
        fields = '__all__'

class AssessmentTaskSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='writing_task.student_name', read_only=True)
    rater_name = serializers.CharField(source='rater.username', read_only=True)
    rater_digital_id = serializers.CharField(source='rater.rater_digital_id', read_only=True)
    trait = serializers.CharField(source='writing_task.trait', read_only=True)
    response = serializers.CharField(source='writing_task.response', read_only=True)
    words_count = serializers.IntegerField(source='writing_task.words_count', read_only=True)
    started_time = serializers.CharField(source='writing_task.started_time', read_only=True)

    class Meta:
        model = AssessmentTask
        fields = ['id', 'student_name', 'trait', 'started_time', 'rater_name', 'rater_digital_id', 'response', 'words_count', 'ta', 'gra', 'voc', 'coco', 'completed', 'comments']