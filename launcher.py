"""
Launcher for the Free Invoice Maker desktop executable.

Starts the Uvicorn server and opens the default browser.
Designed to be the PyInstaller entry point so Windows users can
double-click the .exe to run the application.
"""

import multiprocessing
import os
import sys
import threading
import time
import webbrowser
from pathlib import Path

import uvicorn


def _base_dir() -> Path:
    """Return the base directory, accounting for PyInstaller bundles."""
    if getattr(sys, "frozen", False):
        # Running as a PyInstaller bundle
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def _open_browser(host: str, port: int) -> None:
    """Wait for the server to start, then open the browser."""
    import httpx

    url = f"http://{host}:{port}"
    for _ in range(30):
        time.sleep(1)
        try:
            r = httpx.get(url, timeout=2)
            if r.status_code < 500:
                webbrowser.open(url)
                return
        except Exception:
            pass
    # Fallback: open anyway after timeout
    webbrowser.open(url)


def main() -> None:
    host = "127.0.0.1"
    port = 8000

    base = _base_dir()

    # Ensure the storage directory exists beside the executable
    storage_dir = base / "storage"
    storage_dir.mkdir(parents=True, exist_ok=True)

    # Point the app at the correct storage/database paths
    os.environ.setdefault("STORAGE_PATH", str(storage_dir))
    os.environ.setdefault(
        "DATABASE_URL", f"sqlite:///{storage_dir / 'invoice_maker.db'}"
    )

    print(f"Starting Free Invoice Maker at http://{host}:{port}")
    print("Press Ctrl+C to stop the server.\n")

    # Open browser in a background thread
    t = threading.Thread(target=_open_browser, args=(host, port), daemon=True)
    t.start()

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level="info",
    )


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
