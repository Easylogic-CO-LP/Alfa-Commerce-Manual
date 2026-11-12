---
title: A complete item field plugin
description: "A complete minimal item field plugin for Alfa Commerce 2.2.0, file by file."
---

# A complete item field plugin

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Item field plugins](./item-field-plugins.md): the guide itself
- [Item field plugin events](./item-field-plugin-events.md)
- [A complete item field plugin](./item-field-plugin-example.md)

This plugin adds a type named `picker`. It draws a field as radio buttons on the item page, for a variant field
and for an option, and nothing else. It is the shipped `choice` plugin reduced to one layout: every call in it
is one that `choice` makes. Every file is printed in full.

`plugins/alfa-item-fields/picker/picker.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa-item-fields" method="upgrade">
    <name>PLG_ALFA_ITEM_FIELDS_PICKER</name>
    <author>Acme</author>
    <creationDate>2026-11-12</creationDate>
    <copyright>(C) 2026 Acme</copyright>
    <license>GNU General Public License version 3 or later; see LICENSE</license>
    <version>1.0.0</version>
    <description>PLG_ALFA_ITEM_FIELDS_PICKER_XML_DESCRIPTION</description>
    <namespace path="src">Acme\Plugin\AlfaItemFields\Picker</namespace>
    <files>
        <folder plugin="picker">services</folder>
        <folder>src</folder>
        <folder>tmpl</folder>
    </files>
    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa-item-fields_picker.ini</language>
        <language tag="en-GB">en-GB/plg_alfa-item-fields_picker.sys.ini</language>
    </languages>
</extension>
```

`plugins/alfa-item-fields/picker/services/provider.php`

```php
<?php

defined('_JEXEC') or die;

use Acme\Plugin\AlfaItemFields\Picker\Extension\Picker;
use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;

return new class () implements ServiceProviderInterface {
    public function register(Container $container): void
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new Picker(
                    (array) PluginHelper::getPlugin('alfa-item-fields', 'picker'),
                );
                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            },
        );
    }
};
```

`plugins/alfa-item-fields/picker/src/Extension/Picker.php`

```php
<?php

namespace Acme\Plugin\AlfaItemFields\Picker\Extension;

defined('_JEXEC') or die;

use Alfa\Component\Alfa\Administrator\Event\ItemFields\ItemViewEvent;
use Alfa\Component\Alfa\Administrator\Plugin\ItemFieldsPlugin;

final class Picker extends ItemFieldsPlugin
{
    // Declared by having the method: the base class reports it to Alfa.
    public function onItemView($event): void
    {
        if (!$event instanceof ItemViewEvent) {
            return;
        }

        $field = $event->getField();
        $item = $event->getItem();
        $fieldId = (int) $field->id;
        $variant = $item->variant ?? null;

        // A variant field: one dimension of the item's combinations.
        if ($variant && in_array($fieldId, $variant->variantFieldIds ?? [], true)) {
            $event->buyForm()
                ->setLayout('item-radio')
                ->variantSelector($fieldId)
                ->setData([
                    'field' => $field,
                    'values' => $field->values ?? [],
                    'selected' => (int) ($variant->selection[$fieldId] ?? 0),
                    'available' => $variant->availableValueIds[$fieldId] ?? [],
                ]);

            return;
        }

        // An informational field has nothing to choose. This plugin does not draw it.
        if (!empty($field->informational)) {
            return;
        }

        // An option: only the values this item offers as extras.
        $offered = [];

        foreach ($item->options ?? [] as $option) {
            $offered[(int) $option->value_id] = true;
        }

        $values = [];

        foreach ($field->values ?? [] as $value) {
            if (isset($offered[(int) $value->id])) {
                $values[] = $value;
            }
        }

        if ($values === []) {
            return;
        }

        $chosen = array_flip(array_map('intval', $item->selectedOptionValueIds ?? []));
        $selected = 0;
        $available = [];

        foreach ($values as $value) {
            $available[(int) $value->id] = true;

            if ($selected === 0 && isset($chosen[(int) $value->id])) {
                $selected = (int) $value->id;
            }
        }

        $event->buyForm()
            ->setLayout('item-radio')
            ->optionSelector($fieldId)
            ->setData([
                'field' => $field,
                'values' => $values,
                'selected' => $selected,
                'available' => $available,
            ]);
    }
}
```

`plugins/alfa-item-fields/picker/tmpl/item-radio.php`

```php
<?php

defined('_JEXEC') or die;

// $field, $values, $selected and $available come from setData().
// $inputName and $reloadScope are added by Alfa for the declared selector.
extract($displayData);

$esc = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
?>
<div class="variant-field">
    <span class="variant-field-label"><?php echo $esc($field->display_name); ?></span>
    <div class="variant-options" role="radiogroup" aria-label="<?php echo $esc($field->display_name); ?>">
        <?php foreach ($values as $value) :
            $valueId = (int) $value->id;
            $isAvailable = isset($available[$valueId]);
            ?>
            <label class="variant-option<?php echo $isAvailable ? '' : ' is-unavailable'; ?>">
                <input type="radio" name="<?php echo $esc($inputName); ?>"
                       value="<?php echo $valueId; ?>" data-item-reload="<?php echo $esc($reloadScope); ?>"
                    <?php echo $selected === $valueId ? 'checked' : ''; ?>
                    <?php echo $isAvailable ? '' : 'disabled'; ?>>
                <span class="variant-option-label"><?php echo $esc($value->display_name); ?></span>
            </label>
        <?php endforeach; ?>
    </div>
</div>
```

`plugins/alfa-item-fields/picker/language/en-GB/plg_alfa-item-fields_picker.ini`

```ini
PLG_ALFA_ITEM_FIELDS_PICKER="Alfa Item Fields - Picker"
PLG_ALFA_ITEM_FIELDS_PICKER_XML_DESCRIPTION="Adds the item field type 'picker' to Alfa Commerce: the values of a field as radio buttons."
```

`plugins/alfa-item-fields/picker/language/en-GB/plg_alfa-item-fields_picker.sys.ini`

```ini
PLG_ALFA_ITEM_FIELDS_PICKER="Alfa Item Fields - Picker"
PLG_ALFA_ITEM_FIELDS_PICKER_XML_DESCRIPTION="Adds the item field type 'picker' to Alfa Commerce: the values of a field as radio buttons."
```

What the sample relies on:

- `$item->variant` is what the shopper's picks led to. `variantFieldIds` lists the fields that are dimensions of
  the item's combinations, `selection` holds the chosen value per field, and `availableValueIds` holds, per
  field, the values that can still be reached with the other picks, as `[value id => true]`.
- `$item->options` lists the values the item offers as extras (`value_id`), and `selectedOptionValueIds` the ones
  chosen now.

Install the plugin, enable it, and leave its Access on Public. The type `picker` can then be chosen for a new
item field.
