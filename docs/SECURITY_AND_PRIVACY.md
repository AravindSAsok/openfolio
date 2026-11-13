# Security and privacy

## Data collected

Openfolio stores the GitHub numeric user ID, login, public name/avatar/bio, user-entered portfolio content, imported public repository metadata, hashed session identifiers, encrypted OAuth tokens, and sync history.

## GitHub access

The OAuth flow requests read:user only. Repository import calls the public user repositories endpoint and filters out any record where private is not false. Openfolio does not write to GitHub.

## Token handling

OAuth tokens are encrypted with AES-GCM using a 256-bit key supplied as a Worker secret. Raw tokens are not returned to the browser. Session IDs are random opaque values; only SHA-256 digests are stored in D1. Never log credentials or cookies.

## Published information

Only portfolio content that the owner chooses to publish is rendered publicly. Email is not exposed by default. A user can unpublish their page.

## Retention and deletion

Users can export JSON containing their portfolio and imported repository data. Account deletion removes the user and related D1 records through foreign-key cascades and attempts to remove the user's R2 object prefix.

## External providers and limitations

Hosted Openfolio uses GitHub and Cloudflare. Self-hosters operate their own provider accounts and should adapt their privacy disclosures. This document describes the current implementation; it is not a formal security audit or legal privacy policy.