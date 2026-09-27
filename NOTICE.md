# Notice of modification

**StockLens** is a modified version of **OpenStock**.

- Original work: OpenStock, © Open Dev Society and contributors
  https://github.com/Open-Dev-Society/OpenStock
- Modified work: StockLens, © NextG Infosoft
  Source: https://github.com/nextginfosoft/OpenStock
  Running at: https://stocklense.nextginfosoft.com

Both the original and this modified version are licensed under the
GNU Affero General Public License v3.0. The full license text is in [LICENSE](./LICENSE).
Because StockLens is offered to users over a network, its complete source code is
available to every user through the "Source code" links on the site and in the app
(AGPL-3.0, section 13).

## Changes made (2026-09-26)

Based on OpenStock at upstream commit `87df76a`.

- Renamed the product from OpenStock to StockLens: app name, page titles, metadata,
  emails, docs and package name. Added a new StockLens logo (`components/Logo.tsx`)
  and favicon (`app/icon.svg`).
- Site URL and support email are now set in `lib/constants.ts`
  (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`).
- "Source code" links now point to the StockLens repository. Credit to OpenStock and
  Open Dev Society is kept in the site footer, sign-in pages, About page, emails and README.
- Removed the upstream sponsorship features: the `/sponsor` page, donate popup,
  sponsor band, sidebar sponsor slots and `.github/FUNDING.yml`.
- Removed the "OpenStock Cloud" paid-tier upsell. Price alerts still work in
  realtime mode (`NEXT_PUBLIC_OPENSTOCK_DATA_MODE=realtime`).
- Removed the GitHub star/fork counters for the upstream repository.
- Replaced the Open Dev Society founder testimonial on the sign-in screen with a product tagline.
- Rewrote the landing, About and Help pages for StockLens.

## Changes made (2026-09-26, later)

- Removed license wording and "open source" mentions from the site pages, and the
  self-host section of the landing page. The site keeps the "Built on OpenStock by
  Open Dev Society" credit and a "Source code" link in the footer and app sidebar.

## Changes made (2026-09-27)

- Welcome email: styled the plain-text intro so it is readable, HTML-escaped the user's name,
  and replaced the OpenStock dashboard screenshot with a StockLens one.
- Background jobs: only the welcome email is registered with Inngest; the weekly digest runs only
  when Kit is configured, and the unfinished inactive-user job is disabled.
- Dependencies updated to clear all npm audit findings.

The Terms of Service page (`app/(marketing)/terms`) and `LICENSE` are unchanged.
