---
sidebar_position: 9
title: Order-Status Emails
---

# Order-Status Emails

When an order changes status, Alfa Commerce can email the customer and/or staff. Each email is **assembled, not
hardcoded** — you pick a layout, fill per-language content blocks ("positions") on the order status, and `{tokens}` are
substituted at send time.

## How it works

- **Layout** — each status has two layout selections (customer + admin email), chosen with the **Email layout** picker.
  Layouts are PHP files under `layouts/emails/order/` (the shipped one is `default`). The layout sets the visual frame
  and which content slots exist.
- **Positions** — a layout requests named slots via `$position('intro')` / `$hasPosition('legal')` (the default asks for
  `header`, `intro`, `outro`, `legal`). The composer auto-discovers them and shows one WYSIWYG editor per slot, **per
  installed language**, with a Subject field above.
- **Structural blocks** — items, totals, payments and shipments are rendered by the layout via
  `$render('emails.partials.order_items')` etc. — not editor slots; in the composer they're read-only with a show/hide toggle.
- **Tokens** — a palette inserts `{order_number}`, `{order_total}`, `{status_customer}`, `{user_name}`, `{site_name}`,
  one `{field_<name>}` per form field, etc. Substitution is a single central pass over the finished HTML, so tokens
  resolve in admin content, partials, and layout text alike.
- **Preview / test** — once saved, **Preview** and **Send test** render against the latest real order.
- **Storage** — per-language content lives as JSON in `#__alfa_orders_statuses_<langtag>`.

## Customizing

- **Content:** on the order status, pick a layout, then author the Subject + each position per language and toggle the
  structural blocks. Customer and admin emails are configured independently.
- **Re-skin the frame:** copy `layouts/emails/order/default.php` to
  `templates/<admin-template>/html/layouts/com_alfa/emails/order/default.php` — picked up automatically.
- **New layout variant:** drop `emails/order/<name>.php` (component or admin-template path); it appears in the picker,
  and the positions it requests drive the composer. Override `emails/partials/order_*.php` to restyle the
  items/totals/payments/shipments tables.

> Reference: `OrderEmailHelper`, `OrderStatusEmailLayoutField`, `EmailPositionsField`, `layouts/emails/`.
