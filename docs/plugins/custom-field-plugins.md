---
sidebar_position: 4
title: Building Custom Field Plugins
---

# Building Custom Field Plugins

Custom field plugins add new form field types to Alfa Commerce. They can be used in checkout forms, product detail pages, and user profiles.

## Built-in Field Types

| Plugin | Type | Description |
|--------|------|-------------|
| `text` | `alfa-fields` | Single-line text input |
| `textarea` | `alfa-fields` | Multi-line text input |

## Creating a Custom Field Plugin

### Plugin Structure

```
plugins/alfa-fields/yourfield/
├── yourfield.xml
├── services/provider.php
├── src/Extension/YourField.php
└── language/en-GB/
    ├── plg_alfa-fields_yourfield.ini
    └── plg_alfa-fields_yourfield.sys.ini
```

### Manifest

```xml title="yourfield.xml"
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa-fields" method="upgrade">
    <name>PLG_ALFA_FIELDS_YOURFIELD</name>
    <author>Your Name</author>
    <version>1.0.0</version>

    <namespace path="src">Joomla\Plugin\AlfaFields\YourField</namespace>

    <files>
        <folder plugin="yourfield">services</folder>
        <folder>src</folder>
    </files>

    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa-fields_yourfield.ini</language>
        <language tag="en-GB">en-GB/plg_alfa-fields_yourfield.sys.ini</language>
    </languages>
</extension>
```

### Plugin Class

```php title="src/Extension/YourField.php"
<?php
namespace Joomla\Plugin\AlfaFields\YourField\Extension;

\defined('_JEXEC') or die;

use Alfa\Component\Alfa\Administrator\Plugin\FieldsPlugin;

final class YourField extends FieldsPlugin
{
    /**
     * Render the field HTML.
     */
    public function onPrepareField($event): void
    {
        $field = $event->getField();

        // Generate your custom HTML
        $html = sprintf(
            '<input type="color" name="%s" value="%s" class="form-control" %s />',
            htmlspecialchars($field->name),
            htmlspecialchars($field->value ?? '#000000'),
            $field->required ? 'required' : ''
        );

        $event->setHtml($html);
    }
}
```

## Field Metadata

Custom fields are defined in the admin panel and stored in `#__alfa_customs`:

| Column | Description |
|--------|-------------|
| `name` | Field identifier |
| `label` | Display label |
| `description` | Help text |
| `type` | Plugin type (matches plugin group) |
| `context` | Where the field appears (cart, item, user) |
| `required` | Whether the field is required |
| `params` | JSON configuration |
