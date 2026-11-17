# Security

Report vulnerabilities privately using the public repository's **Report a vulnerability** option if available. Otherwise, contact the maintainer through their GitHub profile to arrange a private channel before sharing sensitive details. Do not put credentials, personal backups or exploit details in a public issue.

Include the affected version, platform, code path, prerequisites and a minimal reproduction with synthetic data. Security fixes target the current stable release and development main; older releases may require an upgrade. This is a best-effort policy, not a guaranteed response schedule.

Glass Notes stores personal records locally and has no account service or application backend. Backups are unencrypted and may include private recipe photos and notes. Treat backup files as private. Browser data is scoped to its origin; use HTTPS or localhost for browser locks and safe saving/restoring. A stale window must reload after another window saves data.

The desktop bridge accepts only the documented storage keys, local origins and bounded file dialogs. Never expand it to arbitrary paths or commands. Dependencies and installed source backports must pass the gate documented in `docs/DEPENDENCY-SECURITY.md`.

Development tools are separate from the distributed application. Project Expo commands default to a loopback Web server and reject native launch/export and direct tunnel flags. Use `preview:lan` only on trusted networks; anyone on that network may read the served website and assets. Running an upstream CLI directly is outside the project wrapper guard.
