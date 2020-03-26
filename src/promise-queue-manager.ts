import { EventEmitter } from 'events';

// Related to https://github.com/typescript-eslint/typescript-eslint/issues/363
/* eslint-disable no-unused-vars */
import {
    Config,
    PublicEvents,
    PrivateEvents,
    PromiseFunction,
    PromiseQueueItemResponse,
} from './types';
/* eslint-enable no-unused-vars */

export default class PromiseQueue<T> extends EventEmitter {
    public static EVENTS: PublicEvents = {
        ITEM_ERROR: 'item_error',
        ITEM_PROCESSED: 'item_processed',
        ITEM_PROCESSING: 'item_processing',
        QUEUE_PROCESSED: 'queue_processed',
    };

    private static PRIVATE_EVENTS: PrivateEvents = {
        ERROR: 'error',
        PROCESSED: 'processed',
    };

    private _items: Array<T>;

    private _promise: PromiseFunction<T>;

    private _promises: Promise<T>[];

    private _concurrence: number;

    private _shouldStopOnError: boolean;

    private _running: number = 0;

    private _hasError: boolean = false;

    constructor(config: Config<T>, concurrence: number, shouldStopOnError: boolean = false) {
        super();

        if (!config || (!config.promises && (!config.items || !config.promise))) {
            throw new Error('Invalid config');
        }

        this._items = config.items;
        this._promise = config.promise;
        this._promises = config.promises;
        this._concurrence = concurrence;
        this._shouldStopOnError = shouldStopOnError;

        this._setupListeners();
    }

    public start(): void {
        const canRun = this._canRun();
        if (!canRun) return;

        for (let i = 0; i < this._concurrence; i += 1) {
            this._runNextPromise();
        }
    }

    public cancel(): void {
        this._concurrence = 0;
    }

    private _setupListeners(): void {
        this.on(PromiseQueue.PRIVATE_EVENTS.ERROR, (errorItem: PromiseQueueItemResponse<T>): void => {
            this._hasError = true;

            this.emit(PromiseQueue.EVENTS.ITEM_ERROR, errorItem);
        });

        this.on(PromiseQueue.PRIVATE_EVENTS.PROCESSED, (): void => {
            this._running -= 1;

            const canRun = this._canRun();
            if (!canRun) return;

            this._runNextPromise();
        });
    }

    private _executePromise(promise: Promise<T> | PromiseFunction<T>, item?: T): void {
        let execute: Promise<T>;

        if (!item) {
            execute = promise as Promise<T>;
        } else {
            const promiseFunction = promise as PromiseFunction<T>;
            execute = promiseFunction(item);
        }

        execute
            .then((res) => {
                this.emit(PromiseQueue.EVENTS.ITEM_PROCESSED, { res, item });
            })
            .catch((err) => {
                this.emit(PromiseQueue.PRIVATE_EVENTS.ERROR, { err, item });
            })
            .finally(() => {
                this.emit(PromiseQueue.PRIVATE_EVENTS.PROCESSED);
            });

        this.emit(PromiseQueue.EVENTS.ITEM_PROCESSING, { item });
    }

    private _runNextPromise(): void {
        if (this._promises) {
            const promise = this._promises.shift();

            this._executePromise(promise);
        } else {
            const item = this._items.shift();

            this._executePromise(this._promise, item);
        }

        this._running += 1;
    }

    private _canRun(): boolean {
        if (this._shouldStopOnError && this._hasError) {
            this.cancel();

            return false;
        }

        if (this._items.length === 0) {
            this.emit(PromiseQueue.EVENTS.QUEUE_PROCESSED);

            return false;
        }

        const canExecuteNextPromise = this._concurrence > this._running;

        return canExecuteNextPromise;
    }
}
