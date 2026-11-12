---
sidebar_position: 3
title: Customers and configuration
description: "The REST API routes for customers, customer groups, currencies, taxes, discounts, cart rules, places, payment and shipping methods, form fields and stock in Alfa Commerce 2.2.0."
---

# Customers and configuration

<AlfaVersion verified="2.2.0" />

Read [the overview](./overview.md) first. It has the rules every route follows.

Every resource on this page has the five standard routes, except stock movements, which can only be listed. For
each resource this page gives a body that creates a record, the fields a read returns, and what is special.

Where a body below has `name_en_gb`, send the name in your site's default language, and again with every change.

## Customers

`v1/alfa/users`. A customer is Alfa Commerce's own row for a Joomla user. Alfa Commerce makes that row by itself
for every new Joomla user, so a create is needed only for a user that has none.

```json
{"id_user": 248, "note": "VIP customer"}
```

**A list row holds:** `id`, `id_user`, `note`, `username`, `email`, `joomla_name`, `lastvisitDate`.

**One record holds:** `id`, `id_user`, `note`, `joomla_name`, `joomla_username`, `joomla_email`.

A customer has no state, so it cannot be moved to the trash. Deleting the row leaves the Joomla user. To create or
remove the Joomla user itself, use Joomla's own route `v1/users`.

