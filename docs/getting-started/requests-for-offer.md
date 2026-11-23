---
sidebar_position: 2.5
title: A catalogue with requests for offer
description: A shop whose customers ask for an offer instead of paying a listed price, built from Options, a language override and a free shipping method; staff price the order and send the payment link.
---

# A catalogue with requests for offer

<AlfaVersion verified="2.3.0" />

Some shops do not sell at a listed price. The customer chooses products and quantities and asks for an offer; the shop
prices the request and the customer pays the offer. Alfa Commerce does this with the ordinary cart and checkout and a
few settings. There is no separate mode: the request is an order with nothing to collect, which staff price in the
order screen.

What the customer sees: the products with their details and no price, a button that reads **Request an offer**, a cart
that lists the products and their quantities, and a checkout that sends the request. What the shop gets: an order in a
status of its own, with that status's e-mails.

## The products: a price of 0,00

Give each product a price row of **0,00**. A price of zero is a price: the product can be added to the cart and
ordered, and the order's total is zero. A product with no price row at all cannot be added to the cart; see
[Products without a price](#products-without-a-price).

## The Options

All of them are in **Options**, **Cart**.

| Where | Setting | For requests for offer |
|---|---|---|
| **Checkout** | **Zero price display** | **Hide**, or **Show "Call for price"** |
| **Checkout** | **Products without a price show** | **Show "Call for price"** (the default) or **Nothing** |
| **Checkout** | **Order status when nothing is to be collected** | The status a request lands in, such as a status you name **Request for offer** |
| **The cart shows** | **Line price**, **Subtotal**, **Shipping**, **Tax**, **Total** | All five hidden |
| **The cart shows** | **Coupon field** | Hidden |

### Zero price display

How a price of zero reads for the customer, wherever a price is printed: on a product's page and its catalogue cards
(the items module and the related products included), a line's price and total in the cart, the cart module and the
added-to-cart card, the subtotal and the total, the order's page after the checkout, the order e-mails (the lines, the
total and the `{order_total}` tag) and the printed documents (the lines and the totals).

