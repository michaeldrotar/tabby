import EventEmitter from 'events'

/**
  Creates an object with methods to handle event functionality.

  @example
  const onUpdated = createEvent<[number]>("updated");
  const MyLibrary = {
    onUpdated: onUpdated.listener
  }
  const someMethod = () => {
    onUpdated.emit(123)
  }
  const listener = (id: number) => {
    console.log(id)
  }
  MyLibrary.onUpdated.addListener(listener)
  MyLibrary.onUpdated.hasListener(listener) // => true
  MyLibrary.onUpdated.hasListeners()        // => true
  MyLibrary.onUpdated.removeListener(listener)
 */
export const createEvent = <PARAMS extends unknown[] = []>(
  eventName: string,
) => {
  const emitter = new EventEmitter()

  return {
    listener: {
      /**
       * Adds a listener for the event.
       *
       * All callbacks are fired sequentially and synchronously when the
       * event is emitted. An error in one of them will stop later
       * callbacks from being called.
       */
      addListener: (callback: (...params: PARAMS) => void) => {
        emitter.addListener(eventName, callback)
      },
      /**
       * Checks if the given callback is in the listener list.
       */
      hasListener: (callback: (...params: PARAMS) => void) =>
        emitter.listenerCount(eventName, callback) > 0,
      /**
       * Checks if the event has at least one listener.
       */
      hasListeners: () => emitter.listenerCount(eventName) > 0,
      /**
       * Removes the given callback from the listener list.
       *
       * If the callback was added multiple times, this will only remove
       * one of them.
       */
      removeListener: (callback: (...params: PARAMS) => void) => {
        emitter.removeListener(eventName, callback)
      },
    },
    /**
     * Fires the event, calling all registered listeners synchronously
     * in the order they were registered.
     */
    emit: (...params: PARAMS): void => {
      emitter.emit(eventName, ...params)
    },
  }
}
