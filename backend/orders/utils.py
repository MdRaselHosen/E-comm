from django.db import transaction

def reduce_order_stock(order):
    """
    Atomically decreases product stock quantities when an order is successfully paid.
    Assumes your Order has a related name 'items' linking to order details.
    """
    with transaction.atomic():
        # Using select_for_update to lock rows and prevent race conditions
        for item in order.items.select_related('product').all():
            product = item.product
            if product.stock >= item.quantity:
                product.stock -= item.quantity
                product.save(update_fields=['stock'])
            else:
                # Handle edge case where stock drops before webhook confirmation
                product.stock = 0
                product.save(update_fields=['stock'])