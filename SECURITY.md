# Security Policy

## Scope

This repository primarily hosts community documentation and shared GitHub templates. Vulnerabilities in software maintained in **other** SNNCommunity repositories should be reported according to the security policy of the affected repository.

## Reporting a vulnerability

**Do not post credentials, private exploits, personal data, or sensitive vulnerability details in public issues, pull requests, or discussions.**

1. Check the relevant repository's **Security** tab for a **Report a vulnerability** option (GitHub private vulnerability reporting), if enabled.
2. If unavailable, submit a **minimal public issue requesting a private reporting channel**, without describing the vulnerability or sharing any sensitive information.
3. For GitHub platform security incidents or account compromise, follow [GitHub security guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure).

A dedicated private email address and response-time commitment have **not yet been established** for this community. Do not treat a public issue as a confidential reporting channel.

## Safe contribution practices

- Use least-privilege GitHub tokens and scoped repository permissions.
- Do not commit secrets, private research data, or confidential checkpoints.
- Avoid running untrusted external pull-request code on privileged runners.
- Review new third-party dependencies, licenses, and GitHub Actions.
- Prefer pinned dependencies and documented, reproducible build environments.

## Disclosure

Please coordinate public disclosure of project-specific vulnerabilities after maintainers have had a reasonable opportunity to investigate. Security reports are not a guarantee of immediate response or acceptance.
