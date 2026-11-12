---
title: A complete admin panel plugin
description: "A complete plugin that adds its own administrator screen to Alfa Commerce 2.2.0, file by file."
---

# A complete admin panel plugin

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Creating an Admin Panel](./admin-panels.md): the guide itself
- [A complete admin panel plugin](./admin-panel-example.md)

No feature plugin ships with Alfa Commerce 2.2.0, so there is none to copy. The plugin below is a complete panel:
a list of notes with a search box, sorting, New, Delete and an edit form. Every line of it was checked against the
event and framework classes of 2.2.0 (`administrator/src/Event/Panel`, `Event/Menu`, `Event/Access`,
`administrator/src/Panel`, `Model/PanelModel.php`, `View/Panel/HtmlView.php`, `Controller/PanelController.php`,
`Toolbar/PanelToolbar.php`); its manifest and provider follow the plugins that do ship.

```
plugins/alfa/storenotes/
├── storenotes.xml
├── services/provider.php
├── src/Extension/Storenotes.php
├── forms/note.xml
├── forms/filter_notes.xml
├── layouts/notes/list.php
├── sql/install.mysql.utf8.sql
├── sql/uninstall.mysql.utf8.sql
└── language/en-GB/
    ├── plg_alfa_storenotes.ini
    └── plg_alfa_storenotes.sys.ini
```

**`storenotes.xml`** (the manifest)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa" method="upgrade">
    <name>plg_alfa_storenotes</name>
    <author>Acme</author>
    <creationDate>2026-11</creationDate>
    <copyright>(C) 2026 Acme</copyright>
    <license>GNU General Public License version 3 or later</license>
    <version>1.0.0</version>
    <description>PLG_ALFA_STORENOTES_XML_DESCRIPTION</description>
    <namespace path="src">Acme\Plugin\Alfa\Storenotes</namespace>
    <files>
        <folder plugin="storenotes">services</folder>
        <folder>src</folder>
        <folder>forms</folder>
        <folder>layouts</folder>
        <folder>sql</folder>
    </files>
    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa_storenotes.ini</language>
        <language tag="en-GB">en-GB/plg_alfa_storenotes.sys.ini</language>
    </languages>
    <install>
        <sql>
            <file driver="mysql" charset="utf8">sql/install.mysql.utf8.sql</file>
        </sql>
    </install>
    <uninstall>
        <sql>
            <file driver="mysql" charset="utf8">sql/uninstall.mysql.utf8.sql</file>
        </sql>
    </uninstall>
</extension>
```

**`sql/install.mysql.utf8.sql`**

```sql
CREATE TABLE IF NOT EXISTS `#__storenotes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL DEFAULT '',
    `note` TEXT NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 DEFAULT COLLATE=utf8mb4_unicode_ci;
```

**`sql/uninstall.mysql.utf8.sql`**

```sql
DROP TABLE IF EXISTS `#__storenotes`;
```

**`services/provider.php`**

```php
<?php

\defined('_JEXEC') or die;

use Acme\Plugin\Alfa\Storenotes\Extension\Storenotes;
use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\Database\DatabaseInterface;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;

return new class () implements ServiceProviderInterface {
    public function register(Container $container)
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new Storenotes((array) PluginHelper::getPlugin('alfa', 'storenotes'));
                $plugin->setApplication(Factory::getApplication());
                $plugin->setDatabase($container->get(DatabaseInterface::class));

                return $plugin;
            },
        );
    }
};
```

**`src/Extension/Storenotes.php`**

```php
<?php

namespace Acme\Plugin\Alfa\Storenotes\Extension;

\defined('_JEXEC') or die;

