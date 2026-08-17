
Proceed with the next step.

Fix the malformed Authorization/header placeholders in:

- apiCall
- triggerBackupExport

The current implementation contains `******` placeholders that may produce invalid HTTP headers or broken authentication behavior.

Do not redesign the authentication system.

Do not remove authentication.

Do not hardcode a real API key.

Determine how the existing FIM frontend authentication/session mechanism is intended to work and make these functions use that mechanism correctly.

Requirements:

1. Normal GUI operations must authenticate automatically through the application's existing frontend/session mechanism.
2. Users must NOT manually enter an API key when using normal FIM GUI features.
3. External applications and AI agents must continue authenticating through FIM API keys.
4. Do not expose API keys unnecessarily in frontend code.
5. Keep `/api/docs` available for external API users.
6. Preserve existing error handling and convert authentication failures into appropriate FIM UI errors/toasts where applicable.
7. Do not use placeholder Authorization values.
8. Do not invent credentials.
9. Do not disable authentication simply to make requests work.

After fixing the authentication/header implementation:

Run the application and test:

- Dashboard loading
- Business creation
- Business editing
- Customer creation
- Product creation
- Invoice creation
- Backup export
- API documentation access

Then specifically test:

A. Create business without logo
→ save
→ verify database persistence

B. Create business with logo
→ select logo
→ save
→ verify upload succeeds
→ verify logo is associated with the correct business
→ verify it appears in the UI

C. Edit business with logo
→ replace logo
→ save
→ verify new logo is used

D. Trigger backup export
→ verify request succeeds
→ verify backup file is generated/downloaded correctly

E. Restart application
→ verify data remains available.

Also verify that the Save button:

- disables during submission
- displays a loading state
- prevents double submission
- re-enables after success
- re-enables after failure

Do not commit or push anything yet.

At the end, report:

- What was wrong with the Authorization/header implementation
- What was changed
- Whether GUI authentication now works
- Whether backup export works
- Whether business logo upload works
- Tests performed
- Any remaining issues