---
title: A complete feature plugin
description: "A complete small plugin of the alfa group for Alfa Commerce 2.2.0, file by file, as installed and tried on a fresh shop."
---

# A complete feature plugin

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Extending Admin Screens](./admin-screen-plugins.md): the guide itself
- [Admin screen events](./admin-screen-events.md)
- [A complete feature plugin](./admin-screen-example.md)
- [Calling your plugin from the browser](./admin-screen-ajax.md)

No feature plugin ships with Alfa Commerce 2.2.0, so there is none to copy. The plugin below is complete and small.
Every line of it was checked against the event and framework classes of 2.2.0 (`administrator/src/Event/Admin`,
`administrator/src/Plugin`, `administrator/src/Helper/Columns.php`); its manifest and provider follow the plugins
that do ship.

What it does: the shop owner types the ids of the manufacturers that must never be deleted into the plugin's
options. The Manufacturers list shows a "Kept" badge on those rows, and a delete that includes one of them is
refused.

```
plugins/alfa/keeplist/
├── keeplist.xml
├── services/provider.php
├── src/Extension/Keeplist.php
├── tmpl/kept_badge.php
└── language/en-GB/
    ├── plg_alfa_keeplist.ini
    └── plg_alfa_keeplist.sys.ini
```

**`keeplist.xml`** (the manifest)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa" method="upgrade">
    <name>plg_alfa_keeplist</name>
    <author>Acme</author>
    <creationDate>2026-11</creationDate>
    <copyright>(C) 2026 Acme</copyright>
    <license>GNU General Public License version 3 or later</license>
    <version>1.0.0</version>
    <description>PLG_ALFA_KEEPLIST_XML_DESCRIPTION</description>
    <namespace path="src">Acme\Plugin\Alfa\Keeplist</namespace>
    <files>
        <folder plugin="keeplist">services</folder>
        <folder>src</folder>
        <folder>tmpl</folder>
    </files>
    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa_keeplist.ini</language>
        <language tag="en-GB">en-GB/plg_alfa_keeplist.sys.ini</language>
    </languages>
    <config>
        <fields name="params">
            <fieldset name="basic">
                <field
                    name="kept_ids"
                    type="text"
                    label="PLG_ALFA_KEEPLIST_KEPT_IDS_LABEL"
                    description="PLG_ALFA_KEEPLIST_KEPT_IDS_DESC"
                    default=""
                />
            </fieldset>
        </fields>
    </config>
</extension>
```

**`services/provider.php`**

```php
<?php

\defined('_JEXEC') or die;

use Acme\Plugin\Alfa\Keeplist\Extension\Keeplist;
use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;

return new class () implements ServiceProviderInterface {
    public function register(Container $container)
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new Keeplist((array) PluginHelper::getPlugin('alfa', 'keeplist'));
                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            },
        );
    }
};
```

**`src/Extension/Keeplist.php`**

```php
<?php

namespace Acme\Plugin\Alfa\Keeplist\Extension;

\defined('_JEXEC') or die;

use Alfa\Component\Alfa\Administrator\Event\Admin\AdminBeforeDeleteEvent;
use Alfa\Component\Alfa\Administrator\Event\Admin\AdminListColumnsEvent;
use Alfa\Component\Alfa\Administrator\Event\Admin\AdminListRowDataEvent;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\SubscriberInterface;

final class Keeplist extends CMSPlugin implements SubscriberInterface
{
    /** This plugin's name, group.element: the first argument of everything it adds. */
    private const ID = 'alfa.keeplist';

    /** Joomla loads the plugin's own language file. Alfa Commerce does not. */
    protected $autoloadLanguage = true;

    public static function getSubscribedEvents(): array
    {
        return [
            'onAlfaAdminListRowData'  => 'onAlfaAdminListRowData',
            'onAlfaAdminListColumns'  => 'onAlfaAdminListColumns',
            'onAlfaAdminBeforeDelete' => 'onAlfaAdminBeforeDelete',
        ];
    }

    /** Once for the page: which of its rows are kept. */
    public function onAlfaAdminListRowData(AdminListRowDataEvent $event): void
    {
        if (!$event->targets('manufacturer')) {
            return;
        }

        $kept = array_intersect($event->getAdminContext()->ids ?? [], $this->keptIds());

        if ($kept === []) {
            return;
        }

        $event->value(self::ID, 'kept', array_fill_keys($kept, true));
    }

