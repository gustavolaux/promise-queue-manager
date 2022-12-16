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

    private _promises: Array<PromiseFunction<T>>;

    private _concurrence: number;

    private _shouldStopOnError: boolean;

    private _running: number = 0;

    private _hasError: boolean = false;

    constructor(config: Config<T>) {
        super();

        if (!config) throw new Error('Missing config parameter');
        if (!config.promises && (!config.items || !config.promise)) throw new Error('Missing items');
        if (!config.concurrence) throw new Error('Missing concurrence');

        this._items = Array.from(config.items || []);
        this._promise = config.promise;
        this._promises = config.promises;
        this._concurrence = config.concurrence;
        this._shouldStopOnError = !!config.shouldStopOnError;

        this._setupListeners();
    }

    public start(): void {
        const canRun = this._canRun();
        if (!canRun) return;

        const queueSize = this._items ? this._items.length : this._promises.length;
        const firstInteractionSize = Math.min(queueSize, this._concurrence);

        for (let i = 0; i < firstInteractionSize; i += 1) {
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

    private _executePromise(promise: PromiseFunction<T>, item?: T): void {
        promise(item)
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
            if (this._running === 0) {
                this.emit(PromiseQueue.EVENTS.QUEUE_PROCESSED, this._hasError);
            } else {
                this.cancel();
            }

            return false;
        }

        const hasWaitingItems = (this._items && this._items.length > 0)
            || (this._promises && this._promises.length > 0);

        if (!hasWaitingItems && this._running === 0) {
            this.emit(PromiseQueue.EVENTS.QUEUE_PROCESSED, this._hasError);

            return false;
        }

        const canExecuteNextPromise = hasWaitingItems && this._concurrence > this._running;

        return canExecuteNextPromise;
    }
}
