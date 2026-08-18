# Free Invoice Maker (FIM) Setup Guide

Free Invoice Maker is a FastAPI application with a local SQLite database. It
works on Windows, Linux, and macOS with Python 3.11 or newer.

## Prerequisites

- Git
- Python 3.11 or newer
- `pip` (installed with Python)
- Optional: Docker Desktop or Docker Engine

Clone the repository and enter the project directory:

```bash
git clone https://github.com/vidmarshdrck/freeinvoicemaker.git
cd freeinvoicemaker
```

## Configure the environment

Create a `.env` file in the project root before starting a production instance.
At minimum, use a unique `SECRET_KEY` and replace the default administrator
password:

```dotenv
APP_ENV=production
DEBUG=false
SECRET_KEY=replace-with-a-long-random-secret
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=replace-with-a-strong-password
DATABASE_URL=sqlite:///storage/invoice_maker.db
```

The application creates its SQLite database and the first administrator account
on first startup. Keep the `storage/` directory backed up because it contains
the database, uploads, and generated documents.

## Windows (no-install executable)

If you prefer not to install Python or use the terminal, download the
pre-built executable from the
[Releases page](https://github.com/vidmarshdrck/freeinvoicemaker/releases/latest):

1. Download **FreeInvoiceMaker-windows.zip** from the latest release.
2. Extract the ZIP to a folder of your choice.
3. Double-click **FreeInvoiceMaker.exe** inside the extracted folder.
4. Your default browser will open automatically at `http://127.0.0.1:8000`.
5. To stop the server, close the console window.

The executable bundles Python and all dependencies — nothing else to install.

## Windows (from source)

Open PowerShell in the project directory:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

If PowerShell blocks virtual-environment activation, run this once for the
current PowerShell window, then repeat the activation command:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Open <http://127.0.0.1:8000>. API documentation is available at
<http://127.0.0.1:8000/api/docs>.

## Linux and macOS

From the project directory:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

If Python 3.11 is installed as `python3`, replace `python3.11` in the first
command. Browse to <http://127.0.0.1:8000> after the server starts.

### Quick-launch with the `fim` command

After activating the virtual environment, install the package in editable mode:

```bash
pip install -e .
```

Now you can start the application from any directory by typing:

```bash
fim
```

This launches the server at <http://127.0.0.1:8000> and opens your default
browser automatically.

## Docker

Build the image:

```bash
docker build -t freeinvoicemaker .
```

Run it with persistent local storage and your `.env` configuration:

```bash
docker run --rm \
  --name freeinvoicemaker \
  --env-file .env \
  -p 8000:8000 \
  -v "$(pwd)/storage:/app/storage" \
  freeinvoicemaker
```

On Windows PowerShell, use this volume argument instead:

```powershell
-v "${PWD}/storage:/app/storage"
```

Then open <http://127.0.0.1:8000>. Do not omit the `storage` volume if you
need invoices and application data to survive container replacement.

## Run as a Linux systemd service

1. Complete the Linux setup above and confirm that the application starts.
2. Copy `systemd/freeinvoicemaker.service` to `/etc/systemd/system/`.
3. Edit the copied file and replace the `User`, `Group`, `WorkingDirectory`,
   and `ExecStart` values with your Linux user and absolute project path.
4. Enable and start the service:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now freeinvoicemaker
   sudo systemctl status --no-pager freeinvoicemaker
   ```

View service logs with:

```bash
sudo journalctl -u freeinvoicemaker -f
```

The included `scripts/install_service.sh` automates these steps only when the
project is installed at its path hard-coded in that script. For another
location, follow the manual service steps above.

## Production notes

- Bind to `127.0.0.1` when using a reverse proxy. Use `0.0.0.0` only when the
  host firewall and network exposure are configured intentionally.
- Set a unique `SECRET_KEY` and strong administrator password before exposing
  the application to a network.
- Restrict `CORS_ORIGINS` in `.env` to the domains that serve your FIM UI.
- Back up the complete `storage/` directory regularly.
