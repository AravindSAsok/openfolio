# Security Policy

## Supported versions

Security fixes are provided for the current default branch.

## Reporting a vulnerability

Please do not publish exploitable vulnerabilities, credentials, personal data, or token material in public issues. Use GitHub's private vulnerability reporting feature for this repository when enabled. If private reporting is unavailable, contact the repository owner privately through GitHub.

## Security expectations

- Never commit .dev.vars, .env, OAuth secrets, tokens, encryption keys, or production database credentials.
- Rotate any secret that is accidentally exposed.
- Keep dependencies updated and review security advisories.
- Privately report suspected account isolation, stored XSS, OAuth, token encryption, or data deletion defects.