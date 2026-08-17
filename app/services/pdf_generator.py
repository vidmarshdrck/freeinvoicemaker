# PDF generation utilities using ReportLab and Pillow.
# - Builds printable PDFs for invoices, quotes, receipts using project templates and brand colors.
# - Handles image scaling, pagination, and consistent footer/header rendering.
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, Union
from decimal import Decimal
from PIL import Image as PILImage

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

from app.core.config import settings
from app.models import Document, Business, Customer, Payment


def sanitize_filename(name: str) -> str:
    """Sanitize string to be safe for filenames."""
    s = re.sub(r"[^\w\s-]", "", name).strip()
    return re.sub(r"[-\s]+", "-", s)


def hex_to_reportlab_color(hex_str: str, default=colors.HexColor("#2563eb")) -> colors.HexColor:
    """Convert hex color string to ReportLab HexColor with fallback."""
    if not hex_str:
        return default
    try:
        hex_clean = hex_str.strip()
        if not hex_clean.startswith("#"):
            hex_clean = f"#{hex_clean}"
        return colors.HexColor(hex_clean)
    except Exception:
        return default


def get_scaled_image(image_path: str, max_width: float, max_height: float) -> Optional[Image]:
    """Safely load and constrain an image to max dimensions while preserving aspect ratio."""
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        with PILImage.open(image_path) as img:
            orig_w, orig_h = img.size
            if orig_w == 0 or orig_h == 0:
                return None
            aspect = orig_h / orig_w
            w = max_width
            h = w * aspect
            if h > max_height:
                h = max_height
                w = h / aspect
            return Image(image_path, width=w, height=h)
    except Exception:
        return None


