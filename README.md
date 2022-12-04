# promise-queue-manager

[![npm version](https://img.shields.io/npm/v/promise-queue-manager.svg?style=flat)](https://www.npmjs.org/package/promise-queue-manager)
[![install size](https://packagephobia.now.sh/badge?p=promise-queue-manager)](https://packagephobia.now.sh/result?p=promise-queue-manager)
[![language](https://img.shields.io/github/languages/top/gustavolaux/promise-queue-manager?style=flat)](https://www.npmjs.org/package/promise-queue-manager)
[![npm](https://img.shields.io/npm/dm/promise-queue-manager?style=flat)](https://www.npmjs.org/package/promise-queue-manager)

A queue manager for concurrent promise execution

## Installation

```sh
npm i -S promise-queue-manager
```

## Why use this module?

Sometimes you have to do any large processing using a promise list and you don't want to `Promise.all` then because it will load all the promises into memory and will stop when any error occur. This package can help you with that! You can specify concurrence and set if it can continue processing even if any error occur. It has zero external dependencies and uses `EventEmitter` to control event flow.

## Upgrading

### From 2.x.x to 3.x.x

- Old constructor parameters `concurrence` and `shouldStopOnError` are now passed in `config` object.
- The `promises` list parameter now require a function that returns a promise to avoid early promise execution. (Huge thanks to [@dArignac](https://github.com/dArignac) with [this issue](https://github.com/gustavolaux/promise-queue-manager/issues/16))

### From 1.x.x to 2.x.x

- `PromiseQueue.EVENTS.QUEUE_PROCESSED` is now fired even if `shouldStopOnError` is set to `true`.

## Usage

### Demo

You can access a repl demo [here](https://repl.it/@gustavolaux/promise-queue-manager-demo)

### Setup

You can use this lib in two ways: with a list of functions that return a promise or with a promise and a list of items to process. In both cases:

```ts
const saveOnDatabase = async (data) => {
    const result = await repository.save(data);

    return result;
};

const config = {
    concurrence: 10,
    shouldStopOnError: true,
};
```

Using a list of promises:
```ts
const items = [
    { name: 'foo' },
    { name: 'bar' },
];

// you need to wrap your promise inside a function
// to avoid early calls
config.promises = items.map(item => () => saveOnDatabase(item));
```

Using a list of items:
```ts
const items = [
    { name: 'foo' },
    { name: 'bar' },
];

config.promise = saveOnDatabase;
config.items = items;
```

Now you can initialize the queue:
```ts
const queue = new PromiseQueue<YourInterface>(config);
```

### Listening

Now you can setup your listeners. The `PromiseQueue` class have a static enum that helps you setting up your listeners: `ITEM_ERROR`, `ITEM_PROCESSING`, `ITEM_PROCESSED` and `QUEUE_PROCESSED`, it stays in `PromiseQueue.EVENTS`.
```ts
queue.on(PromiseQueue.EVENTS.ITEM_ERROR, (response: PromiseQueueItemResponse<any>) => {
    console.error(response);

    // you can manually stop the queue calling `.cancel` method
    queue.cancel();
});

// useful only if `items` is used
queue.on(PromiseQueue.EVENTS.ITEM_PROCESSING, (response: PromiseQueueItemResponse<any>) => {
    console.log(response);
});

queue.on(PromiseQueue.EVENTS.ITEM_PROCESSED, (response: PromiseQueueItemResponse<any>) => {
    console.log(response);

    // you can set some rule to cancel the queue anytime you want
    const canContinue = someMethod();
    if (!canContinue) queue.cancel();
});

queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, () => {
    console.log(`Done!`);
});
```

Now you can start the queue:
```ts
queue.start();
```

## License

promise-queue-manager is freely distributable under the terms of the [MIT license](https://github.com/gustavolaux/promise-queue-manager/blob/master/LICENSE).
