# Generated by Django 5.1.6 on 2025-05-01 06:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('modelapi', '0002_beclass_class_code_alter_writingtask_trait'),
    ]

    operations = [
        migrations.RenameField(
            model_name='beclass',
            old_name='class_code',
            new_name='class_desc',
        ),
        migrations.AddField(
            model_name='student',
            name='student_digital_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
