from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.schemas.common import ApiResponse
from app.api.deps import AuthContext, get_current_auth

router = APIRouter(prefix="/templates", tags=["Templates"])


class TemplateInfo(BaseModel):
    id: str
    name: str
    description: str
    recommended_for: str
    supports_logo: bool = True
    supports_stamp: bool = True
    supports_signature: bool = True
    supports_custom_colors: bool = True


AVAILABLE_TEMPLATES = [
    TemplateInfo(
        id="modern",
        name="Modern Clean",
        description="A contemporary design featuring a bold accent header, alternating item rows, and high visual hierarchy.",
        recommended_for="Agencies, Tech Consultancies, Professional Services, and Modern Businesses",
    ),
    TemplateInfo(
        id="classic",
        name="Classic Professional",
        description="A timeless corporate layout with clear borders, traditional grid organization, and formal presentation.",
        recommended_for="Law Firms, Accounting, Construction, Manufacturing, and Established Enterprises",
    ),
    TemplateInfo(
        id="minimal",
        name="Minimal Pure",
        description="An ultra-clean, typographical layout with generous whitespace, subtle dividing lines, and zero clutter.",
        recommended_for="Designers, Freelancers, Photographers, and Minimalist Brands",
    ),
]


@router.get("", response_model=ApiResponse[List[TemplateInfo]])
def list_available_templates(auth: AuthContext = Depends(get_current_auth)):
    """List all available PDF document design templates."""
    return ApiResponse(
        success=True,
        data=AVAILABLE_TEMPLATES,
    )
