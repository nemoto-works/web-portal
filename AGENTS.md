# Nemoto Works web portal

This public repository hosts the Nemoto Works website and its public LAB prototypes.

## Factory scope

- Automated implementation is limited to `lab/<app-slug>/` and the matching LAB index entry.
- Never edit the main marketing site, contact/privacy pages, account settings, deployment settings, sales, payments, or releases without explicit owner approval.
- Never include secrets, personal information, private URLs, or licensed assets without documented rights.
- Keep prototypes dependency-light, mobile-first, and usable without login unless the issue explicitly requires otherwise.
- Run `node scripts/validate-lab.mjs` before handing off a change.
- Open a draft pull request. Do not merge it. The owner reviews a working LAB URL and chooses GO / revise / hold.
- When a LAB app graduates to a dedicated public repository, add its public URL to the production app list, remove its LAB card in the same release, replace the old route with a `data-lab-graduated` redirect page, and continue development only in the dedicated repository.

## Code review rules

- Reject changes outside `lab/`, `scripts/validate-lab.mjs`, and factory metadata unless the issue explicitly authorizes them.
- Flag any credential, personal data, external write, payment, tracking, or unapproved network dependency.
- Require a clear mobile test path and truthful test evidence in the pull request.
