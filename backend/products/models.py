from django.db import models

# Create your models here.

class Product(models.Model):

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'


    id = models.CharField(max_length=20,primary_key=True, blank=False, null=False, unique=True)
    name = models.CharField(max_length=100, blank=False, null=False)
    sku = models.CharField(max_length=50,unique=True, blank=False, null=False)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10,choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
