# Development rules

Follow `CONTRIBUTING.md` and `docs/ARCHITECTURE.md` for development commands, architecture and compatibility requirements.

Keep this repository focused on application code, assets, tests and concise documentation that helps people use or maintain the project.

- Do not create per-task plans, iteration reports, development diaries, agent handoffs, conversation or prompt dumps, or persistent task-state files unless the user explicitly requests them.
- Report progress, verification results and unfinished work in the conversation. Use Git commits for change history.
- When lasting behaviour or architecture changes, update the relevant existing documentation. Avoid duplicating instructions across new documents.
- Put necessary temporary outputs, screenshots and validation logs in ignored `artifacts/` or `.cache/` directories. Do not force-add ignored process files.
- Preserve recipe and image provenance, licence records, production assets and fixtures required by tests. These are maintained project inputs.
- Review the changed file list and check whitespace before finishing. Preserve unrelated existing changes.

Keep this file short and limited to lasting development rules; do not append task history.