- **Show the amount (0,00)**: the amount, as for any price. The default.
- **Hide**: nothing where the price would be. A subtotal or a total of zero has no row.
- **Show "Call for price"**: the text of the language string `COM_ALFA_PRICE_ON_REQUEST`, which you can word your
  own way (see [The words](#the-words)).

Tax, shipping, fees and discounts print their amounts as they are. Only the printing changes: the price stays zero in
the cart, the order, the payments and the REST API, which returns 0.

### Products without a price

A product with no price for the customer (no price row applies to their currency, country and customer group, or the
shop shows its catalogue only) cannot be added to the cart. **Products without a price show** decides what its page
and its cards show where the price would be: the text of `COM_ALFA_PRICE_ON_REQUEST`, or nothing. It is a setting
apart from **Zero price display** because such a product cannot be bought, while a product at 0,00 can.

### The cart shows

Five switches decide which amounts the cart page with its checkout summary, the cart module and the added-to-cart card
show:

| Switch | What it shows |
|---|---|
| **Line price** | Each line's price, discount and total |
| **Subtotal** | The subtotal row and the discount row under it, and how far the cart is from a cart rule's minimum amount |
| **Shipping** | The shipping row |
| **Tax** | Each line's tax and the tax row |
| **Total** | The total row, with the fee rows and the cart rule rows that lead to it |

With all five hidden the cart lists its products and their quantities, with the quantity controls and the remove
button. The order keeps every amount: its page after the checkout, its e-mails and its documents show them (a zero
amount as **Zero price display** says).

### Coupon field

Hidden, the cart and the checkout have no field for a coupon code, and the storefront takes no code: a code sent all
the same is refused with the sentence "This shop does not take coupon codes." Cart rules that apply by themselves
still apply, and a code the cart already holds keeps its remove button. The order builder in the administrator takes
codes as always.

### Order status when nothing is to be collected

The status an order takes when it is placed with a total of zero. Create the status first, in **Order statuses**: give
it a name such as **Request for offer** and the e-mails the customer and your staff receive for it, the
acknowledgement of the request among them. Nothing is due on a request, so it is paid: a status that requires payment
takes it, and that status's **Allow unpaid exception** plays no part (the exception is for orders with money due). Left
on **The initial status, as every other order**, a request lands where every order lands.

An order paid in full with the customer's credit is not such an order: its total is not zero, and it lands in the
initial status.

## The words

The storefront's texts come from language strings, and Joomla's **Language Overrides** change them for your site
without touching a file: **System**, **Language Overrides**, choose the language and **Site**, then **New**, search for
the string and write your text.

| String | Its text | For requests for offer |
|---|---|---|
| `COM_ALFA_CART_ADD_TO_CART` | Add to cart | Request an offer |
| `COM_ALFA_CART_HEADING` | Your Cart | Your request |
| `COM_ALFA_BUTTON_PLACE_ORDER` | Place Order | Send the request |
| `COM_ALFA_ORDER_COMPLETED_MESSAGE` | Thank you for your purchase | Thank you for your request |
| `MOD_ALFA_CART_COMPLETE_ORDER_BUTTON` | Complete Order | Send the request |
| `COM_ALFA_PRICE_ON_REQUEST` | Call for price | Price on request, or your phone number |

The order e-mails and the printed documents read the administrator's language, so make the override of
`COM_ALFA_PRICE_ON_REQUEST` for **Administrator** as well. Make each override in every language the site speaks.

## Shipping: a free method by arrangement

The request carries no shipping cost. Create a shipping method in **Shipping methods** with the Standard plugin, name
it **By arrangement** and set no cost on it: it charges nothing, so the request's total stays zero. The delivery and
its cost, if any, are part of the offer you write.

## Payment: a gateway that can be paid later

At the checkout the customer still chooses a payment method; with nothing to collect, nothing is charged. Offer the
online payment method you want the offer paid with. **Pay now** and **Send payment link** work only with a gateway
that can open a new payment for an order that already exists, which its plugin declares; core's Standard method (cash on delivery, a bank
transfer) is paid outside the shop and never shows **Pay now**: you record its payment by hand.

## What staff do next

1. The request arrives in the status you chose, with that status's e-mails, and a new order alert in the notification
   centre.
2. Open the order. For each line, open the line and in **Price** choose **Set a custom unit price**, then enter the
   price you offer. The order's total, its tax and its documents follow the prices you set.
3. The order now owes its new total. Its payments panel shows the balance due, and the order reads as awaiting
   payment, on the order screen and on the customer's order page.
4. Move the order to the status that means the offer is sent, if you have one, and press **Send payment link** in the
   order's payments panel. The customer receives the order e-mail with **Pay now**, the link to the order's payment
   step; the order's page in their account and the page they reached after the checkout show **Pay now** too. Nothing
   is paid from the administrator.
5. The customer pays through the gateway. The payment is recorded on the order, and the gateway's status settings
   move the order as for any paid order.

The customer pays the same order: nothing is placed again, no stock moves and no second confirmation e-mail is sent.

## In short

| Step | Where |
|---|---|
| Products at 0,00 | Each product's prices |
| Prices hidden or "Call for price" | **Options**, **Cart**, **Zero price display** |
| A cart without amounts | **Options**, **Cart**, **The cart shows** |
| No coupon field | **Options**, **Cart**, **Coupon field** |
| The request's status | **Order statuses**, then **Options**, **Cart**, **Order status when nothing is to be collected** |
| Request an offer | **Language Overrides**, `COM_ALFA_CART_ADD_TO_CART` |
| Free shipping | A Standard shipping method with no cost |
| Pricing and the payment link | The order screen: each line's **Price**, then **Send payment link** |
