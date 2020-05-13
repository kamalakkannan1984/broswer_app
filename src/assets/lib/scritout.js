(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
'use strict';

module.exports = argsArray;

function argsArray(fun) {
  return function () {
    var len = arguments.length;
    if (len) {
      var args = [];
      var i = -1;
      while (++i < len) {
        args[i] = arguments[i];
      }
      return fun.call(this, args);
    } else {
      return fun.call(this, []);
    }
  };
}
},{}],4:[function(require,module,exports){
(function (global){
'use strict';
var Mutation = global.MutationObserver || global.WebKitMutationObserver;

var scheduleDrain;

{
  if (Mutation) {
    var called = 0;
    var observer = new Mutation(nextTick);
    var element = global.document.createTextNode('');
    observer.observe(element, {
      characterData: true
    });
    scheduleDrain = function () {
      element.data = (called = ++called % 2);
    };
  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
    var channel = new global.MessageChannel();
    channel.port1.onmessage = nextTick;
    scheduleDrain = function () {
      channel.port2.postMessage(0);
    };
  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
    scheduleDrain = function () {

      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
      var scriptEl = global.document.createElement('script');
      scriptEl.onreadystatechange = function () {
        nextTick();

        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      global.document.documentElement.appendChild(scriptEl);
    };
  } else {
    scheduleDrain = function () {
      setTimeout(nextTick, 0);
    };
  }
}

var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}

module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function (process,global){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var immediate = _interopDefault(require('immediate'));
var uuidV4 = _interopDefault(require('uuid'));
var Md5 = _interopDefault(require('spark-md5'));
var vuvuzela = _interopDefault(require('vuvuzela'));
var getArguments = _interopDefault(require('argsarray'));
var inherits = _interopDefault(require('inherits'));
var events = require('events');

function mangle(key) {
  return '$' + key;
}
function unmangle(key) {
  return key.substring(1);
}
function Map$1() {
  this._store = {};
}
Map$1.prototype.get = function (key) {
  var mangled = mangle(key);
  return this._store[mangled];
};
Map$1.prototype.set = function (key, value) {
  var mangled = mangle(key);
  this._store[mangled] = value;
  return true;
};
Map$1.prototype.has = function (key) {
  var mangled = mangle(key);
  return mangled in this._store;
};
Map$1.prototype.delete = function (key) {
  var mangled = mangle(key);
  var res = mangled in this._store;
  delete this._store[mangled];
  return res;
};
Map$1.prototype.forEach = function (cb) {
  var keys = Object.keys(this._store);
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i];
    var value = this._store[key];
    key = unmangle(key);
    cb(value, key);
  }
};
Object.defineProperty(Map$1.prototype, 'size', {
  get: function () {
    return Object.keys(this._store).length;
  }
});

function Set$1(array) {
  this._store = new Map$1();

  // init with an array
  if (array && Array.isArray(array)) {
    for (var i = 0, len = array.length; i < len; i++) {
      this.add(array[i]);
    }
  }
}
Set$1.prototype.add = function (key) {
  return this._store.set(key, true);
};
Set$1.prototype.has = function (key) {
  return this._store.has(key);
};
Set$1.prototype.forEach = function (cb) {
  this._store.forEach(function (value, key) {
    cb(key);
  });
};
Object.defineProperty(Set$1.prototype, 'size', {
  get: function () {
    return this._store.size;
  }
});

/* global Map,Set,Symbol */
// Based on https://kangax.github.io/compat-table/es6/ we can sniff out
// incomplete Map/Set implementations which would otherwise cause our tests to fail.
// Notably they fail in IE11 and iOS 8.4, which this prevents.
function supportsMapAndSet() {
  if (typeof Symbol === 'undefined' || typeof Map === 'undefined' || typeof Set === 'undefined') {
    return false;
  }
  var prop = Object.getOwnPropertyDescriptor(Map, Symbol.species);
  return prop && 'get' in prop && Map[Symbol.species] === Map;
}

// based on https://github.com/montagejs/collections

var ExportedSet;
var ExportedMap;

{
  if (supportsMapAndSet()) { // prefer built-in Map/Set
    ExportedSet = Set;
    ExportedMap = Map;
  } else { // fall back to our polyfill
    ExportedSet = Set$1;
    ExportedMap = Map$1;
  }
}

function isBinaryObject(object) {
  return (typeof ArrayBuffer !== 'undefined' && object instanceof ArrayBuffer) ||
    (typeof Blob !== 'undefined' && object instanceof Blob);
}

function cloneArrayBuffer(buff) {
  if (typeof buff.slice === 'function') {
    return buff.slice(0);
  }
  // IE10-11 slice() polyfill
  var target = new ArrayBuffer(buff.byteLength);
  var targetArray = new Uint8Array(target);
  var sourceArray = new Uint8Array(buff);
  targetArray.set(sourceArray);
  return target;
}

function cloneBinaryObject(object) {
  if (object instanceof ArrayBuffer) {
    return cloneArrayBuffer(object);
  }
  var size = object.size;
  var type = object.type;
  // Blob
  if (typeof object.slice === 'function') {
    return object.slice(0, size, type);
  }
  // PhantomJS slice() replacement
  return object.webkitSlice(0, size, type);
}

// most of this is borrowed from lodash.isPlainObject:
// https://github.com/fis-components/lodash.isplainobject/
// blob/29c358140a74f252aeb08c9eb28bef86f2217d4a/index.js

var funcToString = Function.prototype.toString;
var objectCtorString = funcToString.call(Object);

function isPlainObject(value) {
  var proto = Object.getPrototypeOf(value);
  /* istanbul ignore if */
  if (proto === null) { // not sure when this happens, but I guess it can
    return true;
  }
  var Ctor = proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

function clone(object) {
  var newObject;
  var i;
  var len;

  if (!object || typeof object !== 'object') {
    return object;
  }

  if (Array.isArray(object)) {
    newObject = [];
    for (i = 0, len = object.length; i < len; i++) {
      newObject[i] = clone(object[i]);
    }
    return newObject;
  }

  // special case: to avoid inconsistencies between IndexedDB
  // and other backends, we automatically stringify Dates
  if (object instanceof Date) {
    return object.toISOString();
  }

  if (isBinaryObject(object)) {
    return cloneBinaryObject(object);
  }

  if (!isPlainObject(object)) {
    return object; // don't clone objects like Workers
  }

  newObject = {};
  for (i in object) {
    /* istanbul ignore else */
    if (Object.prototype.hasOwnProperty.call(object, i)) {
      var value = clone(object[i]);
      if (typeof value !== 'undefined') {
        newObject[i] = value;
      }
    }
  }
  return newObject;
}

function once(fun) {
  var called = false;
  return getArguments(function (args) {
    /* istanbul ignore if */
    if (called) {
      // this is a smoke test and should never actually happen
      throw new Error('once called more than once');
    } else {
      called = true;
      fun.apply(this, args);
    }
  });
}

function toPromise(func) {
  //create the function we will be returning
  return getArguments(function (args) {
    // Clone arguments
    args = clone(args);
    var self = this;
    // if the last argument is a function, assume its a callback
    var usedCB = (typeof args[args.length - 1] === 'function') ? args.pop() : false;
    var promise = new Promise(function (fulfill, reject) {
      var resp;
      try {
        var callback = once(function (err, mesg) {
          if (err) {
            reject(err);
          } else {
            fulfill(mesg);
          }
        });
        // create a callback for this invocation
        // apply the function in the orig context
        args.push(callback);
        resp = func.apply(self, args);
        if (resp && typeof resp.then === 'function') {
          fulfill(resp);
        }
      } catch (e) {
        reject(e);
      }
    });
    // if there is a callback, call it back
    if (usedCB) {
      promise.then(function (result) {
        usedCB(null, result);
      }, usedCB);
    }
    return promise;
  });
}

function logApiCall(self, name, args) {
  /* istanbul ignore if */
  if (self.constructor.listeners('debug').length) {
    var logArgs = ['api', self.name, name];
    for (var i = 0; i < args.length - 1; i++) {
      logArgs.push(args[i]);
    }
    self.constructor.emit('debug', logArgs);

    // override the callback itself to log the response
    var origCallback = args[args.length - 1];
    args[args.length - 1] = function (err, res) {
      var responseArgs = ['api', self.name, name];
      responseArgs = responseArgs.concat(
        err ? ['error', err] : ['success', res]
      );
      self.constructor.emit('debug', responseArgs);
      origCallback(err, res);
    };
  }
}

function adapterFun(name, callback) {
  return toPromise(getArguments(function (args) {
    if (this._closed) {
      return Promise.reject(new Error('database is closed'));
    }
    if (this._destroyed) {
      return Promise.reject(new Error('database is destroyed'));
    }
    var self = this;
    logApiCall(self, name, args);
    if (!this.taskqueue.isReady) {
      return new Promise(function (fulfill, reject) {
        self.taskqueue.addTask(function (failed) {
          if (failed) {
            reject(failed);
          } else {
            fulfill(self[name].apply(self, args));
          }
        });
      });
    }
    return callback.apply(this, args);
  }));
}

// like underscore/lodash _.pick()
function pick(obj, arr) {
  var res = {};
  for (var i = 0, len = arr.length; i < len; i++) {
    var prop = arr[i];
    if (prop in obj) {
      res[prop] = obj[prop];
    }
  }
  return res;
}

// Most browsers throttle concurrent requests at 6, so it's silly
// to shim _bulk_get by trying to launch potentially hundreds of requests
// and then letting the majority time out. We can handle this ourselves.
var MAX_NUM_CONCURRENT_REQUESTS = 6;

function identityFunction(x) {
  return x;
}

function formatResultForOpenRevsGet(result) {
  return [{
    ok: result
  }];
}

// shim for P/CouchDB adapters that don't directly implement _bulk_get
function bulkGet(db, opts, callback) {
  var requests = opts.docs;

  // consolidate into one request per doc if possible
  var requestsById = new ExportedMap();
  requests.forEach(function (request) {
    if (requestsById.has(request.id)) {
      requestsById.get(request.id).push(request);
    } else {
      requestsById.set(request.id, [request]);
    }
  });

  var numDocs = requestsById.size;
  var numDone = 0;
  var perDocResults = new Array(numDocs);

  function collapseResultsAndFinish() {
    var results = [];
    perDocResults.forEach(function (res) {
      res.docs.forEach(function (info) {
        results.push({
          id: res.id,
          docs: [info]
        });
      });
    });
    callback(null, {results: results});
  }

  function checkDone() {
    if (++numDone === numDocs) {
      collapseResultsAndFinish();
    }
  }

  function gotResult(docIndex, id, docs) {
    perDocResults[docIndex] = {id: id, docs: docs};
    checkDone();
  }

  var allRequests = [];
  requestsById.forEach(function (value, key) {
    allRequests.push(key);
  });

  var i = 0;

  function nextBatch() {

    if (i >= allRequests.length) {
      return;
    }

    var upTo = Math.min(i + MAX_NUM_CONCURRENT_REQUESTS, allRequests.length);
    var batch = allRequests.slice(i, upTo);
    processBatch(batch, i);
    i += batch.length;
  }

  function processBatch(batch, offset) {
    batch.forEach(function (docId, j) {
      var docIdx = offset + j;
      var docRequests = requestsById.get(docId);

      // just use the first request as the "template"
      // TODO: The _bulk_get API allows for more subtle use cases than this,
      // but for now it is unlikely that there will be a mix of different
      // "atts_since" or "attachments" in the same request, since it's just
      // replicate.js that is using this for the moment.
      // Also, atts_since is aspirational, since we don't support it yet.
      var docOpts = pick(docRequests[0], ['atts_since', 'attachments']);
      docOpts.open_revs = docRequests.map(function (request) {
        // rev is optional, open_revs disallowed
        return request.rev;
      });

      // remove falsey / undefined revisions
      docOpts.open_revs = docOpts.open_revs.filter(identityFunction);

      var formatResult = identityFunction;

      if (docOpts.open_revs.length === 0) {
        delete docOpts.open_revs;

        // when fetching only the "winning" leaf,
        // transform the result so it looks like an open_revs
        // request
        formatResult = formatResultForOpenRevsGet;
      }

      // globally-supplied options
      ['revs', 'attachments', 'binary', 'ajax', 'latest'].forEach(function (param) {
        if (param in opts) {
          docOpts[param] = opts[param];
        }
      });
      db.get(docId, docOpts, function (err, res) {
        var result;
        /* istanbul ignore if */
        if (err) {
          result = [{error: err}];
        } else {
          result = formatResult(res);
        }
        gotResult(docIdx, docId, result);
        nextBatch();
      });
    });
  }

  nextBatch();

}

var hasLocal;

try {
  localStorage.setItem('_pouch_check_localstorage', 1);
  hasLocal = !!localStorage.getItem('_pouch_check_localstorage');
} catch (e) {
  hasLocal = false;
}

function hasLocalStorage() {
  return hasLocal;
}

// Custom nextTick() shim for browsers. In node, this will just be process.nextTick(). We

inherits(Changes, events.EventEmitter);

/* istanbul ignore next */
function attachBrowserEvents(self) {
  if (hasLocalStorage()) {
    addEventListener("storage", function (e) {
      self.emit(e.key);
    });
  }
}

function Changes() {
  events.EventEmitter.call(this);
  this._listeners = {};

  attachBrowserEvents(this);
}
Changes.prototype.addListener = function (dbName, id, db, opts) {
  /* istanbul ignore if */
  if (this._listeners[id]) {
    return;
  }
  var self = this;
  var inprogress = false;
  function eventFunction() {
    /* istanbul ignore if */
    if (!self._listeners[id]) {
      return;
    }
    if (inprogress) {
      inprogress = 'waiting';
      return;
    }
    inprogress = true;
    var changesOpts = pick(opts, [
      'style', 'include_docs', 'attachments', 'conflicts', 'filter',
      'doc_ids', 'view', 'since', 'query_params', 'binary', 'return_docs'
    ]);

    /* istanbul ignore next */
    function onError() {
      inprogress = false;
    }

    db.changes(changesOpts).on('change', function (c) {
      if (c.seq > opts.since && !opts.cancelled) {
        opts.since = c.seq;
        opts.onChange(c);
      }
    }).on('complete', function () {
      if (inprogress === 'waiting') {
        immediate(eventFunction);
      }
      inprogress = false;
    }).on('error', onError);
  }
  this._listeners[id] = eventFunction;
  this.on(dbName, eventFunction);
};

Changes.prototype.removeListener = function (dbName, id) {
  /* istanbul ignore if */
  if (!(id in this._listeners)) {
    return;
  }
  events.EventEmitter.prototype.removeListener.call(this, dbName,
    this._listeners[id]);
  delete this._listeners[id];
};


/* istanbul ignore next */
Changes.prototype.notifyLocalWindows = function (dbName) {
  //do a useless change on a storage thing
  //in order to get other windows's listeners to activate
  if (hasLocalStorage()) {
    localStorage[dbName] = (localStorage[dbName] === "a") ? "b" : "a";
  }
};

Changes.prototype.notify = function (dbName) {
  this.emit(dbName);
  this.notifyLocalWindows(dbName);
};

function guardedConsole(method) {
  /* istanbul ignore else */
  if (typeof console !== 'undefined' && typeof console[method] === 'function') {
    var args = Array.prototype.slice.call(arguments, 1);
    console[method].apply(console, args);
  }
}

function randomNumber(min, max) {
  var maxTimeout = 600000; // Hard-coded default of 10 minutes
  min = parseInt(min, 10) || 0;
  max = parseInt(max, 10);
  if (max !== max || max <= min) {
    max = (min || 1) << 1; //doubling
  } else {
    max = max + 1;
  }
  // In order to not exceed maxTimeout, pick a random value between half of maxTimeout and maxTimeout
  if (max > maxTimeout) {
    min = maxTimeout >> 1; // divide by two
    max = maxTimeout;
  }
  var ratio = Math.random();
  var range = max - min;

  return ~~(range * ratio + min); // ~~ coerces to an int, but fast.
}

function defaultBackOff(min) {
  var max = 0;
  if (!min) {
    max = 2000;
  }
  return randomNumber(min, max);
}

// designed to give info to browser users, who are disturbed
// when they see http errors in the console
function explainError(status, str) {
  guardedConsole('info', 'The above ' + status + ' is totally normal. ' + str);
}

var assign;
{
  if (typeof Object.assign === 'function') {
    assign = Object.assign;
  } else {
    // lite Object.assign polyfill based on
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    assign = function (target) {
      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
}

var $inject_Object_assign = assign;

inherits(PouchError, Error);

function PouchError(status, error, reason) {
  Error.call(this, reason);
  this.status = status;
  this.name = error;
  this.message = reason;
  this.error = true;
}

PouchError.prototype.toString = function () {
  return JSON.stringify({
    status: this.status,
    name: this.name,
    message: this.message,
    reason: this.reason
  });
};

var UNAUTHORIZED = new PouchError(401, 'unauthorized', "Name or password is incorrect.");
var MISSING_BULK_DOCS = new PouchError(400, 'bad_request', "Missing JSON list of 'docs'");
var MISSING_DOC = new PouchError(404, 'not_found', 'missing');
var REV_CONFLICT = new PouchError(409, 'conflict', 'Document update conflict');
var INVALID_ID = new PouchError(400, 'bad_request', '_id field must contain a string');
var MISSING_ID = new PouchError(412, 'missing_id', '_id is required for puts');
var RESERVED_ID = new PouchError(400, 'bad_request', 'Only reserved document ids may start with underscore.');
var NOT_OPEN = new PouchError(412, 'precondition_failed', 'Database not open');
var UNKNOWN_ERROR = new PouchError(500, 'unknown_error', 'Database encountered an unknown error');
var BAD_ARG = new PouchError(500, 'badarg', 'Some query argument is invalid');
var INVALID_REQUEST = new PouchError(400, 'invalid_request', 'Request was invalid');
var QUERY_PARSE_ERROR = new PouchError(400, 'query_parse_error', 'Some query parameter is invalid');
var DOC_VALIDATION = new PouchError(500, 'doc_validation', 'Bad special document member');
var BAD_REQUEST = new PouchError(400, 'bad_request', 'Something wrong with the request');
var NOT_AN_OBJECT = new PouchError(400, 'bad_request', 'Document must be a JSON object');
var DB_MISSING = new PouchError(404, 'not_found', 'Database not found');
var IDB_ERROR = new PouchError(500, 'indexed_db_went_bad', 'unknown');
var WSQ_ERROR = new PouchError(500, 'web_sql_went_bad', 'unknown');
var LDB_ERROR = new PouchError(500, 'levelDB_went_went_bad', 'unknown');
var FORBIDDEN = new PouchError(403, 'forbidden', 'Forbidden by design doc validate_doc_update function');
var INVALID_REV = new PouchError(400, 'bad_request', 'Invalid rev format');
var FILE_EXISTS = new PouchError(412, 'file_exists', 'The database could not be created, the file already exists.');
var MISSING_STUB = new PouchError(412, 'missing_stub', 'A pre-existing attachment stub wasn\'t found');
var INVALID_URL = new PouchError(413, 'invalid_url', 'Provided URL is invalid');

function createError(error, reason) {
  function CustomPouchError(reason) {
    // inherit error properties from our parent error manually
    // so as to allow proper JSON parsing.
    /* jshint ignore:start */
    for (var p in error) {
      if (typeof error[p] !== 'function') {
        this[p] = error[p];
      }
    }
    /* jshint ignore:end */
    if (reason !== undefined) {
      this.reason = reason;
    }
  }
  CustomPouchError.prototype = PouchError.prototype;
  return new CustomPouchError(reason);
}

function generateErrorFromResponse(err) {

  if (typeof err !== 'object') {
    var data = err;
    err = UNKNOWN_ERROR;
    err.data = data;
  }

  if ('error' in err && err.error === 'conflict') {
    err.name = 'conflict';
    err.status = 409;
  }

  if (!('name' in err)) {
    err.name = err.error || 'unknown';
  }

  if (!('status' in err)) {
    err.status = 500;
  }

  if (!('message' in err)) {
    err.message = err.message || err.reason;
  }

  return err;
}

function tryFilter(filter, doc, req) {
  try {
    return !filter(doc, req);
  } catch (err) {
    var msg = 'Filter function threw: ' + err.toString();
    return createError(BAD_REQUEST, msg);
  }
}

function filterChange(opts) {
  var req = {};
  var hasFilter = opts.filter && typeof opts.filter === 'function';
  req.query = opts.query_params;

  return function filter(change) {
    if (!change.doc) {
      // CSG sends events on the changes feed that don't have documents,
      // this hack makes a whole lot of existing code robust.
      change.doc = {};
    }

    var filterReturn = hasFilter && tryFilter(opts.filter, change.doc, req);

    if (typeof filterReturn === 'object') {
      return filterReturn;
    }

    if (filterReturn) {
      return false;
    }

    if (!opts.include_docs) {
      delete change.doc;
    } else if (!opts.attachments) {
      for (var att in change.doc._attachments) {
        /* istanbul ignore else */
        if (change.doc._attachments.hasOwnProperty(att)) {
          change.doc._attachments[att].stub = true;
        }
      }
    }
    return true;
  };
}

function flatten(arrs) {
  var res = [];
  for (var i = 0, len = arrs.length; i < len; i++) {
    res = res.concat(arrs[i]);
  }
  return res;
}

// shim for Function.prototype.name,

// Determine id an ID is valid
//   - invalid IDs begin with an underescore that does not begin '_design' or
//     '_local'
//   - any other string value is a valid id
// Returns the specific error object for each case
function invalidIdError(id) {
  var err;
  if (!id) {
    err = createError(MISSING_ID);
  } else if (typeof id !== 'string') {
    err = createError(INVALID_ID);
  } else if (/^_/.test(id) && !(/^_(design|local)/).test(id)) {
    err = createError(RESERVED_ID);
  }
  if (err) {
    throw err;
  }
}

// Checks if a PouchDB object is "remote" or not. This is

function isRemote(db) {
  if (typeof db._remote === 'boolean') {
    return db._remote;
  }
  /* istanbul ignore next */
  if (typeof db.type === 'function') {
    guardedConsole('warn',
      'db.type() is deprecated and will be removed in ' +
      'a future version of PouchDB');
    return db.type() === 'http';
  }
  /* istanbul ignore next */
  return false;
}

function listenerCount(ee, type) {
  return 'listenerCount' in ee ? ee.listenerCount(type) :
                                 events.EventEmitter.listenerCount(ee, type);
}

function parseDesignDocFunctionName(s) {
  if (!s) {
    return null;
  }
  var parts = s.split('/');
  if (parts.length === 2) {
    return parts;
  }
  if (parts.length === 1) {
    return [s, s];
  }
  return null;
}

function normalizeDesignDocFunctionName(s) {
  var normalized = parseDesignDocFunctionName(s);
  return normalized ? normalized.join('/') : null;
}

// originally parseUri 1.2.2, now patched by us
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
var keys = ["source", "protocol", "authority", "userInfo", "user", "password",
    "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
var qName ="queryKey";
var qParser = /(?:^|&)([^&=]*)=?([^&]*)/g;

// use the "loose" parser
/* eslint maxlen: 0, no-useless-escape: 0 */
var parser = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

function parseUri(str) {
  var m = parser.exec(str);
  var uri = {};
  var i = 14;

  while (i--) {
    var key = keys[i];
    var value = m[i] || "";
    var encoded = ['user', 'password'].indexOf(key) !== -1;
    uri[key] = encoded ? decodeURIComponent(value) : value;
  }

  uri[qName] = {};
  uri[keys[12]].replace(qParser, function ($0, $1, $2) {
    if ($1) {
      uri[qName][$1] = $2;
    }
  });

  return uri;
}

// Based on https://github.com/alexdavid/scope-eval v0.0.3
// (source: https://unpkg.com/scope-eval@0.0.3/scope_eval.js)
// This is basically just a wrapper around new Function()

function scopeEval(source, scope) {
  var keys = [];
  var values = [];
  for (var key in scope) {
    if (scope.hasOwnProperty(key)) {
      keys.push(key);
      values.push(scope[key]);
    }
  }
  keys.push(source);
  return Function.apply(null, keys).apply(null, values);
}

// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
function upsert(db, docId, diffFun) {
  return new Promise(function (fulfill, reject) {
    db.get(docId, function (err, doc) {
      if (err) {
        /* istanbul ignore next */
        if (err.status !== 404) {
          return reject(err);
        }
        doc = {};
      }

      // the user might change the _rev, so save it for posterity
      var docRev = doc._rev;
      var newDoc = diffFun(doc);

      if (!newDoc) {
        // if the diffFun returns falsy, we short-circuit as
        // an optimization
        return fulfill({updated: false, rev: docRev});
      }

      // users aren't allowed to modify these values,
      // so reset them here
      newDoc._id = docId;
      newDoc._rev = docRev;
      fulfill(tryAndPut(db, newDoc, diffFun));
    });
  });
}

function tryAndPut(db, doc, diffFun) {
  return db.put(doc).then(function (res) {
    return {
      updated: true,
      rev: res.rev
    };
  }, function (err) {
    /* istanbul ignore next */
    if (err.status !== 409) {
      throw err;
    }
    return upsert(db, doc._id, diffFun);
  });
}

var thisAtob = function (str) {
  return atob(str);
};

var thisBtoa = function (str) {
  return btoa(str);
};

// Abstracts constructing a Blob object, so it also works in older
// browsers that don't support the native Blob constructor (e.g.
// old QtWebKit versions, Android < 4.4).
function createBlob(parts, properties) {
  /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
  parts = parts || [];
  properties = properties || {};
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== "TypeError") {
      throw e;
    }
    var Builder = typeof BlobBuilder !== 'undefined' ? BlobBuilder :
                  typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder :
                  typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder :
                  WebKitBlobBuilder;
    var builder = new Builder();
    for (var i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob(properties.type);
  }
}

// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
function binaryStringToArrayBuffer(bin) {
  var length = bin.length;
  var buf = new ArrayBuffer(length);
  var arr = new Uint8Array(buf);
  for (var i = 0; i < length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return buf;
}

function binStringToBluffer(binString, type) {
  return createBlob([binaryStringToArrayBuffer(binString)], {type: type});
}

function b64ToBluffer(b64, type) {
  return binStringToBluffer(thisAtob(b64), type);
}

//Can't find original post, but this is close
//http://stackoverflow.com/questions/6965107/ (continues on next line)
//converting-between-strings-and-arraybuffers
function arrayBufferToBinaryString(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var length = bytes.byteLength;
  for (var i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

// shim for browsers that don't support it
function readAsBinaryString(blob, callback) {
  var reader = new FileReader();
  var hasBinaryString = typeof reader.readAsBinaryString === 'function';
  reader.onloadend = function (e) {
    var result = e.target.result || '';
    if (hasBinaryString) {
      return callback(result);
    }
    callback(arrayBufferToBinaryString(result));
  };
  if (hasBinaryString) {
    reader.readAsBinaryString(blob);
  } else {
    reader.readAsArrayBuffer(blob);
  }
}

function blobToBinaryString(blobOrBuffer, callback) {
  readAsBinaryString(blobOrBuffer, function (bin) {
    callback(bin);
  });
}

function blobToBase64(blobOrBuffer, callback) {
  blobToBinaryString(blobOrBuffer, function (base64) {
    callback(thisBtoa(base64));
  });
}

// simplified API. universal browser support is assumed
function readAsArrayBuffer(blob, callback) {
  var reader = new FileReader();
  reader.onloadend = function (e) {
    var result = e.target.result || new ArrayBuffer(0);
    callback(result);
  };
  reader.readAsArrayBuffer(blob);
}

// this is not used in the browser

var setImmediateShim = global.setImmediate || global.setTimeout;
var MD5_CHUNK_SIZE = 32768;

function rawToBase64(raw) {
  return thisBtoa(raw);
}

function sliceBlob(blob, start, end) {
  if (blob.webkitSlice) {
    return blob.webkitSlice(start, end);
  }
  return blob.slice(start, end);
}

function appendBlob(buffer, blob, start, end, callback) {
  if (start > 0 || end < blob.size) {
    // only slice blob if we really need to
    blob = sliceBlob(blob, start, end);
  }
  readAsArrayBuffer(blob, function (arrayBuffer) {
    buffer.append(arrayBuffer);
    callback();
  });
}

function appendString(buffer, string, start, end, callback) {
  if (start > 0 || end < string.length) {
    // only create a substring if we really need to
    string = string.substring(start, end);
  }
  buffer.appendBinary(string);
  callback();
}

function binaryMd5(data, callback) {
  var inputIsString = typeof data === 'string';
  var len = inputIsString ? data.length : data.size;
  var chunkSize = Math.min(MD5_CHUNK_SIZE, len);
  var chunks = Math.ceil(len / chunkSize);
  var currentChunk = 0;
  var buffer = inputIsString ? new Md5() : new Md5.ArrayBuffer();

  var append = inputIsString ? appendString : appendBlob;

  function next() {
    setImmediateShim(loadNextChunk);
  }

  function done() {
    var raw = buffer.end(true);
    var base64 = rawToBase64(raw);
    callback(base64);
    buffer.destroy();
  }

  function loadNextChunk() {
    var start = currentChunk * chunkSize;
    var end = start + chunkSize;
    currentChunk++;
    if (currentChunk < chunks) {
      append(buffer, data, start, end, next);
    } else {
      append(buffer, data, start, end, done);
    }
  }
  loadNextChunk();
}

function stringMd5(string) {
  return Md5.hash(string);
}

function rev(doc, deterministic_revs) {
  var clonedDoc = clone(doc);
  if (!deterministic_revs) {
    return uuidV4.v4().replace(/-/g, '').toLowerCase();
  }

  delete clonedDoc._rev_tree;
  return stringMd5(JSON.stringify(clonedDoc));
}

var uuid = uuidV4.v4;

// We fetch all leafs of the revision tree, and sort them based on tree length
// and whether they were deleted, undeleted documents with the longest revision
// tree (most edits) win
// The final sort algorithm is slightly documented in a sidebar here:
// http://guide.couchdb.org/draft/conflicts.html
function winningRev(metadata) {
  var winningId;
  var winningPos;
  var winningDeleted;
  var toVisit = metadata.rev_tree.slice();
  var node;
  while ((node = toVisit.pop())) {
    var tree = node.ids;
    var branches = tree[2];
    var pos = node.pos;
    if (branches.length) { // non-leaf
      for (var i = 0, len = branches.length; i < len; i++) {
        toVisit.push({pos: pos + 1, ids: branches[i]});
      }
      continue;
    }
    var deleted = !!tree[1].deleted;
    var id = tree[0];
    // sort by deleted, then pos, then id
    if (!winningId || (winningDeleted !== deleted ? winningDeleted :
        winningPos !== pos ? winningPos < pos : winningId < id)) {
      winningId = id;
      winningPos = pos;
      winningDeleted = deleted;
    }
  }

  return winningPos + '-' + winningId;
}

// Pretty much all below can be combined into a higher order function to
// traverse revisions
// The return value from the callback will be passed as context to all
// children of that node
function traverseRevTree(revs, callback) {
  var toVisit = revs.slice();

  var node;
  while ((node = toVisit.pop())) {
    var pos = node.pos;
    var tree = node.ids;
    var branches = tree[2];
    var newCtx =
      callback(branches.length === 0, pos, tree[0], node.ctx, tree[1]);
    for (var i = 0, len = branches.length; i < len; i++) {
      toVisit.push({pos: pos + 1, ids: branches[i], ctx: newCtx});
    }
  }
}

function sortByPos(a, b) {
  return a.pos - b.pos;
}

function collectLeaves(revs) {
  var leaves = [];
  traverseRevTree(revs, function (isLeaf, pos, id, acc, opts) {
    if (isLeaf) {
      leaves.push({rev: pos + "-" + id, pos: pos, opts: opts});
    }
  });
  leaves.sort(sortByPos).reverse();
  for (var i = 0, len = leaves.length; i < len; i++) {
    delete leaves[i].pos;
  }
  return leaves;
}

// returns revs of all conflicts that is leaves such that
// 1. are not deleted and
// 2. are different than winning revision
function collectConflicts(metadata) {
  var win = winningRev(metadata);
  var leaves = collectLeaves(metadata.rev_tree);
  var conflicts = [];
  for (var i = 0, len = leaves.length; i < len; i++) {
    var leaf = leaves[i];
    if (leaf.rev !== win && !leaf.opts.deleted) {
      conflicts.push(leaf.rev);
    }
  }
  return conflicts;
}

// compact a tree by marking its non-leafs as missing,
// and return a list of revs to delete
function compactTree(metadata) {
  var revs = [];
  traverseRevTree(metadata.rev_tree, function (isLeaf, pos,
                                               revHash, ctx, opts) {
    if (opts.status === 'available' && !isLeaf) {
      revs.push(pos + '-' + revHash);
      opts.status = 'missing';
    }
  });
  return revs;
}

// build up a list of all the paths to the leafs in this revision tree
function rootToLeaf(revs) {
  var paths = [];
  var toVisit = revs.slice();
  var node;
  while ((node = toVisit.pop())) {
    var pos = node.pos;
    var tree = node.ids;
    var id = tree[0];
    var opts = tree[1];
    var branches = tree[2];
    var isLeaf = branches.length === 0;

    var history = node.history ? node.history.slice() : [];
    history.push({id: id, opts: opts});
    if (isLeaf) {
      paths.push({pos: (pos + 1 - history.length), ids: history});
    }
    for (var i = 0, len = branches.length; i < len; i++) {
      toVisit.push({pos: pos + 1, ids: branches[i], history: history});
    }
  }
  return paths.reverse();
}

// for a better overview of what this is doing, read:

function sortByPos$1(a, b) {
  return a.pos - b.pos;
}

// classic binary search
function binarySearch(arr, item, comparator) {
  var low = 0;
  var high = arr.length;
  var mid;
  while (low < high) {
    mid = (low + high) >>> 1;
    if (comparator(arr[mid], item) < 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

// assuming the arr is sorted, insert the item in the proper place
function insertSorted(arr, item, comparator) {
  var idx = binarySearch(arr, item, comparator);
  arr.splice(idx, 0, item);
}

// Turn a path as a flat array into a tree with a single branch.
// If any should be stemmed from the beginning of the array, that's passed
// in as the second argument
function pathToTree(path, numStemmed) {
  var root;
  var leaf;
  for (var i = numStemmed, len = path.length; i < len; i++) {
    var node = path[i];
    var currentLeaf = [node.id, node.opts, []];
    if (leaf) {
      leaf[2].push(currentLeaf);
      leaf = currentLeaf;
    } else {
      root = leaf = currentLeaf;
    }
  }
  return root;
}

// compare the IDs of two trees
function compareTree(a, b) {
  return a[0] < b[0] ? -1 : 1;
}

// Merge two trees together
// The roots of tree1 and tree2 must be the same revision
function mergeTree(in_tree1, in_tree2) {
  var queue = [{tree1: in_tree1, tree2: in_tree2}];
  var conflicts = false;
  while (queue.length > 0) {
    var item = queue.pop();
    var tree1 = item.tree1;
    var tree2 = item.tree2;

    if (tree1[1].status || tree2[1].status) {
      tree1[1].status =
        (tree1[1].status ===  'available' ||
        tree2[1].status === 'available') ? 'available' : 'missing';
    }

    for (var i = 0; i < tree2[2].length; i++) {
      if (!tree1[2][0]) {
        conflicts = 'new_leaf';
        tree1[2][0] = tree2[2][i];
        continue;
      }

      var merged = false;
      for (var j = 0; j < tree1[2].length; j++) {
        if (tree1[2][j][0] === tree2[2][i][0]) {
          queue.push({tree1: tree1[2][j], tree2: tree2[2][i]});
          merged = true;
        }
      }
      if (!merged) {
        conflicts = 'new_branch';
        insertSorted(tree1[2], tree2[2][i], compareTree);
      }
    }
  }
  return {conflicts: conflicts, tree: in_tree1};
}

function doMerge(tree, path, dontExpand) {
  var restree = [];
  var conflicts = false;
  var merged = false;
  var res;

  if (!tree.length) {
    return {tree: [path], conflicts: 'new_leaf'};
  }

  for (var i = 0, len = tree.length; i < len; i++) {
    var branch = tree[i];
    if (branch.pos === path.pos && branch.ids[0] === path.ids[0]) {
      // Paths start at the same position and have the same root, so they need
      // merged
      res = mergeTree(branch.ids, path.ids);
      restree.push({pos: branch.pos, ids: res.tree});
      conflicts = conflicts || res.conflicts;
      merged = true;
    } else if (dontExpand !== true) {
      // The paths start at a different position, take the earliest path and
      // traverse up until it as at the same point from root as the path we
      // want to merge.  If the keys match we return the longer path with the
      // other merged After stemming we dont want to expand the trees

      var t1 = branch.pos < path.pos ? branch : path;
      var t2 = branch.pos < path.pos ? path : branch;
      var diff = t2.pos - t1.pos;

      var candidateParents = [];

      var trees = [];
      trees.push({ids: t1.ids, diff: diff, parent: null, parentIdx: null});
      while (trees.length > 0) {
        var item = trees.pop();
        if (item.diff === 0) {
          if (item.ids[0] === t2.ids[0]) {
            candidateParents.push(item);
          }
          continue;
        }
        var elements = item.ids[2];
        for (var j = 0, elementsLen = elements.length; j < elementsLen; j++) {
          trees.push({
            ids: elements[j],
            diff: item.diff - 1,
            parent: item.ids,
            parentIdx: j
          });
        }
      }

      var el = candidateParents[0];

      if (!el) {
        restree.push(branch);
      } else {
        res = mergeTree(el.ids, t2.ids);
        el.parent[2][el.parentIdx] = res.tree;
        restree.push({pos: t1.pos, ids: t1.ids});
        conflicts = conflicts || res.conflicts;
        merged = true;
      }
    } else {
      restree.push(branch);
    }
  }

  // We didnt find
  if (!merged) {
    restree.push(path);
  }

  restree.sort(sortByPos$1);

  return {
    tree: restree,
    conflicts: conflicts || 'internal_node'
  };
}

// To ensure we dont grow the revision tree infinitely, we stem old revisions
function stem(tree, depth) {
  // First we break out the tree into a complete list of root to leaf paths
  var paths = rootToLeaf(tree);
  var stemmedRevs;

  var result;
  for (var i = 0, len = paths.length; i < len; i++) {
    // Then for each path, we cut off the start of the path based on the
    // `depth` to stem to, and generate a new set of flat trees
    var path = paths[i];
    var stemmed = path.ids;
    var node;
    if (stemmed.length > depth) {
      // only do the stemming work if we actually need to stem
      if (!stemmedRevs) {
        stemmedRevs = {}; // avoid allocating this object unnecessarily
      }
      var numStemmed = stemmed.length - depth;
      node = {
        pos: path.pos + numStemmed,
        ids: pathToTree(stemmed, numStemmed)
      };

      for (var s = 0; s < numStemmed; s++) {
        var rev = (path.pos + s) + '-' + stemmed[s].id;
        stemmedRevs[rev] = true;
      }
    } else { // no need to actually stem
      node = {
        pos: path.pos,
        ids: pathToTree(stemmed, 0)
      };
    }

    // Then we remerge all those flat trees together, ensuring that we dont
    // connect trees that would go beyond the depth limit
    if (result) {
      result = doMerge(result, node, true).tree;
    } else {
      result = [node];
    }
  }

  // this is memory-heavy per Chrome profiler, avoid unless we actually stemmed
  if (stemmedRevs) {
    traverseRevTree(result, function (isLeaf, pos, revHash) {
      // some revisions may have been removed in a branch but not in another
      delete stemmedRevs[pos + '-' + revHash];
    });
  }

  return {
    tree: result,
    revs: stemmedRevs ? Object.keys(stemmedRevs) : []
  };
}

function merge(tree, path, depth) {
  var newTree = doMerge(tree, path);
  var stemmed = stem(newTree.tree, depth);
  return {
    tree: stemmed.tree,
    stemmedRevs: stemmed.revs,
    conflicts: newTree.conflicts
  };
}

// return true if a rev exists in the rev tree, false otherwise
function revExists(revs, rev) {
  var toVisit = revs.slice();
  var splitRev = rev.split('-');
  var targetPos = parseInt(splitRev[0], 10);
  var targetId = splitRev[1];

  var node;
  while ((node = toVisit.pop())) {
    if (node.pos === targetPos && node.ids[0] === targetId) {
      return true;
    }
    var branches = node.ids[2];
    for (var i = 0, len = branches.length; i < len; i++) {
      toVisit.push({pos: node.pos + 1, ids: branches[i]});
    }
  }
  return false;
}

function getTrees(node) {
  return node.ids;
}

// check if a specific revision of a doc has been deleted
//  - metadata: the metadata object from the doc store
//  - rev: (optional) the revision to check. defaults to winning revision
function isDeleted(metadata, rev) {
  if (!rev) {
    rev = winningRev(metadata);
  }
  var id = rev.substring(rev.indexOf('-') + 1);
  var toVisit = metadata.rev_tree.map(getTrees);

  var tree;
  while ((tree = toVisit.pop())) {
    if (tree[0] === id) {
      return !!tree[1].deleted;
    }
    toVisit = toVisit.concat(tree[2]);
  }
}

function isLocalId(id) {
  return (/^_local/).test(id);
}

// returns the current leaf node for a given revision
function latest(rev, metadata) {
  var toVisit = metadata.rev_tree.slice();
  var node;
  while ((node = toVisit.pop())) {
    var pos = node.pos;
    var tree = node.ids;
    var id = tree[0];
    var opts = tree[1];
    var branches = tree[2];
    var isLeaf = branches.length === 0;

    var history = node.history ? node.history.slice() : [];
    history.push({id: id, pos: pos, opts: opts});

    if (isLeaf) {
      for (var i = 0, len = history.length; i < len; i++) {
        var historyNode = history[i];
        var historyRev = historyNode.pos + '-' + historyNode.id;

        if (historyRev === rev) {
          // return the rev of this leaf
          return pos + '-' + id;
        }
      }
    }

    for (var j = 0, l = branches.length; j < l; j++) {
      toVisit.push({pos: pos + 1, ids: branches[j], history: history});
    }
  }

  /* istanbul ignore next */
  throw new Error('Unable to resolve latest revision for id ' + metadata.id + ', rev ' + rev);
}

inherits(Changes$1, events.EventEmitter);

function tryCatchInChangeListener(self, change, pending, lastSeq) {
  // isolate try/catches to avoid V8 deoptimizations
  try {
    self.emit('change', change, pending, lastSeq);
  } catch (e) {
    guardedConsole('error', 'Error in .on("change", function):', e);
  }
}

function Changes$1(db, opts, callback) {
  events.EventEmitter.call(this);
  var self = this;
  this.db = db;
  opts = opts ? clone(opts) : {};
  var complete = opts.complete = once(function (err, resp) {
    if (err) {
      if (listenerCount(self, 'error') > 0) {
        self.emit('error', err);
      }
    } else {
      self.emit('complete', resp);
    }
    self.removeAllListeners();
    db.removeListener('destroyed', onDestroy);
  });
  if (callback) {
    self.on('complete', function (resp) {
      callback(null, resp);
    });
    self.on('error', callback);
  }
  function onDestroy() {
    self.cancel();
  }
  db.once('destroyed', onDestroy);

  opts.onChange = function (change, pending, lastSeq) {
    /* istanbul ignore if */
    if (self.isCancelled) {
      return;
    }
    tryCatchInChangeListener(self, change, pending, lastSeq);
  };

  var promise = new Promise(function (fulfill, reject) {
    opts.complete = function (err, res) {
      if (err) {
        reject(err);
      } else {
        fulfill(res);
      }
    };
  });
  self.once('cancel', function () {
    db.removeListener('destroyed', onDestroy);
    opts.complete(null, {status: 'cancelled'});
  });
  this.then = promise.then.bind(promise);
  this['catch'] = promise['catch'].bind(promise);
  this.then(function (result) {
    complete(null, result);
  }, complete);



  if (!db.taskqueue.isReady) {
    db.taskqueue.addTask(function (failed) {
      if (failed) {
        opts.complete(failed);
      } else if (self.isCancelled) {
        self.emit('cancel');
      } else {
        self.validateChanges(opts);
      }
    });
  } else {
    self.validateChanges(opts);
  }
}
Changes$1.prototype.cancel = function () {
  this.isCancelled = true;
  if (this.db.taskqueue.isReady) {
    this.emit('cancel');
  }
};
function processChange(doc, metadata, opts) {
  var changeList = [{rev: doc._rev}];
  if (opts.style === 'all_docs') {
    changeList = collectLeaves(metadata.rev_tree)
    .map(function (x) { return {rev: x.rev}; });
  }
  var change = {
    id: metadata.id,
    changes: changeList,
    doc: doc
  };

  if (isDeleted(metadata, doc._rev)) {
    change.deleted = true;
  }
  if (opts.conflicts) {
    change.doc._conflicts = collectConflicts(metadata);
    if (!change.doc._conflicts.length) {
      delete change.doc._conflicts;
    }
  }
  return change;
}

Changes$1.prototype.validateChanges = function (opts) {
  var callback = opts.complete;
  var self = this;

  /* istanbul ignore else */
  if (PouchDB._changesFilterPlugin) {
    PouchDB._changesFilterPlugin.validate(opts, function (err) {
      if (err) {
        return callback(err);
      }
      self.doChanges(opts);
    });
  } else {
    self.doChanges(opts);
  }
};

Changes$1.prototype.doChanges = function (opts) {
  var self = this;
  var callback = opts.complete;

  opts = clone(opts);
  if ('live' in opts && !('continuous' in opts)) {
    opts.continuous = opts.live;
  }
  opts.processChange = processChange;

  if (opts.since === 'latest') {
    opts.since = 'now';
  }
  if (!opts.since) {
    opts.since = 0;
  }
  if (opts.since === 'now') {
    this.db.info().then(function (info) {
      /* istanbul ignore if */
      if (self.isCancelled) {
        callback(null, {status: 'cancelled'});
        return;
      }
      opts.since = info.update_seq;
      self.doChanges(opts);
    }, callback);
    return;
  }

  /* istanbul ignore else */
  if (PouchDB._changesFilterPlugin) {
    PouchDB._changesFilterPlugin.normalize(opts);
    if (PouchDB._changesFilterPlugin.shouldFilter(this, opts)) {
      return PouchDB._changesFilterPlugin.filter(this, opts);
    }
  } else {
    ['doc_ids', 'filter', 'selector', 'view'].forEach(function (key) {
      if (key in opts) {
        guardedConsole('warn',
          'The "' + key + '" option was passed in to changes/replicate, ' +
          'but pouchdb-changes-filter plugin is not installed, so it ' +
          'was ignored. Please install the plugin to enable filtering.'
        );
      }
    });
  }

  if (!('descending' in opts)) {
    opts.descending = false;
  }

  // 0 and 1 should return 1 document
  opts.limit = opts.limit === 0 ? 1 : opts.limit;
  opts.complete = callback;
  var newPromise = this.db._changes(opts);
  /* istanbul ignore else */
  if (newPromise && typeof newPromise.cancel === 'function') {
    var cancel = self.cancel;
    self.cancel = getArguments(function (args) {
      newPromise.cancel();
      cancel.apply(this, args);
    });
  }
};

/*
 * A generic pouch adapter
 */

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

// Wrapper for functions that call the bulkdocs api with a single doc,
// if the first result is an error, return an error
function yankError(callback, docId) {
  return function (err, results) {
    if (err || (results[0] && results[0].error)) {
      err = err || results[0];
      err.docId = docId;
      callback(err);
    } else {
      callback(null, results.length ? results[0]  : results);
    }
  };
}

// clean docs given to us by the user
function cleanDocs(docs) {
  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    if (doc._deleted) {
      delete doc._attachments; // ignore atts for deleted docs
    } else if (doc._attachments) {
      // filter out extraneous keys from _attachments
      var atts = Object.keys(doc._attachments);
      for (var j = 0; j < atts.length; j++) {
        var att = atts[j];
        doc._attachments[att] = pick(doc._attachments[att],
          ['data', 'digest', 'content_type', 'length', 'revpos', 'stub']);
      }
    }
  }
}

// compare two docs, first by _id then by _rev
function compareByIdThenRev(a, b) {
  var idCompare = compare(a._id, b._id);
  if (idCompare !== 0) {
    return idCompare;
  }
  var aStart = a._revisions ? a._revisions.start : 0;
  var bStart = b._revisions ? b._revisions.start : 0;
  return compare(aStart, bStart);
}

// for every node in a revision tree computes its distance from the closest
// leaf
function computeHeight(revs) {
  var height = {};
  var edges = [];
  traverseRevTree(revs, function (isLeaf, pos, id, prnt) {
    var rev$$1 = pos + "-" + id;
    if (isLeaf) {
      height[rev$$1] = 0;
    }
    if (prnt !== undefined) {
      edges.push({from: prnt, to: rev$$1});
    }
    return rev$$1;
  });

  edges.reverse();
  edges.forEach(function (edge) {
    if (height[edge.from] === undefined) {
      height[edge.from] = 1 + height[edge.to];
    } else {
      height[edge.from] = Math.min(height[edge.from], 1 + height[edge.to]);
    }
  });
  return height;
}

function allDocsKeysParse(opts) {
  var keys =  ('limit' in opts) ?
    opts.keys.slice(opts.skip, opts.limit + opts.skip) :
    (opts.skip > 0) ? opts.keys.slice(opts.skip) : opts.keys;
  opts.keys = keys;
  opts.skip = 0;
  delete opts.limit;
  if (opts.descending) {
    keys.reverse();
    opts.descending = false;
  }
}

// all compaction is done in a queue, to avoid attaching
// too many listeners at once
function doNextCompaction(self) {
  var task = self._compactionQueue[0];
  var opts = task.opts;
  var callback = task.callback;
  self.get('_local/compaction').catch(function () {
    return false;
  }).then(function (doc) {
    if (doc && doc.last_seq) {
      opts.last_seq = doc.last_seq;
    }
    self._compact(opts, function (err, res) {
      /* istanbul ignore if */
      if (err) {
        callback(err);
      } else {
        callback(null, res);
      }
      immediate(function () {
        self._compactionQueue.shift();
        if (self._compactionQueue.length) {
          doNextCompaction(self);
        }
      });
    });
  });
}

function attachmentNameError(name) {
  if (name.charAt(0) === '_') {
    return name + ' is not a valid attachment name, attachment ' +
      'names cannot start with \'_\'';
  }
  return false;
}

inherits(AbstractPouchDB, events.EventEmitter);

function AbstractPouchDB() {
  events.EventEmitter.call(this);

  // re-bind prototyped methods
  for (var p in AbstractPouchDB.prototype) {
    if (typeof this[p] === 'function') {
      this[p] = this[p].bind(this);
    }
  }
}

AbstractPouchDB.prototype.post =
  adapterFun('post', function (doc, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    return callback(createError(NOT_AN_OBJECT));
  }
  this.bulkDocs({docs: [doc]}, opts, yankError(callback, doc._id));
});

AbstractPouchDB.prototype.put = adapterFun('put', function (doc, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    return cb(createError(NOT_AN_OBJECT));
  }
  invalidIdError(doc._id);
  if (isLocalId(doc._id) && typeof this._putLocal === 'function') {
    if (doc._deleted) {
      return this._removeLocal(doc, cb);
    } else {
      return this._putLocal(doc, cb);
    }
  }
  var self = this;
  if (opts.force && doc._rev) {
    transformForceOptionToNewEditsOption();
    putDoc(function (err) {
      var result = err ? null : {ok: true, id: doc._id, rev: doc._rev};
      cb(err, result);
    });
  } else {
    putDoc(cb);
  }

  function transformForceOptionToNewEditsOption() {
    var parts = doc._rev.split('-');
    var oldRevId = parts[1];
    var oldRevNum = parseInt(parts[0], 10);

    var newRevNum = oldRevNum + 1;
    var newRevId = rev();

    doc._revisions = {
      start: newRevNum,
      ids: [newRevId, oldRevId]
    };
    doc._rev = newRevNum + '-' + newRevId;
    opts.new_edits = false;
  }
  function putDoc(next) {
    if (typeof self._put === 'function' && opts.new_edits !== false) {
      self._put(doc, opts, next);
    } else {
      self.bulkDocs({docs: [doc]}, opts, yankError(next, doc._id));
    }
  }
});

AbstractPouchDB.prototype.putAttachment =
  adapterFun('putAttachment', function (docId, attachmentId, rev$$1,
                                              blob, type) {
  var api = this;
  if (typeof type === 'function') {
    type = blob;
    blob = rev$$1;
    rev$$1 = null;
  }
  // Lets fix in https://github.com/pouchdb/pouchdb/issues/3267
  /* istanbul ignore if */
  if (typeof type === 'undefined') {
    type = blob;
    blob = rev$$1;
    rev$$1 = null;
  }
  if (!type) {
    guardedConsole('warn', 'Attachment', attachmentId, 'on document', docId, 'is missing content_type');
  }

  function createAttachment(doc) {
    var prevrevpos = '_rev' in doc ? parseInt(doc._rev, 10) : 0;
    doc._attachments = doc._attachments || {};
    doc._attachments[attachmentId] = {
      content_type: type,
      data: blob,
      revpos: ++prevrevpos
    };
    return api.put(doc);
  }

  return api.get(docId).then(function (doc) {
    if (doc._rev !== rev$$1) {
      throw createError(REV_CONFLICT);
    }

    return createAttachment(doc);
  }, function (err) {
     // create new doc
    /* istanbul ignore else */
    if (err.reason === MISSING_DOC.message) {
      return createAttachment({_id: docId});
    } else {
      throw err;
    }
  });
});

AbstractPouchDB.prototype.removeAttachment =
  adapterFun('removeAttachment', function (docId, attachmentId, rev$$1,
                                                 callback) {
  var self = this;
  self.get(docId, function (err, obj) {
    /* istanbul ignore if */
    if (err) {
      callback(err);
      return;
    }
    if (obj._rev !== rev$$1) {
      callback(createError(REV_CONFLICT));
      return;
    }
    /* istanbul ignore if */
    if (!obj._attachments) {
      return callback();
    }
    delete obj._attachments[attachmentId];
    if (Object.keys(obj._attachments).length === 0) {
      delete obj._attachments;
    }
    self.put(obj, callback);
  });
});

AbstractPouchDB.prototype.remove =
  adapterFun('remove', function (docOrId, optsOrRev, opts, callback) {
  var doc;
  if (typeof optsOrRev === 'string') {
    // id, rev, opts, callback style
    doc = {
      _id: docOrId,
      _rev: optsOrRev
    };
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
  } else {
    // doc, opts, callback style
    doc = docOrId;
    if (typeof optsOrRev === 'function') {
      callback = optsOrRev;
      opts = {};
    } else {
      callback = opts;
      opts = optsOrRev;
    }
  }
  opts = opts || {};
  opts.was_delete = true;
  var newDoc = {_id: doc._id, _rev: (doc._rev || opts.rev)};
  newDoc._deleted = true;
  if (isLocalId(newDoc._id) && typeof this._removeLocal === 'function') {
    return this._removeLocal(doc, callback);
  }
  this.bulkDocs({docs: [newDoc]}, opts, yankError(callback, newDoc._id));
});

AbstractPouchDB.prototype.revsDiff =
  adapterFun('revsDiff', function (req, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  var ids = Object.keys(req);

  if (!ids.length) {
    return callback(null, {});
  }

  var count = 0;
  var missing = new ExportedMap();

  function addToMissing(id, revId) {
    if (!missing.has(id)) {
      missing.set(id, {missing: []});
    }
    missing.get(id).missing.push(revId);
  }

  function processDoc(id, rev_tree) {
    // Is this fast enough? Maybe we should switch to a set simulated by a map
    var missingForId = req[id].slice(0);
    traverseRevTree(rev_tree, function (isLeaf, pos, revHash, ctx,
      opts) {
        var rev$$1 = pos + '-' + revHash;
        var idx = missingForId.indexOf(rev$$1);
        if (idx === -1) {
          return;
        }

        missingForId.splice(idx, 1);
        /* istanbul ignore if */
        if (opts.status !== 'available') {
          addToMissing(id, rev$$1);
        }
      });

    // Traversing the tree is synchronous, so now `missingForId` contains
    // revisions that were not found in the tree
    missingForId.forEach(function (rev$$1) {
      addToMissing(id, rev$$1);
    });
  }

  ids.map(function (id) {
    this._getRevisionTree(id, function (err, rev_tree) {
      if (err && err.status === 404 && err.message === 'missing') {
        missing.set(id, {missing: req[id]});
      } else if (err) {
        /* istanbul ignore next */
        return callback(err);
      } else {
        processDoc(id, rev_tree);
      }

      if (++count === ids.length) {
        // convert LazyMap to object
        var missingObj = {};
        missing.forEach(function (value, key) {
          missingObj[key] = value;
        });
        return callback(null, missingObj);
      }
    });
  }, this);
});

// _bulk_get API for faster replication, as described in
// https://github.com/apache/couchdb-chttpd/pull/33
// At the "abstract" level, it will just run multiple get()s in
// parallel, because this isn't much of a performance cost
// for local databases (except the cost of multiple transactions, which is
// small). The http adapter overrides this in order
// to do a more efficient single HTTP request.
AbstractPouchDB.prototype.bulkGet =
  adapterFun('bulkGet', function (opts, callback) {
  bulkGet(this, opts, callback);
});

// compact one document and fire callback
// by compacting we mean removing all revisions which
// are further from the leaf in revision tree than max_height
AbstractPouchDB.prototype.compactDocument =
  adapterFun('compactDocument', function (docId, maxHeight, callback) {
  var self = this;
  this._getRevisionTree(docId, function (err, revTree) {
    /* istanbul ignore if */
    if (err) {
      return callback(err);
    }
    var height = computeHeight(revTree);
    var candidates = [];
    var revs = [];
    Object.keys(height).forEach(function (rev$$1) {
      if (height[rev$$1] > maxHeight) {
        candidates.push(rev$$1);
      }
    });

    traverseRevTree(revTree, function (isLeaf, pos, revHash, ctx, opts) {
      var rev$$1 = pos + '-' + revHash;
      if (opts.status === 'available' && candidates.indexOf(rev$$1) !== -1) {
        revs.push(rev$$1);
      }
    });
    self._doCompaction(docId, revs, callback);
  });
});

// compact the whole database using single document
// compaction
AbstractPouchDB.prototype.compact =
  adapterFun('compact', function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  var self = this;
  opts = opts || {};

  self._compactionQueue = self._compactionQueue || [];
  self._compactionQueue.push({opts: opts, callback: callback});
  if (self._compactionQueue.length === 1) {
    doNextCompaction(self);
  }
});
AbstractPouchDB.prototype._compact = function (opts, callback) {
  var self = this;
  var changesOpts = {
    return_docs: false,
    last_seq: opts.last_seq || 0
  };
  var promises = [];

  function onChange(row) {
    promises.push(self.compactDocument(row.id, 0));
  }
  function onComplete(resp) {
    var lastSeq = resp.last_seq;
    Promise.all(promises).then(function () {
      return upsert(self, '_local/compaction', function deltaFunc(doc) {
        if (!doc.last_seq || doc.last_seq < lastSeq) {
          doc.last_seq = lastSeq;
          return doc;
        }
        return false; // somebody else got here first, don't update
      });
    }).then(function () {
      callback(null, {ok: true});
    }).catch(callback);
  }
  self.changes(changesOpts)
    .on('change', onChange)
    .on('complete', onComplete)
    .on('error', callback);
};

/* Begin api wrappers. Specific functionality to storage belongs in the
   _[method] */
AbstractPouchDB.prototype.get = adapterFun('get', function (id, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  if (typeof id !== 'string') {
    return cb(createError(INVALID_ID));
  }
  if (isLocalId(id) && typeof this._getLocal === 'function') {
    return this._getLocal(id, cb);
  }
  var leaves = [], self = this;

  function finishOpenRevs() {
    var result = [];
    var count = leaves.length;
    /* istanbul ignore if */
    if (!count) {
      return cb(null, result);
    }

    // order with open_revs is unspecified
    leaves.forEach(function (leaf) {
      self.get(id, {
        rev: leaf,
        revs: opts.revs,
        latest: opts.latest,
        attachments: opts.attachments,
        binary: opts.binary
      }, function (err, doc) {
        if (!err) {
          // using latest=true can produce duplicates
          var existing;
          for (var i = 0, l = result.length; i < l; i++) {
            if (result[i].ok && result[i].ok._rev === doc._rev) {
              existing = true;
              break;
            }
          }
          if (!existing) {
            result.push({ok: doc});
          }
        } else {
          result.push({missing: leaf});
        }
        count--;
        if (!count) {
          cb(null, result);
        }
      });
    });
  }

  if (opts.open_revs) {
    if (opts.open_revs === "all") {
      this._getRevisionTree(id, function (err, rev_tree) {
        /* istanbul ignore if */
        if (err) {
          return cb(err);
        }
        leaves = collectLeaves(rev_tree).map(function (leaf) {
          return leaf.rev;
        });
        finishOpenRevs();
      });
    } else {
      if (Array.isArray(opts.open_revs)) {
        leaves = opts.open_revs;
        for (var i = 0; i < leaves.length; i++) {
          var l = leaves[i];
          // looks like it's the only thing couchdb checks
          if (!(typeof (l) === "string" && /^\d+-/.test(l))) {
            return cb(createError(INVALID_REV));
          }
        }
        finishOpenRevs();
      } else {
        return cb(createError(UNKNOWN_ERROR, 'function_clause'));
      }
    }
    return; // open_revs does not like other options
  }

  return this._get(id, opts, function (err, result) {
    if (err) {
      err.docId = id;
      return cb(err);
    }

    var doc = result.doc;
    var metadata = result.metadata;
    var ctx = result.ctx;

    if (opts.conflicts) {
      var conflicts = collectConflicts(metadata);
      if (conflicts.length) {
        doc._conflicts = conflicts;
      }
    }

    if (isDeleted(metadata, doc._rev)) {
      doc._deleted = true;
    }

    if (opts.revs || opts.revs_info) {
      var splittedRev = doc._rev.split('-');
      var revNo       = parseInt(splittedRev[0], 10);
      var revHash     = splittedRev[1];

      var paths = rootToLeaf(metadata.rev_tree);
      var path = null;

      for (var i = 0; i < paths.length; i++) {
        var currentPath = paths[i];
        var hashIndex = currentPath.ids.map(function (x) { return x.id; })
          .indexOf(revHash);
        var hashFoundAtRevPos = hashIndex === (revNo - 1);

        if (hashFoundAtRevPos || (!path && hashIndex !== -1)) {
          path = currentPath;
        }
      }

      /* istanbul ignore if */
      if (!path) {
        err = new Error('invalid rev tree');
        err.docId = id;
        return cb(err);
      }

      var indexOfRev = path.ids.map(function (x) { return x.id; })
        .indexOf(doc._rev.split('-')[1]) + 1;
      var howMany = path.ids.length - indexOfRev;
      path.ids.splice(indexOfRev, howMany);
      path.ids.reverse();

      if (opts.revs) {
        doc._revisions = {
          start: (path.pos + path.ids.length) - 1,
          ids: path.ids.map(function (rev$$1) {
            return rev$$1.id;
          })
        };
      }
      if (opts.revs_info) {
        var pos =  path.pos + path.ids.length;
        doc._revs_info = path.ids.map(function (rev$$1) {
          pos--;
          return {
            rev: pos + '-' + rev$$1.id,
            status: rev$$1.opts.status
          };
        });
      }
    }

    if (opts.attachments && doc._attachments) {
      var attachments = doc._attachments;
      var count = Object.keys(attachments).length;
      if (count === 0) {
        return cb(null, doc);
      }
      Object.keys(attachments).forEach(function (key) {
        this._getAttachment(doc._id, key, attachments[key], {
          // Previously the revision handling was done in adapter.js
          // getAttachment, however since idb-next doesnt we need to
          // pass the rev through
          rev: doc._rev,
          binary: opts.binary,
          ctx: ctx
        }, function (err, data) {
          var att = doc._attachments[key];
          att.data = data;
          delete att.stub;
          delete att.length;
          if (!--count) {
            cb(null, doc);
          }
        });
      }, self);
    } else {
      if (doc._attachments) {
        for (var key in doc._attachments) {
          /* istanbul ignore else */
          if (doc._attachments.hasOwnProperty(key)) {
            doc._attachments[key].stub = true;
          }
        }
      }
      cb(null, doc);
    }
  });
});

// TODO: I dont like this, it forces an extra read for every
// attachment read and enforces a confusing api between
// adapter.js and the adapter implementation
AbstractPouchDB.prototype.getAttachment =
  adapterFun('getAttachment', function (docId, attachmentId, opts, callback) {
  var self = this;
  if (opts instanceof Function) {
    callback = opts;
    opts = {};
  }
  this._get(docId, opts, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (res.doc._attachments && res.doc._attachments[attachmentId]) {
      opts.ctx = res.ctx;
      opts.binary = true;
      self._getAttachment(docId, attachmentId,
                          res.doc._attachments[attachmentId], opts, callback);
    } else {
      return callback(createError(MISSING_DOC));
    }
  });
});

AbstractPouchDB.prototype.allDocs =
  adapterFun('allDocs', function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts.skip = typeof opts.skip !== 'undefined' ? opts.skip : 0;
  if (opts.start_key) {
    opts.startkey = opts.start_key;
  }
  if (opts.end_key) {
    opts.endkey = opts.end_key;
  }
  if ('keys' in opts) {
    if (!Array.isArray(opts.keys)) {
      return callback(new TypeError('options.keys must be an array'));
    }
    var incompatibleOpt =
      ['startkey', 'endkey', 'key'].filter(function (incompatibleOpt) {
      return incompatibleOpt in opts;
    })[0];
    if (incompatibleOpt) {
      callback(createError(QUERY_PARSE_ERROR,
        'Query parameter `' + incompatibleOpt +
        '` is not compatible with multi-get'
      ));
      return;
    }
    if (!isRemote(this)) {
      allDocsKeysParse(opts);
      if (opts.keys.length === 0) {
        return this._allDocs({limit: 0}, callback);
      }
    }
  }

  return this._allDocs(opts, callback);
});

AbstractPouchDB.prototype.changes = function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  opts = opts || {};

  // By default set return_docs to false if the caller has opts.live = true,
  // this will prevent us from collecting the set of changes indefinitely
  // resulting in growing memory
  opts.return_docs = ('return_docs' in opts) ? opts.return_docs : !opts.live;

  return new Changes$1(this, opts, callback);
};

AbstractPouchDB.prototype.close = adapterFun('close', function (callback) {
  this._closed = true;
  this.emit('closed');
  return this._close(callback);
});

AbstractPouchDB.prototype.info = adapterFun('info', function (callback) {
  var self = this;
  this._info(function (err, info) {
    if (err) {
      return callback(err);
    }
    // assume we know better than the adapter, unless it informs us
    info.db_name = info.db_name || self.name;
    info.auto_compaction = !!(self.auto_compaction && !isRemote(self));
    info.adapter = self.adapter;
    callback(null, info);
  });
});

AbstractPouchDB.prototype.id = adapterFun('id', function (callback) {
  return this._id(callback);
});

/* istanbul ignore next */
AbstractPouchDB.prototype.type = function () {
  return (typeof this._type === 'function') ? this._type() : this.adapter;
};

AbstractPouchDB.prototype.bulkDocs =
  adapterFun('bulkDocs', function (req, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  opts = opts || {};

  if (Array.isArray(req)) {
    req = {
      docs: req
    };
  }

  if (!req || !req.docs || !Array.isArray(req.docs)) {
    return callback(createError(MISSING_BULK_DOCS));
  }

  for (var i = 0; i < req.docs.length; ++i) {
    if (typeof req.docs[i] !== 'object' || Array.isArray(req.docs[i])) {
      return callback(createError(NOT_AN_OBJECT));
    }
  }

  var attachmentError;
  req.docs.forEach(function (doc) {
    if (doc._attachments) {
      Object.keys(doc._attachments).forEach(function (name) {
        attachmentError = attachmentError || attachmentNameError(name);
        if (!doc._attachments[name].content_type) {
          guardedConsole('warn', 'Attachment', name, 'on document', doc._id, 'is missing content_type');
        }
      });
    }
  });

  if (attachmentError) {
    return callback(createError(BAD_REQUEST, attachmentError));
  }

  if (!('new_edits' in opts)) {
    if ('new_edits' in req) {
      opts.new_edits = req.new_edits;
    } else {
      opts.new_edits = true;
    }
  }

  var adapter = this;
  if (!opts.new_edits && !isRemote(adapter)) {
    // ensure revisions of the same doc are sorted, so that
    // the local adapter processes them correctly (#2935)
    req.docs.sort(compareByIdThenRev);
  }

  cleanDocs(req.docs);

  // in the case of conflicts, we want to return the _ids to the user
  // however, the underlying adapter may destroy the docs array, so
  // create a copy here
  var ids = req.docs.map(function (doc) {
    return doc._id;
  });

  return this._bulkDocs(req, opts, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (!opts.new_edits) {
      // this is what couch does when new_edits is false
      res = res.filter(function (x) {
        return x.error;
      });
    }
    // add ids for error/conflict responses (not required for CouchDB)
    if (!isRemote(adapter)) {
      for (var i = 0, l = res.length; i < l; i++) {
        res[i].id = res[i].id || ids[i];
      }
    }

    callback(null, res);
  });
});

AbstractPouchDB.prototype.registerDependentDatabase =
  adapterFun('registerDependentDatabase', function (dependentDb,
                                                          callback) {
  var depDB = new this.constructor(dependentDb, this.__opts);

  function diffFun(doc) {
    doc.dependentDbs = doc.dependentDbs || {};
    if (doc.dependentDbs[dependentDb]) {
      return false; // no update required
    }
    doc.dependentDbs[dependentDb] = true;
    return doc;
  }
  upsert(this, '_local/_pouch_dependentDbs', diffFun)
    .then(function () {
      callback(null, {db: depDB});
    }).catch(callback);
});

AbstractPouchDB.prototype.destroy =
  adapterFun('destroy', function (opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  var self = this;
  var usePrefix = 'use_prefix' in self ? self.use_prefix : true;

  function destroyDb() {
    // call destroy method of the particular adaptor
    self._destroy(opts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      self._destroyed = true;
      self.emit('destroyed');
      callback(null, resp || { 'ok': true });
    });
  }

  if (isRemote(self)) {
    // no need to check for dependent DBs if it's a remote DB
    return destroyDb();
  }

  self.get('_local/_pouch_dependentDbs', function (err, localDoc) {
    if (err) {
      /* istanbul ignore if */
      if (err.status !== 404) {
        return callback(err);
      } else { // no dependencies
        return destroyDb();
      }
    }
    var dependentDbs = localDoc.dependentDbs;
    var PouchDB = self.constructor;
    var deletedMap = Object.keys(dependentDbs).map(function (name) {
      // use_prefix is only false in the browser
      /* istanbul ignore next */
      var trueName = usePrefix ?
        name.replace(new RegExp('^' + PouchDB.prefix), '') : name;
      return new PouchDB(trueName, self.__opts).destroy();
    });
    Promise.all(deletedMap).then(destroyDb, callback);
  });
});

function TaskQueue() {
  this.isReady = false;
  this.failed = false;
  this.queue = [];
}

TaskQueue.prototype.execute = function () {
  var fun;
  if (this.failed) {
    while ((fun = this.queue.shift())) {
      fun(this.failed);
    }
  } else {
    while ((fun = this.queue.shift())) {
      fun();
    }
  }
};

TaskQueue.prototype.fail = function (err) {
  this.failed = err;
  this.execute();
};

TaskQueue.prototype.ready = function (db) {
  this.isReady = true;
  this.db = db;
  this.execute();
};

TaskQueue.prototype.addTask = function (fun) {
  this.queue.push(fun);
  if (this.failed) {
    this.execute();
  }
};

function parseAdapter(name, opts) {
  var match = name.match(/([a-z-]*):\/\/(.*)/);
  if (match) {
    // the http adapter expects the fully qualified name
    return {
      name: /https?/.test(match[1]) ? match[1] + '://' + match[2] : match[2],
      adapter: match[1]
    };
  }

  var adapters = PouchDB.adapters;
  var preferredAdapters = PouchDB.preferredAdapters;
  var prefix = PouchDB.prefix;
  var adapterName = opts.adapter;

  if (!adapterName) { // automatically determine adapter
    for (var i = 0; i < preferredAdapters.length; ++i) {
      adapterName = preferredAdapters[i];
      // check for browsers that have been upgraded from websql-only to websql+idb
      /* istanbul ignore if */
      if (adapterName === 'idb' && 'websql' in adapters &&
          hasLocalStorage() && localStorage['_pouch__websqldb_' + prefix + name]) {
        // log it, because this can be confusing during development
        guardedConsole('log', 'PouchDB is downgrading "' + name + '" to WebSQL to' +
          ' avoid data loss, because it was already opened with WebSQL.');
        continue; // keep using websql to avoid user data loss
      }
      break;
    }
  }

  var adapter = adapters[adapterName];

  // if adapter is invalid, then an error will be thrown later
  var usePrefix = (adapter && 'use_prefix' in adapter) ?
    adapter.use_prefix : true;

  return {
    name: usePrefix ? (prefix + name) : name,
    adapter: adapterName
  };
}

// OK, so here's the deal. Consider this code:
//     var db1 = new PouchDB('foo');
//     var db2 = new PouchDB('foo');
//     db1.destroy();
// ^ these two both need to emit 'destroyed' events,
// as well as the PouchDB constructor itself.
// So we have one db object (whichever one got destroy() called on it)
// responsible for emitting the initial event, which then gets emitted
// by the constructor, which then broadcasts it to any other dbs
// that may have been created with the same name.
function prepareForDestruction(self) {

  function onDestroyed(from_constructor) {
    self.removeListener('closed', onClosed);
    if (!from_constructor) {
      self.constructor.emit('destroyed', self.name);
    }
  }

  function onClosed() {
    self.removeListener('destroyed', onDestroyed);
    self.constructor.emit('unref', self);
  }

  self.once('destroyed', onDestroyed);
  self.once('closed', onClosed);
  self.constructor.emit('ref', self);
}

inherits(PouchDB, AbstractPouchDB);
function PouchDB(name, opts) {
  // In Node our test suite only tests this for PouchAlt unfortunately
  /* istanbul ignore if */
  if (!(this instanceof PouchDB)) {
    return new PouchDB(name, opts);
  }

  var self = this;
  opts = opts || {};

  if (name && typeof name === 'object') {
    opts = name;
    name = opts.name;
    delete opts.name;
  }

  if (opts.deterministic_revs === undefined) {
    opts.deterministic_revs = true;
  }

  this.__opts = opts = clone(opts);

  self.auto_compaction = opts.auto_compaction;
  self.prefix = PouchDB.prefix;

  if (typeof name !== 'string') {
    throw new Error('Missing/invalid DB name');
  }

  var prefixedName = (opts.prefix || '') + name;
  var backend = parseAdapter(prefixedName, opts);

  opts.name = backend.name;
  opts.adapter = opts.adapter || backend.adapter;

  self.name = name;
  self._adapter = opts.adapter;
  PouchDB.emit('debug', ['adapter', 'Picked adapter: ', opts.adapter]);

  if (!PouchDB.adapters[opts.adapter] ||
      !PouchDB.adapters[opts.adapter].valid()) {
    throw new Error('Invalid Adapter: ' + opts.adapter);
  }

  AbstractPouchDB.call(self);
  self.taskqueue = new TaskQueue();

  self.adapter = opts.adapter;

  PouchDB.adapters[opts.adapter].call(self, opts, function (err) {
    if (err) {
      return self.taskqueue.fail(err);
    }
    prepareForDestruction(self);

    self.emit('created', self);
    PouchDB.emit('created', self.name);
    self.taskqueue.ready(self);
  });

}

// AbortController was introduced quite a while after fetch and
// isnt required for PouchDB to function so polyfill if needed
var a = (typeof AbortController !== 'undefined')
    ? AbortController
    : function () { return {abort: function () {}}; };

var f$1 = fetch;
var h = Headers;

PouchDB.adapters = {};
PouchDB.preferredAdapters = [];

PouchDB.prefix = '_pouch_';

var eventEmitter = new events.EventEmitter();

function setUpEventEmitter(Pouch) {
  Object.keys(events.EventEmitter.prototype).forEach(function (key) {
    if (typeof events.EventEmitter.prototype[key] === 'function') {
      Pouch[key] = eventEmitter[key].bind(eventEmitter);
    }
  });

  // these are created in constructor.js, and allow us to notify each DB with
  // the same name that it was destroyed, via the constructor object
  var destructListeners = Pouch._destructionListeners = new ExportedMap();

  Pouch.on('ref', function onConstructorRef(db) {
    if (!destructListeners.has(db.name)) {
      destructListeners.set(db.name, []);
    }
    destructListeners.get(db.name).push(db);
  });

  Pouch.on('unref', function onConstructorUnref(db) {
    if (!destructListeners.has(db.name)) {
      return;
    }
    var dbList = destructListeners.get(db.name);
    var pos = dbList.indexOf(db);
    if (pos < 0) {
      /* istanbul ignore next */
      return;
    }
    dbList.splice(pos, 1);
    if (dbList.length > 1) {
      /* istanbul ignore next */
      destructListeners.set(db.name, dbList);
    } else {
      destructListeners.delete(db.name);
    }
  });

  Pouch.on('destroyed', function onConstructorDestroyed(name) {
    if (!destructListeners.has(name)) {
      return;
    }
    var dbList = destructListeners.get(name);
    destructListeners.delete(name);
    dbList.forEach(function (db) {
      db.emit('destroyed',true);
    });
  });
}

setUpEventEmitter(PouchDB);

PouchDB.adapter = function (id, obj, addToPreferredAdapters) {
  /* istanbul ignore else */
  if (obj.valid()) {
    PouchDB.adapters[id] = obj;
    if (addToPreferredAdapters) {
      PouchDB.preferredAdapters.push(id);
    }
  }
};

PouchDB.plugin = function (obj) {
  if (typeof obj === 'function') { // function style for plugins
    obj(PouchDB);
  } else if (typeof obj !== 'object' || Object.keys(obj).length === 0) {
    throw new Error('Invalid plugin: got "' + obj + '", expected an object or a function');
  } else {
    Object.keys(obj).forEach(function (id) { // object style for plugins
      PouchDB.prototype[id] = obj[id];
    });
  }
  if (this.__defaults) {
    PouchDB.__defaults = $inject_Object_assign({}, this.__defaults);
  }
  return PouchDB;
};

PouchDB.defaults = function (defaultOpts) {
  function PouchAlt(name, opts) {
    if (!(this instanceof PouchAlt)) {
      return new PouchAlt(name, opts);
    }

    opts = opts || {};

    if (name && typeof name === 'object') {
      opts = name;
      name = opts.name;
      delete opts.name;
    }

    opts = $inject_Object_assign({}, PouchAlt.__defaults, opts);
    PouchDB.call(this, name, opts);
  }

  inherits(PouchAlt, PouchDB);

  PouchAlt.preferredAdapters = PouchDB.preferredAdapters.slice();
  Object.keys(PouchDB).forEach(function (key) {
    if (!(key in PouchAlt)) {
      PouchAlt[key] = PouchDB[key];
    }
  });

  // make default options transitive
  // https://github.com/pouchdb/pouchdb/issues/5922
  PouchAlt.__defaults = $inject_Object_assign({}, this.__defaults, defaultOpts);

  return PouchAlt;
};

PouchDB.fetch = function (url, opts) {
  return f$1(url, opts);
};

// managed automatically by set-version.js
var version = "7.1.1";

// this would just be "return doc[field]", but fields
// can be "deep" due to dot notation
function getFieldFromDoc(doc, parsedField) {
  var value = doc;
  for (var i = 0, len = parsedField.length; i < len; i++) {
    var key = parsedField[i];
    value = value[key];
    if (!value) {
      break;
    }
  }
  return value;
}

function compare$1(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

// Converts a string in dot notation to an array of its components, with backslash escaping
function parseField(fieldName) {
  // fields may be deep (e.g. "foo.bar.baz"), so parse
  var fields = [];
  var current = '';
  for (var i = 0, len = fieldName.length; i < len; i++) {
    var ch = fieldName[i];
    if (ch === '.') {
      if (i > 0 && fieldName[i - 1] === '\\') { // escaped delimiter
        current = current.substring(0, current.length - 1) + '.';
      } else { // not escaped, so delimiter
        fields.push(current);
        current = '';
      }
    } else { // normal character
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

var combinationFields = ['$or', '$nor', '$not'];
function isCombinationalField(field) {
  return combinationFields.indexOf(field) > -1;
}

function getKey(obj) {
  return Object.keys(obj)[0];
}

function getValue(obj) {
  return obj[getKey(obj)];
}


// flatten an array of selectors joined by an $and operator
function mergeAndedSelectors(selectors) {

  // sort to ensure that e.g. if the user specified
  // $and: [{$gt: 'a'}, {$gt: 'b'}], then it's collapsed into
  // just {$gt: 'b'}
  var res = {};

  selectors.forEach(function (selector) {
    Object.keys(selector).forEach(function (field) {
      var matcher = selector[field];
      if (typeof matcher !== 'object') {
        matcher = {$eq: matcher};
      }

      if (isCombinationalField(field)) {
        if (matcher instanceof Array) {
          res[field] = matcher.map(function (m) {
            return mergeAndedSelectors([m]);
          });
        } else {
          res[field] = mergeAndedSelectors([matcher]);
        }
      } else {
        var fieldMatchers = res[field] = res[field] || {};
        Object.keys(matcher).forEach(function (operator) {
          var value = matcher[operator];

          if (operator === '$gt' || operator === '$gte') {
            return mergeGtGte(operator, value, fieldMatchers);
          } else if (operator === '$lt' || operator === '$lte') {
            return mergeLtLte(operator, value, fieldMatchers);
          } else if (operator === '$ne') {
            return mergeNe(value, fieldMatchers);
          } else if (operator === '$eq') {
            return mergeEq(value, fieldMatchers);
          }
          fieldMatchers[operator] = value;
        });
      }
    });
  });

  return res;
}



// collapse logically equivalent gt/gte values
function mergeGtGte(operator, value, fieldMatchers) {
  if (typeof fieldMatchers.$eq !== 'undefined') {
    return; // do nothing
  }
  if (typeof fieldMatchers.$gte !== 'undefined') {
    if (operator === '$gte') {
      if (value > fieldMatchers.$gte) { // more specificity
        fieldMatchers.$gte = value;
      }
    } else { // operator === '$gt'
      if (value >= fieldMatchers.$gte) { // more specificity
        delete fieldMatchers.$gte;
        fieldMatchers.$gt = value;
      }
    }
  } else if (typeof fieldMatchers.$gt !== 'undefined') {
    if (operator === '$gte') {
      if (value > fieldMatchers.$gt) { // more specificity
        delete fieldMatchers.$gt;
        fieldMatchers.$gte = value;
      }
    } else { // operator === '$gt'
      if (value > fieldMatchers.$gt) { // more specificity
        fieldMatchers.$gt = value;
      }
    }
  } else {
    fieldMatchers[operator] = value;
  }
}

// collapse logically equivalent lt/lte values
function mergeLtLte(operator, value, fieldMatchers) {
  if (typeof fieldMatchers.$eq !== 'undefined') {
    return; // do nothing
  }
  if (typeof fieldMatchers.$lte !== 'undefined') {
    if (operator === '$lte') {
      if (value < fieldMatchers.$lte) { // more specificity
        fieldMatchers.$lte = value;
      }
    } else { // operator === '$gt'
      if (value <= fieldMatchers.$lte) { // more specificity
        delete fieldMatchers.$lte;
        fieldMatchers.$lt = value;
      }
    }
  } else if (typeof fieldMatchers.$lt !== 'undefined') {
    if (operator === '$lte') {
      if (value < fieldMatchers.$lt) { // more specificity
        delete fieldMatchers.$lt;
        fieldMatchers.$lte = value;
      }
    } else { // operator === '$gt'
      if (value < fieldMatchers.$lt) { // more specificity
        fieldMatchers.$lt = value;
      }
    }
  } else {
    fieldMatchers[operator] = value;
  }
}

// combine $ne values into one array
function mergeNe(value, fieldMatchers) {
  if ('$ne' in fieldMatchers) {
    // there are many things this could "not" be
    fieldMatchers.$ne.push(value);
  } else { // doesn't exist yet
    fieldMatchers.$ne = [value];
  }
}

// add $eq into the mix
function mergeEq(value, fieldMatchers) {
  // these all have less specificity than the $eq
  // TODO: check for user errors here
  delete fieldMatchers.$gt;
  delete fieldMatchers.$gte;
  delete fieldMatchers.$lt;
  delete fieldMatchers.$lte;
  delete fieldMatchers.$ne;
  fieldMatchers.$eq = value;
}

//#7458: execute function mergeAndedSelectors on nested $and
function mergeAndedSelectorsNested(obj) {
    for (var prop in obj) {
        if (Array.isArray(obj)) {
            for (var i in obj) {
                if (obj[i]['$and']) {
                    obj[i] = mergeAndedSelectors(obj[i]['$and']);
                }
            }
        }
        var value = obj[prop];
        if (typeof value === 'object') {
            mergeAndedSelectorsNested(value); // <- recursive call
        }
    }
    return obj;
}

//#7458: determine id $and is present in selector (at any level)
function isAndInSelector(obj, isAnd) {
    for (var prop in obj) {
        if (prop === '$and') {
            isAnd = true;
        }
        var value = obj[prop];
        if (typeof value === 'object') {
            isAnd = isAndInSelector(value, isAnd); // <- recursive call
        }
    }
    return isAnd;
}

//
// normalize the selector
//
function massageSelector(input) {
  var result = clone(input);
  var wasAnded = false;
    //#7458: if $and is present in selector (at any level) merge nested $and
    if (isAndInSelector(result, false)) {
        result = mergeAndedSelectorsNested(result);
        if ('$and' in result) {
            result = mergeAndedSelectors(result['$and']);
        }
        wasAnded = true;
    }

  ['$or', '$nor'].forEach(function (orOrNor) {
    if (orOrNor in result) {
      // message each individual selector
      // e.g. {foo: 'bar'} becomes {foo: {$eq: 'bar'}}
      result[orOrNor].forEach(function (subSelector) {
        var fields = Object.keys(subSelector);
        for (var i = 0; i < fields.length; i++) {
          var field = fields[i];
          var matcher = subSelector[field];
          if (typeof matcher !== 'object' || matcher === null) {
            subSelector[field] = {$eq: matcher};
          }
        }
      });
    }
  });

  if ('$not' in result) {
    //This feels a little like forcing, but it will work for now,
    //I would like to come back to this and make the merging of selectors a little more generic
    result['$not'] = mergeAndedSelectors([result['$not']]);
  }

  var fields = Object.keys(result);

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var matcher = result[field];

    if (typeof matcher !== 'object' || matcher === null) {
      matcher = {$eq: matcher};
    } else if ('$ne' in matcher && !wasAnded) {
      // I put these in an array, since there may be more than one
      // but in the "mergeAnded" operation, I already take care of that
      matcher.$ne = [matcher.$ne];
    }
    result[field] = matcher;
  }

  return result;
}

function pad(str, padWith, upToLength) {
  var padding = '';
  var targetLength = upToLength - str.length;
  /* istanbul ignore next */
  while (padding.length < targetLength) {
    padding += padWith;
  }
  return padding;
}

function padLeft(str, padWith, upToLength) {
  var padding = pad(str, padWith, upToLength);
  return padding + str;
}

var MIN_MAGNITUDE = -324; // verified by -Number.MIN_VALUE
var MAGNITUDE_DIGITS = 3; // ditto
var SEP = ''; // set to '_' for easier debugging 

function collate(a, b) {

  if (a === b) {
    return 0;
  }

  a = normalizeKey(a);
  b = normalizeKey(b);

  var ai = collationIndex(a);
  var bi = collationIndex(b);
  if ((ai - bi) !== 0) {
    return ai - bi;
  }
  switch (typeof a) {
    case 'number':
      return a - b;
    case 'boolean':
      return a < b ? -1 : 1;
    case 'string':
      return stringCollate(a, b);
  }
  return Array.isArray(a) ? arrayCollate(a, b) : objectCollate(a, b);
}

// couch considers null/NaN/Infinity/-Infinity === undefined,
// for the purposes of mapreduce indexes. also, dates get stringified.
function normalizeKey(key) {
  switch (typeof key) {
    case 'undefined':
      return null;
    case 'number':
      if (key === Infinity || key === -Infinity || isNaN(key)) {
        return null;
      }
      return key;
    case 'object':
      var origKey = key;
      if (Array.isArray(key)) {
        var len = key.length;
        key = new Array(len);
        for (var i = 0; i < len; i++) {
          key[i] = normalizeKey(origKey[i]);
        }
      /* istanbul ignore next */
      } else if (key instanceof Date) {
        return key.toJSON();
      } else if (key !== null) { // generic object
        key = {};
        for (var k in origKey) {
          if (origKey.hasOwnProperty(k)) {
            var val = origKey[k];
            if (typeof val !== 'undefined') {
              key[k] = normalizeKey(val);
            }
          }
        }
      }
  }
  return key;
}

function indexify(key) {
  if (key !== null) {
    switch (typeof key) {
      case 'boolean':
        return key ? 1 : 0;
      case 'number':
        return numToIndexableString(key);
      case 'string':
        // We've to be sure that key does not contain \u0000
        // Do order-preserving replacements:
        // 0 -> 1, 1
        // 1 -> 1, 2
        // 2 -> 2, 2
        /* eslint-disable no-control-regex */
        return key
          .replace(/\u0002/g, '\u0002\u0002')
          .replace(/\u0001/g, '\u0001\u0002')
          .replace(/\u0000/g, '\u0001\u0001');
        /* eslint-enable no-control-regex */
      case 'object':
        var isArray = Array.isArray(key);
        var arr = isArray ? key : Object.keys(key);
        var i = -1;
        var len = arr.length;
        var result = '';
        if (isArray) {
          while (++i < len) {
            result += toIndexableString(arr[i]);
          }
        } else {
          while (++i < len) {
            var objKey = arr[i];
            result += toIndexableString(objKey) +
                toIndexableString(key[objKey]);
          }
        }
        return result;
    }
  }
  return '';
}

// convert the given key to a string that would be appropriate
// for lexical sorting, e.g. within a database, where the
// sorting is the same given by the collate() function.
function toIndexableString(key) {
  var zero = '\u0000';
  key = normalizeKey(key);
  return collationIndex(key) + SEP + indexify(key) + zero;
}

function parseNumber(str, i) {
  var originalIdx = i;
  var num;
  var zero = str[i] === '1';
  if (zero) {
    num = 0;
    i++;
  } else {
    var neg = str[i] === '0';
    i++;
    var numAsString = '';
    var magAsString = str.substring(i, i + MAGNITUDE_DIGITS);
    var magnitude = parseInt(magAsString, 10) + MIN_MAGNITUDE;
    /* istanbul ignore next */
    if (neg) {
      magnitude = -magnitude;
    }
    i += MAGNITUDE_DIGITS;
    while (true) {
      var ch = str[i];
      if (ch === '\u0000') {
        break;
      } else {
        numAsString += ch;
      }
      i++;
    }
    numAsString = numAsString.split('.');
    if (numAsString.length === 1) {
      num = parseInt(numAsString, 10);
    } else {
      /* istanbul ignore next */
      num = parseFloat(numAsString[0] + '.' + numAsString[1]);
    }
    /* istanbul ignore next */
    if (neg) {
      num = num - 10;
    }
    /* istanbul ignore next */
    if (magnitude !== 0) {
      // parseFloat is more reliable than pow due to rounding errors
      // e.g. Number.MAX_VALUE would return Infinity if we did
      // num * Math.pow(10, magnitude);
      num = parseFloat(num + 'e' + magnitude);
    }
  }
  return {num: num, length : i - originalIdx};
}

// move up the stack while parsing
// this function moved outside of parseIndexableString for performance
function pop(stack, metaStack) {
  var obj = stack.pop();

  if (metaStack.length) {
    var lastMetaElement = metaStack[metaStack.length - 1];
    if (obj === lastMetaElement.element) {
      // popping a meta-element, e.g. an object whose value is another object
      metaStack.pop();
      lastMetaElement = metaStack[metaStack.length - 1];
    }
    var element = lastMetaElement.element;
    var lastElementIndex = lastMetaElement.index;
    if (Array.isArray(element)) {
      element.push(obj);
    } else if (lastElementIndex === stack.length - 2) { // obj with key+value
      var key = stack.pop();
      element[key] = obj;
    } else {
      stack.push(obj); // obj with key only
    }
  }
}

function parseIndexableString(str) {
  var stack = [];
  var metaStack = []; // stack for arrays and objects
  var i = 0;

  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    var collationIndex = str[i++];
    if (collationIndex === '\u0000') {
      if (stack.length === 1) {
        return stack.pop();
      } else {
        pop(stack, metaStack);
        continue;
      }
    }
    switch (collationIndex) {
      case '1':
        stack.push(null);
        break;
      case '2':
        stack.push(str[i] === '1');
        i++;
        break;
      case '3':
        var parsedNum = parseNumber(str, i);
        stack.push(parsedNum.num);
        i += parsedNum.length;
        break;
      case '4':
        var parsedStr = '';
        /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
        while (true) {
          var ch = str[i];
          if (ch === '\u0000') {
            break;
          }
          parsedStr += ch;
          i++;
        }
        // perform the reverse of the order-preserving replacement
        // algorithm (see above)
        /* eslint-disable no-control-regex */
        parsedStr = parsedStr.replace(/\u0001\u0001/g, '\u0000')
          .replace(/\u0001\u0002/g, '\u0001')
          .replace(/\u0002\u0002/g, '\u0002');
        /* eslint-enable no-control-regex */
        stack.push(parsedStr);
        break;
      case '5':
        var arrayElement = { element: [], index: stack.length };
        stack.push(arrayElement.element);
        metaStack.push(arrayElement);
        break;
      case '6':
        var objElement = { element: {}, index: stack.length };
        stack.push(objElement.element);
        metaStack.push(objElement);
        break;
      /* istanbul ignore next */
      default:
        throw new Error(
          'bad collationIndex or unexpectedly reached end of input: ' +
            collationIndex);
    }
  }
}

function arrayCollate(a, b) {
  var len = Math.min(a.length, b.length);
  for (var i = 0; i < len; i++) {
    var sort = collate(a[i], b[i]);
    if (sort !== 0) {
      return sort;
    }
  }
  return (a.length === b.length) ? 0 :
    (a.length > b.length) ? 1 : -1;
}
function stringCollate(a, b) {
  // See: https://github.com/daleharvey/pouchdb/issues/40
  // This is incompatible with the CouchDB implementation, but its the
  // best we can do for now
  return (a === b) ? 0 : ((a > b) ? 1 : -1);
}
function objectCollate(a, b) {
  var ak = Object.keys(a), bk = Object.keys(b);
  var len = Math.min(ak.length, bk.length);
  for (var i = 0; i < len; i++) {
    // First sort the keys
    var sort = collate(ak[i], bk[i]);
    if (sort !== 0) {
      return sort;
    }
    // if the keys are equal sort the values
    sort = collate(a[ak[i]], b[bk[i]]);
    if (sort !== 0) {
      return sort;
    }

  }
  return (ak.length === bk.length) ? 0 :
    (ak.length > bk.length) ? 1 : -1;
}
// The collation is defined by erlangs ordered terms
// the atoms null, true, false come first, then numbers, strings,
// arrays, then objects
// null/undefined/NaN/Infinity/-Infinity are all considered null
function collationIndex(x) {
  var id = ['boolean', 'number', 'string', 'object'];
  var idx = id.indexOf(typeof x);
  //false if -1 otherwise true, but fast!!!!1
  if (~idx) {
    if (x === null) {
      return 1;
    }
    if (Array.isArray(x)) {
      return 5;
    }
    return idx < 3 ? (idx + 2) : (idx + 3);
  }
  /* istanbul ignore next */
  if (Array.isArray(x)) {
    return 5;
  }
}

// conversion:
// x yyy zz...zz
// x = 0 for negative, 1 for 0, 2 for positive
// y = exponent (for negative numbers negated) moved so that it's >= 0
// z = mantisse
function numToIndexableString(num) {

  if (num === 0) {
    return '1';
  }

  // convert number to exponential format for easier and
  // more succinct string sorting
  var expFormat = num.toExponential().split(/e\+?/);
  var magnitude = parseInt(expFormat[1], 10);

  var neg = num < 0;

  var result = neg ? '0' : '2';

  // first sort by magnitude
  // it's easier if all magnitudes are positive
  var magForComparison = ((neg ? -magnitude : magnitude) - MIN_MAGNITUDE);
  var magString = padLeft((magForComparison).toString(), '0', MAGNITUDE_DIGITS);

  result += SEP + magString;

  // then sort by the factor
  var factor = Math.abs(parseFloat(expFormat[0])); // [1..10)
  /* istanbul ignore next */
  if (neg) { // for negative reverse ordering
    factor = 10 - factor;
  }

  var factorStr = factor.toFixed(20);

  // strip zeros from the end
  factorStr = factorStr.replace(/\.?0+$/, '');

  result += SEP + factorStr;

  return result;
}

// create a comparator based on the sort object
function createFieldSorter(sort) {

  function getFieldValuesAsArray(doc) {
    return sort.map(function (sorting) {
      var fieldName = getKey(sorting);
      var parsedField = parseField(fieldName);
      var docFieldValue = getFieldFromDoc(doc, parsedField);
      return docFieldValue;
    });
  }

  return function (aRow, bRow) {
    var aFieldValues = getFieldValuesAsArray(aRow.doc);
    var bFieldValues = getFieldValuesAsArray(bRow.doc);
    var collation = collate(aFieldValues, bFieldValues);
    if (collation !== 0) {
      return collation;
    }
    // this is what mango seems to do
    return compare$1(aRow.doc._id, bRow.doc._id);
  };
}

function filterInMemoryFields(rows, requestDef, inMemoryFields) {
  rows = rows.filter(function (row) {
    return rowFilter(row.doc, requestDef.selector, inMemoryFields);
  });

  if (requestDef.sort) {
    // in-memory sort
    var fieldSorter = createFieldSorter(requestDef.sort);
    rows = rows.sort(fieldSorter);
    if (typeof requestDef.sort[0] !== 'string' &&
        getValue(requestDef.sort[0]) === 'desc') {
      rows = rows.reverse();
    }
  }

  if ('limit' in requestDef || 'skip' in requestDef) {
    // have to do the limit in-memory
    var skip = requestDef.skip || 0;
    var limit = ('limit' in requestDef ? requestDef.limit : rows.length) + skip;
    rows = rows.slice(skip, limit);
  }
  return rows;
}

function rowFilter(doc, selector, inMemoryFields) {
  return inMemoryFields.every(function (field) {
    var matcher = selector[field];
    var parsedField = parseField(field);
    var docFieldValue = getFieldFromDoc(doc, parsedField);
    if (isCombinationalField(field)) {
      return matchCominationalSelector(field, matcher, doc);
    }

    return matchSelector(matcher, doc, parsedField, docFieldValue);
  });
}

function matchSelector(matcher, doc, parsedField, docFieldValue) {
  if (!matcher) {
    // no filtering necessary; this field is just needed for sorting
    return true;
  }

  // is matcher an object, if so continue recursion
  if (typeof matcher === 'object') {
    return Object.keys(matcher).every(function (userOperator) {
      var userValue = matcher[userOperator];
      return match(userOperator, doc, userValue, parsedField, docFieldValue);
    });
  }

  // no more depth, No need to recurse further
  return matcher === docFieldValue;
}

function matchCominationalSelector(field, matcher, doc) {

  if (field === '$or') {
    return matcher.some(function (orMatchers) {
      return rowFilter(doc, orMatchers, Object.keys(orMatchers));
    });
  }

  if (field === '$not') {
    return !rowFilter(doc, matcher, Object.keys(matcher));
  }

  //`$nor`
  return !matcher.find(function (orMatchers) {
    return rowFilter(doc, orMatchers, Object.keys(orMatchers));
  });

}

function match(userOperator, doc, userValue, parsedField, docFieldValue) {
  if (!matchers[userOperator]) {
    throw new Error('unknown operator "' + userOperator +
      '" - should be one of $eq, $lte, $lt, $gt, $gte, $exists, $ne, $in, ' +
      '$nin, $size, $mod, $regex, $elemMatch, $type, $allMatch or $all');
  }
  return matchers[userOperator](doc, userValue, parsedField, docFieldValue);
}

function fieldExists(docFieldValue) {
  return typeof docFieldValue !== 'undefined' && docFieldValue !== null;
}

function fieldIsNotUndefined(docFieldValue) {
  return typeof docFieldValue !== 'undefined';
}

function modField(docFieldValue, userValue) {
  var divisor = userValue[0];
  var mod = userValue[1];
  if (divisor === 0) {
    throw new Error('Bad divisor, cannot divide by zero');
  }

  if (parseInt(divisor, 10) !== divisor ) {
    throw new Error('Divisor is not an integer');
  }

  if (parseInt(mod, 10) !== mod ) {
    throw new Error('Modulus is not an integer');
  }

  if (parseInt(docFieldValue, 10) !== docFieldValue) {
    return false;
  }

  return docFieldValue % divisor === mod;
}

function arrayContainsValue(docFieldValue, userValue) {
  return userValue.some(function (val) {
    if (docFieldValue instanceof Array) {
      return docFieldValue.indexOf(val) > -1;
    }

    return docFieldValue === val;
  });
}

function arrayContainsAllValues(docFieldValue, userValue) {
  return userValue.every(function (val) {
    return docFieldValue.indexOf(val) > -1;
  });
}

function arraySize(docFieldValue, userValue) {
  return docFieldValue.length === userValue;
}

function regexMatch(docFieldValue, userValue) {
  var re = new RegExp(userValue);

  return re.test(docFieldValue);
}

function typeMatch(docFieldValue, userValue) {

  switch (userValue) {
    case 'null':
      return docFieldValue === null;
    case 'boolean':
      return typeof (docFieldValue) === 'boolean';
    case 'number':
      return typeof (docFieldValue) === 'number';
    case 'string':
      return typeof (docFieldValue) === 'string';
    case 'array':
      return docFieldValue instanceof Array;
    case 'object':
      return ({}).toString.call(docFieldValue) === '[object Object]';
  }

  throw new Error(userValue + ' not supported as a type.' +
                  'Please use one of object, string, array, number, boolean or null.');

}

var matchers = {

  '$elemMatch': function (doc, userValue, parsedField, docFieldValue) {
    if (!Array.isArray(docFieldValue)) {
      return false;
    }

    if (docFieldValue.length === 0) {
      return false;
    }

    if (typeof docFieldValue[0] === 'object') {
      return docFieldValue.some(function (val) {
        return rowFilter(val, userValue, Object.keys(userValue));
      });
    }

    return docFieldValue.some(function (val) {
      return matchSelector(userValue, doc, parsedField, val);
    });
  },

  '$allMatch': function (doc, userValue, parsedField, docFieldValue) {
    if (!Array.isArray(docFieldValue)) {
      return false;
    }

    /* istanbul ignore next */
    if (docFieldValue.length === 0) {
      return false;
    }

    if (typeof docFieldValue[0] === 'object') {
      return docFieldValue.every(function (val) {
        return rowFilter(val, userValue, Object.keys(userValue));
      });
    }

    return docFieldValue.every(function (val) {
      return matchSelector(userValue, doc, parsedField, val);
    });
  },

  '$eq': function (doc, userValue, parsedField, docFieldValue) {
    return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) === 0;
  },

  '$gte': function (doc, userValue, parsedField, docFieldValue) {
    return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) >= 0;
  },

  '$gt': function (doc, userValue, parsedField, docFieldValue) {
    return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) > 0;
  },

  '$lte': function (doc, userValue, parsedField, docFieldValue) {
    return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) <= 0;
  },

  '$lt': function (doc, userValue, parsedField, docFieldValue) {
    return fieldIsNotUndefined(docFieldValue) && collate(docFieldValue, userValue) < 0;
  },

  '$exists': function (doc, userValue, parsedField, docFieldValue) {
    //a field that is null is still considered to exist
    if (userValue) {
      return fieldIsNotUndefined(docFieldValue);
    }

    return !fieldIsNotUndefined(docFieldValue);
  },

  '$mod': function (doc, userValue, parsedField, docFieldValue) {
    return fieldExists(docFieldValue) && modField(docFieldValue, userValue);
  },

  '$ne': function (doc, userValue, parsedField, docFieldValue) {
    return userValue.every(function (neValue) {
      return collate(docFieldValue, neValue) !== 0;
    });
  },
  '$in': function (doc, userValue, parsedField, docFieldValue) {
    return fieldExists(docFieldValue) && arrayContainsValue(docFieldValue, userValue);
  },

  '$nin': function (doc, userValue, parsedField, docFieldValue) {
    return fieldExists(docFieldValue) && !arrayContainsValue(docFieldValue, userValue);
  },

  '$size': function (doc, userValue, parsedField, docFieldValue) {
    return fieldExists(docFieldValue) && arraySize(docFieldValue, userValue);
  },

  '$all': function (doc, userValue, parsedField, docFieldValue) {
    return Array.isArray(docFieldValue) && arrayContainsAllValues(docFieldValue, userValue);
  },

  '$regex': function (doc, userValue, parsedField, docFieldValue) {
    return fieldExists(docFieldValue) && regexMatch(docFieldValue, userValue);
  },

  '$type': function (doc, userValue, parsedField, docFieldValue) {
    return typeMatch(docFieldValue, userValue);
  }
};

// return true if the given doc matches the supplied selector
function matchesSelector(doc, selector) {
  /* istanbul ignore if */
  if (typeof selector !== 'object') {
    // match the CouchDB error message
    throw new Error('Selector error: expected a JSON object');
  }

  selector = massageSelector(selector);
  var row = {
    'doc': doc
  };

  var rowsMatched = filterInMemoryFields([row], { 'selector': selector }, Object.keys(selector));
  return rowsMatched && rowsMatched.length === 1;
}

function evalFilter(input) {
  return scopeEval('"use strict";\nreturn ' + input + ';', {});
}

function evalView(input) {
  var code = [
    'return function(doc) {',
    '  "use strict";',
    '  var emitted = false;',
    '  var emit = function (a, b) {',
    '    emitted = true;',
    '  };',
    '  var view = ' + input + ';',
    '  view(doc);',
    '  if (emitted) {',
    '    return true;',
    '  }',
    '};'
  ].join('\n');

  return scopeEval(code, {});
}

function validate(opts, callback) {
  if (opts.selector) {
    if (opts.filter && opts.filter !== '_selector') {
      var filterName = typeof opts.filter === 'string' ?
        opts.filter : 'function';
      return callback(new Error('selector invalid for filter "' + filterName + '"'));
    }
  }
  callback();
}

function normalize(opts) {
  if (opts.view && !opts.filter) {
    opts.filter = '_view';
  }

  if (opts.selector && !opts.filter) {
    opts.filter = '_selector';
  }

  if (opts.filter && typeof opts.filter === 'string') {
    if (opts.filter === '_view') {
      opts.view = normalizeDesignDocFunctionName(opts.view);
    } else {
      opts.filter = normalizeDesignDocFunctionName(opts.filter);
    }
  }
}

function shouldFilter(changesHandler, opts) {
  return opts.filter && typeof opts.filter === 'string' &&
    !opts.doc_ids && !isRemote(changesHandler.db);
}

function filter(changesHandler, opts) {
  var callback = opts.complete;
  if (opts.filter === '_view') {
    if (!opts.view || typeof opts.view !== 'string') {
      var err = createError(BAD_REQUEST,
        '`view` filter parameter not found or invalid.');
      return callback(err);
    }
    // fetch a view from a design doc, make it behave like a filter
    var viewName = parseDesignDocFunctionName(opts.view);
    changesHandler.db.get('_design/' + viewName[0], function (err, ddoc) {
      /* istanbul ignore if */
      if (changesHandler.isCancelled) {
        return callback(null, {status: 'cancelled'});
      }
      /* istanbul ignore next */
      if (err) {
        return callback(generateErrorFromResponse(err));
      }
      var mapFun = ddoc && ddoc.views && ddoc.views[viewName[1]] &&
        ddoc.views[viewName[1]].map;
      if (!mapFun) {
        return callback(createError(MISSING_DOC,
          (ddoc.views ? 'missing json key: ' + viewName[1] :
            'missing json key: views')));
      }
      opts.filter = evalView(mapFun);
      changesHandler.doChanges(opts);
    });
  } else if (opts.selector) {
    opts.filter = function (doc) {
      return matchesSelector(doc, opts.selector);
    };
    changesHandler.doChanges(opts);
  } else {
    // fetch a filter from a design doc
    var filterName = parseDesignDocFunctionName(opts.filter);
    changesHandler.db.get('_design/' + filterName[0], function (err, ddoc) {
      /* istanbul ignore if */
      if (changesHandler.isCancelled) {
        return callback(null, {status: 'cancelled'});
      }
      /* istanbul ignore next */
      if (err) {
        return callback(generateErrorFromResponse(err));
      }
      var filterFun = ddoc && ddoc.filters && ddoc.filters[filterName[1]];
      if (!filterFun) {
        return callback(createError(MISSING_DOC,
          ((ddoc && ddoc.filters) ? 'missing json key: ' + filterName[1]
            : 'missing json key: filters')));
      }
      opts.filter = evalFilter(filterFun);
      changesHandler.doChanges(opts);
    });
  }
}

function applyChangesFilterPlugin(PouchDB) {
  PouchDB._changesFilterPlugin = {
    validate: validate,
    normalize: normalize,
    shouldFilter: shouldFilter,
    filter: filter
  };
}

// TODO: remove from pouchdb-core (breaking)
PouchDB.plugin(applyChangesFilterPlugin);

PouchDB.version = version;

function toObject(array) {
  return array.reduce(function (obj, item) {
    obj[item] = true;
    return obj;
  }, {});
}
// List of top level reserved words for doc
var reservedWords = toObject([
  '_id',
  '_rev',
  '_attachments',
  '_deleted',
  '_revisions',
  '_revs_info',
  '_conflicts',
  '_deleted_conflicts',
  '_local_seq',
  '_rev_tree',
  //replication documents
  '_replication_id',
  '_replication_state',
  '_replication_state_time',
  '_replication_state_reason',
  '_replication_stats',
  // Specific to Couchbase Sync Gateway
  '_removed'
]);

// List of reserved words that should end up the document
var dataWords = toObject([
  '_attachments',
  //replication documents
  '_replication_id',
  '_replication_state',
  '_replication_state_time',
  '_replication_state_reason',
  '_replication_stats'
]);

function parseRevisionInfo(rev$$1) {
  if (!/^\d+-./.test(rev$$1)) {
    return createError(INVALID_REV);
  }
  var idx = rev$$1.indexOf('-');
  var left = rev$$1.substring(0, idx);
  var right = rev$$1.substring(idx + 1);
  return {
    prefix: parseInt(left, 10),
    id: right
  };
}

function makeRevTreeFromRevisions(revisions, opts) {
  var pos = revisions.start - revisions.ids.length + 1;

  var revisionIds = revisions.ids;
  var ids = [revisionIds[0], opts, []];

  for (var i = 1, len = revisionIds.length; i < len; i++) {
    ids = [revisionIds[i], {status: 'missing'}, [ids]];
  }

  return [{
    pos: pos,
    ids: ids
  }];
}

// Preprocess documents, parse their revisions, assign an id and a
// revision for new writes that are missing them, etc
function parseDoc(doc, newEdits, dbOpts) {
  if (!dbOpts) {
    dbOpts = {
      deterministic_revs: true
    };
  }

  var nRevNum;
  var newRevId;
  var revInfo;
  var opts = {status: 'available'};
  if (doc._deleted) {
    opts.deleted = true;
  }

  if (newEdits) {
    if (!doc._id) {
      doc._id = uuid();
    }
    newRevId = rev(doc, dbOpts.deterministic_revs);
    if (doc._rev) {
      revInfo = parseRevisionInfo(doc._rev);
      if (revInfo.error) {
        return revInfo;
      }
      doc._rev_tree = [{
        pos: revInfo.prefix,
        ids: [revInfo.id, {status: 'missing'}, [[newRevId, opts, []]]]
      }];
      nRevNum = revInfo.prefix + 1;
    } else {
      doc._rev_tree = [{
        pos: 1,
        ids : [newRevId, opts, []]
      }];
      nRevNum = 1;
    }
  } else {
    if (doc._revisions) {
      doc._rev_tree = makeRevTreeFromRevisions(doc._revisions, opts);
      nRevNum = doc._revisions.start;
      newRevId = doc._revisions.ids[0];
    }
    if (!doc._rev_tree) {
      revInfo = parseRevisionInfo(doc._rev);
      if (revInfo.error) {
        return revInfo;
      }
      nRevNum = revInfo.prefix;
      newRevId = revInfo.id;
      doc._rev_tree = [{
        pos: nRevNum,
        ids: [newRevId, opts, []]
      }];
    }
  }

  invalidIdError(doc._id);

  doc._rev = nRevNum + '-' + newRevId;

  var result = {metadata : {}, data : {}};
  for (var key in doc) {
    /* istanbul ignore else */
    if (Object.prototype.hasOwnProperty.call(doc, key)) {
      var specialKey = key[0] === '_';
      if (specialKey && !reservedWords[key]) {
        var error = createError(DOC_VALIDATION, key);
        error.message = DOC_VALIDATION.message + ': ' + key;
        throw error;
      } else if (specialKey && !dataWords[key]) {
        result.metadata[key.slice(1)] = doc[key];
      } else {
        result.data[key] = doc[key];
      }
    }
  }
  return result;
}

function parseBase64(data) {
  try {
    return thisAtob(data);
  } catch (e) {
    var err = createError(BAD_ARG,
      'Attachment is not a valid base64 string');
    return {error: err};
  }
}

function preprocessString(att, blobType, callback) {
  var asBinary = parseBase64(att.data);
  if (asBinary.error) {
    return callback(asBinary.error);
  }

  att.length = asBinary.length;
  if (blobType === 'blob') {
    att.data = binStringToBluffer(asBinary, att.content_type);
  } else if (blobType === 'base64') {
    att.data = thisBtoa(asBinary);
  } else { // binary
    att.data = asBinary;
  }
  binaryMd5(asBinary, function (result) {
    att.digest = 'md5-' + result;
    callback();
  });
}

function preprocessBlob(att, blobType, callback) {
  binaryMd5(att.data, function (md5) {
    att.digest = 'md5-' + md5;
    // size is for blobs (browser), length is for buffers (node)
    att.length = att.data.size || att.data.length || 0;
    if (blobType === 'binary') {
      blobToBinaryString(att.data, function (binString) {
        att.data = binString;
        callback();
      });
    } else if (blobType === 'base64') {
      blobToBase64(att.data, function (b64) {
        att.data = b64;
        callback();
      });
    } else {
      callback();
    }
  });
}

function preprocessAttachment(att, blobType, callback) {
  if (att.stub) {
    return callback();
  }
  if (typeof att.data === 'string') { // input is a base64 string
    preprocessString(att, blobType, callback);
  } else { // input is a blob
    preprocessBlob(att, blobType, callback);
  }
}

function preprocessAttachments(docInfos, blobType, callback) {

  if (!docInfos.length) {
    return callback();
  }

  var docv = 0;
  var overallErr;

  docInfos.forEach(function (docInfo) {
    var attachments = docInfo.data && docInfo.data._attachments ?
      Object.keys(docInfo.data._attachments) : [];
    var recv = 0;

    if (!attachments.length) {
      return done();
    }

    function processedAttachment(err) {
      overallErr = err;
      recv++;
      if (recv === attachments.length) {
        done();
      }
    }

    for (var key in docInfo.data._attachments) {
      if (docInfo.data._attachments.hasOwnProperty(key)) {
        preprocessAttachment(docInfo.data._attachments[key],
          blobType, processedAttachment);
      }
    }
  });

  function done() {
    docv++;
    if (docInfos.length === docv) {
      if (overallErr) {
        callback(overallErr);
      } else {
        callback();
      }
    }
  }
}

function updateDoc(revLimit, prev, docInfo, results,
                   i, cb, writeDoc, newEdits) {

  if (revExists(prev.rev_tree, docInfo.metadata.rev) && !newEdits) {
    results[i] = docInfo;
    return cb();
  }

  // sometimes this is pre-calculated. historically not always
  var previousWinningRev = prev.winningRev || winningRev(prev);
  var previouslyDeleted = 'deleted' in prev ? prev.deleted :
    isDeleted(prev, previousWinningRev);
  var deleted = 'deleted' in docInfo.metadata ? docInfo.metadata.deleted :
    isDeleted(docInfo.metadata);
  var isRoot = /^1-/.test(docInfo.metadata.rev);

  if (previouslyDeleted && !deleted && newEdits && isRoot) {
    var newDoc = docInfo.data;
    newDoc._rev = previousWinningRev;
    newDoc._id = docInfo.metadata.id;
    docInfo = parseDoc(newDoc, newEdits);
  }

  var merged = merge(prev.rev_tree, docInfo.metadata.rev_tree[0], revLimit);

  var inConflict = newEdits && ((
    (previouslyDeleted && deleted && merged.conflicts !== 'new_leaf') ||
    (!previouslyDeleted && merged.conflicts !== 'new_leaf') ||
    (previouslyDeleted && !deleted && merged.conflicts === 'new_branch')));

  if (inConflict) {
    var err = createError(REV_CONFLICT);
    results[i] = err;
    return cb();
  }

  var newRev = docInfo.metadata.rev;
  docInfo.metadata.rev_tree = merged.tree;
  docInfo.stemmedRevs = merged.stemmedRevs || [];
  /* istanbul ignore else */
  if (prev.rev_map) {
    docInfo.metadata.rev_map = prev.rev_map; // used only by leveldb
  }

  // recalculate
  var winningRev$$1 = winningRev(docInfo.metadata);
  var winningRevIsDeleted = isDeleted(docInfo.metadata, winningRev$$1);

  // calculate the total number of documents that were added/removed,
  // from the perspective of total_rows/doc_count
  var delta = (previouslyDeleted === winningRevIsDeleted) ? 0 :
    previouslyDeleted < winningRevIsDeleted ? -1 : 1;

  var newRevIsDeleted;
  if (newRev === winningRev$$1) {
    // if the new rev is the same as the winning rev, we can reuse that value
    newRevIsDeleted = winningRevIsDeleted;
  } else {
    // if they're not the same, then we need to recalculate
    newRevIsDeleted = isDeleted(docInfo.metadata, newRev);
  }

  writeDoc(docInfo, winningRev$$1, winningRevIsDeleted, newRevIsDeleted,
    true, delta, i, cb);
}

function rootIsMissing(docInfo) {
  return docInfo.metadata.rev_tree[0].ids[1].status === 'missing';
}

function processDocs(revLimit, docInfos, api, fetchedDocs, tx, results,
                     writeDoc, opts, overallCallback) {

  // Default to 1000 locally
  revLimit = revLimit || 1000;

  function insertDoc(docInfo, resultsIdx, callback) {
    // Cant insert new deleted documents
    var winningRev$$1 = winningRev(docInfo.metadata);
    var deleted = isDeleted(docInfo.metadata, winningRev$$1);
    if ('was_delete' in opts && deleted) {
      results[resultsIdx] = createError(MISSING_DOC, 'deleted');
      return callback();
    }

    // 4712 - detect whether a new document was inserted with a _rev
    var inConflict = newEdits && rootIsMissing(docInfo);

    if (inConflict) {
      var err = createError(REV_CONFLICT);
      results[resultsIdx] = err;
      return callback();
    }

    var delta = deleted ? 0 : 1;

    writeDoc(docInfo, winningRev$$1, deleted, deleted, false,
      delta, resultsIdx, callback);
  }

  var newEdits = opts.new_edits;
  var idsToDocs = new ExportedMap();

  var docsDone = 0;
  var docsToDo = docInfos.length;

  function checkAllDocsDone() {
    if (++docsDone === docsToDo && overallCallback) {
      overallCallback();
    }
  }

  docInfos.forEach(function (currentDoc, resultsIdx) {

    if (currentDoc._id && isLocalId(currentDoc._id)) {
      var fun = currentDoc._deleted ? '_removeLocal' : '_putLocal';
      api[fun](currentDoc, {ctx: tx}, function (err, res) {
        results[resultsIdx] = err || res;
        checkAllDocsDone();
      });
      return;
    }

    var id = currentDoc.metadata.id;
    if (idsToDocs.has(id)) {
      docsToDo--; // duplicate
      idsToDocs.get(id).push([currentDoc, resultsIdx]);
    } else {
      idsToDocs.set(id, [[currentDoc, resultsIdx]]);
    }
  });

  // in the case of new_edits, the user can provide multiple docs
  // with the same id. these need to be processed sequentially
  idsToDocs.forEach(function (docs, id) {
    var numDone = 0;

    function docWritten() {
      if (++numDone < docs.length) {
        nextDoc();
      } else {
        checkAllDocsDone();
      }
    }
    function nextDoc() {
      var value = docs[numDone];
      var currentDoc = value[0];
      var resultsIdx = value[1];

      if (fetchedDocs.has(id)) {
        updateDoc(revLimit, fetchedDocs.get(id), currentDoc, results,
          resultsIdx, docWritten, writeDoc, newEdits);
      } else {
        // Ensure stemming applies to new writes as well
        var merged = merge([], currentDoc.metadata.rev_tree[0], revLimit);
        currentDoc.metadata.rev_tree = merged.tree;
        currentDoc.stemmedRevs = merged.stemmedRevs || [];
        insertDoc(currentDoc, resultsIdx, docWritten);
      }
    }
    nextDoc();
  });
}

// IndexedDB requires a versioned database structure, so we use the
// version here to manage migrations.
var ADAPTER_VERSION = 5;

// The object stores created for each database
// DOC_STORE stores the document meta data, its revision history and state
// Keyed by document id
var DOC_STORE = 'document-store';
// BY_SEQ_STORE stores a particular version of a document, keyed by its
// sequence id
var BY_SEQ_STORE = 'by-sequence';
// Where we store attachments
var ATTACH_STORE = 'attach-store';
// Where we store many-to-many relations
// between attachment digests and seqs
var ATTACH_AND_SEQ_STORE = 'attach-seq-store';

// Where we store database-wide meta data in a single record
// keyed by id: META_STORE
var META_STORE = 'meta-store';
// Where we store local documents
var LOCAL_STORE = 'local-store';
// Where we detect blob support
var DETECT_BLOB_SUPPORT_STORE = 'detect-blob-support';

function safeJsonParse(str) {
  // This try/catch guards against stack overflow errors.
  // JSON.parse() is faster than vuvuzela.parse() but vuvuzela
  // cannot overflow.
  try {
    return JSON.parse(str);
  } catch (e) {
    /* istanbul ignore next */
    return vuvuzela.parse(str);
  }
}

function safeJsonStringify(json) {
  try {
    return JSON.stringify(json);
  } catch (e) {
    /* istanbul ignore next */
    return vuvuzela.stringify(json);
  }
}

function idbError(callback) {
  return function (evt) {
    var message = 'unknown_error';
    if (evt.target && evt.target.error) {
      message = evt.target.error.name || evt.target.error.message;
    }
    callback(createError(IDB_ERROR, message, evt.type));
  };
}

// Unfortunately, the metadata has to be stringified
// when it is put into the database, because otherwise
// IndexedDB can throw errors for deeply-nested objects.
// Originally we just used JSON.parse/JSON.stringify; now
// we use this custom vuvuzela library that avoids recursion.
// If we could do it all over again, we'd probably use a
// format for the revision trees other than JSON.
function encodeMetadata(metadata, winningRev, deleted) {
  return {
    data: safeJsonStringify(metadata),
    winningRev: winningRev,
    deletedOrLocal: deleted ? '1' : '0',
    seq: metadata.seq, // highest seq for this doc
    id: metadata.id
  };
}

function decodeMetadata(storedObject) {
  if (!storedObject) {
    return null;
  }
  var metadata = safeJsonParse(storedObject.data);
  metadata.winningRev = storedObject.winningRev;
  metadata.deleted = storedObject.deletedOrLocal === '1';
  metadata.seq = storedObject.seq;
  return metadata;
}

// read the doc back out from the database. we don't store the
// _id or _rev because we already have _doc_id_rev.
function decodeDoc(doc) {
  if (!doc) {
    return doc;
  }
  var idx = doc._doc_id_rev.lastIndexOf(':');
  doc._id = doc._doc_id_rev.substring(0, idx - 1);
  doc._rev = doc._doc_id_rev.substring(idx + 1);
  delete doc._doc_id_rev;
  return doc;
}

// Read a blob from the database, encoding as necessary
// and translating from base64 if the IDB doesn't support
// native Blobs
function readBlobData(body, type, asBlob, callback) {
  if (asBlob) {
    if (!body) {
      callback(createBlob([''], {type: type}));
    } else if (typeof body !== 'string') { // we have blob support
      callback(body);
    } else { // no blob support
      callback(b64ToBluffer(body, type));
    }
  } else { // as base64 string
    if (!body) {
      callback('');
    } else if (typeof body !== 'string') { // we have blob support
      readAsBinaryString(body, function (binary) {
        callback(thisBtoa(binary));
      });
    } else { // no blob support
      callback(body);
    }
  }
}

function fetchAttachmentsIfNecessary(doc, opts, txn, cb) {
  var attachments = Object.keys(doc._attachments || {});
  if (!attachments.length) {
    return cb && cb();
  }
  var numDone = 0;

  function checkDone() {
    if (++numDone === attachments.length && cb) {
      cb();
    }
  }

  function fetchAttachment(doc, att) {
    var attObj = doc._attachments[att];
    var digest = attObj.digest;
    var req = txn.objectStore(ATTACH_STORE).get(digest);
    req.onsuccess = function (e) {
      attObj.body = e.target.result.body;
      checkDone();
    };
  }

  attachments.forEach(function (att) {
    if (opts.attachments && opts.include_docs) {
      fetchAttachment(doc, att);
    } else {
      doc._attachments[att].stub = true;
      checkDone();
    }
  });
}

// IDB-specific postprocessing necessary because
// we don't know whether we stored a true Blob or
// a base64-encoded string, and if it's a Blob it
// needs to be read outside of the transaction context
function postProcessAttachments(results, asBlob) {
  return Promise.all(results.map(function (row) {
    if (row.doc && row.doc._attachments) {
      var attNames = Object.keys(row.doc._attachments);
      return Promise.all(attNames.map(function (att) {
        var attObj = row.doc._attachments[att];
        if (!('body' in attObj)) { // already processed
          return;
        }
        var body = attObj.body;
        var type = attObj.content_type;
        return new Promise(function (resolve) {
          readBlobData(body, type, asBlob, function (data) {
            row.doc._attachments[att] = $inject_Object_assign(
              pick(attObj, ['digest', 'content_type']),
              {data: data}
            );
            resolve();
          });
        });
      }));
    }
  }));
}

function compactRevs(revs, docId, txn) {

  var possiblyOrphanedDigests = [];
  var seqStore = txn.objectStore(BY_SEQ_STORE);
  var attStore = txn.objectStore(ATTACH_STORE);
  var attAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);
  var count = revs.length;

  function checkDone() {
    count--;
    if (!count) { // done processing all revs
      deleteOrphanedAttachments();
    }
  }

  function deleteOrphanedAttachments() {
    if (!possiblyOrphanedDigests.length) {
      return;
    }
    possiblyOrphanedDigests.forEach(function (digest) {
      var countReq = attAndSeqStore.index('digestSeq').count(
        IDBKeyRange.bound(
          digest + '::', digest + '::\uffff', false, false));
      countReq.onsuccess = function (e) {
        var count = e.target.result;
        if (!count) {
          // orphaned
          attStore.delete(digest);
        }
      };
    });
  }

  revs.forEach(function (rev$$1) {
    var index = seqStore.index('_doc_id_rev');
    var key = docId + "::" + rev$$1;
    index.getKey(key).onsuccess = function (e) {
      var seq = e.target.result;
      if (typeof seq !== 'number') {
        return checkDone();
      }
      seqStore.delete(seq);

      var cursor = attAndSeqStore.index('seq')
        .openCursor(IDBKeyRange.only(seq));

      cursor.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          var digest = cursor.value.digestSeq.split('::')[0];
          possiblyOrphanedDigests.push(digest);
          attAndSeqStore.delete(cursor.primaryKey);
          cursor.continue();
        } else { // done
          checkDone();
        }
      };
    };
  });
}

function openTransactionSafely(idb, stores, mode) {
  try {
    return {
      txn: idb.transaction(stores, mode)
    };
  } catch (err) {
    return {
      error: err
    };
  }
}

var changesHandler = new Changes();

function idbBulkDocs(dbOpts, req, opts, api, idb, callback) {
  var docInfos = req.docs;
  var txn;
  var docStore;
  var bySeqStore;
  var attachStore;
  var attachAndSeqStore;
  var metaStore;
  var docInfoError;
  var metaDoc;

  for (var i = 0, len = docInfos.length; i < len; i++) {
    var doc = docInfos[i];
    if (doc._id && isLocalId(doc._id)) {
      continue;
    }
    doc = docInfos[i] = parseDoc(doc, opts.new_edits, dbOpts);
    if (doc.error && !docInfoError) {
      docInfoError = doc;
    }
  }

  if (docInfoError) {
    return callback(docInfoError);
  }

  var allDocsProcessed = false;
  var docCountDelta = 0;
  var results = new Array(docInfos.length);
  var fetchedDocs = new ExportedMap();
  var preconditionErrored = false;
  var blobType = api._meta.blobSupport ? 'blob' : 'base64';

  preprocessAttachments(docInfos, blobType, function (err) {
    if (err) {
      return callback(err);
    }
    startTransaction();
  });

  function startTransaction() {

    var stores = [
      DOC_STORE, BY_SEQ_STORE,
      ATTACH_STORE,
      LOCAL_STORE, ATTACH_AND_SEQ_STORE,
      META_STORE
    ];
    var txnResult = openTransactionSafely(idb, stores, 'readwrite');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    txn = txnResult.txn;
    txn.onabort = idbError(callback);
    txn.ontimeout = idbError(callback);
    txn.oncomplete = complete;
    docStore = txn.objectStore(DOC_STORE);
    bySeqStore = txn.objectStore(BY_SEQ_STORE);
    attachStore = txn.objectStore(ATTACH_STORE);
    attachAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);
    metaStore = txn.objectStore(META_STORE);

    metaStore.get(META_STORE).onsuccess = function (e) {
      metaDoc = e.target.result;
      updateDocCountIfReady();
    };

    verifyAttachments(function (err) {
      if (err) {
        preconditionErrored = true;
        return callback(err);
      }
      fetchExistingDocs();
    });
  }

  function onAllDocsProcessed() {
    allDocsProcessed = true;
    updateDocCountIfReady();
  }

  function idbProcessDocs() {
    processDocs(dbOpts.revs_limit, docInfos, api, fetchedDocs,
                txn, results, writeDoc, opts, onAllDocsProcessed);
  }

  function updateDocCountIfReady() {
    if (!metaDoc || !allDocsProcessed) {
      return;
    }
    // caching the docCount saves a lot of time in allDocs() and
    // info(), which is why we go to all the trouble of doing this
    metaDoc.docCount += docCountDelta;
    metaStore.put(metaDoc);
  }

  function fetchExistingDocs() {

    if (!docInfos.length) {
      return;
    }

    var numFetched = 0;

    function checkDone() {
      if (++numFetched === docInfos.length) {
        idbProcessDocs();
      }
    }

    function readMetadata(event) {
      var metadata = decodeMetadata(event.target.result);

      if (metadata) {
        fetchedDocs.set(metadata.id, metadata);
      }
      checkDone();
    }

    for (var i = 0, len = docInfos.length; i < len; i++) {
      var docInfo = docInfos[i];
      if (docInfo._id && isLocalId(docInfo._id)) {
        checkDone(); // skip local docs
        continue;
      }
      var req = docStore.get(docInfo.metadata.id);
      req.onsuccess = readMetadata;
    }
  }

  function complete() {
    if (preconditionErrored) {
      return;
    }

    changesHandler.notify(api._meta.name);
    callback(null, results);
  }

  function verifyAttachment(digest, callback) {

    var req = attachStore.get(digest);
    req.onsuccess = function (e) {
      if (!e.target.result) {
        var err = createError(MISSING_STUB,
          'unknown stub attachment with digest ' +
          digest);
        err.status = 412;
        callback(err);
      } else {
        callback();
      }
    };
  }

  function verifyAttachments(finish) {


    var digests = [];
    docInfos.forEach(function (docInfo) {
      if (docInfo.data && docInfo.data._attachments) {
        Object.keys(docInfo.data._attachments).forEach(function (filename) {
          var att = docInfo.data._attachments[filename];
          if (att.stub) {
            digests.push(att.digest);
          }
        });
      }
    });
    if (!digests.length) {
      return finish();
    }
    var numDone = 0;
    var err;

    function checkDone() {
      if (++numDone === digests.length) {
        finish(err);
      }
    }
    digests.forEach(function (digest) {
      verifyAttachment(digest, function (attErr) {
        if (attErr && !err) {
          err = attErr;
        }
        checkDone();
      });
    });
  }

  function writeDoc(docInfo, winningRev$$1, winningRevIsDeleted, newRevIsDeleted,
                    isUpdate, delta, resultsIdx, callback) {

    docInfo.metadata.winningRev = winningRev$$1;
    docInfo.metadata.deleted = winningRevIsDeleted;

    var doc = docInfo.data;
    doc._id = docInfo.metadata.id;
    doc._rev = docInfo.metadata.rev;

    if (newRevIsDeleted) {
      doc._deleted = true;
    }

    var hasAttachments = doc._attachments &&
      Object.keys(doc._attachments).length;
    if (hasAttachments) {
      return writeAttachments(docInfo, winningRev$$1, winningRevIsDeleted,
        isUpdate, resultsIdx, callback);
    }

    docCountDelta += delta;
    updateDocCountIfReady();

    finishDoc(docInfo, winningRev$$1, winningRevIsDeleted,
      isUpdate, resultsIdx, callback);
  }

  function finishDoc(docInfo, winningRev$$1, winningRevIsDeleted,
                     isUpdate, resultsIdx, callback) {

    var doc = docInfo.data;
    var metadata = docInfo.metadata;

    doc._doc_id_rev = metadata.id + '::' + metadata.rev;
    delete doc._id;
    delete doc._rev;

    function afterPutDoc(e) {
      var revsToDelete = docInfo.stemmedRevs || [];

      if (isUpdate && api.auto_compaction) {
        revsToDelete = revsToDelete.concat(compactTree(docInfo.metadata));
      }

      if (revsToDelete && revsToDelete.length) {
        compactRevs(revsToDelete, docInfo.metadata.id, txn);
      }

      metadata.seq = e.target.result;
      // Current _rev is calculated from _rev_tree on read
      // delete metadata.rev;
      var metadataToStore = encodeMetadata(metadata, winningRev$$1,
        winningRevIsDeleted);
      var metaDataReq = docStore.put(metadataToStore);
      metaDataReq.onsuccess = afterPutMetadata;
    }

    function afterPutDocError(e) {
      // ConstraintError, need to update, not put (see #1638 for details)
      e.preventDefault(); // avoid transaction abort
      e.stopPropagation(); // avoid transaction onerror
      var index = bySeqStore.index('_doc_id_rev');
      var getKeyReq = index.getKey(doc._doc_id_rev);
      getKeyReq.onsuccess = function (e) {
        var putReq = bySeqStore.put(doc, e.target.result);
        putReq.onsuccess = afterPutDoc;
      };
    }

    function afterPutMetadata() {
      results[resultsIdx] = {
        ok: true,
        id: metadata.id,
        rev: metadata.rev
      };
      fetchedDocs.set(docInfo.metadata.id, docInfo.metadata);
      insertAttachmentMappings(docInfo, metadata.seq, callback);
    }

    var putReq = bySeqStore.put(doc);

    putReq.onsuccess = afterPutDoc;
    putReq.onerror = afterPutDocError;
  }

  function writeAttachments(docInfo, winningRev$$1, winningRevIsDeleted,
                            isUpdate, resultsIdx, callback) {


    var doc = docInfo.data;

    var numDone = 0;
    var attachments = Object.keys(doc._attachments);

    function collectResults() {
      if (numDone === attachments.length) {
        finishDoc(docInfo, winningRev$$1, winningRevIsDeleted,
          isUpdate, resultsIdx, callback);
      }
    }

    function attachmentSaved() {
      numDone++;
      collectResults();
    }

    attachments.forEach(function (key) {
      var att = docInfo.data._attachments[key];
      if (!att.stub) {
        var data = att.data;
        delete att.data;
        att.revpos = parseInt(winningRev$$1, 10);
        var digest = att.digest;
        saveAttachment(digest, data, attachmentSaved);
      } else {
        numDone++;
        collectResults();
      }
    });
  }

  // map seqs to attachment digests, which
  // we will need later during compaction
  function insertAttachmentMappings(docInfo, seq, callback) {

    var attsAdded = 0;
    var attsToAdd = Object.keys(docInfo.data._attachments || {});

    if (!attsToAdd.length) {
      return callback();
    }

    function checkDone() {
      if (++attsAdded === attsToAdd.length) {
        callback();
      }
    }

    function add(att) {
      var digest = docInfo.data._attachments[att].digest;
      var req = attachAndSeqStore.put({
        seq: seq,
        digestSeq: digest + '::' + seq
      });

      req.onsuccess = checkDone;
      req.onerror = function (e) {
        // this callback is for a constaint error, which we ignore
        // because this docid/rev has already been associated with
        // the digest (e.g. when new_edits == false)
        e.preventDefault(); // avoid transaction abort
        e.stopPropagation(); // avoid transaction onerror
        checkDone();
      };
    }
    for (var i = 0; i < attsToAdd.length; i++) {
      add(attsToAdd[i]); // do in parallel
    }
  }

  function saveAttachment(digest, data, callback) {


    var getKeyReq = attachStore.count(digest);
    getKeyReq.onsuccess = function (e) {
      var count = e.target.result;
      if (count) {
        return callback(); // already exists
      }
      var newAtt = {
        digest: digest,
        body: data
      };
      var putReq = attachStore.put(newAtt);
      putReq.onsuccess = callback;
    };
  }
}

// Abstraction over IDBCursor and getAll()/getAllKeys() that allows us to batch our operations
// while falling back to a normal IDBCursor operation on browsers that don't support getAll() or
// getAllKeys(). This allows for a much faster implementation than just straight-up cursors, because
// we're not processing each document one-at-a-time.
function runBatchedCursor(objectStore, keyRange, descending, batchSize, onBatch) {

  if (batchSize === -1) {
    batchSize = 1000;
  }

  // Bail out of getAll()/getAllKeys() in the following cases:
  // 1) either method is unsupported - we need both
  // 2) batchSize is 1 (might as well use IDBCursor)
  // 3) descending – no real way to do this via getAll()/getAllKeys()

  var useGetAll = typeof objectStore.getAll === 'function' &&
    typeof objectStore.getAllKeys === 'function' &&
    batchSize > 1 && !descending;

  var keysBatch;
  var valuesBatch;
  var pseudoCursor;

  function onGetAll(e) {
    valuesBatch = e.target.result;
    if (keysBatch) {
      onBatch(keysBatch, valuesBatch, pseudoCursor);
    }
  }

  function onGetAllKeys(e) {
    keysBatch = e.target.result;
    if (valuesBatch) {
      onBatch(keysBatch, valuesBatch, pseudoCursor);
    }
  }

  function continuePseudoCursor() {
    if (!keysBatch.length) { // no more results
      return onBatch();
    }
    // fetch next batch, exclusive start
    var lastKey = keysBatch[keysBatch.length - 1];
    var newKeyRange;
    if (keyRange && keyRange.upper) {
      try {
        newKeyRange = IDBKeyRange.bound(lastKey, keyRange.upper,
          true, keyRange.upperOpen);
      } catch (e) {
        if (e.name === "DataError" && e.code === 0) {
          return onBatch(); // we're done, startkey and endkey are equal
        }
      }
    } else {
      newKeyRange = IDBKeyRange.lowerBound(lastKey, true);
    }
    keyRange = newKeyRange;
    keysBatch = null;
    valuesBatch = null;
    objectStore.getAll(keyRange, batchSize).onsuccess = onGetAll;
    objectStore.getAllKeys(keyRange, batchSize).onsuccess = onGetAllKeys;
  }

  function onCursor(e) {
    var cursor = e.target.result;
    if (!cursor) { // done
      return onBatch();
    }
    // regular IDBCursor acts like a batch where batch size is always 1
    onBatch([cursor.key], [cursor.value], cursor);
  }

  if (useGetAll) {
    pseudoCursor = {"continue": continuePseudoCursor};
    objectStore.getAll(keyRange, batchSize).onsuccess = onGetAll;
    objectStore.getAllKeys(keyRange, batchSize).onsuccess = onGetAllKeys;
  } else if (descending) {
    objectStore.openCursor(keyRange, 'prev').onsuccess = onCursor;
  } else {
    objectStore.openCursor(keyRange).onsuccess = onCursor;
  }
}

// simple shim for objectStore.getAll(), falling back to IDBCursor
function getAll(objectStore, keyRange, onSuccess) {
  if (typeof objectStore.getAll === 'function') {
    // use native getAll
    objectStore.getAll(keyRange).onsuccess = onSuccess;
    return;
  }
  // fall back to cursors
  var values = [];

  function onCursor(e) {
    var cursor = e.target.result;
    if (cursor) {
      values.push(cursor.value);
      cursor.continue();
    } else {
      onSuccess({
        target: {
          result: values
        }
      });
    }
  }

  objectStore.openCursor(keyRange).onsuccess = onCursor;
}

function allDocsKeys(keys, docStore, onBatch) {
  // It's not guaranted to be returned in right order  
  var valuesBatch = new Array(keys.length);
  var count = 0;
  keys.forEach(function (key, index) {
    docStore.get(key).onsuccess = function (event) {
      if (event.target.result) {
        valuesBatch[index] = event.target.result;
      } else {
        valuesBatch[index] = {key: key, error: 'not_found'};
      }
      count++;
      if (count === keys.length) {
        onBatch(keys, valuesBatch, {});
      }
    };
  });
}

function createKeyRange(start, end, inclusiveEnd, key, descending) {
  try {
    if (start && end) {
      if (descending) {
        return IDBKeyRange.bound(end, start, !inclusiveEnd, false);
      } else {
        return IDBKeyRange.bound(start, end, false, !inclusiveEnd);
      }
    } else if (start) {
      if (descending) {
        return IDBKeyRange.upperBound(start);
      } else {
        return IDBKeyRange.lowerBound(start);
      }
    } else if (end) {
      if (descending) {
        return IDBKeyRange.lowerBound(end, !inclusiveEnd);
      } else {
        return IDBKeyRange.upperBound(end, !inclusiveEnd);
      }
    } else if (key) {
      return IDBKeyRange.only(key);
    }
  } catch (e) {
    return {error: e};
  }
  return null;
}

function idbAllDocs(opts, idb, callback) {
  var start = 'startkey' in opts ? opts.startkey : false;
  var end = 'endkey' in opts ? opts.endkey : false;
  var key = 'key' in opts ? opts.key : false;
  var keys = 'keys' in opts ? opts.keys : false; 
  var skip = opts.skip || 0;
  var limit = typeof opts.limit === 'number' ? opts.limit : -1;
  var inclusiveEnd = opts.inclusive_end !== false;

  var keyRange ; 
  var keyRangeError;
  if (!keys) {
    keyRange = createKeyRange(start, end, inclusiveEnd, key, opts.descending);
    keyRangeError = keyRange && keyRange.error;
    if (keyRangeError && 
      !(keyRangeError.name === "DataError" && keyRangeError.code === 0)) {
      // DataError with error code 0 indicates start is less than end, so
      // can just do an empty query. Else need to throw
      return callback(createError(IDB_ERROR,
        keyRangeError.name, keyRangeError.message));
    }
  }

  var stores = [DOC_STORE, BY_SEQ_STORE, META_STORE];

  if (opts.attachments) {
    stores.push(ATTACH_STORE);
  }
  var txnResult = openTransactionSafely(idb, stores, 'readonly');
  if (txnResult.error) {
    return callback(txnResult.error);
  }
  var txn = txnResult.txn;
  txn.oncomplete = onTxnComplete;
  txn.onabort = idbError(callback);
  var docStore = txn.objectStore(DOC_STORE);
  var seqStore = txn.objectStore(BY_SEQ_STORE);
  var metaStore = txn.objectStore(META_STORE);
  var docIdRevIndex = seqStore.index('_doc_id_rev');
  var results = [];
  var docCount;
  var updateSeq;

  metaStore.get(META_STORE).onsuccess = function (e) {
    docCount = e.target.result.docCount;
  };

  /* istanbul ignore if */
  if (opts.update_seq) {
    getMaxUpdateSeq(seqStore, function (e) { 
      if (e.target.result && e.target.result.length > 0) {
        updateSeq = e.target.result[0];
      }
    });
  }

  function getMaxUpdateSeq(objectStore, onSuccess) {
    function onCursor(e) {
      var cursor = e.target.result;
      var maxKey = undefined;
      if (cursor && cursor.key) {
        maxKey = cursor.key;
      } 
      return onSuccess({
        target: {
          result: [maxKey]
        }
      });
    }
    objectStore.openCursor(null, 'prev').onsuccess = onCursor;
  }

  // if the user specifies include_docs=true, then we don't
  // want to block the main cursor while we're fetching the doc
  function fetchDocAsynchronously(metadata, row, winningRev$$1) {
    var key = metadata.id + "::" + winningRev$$1;
    docIdRevIndex.get(key).onsuccess =  function onGetDoc(e) {
      row.doc = decodeDoc(e.target.result) || {};
      if (opts.conflicts) {
        var conflicts = collectConflicts(metadata);
        if (conflicts.length) {
          row.doc._conflicts = conflicts;
        }
      }
      fetchAttachmentsIfNecessary(row.doc, opts, txn);
    };
  }

  function allDocsInner(winningRev$$1, metadata) {
    var row = {
      id: metadata.id,
      key: metadata.id,
      value: {
        rev: winningRev$$1
      }
    };
    var deleted = metadata.deleted;
    if (deleted) {
      if (keys) {
        results.push(row);
        // deleted docs are okay with "keys" requests
        row.value.deleted = true;
        row.doc = null;
      }
    } else if (skip-- <= 0) {
      results.push(row);
      if (opts.include_docs) {
        fetchDocAsynchronously(metadata, row, winningRev$$1);
      }
    }
  }

  function processBatch(batchValues) {
    for (var i = 0, len = batchValues.length; i < len; i++) {
      if (results.length === limit) {
        break;
      }
      var batchValue = batchValues[i];
      if (batchValue.error && keys) {
        // key was not found with "keys" requests
        results.push(batchValue);
        continue;
      }
      var metadata = decodeMetadata(batchValue);
      var winningRev$$1 = metadata.winningRev;
      allDocsInner(winningRev$$1, metadata);
    }
  }

  function onBatch(batchKeys, batchValues, cursor) {
    if (!cursor) {
      return;
    }
    processBatch(batchValues);
    if (results.length < limit) {
      cursor.continue();
    }
  }

  function onGetAll(e) {
    var values = e.target.result;
    if (opts.descending) {
      values = values.reverse();
    }
    processBatch(values);
  }

  function onResultsReady() {
    var returnVal = {
      total_rows: docCount,
      offset: opts.skip,
      rows: results
    };
    
    /* istanbul ignore if */
    if (opts.update_seq && updateSeq !== undefined) {
      returnVal.update_seq = updateSeq;
    }
    callback(null, returnVal);
  }

  function onTxnComplete() {
    if (opts.attachments) {
      postProcessAttachments(results, opts.binary).then(onResultsReady);
    } else {
      onResultsReady();
    }
  }

  // don't bother doing any requests if start > end or limit === 0
  if (keyRangeError || limit === 0) {
    return;
  }
  if (keys) {
    return allDocsKeys(opts.keys, docStore, onBatch);
  }
  if (limit === -1) { // just fetch everything
    return getAll(docStore, keyRange, onGetAll);
  }
  // else do a cursor
  // choose a batch size based on the skip, since we'll need to skip that many
  runBatchedCursor(docStore, keyRange, opts.descending, limit + skip, onBatch);
}

//
// Blobs are not supported in all versions of IndexedDB, notably
// Chrome <37 and Android <5. In those versions, storing a blob will throw.
//
// Various other blob bugs exist in Chrome v37-42 (inclusive).
// Detecting them is expensive and confusing to users, and Chrome 37-42
// is at very low usage worldwide, so we do a hacky userAgent check instead.
//
// content-type bug: https://code.google.com/p/chromium/issues/detail?id=408120
// 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
// FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
//
function checkBlobSupport(txn) {
  return new Promise(function (resolve) {
    var blob$$1 = createBlob(['']);
    var req = txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob$$1, 'key');

    req.onsuccess = function () {
      var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
      var matchedEdge = navigator.userAgent.match(/Edge\//);
      // MS Edge pretends to be Chrome 42:
      // https://msdn.microsoft.com/en-us/library/hh869301%28v=vs.85%29.aspx
      resolve(matchedEdge || !matchedChrome ||
        parseInt(matchedChrome[1], 10) >= 43);
    };

    req.onerror = txn.onabort = function (e) {
      // If the transaction aborts now its due to not being able to
      // write to the database, likely due to the disk being full
      e.preventDefault();
      e.stopPropagation();
      resolve(false);
    };
  }).catch(function () {
    return false; // error, so assume unsupported
  });
}

function countDocs(txn, cb) {
  var index = txn.objectStore(DOC_STORE).index('deletedOrLocal');
  index.count(IDBKeyRange.only('0')).onsuccess = function (e) {
    cb(e.target.result);
  };
}

// This task queue ensures that IDB open calls are done in their own tick

var running = false;
var queue = [];

function tryCode(fun, err, res, PouchDB) {
  try {
    fun(err, res);
  } catch (err) {
    // Shouldn't happen, but in some odd cases
    // IndexedDB implementations might throw a sync
    // error, in which case this will at least log it.
    PouchDB.emit('error', err);
  }
}

function applyNext() {
  if (running || !queue.length) {
    return;
  }
  running = true;
  queue.shift()();
}

function enqueueTask(action, callback, PouchDB) {
  queue.push(function runAction() {
    action(function runCallback(err, res) {
      tryCode(callback, err, res, PouchDB);
      running = false;
      immediate(function runNext() {
        applyNext(PouchDB);
      });
    });
  });
  applyNext();
}

function changes(opts, api, dbName, idb) {
  opts = clone(opts);

  if (opts.continuous) {
    var id = dbName + ':' + uuid();
    changesHandler.addListener(dbName, id, api, opts);
    changesHandler.notify(dbName);
    return {
      cancel: function () {
        changesHandler.removeListener(dbName, id);
      }
    };
  }

  var docIds = opts.doc_ids && new ExportedSet(opts.doc_ids);

  opts.since = opts.since || 0;
  var lastSeq = opts.since;

  var limit = 'limit' in opts ? opts.limit : -1;
  if (limit === 0) {
    limit = 1; // per CouchDB _changes spec
  }

  var results = [];
  var numResults = 0;
  var filter = filterChange(opts);
  var docIdsToMetadata = new ExportedMap();

  var txn;
  var bySeqStore;
  var docStore;
  var docIdRevIndex;

  function onBatch(batchKeys, batchValues, cursor) {
    if (!cursor || !batchKeys.length) { // done
      return;
    }

    var winningDocs = new Array(batchKeys.length);
    var metadatas = new Array(batchKeys.length);

    function processMetadataAndWinningDoc(metadata, winningDoc) {
      var change = opts.processChange(winningDoc, metadata, opts);
      lastSeq = change.seq = metadata.seq;

      var filtered = filter(change);
      if (typeof filtered === 'object') { // anything but true/false indicates error
        return Promise.reject(filtered);
      }

      if (!filtered) {
        return Promise.resolve();
      }
      numResults++;
      if (opts.return_docs) {
        results.push(change);
      }
      // process the attachment immediately
      // for the benefit of live listeners
      if (opts.attachments && opts.include_docs) {
        return new Promise(function (resolve) {
          fetchAttachmentsIfNecessary(winningDoc, opts, txn, function () {
            postProcessAttachments([change], opts.binary).then(function () {
              resolve(change);
            });
          });
        });
      } else {
        return Promise.resolve(change);
      }
    }

    function onBatchDone() {
      var promises = [];
      for (var i = 0, len = winningDocs.length; i < len; i++) {
        if (numResults === limit) {
          break;
        }
        var winningDoc = winningDocs[i];
        if (!winningDoc) {
          continue;
        }
        var metadata = metadatas[i];
        promises.push(processMetadataAndWinningDoc(metadata, winningDoc));
      }

      Promise.all(promises).then(function (changes) {
        for (var i = 0, len = changes.length; i < len; i++) {
          if (changes[i]) {
            opts.onChange(changes[i]);
          }
        }
      }).catch(opts.complete);

      if (numResults !== limit) {
        cursor.continue();
      }
    }

    // Fetch all metadatas/winningdocs from this batch in parallel, then process
    // them all only once all data has been collected. This is done in parallel
    // because it's faster than doing it one-at-a-time.
    var numDone = 0;
    batchValues.forEach(function (value, i) {
      var doc = decodeDoc(value);
      var seq = batchKeys[i];
      fetchWinningDocAndMetadata(doc, seq, function (metadata, winningDoc) {
        metadatas[i] = metadata;
        winningDocs[i] = winningDoc;
        if (++numDone === batchKeys.length) {
          onBatchDone();
        }
      });
    });
  }

  function onGetMetadata(doc, seq, metadata, cb) {
    if (metadata.seq !== seq) {
      // some other seq is later
      return cb();
    }

    if (metadata.winningRev === doc._rev) {
      // this is the winning doc
      return cb(metadata, doc);
    }

    // fetch winning doc in separate request
    var docIdRev = doc._id + '::' + metadata.winningRev;
    var req = docIdRevIndex.get(docIdRev);
    req.onsuccess = function (e) {
      cb(metadata, decodeDoc(e.target.result));
    };
  }

  function fetchWinningDocAndMetadata(doc, seq, cb) {
    if (docIds && !docIds.has(doc._id)) {
      return cb();
    }

    var metadata = docIdsToMetadata.get(doc._id);
    if (metadata) { // cached
      return onGetMetadata(doc, seq, metadata, cb);
    }
    // metadata not cached, have to go fetch it
    docStore.get(doc._id).onsuccess = function (e) {
      metadata = decodeMetadata(e.target.result);
      docIdsToMetadata.set(doc._id, metadata);
      onGetMetadata(doc, seq, metadata, cb);
    };
  }

  function finish() {
    opts.complete(null, {
      results: results,
      last_seq: lastSeq
    });
  }

  function onTxnComplete() {
    if (!opts.continuous && opts.attachments) {
      // cannot guarantee that postProcessing was already done,
      // so do it again
      postProcessAttachments(results).then(finish);
    } else {
      finish();
    }
  }

  var objectStores = [DOC_STORE, BY_SEQ_STORE];
  if (opts.attachments) {
    objectStores.push(ATTACH_STORE);
  }
  var txnResult = openTransactionSafely(idb, objectStores, 'readonly');
  if (txnResult.error) {
    return opts.complete(txnResult.error);
  }
  txn = txnResult.txn;
  txn.onabort = idbError(opts.complete);
  txn.oncomplete = onTxnComplete;

  bySeqStore = txn.objectStore(BY_SEQ_STORE);
  docStore = txn.objectStore(DOC_STORE);
  docIdRevIndex = bySeqStore.index('_doc_id_rev');

  var keyRange = (opts.since && !opts.descending) ?
    IDBKeyRange.lowerBound(opts.since, true) : null;

  runBatchedCursor(bySeqStore, keyRange, opts.descending, limit, onBatch);
}

var cachedDBs = new ExportedMap();
var blobSupportPromise;
var openReqList = new ExportedMap();

function IdbPouch(opts, callback) {
  var api = this;

  enqueueTask(function (thisCallback) {
    init(api, opts, thisCallback);
  }, callback, api.constructor);
}

function init(api, opts, callback) {

  var dbName = opts.name;

  var idb = null;
  api._meta = null;

  // called when creating a fresh new database
  function createSchema(db) {
    var docStore = db.createObjectStore(DOC_STORE, {keyPath : 'id'});
    db.createObjectStore(BY_SEQ_STORE, {autoIncrement: true})
      .createIndex('_doc_id_rev', '_doc_id_rev', {unique: true});
    db.createObjectStore(ATTACH_STORE, {keyPath: 'digest'});
    db.createObjectStore(META_STORE, {keyPath: 'id', autoIncrement: false});
    db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);

    // added in v2
    docStore.createIndex('deletedOrLocal', 'deletedOrLocal', {unique : false});

    // added in v3
    db.createObjectStore(LOCAL_STORE, {keyPath: '_id'});

    // added in v4
    var attAndSeqStore = db.createObjectStore(ATTACH_AND_SEQ_STORE,
      {autoIncrement: true});
    attAndSeqStore.createIndex('seq', 'seq');
    attAndSeqStore.createIndex('digestSeq', 'digestSeq', {unique: true});
  }

  // migration to version 2
  // unfortunately "deletedOrLocal" is a misnomer now that we no longer
  // store local docs in the main doc-store, but whaddyagonnado
  function addDeletedOrLocalIndex(txn, callback) {
    var docStore = txn.objectStore(DOC_STORE);
    docStore.createIndex('deletedOrLocal', 'deletedOrLocal', {unique : false});

    docStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        var metadata = cursor.value;
        var deleted = isDeleted(metadata);
        metadata.deletedOrLocal = deleted ? "1" : "0";
        docStore.put(metadata);
        cursor.continue();
      } else {
        callback();
      }
    };
  }

  // migration to version 3 (part 1)
  function createLocalStoreSchema(db) {
    db.createObjectStore(LOCAL_STORE, {keyPath: '_id'})
      .createIndex('_doc_id_rev', '_doc_id_rev', {unique: true});
  }

  // migration to version 3 (part 2)
  function migrateLocalStore(txn, cb) {
    var localStore = txn.objectStore(LOCAL_STORE);
    var docStore = txn.objectStore(DOC_STORE);
    var seqStore = txn.objectStore(BY_SEQ_STORE);

    var cursor = docStore.openCursor();
    cursor.onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        var metadata = cursor.value;
        var docId = metadata.id;
        var local = isLocalId(docId);
        var rev$$1 = winningRev(metadata);
        if (local) {
          var docIdRev = docId + "::" + rev$$1;
          // remove all seq entries
          // associated with this docId
          var start = docId + "::";
          var end = docId + "::~";
          var index = seqStore.index('_doc_id_rev');
          var range = IDBKeyRange.bound(start, end, false, false);
          var seqCursor = index.openCursor(range);
          seqCursor.onsuccess = function (e) {
            seqCursor = e.target.result;
            if (!seqCursor) {
              // done
              docStore.delete(cursor.primaryKey);
              cursor.continue();
            } else {
              var data = seqCursor.value;
              if (data._doc_id_rev === docIdRev) {
                localStore.put(data);
              }
              seqStore.delete(seqCursor.primaryKey);
              seqCursor.continue();
            }
          };
        } else {
          cursor.continue();
        }
      } else if (cb) {
        cb();
      }
    };
  }

  // migration to version 4 (part 1)
  function addAttachAndSeqStore(db) {
    var attAndSeqStore = db.createObjectStore(ATTACH_AND_SEQ_STORE,
      {autoIncrement: true});
    attAndSeqStore.createIndex('seq', 'seq');
    attAndSeqStore.createIndex('digestSeq', 'digestSeq', {unique: true});
  }

  // migration to version 4 (part 2)
  function migrateAttsAndSeqs(txn, callback) {
    var seqStore = txn.objectStore(BY_SEQ_STORE);
    var attStore = txn.objectStore(ATTACH_STORE);
    var attAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);

    // need to actually populate the table. this is the expensive part,
    // so as an optimization, check first that this database even
    // contains attachments
    var req = attStore.count();
    req.onsuccess = function (e) {
      var count = e.target.result;
      if (!count) {
        return callback(); // done
      }

      seqStore.openCursor().onsuccess = function (e) {
        var cursor = e.target.result;
        if (!cursor) {
          return callback(); // done
        }
        var doc = cursor.value;
        var seq = cursor.primaryKey;
        var atts = Object.keys(doc._attachments || {});
        var digestMap = {};
        for (var j = 0; j < atts.length; j++) {
          var att = doc._attachments[atts[j]];
          digestMap[att.digest] = true; // uniq digests, just in case
        }
        var digests = Object.keys(digestMap);
        for (j = 0; j < digests.length; j++) {
          var digest = digests[j];
          attAndSeqStore.put({
            seq: seq,
            digestSeq: digest + '::' + seq
          });
        }
        cursor.continue();
      };
    };
  }

  // migration to version 5
  // Instead of relying on on-the-fly migration of metadata,
  // this brings the doc-store to its modern form:
  // - metadata.winningrev
  // - metadata.seq
  // - stringify the metadata when storing it
  function migrateMetadata(txn) {

    function decodeMetadataCompat(storedObject) {
      if (!storedObject.data) {
        // old format, when we didn't store it stringified
        storedObject.deleted = storedObject.deletedOrLocal === '1';
        return storedObject;
      }
      return decodeMetadata(storedObject);
    }

    // ensure that every metadata has a winningRev and seq,
    // which was previously created on-the-fly but better to migrate
    var bySeqStore = txn.objectStore(BY_SEQ_STORE);
    var docStore = txn.objectStore(DOC_STORE);
    var cursor = docStore.openCursor();
    cursor.onsuccess = function (e) {
      var cursor = e.target.result;
      if (!cursor) {
        return; // done
      }
      var metadata = decodeMetadataCompat(cursor.value);

      metadata.winningRev = metadata.winningRev ||
        winningRev(metadata);

      function fetchMetadataSeq() {
        // metadata.seq was added post-3.2.0, so if it's missing,
        // we need to fetch it manually
        var start = metadata.id + '::';
        var end = metadata.id + '::\uffff';
        var req = bySeqStore.index('_doc_id_rev').openCursor(
          IDBKeyRange.bound(start, end));

        var metadataSeq = 0;
        req.onsuccess = function (e) {
          var cursor = e.target.result;
          if (!cursor) {
            metadata.seq = metadataSeq;
            return onGetMetadataSeq();
          }
          var seq = cursor.primaryKey;
          if (seq > metadataSeq) {
            metadataSeq = seq;
          }
          cursor.continue();
        };
      }

      function onGetMetadataSeq() {
        var metadataToStore = encodeMetadata(metadata,
          metadata.winningRev, metadata.deleted);

        var req = docStore.put(metadataToStore);
        req.onsuccess = function () {
          cursor.continue();
        };
      }

      if (metadata.seq) {
        return onGetMetadataSeq();
      }

      fetchMetadataSeq();
    };

  }

  api._remote = false;
  api.type = function () {
    return 'idb';
  };

  api._id = toPromise(function (callback) {
    callback(null, api._meta.instanceId);
  });

  api._bulkDocs = function idb_bulkDocs(req, reqOpts, callback) {
    idbBulkDocs(opts, req, reqOpts, api, idb, callback);
  };

  // First we look up the metadata in the ids database, then we fetch the
  // current revision(s) from the by sequence store
  api._get = function idb_get(id, opts, callback) {
    var doc;
    var metadata;
    var err;
    var txn = opts.ctx;
    if (!txn) {
      var txnResult = openTransactionSafely(idb,
        [DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      txn = txnResult.txn;
    }

    function finish() {
      callback(err, {doc: doc, metadata: metadata, ctx: txn});
    }

    txn.objectStore(DOC_STORE).get(id).onsuccess = function (e) {
      metadata = decodeMetadata(e.target.result);
      // we can determine the result here if:
      // 1. there is no such document
      // 2. the document is deleted and we don't ask about specific rev
      // When we ask with opts.rev we expect the answer to be either
      // doc (possibly with _deleted=true) or missing error
      if (!metadata) {
        err = createError(MISSING_DOC, 'missing');
        return finish();
      }

      var rev$$1;
      if (!opts.rev) {
        rev$$1 = metadata.winningRev;
        var deleted = isDeleted(metadata);
        if (deleted) {
          err = createError(MISSING_DOC, "deleted");
          return finish();
        }
      } else {
        rev$$1 = opts.latest ? latest(opts.rev, metadata) : opts.rev;
      }

      var objectStore = txn.objectStore(BY_SEQ_STORE);
      var key = metadata.id + '::' + rev$$1;

      objectStore.index('_doc_id_rev').get(key).onsuccess = function (e) {
        doc = e.target.result;
        if (doc) {
          doc = decodeDoc(doc);
        }
        if (!doc) {
          err = createError(MISSING_DOC, 'missing');
          return finish();
        }
        finish();
      };
    };
  };

  api._getAttachment = function (docId, attachId, attachment, opts, callback) {
    var txn;
    if (opts.ctx) {
      txn = opts.ctx;
    } else {
      var txnResult = openTransactionSafely(idb,
        [DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      txn = txnResult.txn;
    }
    var digest = attachment.digest;
    var type = attachment.content_type;

    txn.objectStore(ATTACH_STORE).get(digest).onsuccess = function (e) {
      var body = e.target.result.body;
      readBlobData(body, type, opts.binary, function (blobData) {
        callback(null, blobData);
      });
    };
  };

  api._info = function idb_info(callback) {
    var updateSeq;
    var docCount;

    var txnResult = openTransactionSafely(idb, [META_STORE, BY_SEQ_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var txn = txnResult.txn;
    txn.objectStore(META_STORE).get(META_STORE).onsuccess = function (e) {
      docCount = e.target.result.docCount;
    };
    txn.objectStore(BY_SEQ_STORE).openCursor(null, 'prev').onsuccess = function (e) {
      var cursor = e.target.result;
      updateSeq = cursor ? cursor.key : 0;
    };

    txn.oncomplete = function () {
      callback(null, {
        doc_count: docCount,
        update_seq: updateSeq,
        // for debugging
        idb_attachment_format: (api._meta.blobSupport ? 'binary' : 'base64')
      });
    };
  };

  api._allDocs = function idb_allDocs(opts, callback) {
    idbAllDocs(opts, idb, callback);
  };

  api._changes = function idbChanges(opts) {
    return changes(opts, api, dbName, idb);
  };

  api._close = function (callback) {
    // https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#close
    // "Returns immediately and closes the connection in a separate thread..."
    idb.close();
    cachedDBs.delete(dbName);
    callback();
  };

  api._getRevisionTree = function (docId, callback) {
    var txnResult = openTransactionSafely(idb, [DOC_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var txn = txnResult.txn;
    var req = txn.objectStore(DOC_STORE).get(docId);
    req.onsuccess = function (event) {
      var doc = decodeMetadata(event.target.result);
      if (!doc) {
        callback(createError(MISSING_DOC));
      } else {
        callback(null, doc.rev_tree);
      }
    };
  };

  // This function removes revisions of document docId
  // which are listed in revs and sets this document
  // revision to to rev_tree
  api._doCompaction = function (docId, revs, callback) {
    var stores = [
      DOC_STORE,
      BY_SEQ_STORE,
      ATTACH_STORE,
      ATTACH_AND_SEQ_STORE
    ];
    var txnResult = openTransactionSafely(idb, stores, 'readwrite');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var txn = txnResult.txn;

    var docStore = txn.objectStore(DOC_STORE);

    docStore.get(docId).onsuccess = function (event) {
      var metadata = decodeMetadata(event.target.result);
      traverseRevTree(metadata.rev_tree, function (isLeaf, pos,
                                                         revHash, ctx, opts) {
        var rev$$1 = pos + '-' + revHash;
        if (revs.indexOf(rev$$1) !== -1) {
          opts.status = 'missing';
        }
      });
      compactRevs(revs, docId, txn);
      var winningRev$$1 = metadata.winningRev;
      var deleted = metadata.deleted;
      txn.objectStore(DOC_STORE).put(
        encodeMetadata(metadata, winningRev$$1, deleted));
    };
    txn.onabort = idbError(callback);
    txn.oncomplete = function () {
      callback();
    };
  };


  api._getLocal = function (id, callback) {
    var txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var tx = txnResult.txn;
    var req = tx.objectStore(LOCAL_STORE).get(id);

    req.onerror = idbError(callback);
    req.onsuccess = function (e) {
      var doc = e.target.result;
      if (!doc) {
        callback(createError(MISSING_DOC));
      } else {
        delete doc['_doc_id_rev']; // for backwards compat
        callback(null, doc);
      }
    };
  };

  api._putLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    delete doc._revisions; // ignore this, trust the rev
    var oldRev = doc._rev;
    var id = doc._id;
    if (!oldRev) {
      doc._rev = '0-1';
    } else {
      doc._rev = '0-' + (parseInt(oldRev.split('-')[1], 10) + 1);
    }

    var tx = opts.ctx;
    var ret;
    if (!tx) {
      var txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readwrite');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      tx = txnResult.txn;
      tx.onerror = idbError(callback);
      tx.oncomplete = function () {
        if (ret) {
          callback(null, ret);
        }
      };
    }

    var oStore = tx.objectStore(LOCAL_STORE);
    var req;
    if (oldRev) {
      req = oStore.get(id);
      req.onsuccess = function (e) {
        var oldDoc = e.target.result;
        if (!oldDoc || oldDoc._rev !== oldRev) {
          callback(createError(REV_CONFLICT));
        } else { // update
          var req = oStore.put(doc);
          req.onsuccess = function () {
            ret = {ok: true, id: doc._id, rev: doc._rev};
            if (opts.ctx) { // return immediately
              callback(null, ret);
            }
          };
        }
      };
    } else { // new doc
      req = oStore.add(doc);
      req.onerror = function (e) {
        // constraint error, already exists
        callback(createError(REV_CONFLICT));
        e.preventDefault(); // avoid transaction abort
        e.stopPropagation(); // avoid transaction onerror
      };
      req.onsuccess = function () {
        ret = {ok: true, id: doc._id, rev: doc._rev};
        if (opts.ctx) { // return immediately
          callback(null, ret);
        }
      };
    }
  };

  api._removeLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var tx = opts.ctx;
    if (!tx) {
      var txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readwrite');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      tx = txnResult.txn;
      tx.oncomplete = function () {
        if (ret) {
          callback(null, ret);
        }
      };
    }
    var ret;
    var id = doc._id;
    var oStore = tx.objectStore(LOCAL_STORE);
    var req = oStore.get(id);

    req.onerror = idbError(callback);
    req.onsuccess = function (e) {
      var oldDoc = e.target.result;
      if (!oldDoc || oldDoc._rev !== doc._rev) {
        callback(createError(MISSING_DOC));
      } else {
        oStore.delete(id);
        ret = {ok: true, id: id, rev: '0-0'};
        if (opts.ctx) { // return immediately
          callback(null, ret);
        }
      }
    };
  };

  api._destroy = function (opts, callback) {
    changesHandler.removeAllListeners(dbName);

    //Close open request for "dbName" database to fix ie delay.
    var openReq = openReqList.get(dbName);
    if (openReq && openReq.result) {
      openReq.result.close();
      cachedDBs.delete(dbName);
    }
    var req = indexedDB.deleteDatabase(dbName);

    req.onsuccess = function () {
      //Remove open request from the list.
      openReqList.delete(dbName);
      if (hasLocalStorage() && (dbName in localStorage)) {
        delete localStorage[dbName];
      }
      callback(null, { 'ok': true });
    };

    req.onerror = idbError(callback);
  };

  var cached = cachedDBs.get(dbName);

  if (cached) {
    idb = cached.idb;
    api._meta = cached.global;
    return immediate(function () {
      callback(null, api);
    });
  }

  var req = indexedDB.open(dbName, ADAPTER_VERSION);
  openReqList.set(dbName, req);

  req.onupgradeneeded = function (e) {
    var db = e.target.result;
    if (e.oldVersion < 1) {
      return createSchema(db); // new db, initial schema
    }
    // do migrations

    var txn = e.currentTarget.transaction;
    // these migrations have to be done in this function, before
    // control is returned to the event loop, because IndexedDB

    if (e.oldVersion < 3) {
      createLocalStoreSchema(db); // v2 -> v3
    }
    if (e.oldVersion < 4) {
      addAttachAndSeqStore(db); // v3 -> v4
    }

    var migrations = [
      addDeletedOrLocalIndex, // v1 -> v2
      migrateLocalStore,      // v2 -> v3
      migrateAttsAndSeqs,     // v3 -> v4
      migrateMetadata         // v4 -> v5
    ];

    var i = e.oldVersion;

    function next() {
      var migration = migrations[i - 1];
      i++;
      if (migration) {
        migration(txn, next);
      }
    }

    next();
  };

  req.onsuccess = function (e) {

    idb = e.target.result;

    idb.onversionchange = function () {
      idb.close();
      cachedDBs.delete(dbName);
    };

    idb.onabort = function (e) {
      guardedConsole('error', 'Database has a global failure', e.target.error);
      idb.close();
      cachedDBs.delete(dbName);
    };

    // Do a few setup operations (in parallel as much as possible):
    // 1. Fetch meta doc
    // 2. Check blob support
    // 3. Calculate docCount
    // 4. Generate an instanceId if necessary
    // 5. Store docCount and instanceId on meta doc

    var txn = idb.transaction([
      META_STORE,
      DETECT_BLOB_SUPPORT_STORE,
      DOC_STORE
    ], 'readwrite');

    var storedMetaDoc = false;
    var metaDoc;
    var docCount;
    var blobSupport;
    var instanceId;

    function completeSetup() {
      if (typeof blobSupport === 'undefined' || !storedMetaDoc) {
        return;
      }
      api._meta = {
        name: dbName,
        instanceId: instanceId,
        blobSupport: blobSupport
      };

      cachedDBs.set(dbName, {
        idb: idb,
        global: api._meta
      });
      callback(null, api);
    }

    function storeMetaDocIfReady() {
      if (typeof docCount === 'undefined' || typeof metaDoc === 'undefined') {
        return;
      }
      var instanceKey = dbName + '_id';
      if (instanceKey in metaDoc) {
        instanceId = metaDoc[instanceKey];
      } else {
        metaDoc[instanceKey] = instanceId = uuid();
      }
      metaDoc.docCount = docCount;
      txn.objectStore(META_STORE).put(metaDoc);
    }

    //
    // fetch or generate the instanceId
    //
    txn.objectStore(META_STORE).get(META_STORE).onsuccess = function (e) {
      metaDoc = e.target.result || { id: META_STORE };
      storeMetaDocIfReady();
    };

    //
    // countDocs
    //
    countDocs(txn, function (count) {
      docCount = count;
      storeMetaDocIfReady();
    });

    //
    // check blob support
    //
    if (!blobSupportPromise) {
      // make sure blob support is only checked once
      blobSupportPromise = checkBlobSupport(txn);
    }

    blobSupportPromise.then(function (val) {
      blobSupport = val;
      completeSetup();
    });

    // only when the metadata put transaction has completed,
    // consider the setup done
    txn.oncomplete = function () {
      storedMetaDoc = true;
      completeSetup();
    };
    txn.onabort = idbError(callback);
  };

  req.onerror = function () {
    var msg = 'Failed to open indexedDB, are you in private browsing mode?';
    guardedConsole('error', msg);
    callback(createError(IDB_ERROR, msg));
  };
}

IdbPouch.valid = function () {
  // Following #7085 buggy idb versions (typically Safari < 10.1) are
  // considered valid.

  // On Firefox SecurityError is thrown while referencing indexedDB if cookies
  // are not allowed. `typeof indexedDB` also triggers the error.
  try {
    // some outdated implementations of IDB that appear on Samsung
    // and HTC Android devices <4.4 are missing IDBKeyRange
    return typeof indexedDB !== 'undefined' && typeof IDBKeyRange !== 'undefined';
  } catch (e) {
    return false;
  }
};

function IDBPouch (PouchDB) {
  PouchDB.adapter('idb', IdbPouch, true);
}

// dead simple promise pool, inspired by https://github.com/timdp/es6-promise-pool
// but much smaller in code size. limits the number of concurrent promises that are executed


function pool(promiseFactories, limit) {
  return new Promise(function (resolve, reject) {
    var running = 0;
    var current = 0;
    var done = 0;
    var len = promiseFactories.length;
    var err;

    function runNext() {
      running++;
      promiseFactories[current++]().then(onSuccess, onError);
    }

    function doNext() {
      if (++done === len) {
        /* istanbul ignore if */
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      } else {
        runNextBatch();
      }
    }

    function onSuccess() {
      running--;
      doNext();
    }

    /* istanbul ignore next */
    function onError(thisErr) {
      running--;
      err = err || thisErr;
      doNext();
    }

    function runNextBatch() {
      while (running < limit && current < len) {
        runNext();
      }
    }

    runNextBatch();
  });
}

var CHANGES_BATCH_SIZE = 25;
var MAX_SIMULTANEOUS_REVS = 50;
var CHANGES_TIMEOUT_BUFFER = 5000;
var DEFAULT_HEARTBEAT = 10000;

var supportsBulkGetMap = {};

function readAttachmentsAsBlobOrBuffer(row) {
  var doc = row.doc || row.ok;
  var atts = doc && doc._attachments;
  if (!atts) {
    return;
  }
  Object.keys(atts).forEach(function (filename) {
    var att = atts[filename];
    att.data = b64ToBluffer(att.data, att.content_type);
  });
}

function encodeDocId(id) {
  if (/^_design/.test(id)) {
    return '_design/' + encodeURIComponent(id.slice(8));
  }
  if (/^_local/.test(id)) {
    return '_local/' + encodeURIComponent(id.slice(7));
  }
  return encodeURIComponent(id);
}

function preprocessAttachments$1(doc) {
  if (!doc._attachments || !Object.keys(doc._attachments)) {
    return Promise.resolve();
  }

  return Promise.all(Object.keys(doc._attachments).map(function (key) {
    var attachment = doc._attachments[key];
    if (attachment.data && typeof attachment.data !== 'string') {
      return new Promise(function (resolve) {
        blobToBase64(attachment.data, resolve);
      }).then(function (b64) {
        attachment.data = b64;
      });
    }
  }));
}

function hasUrlPrefix(opts) {
  if (!opts.prefix) {
    return false;
  }
  var protocol = parseUri(opts.prefix).protocol;
  return protocol === 'http' || protocol === 'https';
}

// Get all the information you possibly can about the URI given by name and
// return it as a suitable object.
function getHost(name, opts) {
  // encode db name if opts.prefix is a url (#5574)
  if (hasUrlPrefix(opts)) {
    var dbName = opts.name.substr(opts.prefix.length);
    // Ensure prefix has a trailing slash
    var prefix = opts.prefix.replace(/\/?$/, '/');
    name = prefix + encodeURIComponent(dbName);
  }

  var uri = parseUri(name);
  if (uri.user || uri.password) {
    uri.auth = {username: uri.user, password: uri.password};
  }

  // Split the path part of the URI into parts using '/' as the delimiter
  // after removing any leading '/' and any trailing '/'
  var parts = uri.path.replace(/(^\/|\/$)/g, '').split('/');

  uri.db = parts.pop();
  // Prevent double encoding of URI component
  if (uri.db.indexOf('%') === -1) {
    uri.db = encodeURIComponent(uri.db);
  }

  uri.path = parts.join('/');

  return uri;
}

// Generate a URL with the host data given by opts and the given path
function genDBUrl(opts, path) {
  return genUrl(opts, opts.db + '/' + path);
}

// Generate a URL with the host data given by opts and the given path
function genUrl(opts, path) {
  // If the host already has a path, then we need to have a path delimiter
  // Otherwise, the path delimiter is the empty string
  var pathDel = !opts.path ? '' : '/';

  // If the host already has a path, then we need to have a path delimiter
  // Otherwise, the path delimiter is the empty string
  return opts.protocol + '://' + opts.host +
         (opts.port ? (':' + opts.port) : '') +
         '/' + opts.path + pathDel + path;
}

function paramsToStr(params) {
  return '?' + Object.keys(params).map(function (k) {
    return k + '=' + encodeURIComponent(params[k]);
  }).join('&');
}

function shouldCacheBust(opts) {
  var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ?
      navigator.userAgent.toLowerCase() : '';
  var isIE = ua.indexOf('msie') !== -1;
  var isTrident = ua.indexOf('trident') !== -1;
  var isEdge = ua.indexOf('edge') !== -1;
  var isGET = !('method' in opts) || opts.method === 'GET';
  return (isIE || isTrident || isEdge) && isGET;
}

// Implements the PouchDB API for dealing with CouchDB instances over HTTP
function HttpPouch(opts, callback) {

  // The functions that will be publicly available for HttpPouch
  var api = this;

  var host = getHost(opts.name, opts);
  var dbUrl = genDBUrl(host, '');

  opts = clone(opts);

  var ourFetch = function (url, options) {

    options = options || {};
    options.headers = options.headers || new h();

    options.credentials = 'include';

    if (opts.auth || host.auth) {
      var nAuth = opts.auth || host.auth;
      var str = nAuth.username + ':' + nAuth.password;
      var token = thisBtoa(unescape(encodeURIComponent(str)));
      options.headers.set('Authorization', 'Basic ' + token);
    }

    var headers = opts.headers || {};
    Object.keys(headers).forEach(function (key) {
      options.headers.append(key, headers[key]);
    });

    /* istanbul ignore if */
    if (shouldCacheBust(options)) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + '_nonce=' + Date.now();
    }

    var fetchFun = opts.fetch || f$1;
    return fetchFun(url, options);
  };

  function adapterFun$$1(name, fun) {
    return adapterFun(name, getArguments(function (args) {
      setup().then(function () {
        return fun.apply(this, args);
      }).catch(function (e) {
        var callback = args.pop();
        callback(e);
      });
    })).bind(api);
  }

  function fetchJSON(url, options, callback) {

    var result = {};

    options = options || {};
    options.headers = options.headers || new h();

    if (!options.headers.get('Content-Type')) {
      options.headers.set('Content-Type', 'application/json');
    }
    if (!options.headers.get('Accept')) {
      options.headers.set('Accept', 'application/json');
    }

    return ourFetch(url, options).then(function (response) {
      result.ok = response.ok;
      result.status = response.status;
      return response.json();
    }).then(function (json) {
      result.data = json;
      if (!result.ok) {
        result.data.status = result.status;
        var err = generateErrorFromResponse(result.data);
        if (callback) {
          return callback(err);
        } else {
          throw err;
        }
      }

      if (Array.isArray(result.data)) {
        result.data = result.data.map(function (v) {
          if (v.error || v.missing) {
            return generateErrorFromResponse(v);
          } else {
            return v;
          }
        });
      }

      if (callback) {
        callback(null, result.data);
      } else {
        return result;
      }
    });
  }

  var setupPromise;

  function setup() {
    if (opts.skip_setup) {
      return Promise.resolve();
    }

    // If there is a setup in process or previous successful setup
    // done then we will use that
    // If previous setups have been rejected we will try again
    if (setupPromise) {
      return setupPromise;
    }

    setupPromise = fetchJSON(dbUrl).catch(function (err) {
      if (err && err.status && err.status === 404) {
        // Doesnt exist, create it
        explainError(404, 'PouchDB is just detecting if the remote exists.');
        return fetchJSON(dbUrl, {method: 'PUT'});
      } else {
        return Promise.reject(err);
      }
    }).catch(function (err) {
      // If we try to create a database that already exists, skipped in
      // istanbul since its catching a race condition.
      /* istanbul ignore if */
      if (err && err.status && err.status === 412) {
        return true;
      }
      return Promise.reject(err);
    });

    setupPromise.catch(function () {
      setupPromise = null;
    });

    return setupPromise;
  }

  immediate(function () {
    callback(null, api);
  });

  api._remote = true;

  /* istanbul ignore next */
  api.type = function () {
    return 'http';
  };

  api.id = adapterFun$$1('id', function (callback) {
    ourFetch(genUrl(host, '')).then(function (response) {
      return response.json();
    }).catch(function () {
      return {};
    }).then(function (result) {
      // Bad response or missing `uuid` should not prevent ID generation.
      var uuid$$1 = (result && result.uuid) ?
          (result.uuid + host.db) : genDBUrl(host, '');
      callback(null, uuid$$1);
    });
  });

  // Sends a POST request to the host calling the couchdb _compact function
  //    version: The version of CouchDB it is running
  api.compact = adapterFun$$1('compact', function (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = clone(opts);

    fetchJSON(genDBUrl(host, '_compact'), {method: 'POST'}).then(function () {
      function ping() {
        api.info(function (err, res) {
          // CouchDB may send a "compact_running:true" if it's
          // already compacting. PouchDB Server doesn't.
          /* istanbul ignore else */
          if (res && !res.compact_running) {
            callback(null, {ok: true});
          } else {
            setTimeout(ping, opts.interval || 200);
          }
        });
      }
      // Ping the http if it's finished compaction
      ping();
    });
  });

  api.bulkGet = adapterFun('bulkGet', function (opts, callback) {
    var self = this;

    function doBulkGet(cb) {
      var params = {};
      if (opts.revs) {
        params.revs = true;
      }
      if (opts.attachments) {
        /* istanbul ignore next */
        params.attachments = true;
      }
      if (opts.latest) {
        params.latest = true;
      }
      fetchJSON(genDBUrl(host, '_bulk_get' + paramsToStr(params)), {
        method: 'POST',
        body: JSON.stringify({ docs: opts.docs})
      }).then(function (result) {
        if (opts.attachments && opts.binary) {
          result.data.results.forEach(function (res) {
            res.docs.forEach(readAttachmentsAsBlobOrBuffer);
          });
        }
        cb(null, result.data);
      }).catch(cb);
    }

    /* istanbul ignore next */
    function doBulkGetShim() {
      // avoid "url too long error" by splitting up into multiple requests
      var batchSize = MAX_SIMULTANEOUS_REVS;
      var numBatches = Math.ceil(opts.docs.length / batchSize);
      var numDone = 0;
      var results = new Array(numBatches);

      function onResult(batchNum) {
        return function (err, res) {
          // err is impossible because shim returns a list of errs in that case
          results[batchNum] = res.results;
          if (++numDone === numBatches) {
            callback(null, {results: flatten(results)});
          }
        };
      }

      for (var i = 0; i < numBatches; i++) {
        var subOpts = pick(opts, ['revs', 'attachments', 'binary', 'latest']);
        subOpts.docs = opts.docs.slice(i * batchSize,
          Math.min(opts.docs.length, (i + 1) * batchSize));
        bulkGet(self, subOpts, onResult(i));
      }
    }

    // mark the whole database as either supporting or not supporting _bulk_get
    var dbUrl = genUrl(host, '');
    var supportsBulkGet = supportsBulkGetMap[dbUrl];

    /* istanbul ignore next */
    if (typeof supportsBulkGet !== 'boolean') {
      // check if this database supports _bulk_get
      doBulkGet(function (err, res) {
        if (err) {
          supportsBulkGetMap[dbUrl] = false;
          explainError(
            err.status,
            'PouchDB is just detecting if the remote ' +
            'supports the _bulk_get API.'
          );
          doBulkGetShim();
        } else {
          supportsBulkGetMap[dbUrl] = true;
          callback(null, res);
        }
      });
    } else if (supportsBulkGet) {
      doBulkGet(callback);
    } else {
      doBulkGetShim();
    }
  });

  // Calls GET on the host, which gets back a JSON string containing
  //    couchdb: A welcome string
  //    version: The version of CouchDB it is running
  api._info = function (callback) {
    setup().then(function () {
      return ourFetch(genDBUrl(host, ''));
    }).then(function (response) {
      return response.json();
    }).then(function (info) {
      info.host = genDBUrl(host, '');
      callback(null, info);
    }).catch(callback);
  };

  api.fetch = function (path, options) {
    return setup().then(function () {
      var url = path.substring(0, 1) === '/' ?
        genUrl(host, path.substring(1)) :
        genDBUrl(host, path);
      return ourFetch(url, options);
    });
  };

  // Get the document with the given id from the database given by host.
  // The id could be solely the _id in the database, or it may be a
  // _design/ID or _local/ID path
  api.get = adapterFun$$1('get', function (id, opts, callback) {
    // If no options were given, set the callback to the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = clone(opts);

    // List of parameters to add to the GET request
    var params = {};

    if (opts.revs) {
      params.revs = true;
    }

    if (opts.revs_info) {
      params.revs_info = true;
    }

    if (opts.latest) {
      params.latest = true;
    }

    if (opts.open_revs) {
      if (opts.open_revs !== "all") {
        opts.open_revs = JSON.stringify(opts.open_revs);
      }
      params.open_revs = opts.open_revs;
    }

    if (opts.rev) {
      params.rev = opts.rev;
    }

    if (opts.conflicts) {
      params.conflicts = opts.conflicts;
    }

    /* istanbul ignore if */
    if (opts.update_seq) {
      params.update_seq = opts.update_seq;
    }

    id = encodeDocId(id);

    function fetchAttachments(doc) {
      var atts = doc._attachments;
      var filenames = atts && Object.keys(atts);
      if (!atts || !filenames.length) {
        return;
      }
      // we fetch these manually in separate XHRs, because
      // Sync Gateway would normally send it back as multipart/mixed,
      // which we cannot parse. Also, this is more efficient than
      // receiving attachments as base64-encoded strings.
      function fetchData(filename) {
        var att = atts[filename];
        var path = encodeDocId(doc._id) + '/' + encodeAttachmentId(filename) +
            '?rev=' + doc._rev;
        return ourFetch(genDBUrl(host, path)).then(function (response) {
          if (typeof process !== 'undefined' && !process.browser) {
            return response.buffer();
          } else {
            /* istanbul ignore next */
            return response.blob();
          }
        }).then(function (blob) {
          if (opts.binary) {
            // TODO: Can we remove this?
            if (typeof process !== 'undefined' && !process.browser) {
              blob.type = att.content_type;
            }
            return blob;
          }
          return new Promise(function (resolve) {
            blobToBase64(blob, resolve);
          });
        }).then(function (data) {
          delete att.stub;
          delete att.length;
          att.data = data;
        });
      }

      var promiseFactories = filenames.map(function (filename) {
        return function () {
          return fetchData(filename);
        };
      });

      // This limits the number of parallel xhr requests to 5 any time
      // to avoid issues with maximum browser request limits
      return pool(promiseFactories, 5);
    }

    function fetchAllAttachments(docOrDocs) {
      if (Array.isArray(docOrDocs)) {
        return Promise.all(docOrDocs.map(function (doc) {
          if (doc.ok) {
            return fetchAttachments(doc.ok);
          }
        }));
      }
      return fetchAttachments(docOrDocs);
    }

    var url = genDBUrl(host, id + paramsToStr(params));
    fetchJSON(url).then(function (res) {
      return Promise.resolve().then(function () {
        if (opts.attachments) {
          return fetchAllAttachments(res.data);
        }
      }).then(function () {
        callback(null, res.data);
      });
    }).catch(function (e) {
      e.docId = id;
      callback(e);
    });
  });


  // Delete the document given by doc from the database given by host.
  api.remove = adapterFun$$1('remove', function (docOrId, optsOrRev, opts, cb) {
    var doc;
    if (typeof optsOrRev === 'string') {
      // id, rev, opts, callback style
      doc = {
        _id: docOrId,
        _rev: optsOrRev
      };
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
    } else {
      // doc, opts, callback style
      doc = docOrId;
      if (typeof optsOrRev === 'function') {
        cb = optsOrRev;
        opts = {};
      } else {
        cb = opts;
        opts = optsOrRev;
      }
    }

    var rev$$1 = (doc._rev || opts.rev);
    var url = genDBUrl(host, encodeDocId(doc._id)) + '?rev=' + rev$$1;

    fetchJSON(url, {method: 'DELETE'}, cb).catch(cb);
  });

  function encodeAttachmentId(attachmentId) {
    return attachmentId.split("/").map(encodeURIComponent).join("/");
  }

  // Get the attachment
  api.getAttachment = adapterFun$$1('getAttachment', function (docId, attachmentId,
                                                            opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var params = opts.rev ? ('?rev=' + opts.rev) : '';
    var url = genDBUrl(host, encodeDocId(docId)) + '/' +
        encodeAttachmentId(attachmentId) + params;
    var contentType;
    ourFetch(url, {method: 'GET'}).then(function (response) {
      contentType = response.headers.get('content-type');
      if (!response.ok) {
        throw response;
      } else {
        if (typeof process !== 'undefined' && !process.browser) {
          return response.buffer();
        } else {
          /* istanbul ignore next */
          return response.blob();
        }
      }
    }).then(function (blob) {
      // TODO: also remove
      if (typeof process !== 'undefined' && !process.browser) {
        blob.type = contentType;
      }
      callback(null, blob);
    }).catch(function (err) {
      callback(err);
    });
  });

  // Remove the attachment given by the id and rev
  api.removeAttachment =  adapterFun$$1('removeAttachment', function (docId,
                                                                   attachmentId,
                                                                   rev$$1,
                                                                   callback) {
    var url = genDBUrl(host, encodeDocId(docId) + '/' +
                       encodeAttachmentId(attachmentId)) + '?rev=' + rev$$1;
    fetchJSON(url, {method: 'DELETE'}, callback).catch(callback);
  });

  // Add the attachment given by blob and its contentType property
  // to the document with the given id, the revision given by rev, and
  // add it to the database given by host.
  api.putAttachment = adapterFun$$1('putAttachment', function (docId, attachmentId,
                                                            rev$$1, blob,
                                                            type, callback) {
    if (typeof type === 'function') {
      callback = type;
      type = blob;
      blob = rev$$1;
      rev$$1 = null;
    }
    var id = encodeDocId(docId) + '/' + encodeAttachmentId(attachmentId);
    var url = genDBUrl(host, id);
    if (rev$$1) {
      url += '?rev=' + rev$$1;
    }

    if (typeof blob === 'string') {
      // input is assumed to be a base64 string
      var binary;
      try {
        binary = thisAtob(blob);
      } catch (err) {
        return callback(createError(BAD_ARG,
                        'Attachment is not a valid base64 string'));
      }
      blob = binary ? binStringToBluffer(binary, type) : '';
    }

    // Add the attachment
    fetchJSON(url, {
      headers: new h({'Content-Type': type}),
      method: 'PUT',
      body: blob
    }, callback).catch(callback);
  });

  // Update/create multiple documents given by req in the database
  // given by host.
  api._bulkDocs = function (req, opts, callback) {
    // If new_edits=false then it prevents the database from creating
    // new revision numbers for the documents. Instead it just uses
    // the old ones. This is used in database replication.
    req.new_edits = opts.new_edits;

    setup().then(function () {
      return Promise.all(req.docs.map(preprocessAttachments$1));
    }).then(function () {
      // Update/create the documents
      return fetchJSON(genDBUrl(host, '_bulk_docs'), {
        method: 'POST',
        body: JSON.stringify(req)
      }, callback);
    }).catch(callback);
  };


  // Update/create document
  api._put = function (doc, opts, callback) {
    setup().then(function () {
      return preprocessAttachments$1(doc);
    }).then(function () {
      return fetchJSON(genDBUrl(host, encodeDocId(doc._id)), {
        method: 'PUT',
        body: JSON.stringify(doc)
      });
    }).then(function (result) {
      callback(null, result.data);
    }).catch(function (err) {
      err.docId = doc && doc._id;
      callback(err);
    });
  };


  // Get a listing of the documents in the database given
  // by host and ordered by increasing id.
  api.allDocs = adapterFun$$1('allDocs', function (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = clone(opts);

    // List of parameters to add to the GET request
    var params = {};
    var body;
    var method = 'GET';

    if (opts.conflicts) {
      params.conflicts = true;
    }

    /* istanbul ignore if */
    if (opts.update_seq) {
      params.update_seq = true;
    }

    if (opts.descending) {
      params.descending = true;
    }

    if (opts.include_docs) {
      params.include_docs = true;
    }

    // added in CouchDB 1.6.0
    if (opts.attachments) {
      params.attachments = true;
    }

    if (opts.key) {
      params.key = JSON.stringify(opts.key);
    }

    if (opts.start_key) {
      opts.startkey = opts.start_key;
    }

    if (opts.startkey) {
      params.startkey = JSON.stringify(opts.startkey);
    }

    if (opts.end_key) {
      opts.endkey = opts.end_key;
    }

    if (opts.endkey) {
      params.endkey = JSON.stringify(opts.endkey);
    }

    if (typeof opts.inclusive_end !== 'undefined') {
      params.inclusive_end = !!opts.inclusive_end;
    }

    if (typeof opts.limit !== 'undefined') {
      params.limit = opts.limit;
    }

    if (typeof opts.skip !== 'undefined') {
      params.skip = opts.skip;
    }

    var paramStr = paramsToStr(params);

    if (typeof opts.keys !== 'undefined') {
      method = 'POST';
      body = {keys: opts.keys};
    }

    fetchJSON(genDBUrl(host, '_all_docs' + paramStr), {
       method: method,
      body: JSON.stringify(body)
    }).then(function (result) {
      if (opts.include_docs && opts.attachments && opts.binary) {
        result.data.rows.forEach(readAttachmentsAsBlobOrBuffer);
      }
      callback(null, result.data);
    }).catch(callback);
  });

  // Get a list of changes made to documents in the database given by host.
  // TODO According to the README, there should be two other methods here,
  // api.changes.addListener and api.changes.removeListener.
  api._changes = function (opts) {

    // We internally page the results of a changes request, this means
    // if there is a large set of changes to be returned we can start
    // processing them quicker instead of waiting on the entire
    // set of changes to return and attempting to process them at once
    var batchSize = 'batch_size' in opts ? opts.batch_size : CHANGES_BATCH_SIZE;

    opts = clone(opts);

    if (opts.continuous && !('heartbeat' in opts)) {
      opts.heartbeat = DEFAULT_HEARTBEAT;
    }

    var requestTimeout = ('timeout' in opts) ? opts.timeout : 30 * 1000;

    // ensure CHANGES_TIMEOUT_BUFFER applies
    if ('timeout' in opts && opts.timeout &&
      (requestTimeout - opts.timeout) < CHANGES_TIMEOUT_BUFFER) {
        requestTimeout = opts.timeout + CHANGES_TIMEOUT_BUFFER;
    }

    /* istanbul ignore if */
    if ('heartbeat' in opts && opts.heartbeat &&
       (requestTimeout - opts.heartbeat) < CHANGES_TIMEOUT_BUFFER) {
        requestTimeout = opts.heartbeat + CHANGES_TIMEOUT_BUFFER;
    }

    var params = {};
    if ('timeout' in opts && opts.timeout) {
      params.timeout = opts.timeout;
    }

    var limit = (typeof opts.limit !== 'undefined') ? opts.limit : false;
    var leftToFetch = limit;

    if (opts.style) {
      params.style = opts.style;
    }

    if (opts.include_docs || opts.filter && typeof opts.filter === 'function') {
      params.include_docs = true;
    }

    if (opts.attachments) {
      params.attachments = true;
    }

    if (opts.continuous) {
      params.feed = 'longpoll';
    }

    if (opts.seq_interval) {
      params.seq_interval = opts.seq_interval;
    }

    if (opts.conflicts) {
      params.conflicts = true;
    }

    if (opts.descending) {
      params.descending = true;
    }
    
    /* istanbul ignore if */
    if (opts.update_seq) {
      params.update_seq = true;
    }

    if ('heartbeat' in opts) {
      // If the heartbeat value is false, it disables the default heartbeat
      if (opts.heartbeat) {
        params.heartbeat = opts.heartbeat;
      }
    }

    if (opts.filter && typeof opts.filter === 'string') {
      params.filter = opts.filter;
    }

    if (opts.view && typeof opts.view === 'string') {
      params.filter = '_view';
      params.view = opts.view;
    }

    // If opts.query_params exists, pass it through to the changes request.
    // These parameters may be used by the filter on the source database.
    if (opts.query_params && typeof opts.query_params === 'object') {
      for (var param_name in opts.query_params) {
        /* istanbul ignore else */
        if (opts.query_params.hasOwnProperty(param_name)) {
          params[param_name] = opts.query_params[param_name];
        }
      }
    }

    var method = 'GET';
    var body;

    if (opts.doc_ids) {
      // set this automagically for the user; it's annoying that couchdb
      // requires both a "filter" and a "doc_ids" param.
      params.filter = '_doc_ids';
      method = 'POST';
      body = {doc_ids: opts.doc_ids };
    }
    /* istanbul ignore next */
    else if (opts.selector) {
      // set this automagically for the user, similar to above
      params.filter = '_selector';
      method = 'POST';
      body = {selector: opts.selector };
    }

    var controller = new a();
    var lastFetchedSeq;

    // Get all the changes starting wtih the one immediately after the
    // sequence number given by since.
    var fetchData = function (since, callback) {
      if (opts.aborted) {
        return;
      }
      params.since = since;
      // "since" can be any kind of json object in Cloudant/CouchDB 2.x
      /* istanbul ignore next */
      if (typeof params.since === "object") {
        params.since = JSON.stringify(params.since);
      }

      if (opts.descending) {
        if (limit) {
          params.limit = leftToFetch;
        }
      } else {
        params.limit = (!limit || leftToFetch > batchSize) ?
          batchSize : leftToFetch;
      }

      // Set the options for the ajax call
      var url = genDBUrl(host, '_changes' + paramsToStr(params));
      var fetchOpts = {
        signal: controller.signal,
        method: method,
        body: JSON.stringify(body)
      };
      lastFetchedSeq = since;

      /* istanbul ignore if */
      if (opts.aborted) {
        return;
      }

      // Get the changes
      setup().then(function () {
        return fetchJSON(url, fetchOpts, callback);
      }).catch(callback);
    };

    // If opts.since exists, get all the changes from the sequence
    // number given by opts.since. Otherwise, get all the changes
    // from the sequence number 0.
    var results = {results: []};

    var fetched = function (err, res) {
      if (opts.aborted) {
        return;
      }
      var raw_results_length = 0;
      // If the result of the ajax call (res) contains changes (res.results)
      if (res && res.results) {
        raw_results_length = res.results.length;
        results.last_seq = res.last_seq;
        var pending = null;
        var lastSeq = null;
        // Attach 'pending' property if server supports it (CouchDB 2.0+)
        /* istanbul ignore if */
        if (typeof res.pending === 'number') {
          pending = res.pending;
        }
        if (typeof results.last_seq === 'string' || typeof results.last_seq === 'number') {
          lastSeq = results.last_seq;
        }
        // For each change
        var req = {};
        req.query = opts.query_params;
        res.results = res.results.filter(function (c) {
          leftToFetch--;
          var ret = filterChange(opts)(c);
          if (ret) {
            if (opts.include_docs && opts.attachments && opts.binary) {
              readAttachmentsAsBlobOrBuffer(c);
            }
            if (opts.return_docs) {
              results.results.push(c);
            }
            opts.onChange(c, pending, lastSeq);
          }
          return ret;
        });
      } else if (err) {
        // In case of an error, stop listening for changes and call
        // opts.complete
        opts.aborted = true;
        opts.complete(err);
        return;
      }

      // The changes feed may have timed out with no results
      // if so reuse last update sequence
      if (res && res.last_seq) {
        lastFetchedSeq = res.last_seq;
      }

      var finished = (limit && leftToFetch <= 0) ||
        (res && raw_results_length < batchSize) ||
        (opts.descending);

      if ((opts.continuous && !(limit && leftToFetch <= 0)) || !finished) {
        // Queue a call to fetch again with the newest sequence number
        immediate(function () { fetchData(lastFetchedSeq, fetched); });
      } else {
        // We're done, call the callback
        opts.complete(null, results);
      }
    };

    fetchData(opts.since || 0, fetched);

    // Return a method to cancel this method from processing any more
    return {
      cancel: function () {
        opts.aborted = true;
        controller.abort();
      }
    };
  };

  // Given a set of document/revision IDs (given by req), tets the subset of
  // those that do NOT correspond to revisions stored in the database.
  // See http://wiki.apache.org/couchdb/HttpPostRevsDiff
  api.revsDiff = adapterFun$$1('revsDiff', function (req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // Get the missing document/revision IDs
    fetchJSON(genDBUrl(host, '_revs_diff'), {
      method: 'POST',
      body: JSON.stringify(req)
    }, callback).catch(callback);
  });

  api._close = function (callback) {
    callback();
  };

  api._destroy = function (options, callback) {
    fetchJSON(genDBUrl(host, ''), {method: 'DELETE'}).then(function (json) {
      callback(null, json);
    }).catch(function (err) {
      /* istanbul ignore if */
      if (err.status === 404) {
        callback(null, {ok: true});
      } else {
        callback(err);
      }
    });
  };
}

// HttpPouch is a valid adapter.
HttpPouch.valid = function () {
  return true;
};

function HttpPouch$1 (PouchDB) {
  PouchDB.adapter('http', HttpPouch, false);
  PouchDB.adapter('https', HttpPouch, false);
}

function QueryParseError(message) {
  this.status = 400;
  this.name = 'query_parse_error';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, QueryParseError);
  } catch (e) {}
}

inherits(QueryParseError, Error);

function NotFoundError(message) {
  this.status = 404;
  this.name = 'not_found';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, NotFoundError);
  } catch (e) {}
}

inherits(NotFoundError, Error);

function BuiltInError(message) {
  this.status = 500;
  this.name = 'invalid_value';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, BuiltInError);
  } catch (e) {}
}

inherits(BuiltInError, Error);

function promisedCallback(promise, callback) {
  if (callback) {
    promise.then(function (res) {
      immediate(function () {
        callback(null, res);
      });
    }, function (reason) {
      immediate(function () {
        callback(reason);
      });
    });
  }
  return promise;
}

function callbackify(fun) {
  return getArguments(function (args) {
    var cb = args.pop();
    var promise = fun.apply(this, args);
    if (typeof cb === 'function') {
      promisedCallback(promise, cb);
    }
    return promise;
  });
}

// Promise finally util similar to Q.finally
function fin(promise, finalPromiseFactory) {
  return promise.then(function (res) {
    return finalPromiseFactory().then(function () {
      return res;
    });
  }, function (reason) {
    return finalPromiseFactory().then(function () {
      throw reason;
    });
  });
}

function sequentialize(queue, promiseFactory) {
  return function () {
    var args = arguments;
    var that = this;
    return queue.add(function () {
      return promiseFactory.apply(that, args);
    });
  };
}

// uniq an array of strings, order not guaranteed
// similar to underscore/lodash _.uniq
function uniq(arr) {
  var theSet = new ExportedSet(arr);
  var result = new Array(theSet.size);
  var index = -1;
  theSet.forEach(function (value) {
    result[++index] = value;
  });
  return result;
}

function mapToKeysArray(map) {
  var result = new Array(map.size);
  var index = -1;
  map.forEach(function (value, key) {
    result[++index] = key;
  });
  return result;
}

function createBuiltInError(name) {
  var message = 'builtin ' + name +
    ' function requires map values to be numbers' +
    ' or number arrays';
  return new BuiltInError(message);
}

function sum(values) {
  var result = 0;
  for (var i = 0, len = values.length; i < len; i++) {
    var num = values[i];
    if (typeof num !== 'number') {
      if (Array.isArray(num)) {
        // lists of numbers are also allowed, sum them separately
        result = typeof result === 'number' ? [result] : result;
        for (var j = 0, jLen = num.length; j < jLen; j++) {
          var jNum = num[j];
          if (typeof jNum !== 'number') {
            throw createBuiltInError('_sum');
          } else if (typeof result[j] === 'undefined') {
            result.push(jNum);
          } else {
            result[j] += jNum;
          }
        }
      } else { // not array/number
        throw createBuiltInError('_sum');
      }
    } else if (typeof result === 'number') {
      result += num;
    } else { // add number to array
      result[0] += num;
    }
  }
  return result;
}

var log = guardedConsole.bind(null, 'log');
var isArray = Array.isArray;
var toJSON = JSON.parse;

function evalFunctionWithEval(func, emit) {
  return scopeEval(
    "return (" + func.replace(/;\s*$/, "") + ");",
    {
      emit: emit,
      sum: sum,
      log: log,
      isArray: isArray,
      toJSON: toJSON
    }
  );
}

/*
 * Simple task queue to sequentialize actions. Assumes
 * callbacks will eventually fire (once).
 */


function TaskQueue$1() {
  this.promise = new Promise(function (fulfill) {fulfill(); });
}
TaskQueue$1.prototype.add = function (promiseFactory) {
  this.promise = this.promise.catch(function () {
    // just recover
  }).then(function () {
    return promiseFactory();
  });
  return this.promise;
};
TaskQueue$1.prototype.finish = function () {
  return this.promise;
};

function stringify(input) {
  if (!input) {
    return 'undefined'; // backwards compat for empty reduce
  }
  // for backwards compat with mapreduce, functions/strings are stringified
  // as-is. everything else is JSON-stringified.
  switch (typeof input) {
    case 'function':
      // e.g. a mapreduce map
      return input.toString();
    case 'string':
      // e.g. a mapreduce built-in _reduce function
      return input.toString();
    default:
      // e.g. a JSON object in the case of mango queries
      return JSON.stringify(input);
  }
}

/* create a string signature for a view so we can cache it and uniq it */
function createViewSignature(mapFun, reduceFun) {
  // the "undefined" part is for backwards compatibility
  return stringify(mapFun) + stringify(reduceFun) + 'undefined';
}

function createView(sourceDB, viewName, mapFun, reduceFun, temporary, localDocName) {
  var viewSignature = createViewSignature(mapFun, reduceFun);

  var cachedViews;
  if (!temporary) {
    // cache this to ensure we don't try to update the same view twice
    cachedViews = sourceDB._cachedViews = sourceDB._cachedViews || {};
    if (cachedViews[viewSignature]) {
      return cachedViews[viewSignature];
    }
  }

  var promiseForView = sourceDB.info().then(function (info) {

    var depDbName = info.db_name + '-mrview-' +
      (temporary ? 'temp' : stringMd5(viewSignature));

    // save the view name in the source db so it can be cleaned up if necessary
    // (e.g. when the _design doc is deleted, remove all associated view data)
    function diffFunction(doc) {
      doc.views = doc.views || {};
      var fullViewName = viewName;
      if (fullViewName.indexOf('/') === -1) {
        fullViewName = viewName + '/' + viewName;
      }
      var depDbs = doc.views[fullViewName] = doc.views[fullViewName] || {};
      /* istanbul ignore if */
      if (depDbs[depDbName]) {
        return; // no update necessary
      }
      depDbs[depDbName] = true;
      return doc;
    }
    return upsert(sourceDB, '_local/' + localDocName, diffFunction).then(function () {
      return sourceDB.registerDependentDatabase(depDbName).then(function (res) {
        var db = res.db;
        db.auto_compaction = true;
        var view = {
          name: depDbName,
          db: db,
          sourceDB: sourceDB,
          adapter: sourceDB.adapter,
          mapFun: mapFun,
          reduceFun: reduceFun
        };
        return view.db.get('_local/lastSeq').catch(function (err) {
          /* istanbul ignore if */
          if (err.status !== 404) {
            throw err;
          }
        }).then(function (lastSeqDoc) {
          view.seq = lastSeqDoc ? lastSeqDoc.seq : 0;
          if (cachedViews) {
            view.db.once('destroyed', function () {
              delete cachedViews[viewSignature];
            });
          }
          return view;
        });
      });
    });
  });

  if (cachedViews) {
    cachedViews[viewSignature] = promiseForView;
  }
  return promiseForView;
}

var persistentQueues = {};
var tempViewQueue = new TaskQueue$1();
var CHANGES_BATCH_SIZE$1 = 50;

function parseViewName(name) {
  // can be either 'ddocname/viewname' or just 'viewname'
  // (where the ddoc name is the same)
  return name.indexOf('/') === -1 ? [name, name] : name.split('/');
}

function isGenOne(changes) {
  // only return true if the current change is 1-
  // and there are no other leafs
  return changes.length === 1 && /^1-/.test(changes[0].rev);
}

function emitError(db, e) {
  try {
    db.emit('error', e);
  } catch (err) {
    guardedConsole('error',
      'The user\'s map/reduce function threw an uncaught error.\n' +
      'You can debug this error by doing:\n' +
      'myDatabase.on(\'error\', function (err) { debugger; });\n' +
      'Please double-check your map/reduce function.');
    guardedConsole('error', e);
  }
}

/**
 * Returns an "abstract" mapreduce object of the form:
 *
 *   {
 *     query: queryFun,
 *     viewCleanup: viewCleanupFun
 *   }
 *
 * Arguments are:
 *
 * localDoc: string
 *   This is for the local doc that gets saved in order to track the
 *   "dependent" DBs and clean them up for viewCleanup. It should be
 *   unique, so that indexer plugins don't collide with each other.
 * mapper: function (mapFunDef, emit)
 *   Returns a map function based on the mapFunDef, which in the case of
 *   normal map/reduce is just the de-stringified function, but may be
 *   something else, such as an object in the case of pouchdb-find.
 * reducer: function (reduceFunDef)
 *   Ditto, but for reducing. Modules don't have to support reducing
 *   (e.g. pouchdb-find).
 * ddocValidator: function (ddoc, viewName)
 *   Throws an error if the ddoc or viewName is not valid.
 *   This could be a way to communicate to the user that the configuration for the
 *   indexer is invalid.
 */
function createAbstractMapReduce(localDocName, mapper, reducer, ddocValidator) {

  function tryMap(db, fun, doc) {
    // emit an event if there was an error thrown by a map function.
    // putting try/catches in a single function also avoids deoptimizations.
    try {
      fun(doc);
    } catch (e) {
      emitError(db, e);
    }
  }

  function tryReduce(db, fun, keys, values, rereduce) {
    // same as above, but returning the result or an error. there are two separate
    // functions to avoid extra memory allocations since the tryCode() case is used
    // for custom map functions (common) vs this function, which is only used for
    // custom reduce functions (rare)
    try {
      return {output : fun(keys, values, rereduce)};
    } catch (e) {
      emitError(db, e);
      return {error: e};
    }
  }

  function sortByKeyThenValue(x, y) {
    var keyCompare = collate(x.key, y.key);
    return keyCompare !== 0 ? keyCompare : collate(x.value, y.value);
  }

  function sliceResults(results, limit, skip) {
    skip = skip || 0;
    if (typeof limit === 'number') {
      return results.slice(skip, limit + skip);
    } else if (skip > 0) {
      return results.slice(skip);
    }
    return results;
  }

  function rowToDocId(row) {
    var val = row.value;
    // Users can explicitly specify a joined doc _id, or it
    // defaults to the doc _id that emitted the key/value.
    var docId = (val && typeof val === 'object' && val._id) || row.id;
    return docId;
  }

  function readAttachmentsAsBlobOrBuffer(res) {
    res.rows.forEach(function (row) {
      var atts = row.doc && row.doc._attachments;
      if (!atts) {
        return;
      }
      Object.keys(atts).forEach(function (filename) {
        var att = atts[filename];
        atts[filename].data = b64ToBluffer(att.data, att.content_type);
      });
    });
  }

  function postprocessAttachments(opts) {
    return function (res) {
      if (opts.include_docs && opts.attachments && opts.binary) {
        readAttachmentsAsBlobOrBuffer(res);
      }
      return res;
    };
  }

  function addHttpParam(paramName, opts, params, asJson) {
    // add an http param from opts to params, optionally json-encoded
    var val = opts[paramName];
    if (typeof val !== 'undefined') {
      if (asJson) {
        val = encodeURIComponent(JSON.stringify(val));
      }
      params.push(paramName + '=' + val);
    }
  }

  function coerceInteger(integerCandidate) {
    if (typeof integerCandidate !== 'undefined') {
      var asNumber = Number(integerCandidate);
      // prevents e.g. '1foo' or '1.1' being coerced to 1
      if (!isNaN(asNumber) && asNumber === parseInt(integerCandidate, 10)) {
        return asNumber;
      } else {
        return integerCandidate;
      }
    }
  }

  function coerceOptions(opts) {
    opts.group_level = coerceInteger(opts.group_level);
    opts.limit = coerceInteger(opts.limit);
    opts.skip = coerceInteger(opts.skip);
    return opts;
  }

  function checkPositiveInteger(number) {
    if (number) {
      if (typeof number !== 'number') {
        return  new QueryParseError('Invalid value for integer: "' +
          number + '"');
      }
      if (number < 0) {
        return new QueryParseError('Invalid value for positive integer: ' +
          '"' + number + '"');
      }
    }
  }

  function checkQueryParseError(options, fun) {
    var startkeyName = options.descending ? 'endkey' : 'startkey';
    var endkeyName = options.descending ? 'startkey' : 'endkey';

    if (typeof options[startkeyName] !== 'undefined' &&
      typeof options[endkeyName] !== 'undefined' &&
      collate(options[startkeyName], options[endkeyName]) > 0) {
      throw new QueryParseError('No rows can match your key range, ' +
        'reverse your start_key and end_key or set {descending : true}');
    } else if (fun.reduce && options.reduce !== false) {
      if (options.include_docs) {
        throw new QueryParseError('{include_docs:true} is invalid for reduce');
      } else if (options.keys && options.keys.length > 1 &&
        !options.group && !options.group_level) {
        throw new QueryParseError('Multi-key fetches for reduce views must use ' +
          '{group: true}');
      }
    }
    ['group_level', 'limit', 'skip'].forEach(function (optionName) {
      var error = checkPositiveInteger(options[optionName]);
      if (error) {
        throw error;
      }
    });
  }

  function httpQuery(db, fun, opts) {
    // List of parameters to add to the PUT request
    var params = [];
    var body;
    var method = 'GET';
    var ok, status;

    // If opts.reduce exists and is defined, then add it to the list
    // of parameters.
    // If reduce=false then the results are that of only the map function
    // not the final result of map and reduce.
    addHttpParam('reduce', opts, params);
    addHttpParam('include_docs', opts, params);
    addHttpParam('attachments', opts, params);
    addHttpParam('limit', opts, params);
    addHttpParam('descending', opts, params);
    addHttpParam('group', opts, params);
    addHttpParam('group_level', opts, params);
    addHttpParam('skip', opts, params);
    addHttpParam('stale', opts, params);
    addHttpParam('conflicts', opts, params);
    addHttpParam('startkey', opts, params, true);
    addHttpParam('start_key', opts, params, true);
    addHttpParam('endkey', opts, params, true);
    addHttpParam('end_key', opts, params, true);
    addHttpParam('inclusive_end', opts, params);
    addHttpParam('key', opts, params, true);
    addHttpParam('update_seq', opts, params);

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    params = params === '' ? '' : '?' + params;

    // If keys are supplied, issue a POST to circumvent GET query string limits
    // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
    if (typeof opts.keys !== 'undefined') {
      var MAX_URL_LENGTH = 2000;
      // according to http://stackoverflow.com/a/417184/680742,
      // the de facto URL length limit is 2000 characters

      var keysAsString =
        'keys=' + encodeURIComponent(JSON.stringify(opts.keys));
      if (keysAsString.length + params.length + 1 <= MAX_URL_LENGTH) {
        // If the keys are short enough, do a GET. we do this to work around
        // Safari not understanding 304s on POSTs (see pouchdb/pouchdb#1239)
        params += (params[0] === '?' ? '&' : '?') + keysAsString;
      } else {
        method = 'POST';
        if (typeof fun === 'string') {
          body = {keys: opts.keys};
        } else { // fun is {map : mapfun}, so append to this
          fun.keys = opts.keys;
        }
      }
    }

    // We are referencing a query defined in the design doc
    if (typeof fun === 'string') {
      var parts = parseViewName(fun);
      return db.fetch('_design/' + parts[0] + '/_view/' + parts[1] + params, {
        headers: new h({'Content-Type': 'application/json'}),
        method: method,
        body: JSON.stringify(body)
      }).then(function (response) {
        ok = response.ok;
        status = response.status;
        return response.json();
      }).then(function (result) {
        if (!ok) {
          result.status = status;
          throw generateErrorFromResponse(result);
        }
        // fail the entire request if the result contains an error
        result.rows.forEach(function (row) {
          /* istanbul ignore if */
          if (row.value && row.value.error && row.value.error === "builtin_reduce_error") {
            throw new Error(row.reason);
          }
        });
        return result;
      }).then(postprocessAttachments(opts));
    }

    // We are using a temporary view, terrible for performance, good for testing
    body = body || {};
    Object.keys(fun).forEach(function (key) {
      if (Array.isArray(fun[key])) {
        body[key] = fun[key];
      } else {
        body[key] = fun[key].toString();
      }
    });

    return db.fetch('_temp_view' + params, {
      headers: new h({'Content-Type': 'application/json'}),
      method: 'POST',
      body: JSON.stringify(body)
    }).then(function (response) {
        ok = response.ok;
        status = response.status;
      return response.json();
    }).then(function (result) {
      if (!ok) {
        result.status = status;
        throw generateErrorFromResponse(result);
      }
      return result;
    }).then(postprocessAttachments(opts));
  }

  // custom adapters can define their own api._query
  // and override the default behavior
  /* istanbul ignore next */
  function customQuery(db, fun, opts) {
    return new Promise(function (resolve, reject) {
      db._query(fun, opts, function (err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  }

  // custom adapters can define their own api._viewCleanup
  // and override the default behavior
  /* istanbul ignore next */
  function customViewCleanup(db) {
    return new Promise(function (resolve, reject) {
      db._viewCleanup(function (err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  }

  function defaultsTo(value) {
    return function (reason) {
      /* istanbul ignore else */
      if (reason.status === 404) {
        return value;
      } else {
        throw reason;
      }
    };
  }

  // returns a promise for a list of docs to update, based on the input docId.
  // the order doesn't matter, because post-3.2.0, bulkDocs
  // is an atomic operation in all three adapters.
  function getDocsToPersist(docId, view, docIdsToChangesAndEmits) {
    var metaDocId = '_local/doc_' + docId;
    var defaultMetaDoc = {_id: metaDocId, keys: []};
    var docData = docIdsToChangesAndEmits.get(docId);
    var indexableKeysToKeyValues = docData[0];
    var changes = docData[1];

    function getMetaDoc() {
      if (isGenOne(changes)) {
        // generation 1, so we can safely assume initial state
        // for performance reasons (avoids unnecessary GETs)
        return Promise.resolve(defaultMetaDoc);
      }
      return view.db.get(metaDocId).catch(defaultsTo(defaultMetaDoc));
    }

    function getKeyValueDocs(metaDoc) {
      if (!metaDoc.keys.length) {
        // no keys, no need for a lookup
        return Promise.resolve({rows: []});
      }
      return view.db.allDocs({
        keys: metaDoc.keys,
        include_docs: true
      });
    }

    function processKeyValueDocs(metaDoc, kvDocsRes) {
      var kvDocs = [];
      var oldKeys = new ExportedSet();

      for (var i = 0, len = kvDocsRes.rows.length; i < len; i++) {
        var row = kvDocsRes.rows[i];
        var doc = row.doc;
        if (!doc) { // deleted
          continue;
        }
        kvDocs.push(doc);
        oldKeys.add(doc._id);
        doc._deleted = !indexableKeysToKeyValues.has(doc._id);
        if (!doc._deleted) {
          var keyValue = indexableKeysToKeyValues.get(doc._id);
          if ('value' in keyValue) {
            doc.value = keyValue.value;
          }
        }
      }
      var newKeys = mapToKeysArray(indexableKeysToKeyValues);
      newKeys.forEach(function (key) {
        if (!oldKeys.has(key)) {
          // new doc
          var kvDoc = {
            _id: key
          };
          var keyValue = indexableKeysToKeyValues.get(key);
          if ('value' in keyValue) {
            kvDoc.value = keyValue.value;
          }
          kvDocs.push(kvDoc);
        }
      });
      metaDoc.keys = uniq(newKeys.concat(metaDoc.keys));
      kvDocs.push(metaDoc);

      return kvDocs;
    }

    return getMetaDoc().then(function (metaDoc) {
      return getKeyValueDocs(metaDoc).then(function (kvDocsRes) {
        return processKeyValueDocs(metaDoc, kvDocsRes);
      });
    });
  }

  // updates all emitted key/value docs and metaDocs in the mrview database
  // for the given batch of documents from the source database
  function saveKeyValues(view, docIdsToChangesAndEmits, seq) {
    var seqDocId = '_local/lastSeq';
    return view.db.get(seqDocId)
      .catch(defaultsTo({_id: seqDocId, seq: 0}))
      .then(function (lastSeqDoc) {
        var docIds = mapToKeysArray(docIdsToChangesAndEmits);
        return Promise.all(docIds.map(function (docId) {
          return getDocsToPersist(docId, view, docIdsToChangesAndEmits);
        })).then(function (listOfDocsToPersist) {
          var docsToPersist = flatten(listOfDocsToPersist);
          lastSeqDoc.seq = seq;
          docsToPersist.push(lastSeqDoc);
          // write all docs in a single operation, update the seq once
          return view.db.bulkDocs({docs : docsToPersist});
        });
      });
  }

  function getQueue(view) {
    var viewName = typeof view === 'string' ? view : view.name;
    var queue = persistentQueues[viewName];
    if (!queue) {
      queue = persistentQueues[viewName] = new TaskQueue$1();
    }
    return queue;
  }

  function updateView(view) {
    return sequentialize(getQueue(view), function () {
      return updateViewInQueue(view);
    })();
  }

  function updateViewInQueue(view) {
    // bind the emit function once
    var mapResults;
    var doc;

    function emit(key, value) {
      var output = {id: doc._id, key: normalizeKey(key)};
      // Don't explicitly store the value unless it's defined and non-null.
      // This saves on storage space, because often people don't use it.
      if (typeof value !== 'undefined' && value !== null) {
        output.value = normalizeKey(value);
      }
      mapResults.push(output);
    }

    var mapFun = mapper(view.mapFun, emit);

    var currentSeq = view.seq || 0;

    function processChange(docIdsToChangesAndEmits, seq) {
      return function () {
        return saveKeyValues(view, docIdsToChangesAndEmits, seq);
      };
    }

    var queue = new TaskQueue$1();

    function processNextBatch() {
      return view.sourceDB.changes({
        return_docs: true,
        conflicts: true,
        include_docs: true,
        style: 'all_docs',
        since: currentSeq,
        limit: CHANGES_BATCH_SIZE$1
      }).then(processBatch);
    }

    function processBatch(response) {
      var results = response.results;
      if (!results.length) {
        return;
      }
      var docIdsToChangesAndEmits = createDocIdsToChangesAndEmits(results);
      queue.add(processChange(docIdsToChangesAndEmits, currentSeq));
      if (results.length < CHANGES_BATCH_SIZE$1) {
        return;
      }
      return processNextBatch();
    }

    function createDocIdsToChangesAndEmits(results) {
      var docIdsToChangesAndEmits = new ExportedMap();
      for (var i = 0, len = results.length; i < len; i++) {
        var change = results[i];
        if (change.doc._id[0] !== '_') {
          mapResults = [];
          doc = change.doc;

          if (!doc._deleted) {
            tryMap(view.sourceDB, mapFun, doc);
          }
          mapResults.sort(sortByKeyThenValue);

          var indexableKeysToKeyValues = createIndexableKeysToKeyValues(mapResults);
          docIdsToChangesAndEmits.set(change.doc._id, [
            indexableKeysToKeyValues,
            change.changes
          ]);
        }
        currentSeq = change.seq;
      }
      return docIdsToChangesAndEmits;
    }

    function createIndexableKeysToKeyValues(mapResults) {
      var indexableKeysToKeyValues = new ExportedMap();
      var lastKey;
      for (var i = 0, len = mapResults.length; i < len; i++) {
        var emittedKeyValue = mapResults[i];
        var complexKey = [emittedKeyValue.key, emittedKeyValue.id];
        if (i > 0 && collate(emittedKeyValue.key, lastKey) === 0) {
          complexKey.push(i); // dup key+id, so make it unique
        }
        indexableKeysToKeyValues.set(toIndexableString(complexKey), emittedKeyValue);
        lastKey = emittedKeyValue.key;
      }
      return indexableKeysToKeyValues;
    }

    return processNextBatch().then(function () {
      return queue.finish();
    }).then(function () {
      view.seq = currentSeq;
    });
  }

  function reduceView(view, results, options) {
    if (options.group_level === 0) {
      delete options.group_level;
    }

    var shouldGroup = options.group || options.group_level;

    var reduceFun = reducer(view.reduceFun);

    var groups = [];
    var lvl = isNaN(options.group_level) ? Number.POSITIVE_INFINITY :
      options.group_level;
    results.forEach(function (e) {
      var last = groups[groups.length - 1];
      var groupKey = shouldGroup ? e.key : null;

      // only set group_level for array keys
      if (shouldGroup && Array.isArray(groupKey)) {
        groupKey = groupKey.slice(0, lvl);
      }

      if (last && collate(last.groupKey, groupKey) === 0) {
        last.keys.push([e.key, e.id]);
        last.values.push(e.value);
        return;
      }
      groups.push({
        keys: [[e.key, e.id]],
        values: [e.value],
        groupKey: groupKey
      });
    });
    results = [];
    for (var i = 0, len = groups.length; i < len; i++) {
      var e = groups[i];
      var reduceTry = tryReduce(view.sourceDB, reduceFun, e.keys, e.values, false);
      if (reduceTry.error && reduceTry.error instanceof BuiltInError) {
        // CouchDB returns an error if a built-in errors out
        throw reduceTry.error;
      }
      results.push({
        // CouchDB just sets the value to null if a non-built-in errors out
        value: reduceTry.error ? null : reduceTry.output,
        key: e.groupKey
      });
    }
    // no total_rows/offset when reducing
    return {rows: sliceResults(results, options.limit, options.skip)};
  }

  function queryView(view, opts) {
    return sequentialize(getQueue(view), function () {
      return queryViewInQueue(view, opts);
    })();
  }

  function queryViewInQueue(view, opts) {
    var totalRows;
    var shouldReduce = view.reduceFun && opts.reduce !== false;
    var skip = opts.skip || 0;
    if (typeof opts.keys !== 'undefined' && !opts.keys.length) {
      // equivalent query
      opts.limit = 0;
      delete opts.keys;
    }

    function fetchFromView(viewOpts) {
      viewOpts.include_docs = true;
      return view.db.allDocs(viewOpts).then(function (res) {
        totalRows = res.total_rows;
        return res.rows.map(function (result) {

          // implicit migration - in older versions of PouchDB,
          // we explicitly stored the doc as {id: ..., key: ..., value: ...}
          // this is tested in a migration test
          /* istanbul ignore next */
          if ('value' in result.doc && typeof result.doc.value === 'object' &&
            result.doc.value !== null) {
            var keys = Object.keys(result.doc.value).sort();
            // this detection method is not perfect, but it's unlikely the user
            // emitted a value which was an object with these 3 exact keys
            var expectedKeys = ['id', 'key', 'value'];
            if (!(keys < expectedKeys || keys > expectedKeys)) {
              return result.doc.value;
            }
          }

          var parsedKeyAndDocId = parseIndexableString(result.doc._id);
          return {
            key: parsedKeyAndDocId[0],
            id: parsedKeyAndDocId[1],
            value: ('value' in result.doc ? result.doc.value : null)
          };
        });
      });
    }

    function onMapResultsReady(rows) {
      var finalResults;
      if (shouldReduce) {
        finalResults = reduceView(view, rows, opts);
      } else {
        finalResults = {
          total_rows: totalRows,
          offset: skip,
          rows: rows
        };
      }
      /* istanbul ignore if */
      if (opts.update_seq) {
        finalResults.update_seq = view.seq;
      }
      if (opts.include_docs) {
        var docIds = uniq(rows.map(rowToDocId));

        return view.sourceDB.allDocs({
          keys: docIds,
          include_docs: true,
          conflicts: opts.conflicts,
          attachments: opts.attachments,
          binary: opts.binary
        }).then(function (allDocsRes) {
          var docIdsToDocs = new ExportedMap();
          allDocsRes.rows.forEach(function (row) {
            docIdsToDocs.set(row.id, row.doc);
          });
          rows.forEach(function (row) {
            var docId = rowToDocId(row);
            var doc = docIdsToDocs.get(docId);
            if (doc) {
              row.doc = doc;
            }
          });
          return finalResults;
        });
      } else {
        return finalResults;
      }
    }

    if (typeof opts.keys !== 'undefined') {
      var keys = opts.keys;
      var fetchPromises = keys.map(function (key) {
        var viewOpts = {
          startkey : toIndexableString([key]),
          endkey   : toIndexableString([key, {}])
        };
        /* istanbul ignore if */
        if (opts.update_seq) {
          viewOpts.update_seq = true;
        }
        return fetchFromView(viewOpts);
      });
      return Promise.all(fetchPromises).then(flatten).then(onMapResultsReady);
    } else { // normal query, no 'keys'
      var viewOpts = {
        descending : opts.descending
      };
      /* istanbul ignore if */
      if (opts.update_seq) {
        viewOpts.update_seq = true;
      }
      var startkey;
      var endkey;
      if ('start_key' in opts) {
        startkey = opts.start_key;
      }
      if ('startkey' in opts) {
        startkey = opts.startkey;
      }
      if ('end_key' in opts) {
        endkey = opts.end_key;
      }
      if ('endkey' in opts) {
        endkey = opts.endkey;
      }
      if (typeof startkey !== 'undefined') {
        viewOpts.startkey = opts.descending ?
          toIndexableString([startkey, {}]) :
          toIndexableString([startkey]);
      }
      if (typeof endkey !== 'undefined') {
        var inclusiveEnd = opts.inclusive_end !== false;
        if (opts.descending) {
          inclusiveEnd = !inclusiveEnd;
        }

        viewOpts.endkey = toIndexableString(
          inclusiveEnd ? [endkey, {}] : [endkey]);
      }
      if (typeof opts.key !== 'undefined') {
        var keyStart = toIndexableString([opts.key]);
        var keyEnd = toIndexableString([opts.key, {}]);
        if (viewOpts.descending) {
          viewOpts.endkey = keyStart;
          viewOpts.startkey = keyEnd;
        } else {
          viewOpts.startkey = keyStart;
          viewOpts.endkey = keyEnd;
        }
      }
      if (!shouldReduce) {
        if (typeof opts.limit === 'number') {
          viewOpts.limit = opts.limit;
        }
        viewOpts.skip = skip;
      }
      return fetchFromView(viewOpts).then(onMapResultsReady);
    }
  }

  function httpViewCleanup(db) {
    return db.fetch('_view_cleanup', {
      headers: new h({'Content-Type': 'application/json'}),
      method: 'POST'
    }).then(function (response) {
      return response.json();
    });
  }

  function localViewCleanup(db) {
    return db.get('_local/' + localDocName).then(function (metaDoc) {
      var docsToViews = new ExportedMap();
      Object.keys(metaDoc.views).forEach(function (fullViewName) {
        var parts = parseViewName(fullViewName);
        var designDocName = '_design/' + parts[0];
        var viewName = parts[1];
        var views = docsToViews.get(designDocName);
        if (!views) {
          views = new ExportedSet();
          docsToViews.set(designDocName, views);
        }
        views.add(viewName);
      });
      var opts = {
        keys : mapToKeysArray(docsToViews),
        include_docs : true
      };
      return db.allDocs(opts).then(function (res) {
        var viewsToStatus = {};
        res.rows.forEach(function (row) {
          var ddocName = row.key.substring(8); // cuts off '_design/'
          docsToViews.get(row.key).forEach(function (viewName) {
            var fullViewName = ddocName + '/' + viewName;
            /* istanbul ignore if */
            if (!metaDoc.views[fullViewName]) {
              // new format, without slashes, to support PouchDB 2.2.0
              // migration test in pouchdb's browser.migration.js verifies this
              fullViewName = viewName;
            }
            var viewDBNames = Object.keys(metaDoc.views[fullViewName]);
            // design doc deleted, or view function nonexistent
            var statusIsGood = row.doc && row.doc.views &&
              row.doc.views[viewName];
            viewDBNames.forEach(function (viewDBName) {
              viewsToStatus[viewDBName] =
                viewsToStatus[viewDBName] || statusIsGood;
            });
          });
        });
        var dbsToDelete = Object.keys(viewsToStatus).filter(
          function (viewDBName) { return !viewsToStatus[viewDBName]; });
        var destroyPromises = dbsToDelete.map(function (viewDBName) {
          return sequentialize(getQueue(viewDBName), function () {
            return new db.constructor(viewDBName, db.__opts).destroy();
          })();
        });
        return Promise.all(destroyPromises).then(function () {
          return {ok: true};
        });
      });
    }, defaultsTo({ok: true}));
  }

  function queryPromised(db, fun, opts) {
    /* istanbul ignore next */
    if (typeof db._query === 'function') {
      return customQuery(db, fun, opts);
    }
    if (isRemote(db)) {
      return httpQuery(db, fun, opts);
    }

    if (typeof fun !== 'string') {
      // temp_view
      checkQueryParseError(opts, fun);

      tempViewQueue.add(function () {
        var createViewPromise = createView(
          /* sourceDB */ db,
          /* viewName */ 'temp_view/temp_view',
          /* mapFun */ fun.map,
          /* reduceFun */ fun.reduce,
          /* temporary */ true,
          /* localDocName */ localDocName);
        return createViewPromise.then(function (view) {
          return fin(updateView(view).then(function () {
            return queryView(view, opts);
          }), function () {
            return view.db.destroy();
          });
        });
      });
      return tempViewQueue.finish();
    } else {
      // persistent view
      var fullViewName = fun;
      var parts = parseViewName(fullViewName);
      var designDocName = parts[0];
      var viewName = parts[1];
      return db.get('_design/' + designDocName).then(function (doc) {
        var fun = doc.views && doc.views[viewName];

        if (!fun) {
          // basic validator; it's assumed that every subclass would want this
          throw new NotFoundError('ddoc ' + doc._id + ' has no view named ' +
            viewName);
        }

        ddocValidator(doc, viewName);
        checkQueryParseError(opts, fun);

        var createViewPromise = createView(
          /* sourceDB */ db,
          /* viewName */ fullViewName,
          /* mapFun */ fun.map,
          /* reduceFun */ fun.reduce,
          /* temporary */ false,
          /* localDocName */ localDocName);
        return createViewPromise.then(function (view) {
          if (opts.stale === 'ok' || opts.stale === 'update_after') {
            if (opts.stale === 'update_after') {
              immediate(function () {
                updateView(view);
              });
            }
            return queryView(view, opts);
          } else { // stale not ok
            return updateView(view).then(function () {
              return queryView(view, opts);
            });
          }
        });
      });
    }
  }

  function abstractQuery(fun, opts, callback) {
    var db = this;
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = opts ? coerceOptions(opts) : {};

    if (typeof fun === 'function') {
      fun = {map : fun};
    }

    var promise = Promise.resolve().then(function () {
      return queryPromised(db, fun, opts);
    });
    promisedCallback(promise, callback);
    return promise;
  }

  var abstractViewCleanup = callbackify(function () {
    var db = this;
    /* istanbul ignore next */
    if (typeof db._viewCleanup === 'function') {
      return customViewCleanup(db);
    }
    if (isRemote(db)) {
      return httpViewCleanup(db);
    }
    return localViewCleanup(db);
  });

  return {
    query: abstractQuery,
    viewCleanup: abstractViewCleanup
  };
}

var builtInReduce = {
  _sum: function (keys, values) {
    return sum(values);
  },

  _count: function (keys, values) {
    return values.length;
  },

  _stats: function (keys, values) {
    // no need to implement rereduce=true, because Pouch
    // will never call it
    function sumsqr(values) {
      var _sumsqr = 0;
      for (var i = 0, len = values.length; i < len; i++) {
        var num = values[i];
        _sumsqr += (num * num);
      }
      return _sumsqr;
    }
    return {
      sum     : sum(values),
      min     : Math.min.apply(null, values),
      max     : Math.max.apply(null, values),
      count   : values.length,
      sumsqr : sumsqr(values)
    };
  }
};

function getBuiltIn(reduceFunString) {
  if (/^_sum/.test(reduceFunString)) {
    return builtInReduce._sum;
  } else if (/^_count/.test(reduceFunString)) {
    return builtInReduce._count;
  } else if (/^_stats/.test(reduceFunString)) {
    return builtInReduce._stats;
  } else if (/^_/.test(reduceFunString)) {
    throw new Error(reduceFunString + ' is not a supported reduce function.');
  }
}

function mapper(mapFun, emit) {
  // for temp_views one can use emit(doc, emit), see #38
  if (typeof mapFun === "function" && mapFun.length === 2) {
    var origMap = mapFun;
    return function (doc) {
      return origMap(doc, emit);
    };
  } else {
    return evalFunctionWithEval(mapFun.toString(), emit);
  }
}

function reducer(reduceFun) {
  var reduceFunString = reduceFun.toString();
  var builtIn = getBuiltIn(reduceFunString);
  if (builtIn) {
    return builtIn;
  } else {
    return evalFunctionWithEval(reduceFunString);
  }
}

function ddocValidator(ddoc, viewName) {
  var fun = ddoc.views && ddoc.views[viewName];
  if (typeof fun.map !== 'string') {
    throw new NotFoundError('ddoc ' + ddoc._id + ' has no string view named ' +
      viewName + ', instead found object of type: ' + typeof fun.map);
  }
}

var localDocName = 'mrviews';
var abstract = createAbstractMapReduce(localDocName, mapper, reducer, ddocValidator);

function query(fun, opts, callback) {
  return abstract.query.call(this, fun, opts, callback);
}

function viewCleanup(callback) {
  return abstract.viewCleanup.call(this, callback);
}

var mapreduce = {
  query: query,
  viewCleanup: viewCleanup
};

function isGenOne$1(rev$$1) {
  return /^1-/.test(rev$$1);
}

function fileHasChanged(localDoc, remoteDoc, filename) {
  return !localDoc._attachments ||
         !localDoc._attachments[filename] ||
         localDoc._attachments[filename].digest !== remoteDoc._attachments[filename].digest;
}

function getDocAttachments(db, doc) {
  var filenames = Object.keys(doc._attachments);
  return Promise.all(filenames.map(function (filename) {
    return db.getAttachment(doc._id, filename, {rev: doc._rev});
  }));
}

function getDocAttachmentsFromTargetOrSource(target, src, doc) {
  var doCheckForLocalAttachments = isRemote(src) && !isRemote(target);
  var filenames = Object.keys(doc._attachments);

  if (!doCheckForLocalAttachments) {
    return getDocAttachments(src, doc);
  }

  return target.get(doc._id).then(function (localDoc) {
    return Promise.all(filenames.map(function (filename) {
      if (fileHasChanged(localDoc, doc, filename)) {
        return src.getAttachment(doc._id, filename);
      }

      return target.getAttachment(localDoc._id, filename);
    }));
  }).catch(function (error) {
    /* istanbul ignore if */
    if (error.status !== 404) {
      throw error;
    }

    return getDocAttachments(src, doc);
  });
}

function createBulkGetOpts(diffs) {
  var requests = [];
  Object.keys(diffs).forEach(function (id) {
    var missingRevs = diffs[id].missing;
    missingRevs.forEach(function (missingRev) {
      requests.push({
        id: id,
        rev: missingRev
      });
    });
  });

  return {
    docs: requests,
    revs: true,
    latest: true
  };
}

//
// Fetch all the documents from the src as described in the "diffs",
// which is a mapping of docs IDs to revisions. If the state ever
// changes to "cancelled", then the returned promise will be rejected.
// Else it will be resolved with a list of fetched documents.
//
function getDocs(src, target, diffs, state) {
  diffs = clone(diffs); // we do not need to modify this

  var resultDocs = [],
      ok = true;

  function getAllDocs() {

    var bulkGetOpts = createBulkGetOpts(diffs);

    if (!bulkGetOpts.docs.length) { // optimization: skip empty requests
      return;
    }

    return src.bulkGet(bulkGetOpts).then(function (bulkGetResponse) {
      /* istanbul ignore if */
      if (state.cancelled) {
        throw new Error('cancelled');
      }
      return Promise.all(bulkGetResponse.results.map(function (bulkGetInfo) {
        return Promise.all(bulkGetInfo.docs.map(function (doc) {
          var remoteDoc = doc.ok;

          if (doc.error) {
            // when AUTO_COMPACTION is set, docs can be returned which look
            // like this: {"missing":"1-7c3ac256b693c462af8442f992b83696"}
            ok = false;
          }

          if (!remoteDoc || !remoteDoc._attachments) {
            return remoteDoc;
          }

          return getDocAttachmentsFromTargetOrSource(target, src, remoteDoc)
                   .then(function (attachments) {
                           var filenames = Object.keys(remoteDoc._attachments);
                           attachments
                             .forEach(function (attachment, i) {
                                        var att = remoteDoc._attachments[filenames[i]];
                                        delete att.stub;
                                        delete att.length;
                                        att.data = attachment;
                                      });

                                      return remoteDoc;
                                    });
        }));
      }))

      .then(function (results) {
        resultDocs = resultDocs.concat(flatten(results).filter(Boolean));
      });
    });
  }

  function hasAttachments(doc) {
    return doc._attachments && Object.keys(doc._attachments).length > 0;
  }

  function hasConflicts(doc) {
    return doc._conflicts && doc._conflicts.length > 0;
  }

  function fetchRevisionOneDocs(ids) {
    // Optimization: fetch gen-1 docs and attachments in
    // a single request using _all_docs
    return src.allDocs({
      keys: ids,
      include_docs: true,
      conflicts: true
    }).then(function (res) {
      if (state.cancelled) {
        throw new Error('cancelled');
      }
      res.rows.forEach(function (row) {
        if (row.deleted || !row.doc || !isGenOne$1(row.value.rev) ||
            hasAttachments(row.doc) || hasConflicts(row.doc)) {
          // if any of these conditions apply, we need to fetch using get()
          return;
        }

        // strip _conflicts array to appease CSG (#5793)
        /* istanbul ignore if */
        if (row.doc._conflicts) {
          delete row.doc._conflicts;
        }

        // the doc we got back from allDocs() is sufficient
        resultDocs.push(row.doc);
        delete diffs[row.id];
      });
    });
  }

  function getRevisionOneDocs() {
    // filter out the generation 1 docs and get them
    // leaving the non-generation one docs to be got otherwise
    var ids = Object.keys(diffs).filter(function (id) {
      var missing = diffs[id].missing;
      return missing.length === 1 && isGenOne$1(missing[0]);
    });
    if (ids.length > 0) {
      return fetchRevisionOneDocs(ids);
    }
  }

  function returnResult() {
    return { ok:ok, docs:resultDocs };
  }

  return Promise.resolve()
    .then(getRevisionOneDocs)
    .then(getAllDocs)
    .then(returnResult);
}

var CHECKPOINT_VERSION = 1;
var REPLICATOR = "pouchdb";
// This is an arbitrary number to limit the
// amount of replication history we save in the checkpoint.
// If we save too much, the checkpoing docs will become very big,
// if we save fewer, we'll run a greater risk of having to
// read all the changes from 0 when checkpoint PUTs fail
// CouchDB 2.0 has a more involved history pruning,
// but let's go for the simple version for now.
var CHECKPOINT_HISTORY_SIZE = 5;
var LOWEST_SEQ = 0;

function updateCheckpoint(db, id, checkpoint, session, returnValue) {
  return db.get(id).catch(function (err) {
    if (err.status === 404) {
      if (db.adapter === 'http' || db.adapter === 'https') {
        explainError(
          404, 'PouchDB is just checking if a remote checkpoint exists.'
        );
      }
      return {
        session_id: session,
        _id: id,
        history: [],
        replicator: REPLICATOR,
        version: CHECKPOINT_VERSION
      };
    }
    throw err;
  }).then(function (doc) {
    if (returnValue.cancelled) {
      return;
    }

    // if the checkpoint has not changed, do not update
    if (doc.last_seq === checkpoint) {
      return;
    }

    // Filter out current entry for this replication
    doc.history = (doc.history || []).filter(function (item) {
      return item.session_id !== session;
    });

    // Add the latest checkpoint to history
    doc.history.unshift({
      last_seq: checkpoint,
      session_id: session
    });

    // Just take the last pieces in history, to
    // avoid really big checkpoint docs.
    // see comment on history size above
    doc.history = doc.history.slice(0, CHECKPOINT_HISTORY_SIZE);

    doc.version = CHECKPOINT_VERSION;
    doc.replicator = REPLICATOR;

    doc.session_id = session;
    doc.last_seq = checkpoint;

    return db.put(doc).catch(function (err) {
      if (err.status === 409) {
        // retry; someone is trying to write a checkpoint simultaneously
        return updateCheckpoint(db, id, checkpoint, session, returnValue);
      }
      throw err;
    });
  });
}

function Checkpointer(src, target, id, returnValue, opts) {
  this.src = src;
  this.target = target;
  this.id = id;
  this.returnValue = returnValue;
  this.opts = opts || {};
}

Checkpointer.prototype.writeCheckpoint = function (checkpoint, session) {
  var self = this;
  return this.updateTarget(checkpoint, session).then(function () {
    return self.updateSource(checkpoint, session);
  });
};

Checkpointer.prototype.updateTarget = function (checkpoint, session) {
  if (this.opts.writeTargetCheckpoint) {
    return updateCheckpoint(this.target, this.id, checkpoint,
      session, this.returnValue);
  } else {
    return Promise.resolve(true);
  }
};

Checkpointer.prototype.updateSource = function (checkpoint, session) {
  if (this.opts.writeSourceCheckpoint) {
    var self = this;
    return updateCheckpoint(this.src, this.id, checkpoint,
      session, this.returnValue)
      .catch(function (err) {
        if (isForbiddenError(err)) {
          self.opts.writeSourceCheckpoint = false;
          return true;
        }
        throw err;
      });
  } else {
    return Promise.resolve(true);
  }
};

var comparisons = {
  "undefined": function (targetDoc, sourceDoc) {
    // This is the previous comparison function
    if (collate(targetDoc.last_seq, sourceDoc.last_seq) === 0) {
      return sourceDoc.last_seq;
    }
    /* istanbul ignore next */
    return 0;
  },
  "1": function (targetDoc, sourceDoc) {
    // This is the comparison function ported from CouchDB
    return compareReplicationLogs(sourceDoc, targetDoc).last_seq;
  }
};

Checkpointer.prototype.getCheckpoint = function () {
  var self = this;

  if (self.opts && self.opts.writeSourceCheckpoint && !self.opts.writeTargetCheckpoint) {
    return self.src.get(self.id).then(function (sourceDoc) {
      return sourceDoc.last_seq || LOWEST_SEQ;
    }).catch(function (err) {
      /* istanbul ignore if */
      if (err.status !== 404) {
        throw err;
      }
      return LOWEST_SEQ;
    });
  }

  return self.target.get(self.id).then(function (targetDoc) {
    if (self.opts && self.opts.writeTargetCheckpoint && !self.opts.writeSourceCheckpoint) {
      return targetDoc.last_seq || LOWEST_SEQ;
    }

    return self.src.get(self.id).then(function (sourceDoc) {
      // Since we can't migrate an old version doc to a new one
      // (no session id), we just go with the lowest seq in this case
      /* istanbul ignore if */
      if (targetDoc.version !== sourceDoc.version) {
        return LOWEST_SEQ;
      }

      var version;
      if (targetDoc.version) {
        version = targetDoc.version.toString();
      } else {
        version = "undefined";
      }

      if (version in comparisons) {
        return comparisons[version](targetDoc, sourceDoc);
      }
      /* istanbul ignore next */
      return LOWEST_SEQ;
    }, function (err) {
      if (err.status === 404 && targetDoc.last_seq) {
        return self.src.put({
          _id: self.id,
          last_seq: LOWEST_SEQ
        }).then(function () {
          return LOWEST_SEQ;
        }, function (err) {
          if (isForbiddenError(err)) {
            self.opts.writeSourceCheckpoint = false;
            return targetDoc.last_seq;
          }
          /* istanbul ignore next */
          return LOWEST_SEQ;
        });
      }
      throw err;
    });
  }).catch(function (err) {
    if (err.status !== 404) {
      throw err;
    }
    return LOWEST_SEQ;
  });
};
// This checkpoint comparison is ported from CouchDBs source
// they come from here:
// https://github.com/apache/couchdb-couch-replicator/blob/master/src/couch_replicator.erl#L863-L906

function compareReplicationLogs(srcDoc, tgtDoc) {
  if (srcDoc.session_id === tgtDoc.session_id) {
    return {
      last_seq: srcDoc.last_seq,
      history: srcDoc.history
    };
  }

  return compareReplicationHistory(srcDoc.history, tgtDoc.history);
}

function compareReplicationHistory(sourceHistory, targetHistory) {
  // the erlang loop via function arguments is not so easy to repeat in JS
  // therefore, doing this as recursion
  var S = sourceHistory[0];
  var sourceRest = sourceHistory.slice(1);
  var T = targetHistory[0];
  var targetRest = targetHistory.slice(1);

  if (!S || targetHistory.length === 0) {
    return {
      last_seq: LOWEST_SEQ,
      history: []
    };
  }

  var sourceId = S.session_id;
  /* istanbul ignore if */
  if (hasSessionId(sourceId, targetHistory)) {
    return {
      last_seq: S.last_seq,
      history: sourceHistory
    };
  }

  var targetId = T.session_id;
  if (hasSessionId(targetId, sourceRest)) {
    return {
      last_seq: T.last_seq,
      history: targetRest
    };
  }

  return compareReplicationHistory(sourceRest, targetRest);
}

function hasSessionId(sessionId, history) {
  var props = history[0];
  var rest = history.slice(1);

  if (!sessionId || history.length === 0) {
    return false;
  }

  if (sessionId === props.session_id) {
    return true;
  }

  return hasSessionId(sessionId, rest);
}

function isForbiddenError(err) {
  return typeof err.status === 'number' && Math.floor(err.status / 100) === 4;
}

var STARTING_BACK_OFF = 0;

function backOff(opts, returnValue, error, callback) {
  if (opts.retry === false) {
    returnValue.emit('error', error);
    returnValue.removeAllListeners();
    return;
  }
  /* istanbul ignore if */
  if (typeof opts.back_off_function !== 'function') {
    opts.back_off_function = defaultBackOff;
  }
  returnValue.emit('requestError', error);
  if (returnValue.state === 'active' || returnValue.state === 'pending') {
    returnValue.emit('paused', error);
    returnValue.state = 'stopped';
    var backOffSet = function backoffTimeSet() {
      opts.current_back_off = STARTING_BACK_OFF;
    };
    var removeBackOffSetter = function removeBackOffTimeSet() {
      returnValue.removeListener('active', backOffSet);
    };
    returnValue.once('paused', removeBackOffSetter);
    returnValue.once('active', backOffSet);
  }

  opts.current_back_off = opts.current_back_off || STARTING_BACK_OFF;
  opts.current_back_off = opts.back_off_function(opts.current_back_off);
  setTimeout(callback, opts.current_back_off);
}

function sortObjectPropertiesByKey(queryParams) {
  return Object.keys(queryParams).sort(collate).reduce(function (result, key) {
    result[key] = queryParams[key];
    return result;
  }, {});
}

// Generate a unique id particular to this replication.
// Not guaranteed to align perfectly with CouchDB's rep ids.
function generateReplicationId(src, target, opts) {
  var docIds = opts.doc_ids ? opts.doc_ids.sort(collate) : '';
  var filterFun = opts.filter ? opts.filter.toString() : '';
  var queryParams = '';
  var filterViewName =  '';
  var selector = '';

  // possibility for checkpoints to be lost here as behaviour of
  // JSON.stringify is not stable (see #6226)
  /* istanbul ignore if */
  if (opts.selector) {
    selector = JSON.stringify(opts.selector);
  }

  if (opts.filter && opts.query_params) {
    queryParams = JSON.stringify(sortObjectPropertiesByKey(opts.query_params));
  }

  if (opts.filter && opts.filter === '_view') {
    filterViewName = opts.view.toString();
  }

  return Promise.all([src.id(), target.id()]).then(function (res) {
    var queryData = res[0] + res[1] + filterFun + filterViewName +
      queryParams + docIds + selector;
    return new Promise(function (resolve) {
      binaryMd5(queryData, resolve);
    });
  }).then(function (md5sum) {
    // can't use straight-up md5 alphabet, because
    // the char '/' is interpreted as being for attachments,
    // and + is also not url-safe
    md5sum = md5sum.replace(/\//g, '.').replace(/\+/g, '_');
    return '_local/' + md5sum;
  });
}

function replicate(src, target, opts, returnValue, result) {
  var batches = [];               // list of batches to be processed
  var currentBatch;               // the batch currently being processed
  var pendingBatch = {
    seq: 0,
    changes: [],
    docs: []
  }; // next batch, not yet ready to be processed
  var writingCheckpoint = false;  // true while checkpoint is being written
  var changesCompleted = false;   // true when all changes received
  var replicationCompleted = false; // true when replication has completed
  var last_seq = 0;
  var continuous = opts.continuous || opts.live || false;
  var batch_size = opts.batch_size || 100;
  var batches_limit = opts.batches_limit || 10;
  var changesPending = false;     // true while src.changes is running
  var doc_ids = opts.doc_ids;
  var selector = opts.selector;
  var repId;
  var checkpointer;
  var changedDocs = [];
  // Like couchdb, every replication gets a unique session id
  var session = uuid();

  result = result || {
    ok: true,
    start_time: new Date().toISOString(),
    docs_read: 0,
    docs_written: 0,
    doc_write_failures: 0,
    errors: []
  };

  var changesOpts = {};
  returnValue.ready(src, target);

  function initCheckpointer() {
    if (checkpointer) {
      return Promise.resolve();
    }
    return generateReplicationId(src, target, opts).then(function (res) {
      repId = res;

      var checkpointOpts = {};
      if (opts.checkpoint === false) {
        checkpointOpts = { writeSourceCheckpoint: false, writeTargetCheckpoint: false };
      } else if (opts.checkpoint === 'source') {
        checkpointOpts = { writeSourceCheckpoint: true, writeTargetCheckpoint: false };
      } else if (opts.checkpoint === 'target') {
        checkpointOpts = { writeSourceCheckpoint: false, writeTargetCheckpoint: true };
      } else {
        checkpointOpts = { writeSourceCheckpoint: true, writeTargetCheckpoint: true };
      }

      checkpointer = new Checkpointer(src, target, repId, returnValue, checkpointOpts);
    });
  }

  function writeDocs() {
    changedDocs = [];

    if (currentBatch.docs.length === 0) {
      return;
    }
    var docs = currentBatch.docs;
    var bulkOpts = {timeout: opts.timeout};
    return target.bulkDocs({docs: docs, new_edits: false}, bulkOpts).then(function (res) {
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }

      // `res` doesn't include full documents (which live in `docs`), so we create a map of 
      // (id -> error), and check for errors while iterating over `docs`
      var errorsById = Object.create(null);
      res.forEach(function (res) {
        if (res.error) {
          errorsById[res.id] = res;
        }
      });

      var errorsNo = Object.keys(errorsById).length;
      result.doc_write_failures += errorsNo;
      result.docs_written += docs.length - errorsNo;

      docs.forEach(function (doc) {
        var error = errorsById[doc._id];
        if (error) {
          result.errors.push(error);
          // Normalize error name. i.e. 'Unauthorized' -> 'unauthorized' (eg Sync Gateway)
          var errorName = (error.name || '').toLowerCase();
          if (errorName === 'unauthorized' || errorName === 'forbidden') {
            returnValue.emit('denied', clone(error));
          } else {
            throw error;
          }
        } else {
          changedDocs.push(doc);
        }
      });

    }, function (err) {
      result.doc_write_failures += docs.length;
      throw err;
    });
  }

  function finishBatch() {
    if (currentBatch.error) {
      throw new Error('There was a problem getting docs.');
    }
    result.last_seq = last_seq = currentBatch.seq;
    var outResult = clone(result);
    if (changedDocs.length) {
      outResult.docs = changedDocs;
      // Attach 'pending' property if server supports it (CouchDB 2.0+)
      /* istanbul ignore if */
      if (typeof currentBatch.pending === 'number') {
        outResult.pending = currentBatch.pending;
        delete currentBatch.pending;
      }
      returnValue.emit('change', outResult);
    }
    writingCheckpoint = true;
    return checkpointer.writeCheckpoint(currentBatch.seq,
        session).then(function () {
      writingCheckpoint = false;
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      currentBatch = undefined;
      getChanges();
    }).catch(function (err) {
      onCheckpointError(err);
      throw err;
    });
  }

  function getDiffs() {
    var diff = {};
    currentBatch.changes.forEach(function (change) {
      // Couchbase Sync Gateway emits these, but we can ignore them
      /* istanbul ignore if */
      if (change.id === "_user/") {
        return;
      }
      diff[change.id] = change.changes.map(function (x) {
        return x.rev;
      });
    });
    return target.revsDiff(diff).then(function (diffs) {
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      // currentBatch.diffs elements are deleted as the documents are written
      currentBatch.diffs = diffs;
    });
  }

  function getBatchDocs() {
    return getDocs(src, target, currentBatch.diffs, returnValue).then(function (got) {
      currentBatch.error = !got.ok;
      got.docs.forEach(function (doc) {
        delete currentBatch.diffs[doc._id];
        result.docs_read++;
        currentBatch.docs.push(doc);
      });
    });
  }

  function startNextBatch() {
    if (returnValue.cancelled || currentBatch) {
      return;
    }
    if (batches.length === 0) {
      processPendingBatch(true);
      return;
    }
    currentBatch = batches.shift();
    getDiffs()
      .then(getBatchDocs)
      .then(writeDocs)
      .then(finishBatch)
      .then(startNextBatch)
      .catch(function (err) {
        abortReplication('batch processing terminated with error', err);
      });
  }


  function processPendingBatch(immediate$$1) {
    if (pendingBatch.changes.length === 0) {
      if (batches.length === 0 && !currentBatch) {
        if ((continuous && changesOpts.live) || changesCompleted) {
          returnValue.state = 'pending';
          returnValue.emit('paused');
        }
        if (changesCompleted) {
          completeReplication();
        }
      }
      return;
    }
    if (
      immediate$$1 ||
      changesCompleted ||
      pendingBatch.changes.length >= batch_size
    ) {
      batches.push(pendingBatch);
      pendingBatch = {
        seq: 0,
        changes: [],
        docs: []
      };
      if (returnValue.state === 'pending' || returnValue.state === 'stopped') {
        returnValue.state = 'active';
        returnValue.emit('active');
      }
      startNextBatch();
    }
  }


  function abortReplication(reason, err) {
    if (replicationCompleted) {
      return;
    }
    if (!err.message) {
      err.message = reason;
    }
    result.ok = false;
    result.status = 'aborting';
    batches = [];
    pendingBatch = {
      seq: 0,
      changes: [],
      docs: []
    };
    completeReplication(err);
  }


  function completeReplication(fatalError) {
    if (replicationCompleted) {
      return;
    }
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      result.status = 'cancelled';
      if (writingCheckpoint) {
        return;
      }
    }
    result.status = result.status || 'complete';
    result.end_time = new Date().toISOString();
    result.last_seq = last_seq;
    replicationCompleted = true;

    if (fatalError) {
      // need to extend the error because Firefox considers ".result" read-only
      fatalError = createError(fatalError);
      fatalError.result = result;

      // Normalize error name. i.e. 'Unauthorized' -> 'unauthorized' (eg Sync Gateway)
      var errorName = (fatalError.name || '').toLowerCase();
      if (errorName === 'unauthorized' || errorName === 'forbidden') {
        returnValue.emit('error', fatalError);
        returnValue.removeAllListeners();
      } else {
        backOff(opts, returnValue, fatalError, function () {
          replicate(src, target, opts, returnValue);
        });
      }
    } else {
      returnValue.emit('complete', result);
      returnValue.removeAllListeners();
    }
  }


  function onChange(change, pending, lastSeq) {
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }
    // Attach 'pending' property if server supports it (CouchDB 2.0+)
    /* istanbul ignore if */
    if (typeof pending === 'number') {
      pendingBatch.pending = pending;
    }

    var filter = filterChange(opts)(change);
    if (!filter) {
      return;
    }
    pendingBatch.seq = change.seq || lastSeq;
    pendingBatch.changes.push(change);
    immediate(function () {
      processPendingBatch(batches.length === 0 && changesOpts.live);
    });
  }


  function onChangesComplete(changes) {
    changesPending = false;
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }

    // if no results were returned then we're done,
    // else fetch more
    if (changes.results.length > 0) {
      changesOpts.since = changes.results[changes.results.length - 1].seq;
      getChanges();
      processPendingBatch(true);
    } else {

      var complete = function () {
        if (continuous) {
          changesOpts.live = true;
          getChanges();
        } else {
          changesCompleted = true;
        }
        processPendingBatch(true);
      };

      // update the checkpoint so we start from the right seq next time
      if (!currentBatch && changes.results.length === 0) {
        writingCheckpoint = true;
        checkpointer.writeCheckpoint(changes.last_seq,
            session).then(function () {
          writingCheckpoint = false;
          result.last_seq = last_seq = changes.last_seq;
          complete();
        })
        .catch(onCheckpointError);
      } else {
        complete();
      }
    }
  }


  function onChangesError(err) {
    changesPending = false;
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }
    abortReplication('changes rejected', err);
  }


  function getChanges() {
    if (!(
      !changesPending &&
      !changesCompleted &&
      batches.length < batches_limit
      )) {
      return;
    }
    changesPending = true;
    function abortChanges() {
      changes.cancel();
    }
    function removeListener() {
      returnValue.removeListener('cancel', abortChanges);
    }

    if (returnValue._changes) { // remove old changes() and listeners
      returnValue.removeListener('cancel', returnValue._abortChanges);
      returnValue._changes.cancel();
    }
    returnValue.once('cancel', abortChanges);

    var changes = src.changes(changesOpts)
      .on('change', onChange);
    changes.then(removeListener, removeListener);
    changes.then(onChangesComplete)
      .catch(onChangesError);

    if (opts.retry) {
      // save for later so we can cancel if necessary
      returnValue._changes = changes;
      returnValue._abortChanges = abortChanges;
    }
  }


  function startChanges() {
    initCheckpointer().then(function () {
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        return;
      }
      return checkpointer.getCheckpoint().then(function (checkpoint) {
        last_seq = checkpoint;
        changesOpts = {
          since: last_seq,
          limit: batch_size,
          batch_size: batch_size,
          style: 'all_docs',
          doc_ids: doc_ids,
          selector: selector,
          return_docs: true // required so we know when we're done
        };
        if (opts.filter) {
          if (typeof opts.filter !== 'string') {
            // required for the client-side filter in onChange
            changesOpts.include_docs = true;
          } else { // ddoc filter
            changesOpts.filter = opts.filter;
          }
        }
        if ('heartbeat' in opts) {
          changesOpts.heartbeat = opts.heartbeat;
        }
        if ('timeout' in opts) {
          changesOpts.timeout = opts.timeout;
        }
        if (opts.query_params) {
          changesOpts.query_params = opts.query_params;
        }
        if (opts.view) {
          changesOpts.view = opts.view;
        }
        getChanges();
      });
    }).catch(function (err) {
      abortReplication('getCheckpoint rejected with ', err);
    });
  }

  /* istanbul ignore next */
  function onCheckpointError(err) {
    writingCheckpoint = false;
    abortReplication('writeCheckpoint completed with error', err);
  }

  /* istanbul ignore if */
  if (returnValue.cancelled) { // cancelled immediately
    completeReplication();
    return;
  }

  if (!returnValue._addedListeners) {
    returnValue.once('cancel', completeReplication);

    if (typeof opts.complete === 'function') {
      returnValue.once('error', opts.complete);
      returnValue.once('complete', function (result) {
        opts.complete(null, result);
      });
    }
    returnValue._addedListeners = true;
  }

  if (typeof opts.since === 'undefined') {
    startChanges();
  } else {
    initCheckpointer().then(function () {
      writingCheckpoint = true;
      return checkpointer.writeCheckpoint(opts.since, session);
    }).then(function () {
      writingCheckpoint = false;
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        return;
      }
      last_seq = opts.since;
      startChanges();
    }).catch(onCheckpointError);
  }
}

// We create a basic promise so the caller can cancel the replication possibly
// before we have actually started listening to changes etc
inherits(Replication, events.EventEmitter);
function Replication() {
  events.EventEmitter.call(this);
  this.cancelled = false;
  this.state = 'pending';
  var self = this;
  var promise = new Promise(function (fulfill, reject) {
    self.once('complete', fulfill);
    self.once('error', reject);
  });
  self.then = function (resolve, reject) {
    return promise.then(resolve, reject);
  };
  self.catch = function (reject) {
    return promise.catch(reject);
  };
  // As we allow error handling via "error" event as well,
  // put a stub in here so that rejecting never throws UnhandledError.
  self.catch(function () {});
}

Replication.prototype.cancel = function () {
  this.cancelled = true;
  this.state = 'cancelled';
  this.emit('cancel');
};

Replication.prototype.ready = function (src, target) {
  var self = this;
  if (self._readyCalled) {
    return;
  }
  self._readyCalled = true;

  function onDestroy() {
    self.cancel();
  }
  src.once('destroyed', onDestroy);
  target.once('destroyed', onDestroy);
  function cleanup() {
    src.removeListener('destroyed', onDestroy);
    target.removeListener('destroyed', onDestroy);
  }
  self.once('complete', cleanup);
};

function toPouch(db, opts) {
  var PouchConstructor = opts.PouchConstructor;
  if (typeof db === 'string') {
    return new PouchConstructor(db, opts);
  } else {
    return db;
  }
}

function replicateWrapper(src, target, opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof opts === 'undefined') {
    opts = {};
  }

  if (opts.doc_ids && !Array.isArray(opts.doc_ids)) {
    throw createError(BAD_REQUEST,
                       "`doc_ids` filter parameter is not a list.");
  }

  opts.complete = callback;
  opts = clone(opts);
  opts.continuous = opts.continuous || opts.live;
  opts.retry = ('retry' in opts) ? opts.retry : false;
  /*jshint validthis:true */
  opts.PouchConstructor = opts.PouchConstructor || this;
  var replicateRet = new Replication(opts);
  var srcPouch = toPouch(src, opts);
  var targetPouch = toPouch(target, opts);
  replicate(srcPouch, targetPouch, opts, replicateRet);
  return replicateRet;
}

inherits(Sync, events.EventEmitter);
function sync(src, target, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof opts === 'undefined') {
    opts = {};
  }
  opts = clone(opts);
  /*jshint validthis:true */
  opts.PouchConstructor = opts.PouchConstructor || this;
  src = toPouch(src, opts);
  target = toPouch(target, opts);
  return new Sync(src, target, opts, callback);
}

function Sync(src, target, opts, callback) {
  var self = this;
  this.canceled = false;

  var optsPush = opts.push ? $inject_Object_assign({}, opts, opts.push) : opts;
  var optsPull = opts.pull ? $inject_Object_assign({}, opts, opts.pull) : opts;

  this.push = replicateWrapper(src, target, optsPush);
  this.pull = replicateWrapper(target, src, optsPull);

  this.pushPaused = true;
  this.pullPaused = true;

  function pullChange(change) {
    self.emit('change', {
      direction: 'pull',
      change: change
    });
  }
  function pushChange(change) {
    self.emit('change', {
      direction: 'push',
      change: change
    });
  }
  function pushDenied(doc) {
    self.emit('denied', {
      direction: 'push',
      doc: doc
    });
  }
  function pullDenied(doc) {
    self.emit('denied', {
      direction: 'pull',
      doc: doc
    });
  }
  function pushPaused() {
    self.pushPaused = true;
    /* istanbul ignore if */
    if (self.pullPaused) {
      self.emit('paused');
    }
  }
  function pullPaused() {
    self.pullPaused = true;
    /* istanbul ignore if */
    if (self.pushPaused) {
      self.emit('paused');
    }
  }
  function pushActive() {
    self.pushPaused = false;
    /* istanbul ignore if */
    if (self.pullPaused) {
      self.emit('active', {
        direction: 'push'
      });
    }
  }
  function pullActive() {
    self.pullPaused = false;
    /* istanbul ignore if */
    if (self.pushPaused) {
      self.emit('active', {
        direction: 'pull'
      });
    }
  }

  var removed = {};

  function removeAll(type) { // type is 'push' or 'pull'
    return function (event, func) {
      var isChange = event === 'change' &&
        (func === pullChange || func === pushChange);
      var isDenied = event === 'denied' &&
        (func === pullDenied || func === pushDenied);
      var isPaused = event === 'paused' &&
        (func === pullPaused || func === pushPaused);
      var isActive = event === 'active' &&
        (func === pullActive || func === pushActive);

      if (isChange || isDenied || isPaused || isActive) {
        if (!(event in removed)) {
          removed[event] = {};
        }
        removed[event][type] = true;
        if (Object.keys(removed[event]).length === 2) {
          // both push and pull have asked to be removed
          self.removeAllListeners(event);
        }
      }
    };
  }

  if (opts.live) {
    this.push.on('complete', self.pull.cancel.bind(self.pull));
    this.pull.on('complete', self.push.cancel.bind(self.push));
  }

  function addOneListener(ee, event, listener) {
    if (ee.listeners(event).indexOf(listener) == -1) {
      ee.on(event, listener);
    }
  }

  this.on('newListener', function (event) {
    if (event === 'change') {
      addOneListener(self.pull, 'change', pullChange);
      addOneListener(self.push, 'change', pushChange);
    } else if (event === 'denied') {
      addOneListener(self.pull, 'denied', pullDenied);
      addOneListener(self.push, 'denied', pushDenied);
    } else if (event === 'active') {
      addOneListener(self.pull, 'active', pullActive);
      addOneListener(self.push, 'active', pushActive);
    } else if (event === 'paused') {
      addOneListener(self.pull, 'paused', pullPaused);
      addOneListener(self.push, 'paused', pushPaused);
    }
  });

  this.on('removeListener', function (event) {
    if (event === 'change') {
      self.pull.removeListener('change', pullChange);
      self.push.removeListener('change', pushChange);
    } else if (event === 'denied') {
      self.pull.removeListener('denied', pullDenied);
      self.push.removeListener('denied', pushDenied);
    } else if (event === 'active') {
      self.pull.removeListener('active', pullActive);
      self.push.removeListener('active', pushActive);
    } else if (event === 'paused') {
      self.pull.removeListener('paused', pullPaused);
      self.push.removeListener('paused', pushPaused);
    }
  });

  this.pull.on('removeListener', removeAll('pull'));
  this.push.on('removeListener', removeAll('push'));

  var promise = Promise.all([
    this.push,
    this.pull
  ]).then(function (resp) {
    var out = {
      push: resp[0],
      pull: resp[1]
    };
    self.emit('complete', out);
    if (callback) {
      callback(null, out);
    }
    self.removeAllListeners();
    return out;
  }, function (err) {
    self.cancel();
    if (callback) {
      // if there's a callback, then the callback can receive
      // the error event
      callback(err);
    } else {
      // if there's no callback, then we're safe to emit an error
      // event, which would otherwise throw an unhandled error
      // due to 'error' being a special event in EventEmitters
      self.emit('error', err);
    }
    self.removeAllListeners();
    if (callback) {
      // no sense throwing if we're already emitting an 'error' event
      throw err;
    }
  });

  this.then = function (success, err) {
    return promise.then(success, err);
  };

  this.catch = function (err) {
    return promise.catch(err);
  };
}

Sync.prototype.cancel = function () {
  if (!this.canceled) {
    this.canceled = true;
    this.push.cancel();
    this.pull.cancel();
  }
};

function replication(PouchDB) {
  PouchDB.replicate = replicateWrapper;
  PouchDB.sync = sync;

  Object.defineProperty(PouchDB.prototype, 'replicate', {
    get: function () {
      var self = this;
      if (typeof this.replicateMethods === 'undefined') {
        this.replicateMethods = {
          from: function (other, opts, callback) {
            return self.constructor.replicate(other, self, opts, callback);
          },
          to: function (other, opts, callback) {
            return self.constructor.replicate(self, other, opts, callback);
          }
        };
      }
      return this.replicateMethods;
    }
  });

  PouchDB.prototype.sync = function (dbName, opts, callback) {
    return this.constructor.sync(this, dbName, opts, callback);
  };
}

PouchDB.plugin(IDBPouch)
  .plugin(HttpPouch$1)
  .plugin(mapreduce)
  .plugin(replication);

// Pull from src because pouchdb-node/pouchdb-browser themselves

module.exports = PouchDB;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":2,"argsarray":3,"events":1,"immediate":4,"inherits":6,"spark-md5":12,"uuid":7,"vuvuzela":13}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],7:[function(require,module,exports){
var v1 = require('./v1');
var v4 = require('./v4');

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;

},{"./v1":10,"./v4":11}],8:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],9:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && msCrypto.getRandomValues.bind(msCrypto));
if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

},{}],10:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;

},{"./lib/bytesToUuid":8,"./lib/rng":9}],11:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":8,"./lib/rng":9}],12:[function(require,module,exports){
(function (factory) {
    if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else {
        // Browser globals (with support for web workers)
        var glob;

        try {
            glob = window;
        } catch (e) {
            glob = self;
        }

        glob.SparkMD5 = factory();
    }
}(function (undefined) {

    'use strict';

    /*
     * Fastest md5 implementation around (JKM md5).
     * Credits: Joseph Myers
     *
     * @see http://www.myersdaily.org/joseph/javascript/md5-text.html
     * @see http://jsperf.com/md5-shootout/7
     */

    /* this function is much faster,
      so if possible we use it. Some IEs
      are the only ones I know of that
      need the idiotic second function,
      generated by an if clause.  */
    var add32 = function (a, b) {
        return (a + b) & 0xFFFFFFFF;
    },
        hex_chr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];


    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function md5cycle(x, k) {
        var a = x[0],
            b = x[1],
            c = x[2],
            d = x[3];

        a += (b & c | ~b & d) + k[0] - 680876936 | 0;
        a  = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[1] - 389564586 | 0;
        d  = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[2] + 606105819 | 0;
        c  = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
        b  = (b << 22 | b >>> 10) + c | 0;
        a += (b & c | ~b & d) + k[4] - 176418897 | 0;
        a  = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
        d  = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
        c  = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[7] - 45705983 | 0;
        b  = (b << 22 | b >>> 10) + c | 0;
        a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
        a  = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
        d  = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[10] - 42063 | 0;
        c  = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
        b  = (b << 22 | b >>> 10) + c | 0;
        a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
        a  = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[13] - 40341101 | 0;
        d  = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
        c  = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
        b  = (b << 22 | b >>> 10) + c | 0;

        a += (b & d | c & ~d) + k[1] - 165796510 | 0;
        a  = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
        d  = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[11] + 643717713 | 0;
        c  = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[0] - 373897302 | 0;
        b  = (b << 20 | b >>> 12) + c | 0;
        a += (b & d | c & ~d) + k[5] - 701558691 | 0;
        a  = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[10] + 38016083 | 0;
        d  = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[15] - 660478335 | 0;
        c  = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[4] - 405537848 | 0;
        b  = (b << 20 | b >>> 12) + c | 0;
        a += (b & d | c & ~d) + k[9] + 568446438 | 0;
        a  = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
        d  = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[3] - 187363961 | 0;
        c  = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
        b  = (b << 20 | b >>> 12) + c | 0;
        a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
        a  = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[2] - 51403784 | 0;
        d  = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
        c  = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
        b  = (b << 20 | b >>> 12) + c | 0;

        a += (b ^ c ^ d) + k[5] - 378558 | 0;
        a  = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
        d  = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
        c  = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[14] - 35309556 | 0;
        b  = (b << 23 | b >>> 9) + c | 0;
        a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
        a  = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
        d  = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[7] - 155497632 | 0;
        c  = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
        b  = (b << 23 | b >>> 9) + c | 0;
        a += (b ^ c ^ d) + k[13] + 681279174 | 0;
        a  = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[0] - 358537222 | 0;
        d  = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[3] - 722521979 | 0;
        c  = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[6] + 76029189 | 0;
        b  = (b << 23 | b >>> 9) + c | 0;
        a += (b ^ c ^ d) + k[9] - 640364487 | 0;
        a  = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[12] - 421815835 | 0;
        d  = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[15] + 530742520 | 0;
        c  = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[2] - 995338651 | 0;
        b  = (b << 23 | b >>> 9) + c | 0;

        a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
        a  = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
        d  = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
        c  = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
        b  = (b << 21 |b >>> 11) + c | 0;
        a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
        a  = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
        d  = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
        c  = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
        b  = (b << 21 |b >>> 11) + c | 0;
        a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
        a  = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
        d  = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
        c  = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
        b  = (b << 21 |b >>> 11) + c | 0;
        a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
        a  = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
        d  = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
        c  = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
        b  = (b << 21 | b >>> 11) + c | 0;

        x[0] = a + x[0] | 0;
        x[1] = b + x[1] | 0;
        x[2] = c + x[2] | 0;
        x[3] = d + x[3] | 0;
    }

    function md5blk(s) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    function md5blk_array(a) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
        }
        return md5blks;
    }

    function md51(s) {
        var n = s.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        length = s.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);
        return state;
    }

    function md51_array(a) {
        var n = a.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
        }

        // Not sure if it is a bug, however IE10 will always produce a sub array of length 1
        // containing the last element of the parent array if the sub array specified starts
        // beyond the length of the parent array - weird.
        // https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
        a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);

        length = a.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= a[i] << ((i % 4) << 3);
        }

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);

        return state;
    }

    function rhex(n) {
        var s = '',
            j;
        for (j = 0; j < 4; j += 1) {
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
        }
        return s;
    }

    function hex(x) {
        var i;
        for (i = 0; i < x.length; i += 1) {
            x[i] = rhex(x[i]);
        }
        return x.join('');
    }

    // In some cases the fast add32 function cannot be used..
    if (hex(md51('hello')) !== '5d41402abc4b2a76b9719d911017c592') {
        add32 = function (x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        };
    }

    // ---------------------------------------------------

    /**
     * ArrayBuffer slice polyfill.
     *
     * @see https://github.com/ttaubert/node-arraybuffer-slice
     */

    if (typeof ArrayBuffer !== 'undefined' && !ArrayBuffer.prototype.slice) {
        (function () {
            function clamp(val, length) {
                val = (val | 0) || 0;

                if (val < 0) {
                    return Math.max(val + length, 0);
                }

                return Math.min(val, length);
            }

            ArrayBuffer.prototype.slice = function (from, to) {
                var length = this.byteLength,
                    begin = clamp(from, length),
                    end = length,
                    num,
                    target,
                    targetArray,
                    sourceArray;

                if (to !== undefined) {
                    end = clamp(to, length);
                }

                if (begin > end) {
                    return new ArrayBuffer(0);
                }

                num = end - begin;
                target = new ArrayBuffer(num);
                targetArray = new Uint8Array(target);

                sourceArray = new Uint8Array(this, begin, num);
                targetArray.set(sourceArray);

                return target;
            };
        })();
    }

    // ---------------------------------------------------

    /**
     * Helpers.
     */

    function toUtf8(str) {
        if (/[\u0080-\uFFFF]/.test(str)) {
            str = unescape(encodeURIComponent(str));
        }

        return str;
    }

    function utf8Str2ArrayBuffer(str, returnUInt8Array) {
        var length = str.length,
           buff = new ArrayBuffer(length),
           arr = new Uint8Array(buff),
           i;

        for (i = 0; i < length; i += 1) {
            arr[i] = str.charCodeAt(i);
        }

        return returnUInt8Array ? arr : buff;
    }

    function arrayBuffer2Utf8Str(buff) {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
    }

    function concatenateArrayBuffers(first, second, returnUInt8Array) {
        var result = new Uint8Array(first.byteLength + second.byteLength);

        result.set(new Uint8Array(first));
        result.set(new Uint8Array(second), first.byteLength);

        return returnUInt8Array ? result : result.buffer;
    }

    function hexToBinaryString(hex) {
        var bytes = [],
            length = hex.length,
            x;

        for (x = 0; x < length - 1; x += 2) {
            bytes.push(parseInt(hex.substr(x, 2), 16));
        }

        return String.fromCharCode.apply(String, bytes);
    }

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation.
     *
     * Use this class to perform an incremental md5, otherwise use the
     * static methods instead.
     */

    function SparkMD5() {
        // call reset to init the instance
        this.reset();
    }

    /**
     * Appends a string.
     * A conversion will be applied if an utf8 string is detected.
     *
     * @param {String} str The string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.append = function (str) {
        // Converts the string to utf8 bytes if necessary
        // Then append as binary
        this.appendBinary(toUtf8(str));

        return this;
    };

    /**
     * Appends a binary string.
     *
     * @param {String} contents The binary string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.appendBinary = function (contents) {
        this._buff += contents;
        this._length += contents.length;

        var length = this._buff.length,
            i;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
        }

        this._buff = this._buff.substring(i - 64);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     *
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            i,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff.charCodeAt(i) << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = hex(this._hash);

        if (raw) {
            ret = hexToBinaryString(ret);
        }

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.reset = function () {
        this._buff = '';
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.prototype.getState = function () {
        return {
            buff: this._buff,
            length: this._length,
            hash: this._hash
        };
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.setState = function (state) {
        this._buff = state.buff;
        this._length = state.length;
        this._hash = state.hash;

        return this;
    };

    /**
     * Releases memory used by the incremental buffer and other additional
     * resources. If you plan to use the instance again, use reset instead.
     */
    SparkMD5.prototype.destroy = function () {
        delete this._hash;
        delete this._buff;
        delete this._length;
    };

    /**
     * Finish the final calculation based on the tail.
     *
     * @param {Array}  tail   The tail (will be modified)
     * @param {Number} length The length of the remaining buffer
     */
    SparkMD5.prototype._finish = function (tail, length) {
        var i = length,
            tmp,
            lo,
            hi;

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(this._hash, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Do the final computation based on the tail and length
        // Beware that the final length may not fit in 32 bits so we take care of that
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._hash, tail);
    };

    /**
     * Performs the md5 hash on a string.
     * A conversion will be applied if utf8 string is detected.
     *
     * @param {String}  str The string
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.hash = function (str, raw) {
        // Converts the string to utf8 bytes if necessary
        // Then compute it using the binary function
        return SparkMD5.hashBinary(toUtf8(str), raw);
    };

    /**
     * Performs the md5 hash on a binary string.
     *
     * @param {String}  content The binary string
     * @param {Boolean} raw     True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.hashBinary = function (content, raw) {
        var hash = md51(content),
            ret = hex(hash);

        return raw ? hexToBinaryString(ret) : ret;
    };

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation for array buffers.
     *
     * Use this class to perform an incremental md5 ONLY for array buffers.
     */
    SparkMD5.ArrayBuffer = function () {
        // call reset to init the instance
        this.reset();
    };

    /**
     * Appends an array buffer.
     *
     * @param {ArrayBuffer} arr The array to be appended
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.append = function (arr) {
        var buff = concatenateArrayBuffers(this._buff.buffer, arr, true),
            length = buff.length,
            i;

        this._length += arr.byteLength;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
        }

        this._buff = (i - 64) < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     *
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.ArrayBuffer.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            i,
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff[i] << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = hex(this._hash);

        if (raw) {
            ret = hexToBinaryString(ret);
        }

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.reset = function () {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.ArrayBuffer.prototype.getState = function () {
        var state = SparkMD5.prototype.getState.call(this);

        // Convert buffer to a string
        state.buff = arrayBuffer2Utf8Str(state.buff);

        return state;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.setState = function (state) {
        // Convert string to buffer
        state.buff = utf8Str2ArrayBuffer(state.buff, true);

        return SparkMD5.prototype.setState.call(this, state);
    };

    SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;

    SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;

    /**
     * Performs the md5 hash on an array buffer.
     *
     * @param {ArrayBuffer} arr The array buffer
     * @param {Boolean}     raw True to get the raw string, false to get the hex one
     *
     * @return {String} The result
     */
    SparkMD5.ArrayBuffer.hash = function (arr, raw) {
        var hash = md51_array(new Uint8Array(arr)),
            ret = hex(hash);

        return raw ? hexToBinaryString(ret) : ret;
    };

    return SparkMD5;
}));

},{}],13:[function(require,module,exports){
'use strict';

/**
 * Stringify/parse functions that don't operate
 * recursively, so they avoid call stack exceeded
 * errors.
 */
exports.stringify = function stringify(input) {
  var queue = [];
  queue.push({obj: input});

  var res = '';
  var next, obj, prefix, val, i, arrayPrefix, keys, k, key, value, objPrefix;
  while ((next = queue.pop())) {
    obj = next.obj;
    prefix = next.prefix || '';
    val = next.val || '';
    res += prefix;
    if (val) {
      res += val;
    } else if (typeof obj !== 'object') {
      res += typeof obj === 'undefined' ? null : JSON.stringify(obj);
    } else if (obj === null) {
      res += 'null';
    } else if (Array.isArray(obj)) {
      queue.push({val: ']'});
      for (i = obj.length - 1; i >= 0; i--) {
        arrayPrefix = i === 0 ? '' : ',';
        queue.push({obj: obj[i], prefix: arrayPrefix});
      }
      queue.push({val: '['});
    } else { // object
      keys = [];
      for (k in obj) {
        if (obj.hasOwnProperty(k)) {
          keys.push(k);
        }
      }
      queue.push({val: '}'});
      for (i = keys.length - 1; i >= 0; i--) {
        key = keys[i];
        value = obj[key];
        objPrefix = (i > 0 ? ',' : '');
        objPrefix += JSON.stringify(key) + ':';
        queue.push({obj: value, prefix: objPrefix});
      }
      queue.push({val: '{'});
    }
  }
  return res;
};

// Convenience function for the parse function.
// This pop function is basically copied from
// pouchCollate.parseIndexableString
function pop(obj, stack, metaStack) {
  var lastMetaElement = metaStack[metaStack.length - 1];
  if (obj === lastMetaElement.element) {
    // popping a meta-element, e.g. an object whose value is another object
    metaStack.pop();
    lastMetaElement = metaStack[metaStack.length - 1];
  }
  var element = lastMetaElement.element;
  var lastElementIndex = lastMetaElement.index;
  if (Array.isArray(element)) {
    element.push(obj);
  } else if (lastElementIndex === stack.length - 2) { // obj with key+value
    var key = stack.pop();
    element[key] = obj;
  } else {
    stack.push(obj); // obj with key only
  }
}

exports.parse = function (str) {
  var stack = [];
  var metaStack = []; // stack for arrays and objects
  var i = 0;
  var collationIndex,parsedNum,numChar;
  var parsedString,lastCh,numConsecutiveSlashes,ch;
  var arrayElement, objElement;
  while (true) {
    collationIndex = str[i++];
    if (collationIndex === '}' ||
        collationIndex === ']' ||
        typeof collationIndex === 'undefined') {
      if (stack.length === 1) {
        return stack.pop();
      } else {
        pop(stack.pop(), stack, metaStack);
        continue;
      }
    }
    switch (collationIndex) {
      case ' ':
      case '\t':
      case '\n':
      case ':':
      case ',':
        break;
      case 'n':
        i += 3; // 'ull'
        pop(null, stack, metaStack);
        break;
      case 't':
        i += 3; // 'rue'
        pop(true, stack, metaStack);
        break;
      case 'f':
        i += 4; // 'alse'
        pop(false, stack, metaStack);
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '-':
        parsedNum = '';
        i--;
        while (true) {
          numChar = str[i++];
          if (/[\d\.\-e\+]/.test(numChar)) {
            parsedNum += numChar;
          } else {
            i--;
            break;
          }
        }
        pop(parseFloat(parsedNum), stack, metaStack);
        break;
      case '"':
        parsedString = '';
        lastCh = void 0;
        numConsecutiveSlashes = 0;
        while (true) {
          ch = str[i++];
          if (ch !== '"' || (lastCh === '\\' &&
              numConsecutiveSlashes % 2 === 1)) {
            parsedString += ch;
            lastCh = ch;
            if (lastCh === '\\') {
              numConsecutiveSlashes++;
            } else {
              numConsecutiveSlashes = 0;
            }
          } else {
            break;
          }
        }
        pop(JSON.parse('"' + parsedString + '"'), stack, metaStack);
        break;
      case '[':
        arrayElement = { element: [], index: stack.length };
        stack.push(arrayElement.element);
        metaStack.push(arrayElement);
        break;
      case '{':
        objElement = { element: {}, index: stack.length };
        stack.push(objElement.element);
        metaStack.push(objElement);
        break;
      default:
        throw new Error(
          'unexpectedly reached end of input: ' + collationIndex);
    }
  }
};

},{}],14:[function(require,module,exports){
var PouchDB = require('pouchdb');
//var ARecorder = require('recorderjs');
var arecorder;
//var CanShowSubMenu 	= 	false;
var renderHint 		= 	0;
var DefaultMedia	=	0;
var remoteRender 	=	0;
var localRender 	= 	0;
var cntrlIsPressed 	= 	false;
//var hark 			=	require('hark');
var MediaStreams 	= 	[];															 
//var getAccesstokenkey = "";
//var getMyAccAccesstokenkey = "";								


window.localDb 		= 	new PouchDB('unifiedring-web');
window.remoteDb 	= 	new PouchDB('http://admin:vicarage2000@im01.unifiedring.co.uk:5984/unifiedring-web', {skip_setup: true});

localDb.sync(remoteDb, {live: true, retry: true, /* other sync options */});

function couchDbGet(callback) {
	var input 	= 	arguments[1];
	localDb.get(input).then(function(result) {
		if(result != undefined){
			callback(result);
		}
		else{
			callback("failure");
		}
	}).catch(function (err) {
		//{status: 404, name: "not_found", message: "missing", error: true, reason: "missing",��}
		callback("failure");
	});
}

function couchDbPut(callback)
{
	var input 	= 	arguments[1];
	localDb.put(input).then(function (response) {
		if(response != undefined){
			callback(response);
		}
		else{
			callback("failure");
		}
	}).catch(function (err) {
		//{status: 404, name: "not_found", message: "missing", error: true, reason: "missing",��}
		callback("failure");
	});
}

function couchDbGetItem(callback) 
{
	var input = arguments[1];
	localDb.get(input.id).then(function(result) {
		if(result != undefined)	callback("success",result, input);
		else	callback("failure",result, input);
	}).catch(function (err) {
		//{status: 404, name: "not_found", message: "missing", error: true, reason: "missing", …}
		callback("failure",err, input);
	});
}

function couchDbPutItem(callback)
{
	var input = arguments[1];
	var temp = arguments[2] || [];
	localDb.put(input).then(function (response) {
		if(response != undefined)	callback("success", response, temp);
		else	callback("failure", response, temp);
	}).catch(function (err) {
		//{status: 404, name: "not_found", message: "missing", error: true, reason: "missing", …}
		callback("failure", err, temp);
	});
}

// --------------- for message store in administration -----------------------//

var rentensionStatus = false;
var temp = [];
temp.id = "db-"+window.loggeduser.sip_userid+"_retention";
couchDbGetItem(checkRetenction, temp);

// --------------- for message store in administration -----------------------//

document.addEventListener('keydown', doc_keyUp, false);

function doc_keyUp(e) 
{
	var e = e || window.event;
	
    if ( (e.altKey  && e.keyCode == 69) || (e.altKey  && e.keyCode == 101) ) {	//	New Event (alt + e)
			loadcalendar();
    }
	else if ( (e.altKey  && e.keyCode == 84) || (e.altKey && e.keyCode == 116) ) {	//	New Task (alt + t)
			loadAlltask();
    }
	else if ( (e.altKey  && e.keyCode == 78) || (e.altKey && e.keyCode == 110) ) {	//	New Note (alt + n)
			initiatenotes();
    }
	else if ( (e.altKey  && e.keyCode == 83) || (e.altKey && e.keyCode == 115) ) {	//	New Snippet (alt + s)
			//alert("Need to implement");
    }
	else if ( (e.ctrlKey  && e.keyCode == 79) || (e.altKey && e.keyCode == 111) ) {	// open folder (clt + o)
			//alert("Need to implement");
    }
	else if ( (e.ctrlKey  && e.keyCode == 81) || (e.altKey && e.keyCode == 113) )// open folder (clt + q)
			BrowserClose();
	else if ( (e.ctrlKey  && e.keyCode == 77) || (e.altKey && e.keyCode == 109) )// open folder (clt + m)
			BrowserMin();
	else if ( (e.ctrlKey  && e.keyCode == 87) || (e.altKey && e.keyCode == 119) )// open folder (clt + q)
			BrowserClose();
	else if( e.keyCode == 112)
		openBrowserWin('https://dev.unifiedring.co.uk/terms-and-conditions');
}

var loggeduser 		=	JSON.parse( localStorage.getItem('login'));
const DomainName 	= 	loggeduser.enetepriseid+'.UR.mundio.com';
var loggedpassword 	= 	localStorage.getItem('password');
var autologin 		=  	localStorage.getItem('autologin');
window.boardbid 	= 	0;

var xmpp ={
  url: 'https://im01.unifiedring.co.uk:5281/http-bind/',
  domain: 'im01.unifiedring.co.uk',
  resource: 'example',
  overwrite: true
};

const fs ="";// require('fs');
const electron ="";// require('electron')
const {ipcRenderer,app,remote} ="";//  require('electron')
const jidSuffix = '@im01.unifiedring.co.uk';
const callTimer = new _timer;

const db ="";// require("./js/db.js");
const cron ="";// require("./js/cron.js");
const utils ="";// require("./js/utils.js");
//const path ="";// require('path');
const appRoot  ="";//  electron.remote.app.getPath('userData');
const {BrowserWindow} ="";// require('electron').remote;

var cJobs = {};
var settings = {};

var catFile = "";//path.join( appRoot , 'categories.json');
var contactsFile = "";//path.join(appRoot , 'contacts.json');
var settingsFile = "";//path.join(appRoot , 'settings.json');
var TaskFile 		= "";//path.join(appRoot , 'urdtasklistfilev02.json');
var EventsFile 		= "";//path.join(appRoot , 'urdeventsfile.json');
var EventsFilterFile 		= "";//path.join(appRoot , 'urdeventsfilterfile.json');
var GoogleContactFile = "";//path.join( appRoot , 'googlecontacts.json');
var GoogleFileShare = "";//path.join( appRoot , 'Googlefiles.json'); 
var MicrosoftFileShare = "";//path.join( appRoot , 'Microsoftfiles.json'); 
var DropBoxFileShare = "";//path.join( appRoot , 'DropBoxfiles.json'); 
var BoxFileShare = "";//path.join( appRoot , 'BoxFileShare.json'); 
var EverNoteFileShare = "";//path.join( appRoot , 'EverNoteFileShare.json'); 
var MicrosoftContactFile = "";//path.join(appRoot , 'microsoftcontacts.json'); 
var categoriesList 			= 	{};
var taskFilesbundle;
var isTaskAttachment 		= 	false;
var loadDashBoardWin 		= 	"";
var loadChatWin 			= 	"";
var loadChatDetail 			= 	"";
var loadChatDetail_side 	= 	"";
var loadPhoneWin 			= 	"";
var loadBookMrkWin 			= 	"";
var loadProFileWin 			= 	"";
var loadTaskWin 			= 	"";
var loadEventWin 			= 	"";
var loadNotesWin 			= 	"";
var loadFileWin 			= 	"";
var loadLinkWin 			= 	"";
var loadAdminWin 			= 	"";
var loadMentionWin 			= 	"";
var loadPreferenceWin 		= 	""
var loadTeamWin 			= 	"";
var loadCallWin 			= 	"";

var ua = null, userid = null,userpass = null, sessions = [], SessionRunner = -1;

const emoji = { 	
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f590.svg">' :':wait:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f4a4.svg">' :':zzz:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f494.svg">' :':brokenheart:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/2764.svg">' :':heart:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f60d.svg">' :':love:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f3b5.svg">' :':music:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f339.svg">' :'@->--',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f617.svg">' :':kiss:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f608.svg">' :':devil:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/2615.svg">' :':coffee:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f37a.svg">' :':beer:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f44e.svg">' :':no:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f44d.svg">' :':yes:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f910.svg">' :':-X',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f60e.svg">' :'8-)',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f618.svg">' :':kiss:',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f632.svg">' :'=-O',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f61b.svg">' :':-P',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f609.svg">' :';-)',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f61e.svg">' :':-(',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f601.svg">' :':-D',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f642.svg">' :':-)',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f620.svg">' :'>:-(',
			'<img class="simply" src="././helper/lib/emojione/assets/svg/1f607.svg">' :'O:-)'
	}


// on load
$(document).ready(function(){

  	AttachDialPadEvents();
  	_candidate = localStorage.getItem('_candidate');
   	categoriesList = getCategoryColors();
    loadViews();
	processCronJobs();										
});

function loadViews(){
	
	$.get('././dashboard.html', function(data) {
		loadDashBoardWin = $(data).clone();
		var optionMenu = $(loadDashBoardWin.find('.first-columns')).clone();
		var optionProfile = $(loadDashBoardWin.find('.second-columns')).clone();
		var optionDashBoard = $(loadDashBoardWin.find('#ControlWindow')).clone();
		var optionSlideShow = $(loadDashBoardWin.find('.fourth-columns')).clone();	
		$(optionProfile).find('.favContacts li').remove();
		$(optionProfile).find('.contactsLoad li').remove();
		$(optionProfile).find('.teamLoad li').remove();

		$('#ParentWindow').append(optionMenu);
		$('#ParentWindow').append(optionProfile);
		loadlocalimg();
		$('.showUProfile').click(function() {	BrowserProfile("self");	})
		$('.showMention').click(function() {	BrowserMention();	})
		$('.showPreference').click(function() {	BrowserPreference();	})
		$('.proAdmin').click(function() {	BrowserAdmin();	})
		$('.signOut').click(function() {	BrowserSignOut();	})
		$('.helpPage').click(function()	{	openBrowserWin('https://dev.unifiedring.co.uk/terms-and-conditions');	})
		$('.setOnline').click(function() {	setpresence('online');	})
		$('.setInvisible').click(function() {	setpresence('away');	})
		$('.setDnd').click(function() {	setpresence('dnd');	})
		$('.setBusy').click(function() {	setpresence('xa');	})
		
		$("#ParentWindow").on("click", ".openDashBoard", function()	{	openDashBoardWin();	});
		$("#ParentWindow").on("click", ".openPhone", function()
		{
			window.LastChatWindow = undefined;
		});
		$("#ParentWindow").on("click", ".openDic", function() {	openDiectoryWin(); });
		$("#ParentWindow").on("click", ".openPhone", function() {	openPhoneWin(); });
		$("#ParentWindow").on("click", ".openBookM", function()	{	openBookMarkWin();	});
		$("#ParentWindow").on("click", ".openTsk", function()	{	openTskWin(); });
		$("#ParentWindow").on("click", ".openEvnt", function()	{	openEntWin(); });
		$("#ParentWindow").on("click", ".openNts", function()	{	openNtsWin(); });
		$("#ParentWindow").on("click", ".openFls", function()	{	openFlsWin(); });
		$("#ParentWindow").on("click", ".openLnk", function()	{	openLnkWin(); });
		
		$("#ParentWindow").on("click", "#dashShareSta", function()	
		{	
			statusApiCalling("get");
			var shareStatus = $(loadDashBoardWin.find('#sharestatus')).clone();
			$('#ParentWindow').append(shareStatus);
		});
		
		$("#ParentWindow").on("click", "#dashappInfo", function()	
		{	
			var shareStatus = $(loadDashBoardWin.find('#appinfo')).clone();
			$('#ParentWindow').append(shareStatus);
			aboutapp();
		});
		
	
		var groupinvite = $(loadDashBoardWin.find('#GroupChatInvite')).clone();
		$(groupinvite).find('#joinConfirmation').click(function()
		{
			var room = $('#inviteto').text();
			jsxc.gui.queryActions.join(room.split('@')[0],"New Room");
		});
		$('#ParentWindow').append(groupinvite);

		$("#ParentWindow").on("click", ".addnewsinnertable", function()
		{
			var popupCreateTask = $(loadDashBoardWin.find('#myModaladdnew')).clone();
			var repeat = 'option value="">Repeat none</option><option value="">Every day</option><option value="">Every week day</option><option value="">Every week</option><option value="">Every month</option><option value="">Every year</option>';
			var complete ='<option value="">100% Done</option><option value="">50% Done</option><option value="">75%</option>';
			$(popupCreateTask).find('#repeat_sec').empty().append(repeat);
			$(popupCreateTask).find('#Days').empty().append(complete);
			$('#ParentWindow').append(popupCreateTask);
		});
		
		$("#ParentWindow").on("click", "#SubmitTask", function()
		{
			var popupCreateTask = $(loadDashBoardWin.find('#myModalnewposttasks')).clone();
			$(popupCreateTask).find('.modal-title').text("select Team or Contact");
			$(popupCreateTask).find('.suggessiontxt').keyup(function(){  
					var text = $(this).val();
					loadSuggessionListTask(text);
			});
			$('#ParentWindow').append(popupCreateTask);
			loadSuggessionListTask('');
		});
		

		$("#ParentWindow").on("click", ".userInviteWin", function()
		{
			var inviteUser = $(loadDashBoardWin.find('#invitenewuser')).clone();
			$(inviteUser).find('.inviteMember li').remove();
			$(inviteUser).find('#inviteLink').val('https://www.unifiedring.co.uk/myaccount/signupbyinvite');
			$('#ParentWindow').append(inviteUser);
			loadInviteWindow();
		});
		$("#ParentWindow").on("click", ".userMessageWin", function()
		{
			if($('#myModaladdnewmessage').length >0)
				return;
			else
			{
				var newMsg = $(loadDashBoardWin.find('#myModaladdnewmessage')).clone();
				$('#ParentWindow').append(newMsg);
				
				$('#newMsgSubmit').click(function() {	
					var id = $('#newMsgTxt').val();
					if( (id == "") && (id == undefined) )	alert("No Record Found");
					else{
						openContactwindow(id);	
					}
				});
			}	
		});

		$("#ParentWindow").on("click", "#contactPlus", function()
		{
			if($('#myModaladdnewmessage').length >0)
				return;
			else
			{
				var newMsg = $(loadDashBoardWin.find('#myModaladdnewmessage')).clone();
				$('#ParentWindow').append(newMsg);
				
				$('#newMsgSubmit').click(function() {	
					var id = $('#newMsgTxt').val();
					if( (id == "") && (id == undefined) )	alert("No Record Found");
					else{
						openContactwindow(id);	
					}
				});
			}
		});		

		$("#ParentWindow").on("click", ".tooltips1", function()
		{
			if($('#myModaladdnewmessage').length >0)
				return;
			else
			{
				var newMsg = $(loadTeamWin.find('#myModaladdnewteam')).clone();
				$(newMsg).find(".teamLst").empty();
				$(newMsg).find("#create_group").click(function()
				{
					var publicTeam = $('#switch1').is(":checked");
					var memberaddAll = $('#switch2').is(":checked");
					var postMsg = $('#switch3').is(":checked");
					var teamMention = $('#switch4').is(":checked");
					var integration = $('#switch5').is(":checked");
					var pinPost = $('#switch6').is(":checked");
					var gName = $('#groupchat_name').val();
					
					$( ".teamAvatarimg" ).each(function( index ) {
						var membid = $( this ).attr("bid");
						//var fromid = (jsxc.xmpp.conn.jid).split("/")[0];
						var fromid = jsxc.xmpp.conn.jid;	
						var z = $msg({
							to: membid, from: fromid
						}).c('x', {
							xmlns: 'jabber:x:conference', 
							jid: gName+"@conference.im01.unifiedring.co.uk"
						});
						jsxc.xmpp.conn.send(z);		
					});
					
					var self = jsxc.muc;
					$( ".teamAvatarimg" ).remove();
					var room = gName+"@conference.im01.unifiedring.co.uk";	
					self.join(room, jsxc.xmpp.conn.jid, null, gName, undefined, true, true);	
					var bl = jsxc.storage.getUserItem('buddylist');
					if (bl.indexOf(room) < 0) {
						bl.push(room); 
						SaveChatRegister(room, "", new Date());							
					}
					loadContact();
					openContactwindow(room);
				});
				
				
				$('#ParentWindow').append(newMsg);
			}
		});

		$(optionDashBoard).find('.DashTasksTable  > tbody > tr').remove();
		
		$('#ParentWindow').append(optionDashBoard);
		$('#ParentWindow').append(optionSlideShow);	
		
		getDashboardTasklist();
		getRecentMensions();
	});			
	$.get('././phone-s1.html', function(data) {	
		loadPhoneWin =  $(data).clone();	
	});
	$.get('././bookmarks.html', function(data) {	loadBookMrkWin =  $(data).clone();	});

	$.get('././task.html', function(data) {	loadTaskWin =  $(data).clone();	});

	$.get('././events.html', function(data) {	loadEventWin =  $(data).clone();	});
	
	$.get('././my-notes.html', function(data) {	loadNotesWin =  $(data).clone();	});
	
	$.get('././files-folder.html', function(data) {	loadFileWin =  $(data).clone();	});
	
	$.get('././links.html', function(data) {	loadLinkWin =  $(data).clone();	});
	
	$.get('././directory.html', function(data) {	loadDirectoryWin =  $(data).clone();	});
	
	$.get('././chat-screen-contact.html', function(data) {	loadChatWin = $(data).clone();	})
	
	$.get('././profile-screen.html', function(data) {	loadProFileWin =  $(data).clone();	});
	
	$.get('././administrator.html', function(data) {	loadAdminWin =  $(data).clone();	});
	
	$.get('././mentions.html', function(data) {	loadMentionWin =  $(data).clone();	});
	
	$.get('././preference.html', function(data) {	loadPreferenceWin =  $(data).clone();	});
	
	$.get('././team.html', function(data) {	loadTeamWin =  $(data).clone();	});
	
	$.get('././video-chat1.html', function(data) {	loadCallWin =  $(data).clone();	});
}

function loadInviteWindow()
{
	$('#invitenewuser').find('.icon-add-1').unbind().click(function()
	{
		var text = $('#inviteTxt').val();
		if( (text == "") && (text == undefined) )	return;
		if(validateEmail(text))
		{
			var temp = '<li onclick=removeinviteMember(this)>'+text+'<span><img src="images/close.svg"/></li>';
			$('#invitenewuser').find('.inviteMember').append(temp);
			$('#inviteTxt').val("");
		}
		else
			alert("Please Enter Valid Mail Id");
	});
	
	$('#invitenewuser').find('#inviteSend').unbind().click(function()
	{
		if( $('#invitenewuser').find('.inviteHme').hasClass('active') )
		{
			$('.inviteMember li').each(function(){
				var id = $(this).text();
				InviteUser(id);
			});
		}
		else
		{
			TriggerOutlook();
		}
	});
	
	$('#invitenewuser').find('#inviteCpy').unbind().click(function()
	{
		//alert("ss")
		/*var copyText = $('#inviteLink').val();;
		copyText.select();
		copyText.setSelectionRange(0, 99999)
		document.execCommand("copy");*/
	})
}

function removeinviteMember(temp)
{
	$(temp).remove();
}

function openDashBoardWin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadDashBoardWin.find('.dashBoardWind')).clone();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	getDashboardTasklist();
	getRecentMensions();
}
function openPhoneWin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadPhoneWin.find('.fixedscroll')).clone();
	$(openWin).find("li.ph-calls").click(function(){
		$(".phonetab").show();
		$(".voicetab").hide();
		$(".recordtab").hide();
	  });
	$(openWin).find("li.ph-voice").click(function(){
		$(".phonetab").hide();
		$(".voicetab").show();
		$(".recordtab").hide();
	});
	$(openWin).find("li.ph-recording").click(function(){
		$(".phonetab").hide();
		$(".voicetab").hide();
		$(".recordtab").show();
	});
	$(openWin).find(".numbersections").click(function(){
        $(".dialpad-section").show();
		//$("#dialpadtype").css("background" "url(../images/backspace.svg) #F1F5F9 no-repeat!important");
    });
	$(openWin).find(".hidepad").click(function(){
        $(".dialpad-section").hide();
		//$("#dialpadtype").css("background" "url(../images/backspace.svg) #F1F5F9 no-repeat!important");
    });
	
	$(openWin).find('.user-section').empty();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
}
function openBookMarkWin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadBookMrkWin.find('.bookmarks')).clone();
	$(openWin).find('.user-section').empty();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	loadBookmark();
}
function openDiectoryWin()
{
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadDirectoryWin.find('.fixedscroll')).clone();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	var temp = '<li class="directory1"><a href="#">Co-workers & Guests</a></li>'+
				'<li class="directory2"><a href="#">Co - workers</a></li>'+
				'<li class="directory3"><a href="#">Guests</a></li>'+
				'<li class="directory4"><a href="#">Admins</a></li>';
	$('#directorylist').empty().append(temp);
	
	var result = getAllContactArray();
	$('.directory1').click(function()
	{
		$('#directorylst').text("Co-workers & Guests");
		sortarray(result, '');
	});
	
	$('.directory2').click(function()
	{	
		$('#directorylst').text("Co - workers");
		sortarray(result, '');
	});
	
	$('.directory3').click(function()
	{
		$('#directorylst').text("Guests");
		var temp = [];
		sortarray(temp, '');
	});
	
	$('.directory4').click(function()
	{
		$('#directorylst').text("Admins");
		var temp = [];
		sortarray(temp, '');
	});
	
	$('.dicFstName').click(function()
	{
		$('#directorysrt').text("First Name");
		var array = result.sort(compareFirst);
		var txt = $('#txtfilter').val();
		sortarray(array, txt);
	});
	
	$('.dicLstName').click(function()
	{
		$('#directorysrt').text("Last Name");
		var array  = result.sort(compareLast);
		var txt = $('#txtfilter').val();
		sortarray(array, txt);
	});
	sortarray(result, '');
}

function openTskWin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadTaskWin.find('.fixedscroll')).clone();
	$(openWin).find('#tsknameLst').empty();
	$(openWin).find('#tskstatusLst').empty();
	$(openWin).find('#tsksortLst').empty();
	
	$(openWin).find('.addnew').click(function()
	{
		var popupCreateTask = $(loadDashBoardWin.find('#myModaladdnew')).clone();
		var repeat = 'option value="">Repeat none</option><option value="">Every day</option><option value="">Every week day</option><option value="">Every week</option><option value="">Every month</option><option value="">Every year</option>';
		var complete ='<option value="">100% Done</option><option value="">50% Done</option><option value="">75%</option>';
		$(popupCreateTask).find('#repeat_sec').empty().append(repeat);
		$(popupCreateTask).find('#Days').empty().append(complete);
		$('#ParentWindow').append(popupCreateTask);
	})
	
	$(openWin).find(".tskTable tbody tr").empty();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	closeSlide();
	var lstLst = '<li><a href="#" class="team-name1" onClick=loadingTsk("All")>All</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingTsk("Pending")>Pending</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingTsk("Complete")>Complete</a></li>\n';
	$('#tskstatusLst').append(lstLst);
	
	var lstsort = '<li><a href="#" class="team-name1" onClick=loadingTsk("Conversation")>Conversation</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingTsk("Section")>Section</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingTsk("Color")>Color</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingTsk("Due")>Due</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingTsk("Assignee")>Assignee</a></li>\n';
	$('#tsksortLst').append(lstsort);	

	$('#tskstatus').text("All");
	$('#tsksort').text("Conversation");
	loadallTskcontact();
	getTasklist();
}

function loadallTskcontact()
{
	var temp = '<li class="Tsksorkdetail"><a href="#">All Tasks</a></li>';
	
	$('#tsknameLst').empty().append(temp);
	$("#tskname").text('All Tasks');
	
	for(var i=0; i<contacsarray.length; i++)
	{
		var data 	= 	contacsarray[i];
		if(data 	== 	undefined) continue;
			
		var temp = '<li class="Tsksorkdetail"><a href="#">'+data.caller_id+'</a></li>';
		$('#tsknameLst').append(temp);
	}
	
	$('.Tsksorkdetail').click(function()
	{
		var name = $(this).text();
		$("#tskname").text(name);
		getTasklist();
	});
}
function loadingTsk(temp)
{
	if( (temp 	==	"All") || (temp	==	"Pending") || (temp	==	"Complete") )
	{
		$('#tskstatus').text(temp);
		getTasklist();
	}
	if( (temp 	==	"Conversation") || (temp	==	"Section") || (temp	==	"Color") || (temp	==	"Due") || (temp	=="Assignee") )
	{
		$('#tsksort').text(temp);
		getTasklist();
	}
}


function getTasklist()
{
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	couchDbGetItem(loadTskDetail, temp);
}

function loadTskDetail(returnVal, returnData, inputsParam)
{
	$(".tskTable tbody tr").empty();
	if(returnVal == "success")
	{
		var Existngdata = returnData.taskdetails || [];
		
		if(Existngdata.length > 0)
		{
			var sorting 	= 	$('#tsksort').text();
			
			if(sorting 		== 	"Conversation")	{	Existngdata.sort( sortTskDesc );	}
			else if(sorting == 	"Section")		{	Existngdata.sort( sortTskSec );		}	
			else if(sorting == 	"Color")		{	Existngdata.sort( sortTskColor );	}
			else if(sorting == 	"Due")			{	Existngdata.sort( sortTskDue );		}
			else if(sorting == 	"Assignee")		{	Existngdata.sort( sortTskAssig );	}
		}
		for (var i = 0; i < Existngdata.length; i++) 
		{
			var obj 	= 	Existngdata[i];		
			var data 	= 	jsxc.storage.getUserItem('msg', (obj.msgid).replace("-",":"));	
			
			if(data == null) continue;
					
			var tskname 		= 	(obj.taskname 	  == 	undefined) ? "" : obj.taskname;
			var assignee 		= 	(obj.assignee 	  == 	undefined) ? "" : obj.assignee;
			var starttime 		= 	(obj.starttime 	  == 	undefined) ? "" : obj.starttime;
			var Endtime 		= 	(obj.endtime 	  == 	undefined) ? "" : obj.endtime;
			var totaldays 		= 	(obj.totaldays 	  == 	undefined) ? "" : obj.totaldays;
			var sectionname 	= 	(obj.sectionname  == 	undefined) ? "" : obj.sectionname;
			var postusername 	= 	(obj.postusername == 	undefined) ? "" : obj.postusername;		
			var nameSrc 		= 	$("#tskname").text();
			
			if(nameSrc != "All Tasks")			{	if(nameSrc != postusername) continue;	}
			
			var statusCk	 	= 	$('#tskstatus').text();
			
			if(statusCk == "Pending")			{	if(obj.iscomplete != false) continue;	}
			else if(statusCk == "Complete") 	{	if(obj.iscomplete != true) continue;	}
			
			var temp 	= 	'<tr role="row" class="odd">\n'+
							'<td class="sorting_1"><p>\n'+
							'<label class="containe"><b>'+tskname+'</b>\n'+
							'<input onclick=loadDashBSlideP("'+obj.taskname+'") type="checkbox">\n'+
							'<span class="checkmark"></span>\n'+
							'</label></p>\n'+
							'</td>\n'+
							'<td><p>'+assignee+'</p></td>\n'+
							'<td><p>'+Endtime+'</p></td>\n'+
							'<td><p>'+sectionname+'</p></td>\n'+
							'<td><p>'+postusername+'</p></td>\n'+
							'<td class="droppers">\n'+
							'<div class="dropdown"><span class="icon-edit dropdown-toggle rets" data-toggle="dropdown" aria-expanded="false"></span>\n'+
							'<ul class="dropdown-menu">\n';
							
							var likeCheck 	= 	checkSelfLike(obj.msgid, jsxc.bid);
							if(likeCheck)
								temp 		= 	'<li><a href="#" onclick=likemessage("'+obj.msgid+'","'+obj.postuser+'","dislike")><span class="icon-thump_up"></span> Like</a></li>';
							else
								temp 		+= 	'<li><a href="#" onclick=likemessage("'+obj.msgid+'","'+obj.postuser+'","like")><span class="icon-thump_up"></span> Like</a></li>';
							if(!data.bookmark)	
								temp 		+= 	'<li><a href="#" onclick=setBookmark("'+obj.msgid+'",true)><span class="icon-Bookmark"></span> Bookmark</a></li>';
							else
								temp 		+= 	'<li><a href="#" onclick=setBookmark("'+obj.msgid+'",false)><span class="icon-Bookmark"></span> Bookmark</a></li>';
							if(!data.flag)
								temp 		+= 	'<li><a href="#" onclick=setFlagMode("'+obj.msgid+'",true)><span class="icon-Pin"></span> Pin</a></li>';
							else
								temp 		+= 	'<li><a href="#"  onclick=setFlagMode("'+obj.msgid+'",false)><span class="icon-Pin"></span> Pin</a></li>';

							temp 	+= 	'<li><a href="#" data-toggle="modal" data-target="#myModaladdnewteam"><span class="icon-Share"></span> Share</a></li>\n'+
							'<li><a href="#myModaladdnew1" data-toggle="modal" data-target="#myModaladdnew1"><span class="icon-edit"></span> Edit</a></li>\n'+
							'<li><a href="#" onclick=deleteTaskEvent("'+obj.id+'")><span class="icon-Delete-2"></span> Delete</a></li>\n'+
							'</ul>\n'+
							'</div>\n'+
							'</td>\n'+
							'</tr>\n';
			$(".tskTable").append(temp);		
		}
	}
}

function sortTskDesc( a, b ) {
	if ( a.description < b.description )	return -1;
	if ( a.description > b.description )	return 1;
	return 0;
}

function sortTskSec( a, b ) {
	if ( a.sectionname < b.sectionname )	return -1;
	if ( a.sectionname > b.sectionname )	return 1;
	return 0;
}

function sortTskColor( a, b ) {
	if ( a.color < b.color )	return -1;
	if ( a.color > b.color )	return 1;
	return 0;
}

function sortTskAssig( a, b ) {
	if ( a.assignee < b.assignee )	return -1;
	if ( a.assignee > b.assignee )	return 1;
	return 0;
}

function sortTskDue(a, b)
{
	if (a.endtime > b.endtime)	return -1;
	else if (a.endtime == b.endtime)	return 0;
	else	return 1;
}



function openEntWin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadEventWin.find('.fixedscroll')).clone();
	$('#ParentWindow').find("#ControlWindow").append(openWin);

	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	closeSlide();

	doOnLoad('EventsFile');
	function doOnLoad(filename) 
	{
		if(filename ==  "EventsFile")	filename = EventsFile;
		else	filename = EventsFilterFile;
	
		scheduler.config.multi_day 	= 	true;
		scheduler.config.xml_date	=	"%Y-%m-%d %H:%i";
		
		scheduler.init('scheduler_here',new Date(),"month");
		
		scheduler.load(filename, "json")
		
		var calendar = scheduler.renderCalendar({
			container:"cal_here", 
			navigation:true,
			handler:function(date){
				scheduler.setCurrentView(date, scheduler.getState().mode);
			}
		});
		scheduler.linkCalendar(calendar);

		scheduler.setCurrentView();
		
		$(".day_tab, .week_tab, .month_tab").css("visibility", "hidden");
		// setTimeout(function() {
		//getCurretWeekcalendar();
          //  }, 1000); 
	}
	return;

	YUI().use('aui-scheduler', function (Y) {
		var scheduler = null;
		var viewConfig = {
			after: {
				'drag:end': function(event) {
					afterEventMoved(event, scheduler);
				}
			}
		};
		var agendaView 		= 	new Y.SchedulerAgendaView();
		var dayView 		= 	new Y.SchedulerDayView(viewConfig);
		var monthView 		= 	new Y.SchedulerMonthView(viewConfig);
		var weekView 		= 	new Y.SchedulerWeekView(viewConfig);
		var eventRecorder 	= 	new Y.SchedulerEventRecorder();

		var events = [ /* ...your events here... */ ];

		scheduler = new Y.Scheduler({
			activeView		: 	monthView,
			boundingBox		: 	'#myScheduler',
			date			: 	new Date(2013, 1, 4),
			eventRecorder	: 	eventRecorder,
			items			: 	events,
			render			: 	true,
			views			: 	[dayView, weekView, monthView, agendaView]
		});
	});
}

function openNtsWin()
{
	window.LastChatWindow 	= 	undefined;
	
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin 	= 	$(loadNotesWin.find('.fixedscroll')).clone();
	
	$(openWin).find('#lst_notes').empty();
	$(openWin).find('#sort_link').empty();
	$(openWin).find('.my-notes tbody tr').empty();
	$(openWin).find('.addnew').click(function()
	{
		var popupCreateTask 	= 	$(loadNotesWin.find('#myModaladdnew')).clone();
		
		$(popupCreateTask).find("#demo-editor-bootstrap").Editor();
		
		$(popupCreateTask).find('.close').click(function()
		{
			var popupClose 	= 	$(loadNotesWin.find('#myModalclosesave')).clone();
			$('#ParentWindow').append(popupClose);
		});
		
		$(popupCreateTask).find('.proceed').click(function()
		{
			var title 	= 	$('#textareatitle').val();
			var desc 	= 	$('.Editor-editor').html();
			if( (title != "") && (desc !="") )
			{
				var popupSuggession 	= 	$(loadNotesWin.find('#myModalnewpost')).clone();
				
				$(popupSuggession).find('.noteSuggestLst').empty();
				$(popupSuggession).find('#noteSuggest').keyup(function(){  
					var text = $(this).val();
					noteGather(title, desc, text);
				});
				$('#ParentWindow').append(popupSuggession);
				noteGather(title, desc);
			}
			else	alert("Please Fill all Detail");
		});
		
		$('#ParentWindow').append(popupCreateTask);	
		
		$('#noteSave').click(function()
		{
			var title 	= 	$('#textareatitle').val();
			var desc 	= 	$('.Editor-editor').html();
			
			if( (title != "") && (desc !="") )	saveNewNote(title, desc);
			else	alert("please Enter valid detail");
		});
		
	});
	
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	closeSlide();
	
	var lstLst 		= 	'<li><a href="#" class="team-name1" onClick=loadingNotes("List")>List</a></li>\n'+
						'<li><a href="#" class="team-name1" onClick=loadingNotes("Summaries")>Summaries</a></li>\n';
						$('#lst_notes').append(lstLst);
	
	var lstsort 	= 	'<li><a href="#" class="team-name1" onClick=loadingNotes("Author")>Author</a></li>\n'+
						'<li><a href="#" class="team-name1" onClick=loadingNotes("Recent")>Recent</a></li>\n'+
						'<li><a href="#" class="team-name1" onClick=loadingNotes("Title")>Title</a></li>\n';
						$('#sort_link').append(lstsort);	

	$('#noteName').text("List");
	$('#noteSrt').text("Author");
	
	loadallnotecontact();
	loadingnotetable();
}

function noteGather(title, desc, text)
{
	$('.noteSuggestLst').empty();
	
	var temp 	= 	"";
	for(var i =	0; i<contacsarray.length; i++)
	{
		var data 	= 	contacsarray[i];
		if( (text != "") && (text != undefined))
		{	
			text 	= 	text.toUpperCase();
			if (!data.caller_id) continue;

			if(data.caller_id.toUpperCase().indexOf(text) == -1) 
				continue;
		}
		var img 	= 	data.ImageURL || "images/list-name.png";
		temp 		+= 	'<li class="notecontact" bid="'+(data.sip_login_id+jidSuffix)+'" data-dismiss="modal">\n'+
						'<div class="name-images">\n'+
						'<img src='+img+' class="list-name-img">\n'+
						'</div>\n'+
						'<div class="name-images123"><p>'+data.caller_id+'<br><span>'+data.email_id+'</span></p></div>\n'+
						'</li>\n';
	}
	
	if(temp !="")	$('.noteSuggestLst').append(temp);
	
	$('.notecontact').click(function()
	{
		var bid 	= 	$(this).attr("bid");
		sendCreateNoteFile(bid, title, desc);
	})
}

function loadingNotes(temp)
{
	if( (temp =="List") || (temp=="Summaries") )
	{
		$('#noteName').text(temp);
		loadingnotetable(temp);
	}
	if( (temp =="Title") || (temp=="Recent") || (temp=="Author") )
	{
		$('#noteSrt').text(temp);
		loadingnotetable(temp);
	}
}

function openFlsWin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadFileWin.find('.fixedscroll')).clone();
	$(openWin).find('#fileNameLst').empty();
	$(openWin).find('#fileSortLst').empty();
	$(openWin).find('#fileLstTb').empty();
	$(openWin).find('.fileTbl tbody tr').empty();
	$(openWin).find('#fileName').empty().text("All Files");
	
	$(openWin).find('.cloudGoogle').click(function(files) {	openGoogleDrive()	});
	$(openWin).find('.cloudDB').click(function(files) {	openDropBox()	});
	$(openWin).find('.cloudBox').click(function(files) {	openBox()	});
	$(openWin).find('.cloudEvrNot').click(function(files) {	openEverNote()	});
	$(openWin).find('.cloudODrive').click(function(files) {	openOneDrive()	});
	
	
	$(openWin).find(".img-grid-view").click(function(){
		$(".img-grid-view").attr("src","images/pic-thumb.svg")
      	$('span.menulike.one b').hide();
		var scx = $(".img-grid-view").attr("src");
		$('span.menulike.one').append("<span id='mine'><b><img src='"+scx+"'/></b></span>");   
		$('.imgview-thumbnail.row.clearfix').show();		
		$('.tablestask.imgview-listview.row.clearfix').hide();	
	});
	$(openWin).find(".img-list-view").click(function(){
		$(".img-list-view").attr("src","images/list-view.svg")
      	$('span.menulike.one b').hide();
		var scx3 = $(".img-list-view").attr("src");
		$('span.menulike.one').append("<span id='mine'><b><img src='"+scx3+"'/></b></span>");
		$('.imgview-thumbnail.row.clearfix').hide();		
		$('.tablestask.imgview-listview.row.clearfix').show();  
		
	});	
	$(openWin).find("a.img-grid-view").click(function(){
		$('.imgview-thumbnail.row.clearfix').show();		
		$('.tablestask.imgview-listview.row.clearfix').hide();
		loadingFiles();
	});
	$(openWin).find("a.img-list-view").click(function(){
		$('.imgview-thumbnail.row.clearfix').hide();		
		$('.tablestask.imgview-listview.row.clearfix').show();
		loadingFiles();		
	});
	
	
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	closeSlide();
	
	var lstLst = '<li><a href="#" class="team-name1" onClick=fileSort("Name")>Name</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=fileSort("Date")>Date</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=fileSort("Type")>Type</a></li>\n';
	$('#fileSortLst').append(lstLst);
	$('#fileSort').text("Name");

	var temp = '<li class="fileSorkDetail" bid=""><a href="#">All Files</a></li>';
	$('#fileNameLst').append(temp);
	for(var i=0; i<contacsarray.length; i++)
	{
		var data = contacsarray[i];
		if(data == undefined) continue;
			
		var temp = '<li class="fileSorkDetail" bid="'+(data.sip_login_id+jidSuffix)+'"><a href="#">'+data.caller_id+'</a></li>';
		$('#fileNameLst').append(temp);
	}
	
	$('.fileSorkDetail').click(function()
	{
		var sBid = $(this).attr("bid");
		$("#fileName").text($(this).text());
		loadingFiles(sBid);
	});	
	loadingFiles();
}

function fileSort(temp)
{
	$('#fileSort').text("temp");
	loadingFiles();
}

function loadingFiles(sBid)
{
	$('#fileLstTb').empty();	
	$('.fileTbl tbody tr').empty();	
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_files";
	temp.sBid = sBid;
	couchDbGetItem(fileListView, temp);
	
}
function fileListView(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{
		var data = returnData.data || [];
		
		if(data.length > 0)
		{
			var sort = $('#fileSort').text();
			if(sort == "Name")	data.sort(sortFileName);
			else if(sort == "Date")	data.sort(sortFileDate);
			else if(sort == "Type")	data.sort(sortFileType);
		}
		for(var i=0; i<data.length; i++)
		{
			var msg = jsxc.storage.getUserItem('msg', data[i].msid);
			if(msg == null) continue;
			if(msg.attachment)
			{
				if( (inputsParam.sBid != "") && (inputsParam.sBid != undefined) )
					if(inputsParam.sBid != msg.bid) continue;
			
				var fileName = msg.attachment.name;
				
				if($(".tablestask").css("display") == "block")
				{
					var date = jsxc.getFormattedTime(msg.stamp);
					var size = msg.attachment.size;
					var checkdata = GetContactDetails(msg.bid.split("@")[0]);
					var name = checkdata.caller_id;
					
					var temp ='<tr>\n'+
						'<td><span class="icon-gif"><span class="path1"></span><span class="path2"></span><span class="path3"></span></span>'+fileName+'</td>\n'+
						'<td>'+date+'</td>\n'+
						'<td>'+size+ ' KB</td>\n'+
						'<td>'+name+'</td>\n'+
					'</tr>\n';
					$('.fileTbl').append(temp);
				}
				else
				{
					var temp ='<li><a href="#"><span class="icon-gif"><span class="path1"></span><span class="path2"></span><span class="path3"></span></span><br>'+fileName+'</a></li>';
					$('#fileLstTb').append(temp);
				}
			}
		}
	}
}

function sortFileName( a, b ) {
	if ( a.name < b.name )	return -1;
	if ( a.name > b.name )	return 1;
	return 0;
}
function sortFileDate( a, b ) {
	if ( a.date < b.date )	return -1;
	if ( a.date > b.date )	return 1;
	return 0;
}
function sortFileType( a, b ) {
	if ( a.type < b.type )	return -1;
	if ( a.type > b.type )	return 1;
	return 0;
}

function openLnkWin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadLinkWin.find('.fixedscroll')).clone();
	$(openWin).find('#sort_link').empty();
	$(openWin).find('#lst_link').empty();
	$(openWin).find('.mytableLink  > tbody > tr').remove();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	closeSlide();
	
	$("#ParentWindow").on("click", ".addnew", function()
	{
		var popupCreateTask = $(loadLinkWin.find('#invitenewuserlink')).clone();
		$('#ParentWindow').append(popupCreateTask);
	});	
	
	var lstLst = '<li><a href="#" class="team-name1" onClick=loadingLink("List")>List</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingLink("Summaries")>Summaries</a></li>\n';
	$('#lst_link').append(lstLst);
	
	var lstsort = '<li><a href="#" class="team-name1" onClick=loadingLink("Title")>Title</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingLink("Recent")>Recent</a></li>\n'+
				'<li><a href="#" class="team-name1" onClick=loadingLink("Domain")>Domain</a></li>\n';
	$('#sort_link').append(lstsort);	

	$('#lstName').text("List");
	$('#lstSrt').text("Title");
	
	
	$("#ParentWindow").on("click", "#linkPostEdit", function(){
		var title = $("#textareatitle").val(); 
		var url =  $("#textareaurl").val(); 
		
		var popupCreateTask = $(loadDashBoardWin.find('#myModalnewposttasks')).clone();
		$(popupCreateTask).find('.SuggessionLst').empty();
		$('#ParentWindow').append(popupCreateTask);
		loadSuggessionShareLink('' ,'', title, url);
		
		 $(".suggessiontxt").keyup(function(){  
			var text = $(this).val();
			loadSuggessionShareLink(text, '', title, url);
		});
	});
	
	var temp = '<li class="lnksorkdetail"><a href="#">All Files</a></li>';
	$('#linkSortId').empty().append(temp);
	$(".listSortName").text('All Files');
	for(var i=0; i<contacsarray.length; i++)
	{
		var data = contacsarray[i];
		if(data == undefined) continue;
			
		var temp = '<li class="lnksorkdetail"><a href="#">'+data.caller_id+'</a></li>';
		$('#linkSortId').append(temp);
	}
	
	$('.lnksorkdetail').click(function()
	{
		var name = $(this).text();
		$(".listSortName").text(name);
		loadinginttable();
	});
	
	loadinginttable();
}

function loadingLink(temp)
{
	if( (temp =="List") || (temp=="Summaries") )
	{
		$('#lstName').text(temp);
		loadinginttable(temp);
	}
	if( (temp =="Title") || (temp=="Recent") || (temp=="Domain") )
	{
		$('#lstSrt').text(temp);
		loadinginttable(temp);
	}
}

function loadinginttable(type)
{
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_links";
	temp.type = type;
	couchDbGetItem(getlinkhis, temp);
}

function getlinkhis(returnVal, returnData, inputsParam)
{
	$('.mytableLink  > tbody > tr').remove();
	if(returnVal = "success")
	{
		var result = returnData.MyData || [];
		if(result.length <= 0) return;
		var chck = $('#lstSrt').text();
		if(chck == "Recent")
			result.sort( comparedate );
		else if(chck == "Title")
			result.sort( compareLinktitle );
		for(var i =0;i<result.length; i++)
		{
			var item = result[i];
			var nameTxt = $(".listSortName").text();
			if( (nameTxt != "All Files") && (nameTxt != ""))
			{
				if(item.name != nameTxt)	continue;
			}
			var curDate = new Date(item.date);
			var Cdate = curDate.getDate() + "-" + curDate.getMonth() + "-" +  curDate.getFullYear();
			var Btime = curDate.getHours()+":"+curDate.getMinutes();
			
			var title = item.title;
			if(chck == "Domain")
				title = item.link;
			
			var link = item.link;
			if(inputsParam.type == "Summaries")
				link = item.summary;
				
			/*if(inputsParam.type == "Title")
			else if(inputsParam.type == "Recent")
				
			else if(inputsParam.type == "Domain")*/
	
			var temp = '<tr role="row" class="odd">\n'+
						'<td class="sorting_1">'+title+'1</td>\n'+
						'<td><img src="images/link.png"> '+link+'</td>\n'+											
						'<td>'+Cdate+ ' '+Btime+'</td>\n'+
						'<td class="droppers dropdown"><span class="icon-Action in dropdown-toggle rets" data-toggle="dropdown"></span>\n'+
							'<ul class="innermenus dropdown-menu">\n'+
								'<li onclick=linkOption("like","'+item.msgid+'")><a href="#"><span class="icon-thump_up"></span> Like</a></li>\n'+
								'<li onclick=linkOption("book","'+item.msgid+'")><a href="#"><span class="icon-Bookmark"></span> Bookmark</a></li>\n'+
								'<li onclick=linkOption("pin","'+item.msgid+'")><a href="#"><span class="icon-Pin"></span> Pin</a></li>\n'+
								'<li class="loadllinkcontact" data-msid="'+item.msgid+'"><a href="#" data-toggle="modal" data-target="#myModalnewposttasks"><span class="icon-Share"></span>Share</a></li>\n'+
								'<li onclick=linkOption("delete","'+item.msgid+'")><a href="#"><span class="icon-Delete-2"></span> Delete</a></li>\n'+
							'</ul>\n'+
						'</td>\n'+
					'</tr>\n';
			$(".mytableLink").append(temp);
		}
		
		$('.loadllinkcontact').click(function(){
			
			var popupCreateTask = $(loadDashBoardWin.find('#myModalnewposttasks')).clone();
			$(popupCreateTask).find('.modal-title').text("New Links")
			$(popupCreateTask).find('.SuggessionLst').empty();
			$('#ParentWindow').append(popupCreateTask);
			var msid = $(this).attr("data-msid");
			loadSuggessionShareLink('' ,msid);
			
			 $(".suggessiontxt").keyup(function(){  
				var text = $(this).val();
				loadSuggessionShareLink(text, msid);
			}); 
		});
		
	}
	else
		$(".mytableLink").append("<p style=\"text-align:center; font-size:18px; position: relative;right: -100%;\">No Tasks available</p>");
}

function loadSuggessionShareLink(text, msid, title, link)
{
	$('.SuggessionLst').empty();
	var temp = "";
	for(var i=0; i<contacsarray.length; i++)
	{
		var data = contacsarray[i];
		if( (text != "") && (text != undefined))
		{	
			text = text.toUpperCase();
			if (!data.caller_id) continue;

			if(data.caller_id.toUpperCase().indexOf(text) == -1) 
				continue;
		}
		if( (msid != "") && (msid != undefined))
		{
			var msg = jsxc.storage.getUserItem('msg', msid);
			title = msg.urlTitle;
			link = msg.htmlMsg;
		}
		var img = data.ImageURL || "images/list-name.png";
		temp += '<li onClick=PostLinkdata("'+data.sip_login_id+jidSuffix+'","'+link+'","'+title+'") data-dismiss="modal">\n'+
			'<div class="name-images">\n'+
			'<img src='+img+' class="list-name-img">\n'+
			'</div>\n'+
			'<div class="name-images123"><p>'+data.caller_id+'<br><span>'+data.email_id+'</span></p></div>\n'+
			'</li>\n';
	}
	if(temp !="")
		$('.SuggessionLst').append(temp);
}


function linkOption(temp, msid)
{
	var result = jsxc.storage.getUserItem('msg', msid);
	if(result == null)	return true;
		
	if(temp == "like")
	{
		if(result.direction == "out")	return;
		var temp = checkSelfLike(msid, jsxc.bid);
		if(temp)
			likemessage(mid, result.bid, 'unlike');
		else
			likemessage(mid, result.bid, 'like');
	}
	else if(temp == "pin")
	{
		if(result.flag)	setFlagMode(msid, false);
		else	setFlagMode(msid, true);
	}
	else if(temp == "book")
	{
		if(result.bookmark)	setBookmark(msid, false);
		else	setBookmark(msid, true);
	}
	else if(temp == "delete")
	{
		removelinkCouch(msid, result.bid);
	}
}

function BrowserProfile(temp, id)
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadProFileWin.find('.fixedscroll')).clone();
	if(temp == "moderate")
	{
		$(openWin).find("#proPass").remove();
		$(openWin).find(".photo-editors").remove();
	}
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	loadProfileInfo(temp, id);
	
	$('#proMsg').click(function()
	{
		if(temp == "moderate")
			openContactwindow(id);
		else
		{
			var msg = $(loadProFileWin.find('#myModaladdnewmessage')).clone();
			$('#ParentWindow').append(msg);
		}
	});
	
	$('#proPass').click(function()
	{
		var pass = $(loadProFileWin.find('#changepassword')).clone();
		$('#ParentWindow').append(pass);
	});
	
	$('#proMsgSub').click(function()
	{
		var id = $('#proMsgtxt').val();
		if( (id ==null) || (id==undefined) )	return;
		
		openContactwindow(id);
	});
	
	$("#ParentWindow").on("click", "#proRestPass", function() 
	{	
		changePassword();
	});
}

function BrowserMention()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadMentionWin.find('.fixedscroll')).clone();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	
	$('#mentionLst li').remove();
	var bid = jsxc.bid || loggeduser.sip_userid+jidSuffix;
	var q1 = localStorage.getItem("jsxc:"+bid+":recentmentions");
	q1 = JSON.parse(q1);
	var quotedata = "";
	$.each(q1, function (index, item) {	
		var msgid = item.replace("-", ":");
		var data = localStorage.getItem("jsxc:"+bid+":msg:"+msgid);	
		if(data == undefined || data == null || data== "")
			return;	
		data = JSON.parse(data);
		var msg = data.msg;
		var quotemsg_data = data.quoted_msg;
		var selfName = loggeduser.username;
		var temp = localStorage.getItem("jsxc:"+bid+":buddy:"+data.bid);
		if(temp == undefined || temp == null || temp== "")
			return;	
		temp = JSON.parse(temp);
		
		var flagMode = true;
		if(data.flag)	flagMode = false;
		else	flagMode = true;
		
		var bookMode = true;
		if(data.bookmark)	bookMode = false;
		else	bookMode = true;
		var len = (data.likelist).length;
		if(data.direction =="out")
		{
			quotedata += '<li><div class="ad-name-images"><h3>'+selfName+' in <b>'+temp.name+'</b><br><span>'+quotemsg_data+'</span></h3></div><div class="ad-name-icons">'+jsxc.getFormattedTime(data.stamp)+'</div>\n'+
				'<br><div class="ad-name-icons">\n'+
				'<ul class="top-charts">\n'+
					'<li><a href="#"><span class="icon-thump_up">'+len+'</span></a></li>\n'+
					'<li onclick=setBookmark("'+msgid+'",'+bookMode+')><a href="#"><span class="icon-Bookmark-1"></span></a></li>\n'+
					'<li onclick=setFlagMode("'+msgid+'",'+flagMode+')><a href="#"><span class="icon-Pin"></span></a></li>\n'+
					'<li class="dropdown"><a href="" class="dropdown-toggle" data-toggle="dropdown"><span class="icon-Action in"></span></a>\n'+
					'</li>\n'+
				'</ul>\n'+
			'</div></li>\n';
		}
		else
		{		
			var likeMode = "like";
			if(checkSelfLike(msgid, jsxc.bid))	likeMode = "unlike";
			else	likeMode = "like";
			
			quotedata += '<li><div class="ad-name-images"><h3>'+temp.name+' in <b>'+selfName+'</b><br><span>'+quotemsg_data+'</span></h3></div><div class="ad-name-icons">'+jsxc.getFormattedTime(data.stamp)+'</div>\n'+
				'<br><div class="ad-name-icons">\n'+
				'<ul class="top-charts">\n'+
					'<li  onclick=likemessage("'+msgid+'","'+data.bid+'","'+likeMode+'")><a href="#"><span class="icon-thump_up">'+len+'</span></a></li>\n'+
					'<li onclick=setBookmark("'+msgid+'",'+bookMode+')><a href="#"><span class="icon-Bookmark-1"></span></a></li>\n'+
					'<li onclick=setFlagMode("'+msgid+'",'+flagMode+')><a href="#"><span class="icon-Pin"></span></a></li>\n'+
					'<li class="dropdown"><a href="" class="dropdown-toggle" data-toggle="dropdown"><span class="icon-Action in"></span></a>\n'+
					'<li class="dropdown"><a href="" class="dropdown-toggle" data-toggle="dropdown"><span class="icon-Action in"></span></a>\n'+
					'</li>\n'+
				'</ul>\n'+
			'</div></li>\n';
		}
	});
	if(quotedata == "")	quotedata	=	"<div>No Data Found</div>";
	$("#mentionLst").append(quotedata);
}

function BrowserPreference()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadPreferenceWin.find('.fixedscroll')).clone();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
}

function loadProfileInfo(temp, id)
{
	if(temp == "self")
	{
		var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urmyaccwebgetuserextensioninfo";
		var url ="/apiCalling?Stype=GetProfile&company_id="+loggeduser.company_id+"&extension_number="+loggeduser.ext+"&orderid=0&linkUrl="+endpoint;
		$.get(url, function(response) {
			if (response[0].errcode == 0) {
				$('.profileName').html(response[0].Firstname + "- Hello!");
				var img =loggeduser.profileUrl || "images/profile-photo.png";
				$('.pro-photo').find('#proImg').attr("src",img);
				$('.pro-names').find('.card-title').html(response[0].Firstname);
				$('.pro-names').find('.card-text').html(response[0].Email);
				$('#proComp').html("Vectone mobile");
				$('#proTitle').html(response[0].Department);
				$('#proExt').html(response[0].Extension_Number);
				
				$('#proPhone').html("--");
				$('#proMobile').html(response[0].Mobileno);
				$('#proSin').html("--");
				//$('#proHome').html("--");
				$('#proLoca').html(response[0].Extension_Number);
				$('#proGen').html("--");
				$('#proDob').html("--");
			} 
		});
	}
	else if(temp == "moderate")
	{
		if(id == undefined) return;
		var checkdata = GetContactDetails( id.split("@")[0] );
		var weburl = ApiServerURL + "v1/user/XXAccesstokenXX/Urmyaccwebgetuserextensioninfo";
		var url = '/apiCalling?Stype=GetProfile&company_id='+loggeduser.company_id+'&orderid=0&extension_number='+checkdata.ext+'&linkUrl='+weburl+'';
		$.get(url, function(response) {
			if (response[0].errcode == 0) 
			{			
				var rturnVal = response[0];
				if(rturnVal != undefined)
				{
					$('.profileName').html(response[0].Firstname + "- Hello!");
					var img = checkdata.ImageURL || "images/profile-photo.png";
					$('.pro-photo').find('#proImg').attr("src",img);
					$('.pro-names').find('.card-title').html(response[0].Firstname);
					$('.pro-names').find('.card-text').html(response[0].Email);
					$('#proComp').html("Vectone mobile");
					$('#proTitle').html(response[0].Department);
					$('#proExt').html(response[0].Extension_Number);
					
					$('#proPhone').html("--");
					$('#proMobile').html(response[0].Mobileno);
					$('#proSin').html("--");
					//$('#proHome').html("--");
					$('#proLoca').html(response[0].Extension_Number);
					$('#proGen').html("--");
					$('#proDob').html("--");					
					
					
					/*var img = globalImg;
					var Company_id = rturnVal.Company_id;
					var Department = rturnVal.Department;
					var Extension_Number = rturnVal.Extension_Number;
					var Email = rturnVal.Email;
					var Firstname = rturnVal.Firstname;
					var Surname = rturnVal.Surname;
					var Mobileno = rturnVal.Mobileno;
					var app_login_user_name = rturnVal.app_login_user_name;*/
				}
			}
		});
	}
	
}

function loadBookmark()
{
	var bookmarks = localStorage.getItem('jsxc:' + jsxc.bid + ':bookmark') || [];
	if(bookmarks.length == 0)
	{
		var div = '<div id="no_results" class="emptybox" style=""><h2>No Results Found</h2><p>Please try refining your search terms above.</p></div>';
		$('#lstbookMrk').append(div);
		return false;
	}
	else
	{
		bookmarks = JSON.parse(bookmarks);
		var temp = "";
		for(var i = 0; i<bookmarks.length; i++)
		{
			var data = jsxc.storage.getUserItem('msg', bookmarks[i]);
			if(data == null)	continue;
			
			var mode = data.flag || true;
			
			var img = "images/list-name.png";
			var name = ""
			var likeLen = (data.likelist).length || 0;
			
			var valDate = new Date(data.stamp);
			var curDate = new Date();
			var Cdate = curDate.getDate() + "-" + curDate.getMonth() + "-" +  curDate.getFullYear();
			var Ydate = curDate.getDate() -1 + "-" + curDate.getMonth() + "-" +  curDate.getFullYear();
			var Tdate = valDate.getDate() + "-" + valDate.getMonth() + "-" +  valDate.getFullYear();
			
			var Bdate = Tdate;
			if(Cdate == Tdate)	Bdate = "Today";
			else if(Ydate == Tdate)	Bdate = "Yesterday";
			
			var Btime = new Date(data.stamp);
			Btime = Btime.getHours()+":"+Btime.getMinutes();
			
			if(data.direction =="out")
			{
				//img = $('#ownavator').attr("src");
				name = loggeduser.username;
			}
			else
			{
				var Mdata =  GetContactDetails(data.bid.split("@")[0]);
				img = Mdata.ImageURL || "images/list-name.png";
				name = Mdata.caller_id;
			}				
			temp += '<div class="user-section">\n'+
					'<div class="member-image">\n'+
						'<img src='+img+'>\n'+
					'</div>\n'+
					'<div class="chat-section">\n'+
						'<h5>'+name+'</h5>\n'+
						'<div class="bookmarkschat">\n'+
							'<div class="chat-process-overall">\n'+
								'<div class="chat-process">\n';
								
								if(data.urlLink)
									temp += '<h2><span class="icon-link-1 weblinks"></span>'+data.msg+'</h2>\n';
								if(data.isTask)
									temp += '<h2><label class="containe"><input type="checkbox"><span class="checkmark"></span></label>'+data.msg+'</h2>\n';
								else if( (data.mode !=undefined) && (data.mode =="createnote") )
									temp += '<h2><span class="icon-Notes"></span>'+data.attachment.name+'</h2>\n';
								else if(data.attachment)
								{
									var src = "";
									if( (data.msg !="") && (data.msg != undefined) )
										src = data.msg;
									else
										src = data.attachment.data;
									
									temp += '<img src='+src+' class="chat-img">';
								}
								else if(data.isEvent)
								{
									var Starttime 			= data.eventdetails.Starttime;
									var Endtime 			= data.eventdetails.Endtime;
									var Scheduletime = convertGMTtoLocal(Starttime)+" - "+convertGMTtoLocal(Endtime);
									temp += '<h2><span class="icon-Calendar-date"></span>'+data.msg+'</h2>\n';
									temp += '<h2 class="dates">Date &amp; Time<br><span class="eventTime">'+Scheduletime+'</span></h2>';
								}
								else
									temp += '<h2>'+data.msg+'</h2>\n';
									
							temp += '<h6>'+Btime+'</h6>\n'+
								'</div>\n'+
							'</div>	\n'+							
							'<div class="ml-thumb"><p> '+ likeLen +  '<span class="icon-thump_up"></span></p></div>\n'+
						'</div>\n'+
					'</div>\n'+											
					'<div class="newdates-bookmark">'+Bdate+
					
							'<div class="newdates-bookmark">\n'+
								'<ul class="chat-icons">\n'+
									'<li><a href="#"><span class="icon-thump_up"></span></a></li>\n'+
									'<li onclick=setBookmark("'+bookmarks[i]+'",false)><a href="#" class="tooltips"><span class="icon-Bookmark-1"></span>\n'+
										'<p class="pophover">Remove Bookmark</p>\n'+
									'</a></li>\n'+
									'<li onclick=setFlagMode("'+bookmarks[i]+'","'+mode+'")><a href="#"><span class="icon-Pin"></span></a></li>\n'+
									'<li><a href="#"><span class="icon-Action"></span></a></li>\n'+
								'</ul>\n'+
							'</div>\n'+
							
					'</div>\n'+
					'<hr>\n'+
				'</div>\n';
		}
		if(temp == "")
		{
			var div = '<div id="no_results" class="emptybox" style=""><h2>No Results Found</h2><p>Please try refining your search terms above.</p></div>';
			$('#lstbookMrk').append(div);
		}
		else
			$('#lstbookMrk').append(temp);		
	}
}

function FilterContact(input)
{
	var array = getAllContactArray();
	if($('#directorysrt').text() == "First Name")
		array = array.sort(compareFirst);
	else
		array  = array.sort(compareLast);
	sortarray(array, input.toUpperCase());
}

function sortarray(result, text)
{
	$("#ControlWindow").find('.directory-sections').remove();
	$.each(result, function (index, data) 
	{	
		if( (text != "") && (text != undefined))
		{
			if (data.name.toUpperCase().indexOf(text) == -1)	return;
		}	
		var contName = data.name;
		if(contName.length > 23)	contName = contName.substring(0,28)+"...";
		
		
		var moderatestatus = "images/green-active.svg";
		if(data.user_status == "Available")	moderatestatus = "images/green-active.svg";
		else if(data.user_status == "Busy")	moderatestatus = "images/grey.png";
		else if(data.user_status == "Do not disturb")	moderatestatus = "images/red.png";
		else if(data.user_status == "Invisible")	moderatestatus = "images/yellow.png";
		
		
		var temp = '<div class="directory-sections row clearfix">\n'+
			'<div class="col-md-12">\n'+
				'<div class="row clearfix">\n'+
					'<div class="col-sm-8" onclick=openContactwindow("'+data.jid+'")>\n'+
						'<h3>\n'+
							'<div class="customer-names">\n'+
								'<img src='+data.avatar+' class="customer-img">\n'+
								'<img src='+moderatestatus+' class="dotactive">\n'+
							'</div>\n'+
							'<div class="customer-images">'+contName+'<br><span>'+data.mailid+'</span></div>\n'+
						'</h3>\n'+
					'</div>\n'+
					'<div class="col-sm-4">\n'+
						'<h5>\n'+
							'<button>Re-Invite</button>\n'+
							'<a href="#" class="dirvpopen">\n'+
								'<span class="icon-Action"></span>\n'+
								'<h6 class="dirvp" onclick=BrowserProfile("moderate","'+data.jid+'")>View Profile</h6>\n'+
							'</a>	\n'+										
						'</h5>\n'+
					'</div>\n'+
				'</div>\n'+
			'</div>\n'+
		'</div>\n';
		
		$('#directoryPage').append(temp);
	})	
}

function BrowserMin()
{
	var theWindow = BrowserWindow.getFocusedWindow();
	theWindow.minimize();
}

function BrowserClose()
{
	var theWindow = BrowserWindow.getFocusedWindow();
	theWindow.hide();
}

function BrowserAdmin()
{
	window.LastChatWindow = undefined;
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	var openWin = $(loadAdminWin.find('.fixedscroll')).clone();
	$(openWin).find("#adminRows").empty();
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
	getAdmindetail();
	
	var openWin = $(loadAdminWin.find('#myModaladdnew')).clone();
	$('#ParentWindow').append(openWin);
	var openWin = $(loadAdminWin.find('#myModaladdnew123')).clone();
	$('#ParentWindow').append(openWin);
	
	adminComAddRemove("", "", "", "get");
	
	//---------add admin--------//
	$('#addAdminCall').click(function()
	{
		var openWin = $(loadAdminWin.find('#myModaladdnew1')).clone();
		$('#ParentWindow').append(openWin);
	});
	
	$('#adminAddFileShare').click(function()
	{
		var openWin = $(loadAdminWin.find('#myModalmanagefiles')).clone();
		$('#ParentWindow').append(openWin);
	});
	
	$('#adminpermOpen').click(function()
	{
		var openWin = $(loadAdminWin.find('#myModaladdnew1234')).clone();
		$('#ParentWindow').append(openWin);
		getcompliancedetail();
	});

	$("#ParentWindow").on("click", "#addAdminDet", function() {	
		var text = $('#addAdminText').val();
		if(text != "")
			adminAddRemove(text,"add");
	});

	//---------add admin end----------------//
	
	$("#adminretentionBtm").click(function(){	adminretentionFun();	});
	$("#compSubmit").click(function(){	compSubmitFun();	})
	$('#allowinvite').click(function(){	setRemoveCompayDetail();	});
	$('#begininvite').click(function(){	setRemoveCompayDetail();	});
	$( "#ghipydropbox" ).change(function () {	setRemoveCompayDetail();	});
}

function BrowserSignOut()
{
	//utils.LogoutService()
	var answer = window.confirm("Do You Want To Sign Out?")
	if (answer) {
		window.localStorage.clear();
		window.location = "index.html"; 
	}
}

/*
function BrowserMyProfile()
{
	//$('#clientview').load("views/set-profile.html");
	$('.searchview').remove();
	$("#clientview").empty();
	$('#clientview').load("views/myprofile.html");
}

$(document).on("click", "#upcoming", function(){
	window.LastChatWindow = undefined;
	//noteclose();
	removeUnwantedDiv();
});

$(document).on("click", "#tasks", function(){
	window.LastChatWindow = undefined;
	removeUnwantedDiv();
});

$(document).on("click", "#kalendar", function(){
	window.LastChatWindow = undefined;
	removeUnwantedDiv();
});

$(document).on("click", "#bookmark", function(){
	window.LastChatWindow = undefined;
	removeUnwantedDiv();
});

$(document).on("click", "#activitylogs", function(){
	window.LastChatWindow = undefined;
	removeUnwantedDiv();
});

$(document).on("click", "#set-profile", function(){
	window.LastChatWindow = undefined;
	removeUnwantedDiv();
});

$(document).on("click", "#signout", function(){
	window.LastChatWindow = undefined;
	utils.LogoutService();
	removeUnwantedDiv();
});

$(document).on("click", ".sideMenuItem", function(){
  	window.CanShowSubMenu = false;
  	$(".sideMenuItem").removeClass("selected active");
  	$("#"+this.id).addClass("selected active");
	$('.searchview').remove();
	$('#clientview').load("views/"+this.id+".html");

  resetNewBtn();
  if(this.id.startsWith('set')){
    $("#settingsmenu").show();
    $("#rosterbody").hide();
    $("#kalendarmenu").hide();
	$("#sharedmenu").hide();	
  } else if(this.id.startsWith('sha')) {
    $("#sharedmenu").show();
    $("#kalendarmenu").hide();
    $("#settingsmenu").hide();
    $("#rosterbody").hide();
  }else if(this.id.startsWith('kal')) {
    $("#sharedmenu").hide();
    $("#settingsmenu").hide();
    $("#rosterbody").show();
    $("#kalendarmenu").hide();

  } else if(this.id.startsWith('act')) {
    $("#kalendarmenu").hide();
    $("#sharedmenu").hide();
    $("#settingsmenu").hide();
    $("#rosterbody").show();
  } else {
    $("#settingsmenu").hide();
	 $("#sharedmenu").hide();
	 $("#kalendarmenu").hide();
    $("#rosterbody").show();
  }

});									
*/

function resetNewBtn(){
  $("#newCatBtn").hide();
  $("#floatingIcon").show();
}

MentionList = () =>{

	$(".sideMenuItem").removeClass("selected active");
	$("#mentionlist").addClass("selected active");
	/*if(this.id == 'upcoming')
	$('#clientview').html("");
	else */
	$('.searchview').remove();
	$('#clientview').load("views/mentionlist.html");
	resetNewBtn();
	$("#settingsmenu").hide();
	$("#sharedmenu").hide();
	$("#kalendarmenu").hide();
    $("#rosterbody").show();
  }
// Close windows
$(document).on("click","#closeIcon", function(){
  if(settings["QUIT_APP_ON_CLOSE"]) {
    window.close();
  } else {
    ipcRenderer.send('toggleApplication', 'toggle');
  }
});

// Cleanup error on datepicker
$(document).on("click",".input-group-addon", function(){
  $("#datetimepicker1").removeClass("has-error")
});

// Cancel Button action
$(document).on("click","#cancelBtn", function(){
  clearForm(true);
});

// Save Button action
$(document).on("click","#saveBtn", function(){
  saveData(()=>{
    clearForm(false);
    $('#newReminderModal').modal('hide');
    displaySavedAlert();
    updateReminders();
    reloadCronJobs();
  });
});

// Focus taskname on modal load
$('#newReminderModal').on('shown.bs.modal', function (event) {
  $('#newReminderModal #task_name').focus();  
});


$(document).on("click","#updateBtn", function(event){
  var id = $(this).attr("data-id");;
  var obj = new Object();
  obj.name = $("#editReminderModal #task_name").val();
  obj.category  = $("#editReminderModal #categorySelect2").val();
  obj.remindOn = $("#editReminderModal #datetimepicker").val();
  obj.remindOnT = utils.getDate($("#editReminderModal #datetimepicker").val());
  obj.notes = $("#editReminderModal #notes").val();
  obj.alarm = $("#editReminderModal #alertOn2").prop('checked');
  db.updateReminder(id, obj, (noUpdated)=> {
    displayUpdatedAlert();
    updateReminders();
    reloadCronJobs();
  });
});


$(document).on("click","#openBtn", function(){
  var id = $("#alertNotify #openID").val();
  openEditReminder(id);
});

$(document).on("click","#compConfirmation", function(){
  var id = $("#alertNotify #openID").val();
  setCompleted(id, true);
  reloadCronJobs();
});

$(document).on("click", ".checkBoxImg", function(event){
  var id = getId($(this).attr("id"));
  var completedColor = "rgb(139, 195, 74)";
  var incompleteColor = "rgb(223, 226, 223)";
  var completed = false;
  if($(this).css('color')==incompleteColor) {
    $(this).css('color', completedColor);
    completed = true;
  } else {
    $(this).css('color', incompleteColor);
  }
  setCompleted(id, completed);
  reloadCronJobs();
  event.stopPropagation();
});

$(document).on("click", "#compBtn", function(event){
  var id = $(this).attr("data-id");
  setCompleted(id, true);
  reloadCronJobs();
});


function updateReminders(){
  updateAllResources();
  updateCompResources();
  updateUpComingResources();
}

function reloadCategories(){
  //loadCategoriesForFile();
  updateReminders();
}

// Methods used in html

function loadAlertSwitch(index){
  $("#alertOn"+index).bootstrapSwitch();
}

// load the select box
function loadSelectBox(index){
    var obj;
    var dropDown = $('#categorySelect'+index).empty().html(' ');
    dropDown.append($('<option>', { value: 0, text : "" }));
 /*    fs.readFile(catFile, 'utf8', function (err, data) {
      if (err)
       throw err;
      
      obj = JSON.parse(data);
      // update options
      $.each(obj, function (index, item) {
        dropDown.append($('<option>', { 
          value: item.name,
          text : item.name
        }));
      });
    }); */
}


// clear the form
function clearForm(saveCategory){
  $("#task_name").val('');
  $("#datetimepicker").val('');
  $("#notes").val('');
  $("#alertOn1").bootstrapSwitch('state', true);
  if(saveCategory) {
    $("#categorySelect1").val("");
  }
}

// save data to db
function saveData(callBack){

  if(!isDataValid())	return
  var name = $("#newReminderModal #task_name").val()
  var notes = $("#newReminderModal #notes").val()
  var remindOn = $("#newReminderModal #datetimepicker").val()
  var remindOnT = utils.getDate(remindOn);
  var alarm = $("#newReminderModal #alertOn1").prop('checked');
  var category = $("#newReminderModal #categorySelect1").val();
  // Create the item using the values
  var item = {
    name: name, 
    alarm: alarm,
    category: category, 
    notes: notes, 
    remindOn: remindOn,
    remindOnT: remindOnT,
    status: false 
  };

  // insert into db
  db.insertIntoDB(item);

  var newappointment = {
      Subject:category,
      Body: notes,
      Location: name,
      Start : remindOnT,
      End : remindOnT,
      To : "p.aricovindane@mundio.com;r.moses@vectone.com"
  }
/*  setappointment(JSON.stringify(newappointment),function (error, result) {
      if (error) throw error;
      setTimeout($("#gettasksbutton").trigger('click'),1000);
  });
*/
  callBack();
}

// Validate data
function isDataValid(){
  var remindOn = $("#datetimepicker").val()
  if(remindOn==''){
    $("#datetimepicker1").addClass("has-error")
    return false
  }
  return true
}

function displaySavedAlert(){
  $("#savedAlert").fadeIn();
  $("#savedAlert").delay(2000).slideUp().fadeOut("slow");
}

function displayUpdatedAlert(){
  $("#updatedAlert").fadeIn();
  $("#updatedAlert").delay(2000).slideUp().fadeOut("slow");
}

function displayDeleteAlert(){
  $("#deleteAlert").fadeIn();
  $("#deleteAlert").delay(2000).slideUp().fadeOut("slow");
}

// Update all the resources in all reminders list
function updateAllResources(){
    db.getActiveReminders((remArr)=>{
      populateReminders('#allRemList',remArr);
    });  
}

// Update all the resources in all reminders list
function updateCompResources(){
  db.getCompReminders((remArr)=>{
    populateReminders('#compRemList',remArr);
  });
}

function populateReminders(elementId, remArr) {
  $(elementId).empty();
  var typ = "_a";
  if(elementId.indexOf("all") !== -1) {
    typ ="_c";
  }
  for(item in remArr) {
    if(item=="removeValue")
      continue;
    var rowC = $('<div/>', { class : "category label", text : remArr[item].category,"id" : "ca_"+remArr[item]._id  });
    var rowD = $('<div/>', { class : "itemCont" });
    var statusCls = "statusI";
    if(remArr[item].status) {
      statusCls = "statusC";
    }
    var rowChbx = $('<span/>', { class : "glyphicon glyphicon-ok checkBoxImg " + statusCls , "id" : "c_"+remArr[item]._id });
    var rowA = $('<a/>', {class : "list-group-item itemToggle pointerCursor", "data-toggle" : "collapse", "data-target" : "#collapseComp"+typ+item, "aria-expanded" : "false", "aria-controls" : "collapseComp" })
    var rowH4 = $('<h5/>', {class : "list-group-item-heading itemHeader pointerCursor", text : remArr[item].name, "id" : "n_"+remArr[item]._id});
    var rowI = $('<span/>', {class : "glyphicon glyphicon-pencil pointerCursor editBtn"});
    var rowP = $('<p/>', {class : "list-group-item-text", text : remArr[item].remindOn });
    var rowNotesD = $('<div/>', {class : "collapse", id : "collapseComp"+typ+item });
    var rowNotes = $('<div/>', { text : remArr[item].notes });
    var rowAlarm = $("<span/>", {class : "glyphicon glyphicon-bell alarmIcon"});
    var rowIAlarm = $("<span/>", {class : "glyphicon glyphicon-bell alarmIcon invisible"});
    var rowTrash = $("<span/>", {class : "glyphicon glyphicon-trash trashIcon pointerCursor", "id" : "t_"+remArr[item]._id});

    rowNotesD.append(rowNotes);
    rowD.append(rowC);
    rowD.append(rowH4);
    rowD.append(rowI);
    rowD.append(rowP);
    if(remArr[item].alarm) {
      rowD.append(rowAlarm);
    } else {
      rowD.append(rowIAlarm);
    }
    rowD.append(rowTrash);
    rowA.append(rowChbx);
    rowA.append(rowD);
    rowA.append(rowNotesD);
    $(elementId).append(rowA);
  }
  loadCategoryColor();
}

$(document).on("click",".itemHeader", function(){
  var id = getId($(this).attr("id"));
  openEditReminder(id);
});

$(document).on("stateUIChange.jsxc", fillthumbnails);


/*
Returns the id value from complete token (<TKN>_<IDVAL>)
*/
function getId(idToken) {
  return idToken.substring(2)
}

/*
Opens the edit reminder modal
*/
function openEditReminder(id){
    $('#editReminderModal').modal({});
    $('#editReminderModal').on('shown.bs.modal', function (event) {
      $('#editReminderModal #task_name').focus();  
        db.getReminder(id, (docs)=>{
        populateData(docs);
        event.stopPropagation();
      });
    })
}

function UpdateConfirmation(){
  $('#updateConfirmationModal').modal({});
  $('#updateConfirmationModal').on('shown.bs.modal', function (event) {
    $('#dismissBtn').click(function(){
      $('#updateConfirmationModal').modal('hide');
    });
    $('#updateConfirmation').click(function(){
      autoUpdater.quitAndInstall();  
      $('#updateConfirmationModal').modal('hide');
    });
  })
}

/*
Populate data on Edit Modal
*/
function populateData(doc) {
  $("#editReminderModal #task_name").val(doc.name);
  $("#editReminderModal #categorySelect2").val(doc.category);
  $("#editReminderModal #datetimepicker").val(doc.remindOn);
  if(!doc.alarm) {
      $("#alertOn2").bootstrapSwitch('state', false);
  }
  $("#editReminderModal #notes").val(doc.notes);
  $("#editReminderModal #compBtn").attr("data-id", doc._id);
  $("#editReminderModal #updateBtn").attr("data-id", doc._id);
  clearForm(false);
}

/*
Process the cron jobs
*/
function processCronJobs(){
/*   db.getAllAlerts((remArr)=>{
    for(item in remArr) {
      var jobId = cron.addJob(remArr[item], openAlert);
      cJobs[remArr[item]._id] = jobId;
    }
  }) */;
}

function reloadCronJobs(){
  stopAllJobs();
  processCronJobs();
}

function stopAllJobs(){
  for(idV in cJobs) {
    stopJob(idV);
  }
}

function stopJob(idVal){
  cJobs[idVal].stop();
}

function openAlert(doc) {
  $('#alertNotify').modal({});
  showNotification("Reminder - " + doc.name , doc.category + "<br/>" + doc.notes + "<br/>" + doc.remindOn);
  ipcRenderer.send('toggleApplication', 'show');
  $('#alertNotify').on('shown.bs.modal', function (event) {
    $("#alertNotify #alertBody").text(doc.name);
    $("#alertNotify #openID").val(doc._id);
  });
}

function setCompleted(idVal, completed) {
  var obj = new Object();
  obj.status = completed;
    db.updateReminder(idVal, obj, (noUpdated)=> {
    displayUpdatedAlert();
    updateReminders();
  });
}

function filltasks(result){
    $('#allTasks').empty();
    obj = JSON.parse(result);
    // update options
    $.each(obj, function (index, item) {
        if (item.Desc == "") {
            return true;
        }

        var rowA = $('<a/>', { class: "list-group-item" })
        var rowD = $('<div/>', { class: "col-sm-7 control-label topPadding" });
        var rowH4 = $('<h5/>', { class: "list-group-item-heading catHeader pointerCursor", text: item.Desc, "id": "n_" + item.Desc });
        var rowI = $('<span/>', { class: "glyphicon glyphicon-pencil pointerCursor editBtn" });
        var pDiv = $('<div/>', { class: "input-group colorpicker-component cPicker" });
        var pInp = $('<input/>', { class: "form-control hexValue", "type": "text", "value": item.Due, id: "i_" + item.Due});
        var pSpan = $('<span/>', { class: "input-group-addon noDrag pointerCursor" });
        var pI = $('<i/>', { class: "noDrag" });
        var rowTrash = $("<span/>", { class: "glyphicon glyphicon-trash pointerCursor", "id": "t_" + item.Due, "cname": item.Due });
        rowTrash.click(function () {
            deleteappointment(JSON.stringify(item), function (error, result) {
                if (error) throw error;
                setTimeout($("#gettasksbutton").trigger('click'),1000);
            });
        });
        pSpan.append(pI);
        pDiv.append(pInp);
        pDiv.append(pSpan);
        pDiv.append(rowTrash);
        rowD.append(rowH4);
        rowD.append(rowI);
        rowA.append(rowD);
        rowA.append(pDiv);
        $('#allTasks').append(rowA);
    });
}
// read json file
function readJson(file,callBack){
  if (!fs.existsSync(file)) {
    callBack('')
  }
  fs.readFile(file, 'utf8', function (err, data) {
  if (err)
    throw err;
  
  if(data==''){
    callBack('')
  }
  var res = JSON.parse(data);
  callBack(res)
  });
}

function loadAllContacts(callback){
    $('#allContacts').empty();
    fs.readFile(contactsFile, 'utf8', function (err, data) {
        if (err)
            throw err;
    
        obj = JSON.parse(data);
        // update options
        $.each(obj, function (index, item) {
            if(item.name == ""){
                return true;
            }

            var rowA = $('<a/>', {class : "list-group-item"})
            var rowD = $('<div/>', { class : "col-sm-7 control-label topPadding" });
            var rowH4 = $('<h5/>', {class : "list-group-item-heading catHeader pointerCursor", text : item.UserName, "id" : "n_"+item.MailId});
            var rowI = $('<span/>', {class : "glyphicon glyphicon-pencil pointerCursor editBtn"});
            var pDiv = $('<div/>' , {class : "input-group colorpicker-component cPicker"});
            var pInp = $('<input/>', {class: "form-control hexValue" , "type" : "text", "value" : item.MailId, id : "i_"+item.MailId});
            var pSpan = $('<span/>', {class : "input-group-addon noDrag pointerCursor"});
            var pI = $('<i/>', { class : "noDrag"});
            var rowTrash = $("<span/>", {class : "glyphicon catTrashIcon pointerCursor", "id" : "t_"+item.UserName, "cname" : item.UserName});

            pSpan.append(pI);
            pDiv.append(pInp);
            pDiv.append(pSpan);
            pDiv.append(rowTrash);
            rowD.append(rowH4);
            rowD.append(rowI);
            rowA.append(rowD);
            rowA.append(pDiv);
            $('#allContacts').append(rowA);
        });
        if (callback != undefined) callback();
    });
}

function sendFileEnter(parent, attach) {
	
	var files = [];
	var bid = window.LastChatWindow;
	$('.image-checkbox').each(function () {
		
		if($(this).find(".checkSurfaceEnvironment").prop('checked') == true)
		{
			var list = [];
			list.name = $(this).children("img").attr("name");
			list.mine = $(this).children("img").attr("mine");
			list.downloadUrl = $(this).children("img").attr("downloadUrl");
			files.push(list);
		}
	});
	if(files.length < 0)
	{
		alert("please select any one to continue");
		return true;
	} 	
	else
	{
		if( $('#stickers').length !=0 ) 
			$('#stickers').modal('hide');
		//$('.jsxc_fade').children("."+parent+"Parent").remove();*
		//Pastefiles(bid,'cloud',files);
		sendFileToServer(files, bid, attach);
	}
}
function sendFileCancel(parent) {
	var bid = $("."+parent+"file").attr("bid");
	$('.jsxc_fade').children("."+parent+"Parent").remove();
	jsxc.gui.window.hideOverlay(bid);
} 

function ezBSAlert (options) {									//alert box 
	var deferredObject = $.Deferred();
	var defaults = {
		type: "alert", //alert, prompt,confirm 
		modalSize: 'modal-sm', //modal-sm, modal-lg
		okButtonText: 'Ok',
		cancelButtonText: 'Cancel',
		yesButtonText: 'Yes',
		noButtonText: 'No',
		headerText: 'Attention',
		messageText: 'Message',
		alertType: 'default', //default, primary, success, info, warning, danger
		inputFieldType: 'text', //could ask for number,email,etc
	}
	$.extend(defaults, options);
  
	var _show = function(){
		var headClass = "navbar-default";
		switch (defaults.alertType) {
			case "primary":
				headClass = "alert-primary";
				break;
			case "success":
				headClass = "alert-success";
				break;
			case "info":
				headClass = "alert-info";
				break;
			case "warning":
				headClass = "alert-warning";
				break;
			case "danger":
				headClass = "alert-danger";
				break;
        }
		$('BODY').append(
			'<div id="ezAlerts" class="modal fade">' +
			'<div class="modal-dialog" class="' + defaults.modalSize + '">' +
			'<div class="modal-content">' +
			'<div id="ezAlerts-header" class="modal-header ' + headClass + '">' +
			'<button id="close-button" type="button" class="close" data-dismiss="modal"><span aria-hidden="true">x</span><span class="sr-only">Close</span></button>' +
			'<h4 id="ezAlerts-title" class="modal-title">Modal title</h4>' +
			'</div>' +
			'<div id="ezAlerts-body" class="modal-body">' +
			'<div id="ezAlerts-message" ></div>' +
			'</div>' +
			'<div id="ezAlerts-footer" class="modal-footer">' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>'
		);

		$('.modal-header').css({
			'padding': '15px 15px',
			'-webkit-border-top-left-radius': '5px',
			'-webkit-border-top-right-radius': '5px',
			'-moz-border-radius-topleft': '5px',
			'-moz-border-radius-topright': '5px',
			'border-top-left-radius': '5px',
			'border-top-right-radius': '5px'
		});
    
		$('#ezAlerts-title').text(defaults.headerText);
		$('#ezAlerts-message').html(defaults.messageText);

		var keyb = "false", backd = "static";
		var calbackParam = "";
		switch (defaults.type) {
			case 'alert':
				keyb = "true";
				backd = "true";
				$('#ezAlerts-footer').html('<button class="btn btn-' + defaults.alertType + '">' + defaults.okButtonText + '</button>').on('click', ".btn", function () {
					calbackParam = true;
					$('#ezAlerts').modal('hide');
				});
				break;
			case 'confirm':
				var btnhtml = '<button id="ezok-btn" class="btn btn-primary">' + defaults.yesButtonText + '</button>';
				if (defaults.noButtonText && defaults.noButtonText.length > 0) {
					btnhtml += '<button id="ezclose-btn" class="btn btn-default">' + defaults.noButtonText + '</button>';
				}
				$('#ezAlerts-footer').html(btnhtml).on('click', 'button', function (e) {
						if (e.target.id === 'ezok-btn') {
							calbackParam = true;
							$('#ezAlerts').modal('hide');
						} else if (e.target.id === 'ezclose-btn') {
							calbackParam = false;
							$('#ezAlerts').modal('hide');
						}
					});
				break;
			case 'prompt':
				$('#ezAlerts-message').html(defaults.messageText + '<br /><br /><div class="form-group"><input type="' + defaults.inputFieldType + '" class="form-control" id="prompt" /></div>');
				$('#ezAlerts-footer').html('<button class="btn btn-primary" data-dismiss="modal">' + defaults.okButtonText + '</button>').on('click', ".btn", function () {
					calbackParam = $('#prompt').val();
					$('#ezAlerts').modal('hide');
					$('.modal-backdrop').remove();
				});
				break;
		}
   
		$('#ezAlerts').modal({ 
          show: false, 
          backdrop: backd, 
          keyboard: keyb 
        }).on('hidden.bs.modal', function (e) {
			$('#ezAlerts').remove();
			deferredObject.resolve(calbackParam);
		}).on('shown.bs.modal', function (e) {
			if ($('#prompt').length > 0) {
				$('#prompt').focus();
			}
		}).modal('show');
	}
    
  _show();  
  return deferredObject.promise();    
}

function sendFileToServer(files, bid, attach)
{
	for (var i = 0; i < files.length; i++) {
		(function (i) {	
			setTimeout(function () {
				var filePath = files[i].downloadUrl;
				var mimeType = files[i].mine;		 
				var fileName = files[i].name;
		 
				var mode = '';
				if( (files[i].mode != undefined) && (files[i].mode != null) )
					mode = files[i].mode;
				
				var blob = null;
				var xhr = new XMLHttpRequest(); 
				xhr.open("GET", filePath); 
				xhr.responseType = "blob";
				xhr.onload = function() 
				{
					blob = xhr.response;
					var file = new File([blob], fileName,{type:mimeType});
					var reader = new FileReader();
					reader.onload = function() {				
						var message = "";
						if(attach != undefined)
						{
							message = jsxc.gui.window.postMessage({
									bid: bid,
									direction: 'out',
									flag: false,
									mode:mode,
									attachmentmsg:attach.attachmentmsg,
									attachmentid:attach.attachmentid,
									attachment: {
										name: file.name,
										size: file.size,
										type: file.type,
										data: (file.type.match(/^image\//)) ? reader.result : null
									}
								});
						}
						else{
								message = jsxc.gui.window.postMessage({
									bid: bid,
									direction: 'out',
									attachment: {
										name: file.name,
										size: file.size,
										type: file.type,
										data: (file.type.match(/^image\//)) ? reader.result : null
									}
								});
						}
						jsxc.xmpp.httpUpload.sendFile(file, message);
						saveFileCouchdb(message._uid, bid, new Date(), file.name, file.type);
					};
					reader.readAsDataURL(file);
				}
				xhr.send();	
				
			},i*1);
		})(i);
	}
}

function loadColorPicker() {
 $('.cPicker').colorpicker(); 
}

function getCategoryColors(){
  if(Object.size(categoriesList) < 1) {
   // loadCategoriesForFileloadCategoriesForFile();
  }
  return categoriesList;
}

function loadCategoriesForFile(){
  var data = fs.readFileSync(catFile, 'utf8');
    var obj = JSON.parse(data);
    for(index in obj) {
      categoriesList[obj[index].name] = obj[index].color;
  }
}

Object.size = function(arr) 
{
    var size = 0;
    for (var key in arr) 
    {
        if (arr.hasOwnProperty(key)) size++;
    }
    return size;
};

function loadCategoryColor(){
  $( ".category" ).each(function( index ) {
    var cat = $(this).text();
    var id = $(this).attr("id"); 
    var color = categoriesList[cat];
    $("#"+id).css('background-color', color);
  });
}

// Delete Button action
$(document).on("click","#delConfirmation", function(event){
  var id = $("#modelID").val();
  db.deleteReminder(id, (res)=> {
      if(res!="Error"){

      updateReminders();
      displayDeleteAlert();
      reloadCronJobs();
    }
  });
});

$(document).on("click",".catHeader", function(){
  var id = $(this).attr("id");
  var input = $('<input />', {
      'type': 'text',
      'name': id,
      'class': 'catHeaderInp',
      'value': $(this).html()
  });
  $(this).parent().prepend(input);
  $(this).remove();
  input.focus();
});

$(document).on('blur', '.catHeaderInp', function () {
    var h5 = $('<h5 />', {
      'id': $(this).attr("name"),
      'class': 'list-group-item-heading catHeader pointerCursor',
      'text': $(this).val()
    });
    $(this).parent().prepend(h5);
    $(this).remove();
})

// replacing all old category values in DB to new value.
function updateDBCategory(oldVal, newVal){
  db.updateCategory(oldVal, newVal);
}


function showNotification(title, bodyVal) {
  let myNotification = new Notification(title, {
    body: bodyVal
  });
}


function enableAddCategory(){
  $(document).on("click","#addCatBtn", function(){
    $('#newCategoryModal').modal({});
  });  
}

function changeNewBtn(){
  $("#newCatBtn").show();
  $("#floatingIcon").hide();
}

/*
$(document).on("click", "#joinConfirmation", function() {
	console.log("invite accept in old");
  var room = $('#inviteto').text();
  jsxc.gui.queryActions.join(room.split('@')[0],"New Room")
});
*/

$(document).on("click", "#saveCat", function() {
  var newCat = $("#newCatName").val();
  var newColor = "#8BC34A";
  addCategory(newCat, newColor);
  $('#newCategoryModal').modal('hide');
});

//delete category event
$(document).on("click",".catTrashIcon", function(){
  var id = getId($(this).attr("id"));
  var name = $(this).attr("cname");
  $("#catModelID").val(id);
  $("#catModelName").val(name);
  $('#catConfirmationDialog').modal({});
});

function updateUpComingResources(){

  $("#todayRemList").empty();
  $("#weekRemList").empty();
  $("#overRemList").empty();

  // today
  // check if present for today
  var today = utils.getCurrentDate();
  db.getActiveForCurDate(new RegExp(today),new Date(), (docs)=>{
    if(Object.size(docs) > 0) {
      populateUpComReminders("#todayRemList",docs )
      $("#todayRemList").prepend("<li class='list-group-item upHeader'>Today</li>");
    } else {
      $("#todayRemList").prepend("<li class='list-group-item upHeader'>No Reminders for today</li>");
    }
  });

  // week
  var weekRegex = getNextWeeksRegexp();
  db.getActiveForDate(new RegExp(weekRegex), (docs)=>{
    if(Object.size(docs) > 0) {
      populateUpComReminders("#weekRemList",docs )
      $("#weekRemList").prepend("<li class='list-group-item upHeader'>This Week</li>");
    } else {
      $("#weekRemList").prepend("<li class='list-group-item upHeader'>No Reminders for this week</li>");
    }
  });

  db.getPreviousReminders(new Date(), (docs)=>{
    var overDueSize = Object.size(docs);
    if(overDueSize > 0) {
      updateOverdueCount(overDueSize);
      populateUpComReminders("#overRemList",docs );
    } else {
      $("#overRemList").prepend("<li class='list-group-item upHeader'>No Overdue Reminders</li>");
    }
  });

}

function updateOverdueCount(count){
  $("#overDueHeader").text("OVERDUE (" + count + ")");
}

function getNextWeeksRegexp(){
  var curDay = new Date();
  var nextDay = new Date();
  var formattedDate;
  var regexpStr = "";
  for(var i = 0; i < 6; i ++) {
    nextDay.setDate(curDay.getDate() + 1);
    formattedDate = utils.getFormattedDate(nextDay);
    regexpStr += formattedDate;
    if(i!=5){
      regexpStr += "|";
    }
    curDay = nextDay;
  }
  return regexpStr;
}

function populateUpComReminders(elementId, remArr) {
  var typ = "_t";
  if(elementId.indexOf("week") !== -1) {
    typ ="_w";
  } else if(elementId.indexOf("over") !== -1) {
    typ ="_o";
  }
  for(item in remArr) {
    if(item=="removeValue")
      continue;
    var rowC = $('<div/>', { class : "category label", text : remArr[item].category,"id" : "ca_"+remArr[item]._id  });
    var rowD = $('<div/>', { class : "itemCont" });
    var statusCls = "statusI";
    if(remArr[item].status) {
      statusCls = "statusC";
    }
    var rowChbx = $('<span/>', { class : "glyphicon glyphicon-ok checkBoxImg " + statusCls , "id" : "c_"+remArr[item]._id });
    var rowA = $('<a/>', {class : "list-group-item itemToggle pointerCursor", "data-toggle" : "collapse", "data-target" : "#collapseComp"+typ+item, "aria-expanded" : "false", "aria-controls" : "collapseComp" })
    var rowH4 = $('<h5/>', {class : "list-group-item-heading itemHeader pointerCursor", text : remArr[item].name, "id" : "n_"+remArr[item]._id});
    var rowI = $('<span/>', {class : "glyphicon glyphicon-pencil pointerCursor editBtn"});
    var rowP = $('<p/>', {class : "list-group-item-text", text : remArr[item].remindOn });
    var rowNotesD = $('<div/>', {class : "collapse", id : "collapseComp"+typ+item });
    var rowNotes = $('<div/>', { text : remArr[item].notes });
    var rowAlarm = $("<span/>", {class : "glyphicon glyphicon-bell alarmIcon"});
    var rowIAlarm = $("<span/>", {class : "glyphicon glyphicon-bell alarmIcon invisible"});
    var rowTrash = $("<span/>", {class : "glyphicon glyphicon-trash trashIcon pointerCursor", "id" : "t_"+remArr[item]._id});

    rowNotesD.append(rowNotes);
    rowD.append(rowC);
    rowD.append(rowH4);
    rowD.append(rowI);
    rowD.append(rowP);
    if(remArr[item].alarm) {
      rowD.append(rowAlarm);
    } else {
      rowD.append(rowIAlarm);
    }
    rowD.append(rowTrash);
    rowA.append(rowChbx);
    rowA.append(rowD);
    rowA.append(rowNotesD);
    $(elementId).append(rowA);
  }
  loadCategoryColor();
}
   
function loadSettings() {
  readJson(settingsFile,(sStr)=> {
    settings = {};
    settings["QUIT_APP_ON_CLOSE"] = sStr.QUIT_APP_ON_CLOSE;
    settings["LAUNCH_ON_STARTUP"] = sStr.LAUNCH_ON_STARTUP;
    settings["BRING_TO_FOCUS_ONALERT"] = sStr.BRING_TO_FOCUS_ONALERT;

    ipcRenderer.send('setSettings', settings);
    return settings;
  }); 
}

function updateSettings(key, value) {
  settings[key] = value;
  var prettyJSON = JSON.stringify(settings, null, 4);
  fs.writeFile(settingsFile, prettyJSON, function(err) {
      if(err) {
          return  console.log(err);
      }
      ipcRenderer.send('setSettings', settings);
  });
}

function getSettingValue(key){
  return settings[key];
}
var autoUpdater, acd;

//------------------------ added by karthik -----------------------------------------//

var config = {

  localip: $("#IPNumber").val(),
  uri: loggeduser.ext +'@'+DomainName,
  
  userAgentString: 'SIP.js/0.7.0 BB',
  traceSip: true,
  wsServers: ['wss://ucwebrtc.vectone.com:7443'],
  register: true,
  authorizationUser: userid,
  password: userpass,
  turnServers: {
    urls: "turn:stun02.mundio.com:3478",
    username: "admin",
    password: "system123"
  },
  displayName: 'TestUser'
  
}

var InitBoard = function(bid) {
	var ToSipId = bid.split('@')[0];
	var ToName = $('.sip' + ToSipId).parent()[0].outerText;
	if ($('.jsxc_online.sip' +  ToSipId).length<1){
		
		swal( ToName + ' is Offline', 'Offline', 'error');
		return ;
	}

  window.boardbid = bid;

  $('#conversation_sec').hide();
  $('.whiteboardsec').show();
  $('.whiteboardsec').load("views/whiteboard.html");
  
  $('.Chat_Sec').show();
  $('.BoardNow').hide();
  
  ipcRenderer.send('', bid);
};

function plot_markings(operation, data, frm) {
  if (frm != window.boardbid){
    InitBoard(frm);
  }
  xobj = new Object();
  xobj.frm = frm;
  xobj.data = data;
  xobj.operation = operation,
  consume(operation,data);
//    ipcRenderer.send('plot-markings', xobj);
}

var HideBoard = function(bid) {
  ipcRenderer.send('close-white-board-window', bid);
};

var ConnectSip = function(username, password) {
  if( ( username == undefined ) || ( password == undefined ) )
	  return;
  config.uri = username +'@'+DomainName;
  config.authorizationUser = username;
  config.password = loggeduser.password;//password;
  config.localip = $("#IPNumber").val()
  config.displayName = username;

  ua = new SIP.UA(config);
  ua.on('invite', function(rsession) {
	ipcRenderer.send('incoming');
    SessionRunner++;
    sessions[SessionRunner] = rsession;
    sessions[SessionRunner].Runner = SessionRunner;

    renderHint = {
      remote: document.getElementById('remoteVideo'),
      local: document.getElementById('localVideo')
    };

    sessions[SessionRunner].mediaHandler.on('addStream', function(a) {
      MediaStreams.push(a.stream);
      sessions[SessionRunner].mediaHandler.render(renderHint);
    });

    let callerSip = sessions[SessionRunner].remoteIdentity.uri.user;
    let callerInfo = localStorage.getItem('jsxc:' +  jsxc.bid + ':buddy:' + callerSip + jidSuffix);
    callerInfo = JSON.parse(callerInfo);
        var callerName ="";
		
  if (callerInfo != null){
     callerName = callerInfo.name;
    }


    setUpListeners(sessions[SessionRunner], callerSip, sessions[SessionRunner].remoteIdentity.displayName, 'IN');

    if (sessions[SessionRunner].remoteIdentity.displayName == 'screen') {

	var userslist = jsxc.storage.getUserItem('muteallnotifyusers');
		if(userslist == null || userslist == undefined || userslist == "")
			userslist = [];
		
		if(userslist.indexOf(jsxc.bid) < 0)	
			document.getElementById('ringback').play();
	  
      swal({
        title: callerName,
        text: 'Incoming Screen Share Request',
        timer: 10000,
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-share"> Share</i>',
        cancelButtonText: '<i class="fa fa-times"> Reject</i>',
        imageUrl: 'assets/imgs/incomingcall.gif',
        imageWidth: 400,
        imageHeight: 200,
        animation: true

      }).then(
        function(a) {
          $("#vwindow").modal('show');
          $('#vcanvas').show();
          $(".nav-side-menu").hide();
          var options = {
            media: {
              constraints: {
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'screen',
                    maxWidth: 1280,
                    maxHeight: 720
                  },
                  optional: []
                }
              },
              render: renderHint
            },
            extraHeaders: ['X-webcall: video']
          };
          rsession.accept(options);
          document.getElementById('ringback').pause();
          if (window.Debug) console.log(a);
        },
        
        function(dismiss) {
          if (dismiss != 'timer') {
            sessions[SessionRunner].reject();
          }
          document.getElementById('ringback').pause();
          if (window.Debug) console.log("Dismissed By :", dismiss);
        }
      )
    } else if (sessions[SessionRunner].remoteIdentity.displayName == 'video') {
      document.getElementById('ringback').play();
      swal({
        title: callerName,
        text: 'Incoming Video Call',
        timer: 10000,
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-check"> Accept</i>',
        cancelButtonText: '<i class="fa fa-times"> Reject</i>',
        imageUrl: 'assets/imgs/incomingcall.gif',
        imageWidth: 400,
        imageHeight: 200,
        animation: true

      }).then(
        function(a) {
          $("#vwindow").modal('show');
          $('#vcanvas').show();

          $('.cam-unmute').hide();
          $('.cam-mute').show();
        
          
          $(".nav-side-menu").hide();
          var options = {
            media: {
              constraints: {
                audio: true,
                video: true
              },
              render: renderHint
            },
            extraHeaders: ['X-webcall: video']
          };
          sessions[SessionRunner].accept(options);
          document.getElementById('ringback').pause();
          if (window.Debug) console.log(a);
        },
        
        function(dismiss) {
          if (dismiss != 'timer') {
            sessions[SessionRunner].reject();
          }
          document.getElementById('ringback').pause();
          if (window.Debug) console.log("Dismissed By :", dismiss);
        }
      )

    } else {
      document.getElementById('ringback').play();
      swal({
        title: callerName,
        text: 'Incoming Audio Call',
        timer: 10000,
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-check"> Accept </i>',
        cancelButtonText: '<i class="fa fa-times"> Reject</i>',
        imageUrl: 'assets/imgs/incomingcall.gif',
        imageWidth: 400,
        imageHeight: 200,
        animation: true

      }).then(
      function(a) {
        $("#vwindow").modal('show');
        $('#vcanvas').show();
        $('.cam-unmute').show();
        $('.cam-mute').hide();
      
        $(".nav-side-menu").hide();
          var options = {
            media: {
              constraints: {
                audio: true,
                video: false
              },
              render: renderHint
            },
            extraHeaders: ['X-webcall: audio']
          };
          sessions[SessionRunner].accept(options);
          document.getElementById('ringback').pause();
          if (window.Debug) console.log(a);
        },
        
        function(dismiss) {
          if (dismiss != 'timer') {
            sessions[SessionRunner].reject();
          }
          document.getElementById('ringback').pause();
          if (window.Debug) console.log("Dismissed By :", dismiss);
        }
      )
    }
  });
};

var UpdateIp = function() {
	 if (window.Debug) console.log("UpdateIp chck");
	var url = '/updateIp?linkUrl=http://im01.mundio.com/ejabberd/myname.php';
		$.get(url, function(response) {
			 if (window.Debug) console.log("response is",response);
			 window.ipnumber = response;
			 //$("#IPNumber").val(a);
			 // var username = localStorage.getItem('username');
			 // var password = localStorage.getItem('password');
			 ConnectSip(loggeduser.sip_userid, loggeduser.sip_password);
		});
  /*$.ajax({
    type: "POST",
    url: 'http://im01.mundio.com/ejabberd/myname.php',
    success: function(a) {
      window.ipnumber = a
      $("#IPNumber").val(a);
      // var username = localStorage.getItem('username');
      // var password = localStorage.getItem('password');
      ConnectSip(loggeduser.sip_userid, loggeduser.sip_password);
    }
  });*/
}

var CloseSession = function(GivenSession){
  if (GivenSession == undefined) return;
  if (window.Debug) console.log("Session Status First:",GivenSession.status)
  if (GivenSession.status ==1 ) GivenSession.cancel();
  if (GivenSession.status ==12 ) GivenSession.bye();
  if (window.Debug) console.log("Session Status Next:",GivenSession.status, GivenSession.Runner)
}

var CallNow = function(sipId, medium, IsScreen) {
  
   if (window.Debug) console.log("callnow ", sipId);
   if (window.Debug) console.log("medium ", medium);
   if (window.Debug) console.log("IsScreen ", IsScreen);
  var usrDetail = GetContactDetailsExt(sipId);
  var img = "images/list-name.png";
  if(usrDetail.ImageURL)
	  img = usrDetail.ImageURL;
	
	var openWin = $(loadCallWin.find('.callWin')).clone();
	$(openWin).find('.callerName').text(usrDetail.caller_id);
	$(openWin).find('.callerImg').attr("src",img);
	$(openWin).find('.ringing').click(function(){
	
		if(window.LastChatWindow != undefined)	
		{	
			$('#ParentWindow').find('.callWin').remove();
			openContactwindow(window.LastChatWindow);	
		}
		else{	openDashBoardWin();	}
		
  });
  
  $('#ParentWindow').find("#ControlWindow").append(openWin);
  
    /*
	SessionRunner++;
	$('#vcanvas').show();
	$('.oncall').hide();

	if (medium =='audio')
	{
		$('.cam-mute').hide();
		$('.cam-unmute').show();
	} 
  else 
  {
		if ($('.jsxc_online.sip' +  sipId).length<1){
			var ToName = $('.sip' + sipId).parent()[0].outerText;
			videoClose();
			swal( ToName + ' is Offline', 'Offline', 'error');
			return ;
		}
		$("#vwindow").modal('show');
		$('.cam-mute').show();
		$('.cam-unmute').hide();
  }
  $(".nav-side-menu").hide();
  
  $(".red").unbind().click(function(){
	$("#vwindow").modal('hide');
    $('#vcanvas').hide();
    $(".nav-side-menu").show();
    CloseSession(sessions[SessionRunner]);
  });

  let callerInfo = jsxc.storage.getUserItem('buddy',  sipId+ jidSuffix);
  var callerName ="";
  if (callerInfo != null){
     callerName = callerInfo.name;
    }
	remoteRender = document.getElementById('remoteVideo');
	localRender = document.getElementById('localVideo');
	var uri = 'sip:' + sipId + '@'+DomainName;
  setTimeout(function(){
    document.getElementById('remoteVideo').src = document.getElementById('selfVideo').src;
  },1000);
  var options = {
    media: {
      constraints: {
        audio: true,
        video: (medium == 'audio') ? false : true
      },
      render: renderHint
    },
    extraHeaders: ['X-webcall: video'],
    params: {
      from_displayName: medium
    }
  };
  if (IsScreen == 0 ){
    $('#selfVideo').show()[0].displayname='Admin';
    $('#localVideo').hide();

    var Videos = document.createElement('video');
	Videos.displayname = $('.joins' + sipId).parent().find('.jsxc_name').first().text();																					
    Videos.className = "SmallVideo";
    Videos.classList.add('ToShare');
    Videos.id = 'RemoteVideo' + sipId;
    Videos.poster="images/tom.jpg";
    Videos.onclick = ZoomMe;
    Videos.autoplay = true;
    var NamePlate=document.createElement('p');
    NamePlate.text = Videos.displayname;

    var vd = document.createElement('div');
    vd.class='FilmReel';
    vd.appendChild(Videos);
	vd.appendChild(NamePlate);
    $('.localVideo').append(vd);
    renderHint.remote = document.getElementById('RemoteVideo' + sipId);
    options.media = { stream: window.ScreenMedia,  render: {
          remote:  document.getElementById('RemoteVideo' + sipId),
          local: document.getElementById('localVideo')
        }
    };
    if (window.Debug) console.log(options);
  } else {
    $('#selfVideo').hide();
    $('#localVideo').show();
  }
  
  if(ua == null)	return;
  sessions[SessionRunner] = ua.invite(uri, options);
  sessions[SessionRunner].Runner = SessionRunner;
  setUpListeners(sessions[SessionRunner], sipId, medium, 'OUT');
  */
};

$(document).ready(function() {
	//UpdateIp();
});


var ShowLocalVideo = function(){
  navigator.getUserMedia({
    audio: true,
    video: true
    },
    function(stream) {
		 if (window.Debug) console.log("hark01-",stream);
      /*var speechEvents = hark(stream, {});
      speechEvents.on('speaking', function() {
        if (window.Debug) console.log('Admin speaking');
        document.getElementById('remoteVideo').src = document.getElementById('selfVideo').src;
      });*/
      MediaStreams.push(stream);
      window.LocalMedia = stream;
      var video = document.getElementById('selfVideo');
      video.src = window.URL.createObjectURL(stream);
      if (window.Debug) console.log('We have got media stream');
      GetScreenMedia();
    },
    function() {
      if (window.Debug) console.log('no stream provided')
    });
}

var GetScreenMedia = function(){
//  navigator.mediaDevices.getUserMedia( { audio: true, video :	true})

  var stream = document.getElementById('vcanvas').captureStream(25);
  var mc = window.LocalMedia.getAudioTracks();
  for (i=0;i<mc.length;i++) stream.addTrack(mc[i]);

  window.ScreenMedia = stream;
  MediaStreams.push(stream);
  var video = document.getElementById('localVideo');
  video.src = window.URL.createObjectURL(stream);
  if (window.Debug) console.log('We have got media stream');
  for(i=0;i<window.invitation.length;i++){
    if (window.Debug) console.log("Calling everybody",window.invitation[i].toString());
    CallNow(window.invitation[i],"video",0);
  }
  var canvas = document.getElementById('vcanvas');
  var ctx = canvas.getContext('2d');
  var video = document.getElementById('remoteVideo');

  // set canvas size = video size when known
  video.addEventListener('loadedmetadata', function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  });

  video.addEventListener('play', function() {
    var $this = this; //cache
    (function loop() {
      if (!$this.paused && !$this.ended) {
        ctx.drawImage($this, 0, 0);
        $('.ToShare').each(function(){
          var pos = $(this).position();	
          var wd = $(this).width();
          var ht = $(this).height();
          ctx.drawImage(this, pos.left, pos.top, wd, ht);
          ctx.font="23px Comic Sans MS";
          ctx.fillStyle = "white";
          ctx.strokeStyle = "black";
          ctx.textAlign = "center";
          ctx.fillText(this.displayname, pos.left+wd, pos.top+ht );
        });
        setTimeout(loop, 1000 / 30); // drawing at 30fps
      }
    })();
  }, 0);

/*
  navigator.mediaDevices.getUserMedia( { audio: false, video :{  mandatory: {
      chromeMediaSource: 'screen',
      maxWidth: 1280,
      maxHeight: 720
    },
    optional: []
  }})
	.then(function(stream) {
    window.ScreenMedia = stream;
    MediaStreams.push(stream);
    var video = document.getElementById('localVideo');
    video.src = window.URL.createObjectURL(stream);
    if (window.Debug) console.log('We have got media stream');
    for(i=0;i<window.invitation.length;i++){
      if (window.Debug) console.log("Calling everybody",window.invitation[i].toString());
      CallNow(window.invitation[i],"video",0);
    }
  })
   .catch(function(err) { 
   if (window.Debug) console.log(err.name + ": " + err.message ); 
   }); 
*/
}


function handleStream(stream) {
  document.querySelector('LocalVideoFrame').src = URL.createObjectURL(stream);
/*  navigator.getUserMedia({
    audio: true,
    video: {
      mandatory: {
        chromeMediaSource: 'screen',
        maxWidth: 1280,
        maxHeight: 720
      },
      optional: []
    },
    function(stream) {
      var video = document.getElementById('LocalVideoFrame');
      video.src = window.URL.createObjectURL(stream);
      if (window.Debug) console.log('We have got media stream');
    },
    function() {
      if (window.Debug) console.log('no stream provided')
    }
  });*/
};

/*
function gifMainWindow(bid)
{
	$(".gifinfo" ).empty();
	$(".gifinfo" ).append("<div class=gifParent><input class=giftext type=text maxlength=25 placeholder=search><div class='row giffile' bid="+bid+"></div></div>" );
	$( ".giftext").keydown(function(ev) {
							
		if ( ev.which == 13 )
		{
			$('.giffile').empty();
			if($(this).val() != "")
			{
				loadGif(bid, $(this).val());
			}
			else {
				swal({
					  title: 'warning',
					  text: "kindly Enter Something!",
					  type: 'warning',
					  timer: 1000,
					  showConfirmButton:false,
					})
				return false;
			}
		}
	});
}
*/

function loadGif(searchText)
{
	var files=[];
	$.get({
		url: 'https://api.giphy.com/v1/gifs/search?q='+searchText+'&api_key=B7GTUROA63ZC3sbQRALG7LrmWML2TSWO&rating=pg-13',
		success: function(res) {
			var result = res.data || [];
			if(result == undefined || result.length <= 0)
			{
				waringAlert("warning","not found");
				sendFileCancel('gif');
				return false;
			}
			for(var i = 0; i<result.length; i++)
			{
				var fileName = JSON.stringify(result[i].title+'.gif');
				var mimetype = "image/gif";  //result[i].type;
				var preview = result[i].images;
				var downloadLink = preview.downsized.url;
				
				var temp = "";
				if($('.col-2 text-center').length == 0) {
						temp += '<div class="col-2 text-center">' +
								'<label class="image-checkbox">' +
								'<img class="img-responsive" src='+downloadLink+' name='+fileName+' mine='+mimetype+' downloadurl='+downloadLink+' />'+
								'<input type="checkbox" class="checkSurfaceEnvironment" name="image[]" value="" />'+
								//'<i class="fa fa-check hidden"></i>' +
								'</label>' +
								'</div>';
						$('.giffile').append(temp);
					}
					else {
						temp +=	'<label class="image-checkbox">' +
							'<img class="img-responsive" src='+downloadLink+' name='+fileName+' mine='+mimetype+' downloadurl='+downloadLink+' />'+
							'<input type="checkbox" name="image[]" value="" />'+
							'<i class="fa fa-check hidden"></i>' +
							'</label>' +
							'</div>';
						$('.col-xs-4 col-sm-3 col-md-2 nopad text-center').append(temp);
					}
				
				if(i == result.length-1)
				{
					var button = '<div class=cloudbtn-section><button id="gifsend" class=btn btn-primary cbtnsend >Select files</button><button class=btn btn-primary cbtnsend mleft-3 data-dismiss="modal" onclick=sendFileCancel(\'gif\')>Cancel</button></div><div class=clearfix></div>';
					$('.giffile').append(button);
					
					$('#gifsend').click(function()
					{
						if( ($('.attachdetail').length !=0 ) && (window.temp != undefined) ) {
								sendFileEnter('gif',window.temp);
								window.temp = undefined;
							}
							else
								sendFileEnter('gif');
					});
				}
			}
				
			$(".image-checkbox").each(function () {
			  if ($(this).find('input[type="checkbox"]').first().attr("checked")) {
				$(this).addClass('image-checkbox-checked');
			  }
			  else {
				$(this).removeClass('image-checkbox-checked');
			  }
			});
			//sync the state to the input
			$(".image-checkbox").on("click", function (e) {
				  $(this).toggleClass('image-checkbox-checked');
				  var $checkbox = $(this).find('input[type="checkbox"]');
				  $checkbox.prop("checked",!$checkbox.prop("checked"))
				  e.preventDefault();
			});		
		},
		error: function(error) {
			wariningAlert("warning","Something Went Wrong...");
		}
	});
}


function Pastefiles(bid, type, file){
	
		if (window.Debug) console.log("bid is",bid);
	
		var jid = jsxc.jidToBid(bid);
		var msg = $('<div><div><label></label></div></div>');
		jsxc.gui.window.showOverlay(jid, msg, true);
		msg.addClass('jsxc_chatmessage');
		var img = "";
		var files = [];
		
		if(type == "copypaste")
		{
			var dat='C:/Users/Public/Pictures/Sample Pictures/Hydrangeas.jpg - C:/Users/Public/Pictures/Sample Pictures/Chrysanthemum dd.jpg - C:/Users/Public/Pictures/Sample Pictures/Desert.jpg - C:/Users/Public/Pictures/Sample Pictures/Koala.jpg - C:/Users/Public/Pictures/Sample Pictures/Lighthouse.jpg - C:/Users/Public/Pictures/Sample Pictures/Penguins.jpg - ';
			//var dat='C:\Users\Public\Pictures\Sample Pictures\Chrysanthemum dd.jpg - C:\Users\Public\Pictures\Sample Pictures\Hydrangeas.jpg - ';
			var result = dat;		
			if(result == undefined)
				return;
			result = result.split(" - "); 
			for (var i = 0; i < 5; i++) {
				(function (i) {
					setTimeout(function () {
						var filePath = result[i];
						if(filePath == undefined)
							return;
						var fileName = path.basename(filePath);
						var mimeType = mime.lookup(filePath);
						
						if (window.Debug) console.log(filePath);
						if (window.Debug) console.log("fileName",fileName);
						if (window.Debug) console.log("mimeType",mimeType);
						var blob = null;
						var xhr = new XMLHttpRequest(); 
						xhr.open("GET", filePath); 
						xhr.responseType = "blob";
						xhr.onload = function() 
						{
							blob = xhr.response;
							var file = new File([blob], fileName,{type:mimeType});
							img = "";
							if (FileReader && file.type.match(/^image\//)) {
								img = $('<img alt="preview" class="img">').attr('title', file.name);
								img.attr('src', jsxc.options.get('root') + '/img/loading.gif');
							}
							jsxc.fileTransfer.fileSelected(jid, msg, file, img);
							files.push(file);
						}
						xhr.send();
					},i);
				})(i);
			}				
		}
		else if(type == "cloud") {
			if (window.Debug) console.log("inside cloude",file.length);
			
			for (var i = 0; i < file.length; i++) {
				(function (i) {	
					setTimeout(function () {
						var filePath = file[i].downloadUrl;
						var fileName = file[i].name;
						var mimeType = file[i].mine;
						if (window.Debug) console.log("filePath",filePath);
						if (window.Debug) console.log("fileName",fileName);
						if (window.Debug) console.log("mimeType",mimeType);
						var blob = null;
						var xhr = new XMLHttpRequest(); 
						xhr.open("GET", filePath); 
						xhr.responseType = "blob";
						xhr.onload = function() 
						{
							blob = xhr.response;
							var file = new File([blob], fileName,{type:mimeType});
							img = "";
							if (FileReader && file.type.match(/^image\//)) {
								img = $('<img alt="preview" class="img">').attr('title', file.name);
								img.attr('src', jsxc.options.get('root') + '/img/loading.gif');
							}
							jsxc.fileTransfer.fileSelected(jid, msg, file, img);
							files.push(file);
						}
						xhr.send();			
					},i);
				})(i);
			}
		}
		$('.btnsection').remove();
		var button = "<div class='btnsection'><button id='abortbtn' class='fileSend'>send</button><button id='abortbtn' class='fileabord'>abort</button></div>";
		msg.append(button);
		$('.fileSend').click(function(){
			if (window.Debug) console.log("file send");
			jsxc.gui.window.hideOverlay(bid);
			
			var isflag = false;
			var data = $('.jsxc_flag').attr("title");
			if(data == "fill")
				isflag = true;
			
			for (var i =0;i<files.length;i++)
			{
				var file = files[i];
				if (window.Debug) console.log("file.name00 :",file.name)
				if (window.Debug) console.log("file.size00 :",file.size)
				if (window.Debug) console.log("file.type00 :",file.type)
				
				var imgSrc = $(".img[title|='"+file.name+"']").attr('src');	
				var message = jsxc.gui.window.postMessage({
					bid: bid,
					direction: 'out',
					flag: isflag,
					attachment: {
						name: file.name,
						size: file.size,
						type: file.type,
						data: (file.type.match(/^image\//)) ? imgSrc : null
					}
				});
				if (window.Debug) console.log("sending post msg is",message);
				//jsxc.xmpp.httpUpload.sendFile(file, message);
			}
			$('.jsxc_flag').attr("title",'notfill');
			$('.jsxc_flag').removeClass("setFlagbackground");
		});
		$('.fileabord').click(function(){
			if (window.Debug) console.log("file abord");
			if( $('.cloudParent').length != 0 )
				$('.cloudParent').remove();
			jsxc.gui.window.hideOverlay(jid);
		});

}

function setUpListeners(thisSession, callerSip, medium, boud) {
	
	  window.Watchman = setInterval(function(){

			if(thisSession.mediaHandler == undefined)
			{
				clearInterval(window.Watchman);
      return;
			}
    var lPeerConnection = thisSession.mediaHandler.peerConnection;
    if (lPeerConnection.signalingState =="closed" || lPeerConnection == undefined) {
      clearInterval(window.Watchman);
      return;
		}
		var packetLoss= "";
		var googRtt= "";
		var googJitterBufferMs= "";
		if (lPeerConnection && lPeerConnection.getStats){
			lPeerConnection.getStats(function(stats) {
				var report = stats.result();
				 if (window.Debug) console.log("report",  report);
				for(i=0;i<report.length;i++){
					if (report[i].id.startsWith('ssrc') || report[i].id.startsWith('Conn-audio')){
						//console.log(report[i].id);
						report[i].names().forEach(function(name) {
							if (name.includes("Jitter") || name.includes('Lost') || name.includes('Rtt')){
								 if (window.Debug) console.log(i,name, report[i].stat(name));
								var str = report[i].id;
								var res = str.substring(str.length-4); 

								


								if(name == "packetsLost")
									packetLoss = report[i].stat(name);

								if(name == "googRtt")
								googRtt = report[i].stat(name);
	
								if(name == "googJitterBufferMs")
								googJitterBufferMs = report[i].stat(name);
	
							
								$("#ssrc" + res + name ).val(report[i].stat(name));
								$("#audio" + name ).val(report[i].stat(name));
							}
					 
						 });
						 
						 if (window.Debug) console.log("packetLoss= "+packetLoss);
						 if (window.Debug) console.log("googRtt= "+googRtt);
						 if (window.Debug) console.log("googJitterBufferMs= "+googJitterBufferMs);

							if((packetLoss >= 10) || (packetLoss == "")) {  //Low
								 if (window.Debug) console.log("Packet loss low is calling")
									$('.audioweak').css({"background": "#FF0000"});
									$('.audiomedium').css({"background": "#FF0000"});
									$('audiostrong').css({"background": "#FF0000"});
								} else if((packetLoss >= 5) && (packetLoss != "")) {  //Medium
									 if (window.Debug) console.log("Packet loss Medium is calling")
									$('.audioweak').css({"background": "#5da25d"});
									$('.audiomedium').css({"background": "#5da25d"});
									$('.audiostrong').css({"background": "#e2e2dc"});
								} else if((googRtt > 5000) || (googRtt == "")) {  //Low
									 if (window.Debug) console.log("googRtt Low is calling");
									$('.audioweak').css({"background": "#FF0000"});
									$('.audiomedium').css({"background": "#FF0000"});
									$('audiostrong').css({"background": "#FF0000"});
								}else if((googRtt >= 3500) && (googRtt != "")) {  //Medium
									 if (window.Debug) console.log("googRtt Medium is calling");
									$('.audioweak').css({"background": "#5da25d"});
									$('.audiomedium').css({"background": "#5da25d"});
									$('.audiostrong').css({"background": "#e2e2dc"});
								}else if((googJitterBufferMs > 50) || (googJitterBufferMs == "")) {  //Low
									 if (window.Debug) console.log("googJitterBufferMs Low is calling");
								$('.audioweak').css({"background": "#FF0000"});
								$('.audiomedium').css({"background": "#FF0000"});
								$('audiostrong').css({"background": "#FF0000"});
							}else if((googJitterBufferMs >= 40) && (googJitterBufferMs != "")) {  //Medium
								 if (window.Debug) console.log("googJitterBufferMs Medium is calling");
								$('.audioweak').css({"background": "#5da25d"});
								$('.audiomedium').css({"background": "#5da25d"});
								$('.audiostrong').css({"background": "#e2e2dc"});
							}
							else {  //High
								 if (window.Debug) console.log("High is calling");
									$('.audioweak').css({"background": "#5da25d"});
									$('.audiomedium').css({"background": "#5da25d"});
									$('.audiostrong').css({"background": "#5da25d"});
								} 

						 
					}
				} 
			})
		}
	},2000);

	
	thisSession.mediaHandler.on('camera-error', function(a) {
		 if (window.Debug) console.log("Camera Error");
		swal({
					  title: "Device Problem",
					  text: "Could not access Camera.  Please check !",
					  icon: "warning",
					  buttons: [
						'Ok'
					  ],
					  dangerMode: true,
					}).then(function() {
						videoClose();
					});
	});
	thisSession.mediaHandler.on('mic-error', function(a) {
		 if (window.Debug) console.log("Mic Error");
		swal({
					  title: "Device Problem",
					  text: "Could not access Microphone.  Please check !",
					  icon: "warning",
					  buttons: [
						'Ok'
					  ],
					  dangerMode: true,
					}).then(function() {
						videoClose();
					});
	});
  thisSession.mediaHandler.on('addStream', function(a) {
    MediaStreams.push(a.stream);
     if (window.Debug) console.log(thisSession.Runner);
	 if (window.Debug) console.log("hark02-",a.stream);
    /*var speechEvents = hark(a.stream, {});
    speechEvents.on('speaking', function() {
		console.log('speaking',thisSession.remoteIdentity.uri.user);
		var md = document.getElementById('RemoteVideo' + thisSession.remoteIdentity.uri.user);
		if (md!=undefined)
			document.getElementById('remoteVideo').src	 =	 md.src;
    });*/

//      sessions[thisSession.Runner].mediaHandler.render(sessions[thisSession.Runner].mediaHint);
//    sessions[SessionRunner].mediaHandler.render(renderHint);
  });
  thisSession.on('hold', function(e){
	   if (window.Debug) console.log('Hold From ',e);
	  document.getElementById('onhold').play();
	  document.getElementById('localVideo').pause();
	  document.getElementById('remoteVideo').pause();
  });
  thisSession.on('unhold', function(e){
	   if (window.Debug) console.log('Un Hold From ',e);
	  document.getElementById('onhold').pause();
	  document.getElementById('localVideo').play();
	  document.getElementById('remoteVideo').play();
//      $('.call-unhold').hide();
//	  $('.call-hold').show();
  });
  thisSession.on('accepted', function(e) {
    window.thisSession = thisSession;
    $("#vwindow").modal('show');
    $('#vcanvas').show();
    $('.call-unhold').hide();
    $('.call-hold').show();
    $('.oncall').show();
    $(".nav-side-menu").hide();
    callTimer.start(1000);
    $(".mic-unmute").show();
    $(".mic-mute").hide();
    if (window.Debug) console.log('accepted');
    $(".red").click(function(){
      if (thisSession !=0)     CloseSession(thisSession);
    });
/*    $(".cam-unmute").click(function(){
      var option = { audio: false, video: true };
      thisSession.unmute(option);
      if (window.Debug) console.log(option,thisSession);
      $(".cam-unmute").hide();
      $(".cam-mute").show();
    });
    $(".cam-mute").click(function(){
      var option = { audio: false, video: true };
      thisSession.mute(option);
      if (window.Debug) console.log(option,thisSession);
      $(".cam-mute").hide();
      $(".cam-unmute").show();
    });
    $(".mic-unmute").click(function(){
      var option = { audio: true, video: false };
      thisSession.unmute(option);
      $(".mic-unmute").hide();
      $(".mic-mute").show();
    });
    $(".mic-mute").click(function(){
      var option = { audio: false, video: false };
      thisSession.mute(option);
      $(".mic-mute").hide();
      $(".mic-unmute").show();
    });
    */
  });

  thisSession.on('bye', function(e) {
	document.getElementById('onhold').pause();
    callTimer.stop();
    SaveCallRegister(boud, medium, callerSip, thisSession.startTime, utils.secondsToTime(callTimer.getTime()));
    sessions[thisSession.Runner] = null;
    thisSession = 0;
    var destroynow = true;
    for(i=0;i<sessions.length;i++){
        if (sessions[i]!=null){
          destroynow = false; break;
        }
    }
    if (destroynow == true){
      videoClose();
      $("#vwindow").modal('hide');
      $('#vcanvas').hide()
      $(".nav-side-menu").show();
    }
  
    callTimer.reset();
  });

  thisSession.on('progress', function(e) {
    if (window.Debug) console.log("Status :",thisSession.status )
    if (window.Debug) console.log('progress');
  });

  thisSession.on('connecting', function(e) {
    if (window.Debug) console.log("Status :",thisSession.status )
    if (window.Debug) console.log('connecting');
  });

  thisSession.on('rejected', function(response, cause) {
    if (window.Debug) console.log("Status :",thisSession.status )
    if (window.Debug) console.log('REJECTED');
    if (window.Debug) console.log(response);
    if (window.Debug) console.log(cause);
    if (cause == 'Not Found') {
      SaveCallRegister(boud, medium, callerSip, new Date(), 'Busy - Call Rejected');
    } else if (cause == 'SIP Failure Code') {
      SaveCallRegister(boud, medium, callerSip, new Date(), 'Call canceled by you');
    } else if (cause == 'Temporarily Unavailable') {
      SaveCallRegister(boud, medium, callerSip, new Date(), 'Call Rejected by you');
    } else if (cause == 'Canceled') {
      SaveCallRegister('MISS', medium, callerSip, new Date(), 'Duration : 00:00:00');
    }
    sessions[thisSession.Runner] = null;
  });
  thisSession.on('terminated', function(data) {
    if (window.Debug) console.log("Status :",thisSession.status )
    if (window.Debug) console.log('terminated');
//    videoClose();
    sessions[thisSession.Runner] = null;
  });

  thisSession.on('failed', function(data) {
    if (window.Debug) console.log("Status :",thisSession.status )
    if (window.Debug) console.log('FAILED');
    videoClose();
    sessions[thisSession.Runner] = null;
  });

  thisSession.on('cancel', function(e) {
    if (window.Debug) console.log("Status :",thisSession.status )
    if (window.Debug) console.log('cancel ');
    videoClose();
    sessions[thisSession.Runner] = null;
  });
}

function _timer(callback) {
  var time = 0; //    The default time of the timer
  var mode = 1; //    Mode: count up or count down
  var status = 0; //  Status: timer is running or stoped
  var timer_id; //    This is used by setInterval function

// this will start the timer ex. start the timer with 1 second interval timer.start(1000)
  this.start = function(interval) {
    interval = (typeof(interval) !== 'undefined') ? interval : 1000;
    if (status == 0) {
      status = 1;
      timer_id = setInterval(function() {
        switch (mode) {
          default: if (time) {
            time--;
            generateTime();
            if (typeof(callback) === 'function') callback(time);
          }
          break;

          case 1:
              if (time < 86400) {
              time++;
              generateTime();
              if (typeof(callback) === 'function') callback(time);
            }
            break;
        }
      }, interval);
    }
  }

//  Same as the name, this will stop or pause the timer ex. timer.stop()
  this.stop = function() {
    if (status == 1) {
      status = 0;
      clearInterval(timer_id);
    }
  }

// Reset the timer to zero or reset it to your own custom time ex. reset to zero second timer.reset(0)
  this.reset = function(sec) {
    sec = (typeof(sec) !== 'undefined') ? sec : 0;
    time = sec;
    generateTime(time);
  }

// Change the mode of the timer, count-up (1) or countdown (0)
  this.mode = function(tmode) {
    mode = tmode;
  }

// This methode return the current value of the timer
  this.getTime = function() {
    return time;
  }

// This methode return the current mode of the timer count-up (1) or countdown (0)
  this.getMode = function() {
    return mode;
  }
 
// This methode return the status of the timer running (1) or stoped (1)
  this.getStatus
  {
    return status;
  }

  // This methode will render the time variable to hour:minute:second format
  function generateTime() {
    var second = time % 60;
    var minute = Math.floor(time / 60) % 60;
    var hour = Math.floor(time / 3600) % 60;

    second = (second < 10) ? '0' + second : second;
    minute = (minute < 10) ? '0' + minute : minute;
    hour = (hour < 10) ? '0' + hour : hour;

    $('div.timer span.second').html('<b><font color="white">' + second + '</font></b>');
    $('div.timer span.minute').html('<b><font color="white">' + minute + ':</font></b>');
    $('div.timer span.hour').html('<b><font color="white">' + hour + ':</font></b>');
  }
}


function setbookmarklike(mId, bid, mode)
{
	mId = mId.replace(":","-");
	likemessage(mId, bid, mode);
	loadbookmark();
}
function newEventPlusIcon() 
{
	var mainDiv= '<div class="eventTextarea"><input type="text" placeholder="Event">\n'+
	'<div class="dropdown">\n'+
	'<button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n'+
    'Dropdown button\n'+
  '</button>\n'+
  '<div class="dropdown-menu" aria-labelledby="dropdownMenuButton">\n'+
    '<a class="dropdown-item" href="#">Action</a>\n'+
   ' <a class="dropdown-item" href="#">Another action</a>\n'+
    '<a class="dropdown-item" href="#">Something else here</a>\n'+
  '</div>\n'+
'</div>';
	$('.newEventdetail').append(mainDiv);
}
function newTaskPlusIcon() 
{
	alert("newTaskPlusIcon")
}
function newNotePlusIcon() 
{
	alert("newNotePlusIcon")
}


function getbuddydetail(bid,arg)
{
	var data = jsxc.storage.getUserItem('buddy', bid) || [];
	
	 if (window.Debug) console.log("data",data);
	 if (window.Debug) console.log(data.name);
	 if (window.Debug) console.log(data.JSON.stringify(arg));
	 if (window.Debug) console.log(arg);
	if(data.length !=0)
		return data.arg;
	else
		return;
}

function initiatenotes()
{
	window.LastChatWindow = undefined;
	$("#clientview").empty();
	$('#clientview').load("views/ShowNotesCli.html");
}
function setclickEvent()
{
	$('td').click(function(){
		var row_index = $(this).parent().index();
		var col_index = $(this).index();	
		$(this).parent().parent().parent().addClass('active').siblings().removeClass('active');		
		$(this).parent().addClass('highlight').siblings().removeClass('highlight');
		$(this).parent().attr("name",row_index +'_'+ col_index).siblings().removeAttr('name');
	});
}
function insertItem(mode)
{
	$('table').each(function() {
		if( $(this).attr('class') == "active" )
		{
			var rowCount = $(this).find('tr').length;
			var columnCount = $(this).find('td').length / rowCount;
			 if (window.Debug) console.log("rowCount",rowCount);
			 if (window.Debug) console.log("columnCount",columnCount);
			var html = "";

			html +='<tr>';
			for(var j = 0; j<columnCount; j++)
			{
				html +='<td>&#8203;</td>';
			}
			html +='</tr>';

			 if (window.Debug) console.log("html",html);

			var SearchFieldsTable = $(this).children('tbody')
			var trows = SearchFieldsTable[0].rows;
			var ColumnName = "";
			$.each(trows, function (index, row) {
				if( $(row).attr("name") != undefined )
					ColumnName = $(row).attr("name");
			});
			if( ColumnName != undefined )
			{
				 if (window.Debug) console.log("name",ColumnName);
				var rowIndex = ColumnName.split('_')[0];
				var colIndex = ColumnName.split('_')[1]; 
				
				 if (window.Debug) console.log("rowIndex",rowIndex);
				
				if(mode == "insertrowabove")
					$('.active > tbody > tr').eq(rowIndex).before(html);
				else if(mode == "insertrowbelow")
					$('.active > tbody > tr').eq(rowIndex).after(html);
				else if(mode == "insertcolumnleft") {
					$(".active tbody tr").each(function() {
						var html = "<td>&#8203;</td>"
						$(this).find("td:eq("+colIndex+")").before(html);
					});	
				}	
				else if(mode == "insertcolumnright") {
					$(".active tbody tr").each(function() {
						var html = "<td>&#8203;</td>"
						$(this).find("td:eq("+colIndex+")").after(html);
					});	
				}

				setclickEvent();
			}
			
		}
	});
}

function deleteItem(mode)
{
	$('table').each(function() {
		if( $(this).attr('class') == "active" )
		{	
			if(mode == "deletetable")
			{
				$(this).remove();
			}
			else
			{
				var SearchFieldsTable = $(this).children('tbody')
				var trows = SearchFieldsTable[0].rows;
				var tableIndex = "";
				$.each(trows, function (index, row) {
					if( $(row).attr("name") != undefined )
						tableIndex = $(row).attr("name");
				});
				if( tableIndex != undefined )  
				{
					 if (window.Debug) console.log("name",tableIndex);
					var rowIndex = tableIndex.split('_')[0];
					var colIndex = tableIndex.split('_')[1];
					 if (window.Debug) console.log("rowIndex",rowIndex)
					 if (window.Debug) console.log("colIndex",colIndex)	
					if(mode == "deleterow")
						$('.active > tbody > tr').eq(rowIndex).remove();
					else if(mode == "deletecolumn") {
						$(".active tbody tr").each(function() {
							$(this).find("td:eq("+colIndex+")").remove();
						});	
					}
					
				}
			}
		}
	});
}

function clearNotes()
{
	if($('#createNoteEdit').length == 0)
	{
		swal({
		  title: "Are you sure?",
		  text: "You want To Discard Note !",
		  icon: "warning",
		  buttons: [
			'No, cancel it!',
			'Yes, I am sure!'
		  ],
		  dangerMode: true,
		}).then(function(isConfirm) {
		  if (isConfirm) {
			$('.textareaNote').html('');
			$('.textareaNote').attr('contenteditable',true);
			$('.textareaNote').css('background-color','rgb(255, 255, 255)');
			$('#createNoteSave').removeAttr('name');
		  }
		})
	}
	else
	{
		 $('.textareaNote').html('');
		 $('#createNoteEdit').remove();
		 $('#createNoteDelete').remove();
		 $('.textareaNote').attr('contenteditable',true);
		 $('.textareaNote').css('background-color','rgb(255, 255, 255)');
		 $('#createNoteSave').removeAttr('name');
	}
}
function postNotes(id)
{
	/*if(window.LastChatWindow != undefined) {
		alert(window.LastChatWindow);
	}
	else{
		alert("undefined");
	}*/
	if(id != undefined)
		bid = id;
	
	var data = $('.textareaNote').html();
	if( $('.textareaNote').html().length == 0) {
		waringAlert("warning","Note Area Is Empty !");
	}
	else{
		var fileName = "";
		var noteName =$('#createNoteSave').attr('name');
		if(noteName != undefined) {
			fileName = atob(noteName);
			var temp = savePost(fileName);
			if(temp)
			{
				sendCreateNoteFile(fileName, data, bid);
				$('.jsxc_textarea_content').show();
				$('.createnotes').remove();
				$('.jsxc_textarea').show();
			}
			//else
				//return false;
		}
		if(fileName == "")
		{
			ezBSAlert({
			  type: "prompt",
			  messageText: "Please Enter FileName",
			  alertType: "primary"
			}).done(function (e) {
				if(e == "")
					return;
				
				fileName = e+ ".txt";
				var temp = savePost(fileName);
				if(temp)
				{
					sendCreateNoteFile(fileName, data, bid);
					$('.jsxc_textarea_content').show();
					$('.createnotes').remove();
					$('.jsxc_textarea').show();
				}
				//else
					//return false;
			});
		}
		if(id != undefined) {
			noteclose();
			jsxc.gui.window.open(id);
		}
	}
}

function noteclose()
{
	$('.createnotes').remove();
	$('#clientview').show();
	$('.jsxc_textarea_content').show();
	$('#createNoteSave').removeAttr('name');
}


function showcontact()
{
	$('.PostContactlist').empty();
	var result = jsxc.storage.getUserItem('buddylist');
	  $.each(Buddies, function (index, item) {
			 data = jsxc.storage.getUserItem('buddy', item);
			 if(data == null)
				return false;
			
			var div ='<div class="cname" data-dismiss="modal" onClick="postNoteId(\''+data.jid+'\');">'+data.name+'</div>';
			if( $('.PostContactlist').length !=0 )
				$('.PostContactlist').append(div);
	  })
}
function postNoteId(id)
{
	postNotes(id);
}


function notedelete(fName)
{
	 if (window.Debug) console.log("fmane is",fName);
	swal({
		  title: "Are you sure?",
		  text: "You want To Discard Note !",
		  icon: "warning",
		  buttons: [
			'No, cancel it!',
			'Yes, I am sure!'
		  ],
		  dangerMode: true,
		}).then(function(isConfirm) {
			if (isConfirm) {
				var notesHistory = localStorage.getItem('jsxc:' + jsxc.bid + ':noteshistory') || []
				 if (window.Debug) console.log("notesHistory",notesHistory);
				if(notesHistory.length == 0)
					return;
				notesHistory = JSON.parse(notesHistory);
				for(var j = 0; j <notesHistory.length; j++)
				{
					if( notesHistory[j].text == fName)
					{
						notesHistory.splice(j,1);
						localStorage.setItem('jsxc:' + jsxc.bid + ':noteshistory', JSON.stringify(notesHistory))
						localStorage.removeItem( 'jsxc:' + jsxc.bid + ':' + $('#createNoteSave').attr('name') );
						loadRightSideTask();
						noteclose();
					}
				}
			}
		});
}

function saveNotes()
{
	if( $('.textareaNote').html().length == 0) 
			waringAlert("warning","Note Area Is Empty !");
	else{
		if (window.Debug) console.log("sss",$('.textareaNote').attr('contenteditable'));
		if($('.textareaNote').attr('contenteditable') == 'true')			
		{	
			var noteName =$('#createNoteSave').attr('name');
			
			if(noteName != undefined) {
				savePost( atob(noteName) );
			}
			else {
				ezBSAlert({
				  type: "prompt",
				  messageText: "Please Enter FileName",
				  alertType: "primary"
				}).done(function (e) {
					savePost(e);
				});
			}
		}
		else {
			if (window.Debug) console.log("return");
			return false;
		}
	}
}


function savePost(fileName) {

		if(fileName == "" ) 
		{
			waringAlert("warning","Please Enter Valid FileName !");
			$('.textareaNote').focus();
			return false;
		}
		else
		{
			var notesHistory = localStorage.getItem('jsxc:' + jsxc.bid + ':noteshistory') || []
			if(notesHistory.length != 0)
				notesHistory = JSON.parse(notesHistory);
			
			if($('#createNoteSave').attr('name') == undefined) {
				for(var i = 0; i<notesHistory.length; i++)
				{
					if( fileName == atob(notesHistory[i].text) )
					{
						waringAlert("warning","FileName Already Exist !");
						$('.textareaNote').focus();
						return false;
					}
				}
			}
			fileName = btoa(fileName);
			var storearray = {};
			storearray.bid = window.LastChatWindow;
			storearray.text = fileName;
			storearray.date = new Date();
			
			notesHistory.push(storearray);
			if (window.Debug) console.log("$('#createNoteSave').attr('name')",$('#createNoteSave').attr('name'));
			
			if($('#createNoteSave').attr('name') == undefined)
				localStorage.setItem('jsxc:' + jsxc.bid + ':noteshistory', JSON.stringify(notesHistory));
		
			localStorage.setItem('jsxc:' + jsxc.bid + ':' + fileName, $('.textareaNote').html());
			//waringAlert("success","Note Saved !");
			$('.textareaNote').html('');
			$('.textareaNote').focus();
			$('#createNoteSave').removeAttr('name');

			//loadRightSideTask();
			noteclose();

			/*if( $('#createNoteEdit').length != 0 ) {
				$('#createNoteEdit').remove();
				$('#createNoteDelete').remove();
			}*/
		}
	return true;
}
function showNotes(dataLink, fName)
{
	$.get( dataLink, function( data ) {
		noteopen(fName, data);
	});	
}

function moreSetting(msgId,check)
{
	if(check == undefined)
		check = true;
	
	$('.contactinfo').empty();
	var result = jsxc.storage.getUserItem('buddylist');
	  $.each(result, function (index, item) {
			 data = jsxc.storage.getUserItem('buddy', item);
			 if(data == null)
				return false;
			var div='<div class="cname" data-dismiss="modal" onclick=moveconversation("'+data.jid+'","'+msgId+'",'+check+')>'+data.name+'</div>';
			
			if( $('.contactinfo').length !=0 )
				$('.contactinfo').append(div);
	  })
}

function moveconversation(bid,msgId,check)
{
	//$('#showContatInfo').remove();
	$('.modal-backdrop').remove();
	
	var id = msgId.replace("-", ":");
	
	var message = jsxc.storage.getUserItem('msg',id);

	var removeHistory = message.bid;

	if(message.attachment != undefined)
	{
		if( (message.mode != undefined) && (message.mode == 'createnote') )
		{
			$.get( message.msg, function( data ) {
				sendCreateNoteFile(message.attachment.name,data,bid);
				if(check)
					removeMessage(msgId, removeHistory);
			})
		}
		else{
			var list = [];
			var file = [];
			list.name = message.attachment.name;
			list.mine = message.attachment.type;
			list.downloadUrl = message.msg;
			list.mode = message.mode;
			file.push(list);
			sendFileToServer(file,bid);
			if(check)
				removeMessage(msgId, removeHistory);
		}
	}
	else
	{
		var textmsg = message.msg;
		var urlLink = false;
		var urlTitle = "";
		
		if(message.urlLink){
			urlLink = true;
			urlTitle = message.urlTitle
		}
	    jsxc.gui.window.postMessage({
			bid: bid,
			direction: jsxc.Message.OUT,
			msg: textmsg,
			urlLink:urlLink,
			urlTitle:urlTitle
		});
		SaveChatRegister(bid, textmsg, new Date());
		if(check)
			removeMessage(msgId, removeHistory);
	}
	
	if(check)
	{
		if( $('.attachdetail').length )
		{
			$('.attachdetail').remove();
			$('.loaddetail').show();
		}
	}
	
}


function removeMessage(msgId, remoteId)
{
	if(remoteId != undefined)
		bid = remoteId;
	
	var id = msgId.replace("-", ":");
	var bookmarkId = msgId.replace(":msg", "-bookmark");
	setFlagMode(id, false);					// remove flag message from list
	setBookmark(id, false);
	
	jsxc.storage.removeUserItem('msg', id);
	$('#'+msgId).remove();
	//('#NRmsg_Out').find(msgId).remove();
	if($('#NRmsg_Out').attr("msg_id") == msgId)
	{
		$(this).remove();
	}
	$('#'+bookmarkId).remove();

	var removeHistory = "jsxc:"+jsxc.bid+":history:"+bid;
	var getData = JSON.parse(localStorage.getItem(removeHistory)) || [];
	if(getData.length > 0)
	{
		for(var i=0; i<getData.length; i++)
		{
			if(getData[i] == id)
			{
				 if (window.Debug) console.log("ddd",getData[i]);
				getData.splice(i, 1);
			}
		}
		localStorage.setItem(removeHistory,JSON.stringify(getData));
	}
	
	var q1 = jsxc.storage.getUserItem('recentmentions') || [];	
	if(q1.length > 0)
	{
		for(var k=0; k<q1.length; k++)
		{
			if(q1[k] == msgId)
			{
				q1.splice(k, 1);
			}
		}
		jsxc.storage.setUserItem('recentmentions', q1);
	}
}

function editFilename(uid)
{	
	ezBSAlert({
			  type: "prompt",
			  messageText: "Please Enter FileName",
			  alertType: "primary"
			}).done(function (e) {
				if(e == "")
					return;
				
				var fileName="unknow";
				var id = uid.replace("-",":");
				var result = jsxc.storage.getUserItem('msg', id);
				if(result == null)
					return true
				
				if(result.urlLink)
					fileName = e;
				else{
					var oldFileName = $('#'+uid+'_Inner').html();
					if(oldFileName == undefined)
						return;
					var oldFileExt = oldFileName.substring(oldFileName.lastIndexOf(".")+1);
					fileName = e+"."+oldFileExt;
				}
				changeAttachmentName(uid, fileName);
				
				if( (result.mode != undefined) && (result.mode == "createnote") )
					changehistoryname(oldFileName, fileName);
				
				jsxc.gui.window.postMessage({
					bid: window.LastChatWindow,
					direction: jsxc.Message.OUT,
					msg: fileName,
					editfilename: true,
					editfilename_id: uid
				});	
			});	
}


function changeAttachmentName(uid, fileName)
{
	var id = uid.replace("-",":");
	var result = jsxc.storage.getUserItem('msg', id);
	if(result == null)
		return true;
	
	if(result.urlLink)
	{
		$('#'+uid+'_Inner').html('<a href="#" onClick="openBrowserWin(\''+result.msg+'\');">'+fileName+'</a>');
		result.urlTitle = fileName;
		jsxc.storage.setUserItem('msg', id, result);
	}
	else
	{
		$('#'+uid+'_Inner').html(fileName);
		$('#'+uid).children('.sendername').find('a').attr("download",fileName);
		$('#'+uid).children('.sendername').find('img').attr("title",fileName);
		
		result.attachment.name = fileName;	
		jsxc.storage.setUserItem('msg', id, result);
	}
	/*if( $('.attachEditImg').length )
		viewAttachment(uid);*/
}
function changehistoryname(oldname, newname)
{
	var notesHistory = localStorage.getItem('jsxc:' + jsxc.bid + ':noteshistory') || []
	if(notesHistory.length == 0)
		return '';
	
	notesHistory = JSON.parse(notesHistory);
	for(var i = 0; i<notesHistory.length; i++)
	{
		if(notesHistory[i].text == btoa(oldname) )
			notesHistory[i].text = btoa(newname);
	}
	
	var key = 'jsxc:' + jsxc.bid + ':' + btoa(oldname);
	var note = localStorage.getItem(key);
	localStorage.removeItem(key);
	key = 'jsxc:' + jsxc.bid + ':' + btoa(newname);
	localStorage.setItem(key,note);
	localStorage.setItem('jsxc:' + jsxc.bid + ':noteshistory', JSON.stringify(notesHistory));
	loadRightSideTask();
}
function setbookmarkflag(uid, mode)
{
	var id = uid.replace(":msg","_Pinbtn");
	if(mode){
		var result = confirm("Do you want to Set pin");
		if(result)
		{
			$('#'+id).attr('onclick','setbookmarkflag("'+uid+'",'+false+')');
			$('#'+id).attr("title","UnPin");
		}
	}
	else {
		var result = confirm("Do you want to Remove pin");
		if(result)	
		{
			$('#'+id).attr('onclick','setbookmarkflag("'+uid+'",'+true+')');
			$('#'+id).attr("title","Pin");
		}
	}
	setFlagMode(uid, mode);
}

function setFlagMode(uid, mode) {
	
	var result = jsxc.storage.getUserItem('msg', uid);
	if(result == null)
		return true;
	
	var key = 'jsxc:' + jsxc.bid + ':pinpost';
	var data = JSON.parse(localStorage.getItem(key)) || [];
	/*var Id = uid.replace(":", "-")
	var pinbtn =  Id + '_pinbtn';
	var unPinbtn =  Id + '_unPinbtn'; 
	var taskPinBtn = Id+"_taskPin";  
	var pin_dtask = "pin_dtask"+Id;
	var unpin_dtask = "unpin_dtask"+Id; */
	if(mode) {
		result.flag = true;
		data.push(uid);
		/*$("#"+pinbtn+", #"+pin_dtask).hide();
		$("#"+unPinbtn+", #"+unpin_dtask).show();
		$("#"+taskPinBtn).html("<img src=\"images/icons/pin-s.png\" alt=\"\"> UnPin");		
		$("#"+taskPinBtn).attr('onclick', 'setFlagMode("'+uid+'",false)');*/
	}
	else {
		result.flag = false;
		for(var i=0;i<data.length;i++)
		{
			if(data[i] == uid)	data.splice(i, 1);
		}
		/*$("#"+unPinbtn+", #"+unpin_dtask).hide();
		$("#"+pinbtn+", #"+pin_dtask).show();
		$("#"+taskPinBtn).html("<img src=\"images/icons/pin-s.png\" alt=\"\"> Pin");
		$("#"+taskPinBtn).attr('onclick', 'setFlagMode("'+uid+'",true)');*/
	}
	localStorage.setItem(key,JSON.stringify(data));
	jsxc.storage.setUserItem('msg', uid, result);	
	
	
	if( $('.bmkShowWin ').length !=0 )		//check current page is bookmark--
		openBookMarkWin();
	else if( $('.mentionWin ').length !=0 )		//check current page is mention--
		BrowserMention();
		
		
	
	/*if($('.attachdetail').length){
		if(mode)	$('#'+uid.replace(":","-")).children('.rightIconBox').find('.msgPin').attr("title","UnPin");
		else	$('#'+uid.replace(":","-")).children('.rightIconBox').find('.msgPin').attr("title","Pin");
		viewAttachment(uid);
	}
	else	loadRightSideTask();*/
	
	//if($('.dashBoardWind').length != 0)
		//getDashboardTasklist();
}

function setBookmark(uid, mode)
{
	var result = jsxc.storage.getUserItem('msg', uid);
	if(result == null)
		return true;
	
	var key = 'jsxc:' + jsxc.bid + ':bookmark';
	var data = JSON.parse(localStorage.getItem(key)) || [];
	/*var Id = uid.replace(":", "-");
	var bookmarkbtn =  Id + '_bookmark';
	var unBookmarkbtn =  Id + '_Unbookmark';
	var taskBookmarkBtn = Id+"_taskBookmark";
	var bookmark_dtask = "bookmark_dtask"+Id;
	var unbookmark_dtask = "unbookmark_dtask"+Id;*/
	if(mode) {
		result.bookmark = true;
		data.push(uid);
		/*$("#"+bookmarkbtn+", #"+bookmark_dtask).hide();
		$("#"+unBookmarkbtn+", #"+unbookmark_dtask).show();
		$("#"+taskBookmarkBtn).html("<img src=\"images/icons/bookmark-s.png\" alt=\"\"> UnBookmark");	
		$("#"+taskBookmarkBtn).attr('onclick', 'setBookmark("'+uid+'", false)');*/
	}
	else {
		result.bookmark = false;
		for(var i=0;i<data.length;i++)
		{
			if(data[i] == uid)
				data.splice(i, 1);
		}
		/*var id = uid.replace(":msg","-bookmark");
		$('#'+id).remove();
		$("#"+unBookmarkbtn+", #"+unbookmark_dtask).hide();
		$("#"+bookmarkbtn+", #"+bookmark_dtask).show();

		$("#"+taskBookmarkBtn).html("<img src=\"images/icons/bookmark-s.png\" alt=\"\"> Bookmark");
		
		$("#"+taskBookmarkBtn).attr('onclick', 'setBookmark("'+uid+'", true)');*/
	}

	localStorage.setItem(key,JSON.stringify(data));
	jsxc.storage.setUserItem('msg', uid, result);
	
	
	if($('.attachdetail').length){
		if(mode) 
			$('#'+uid.replace(":","-")).children('.rightIconBox').find('.msgBookmark').attr("title","Remove Bookmark");
		else
			$('#'+uid.replace(":","-")).children('.rightIconBox').find('.msgBookmark').attr("title","Bookmark");
		
		viewAttachment(uid);
	}
	if($('.dashBoardWind').length != 0)
		getDashboardTasklist();
	
	if( $('.bmkShowWin ').length !=0 )		//check current page is bookmark--
		openBookMarkWin();
	else if( $('.mentionWin ').length !=0 )		//check current page is mention--
		BrowserMention();

}

function checkSelfLike(mId, checkId)
{
	//if(checkId == undefined)
		//checkId = jsxc.bid || loggeduser.sip_userid+"@im01.unifiedring.co.uk";
	var id = mId.replace("-", ":");
	//var data = jsxc.storage.getUserItem('msg', id);
	var data = localStorage.getItem("jsxc:"+window.loggeduser.sip_userid+jidSuffix+":msg:"+id+"");
	if(data == null)
		return false;
	data = JSON.parse(data);
	var list = data.likelist || [];
	for(var k = 0; k <list.length; k++)
	{
		if(list[k] == checkId)
			return true;
	}
	return false;
}

function likemessage(mId, bid, mode)
{
	var data,id,list = "";
	id = mId.replace("-", ":");
	data = jsxc.storage.getUserItem('msg', id);
	if(data == null)
		return false;
	list = data.likelist;

	if( $("#"+mId).length !=0 )			// checking for current window is in chat page
	{
		var len = list.length || 0;
		if(mode == 'like')
		{
			len = len + 1;
			if(len >0)	$('#'+mId).find('.msglike span').html(len);
			else	$('#'+mId).find('.msglike span').html('');
		}
		else
		{
			len = len - 1;
			if(len >0)	$('#'+mId).find('.msglike span').html(len);
			else	$('#'+mId).find('.msglike span').html('');
		}	
	}

	/*var checkavailabe = checkSelfLike(mId, jsxc.bid);
	if( (checkavailabe) && (mode == 'like') )
		return false;*/
	
	/*var Likebtn =  mId + '_like';
	var UnLikebtn =  mId + '_Unlike';
	var taskLikeBtn = mId+"_taskLike";
	var likemsg_dtask = "likemsg_dtask"+mId;
	var dislikemsg_dtask = "dislikemsg_dtask"+mId;*/
	if(mode == 'like')
	{
		list.push(jsxc.bid);
		/*$("#"+UnLikebtn).show();
		$("#"+Likebtn).hide();
		$("#"+likemsg_dtask).hide();
		$("#"+dislikemsg_dtask).show();
		$("#"+taskLikeBtn).html("<img src=\"images/icons/thumb-s.png\" alt=\"\"> Dislike");		
		$("#"+taskLikeBtn).attr('onclick', 'likemessage("'+mId+'","'+bid+'","dislike")');*/
		jsxc.gui.window.postMessage({
			bid: bid,
			direction: jsxc.Message.OUT,
			msg: jsxc.bid,
			like: true,
			likemsg_id: mId
		});	
	}
	else
	{
		/*$("#"+UnLikebtn).hide();
		$("#"+Likebtn).show();
		$("#"+likemsg_dtask).show();
		$("#"+dislikemsg_dtask).hide();*/
		for(var i=0; i<list.length; i++)
		{
			if(list[i] == jsxc.bid)
			{
				list.splice(i, 1);
			}
		}
		/*$("#"+taskLikeBtn).html("<img src=\"images/icons/thumb-s.png\" alt=\"\"> Like");
		$("#"+taskLikeBtn).attr('onclick', 'likemessage("'+mId+'","'+bid+'","like")');*/
		jsxc.gui.window.postMessage({
			bid: bid,
			direction: jsxc.Message.OUT,
			msg: jsxc.bid,
			like: false,
			likemsg_id: mId
		});	
	}
	data.likelist = list;
	jsxc.storage.setUserItem('msg', id, data);
	/*if($('.attachdetail').length){
		if(mode == 'like') 
			$('#'+mId.replace(":","-")).children('.rightIconBox').find('.msgLike').attr("title","UnLike");
		else
			$('#'+mId.replace(":","-")).children('.rightIconBox').find('.msgLike').attr("title","Like");
		
		viewAttachment(mId);
	}*/
	
	if( $('.bmkShowWin ').length !=0 )		//check current page is bookmark--
		openBookMarkWin();
	else if( $('.mentionWin ').length !=0 )		//check current page is mention--
		BrowserMention();
}

function waringAlert(mode, msg)
{
	if(mode == "warning")
	{
		swal({
			title: "warning?",
			text: msg,
			icon: "warning",
		});
	}
	else if(mode == "success")
	{
		swal({
			title: "success",
			text: msg,
			icon: "success",
		});
	}
}
/*
function showwindow(jid)
{
	if(window.LastChatWindow == jid)
		return;
	jsxc.gui.window.open(jid);
    $('#clientview').html('');
    $(".jsxc_windowItem").appendTo('#clientview');
	window.LastChatWindow = jid;
}
*/
function msgSetFavourite()
{
	var contact = window.LastChatWindow;
	 if (window.Debug) console.log("contact",contact);
	var data = GetContactDetails(contact.split("@")[0]);
	 if (window.Debug) console.log("data fav chck",data);
	var status = 0;
	if(data.is_favourite == 1)
	{
		status = 0;
		$('.name_fav_icon').hide();
	}
	else
	{
		status = 1;
		$('.name_fav_icon').show();
	}
		
	for(var i=0; i<contacsarray.length; i++)
	{
		if(contacsarray[i].sip_login_id == (contact.split("@")[0]))
		{
			contacsarray[i].is_favourite = status;
			loadFavContact();
			var weburl = ApiServerURL + "v1/user/XXAccesstokenXX/Urmaappfavouritecontactsave";
			var url = '/apiCalling?Stype=setFav&dir_user_id='+loggeduser.dir_user_id+'&company_id='+loggeduser.company_id+'&mobileno='+data.ext+'&status='+status+'&linkUrl='+weburl+'';
			$.get(url, function(response) {
				if(response.Message)
				{
					
				}
				 if (window.Debug) console.log("response",response);
			})
			return;
		}
	}		
}
function msgSetMarkUread()
{
	var item = window.LastChatWindow;
	var unreaddata = jsxc.storage.getUserItem('window', jsxc.jidToBid(item));
	var count ;
	if(unreaddata == null || unreaddata.unread == 0)
		count =1;
	else
		count = unreaddata.unread;
	
	var unreadlist = jsxc.storage.getUserItem('unreadmsguser');
	if(unreadlist == null || unreadlist == undefined || unreadlist == "")
		 unreadlist = [];
	
	if(unreadlist.lenght==0 ||  unreadlist.indexOf(item) < 0)
	{
		unreadlist.push(item);
		$("#"+item.split('@')[0]+"_contactsec").find('.jsxc_lastmsg').show();
		$("#"+item.split('@')[0]+"_contactsec").find('.badge').text(count);
		$("#"+item.split('@')[0]+"_contactsec").find('.unread_icon').show();
		jsxc.storage.setUserItem('unreadmsguser', JSON.stringify(unreadlist));
	}	
	else
	{
		for( var i = 0; i < unreadlist.length; i++)
		{ 
			if ( unreadlist[i] === item) 
			{
				unreadlist.splice(i, 1); 
			}
		}
		
		$("#"+item.split('@')[0]+"_contactsec").find('.jsxc_lastmsg').hide();
		$("#"+item.split('@')[0]+"_contactsec").find('.badge').text("");
		$("#"+item.split('@')[0]+"_contactsec").find('.unread_icon').hide();
		jsxc.storage.setUserItem('unreadmsguser', JSON.stringify(unreadlist));
	}
}

function msgSetCloseConv()
{
	var temp = [];
	temp.id = "db-"+window.loggeduser.sip_userid+"_chatRegister";
	couchDbGetItem(getmsgGetClose, temp);
	
}

function getmsgGetClose(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{
		var data = returnData.MyData || [];
		var item = window.LastChatWindow;
		for( var i = 0; i < data.length; i++)
		{ 
			if ( data[i].contact === item)
			{
				data.splice(i, 1);
				var input = {
					 _id: inputsParam.id,
					_rev: returnData._rev,
					MyData:data
				};
				couchDbPutItem(getmsgSetClose, input, inputsParam);
			}
		}
	}
}
function getmsgSetClose(returnVal, returnData, inputsParam)
{
	 if (window.Debug) console.log("return result is",returnVal);
	if(returnVal == "success"){	openDashBoardWin(); loadContact(''); }
	else	wariningAlert("warning","Something Went Wrong");
}

function msgSetViewProfile(item)
{
	/*$(".showprofilePic").empty();
	if(item == undefined)
		item = window.LastChatWindow;
	getMyAccAPIAccesstoken(function(val, accesstoken){
		if(val == 'Success') {
			var img = '';
			var exten = localStorage.getItem('jsxc:' + jsxc.bid + ':buddy:' + item);
			exten = JSON.parse(exten);
			if(exten.avatar)
			{
				img = localStorage.getItem('jsxc:' + jsxc.bid + ':avatar:' + exten.avatar);
			}
			
			let reg = new Object();
			reg.company_id=loggeduser.company_id;
			reg.orderid=0;
			reg.extension_number=exten.extension;
			let postdata = JSON.stringify(reg, null, '\t');	
			var posturl = "v1/user/"+accesstoken+"/Urmyaccwebgetuserextensioninfo";
			 $.ajax({
				type: "POST",
				crossDomain: true,
				dataType: "json",
				data: postdata,
				url: myAcc_ApiServerURL + posturl,
				async: false,
				success: function(response) {
					if (response[0].errcode == 0) 
					{			
						var rturnVal = response[0];
						if(rturnVal != undefined)
						{
							var Company_id = rturnVal.Company_id;
							var Department = rturnVal.Department;
							var Extension_Number = rturnVal.Extension_Number;
							var Email = rturnVal.Email;
							var Firstname = rturnVal.Firstname;
							var Surname = rturnVal.Surname;
							var Mobileno = rturnVal.Mobileno;
							var app_login_user_name = rturnVal.app_login_user_name;
														
							var mainDiv = ' <div class="profile settings">';
								mainDiv +=' <div class="maininfo">';
								
								mainDiv +=' <heads>';
					
								if(img != '')	
									mainDiv +=' <div class="jsxc_avatar  rightsidesec" style="background: url('+img+')"></div>';
								else
									mainDiv +=' <div class="avatar-generated  avatar-color-2">'+Firstname.substring(1,0)+'</div>';	
								
								mainDiv +=' <div id="first_name" class="has_empty_name">'+Firstname+'</div>';
								mainDiv +=' </heads>';
								mainDiv +=' <ul>';
								mainDiv +=' <li id="company_li">';
								mainDiv +=' <label>Company Id</label>';
								mainDiv +='	<div class="value" id="company">'+Company_id+'</div>';
								mainDiv +='	&nbsp;&nbsp;&nbsp;';
								mainDiv +='	</li>';
								mainDiv +=' <li id="department_li">';
								mainDiv +=' <label>Department</label>';
								mainDiv +='	<div class="value" id="company">'+Department+'</div>';
								mainDiv +='	</li>';
								mainDiv +=' <li id="extension_li">';
								mainDiv +=' <label>Extension</label>';
								mainDiv +='	<div class="value" id="company">'+Extension_Number+'</div>';
								mainDiv +='	</li>';
								mainDiv +=' <li id="mail_li">';
								mainDiv +=' <label>Mail</label>';
								mainDiv +='	<div class="value" id="company">'+Email+'</div>';
								mainDiv +='	</li>';
								mainDiv +=' <li id="firstname_li">';
								mainDiv +=' <label>Firstname</label>';
								mainDiv +='	<div class="value" id="company">'+Firstname+'</div>';
								mainDiv +='	</li>';
								mainDiv +=' <li id="lastname_li">';
								mainDiv +=' <label>Surname</label>';
								mainDiv +='	<div class="value" id="company">'+Surname+'</div>';
								mainDiv +='	</li>';
								mainDiv +=' <li id="mobileno_li">';
								mainDiv +=' <label>Mobileno</label>';
								mainDiv +='	<div class="value" id="company">'+Mobileno+'</div>';
								mainDiv +='	</li>';
								mainDiv +='	</ul>';
								mainDiv +='	</div>';	
									
							$(".showprofilePic").append(mainDiv);
						}
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
				  console.log(errorThrown);
				}
			  });
		}
	})*/
}
function SaveCallRegister(bound, medium, callerSip, calledTime, duration) {
  storage.get(_candidate + '_callRegister', function(error, data) {
    if (error) {
      throw error;
      return;
    } else {
      let reg = new Object();
      reg.bound = bound;
      reg.medium = medium;
      reg.callerSip = callerSip;
      reg.calledTime = calledTime;
      reg.duration = duration;
      let xarr = [];
      xarr.push(reg);
      if (data.length > 0) {
        yarr = xarr.concat(data);
      } else {
        yarr = xarr;
      }
      if (yarr.length > 50) {
        yarr.length = 50; // Change here to store required num of history;
      }
      storage.set(_candidate + '_callRegister', yarr, function(error) {
        if (error) {
          throw error;
          return;
        }
        if ($('#contactsList').is(":visible")){
          DisplayCallLogs();
        }
      });
    }
  });
}

function SaveChatRegister(contact, msgtxt, msgtime) 
{
	//var temp = (contact.split('@')[1]).split('.')[0];
	//if ((temp != "conference") && (msgtxt == "" || msgtxt == undefined || msgtxt == null)) return;

	var id = "db-"+(jsxc.bid).split("@")[0]+"_chatRegister";
	couchDbGet(getChatRegister, id);
	function getChatRegister(returnVal)
	{
		let reg = new Object();
		reg.contact = contact;
		reg.msgtxt = msgtxt;
		reg.msgtime = msgtime;
		if(returnVal != "failure")
		{
			var result = returnVal.MyData || [];
			if (result.filter(e => e.contact == contact).length > 0) {
				$.each(result, function() {
					if (this.contact == contact) {
						this.msgtxt = msgtxt;
						this.msgtime = msgtime;
					}
				});
			} else	result.push(reg);
			var input = {
				 _id: id,
				_rev: returnVal._rev,
				MyData:result
			};
			couchDbPut(chatPutData,input);
		}
		else
		{
			var tempdata =[];
			tempdata.push(reg);
			var input = {
				_id: id,
				MyData: tempdata
			};
			couchDbPut(chatPutData,input);
		}
	}
	function chatPutData(returnVal)
	{
		loadContact('');			 
		if ( $('.tab-content').is(":visible") ) {
			if(temp == "conference")	DisplayChatLogs("conference");	
			else	DisplayChatLogs();
		}
	}
}

/*
function MoveSharedFile(name,tag){
  storage.get(_candidate + '_fileRegister', function(error, data) {
    if (error) {
      throw error;
      return;
    } else {
      var pd = 0;
      var od = 0;
      for(i=0;i<data.length;i++){
          if (data[i].filename == name && data[i].tag !=  tag){
            if (data[i].filetype=='folder'){
              pd = data[i].tag + '/' + name;
              nd = tag + '/' + name;
            }
            data[i].tag =  tag;
            break;
          }
      }
      if (pd!=0){
        for(i=0;i<data.length;i++){
          if (data[i].tag == pd){
            data[i].tag = nd;
          }
        }
      }

      storage.set(_candidate + '_fileRegister', data, function(error) {
        if (error) {
          throw error;
          return;
        }
      });
      setTimeout(function(){
		 // alert("1");
		 if(window.LastFilter.name != undefined)
			  DisplaySharedFiles(window.LastFilter.tag, window.LastFilter.filter,window.LastFilter.name);
		 
          DisplaySharedFiles(window.LastFilter.tag, window.LastFilter.filter);
      },100);
    };
  });
}

function SharedFileRegister(bound, contact ,fileobj, sharedTime, msid) {
  storage.get(_candidate + '_fileRegister', function(error, data) {
    if (error) {
      throw error;
      return;
    } else {
      let reg = new Object();
      reg.tag = 'shared';
      reg.bound = bound;
	  reg.msid = msid;
      reg.fileurl = fileobj.data;
      reg.filesize = fileobj.size;
      reg.filetype = fileobj.type;
      reg.filename = fileobj.name;
      reg.contact = contact;
      reg.sharedTime = new Date(sharedTime);
      let xarr = [];
      xarr.push(reg);
      if (data.length > 0) {
        yarr = xarr.concat(data);
      } else {
        yarr = xarr;
      }
      if (yarr.length > 50) {
        yarr.length = 50; // Change here to store required num of history;
      }
      storage.set(_candidate + '_fileRegister', yarr, function(error) {
        if (error) {
          throw error;
          return;
        }
	if ($('.sharedfiles').is(":visible")){
          DisplaySharedFiles();
        }
      });
    }
  });
}
*/
function DisplayCallLogs() {
  storage.get(_candidate + '_callRegister', function(error, data) {
    if (error) {
      throw error;
      return;
    } else {
      let direction, iconcolor, iconclass, action, missstr = "",
        allstr = "";
      $.each(data, function(i, obj) {
        let callerInfo = localStorage.getItem('jsxc:' + jsxc.bid + ':buddy:' + obj.callerSip + jidSuffix);
        callerInfo = JSON.parse(callerInfo);

	if(callerInfo === null){
		return true;
	}

        let callerName = callerInfo.name;
        if (obj.medium == 'screen') {
          iconclass = 'fa fa-desktop';
          action = 'Share Again';
        } else if (obj.medium == 'audio') {
          iconclass = 'fa fa-phone';
          action = 'Call Again';
        } else if (obj.medium == 'video') {
          iconclass = 'fa fa-video-camera';
          action = 'Call Again';
        }

        if (obj.bound == 'IN') {
          direction = 'Incoming';
          iconcolor = 'green';
        } else if (obj.bound == 'OUT') {
          direction = 'Outgoing'
          iconcolor = 'blue';
        } else if (obj.bound == 'MISS') {
          direction = 'Missed';
          iconcolor = 'red';
          missstr = missstr + '<li><a href="#"><span class="' + iconclass + '" style="font-size:24px;color:' + iconcolor + '"></span><b class="twohalfspace">' + callerName + '</b><p class="fourspace">' + direction + ' ' + obj.medium + ' call. <small><i> - ' + obj.duration + '</i></small><span class="pull-right"> ' + action + '<span class="fa ' + iconclass + ' actionIcon" style="color:black" onclick="CallNow(\'' + obj.callerSip + '\', \'' + obj.medium + '\')";></span></p></span><p class="fourspace">' + utils.Readable_Time_Format(obj.calledTime) + '</p></a></li>';
        }

        allstr = allstr + '<li><a href="#"><span class="' + iconclass + '" style="font-size:24px;color:' + iconcolor + '"></span><b class="twohalfspace">' + callerName + '</b><p class="fourspace">' + direction + ' ' + obj.medium + ' call. <small><i> - ' + obj.duration + '</i></small><span class="pull-right"> ' + action + '<span class="fa ' + iconclass + ' actionIcon" style="color:black" onclick="CallNow(\'' + obj.callerSip + '\', \'' + obj.medium + '\')";></span></p></span><p class="fourspace">' + utils.Readable_Time_Format(obj.calledTime) + '</p></a></li>';
      });
      $('.allcalls').empty().append(allstr);
      $('.missedcalls').empty().append(missstr);
    }
  });
}

function DisplayChatLogs(checkChat) {

	 if (window.Debug) console.log("DisplayChatLogs");
	if(checkChat == "conference")
			return;
		
	var id = "db-"+(jsxc.bid).split("@")[0]+"_chatRegister";
	couchDbGet(getDisplayChat, id);
	function getDisplayChat(returnVal)
	{
		if(returnVal != "failure")
		{
			var data = returnVal.MyData || [];
			if(Object.keys(data).length <= 0) return false;
			data.sort(function(a, b) {
				return (b.msgtime > a.msgtime) ? 1 : -1;
			});
			let str = "";
			$.each(data, function(i, obj) {
				
				 if (window.Debug) console.log("obj.contact is",obj.contact);
				var ll = obj.contact.search("@conference");
				 if (window.Debug) console.log("ll is",ll);
				if( obj.contact.search("@conference") == -1 )
				{
					var senderInfo = GetContactDetails((obj.contact).split("@")[0]);
					 if (window.Debug) console.log("senderInfo",senderInfo);
					if(senderInfo == undefined)	return;
					var userName = senderInfo.caller_id || "unknow";
					var msgtime = obj.msgtxt;

					str = str + '<li><a href="#"><span class="fa fa-comments" style="font-size:24px;color:black"></span><b class="twohalfspace">' + userName + '</b><p class="fourspace minimize">' + msgtime + '<span class="pull-right"> Begin Chat<span class="fa fa-comment actionIcon" style="color:black" onclick="OpenChatWindow(\''+obj.contact+'\')";></span></p></span><p class="fourspace">' + msgtime + '</p></a></li>';
				}
			});
			$('.conversations').empty().append(str);
		}
	}
}

function showConversation(divId)
{
	 $('.jsxc_textarea').show();
	 $('#conversationwindow').hide();
	 $('#userFile').hide();
 }	


function getDataFromLocal(key){
	if (typeof(Storage) !== "undefined") {
		var data = localStorage.getItem(key);
		return data;
	}
}
function setPicname() {

	if (window.Debug) console.log("_candidate",_candidate);
	
	storage.get(_candidate + '_photo_settings', function(error, data) {			// set profile pic
		if (error) {
			throw error;
			return;
		}
		if (window.Debug) console.log("data is",data);
		$(".profileImage").find("img").attr('src', data.profile_photo_path);
    });

	var logindetail = JSON.parse(getDataFromLocal("login"));								// set user name 
	var username = logindetail.username;
	if(username != undefined)
		$(".profileInfo").find("h2").text(username).parent();
}
/*
function DisplaySharedFiles(tag,filter,toUser) {
	
	if (window.Debug) console.log("tag",tag);
	if (window.Debug) console.log("filter",filter);
  if (filter == undefined) filter='All';
  if (tag == undefined) {
	  tag='All';	
		$('#sha-my-files').addClass('selected');
  }
	  
  window.LastFilter = {"filter":filter, "tag":tag, "name":toUser};
  $('#currentfolder').text (tag);
  storage.get(_candidate + '_fileRegister', function(error, data) {
    if (error) {
      throw error;
      return;
    } else {
		if (window.Debug) console.log("else");
		let str = "";
		let fldr = window.LastFilter.tag.includes('/') ? 
		  '<div ondrop="droptofolder(event)" ondragover="allowDrop(event)"' + 
		  '  class="sharedfile" ' + 
		  ' ondblclick="ChangeFolder(\'..\')"> '+ 
		  '<div class="col-md-12 col-sm-12"><div class="detailIcon">' + 
		  '<div class="centerImage"> <img src="assets/imgs/back.png" alt="images" ' +
		  'height="60" width="60"/></div></div></div><h1>&nbsp</h1><h1>&nbsp</h1></div>'
		  : '';
		
		if (window.Debug) console.log("data",data);
		var count = 0;
      $.each(data, function(i, obj) {
			let senderInfo = localStorage.getItem('jsxc:' + jsxc.bid + ':buddy:' + obj.contact);
			senderInfo = JSON.parse(senderInfo);

			if (window.Debug) console.log("i",i);
			if (window.Debug) console.log("obj",obj);
			if (window.Debug) console.log("senderInfo",senderInfo);
			

			if(senderInfo === null){
				senderInfo = {name: "self"};
			}
			
		let userName = senderInfo.name;
		if (window.Debug) console.log("userName",userName);
		if (window.Debug) console.log("obj.fileurl",obj.fileurl);

		if(obj.fileurl!=null && obj.fileurl!=undefined) {
			let extn = obj.fileurl.split('.').pop();
			extn = utils.validateFileExtensions(extn);
			if (window.Debug) console.log("extn",extn);
			if (window.Debug) console.log("tag",tag);
			if (window.Debug) console.log("obj.tag",obj.tag);
			if (window.Debug) console.log("filter",filter);
			
			if (window.Debug) console.log("toUser",toUser);
						
			if((filter=='All' || filter==extn) && (tag=='All' || tag=='myfile' || tag=='shared' || tag=='recent' || tag==obj.tag ) )   {
			//if( (filter=='All' || filter==extn) && (tag != undefined) )   {
				if (window.Debug) console.log("inside file handle");
				
				if( toUser != undefined ) {
					$('#userFile').show();
					$('.jsxc_textarea').hide();
					if( toUser != userName )
						return
				}
				if(tag == "myfile")
				{
					if (window.Debug) console.log("obj.bound-0",obj.bound);
					if (window.Debug) console.log("obj.tag",obj.tag);
					if (window.Debug) console.log("obj.filename",obj.filename);
					if( (obj.bound != 'IN') || (obj.tag == 'bin') || (obj.tag == 'delete')) 
						return
					if (window.Debug) console.log("obj.bound---",obj.bound);
					if (window.Debug) console.log("obj.tag",obj.tag);
					if (window.Debug) console.log("obj.filename",obj.filename);
				}
				if(tag == "shared")
				{
					if (window.Debug) console.log("obj.bound-0",obj.bound);
					if (window.Debug) console.log("obj.tag",obj.tag);
					
					
					if( (obj.bound != 'OUT') || (obj.tag == 'bin') || (obj.tag == 'delete') )
						return;
		
					if (window.Debug) console.log("obj.bound---2",obj.bound);
					if (window.Debug) console.log("obj.tag",obj.tag);
					if (window.Debug) console.log("obj.filename",obj.filename);
				}
				else if(tag == "recent")
				{
					if (window.Debug) console.log("recent");
					if(count >= 10)
						return;
					
					count++;
				}
				else if(tag == "starred")
				{
					if (window.Debug) console.log("obj.bound---",obj.bound);
					if (window.Debug) console.log("obj.tag",obj.tag);
					if (window.Debug) console.log("obj.filename",obj.filename);
				}
				else if(tag == "bin")
				{
					
					if(obj.tag == 'delete')
						return;
					
					if(count >= 10)
						return;
					
					count++;
					if (window.Debug) console.log("obj.bound---",obj.bound);
					if (window.Debug) console.log("obj.tag",obj.tag);
					if (window.Debug) console.log("obj.filename-1",obj.filename);
					if (window.Debug) console.log("bin");
				}
				
				else if(tag == "All")
				{
					if((obj.tag == "bin") || (obj.tag == 'delete'))    // || (obj.tag == 'starred')
						return;
					
					if (window.Debug) console.log("obj.bound---2",obj.bound);
					if (window.Debug) console.log("obj.tag",obj.tag);
					if (window.Debug) console.log("obj.filename",obj.filename);
					
				}
				
				  let fileicon = "";
				  var dragattribute = '';
				  var dblclickattribute = ' ondblclick="ViewThisFile(\'' +  obj.fileurl +  '\')"> '  ;
				  let direction;
					(obj.bound == 'IN') ? direction = 'Shared By' : direction = 'Shared With';
				  if (obj.filetype=='folder') {
					dragattribute = 'ondrop="droptofolder(event)" ondragover="allowDrop(event)"';
					dblclickattribute = ' ondblclick="ChangeFolder(\'' +  obj.filename +  '\')"> '  ;
					fileicon = '<i class="far fa-folder"></i>';
				  }
				  else if(extn == 'image')
					fileicon = '<i class="fa fa-file-image-o" aria-hidden="true"></i>';
				  else if(extn == 'audio')
					fileicon = '<i class="fa fa-volume-up" aria-hidden="true"></i>';
				  else if(extn == 'video')
					fileicon = '<i class="fa fa-video-camera" aria-hidden="true"></i>';
				  else if(extn == 'worddoc')
					fileicon = '<i class="fa fa-file-word-o" aria-hidden="true"></i>';
				  else if(extn == 'pptdoc')
					fileicon = '<i class="fa fa-file-powerpoint-o" aria-hidden="true"></i>';
				  else if(extn == 'pdfdoc')
					fileicon = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>';
				  else if(extn == 'textdoc')
					fileicon = '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>';
				  else if(extn == 'xlsdoc')
					fileicon = '<i class="fa fa-file-excel-o" aria-hidden="true"></i>';
																									   
				  else if(extn == 'others')
					fileicon = '<i class="fa fa-file" aria-hidden="true"></i>';
				
				
					var fileName = obj.filename;
					if(fileName.length > 20)
					{
						fileName = fileName.substring(0,20)+"...";
					}
				
				
				  str = str + '<div ' + dragattribute + 
				  ' ondragstart="dragstarted(event)" class="sharedfile" ' + 
				  ' draggable="true" onclick="ControlClick(this)" ' + 
				 dblclickattribute +
				  '<div class="detailIcon">' + 
				  '<div class="centerImage">'+fileicon+'</div></div>';
				  
				  if(tag != "recent")
					  str = str + '<div class="dropdown dotes"><span class="dropper dropdown-toggle" data-toggle="dropdown"><img '+
					  'src="././images/SVG/Icons-38.svg" alt="images" /></span><ul ' + 
					  'class="dropdown-menu dropdown-menu-right sensitivemenu">';
				  
				  if(tag == "myfile") {
					str = str + '<li><a onclick="MoveSharedFile(\'' + obj.filename + '\','+
					'\'starred\')">starred</a></li><li><a onclick="MoveSharedFile(\'' + obj.filename + '\',\'bin\')">bin</a></li></ul></div>';
				  }
				  else if(tag == "shared") {
					str = str + '<li><a onclick="MoveSharedFile(\'' + obj.filename + '\','+
					'\'starred\')">starred</a></li><li><a onclick="MoveSharedFile(\'' + obj.filename + '\',\'bin\')">bin</a></li></ul></div>';
				  }
				  else if(tag == "starred") {
					str = str + '<li><a onclick="MoveSharedFile(\'' + obj.filename + '\',\'bin\')">bin</a></li></ul></div>';
				  }
				  else if(tag == "bin") {
					str = str + '<li><a onclick="MoveSharedFile(\'' + obj.filename + '\','+
					'\'delete\')">delete</a></li><li><a onclick="MoveSharedFile(\'' + obj.filename + '\',\'restore\')">restore</a></li></ul></div>';
				  }
				  else if(tag == "All")
				  {
						if (window.Debug) console.log("tag name All");
					   str = str + '<li>'+
					  '<a onclick="MoveSharedFile(\'' + obj.filename + '\',\'starred\')">'+
					  'starred</a></li><li><a '+
					   'onclick="MoveSharedFile(\'' + obj.filename + '\',\'bin\')">bin</a>'+
					   '</li></ul></div>';
				  }
				  
				   str = str + '<ul class="list-unstyled"><li><b contenteditable="false"'+
				   ' name="' + i + '"><a href="#" data-toggle="tooltip" title="'+obj.filename+'">'+fileName+'</a></b></li><li>'+direction+' '+
				   userName+'</li><li>'+utils.Readable_Time_Format(obj.sharedTime)+
				   '</li></ul></div>'; 
				   //<div class="panel-footer"><a class="btn btn-primary" onclick="ViewThisFile(\''+obj.fileurl+'\')" >View</a></div></div>
				}
       } });
	   
		$(document).ready(function(){
			$('[data-toggle="tooltip"]').tooltip();   
		});

		if( toUser != undefined ) {
			$('.jsxc_textarea').hide();
			$('#userFile').empty().append(fldr + str);
		}
		else
			$('.sharedfiles').empty().append(fldr + str);
		
       window.CanShowSubMenu = true;
    }
  });
}*/
/*
function ViewThisFile(fileurl){	
	ipcRenderer.send('download-and-view-file', fileurl);
	$.blockUI({ message: '<h1><img src="assets/imgs/busy.gif" /> Just a moment...</h1>' }); 
	
	var type = getMiMeType(fileurl);				
		var currentUsername = window.LastFilter.name;

		if(type == "image")
		{
			if(currentUsername == undefined)	{
				$('.sharedfiles').prepend('<div class=videodiv> <button type="button" class="close" data-dismiss="modal">&times;</button><img class="imageView" src='+fileurl+' width=640 height=480 /></div>');
			}
			else {
				$('#userFile').prepend('<div class=videodiv> <button type="button" class="close" data-dismiss="modal">&times;</button><img class="imageView" src='+fileurl+' width=640 height=480 /></div>');
			}
			
			$('.close').click(function() {
				$('.videodiv').remove();
			})
		}
		else if(type == "video")
		{
			if( $(".videodiv").length ) 
			$('.videodiv').remove();
	
			if(currentUsername == undefined)	{
				$('.sharedfiles').prepend('<div class=videodiv> <button type="button" class="close" data-dismiss="modal">&times;</button><video id=video_player width=640 height=480 src='+fileurl+' poster="././images/audio_sample.png" controls autoplay></video></div>');
			}
			else {
				$('#userFile').prepend('<div class=videodiv> <button type="button" class="close" data-dismiss="modal">&times;</button><video id=video_player width=640 height=480 src='+fileurl+' poster="././images/audio_sample.png" controls autoplay></video></div>');
			}
				
			$('.close').click(function() {
				$('.videodiv').remove();
			})
		}
		else
		{
			ipcRenderer.send('download-and-view-file', fileurl);
			$.blockUI({ message: '<h1><img src="assets/imgs/busy.gif" /> Just a moment...</h1>' }); 
		}
}*/

/* ipcRenderer.on('context', function(event, data) {
  if (data.cmd =='newfolder') AddNewFolder();
  if (data.cmd =='renameme') RenameFile(data);
});

ipcRenderer.on('view-request-status', function(event, data) {
	$.unblockUI();
	if(data.result == 'error'){
		dialog.showMessageBox({
		  type: 'warning',
		  message: 'Oops Something went werong.. !',
		  detail: 'Please try again after sometime',
		  buttons: ['Ok']
		});
		return;
	}	
}); */

function getMiMeType(Url)
{
	if (window.Debug) console.log("url is",Url);
	
}

function ChangeSignInName() {
	alert("change ");
  if ($('#codespace').attr('name') == 'settings') return;
  $('#cogikon').click();
  setTimeout(function() {
    $('#seg2').click();
    $('#edit_unpwd').click();
  }, 100);
}

$("#invitemodal").submit(function(ev) {
	/*ev.preventDefault();
	if ($('#frn_name').val() == "" || $('#frn_email').val() == "") 
	{
		dialog.showMessageBox({
			type: 'warning',
			buttons: ['Ok'],
			message: 'All fields are mandatory.',
		});
	} 
	else if (utils.isValidEmailAddress($('#frn_email').val()) == false) 
	{
		dialog.showMessageBox({
			type: 'warning',
			buttons: ['Ok'],
			message: 'Invalid email address.',
			detail: 'Please enter a valid email address'
		})
	} 
	else if ($('#frn_name').val() != "" && utils.isValidEmailAddress($('#frn_email').val()) == true) 
	{
		let reg = new Object();
		reg.tomailid = $('#frn_email').val();
		reg.frommailid = localStorage.getItem('username').replace("___", "@");
		reg.toname = $('#frn_name').val();
		reg.fromname = $('.my_display_name').text();
		let postdata = JSON.stringify(reg, null, '\t');
		
		$.ajax({
			type: "POST",
			crossDomain: true,
			dataType: "json",
			data: postdata,
			url: ApiServerURL + "invite.php",
			async: false,
			success: function(response) 
			{
				if (response.result == 'Invited') 
				{
					dialog.showMessageBox({
					type: 'info',
					buttons: ['Ok', 'Invite other friend'],
					message: 'Invitation Sent.',
					detail: 'Your invitation has been sent to ' + $('#frn_name').val() + ' to join Unified Communications.'
					}, function callback(selection) {
						if (selection == '1') 
							$('#invitemodal').find("input,textarea,select").val('').end();
						else	$('#invitemodal').modal('hide');
					});
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (window.Debug) console.log(errorThrown);
			}
		});
	}*/
});

$('#invitemodal').on('hidden.bs.modal', function() {
  $(this).find("input,textarea,select").val('').end();
});



//------------------- Profile Settings  --------------------------

$(document).on("click", "#edit_unpwd", function(){
  $('#formSection2a').toggle();
  $('#formSection2b').toggle();
});

$(document).on("click", "#back_unpwd", function(){
  $('#formSection2a').toggle();
  $('#formSection2b').toggle();
});

$(document).on("click", "#grant_uname", function(){
 /* if ($('#ch_Uname').val() == "") {
    $('#alertmsg3').html('<span style="color:red">Username is missing !</span>');
    $('#alertmsg3').fadeIn(500);
    $('#alertmsg3').fadeOut(5000);
    return;
  }
  let reg = new Object();
  reg.username = $('#ch_Uname').val();
  let postdata = JSON.stringify(reg, null, '\t');
  $.ajax({
    type: "POST",
    crossDomain: true,
    dataType: "json",
    data: postdata,
    url: "https://im03.vectone.com/v1/usernametaken",
    headers: ApiHeader,
    async: false,
    success: function(response) {
      let msg;
      if (response.errmsg == 'no') {
        msg = '<span style="color:green">Username ' + $('#ch_Uname').val() + ' is available.</span>';
        $('#ch_Uname').attr({
          'passcode': 'okey',
          'passval': $('#ch_Uname').val()
        });
        $('#next3').prop("disabled", false);
      } else {
        msg = '<span style="color:red">Sorry ! This username is already taken. Please try a different one.</span>';
        $('#next3').prop("disabled", true);
      }
      $('#alertmsg3').html(msg);
      $('#alertmsg3').fadeIn(500);
      $('#alertmsg3').fadeOut(5000);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      if (window.Debug) console.log(errorThrown);
    }
  });*/
});

function removeProfilePic(input) {
	
	var file = [];
	var filePath = '././assets/imgs/defaultUser.png';
	if(filePath == undefined)
		return;
	var fileName = path.basename(filePath);
	var mimeType = "image/png";
	
	if (window.Debug) console.log(filePath);
	if (window.Debug) console.log("fileName",fileName);
	if (window.Debug) console.log("mimeType",mimeType);
	var blob = null;
	var xhr = new XMLHttpRequest(); 
	xhr.open("GET", filePath); 
	xhr.responseType = "blob";
	xhr.onload = function() 
	{
		blob = xhr.response;
		var files = new File([blob], fileName,{type:mimeType});
		removePic(files);
	}
	xhr.send();
	
}

function removePic(input) {
  /*if (input) {
    var reader = new FileReader();
	if (window.Debug) console.log("file read");
    reader.onload = function(e) {
		if (window.Debug) console.log("onload");
      $('#myDp').attr('src', e.target.result);
	  
	view_rd = $('input[name=dp_visibility]');
	if (window.Debug) console.log("view_rd ", view_rd);
    view_pic = view_rd.filter(':checked').val();
	if (window.Debug) console.log("view_pic ", view_pic);
    var xArray = {
        profile_photo_path: $('#myDp').attr('src'),
        photo_visibility: view_pic,
        user_id: loggeduser.user_id
    };
	
	if (window.Debug) console.log("xArray",xArray);
		var postdata = JSON.stringify(xArray, null, '\t');
		if (navigator.onLine) {
			$.ajax({
				type: "POST",
				crossDomain: true,
				dataType: "json",
				data: postdata,
				headers: ApiHeader,
				url: ApiServerURL + "v1/unifiedcommuserprofileaddphotosettings",
				async: false,
				success: function(response) {
					if (response.errcode == -1) {
						swal('Oops...', response.errmsg, 'error');
					} else {
						swal('Success', response.errmsg, 'success');
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					if (window.Debug) console.log(errorThrown);
					$('#myDp').attr('src', '././assets/imgs/defaultUser.png');
				}
			});
		}
		storage.set(_candidate + '_photo_settings', xArray, function(error) {
			if (error) {
				throw error;
				return;
			}
			$('#myDp').attr('src', '././assets/imgs/defaultUser.png');
			//utils.FlashNotification('Picture deleted');
			swal('Success', 'Picture deleted', 'success');			
		});
		localStorage.setItem("self_avatar","");	
    }

    reader.readAsDataURL(input);
  }*/
}

function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
		
		
		
		
		view_rd = $('input[name=dp_visibility]');
		view_pic = view_rd.filter(':checked').val();
		var photodata = e.target.result.replace('data:image/jpeg;base64,','');
		var weburl = ApiServerURL + "v1/user/XXAccesstokenXX/Urdisplaypicture";
		var url = '/apiCalling?Stype=displaypicture&company_id='+loggeduser.company_id+'&extn='+loggeduser.ext+'&photo_info='+photodata+'&Delete_image=false&get_image=false&linkUrl='+weburl+'';	
		
		//---- need to delete----//
		$('.proimg').attr('src', e.target.result);
		$(".ownavator").css("background-image", "url("+e.target.result+")");
		//---- need to delete----//
		
		
		
		$.get(url, function(response) {
			console.log("showUserProfile response",response);
			if (response[0].errcode == 0) 
			{
				$('.proimg').attr('src', response[0].ImageURL);
				//$('.ownavator').attr('src', response[0].ImageURL);
				$(".ownavator").css("background-image", "url("+response[0].ImageURL+")");
				swal('Uploaded Successfully ', response.errmsg, 'success');		
			}
			else
				swal('Oops... Something Went Wrong', response.errmsg, 'error');		
		});
    }
    reader.readAsDataURL(input.files[0]);
  }
}

function readURLforGroup(input) {
  if (input.files && input.files[0]) {
    var group_reader = new FileReader();

    group_reader.onload = function(e) {
		if (window.Debug) console.log("data :: "+e.target.result);
		 $("#grpdb").removeAttr("src");
      $('#grpdb').attr('src', e.target.result);
    }

    group_reader.readAsDataURL(input.files[0]);
  }
}


$(document).on("change", "#myPhoto", function(){
  var iSize = ($("#myPhoto")[0].files[0].size / 1024);
  if (iSize / 1024 < 1)
    readURL(this);
  else
    alert("File Size Must Be Less Than 1MB");
});

$(document).on("change", "#takegroupPhoto", function(){
  var iSize = ($("#takegroupPhoto")[0].files[0].size / 1024);
  if (iSize / 1024 < 1)
    readURLforGroup(this);
  else
    alert("File Size Must Be Less Than 1MB");
});


$(document).on("click", "#grpdb", function(){
  //$("#takegroupPhoto").trigger('click');
  $(".groupdropdown").show();
});

$(document).on("click", "#upload_groupphoto", function(){
  $("#takegroupPhoto").trigger('click');
 
});



$(document).on("click", "#unlink_dp", function(){
  /* dialog.showMessageBox({
   	type: 'warning',
        buttons: ['Cancel', 'Yes'],
        message: 'Are you sure ?',
        detail: 'You want to remove your Profile Picture !'
   }, function callback(selection) {
        if (selection == '1') {
			
			view_rd = $('input[name=dp_visibility]');
			view_pic = view_rd.filter(':checked').val();	
			var xArray = {
				company_Id: loggeduser.company_id,
				extn: loggeduser.ext,
				photo_info: "",
				Delete_image:'true',
				get_image:'false'
			};
			getMyAccAPIAccesstoken(function(val, accesstoken)
			{
				if(val == 'Success')
				{
						
					var postdata = JSON.stringify(xArray, null, '\t');
					if (window.Debug) console.log("postdata ", postdata);
					if (navigator.onLine) {
						$.ajax({
							type: "POST",
							crossDomain: true,
							dataType: "json",
							data: postdata,
							//headers: ApiHeader,
							url: myAcc_ApiServerURL + "v1/user/"+accesstoken+"/Urdisplaypicture",
							async: false,
							success: function(response) {
								if (window.Debug) console.log("response ", response);
								if (response[0].errcode == 0) {
									
									$('#myDp').attr('src', 'assets/imgs/defaultUser.png');
									$("#unlink_dp").hide();
									//swal('Success', response.errmsg, 'success');						
								} else {
									//swal('Oops...', response.errmsg, 'error');						
								}
							},
							error: function(jqXHR, textStatus, errorThrown) {
								if (window.Debug) console.log(errorThrown);
							}
						});
					} 
					storage.set(_candidate + '_photo_settings1', xArray, function(error) {
						if (error) {
							throw error;
							return;
						}
						//utils.FlashNotification('Settings Saved');
					});					
				}
			});					
        }
  });*/
});


//------------------- Status Settings  --------------------------

$(document).on("click", "#section5_save", function(){
 /* status_rd = $('input[name=show_status]');
  shw_status = status_rd.filter(':checked').val();

  var xArray = {
    show_offlinemin: $('#showmystatus').val(),
    show_status: shw_status,
    user_id: loggeduser.user_id,
    do_not_distrub: 0
    //shw_dnd: $('#show_dnd').is(":checked"),
  };

  let postdata = JSON.stringify(xArray, null, '\t');
  if(navigator.onLine){
    $.ajax({
      type: "POST", 
      crossDomain: true,
      dataType: "json",
      data: postdata,
      headers: ApiHeader,
      url: ApiServerURL + "v1/unifiedcommuserprofileaddstatussettings",
      async: false,
      success: function(response) {
        if(response.errcode==-1) {
          swal(
            'Oops...',response.errmsg,'error'
          )
        } else {
          swal(
            'Success',response.errmsg,'success'
          )
       }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (window.Debug) console.log(errorThrown);
      }
    });
  storage.set(_candidate + '_status_settings', xArray, function(error) {
    if (error) {
      throw error;
      return;
    }
    swal('Uploaded Successfully ', '',  'success');
  });
   } else {
  storage.set(_candidate + '_status_settings', xArray, function(error) {
    if (error) {
      throw error;
      return;
    }
    swal('Uploaded Successfully ', '',  'success');
  });
}*/
});


$(document).on("change", "#call_tone", function(){
  var iSize = ($("#call_tone")[0].files[0].size / 1024);
  if (iSize / 1024 > 8)
    alert("File Size Must Be Less Than 8 MB");
});

$(document).on("change", "#msg_tone", function(){
  var iSize = ($("#msg_tone")[0].files[0].size / 1024);
  if (iSize / 1024 > 2)
    alert("File Size Must Be Less Than 2 MB");
});

$('.common-dialpad .dialpad_control_icon').on('click', function(){
 
	$('.middleDialpad').fadeToggle('slow');
});


//------------------------------------------------- end -------------------------------------------------------//

function AttachDialPadEvents() {
  remoteRender = document.getElementById('remoteVideo');
  localRender = document.getElementById('localVideo');

  renderHint = {
    remote: document.getElementById('remoteVideo'),
    local: document.getElementById('localVideo')
  };
  
  DefaultMedia = {
    media: { 
      constraints: { 
        audio: true, 
        video: true 
      }
    },
    render: renderHint, 
    extraHeaders: ['X-webcall: vidfly'], 
    turnServers: [{
      urls: "turn:stun02.mundio.com:3478",
      username: "admin",
      password: "system123"
      }]
    }
  
  $(".mic-mute").click(function(){
    AudioMute();
  });
  $(".mic-unmute").click(function(){
    AudioUnMute();
  });
  $(".cam-mute").click(function(){
    VideoMute();
  });
  $(".cam-unmute").click(function(){
    VideoUnMute();
  });
  $(".call-hold").click(function(){
    CallHold();
  });
  $(".call-unhold").click(function(){
    CallUnhold();
  });
  var DirectKeys = document.getElementsByClassName('dkey');
  for (i = 0; i < DirectKeys.length; i++) {
      DirectKeys[i].addEventListener('click', function () {
          var oldvalue = $("#number-2-dial").val() + this.textContent.substring(0, 1);
          $("#number-2-dial").val(oldvalue);
          $(".cruncher").val(oldvalue);
          $('#search-number').trigger('keyup');
      });
  }
  var ClearKeys = document.getElementsByClassName('ckey');
  for (i = 0; i < ClearKeys.length; i++) {
      ClearKeys[i].addEventListener('click', function () {
          var Destination = $("#number-2-dial").val();
  if(validatePhoneNumber($("#number-2-dial").val())){
    if (window.Debug) console.log(Destination);
    let x = document.getElementById('pstn-invite-submit-'+Destination);
    if(x != null){
      let y = x.parentNode.previousElementSibling.id;
      sipid = y.split('chillicall').pop();
      openChatWindow(sipid+'@im03.vectone.com', "");
    }
    else{
                openSmsWindow($('#show_entered_no').html(), $('#show_entered_no').html());
    }
  }
  else{
    (Destination == "") ? title = "Please Enter Valid Number" : title = "Invalid Number";
    swal({
                  title: title,
                  timer: 1000,
                  showConfirmButton: false
            });
            return;
  }
      });
  }
  var BackKeys = document.getElementsByClassName('bkey');
  for (i = 0; i < BackKeys.length; i++) {
      BackKeys[i].addEventListener('click', function () {
          var oldvalue = $("#number-2-dial").val();
          oldvalue = oldvalue.substring(0, oldvalue.length - 1);
          $("#number-2-dial").val(oldvalue);
          $(".cruncher").val(oldvalue);
          $('#search-number').trigger('keyup');
      });
  }
  var CallKeys = document.getElementsByClassName('gkey');
  for (i = 0; i < CallKeys.length; i++) {
      CallKeys[i].addEventListener('click', function () {
          var Destination = $("#number-2-dial").val();
  if(validatePhoneNumber(Destination)){
              Destination = RemovePhonePrefixes(Destination);
              DialNow($("#number-2-dial").val());

  }
  else{
    (Destination == "") ? title = "Please Enter Valid Number" : title = "Invalid Number";
    swal({
                      title: title,
            timer: 1000,
                      showConfirmButton: false
                });
                return;
            }
      });
  }
  $(".DigitalDialPad").show();
  var DKey = document.getElementById('number-2-dial');
  $(document).keydown(function(event){
    if(event.which=="17")
        cntrlIsPressed = true;
  });

  $(document).keyup(function(){
      cntrlIsPressed = false;
  });

}

function DialNow(PhoneNumber){
  $("#vwindow").modal('show');
  $('#vcanvas').show();
  $(".nav-side-menu").hide();

  var options = {"media":{"constraints":{"audio":true,"video":false}},"extraHeaders":["X-webcall: audio"],"params":{"from_displayName": loggeduser.phonenumber}};
  var uri = "sip:" + PhoneNumber + "@"+DomainName;
  SessionRunner++;
  sessions[SessionRunner] = ua.invite(uri,options);
};

function videoClose(){
	$('.groupinvites:checked').prop('disabled',false);								
  $("#vwindow").modal('hide');
  $('#vcanvas').hide();
  $(".nav-side-menu").show();
  for(i=0;i<MediaStreams.length;i++){
      MediaStreams[i].getTracks().forEach(function (track) { track.stop(); });
  }

  setTimeout(function(){
    while(MediaStreams.length > 0) {
      MediaStreams.pop();
    }
    while(sessions.length > 0) {
      sessions.pop();
    }
    },2000);
  $('[id^=RemoteVideo]').remove();
  CloseSession(sessions[SessionRunner]);
};

function validatePhoneNumber(num) {
  var filter = /^((\+[1-9]{1,4}[ \-]*)|(\([0-9]{2,3}\)[ \-]*)|([0-9]{2,4})[ \-]*)*?[0-9]{3,4}?[ \-]*[0-9]{3,4}?$/;
  if (filter.test(num)) {
  if(num.length > 5 && num.length < 18)
        return true;
  else
        return false;
  }
  else {
      return false;
  }
}


var RemovePhonePrefixes = function (GivenPhone) {
  GivenPhone = GivenPhone.replace(/\+/g, "");
  while (GivenPhone.startsWith("0")) {
      GivenPhone = GivenPhone.substring(1);
  };
  return GivenPhone;
};

function allowDrop(ev) {
  ev.preventDefault();
  return false;
}

function drop(ev,jid) {
  ev.preventDefault();
//  if (window.Debug) console.log(ev,bid);
  var bid = jsxc.jidToBid(jid);
  var msg = $('<div><div><label><input type="file" name="files" /><label></div></div>');
  msg.addClass('jsxc_chatmessage');
  jsxc.gui.window.showOverlay(bid, msg, true);
  jsxc.fileTransfer.fileSelected(jid, msg, ev.dataTransfer.files[0]);
  return false;
  //ev.target.appendChild(document.getElementById(data));
}

function getthumbnail(gUrl,element){
	 if (window.Debug) console.log("getthumbnail");
	var pview = element.getDOM();
	if(pview.length > 0)
		window.pview =  pview[0].id;

	var endpoint = "https://" + xmpp.domain +  "/preview.php";
	var url ="/getthumbnail?filename="+gUrl+"&linkUrl="+endpoint;
	$.get(url, function(response) {
		$("#preview" + window.pview).attr("src",response);
	})
}

function fillthumbnails(bid){
  setTimeout(function(bid){
    $( "img[id^='preview']"  ).each(function( index ) {
      var This = $(this);
      var source = This.attr('src') ;
      if (source == undefined) {
        var Target = This.parent().parent().parent().parent();
        var Url = Target.find('a').attr('href');
        if (Url !=undefined && Url != null) {
        var NewUrl = Url.substring(0,Url.lastIndexOf('.')) + '.gif';
        This.attr('src',NewUrl);
        if (window.Debug) console.log(Target.find('a').attr('href'),Target.attr('id'), NewUrl);
       }
      }
    });
    if (bid !=undefined)  jsxc.gui.window.scrollDown(bid);
  },100);
};


var ZoomMe = function(ev) {
  if (ev == undefined){
    document.getElementById('remoteVideo').src = this.src;
  }
   else {
    document.getElementById('remoteVideo').src = ev.target.src;
   }
};


var VideoMute = function(){
  sessions.forEach(function(element) {
    if (element && element.mute){
      element.mediaHandler.toggleMuteVideo(true);
    }
  });
  $('.cam-unmute').show();
  $('.cam-mute').hide();
}

var CallHold = function(){
  sessions.forEach(function(element) {
    if (element && element.hold){
      element.hold();
    }
  });
  $('.call-hold').hide();
  $('.call-unhold').show();
  document.getElementById('localVideo').pause();
};

var CallUnhold = function(){
  sessions.forEach(function(element) {
    if (element && element.hold){
      element.unhold();
    }
  });
  $('.call-hold').show();
  $('.call-unhold').hide();
  document.getElementById('localVideo').play();
	
};

var VideoUnMute = function(ev){
  sessions.forEach(function(element) {
	if (element && element.mediaHint && element.mediaHint.constraints && element.mediaHint.constraints.video == false) {
    var mh = element.mediaHint;
    mh.constraints.video = true;
    mh.extraHeaders= ['X-webcall: vidfly'];
    element.request.headers['X-webcall: vidfly'];
    element.sendReinvite(mh)
//		console.log("Video On the Fly Not yet Implemented");
	}
    if (element && element.unmute){
      element.mediaHandler.toggleMuteVideo(false);
    }
  });
  $('.cam-mute').show();
  $('.cam-unmute').hide();
}

var AudioMute = function(){
  sessions.forEach(function(element) {
    if (element && element.unmute){
      element.mediaHandler.toggleMuteAudio(true);
    }
  });
  $('.mic-mute').hide();
  $('.mic-unmute').show();
}

var AudioUnMute = function(){
  sessions.forEach(function(element) {
    if (element && element.unmute){
      element.mediaHandler.toggleMuteAudio(false);
    }
  });
  $('.mic-mute').show();
  $('.mic-unmute').hide();
}

/*
var ControlClick = function(th){
 // if(cntrlIsPressed == false){
   // $('.sharedfile.selected').removeClass('selected');
  //}
  //$(th).toggleClass('selected')
}

var droptofolder = function(ev){
//  if (window.Debug) console.log("Dropped...",ev);
  ev.preventDefault();
  // Get the id of the target and add the moved element to the target's DOM
  var data = ev.dataTransfer.getData("text");
  var folder = $(ev.target).text().trim().toLowerCase();
  var lm = ev.target;
  if (folder.length<1){
    while ($(lm).find('b').length<1)
    lm = $(lm).parent();
    folder =window.LastFilter.tag + '/' +  $(lm).find('b').text();
  }
  MoveSharedFile(data,folder);
};

var ondragover = function(event){
//  if (window.Debug) console.log("Dragging ..",event)
};

var dragstarted = function(ev){
  var lm = ev.target;
  while ($(lm).find('b').length<1)
    lm = $(lm).parent();
  ev.dataTransfer.setData("text", $(lm).find('b').html());
};


var AllowEdit = function(ele){
  if (window.Debug) console.log(ele);
};

var AddNewFolder = function(){
  window.LastFilter.tag
  $('#sharedmenu > div.shareMenu > ul').append('<li><a ondrop="droptofolder(event)" ondragover="allowDrop(event)" href="javascript:void(0);" class="sideMenuItem" id="sha-new-folder">     <img src="images/SVG/Icons-57.svg" class="shared-img" alt="activity logs"  > New Folder</a>  </li>');
  storage.get(_candidate + '_fileRegister', function(error, data) {
    if (error) {
      throw error;
      return;
    } else {
      let reg = new Object();
      reg.tag = window.LastFilter.tag;
      reg.bound = 'IN';
      reg.fileurl = '';
      reg.filesize = 0;
      reg.filetype = 'folder';
      reg.filename = 'New Folder';
      reg.contact = '';
      reg.sharedTime = new Date();
      let xarr = [];
      xarr.push(reg);
      if (data.length > 0) {
        yarr = xarr.concat(data);
      } else {
        yarr = xarr;
      }
      var i = 0;
      while(yarr.length > 50 && i<50){
        if (yarr.tag=='bin') {
          yarr.splice(i, 1);
        } else i=i+1;
      }

      if (yarr.length > 50) {
        yarr.length = 50; // Change here to store required num of history;
      }
      storage.set(_candidate + '_fileRegister', yarr, function(error) {
        if (error) {
          throw error;
          return;
        }
      });
      setTimeout(function(){
          DisplaySharedFiles(window.LastFilter.tag, window.LastFilter.filter);
      },100);
    }
  });
};

var RenameFile =  function (data) {
   if (window.Debug) console.log('Ari Received',data)
  var lm = document.elementFromPoint(data.x,data.y);
  while ($(lm).find('b').length<1)
    lm = $(lm).parent();
  var cm = $(lm).find('b');
  if (window.Debug) console.log("Pointing to ",lm)
  cm.attr('contentEditable',true).blur(function(){
    if (window.Debug) console.log('Now take care...Bye..Bye')
    $(this).attr('contentEditable',false);
    var dm = $(this).attr('name');
    var nv = $(this).text();
    storage.get(_candidate + '_fileRegister', function(error, data) {
      if (error) {
        throw error;
        return;
      } else {
        if (data[dm].filetype=='folder'){
          var pd = data[dm].tag + '/' + nv;
          var od = data[dm].tag + '/' + data[dm].filename ;
          for(i=0;i<data.length;i++){
            if (data[i].tag == od){
              data[i].tag = pd;
            }
          }
        }
        data[dm].filename = nv;
        storage.set(_candidate + '_fileRegister', data, function(error) {
          if (error) {
            throw error;
            return;
          }
        });
        setTimeout(function(){
            DisplaySharedFiles(window.LastFilter.tag, window.LastFilter.filter);
        },100);
  
      }
    });  
  });
  cm.focus();
  document.execCommand('selectAll',false,null);
};

var ChangeFolder = function(newfolder){
  var mc =window.LastFilter.tag + '/' + newfolder;
  if (newfolder =='..'){
    mc = window.LastFilter.tag.substr(0,window.LastFilter.tag.lastIndexOf('/'))
  }
  DisplaySharedFiles(mc,'All');
};

var RecoverFiles = function(){
  storage.get(_candidate + '_fileRegister', function(error, data) {
    if (error) {
      throw error;
      return;
    } else {
      for(i=0;i<data.length;i++){
        if(data[i].tag.length<1 || data[i].tag=="All")
          data[i].tag = "bin";
      }
      storage.set(_candidate + '_fileRegister', data, function(error) {
        if (error) {
          throw error;
          return;
        }
      });
    }
  });
};
*/

function ShowMenu(control, e, id) {
		if (window.Debug) console.log("show menu calling"+control);
		
		
	$(".rightclick_div").hide();

	//$(".cntnr").show();
    $("#"+control+".rightclick_div" ).show();
	
 }


 function editMsg(id)
{
	if (window.Debug) console.log("Edit msg caslling"+id);
	var msginnerID = id+"_Inner";
	
	var clonehtml = $("#"+id).clone();
	if (window.Debug) console.log("clonehtml ", clonehtml);
	
	var textvalue = document.getElementById(msginnerID).innerHTML;
	
	$(".jsxc_textinput").html(textvalue);
	
	$(".jsxc_textinput").addClass('editedmsg');
	$(".jsxc_editcancel").show();
	$("#editeddid").val(id);
	$(".rightclick_div").hide();
	$("#"+id+".rightclick_div" ).show();
} 

function quoteMsg(id)
{
	
	var msginnerID = id+"_Inner";
	var Quotemsg = document.getElementById(msginnerID).innerHTML;
	
	$("#quotedid").val(id);
	var Timestampid  = id+"Timestamp";
	var QuoteTimeStamp = document.getElementById(Timestampid).innerHTML;
	
	var quotemessage	= "<div style=\"display:none\"></div><div class=\"pull-right\" onclick=\"closeCopyQuoteDiv('"+id+"')\"><i class=\"fa fa-times\"></i></div><div style=\"border-bottom: 1px solid #b3a9a97a;margin-bottom: 5px;\"><i class=\"fa fa-quote-right\"></i><span style=\"padding:5px 0 0 12px;font-size: 14px\" id=\"QuoteMessage"+id+"\">"+Quotemsg+"</span><div style=\"padding:10px 0 0 23px;color: #8e8b8b;font-size: 12px\"><span id=\"QuoteTimeStamp"+id+"\" style=\"padding:0 0 0 5px;display:none\">"+QuoteTimeStamp+"</span> <span id=\"QuoteMessageTime"+id+"\" style=\"padding:0 0 0 5px; float: right\">"+QuoteTimeStamp+"</span></div>";

	$(".jsxc_textinput").addClass('quotemsg');	
	$(".rightclick_div").hide();
	//$("#copyqoute").html(clonehtml);
	$("#copyqoute").show();
	$("#copyqoute").html(quotemessage);
}

function deleteMsg(id)
{
	if (window.Debug) console.log("delete msg is calling..."+id);
	$(".rightclick_div").hide();
	$("#"+id+".rightclick_div" ).hide();
}

function closeCopyQuoteDiv(id)
{	
  $(".jsxc_textinput").removeClass('quotemsg');
  $(".jsxc_textinput").val('');
  $("#copyqoute").html("");
  $("#copyqoute").hide();
 
}


var recording = false;
    var audio_context;
    function getPermission(){
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;
        audio_context = new AudioContext;
      } catch (e) {
      }
      navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
      });
    };
    function startUserMedia(stream) {
      if (window.Debug) console.log("Got Stream");
      var input = audio_context.createMediaStreamSource(stream);
      input.connect(audio_context.destination);
      arecorder = new ARecorder(input);
      arecorder && arecorder.record();
      recording=true;
      if (window.Debug) console.log("Recording");
    }
  
    function startRecording(button){
		
		
		getPermission();
		
		$("#filesmily_sec").hide();
		$("#audiorec_sec").show();

	var start_timer	= "audiotimer_display";
	$("#"+start_timer).text("00:00:00");
	var _timer = document.querySelector('#' +start_timer);
	StartTimer(_timer);
		
      if (window.Debug) console.log(arecorder);
      /* if (window.Debug) console.log(button.innerHTML);
      if (recording == true){
        recording=false;
        arecorder && arecorder.stop();
        if (window.Debug) console.log("Stopped Recording");
        arecorder && arecorder.exportWAV(function(blob) {
            UploadBlob(blob);  
        });
        button.innerHTML = "Processing";
        if (window.Debug) console.log(arecorder);
        arecorder.clear();
		audio_context.close();
      } else{
        getPermission();
        button.innerHTML = "Stop";
      } */
    }

	function stopRecording()
	{
		if (window.Debug) console.log("Stopped Recording");
		stopTimer();
		$("#filesmily_sec").show();
		$("#audiorec_sec").hide();
		arecorder && arecorder.stop();
       
        arecorder && arecorder.exportWAV(function(blob) {
            createDownloadLink(blob);  
        });
        //button.innerHTML = "Processing";
        if (window.Debug) console.log(arecorder);
        arecorder.clear();
		audio_context.close();
	}
	
	function cancelAudioNotes()
	{
		stopTimer();
		$("#filesmily_sec").show();
		$("#audiorec_sec").hide();
		
		arecorder && arecorder.stop();
        if (window.Debug) console.log("Cancel Recording");
        
        //button.innerHTML = "Processing";
        if (window.Debug) console.log(arecorder);
        arecorder.clear();
		audio_context.close();
	}
	
function createDownloadLink(blob) {
	
	if (window.Debug) console.log("createDownloadLink ", blob);
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = "Save to disk";

	//add the new audio element to li
	li.appendChild(au);
	
	//add the filename to the li
	li.appendChild(document.createTextNode(filename+".wav "))

	//add the save to disk link to li
	li.appendChild(link);
	
	/* //upload link
	var upload = document.createElement('a');
	upload.href="#";
	upload.innerHTML = "Upload";
	upload.addEventListener("click", function(event){
		  var xhr=new XMLHttpRequest();
		  xhr.onload=function(e) {
		      if(this.readyState === 4) {
		          if (window.Debug) console.log("Server returned: ",e.target.responseText);
		      }
		  };
		  var fd=new FormData();
		  fd.append("audio_data",blob, filename);
		  xhr.open("POST","upload.php",true);
		  xhr.send(fd);
	})
	li.appendChild(document.createTextNode (" "))//add a space in between
	li.appendChild(upload)//add the upload link to li */

//var bid = jsxc.jidToBid("2@im03.vectone.com");
if (window.Debug) console.log("startRecording :::", bid);
	var message = jsxc.gui.window.postMessage({
					bid: bid,
					direction: 'out',
					flag: false,
					attachment: {
						name: filename,
						size: blob.size,
						type: blob.type,
						//data: (file.type.match(/^image\//)) ? img.attr('src') : null
						data: (blob.type.match(/^image\//)) ? imgSrc : null
					}
				});
				jsxc.xmpp.httpUpload.sendFile(blob, message);
	//add the li element to the ol
	//$(".jsxc_textarea").append(li);
}


var gTimer;
function StartTimer(display)
{
	
	var hours = 0, minutes = 0, seconds = 1;
	gTimer = setInterval(function ()
	{
		if( seconds<10 )
			sec = "0"+seconds;
		else
			sec = seconds;

		if( minutes<10 )
			mins = "0"+minutes;
		else
			mins = minutes;

		if( hours<10 )
			hrs = "0"+hours;
		else
			hrs = hours;

		display.textContent = hrs + ":" + mins + ":" + sec;
		seconds += 1;

		if( (minutes==59) && (seconds==60) )
		{
			hours += 1;
			minutes = 0;
			seconds = 0;							
		}
		else if( seconds==60 )
		{
			seconds = 0;
			minutes += 1;
		}

	}, 1000);
}


function stopTimer()
{	
	clearTimeout(gTimer);
    gTimer ="";
    
}


function FilterContactList(input)
{
	 if (window.Debug) console.log("input is",input);
	if(input != "")
		$('.searchClose').css("display","block");
	else
		$('.searchClose').css("display","none");
	$('.favcontact ul').remove();
	$('.normcontact ul').remove();
	$('.groupcontact ul').remove();
	getalldetail(input.toUpperCase());
	
	/*var filter, ul, li, a, i, x;
    
	if(input != "")
		$(".searchclose").show();
	else
		$(".searchclose").hide();
	
	var id = "Friends";
	if($('.chatheaderIcons').hasClass("showcontats"))
		id = "Friends"
	else
		id = "friendsConversation";
	
    filter 	= input.toUpperCase();
    ul 		= document.getElementById(id);
    li 		= ul.getElementsByClassName("jsxc_caption");
    x  		= ul.getElementsByClassName("jsxc_rosteritem");
    
	var isPresent = false;
    for (i = 0; i < li.length; i++)
    {
        a = li[i].getElementsByTagName("normal")[0];
        if (a.innerHTML.toUpperCase().indexOf(filter) > -1)
        {
			isPresent = true;
            li[i].style.display = "";
            x[i].style.display = "";
        }
        else
        {
            li[i].style.display = "none";
            x[i].style.display = "none";
        }
    }
	
	if(isPresent == false)
	{
		$("#no_data").show();
		$("#Friends").hide();
	}
	else
    {
		$("#no_data").hide();
		$("#Friends").show();
	}	*/
}

function loadRightSideTask()
{
	//loadFilesRightDiv();
	//loadTasksrightDiv();
	//loadEventsrightDiv();
	//loadnotes();
	/* $('.box-inner').empty().append('<div class="loaddetail"></div>');
	$('.loaddetail').append('<b>Member</b>');
	var post = loadPinPost();
	post += loadnotes();
	loadFilesRightDiv();
	var mainDiv = '<ul class="list-group">\n'+post+
	'</ul>';
	$('.loaddetail').append(mainDiv); */
}
/*
function loadTasksrightDiv()
{
	fs.readFile(TaskFile, function (err, data) {
		
		console.log("Original data", data);	
		var Existngdata = JSON.parse(data)
		var ListofTasks = "";
		var entry_count = 0;
		var taskdata="";
		$(".chattasklist").html("");
		for (var i = 0; i < Existngdata.data.length; i++) {

					
					var obj = Existngdata.data[i];

					if(bid !== obj.postuser)
						continue;

				if(obj.msgid == null || obj.msgid == undefined)
						continue;
				var msgid = obj.msgid.replace("-", ":");
			
				var data = jsxc.storage.getUserItem('msg', msgid);
					
					if(data == null || data == undefined)
						continue; 	

					var entry =""
					entry = '<div class="custom-control custom-checkbox mb-3">' 

					if( obj.iscomplete == true)
						entry += '<input type="checkbox" class="custom-control-input" checked>'
					else
						entry += '<input type="checkbox" class="custom-control-input" checked>'

					entry +='<label class="custom-control-label">'+obj.taskname+'</label>' 
					entry +='<p>'+obj.assignee+'</p>' 
					entry +='</div>'
					
					taskdata+=entry;
		}

		$(".chattasklist").html(taskdata);
	});
}


function loadEventsrightDiv()
{
	fs.readFile(EventsFile, function (err, data) {
		
		if(data ==undefined) return;
		var Existngdata = JSON.parse(data)
		var ListofTasks = "";
		var entry_count = 0;
		var taskdata="";
		$(".chateventlist").html("");
		for (var i = 0; i < Existngdata.data.length; i++) {

				var obj = Existngdata.data[i];

					 if(bid !== obj.jid)
						continue;

					//var time = convertGMTtoLocal(obj.start_date);


		var Starttimedata 		= convertGMTtoLocal(obj.start_date);
		var Starttimedatasplit 	= Starttimedata.split(" ");
		var Starttimedaymonth 	= Starttimedatasplit[0]+" "+Starttimedatasplit[1];
	
		var Endtimedata = convertGMTtoLocal(obj.end_date);
		var Endtimedatasplit = Endtimedata.split(" ");
		var Endtimedaymonth = Endtimedatasplit[0]+" "+Endtimedatasplit[1];
		
		var Scheduletime = "";
		
		if(Starttimedaymonth == Endtimedaymonth)
			Scheduletime = Starttimedaymonth + " at "+ Starttimedatasplit[3]+" "+Starttimedatasplit[4]+" - "+Endtimedatasplit[3]+" "+Endtimedatasplit[4];
		else			
			Scheduletime = convertGMTtoLocal(obj.start_date)+" - "+convertGMTtoLocal(obj.end_date);



		var event_name = obj.text;
		var entry =""
		
		entry ='<div class="events">' 
		entry += '<img src="icons/calander-s.png" alt="John Doe" class="">' 
		entry +='<p>'+event_name+'</p>' 
		entry +='<span>'+Scheduletime+'</span>' 
		entry +='</div>' 
		
		
		taskdata+=entry; 
		}

		$(".chateventlist").html(taskdata);
	});
}

function loadPinPost()
{
	var key = 'jsxc:' + jsxc.bid + ':pinpost';
	var data = JSON.parse(localStorage.getItem(key)) || [];
	
	if(data.length == 0)
		return '';
	
	var temp='';
	for(var i=0;i<data.length;i++)
	{
		var message = jsxc.storage.getUserItem('msg',data[i]);
		console.log("message is",message)
		if(message != null){
			if(message.bid != window.LastChatWindow)
				continue;
			
			if(message.attachment)
				temp+='<div class="pinDiv" onclick="highlightdiv(\'' + message._uid + '\');">'+message.attachment.name+'</div>';
			else
				temp+='<div class="pinDiv" onclick="highlightdiv(\'' + message._uid + '\');">'+message.msg+'</div>';
		}
		
	}
	if(temp == '')
		return '';
	
	var loadDiv = '<li class="list-group-item">\n'+
	'<div class="dropdown-heading" role="tab" id="heading-1">\n'+
	'<a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapse-1" aria-expanded="true" aria-controls="collapse-1"><i class="more-less pull-right glyphicon glyphicon-chevron-down"></i>Pinned</a>\n'+
	' </div>\n'+
	'<div id="collapse-1" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading-1"><div class="panel-body">\n'+temp+
	'</div>\n'+
	'</div>\n'+
	'</li>\n';
	
	return loadDiv;
}
function loadnotes()
{
	var notesHistory = localStorage.getItem('jsxc:' + jsxc.bid + ':noteshistory') || []
	if(notesHistory.length == 0)
		return '';
	
	notesHistory = JSON.parse(notesHistory);
	
	var Notesdata = '';
	for(var i = 0; i<notesHistory.length; i++)
	{
		if(notesHistory[i].bid != window.LastChatWindow) 
			continue;

		var authordata = GetContactDetails(notesHistory[i].bid.split("@")[0]);
		var Author = authordata.caller_id;

		if(atob(notesHistory[i].text) == '')
			continue;
	
		var taskDiv ='<div class="notes1">' +
		'<div class="event1">' +
		'<img src="icons/note-s.png" alt="John Doe" class="">' +
		'<p>'+atob(notesHistory[i].text)+'</p>' +
		'<span>Author: '+Author+'</span>' +
		'</div>' +
		'</div>' 

		Notesdata+=taskDiv;
	}	
	$(".chatnotes").html(Notesdata);
}
*/

 function toggleIcon(e) {
	$(e.target)
		.prev('.dropdown-heading')
		.find(".more-less")
		.toggleClass('glyphicon-chevron-up glyphicon-chevron-down');
}
$('.dropdownPanel').on('hidden.bs.collapse', toggleIcon);
$('.dropdownPanel').on('shown.bs.collapse', toggleIcon);


/*var addparticipabtHTML =
		'<div id="showContatInfo" class="modal fade" role="dialog">\n'+
		'<div class="modal-dialog">\n'+
		'<div class="modal-content">\n'+
		'<div class="modal-header">\n'+
        '<button type="button" class="close" data-dismiss="modal">&times;</button>\n'+
        '<h4 class="modal-title">Move To</h4>\n'+
		'</div>\n'+
		'<div class="modal-body">\n'+
		'<div class="contactinfo"></div>\n'+
		'</div>\n'+
		'</div>\n'+
		'</div>\n'+
		'</div>\n'+
		'';*/
function taskEventPost()
{
	 if (window.Debug) console.log("taskEventPost Calling");
	$("#trigger_postContatInfo").trigger('click');
	
	var len =$("#myModalnewposttasks").length;
	 if (window.Debug) console.log("len ",len);
	if($("#myModalnewposttasks").length == 0)
	{
		var popupCreateTask	 = 	$(loadDashBoardWin.find('#myModalnewposttasks')).clone();
		$(popupCreateTask).find('.SuggessionLst').empty();
		$('#ParentWindow').append(popupCreateTask);
	}
	loadSuggessionEvnt('');
	
	 $(".suggessiontxt").keyup(function(){  
		var text	=	 $(this).val();
		loadSuggessionEvnt(text);
	});  
	
	
	
	
	
	
	
	//$("#myModalnewposttasks").trigger('click');
	
	/*
	$('.postinfo').empty();
	var result = jsxc.storage.getUserItem('buddylist');
	console.log("result",result);
	  $.each(result, function (index, item) {
			 data = jsxc.storage.getUserItem('buddy', item);
			 if(data == null)
				return false;
			
			 console.log("data name",data.name);
			 console.log(data.jid);
			
			var div='<div class="cname" data-dismiss="modal" onclick=getTaskPostuser("'+data.jid+'")>'+data.name+'</div>';
			
			if( $('.postinfo').length !=0 )
				$('.postinfo').append(div);
	  })*/
}

function loadSuggessionEvnt(text)
{
	$('.SuggessionLst').empty();
	var temp = "";
	for(var i=0; i<contacsarray.length; i++)
	{
		var data = contacsarray[i];
		if( (text != "") && (text != undefined))
		{	
			text = text.toUpperCase();
			if (!data.caller_id) continue;

			if(data.caller_id.toUpperCase().indexOf(text) == -1) 
				continue;
		}
		var img = data.ImageURL || "images/list-name.png";
		temp += '<li onClick=getTaskPostuser("'+data.sip_login_id+jidSuffix+'") data-dismiss="modal">\n'+
			'<div class="name-images">\n'+
			'<img src='+img+' class="list-name-img">\n'+
			'</div>\n'+
			'<div class="name-images123"><p>'+data.caller_id+'</p></div>\n'+
			'</li>\n';
	}
	if(temp !="")
		$('.SuggessionLst').append(temp);
}

function getTaskPostuser(jid)
{
	$("#postuser").val(jid);
	$(".dhx_save_btn_set").show();
}

function postTask(Name, starttime, endtime, id)
{
	var temp 		= 	[];
	temp.id 		= 	"db-"+(jsxc.bid).split("@")[0]+"_events";
	temp.Name 		= 	Name;
	temp.starttime 	= 	starttime;
	temp.endtime 	= 	endtime;
	temp.tid 		= 	id;
	couchDbGetItem(updateEventtoDB, temp);
}

function updateEventtoDB(returnVal, returnData, inputsParam)
{
	var PostUser 	= 	$("#postuser").val();
	var Nochange 	= 	false;
	var isevent 	= 	true;
	var isTask		= 	false;
	
	var starttime 	= 	getFormatforEventsdate(inputsParam.starttime);
	var endtime 	= 	getFormatforEventsdate(inputsParam.endtime);
	var dataarray 	= 	{taskid:inputsParam.tid, taskname : inputsParam.Name, Starttime:starttime, Endtime: endtime};

	var msg = jsxc.gui.window.postMessage({
		bid				: 	PostUser,
		direction		: 	jsxc.Message.OUT,
		msg				: 	inputsParam.Name,
		flag			: 	false,
		editedmsg_id 	: 	"",
		edited 			: 	false,
		quoted 			: 	false,
		quoted_id 		: 	"",
		quoted_msg		: 	"",
		quoted_timestamp: 	"",
		isEvent 		: 	true,
		eventdetails 	: 	dataarray
	 });

	console.log("msg",msg);


	let reg 		= 	new Object();
	reg.id 			= 	inputsParam.tid;
	reg.start_date 	= 	starttime;
	reg.end_date 	= 	endtime;
	reg.text 		= 	inputsParam.Name;
	reg.jid			=	PostUser;
	reg.isTask		= 	isTask;
	reg.isEvent		= 	isevent;
	reg.msgid 		=	msg._uid;
	
	if(returnVal == "success")
	{
	
		if(PostUser == "" || PostUser == undefined || PostUser==null)	return;

		var Existngdata = returnData.taskdetails || [];
		
		for (var i = 0; i < Existngdata.length; i++) 
		{
			var obj = Existngdata[i];
			
			if ( obj.id == inputsParam.tid) {
				isevent = obj.isEvent;
				isTask 	= obj.isTask;
				
				if(obj.id == id && starttime == obj.start_date && endtime == obj.end_date && inputsParam.Name == obj.text)
					Nochange = true;
				
				PostUser = obj.jid;
				Existngdata.splice(i, 1);
			}
		}
		Existngdata.push(reg);	
		var input = {
			 _id		: 	inputsParam.id,
			_rev		: 	returnData._rev,
			taskdetails	:	Existngdata
		};
		couchDbPutItem(taskSuccessError, input, inputsParam);
	}
	else
	{
		var linkHistory = [];
		linkHistory.push(reg);
		var input = {
			_id			: inputsParam.id,
			taskdetails	: linkHistory
		};
		couchDbPutItem(taskSuccessError, input, inputsParam);
	}

	if(Nochange)
	{
		var user = $("#postuser").val("");
		return;
	}
 
	 return true;
}


//Thu Oct 25 2018 06:00:00 GMT+0530


function deleteTaskEvent(id)
{
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	temp.taskId = id;
	couchDbGetItem(getTaskdetailsforDelete, temp);
}

function getTaskdetailsforDelete(returnVal, returnData, inputsParam)
{	
	if(returnVal == "success")
	{
		var data = returnData.taskdetails || [];
		for (var i = 0; i < data.length; i++) 
		{
			var obj = data[i];
			if ( obj.id == inputsParam.taskId) {
				removeMessage(obj.msgid, obj.postuser);
				data.splice(i, 1);
			}
		}

		var input = {
			_id: inputsParam.id,
		   _rev: returnData._rev,
		   taskdetails:data
	   };

		couchDbPutItem(taskSuccessError, input, inputsParam);
		
		if($(".dashBoardWind").length != 0 )
			getDashboardTasklist();	
		else if($('.taskWin').length != 0)
			getTasklist();
	}
}
	
function convertGMTtoLocal( inputdate )
{
	var monthNames 	= ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov", "Dec"];
	var dayNames 	= ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	//inputdate 		= inputdate.replace(/-/g,'/');
	var date 		= new Date( inputdate);
	var day 		= date.getDate();
	var monthIndex 	= date.getMonth();
	var year 		= date.getFullYear();
	var time 		= formatAMPM( date ) ;
	
	var formatted_date ="";

	formatted_date = monthNames[date.getMonth()] + " "+ date.getDate() + ", "+ date.getFullYear() + " "+time;
	
	return formatted_date;
}

function formatAMPM(date)
{
	var hours 	= date.getHours();
	var minutes = date.getMinutes();
	var ampm 	= hours >= 12 ? 'PM' : 'AM';
	
	hours 		= hours % 12;
	hours 		= hours ? hours : 12; // the hour '0' should be '12'
	minutes 	= minutes < 10 ? '0'+minutes : minutes;
	
	var strTime = hours + ':' + minutes + ' ' + ampm;
	
	return strTime;
}

function getFormatforEventsdate(inputdate)
{
	var monthNames 	= ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov", "Dec"];
	var dayNames 	= ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//	inputdate 		= "Thu Oct 18 2018 00:55:00 GMT+0530"
	//inputdate 		= inputdate.replace(/-/g,'/');
	var date 		= new Date( inputdate );
	var day 		= date.getDate();
	var monthIndex 	= date.getMonth();
	var year 		= date.getFullYear();
	var time 		= formatAMPM(date);
	
	var month		= monthIndex+1;
	
	 if (window.Debug) console.log("day :: "+day + ":: monthIndex :: "+monthIndex + "date.getHours "+ date.getHours() + "date.getMinutes() "+date.getMinutes());
	
	//2018-11-24 09:00
	
	//var formatted_date =date.getFullYear()+"-"+month+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes();

	var formatted_date =date.getFullYear()+"-"+(month<10?'0':'') + month+"-"+(date.getDate()<10?'0':'') + date.getDate()+" "+(date.getHours()<10?'0':'') + date.getHours()+":"+(date.getMinutes()<10?'0':'') + date.getMinutes();

	//formatted_date = monthNames[date.getMonth()] + " "+ date.getDate() + ", "+ date.getFullYear() + " "+time;
	//alert(formatted_date);
	return formatted_date;
} 

function generateEventid() 
{
	var length 	= 10;
	return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

$("#newtaskcreate_btn").click(function() 
{
	 if (window.Debug) console.log("dropdown list creating..");
	taskDropdownUsers();
});

function taskDropdownUsers()
{
	var Taskname		= $("#taskname_id").val("");
	var Assigneename	= $("#assignee_name, #more_assignee_name").val("");
	var Duedate			= $("#js-date").val("");
	var expandstartdate = $("#expand-js-date").val("");
	var expandenddate 	= $("#expanddue-js-date").val("");
	
	var Totaldays		= $("#Total_days").val("");
	
	var sectionname		= $("#Section_id").val("");
	var Description		= $("#Description").val("");
	var checkedcomponent= ""	
	
	
	isTaskAttachment = false;
	$('#taskfile').change(function(files) {
		attachmentsend(files, $("#Postuserid").val());
		taskFilesbundle = files;
		
		isTaskAttachment = true;
		var size = files.target.files.length;
		if(size == "")
			$("#task_attchmentsec").hide();
		else
			$("#task_attchmentsec").show();

		var Filelist= ""
		for (var i =0;i<size;i++)
		{
		
			var file = files.target.files[i]; 
			var name = file.name;
			 if (window.Debug) console.log("Filename", name);

			if(Filelist == "")
			Filelist = name;
			else
			Filelist +=", "+name;

		}
		$("#attchtaskfilelist").val(Filelist);

	});

	$('.taskcolor').click(function() {
		$('.taskcolor').not(this).prop('checked', false);
});

	//showMoreLessSec('less');
	
	$('#repeat_sec option').prop('selected', function()
	{
		return this.defaultSelected;	
	});
	
	$('#time_sec option').prop('selected', function()
	{
		return this.defaultSelected;	
	});
		
	$("input[name=completeradio][value=checkedonly]").attr('checked', 'checked');
	
	
	$("#trigger_popupbtn").html("Post to ");
	$("#Postusername").val("");
	$("#Postuserid").val("");
	
	$('#itmelist, #more_itmelist').empty();
	
	var result = jsxc.storage.getUserItem('buddylist');
	 if (window.Debug) console.log("result",result);
	  $.each(result, function (index, item) {
			 data = jsxc.storage.getUserItem('buddy', item);
			 if(data == null)
				return false;
			
			  if (window.Debug) console.log("data name",data.name);
			  if (window.Debug) console.log(data.jid);
			
			var nameEn = btoa(data.name);
			//var div='<div class="cname" data-dismiss="modal" onclick=getTaskPostuser("'+data.jid+'")>'+data.name+'</div>';
			var div='<a href="# " onclick=getAssigneeUser("'+data.jid+'","'+nameEn+'")>'+data.name+'</a>';
			$('#itmelist, #more_itmelist').append(div);
			
			var Buddies = jsxc.storage.getUserItem('buddylist');
			var len = Buddies.length -1;
			if(index == len)
			{
				var selfjid = loggeduser.sip_userid + '@' + xmpp.domain;
				var selfdisplayname = loggeduser.username;
					
				var selfdiv='<a href="# " onclick=getAssigneeUser("'+selfjid+'","'+btoa(selfdisplayname)+'")>'+selfdisplayname+'</a>';
				$('#itmelist, #more_itmelist').append(selfdiv);
			}
	  })
}

function getAssigneeUser(jid, Name)
{
	$("#inputassigneeto_name, #more_assignee_name").val(atob(Name));
	$("#assignee_user").val(jid);
	$("#itmelist, #myDropdown, #more_myDropdown, #more_itmelist").hide();
	
}

function postTaskDropdownUsers()
{
	
	$('#postuserlist').empty();
	
	var result = jsxc.storage.getUserItem('buddylist');
	 if (window.Debug) console.log("result",result);
	  $.each(result, function (index, item) {
			 data = jsxc.storage.getUserItem('buddy', item);
			 if(data == null)
				return false;
			
			  if (window.Debug) console.log("data name",data.name);
			  if (window.Debug) console.log(data.jid);
			
			var nameEn = btoa(data.name);
			//var div='<div class="cname" data-dismiss="modal" onclick=getTaskPostuser("'+data.jid+'")>'+data.name+'</div>';
			var div='<a href="# " onclick=getPostuserValue("'+data.jid+'","'+nameEn+'")>'+data.name+'</a>';
			$('#postuserlist').append(div);
	 
	  })
}

function getPostuserValue(jid, Name)
{
	$("#Postusername").val(atob(Name));
	$("#Postuserid").val(jid);
	$("#trigger_popupbtn").html("Post to "+atob(Name));
	$("#post_close_btn").trigger('click');
}
/*
function createNewTask()
{
	if($("#Postuserid").val() == "" || $("#Postuserid").val() == undefined)
	{
		$("#sendposttask_btn").trigger('click');
		return;
	}
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	couchDbGetItem(updateTasktoDB, temp);
}

function updateTasktoDB(returnVal, returnData, inputsParam)
{
	var Taskname		= $("#taskname_id").val();
	var Assigneename	= $("#inputassigneeto_name").val();
	var Duedate			= $("#js-date").val();
	var expandstartdate = $("#expand-js-date").val();
	var expandenddate 	= $("#expanddue-js-date").val();
	var EndTime			= $("#time_sec").val();
	var Totaldays		= $("#Total_days").val();
	var repeat			= $("#repeat_sec").val();
	var sectionname		= $("#Section_id").val();
	var Description		= $("#Description").val();
	var checkedcomponent= "";
	var colorcheked = $("input[name=taskcolor]:checked").val();
	var id = generateTaskID();
	
	if(Taskname == "" || Taskname == undefined || Taskname == null)	return;		
	var starttime =""
	var endtime	  = "";

	starttime = $("#expand-js-date").val();
	//expandenddate 	= $("#expanddue-js-date").val();
	
	if(starttime != "" && starttime != undefined)
	{	
		starttime 	= starttime.replace(/-/g,'/')
		starttime	= new Date(starttime)
		starttime 	= getFormatforEventsdate(starttime);
	}	
	if(expandenddate != "" && expandenddate != undefined)
	{	
		endtime 	= expandenddate.replace(/-/g,'/');
		//endtime     = endtime+" "+EndTime;
		endtime     = endtime;
		endtime		= new Date(endtime);
		endtime 	= getFormatforEventsdate(endtime);		
	}
	var PostUser = "";
	var dataarray = {taskid: id, taskname : Taskname, starttime:starttime, Endtime: endtime, assignee:Assigneename, endtimesec:EndTime, totaldays:Totaldays, repeat: repeat, sectionname: sectionname, description:Description, postuser: $("#Postuserid").val(), complete: checkedcomponent, iscomplete:false, postusername: $("#Postusername").val(), completepercentage:"0%", assigneejid:$("#assignee_user").val(), color: colorcheked};
	
	
	let reg = new Object();
	if($("#editedtaskid").val() != "" && $("#editedtaskid").val() != undefined)
		reg.id 	= $("#editedtaskid").val();
	else	reg.id 	= id;

	reg.taskname 	= Taskname;
	reg.starttime 	= starttime;
	reg.endtime 	= endtime;
	reg.assignee 	= Assigneename;
	reg.totaldays 	= Totaldays;
	reg.color 		= colorcheked;
	reg.repeat 		= repeat;
	reg.sectionname = sectionname;
	reg.description = Description;
	reg.postuser	= $("#Postuserid").val();
	reg.postusername	= $("#Postusername").val();
	reg.complete	= checkedcomponent;
	reg.isTask		= true;
	reg.isEvent		= false;
	reg.iscomplete	= false;
	reg.completepercentage	= "0%";
	reg.assigneejid	= $("#assignee_user").val();

	if(returnVal == "success")
	{
		var data = returnData.taskdetails || [];
		if($("#editedtaskid").val() != "" && $("#editedtaskid").val() != undefined)
		{
			var id = $("#editedtaskid").val();
			for (var i = 0; i < data.length; i++) 
			{
				var obj = data[i];
				if ( obj.id == id)	data.splice(i, 1);
			}
		}
		data.push(reg);	
		var input = {
			 _id: inputsParam.id,
			_rev: returnData._rev,
			taskdetails:data
		};
		couchDbPutItem(taskSuccessError, input, inputsParam);
	}
	else{
		var linkHistory = [];
		linkHistory.push(reg);
		var input = {
			_id: inputsParam.id,
			taskdetails: linkHistory
		};
		couchDbPutItem(taskSuccessError,input, inputsParam);
	}
	if(isTaskAttachment)
	{
		var size = taskFilesbundle.target.files.length;
		for (var i =0;i<size;i++)
		{
			var file = taskFilesbundle.target.files[i]; 
			message =	jsxc.gui.window.postMessage({
				bid: $("#Postuserid").val(),
				direction: jsxc.Message.OUT,
				msg: Taskname,
				flag: false,
				editedmsg_id : "",
				edited : false,
				quoted : false,
				quoted_id : "",
				quoted_msg : "",
				quoted_timestamp : "",
				isEvent:false,
				eventdetails:"",
				isTask : true,
				attachment: {
				name: file.name,
				size: file.size,
				type: file.type,
				data:  null
				},
				taskdetails : dataarray
			});
			jsxc.xmpp.httpUpload.sendFile(file, message);
		}
		getTasklist();				
	}
	else
	{
		jsxc.gui.window.postMessage({
			bid: $("#Postuserid").val(),
			direction: jsxc.Message.OUT,
			msg: Taskname,
			flag: false,
			editedmsg_id : "",
			edited : false,
			quoted : false,
			quoted_id : "",
			quoted_msg : "",
			quoted_timestamp : "",
			isEvent:false,
			eventdetails:"",
			isTask : true,
			taskdetails : dataarray
		});
		getTasklist();
	}
	$("#Postuserid, #Postusername, #editedtaskid").val("");	
	if(document.getElementById("anothertask").checked)
	{
		$("#taskname_id").val("");
		$("#assignee_name, #more_assignee_name").val("");
		$("#js-date").val("");
		$("#expand-js-date").val("");
		$("#expanddue-js-date").val("");
		$("#Total_days").val("");
	}
	else	$("#new_task_close_btn").trigger('click');
}
*/
function taskSuccessError(returnVal, returnData, inputsParam) 
{
	if(returnVal == "success")
	{
		
	}
}
function generateTaskID() 
{
	var length 	= 8;
	return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

var isMore = false;
function showMoreLessSec(type)
{
	if(type == "more")
	{
		$("#lesssection, #moresec_btn").hide();
		$("#moresection").show();
		isMore = true;
	}
	else
	{
		$("#lesssection, #moresec_btn").show();
		$("#moresection").hide();
		isMore = false;
	}
	
}

/*
function getTasklistfromDB(returnVal, returnData, inputsParam)
{
 	var result = jsxc.storage.getUserItem('buddylist');
	var mainDiv = '<option value=\'\'>All Tasks</option>\n'
	$.each(result, function (index, item) {
		 data = jsxc.storage.getUserItem('buddy', item);
		 if(data == null)
			return false;
		mainDiv += '<option value='+data.jid+'>'+data.name+'</option>\n';
	})
	$("#tasklistfilterbyJid").html(mainDiv); 

	$("#tasklist_table").empty();
	var index = $('#checkindex').prop('checked');
	var checksssignee = $('#checksssignee').prop('checked');
	var checkstart = $('#checkstart').prop('checked');
	var checkdue = $('#checkdue').prop('checked');
	var checkduetime = $('#checkduetime').prop('checked');
	var checkdays = $('#checkdays').prop('checked');
	var checksection = $('#checksection').prop('checked');
	var checkconversation = $('#checkconversation').prop('checked');
	var checkshowshotcolumn = $('#checkshowshotcolumn').prop('checked');
	var checkname = $('#checkname').prop('checked');
	var checkhead = $('#checkhead').prop('checked');

	if(returnVal == "success")
	{
		
		var Existngdata = returnData.taskdetails || [];
		var ListofTasks = "";
		var entry_count = 0;
		for (var i = 0; i < Existngdata.length; i++) {
				var obj = Existngdata[i];
				var assignee = (obj.assignee == undefined) ? "" : obj.assignee;
				var starttime = (obj.starttime == undefined) ? "" : obj.starttime;
				var Endtime = (obj.endtime == undefined) ? "" : obj.endtime;
				var totaldays = (obj.totaldays == undefined) ? "" : obj.totaldays;
				var sectionname = (obj.sectionname == undefined) ? "" : obj.sectionname;
				var postusername = (obj.postusername == undefined) ? "" : obj.postusername;
				var taskLikeBtn = obj.msgid+"_taskLike";
				var taskUnLikeBtn = obj.msgid+"_taskUnLike";
				var taskBookmarkBtn = obj.msgid+"_taskBookmark";
				var taskUnBookmarkBtn = obj.msgid+"_taskUnBookmark";
				var taskPinBtn = obj.msgid+"_taskPin";
				var taskUnPinBtn = obj.msgid+"_taskUnpin";
				
				if(obj.msgid == null || obj.msgid == undefined)	continue;
				
				var msgid = obj.msgid.replace("-", ":");
				
				var data = jsxc.storage.getUserItem('msg', msgid);					
				if(data == null || data == undefined)	continue; 
				
				var checkedbox = "chkbox_"+obj.id;				
				if(starttime !=""  && starttime != undefined)
					starttime = convertTimeTasklistFormat(starttime)
				
				var Time = ""
				if(Endtime !=""  && Endtime != undefined)
				{	
					Endtime = convertTimeTasklistFormat(Endtime)			
					var formattime = new Date( Endtime)
					Time    = formatAMPM(formattime);
				}			
				var deletetaskpopup = obj.id+"_deletetaskpopup";
				var deletetarget = "#"+deletetaskpopup;
				var showContatInfo	= obj.id+"_showContatInfo";
				var showContattarget	= "#"+showContatInfo;
				var b_msgID	= obj.msgid.replace("-", ":");
				var entry  	= "<tr  onclick=\"showTaskDetails('"+obj.id+"')\">"
				if( obj.iscomplete == true)
				{
					entry +="<td class=\"highlight\">"
					entry +="<div class=\"custom-control custom-checkbox mb-3\">"	
					entry +="<input type=\"checkbox\" class=\"custom-control-input\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'complete')\" checked><label class=\"custom-control-label\">"+obj.taskname+"</label>"
					entry +="</div>"
					entry +=" </td>"
				}
				else
				{
					if(obj.complete == "checkedall")
					{
						entry +="<td class=\"highlight\">"
						entry +="<div class=\"dropdown\">"
						entry +="<span type=\"button\" class=\"btn btn-secondary dropdown-toggle\" id=\"tasktooltip\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">0/1</span>"
						entry +="<div class=\"dropdown-menu\" aria-labelledby=\"tasktooltip\">"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'checkedall')\" >"+postusername+"</a>"
						entry +="</div>"
						entry +="</div>"
						entry +="</td>"
					}
					else if(obj.complete == "100%")
					{
						entry +="<td class=\"highlight\">"
						entry +="<div class=\"dropdown\">"
						entry +="<span type=\"button\" class=\"btn btn-secondary dropdown-toggle\" id=\"tasktooltip\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\" >"+obj.completepercentage+"</span>"
						entry +="<div class=\"dropdown-menu\" aria-labelledby=\"tasktooltip\">"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'0%')\" >0%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'10%')\" >10%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'20%')\" >20%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'30%')\" >30%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'40%')\" >40%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'50%')\" >50%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'60%')\" >60%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'70%')\" >70%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'80%')\" >80%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'90%')\" >90%</a>"
						entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'100%')\" >100%</a>"	
						entry +="</div>"
						entry +="</div>"
						entry +="</td>"
					}
					else
					{
						entry +="<td class=\"highlight\">"
						entry +="<div class=\"custom-control custom-checkbox mb-3\">"
						
						entry +="<input type=\"checkbox\" class=\"custom-control-input\"  onclick=\"setCompleteIncomplete('"+obj.id+"',this,'checkedonly')\"><label class=\"custom-control-label\">"+obj.taskname+"</label>"
						entry +="</div>"
						entry +=" </td>"
					}			
				}
				if(checkhead)
					entry +="<td class=\"highlight\"><div class=tasklist-avatar>"+assignee.substring(0,1)+"</div></td>"
				else{ 
					if( (checksssignee) || (checkname) )
						entry +="<td class=\"highlight\">"+assignee+"</td>"
				}
				entry +="<td class=\"highlight\">"+assignee+"</td>"
				//if(checkstart)
				//entry +="<td class=\"highlight\">"+starttime+"</td>"
				//if(checkdue)
				entry +="<td class=\"highlight\">"+Endtime+"</td>"
				//if(checkduetime)
				//entry +="<td class=\"highlight\">"+Time+"</td>"
				//if(checkdays)
				//entry +="<td class=\"highlight\">"+totaldays+"</td>"
				//if(checksection)
				entry +="<td class=\"highlight\">"+sectionname+"</td>"
				//if(checkconversation)
				entry +="<td class=\"highlight\">"+postusername+"</td>"

				entry +="<td><a class=\"dropdown-toggle\" data-toggle=\"dropdown\">"
				entry +="<img src=\"images/icons/elip_h-s.png\" alt=\"\"></a>"
		
				entry +="<div class=\"dropdown-menu\">"
				if(data.likelist.length == 0)
					entry +="<a id='" + taskLikeBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"likemessage('"+obj.msgid+"','"+obj.postuser+"','like')\"><img src=\"images/icons/thumb-s.png\" alt=\"\"> Like</a>"
				else
					entry +="<a id='" + taskLikeBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"likemessage('"+obj.msgid+"','"+obj.postuser+"','dislike')\"><img src=\"images/icons/thumb-s.png\" alt=\"\"> Dislike</a>"

				if(!data.bookmark)	
					entry +="<a id='" + taskBookmarkBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setBookmark('"+b_msgID+"',true)\"><img src=\"images/icons/bookmark-s.png\" alt=\"\">Bookmark</a>"
				else
					entry +="<a id='" + taskBookmarkBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setBookmark('"+b_msgID+"',false)\"><img src=\"images/icons/bookmark-s.png\" alt=\"\">UnBookmark</a>"

				if(!data.flag)	
					entry +="<a id='" + taskPinBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setFlagMode('"+b_msgID+"',true)\"><img src=\"images/icons/pin-s.png\" alt=\"\">Pin</a>"
				else
					entry +="<a id='" + taskPinBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setFlagMode('"+b_msgID+"',false)\"><img src=\"images/icons/pin-s.png\" alt=\"\">UnPin</a>"

				entry +="<a class=\"dropdown-item\" onclick=\"moreSetting('"+obj.msgid+"',false)\" data-toggle=\"modal\" href='"+showContattarget+"'><img src=\"images/icons/share-s.png\" alt=\"\">Share</a>"
				entry +="<a class=\"dropdown-item\" href=\"#\" onclick=\"editTaskdetails('"+obj.id+"')\";><img src=\"images/icons/edit-s.png\" alt=\"\">Edit</a>"
				entry +="<a class=\"dropdown-item\" data-toggle=\"modal\" data-target='"+deletetarget+"'><img src=\"images/icons/delete-s.png\" alt=\"\">Delete</a>"	
				entry +="<div class=\"arrow\" style=\"left: 50%;\"></div>"
				entry +="</div>"
				entry +="<div class=\"modal\" id='"+deletetaskpopup+"' role=\"dialog\">"
				entry +="<div class=\"modal-dialog\">"
				entry +="<div class=\"modal-content\">"
				entry +="<div class=\"modal-header\">"						
				entry +="<h4 class=\"modal-title\">Delete</h4>"
				entry +="<button type=\"button\" class=\"close\" data-dismiss=\"modal\">&times;</button>"
				entry +="</div>"
				entry +="<div class=\"modal-body\">"
				entry +="<p>Are you sure want to delete?</p>"
				entry +="</div>"
				entry +="<div class=\"modal-footer\">"
				entry +="<button type=\"button\" class=\"btn btn-primary\" onclick=\"deleteTaskEvent('"+obj.id+"')\" data-dismiss=\"modal\">Delete</button>"
				entry +="<button type=\"button\" class=\"btn btn-danger\" data-dismiss=\"modal\">Close</button>"
				entry +="</div>"
				entry +="</div>"
				entry +="</div> "
				entry +="</div>	"
				entry +="<div id='"+showContatInfo+"' class=\"modal\" role=\"dialog\">"
				entry +="<div class=\"modal-dialog\">"
				entry +="<div class=\"modal-content\">"
				entry +="<div class=\"modal-header\">"
				entry +="<button type=\"button\" class=\"close\" data-dismiss=\"modal\">&times;</button>"
				entry +="<h4 class=\"modal-title\">Move To</h4>"
				entry +="</div>"
				entry +="<div class=\"modal-body\">"
				entry +="<div class=\"contactinfo\"></div>"
				entry +="</div>"
				entry +="</div>"
				entry +="</div>"
				entry +="</div>"
				entry +="</td>"
				entry +="</tr>"
				ListofTasks += entry;
				entry_count++;
			}
		if(entry_count == 0)
		{
			$("#Nosection_task").show()
			$(".tasksection, #tasktable").hide();	
		}		
		else
		{
			$("#Nosection_task").hide()
			$(".tasksection, #tasktable").show();
			$("#tasklist_table").html(ListofTasks);		
		}
	}
	else
	{
		$("#Nosection_task").show()
		$(".tasksection, #tasktable").hide();

	}
}
*/
function convertTimeTasklistFormat( inputdate )
{
	var monthNames 	= ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov", "Dec"];
	var dayNames 	= ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	//inputdate 		= inputdate.replace(/-/g,'/');
	var date 		= new Date( inputdate);
	var day 		= date.getDate();
	var monthIndex 	= date.getMonth();
	var year 		= date.getFullYear();	
	var time 		= formatAMPM( date ) ;
	
	var formatted_date ="";
	var month		= monthIndex+1;
	formatted_date = month + "/"+ date.getDate() + "/"+ date.getFullYear();
	
	return formatted_date;
}



function addTasklisttocalender(Name, starttime, endtime, id, postusername)
{
	//endtime 	= getFormatforEventsdate(endtime);
	var PostUser = "";
	
	if(postusername == undefined || postusername == "" || postusername == null)
		PostUser = $("#Postuserid").val();
	else
		PostUser = postusername;
		
	var dataarray = {taskname : Name, Starttime:starttime, Endtime: endtime};


if (fs.existsSync(EventsFile)) {
	 if (window.Debug) console.log("File exists..");
	
	fs.readFile(EventsFile, function (err, data) {
		
	 if (window.Debug) console.log("Original data", data);	
    var Existngdata = JSON.parse(data)
	
	
	var Nochange = false;
	for (var i = 0; i < Existngdata.data.length; i++) {
    var obj = Existngdata.data[i];
	
    if ( obj.id == id) {
		
		//"id": id, "start_date": starttime, "end_date": endtime, "text": Name, "details": "", "jid":PostUser
		if(obj.id == id && starttime == obj.start_date && endtime == obj.end_date && Name == obj.text)
			Nochange = true;
		
		PostUser = obj.jid;
        Existngdata.data.splice(i, 1);
    }
}
	
	 
	//var newdata = {"id": id, "start_date": starttime, "end_date": endtime, "text": Name, "details": "", "jid":PostUser};
	
		let reg = new Object();
		reg.id = id;
		reg.start_date = starttime;
		reg.end_date = endtime;
		reg.text = Name;
		reg.jid = PostUser;
		reg.isTask	= true;
		reg.isEvent	= false;
	
	
	 if (window.Debug) console.log('After Deleting', Existngdata);
	
	Existngdata.data.push(reg)

	 if (window.Debug) console.log('After Existngdata', Existngdata);
	 if (window.Debug) console.log('Json data Existngdata', JSON.stringify(Existngdata));
	
    //fs.writeFile(EventsFile, JSON.stringify(json))
	
	fs.writeFile(EventsFile , JSON.stringify(Existngdata), function(err) {
		if(err) {
			return  console.log(err);
		}
	});
	
	

	})
	
}
else
{
	 if (window.Debug) console.log("File not exists..");
	
	PostUser = $("#postuser").val();
	if(PostUser == "" || Name == "" || PostUser == undefined || Name == undefined)
		return;
	
	let reg = new Object();
		reg.id = id;
		reg.start_date = starttime;
		reg.end_date = endtime;
		reg.text = Name;
		reg.jid = PostUser;
		reg.isTask	= true;
		reg.isEvent	= false;
	 
	//let postdata = JSON.stringify(reg, null, '\t');
	
	//var newdata = { "id": id, "start_date": starttime, "end_date": endtime, "text": Name, "details": "", "jid":PostUser}
	var obj = {data: []};
		obj.data.push(reg);
	fs.writeFile(EventsFile , JSON.stringify(obj), function(err) {
		if(err) {
			return console.log(err);
		}
		jsxc.gui.window.postMessage({
            bid: PostUser,
            direction: jsxc.Message.OUT,
            msg: Name,
			flag: false,
			editedmsg_id : "",
			edited : false,
			quoted : false,
			quoted_id : "",
			quoted_msg : "",
			quoted_timestamp : "",
			isEvent : true,
			eventdetails : dataarray
			
         });
		
	});
					
}	
	
}




function showTaskDetails(id)
{
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	couchDbGetItem(getTaskdetailsforView, temp);
}

function getTaskdetailsforView(returnVal, returnData, inputsParam)
{
	if(returnVal != "success")	 return;
	taskOpenNav();
	$("#tsakdetailssec").html("");
	var Existngdata = returnData.taskdetails || [];
	for (var i = 0; i < Existngdata.length; i++) 
	{
		var obj = Existngdata[i];
		if ( obj.id == id) {			
			if(obj.postusername != undefined && obj.postusername != "" && obj.postusername != null)	
			{
				/* $("#trigger_popupbtn").html("Post to "+obj.postusername);
				$("#Postusername").val(obj.postusername);
				$("#Postuserid").val(obj.postuser); */
			}		
			var topentry  	= '<h3 class="showtitle" > '+obj.taskname+'</h3>'
			+'<div class="showtask" >'
			+'<span class="mr20"><img src="././images/task-pin.png" class="imgshowtask" ></span>'
			+'<span class="mr20" onclick=ShowChatWindow("'+obj.postuser+'")><img src="././images/URIcons/chat-.svg" style="width:20px"></span>'	
			+'<span class="mr20" ><img src="././images/task-bookmark.png" class="imgshowtask"></span>'
			+'<span class="mr20"><img src="././images/task-like.png" class="imgshowtask" ></span>'
			+'<span title="Share" onclick=moreSetting(\''+obj.msgid+'\',false) data-toggle="modal" href="#showContatInfo"><img src="././images/URIcons/share-.svg" style="width:20px"></span>'
			+'<span title="Move" onclick=moreSetting(\''+obj.msgid+'\',true) data-toggle="modal" href="#showContatInfo"><img src="././images/URIcons/move-.svg" style="width:20px"></span>'
			+'<span class="mr20"  onclick=editTaskdetails("'+id+'");><i class="fa fa-pencil" aria-hidden="true"></i></span>'
			+'<span class="mr20" data-toggle="modal" data-target="#deletetaskpopup" ><i class="fa fa-trash-o" aria-hidden="true"></i></span>'
			+'</div>'
			+'</div>'
			+'</div>'
			var completestatus = "";				
			if(obj.iscomplete == true)
				completestatus = "Complete"
			else
				completestatus = "InComplete"
			var Duetime = ""; 
			var Completewhen = ""
			var startTime= ""
			var endTime = "";
			if(obj.starttime != undefined || obj.starttime != "" || obj.starttime != null)
				startTime = convertGMTtoLocal(obj.starttime)

			if(obj.endtime != undefined || obj.endtime != "" || obj.endtime != null)
				endTime = convertGMTtoLocal(obj.endtime)
				  
			 var mID	= obj.msgid.replace("-", ":");	
			 var likemsg_dtask = "likemsg_dtask"+obj.msgid;
			 var dislikemsg_dtask = "dislikemsg_dtask"+obj.msgid;
			 var bookmark_dtask = "bookmark_dtask"+obj.msgid;
			 var unbookmark_dtask = "unbookmark_dtask"+obj.msgid;
			 var pin_dtask = "pin_dtask"+obj.msgid;
			 var unpin_dtask = "unpin_dtask"+obj.msgid;

			var viewtaskcontent = '<div class="row p-2">'+
			//Title sec
			'<div class="col-12 pt-10">'+
			'<div class="row">'+
			'<div class="col-10">'+
			'<h2>'+obj.taskname+'</h2>'+
			'</div>'+
			'<div class="col-2">'+
			'</div>'+
			'</div>'+
			'</div>'+
			//End of Title sec
			//Top icons sec
			'<div class="col-11">'+
			'<div class="row mt-4">'+
			'<div class="col-2">'+
			'<img id= "'+likemsg_dtask+'" src="images/outline-thumb_up.png" class="img-fluid" onclick=setBookmark(\''+obj.msgid+'\',\''+obj.postuser+'\',"like")>'+
			'<img id= "'+dislikemsg_dtask+'"src="images/outline-thumb_up.png" style ="background-color: blue; display:none" class="img-fluid" onclick=setBookmark(\''+obj.msgid+'\',\''+obj.postuser+'\',"dislike")>'+
			'</div>'+
			'<div class="col-2">'+
			'<img id= "'+bookmark_dtask+'" src="images/bookmark.png" class="img-fluid" onclick=setBookmark(\''+mID+'\',true)>'+
			'<img id= "'+unbookmark_dtask+'" src="images/bookmark.png" style ="background-color: blue; display:none" class="img-fluid" onclick=setBookmark(\''+mID+'\',false)>'+
			'</div>'+
			'<div class="col-2">'+
			'<img id= "'+pin_dtask+'" src="images/pin-02.png" class="img-fluid" onclick=setFlagMode(\''+mID+'\',true)>'+
			'<img id= "'+unpin_dtask+'" src="images/pin-02.png" style ="background-color: blue; display:none" class="img-fluid" onclick=setFlagMode(\''+mID+'\',false)>'+
			'</div>'+
			'<div class="col-2">'+
			'<img src="images/outline-share.png" class="img-fluid" onclick=moreSetting(\''+obj.msgid+'\',false) data-toggle="modal" data-target="#tasksharepopup">'+
			'</div>'+
			'<div class="col-2">'+
			'<img src="images/outline-edit.png" class="img-fluid"  onclick=editTaskdetails("'+id+'");>'+
			'</div>'+
			'<div class="col-2 ">'+
			'<img src="images/outline-delete.png" class="img-fluid" onclick=showTaskdeletePopup("'+id+'")>'+
			'</div>'+
			'</div>'+
			'</div>'+
			//ENd of Top icons sec 
			// Assigned sec
			'<div class="col-11 mt-4">'+
			'<h4>Assigned To</h4>'+
			'<h5>'+obj.assignee+'</h5>'+
			'</div>	'+
			// End of Assigned sec
			//Date sec
			'<div class="col-12 mt-4">'+
			'<div class="row">'+
			'<div class="col-4">'+
			'<h4>Start Date</h4>'+
			'<h5>'+startTime+'</h5>'+
			'</div>'+
			'<div class="col-4">'+
			'<h4>Due Date</h4>'+
			'<h5>'+endTime+'</h5>'+
			'</div>'+
			'<div class="col-4">'+
			'<h4>Days</h4>'+
			'<h5>'+obj.totaldays+'</h5>'+
			'</div>'+
			'</div>'+
			'</div>'+
			//End of Date sec
			// Repeat sec
			'<div class="col-12 mt-4">'+
			'<div class="row">'+
			'<div class="col-4">'+
			'<h4>Repeat</h4>'+
			'<h5>'+obj.repeat+'</h5>'+
			'</div>'+
			'<div class="col-4">'+
			'<h4>Complete When</h4>'+
			'<h5>'+obj.completepercentage+'</h5>'+
			'</div>'+
			'</div>'+
			'</div>'+
			// End of Repeat sec
			// Section start
			'<div class="col-12 mt-4">'+
			'<div class="row">'+
			'<div class="col-12">'+
			'<h4>Section</h4>'+
			'<h5>'+obj.sectionname+'</h5>'+
			'</div>'+
			'</div>'+
			'</div>'+
			// End Section start
			//Description sec
			'<div class="col-12 mt-4">'+
			'<div class="row">'+
			'<div class="col-12">'+
			'<h4>Description</h4>'+
			'<h5>'+obj.description+'</h5>'+
			'</div>'+
			'</div>'+
			'</div>'+
			'<div class="modal fade" id="deletetaskpopup" role="dialog">'
			+'<div class="modal-dialog">'
			+'<div class="modal-content">'
			+'<div class="modal-header">'
			+'<button type="button" class="close" data-dismiss="modal">&times;</button>'
			+'<h4 class="modal-title">Delete</h4>'
			+'</div>'
			+'<div class="modal-body">'
			+'<p>Are you sure want to delete?</p>'
			+'</div>'
			+'<div class="modal-footer">'
			+'<button type="button" class="btn btn-default" onclick=showTaskdeletePopup("'+id+'")>Delete</button>'
			+'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
			+'</div>'
			+'</div>'
			'</div>';		
			
			var entry  	= '<form>'
			+'<div class="form-group">'
			+'<label for="email">Status: </label>'
			+'<label>'+completestatus+'</label>'
			+'</div>'
			+'<div class="form-group">'
			+'<label>Complete When: </label>'
			+'<label>'+obj.complete+'</label>'
			+'</div>'
			+'<div class="form-group">'
			+'<label for="pwd">Assignee: </label>'
			+'<label>'+obj.assignee+'</label>'
			+'</div> '
			+'<div class="form-group">'
			+'<label for="pwd">Due: </label>'
			+'<label>'+Duetime+'</label>'
			+'</div' 
			+'<div class="form-group">'
			+'<label for="pwd">Section: </label>'
			+'<label>'+obj.sectionname+'</label>'
			+'</div> '
			+'<div class="form-group">'
			+'<label for="pwd">Conversation: </label>'
			+'<label>'+obj.postusername+'</label>'
			+'</div>'
			+'</form>'
		}
	}
	$("#tsakdetailssec").html(viewtaskcontent);
}

function showTaskdeletePopup(id)
{
	$("#trigger_del_task_btn").trigger('click');
	$("#show_del_task_btn").attr('onClick', 'deleteTaskEvent("'+id+'")')
}



function editTaskdetails(tid)
{
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	temp.tid = tid;
	couchDbGetItem(getTaskdetailsforEdit, dbid);
}

function getTaskdetailsforEdit(returnVal, returnData, inputsParam)
{
	$("#newtaskcreate_btn").trigger('click');
	$("#tsakdetailssec").html("");
	var Existngdata = returnData.taskdetails || [];
	
	if(returnVal != "success")	return;
	for (var i = 0; i < Existngdata.length; i++) 
	{
		var obj = Existngdata[i];
		if ( obj.id == inputsParam.tid) {
		
			$("#editedtaskid").val(obj.id);
			$("#trigger_popupbtn").hide();
			$("#Edit_trigger_popupbtn").show();
		
			var starttimedata 	= obj.starttime;
			starttimedata		= starttimedata.split(" ");
			var endtimedata 	= obj.endtime;
			endtimedata			= endtimedata.split(" ");
			var starttime		= starttimedata[0];
			var endtime 		= endtimedata[0];
			var endtimemin		= endtimedata[1];				
			var Taskname		= $("#taskname_id").val(obj.taskname);
			var Assigneename	= $("#inputassigneeto_name, #more_assignee_name").val(obj.assignee);
			var Duedate			= $("#js-date").val(getFormatforEditEvent(starttime));
			var expandstartdate = $("#expand-js-date").val(starttime);
			var expandenddate 	= $("#expanddue-js-date").val(endtime);
			var EndTime			= $("#time_sec").val(endtimemin);
			var Totaldays		= $("#Total_days").val(obj.totaldays);		
			var sectionname		= $("#Section_id").val(obj.sectionname);
			var Description		= $("#Description").val(obj.description);
			var checkedcomponent= ""

			if(obj.postusername != undefined && obj.postusername != "" && obj.postusername != null)	
			{
				$("#trigger_popupbtn").html("Post to "+obj.postusername);
				$("#Postusername").val(obj.postusername);
				$("#Postuserid").val(obj.postuser);

			}
			if(obj.assigneejid != undefined && obj.assigneejid != "" && obj.assigneejid != null)	
				$("#assignee_user").val(obj.assigneejid);

			document.getElementById('repeat_sec').value =obj.repeat;
			$("input[name=taskcolor]").attr('checked', false);

			if(obj.complete != undefined && obj.complete == null && obj.complete != "")
				$("input[name=completeradio][value=" + obj.complete + "]").attr('checked', 'checked');
			if(obj.color == undefined || obj.color == null || obj.color == "")
				$("input[name=taskcolor][value=purple]").attr('checked', true);
			else
				$("input[name=taskcolor][value=" + obj.color + "]").attr('checked', true);
		}
	}
}	


function getFormatforEditEvent(inputdate)
{
	var monthNames 	= ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov", "Dec"];
	var dayNames 	= ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//	inputdate 		= "Thu Oct 18 2018 00:55:00 GMT+0530"
	//inputdate 		= inputdate.replace(/-/g,'/');
	var date 		= new Date( inputdate );
	var day 		= date.getDate();
	var monthIndex 	= date.getMonth();
	var year 		= date.getFullYear();
	var time 		= formatAMPM(date);
	
	
	
	var month		= monthIndex+1;
	
	if(month <= 9)
		month = "0"+month
	
	 if (window.Debug) console.log("day :: "+day + ":: monthIndex :: "+monthIndex + "date.getHours "+ date.getHours() + "date.getMinutes() "+date.getMinutes());
	
	//2018-11-24 09:00
	//var formatted_date =date.getFullYear()+"-"+month+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes();
	
	var formatted_date = month+"/"+date.getDate()+"/"+date.getFullYear();

	//formatted_date = monthNames[date.getMonth()] + " "+ date.getDate() + ", "+ date.getFullYear() + " "+time;
	//alert(formatted_date);
	return formatted_date;
}


/*
function updateTaskdetails()
{
	var Taskname		= $("#taskname_id").val();
	var Assigneename	= $("#assignee_name").val();
	var Duedate			= $("#js-date").val();
	var expandstartdate = $("#expand-js-date").val();
	var expandenddate 	= $("#expanddue-js-date").val();
	var EndTime			= $("#time_sec").val();
	var Totaldays		= $("#Total_days").val();
	var repeat			= $("#repeat_sec").val();
	var sectionname		= $("#Section_id").val();
	var Description		= $("#Description").val();
	var checkedcomponent= ""
	
	
	if(Taskname == "" || Taskname == undefined || Taskname == null)
	{
		return;	
	}
	
	
	$("#new_task_close_btn").trigger('click');
	
	var starttime =""
	var endtime	  = "";
	if(isMore == true)
	{	
		starttime = expandstartdate;
		endtime	= expandenddate;
		checkedcomponent = $('input[name=rbnNumber]:checked').val(); 
	}
	else
	{
		starttime = Duedate;
		checkedcomponent="";
	}
	

	if(expandstartdate == undefined)
		starttime = "";
	
	if(Duedate == undefined)
		starttime = "";
	
	if(expandenddate == undefined)
		endtime = "";
	
	if(EndTime == undefined || EndTime == "Due Time")
		EndTime = "";
	
	if(Totaldays == undefined)
		Totaldays = "";
	
	if(repeat == undefined)
		repeat = "";
	
	if(sectionname == undefined)
		sectionname = "";

	if(Description == undefined)
		Description = "";
	
	if(starttime != "" && starttime != undefined)
	{	
		starttime 	= Duedate.replace(/-/g,'/')
 		starttime	= new Date(starttime)
		starttime 	= getFormatforEventsdate(starttime);
	}	
	if(endtime != "" && endtime != undefined)
	{	
		endtime 	= expandenddate.replace(/-/g,'/');
		endtime     = endtime+" "+EndTime;
 		endtime		= new Date(endtime);
		endtime 	= getFormatforEventsdate(endtime);		
	}
	
	var PostUser = "";
	var id = generateTaskID();
	
	var dataarray = {taskname : Taskname, starttime:starttime, Endtime: endtime, assignee:Assigneename, endtimesec:EndTime, totaldays:Totaldays, repeat: repeat, sectionname: sectionname, description:Description, postuser: $("#Postuserid").val()};

	if (fs.existsSync(TaskFile)) {
		 if (window.Debug) console.log("File exists..");
		
		fs.readFile(TaskFile, function (err, data) {
			
		 if (window.Debug) console.log("Original data", data);	
		var Existngdata = JSON.parse(data)
		var Delete_Existngtaskdata = JSON.parse(data)
			 if (window.Debug) console.log("Delete Original data", data);	
			
			for (var i = 0; i < Delete_Existngtaskdata.data.length; i++) {
				var obj = Delete_Existngtaskdata.data[i];

				if ( obj.id == id) 
					Delete_Existngtaskdata.data.splice(i, 1);
			}

			 if (window.Debug) console.log('After Deleteing', Delete_Existngtaskdata);
			 if (window.Debug) console.log('Deleteing data Existngdata', JSON.stringify(Delete_Existngtaskdata));
		
			let reg = new Object();
			reg.id 	= id;
			reg.taskname 	= Taskname;
			reg.starttime 	= starttime;
			reg.endtime 	= endtime;
			reg.assignee 	= Assigneename;
			reg.totaldays 	= Totaldays;
			reg.repeat 		= repeat;
			reg.sectionname = sectionname;
			reg.description = Description;
			reg.postuser	= $("#Postuserid").val();
			reg.postusername	= $("#Postusername").val();
			reg.complete	= checkedcomponent;
			reg.iscomplete	= false;
			
		
		 if (window.Debug) console.log('After Deleting', Existngdata);
		
		Existngdata.data.push(reg)

		 if (window.Debug) console.log('After Existngdata', Existngdata);
		 if (window.Debug) console.log('Json data Existngdata', JSON.stringify(Existngdata));
		
		//fs.writeFile(EventsFile, JSON.stringify(json))
		
		fs.writeFile(TaskFile , JSON.stringify(Existngdata), function(err) {
			if(err) {
				return console.log(err);
			}
		});
		
		if(starttime != "" && starttime != undefined)
		{
			if(endtime == undefined || endtime == "")
				endtime = starttime;
			
			
			
			
			addTasklisttocalender(Taskname, starttime, endtime, id);
		}	
		
		if($("#Postuserid").val() == "" || $("#Postuserid").val() == undefined)
			return;
			getTasklist();
			//getDashboardTasklist();
		})
	}
	else
	{
		 if (window.Debug) console.log("File not exists..");
		
		let reg = new Object();
			reg.id 	= id;
			reg.taskname 	= Taskname;
			reg.starttime 	= starttime;
			reg.endtime 	= endtime;
			reg.assignee 	= Assigneename;
			reg.totaldays 	= Totaldays;
			reg.repeat 		= repeat;
			reg.sectionname = sectionname;
			reg.description = Description;
			reg.postuser	= $("#Postuserid").val();
			reg.postusername	= $("#Postusername").val();
			reg.complete	= checkedcomponent;
			reg.iscomplete	= false;
		
		var obj = {data: []};
			obj.data.push(reg);
			
		fs.writeFile(TaskFile , JSON.stringify(obj), function(err) {
			if(err) {
				return console.log(err);
			}
			
			if($("#Postuserid").val() == "" || $("#Postuserid").val() == undefined)
			return;
			jsxc.gui.window.postMessage({
				bid: $("#Postuserid").val(),
				direction: jsxc.Message.OUT,
				msg: Taskname,
				flag: false,
				editedmsg_id : "",
				edited : false,
				quoted : false,
				quoted_id : "",
				quoted_msg : "",
				quoted_timestamp : "",
				isEvent:false,
				eventdetails:"",
				isTask : true,
				taskdetails : dataarray
				
			 });
			 
			 getTasklist();
			// getDashboardTasklist();
			
		});
						
	}
} 
*/

function daysbetweenDates() {
  //Get 1 day in milliseconds
 
  
  var expandstartdate = $("#expand-js-date").val();
	var expandenddate 	= $("#expanddue-js-date").val();
	
	 var date1 = new Date(expandstartdate);
  var date2 = new Date(expandenddate);
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
    
  // Convert back to days and return
  //alert(Math.round(difference_ms/one_day));
  $("#Total_days").val(Math.round(difference_ms/one_day));
  //return Math.round(difference_ms/one_day); 
}

function setCompleteIncomplete(id, e, type)
{
	 if (window.Debug) console.log($(e).is(':checked'));
if (fs.existsSync(TaskFile)) {
	 if (window.Debug) console.log("File exists..");
	
	fs.readFile(TaskFile, function (err, data) {

		var Change_Existngtaskdata = JSON.parse(data)
		 if (window.Debug) console.log("Delete Original data", data);	
		
		for (var i = 0; i < Change_Existngtaskdata.data.length; i++) {
		var obj 		= Change_Existngtaskdata.data[i];
		var matchingID 	= "";
		var existinf_data = "";
		var is100percentage = false;
		if ( obj.id == id) {
			existinf_data = obj;
			if(type == "checkedall")
			{
				existinf_data.iscomplete = true;
			}
			else if(type == "checkedonly")
			{
				existinf_data.iscomplete = $(e).is(':checked');
			}
			else if(type == "complete")
			{
				existinf_data.iscomplete = false;
			}	
			else
			{
				if(type == "100%")
				{
					is100percentage = true
				}
				
 				existinf_data.completepercentage = type;
			}		
		
			
			matchingID = obj.id;
			
		Change_Existngtaskdata.data.splice(i, 1);
		
		if(is100percentage == false)
			Change_Existngtaskdata.data.push(existinf_data);
		
		 fs.writeFile(TaskFile , JSON.stringify(Change_Existngtaskdata), function(err) {
			if(err) {
				return console.log(err);
			}
			getTasklist();
			getDashboardTasklist();
			showTaskDetails(matchingID);
		});
		break;
		}
		}

		 if (window.Debug) console.log('After Deleteing', Change_Existngtaskdata);
		 if (window.Debug) console.log('Deleteing data Existngdata', JSON.stringify(Change_Existngtaskdata));

	})		
}	
}




function receivepostEvent(Name, starttime, endtime, id, userid)
{

	var PostUser = userid;
	var dataarray = {taskid:id, taskname : Name, Starttime:starttime, Endtime: endtime};

//var newdata = { "id": id, "start_date": starttime, "end_date": endtime, "text": Name, "details": "", "jid":user}

if (fs.existsSync(EventsFile)) {
	 if (window.Debug) console.log("File exists..");
	
	fs.readFile(EventsFile, function (err, data) {
		
	 if (window.Debug) console.log("Original data", data);	
    var Existngdata = JSON.parse(data)
	
	
	var Nochange = false;
	for (var i = 0; i < Existngdata.data.length; i++) {
    var obj = Existngdata.data[i];
	
    if ( obj.id == id) {
		
		if(obj.id == id && starttime == obj.start_date && endtime == obj.end_date && Name == obj.text)
			Nochange = true;
		
		PostUser = obj.jid;
        Existngdata.data.splice(i, 1);
    }
}
	
	if(PostUser == "" || PostUser == undefined || PostUser==null)
		return;
	
	let reg = new Object();
		reg.id = id;
		reg.start_date = starttime;
		reg.end_date = endtime;
		reg.text = Name;
		reg.jid = PostUser;
	
	
	Existngdata.data.push(reg)
	
	fs.writeFile(EventsFile , JSON.stringify(Existngdata), function(err) {
		if(err) {
			return console.log(err);
		}
	});
	
	if(Nochange)
	{
		 if (window.Debug) console.log("Nochanges calling");
		var user = $("#postuser").val("");
		return;
	}

	
	})
	
}
else
{
	
	if(PostUser == "" || Name == "" || PostUser == undefined || Name == undefined)
		return;
	
	let reg = new Object();
		reg.id = id;
		reg.start_date = starttime;
		reg.end_date = endtime;
		reg.text = Name;
		reg.jid = PostUser;
	
	 
	//let postdata = JSON.stringify(reg, null, '\t');
	
	
	//var newdata = { "id": id, "start_date": starttime, "end_date": endtime, "text": Name, "details": "", "jid":PostUser}
	var obj = {data: []};
		obj.data.push(reg);
	fs.writeFile(EventsFile , JSON.stringify(obj), function(err) {
		if(err) {
			return console.log(err);
		}
	
	});
					
}


}


function receiveNewTask(Taskname, starttime, endtime, id, PostUser, Assigneename, EndTime, Totaldays, repeat, sectionname, Description, checkedcomponent, postusername)
{
	/* var Taskname		= $("#taskname_id").val();
	var Assigneename	= $("#assignee_name").val();
	var Duedate			= $("#js-date").val();
	var expandstartdate = $("#expand-js-date").val();
	var expandenddate 	= $("#expanddue-js-date").val();
	var EndTime			= $("#time_sec").val();
	var Totaldays		= $("#Total_days").val();
	var repeat			= $("#repeat_sec").val();
	var sectionname		= $("#Section_id").val();
	var Description		= $("#Description").val();
	var checkedcomponent= "";
	 */
	
	if(Taskname == "" || Taskname == undefined || Taskname == null)
	{
		return;	
	}
	

if (fs.existsSync(TaskFile)) {
	 if (window.Debug) console.log("File exists..");
	
	fs.readFile(TaskFile, function (err, data) {
		
	 if (window.Debug) console.log("Original data", data);	
    var Existngdata = JSON.parse(data)
	
		if($("#editedtaskid").val() != "" && $("#editedtaskid").val() != undefined)
		{
			 if (window.Debug) console.log("Original data", data);	
			var Existngdata = JSON.parse(data)

			id = $("#editedtaskid").val()
			var Existngdata = JSON.parse(data)
			 if (window.Debug) console.log("Delete Original data", data);	

			for (var i = 0; i < Existngdata.data.length; i++) 
			{
				var obj = Existngdata.data[i];

				if ( obj.id == id) {
					Existngdata.data.splice(i, 1);
				}
			}
		}	
		let reg = new Object();
		reg.id 	= id;
		reg.taskname 	= Taskname;
		reg.starttime 	= starttime;
		reg.endtime 	= endtime;
		reg.assignee 	= Assigneename;
		reg.totaldays 	= Totaldays;
		reg.repeat 		= repeat;
		reg.sectionname = sectionname;
		reg.description = Description;
		reg.postuser	= PostUser;
		reg.postusername = postusername;
		reg.complete	= checkedcomponent;
		reg.iscomplete	= false;
		
	 if (window.Debug) console.log('After Deleting', Existngdata);
	
	Existngdata.data.push(reg)

	 if (window.Debug) console.log('After Existngdata', Existngdata);
	 if (window.Debug) console.log('Json data Existngdata', JSON.stringify(Existngdata));
	
    //fs.writeFile(EventsFile, JSON.stringify(json))
	
	fs.writeFile(TaskFile , JSON.stringify(Existngdata), function(err) {
		if(err) {
			return console.log(err);
		}
	});
	
	if(starttime != "" && starttime != undefined)
	{
		if(endtime == undefined || endtime == "")
			endtime = starttime;
		
		addTasklisttocalender(Taskname, starttime, endtime, id, postusername);
	}	
	
	if($("#Postuserid").val() == "" || $("#Postuserid").val() == undefined)
		return;
		
		getTasklist();
		//getDashboardTasklist();
	})
}
else
{
		 if (window.Debug) console.log("File not exists..");
		let reg = new Object();
		reg.id 	= id;
		reg.taskname 	= Taskname;
		reg.starttime 	= starttime;
		reg.endtime 	= endtime;
		reg.assignee 	= Assigneename;
		reg.totaldays 	= Totaldays;
		reg.repeat 		= repeat;
		reg.sectionname = sectionname;
		reg.description = Description;
		reg.postuser	= PostUser;
		reg.postusername= postusername;
		reg.complete	= checkedcomponent;
		reg.iscomplete	= false;
		var obj = {data: []};
		obj.data.push(reg);
		
		fs.writeFile(TaskFile , JSON.stringify(obj), function(err) {
			if(err) {
				return console.log(err);
			}	
			if($("#Postuserid").val() == "" || $("#Postuserid").val() == undefined)
				return;
			 $("#Postuserid, #Postusername, #editedtaskid").val("");
			 getTasklist();
			getDashboardTasklist();
		});
}
}

function getDashboardTasklist()
{
	var temp = [];
	var jid = loggeduser.sip_userid;
	if(jid == undefined)
		jid = jsxc.bid.split("@")[0];
	temp.id = "db-"+jid+"_tasks";
	couchDbGetItem(getTasklistfromDBforDashboard, temp);
}

function getTasklistfromDBforDashboard(returnVal, returnData, inputsParam)
{
	 if (window.Debug) console.log("returnVal",returnVal);
	if(returnVal == "success")
	{
		 if (window.Debug) console.log("returnData",returnData);
		var Existngdata = returnData.taskdetails || [];
		var ListofTasks = "";
		var entry_count = 0;
		for (var i = 0; i < Existngdata.length; i++)
		{					
			var obj = Existngdata[i];
			var assignee = obj.assignee || "";
			var starttime = obj.starttime || "";
			var Endtime = obj.endtime || "";
			var totaldays = obj.totaldays || "";
			var sectionname = obj.sectionname || "";
			var postusername = obj.postusername || "";
			var selfJID = loggeduser.sip_userid + '@' + xmpp.domain;
			var assignejid	= obj.assigneejid;
			
			var taskLikeBtn = obj.msgid+"_taskLike";
			var taskUnLikeBtn = obj.msgid+"_taskUnLike";
			var taskBookmarkBtn = obj.msgid+"_taskBookmark";
			var taskUnBookmarkBtn = obj.msgid+"_taskUnBookmark";
			var taskPinBtn = obj.msgid+"_taskPin";
			var taskUnPinBtn = obj.msgid+"_taskUnpin";

			var deletetaskpopup = obj.id+"_deletetaskpopup";
			var deletetarget = "#"+deletetaskpopup;
			var showContatInfo	= obj.id+"_showContatInfo";
			var showContattarget	= "#"+showContatInfo;
			var msgid = obj.msgid.replace("-", ":");	
			var data = localStorage.getItem("jsxc:"+loggeduser.sip_userid+jidSuffix+":msg:"+msgid+"");
			if(data == null)	continue;
			data = JSON.parse(data);
			var checkedbox = "chkbox_"+obj.id;
			if(starttime !=""  && starttime != undefined)	starttime = convertTimeTasklistFormat(starttime)
				
			var Time = ""
			if(Endtime !=""  && Endtime != undefined)
			{	
				Endtime = convertTimeTasklistFormat(Endtime)
				var formattime = new Date( Endtime)
				Time    = formatAMPM(formattime);
			}
			var entry1 ="";
			var b_msgID	= obj.msgid.replace("-", ":");
			
			ListofTasks += '<tr>';
			ListofTasks += '<td><p><label class="containe"><b>'+obj.taskname+'</b><input type="checkbox"><span class="checkmark"></span></p></label></td>';
			ListofTasks += '<td><p>'+assignee+'</p></td>';
			ListofTasks += '<td><p>'+Endtime+'</p></td>';
			ListofTasks += '<td><p>'+sectionname+'</p></td>';
			ListofTasks += '<td><p>'+postusername+'</p></td>';
			ListofTasks += '<td class="droppers"><div class="dropdown"><span class="icon-edit dropdown-toggle rets" data-toggle="dropdown"></span>';
			ListofTasks += '<ul class="dropdown-menu">';
			var likeCheck = checkSelfLike(obj.msgid, jsxc.bid);
			if(likeCheck)
				ListofTasks += '<li><a href="#" onclick=likemessage("'+obj.msgid+'","'+obj.postuser+'","dislike")><span class="icon-thump_up"></span> Like</a></li>';
			else
				ListofTasks += '<li><a href="#" onclick=likemessage("'+obj.msgid+'","'+obj.postuser+'","like")><span class="icon-thump_up"></span> Like</a></li>';
			if(!data.bookmark)	
				ListofTasks += '<li><a href="#" onclick=setBookmark("'+b_msgID+'",true)><span class="icon-Bookmark"></span> Bookmark</a></li>';
			else
				ListofTasks += '<li><a href="#" onclick=setBookmark("'+b_msgID+'",false)><span class="icon-Bookmark"></span> Bookmark</a></li>';
			if(!data.flag)
				ListofTasks += '<li><a href="#" onclick=setFlagMode("'+b_msgID+'",true)><span class="icon-Pin"></span> Pin</a></li>';
			else
				ListofTasks += '<li><a href="#"  onclick=setFlagMode("'+b_msgID+'",false)><span class="icon-Pin"></span> Pin</a></li>';
			ListofTasks += '<li><a href="#" onclick="moreSetting("'+obj.msgid+'",false)"><span class="icon-Share"></span> Share</a></li>';
			ListofTasks += '<li><a href="'+showContattarget+'" onclick="editTaskdetails("'+obj.id+'")"><span class="icon-edit"></span> Edit</a></li>';
			ListofTasks += '<li><a href="#"	onclick=deleteTaskEvent("'+obj.id+'")><span class="icon-Delete-2"></span> Delete</a></li>';
			ListofTasks += '</ul>';
			ListofTasks += '</div></td></tr>';
			
			
			//var tRow = '<tr><td><p><label class="containe"><b>Update the client call details</b><input type="checkbox"><span class="checkmark"></span></p></label></td><td><p>ronnie_diaz@gmail.com</p></td><td><p>12.06.19</p></td><td><p>Sample</p></td><td><p>maria_jazz@gmail.com</p></td><td class="droppers"><div class="dropdown"><span class="icon-edit dropdown-toggle rets" data-toggle="dropdown"></span><ul class="dropdown-menu"><li><a href="#"><span class="icon-thump_up"></span> Like</a></li><li><a href="#"><span class="icon-Bookmark"></span> Bookmark</a></li><li><a href="#"><span class="icon-Pin"></span> Pin</a></li><li><a href="#"><span class="icon-Share"></span> Share</a></li><li><a href="#"><span class="icon-edit"></span> Edit</a></li><li><a href="#"><span class="icon-Delete-2"></span> Delete</a></li></ul></div></td></tr>';

			/*
			var entry  	= "<tr>"
			if( obj.iscomplete == true)
			{
				entry +="<td class=\"highlight\">"			
				entry +="<div class=\"custom-control custom-checkbox \">"			
				entry +="<input type=\"checkbox\" class=\"custom-control-input\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'complete')\" checked><label class=\"custom-control-label\">"+obj.taskname+"</label>"
				entry +="</div>"
				entry +=" </td>"
			}
			else
			{
				if(obj.complete == "checkedall")
				{
					entry +="<td class=\"highlight\">"
					entry +="<div class=\"dropdown\">"
					entry +="<span type=\"button\" class=\"btn btn-secondary dropdown-toggle\" id=\"tasktooltip\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">0/1</span>"
					entry +="<div class=\"dropdown-menu\" aria-labelledby=\"tasktooltip\">"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'checkedall')\" >"+postusername+"</a>"
					entry +="</div>"
					entry +="</div>"
					entry +="</td>"
				}
				else if(obj.complete == "100%")
				{
					entry +="<td class=\"highlight\">"
					entry +="<div class=\"dropdown\">"
					entry +="<span type=\"button\" class=\"btn btn-secondary dropdown-toggle\" id=\"tasktooltip\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\" >"+obj.completepercentage+"</span>"
					entry +="<div class=\"dropdown-menu\" aria-labelledby=\"tasktooltip\">"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'0%')\" >0%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'10%')\" >10%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'20%')\" >20%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'30%')\" >30%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'40%')\" >40%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'50%')\" >50%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'60%')\" >60%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'70%')\" >70%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'80%')\" >80%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'90%')\" >90%</a>"
					entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'100%')\" >100%</a>"	
					entry +="</div>"
					entry +="</div>"
					entry +="</td>"
				}
				else
				{
					entry +="<td class=\"highlight\">"
					entry +="<div class=\"custom-control custom-checkbox \">"
					
					entry +="<input type=\"checkbox\" class=\"custom-control-input\"  onclick=\"setCompleteIncomplete('"+obj.id+"',this,'checkedonly')\"><label class=\"custom-control-label\">"+obj.taskname+"</label>"
					entry +="</div>"
					entry +=" </td>"
				}			
			}
			entry +="<td class=\"highlight\">"+assignee+"</td>"
			//if(checkstart)
			//entry +="<td class=\"highlight\">"+starttime+"</td>"
			//if(checkdue)
			entry +="<td class=\"highlight\">"+Endtime+"</td>"
			//if(checkduetime)
			//entry +="<td class=\"highlight\">"+Time+"</td>"
			//if(checkdays)
			//entry +="<td class=\"highlight\">"+totaldays+"</td>"
			//if(checksection)
			entry +="<td class=\"highlight\">"+sectionname+"</td>"
			//if(checkconversation)
			entry +="<td class=\"highlight\">"+postusername+"</td>"
			entry +="<td><a href=\"#\" onclick=\"editTaskdetails('"+obj.id+"')\";><img src=\"icons/edit-s.png\"></a></td>"

			entry1 +="<td><a class=\"dropdown-toggle\" data-toggle=\"dropdown\">"

			entry1 +="<img src=\"images/icons/elip_h-s.png\" alt=\"\"></a>"

			entry1 +="<div class=\"dropdown-menu\">"
			//if(data.likelist.length == 0)
			entry1 +="<a id='" + taskLikeBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"likemessage('"+obj.msgid+"','"+obj.postuser+"','like')\"><img src=\"images/icons/thumb-s.png\" alt=\"\"> Like</a>"
			//else
			entry1 +="<a id='" + taskLikeBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"likemessage('"+obj.msgid+"','"+obj.postuser+"','dislike')\"><img src=\"images/icons/thumb-s.png\" alt=\"\"> Dislike</a>"

			//if(!data.bookmark)	
			entry1 +="<a id='" + taskBookmarkBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setBookmark('"+b_msgID+"',true)\"><img src=\"images/icons/bookmark-s.png\" alt=\"\">Bookmark</a>"
			//else
			entry1 +="<a id='" + taskBookmarkBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setBookmark('"+b_msgID+"',false)\"><img src=\"images/icons/bookmark-s.png\" alt=\"\">UnBookmark</a>"

			//if(!data.flag)	
			entry1 +="<a id='" + taskPinBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setFlagMode('"+b_msgID+"',true)\"><img src=\"images/icons/pin-s.png\" alt=\"\">Pin</a>"
			//else
			entry1 +="<a id='" + taskPinBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setFlagMode('"+b_msgID+"',false)\"><img src=\"images/icons/pin-s.png\" alt=\"\">UnPin</a>"

			entry1 +="<a class=\"dropdown-item\" onclick=\"moreSetting('"+obj.msgid+"',false)\" data-toggle=\"modal\" href='"+showContattarget+"'><img src=\"images/icons/share-s.png\" alt=\"\">Share</a>"
			entry1 +="<a class=\"dropdown-item\" href=\"#\" onclick=\"editTaskdetails('"+obj.id+"')\";><img src=\"images/icons/edit-s.png\" alt=\"\">Edit</a>"
			entry1 +="<a class=\"dropdown-item\" data-toggle=\"modal\" data-target='"+deletetarget+"'><img src=\"images/icons/delete-s.png\" alt=\"\">Delete</a>"
				
			entry1 +="<div class=\"arrow\" style=\"left: 50%;\"></div>"
			entry1 +="</div>"
				
			entry +="</td>"
			entry +="</tr>"
			ListofTasks += entry;
			*/
			
			entry_count++;
		}
		$('.DashTasksTable  > tbody > tr').empty();
		
		if(entry_count == 0)	$(".DashTasksTable").append("<p style=\"text-align:center; font-size:18px; position: relative;right: -100%;\">No Tasks available</p>");
		else	$(".DashTasksTable").append(ListofTasks);
	}
	else	
	{
		$('.DashTasksTable  > tbody > tr').empty();
		$(".DashTasksTable").append("<p style=\"text-align:center; font-size:18px\">No Tasks available</p>");
	}
	//var dashboardClass = document.getElementsByClassName('dashboard');
	//if (dashboardClass.length > 0)	$(".jsxc_windowItem").remove();
	
	taskDropdownUsers();
}

function getRecentMensions()
{
	$('#recentActicity li').remove();
	
	//var key = "jsxc:"+jsxc.bid+":recentmentions";
	//console.log("key is",key);
	var bid = jsxc.bid || loggeduser.sip_userid+jidSuffix;
	var q1 = localStorage.getItem("jsxc:"+bid+":recentmentions");
	q1 = JSON.parse(q1);
	//var q1 = jsxc.storage.getUserItem('recentmentions');
	var quotedata = "";
	$.each(q1, function (index, item) {	
		var msgid = item.replace("-", ":");
		//var data = jsxc.storage.getUserItem('msg', msgid);	jsxc:1660@im01.unifiedring.co.uk:msg:1570634709093:msg
		var data = localStorage.getItem("jsxc:"+bid+":msg:"+msgid);	
	 	if(data == undefined || data == null || data== "")
			return;	
		data = JSON.parse(data);
		var msg = data.msg;
		var quotemsg_data = data.quoted_msg;
		//var isquotedmsg_id = data.quoted_id;
		//var uid = isquotedmsg_id.replace("-", ":");
		//var quotemsgdata = jsxc.storage.getUserItem('msg', uid);
		//var user_bid = quotemsgdata.bid;
		//var buddy_data = jsxc.storage.getUserItem('buddy', user_bid);
		//var quotemsgname = buddy_data.name;
		//var recentmsgid = item+"-recentmsg";	
		
		
		
	/*	var quotemessage = '<ul class="call_content_list row" >'+
		'<li class="col-8">'+
		'<div class="call_cont1">'+
		'<img src="images/icons/user.png" alt="">'+
		'<h3 class="name">'+quotemsgname+'</h3>'+
		'<p><span>'+quotemsg_data+' </span>'+msg+'</p>'+
		'</div>'+
			'</div></div>'+
		'</li>'+
		'<li class="col-4">'+
		'<ul class="call_iconlist">'+
		'<li><a><img src="icons/thumb-s.png"></a></li>'+
		'<li><a><img src="icons/bookmark-s.png"></a></li>'+
		'<li><a><img src="icons/pin-s.png"></a></li>'+
		'<li class="dots-icons"><a><img src="icons/elip_h-s.png"></a></li>'+
		'</ul>'+
		'<div class="flex-container"><div class="flex-boxl">'+
		'<div class="dt">'+jsxc.getFormattedTime(data.stamp)+'</div>'+
		'</li>'+
		'</div></div>'+
		'</ul>'
		quotedata+=quotemessage;*/
		
		//{"_uid":"1570634709093:msg","_received":false,"encrypted":false,"forwarded":false,"stamp":1570634709093,"type":"plain","bid":"1660@im01.unifiedring.co.uk","direction":"out","msg":"ghju","flag":false,"editedmsg_id":"","edited":false,"quoted":true,"quoted_id":"1570634693101-msg","quoted_msg":"sdf","quoted_timestamp":"8:54:53 PM","htmlMsg":"ghju","likelist":[]}
		
		var selfName = loggeduser.username;
		var temp = localStorage.getItem("jsxc:"+bid+":buddy:"+data.bid);
		if(temp == undefined || temp == null || temp== "")
			return;	
		temp = JSON.parse(temp);
		if(data.direction =="out")
		{
			quotedata += '<li><div class="ad-name-images"><h3>'+selfName+' in <b>'+temp.name+'</b><br><span><b>'+quotemsg_data+'</b></span></h3></div><div class="ad-name-icons">'+jsxc.getFormattedTime(data.stamp)+'</div></li>';
		}
		else
		{
			quotedata += '<li><div class="ad-name-images"><h3>'+temp.name+' in <b>'+selfName+'</b><br><span><b>'+quotemsg_data+'</b></span></h3></div><div class="ad-name-icons">'+jsxc.getFormattedTime(data.stamp)+'</div></li>';
		}
	})
	if(quotedata == "")
		quotedata	=	"<div>No Data Found</div>";
	$("#recentActicity").append(quotedata);
}

  
function highlightdiv(id)
{
	var msgid = id.replace(":","-");
	setTimeout(function(){
		$('#'+msgid).css('background-color', '#e5f5fc');
	},5000);
		$('#'+msgid).css('background-color', '#a6d7ec');
}

function checkfavorite(id)
{
	if(id.search("@conference") < 0)
	{
		var data = GetContactDetails(id.split("@")[0]);
		if(data.is_favourite == 1)
		{
			$('.checkSdefault').css({display: 'inline-block',position: 'absolute', left: '2px'});
			$('.name_fav_icon').show();
			return;
		}
		else
		{
			$('.checkSdefault').css("display","none");
			$('.name_fav_icon').hide();
		}
	}
}

function checkmutenotice(bid)
{
	if(bid.search("@conference") < 0)
	{
		var data = GetContactDetails(bid.split("@")[0]);
		if(data.is_muted == 1)
		{
			$('.checkmutenotify').css({display: 'inline-block',position: 'absolute', left: '2px'});
			$('.name_muteall_icon').show();
		}
		else
		{
			$('.checkmutenotify').css("display","none");
			$('.name_muteall_icon').hide();
		}
	}
}

function msgSetMuteConv()
{
	//$('.checkmutenotify').css("display","none");
	var contact = window.LastChatWindow;
	var data = GetContactDetails(contact.split("@")[0]);
	var status = 0;
	if(data.is_muted == 1)
	{
		status = 0;
		//$('.name_fav_icon').hide();
	}
	else
	{
		status = 1;
		//$('.name_fav_icon').show();
	}
	for(var i=0; i<contacsarray.length; i++)
	{
		if(contacsarray[i].sip_login_id == (contact.split("@")[0]))
		{
			var weburl = ApiServerURL + "v1/user/XXAccesstokenXX/Urmaappmuteblockcontactsave";
			 if (window.Debug) console.log("loggeduser.user_id",loggeduser.user_id);
			var url = '/apiCalling?Stype=setMute&dir_user_id='+loggeduser.dir_user_id+'&company_id='+loggeduser.company_id+'&mobileno='+data.ext+'&status='+status+'&type=1&linkUrl='+weburl+'';
			$.get(url, function(response) {
				if(response.errcode == 0)
					contacsarray[i].is_muted = status;
			});
			return;
		}
	}
}

function checkSoundnotice(bid)
{
	$('.checksounddef').css("display","none");
	$('.checksoundping').css("display","none");
	$('.checksoundair').css("display","none");
	
	if(bid == undefined)
		bid = window.LastChatWindow;
	bid = bid.split("/")[0];
	var data = jsxc.storage.getUserItem('buddy', bid) || {};
	if(data.msgsound){
		if(data.msgsound == "Default")
			$('.checksounddef').css({display: 'inline-block',position: 'absolute', left: '2px'});
		else if(data.msgsound == "Ping")
			$('.checksoundping').css({display: 'inline-block',position: 'absolute', left: '2px'});
		else if(data.msgsound == "Air")
			$('.checksoundair').css({display: 'inline-block',position: 'absolute', left: '2px'});
	}
	else
		$('.checksounddef').css({display: 'inline-block',position: 'absolute', left: '2px'});
}

function msgSetsoundConv(sound, bid)
{	
	if(bid == undefined)
		bid = window.LastChatWindow;
	
	if( (bid == null) || (bid == undefined))
	{
		waringAlert("warning", "Something Went Wrong");
		return;
	}
	bid = bid.split("/")[0];
	var data = jsxc.storage.getUserItem('buddy', bid) || {};
	data.msgsound = sound;
	jsxc.storage.setUserItem('buddy', bid, data);
}

function checkDesknotice(bid)
{
	var userslist = localStorage.getItem('jsxc:' + jsxc.bid + ':desktopnotifyusers') || []; 
	if(userslist.length == 0)
		$('.checkdesknotify').css("display","none");
	else
	{
		userslist = JSON.parse(userslist)
		for( var i = 0; i < userslist.length; i++)
		{ 
			if ( userslist[i] === bid)
				$('.checkdesknotify').css({display: 'inline-block',position: 'absolute', left: '2px'});
		}
	}
}

function msgSetDesktopConv(item)
{
	if(item == undefined)
		item = window.LastChatWindow;
	
	var userslist = jsxc.storage.getUserItem('desktopnotifyusers');
	if(userslist == null || userslist == undefined || userslist == "")
	 {
		 userslist = [];
	 }
	if(userslist.lenght==0 ||  userslist.indexOf(item) < 0)
	{
		//$('.checkdesknotify').css({display: 'inline-block',position: 'absolute', left: '2px'});
		userslist.push(item);
		//$("#"+item.split('@')[0]+"_contactsec").find('.desknotify_icon').show();
		jsxc.storage.setUserItem('desktopnotifyusers', JSON.stringify(userslist));
	}	
	else
	{
		for( var i = 0; i < userslist.length; i++)
		{ 
			if ( userslist[i] === item) {
				userslist.splice(i, 1); 
				//$('.checkdesknotify').css("display","none");
			}
		}
		//$("#"+item.split('@')[0]+"_contactsec").find('.desknotify_icon').hide();
		jsxc.storage.setUserItem('desktopnotifyusers', JSON.stringify(userslist));
	}
}
function aboutapp()
{
	$('.aboutAppinfo').empty();
	var mainDiv = '<div class="version">Version: v0.0.1</div>\n'+
	'<div class="copyrigth">Copyright@ 2019 UnifiedRing, Inc.</div>\n'+
	'<div class="abtBtn"><button type="button" class="btn abtok" data-dismiss="modal">Ok</button></div>';
	$('.aboutAppinfo').append(mainDiv);
}
function openBrowserWin(url)
{
	window.open(url);
}
function removeUnwantedDiv()
{
	$('.linkview').remove();
	$('.notesview').remove();
	$('.searchview').remove();
	$('.fileview').remove();
	$('.dowanloadapp').remove();
	$('.administrationView').remove();
	noteclose();
}

/*function downloadapp()
{
	$('.dowanloadapp').remove();
	$("#clientview").empty();
	window.LastChatWindow = undefined;
	$(".chatArea").prepend("<div class=dowanloadapp></div>");
	var mainDiv ='<h2><center>Unified Ring EveryWhere</center></h2>';
	
	mainDiv += '<div class="row">';
	mainDiv += '<div class="col-md-6 text-center">';
	mainDiv += '<a class="btn btn-default appstoreDiv" href="#">App Store</a>';
	mainDiv += '<a class="btn btn-default googlestoreDiv" href="#">Google Play</a>';
	mainDiv += '</div>';
	mainDiv += '<div class="col-md-6 text-center">';
	
	mainDiv += '<a class="btn btn-default desktopapp" href="http://192.168.14.20/unfiedcomdesktop/assets/Unified%20Ring%20Setup%200.0.52.exe">Download Now</a>';
	mainDiv += '</div>';
	mainDiv += '</div>';
	
	$('.dowanloadapp').append(mainDiv);
	
	$('.appstoreDiv').click(function()
	{
		openBrowserWin('https://itunes.apple.com/us/app/unifiedring/id1316536909?mt=8');
	});
	
	$('.googlestoreDiv').click(function()
	{
		openBrowserWin('https://play.google.com/store/search?q=unifiedring&c=apps&hl=en');
	});
}
*/
function loadEventsForSlide()
{
	var bid 	= 	window.LastChatWindow;
	var temp 	= 	[];
	temp.bid 	= 	bid;
	temp.id 	= 	"db-"+(jsxc.bid).split("@")[0]+"_events";
	couchDbGetItem(loadEventsForSlide_res, temp);
}

function loadEventsForSlide_res(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{	
		var temp 	= 	returnData.taskdetails || [];
		for(var i = 0; i<temp.length; i++)
		{	
			if(inputsParam.bid == temp[i].jid)
			{
				if(!temp[i].msgid)	continue;
				var msg 	= 	jsxc.storage.getUserItem('msg', (temp[i].msgid).replace("-",":"));
				console.log("msg",msg);
				if(msg == null)	continue;
				
				var sentTime = jsxc.getFormattedTime(msg.stamp)
				var Scheduletime = convertGMTtoLocal(msg.eventdetails.Starttime)+" - "+convertGMTtoLocal(msg.eventdetails.Endtime);
				
				var temp = 	'<h5><span class="icon-Calendar-date"></span>'+msg.msg+'</h5>\n'+
							'<p>'+Scheduletime+'<span>'+sentTime+'</span></p>\n'+
							'<hr>\n';
				$("#EventListSt").append(temp);
			}
		}
	}
}

function loadTasksForSlide()
{
	var bid = window.LastChatWindow;
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	temp.bid = bid;
	couchDbGetItem(loadTasksForSlide_res, temp);
}

function loadTasksForSlide_res(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{	
		var temp 	= 	returnData.taskdetails || [];
		for(var i = 0; i<temp.length; i++)
		{	
			if(inputsParam.bid == temp[i].postuser)
			{
				var msg 	= 	jsxc.storage.getUserItem('msg', (temp[i].msgid).replace("-",":"));
				if(msg == null)	continue;
				
				var temp = '<div class="tasks">\n'+
							'<label class="containe">'+temp[i].taskname+'<input type="checkbox"><span class="checkmark"></span></label>\n'+
							'<p>'+temp[i].postusername+'</p>\n'+
							'</div>\n';
				$("#TaskListSt").append(temp);
			}
		}
	}
}
				
function loadNotesForSlide()
{
	var bid = window.LastChatWindow;
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"notes";
	temp.bid = bid;
	couchDbGetItem(loadNotesForSlide_res, temp);
}

function loadNotesForSlide_res(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{	
		var temp 	= 	returnData.MyData || [];
		for(var i = 0; i<temp.length; i++)
		{
			if(inputsParam.bid == temp[i].bid)
			{
				var msg 	= 	jsxc.storage.getUserItem('msg', temp[i].msgid);
				if(msg == null)	continue;
				var temp 	=	'<div id="collapse4" class="panel-collapse collapse in" aria-expanded="true">\n'+
								'<div class="panel-body">\n'+
								'<h5><span class="icon-Calendar-date"></span> Note 1</h5>\n'+
								'<p>Author: '+temp[i].name+'</p>\n'+
								'</div>\n'+
								'</div>\n';
				$("#notesListSt").append(temp);
			}
		}
	}
}

function loadFilesForSlide()
{
	var bid = window.LastChatWindow;
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_files";
	temp.bid = bid;
	couchDbGetItem(loadFilesForSlide_Res, temp);
}

function loadFilesForSlide_Res(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{	
		var temp 	= 	returnData.data || [];
		for(var i = 0; i<temp.length; i++)
		{
			if(inputsParam.bid == temp[i].bid)
			{
				var msg 	= 	jsxc.storage.getUserItem('msg', temp[i].msid);
				if(msg == null)	continue;
				
				var url 	=	"";
				if(msg.direction == "in")	url 	= 	msg.attachment.data;
				else url 	=	msg.msg
				var temp 	= 	'<div id="collapse5" class="panel-collapse collapse in">\n'+
								'<div class="panel-body">\n'+								
								'<h5><span onclick=manualDownload("'+temp[i].name+'","'+url+'") class="icon-Download"></span>'+temp[i].name+'</h5>\n'+	
								'</div>\n'+
								'</div>\n';
				$("#filesListSt").append(temp);
			}
		}
	}
}

function manualDownload(fileName, url)
{
	var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function(){
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(this.response);
        var tag = document.createElement('a');
        tag.href = imageUrl;
        tag.download = fileName;
        document.body.appendChild(tag);
        tag.click();
        document.body.removeChild(tag);
    }
    xhr.send();
}

function keyboardDetail()
{
	var mainDiv = '<div class="row keyboardsht">\n'+
	'<div class=" col-md-6">\n'+
	'<div class="col-md-12"><h3>Conversations</h3></div>\n'+

	'<div class=" col-md-7">Previous:</div>\n'+
	'<div class=" col-md-5 fnt">Alt ?</div>\n'+

	'<div class=" col-md-7">Next:</div>\n'+
	'<div class=" col-md-5">Alt ?</div>\n'+

	'<div class=" col-md-7">Previous unread:</div>\n'+
	'<div class=" col-md-5">Alt ? ?</div>\n'+

	'<div class=" col-md-7">Next unread:</div>\n'+
	'<div class=" col-md-5">Alt ? ?</div>\n'+

	'<div class=" col-md-7">Mark all as read:</div>\n'+
	'<div class=" col-md-5">Alt Ctrl ? ESC</div>\n'+

	'<div class=" col-md-7">Select Conversation:</div>\n'+
	'<div class=" col-md-5">Ctrl K</div>\n'+

	'<div class=" col-md-7">Show/Hide Shelf:</div>\n'+
	'<div class=" col-md-5">Alt S</div>\n'+

	'</div>\n'+

	'<div class=" col-md-6" style="min-height: 272px;">\n'+
	'<div class="col-md-12"><h3>Message Composition</h3></div>\n'+

	'<div class=" col-md-6">New line in chat:</div>\n'+
	'<div class=" col-md-6">? Enter</div>\n'+

	'<div class=" col-md-6">Dismiss Dialogs:</div>\n'+
	'<div class=" col-md-6">ESC</div>\n'+

	'<div class=" col-md-6">Emoji (smileys):</div>\n'+
	'<div class=" col-md-6">:thumbsup:</div>\n'+

	'<div class=" col-md-6">@Mention</div>\n'+
	'<div class=" col-md-6">@ [a-z]</div>\n'+

	'<div class=" col-md-7">Edit last message:</div>\n'+
	'<div class=" col-md-5">?</div>\n'+

	'</div>\n'+

	'<div class=" col-md-6">\n'+
	'<div class="col-md-12"><h3>Message Creation</h3></div>\n'+

	'<div class=" col-md-6">Start Video Call:</div>\n'+
	'<div class=" col-md-6">Alt V</div>\n'+

	'<div class=" col-md-6">New Event:</div>\n'+
	'<div class=" col-md-6">Alt E</div>\n'+

	'<div class=" col-md-6">New Task:</div>\n'+
	'<div class=" col-md-6">Alt T</div>\n'+

	'<div class=" col-md-6">New Note:</div>\n'+
	'<div class=" col-md-6">Alt N</div>\n'+

	'<div class=" col-md-6">New Snippet:</div>\n'+
	'<div class=" col-md-6">Alt S</div>\n'+

	'<div class=" col-md-6">Upload File:</div>\n'+
	'<div class=" col-md-6">Alt F</div>\n'+

	'</div>\n'+

	'<div class=" col-md-6">\n'+
	'<div class="col-md-12"><h3>Message Selection</h3></div>\n'+

	'<div class=" col-md-8">Select message:</div>\n'+
	'<div class=" col-md-4">? Click</div>\n'+

	'<div class=" col-md-8">Deselect all messages:</div>\n'+
	'<div class=" col-md-4">Click</div>\n'+

	'</div>\n'+

	'</div>';
		
	$('.keyboardshortcut').append(mainDiv);	
}

function postmail(item)
{
	var Email = $('.CpostMail').find('span').text();
	openBrowserWin('mailto:'+Email+'?');
}

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function createattachmodual(mode, result, uid)
{
	$('.slidesection').find('.box').css("display","block");
	$('.slidesection').find('.slide-toggle').addClass('rotate');
	$('.attachdetail').empty();
	$('.loaddetail').hide();
	$('.box-inner').empty().append('<div class="attachdetail"></div>');
	
	var likeCheck = checkSelfLike(uid, jsxc.bid);
	var bookmark = result.bookmark;
	var pinned = result.flag;
	var id = uid.replace("-",":");
	
	var mainDiv = "";
	if(mode =="link") {
		var title = result.urlTitle;
		if(title == "undefined")
			title = result.msg;
		mainDiv = '<p><b>'+title+'</b></p>';
	}
	else
		mainDiv = '<p><b>'+result.attachment.name+'</b></p>';
	
	var data = jsxc.storage.getUserItem('buddy', result.bid) || [];
	var login = localStorage.getItem('login') || [];
	var name ='unknow';
	var selfName = 'unknow';
	
	var selfimg = '';
	storage.get(_candidate + '_photo_settings', function(error, data) {
		if (error) {
			throw error;
			return;
		}
		selfimg = data.photo_info;
	});
	
	if(login.length !=0) {
		login = JSON.parse(login);
		selfName = login.username;
	}
	if(data.length !=0)
		name = data.name;
	
	mainDiv += '<ul class=fileattchdiv>\n';
	if(mode =="attachment") 
		mainDiv += '<li title="Download" class="attachDownloadImg"><a href="'+result.msg+'" download="'+result.attachment.name+'"><img src="././images/URIcons/downloadPng-.png"></a></li>';
		
		
	mainDiv += '<li class="attachMsgImg" id='+uid.replace("-msg","-attchmsg")+' title="View the conversation where this was first posted"><img src="././images/URIcons/chat-.svg"></li>';
	
	if(likeCheck)
		mainDiv += '<li class="attachLikeImg" id='+uid.replace("-msg","-attchLike")+' title="UnLike"><img src="././images/URIcons/like-.svg"></li>';
	else
		mainDiv += '<li class="attachLikeImg" id='+uid.replace("-msg","-attchLike")+' title="Like"><img src="././images/URIcons/like-.svg"></li>';
	
	if(bookmark)
		mainDiv += '<li class="attachBookImg" title='+JSON.stringify("Remove Bookmark")+' id='+uid.replace("-msg","-attchBook")+' onClick="setBookmark(\''+id+'\',false);"><img src="././images/URIcons/bookmark-.svg"></li>';
	else
		mainDiv += '<li class="attachBookImg" title="Bookmark" id='+uid.replace("-msg","-attchBook")+' onClick="setBookmark(\''+id+'\',true);"><img src="././images/URIcons/bookmark-.svg"></li>';

	if(pinned)
		mainDiv += '<li id='+uid.replace("-msg","-attchPin")+' title="UnPin" onClick="setFlagMode(\''+id+'\',false);"><img src="././images/URIcons/pin-.svg"></li>';
	else
		mainDiv += '<li id='+uid.replace("-msg","-attchPin")+' title="Pin" onClick="setFlagMode(\''+id+'\',true);"><img src="././images/URIcons/pin-.svg"></li>';
	
	mainDiv += 
	'<li title="Share" onclick=moreSetting(\''+uid+'\',false) data-toggle="modal" href="#showContatInfo"><img src="././images/URIcons/share-.svg"></li>'+
	'<li title="Move" onclick=moreSetting(\''+uid+'\',true) data-toggle="modal" href="#showContatInfo"><img src="././images/URIcons/move-.svg"></li>'+
	'<li class="attachEditImg" title="Edit" id='+uid.replace("-msg","-attchEdit")+' onClick="editFilename(\''+uid+'\');"><img src="././images/URIcons/edit-.svg"></li>'+
	'<li title="Delete" onClick="removeMessage(\''+uid+'\');"><img src="././images/URIcons/delete-.svg"></li>'+
	'</ul>'+addparticipabtHTML;
	
	if(mode =="attachment") 
		mainDiv += '<div class="size_para"><b>Size</b> '+result.attachment.size+'</div>';
	else
		mainDiv += '<div class="size_para"><b>Url</b> '+result.msg+'</div>';
	
	mainDiv += '<div class="size_para"><b>CONVERSATION</b> '+name+'</div>';
	
	
	if(result.direction =='in'){
		var img = '';
		var exten = localStorage.getItem('jsxc:' + jsxc.bid + ':buddy:' + result.bid);
		exten = JSON.parse(exten);
		if(exten.avatar)
			img = localStorage.getItem('jsxc:' + jsxc.bid + ':avatar:' + exten.avatar);

		if(img != '')	
			mainDiv +=' <div class="jsxc_avatar  rightsidesec" style="background: url('+img+')"></div>';
		else
			mainDiv +=' <div class="avatar-generated  avatar-color-2">'+name.substring(1,0)+'</div>';
		
		if(mode =="attachment")
			mainDiv += '<span class="name">'+ name + ' </span> Uploaded</div>';
		else
			mainDiv += '<span class="name">'+ name + ' </span> Posted the link</div>';
	}
	else {
		if(selfimg != '')
			mainDiv +=' <div class="jsxc_avatar  rightsidesec" style="background: url('+selfimg+')"></div>';
		else
			mainDiv +=' <div class="avatar-generated  avatar-color-2">'+selfName.substring(1,0)+'</div>';
		
		if(mode =="attachment")
			mainDiv += '<span class="name">'+ selfName + '</span> Uploaded</div>';
		else
			mainDiv += '<span class="name">'+ selfName + '</span> Posted the link</div>';
	}
	
	if(mode =="attachment")
		mainDiv +='<a href="'+result.msg+'" download="'+result.attachment.name+'">'+result.attachment.name+'</a></div>';
	
	
	mainDiv += 	'<div class=attachtextarea>\n <div class="jsxc_attchtextinput" contenteditable ></div>\n';
	mainDiv += 	'<div class="attchPlusIcon">\n'+
				'<div class="dropup">\n'+
				'<button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><img class="plusicon" src=././images/plus.svg>'+
				'</button>\n'+
				'<ul class="dropdown-menu">\n'+
				' <li><label class="btn-bs-file"><input type="file" name="files" id="fileElem" multiple="" accept="image/*"><a href="#">Computer</a></label></li>\n'+
				' <li id="attachgoogledriveP" class="dropdown-submenu" ><a href="#" >Google Drive</a></li>\n'+
				'</ul>\n'+
				'</div>\n'+
				'</div>\n';
		
	mainDiv += 	'<ul class="attchfileshare">\n'+	
				'<li class="attchfile" title="attachment">'+
				'<div class="dropup">\n'+
				'<button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><img src="././images/URIcons/attachmentpng-.png">'+
				'</button>\n'+
				'<ul class="dropdown-menu">\n'+
				'<li title="Upload"><label class="btn-bs-file"><input type="file" name="files" id="fileElem" multiple="" accept="image/*"><a href="#">Computer</a></label></li>\n'+
				'<li id="attachgoogledriveA" class="dropdown-submenu" ><a href="#">Google Drive</a></li>\n'+
				'</ul>\n'+
				'</div>\n'+
				'</li>\n'+
				'<li class="attchemoji" title="emoji"><img src="././css/img/smiley.svg">\n'+
				/*'<div class="jsxc_emoticons jsxc_list ">\n' +
				'<div class="jsxc_inner">\n' +
				'<ul>\n' +
				'<li class="jsxc_clear"></li>\n' +
				'</ul>\n' +
				'</div>\n' +
				'</div>\n' +*/
				'</li>\n'+
				'<li><a class="attchgif" data-toggle="modal"  href="#gifshow"><img src="././images/gif.png"></a></li>'+
				'</ul>';
	
	return mainDiv;
}

function viewAttachment(uid)
{
	var id = uid.replace("-",":");
	var result = jsxc.storage.getUserItem('msg', id);

	if(result == null)
		return true;
	
	var type = result.attachment;	
	if(type != undefined)
		type = result.attachment.type;
	
	if( (type === 'image/jpeg') || (type === 'image/png') )
	{	
		var likeCheck = checkSelfLike(uid, jsxc.bid);
		var bookmark = result.bookmark;
		var pinned = result.flag;
		var img = result.attachment.data;
		if(img == null)
			img = result.attachment.thumbnail;
		
		var showDiv = '<div class=showimage><img src='+img+'></div>';
		showDiv+= '<ul class="attachmainDiv">';
		

		showDiv+= '<li title="Upload"><label class="btn-bs-file "><img src="././images/URIcons/uploadpng-.png"><input type="file" name="files" id="fileElem" multiple="" accept="image/*"></label></li>';
		
		showDiv+= '<li title="Download"><a href="'+img+'" download="'+result.attachment.name+'"><img src="././images/URIcons/downloadpng-.png"></a></li>';
		
		
		//showDiv+= '<li class="attachZoomImg" title="Zoom"><img src="././images/URIcons/eye-.svg"></li>';
		showDiv+= '<li class="attachMsgImg"  data-dismiss="modal" id='+uid.replace("-msg","-attchmsg")+' title="View the conversation where this was first posted"><img src="././images/URIcons/chat-.svg"></li>';
		
		if(likeCheck)
			showDiv+= '<li class="attachLikeImg" id='+uid.replace("-msg","-attchLike")+' title="UnLike"><img src="././images/URIcons/like-.svg"></li>';
		else
			showDiv+= '<li class="attachLikeImg" id='+uid.replace("-msg","-attchLike")+' title="Like"><img src="././images/URIcons/like-.svg"></li>';

		
		if(bookmark)
			showDiv+= '<li class="attachBookImg" title='+JSON.stringify("Remove Bookmark")+' id='+uid.replace("-msg","-attchBook")+' onClick="setBookmark(\''+uid.replace("-",":")+'\',false);"><img src="././images/URIcons/bookmark-.svg"></li>';
		else
			showDiv+= '<li class="attachBookImg" title="Bookmark" id='+uid.replace("-msg","-attchBook")+' onClick="setBookmark(\''+uid.replace("-",":")+'\',true);"><img src="././images/URIcons/bookmark-.svg"></li>';
		
		
		showDiv+= '<li class="attachShareImg" title="Share" onclick=moreSetting(\''+uid+'\',false) data-toggle="modal" href="#showContatInfo"><img src="././images/URIcons/share-.svg"></li>';
		showDiv+= '<li class="attachMoveImg" title="Move" onclick=moreSetting(\''+uid+'\',true) data-toggle="modal" href="#showContatInfo"><img src="././images/URIcons/move-.svg"></li>';
		showDiv+= '<li class="attachEditImg" data-dismiss="modal" title="Edit" onClick="editFilename(\''+uid+'\');"><img src="././images/URIcons/edit-.svg"></li>';
		showDiv+= '<li class="attachDeleteImg" data-dismiss="modal" title="Delete" onClick="removeMessage(\''+uid+'\');"><img src="././images/URIcons/delete-.svg"></li>';
		showDiv+= '</ul>'+addparticipabtHTML;
		$('.showImg').empty();
		$('.showImg').append(showDiv);
	
		/*$('.attachZoomImg').click(function(){
		
		});*/
		
		$('.attachBookImg').click(function(){
			var check = $(this).attr("title");
			var msgid = this.id.replace("-attchBook","-msg");
		
			if(check == "Bookmark"){
					$(this).attr("title",'Remove Bookmark');
					$('#'+msgid).children('.rightIconBox').children('.msgBookmark').attr("title","Remove Bookmark");
			}
			 else{
					$(this).attr("title","Bookmark");
					$('#'+msgid).children('.rightIconBox').children('.msgBookmark').attr("title","Bookmark");
			 }
		});
	}
	else if(result.urlLink)
	{
		if(!$('.slidesection').hasClass('memberwidth'))
			$('.slidesection').addClass('memberwidth');
		var linkdivdetail = createattachmodual("link",result,uid);
		$('.attachdetail').append(linkdivdetail);	
	}
	else
	{
		if(!$('.slidesection').hasClass('memberwidth'))
			$('.slidesection').addClass('memberwidth');
		var linkdivdetail = createattachmodual("attachment",result,uid);
		$('.attachdetail').append(linkdivdetail);
	}
	$('.attachMsgImg').click(function(){
		var msgid = this.id.replace("-attchmsg","-msg");
		highlightdiv(msgid);
	});
	$('.attachLikeImg').click(function(){
		var msgid = this.id.replace("-attchLike","-msg");
		var msgbid = window.LastChatWindow;
		var check = $(this).attr("title");
		if(check == "Like") {
			 $(this).attr("title","UnLike");
			 likemessage(msgid, msgbid, 'like');
		}
		 else {
			 $(this).attr("title","Like");
			 likemessage(msgid, msgbid, 'dislike');
		 }
	});
	
	var data = [];
	if(result.urlLink)
		data.attachmentmsg = result.msg;
	else
		data.attachmentmsg = result.attachment.name;
	
	data.attachmentid = uid;
	
	$('[type="file"]').change(function(files) {
		window.temp = data;
		attachmentsend(files,window.LastChatWindow);
	});
	
	$('.attchgif').click(function(){
		window.temp = data;
		gifMainWindow(window.LastChatWindow);
	});
	
	$('.jsxc_attchtextinput').keydown(function(ev) {
							
		if ( ev.which == 13 )
		{
			var textareatext = $('.jsxc_attchtextinput').html();
			$('.jsxc_attchtextinput').html('');
			$('.jsxc_attchtextinput').focus();
			var attchname = "";
			if(result.urlLink) {
				attchname = result.urlTitle;
				if(attchname == "undefined")
					attchname = result.msg;
			}
			else 
				attchname = result.attachment.name;
			
			 jsxc.gui.window.postMessage({
				bid: window.LastChatWindow,
				direction: 'out',
				msg: textareatext,
				attachmentmsg:attchname,
				attachmentid:uid
			 });
			 SaveChatRegister(Window.LastChatWindow, textareatext, new Date());
		}
	});
	$('#attachgoogledriveP, #attachgoogledriveA').click(function(){
		window.temp = data;
		ipcRenderer.send('Googlefiles', 'ping');
		jsxc.gui.window.hideOverlay(bid);
		
		if( $('.cloudParent').length == 0 )
			$( ".jsxc_fade" ).prepend("<div class=cloudParent><div class=cloudfile bid="+bid+"></div></div>" );
	});
}

function attachmentsend(files,bid)
{
	var attach = window.temp;
	window.temp = undefined;
	
	var size = files.target.files.length;
	if(size == 0)
		return;
	var jid = jsxc.jidToBid(bid);
	var msg = $('<div><div><label></label></div></div>');
	jsxc.gui.window.showOverlay(jid, msg, true);
	msg.addClass('jsxc_chatmessage');
	var img="";
	for (var i =0;i<size;i++)
	{
		img = "";
		var file = files.target.files[i]; 
		
		if (!file) 
			return;
		
		if (FileReader && file.type.match(/^image\//)) {
			img = $('<img alt="preview" class="img">').attr('title', file.name);
			img.attr('src', jsxc.options.get('root') + '/img/loading.gif');
		}
		jsxc.fileTransfer.fileSelected(jid, msg, file, img);
	}
	
	var button = "<div class='btnsection'><button id='abortbtn' class='fileSend'>send</button><button id='abortbtn' class='fileabord'>abort</button></div>";
	msg.append(button);
	$('.fileSend').click(function(){
		jsxc.gui.window.hideOverlay(bid);
		var data = $('.jsxc_flag').attr('title');
		var isflag = false;
		if(data == "fill")
			isflag = true;
		for (var i =0;i<size;i++)
		{
			var file = files.target.files[i]; 
			var imgSrc = $(".img[title|='"+file.name+"']").attr('src');
		
			var message = "";
			if(attach != undefined){
				message = jsxc.gui.window.postMessage({
					bid: bid,
					direction: 'out',
					flag: isflag,
					attachmentmsg:attach.attachmentmsg,
					attachmentid:attach.attachmentid,
					attachment: {
						name: file.name,
						size: file.size,
						type: file.type,
						data: (file.type.match(/^image\//)) ? imgSrc : null
					}
				});
			}
			else{
				message = jsxc.gui.window.postMessage({
					bid: bid,
					direction: 'out',
					flag: isflag,
					attachment: {
						name: file.name,
						size: file.size,
						type: file.type,
						data: (file.type.match(/^image\//)) ? imgSrc : null
					}
				});
			}
			jsxc.xmpp.httpUpload.sendFile(file, message);
		}
		$('.jsxc_flag').attr("title",'notfill');
		$('.jsxc_flag').removeClass("setFlagbackground");
	});
	$('.fileabord').click(function(){
		jsxc.gui.window.hideOverlay(bid);
	});
}

// link Div only

var linkDiv ='<div id="linkinfo" class="modal fade" role="dialog">\n'+
'<div class="modal-dialog">\n'+
'<div class="modal-content">\n'+
'<div class="modal-header">\n'+
'<button type="button" class="close" data-dismiss="modal">&times;</button>\n'+
'<h4 class="modal-title">New Link</h4>\n'+
'</div>\n'+
'<div class="modal-body">\n'+
'<div class="sendlinkinfo"></div>\n'+
'</div>\n'+
'</div>\n'+
'</div>\n'+
'</div>\n'+
'';

function ShowAllLink()
{
	$('.searchview').remove();
	$("#clientview").empty();
	$('#clientview').load("views/link.html");
}
function storeLinks(linkArray)
{ 
	linkArray.id = "db-"+(jsxc.bid).split("@")[0]+"_links";
	couchDbGetItem(getlinkhisStore, linkArray);	
}

function getlinkhisStore(returnVal, returnData, inputsParam)
{
	var tempArray = {};
	tempArray.title = inputsParam.title;
	tempArray.link = inputsParam.link;
	tempArray.direction = inputsParam.direction;
	tempArray.bid = inputsParam.bid;
	if(inputsParam.direction == "in")
	{
		var data = GetContactDetails((inputsParam.bid).split("@")[0]) || [];
		tempArray.name = data.caller_id || "unknow";
	}
	else
		tempArray.name = loggeduser.username || "unknow";
	
	tempArray.msgid = inputsParam.msgId;
	tempArray.summary = inputsParam.summary;
	tempArray.date  = new Date();
	
	if(returnVal == "success")
	{
		var data = returnData.MyData || [];
		data.push(tempArray);	
		var input = {
			 _id: inputsParam.id,
			_rev: returnData._rev,
			MyData:data
		};
		couchDbPutItem(linkPutData,input);
	}
	else{
		var linkHistory = [];
		linkHistory.push(tempArray);
		var input = {
			_id: inputsParam.id,
			MyData: linkHistory
		};
		couchDbPutItem(linkPutData, input);
	}
}
	
function linkPutData(returnVal, returnData, inputsParam) {	 if (window.Debug) console.log("returnVal",returnVal); }

function getAdmindetail()
{
	$('#adminRows').empty();
	var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappgetdesktopadmin";
	var url ="/apiCalling?Stype=Getadmindetail&company_id="+loggeduser.company_id+"&type=1&linkUrl="+endpoint;
	var temp = '<li class="dropdown">\n'+
				'<div class="ad-name-images"><img src="images/customer-img.png" class="customer-img"/> <h3>'+loggeduser.username+'<br><span>'+loggeduser.mailid+'</span></h3></div>\n'+
				'<div class="ad-name-icons"><span class="icon-settings dropdown-toggle" data-toggle="dropdown"></span>\n'+
				'<ul class="dropdown-menu">\n'+
				'<li><a onclick=adminAddRemove("'+loggeduser.mailid+'","remove") href="#">Remove Admin</a></li>\n'+
				'<li><a onclick=BrowserProfile("self") href="#">View Profile</a></li>\n'+
				'</ul>\n'+
				'</div>\n'+
				'</li>\n';
	$('#adminRows').append(temp);
			
	$.get(url, function(response) {
		if(response.length > 0)
		{	
			for(var i =0; i<response.length; i++)
			{
				if (response[i].errcode == 0) 
				{
					var rows = '<li class="dropdown">\n'+
					'<div class="ad-name-images"><img src="images/customer-img.png" class="customer-img"/> <h3>'+response[i].username+'<br><span>'+response[i].email+'</span></h3></div>\n'+
					'<div class="ad-name-icons"><span class="icon-settings dropdown-toggle" data-toggle="dropdown"></span>\n'+
					'<ul class="dropdown-menu">\n'+
					'<li><a onclick=adminAddRemove("'+response[i].email+'","remove") href="#">Remove Admin</a></li>\n'+
					'<li><a onclick=BrowserProfile("moderate","'+response[i].sip_login_id+jidSuffix+'") href="#">View Profile</a></li>\n'+
					'</ul>\n'+
					'</div>\n'+
					'</li>\n';
					$('#adminRows').append(rows);
				}
			}
		
			/*$('.adminSelfmail').html(loggeduser.mailid);  // for Compliance mail
			var div = '<div class="col-12 m-3">\n'+
						'<div class="row">\n'+
							'<div class="col-1">\n'+
								'<div class="flex-container">\n'+
									'<div class="flex-box">\n'+
										'<p>q</p>\n'+
									'</div>\n'+
								'</div>\n'+
							'</div>\n'+
							'<div class="col-10">\n'+
								'<h4 class="adminSelfname">'+loggeduser.username+'</h4>\n'+
								'<p class="adminSelfmail">'+loggeduser.mailid+'</p>\n'+
							'</div>\n'+
						'</div>\n'+
					'</div>';
		for(var i =0; i<response.length; i++)
		{
			if (response[i].errcode == 0) 
			{
				div += '<div class="col-12 m-3">\n'+
					'<div class="row">\n'+
						'<div class="col-1">\n'+
							'<div class="flex-container">\n'+
								'<div class="flex-box">\n'+
									'<p>q</p>\n'+
								'</div>\n'+
							'</div>\n'+
						'</div>\n'+
						'<div class="col-10 adminlistSh">\n'+
							'<h4 class="adminname">'+response[i].username+'</h4>\n'+
							'<p class="adminmail">'+response[i].email+'</p>\n'+
						'</div>\n'+
						'<div class="col-1">\n'+
							'<div class="flex-container">\n'+
								'<div class="flex-box cursor">\n'+
									'<div class="dropdown">\n'+
										'<a class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><img src="./images/admin/Settings.png"></a>\n'+
										'<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel" x-placement="bottom-start" style="position: absolute; will-change: transform; transform: translate3d(0px, 39px, 0px); top:-15px !important; left:13px !important;">\n'+
											'<li><a onclick=adminAddRemove("'+response[i].email+'","remove") data-toggle="modal" data-target="#" href="#">Remove Admin</a></li>\n'+
											'<li><a onclick=showUserProfile("'+response[i].sip_login_id+'@im01.unifiedring.co.uk") data-toggle="modal" data-target="#" href="#directoryViewPro_Detail">View Profile</a></li>\n'+
										'</ul>\n'+
									'</div>\n'+
								'</div>\n'+
							'</div>\n'+
						'</div>\n'+
					'</div>\n'+
				'</div>\n'+
				'<div class="modal-body" id="directoryViewPro_Detail"></div>\n';
			}
		}
			div += '<div class="col-12 add-admin">\n'+
					'<p>+ Add admin</p>\n'+
					'</div>';
			$('.adminListSh').empty();
			$('.adminListSh').append(div);
				

			$('.add-admin').click(function()
			{
				$('#addAminPop').modal('show');
				$('#addAdminText').val("");
				$('.showContactAdm').css("display","none");
			});
			$('#viewproRem').click(function()
			{
				//$('#directoryViewPro').modal('show');
				showUserProfile($(this).attr("bid"));
			});
			$('.addAdminCall').click(function()
			{
				var text = $('#addAdminText').val();
				if(text != "")
					adminAddRemove(text,"add");
			})*/
		}
	});
}

function openadminWin(jid)
{
	removeUnwantedDiv();
	showwindow(jid);
}

function admincontactSt(input)
{
	$('.showContactAdm').empty();
	if(input == "")
		$('.showContactAdm').css("display","none");
	else
		$('.showContactAdm').css("display","block");
	input = input.toUpperCase();
	//var Buddies = jsxc.storage.getUserItem('buddylist');
	var Buddies = contacsarray;
	var img = globalImg;
	var div='<div class="col-md-12">\n'+
			'<div class="panel panel-default">\n'+
			'<ul class="list-group">\n';
	$.each(Buddies, function (index, item) {
		
		var checkdata = GetContactDetails( item.sip_login_id);
		if(checkdata == undefined)	return;
		
		if( (input != undefined) && (input != "") )
		{	
			if(checkdata.caller_id.toUpperCase().indexOf(input) != -1)
				div+='<li><a href="#" onclick=adminAddRemove("'+checkdata.email_id+'","add") class="list-group-item" data-dismiss="modal"><img src="'+img+'">'+checkdata.caller_id+'</a></li>\n';
		}
	})
	div+='</ul>\n'+
	'</div>\n'+
	'</div>';
	$('.showContactAdm').append(div);	
}

function adminAddRemove(mailId, check)
{
	var type = (check == "add") ? 1 :2;
	var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappadddesktopadmin";
	var url ="/apiCalling?Stype=adminaddremove&company_id="+loggeduser.company_id+"&email="+mailId+"&type="+type+"&linkUrl="+endpoint;
	$.get(url, function(response) {
		if(response.length > 0)
		{	
			if (response[0].errcode == 0) 
				getAdmindetail();
			else
				alert(response[0].errmsg)
		}
	});
}

function setRemoveCompayDetail()
{
	var invite = 0;
	var binvite = 0;
	if($('#allowinvite').prop("checked") == true)
		invite = 1;
	if($('#begininvite').prop("checked") == true)
		binvite = 1;
	var ghipy = $("#ghipydropbox option:selected" ).val();
	
	adminComAddRemove(invite, binvite, ghipy, 'set');
}
function adminretentionFun()
{
	var selValue = $('input[name=retenradios]:checked').val();
	if(selValue == undefined)	return;
	var val = 0;
	if(selValue == 5)
		val = $("#retentiontxt").val();
	else if(selValue == 4)
		val = 90;
	else if(selValue == 3)
		val = 60;
	else if(selValue == 2)
		val = 30;
	else if(selValue == 1)
		val = 1;
	var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappupdatedesktopdataretentionsetting";
	var url ="/apiCalling?Stype=adminretention&company_id="+loggeduser.company_id+"&days="+val+"&retention_type="+selValue+"&linkUrl="+endpoint;
	$.get(url, function(response) {
		if(response.length > 0)
		{	
			if (response[0].errcode == 0) 
				alert("Updated Successfully");
			else
				alert(response[0].errmsg)
		}
	});
	
}

function adminComAddRemove(invite, sign, giphy, mode)
{
	var endpoint;
	var url;
	if(mode == "set")
	{
		endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappupdatedesktopcompanysetting";
		url ="/apiCalling?Stype=adminComAddRemove&adminmode=set&company_id="+loggeduser.company_id+"&allow_invite="+invite+"&allow_without_signup="+sign+"&giphy_sharing="+giphy+"&linkUrl="+endpoint;
	}
	else
	{
		endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappgetdesktopcompanysetting";
		url ="/apiCalling?Stype=adminComAddRemove&adminmode=get&company_id="+loggeduser.company_id+"&linkUrl="+endpoint;
	}
	
	$.get(url, function(response) {
		if(response.length > 0)
		{	
			if (response[0].errcode == 0) 
			{
				//if(response[0].allow_invite)
				//{
					$("#allowinvite").attr("checked",(response[0].allow_invite == 1) ? true : false);
					$("#begininvite").attr("checked",(response[0].allow_without_signup == 1) ? true : false);
					//$("#complianceid").attr("checked",(response[0].compliance_export == 1) ? true : false);
					$('#ghipydropbox option')[response[0].giphy_sharing].selected = true;

					$("#admincomputer").attr("checked",(response[0].upload_mobile_computer == 1) ? true : false);
					$("#admingoogle").attr("checked",(response[0].google_drive == 1) ? true : false);
					$("#admindropbox").attr("checked",(response[0].dropbox == 1) ? true : false);
					$("#adminbox").attr("checked",(response[0].box == 1) ? true : false);
					$("#adminonedrive").attr("checked",(response[0].onedrive == 1) ? true : false);
					$("#adminevernote").attr("checked",(response[0].evernote == 1) ? true : false);
					
					 if (window.Debug) console.log("response[0].data_retention_type",response[0].data_retention_type);
					if(response[0].data_retention_type == 1)
						$('#Rentradios1').prop('checked',true);
					else if(response[0].data_retention_type == 2)
						$('#Rentradios2').prop('checked',true);
					else if(response[0].data_retention_type == 3)
						$('#Rentradios3').prop('checked',true);
					else if(response[0].data_retention_type == 4)
						$('#Rentradios4').prop('checked',true);
					else if(response[0].data_retention_type == 5)
					{
						$('#Rentradios5').prop('checked',true);
						$('#retentiontxt').val(response[0].data_retention_days);
					}
				//}
			}
		}
	});
}

function addadmincompliance(mailId)
{
	var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappadddesktopadmin";
	var url ="/apiCalling?Stype=addadmincompliance&company_id="+loggeduser.company_id+"&email="+mailId+"&type=3&linkUrl="+endpoint;
	$.get(url, function(response) {
		if(response.length > 0)
		{	
			if (response[0].errcode == 0) 
			{
				 if (window.Debug) console.log("success")
			}
		}
	});
}


function adminFileShareSave(mode)
{
	var comp = ($('#admincomputer').prop("checked") == true) ? 1 : 0;
	var googleD = ($('#admingoogle').prop("checked") == true) ? 1 : 0;
	var dropbox = ($('#admindropbox').prop("checked") == true) ? 1 : 0;
	var box =  ($('#adminbox').prop("checked") == true) ? 1 : 0;
	var onedrive = ($('#adminonedrive').prop("checked") == true) ? 1 : 0;
	var evernote = ($('#adminevernote').prop("checked") == true) ? 1 : 0;
	
	var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappupdatedesktopintegrationadmin";
	var url ="/apiCalling?Stype=adminFileShareSave&company_id="+loggeduser.company_id+"&integration_gallery=1&upload_mobile_computer="+comp+"&google_drive="+googleD+"&dropbox="+dropbox+"&box="+box+"&onedrive="+onedrive+"&evernote="+evernote+"&type=2&linkUrl="+endpoint;
	$.get(url, function(response) {
		if(response.length > 0)
		{	
			if (response[0].errcode == 0) 
			{
				 if (window.Debug) console.log("success")
			}
		}
	});
}

function getcompliancedetail()
{
	var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappgetdesktopadmin";
	var url ="/apiCalling?Stype=getcompliancedetail&company_id="+loggeduser.company_id+"&type=2&linkUrl="+endpoint;
	$('#adminpermision').empty();
	$.get(url, function(response) {
		
		 if (window.Debug) console.log("getcompliancedetail response is",response);
		if(response.length > 0)
		{	
			if (response[0].errcode == 0) 
			{
				for(var k=0; k<response.length; k++)
				{	 if (window.Debug) console.log("inside for loop")
					if(response[k].errcode == 0) 
					{
						var temp = '<li>\n'+
						'<div class="ad-name-images"><img src="images/customer-img.png" class="customer-img"/> <h3>'+response[k].username+'<br><span>'+response[k].email+'</span></h3></div>\n'+
						'<div class="ad-name-icons"><span class="icon-tick"></span></div>\n'+
						'</li>\n';
						$('#adminpermision').append(temp);
					}
				}
			}
		}
		
		/*$('.adminwritelist').empty();
		var selfname=$('.adminSelfname').html();
		var selfmail=$('.adminSelfmail').html();
		var div = '<div class="container-div"> <img src='+globalImg+' alt="Avatar" style="width:51.86px">\n'+
		'<p>'+selfname+' (me)</p>\n'+
		'<p class="acc-check"><i class=fas fa-check ml-auto style=color:#0069d9;></i></p>\n'+
		'<p>'+selfmail+'</p>\n'+
		'</div>\n';
		$('.adminwritelist').append(div);
		
		if(response.length > 0)
		{	
			if (response[0].errcode == 0) 
			{
				for(var k=0; k<response.length; k++)
				{	console.log("inside for loop")
					if(response[k].errcode == 0) 
					{
						var div = '<div class="container-div adminwriteSh"> <img src='+globalImg+' alt="Avatar" style="width:51.86px">\n'+
							'<p class="adminWName">'+response[k].username+'</p>\n'+
							'<p class="acc-check"><i class=fas fa-check ml-auto style=color:#0069d9;></i></p>\n'+
							'<p class="adminWMail">'+response[k].email+'</p>\n'+
							'</div>';
						$('.adminwritelist').append(div);
					}
				}
			}
		}
		
		$('.adminlistSh').each(function()
		{
			var aname = $(this).children('.adminname').html();
			var amail = $(this).children('.adminmail').html();
			var check=true;
			$('.adminwriteSh').each(function()
			{
				var wname = $(this).children('.adminWName').html();
				var wmail = $(this).children('.adminWMail').html();
				if((aname == wname) && (amail == wmail))
					check=false;
				console.log(" inside name",wname);
				console.log("inside mail",wmail);
			});
			if(check)
			{
				var div = '<div class="container-div adminwriteSh"> <img src='+globalImg+' alt="Avatar" style="width:51.86px">\n'+
					'<p class="adminWName">'+aname+'</p>\n'+
					'<p class="acc-check"><i class=fas fa-check ml-auto style=color:#0069d9;></i></p>\n'+
					'<p class="adminWMail">'+amail+'</p>\n'+
					'</div>';
				$('.adminwritelist').append(div);
			}
		});	*/
	});
	
	var items = $('ul.adminlistSh>li');
	$.each(items,function(index, node){
		 if (window.Debug) console.log("dd value is",node);
	});
}

function compSubmitFun(){
	 if (window.Debug) console.log("compSubmitFun calling");
	var selValue = $('input[name=Compradios]:checked').val();
	var today = new Date();
	var enddate = new Date();
	
	if(selValue == 1)
		today.setDate( today.getDate() - 7 );
	else if(selValue == 2)
		today.setDate( today.getDate() - 30 );
	else if(selValue == 3)
		today.setDate( today.getDate() - 90 );
	else if(selValue == 4)
		today.setDate( today.getDate() - 90 );
	else if(selValue == 5)
	{
		var sdate = $('#Startdate').val();
		var edate = $('#enddate').val();
		if( (sdate > edate) || ( (sdate =="") || (edate == "")) ){
				alert("Please Enter Vaild Date !");
			return;
		}
		today =  new Date(sdate);
		enddate = new Date(edate);
	}
	getRetention(today, enddate);
}

function checkmsgremove()
{
	var time = formatAMPM(new Date);
	if( (time.split(" ")[1] == "AM") || (time.split(":")[0] == 12) )
	{
		var endpoint = ApiServerURL + "v1/user/XXAccesstokenXX/Urappgetdesktopcompanysetting";
		var url ="/apiCalling?Stype=checkmsgremove&company_id="+loggeduser.company_id+"&linkUrl="+endpoint;
		$.get(url, function(response) {
			if(response.length > 0)
			{	
				if (response[0].errcode == 0) 
				{
					var days = response[0].data_retention_days;
					if(days !=undefined)
					{
						var Buddies = jsxc.storage.getUserItem('buddylist');
						$.each(Buddies, function (index, item) {
							var history = jsxc.storage.getUserItem('history', item) || [];
							var i = 0;
							while (history.length > i) {
								var msg = jsxc.storage.getUserItem('msg', history[i]);
								var msgtoday = new Date(msg.stamp);
								var curtoday = new Date();
								var msgdate = msgtoday.getFullYear()+'-'+(msgtoday.getMonth()+1)+'-'+msgtoday.getDate();
								var curdate = curtoday.getFullYear()+'-'+(curtoday.getMonth()+1)+'-'+curtoday.getDate();
								
								var difference = dateDiffInDays(new Date(curdate) , new Date(msgdate));
								if(days == 1)
								{
									var uid = history[i].replace(":","-");
									removeMessage(uid, item);
								}
								else
								{
									if(difference > days)
									{
										var uid = history[i].replace(":","-");
										removeMessage(uid, item);
									}
								}
								i++;
							}
						})
					}
				}
			}
		});
	}
}

const _MS_PER_DAY = 1000 * 60 * 60 * 24;
function dateDiffInDays(a, b) {
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}


function attachFileForTask()
{

	if($("#Postuserid").val() != "")	$("#taskfile").trigger('click');
	else	$("#sendposttask_btn").trigger('click');
}

function getTaskbyUser(jid, type)
{
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	couchDbGetItem(getTaskDetailsforUser, temp);
}

function getTaskDetailsforUser(returnVal, returnData, inputsParam)
{
	if(returnVal != success)	return;
	var	 Existngdata = returnData.taskdetails || [];
	if(type == "sort")
	{	
		if(jid == "assignee")
		{
			Existngdata.sort(function(a, b)
			{
				if( (a.assignee != null) && (b.assignee != null) )
				{
					var nA = a.assignee.toLocaleLowerCase();
					var nB = b.assignee.toLocaleLowerCase();
					return nA.localeCompare(nB);
				}		
			});
		}	
	}
	var ListofTasks = "";
	var entry_count = 0;
	for (var i = 0; i < Existngdata.length; i++) 
	{
		var obj = Existngdata[i];
		var assignee = obj.assignee;
		var starttime = obj.starttime;
		var Endtime = obj.endtime;
		var totaldays = obj.totaldays;
		var sectionname = obj.sectionname;
		var postusername = obj.postusername;
				
		var taskLikeBtn = obj.msgid+"_taskLike";
		var taskUnLikeBtn = obj.msgid+"_taskUnLike";
		var taskBookmarkBtn = obj.msgid+"_taskBookmark";
		var taskUnBookmarkBtn = obj.msgid+"_taskUnBookmark";
		var taskPinBtn = obj.msgid+"_taskPin";
		var taskUnPinBtn = obj.msgid+"_taskUnpin";

		var deletetaskpopup = obj.id+"_deletetaskpopup";
		var deletetarget = "#"+deletetaskpopup;
		var showContatInfo	= obj.id+"_showContatInfo";
		var showContattarget	= "#"+showContatInfo;

		if(obj.msgid == null || obj.msgid == undefined)
			continue;
		var msgid = obj.msgid.replace("-", ":");
		var data = jsxc.storage.getUserItem('msg', msgid);	
		if(data == null || data == undefined)
			continue; 

		var checkedbox = "chkbox_"+obj.id;

		if(type == 'user')
		{
			if(jid != "")
			{
				if(obj.postuser != jid)
					continue;
			}
		}
		else if(type == 'complete')
		{
			if(jid != "")
			{
				if(jid == 'pending')
				{
					if(obj.iscomplete == true)
						continue;
				}
				else
				{
					if(obj.iscomplete == false || obj.iscomplete == undefined || obj.iscomplete == "")
						continue;
				}
			}	
		}	
		if(assignee == undefined)	assignee ="";					
		if(starttime == undefined)	starttime = "";					
		if(Endtime == undefined)	Endtime = "";					
		if(totaldays == undefined)	totaldays = "";					
		if(sectionname == undefined)	sectionname = "";	
		if(postusername == undefined)	postusername = "";		
		if(obj.id == undefined)	continue;

		var checkedbox = "chkbox_"+obj.id;
		var b_msgID	= obj.msgid.replace("-", ":");		
		if(starttime !=""  && starttime != undefined)
			starttime = convertTimeTasklistFormat(starttime)	
		var Time = ""
		if(Endtime !=""  && Endtime != undefined)
		{	
			Endtime = convertTimeTasklistFormat(Endtime)
			
			var formattime = new Date( Endtime)
			Time    = formatAMPM(formattime);
		}
		var entry  	= "<tr  onclick=\"showTaskDetails('"+obj.id+"')\">"
		if( obj.iscomplete == true)
		{
			entry +="<td class=\"highlight\">"		
			entry +="<div class=\"custom-control custom-checkbox mb-3\">"		
			entry +="<input type=\"checkbox\" class=\"custom-control-input\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'complete')\" checked><label class=\"custom-control-label\">"+obj.taskname+"</label>"
			entry +="</div>"
			entry +=" </td>"
		}
		else
		{
			if(obj.complete == "checkedall")
			{
				entry +="<td class=\"highlight\">"
				entry +="<div class=\"dropdown\">"
				entry +="<span type=\"button\" class=\"btn btn-secondary dropdown-toggle\" id=\"tasktooltip\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">0/1</span>"
				entry +="<div class=\"dropdown-menu\" aria-labelledby=\"tasktooltip\">"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'checkedall')\" >"+postusername+"</a>"
				entry +="</div>"
				entry +="</div>"
				entry +="</td>"
			}
			else if(obj.complete == "100%")
			{
				entry +="<td class=\"highlight\">"
				entry +="<div class=\"dropdown\">"
				entry +="<span type=\"button\" class=\"btn btn-secondary dropdown-toggle\" id=\"tasktooltip\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\" >"+obj.completepercentage+"</span>"
				entry +="<div class=\"dropdown-menu\" aria-labelledby=\"tasktooltip\">"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'0%')\" >0%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'10%')\" >10%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'20%')\" >20%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'30%')\" >30%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'40%')\" >40%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'50%')\" >50%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'60%')\" >60%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'70%')\" >70%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'80%')\" >80%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'90%')\" >90%</a>"
				entry +="<a class=\"dropdown-item\" onclick=\"setCompleteIncomplete('"+obj.id+"',this,'100%')\" >100%</a>"	
				entry +="</div>"
				entry +="</div>"
				entry +="</td>"
			}
			else
			{
				entry +="<td class=\"highlight\">"
				entry +="<div class=\"custom-control custom-checkbox mb-3\">"
				
				entry +="<input type=\"checkbox\" class=\"custom-control-input\"  onclick=\"setCompleteIncomplete('"+obj.id+"',this,'checkedonly')\"><label class=\"custom-control-label\">"+obj.taskname+"</label>"
				entry +="</div>"
				entry +=" </td>"
			}			
		}
		entry +="<td class=\"highlight\">"+assignee+"</td>"
		//if(checkstart)
		//entry +="<td class=\"highlight\">"+starttime+"</td>"
		//if(checkdue)
		entry +="<td class=\"highlight\">"+Endtime+"</td>"
		//if(checkduetime)
		//entry +="<td class=\"highlight\">"+Time+"</td>"
		//if(checkdays)
		//entry +="<td class=\"highlight\">"+totaldays+"</td>"
		//if(checksection)
		entry +="<td class=\"highlight\">"+sectionname+"</td>"
		//if(checkconversation)
		entry +="<td class=\"highlight\">"+postusername+"</td>"
		entry +="<td><a class=\"dropdown-toggle\" data-toggle=\"dropdown\">"
		entry +="<img src=\"images/icons/elip_h-s.png\" alt=\"\"></a>"	
		entry +="<div class=\"dropdown-menu\">"
		if(data.likelist.length == 0)
			entry +="<a id='" + taskLikeBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"likemessage('"+obj.msgid+"','"+obj.postuser+"','like')\"><img src=\"images/icons/thumb-s.png\" alt=\"\"> Like</a>"
		else
			entry +="<a id='" + taskLikeBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"likemessage('"+obj.msgid+"','"+obj.postuser+"','dislike')\"><img src=\"images/icons/thumb-s.png\" alt=\"\"> Dislike</a>"

		if(!data.bookmark)	
			entry +="<a id='" + taskBookmarkBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setBookmark('"+b_msgID+"',true)\"><img src=\"images/icons/bookmark-s.png\" alt=\"\">Bookmark</a>"
		else
			entry +="<a id='" + taskBookmarkBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setBookmark('"+b_msgID+"',false)\"><img src=\"images/icons/bookmark-s.png\" alt=\"\">UnBookmark</a>"

		if(!data.flag)	
			entry +="<a id='" + taskPinBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setFlagMode('"+b_msgID+"',true)\"><img src=\"images/icons/pin-s.png\" alt=\"\">Pin</a>"
		else
			entry +="<a id='" + taskPinBtn + "' class=\"dropdown-item\" href=\"#\" onclick=\"setFlagMode('"+b_msgID+"',false)\"><img src=\"images/icons/pin-s.png\" alt=\"\">UnPin</a>"
		entry +="<a class=\"dropdown-item\" onclick=\"moreSetting('"+obj.msgid+"',false)\" data-toggle=\"modal\" href='"+showContattarget+"'><img src=\"images/icons/share-s.png\" alt=\"\">Share</a>"
		entry +="<a class=\"dropdown-item\" href=\"#\" onclick=\"editTaskdetails('"+obj.id+"')\";><img src=\"images/icons/edit-s.png\" alt=\"\">Edit</a>"
		entry +="<a class=\"dropdown-item\" data-toggle=\"modal\" data-target='"+deletetarget+"'><img src=\"images/icons/delete-s.png\" alt=\"\">Delete</a>"	
		entry +="<div class=\"arrow\" style=\"left: 50%;\"></div>"
		entry +="</div>"					
		entry +="<div class=\"modal\" id='"+deletetaskpopup+"' role=\"dialog\">"						
		entry +="<div class=\"modal-dialog\">"
		entry +="<div class=\"modal-content\">"
		entry +="<div class=\"modal-header\">"							
		entry +="<h4 class=\"modal-title\">Delete</h4>"
		entry +="<button type=\"button\" class=\"close\" data-dismiss=\"modal\">&times;</button>"
		entry +="</div>"
		entry +="<div class=\"modal-body\">"
		entry +="<p>Are you sure want to delete?</p>"
		entry +="</div>"
		entry +="<div class=\"modal-footer\">"
		entry +="<button type=\"button\" class=\"btn btn-primary\" onclick=\"deleteTaskEvent('"+obj.id+"')\" data-dismiss=\"modal\">Delete</button>"
		entry +="<button type=\"button\" class=\"btn btn-danger\" data-dismiss=\"modal\">Close</button>"
		entry +="</div>"
		entry +="</div>"
		entry +="</div> "
		entry +="</div>	"
		entry +="<div id='"+showContatInfo+"' class=\"modal\" role=\"dialog\">"
		entry +="<div class=\"modal-dialog\">"
		entry +="<div class=\"modal-content\">"
		entry +="<div class=\"modal-header\">"
		entry +="<button type=\"button\" class=\"close\" data-dismiss=\"modal\">&times;</button>"
		entry +="<h4 class=\"modal-title\">Move To</h4>"
		entry +="</div>"
		entry +="<div class=\"modal-body\">"
		entry +="<div class=\"contactinfo\"></div>"
		entry +="</div>"
		entry +="</div>"
		entry +="</div>"
		entry +="</div>"
		entry +="</td>"	
		entry +="</tr>"
		ListofTasks += entry;
		entry_count++;				
	}
	if(entry_count == 0)
		$("#tasklist_table").html("<p style=\"text-align:center\">No tasks available</p>");				
	else
	{
		$("#Nosection_task").hide()
		$(".tasksection").show();
		$("#tasklist_table").html(ListofTasks);		

	}
}

function filterCalenderEvents(value, type)
{
	if (fs.existsSync(EventsFile)) {
		 if (window.Debug) console.log("File exists..");
		
		fs.readFile(EventsFile, function (err, data) {
			var Existngdata = JSON.parse(data)
			var obj = {data: []};
			
		for (var i = 0; i < Existngdata.data.length; i++) {
		var datas = Existngdata.data[i];

			if(type == "show")
			{
					if(value == "taskonly")
					{
						if(datas.isTask == true)
						{
							obj.data.push(datas);
						}
					}
					else if(value == "eventsonly")
					{
						if(datas.isEvent == true)
						{
							obj.data.push(datas);
						}
					}
					else if(value == "all")
					{
						obj.data.push(datas);
					}
			}
			else if(type == "byuser")
			{
				if(datas.jid == value)
					obj.data.push(datas);

				if(value == "")
					obj = Existngdata;
			}
			/*else
			{


			}*/
			
			
		
	}
		
	
		 if (window.Debug) console.log("List task", obj)
		fs.writeFile(EventsFilterFile , JSON.stringify(obj), function(err) {
			if(err) {
				return console.log(err);
			}

		

		fs.readFile(EventsFilterFile, function (err, data) {
			var filterdata = JSON.parse(data)

			reloadCalender();
			//doOnLoad('EventsFilterFile');
	
		});

		});
		
		})
		
	}
	/* else
	{
		console.log("File not exists..");
		
		PostUser = $("#postuser").val();
		if(PostUser == "" || Name == "" || PostUser == undefined || Name == undefined)
			return;
		
		let reg = new Object();
			reg.id = id;
			reg.start_date = starttime;
			reg.end_date = endtime;
			reg.text = Name;
			reg.jid = PostUser;
			reg.isTask	= false;
			reg.isEvent	= true;
		
		var obj = {data: []};
			obj.data.push(reg);
					
	} */

}

function generateUserlistforEvents()
{
	var result = jsxc.storage.getUserItem('buddylist');
	var mainDiv = '<option value=\'\'>All Events</option>\n'
	$.each(result, function (index, item) {
		 data = jsxc.storage.getUserItem('buddy', item);
		 if(data == null)
			return false;
		mainDiv += '<option value='+data.jid+'>'+data.name+'</option>\n';
	})
	$("#eventlistfilterbyJid").html(mainDiv);
}

function filterbyDayMonth(value)
{
	if(value == 'day')
		$(".day_tab").trigger('click');
	else if(value == 'week')
		$(".week_tab").trigger('click');
	else
		$(".month_tab").trigger('click');

}

/*
function updateMSGidforTask(id, msgid, dataarray)
{
	var temp = [];
	temp.id = "db-"+(jsxc.bid).split("@")[0]+"_tasks";
	couchDbGetItem(getTaskdetailsforUpdateMSGId, temp);	
}

function getTaskdetailsforUpdateMSGId(returnVal, returnData, inputsParam)
{
	let reg 		= new Object();
	reg.id 			= dataarray.taskid;
	reg.taskname 	= dataarray.taskname;
	reg.starttime 	= dataarray.starttime;
	reg.endtime 	= dataarray.Endtime;
	reg.assignee 	= dataarray.assignee;
	reg.totaldays 	= dataarray.totaldays;
	reg.repeat 		= dataarray.repeat;
	reg.sectionname = dataarray.sectionname;
	reg.description = dataarray.description;
	reg.postuser	= dataarray.postuser;
	reg.msgid			= msgid;
	reg.postusername	= dataarray.postusername;
	reg.complete	= dataarray.complete;
	reg.isTask		= true;
	reg.isEvent		= false;
	reg.iscomplete	= dataarray.iscomplete;
	reg.completepercentage	= dataarray.completepercentage;
	reg.assigneejid	= dataarray.assigneejid;
	reg.color		= dataarray.color;

	if(returnVal == "success")
	{
		var data = returnData.taskdetails || [];
		if(id != "" && id != undefined)
		{
			for (var i = 0; i < data.length; i++) 
			{
				var obj = data[i];

				if ( obj.id == id) {
					data.splice(i, 1);
				}
			}
		
		}

		data.push(reg);	
		var input = {
			_id: inputsParam.id,
			_rev: returnData._rev,
			taskdetails:data
		};
		couchDbPutItem(taskSuccessError, input, inputsParam);
	}		
}
*/
function byteLength(str) {
	var s = str.length;
	for (var i=str.length-1; i>=0; i--) {
		var code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) s++;
		else if (code > 0x7ff && code <= 0xffff) s+=2;
		if (code >= 0xDC00 && code <= 0xDFFF) i--;
	}
	return s;
}

function setCaret() {
	var el = document.getElementsByClassName("jsxc_textinput")[0];
	 if (window.Debug) console.log(el);
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
}


function filterFunction() {


	var id = "";
	var assignid="";
	var dropdownid="";
	
/* 	if(isMore == true)
	{
		assignid = "more_assignee_name";
		dropdownid ="more_myDropdown";
		id = "more_itmelist";	
	}
	else
	{
		assignid = "assignee_name";
		dropdownid ="myDropdown";
		id = "itmelist";
	} */
	
	assignid = "inputassigneeto_name";
		dropdownid ="myDropdown";
		id = "itmelist";
  var input, filter, ul, li, a, i;
  input = document.getElementById(assignid);
  filter = input.value.toUpperCase();
  div = document.getElementById(dropdownid);
  a = div.getElementsByTagName("a");
  
  
  
  
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
 
  
  if(document.getElementById(assignid).value == "")
  {
  	document.getElementById(id).style.display="none";
	document.getElementById(dropdownid).style.display="none";
  }
  else
  {
  	document.getElementById(id).style.display="block";
	document.getElementById(dropdownid).style.display="block";
  }
  
}


function closeCreateEvent()
{

 $("#taskname_id").val("");
	 $("#inputassigneeto_name").val("");
	$("#js-date").val("");
	$("#expand-js-date").val("");
	 $("#expanddue-js-date").val("");
 $("#time_sec").val("");
 $("#Total_days").val("");
 $("#repeat_sec").val("");
$("#Section_id").val("");
 $("#Description").val("");
 $("#expand-js-date").val("");
	$("#expanddue-js-date").val("");
$("#editedtaskid").val("");
 $("#Postuserid").val("");
$("#assignee_user").val("");
}


function taskSearch() {
	var input, filter, table, tr, td, i, txtValue;
	input = document.getElementById("tasksearch_id");
	filter = input.value.toUpperCase();
	table = document.getElementById("listof_tasktable");
	tr = table.getElementsByTagName("tr");
	for (i = 0; i < tr.length; i++) {
	  td = tr[i].getElementsByTagName("td")[0];
	  if (td) {
		txtValue = td.textContent || td.innerText;
		if (txtValue.toUpperCase().indexOf(filter) > -1) {
		  tr[i].style.display = "";
		} else {
		  tr[i].style.display = "none";
		}
	  }       
	}
  }

  /*function getCurretWeekcalendar() {
	//  var c = document.getElementsByClassName('').children;
	 //var i;
	 //for (i = 0; i < c.length; i++) {
	 //var user = c[i].getAttribute("id");
	 // alert(user);
	// }
	//
	getDashboardEvents();

	//2019-06-07 00:00
   
	let curr = new Date 
	let week = []
   
	for (let i = 1; i <= 7; i++) {
		let first = curr.getDate() - curr.getDay() + i 
		let day = new Date(curr.setDate(first)).toISOString().slice(0, 10)
		day = getFormatforDashboarEventsdate(day);
		week.push(day)
	}
	var table = document.getElementsByClassName("eventscalender");
	// var tr = table.getElementsByTagName("tr");
	var tr = $(".eventscalender").find('tr');
	for (i = 0; i < tr.length; i++) {
		td = tr[i].getElementsByTagName("td")[0];
		if (td) 
		{
			txtValue = td.getAttribute("aria-label");
			if (week.indexOf(txtValue) > -1)
				 tr[i].style.display = "";
			else
				 tr[i].style.display = "none";
		}       
	}
	$(".dhx_cal_prev_button").click(function(event) {
		event.preventDefault(); 
	});

	// $(".dashboard .eventscalender .dhx_cal_prev_button").addEventListener("click", function(event){
	//	event.preventDefault()
	// }); 
	// $(".dashboard.eventscalender.dhx_cal_prev_button").off("click");
	// $(".dashboard.eventscalender.dhx_cal_next_button").off("click");
	//$(".dashboard.eventscalender.dhx_cal_today_button").off("click"); 
}
	   

function getFormatforDashboarEventsdate(inputdate)
{
	var monthNames 	= ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct","Nov", "Dec"];
	var dayNames 	= ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	//inputdate 		= inputdate.replace(/-/g,'/');
	var date 		= new Date( inputdate);
	var day 		= date.getDate();
	var monthIndex 	= date.getMonth();
	var year 		= date.getFullYear();
	var time 		= formatAMPM( date ) ;
	
	var formatted_date ="";

	//formatted_date = monthNames[date.getMonth()] + " "+ date.getDate() + ", "+ date.getFullYear() + " "+time;
	formatted_date = date.getDate() + " "+ monthNames[date.getMonth()] + " "+ date.getFullYear();
	
	return formatted_date;
}

function getDashboardEvents()
{
	let current = new Date 
	let week_dash = []
	for (let i = 1; i <= 7; i++) {
	  let first = current.getDate() - current.getDay() + i 
	  let day = new Date(current.setDate(first)).toISOString().slice(0, 10)
	  day = getFormatforEventsdate(day);
	  day = day.split(" ")[0];
	  week_dash.push(day)
	}
	fs.readFile(EventsFile, function (err, data) {
		
		if(data ==	undefined) return;
		var Existngdata 	= 	JSON.parse(data)
		var ListofTasks 	= 	"";
		var entry_count 	= 	0;
		var taskdata		=	"";
		
		for (var i = 0; i < Existngdata.data.length; i++) {
			
			if(week_dash.indexOf(Existngdata.data[i].start_date.split(" ")[0]) < 0)
				$('div[event_id="'+Existngdata.data[i].id+'"]').hide();
		}
	});
}
*/

function soreRetention(fromUser, toUser, type, msg)
{
	var endpoint 	= 	ApiServerURL + "v1/user/XXAccesstokenXX/Urappinsertuserchatlog";
	var url 		=	"/apiCalling?Stype=soreRetention&company_id="+loggeduser.company_id+"&user_from="+fromUser+"&user_to="+toUser+"&file_type="+type+"&file_desc="+msg+"&linkUrl="+endpoint;
	
	$.get(url, function(response) {
		if(response.lenght > 0)
		{
			if(response[0].errcode == 0)
			{
				 if (window.Debug) console.log("successfuly saved");
			}
		}
	});
}

function getRetention(from, end)
{
	var endpoint 	= 	ApiServerURL + "v1/user/XXAccesstokenXX/Urappdesktopgetuserchatlog";
	var url 		=	"/apiCalling?Stype=getRetention&company_id="+loggeduser.company_id+"&from_date="+from+"&to_date="+end+"&linkUrl="+endpoint;
	
	$.get(url, function(response) {
		if(response.lenght > 0)
		{
			if(response[0].errcode == 0)
			{
				var jsonFrame 	= 	"{log:";
				for(var i=0; i<response.length; i++)
				{
					if(response[i].file_type == "txt")
					{
						if(i == response.length-1)
							jsonFrame += "{from:"+ response[i].user_from +", to:" + response[i].user_to + ", type:" +response[i].file_type+ ", message:" +response[i].file_desc+"}";
						else
							jsonFrame += "{from:"+ response[i].user_from +", to:" + response[i].user_to + ", type:" +response[i].file_type+ ", message:" +response[i].file_desc+"},";
					}
				}
				
				jsonFrame += "}";
				
				if(response.length != 0)
				{
					var temp 		= 	[];
					temp.id 		= 	"db-"+(jsxc.bid).split("@")[0]+"retentionList";		
					temp.from 		= 	from;
					temp.end 		= 	end;
					temp.frameData 	= 	jsonFrame;
					couchDbGetItem(getRetensionData, temp);
				}
			}
		}
	})
}

function getRetensionData(returnVal, returnData, inputsParam)
{
	var temp 			= 	{};
	var tid 			= 	uuidv4();
	temp.cid 			= 	tid;
	temp.requested 		= 	loggeduser.username;
	temp.dataRange 		= 	inputsParam.from +" To " +inputsParam.end;
	temp.requestedby 	= 	"";
	temp.status 		=	"Success";
	temp.data 			= 	inputsParam.frameData;
	
	if(returnVal = "success")
	{
		var result 		= 	returnData.MyData || [];
		result.push(temp);
		
		var input = {
			_id: inputsParam.id,
			_rev: returnData._rev,		
			MyData:result		
		};	
		couchDbPutItem(setRetensionData,input)
	}
	else
	{
		var storeData = [];
		storeData.push(temp);
		var input = {
			_id: inputsParam.id,	
			MyData:storeData		
		};
		couchDbPutItem(setRetensionData,input)
	}
}

function setRetensionData(returnVal, returnData, inputsParam)
{
	 if (window.Debug) console.log("returnVal",returnVal);
	 if (window.Debug) console.log("returnData",returnData);
	 if (window.Debug) console.log("inputsParam",inputsParam);
}

function uuidv4() {
  return 'xxx-xx-xxx'.replace(/[xy]/g, function(c) {
    var r 	= 	Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function retentionExpoList()
{
	var temp 	= 	[];
	temp.id 	= 	"db-"+window.loggeduser.sip_userid+"_retentionList";
	
	couchDbGetItem(getRetentionExpo, temp);
}

function getRetentionExpo(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{
		var jsondataList 	= 	returnData.MyData || [];
		if(jsondataList.length > 0)
		{
			var jsondata 	= 	JSON.parse(jsondataList.data);
			$('.dataretenWrite').empty();
			for(var i=0;i<jsondata.length; i++)
			{
				var date 	= 	getretenDate(jsondata[i].dataRange);
				var temp = '<div class="retentionDown" title="download" onclick=retentionDownload("'+jsondata[i].cid+'")><div>'+jsondata[i].requested+'</div><div>'+date+'</div><div>ALL</div><div>'+jsondata[i].status+'</div></div>';
				$('.dataretenWrite').append(temp);
			}
		}
	}
}

function getretenDate(input)
{
	var range 		= 	input.split(" To ");
	var fromDate 	= 	new Date(range[0]);
	var toDate 		= 	new Date(range[1]);
	
	return fromDate.getDate()+"-"+fromDate.getMonth()+"-"+fromDate.getFullYear()+" TO "+toDate.getDate()+"-"+toDate.getMonth()+"-"+toDate.getFullYear();
}

function retentionDownload(cid)
{
	var temp 	= 	[];
	temp.id 	= 	"db-"+loggeduser.sip_userid+"_retentionList";
	temp.cid 	= 	cid;
	couchDbGetItem(getRetentionDown, temp);
}

function getRetentionDown(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{
		var jsondataList = returnData.MyData || [];
		if(jsondataList.length > 0)
		{
			for(var k=0; k<jsondataList.length; k++)
			{
				if(inputsParam.cid == jsondataList[k].cid )
				{
					var dataIs 		= 	jsondataList[k].data;
					var date 		= 	new Date();
					var fileName 	=	date.getDate()+"-"+date.getMonth()+"-"+date.getFullYear()+"_log.log";
					var element 	= 	document.createElement('a');
					element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataIs));
					element.setAttribute('download', fileName);
					element.style.display 	= 	'none';
					document.body.appendChild(element);
					element.click();
					document.body.removeChild(element);
					return;
				}
			}
		}
	}
}

function checkRetenction(returnVal, returnData, inputsParam)
{
	if(returnVal == "success")
	{
		var result = returnData.MyData || [];
		if(result.length > 0)
		{
			var currentDate 	= 	new Date();
			var Rdate 			= 	new Date(result[0].data_retention_date);
			var NewRdate 		= 	new Date(result[0].data_retention_date);
			var day 			= 	result[0].data_retention_days;
			var Rtype 			= 	result[0].data_retention_type;

			if(Rtype == 1)	{ rentensionStatus = true; return}
			else if(Rtype == 2)	NewRdate.setDate(NewRdate.getDate() + 30); 
			else if(Rtype == 3)	NewRdate.setDate(NewRdate.getDate() + 60); 
			else if(Rtype == 4)	NewRdate.setDate(NewRdate.getDate() + 90); 
			else if(Rtype == 5)	NewRdate.setDate(NewRdate.getDate() + day);
			
			if ( (currentDate >= Rdate) && (currentDate <= NewRdate) )
			{
				rentensionStatus = true;
				return;
			}
		}
	}
	rentensionStatus = false;
}


function openContactwindow(item){

	closeSlide();
	if(window.LastChatWindow == item)	return;
	window.LastChatWindow = item;
	if(loadChatWin == "")
	{
		$.get('././chat-screen-contact.html', function(data) {
			loadChatWin = $(data).clone();
			showWindow(item);
		});
	}
	else
		showWindow(item);
};

function openGoogleDrive()
{
	$.get("/cloudShare", function(response) {
		 if (window.Debug) console.log("openDropBox response");
		var url = response;
		var childWin = window.open(url, "_blank", "height=400", "width=550", "status=yes", "toolbar=no", "menubar=no", "location=no","addressbar=no"); 
		if (childWin)
		{
			if (childWin.closed)
			{
				var returnValue = childWin.returnValue;
				//callback(returnValue);
			}
		}
	});
}

function openDropBox()
{
	$.get("/dropbox", function(response) {
		 if (window.Debug) console.log("openDropBox response");
		var url = response;
		var childWin = window.open(url, "_blank", "height=400", "width=550", "status=yes", "toolbar=no", "menubar=no", "location=no","addressbar=no"); 
		if (childWin)
		{
			if (childWin.closed)
			{
				var returnValue = childWin.returnValue;
				//callback(returnValue);
			}
		}
	});
}

function openBox()
{
	$.get("/openbox", function(response) {
		var url = response;
		var childWin = window.open(url, "_blank", "height=400", "width=550", "status=yes", "toolbar=no", "menubar=no", "location=no","addressbar=no"); 
		if (childWin)
		{
			if (childWin.closed)
			{
				var returnValue = childWin.returnValue;
				//callback(returnValue);
			}
		}
	});
}

function openEverNote()
{
	$.get("/evernote", function(response) {
		var url = response;
		var childWin = window.open(url, "_blank", "height=400", "width=550", "status=yes", "toolbar=no", "menubar=no", "location=no","addressbar=no"); 
		if (childWin)
		{
			if (childWin.closed)
			{
				var returnValue = childWin.returnValue;
				//callback(returnValue);
			}
		}
	});
}

function openOneDrive()
{
	$.get("/onedrive", function(response) {
		var url = response;
		var childWin = window.open(url, "_blank", "height=400", "width=550", "status=yes", "toolbar=no", "menubar=no", "location=no","addressbar=no"); 
		if (childWin)
		{
			if (childWin.closed)
			{
				var returnValue = childWin.returnValue;
				//callback(returnValue);
			}
		}
	});
}

function showWindow(item)
{	
	var data = jsxc.storage.getUserItem("buddy",item);
	if(data == null)
	{
		alert("something went wrong...");
		return false;
	}
	
	$('#ParentWindow').find("#ControlWindow .fixedscroll").remove();
	
	var openWin = $(loadChatWin.find('.fixedscroll')).clone();
	
		$("#ParentWindow").find(".taskall-sect").empty().append("<h4> No Record Found </h4>");
		$(openWin).find('[type="file"]').change(function(files) {
			var size 	= 	files.target.files.length;
			for (var i =0;i<size;i++)
			{
				var bid 	= 	window.LastChatWindow; 
				var file 	= 	files.target.files[i]; 
				var imgSrc 	= 	$(".img[title|='"+file.name+"']").attr('src');		
				var message = jsxc.gui.window.postMessage({
					bid: bid,
					direction: 'out',
					flag: false,
					attachment: {
						name: file.name,
						size: file.size,
						type: file.type,
						data: (file.type.match(/^image\//)) ? imgSrc : null
					}
				});
				jsxc.xmpp.httpUpload.sendFile(file, message);
				saveFileCouchdb(message._uid, bid, new Date(), file.name, file.type);
			}
		});
		$(openWin).find('.clkGiphy').click(function(files) {
			var giphy = $(loadChatWin.find('#stickers')).clone();
			$(giphy).find('.giftext').keydown(function(ev) 
			{		
				if ( ev.which == 13 )
				{
					$('.giffile').empty();
					if($(this).val() != "")	{	loadGif($(this).val());	}
				}
			});
			$('#ParentWindow').find("#ControlWindow").append(giphy);
		});
		
		$(openWin).find('.clkSmile').click(function(files) {
			var smile 		= 	$(loadChatWin.find('#emojis')).clone();
			var smilyTag 	= 	'<li onclick=emojiTxt(this) data-dismiss="modal">&#x1F601;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F602;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F603;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F604;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F605;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F606;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F609;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F60A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F60B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F60C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F60D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F60F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F612;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F613;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F614;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F616;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F618;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F61A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F61C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F61D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F61E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F620;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F621;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F622;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F623;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F624;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F625;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F628;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F629;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F62A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F62B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F62D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F630;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F631;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F632;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F633;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F635;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F637;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F638;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F639;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F63A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F63B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F63C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F63D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F63E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F63F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F640;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F645;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F646;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F647;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F648;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F649;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F64A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F64B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F64C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F64D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F64E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F64F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2702;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2705;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2708;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2709;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x270A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x270B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x270C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x270F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2712;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2714;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2716;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2728;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2733;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2734;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2744;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2747;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x274C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x274E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2753;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2754;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2755;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2757;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2764;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2795;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2796;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2797;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x27A1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x27B0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F680;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F683;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F684;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F685;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F687;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F689;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F68C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F68F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F691;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F692;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F693;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F695;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F697;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F699;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F69A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6AA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6AB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6AC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6AD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6BA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6BB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6BC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6BD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6BE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6C0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x24C2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F170;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F171;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F17E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F17F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F18E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F191;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F192;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F193;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F194;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F195;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F196;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F197;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F198;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F199;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F19A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1E9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1EA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1EC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1E7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1E8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1EF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1EB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1EA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1EE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1FA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1FA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F1F8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F201;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F202;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F21A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F22F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F232;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F233;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F234;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F235;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F236;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F237;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F238;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F239;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F23A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F250;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F251;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x00A9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x00AE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x203C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2049;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0023;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0038;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0039;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0037;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0030;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0036;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0035;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0034;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0033;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0032;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x0031;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x20E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2122;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2139;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2194;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2195;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2196;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2197;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2198;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2199;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x21A9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x21AA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x231A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x231B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x23E9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x23EA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x23EB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x23EC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x23F0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x23F3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25AA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25AB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25B6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25C0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25FB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25FC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25FD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x25FE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2600;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2601;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x260E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2611;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2614;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2615;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x261D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x263A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2648;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2649;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x264A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x264B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x264C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x264D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x264E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x264F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2650;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2651;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2652;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2653;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2660;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2663;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2665;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2666;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2668;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x267B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x267F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2693;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26A0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26A1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26AA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26AB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26BD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26BE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26C4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26C5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26CE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26D4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26EA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26F2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26F3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26F5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26FA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x26FD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2934;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2935;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2B05;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2B06;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2B07;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2B1B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2B1C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2B50;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x2B55;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x3030;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x303D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x3297;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x3299;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F004;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F0CF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F300;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F301;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F302;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F303;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F304;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F305;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F306;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F307;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F308;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F309;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F30A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F30B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F30C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F30F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F311;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F313;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F314;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F315;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F319;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F31B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F31F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F320;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F330;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F331;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F334;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F335;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F337;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F338;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F339;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F33A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F33B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F33C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F33D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F33E;</i><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F33F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F340;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F341;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F342;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F343;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F344;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F345;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F346;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F347;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F348;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F349;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F34A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F34C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F34D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F34E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F34F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F351;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F352;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F353;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F354;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F355;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F356;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F357;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F358;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F359;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F35A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F35B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F35C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F35D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F35E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F35F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F360;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F361;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F362;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F363;</li><li onclick=emojiTxt(this) data-dismiss="modal">#x1F364;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F365;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F366;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F367;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F368;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F369;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F36A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F36B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F36C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F36D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F36E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F36F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F370;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F371;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F372;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F373;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F374;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F375;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F376;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F377;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F378;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F379;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F37A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F37B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F380;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F381;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F382;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F383;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F384;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F385;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F386;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F387;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F388;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F389;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F38A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F38B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F38C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F38D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F38E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F38F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F390;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F391;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F392;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F393;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3A9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3AA;</li>li>&#x1F3AB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3AC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3AD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3AE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3AF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3B9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3BA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3BB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3BC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3BD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3BE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3BF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3CA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3EA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3EB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3EC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3ED;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3EE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3EF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3F0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F40C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F40D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F40E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F411;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F412;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F414;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F417;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F418;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F419;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F41A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F41B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F41C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F41D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F41E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F41F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F420;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F421;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F422;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F423;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F424;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F425;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F426;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F427;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F428;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F429;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F42B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F42C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F42D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F42E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F42F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F430;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F431;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F432;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F433;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F434;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F435;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F436;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F437;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F438;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F439;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F43A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F43B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F43C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F43D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F43E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F440;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F442;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F443;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F444;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F445;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F446;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F447;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F448;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F449;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F44A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F44B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F44C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F44D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F44E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F44F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F450;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F451;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F452;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F453;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F454;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F455;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F456;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F457;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F458;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F459;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F45A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F45B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F45C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F45D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F45E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F45F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F460;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F461;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F462;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F463;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F464;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F466;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F467;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F468;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F469;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F46A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F46B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F46E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F46F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F470;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F471;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F472;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F473;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F474;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F475;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F476;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F477;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F478;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F479;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F47A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F47B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F47C;</li>li>&#x1F47D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F47E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F47F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F480;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F481;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F482;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F483;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F484;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F485;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F486;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F487;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F488;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F489;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F48A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F48B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F48C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F48D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F48E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F48F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F490;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F491;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F492;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F493;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F494;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F495;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F496;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F497;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F498;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F499;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F49A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F49B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F49C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F49D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F49E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F49F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4A9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4AA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4AB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4AC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4AE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4AF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4BA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4BB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4BC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4BD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4BE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4BF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4C9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4CA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4CB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4CC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4CD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4CE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4CF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4D9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4DA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4DB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4DC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4DD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4DE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4DF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4E9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4EA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4EB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4EE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4FA;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4FB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4FC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F503;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F50A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F50B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F50C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F50D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F50E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F50F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F510;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F511;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F512;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F513;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F514;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F516;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F517;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F518;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F519;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F51A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F51B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F51C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F51D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F51E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F51F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F520;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F521;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F522;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F523;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F524;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F525;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F526;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F527;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F528;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F529;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F52A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F52B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F52E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F52F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F530;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F531;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F532;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F533;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F534;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F535;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F536;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F537;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F538;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F539;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F53A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F53B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F53C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F53D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F550;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F551;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F552;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F553;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F554;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F555;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F556;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F557;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F558;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F559;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F55A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F55B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F5FB;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F5FC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F5FD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F5FE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F5FF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F600;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F607;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F608;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F60E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F610;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F611;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F615;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F617;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F619;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F61B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F61F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F626;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F627;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F62C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F62E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F62F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F634;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F636;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F681;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F682;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F686;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F688;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F68A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F68D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F68E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F690;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F694;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F696;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F698;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F69B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F69C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F69D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F69E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F69F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6A6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6AE;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6AF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B0;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6B8;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6BF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6C1;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6C2;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6C3;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6C4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F6C5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F30D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F30E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F310;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F312;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F316;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F317;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F318;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F31A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F31C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F31D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F31E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F332;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F333;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F34B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F350;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F37C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3C9;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F3E4;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F400;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F401;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F402;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F403;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F404;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F405;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F406;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F407;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F408;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F409;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F40A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F40B;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F40F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F410;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F413;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F415;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F416;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F42A;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F465;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F46C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F46D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4AD;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B6;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4B7;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4EC;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4ED;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4EF;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F4F5;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F500;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F501;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F502;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F504;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F505;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F506;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F507;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F509;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F515;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F52C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F52D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F55C;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F55D;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F55E;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F55F;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F560;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F561;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F562;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F563;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F564;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F565;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F566;</li><li onclick=emojiTxt(this) data-dismiss="modal">&#x1F567;</li>';
			$(smile).find('.emojis').empty().append(smilyTag);
			$('#ParentWindow').find("#ControlWindow").append(smile);
		});
		$(openWin).find('.icon-Phone').click(function(files) {
			// CallNow(item.split("@")[0],"audio")
			 CallNow(data.extension, "audio");
		});
		$(openWin).find('.icon-Video').click(function(files) {
			 //CallNow(item.split("@")[0],"video")
			 CallNow(data.extension, "video");
		});

		$(openWin).find('.cloudGoogle').click(function(files) 	{	openGoogleDrive()	});
		$(openWin).find('.cloudDB').click(function(files) 		{	openDropBox()		});
		$(openWin).find('.cloudBox').click(function(files) 		{	openBox()			});
		$(openWin).find('.cloudEvrNot').click(function(files) 	{	openEverNote()		});
		$(openWin).find('.cloudODrive').click(function(files) 	{	openOneDrive()		});
		
	$('#ParentWindow').find("#ControlWindow").append(openWin);
	
	var moderatestatus 	= 	"images/green-active.svg";
	var usrName			= 	data.name;
	
	if (!item.includes("conference")) {
		var selfDetail 	= 	GetContactDetails(item.split("@")[0]);
		if(selfDetail.ImageURL != null)
			$('.head-img .customer-img').attr("src",selfDetail.ImageURL);	
		
		$('.CpostMail').find('span').text(selfDetail.email_id);
		if(selfDetail.user_status 	   == 	"Available")	moderatestatus = "images/green-active.svg";
		else if(selfDetail.user_status == 	"Busy")	moderatestatus = "images/grey.png";
		else if(selfDetail.user_status == 	"Do not disturb")	moderatestatus = "images/red.png";
		else if(selfDetail.user_status == 	"Invisible")	moderatestatus = "images/yellow.png";
		
		$('#ministatus').html(selfDetail.status_msg);
	}
	$('.head-img .dotactive').attr("src", moderatestatus);
	$('#chatName h3').html(usrName);
	
	$('.user-section h1').html('<img src="images/hand.svg"/><br>Welcome  ,'+usrName);
	
	var temp = '<li><a href="#" onclick=msgSetsoundConv("Default")>Sound default</a></li>'+
				'<li><a href="#" onclick=msgSetsoundConv("Ping")>Sound beep1</a></li>'+
				'<li><a href="#" onclick=msgSetsoundConv("Air")>Sound beep2</a></li>';
	$('#soundSettng').empty().append(temp);
	
	$('.CmarkUnread').click(function()	{	msgSetMarkUread();	});
	$('.Cfavourite').click(function()	{	msgSetFavourite();	});
	$('.CcloseConver').click(function()	{	msgSetCloseConv();	});
	$('.CpostMail').click(function()	{	postmail();			});
	
	$('.mute-notificationson').click(function()	{	msgSetMuteConv();	});
	
	$('.mute-desktop-notificationson').click(function()	{	msgSetDesktopConv();	});

		
	$("#myInput").on({
		input:function(){  
			if($(this).val() == "")
			{
				$("ul.bottom-charts").show();
				$("input.lake").hide();
			}
			else
			{
				$("ul.bottom-charts").hide();
				$("input.lake").show();
			}
		},
		keydown:function(ev){ 
	
			if (ev.keyCode == 13) {
				
				var is_editedid 	= 	"";
				var is_edited 		= 	false;
				var quotedmsg_id 	= 	"";
				var is_quoted 		= 	false;
				var quotemsg		= 	"";
				var QuoteTimeStamp 	=	"";
			
				var editcheck = $('#referenceTxt').find('#myInput').attr("msid") || "";
				$('#referenceTxt').find('#myInput').removeAttr("msid");
				
				if($("#referenceTxt").find('#quotesWin').length != 0)
				{
					quotedmsg_id 	= 	$("#quotesWin").attr("msid");
					is_quoted 		= 	true;
					quotemsg 		= 	$("#quotesWin").find('.quoteMsg').text();
					QuoteTimeStamp 	= 	$("#quotesWin").find('.quoteTime').text();
					$("#referenceTxt").find("#quotesWin").remove();
				}
				else if(editcheck != "")
				{
					is_editedid  			= 	ditcheck;
					is_edited 				= 	true;
					var exitingid 			= 	editcheck.replace("-",":");	
					var msgdata 			= 	jsxc.storage.getUserItem('msg', exitingid);
					msgdata.htmlMsg 		= 	$('#ParentWindow').find("#myInput").val();
					msgdata.msg 			= 	$('#ParentWindow').find("#myInput").val();
					msgdata.editedmsg_id 	= 	exitingid;
					msgdata.edited 			= 	is_edited;
					
					jsxc.storage.setUserItem('msg', exitingid, msgdata);
				}
				
				var msg = $('#ParentWindow').find("#myInput").val();
				if(msg == "")	return;
				
				var temp = [];
				var temp 				= 	[];
				temp.bid 				= 	window.LastChatWindow;
				temp.is_editedid 		= 	is_editedid;
				temp.is_edited 			= 	is_edited;
				temp.is_quoted	 		= 	is_quoted;
				temp.quotemsg  			= 	quotemsg; 
				temp.quotedmsg_id 		= 	quotedmsg_id;
				temp.QuoteTimeStamp 	= 	QuoteTimeStamp;
				temp.isflag 			= 	false;
				temp.msg 				= 	msg;
				
				sendMsg(temp);
				$('#ParentWindow').find("#myInput").val("");
			}
		}
	});
	
	$('#ControlWindow').find(".lake").on("click", function(){
				var is_editedid 	= 	"";
				var is_edited 		= 	false;
				var quotedmsg_id 	= 	"";
				var is_quoted 		= 	false;
				var quotemsg		= 	"";
				var QuoteTimeStamp 	=	"";
			
				var editcheck = $('#referenceTxt').find('#myInput').attr("msid") || "";
				$('#referenceTxt').find('#myInput').removeAttr("msid");
				
				if($("#referenceTxt").find('#quotesWin').length != 0)
				{
					quotedmsg_id 	= 	$("#quotesWin").attr("msid");
					is_quoted 		= 	true;
					quotemsg 		= 	$("#quotesWin").find('.quoteMsg').text();
					QuoteTimeStamp 	= 	$("#quotesWin").find('.quoteTime').text();
					$("#referenceTxt").find("#quotesWin").remove();
				}
				else if(editcheck != "")
				{
					is_editedid  			= 	ditcheck;
					is_edited 				= 	true;
					var exitingid 			= 	editcheck.replace("-",":");	
					var msgdata 			= 	jsxc.storage.getUserItem('msg', exitingid);
					msgdata.htmlMsg 		= 	$('#ParentWindow').find("#myInput").val();
					msgdata.msg 			= 	$('#ParentWindow').find("#myInput").val();
					msgdata.editedmsg_id 	= 	exitingid;
					msgdata.edited 			= 	is_edited;
					
					jsxc.storage.setUserItem('msg', exitingid, msgdata);
				}
				
				var msg = $('#ParentWindow').find("#myInput").val();
				if(msg == "")	return;
				
				var temp = [];
				var temp 				= 	[];
				temp.bid 				= 	window.LastChatWindow;
				temp.is_editedid 		= 	is_editedid;
				temp.is_edited 			= 	is_edited;
				temp.is_quoted	 		= 	is_quoted;
				temp.quotemsg  			= 	quotemsg; 
				temp.quotedmsg_id 		= 	quotedmsg_id;
				temp.QuoteTimeStamp 	= 	QuoteTimeStamp;
				temp.isflag 			= 	false;
				temp.msg 				= 	msg;
				
				sendMsg(temp);
				$('#ParentWindow').find("#myInput").val("");
	});
	
	loadPreMsg(window.LastChatWindow);
}

function emojiTxt(emoji)
{	
	var emoji 	= 	$(emoji).text()
	var text 	= 	$('#myInput').val();
	text 		+=  emoji;
	
	$('#myInput').val(text);
}
function sendMsg(temp)
{
	var data 	= 	jsxc.gui.window.postMessage({
		bid			 	 : 	temp.bid,
		direction		 : 	jsxc.Message.OUT,
		msg				 : 	temp.msg,
		flag			 : 	temp.isflag,
		editedmsg_id 	 : 	temp.is_editedid,
		edited 			 : 	temp.is_edited,
		quoted 			 : 	temp.is_quoted,
		quoted_id 		 : 	temp.quotedmsg_id,
		quoted_msg 		 : 	temp.quotemsg,
		quoted_timestamp : 	temp.QuoteTimeStamp
	});
	
	SaveChatRegister(temp.bid, temp.msg, new Date());
	//loadPreMsg(window.LastChatWindow);
}

function loadPreMsg(item)
{
	if(loadChatDetail == "")
	{
		$.get('././chat-screen-individual.html', function(data) {
			loadChatDetail 	= 	$(data).clone();
			loadMessage(item);
		});
	}
	else	loadMessage(item);
}
function loadMessage(item)
{
	var div 	=	 $('#chatwindow').find("#chatHeader").clone();
	$('#chatwindow').empty().append(div);
	
	var key		= 	loggeduser.sip_userid + jidSuffix;
	var history = 	localStorage.getItem("jsxc:"+key+":history:"+item+"") || [];
	if(history.length == 0)	return;
	
	history 	= 	JSON.parse(history);
	history.reverse();
	
	for(var k=0; k<history.length; k++)
	{
		var message = localStorage.getItem("jsxc:"+key+":msg:"+history[k]+"") || [];
		if(message.length == 0)	continue;
		
		message 		= 	JSON.parse(message);	
		var temp 		= 	"";
		var content 	= 	"";
		var img 		= 	"images/customer-img.png";
		var fromName 	= 	"";
		var toName 		= 	"";
		var data 		= 	"";
		if(item.includes("conference"))
			data = jsxc.storage.getUserItem('buddy', item);
		else
		{
			var id 		= 	(message.bid).split("@")[0];
			data 		= 	GetContactDetails(id);
		}
		if(data == null)	continue;
		
		if(message.direction == "out")
		{
			if(item.includes("conference"))
			{
				fromName 	= 	loggeduser.username
				toName		=	data.name;
			}
			else
			{
				img 		= 	loggeduser.profileUrl || "images/customer-img.png";
				fromName 	= 	loggeduser.username;
				toName		=	data.caller_id;
			}
			
		}
		else
		{
			if(item.includes("conference"))
			{
				fromName 	= 	data.name;
				toName		= 	loggeduser.username;
			}
			else
			{
				img 		= 	data.ImageURL || "images/list-name.png";
				fromName 	= 	data.caller_id;
				toName		=	loggeduser.username;
			}
		}

		if(message.quoted)
		{
			if(message.direction == "out")	content = $(loadChatDetail).find(".Quotmsg_Out").attr("id",(message._uid).replace(":","-")).clone();
			else	content = $(loadChatDetail).find(".Quotmsg_In").attr("id",(message._uid).replace(":","-")).clone();
			
			$(content).find('.quotFrom').text(fromName);
			$(content).find('.preQuot').text(message.quoted_msg);
			$(content).find('.msgTxt').text(message.msg);
		}
		else if( (message.mode != undefined) && (message.mode == 'createnote') )
		{
			if(message.direction == "out")	content = $(loadChatDetail).find(".NTmsg_Out").attr("id",(message._uid).replace(":","-")).clone();
			else	content = $(loadChatDetail).find(".NTmsg_In").attr("id",(message._uid).replace(":","-")).clone();
			$(content).find('.msgTxt').text('');
			$(content).find('.msgTxt').append('<span class="icon-Notes"></span>');
			$(content).find('.msgTxt').append(message.attachment.name);	
		}
		else if(message.isEvent)
		{
			if(message.direction == "out")	content = $(loadChatDetail).find(".EVTmsg_Out").attr("id",(message._uid).replace(":","-")).clone();
			else	content = $(loadChatDetail).find(".EVTmsg_In").attr("id",(message._uid).replace(":","-")).clone();
			
			$(content).find('#eventText').text(message.msg);
			var Starttime 			= message.eventdetails.Starttime;
			var Endtime 			= message.eventdetails.Endtime;
			var Scheduletime = convertGMTtoLocal(Starttime)+" - "+convertGMTtoLocal(Endtime);
			$(content).find('.eventTime').text(Scheduletime);
			
		}
		else if(message.isTask)
		{
			if(message.direction == "out")	content = $(loadChatDetail).find(".TSKmsg_Out").attr("id",(message._uid).replace(":","-")).clone();
			else	content = $(loadChatDetail).find(".TSKmsg_In").attr("id",(message._uid).replace(":","-")).clone();
			$(content).find('.viewdetailschat').text(message.msg);
		}

		else if(message.attachment)
		{
			if(message.direction == "out")	content = $(loadChatDetail).find(".FLSmsg_Out").attr("id",(message._uid).replace(":","-")).clone();
			else	content = $(loadChatDetail).find(".FLSmsg_In").attr("id",(message._uid).replace(":","-")).clone();
				
			var src	=	"";
			if( (message.msg !="") && (message.msg != undefined))
				src = message.msg;
			else if( (message.attachment.data != null)  && (message.attachment.data != undefined))
				src = message.attachment.data;
			else
				src = message.attachment.thumbnail;
			$(content).find('.flgMsg').attr("src",src);
		}
		else if(message.urlLink)
		{
			if(message.direction == "out")	content = $(loadChatDetail).find(".Lnkmsg_Out").attr("id",(message._uid).replace(":","-")).clone();
			else	content = $(loadChatDetail).find(".Lnkmsg_In").attr("id",(message._uid).replace(":","-")).clone();
			
			$(content).find('.msgTxt').text('');
			$(content).find('.msgTxt').append('<span class="icon-link-1 weblinks"></span>');
			$(content).find('.msgTxt').append(message.msg);		
		}
		else
		{
			if(message.direction == "out")
			{
				content = $(loadChatDetail).find(".NRmsg_Out").attr("id",(message._uid).replace(":","-")).clone();
				$(content).find('#msgSetting').attr("bid", jsxc.bid);
			}
			else
			{
				content = $(loadChatDetail).find(".NRmsg_In").attr("id",(message._uid).replace(":","-")).clone();
				$(content).find('#msgSetting').attr("bid", message.bid);
			}
			$(content).find('.msgTxt').text(message.msg);
		}
		
		$(content).find('#msgSetting').attr("mid",(message._uid).replace(":","-"));
		$(content).find('.chat-user-img').attr("src",img);
		$(content).find('.msgfrom').text(fromName);
		$(content).find('.msgfrom').append('<span>  in '+toName+'</span>');
		var len = (message.likelist).length || 0;
		if(len >0)
			$(content).find('.icon-thump_up').text(len);
		
		/*if(message.urlLink)
		{
			$(content).find('.msgTxt').text('');
			$(content).find('.msgTxt').append('<span class="icon-link-1 weblinks"></span>');
			$(content).find('.msgTxt').append(message.msg);
		}
		else
			$(content).find('.msgTxt').text(message.msg);
		*/
		
		$(content).find('.msgTime').text(jsxc.getFormattedTime(message.stamp));
		if(message._received)
			(content).find('.chat-process h6').append('<span class="icon-message-read">');
		if(message.bookmark)
			$(content).find('.icon-Bookmark-1').addClass("active");
		if(message.flag)
			$(content).find('.icon-Pin').addClass("active");
		if(message.direction == "in")
		{
			var temp = checkSelfLike(message._uid, jsxc.bid);
			if(temp)	{	$(content).find('.icon-thump_up').addClass("active");	}
		}
		
		$('#ControlWindow').find("#chatwindow").append(content);
		
		$(content).find('.msglike').click(function()
		{
			var mid 	= 	$(this).parent().attr("mid");
			var bid 	= 	$(this).parent().attr("bid");	
			var id 		= 	mid;
			if(id != undefined)
				id 	= 	id.replace("-",":");
			
			var msgdata = jsxc.storage.getUserItem('msg', id);
			if(msgdata == null)	return true;
			if(msgdata.direction == "out")	return;
			
			if( (msgdata != null) && (msgdata != undefined) )
			{			
				var temp = checkSelfLike(mid, jsxc.bid);
				if(temp)
				{
					$('#'+mid).find('.icon-thump_up').removeClass("active");
					likemessage(mid, bid, 'unlike');
				}
				else
				{
					$('#'+mid).find('.icon-thump_up').addClass("active");
					likemessage(mid, bid, 'like');
				}
			}
		});
		
		$(".msgbookM").unbind().click(function()
		{
			var mid 	= 	$(this).parent().attr("mid");
			var id 		= 	mid;
			if(id != undefined)
				id 	= 	id.replace("-",":");
			
			var result 	= 	jsxc.storage.getUserItem('msg', id);
			if(result == null)	return false;
			if(result.bookmark)	
			{	
				$('#'+mid).find('.icon-Bookmark-1').removeClass("active");
				setBookmark(id, false);
			}
			else
			{	
				$('#'+mid).find('.icon-Bookmark-1').addClass("active");
				setBookmark(id, true);
			}
		});
		
		$(".msgPin").unbind().click(function() {
			
			var mid 	= 	$(this).parent().attr("mid");
			var id		= 	mid;
			if(id != undefined)	id = id.replace("-",":");
			
			var result 	= 	jsxc.storage.getUserItem('msg', id);
			if(result == null)	return false;
			if(result.flag)
			{
				$('#'+mid).find('.icon-Pin').removeClass("active");
				setFlagMode(id, false);
			}
			else
			{
				$('#'+mid).find('.icon-Pin').addClass("active");
				setFlagMode(id, true);
			}
		});

		$(".msgMove").unbind().click(function()
		{
			var mid = $(this).parent().parent().parent().attr("mid");
			var popupCreateTask	 = 	$(loadDashBoardWin.find('#myModalnewposttasks')).clone();
			$(popupCreateTask).find('.SuggessionLst').empty();
			$('#ParentWindow').append(popupCreateTask);
			loadSuggessionList('', mid);
			
			 $(".suggessiontxt").keyup(function(){  
				var text	=	 $(this).val();
				loadSuggessionList(text, mid);
			});  
		});

		$(".msgQuote").unbind().click(function()
		{
			var mid	 	=	$(this).parent().parent().parent().attr("mid");
			var id 		= 	mid;
			if(id != undefined)	id = id.replace("-",":");
			var len = $('#referenceTxt').find('#quotesWin').length;
			if(len !=0)
				$('#referenceTxt').find('#quotesWin').remove();
			
			var quoteMsg = localStorage.getItem("jsxc:"+key+":msg:"+id+"") || [];
			if(quoteMsg.length == 0)	return;
			
			quoteMsg 	=	JSON.parse(quoteMsg);
			var img		=	"";
			var name  	= 	"";
			
			if(quoteMsg.direction == "in")
			{
				var data 	= 	GetContactDetails(quoteMsg.bid.split("@")[0]);
				img 		= 	data.ImageURL  || "images/list-name.png"
				name 		= 	data.first_name;
			}
			else{
				img 		= 	loggeduser.profileUrl	|| "images/list-name.png";
				name 		=	loggeduser.username;
			}
			
			var temp = '<div class="user-section" id="quotesWin" msid='+mid+'>\n'+								
					'<div class="member-image">\n'+
					'<img src='+img+' class="chat-user-img">\n'+
					'</div>\n'+
					'<div class="chat-section">	\n'+					
					'<img src="images/close.svg" class="closed">	\n'+
					'<h5>'+name+'</h5>\n'+
					'<div class="chat-process-overall">	\n'+								
					'<div class="chat-process">\n';
					if( (quoteMsg.mode != undefined) && (quoteMsg.mode == 'createnote') )
						temp += '<h2 class="quoteMsg">'+quoteMsg.attachment.name+'</h2>\n';
					else
						temp += '<h2 class="quoteMsg">'+quoteMsg.msg+'</h2>\n';
					'<h6 class="quoteTime">'+jsxc.getFormattedTime(quoteMsg.stamp)+'</h6>\n'+
					'</div>\n'+
					'</div>\n'+											
					'</div>\n'+								
					'</div>\n';
			
			$('#referenceTxt').prepend(temp);
			
			$('#referenceTxt').find('.closed').click(function()
			{
				$('#referenceTxt').find('#quotesWin').remove();
			});
		})
		$(".msgEdt").unbind().click(function()
		{
			var mid 	=	 $(this).parent().parent().parent().attr("mid");
			var id 		=	 mid;
			if(id != undefined)
				id = id.replace("-",":");
			
			var message = jsxc.storage.getUserItem('msg', id);
			if(message == null)	return false;
			
			if((message.mode != undefined) && (message.mode == 'createnote'))
			{
				var title 	=	 message.attachment.name;
				//openNtsWin();
				noteopen(title);
			}
			else
			{
				var msg 	=	 $('#'+mid).find("h2").html();
				if( (msg != "") && (msg != undefined) )
				{
					$('#referenceTxt').find('#myInput').attr("msid",mid);
					$('#referenceTxt').find('#myInput').val(msg);
				}
			}
		});
		$(".msgView").unbind().click(function()
		{
			var mid 	= 	 $(this).parent().parent().parent().attr("mid");
			var id 		= 	mid;
			if(id != undefined)
				id 	= 	id.replace("-",":");
			
			var message = jsxc.storage.getUserItem('msg', id);
			if(message == null)	return false;
			
			if((message.mode != undefined) && (message.mode == 'createnote'))
			{
				openNtsWin();
			}
		});
		$(".msgDel").unbind().click(function()
		{
			var mid 	= 	$(this).parent().parent().parent().attr("mid");
			var bid 	= 	$(this).parent().parent().parent().attr("bid");	
			var id 		= 	mid;
			if(id != undefined)
				id 	=	 id.replace("-",":");
			var message 	= jsxc.storage.getUserItem('msg', id);
			if(message == null)	return false;
			if(message.attachment)
				removeFileCouchDb(id);
			
			removeMessage(mid, bid);
		});
		
		//$("#"+(message._uid).replace(":","-")).focus();
	}
}

function loadSuggessionList(text, msid)
{
	$('.SuggessionLst').empty();
	var temp = "";
	for(var i=0; i<contacsarray.length; i++)
	{
		var data = contacsarray[i];
		if( (text != "") && (text != undefined))
		{	
			text = text.toUpperCase();
			if (!data.caller_id) continue;

			if(data.caller_id.toUpperCase().indexOf(text) == -1) 
				continue;
		}
		var img = data.ImageURL || "images/list-name.png";
		temp += '<li onClick=moveMessageById("'+data.sip_login_id+jidSuffix+'","'+msid+'") data-dismiss="modal">\n'+
			'<div class="name-images">\n'+
			'<img src='+img+' class="list-name-img">\n'+
			'</div>\n'+
			'<div class="name-images123"><p>'+data.caller_id+'<br><span>'+data.email_id+'</span></p></div>\n'+
			'</li>\n';
	}
	if(temp !="")
		$('.SuggessionLst').append(temp);
}
function moveMessageById(bid, msid)
{
	msid = msid.replace("-",":")
	var result = jsxc.storage.getUserItem('msg', msid);
	if(result == null)	return true; 
	
	var temp = [];
	var temp 			= 	[];
	temp.bid 			= 	bid;
	temp.is_editedid 	= 	"";
	temp.is_edited 		= 	false;
	temp.is_quoted	 	= 	false;
	temp.quotemsg  		= 	""; 
	temp.quotedmsg_id 	= 	"";
	temp.QuoteTimeStamp = 	"";
	temp.isflag 		= 	false;
	temp.msg 			= 	result.msg;
	sendMsg(temp);
	openContactwindow(bid);	
	removeMessage(msid, bid);
}

function loadSuggessionListTask(text)
{
	$('.SuggessionLst').empty();
	var temp = "";
	for(var i=0; i<contacsarray.length; i++)
	{
		var data = contacsarray[i];
		if( (text != "") && (text != undefined))
		{	
			text = text.toUpperCase();
			if (!data.caller_id) continue;

			if(data.caller_id.toUpperCase().indexOf(text) == -1) 
				continue;
		}
		var img = data.ImageURL || "images/list-name.png";
		temp += '<li onClick=getTaskDetail("'+data.sip_login_id+jidSuffix+'") data-dismiss="modal">\n'+
			'<div class="name-images">\n'+
			'<img src='+img+' class="list-name-img">\n'+
			'</div>\n'+
			'<div class="name-images123"><p>'+data.caller_id+'<br><span>'+data.email_id+'</span></p></div>\n'+
			'</li>\n';
	}
	if(temp !="")
		$('.SuggessionLst').append(temp);
}


function getTaskDetail(bid)
{
	 if (window.Debug) console.log("bid is",bid);
	var Taskname		= $("#taskname_id").val();
	var Assigneename	= $("#inputassigneeto_name").val();
	var AssigneeJid		= "";
	var expandstartdate = $("#expand-js-date").val();
	var expandenddate 	= $("#expanddue-js-date").val();
	var Duedate			= $("#Total_days").val();
	var Totaldays		= $("#Total_days").val();
	var repeat			= $("#repeat_sec option:selected" ).text();
	var sectionname		= $("#Section_id").val();
	var Description		= $("#Description").val();
	var starttime		= $("#expand-js-date").val();
	var EndTime			= $("#time_sec").val();
	var colorcheked 	= $("#myModaladdnew").find("input[name=taskcolor]:checked").val();
	var checkedcomponent	= "";
	var endtime	  		= "";
	var id = generateTaskID();
	if(Taskname == "" || Taskname == undefined || Taskname == null)	return;		

	if(starttime != "" && starttime != undefined)
	{	
		starttime 	= 	starttime.replace(/-/g,'/')
		starttime	= 	new Date(starttime)
		starttime 	= 	getFormatforEventsdate(starttime);
	}	
	
	if(expandenddate != "" && expandenddate != undefined)
	{	
		endtime 	= 	expandenddate.replace(/-/g,'/');
		endtime     = 	endtime;
		endtime		= 	new Date(endtime);
		endtime 	= 	getFormatforEventsdate(endtime);		
	}
	
	var dataext 	= 	GetContactDetails(bid.split("@")[0]);
	var posUserName = 	dataext.caller_id;
	var postUserJit = 	bid;
	
	//--- it should be changed
	Assigneename 	= 	dataext.caller_id;
	AssigneeJid 	= 	bid;
	//-----//
	
	var dataarray 	= 	{taskid: id, taskname : Taskname, starttime:starttime, Endtime: endtime, assignee:Assigneename, endtimesec:EndTime, totaldays:Totaldays, repeat: repeat, sectionname: sectionname, description:Description, postuser: postUserJit, complete: checkedcomponent, iscomplete:false, postusername: posUserName, completepercentage:"0%", assigneejid:AssigneeJid, color: colorcheked};
	
	$('#myModaladdnew').remove();
	$('.modal-backdrop ').remove();
	
	jsxc.gui.window.postMessage({
		bid				: 	bid,
		direction		: 	jsxc.Message.OUT,
		msg				: 	Taskname,
		flag			: 	false,
		editedmsg_id 	: 	"",
		edited 			: 	false,
		quoted 			: 	false,
		quoted_id 		: 	"",
		quoted_msg 		: 	"",
		quoted_timestamp : 	"",
		isEvent			:	false,
		eventdetails	:	"",
		isTask 			: 	true,
		taskdetails 	: 	dataarray
	});
}

function updateMSGidforTask(Taskid, msgID, taskdetails)
{
	var temp 			=	[];
	temp.id 			= 	"db-"+(jsxc.bid).split("@")[0]+"_tasks";
	temp.Taskid 		= 	Taskid;
	temp.msgID 			= 	msgID;
	temp.taskdetails 	=	taskdetails;
	
	couchDbGetItem(updateTasktoDB, temp);
}

function updateTasktoDB(returnVal, returnData, inputsParam)
{
	var temp 				= 	inputsParam.taskdetails;
	let reg 				= 	new Object();
	reg.id 					= 	temp.taskid;
	reg.taskname 			= 	temp.taskname;
	reg.starttime 			= 	temp.starttime;
	reg.endtime 			= 	temp.Endtime;
	reg.assignee 			= 	temp.assignee;
	reg.totaldays 			= 	temp.totaldays;
	reg.color 				= 	temp.color;
	reg.repeat 				= 	temp.repeat;
	reg.sectionname 		= 	temp.sectionname;
	reg.description 		= 	temp.description;
	reg.postuser			= 	temp.postuser
	reg.postusername		= 	temp.postusername
	reg.complete			= 	temp.complete;
	reg.isTask				= 	true;
	reg.isEvent				= 	false;
	reg.iscomplete			= 	false;
	reg.completepercentage	= 	"0%";
	reg.assigneejid			= 	temp.assigneejid
	reg.msgid 				= 	inputsParam.msgID;

	if(returnVal == "success")
	{
		var data = returnData.taskdetails || [];
		data.push(reg);	
		var input = {
			 _id: inputsParam.id,
			_rev: returnData._rev,
			taskdetails:data
		};
		couchDbPutItem(taskSuccessError, input, inputsParam);
	}
	else
	{
		var linkHistory = [];
		linkHistory.push(reg);
		var input = {
			_id: inputsParam.id,
			taskdetails: linkHistory
		};
		couchDbPutItem(taskSuccessError,input, inputsParam);
	}
	if($(".dashBoardWind").length !=0 )
		getDashboardTasklist();	
	else if($('.taskWin').length != 0)
		getTasklist();
}
},{"pouchdb":5}]},{},[14]);
