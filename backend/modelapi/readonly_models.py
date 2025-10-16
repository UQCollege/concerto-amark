# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class UtilAppPelaDataSplitsLog(models.Model):
    split_id = models.UUIDField(primary_key=True)
    train_count = models.IntegerField()
    val_count = models.IntegerField()
    test_count = models.IntegerField()
    split_type = models.CharField(max_length=10)
    created_at = models.DateTimeField()
    writing_seed = models.OneToOneField('UtilAppPelaWritingseed', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'util_app_pela_data_splits_log'
    
    readonly_pela_dev = True



class UtilAppPelaWritingseed(models.Model):
    id = models.BigAutoField(primary_key=True)
    active = models.BooleanField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=100)
    updated_by = models.CharField(max_length=100, blank=True, null=True)
    deleted_by = models.CharField(max_length=100, blank=True, null=True)
    change_reason = models.TextField()
    severity = models.CharField(max_length=50)
    session_id = models.CharField(max_length=255)
    trait = models.CharField(max_length=100)
    response = models.TextField()
    words_count = models.IntegerField()
    started_time = models.DateTimeField()
    test_id = models.CharField(max_length=100)
    user_id = models.IntegerField()
    user_login = models.CharField(max_length=150)
    timetaken = models.FloatField(db_column='timeTaken', blank=True, null=True)  # Field name made lowercase.
    data_split = models.CharField(max_length=10)
    writing_subject = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'util_app_pela_writingseed'
        unique_together = (('session_id', 'user_login', 'user_id'), ('user_login', 'user_id'),)
    
    readonly_pela_dev = True