class NumberedCanvas(canvas.Canvas):
    """Canvas that performs a two-pass render to display total page counts in footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_footer(num_pages)
            super().showPage()
        super().save()

    def draw_page_footer(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 20 * mm, 12 * mm, page_text)
        self.drawString(20 * mm, 12 * mm, "Generated with Free Invoice Maker • Local-First & Open-Source")
        self.restoreState()


class PdfGenerator:
    """PDF document generator supporting invoices, quotations, estimates, and receipts."""

    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = Path(output_dir or settings.STORAGE_PATH) / "documents"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_document_pdf(self, document: Document) -> str:
        """Generate PDF for an invoice, quotation, estimate, or proforma document."""
        business: Business = document.business
        customer: Customer = document.customer
        doc_type = document.document_type.lower()

        # Target directory by document type
        type_dir = self.output_dir / f"{doc_type}s"
        type_dir.mkdir(parents=True, exist_ok=True)

        # Output filename: e.g., INV-00001-Acme-Corp.pdf
        safe_num = sanitize_filename(document.document_number)
        safe_cust = sanitize_filename(customer.display_name or "Client")
        filename = f"{safe_num}-{safe_cust}.pdf"
        file_path = type_dir / filename

        # Colors & Styles
        primary_hex = document.primary_color or business.primary_color or "#2563eb"
        primary_color = hex_to_reportlab_color(primary_hex)
        secondary_color = hex_to_reportlab_color(business.secondary_color or "#1e293b")
        text_dark = colors.HexColor("#1e293b")
        text_muted = colors.HexColor("#64748b")
        border_light = colors.HexColor("#e2e8f0")
        bg_light = colors.HexColor("#f8fafc")

        # Document setup
        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=22 * mm,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=primary_color,
        )

        heading_style = ParagraphStyle(
            "HeadingStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=secondary_color,
        )

        body_style = ParagraphStyle(
            "BodyStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=text_dark,
        )

        body_muted = ParagraphStyle(
            "BodyMuted",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=text_muted,
        )

        table_header_style = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.white if document.template_name != "minimal" else secondary_color,
        )

        table_cell_style = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=text_dark,
        )

        table_cell_bold = ParagraphStyle(
            "TableCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=text_dark,
        )

        table_cell_right = ParagraphStyle(
            "TableCellRight",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            alignment=2,  # Right
            textColor=text_dark,
        )

        table_cell_right_bold = ParagraphStyle(
            "TableCellRightBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            alignment=2,  # Right
            textColor=text_dark,
        )

        elements = []

        # 1. HEADER SECTION (Logo + Business Details / Title + Doc Meta)
        doc_titles = {
            "invoice": "INVOICE",
            "quotation": "QUOTATION",
            "estimate": "ESTIMATE",
            "receipt": "RECEIPT",
            "proforma": "PROFORMA INVOICE",
        }
        display_title = doc_titles.get(doc_type, doc_type.upper())

        # Business Info Block
        biz_info_parts = []
        biz_info_parts.append(f"<b>{business.trading_name or business.name}</b>")
        if business.registration_number:
            biz_info_parts.append(f"Reg #: {business.registration_number}")
        if business.tax_number:
            biz_info_parts.append(f"Tax/VAT #: {business.tax_number}")
        if business.address:
            biz_info_parts.append(business.address.replace("\n", ", "))
        loc_line = ", ".join(filter(None, [business.city, business.province_state, business.country]))
        if loc_line:
            biz_info_parts.append(loc_line)
        if business.email:
            biz_info_parts.append(f"Email: {business.email}")
        if business.phone:
            biz_info_parts.append(f"Tel: {business.phone}")
        if business.website:
            biz_info_parts.append(f"Web: {business.website}")

        biz_paragraph = Paragraph("<br/>".join(biz_info_parts), body_style)

        # Logo
        logo_img = None
        if business.logo_path and os.path.exists(business.logo_path):
            logo_img = get_scaled_image(business.logo_path, max_width=50 * mm, max_height=25 * mm)

        # Document Details Block
        meta_parts = [
            f"<font color='{primary_hex}'><b>{display_title}</b></font>",
            f"<b>Number:</b> {document.document_number}",
            f"<b>Date:</b> {document.issue_date}",
        ]
        if document.due_date and doc_type in ["invoice", "proforma"]:
            meta_parts.append(f"<b>Due Date:</b> {document.due_date}")
        if document.expiry_date and doc_type in ["quotation", "estimate"]:
            meta_parts.append(f"<b>Valid Until:</b> {document.expiry_date}")
        if document.reference_number:
            meta_parts.append(f"<b>Reference:</b> {document.reference_number}")
        if document.status:
            meta_parts.append(f"<b>Status:</b> {document.status.upper()}")

        meta_paragraph = Paragraph("<br/>".join(meta_parts), ParagraphStyle(
            "DocMeta",
            parent=body_style,
            alignment=2,  # Right
        ))

        # Layout header table
        if logo_img:
            header_table_data = [
                [logo_img, meta_paragraph],
                [biz_paragraph, ""]
            ]
            header_table = Table(
                header_table_data,
                colWidths=[90 * mm, 84 * mm],
                style=[
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("SPAN", (1, 0), (1, 1)),
                    ("ALIGN", (1, 0), (1, 1), "RIGHT"),
                ]
            )
        else:
            header_table_data = [
                [biz_paragraph, meta_paragraph]
            ]
            header_table = Table(
                header_table_data,
                colWidths=[95 * mm, 79 * mm],
                style=[
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ]
            )

        elements.append(header_table)
        elements.append(Spacer(1, 12))

        # Top Accent Divider
        if document.template_name != "minimal":
            elements.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=2, spaceAfter=12))
        else:
            elements.append(HRFlowable(width="100%", thickness=0.5, color=border_light, spaceBefore=2, spaceAfter=12))

        # 2. COVER LETTER (If enabled)
        if document.cover_letter_enabled and (document.cover_letter_body or document.cover_letter_title):
            cl_title = document.cover_letter_title or "Dear Customer,"
            cl_elements = [
                Paragraph(f"<b>{cl_title}</b>", heading_style),
                Spacer(1, 4),
                Paragraph(document.cover_letter_body.replace("\n", "<br/>") if document.cover_letter_body else "", body_style),
                Spacer(1, 10),
            ]
            elements.extend(cl_elements)

        # 3. BILL TO / CLIENT INFO BOX
        cust_parts = [f"<b>{customer.display_name}</b>"]
        if customer.company_name and customer.company_name != customer.display_name:
            cust_parts.append(customer.company_name)
        if customer.address:
            cust_parts.append(customer.address.replace("\n", ", "))
        cust_loc = ", ".join(filter(None, [customer.city, customer.province_state, customer.country]))
        if cust_loc:
            cust_parts.append(cust_loc)
        if customer.tax_number:
            cust_parts.append(f"Tax/VAT #: {customer.tax_number}")
        if customer.email:
            cust_parts.append(f"Email: {customer.email}")
        if customer.phone:
            cust_parts.append(f"Phone: {customer.phone}")

        bill_to_box = [
            [Paragraph("<font color='#64748b'><b>BILL TO:</b></font>", body_muted)],
            [Paragraph("<br/>".join(cust_parts), body_style)],
        ]
        bill_to_table = Table(
            bill_to_box,
            colWidths=[174 * mm],
            style=[
                ("BACKGROUND", (0, 0), (-1, -1), bg_light),
                ("BOX", (0, 0), (-1, -1), 0.5, border_light),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
        elements.append(bill_to_table)
        elements.append(Spacer(1, 14))

        # 4. ITEMS TABLE
        items_headers = [
            Paragraph("#", table_header_style),
            Paragraph("Item & Description", table_header_style),
            Paragraph("Unit", table_header_style),
            Paragraph("Qty", table_header_style),
            Paragraph(f"Price ({document.currency})", table_header_style),
            Paragraph("Disc", table_header_style),
            Paragraph("Tax", table_header_style),
            Paragraph(f"Total ({document.currency})", ParagraphStyle("HdrRight", parent=table_header_style, alignment=2)),
        ]

        table_rows = [items_headers]
        col_widths = [10 * mm, 58 * mm, 16 * mm, 14 * mm, 24 * mm, 14 * mm, 14 * mm, 24 * mm]

        for idx, item in enumerate(document.items, 1):
            desc_text = f"<b>{item.name}</b>"
            if item.description:
                desc_text += f"<br/><font color='#64748b'>{item.description}</font>"

            disc_str = f"{item.discount_rate}%" if item.discount_rate > 0 else "-"
            tax_str = f"{item.tax_rate}%" if item.tax_rate > 0 else "-"

            row = [
                Paragraph(str(idx), table_cell_style),
                Paragraph(desc_text, table_cell_style),
                Paragraph(item.unit or "unit", table_cell_style),
                Paragraph(f"{item.quantity:g}", table_cell_style),
                Paragraph(f"{item.unit_price:,.2f}", table_cell_right),
                Paragraph(disc_str, table_cell_style),
                Paragraph(tax_str, table_cell_style),
                Paragraph(f"{item.total_amount:,.2f}", table_cell_right_bold),
            ]
            table_rows.append(row)

        table_style_commands = [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]

        if document.template_name == "minimal":
            table_style_commands.extend([
                ("LINEBELOW", (0, 0), (-1, 0), 1, text_dark),
                ("LINEBELOW", (0, 1), (-1, -1), 0.5, border_light),
            ])
        else:
            # Modern / Classic colored header
            table_style_commands.extend([
                ("BACKGROUND", (0, 0), (-1, 0), primary_color if document.template_name == "modern" else secondary_color),
                ("BOX", (0, 0), (-1, -1), 0.5, border_light),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, border_light),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, bg_light]),
            ])

        items_table = Table(table_rows, colWidths=col_widths, style=table_style_commands)
        elements.append(items_table)
        elements.append(Spacer(1, 10))

        # 5. SUMMARY / TOTALS SECTION
        totals_data = []
        totals_data.append([
            Paragraph("Subtotal:", table_cell_style),
            Paragraph(f"{document.currency} {document.subtotal:,.2f}", table_cell_right),
        ])

        if document.total_discount > 0:
            totals_data.append([
                Paragraph("Discount:", table_cell_style),
                Paragraph(f"- {document.currency} {document.total_discount:,.2f}", table_cell_right),
            ])

        if document.total_tax > 0:
            tax_label = f"Tax ({document.tax_type}):"
            totals_data.append([
                Paragraph(tax_label, table_cell_style),
                Paragraph(f"{document.currency} {document.total_tax:,.2f}", table_cell_right),
            ])

        if document.shipping_fee and document.shipping_fee > 0:
            totals_data.append([
                Paragraph("Shipping / Fee:", table_cell_style),
                Paragraph(f"{document.currency} {document.shipping_fee:,.2f}", table_cell_right),
            ])

        # Grand Total
        totals_data.append([
            Paragraph("<b>Grand Total:</b>", heading_style),
            Paragraph(f"<b>{document.currency} {document.grand_total:,.2f}</b>", ParagraphStyle(
                "TotalGrand",
                parent=table_cell_right_bold,
                fontSize=11,
                leading=14,
                textColor=primary_color,
            )),
        ])

        if doc_type in ["invoice", "proforma"]:
            if document.total_paid > 0:
                totals_data.append([
                    Paragraph("Total Paid:", table_cell_style),
                    Paragraph(f"{document.currency} {document.total_paid:,.2f}", table_cell_right),
                ])
            totals_data.append([
                Paragraph("<b>Balance Due:</b>", heading_style),
                Paragraph(f"<b>{document.currency} {document.amount_due:,.2f}</b>", ParagraphStyle(
                    "BalanceDue",
                    parent=table_cell_right_bold,
                    fontSize=11,
                    leading=14,
                    textColor=colors.HexColor("#dc2626") if document.amount_due > 0 else colors.HexColor("#16a34a"),
                )),
            ])

        totals_table = Table(
            totals_data,
            colWidths=[38 * mm, 40 * mm],
            style=[
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LINEABOVE", (0, -2 if doc_type in ["invoice", "proforma"] else -1), (-1, -2 if doc_type in ["invoice", "proforma"] else -1), 1, primary_color),
            ]
        )

        # Payment details / notes left side, totals right side
        left_info_parts = []

        # Bank instructions override or business defaults
        bank_text = document.bank_details_override
        if not bank_text:
            parts = []
            if business.bank_name:
                parts.append(f"<b>Bank:</b> {business.bank_name}")
            if business.bank_account_name:
                parts.append(f"<b>Account Name:</b> {business.bank_account_name}")
            if business.bank_account_number:
                parts.append(f"<b>Account #:</b> {business.bank_account_number}")
            if business.bank_branch:
                parts.append(f"<b>Branch:</b> {business.bank_branch}")
            if business.bank_swift_bic:
                parts.append(f"<b>SWIFT/BIC:</b> {business.bank_swift_bic}")
            if business.mobile_money_number:
                parts.append(f"<b>Mobile Money:</b> {business.mobile_money_number}")
            if parts:
                bank_text = "<br/>".join(parts)

        if bank_text:
            left_info_parts.append("<b>Payment Information:</b>")
            left_info_parts.append(bank_text)

        pay_inst = document.payment_instructions_override or business.payment_instructions
        if pay_inst:
            left_info_parts.append(f"<b>Instructions:</b> {pay_inst}")

        left_paragraph = Paragraph("<br/>".join(left_info_parts), body_style) if left_info_parts else Paragraph("", body_style)

        bottom_split_table = Table(
            [[left_paragraph, totals_table]],
            colWidths=[96 * mm, 78 * mm],
            style=[
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
        elements.append(bottom_split_table)
        elements.append(Spacer(1, 14))

        # 6. NOTES & TERMS
        notes_terms_blocks = []
        if document.notes or business.default_notes:
            note_content = document.notes or business.default_notes
            notes_terms_blocks.append(Paragraph(f"<b>Notes:</b><br/>{note_content}", body_style))
            notes_terms_blocks.append(Spacer(1, 6))

        if document.terms or business.default_terms:
            terms_content = document.terms or business.default_terms
            notes_terms_blocks.append(Paragraph(f"<b>Terms & Conditions:</b><br/>{terms_content}", body_muted))
            notes_terms_blocks.append(Spacer(1, 6))

        if notes_terms_blocks:
            elements.extend(notes_terms_blocks)

        # 7. SIGNATURE & STAMP SECTION
        sig_stamp_row = []
        sig_img = None
        stamp_img = None

        if document.signature_enabled and business.signature_path and os.path.exists(business.signature_path):
            sig_img = get_scaled_image(business.signature_path, max_width=45 * mm, max_height=20 * mm)

        if document.stamp_enabled and business.stamp_path and os.path.exists(business.stamp_path):
            stamp_img = get_scaled_image(business.stamp_path, max_width=35 * mm, max_height=20 * mm)

        if sig_img or stamp_img:
            sig_label = business.signature_label or "Authorised Signatory"
            sig_cell = [sig_img, Paragraph(f"<br/>____________________<br/><b>{sig_label}</b>", body_style)] if sig_img else []
            stamp_cell = [stamp_img, Paragraph("<br/><b>Company Stamp</b>", body_muted)] if stamp_img else []

            sig_stamp_table = Table(
                [[sig_cell or "", stamp_cell or ""]],
                colWidths=[87 * mm, 87 * mm],
                style=[
                    ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ]
            )
            elements.append(KeepTogether([Spacer(1, 10), sig_stamp_table]))

        # Build PDF with footer
        doc.build(elements, canvasmaker=NumberedCanvas)
        return str(file_path)

    def generate_receipt_pdf(self, payment: Payment) -> str:
        """Generate PDF for a standalone payment receipt."""
        business: Business = payment.business
        customer: Customer = payment.customer

        type_dir = self.output_dir / "receipts"
        type_dir.mkdir(parents=True, exist_ok=True)

        rec_num = sanitize_filename(payment.receipt_number or f"REC-{payment.id[:8]}")
        cust_name = sanitize_filename(customer.display_name or "Client")
        filename = f"{rec_num}-{cust_name}.pdf"
        file_path = type_dir / filename

        primary_color = hex_to_reportlab_color(business.primary_color or "#2563eb")
        secondary_color = hex_to_reportlab_color(business.secondary_color or "#1e293b")
        text_dark = colors.HexColor("#1e293b")
        border_light = colors.HexColor("#e2e8f0")
        bg_light = colors.HexColor("#f8fafc")

        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=22 * mm,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "ReceiptTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=primary_color,
        )

        body_style = ParagraphStyle(
            "ReceiptBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=14,
            textColor=text_dark,
        )

        elements = []

        # Business header + Logo
        biz_info = [
            f"<b>{business.trading_name or business.name}</b>",
            business.address or "",
            ", ".join(filter(None, [business.city, business.province_state, business.country])),
            f"Email: {business.email}" if business.email else "",
            f"Phone: {business.phone}" if business.phone else "",
        ]
        biz_p = Paragraph("<br/>".join(filter(None, biz_info)), body_style)

        logo_img = None
        if business.logo_path and os.path.exists(business.logo_path):
            logo_img = get_scaled_image(business.logo_path, max_width=50 * mm, max_height=25 * mm)

        meta_parts = [
            f"<font color='{primary_color.hexval()}'><b>PAYMENT RECEIPT</b></font>",
            f"<b>Receipt #:</b> {payment.receipt_number}",
            f"<b>Date:</b> {payment.payment_date}",
        ]
        if payment.document:
            meta_parts.append(f"<b>Invoice #:</b> {payment.document.document_number}")
        if payment.reference_number:
            meta_parts.append(f"<b>Ref / Trx #:</b> {payment.reference_number}")

        meta_p = Paragraph("<br/>".join(meta_parts), ParagraphStyle("RMeta", parent=body_style, alignment=2))

        if logo_img:
            h_table = Table([[logo_img, meta_p], [biz_p, ""]], colWidths=[90 * mm, 84 * mm])
            h_table.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("SPAN", (1, 0), (1, 1)),
                ("ALIGN", (1, 0), (1, 1), "RIGHT"),
            ]))
        else:
            h_table = Table([[biz_p, meta_p]], colWidths=[95 * mm, 79 * mm])
            h_table.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]))

        elements.append(h_table)
        elements.append(Spacer(1, 12))
        elements.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=2, spaceAfter=14))

        # Receipt details banner
        receipt_box = [
            [Paragraph("<b>RECEIVED FROM:</b>", body_style), Paragraph(f"<b>{customer.display_name}</b> ({customer.company_name or ''})", body_style)],
            [Paragraph("<b>PAYMENT METHOD:</b>", body_style), Paragraph(payment.payment_method, body_style)],
            [Paragraph("<b>AMOUNT RECEIVED:</b>", body_style), Paragraph(f"<font color='{primary_color.hexval()}' size=14><b>{payment.currency} {payment.amount:,.2f}</b></font>", body_style)],
            [Paragraph("<b>NOTES / PURPOSE:</b>", body_style), Paragraph(payment.notes or "Payment received with thanks.", body_style)],
        ]
        r_table = Table(
            receipt_box,
            colWidths=[50 * mm, 124 * mm],
            style=[
                ("BACKGROUND", (0, 0), (-1, -1), bg_light),
                ("BOX", (0, 0), (-1, -1), 0.5, border_light),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, border_light),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
        elements.append(r_table)
        elements.append(Spacer(1, 20))

        # Signature & Stamp for receipt
        sig_img = None
        stamp_img = None
        if business.signature_path and os.path.exists(business.signature_path):
            sig_img = get_scaled_image(business.signature_path, max_width=45 * mm, max_height=20 * mm)
        if business.stamp_path and os.path.exists(business.stamp_path):
            stamp_img = get_scaled_image(business.stamp_path, max_width=35 * mm, max_height=20 * mm)

        sig_cell = [sig_img, Paragraph("<br/>____________________<br/><b>Received By</b>", body_style)] if sig_img else [Paragraph("<br/><br/>____________________<br/><b>Received By</b>", body_style)]
        stamp_cell = [stamp_img, Paragraph("<br/><b>Stamp</b>", body_style)] if stamp_img else []

        sig_stamp_table = Table(
            [[sig_cell, stamp_cell or ""]],
            colWidths=[87 * mm, 87 * mm],
            style=[
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
        elements.append(sig_stamp_table)

        doc.build(elements, canvasmaker=NumberedCanvas)
        return str(file_path)


pdf_service = PdfGenerator()