use Alfa\Component\Alfa\Administrator\Event\Access\GetAccessActionsEvent;
use Alfa\Component\Alfa\Administrator\Event\Menu\BuildMenuEvent;
use Alfa\Component\Alfa\Administrator\Event\Panel\PanelDeleteEvent;
use Alfa\Component\Alfa\Administrator\Event\Panel\PanelListQueryEvent;
use Alfa\Component\Alfa\Administrator\Event\Panel\PanelSaveEvent;
use Alfa\Component\Alfa\Administrator\Event\Panel\PanelViewEvent;
use Alfa\Component\Alfa\Administrator\Plugin\TargetedHandlersInterface;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Database\DatabaseAwareInterface;
use Joomla\Database\DatabaseAwareTrait;
use Joomla\Event\SubscriberInterface;

final class Storenotes extends CMSPlugin implements SubscriberInterface, TargetedHandlersInterface, DatabaseAwareInterface
{
    use DatabaseAwareTrait;

    /** This plugin's name, group.element: the first argument of everything it adds. */
    private const ID = 'alfa.storenotes';

    /** The one panel this plugin owns. */
    private const PANEL = 'notes';

    /** The permission that opens the panel. */
    private const ACCESS = 'alfa.storenotes.manage';

    private const TABLE = '#__storenotes';

    /** Joomla loads the plugin's own language file. Alfa Commerce does so only on a panel request. */
    protected $autoloadLanguage = true;

    /** Announced to everyone: the menu entry and the permission. */
    public static function getSubscribedEvents(): array
    {
        return [
            'onAlfaBuildMenu'        => 'onAlfaBuildMenu',
            'onAlfaGetAccessActions' => 'onAlfaGetAccessActions',
        ];
    }

    /** Addressed to this plugin alone: the panel events it handles. */
    public function getTargetedHandlers(): array
    {
        return [
            'onAlfaPanelListQuery' => 'onAlfaPanelListQuery',
            'onAlfaPanelView'      => 'onAlfaPanelView',
            'onAlfaPanelSave'      => 'onAlfaPanelSave',
            'onAlfaPanelDelete'    => 'onAlfaPanelDelete',
        ];
    }

    public function onAlfaBuildMenu(BuildMenuEvent $event): void
    {
        $event->item(self::ID, 'storenotes-notes')
            ->section('COM_ALFA_MENU_SALES')
            ->title('PLG_ALFA_STORENOTES_MENU')
            ->panel('alfa', 'storenotes', self::PANEL)
            ->icon('media/com_alfa/images/admin/menu/documents.svg')
            ->ordering(950)
            ->access(self::ACCESS);
    }

    public function onAlfaGetAccessActions(GetAccessActionsEvent $event): void
    {
        $event->action(
            self::ID,
            self::ACCESS,
            'PLG_ALFA_STORENOTES_ACCESS',
            'PLG_ALFA_STORENOTES_ACCESS_DESC',
        );
    }

    /** The list: the whole query, against this plugin's own table. */
    public function onAlfaPanelListQuery(PanelListQueryEvent $event): void
    {
        if ($event->getIdentity()->panel !== self::PANEL) {
            return;
        }

        $db    = $this->getDatabase();
        $query = $event->getQuery();

        $query->select($db->quoteName(['a.id', 'a.title']))
            ->from($db->quoteName(self::TABLE, 'a'))
            ->order($db->quoteName('a.id') . ' DESC');

        $search = trim((string) $event->getState()->get('filter.search', ''));

        if ($search !== '') {
            $query->where($db->quoteName('a.title') . ' LIKE ' . $db->quote('%' . $db->escape($search, true) . '%', false));
        }
    }

    /** Which file draws each screen. */
    public function onAlfaPanelView(PanelViewEvent $event): void
    {
        if ($event->getIdentity()->panel !== self::PANEL) {
            return;
        }

        if ($event->getScreen() === 'list') {
            $event->setLayout('notes.list');          // layouts/notes/list.php

            return;
        }

        if ($event->getScreen() !== 'edit') {
            return;
        }

        $data = $event->getData();                    // id, and what was typed if a save was refused
        $kept = \is_array($data['form'] ?? null) ? $data['form'] : null;

        $event->useForm('note')                       // forms/note.xml
            ->setLayoutData($kept ?? $this->loadNote((int) ($data['id'] ?? 0)));
    }

