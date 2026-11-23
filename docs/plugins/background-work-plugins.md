---
title: Background work of a plugin
description: How a plugin of the alfa group declares tasks and jobs of its own, asks for them, runs them a step at a time, reads and cancels them, and is told how they ended, on the same engine that runs Alfa Commerce's own work.
---

# Background work of a plugin

<AlfaVersion verified="2.3.0" />

A plugin of the **`alfa`** group can do work of its own in the background: tell another system of a change, check
something a few minutes after it moved, walk a long list a part at a time, or do it every few hours. It declares that
work, asks for it with one sentence, and runs it in public methods named as the events. Alfa Commerce's engine runs it
as it runs its own work: it writes it down first, runs it, tries it again, shows it in **Tools > Tasks** and keeps it
until staff act on what failed. How the engine itself works (the states, the turns, the waits) is on
[Background work](../architecture/background-work.md).

## Everything you write

Four pieces, each in one place. The first three are the example plugin's job (`plg_alfa_example`, printed whole
on [Adding routes to the REST API](./api-route-plugins.md#a-complete-plugin-plg_alfa_example)):

```php
// 1. Declare the work, in the plugin class: a public method named as the event.
public function onAlfaDeclareWork(DeclareWorkEvent $work): void
{
    $work->job('stock.check')
        ->label('PLG_ALFA_EXAMPLE_JOB_STOCK_CHECK')
        ->covers('PLG_ALFA_EXAMPLE_JOB_STOCK_CHECK_COVERS');
}

// 2. Ask for it, from the plugin's own code: the plugin hands itself, then one sentence.
BackgroundWork::of($this)
    ->job('stock.check')
    ->scope((string) $itemId)
    ->with(['item' => $itemId])
    ->notBefore(new \DateTimeImmutable('+15 minutes'))
    ->enqueue();

// 3. Do it, a step at a time: a public method named as the event, answering by name.
public function onAlfaRunJob(RunJobEvent $job): void
{
    match ($job->getWorkName()) {
        'stock.check' => $this->checkStock($job),
    };
}

// 4. Read how it went.
$status = BackgroundWork::of($this)->find($id);   // $status->state, $status->percent, $status->result
```

A task is the same four pieces with `task()` and `onAlfaRunTask`. A job that runs by itself every day says
`->every(days: 1)` in its declaration. The owner is the plugin object itself (`$this`): there is no name to type, so
a plugin's code reaches its own work only. Nothing else is needed: no interface to implement for the work, no list of
classes, no registration call, no cron entry.

The classes come from two folders of the component: `Alfa\Component\Alfa\Administrator\Background` (`BackgroundWork`,
the requests, the declarations, `Enqueued`, `WorkStatus`, `WorkState`, `TaskPart`, `WorkFailure`) and
`Alfa\Component\Alfa\Administrator\Event\Background` (the four events). Each is listed on
[Calling core from an extension](./calling-core.md).

## A task or a job

| | A task | A job |
|---|---|---|
| What it is | Short work done in one go: "submit this order's invoice" | Long work done in steps, each keeping a bookmark: "sync the catalogue" |
| When it runs | Written with the save that asks for it, run right after that save is final, in the same request. With no transaction open it runs before `enqueue()` returns. | Never in the request that asked: the engine's next turn runs it |
| How many | Any number; `once()` keeps one waiting or running of a name and key | One waiting or running a name and scope: a second request joins it |
| Its parts or progress | Named parts, each recorded once its outcome is known and never done twice | Units walked of a total, the bookmark saved with each step |
| When the outcome is unknown | Held for staff | Cannot happen: a step is always safe to walk again |

## Declaring the work

Alfa Commerce reads `onAlfaDeclareWork` when the plugin is installed, updated, saved or enabled, and keeps a copy, so
that the engine, Tools > Tasks and the retention never start the plugin to know its work. A name is lower-case words of
letters, digits and `_` joined by dots, at most 64 characters, one kind a name.

```php
public function onAlfaDeclareWork(DeclareWorkEvent $work): void
{
    $work->task('invoice.submit')
        ->label('PLG_ALFA_EINVOICE_TASK_SUBMIT')
        ->urgent();

    $work->job('catalog.sync')
        ->label('PLG_ALFA_EINVOICE_JOB_CATALOG_SYNC')
        ->covers('PLG_ALFA_EINVOICE_JOB_CATALOG_SYNC_COVERS')
        ->callsOtherSystems()
        ->every(hours: 6);
}
```

| On a task | Meaning | Without it |
|---|---|---|
| `label(string $key)` | Its name in Tools > Tasks, a key of the plugin's own language file. Required. | The declaration is left out |
| `repeatable()` | Running it twice duplicates nothing: an interrupted run is run again, an unexpected error is tried again | An interrupted run or an unexpected error is held for staff |
| `urgent()` | A failure shows in the attention notice as danger | A warning |

| On a job | Meaning | Without it |
|---|---|---|
| `label(string $key)` | As for a task. Required. | The declaration is left out |
| `covers(string $key)` | The "Covers" text in Tools > Tasks, a key whose `%s` is the job's scope | The scope as given, or "The whole shop" for a job with no scope |
| `heavy()` | Shares the one heavy slot: no other heavy job, Alfa's or another plugin's, runs at the same time | Light |
| `callsOtherSystems()` | Its steps call another system (HTTP, mail): they run outside the engine's transaction and wait longer between tries | Its steps run inside the engine's transaction, their database writes kept with the bookmark |
| `every(minutes:, hours:, days:)` | The engine asks for the job by itself, once a span (see [A job every so often](#a-job-every-so-often)) | Asked for only by your code |
| `urgent()` | As for a task | A warning |

There is no priority, retry count or step size to set: a plugin's jobs run below Alfa's own correctness work, the
retries are the engine's, and the engine sizes each step from the time the steps take.

A declaration is left out, with one ERROR line in the log `com_alfa.tasks` naming the plugin, the name and the reason,
when its name has the wrong shape, a name is declared twice (a name has one kind), it has no label, `every()` is given
other than one span in range, or the plugin has no public `onAlfaRunTask()` for a task or `onAlfaRunJob()` for a job.
The plugin's other declarations still count. When `onAlfaDeclareWork` throws, the plugin's previous copy is kept as it
was.

## Asking for it

`BackgroundWork::of($this)` takes the plugin as Joomla booted it: a plugin of an `alfa` group, installed and enabled.
It reaches that plugin's own work only. `task()` and `job()` refuse, with an `InvalidArgumentException`, a name the
plugin does not declare as that kind. A component or module of your own hands the plugin Joomla boots for it:
`BackgroundWork::of(Factory::getApplication()->bootPlugin('vendor', 'alfa'))`.

```php
use Alfa\Component\Alfa\Administrator\Background\BackgroundWork;

$asked = BackgroundWork::of($this)
    ->task('invoice.submit')
    ->about('order', $orderId)
    ->with(['order' => $orderId])
    ->once('order:' . $orderId)
    ->enqueue();
```

| On a task request | Meaning |
|---|---|
| `about(string $type, int $id)` | What the task concerns, shown in Tools > Tasks ("Order #15"): a lower-case word of at most 32 characters and an id above zero |
| `with(array $data)` | What the task needs: JSON-safe, at most 16 KiB encoded. Read current values when it runs, never what they were when it was asked. |
| `once(string $key)` | At most one waiting or running task of this name and key. A second request with the same data joins it; one with other data writes nothing and is answered refused. |

| On a job request | Meaning |
|---|---|
| `scope(string $scope)` | What the job covers (`'42'` for category 42): one waiting or running job a name and scope. Without it, one job for the name. 1 to 100 of `a` to `z`, `0` to `9`, `_`, `.`, `:` and `-`. |
| `with(array $data)` | What the job needs: JSON-safe, at most 16 KiB encoded. A joined job keeps the data of the request that wrote it. |
| `notBefore(DateTimeInterface $when)` | Not before this moment, at most 365 days ahead. Joining a waiting job keeps the earlier of the two moments, so a delay gathers a burst; a job waiting to try again after a failure keeps its wait. |

**Joining.** A request for a job whose scope already waits joins it, its data unchanged. A request while it runs makes
it run once more from the start when it finishes, so the job always ends having walked what was asked last.

**The transaction.** A task or job asked inside a save is written in that save: it is kept when the save is final and
gone when the save is undone. A task then runs right after the outermost save is final. Close a transaction of your own
with `TransactionState::commitLevel()` and `rollBackLevel()`: a plain driver commit keeps the task but leaves its run to
the engine's rescue, two minutes later.

**The answer**, `Enqueued`, is read, never caught:

| Field | Meaning |
|---|---|
| `id` | The row written or joined; the id of the task that waits or runs when refused for its data; 0 when nothing was written |
| `joined` | True when a waiting or running one was joined |
| `refused` | True when nothing was written |
| `reason` | `Enqueued::OTHER_DATA` (a task of the same `once()` key waits or runs with other data) or `Enqueued::TOO_FAR` (`notBefore()` more than 365 days ahead); `''` otherwise |

A refusal is an answer, not an error, so your own save is never undone by it.

## A job every so often

`every()` takes exactly one of `minutes`, `hours` or `days`, at least 5 minutes and at most 30 days. The engine asks for
the job by itself, with no scope and no data, when none of it waits or runs and none was asked for within the span,
failed ones included: a job that keeps failing fails once a span, not once a turn.

The engine runs when the shop is visited and when the server's cron runs the console command (see
[What makes the engine run](../architecture/background-work.md#what-makes-the-engine-run)), so `every()` promises a
span, not a time of day. For a fixed time of day, a routine of your own Joomla `task` plugin asks for the job in its
run (see [System, console and task plugins](./system-console-task-plugins.md)); Joomla's scheduler says when, and the
work runs, is tried again and shows in Alfa's engine.

## Running a task

`onAlfaRunTask(RunTaskEvent $task)` runs each task of the plugin. A plugin with several tasks answers by name:

```php
public function onAlfaRunTask(RunTaskEvent $task): void
{
    match ($task->getWorkName()) {
        'invoice.submit' => $this->submitInvoice($task),
    };
}

private function submitInvoice(RunTaskEvent $task): void
{
    $orderId = (int) $task->getData()['order'];
    $invoice = $this->invoices->forOrder($orderId) ?? $this->invoices->create($orderId);

    if (!$task->part('submit')->isDone()) {
        try {
            $receipt = $this->client->submit($invoice);
        } catch (ServiceTimeout $e) {
            $task->part('submit')->unknown('The service did not answer.');
        } catch (ServiceRefusal $e) {
            $task->part('submit')->failed($e->getMessage());

            throw WorkFailure::retry('The service refused the invoice.', $e);
        }

        $this->invoices->markSubmitted($invoice, $receipt);
        $task->part('submit')->done();
    }

    $task->result(['invoice' => $invoice->number]);
}
```

- `getWorkName()` is the task's declared name (`getName()` is the event's name, `onAlfaRunTask`, as on every Joomla
  event); `getData()`, `getSubjectType()` and `getSubjectId()` read what the request gave.
- `part($name)` is one named part (a recipient, a call to another system). Ask `isDone()` first, then record `done()`,
  `failed($why)` or `unknown($why)` as soon as the outcome is known. A part done is never done again: a retry and
  staff's Run again skip it. `unknown()` holds the task for staff at once.
- `result([...])` is what the finished task reports: JSON-safe, at most 16 KiB, kept with its row and read with
  `find()` and over the REST API. Tools > Tasks lists a task only while it is failed or held.
- Returning ends the task done.

## Running a job

`onAlfaRunJob(RunJobEvent $job)` runs each step of the plugin's jobs. A step walks at most `getUnits()` units from
`getCheckpoint()` and ends with exactly one of `next()` or `finished()`, after `walked()`:

```php
$job->walked(\count($rows))->next(['after' => $lastId]);
$job->walked(\count($rows))->finished(['done' => $count]);
```

| Call | Meaning |
|---|---|
| `getWorkName()` | The job's declared name. `getName()` is the event's name, `onAlfaRunJob`, as on every Joomla event. |
| `getScope()`, `getData()` | What the request gave |
| `getCheckpoint()` | The bookmark the last step gave to `next()`; `[]` on the first step and when the job runs again from the start |
| `getUnits()` | Walk at most this many units now: the engine sizes the steps from the time they take, aiming at about 100 milliseconds |
| `getDeadline()` | Finish the step before this moment, a wait for a lock included |
| `total(int $units)` | The units in all, for the progress bar, on any step and as often as it changes. Until then Tools > Tasks says "Not counted yet". |
| `walked(int $units)` | The units this step walked |
| `next(array $checkpoint)` | More to do: the next step continues from this bookmark (JSON-safe, at most 4 KiB) |
| `finished(array $result = [])` | Done, with what it reports (JSON-safe, at most 16 KiB), kept with its row and shown in Tools > Tasks |

A step that ends with neither `next()` nor `finished()`, or with both, fails. A bookmark or result that is too large
fails the job: its code is wrong.

**Inside or outside the engine's transaction.** A job's step runs inside the engine's transaction, so what it writes to
the shop's database is kept with its bookmark, or undone with it when the step fails. Such a step never calls another
system: a call cannot be undone with the step. A job declared `callsOtherSystems()` runs its steps outside that
transaction: a failed step does not move its bookmark, and every call it makes must be safe to repeat.

## When it fails

Throw a `WorkFailure` to say how a run failed:

| The handler | A task | A job |
|---|---|---|
| returns | done | the step is kept (bookmark, progress) |
| throws `WorkFailure::retry($why, after: N)` | waits and tries again; its parts done are skipped | the step is undone (with `callsOtherSystems()`, its bookmark is not moved) and tried again |
| throws `WorkFailure::failed($why)` | failed at once; staff decide | failed at once; staff decide |
| calls `part(...)->unknown($why)` | held at once; staff decide | not offered: a step is always safe to repeat |
| throws any other error | `repeatable()`: tried again; otherwise held | tried again |
| leaves a transaction open | rolled back, counted as an unexpected error | rolled back, so nothing of the step is kept, and tried again; a `callsOtherSystems()` step's failure reads "A step of this job left a database transaction open. It was rolled back, so nothing of that step was kept. It is tried again." |

| Work | Waits between tries | After the last try |
|---|---|---|
| A task | 1 min, 5 min, 30 min, 2 h, 6 h, 24 h | failed |
| A job | 30 s, doubling, each wait at most 1 h; 8 failures in a row | failed |
| A job that `callsOtherSystems()` | 1 min, 5 min, 30 min, 2 h, 6 h, 24 h, as a task; the 7th failure in a row | failed |
| Any, with `WorkFailure::retry(after: N)` | the ladder's wait, or N seconds when longer (a receiver's Retry-After) | as above |

A step that succeeds sets a job's count of failures back to zero. The message of a failure is read by staff: put no
password, host or database text in it. A failed or held row stays, never deleted by age, until staff act on it in
Tools > Tasks; a failed job is also closed, resolved, when a later job of its name and scope ends done.

## Reading and cancelling

`BackgroundWork::of($this)->find($id)` answers one of the plugin's tasks or jobs as it stands, a `WorkStatus`, or
`null` when it is another owner's, never existed, or was deleted (a done, resolved or cancelled row goes 30 days after
it ends).

| `WorkStatus` | Meaning |
|---|---|
| `id`, `name` | The row and its declared name |
| `state` | A `WorkState`: `Waiting`, `Running`, `Done`, `Failed`, `Held`, `Resolved` or `Cancelled` |
| `done`, `total`, `percent` | A job's units walked, its units in all and its share walked (0 to 100); a task's parts done, total 0 and percent `null`. `percent` is `null` for a job not counted yet. |
| `result` | What the finished work reported; `null` before it is done |
| `failure` | The last error, shortened; `''` when none |
| `finishedAt` | When it ended, UTC; `null` while it has not |
| `isFinished()` | Nothing automatic is left: done, failed, held, resolved or cancelled |

`BackgroundWork::of($this)->cancel($id)` cancels one of the plugin's own rows and answers whether it did:

- a waiting task or job is cancelled at once, with a history entry; its scope is free for a new request;
- a running job is marked and stays running, so its scope stays taken: the engine runs no further step, the step in
  progress keeps nothing (with `callsOtherSystems()`, its bookmark does not move), and the engine then settles it
  cancelled; when it was asked for again meanwhile, it starts again from the beginning instead;
- a running task is refused (`false`): a task is one go, and stopping it half way would leave its effect unknown;
- a finished row, or another owner's, is refused (`false`).

Staff cancel a plugin's waiting or running job from Tools > Tasks, with a reason.

## Told when it ends

A plugin with a public `onAlfaWorkSettled(WorkSettledEvent $settled)` is told when one of its tasks or jobs ends:
done, failed, held, resolved (by staff, or by a later job of its scope that ended done) or cancelled. `getStatus()` is
the row as it ended (a `WorkStatus`), and `getReason()` the reason given with Mark resolved or with the Cancel of a
waiting or running task or job (for a running job, the reason given when the cancel was asked); `''` when none was
given.

```php
public function onAlfaWorkSettled(WorkSettledEvent $settled): void
{
    $status = $settled->getStatus();

    if ($status->state === WorkState::Done) {
        $this->syncLog->record($status->id, $status->result);
    }
}
```

The news is a task of Alfa's own, written in the same save that ends the row, so the plugin is told once the end is
final, even when the server stops in between. It is tried again when the method throws, so the method must be safe to
repeat. Anything that must outlive the row is written to the plugin's own tables here. A plugin without the method is
not told and reads its work with `find()`.

## Who it runs as, and the plugin's life

The work runs as nobody (an empty user), whether a task runs in the request that asked or later in a turn of the
engine. Take who and what from the data you gave, never from the signed-in user. The plugin is loaded for its work
whatever its Access, as long as it is installed and enabled: Access is a rule about visitors, and background work has
none.

| The plugin is | Its declarations | Its tasks and jobs |
|---|---|---|
| installed, updated, saved or enabled | read again; names no longer declared deleted | a waiting row of a name no longer declared stays, and Tools > Tasks says on such a job that it waits because the extension no longer declares this work; staff cancel a job, the plugin cancels a task |
| disabled | kept, marked disabled | they wait, with no try counted, and run once it is enabled; Tools > Tasks says on a job that it waits because the extension is disabled |
| uninstalled | deleted | waiting rows and running jobs cancelled, with the reason that the extension was uninstalled; failed and held rows kept for staff |
| removed with Tools > Extensions, "Remove extension and its data" | deleted | every row of the plugin deleted, after its own Clear Data |

A plugin switched on or off without Joomla's extension events (a change in the database, a restored backup) is
followed within the hour. **Clear everything** lists, on its confirmation page, each plugin's tasks and jobs that wait,
failed or are held, keeps those counts in its record, removes them with the shop's data, and reads the enabled plugins'
declarations again, so their schedules resume.

## In Tools > Tasks

A plugin's rows are in the same lists as Alfa's, with the same buttons. Each shows its label in the plugin's own words
with the plugin's name beneath it (its name as Extensions: Plugins lists it), Covers (the `covers()` text with the
scope, or a task's subject), progress, times, the last error and the next try. A done job shows its result as
`key: value` lines. A job that cannot run says why: the extension is disabled, or no longer declares this work.

Staff press **Run again** or **Mark resolved** on a failed or held task, **Retry** or **Mark resolved** on a failed
job, **Process now** on a waiting job, and **Cancel**, with a reason, on a plugin's waiting or running job. Every
button asks the permission to use Tools (`alfa.tools`), as for Alfa's own rows. No permission is added for a plugin's
work: who may cause it is your own route's or screen's permission.

Over the REST API, the task routes read a plugin's rows with their `owner` and `result`, and `filter[owner]` lists
one plugin's (see [Documents and tasks](../api/documents-and-tasks.md)). To let a client ask for work, declare a route
of your own with `onAlfaBeforeApiRoute` and answer it with a `BackgroundWork` call
([Adding routes to the REST API](./api-route-plugins.md)).

## The example plugin's job, line by line

`plg_alfa_example` checks a product's stock 15 minutes after it moved: the product itself when it has no variants,
otherwise each published variant by its own stock and its own low level, as Alfa decides "low", and reports how many
are low. The whole plugin is printed on
[Adding routes to the REST API](./api-route-plugins.md#a-complete-plugin-plg_alfa_example).

**It asks**, in its stock listener:

```php
        // The product's stock moved: check it in 15 minutes. Every change of the same product in those minutes joins
        // this one waiting job, so a busy product is checked once, and no running check is restarted.
        $itemId = (int) $event->argument('itemId');

        BackgroundWork::of($this)
            ->job('stock.check')
            ->scope((string) $itemId)
            ->with(['item' => $itemId])
            ->notBefore(new \DateTimeImmutable('+15 minutes'))
            ->enqueue();
```

One job a product (`scope`), 15 minutes ahead (`notBefore`): every adjustment of the product in those minutes joins the
waiting job.

**It declares** the job with its label and its Covers text, two keys of its own language file
(`PLG_ALFA_EXAMPLE_JOB_STOCK_CHECK="Example: low stock check"`, `PLG_ALFA_EXAMPLE_JOB_STOCK_CHECK_COVERS="Product %s"`):

```php
    public function onAlfaDeclareWork(DeclareWorkEvent $work): void
    {
        $work->job('stock.check')
            ->label('PLG_ALFA_EXAMPLE_JOB_STOCK_CHECK')
            ->covers('PLG_ALFA_EXAMPLE_JOB_STOCK_CHECK_COVERS');
    }
```

**It runs** each step by name. A second job is one more line in the `match`:

```php
    public function onAlfaRunJob(RunJobEvent $job): void
    {
        match ($job->getWorkName()) {
            'stock.check' => $this->checkStock($job),
        };
    }
```

**One step**, in `checkStock()`:

- It reads the product. An unpublished or deleted product ends the job at once, nothing walked, nothing low:
  `$job->walked(0)->finished(['low' => 0])`.
- It reads at most `getUnits()` published variants after the bookmark's `after`, in id order.
- A product with no variants is one unit: `total(1)`, `walked(1)`, `finished()` with 1 or 0 low.
- On its first step (`after` is 0) it counts the published variants and reports them with `total()`, for the
  progress bar.
- It adds the low ones of this step to the count the bookmark carries.
- A short read means the end: `finished(['low' => $low])`. A full one means more: `next(['after' => <the last id>,
  'low' => $low])`.

A step reads current stock and keeps its count in the bookmark, so walking a step again gives the same answer.

**"Low"**, in `isLow()`, is Alfa's own rule, through `InventoryAvailabilityService::lowStockThreshold()`: the stock is
managed, the threshold (the variant's own level, else the product's, else the shop's) is above zero, and the salable
quantity is above zero and at or below it.

In Tools > Tasks the job reads "Example: low stock check" with "Alfa - Example" beneath it, Covers "Product 42", and,
when done, `low: 3`.

## The rules

1. Hand your plugin to the entry, `BackgroundWork::of($this)`: your code reaches only your own work.
2. Implement `SubscriberInterface`, and leave `onAlfaDeclareWork`, `onAlfaRunTask`, `onAlfaRunJob` and
   `onAlfaWorkSettled` out of `getSubscribedEvents()` (see
   [How events reach a plugin](../events/how-events-reach-a-plugin.md#addressed-to-one-plugin-targeted)).
3. Never depend on who is signed in: the work runs as nobody.
4. A job's step walks at most `getUnits()`, ends before `getDeadline()`, and is safe to walk again: work it out from
   your data, never from what an earlier walk did. Without `callsOtherSystems()`, call no other system in a step; with
   it, make every call safe to repeat.
5. A task that calls another system names that call as a part and records it as soon as the outcome is known.
6. Declare `repeatable()` only when a second run duplicates nothing.
7. Close your own transactions with `TransactionState::commitLevel()` and `rollBackLevel()`.
8. Read `Enqueued`: `refused` is an answer, not an error.
9. Put no password, host or database text in a failure's message: staff read it.
10. Write what must outlive the row (it goes 30 days after it ends) to your own tables, in the handler or in
    `onAlfaWorkSettled`.
11. Your labels are keys of your own language file.
12. Read Alfa's tables through the calls marked `@api` where one exists; a direct read of a core table is read only
    and yours to keep working.

## What can go wrong

| What you see | The usual cause |
|---|---|
| `InvalidArgumentException`: "... declares no background work named ..." | The name is not in `onAlfaDeclareWork`, or its declaration was left out (the log `com_alfa.tasks` says why) |
| `InvalidArgumentException`: "... is a job: ask for it with job()" (or a task) | The name is declared as the other kind |
| `InvalidArgumentException` from `of()` | The object is not the plugin Joomla booted for its group and element, is not of an `alfa` group, or is not installed and enabled |
| A job says "Waits: the extension is disabled. It runs once the extension is enabled." | Enable the plugin: its work runs at the engine's next turn |
| A job says "Waits: the extension no longer declares this work. Cancel it, or update the extension." | An update removed the name. Declare it again, or cancel the job. |
| A job fails with "The plugin ... has no public onAlfaRunJob() method." | The plugin declares a job but has no method to run it. Add it, then Retry. |
| A job fails with "... ended with neither next() nor finished() ..." | A step returned without saying how it ended |
| A task is held after the server restarted | The task is not `repeatable()`, so an interrupted run waits for staff. Staff Run again or Mark resolved. |
| `onAlfaWorkSettled` is told twice of one end | Its first call threw, or the server stopped inside it. Make it safe to repeat. |
| The log `com_alfa.plugins` says your plugin lists an event "both as a targeted handler and on the shared dispatcher" | One of the four events is listed in `getSubscribedEvents()`, or the plugin is not a `SubscriberInterface` plugin, so Joomla puts every public `on...` method on its shared dispatcher. Alfa still calls the method; remove it from the list. |