    /** The column: it only looks up what the handler above stored. */
    public function onAlfaAdminListColumns(AdminListColumnsEvent $event): void
    {
        if (!$event->targets('manufacturer')) {
            return;
        }

        $context = $event->getAdminContext();

        $context->columns->column(self::ID, 'kept')
            ->title('PLG_ALFA_KEEPLIST_COLUMN')
            ->after('item_count')
            ->setLayout('kept_badge')
            ->setData(
                fn (object $row): ?array => isset($context->rowValues((int) $row->id)['kept'])
                    ? ['kept' => true]
                    : null
            );
    }

    /** Refuse a delete that includes a kept manufacturer. */
    public function onAlfaAdminBeforeDelete(AdminBeforeDeleteEvent $event): void
    {
        if (!$event->targets('manufacturer')) {
            return;
        }

        $context = $event->getAdminContext();

        if (array_intersect($context->ids ?? [], $this->keptIds()) !== []) {
            $context->addError(Text::_('PLG_ALFA_KEEPLIST_REFUSED'));
        }
    }

    /**
     * The ids typed in the plugin's options, for example "3, 7, 12".
     *
     * @return int[]
     */
    private function keptIds(): array
    {
        $ids = array_map('intval', explode(',', (string) $this->params->get('kept_ids', '')));

        return array_values(array_filter($ids, static fn (int $id): bool => $id > 0));
    }
}
```

**`tmpl/kept_badge.php`** (draws one cell; it is called only for rows where the function returned data)

```php
<?php

\defined('_JEXEC') or die;

use Joomla\CMS\Language\Text;

/** @var array $displayData What the column's data function returned for this row. */
?>
<span class="badge bg-info"><?php echo Text::_('PLG_ALFA_KEEPLIST_BADGE'); ?></span>
```

**`language/en-GB/plg_alfa_keeplist.ini`**

```ini
PLG_ALFA_KEEPLIST="Alfa Commerce: Keep list"
PLG_ALFA_KEEPLIST_XML_DESCRIPTION="Marks manufacturers that must never be deleted."
PLG_ALFA_KEEPLIST_KEPT_IDS_LABEL="Kept manufacturers"
PLG_ALFA_KEEPLIST_KEPT_IDS_DESC="The ids of the manufacturers to keep, separated by commas."
PLG_ALFA_KEEPLIST_COLUMN="Kept"
PLG_ALFA_KEEPLIST_BADGE="Kept"
PLG_ALFA_KEEPLIST_REFUSED="One of the selected manufacturers is on the keep list. Nothing was deleted."
```

**`language/en-GB/plg_alfa_keeplist.sys.ini`**

```ini
PLG_ALFA_KEEPLIST="Alfa Commerce: Keep list"
PLG_ALFA_KEEPLIST_XML_DESCRIPTION="Marks manufacturers that must never be deleted."
```

The shorter samples on [Extending Admin Screens](./admin-screen-plugins.md) and [Admin screen events](./admin-screen-events.md) use more language keys of this plugin (`PLG_ALFA_KEEPLIST_TOOLBAR`,
`PLG_ALFA_KEEPLIST_OPEN`, `PLG_ALFA_KEEPLIST_TAB`, `PLG_ALFA_KEEPLIST_MONTHS`, `PLG_ALFA_KEEPLIST_ACCESS_MANAGE`,
`PLG_ALFA_KEEPLIST_ACCESS_MANAGE_DESC`) and the permission `alfa.keeplist.manage`. They are not in the files above.
Add each one when you use its sample.

Install the plugin, enable it, and type an id in its options. Open Components, Alfa Commerce, Manufacturers: the
column is there, after the item count. Deleting is a two-step action on this list: move a kept row to the trash,
set the Status filter to Trashed, check the row and press **Empty Trash**. The message appears and the row stays.

This plugin was installed and tried on a fresh Alfa Commerce 2.2.0 (Joomla 6.1.4, PHP 8.3, MariaDB 10.6): the
column, the badge and the refusal all behaved as described.
