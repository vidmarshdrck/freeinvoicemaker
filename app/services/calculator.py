from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple
from app.schemas.document import DocumentItemCreate


def quantize_currency(value: Decimal) -> Decimal:
    """Round to 2 decimal places with HALF_UP."""
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_line_item(
    quantity: Decimal,
    unit_price: Decimal,
    discount_rate: Decimal = Decimal("0.00"),
    tax_rate: Decimal = Decimal("0.00"),
    tax_inclusive: bool = False,
) -> Dict[str, Decimal]:
    """
    Calculate financial breakdown for a single line item.
    Returns:
        - raw_amount = quantity * unit_price
        - discount_amount = raw_amount * (discount_rate / 100)
        - discounted_amount = raw_amount - discount_amount
        - tax_amount:
            if exclusive: discounted_amount * (tax_rate / 100)
            if inclusive: discounted_amount - (discounted_amount / (1 + tax_rate/100))
        - total_amount = final line amount
    """
    qty = Decimal(str(quantity))
    price = Decimal(str(unit_price))
    d_rate = Decimal(str(discount_rate or 0))
    t_rate = Decimal(str(tax_rate or 0))

    raw_amount = quantize_currency(qty * price)

    if d_rate > 0:
        disc_amount = quantize_currency(raw_amount * (d_rate / Decimal("100")))
    else:
        disc_amount = Decimal("0.00")

    subtotal_after_discount = raw_amount - disc_amount

    if t_rate > 0:
        if tax_inclusive:
            # Inclusive: price includes tax
            tax_amount = quantize_currency(subtotal_after_discount - (subtotal_after_discount / (Decimal("1") + (t_rate / Decimal("100")))))
            total_amount = subtotal_after_discount
        else:
            # Exclusive: tax is added on top
            tax_amount = quantize_currency(subtotal_after_discount * (t_rate / Decimal("100")))
            total_amount = subtotal_after_discount + tax_amount
    else:
        tax_amount = Decimal("0.00")
        total_amount = subtotal_after_discount

    return {
        "raw_amount": raw_amount,
        "discount_amount": disc_amount,
        "discounted_amount": subtotal_after_discount,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
    }


def calculate_document_totals(
    items_data: List[Dict[str, Decimal]],
    global_discount_type: str = "fixed",
    global_discount_rate: Decimal = Decimal("0.00"),
    global_discount_amount: Decimal = Decimal("0.00"),
    tax_type: str = "exclusive",
    shipping_fee: Decimal = Decimal("0.00"),
    total_paid: Decimal = Decimal("0.00"),
) -> Dict[str, Decimal]:
    """
    Calculate all totals for a document based on its items and global adjustments.
    """
    items_subtotal = Decimal("0.00")
    items_discount = Decimal("0.00")
    items_tax = Decimal("0.00")

    for item in items_data:
        items_subtotal += item.get("raw_amount", Decimal("0.00"))
        items_discount += item.get("discount_amount", Decimal("0.00"))
        items_tax += item.get("tax_amount", Decimal("0.00"))

    items_subtotal = quantize_currency(items_subtotal)
    items_discount = quantize_currency(items_discount)
    items_tax = quantize_currency(items_tax)

    # Document-level discount
    subtotal_after_item_discounts = items_subtotal - items_discount
    global_disc = Decimal("0.00")

    if global_discount_type == "percentage" and global_discount_rate > 0:
        global_disc = quantize_currency(subtotal_after_item_discounts * (Decimal(str(global_discount_rate)) / Decimal("100")))
    elif global_discount_type == "fixed" and global_discount_amount > 0:
        global_disc = quantize_currency(Decimal(str(global_discount_amount)))

    total_discount = items_discount + global_disc
    total_tax = items_tax
    shipping = quantize_currency(Decimal(str(shipping_fee or 0)))

    if tax_type == "inclusive":
        grand_total = quantize_currency(items_subtotal - total_discount + shipping)
    else:
        grand_total = quantize_currency(items_subtotal - total_discount + total_tax + shipping)

    paid = quantize_currency(Decimal(str(total_paid or 0)))
    amount_due = quantize_currency(grand_total - paid)
    if amount_due < Decimal("0.00"):
        amount_due = Decimal("0.00")

    return {
        "subtotal": items_subtotal,
        "discount_amount": global_disc,
        "total_discount": total_discount,
        "total_tax": total_tax,
        "shipping_fee": shipping,
        "grand_total": grand_total,
        "total_paid": paid,
        "amount_due": amount_due,
    }
