from django.db import transaction
from products.models import Product

def reduce_order_stock(order):
    with transaction.atomic():

        for item in order.items.all():
            product = Product.objects.select_for_update().get(pk=item.product_id)
            if product.stock >= item.quantity:
                product.stock -= item.quantity
            else:

                product.stock = 0
            product.save(update_fields=['stock'])