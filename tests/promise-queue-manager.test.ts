import { setTimeout } from 'timers/promises';
import 'mocha';
import chai from 'chai';
import spies from 'chai-spies';

import PromiseQueue from '../src/promise-queue-manager';

chai.use(spies);

const expect = chai.expect;

const scenarios = [
    {
        name: 'with items',
        contexts: [
            {
                name: 'with concurrence 1',
                tests: [
                    {
                        name: 'should execute all items',
                        params: {
                            concurrence: 1,
                            items: [1, 2, 3, 4, 5],
                            promise: (item: number) => Promise.resolve(item),
                        },
                    },
                    {
                        name: 'should stop on item 3',
                        params: {
                            concurrence: 1,
                            items: [1, 2, 3, 4, 5],
                            promise: (item: number) => item === 3 ? Promise.reject(item) : Promise.resolve(item),
                            shouldStopOnError: true,
                        },
                        errorOnIndex: 2,
                    },
                    {
                        name: 'should keep going on error',
                        params: {
                            concurrence: 1,
                            items: [1, 2, 3, 4, 5],
                            promise: (item: number) => item === 3 ? Promise.reject(item) : Promise.resolve(item),
                            shouldStopOnError: false,
                        },
                        errorOnIndex: 2,
                    },
                ],
            },
            {
                name: 'with concurrence 2',
                tests: [
                    {
                        name: 'should execute all items',
                        params: {
                            concurrence: 2,
                            items: [1, 2, 3, 4, 5],
                            promise: (item: number) => Promise.resolve(item),
                        },
                    },
                    {
                        name: 'should stop on item 3',
                        params: {
                            concurrence: 2,
                            items: [1, 2, 3, 4, 5],
                            promise: (item: number) => item === 3 ? Promise.reject(item) : Promise.resolve(item),
                            shouldStopOnError: true,
                        },
                        errorOnIndex: 2,
                    },
                    {
                        name: 'should keep going on error',
                        params: {
                            concurrence: 2,
                            items: [1, 2, 3, 4, 5],
                            promise: (item: number) => item === 3 ? Promise.reject(item) : Promise.resolve(item),
                            shouldStopOnError: false,
                        },
                        errorOnIndex: 2,
                    },
                ],
            },
        ],
    },
];

describe('PromiseQueue', function() {
    let spyItemProcessed: any;
    let spyItemProcessing: any;
    let spyItemError: any;
    let spyQueueProcessed: any;

    beforeEach(() => {
        spyItemProcessed = chai.spy();
        spyItemProcessing = chai.spy();
        spyItemError = chai.spy();
        spyQueueProcessed = chai.spy();
    });

    scenarios.forEach((scenario) => {
        context(scenario.name, () => {
            scenario.contexts.forEach((ctx) => {
                context(ctx.name, () => {
                    ctx.tests.forEach((test) => {
                        it(test.name, async () => {
                            const queue = new PromiseQueue(test.params);

                            queue.on(PromiseQueue.EVENTS.ITEM_PROCESSED, spyItemProcessed);
                            queue.on(PromiseQueue.EVENTS.ITEM_PROCESSING, spyItemProcessing);
                            queue.on(PromiseQueue.EVENTS.ITEM_ERROR, spyItemError);
                            queue.on(PromiseQueue.EVENTS.QUEUE_PROCESSED, spyQueueProcessed);

                            queue.start();

                            // when queue starts we should have executed the same number of items as concurrence
                            expect(spyItemProcessing).to.have.been.called.exactly(test.params.concurrence);
                            test.params.items.slice(0, test.params.concurrence).map((item) => ({ item })).forEach((item) => {
                                expect(spyItemProcessing).to.have.been.called.with(item);
                            });

                            // but we should not have any processed items or errors
                            expect(spyItemProcessed).to.have.been.called.exactly(0);
                            expect(spyItemError).to.have.been.called.exactly(0);
                            expect(spyQueueProcessed).to.have.been.called.exactly(0);

                            // wait for the queue to finish
                            await setTimeout(0);

                            // to known how many items we queued to process
                            // we should consider if we have any error and if we should stop on error
                            const itemProcessingAmount = test.params.shouldStopOnError && test.errorOnIndex
                                ? test.errorOnIndex + test.params.concurrence
                                : test.params.items.length;

                            const itemErrorAmount = test.errorOnIndex
                                ? 1
                                : 0;

                            // to known how many items we should have processed
                            // we should consider if we should stop on error
                            const itemProcessedAmount = test.params.shouldStopOnError
                                ? Number(test.errorOnIndex || 0) + test.params.concurrence - itemErrorAmount
                                : test.params.items.length - itemErrorAmount;

                            expect(spyItemProcessing).to.have.been.called.exactly(itemProcessingAmount);
                            test.params.items.slice(0, itemProcessingAmount).map((item) => ({ item })).forEach((item) => {
                                expect(spyItemProcessing).to.have.been.called.with(item);
                            });

                            expect(spyItemProcessed).to.have.been.called.exactly(itemProcessedAmount);

                            // in order to validate the processed items, we check for errors
                            const processedItens = test.params.items.map((item) => ({ item, res: item }));
                            if (!itemErrorAmount) {
                                // if we don't have any error, we should have processed all items
                                processedItens.forEach((item) => {
                                    expect(spyItemProcessed).to.have.been.called.with(item);
                                });
                            } else {
                                // if we have any error, we should have processed all items until the error
                                // so we filter the errored item and slice for the processed amount
                                const successfullyProcessedItems = processedItens
                                    .filter((item, index) => index !== test.errorOnIndex)
                                    .slice(0, itemProcessedAmount);

                                successfullyProcessedItems.forEach((item) => {
                                    expect(spyItemProcessed).to.have.been.called.with(item);
                                });
                            }

                            // we should have called the error event if we have any error
                            expect(spyItemError).to.have.been.called.exactly(itemErrorAmount);
                            if (test.errorOnIndex) {
                                const errorItem = test.params.items[test.errorOnIndex];

                                expect(spyItemError).to.have.been.called.with({ err: errorItem, item: errorItem });
                            }

                            // and we should have called the queue processed event with success or error (true or false)
                            expect(spyQueueProcessed).to.have.been.called.exactly(1);
                            expect(spyQueueProcessed).to.have.been.called.with(!!itemErrorAmount);
                        });
                    });
                });
            });
        });
    });
});
