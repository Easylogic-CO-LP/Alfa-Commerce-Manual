---
sidebar_position: 5
title: Documents and tasks
description: "The REST API routes for sales documents, document types and background work (tasks) of Alfa Commerce."
---

# Documents and tasks

<AlfaVersion verified="2.3.0" />

Read [the overview](./overview.md) first. It has the rules every route follows.

## Documents

A document is an invoice, a credit note or another paper issued for an order. Once issued it is never changed and
never deleted. So the API reads a document, draws it, and voids it. Nothing else. Documents are issued by the
shop itself, for example when an order reaches a status that issues one. See
[Documents](../services/documents.md).

| Method and address | What it does |
|---|---|
| `GET v1/alfa/documents` | Lists documents |
| `GET v1/alfa/documents/:id` | Reads one document |
| `GET v1/alfa/documents/:id/html` | The document as the customer receives it, as HTML |
| `GET v1/alfa/documents/:id/pdf` | The same as a PDF |
| `POST v1/alfa/documents/:id/void` | Voids the document |

Filters of the list: `filter[search]`, `filter[doc_type]`, `filter[status]`, `filter[id_order]`, and
`filter[date_start]` and `filter[date_end]`, the document's issue time (UTC), both bounds included (see
[Reading](./overview.md#reading)).

**A list row holds:** `id`, `doc_type`, `status`, `number`, `number_formatted`, `issue_date_local`, `id_order`,
`id_shipment`, `id_corrects`, `buyer_name`, `buyer_vat_number`, `currency_code`, `total_tax_excl`, `total_tax`,
`total_tax_incl`, `authority_state`, `authority_mark`, `series_code`, `created`.

**One record holds also:** `is_combined`, `issue_date`, the buyer's and the seller's details (`buyer_...`,
`seller_...`), `currency`, `conversion_rate`, the transport details (`movement_purpose`, `carrier_name`,
`vehicle_number`, `movement_start`, `ship_from`, `ship_to`), `payment_method_name`, `authority_uid`, `qr_url`,
`note`, `print_note`, `voided_at`, `voided_by`, `void_reason`, `created_by`, `series` (the series' `id`, `code`,
`title`, `prefix` and `branch_code`, in place of the list's `series_code`), and the lists `lines` and `taxes`.

**The PDF** needs the dompdf library (`lib_dompdf`), which ships with Alfa Commerce and is installed with it,
together with the four libraries it needs, so the route works with no extra step. The HTML route does not need it.
If one of them has been removed or disabled, the route answers 503 with a sentence that names the library and says
that the print view shows the document; the notification centre tells the administrators.

**Void.** The only correction of an issued document. The document and its number stay; it is marked void with
your reason. A reason is needed (400 without one, 500 characters at most). Only an issued document can be voided:
a second void is refused with 409, and so is a void of a document that corrective documents not voided name (void
those first). The token's user needs the documents' Change State permission.

```json
{"reason": "Issued to the wrong customer"}
```

A shop needs a document series before any document can be issued. A fresh installation has none, so the list is
empty there:

```json
{"links": {"self": ".../v1/alfa/documents?filter[id_order]=1"}, "data": [], "meta": {"total-pages": 0}}
```

With a series in place, an invoice issued by a status change reads like this in the list (shortened):

```json
{
  "type": "documents",
  "id": "1",
  "attributes": {
    "id": 1, "doc_type": "core.invoice", "status": 1, "number": 1, "number_formatted": "INV-000001",
    "issue_date_local": "2026-11-13", "id_order": 2, "currency_code": "EUR", "buyer_name": "Maria Example",
    "total_tax_excl": "24.40", "total_tax": "0.00", "total_tax_incl": "24.40", "series_code": "A"
  }
}
```

After a void, `status` is 2 and `voided_at`, `voided_by` and `void_reason` are filled. Two refusals of a void:

```json
{"errors":[{"title":"reason is required to void a document","code":400}]}
```

```json
{"errors":[{"title":"DocumentIssuer: void failed: document #1 is not issued; only issued documents can be voided.","code":409}]}
```

## Document types

Read only: `GET v1/alfa/documenttypes` and `GET v1/alfa/documenttypes/:id`. A document type says what kind of
paper a document is. Plugins can add types (see [Document events](../events/document-events.md)); the API only
reads them.

**A list row holds:** `id`, `alias`, `name`, `family`, `quantity_pool`, `shows_prices`, `movement_mode`,
`requires_original`, `requires_buyer_tax_id`, `stock_effect`, `icon`, `color`, `ordering`, `state`, `is_core`.

**One record holds also:** `corrects`, `default_layout`, `provider`, `provider_version`, and with
`include=translations` its `translations`.

The invoice of a fresh installation has the alias `core.invoice`.

## Tasks

A task is one piece of background work that a save left for later: an e-mail to send, a document to issue, a
price index to rebuild. See [Background work](../architecture/background-work.md) for how tasks work. The API
shows them in two places.

**In the answer of a write.** `meta.tasks` lists the work the request left, each with its state and its own
address (shortened):

```json
{
  "meta": {
    "tasks": [{
      "id": 3, "type": "single", "handler": "order.entitlements", "owner": "com_alfa",
      "scope": "order:1", "state": "done", "percent": 100, "merged": false,
      "links": {"self": "https://your-shop.example/api/index.php/v1/alfa/tasks/3"}
    }]
  }
}
```

`type` is `single` for one small piece of work that belongs to one record, and `job` for long work over many
records.

**On routes of their own:**

| Method and address | What it does | Who may |
|---|---|---|
| `GET v1/alfa/tasks` | Lists tasks. Filters: `filter[state]`, `filter[type]`, `filter[owner]`. `page[limit]` is 100 at most. | Users with the Tools permission |
| `GET v1/alfa/tasks/:id` | Reads one task | The user who caused it; for a single of an order, a user with Orders: View; for any other task, a user with the Tools permission |
| `POST v1/alfa/tasks/:id/process` | Works on a job for up to 2 seconds | Users with the Tools permission |

A task you may not read answers 404, the same as a task that does not exist, so the API never reveals that a
task is there.

**A task holds:** `id`, `type`, `handler`, `owner`, `scope`, `state`, `done_units`, `total_units`, `percent`,
`run_after`, `created_at`, `started_at`, `finished_at`, `updated_at`, `origin`, `last_error`, `result`.

**Waiting for a job.** Call `process` until the job no longer waits:

```mermaid
sequenceDiagram
    participant C as Your program
    participant A as Alfa Commerce
    C->>A: POST v1/alfa/items (a new price)
    A->>C: 201, meta.tasks names job 2
    loop until the answer is 200
        C->>A: POST v1/alfa/tasks/2/process
        A->>C: 202 with Location and Retry-After 5 (still working)
    end
    A->>C: 200 with the task (no longer pending or running)
```

You do not have to call `process`. The shop does its background work by itself, as described in
[Background work](../architecture/background-work.md). `process` is for a program that wants to wait for the
result.

Only a job can be processed:

```json
{"errors":[{"title":"Only a job can be processed; a single runs after the save that wrote it.","code":409}]}
```

The API has no route that creates a task: tasks are left by the shop's own saves, and by a plugin that owes
background work of its own (see
[Background work of a plugin](../plugins/api-route-plugins.md#background-work-of-a-plugin)).

## Not documented yet

- The fields of a document's `lines`, `taxes` and `series` one by one.
- The values of a task's `state`, `handler` and `origin`. See
  [Background work](../architecture/background-work.md) for the states.
- An example of a 202 answer. A job that has finished when `process` is called answers 200; a job still working
  answers 202 with `Location` and `Retry-After`.