In 2.2.0 a create also accepts a user id that does not exist. See
[Known defects](./overview.md#known-defects-in-220), row 5.

## Customer groups

`v1/alfa/usergroups`. A customer group is a Joomla user group with Alfa Commerce's price settings on it. Alfa
Commerce makes the row by itself for every new Joomla group.

**`prices_display` must be in the body of every write** (known defect, row 6). Read the record, change what you
mean to change, and send the whole object back:

```json
{
  "usergroup_id": 10,
  "prices_enable": "0",
  "prices_display": {
    "base_price_show": "0",
    "base_price_show_label": "0",
    "base_price_with_discounts_show": "0",
    "base_price_with_discounts_show_label": "0",
    "discount_amount_show": "0",
    "discount_amount_show_label": "0",
    "tax_amount_show": "0",
    "tax_amount_show_label": "0",
    "base_price_with_tax_show": "0",
    "base_price_with_tax_show_label": "0",
    "final_price_show": "0",
    "final_price_show_label": "0",
    "price_breakdown_show": "0"
  }
}
```

**A list row holds:** `id`, `usergroup_id`, `prices_enable`, `core_title`.

**One record holds:** `id`, `usergroup_id`, `prices_enable`, `prices_display`, `name`.

## Currencies

`v1/alfa/currencies`. `code` is the three-letter code and is unique in the shop.

```json
{
  "name": "Test coin",
  "code": "TST",
  "number": 999,
  "symbol": "¤",
  "decimal_separator": ",",
  "thousand_separator": ".",
  "decimal_place": "2",
  "format_pattern": "{number} {symbol}",
  "state": 0
}
```

**A record holds, in a list and alone:** `id`, `name`, `code`, `number`, `symbol`, `decimal_place`,
`decimal_separator`, `thousand_separator`, `format_pattern`, `state`, `ordering`.

A fresh installation comes with a list of currencies. In it the euro has the id 47.

## Taxes

`v1/alfa/taxes`. The rate is exact decimal text.

```json
{"name_en_gb": "Tax 24%", "value": "24", "behavior": "0", "state": 0}
```

**A list row holds:** `id`, `name`, `value`, `behavior`, `state`, `ordering`, `publish_up`, `publish_down`.

**One record holds also:** `desc`, `categories`, `manufacturers`, `places`, `users`, `usergroups`, `translations`.

**Related lists you can send:** `categories`, `manufacturers`, `places`, `users`, `usergroups`. They limit where
the tax applies.

A change that alters prices leaves work for the price index, listed in the answer's `meta.tasks`.

Reading a tax that does not exist answers 500 in 2.2.0 (known defect, row 1).

## Discounts

`v1/alfa/discounts`.

```json
{
  "name_en_gb": "10% off",
  "value": "10",
  "is_amount": 0,
  "behavior": 0,
  "apply_before_tax": 0,
  "operation": 0,
  "state": 0
}
```

**A list row holds:** `id`, `name`, `value`, `is_amount`, `behavior`, `apply_before_tax`, `state`, `ordering`,
`publish_up`, `publish_down`.

**One record holds also:** `name_customer`, `categories`, `manufacturers`, `places`, `users`, `usergroups`,
`translations`.

**Related lists you can send:** `categories`, `manufacturers`, `places`, `users`, `usergroups`.

Reading a discount that does not exist answers 500 in 2.2.0 (known defect, row 1).

## Cart rules

`v1/alfa/cartrules`. A cart rule is a promotion applied in the cart. `code` is unique in the shop; a rule without
a code applies by itself.

```json
{"name_en_gb": "Summer offer", "code": "SUMMER", "discount_class": "order", "state": 0}
```

**A list row holds:** `id`, `name`, `code`, `discount_class`, `action`, `action_value`, `priority`, `highlight`,
`usage_limit_total`, `used_count`, `state`, `publish_up`, `publish_down`.

**One record holds also:** `name_customer`, `description`, `max_discount_amount`, `discount_base`,
`exclude_discounted`, `overridden_lines`, `min_amount`, `min_amount_tax_incl`, `min_amount_base`,
`combines_product`, `combines_order`, `combines_shipping`, `usage_limit_per_user`, `created`, `modified`,
`allowedUsers`, `allowedUserGroups`, `groups`, `translations`.

**Related lists you can send:** `allowedUsers`, `allowedUserGroups`, `groups`.

A cart rule is published or unpublished. It has no trash: `state` -2 is refused with 400, and the rule is deleted
directly. Reading a cart rule that does not exist answers 500 in 2.2.0 (known defect, row 1).

## Places

`v1/alfa/places`. A place is a country, a region inside it or a town, in one tree.

```json
{"name": "Testland", "code2": "QZ", "code3": "QZL", "state": 0}
```

**A list row holds:** `id`, `name`, `code2`, `code3`, `currency_id`, `currency_name`, `parent_id`, `state`,
`ordering`.

**One record holds:** the same without `currency_name`.

## Payment methods

`v1/alfa/paymentmethods`. A payment method is the record a shopper picks at checkout. `type` is the element of
the payment plugin that does the work. See [Payment plugins](../plugins/payment-plugins.md).

```json
{
  "name_en_gb": "Bank transfer",
  "type": "standard",
  "state": 0,
  "show_on_product": 1,
  "color": "rgba(0, 0, 0, 1)",
  "bg_color": "rgba(214, 214, 214, 1)"
}
```

Send `color` and `bg_color`, or the create fails (known defect, row 6).

**A list row holds:** `id`, `name`, `type`, `color`, `bg_color`, `show_on_product`, `ordering`, `state`.

**One record holds also:** `categories`, `manufacturers`, `places`, `users`, `usergroups`, `translations`.

**Related lists you can send:** `categories`, `manufacturers`, `places`, `users`, `usergroups`. They limit where
the method is offered.

Deleting a method that an order used answers 204 and keeps the method (known defect, row 2).

The payments of one order are not here. They are under the order: see
[Orders](./orders.md#payments).

## Shipping methods

`v1/alfa/shipmentmethods`. As payment methods, with one more field: `price_entry_mode` says whether the method's
prices were typed with tax (`tax_included`) or without (`tax_excluded`).

```json
{
  "name_en_gb": "Standard delivery",
  "type": "standard",
  "price_entry_mode": "tax_included",
  "state": 0,
  "show_on_product": 1,
  "color": "rgba(0, 0, 0, 1)",
  "bg_color": "rgba(214, 214, 214, 1)"
}
```

**A list row holds:** `id`, `name`, `type`, `color`, `bg_color`, `show_on_product`, `price_entry_mode`,
`ordering`, `state`.

**One record holds also:** `categories`, `manufacturers`, `places`, `users`, `usergroups`, `taxes`,
`translations`.

## Form fields

`v1/alfa/formfields`. A form field is a field of the customer's details at registration and checkout. `type` is
the element of the form field plugin. `field_name` is unique in the shop. Both `name` and `field_label` are
needed in the default language. See [Form field plugins](../plugins/form-field-plugins.md).

```json
{
  "name_en_gb": "Phone",
  "field_label_en_gb": "Phone",
  "field_name": "phone_2",
  "type": "tel",
  "state": 0
}
```

**A list row holds:** `id`, `group_id`, `field_name`, `name`, `type`, `required`, `registration`, `billing`,
`shipping`, `unique`, `ordering`, `state`, `group_title`.

**One record holds also:** `field_label`, `field_description`, `users`, `usergroups`, `translations`.

**Related lists you can send:** `users`, `usergroups`.

## Form field groups

`v1/alfa/formfieldgroups`.

```json
{"title_en_gb": "Contact details", "state": 0}
```

**A list row holds:** `id`, `title`, `description`, `ordering`, `state`, `field_count`.

**One record holds:** `id`, `title`, `description`, `ordering`, `state`, `translations`.

## Stock locations

`v1/alfa/locations`.

```json
{"title": "Warehouse", "location_type": "physical", "state": 0}
```

**A list row holds:** `id`, `title`, `name`, `location_type`, `capabilities`, `kind`, `is_default`, `state`,
`ordering`, `stock_units`, `stock_physical`, `stock_reserved`.

**One record holds also:** `owner_type`, `owner_id`, `created`, `created_by`, `modified`, `modified_by`,
`translations`.

## Stock movements

`GET v1/alfa/inventorymovements`. One route, a list. A stock movement is one recorded change of stock. Movements
are never changed or deleted: a correction is a new movement in the other direction, so there is nothing to write
here.

Filters: `filter[search]`, `filter[movement_type]`, `filter[location_id]`.

**A row holds:** `id`, `item_id`, `combination_id`, `location_id`, `qty_change`, `movement_type`, `source_type`,
`source_id`, `source_line_id`, `transfer_id`, `operation_id`, `correlation_id`, `note`, `created`,
`location_title`, `item_sku`, `name`.

See [Stock](../services/stock.md) for what the movements mean.

## Not documented yet

- The meaning and the allowed values of fields such as `behavior`, `operation`, `discount_class`, `action` and
  `location_type`. They are the values of the administrator form of the same record.
- The filters of each list, except those of stock movements.
