export type PromiseFunction<T> = (...args: any) => Promise<T>;

export interface PromiseQueueItemResponse<T> {
    item: T;
    res?: T;
    err?: Error;
}

export interface PublicEvents {
    ITEM_ERROR: string;
    ITEM_PROCESSED: string;
    ITEM_PROCESSING: string;
    QUEUE_PROCESSED: string;
}

export interface PrivateEvents {
    ERROR: string;
    PROCESSED: string;
}

export interface Config<T> {
    items?: Array<T>;
    promise?: PromiseFunction<T>;
    promises?: Promise<T>[];
}
