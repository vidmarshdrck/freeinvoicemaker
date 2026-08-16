import csv
import io
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models import Customer, Product


class CsvService:
    @staticmethod
    def export_customers_csv(customers: List[Customer]) -> str:
        """Export customers list to CSV string."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "id", "display_name", "first_name", "last_name", "company_name",
            "email", "phone", "alt_phone", "address", "city", "province_state",
            "postal_code", "country", "tax_number", "customer_type", "notes"
        ])
        for c in customers:
            writer.writerow([
                c.id, c.display_name, c.first_name or "", c.last_name or "",
                c.company_name or "", c.email or "", c.phone or "", c.alt_phone or "",
                c.address or "", c.city or "", c.province_state or "",
                c.postal_code or "", c.country or "", c.tax_number or "",
                c.customer_type or "business", c.notes or ""
            ])
        return output.getvalue()

    @staticmethod
    def import_customers_csv(db: Session, business_id: str, csv_content: str) -> Tuple[int, int, List[str]]:
        """Import customers from CSV string. Returns: (created_count, updated_count, errors)"""
        reader = csv.DictReader(io.StringIO(csv_content))
        created = 0
        updated = 0
        errors = []

        for idx, row in enumerate(reader, 1):
            try:
                name = row.get("display_name") or row.get("name") or row.get("company_name")
                if not name or not name.strip():
                    errors.append(f"Row {idx}: missing display_name or name.")
                    continue

                cust_id = row.get("id")
                cust = None
                if cust_id:
                    cust = db.query(Customer).filter(Customer.id == cust_id, Customer.business_id == business_id).first()

                if not cust:
                    cust = Customer(
                        business_id=business_id,
                        display_name=name.strip(),
                        first_name=row.get("first_name", "").strip() or None,
                        last_name=row.get("last_name", "").strip() or None,
                        company_name=row.get("company_name", "").strip() or None,
                        email=row.get("email", "").strip() or None,
                        phone=row.get("phone", "").strip() or None,
                        alt_phone=row.get("alt_phone", "").strip() or None,
                        address=row.get("address", "").strip() or None,
                        city=row.get("city", "").strip() or None,
                        province_state=row.get("province_state", "").strip() or None,
                        postal_code=row.get("postal_code", "").strip() or None,
                        country=row.get("country", "").strip() or "Zambia",
                        tax_number=row.get("tax_number", "").strip() or None,
                        customer_type=row.get("customer_type", "business").strip(),
                        notes=row.get("notes", "").strip() or None,
                    )
                    db.add(cust)
                    created += 1
                else:
                    cust.display_name = name.strip()
                    cust.email = row.get("email", "").strip() or None
                    cust.phone = row.get("phone", "").strip() or None
                    cust.address = row.get("address", "").strip() or None
                    cust.city = row.get("city", "").strip() or None
                    cust.country = row.get("country", "").strip() or "Zambia"
                    updated += 1

                db.commit()
            except Exception as e:
                db.rollback()
                errors.append(f"Row {idx}: {str(e)}")

        return created, updated, errors

    @staticmethod
    def export_products_csv(products: List[Product]) -> str:
        """Export products list to CSV string."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "id", "name", "sku", "description", "unit", "price", "currency", "tax_rate", "is_active"
        ])
        for p in products:
            writer.writerow([
                p.id, p.name, p.sku or "", p.description or "",
                p.unit, p.price, p.currency, p.tax_rate, "true" if p.is_active else "false"
            ])
        return output.getvalue()

    @staticmethod
    def import_products_csv(db: Session, business_id: str, csv_content: str) -> Tuple[int, int, List[str]]:
        """Import products from CSV string. Returns: (created_count, updated_count, errors)"""
        reader = csv.DictReader(io.StringIO(csv_content))
        created = 0
        updated = 0
        errors = []

        for idx, row in enumerate(reader, 1):
            try:
                name = row.get("name")
                if not name or not name.strip():
                    errors.append(f"Row {idx}: missing product name.")
                    continue

                prod_id = row.get("id")
                prod = None
                if prod_id:
                    prod = db.query(Product).filter(Product.id == prod_id, Product.business_id == business_id).first()

                price_val = Decimal(str(row.get("price") or 0.00))
                tax_val = Decimal(str(row.get("tax_rate") or 0.00))

                if not prod:
                    prod = Product(
                        business_id=business_id,
                        name=name.strip(),
                        sku=row.get("sku", "").strip() or None,
                        description=row.get("description", "").strip() or None,
                        unit=row.get("unit", "unit").strip() or "unit",
                        price=price_val,
                        currency=row.get("currency", "USD").strip() or "USD",
                        tax_rate=tax_val,
                        is_active=row.get("is_active", "true").lower() in ["true", "1", "yes"],
                    )
                    db.add(prod)
                    created += 1
                else:
                    prod.name = name.strip()
                    prod.price = price_val
                    prod.tax_rate = tax_val
                    prod.unit = row.get("unit", prod.unit).strip()
                    updated += 1

                db.commit()
            except Exception as e:
                db.rollback()
                errors.append(f"Row {idx}: {str(e)}")

        return created, updated, errors


csv_service = CsvService()
