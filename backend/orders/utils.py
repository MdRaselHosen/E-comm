from django.db import transaction
from products.models import Product

def reduce_order_stock(order):
    """
    Atomically decreases product stock quantities when an order is successfully paid.
    Assumes your Order has a related name 'items' linking to order details.
    """
    with transaction.atomic():
        # Using select_for_update on the Product model to lock rows and prevent race conditions
        for item in order.items.all():
            product = Product.objects.select_for_update().get(pk=item.product_id)
            if product.stock >= item.quantity:
                product.stock -= item.quantity
            else:
                # Handle edge case where stock drops before webhook confirmation
                product.stock = 0
            product.save(update_fields=['stock'])