    public function onAlfaPanelSave(PanelSaveEvent $event): void
    {
        $identity = $event->getIdentity();

        if ($identity->panel !== self::PANEL) {
            return;
        }

        $input = $event->getInput();
        $id    = $input->getInt('id', 0);
        $title = trim($input->getString('title', ''));

        if ($title === '') {
            $event->addMessage(Text::_('PLG_ALFA_STORENOTES_TITLE_MISSING'), 'error')
                ->keepInput()
                ->setRedirect($identity->editUrl($id));

            return;
        }

        $row = (object) [
            'id'    => $id > 0 ? $id : null,
            'title' => $title,
            'note'  => trim($input->getString('note', '')),
        ];

        if ($id > 0) {
            $this->getDatabase()->updateObject(self::TABLE, $row, 'id');
        } else {
            $this->getDatabase()->insertObject(self::TABLE, $row, 'id');
        }

        $event->addMessage(Text::_('PLG_ALFA_STORENOTES_SAVED'))
            ->setRedirect($identity->listUrl());
    }

    public function onAlfaPanelDelete(PanelDeleteEvent $event): void
    {
        $identity = $event->getIdentity();

        if ($identity->panel !== self::PANEL) {
            return;
        }

        $ids = array_values(array_filter($event->getIds(), static fn (int $id): bool => $id > 0));

        if ($ids === []) {
            $event->addMessage(Text::_('PLG_ALFA_STORENOTES_NONE_CHECKED'), 'warning')
                ->setRedirect($identity->listUrl());

            return;
        }

        $db    = $this->getDatabase();
        $query = $db->getQuery(true)
            ->delete($db->quoteName(self::TABLE))
            ->whereIn($db->quoteName('id'), $ids);

        $db->setQuery($query)->execute();

        $event->addMessage(Text::sprintf('PLG_ALFA_STORENOTES_DELETED', \count($ids)))
            ->setRedirect($identity->listUrl());
    }

    /**
     * One note as the edit form needs it. A new note is an empty one.
     *
     * @return array{id: int, title: string, note: string}
     */
    private function loadNote(int $id): array
    {
        $empty = ['id' => 0, 'title' => '', 'note' => ''];

        if ($id <= 0) {
            return $empty;
        }

        $db    = $this->getDatabase();
        $query = $db->getQuery(true)
            ->select($db->quoteName(['id', 'title', 'note']))
            ->from($db->quoteName(self::TABLE))
            ->where($db->quoteName('id') . ' = ' . $id);

        return $db->setQuery($query)->loadAssoc() ?: $empty;
    }
}
```

**`forms/note.xml`** (the edit form)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form>
    <fieldset name="default">
        <field name="id" type="hidden" default="0" />
        <field name="title" type="text" label="JGLOBAL_TITLE" required="true" />
        <field name="note" type="textarea" label="PLG_ALFA_STORENOTES_NOTE" rows="6" />
    </fieldset>
</form>
```

**`forms/filter_notes.xml`** (the search box, the sort order and the page size of the list)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form>
    <fields name="filter">
        <field
            name="search"
            type="text"
            label="JSEARCH_FILTER"
            hint="JSEARCH_FILTER"
            class="js-stools-search-string"
        />
    </fields>
    <fields name="list">
        <field
            name="fullordering"
            type="list"
            label="JGLOBAL_SORT_BY"
            onchange="this.form.submit();"
            default="a.id DESC"
        >
            <option value="">JGLOBAL_SORT_BY</option>
            <option value="a.title ASC">JGLOBAL_TITLE_ASC</option>
            <option value="a.title DESC">JGLOBAL_TITLE_DESC</option>
            <option value="a.id ASC">JGRID_HEADING_ID_ASC</option>
            <option value="a.id DESC">JGRID_HEADING_ID_DESC</option>
        </field>
        <field
            name="limit"
            type="limitbox"
            label="JGLOBAL_LIST_LIMIT"
            default="25"
            onchange="this.form.submit();"
        />
    </fields>
</form>
```

**`layouts/notes/list.php`** (the list screen)

```php
<?php

