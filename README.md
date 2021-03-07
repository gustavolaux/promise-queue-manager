# promise-queue-manager

[![npm version](https://img.shields.io/npm/v/promise-queue-manager.svg?style=flat)](https://www.npmjs.org/package/promise-queue-manager)
[![install size](https://packagephobia.now.sh/badge?p=promise-queue-manager)](https://packagephobia.now.sh/result?p=promise-queue-manager)
[![language](https://img.shields.io/github/languages/top/gustavolaux/promise-queue-manager?style=flat)](https://www.npmjs.org/package/promise-queue-manager)
[![npm](https://img.shields.io/npm/dm/promise-queue-manager?style=flat)](https://www.npmjs.org/package/promise-queue-manager)

A queue manager for concurrent promise execution

## Installation

```
$ npm i -S promise-queue-manager
```

## Why use this module?

Sometimes you have to do any large processing using a promise list and you don't want to `Promise.all` then because it will load all the promises into memory and will stop when any error occur. This package can help you with that! You can specify concurrence and set if it can continue processing even if any error occur. It has zero external dependencies and uses `EventEmitter` to control event flow.

## Upgrading from 1.x.x to 2.x.x

`PromiseQueue.EVENTS.QUEUE_PROCESSED` is now fired even if `shouldStopOnError` is set to `true`.

## Usage

### Demo

You can access a repl demo [here](https://repl.it/@gustavolaux/promise-queue-manager-demo)

### Setup

Considering you have a list of promises, you can do this:
```
const promises: Promise<any>[] = [];

const config = {
    promises: promises,
};
```

If you have a list of items and a promise to execute it, you can do this:
```
const items: any[] = [];
const promise: () => Promise<any> = (item) => {
    return new Promise((resolve, reject) => {
        // do your stuff

        return resolve(); // or reject
    });
};

const config = {
    items: items,
    promise: promise,
};
```

Then you can setup a queue:
```
const concurrente = 10;
const shouldStopOnError = false;

const queue = new PromiseQueue<any>(config, concurrente, shouldStopOnError);
```

### Listening

Now you can setup your listeners. The `PromiseQueue` class have a static enum that helps you setting up your listeners: `ITEM_ERROR`, `ITEM_PROCESSING`, `ITEM_PROCESSED` and `QUEUE_PROCESSED`, it stays in `PromiseQueue.EVENTS`.
```
queue.on(PromiseQueue.EVENTS.ITEM_ERROR, (response: PromiseQueueItemResponse<any>) => {
    console.error(response);

    // you can manually stop the queue calling `.cancel` method
    queue.cancel();
});

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
```
queue.start();
```

## License

promise-queue-manager is freely distributable under the terms of the [MIT license](https://github.com/gustavolaux/promise-queue-manager/blob/master/LICENSE).
