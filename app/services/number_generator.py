from datetime import datetime
from sqlalchemy.orm import Session
from app.models import DocumentSequence, Document


DEFAULT_PREFIXES = {
    "invoice": "INV-",
    "quotation": "QUO-",
    "estimate": "EST-",
    "receipt": "REC-",
    "proforma": "PRO-",
}


def get_or_create_sequence(db: Session, business_id: str, document_type: str) -> DocumentSequence:
    """Retrieve existing sequence settings or create defaults for a business."""
    seq = (
        db.query(DocumentSequence)
        .filter(
            DocumentSequence.business_id == business_id,
            DocumentSequence.document_type == document_type,
        )
        .first()
    )
    if not seq:
        prefix = DEFAULT_PREFIXES.get(document_type, f"{document_type.upper()[:3]}-")
        seq = DocumentSequence(
            business_id=business_id,
            document_type=document_type,
            prefix=prefix,
            next_number=1,
            padding_length=5,
            include_year=False,
            include_month=False,
        )
        db.add(seq)
        db.commit()
        db.refresh(seq)
    return seq


def generate_next_document_number(
    db: Session,
    business_id: str,
    document_type: str,
    custom_number: str = None
) -> str:
    """
    Generate the next document number according to sequence rules.
    If custom_number is provided, use that instead after verifying uniqueness.
    """
    if custom_number and custom_number.strip():
        # Check if already used
        existing = (
            db.query(Document)
            .filter(
                Document.business_id == business_id,
                Document.document_type == document_type,
                Document.document_number == custom_number.strip(),
            )
            .first()
        )
        if existing:
            raise ValueError(f"Document number '{custom_number}' is already in use for {document_type}.")
        return custom_number.strip()

    seq = get_or_create_sequence(db, business_id, document_type)

    now = datetime.now()
    year_str = f"{now.year}-" if seq.include_year else ""
    month_str = f"{now.month:02d}-" if (seq.include_year and seq.include_month) else ""

    while True:
        num_str = str(seq.next_number).zfill(seq.padding_length)
        candidate = f"{seq.prefix}{year_str}{month_str}{num_str}"

        # Verify uniqueness
        exists = (
            db.query(Document)
            .filter(
                Document.business_id == business_id,
                Document.document_type == document_type,
                Document.document_number == candidate,
            )
            .first()
        )

        seq.next_number += 1
        db.commit()

        if not exists:
            return candidate
