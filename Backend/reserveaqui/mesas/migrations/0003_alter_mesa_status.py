from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mesas', '0002_remove_mesa_capacidade'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mesa',
            name='status',
            field=models.CharField(
                choices=[('disponivel', 'Disponível'), ('ocupada', 'Ocupada')],
                default='disponivel',
                max_length=20,
                verbose_name='Status',
            ),
        ),
    ]