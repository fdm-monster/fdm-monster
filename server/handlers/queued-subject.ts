import {Subject} from "rxjs";

export class QueueingSubject extends Subject<any> {
    #queuedValues = [];

    next(value) {
        if (this.closed || this.observed)
            super.next(value);
        else
            this.#queuedValues.push(value);
    }

    _subscribe(subscriber) {
        const subscription = super.subscribe(subscriber);
        if (this.#queuedValues.length) {
            this.#queuedValues.forEach((value) => super.next(value));
            this.#queuedValues.splice(0);
        }
        return subscription;
    }
}
