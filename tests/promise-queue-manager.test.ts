const assert = require('assert');

const PromiseQueue = require('../src/promise-queue-manager').default;

const getMockPromise = (ms = 0, shouldResolve = true) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldResolve) return resolve();

            return reject();
        }, ms);
    });
};

describe('PromiseQueue suite', function() {
    describe('Test with 1 promise and 1 concurrency', function() {
        const concurrence = 1;
        const shouldStopOnError = true;

        let promise;

        beforeEach(function() {
            promise = getMockPromise(10, true);
        });

        it('should resolve promise with items', function(done) {
            try {
                const config = {
                    promise: getMockPromise,
                    items: [1, 2, 3, 4, 5],
                };

                const queue = new PromiseQueue(config, concurrence, shouldStopOnError);

                queue.on(PromiseQueue.EVENTS.ITEM_ERROR, () => {
                    return done(new Error('Error on promise resolving'));
                });

                queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, done);

                queue.start();
            } catch (err) {
                return done(err);
            }
        });

        it('should resolve promises without items', function(done) {
            try {
                const config = {
                    promises: [1, 2, 3, 4, 5].map((ms) => getMockPromise(ms)),
                };

                const queue = new PromiseQueue(config, concurrence, shouldStopOnError);

                queue.on(PromiseQueue.EVENTS.ITEM_ERROR, () => {
                    return done(new Error('Error on promise resolving'));
                });

                queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, done);

                queue.start();
            } catch (err) {
                return done(err);
            }
        });

        it('should reject promises without items', function(done) {
            try {
                const config = {
                    promises: [1, 2, 3, 4, 5].map((ms) => getMockPromise(ms, ms % 2 === 0)),
                };

                const queue = new PromiseQueue(config, concurrence, shouldStopOnError);

                queue.on(PromiseQueue.EVENTS.ITEM_ERROR, () => done());

                queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, () => {
                    return done(new Error('Promise should not be resolved'));
                });

                queue.start();
            } catch (err) {
                return done(err);
            }
        });
    });

    describe('Test with 1 promise and 10 concurrency', function() {
        const concurrence = 10;
        const shouldStopOnError = true;

        let promise;

        beforeEach(function() {
            promise = getMockPromise(10, true);
        });

        it('should resolve promise with items', function(done) {
            try {
                const config = {
                    promise: getMockPromise,
                    items: [1, 2, 3, 4, 5],
                };

                const queue = new PromiseQueue(config, concurrence, shouldStopOnError);

                queue.on(PromiseQueue.EVENTS.ITEM_ERROR, () => {
                    return done(new Error('Error on promise resolving'));
                });

                queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, done);

                queue.start();
            } catch (err) {
                return done(err);
            }
        });

        it('should resolve promises without items', function(done) {
            try {
                const config = {
                    promises: [1, 2, 3, 4, 5].map((ms) => getMockPromise(ms)),
                };

                const queue = new PromiseQueue(config, concurrence, shouldStopOnError);

                queue.on(PromiseQueue.EVENTS.ITEM_ERROR, () => {
                    return done(new Error('Error on promise resolving'));
                });

                queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, done);

                queue.start();
            } catch (err) {
                return done(err);
            }
        });

        it('should reject promises without items', function(done) {
            try {
                const config = {
                    promises: [1, 2, 3, 4, 5].map((ms) => getMockPromise(ms, ms < 5)),
                };

                const queue = new PromiseQueue(config, concurrence, shouldStopOnError);

                queue.on(PromiseQueue.EVENTS.ITEM_ERROR, () => done());

                queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, () => {
                    return done(new Error('Promise should not be resolved'));
                });

                queue.start();
            } catch (err) {
                return done(err);
            }
        });
    });
});