\defined('_JEXEC') or die;

use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Router\Route;

/** @var array $displayData */
$view       = $displayData['view'];
$identity   = $displayData['identity'];
$items      = $displayData['items'] ?? [];
$pagination = $displayData['pagination'] ?? null;
$state      = $displayData['state'] ?? null;
$token      = $displayData['token'] ?? '';
$listOrder  = (string) $state?->get('list.ordering', '');
$listDirn   = (string) $state?->get('list.direction', '');
$e          = static fn (string $text): string => htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
?>
<form action="<?php echo Route::_($identity->listUrl()); ?>" method="post" name="adminForm" id="adminForm">
    <?php echo LayoutHelper::render('joomla.searchtools.default', ['view' => $view]); ?>

    <?php if ($items === []) : ?>
        <div class="alert alert-info"><?php echo Text::_('JGLOBAL_NO_MATCHING_RESULTS'); ?></div>
    <?php else : ?>
        <table class="table table-striped" id="storenotesList">
            <thead>
                <tr>
                    <td class="w-1 text-center"><?php echo HTMLHelper::_('grid.checkall'); ?></td>
                    <th scope="col">
                        <?php echo HTMLHelper::_('searchtools.sort', 'JGLOBAL_TITLE', 'a.title', $listDirn, $listOrder); ?>
                    </th>
                    <th scope="col" class="w-5">
                        <?php echo HTMLHelper::_('searchtools.sort', 'JGRID_HEADING_ID', 'a.id', $listDirn, $listOrder); ?>
                    </th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($items as $i => $item) : ?>
                    <tr>
                        <td class="text-center"><?php echo HTMLHelper::_('grid.id', $i, (int) $item->id); ?></td>
                        <th scope="row">
                            <a href="<?php echo Route::_($identity->editUrl((int) $item->id)); ?>">
                                <?php echo $e((string) $item->title); ?>
                            </a>
                        </th>
                        <td><?php echo (int) $item->id; ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <?php echo $pagination?->getListFooter(); ?>
    <?php endif; ?>

    <input type="hidden" name="option" value="com_alfa">
    <input type="hidden" name="group" value="<?php echo $e($identity->group); ?>">
    <input type="hidden" name="element" value="<?php echo $e($identity->element); ?>">
    <input type="hidden" name="panel" value="<?php echo $e($identity->panel); ?>">
    <input type="hidden" name="task" value="">
    <input type="hidden" name="boxchecked" value="0">
    <input type="hidden" name="<?php echo $e($token); ?>" value="1">
</form>
```

The hidden `task` field is empty. A toolbar button fills it when it is pressed (`panel.add`, `panel.delete`).

**`language/en-GB/plg_alfa_storenotes.ini`**

```ini
PLG_ALFA_STORENOTES="Alfa Commerce: Store notes"
PLG_ALFA_STORENOTES_XML_DESCRIPTION="A list of notes for the shop's staff."
PLG_ALFA_STORENOTES_MENU="Store notes"
PLG_ALFA_STORENOTES_ACCESS="Store notes: manage"
PLG_ALFA_STORENOTES_ACCESS_DESC="Allows users in this group to see, add, change and delete the store notes."
PLG_ALFA_STORENOTES_NOTE="Note"
PLG_ALFA_STORENOTES_TITLE_MISSING="Please give the note a title."
PLG_ALFA_STORENOTES_SAVED="The note was saved."
PLG_ALFA_STORENOTES_NONE_CHECKED="No note was checked."
PLG_ALFA_STORENOTES_DELETED="%d notes were deleted."
```

**`language/en-GB/plg_alfa_storenotes.sys.ini`**

```ini
PLG_ALFA_STORENOTES="Alfa Commerce: Store notes"
PLG_ALFA_STORENOTES_XML_DESCRIPTION="A list of notes for the shop's staff."
```

Install the plugin and enable it. As a Super User, open any Alfa Commerce screen: "Store notes" is in the menu under
Sales. To let other staff use it, open Options, Permissions and grant "Store notes: manage" to their group.
