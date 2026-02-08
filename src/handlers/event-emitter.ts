import EventEmitter2 from "eventemitter2";

export function configureEventEmitter() {
  return new EventEmitter2({
    // set this to `true` to use wildcards
    wildcard: true,

    // the delimiter used to segment namespaces
    delimiter: ".",

    // set this to `true` if you want to emit the newListener event
    newListener: false,

    // set this to `true` if you want to emit the removeListener event
    removeListener: false,

    // the maximum amount of listeners that can be assigned to an event
    maxListeners: 10,

    // show event name in memory leak message when more than maximum amount of listeners is assigned
    verboseMemoryLeak: true,

    // disable throwing uncaughtException if an error event is emitted and it has no listeners
    ignoreErrors: false,
  });
}
