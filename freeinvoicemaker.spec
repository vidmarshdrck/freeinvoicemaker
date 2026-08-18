# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec file for Free Invoice Maker."""

import os
from pathlib import Path

base = Path(os.getcwd())

a = Analysis(
    ["launcher.py"],
    pathex=[str(base)],
    binaries=[],
    datas=[
        (str(base / "app" / "templates"), "app/templates"),
        (str(base / "app" / "static"), "app/static"),
    ],
    hiddenimports=[
        "uvicorn",
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "app",
        "app.main",
        "app.core",
        "app.core.config",
        "app.core.security",
        "app.core.exceptions",
        "app.database",
        "app.database.session",
        "app.models",
        "app.schemas",
        "app.services",
        "app.api",
        "app.api.v1",
        "app.api.v1.api",
        "sqlalchemy.dialects.sqlite",
        "aiofiles",
        "httpx",
        "multipart",
        "email_validator",
        "reportlab",
        "reportlab.lib",
        "reportlab.pdfgen",
        "reportlab.platypus",
        "PIL",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="FreeInvoiceMaker",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="FreeInvoiceMaker",
)
