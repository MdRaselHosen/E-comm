from django.db import models
from user.models import User
from products.models import Product

# Create your models here.

class Order(models.Model):
    status_choices = [
        ("pending","Pending"),
        ("paid", "Paid"),
        ("canceled", "Canceled")
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=status_choices, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Oder #{self.id}'
    

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sub_total = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if self._state.adding:
            self.price = self.product.price
        self.sub_total = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        self.product.name

    

    