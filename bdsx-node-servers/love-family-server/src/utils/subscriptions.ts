
export type SubscriptionCallback<TEventData> = (data: TEventData) => void;
export class Subscription<TEventData> {
    private _subscribers: (null | SubscriptionCallback<TEventData>)[] = [];

    constructor(private _callbacks: {
        onSubscribersChanged: (count: number) => void,
        onSubscriberError: (err: unknown, data: TEventData) => void,
    } = {
            onSubscribersChanged: () => { },
            onSubscriberError: () => { },
        }) {

    }

    subscribe = (callback: SubscriptionCallback<TEventData>) => {
        this._subscribers.push(callback);
        const iSubscriber = this._subscribers.length - 1;

        this._callbacks.onSubscribersChanged(this._subscribers.filter(x => x).length);

        return {
            unsubscribe: () => {
                this._subscribers[iSubscriber] = null;
            }
        };
    };

    next = (data: TEventData) => {
        this._subscribers.forEach(x => {
            if (!x) { return; }

            try {
                x(data);
            } catch (err) {
                this._callbacks.onSubscriberError(err, data);
            }
        });
    };
};
