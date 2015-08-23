var global = Function("return this;")();
/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);
// pakmanager:xtend
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = extend
    
    function extend() {
        var target = {}
    
        for (var i = 0; i < arguments.length; i++) {
            var source = arguments[i]
    
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key]
                }
            }
        }
    
        return target
    }
    
  provide("xtend", module.exports);
}(global));

// pakmanager:through
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var Stream = require('stream')
    
    // through
    //
    // a stream that does nothing but re-emit the input.
    // useful for aggregating a series of changing but not ending streams into one stream)
    
    exports = module.exports = through
    through.through = through
    
    //create a readable writable stream.
    
    function through (write, end, opts) {
      write = write || function (data) { this.queue(data) }
      end = end || function () { this.queue(null) }
    
      var ended = false, destroyed = false, buffer = [], _ended = false
      var stream = new Stream()
      stream.readable = stream.writable = true
      stream.paused = false
    
    //  stream.autoPause   = !(opts && opts.autoPause   === false)
      stream.autoDestroy = !(opts && opts.autoDestroy === false)
    
      stream.write = function (data) {
        write.call(this, data)
        return !stream.paused
      }
    
      function drain() {
        while(buffer.length && !stream.paused) {
          var data = buffer.shift()
          if(null === data)
            return stream.emit('end')
          else
            stream.emit('data', data)
        }
      }
    
      stream.queue = stream.push = function (data) {
    //    console.error(ended)
        if(_ended) return stream
        if(data === null) _ended = true
        buffer.push(data)
        drain()
        return stream
      }
    
      //this will be registered as the first 'end' listener
      //must call destroy next tick, to make sure we're after any
      //stream piped from here.
      //this is only a problem if end is not emitted synchronously.
      //a nicer way to do this is to make sure this is the last listener for 'end'
    
      stream.on('end', function () {
        stream.readable = false
        if(!stream.writable && stream.autoDestroy)
          process.nextTick(function () {
            stream.destroy()
          })
      })
    
      function _end () {
        stream.writable = false
        end.call(stream)
        if(!stream.readable && stream.autoDestroy)
          stream.destroy()
      }
    
      stream.end = function (data) {
        if(ended) return
        ended = true
        if(arguments.length) stream.write(data)
        _end() // will emit or queue
        return stream
      }
    
      stream.destroy = function () {
        if(destroyed) return
        destroyed = true
        ended = true
        buffer.length = 0
        stream.writable = stream.readable = false
        stream.emit('close')
        return stream
      }
    
      stream.pause = function () {
        if(stream.paused) return
        stream.paused = true
        return stream
      }
    
      stream.resume = function () {
        if(stream.paused) {
          stream.paused = false
          stream.emit('resume')
        }
        drain()
        //may have become paused again,
        //as drain emits 'data'.
        if(!stream.paused)
          stream.emit('drain')
        return stream
      }
      return stream
    }
    
    
  provide("through", module.exports);
}(global));

// pakmanager:ap
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  exports = module.exports = ap;
    function ap (args, fn) {
        return function () {
            var rest = [].slice.call(arguments)
                , first = args.slice()
            first.push.apply(first, rest)
            return fn.apply(this, first);
        };
    }
    
    exports.pa = pa;
    function pa (args, fn) {
        return function () {
            var rest = [].slice.call(arguments)
            rest.push.apply(rest, args)
            return fn.apply(this, rest);
        };
    }
    
    exports.apa = apa;
    function apa (left, right, fn) {
        return function () {
            return fn.apply(this,
                left.concat.apply(left, arguments).concat(right)
            );
        };
    }
    
    exports.partial = partial;
    function partial (fn) {
        var args = [].slice.call(arguments, 1);
        return ap(args, fn);
    }
    
    exports.partialRight = partialRight;
    function partialRight (fn) {
        var args = [].slice.call(arguments, 1);
        return pa(args, fn);
    }
    
    exports.curry = curry;
    function curry (fn) {
        return partial(partial, fn);
    }
    
    exports.curryRight = function curryRight (fn) {
        return partial(partialRight, fn);
    }
    
  provide("ap", module.exports);
}(global));

// pakmanager:postgres-array
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict'
    
    exports.parse = function (source, transform) {
      return new ArrayParser(source, transform).parse()
    }
    
    function ArrayParser (source, transform) {
      this.source = source
      this.transform = transform || identity
      this.position = 0
      this.entries = []
      this.recorded = []
      this.dimension = 0
    }
    
    ArrayParser.prototype.isEof = function () {
      return this.position >= this.source.length
    }
    
    ArrayParser.prototype.nextCharacter = function () {
      var character = this.source[this.position++]
      if (character === '\\') {
        return {
          value: this.source[this.position++],
          escaped: true
        }
      }
      return {
        value: character,
        escaped: false
      }
    }
    
    ArrayParser.prototype.record = function (character) {
      this.recorded.push(character)
    }
    
    ArrayParser.prototype.newEntry = function (includeEmpty) {
      var entry
      if (this.recorded.length > 0 || includeEmpty) {
        entry = this.recorded.join('')
        if (entry === 'NULL' && !includeEmpty) {
          entry = null
        }
        if (entry !== null) entry = this.transform(entry)
        this.entries.push(entry)
        this.recorded = []
      }
    }
    
    ArrayParser.prototype.parse = function (nested) {
      var character, parser, quote
      while (!this.isEof()) {
        character = this.nextCharacter()
        if (character.value === '{' && !quote) {
          this.dimension++
          if (this.dimension > 1) {
            parser = new ArrayParser(this.source.substr(this.position - 1), this.transform)
            this.entries.push(parser.parse(true))
            this.position += parser.position - 2
          }
        } else if (character.value === '}' && !quote) {
          this.dimension--
          if (!this.dimension) {
            this.newEntry()
            if (nested) return this.entries
          }
        } else if (character.value === '"' && !character.escaped) {
          if (quote) this.newEntry(true)
          quote = !quote
        } else if (character.value === ',' && !quote) {
          this.newEntry()
        } else {
          this.record(character.value)
        }
      }
      if (this.dimension !== 0) {
        throw new Error('array dimension not balanced')
      }
      return this.entries
    }
    
    function identity (value) {
      return value
    }
    
  provide("postgres-array", module.exports);
}(global));

// pakmanager:postgres-bytea
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict'
    
    module.exports = function parseBytea (input) {
      if (/^\\x/.test(input)) {
        // new 'hex' style response (pg >9.0)
        return new Buffer(input.substr(2), 'hex')
      }
      var output = ''
      var i = 0
      while (i < input.length) {
        if (input[i] !== '\\') {
          output += input[i]
          ++i
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8))
            i += 4
          } else {
            var backslashes = 1
            while (i + backslashes < input.length && input[i + backslashes] === '\\') {
              backslashes++
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += '\\'
            }
            i += Math.floor(backslashes / 2) * 2
          }
        }
      }
      return new Buffer(output, 'binary')
    }
    
  provide("postgres-bytea", module.exports);
}(global));

// pakmanager:postgres-date
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict'
    
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?/
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})$/
    var TIME_ZONE = /([Z|+\-])(\d{2})?:?(\d{2})?:?(\d{2})?/
    var BC = /BC$/
    
    module.exports = function parseDate (isoDate) {
      var matches = DATE_TIME.exec(isoDate)
    
      if (!matches) {
        // Force YYYY-MM-DD dates to be parsed as local time
        return DATE.test(isoDate) ?
          new Date(isoDate + ' 00:00:00') :
          null
      }
    
      var isBC = BC.test(isoDate)
      var year = parseInt(matches[1], 10)
      var isFirstCentury = year > 0 && year < 100
      year = (isBC ? '-' : '') + year
    
      var month = parseInt(matches[2], 10) - 1
      var day = matches[3]
      var hour = parseInt(matches[4], 10)
      var minute = parseInt(matches[5], 10)
      var second = parseInt(matches[6], 10)
    
      var ms = matches[7]
      ms = ms ? 1000 * parseFloat(ms) : 0
    
      var date
      var offset = timeZoneOffset(isoDate)
      if (offset != null) {
        var utc = Date.UTC(year, month, day, hour, minute, second, ms)
        date = new Date(utc - offset)
      } else {
        date = new Date(year, month, day, hour, minute, second, ms)
      }
    
      if (isFirstCentury) {
        date.setUTCFullYear(year)
      }
    
      return date
    }
    
    // match timezones:
    // Z (UTC)
    // -05
    // +06:30
    var types = ['Z', '+', '-']
    function timeZoneOffset (isoDate) {
      var zone = TIME_ZONE.exec(isoDate.split(' ')[1])
      if (!zone) return
      var type = zone[1]
    
      if (!~types.indexOf(type)) {
        throw new Error('Unidentified time zone part: ' + type)
      }
      if (type === 'Z') {
        return 0
      }
      var sign = type === '-' ? -1 : 1
      var offset = parseInt(zone[2], 10) * 3600 +
        parseInt(zone[3] || 0, 10) * 60 +
        parseInt(zone[4] || 0, 10)
    
      return offset * sign * 1000
    }
    
  provide("postgres-date", module.exports);
}(global));

// pakmanager:postgres-interval
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict'
    
    var extend = require('xtend/mutable')
    
    module.exports = PostgresInterval
    
    function PostgresInterval (raw) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw)
      }
      extend(this, parse(raw))
    }
    var properties = ['seconds', 'minutes', 'hours', 'days', 'months', 'years']
    PostgresInterval.prototype.toPostgres = function () {
      return properties
        .filter(this.hasOwnProperty, this)
        .map(function (property) {
          return this[property] + ' ' + property
        }, this)
        .join(' ')
    }
    
    var NUMBER = '([+-]?\\d+)'
    var YEAR = NUMBER + '\\s+years?'
    var MONTH = NUMBER + '\\s+mons?'
    var DAY = NUMBER + '\\s+days?'
    var TIME = '([+-])?(\\d\\d):(\\d\\d):(\\d\\d):?(\\d\\d\\d)?'
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function (regexString) {
      return '(' + regexString + ')?'
    })
    .join('\\s*'))
    
    // Positions of values in regex match
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    }
    // We can use negative time
    var negatives = ['hours', 'minutes', 'seconds']
    
    function parse (interval) {
      if (!interval) return {}
      var matches = INTERVAL.exec(interval)
      var isNegative = matches[8] === '-'
      return Object.keys(positions)
        .reduce(function (parsed, property) {
          var position = positions[property]
          var value = matches[position]
          // no empty string
          if (!value) return parsed
          value = parseInt(value, 10)
          // no zeros
          if (!value) return parsed
          if (isNegative && ~negatives.indexOf(property)) {
            value *= -1
          }
          parsed[property] = value
          return parsed
        }, {})
    }
    
  provide("postgres-interval", module.exports);
}(global));

// pakmanager:split
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  //filter will reemit the data if cb(err,pass) pass is truthy
    
    // reduce is more tricky
    // maybe we want to group the reductions or emit progress updates occasionally
    // the most basic reduce just emits one 'data' event after it has recieved 'end'
    
    
    var through = require('through')
    var Decoder = require('string_decoder').StringDecoder
    
    module.exports = split
    
    //TODO pass in a function to map across the lines.
    
    function split (matcher, mapper, options) {
      var decoder = new Decoder()
      var soFar = ''
      var maxLength = options && options.maxLength;
      var trailing = options && options.trailing === false ? false : true
      if('function' === typeof matcher)
        mapper = matcher, matcher = null
      if (!matcher)
        matcher = /\r?\n/
    
      function emit(stream, piece) {
        if(mapper) {
          try {
            piece = mapper(piece)
          }
          catch (err) {
            return stream.emit('error', err)
          }
          if('undefined' !== typeof piece)
            stream.queue(piece)
        }
        else
          stream.queue(piece)
      }
    
      function next (stream, buffer) {
        var pieces = ((soFar != null ? soFar : '') + buffer).split(matcher)
        soFar = pieces.pop()
    
        if (maxLength && soFar.length > maxLength)
          stream.emit('error', new Error('maximum buffer reached'))
    
        for (var i = 0; i < pieces.length; i++) {
          var piece = pieces[i]
          emit(stream, piece)
        }
      }
    
      return through(function (b) {
        next(this, decoder.write(b))
      },
      function () {
        if(decoder.end)
          next(this, decoder.end())
        if(trailing && soFar != null)
          emit(this, soFar)
        this.queue(null)
      })
    }
    
  provide("split", module.exports);
}(global));

// pakmanager:buffer-writer
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  //binary data writer tuned for creating
    //postgres message packets as effeciently as possible by reusing the
    //same buffer to avoid memcpy and limit memory allocations
    var Writer = module.exports = function(size) {
      this.size = size || 1024;
      this.buffer = Buffer(this.size + 5);
      this.offset = 5;
      this.headerPosition = 0;
    };
    
    //resizes internal buffer if not enough size left
    Writer.prototype._ensure = function(size) {
      var remaining = this.buffer.length - this.offset;
      if(remaining < size) {
        var oldBuffer = this.buffer;
        this.buffer = new Buffer(oldBuffer.length + size);
        oldBuffer.copy(this.buffer);
      }
    };
    
    Writer.prototype.addInt32 = function(num) {
      this._ensure(4);
      this.buffer[this.offset++] = (num >>> 24 & 0xFF);
      this.buffer[this.offset++] = (num >>> 16 & 0xFF);
      this.buffer[this.offset++] = (num >>>  8 & 0xFF);
      this.buffer[this.offset++] = (num >>>  0 & 0xFF);
      return this;
    };
    
    Writer.prototype.addInt16 = function(num) {
      this._ensure(2);
      this.buffer[this.offset++] = (num >>>  8 & 0xFF);
      this.buffer[this.offset++] = (num >>>  0 & 0xFF);
      return this;
    };
    
    //for versions of node requiring 'length' as 3rd argument to buffer.write
    var writeString = function(buffer, string, offset, len) {
      buffer.write(string, offset, len);
    };
    
    //overwrite function for older versions of node
    if(Buffer.prototype.write.length === 3) {
      writeString = function(buffer, string, offset, len) {
        buffer.write(string, offset);
      };
    }
    
    Writer.prototype.addCString = function(string) {
      //just write a 0 for empty or null strings
      if(!string) {
        this._ensure(1);
      } else {
        var len = Buffer.byteLength(string);
        this._ensure(len + 1); //+1 for null terminator
        writeString(this.buffer, string, this.offset, len);
        this.offset += len;
      }
    
      this.buffer[this.offset++] = 0; // null terminator
      return this;
    };
    
    Writer.prototype.addChar = function(c) {
      this._ensure(1);
      writeString(this.buffer, c, this.offset, 1);
      this.offset++;
      return this;
    };
    
    Writer.prototype.addString = function(string) {
      string = string || "";
      var len = Buffer.byteLength(string);
      this._ensure(len);
      this.buffer.write(string, this.offset);
      this.offset += len;
      return this;
    };
    
    Writer.prototype.getByteLength = function() {
      return this.offset - 5;
    };
    
    Writer.prototype.add = function(otherBuffer) {
      this._ensure(otherBuffer.length);
      otherBuffer.copy(this.buffer, this.offset);
      this.offset += otherBuffer.length;
      return this;
    };
    
    Writer.prototype.clear = function() {
      this.offset = 5;
      this.headerPosition = 0;
      this.lastEnd = 0;
    };
    
    //appends a header block to all the written data since the last
    //subsequent header or to the beginning if there is only one data block
    Writer.prototype.addHeader = function(code, last) {
      var origOffset = this.offset;
      this.offset = this.headerPosition;
      this.buffer[this.offset++] = code;
      //length is everything in this packet minus the code
      this.addInt32(origOffset - (this.headerPosition+1));
      //set next header position
      this.headerPosition = origOffset;
      //make space for next header
      this.offset = origOffset;
      if(!last) {
        this._ensure(5);
        this.offset += 5;
      }
    };
    
    Writer.prototype.join = function(code) {
      if(code) {
        this.addHeader(code, true);
      }
      return this.buffer.slice(code ? 0 : 5, this.offset);
    };
    
    Writer.prototype.flush = function(code) {
      var result = this.join(code);
      this.clear();
      return result;
    };
    
  provide("buffer-writer", module.exports);
}(global));

// pakmanager:generic-pool
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var PriorityQueue = function(size) {
      var me = {}, slots, i, total = null;
    
      // initialize arrays to hold queue elements
      size = Math.max(+size | 0, 1);
      slots = [];
      for (i = 0; i < size; i += 1) {
        slots.push([]);
      }
    
      //  Public methods
      me.size = function () {
        var i;
        if (total === null) {
          total = 0;
          for (i = 0; i < size; i += 1) {
            total += slots[i].length;
          }
        }
        return total;
      };
    
      me.enqueue = function (obj, priority) {
        var priorityOrig;
    
        // Convert to integer with a default value of 0.
        priority = priority && + priority | 0 || 0;
    
        // Clear cache for total.
        total = null;
        if (priority) {
          priorityOrig = priority;
          if (priority < 0 || priority >= size) {
            priority = (size - 1);
            // put obj at the end of the line
            console.error("invalid priority: " + priorityOrig + " must be between 0 and " + priority);
          }
        }
    
        slots[priority].push(obj);
      };
    
      me.dequeue = function (callback) {
        var obj = null, i, sl = slots.length;
    
        // Clear cache for total.
        total = null;
        for (i = 0; i < sl; i += 1) {
          if (slots[i].length) {
            obj = slots[i].shift();
            break;
          }
        }
        return obj;
      };
    
      return me;
    };
    
    /**
     * Generate an Object pool with a specified `factory`.
     *
     * @param {Object} factory
     *   Factory to be used for generating and destorying the items.
     * @param {String} factory.name
     *   Name of the factory. Serves only logging purposes.
     * @param {Function} factory.create
     *   Should create the item to be acquired,
     *   and call it's first callback argument with the generated item as it's argument.
     * @param {Function} factory.destroy
     *   Should gently close any resources that the item is using.
     *   Called before the items is destroyed.
     * @param {Function} factory.validate
     *   Should return true if connection is still valid and false
     *   If it should be removed from pool. Called before item is
     *   acquired from pool.
     * @param {Number} factory.max
     *   Maximum number of items that can exist at the same time.  Default: 1.
     *   Any further acquire requests will be pushed to the waiting list.
     * @param {Number} factory.min
     *   Minimum number of items in pool (including in-use). Default: 0.
     *   When the pool is created, or a resource destroyed, this minimum will
     *   be checked. If the pool resource count is below the minimum, a new
     *   resource will be created and added to the pool.
     * @param {Number} factory.idleTimeoutMillis
     *   Delay in milliseconds after the idle items in the pool will be destroyed.
     *   And idle item is that is not acquired yet. Waiting items doesn't count here.
     * @param {Number} factory.reapIntervalMillis
     *   Cleanup is scheduled in every `factory.reapIntervalMillis` milliseconds.
     * @param {Boolean|Function} factory.log
     *   Whether the pool should log activity. If function is specified,
     *   that will be used instead. The function expects the arguments msg, loglevel
     * @param {Number} factory.priorityRange
     *   The range from 1 to be treated as a valid priority
     * @param {RefreshIdle} factory.refreshIdle
     *   Should idle resources be destroyed and recreated every idleTimeoutMillis? Default: true.
     * @param {Bool} [factory.returnToHead=false]
     *   Returns released object to head of available objects list
     * @returns {Object} An Object pool that works with the supplied `factory`.
     */
    exports.Pool = function (factory) {
      var me = {},
    
          idleTimeoutMillis = factory.idleTimeoutMillis || 30000,
          reapInterval = factory.reapIntervalMillis || 1000,
          refreshIdle = ('refreshIdle' in factory) ? factory.refreshIdle : true,
          availableObjects = [],
          waitingClients = new PriorityQueue(factory.priorityRange || 1),
          count = 0,
          removeIdleScheduled = false,
          removeIdleTimer = null,
          draining = false,
          returnToHead = factory.returnToHead || false,
    
          // Prepare a logger function.
          log = factory.log ?
            (function (str, level) {
               if (typeof factory.log === 'function') {
                 factory.log(str, level);
               }
               else {
                 console.log(level.toUpperCase() + " pool " + factory.name + " - " + str);
               }
             }
            ) :
            function () {};
    
      factory.validate = factory.validate || function() { return true; };
            
      factory.max = parseInt(factory.max, 10);
      factory.min = parseInt(factory.min, 10);
      
      factory.max = Math.max(isNaN(factory.max) ? 1 : factory.max, 1);
      factory.min = Math.min(isNaN(factory.min) ? 0 : factory.min, factory.max-1);
      
      ///////////////
    
      /**
       * Request the client to be destroyed. The factory's destroy handler
       * will also be called.
       *
       * This should be called within an acquire() block as an alternative to release().
       *
       * @param {Object} obj
       *   The acquired item to be destoyed.
       */
      me.destroy = function(obj) {
        count -= 1;
        availableObjects = availableObjects.filter(function(objWithTimeout) {
                  return (objWithTimeout.obj !== obj);
        });
        factory.destroy(obj);
        
        ensureMinimum();
      };
    
      /**
       * Checks and removes the available (idle) clients that have timed out.
       */
      function removeIdle() {
        var toRemove = [],
            now = new Date().getTime(),
            i,
            al, tr,
            timeout;
    
        removeIdleScheduled = false;
    
        // Go through the available (idle) items,
        // check if they have timed out
        for (i = 0, al = availableObjects.length; i < al && (refreshIdle || (count - factory.min > toRemove.length)); i += 1) {
          timeout = availableObjects[i].timeout;
          if (now >= timeout) {
            // Client timed out, so destroy it.
            log("removeIdle() destroying obj - now:" + now + " timeout:" + timeout, 'verbose');
            toRemove.push(availableObjects[i].obj);
          } 
        }
    
        for (i = 0, tr = toRemove.length; i < tr; i += 1) {
          me.destroy(toRemove[i]);
        }
    
        // Replace the available items with the ones to keep.
        al = availableObjects.length;
    
        if (al > 0) {
          log("availableObjects.length=" + al, 'verbose');
          scheduleRemoveIdle();
        } else {
          log("removeIdle() all objects removed", 'verbose');
        }
      }
    
    
      /**
       * Schedule removal of idle items in the pool.
       *
       * More schedules cannot run concurrently.
       */
      function scheduleRemoveIdle() {
        if (!removeIdleScheduled) {
          removeIdleScheduled = true;
          removeIdleTimer = setTimeout(removeIdle, reapInterval);
        }
      }
    
      /**
       * Handle callbacks with either the [obj] or [err, obj] arguments in an
       * adaptive manner. Uses the `cb.length` property to determine the number
       * of arguments expected by `cb`.
       */
      function adjustCallback(cb, err, obj) {
        if (!cb) return;
        if (cb.length <= 1) {
          cb(obj);
        } else {
          cb(err, obj);
        }
      }
    
      /**
       * Try to get a new client to work, and clean up pool unused (idle) items.
       *
       *  - If there are available clients waiting, shift the first one out (LIFO),
       *    and call its callback.
       *  - If there are no waiting clients, try to create one if it won't exceed
       *    the maximum number of clients.
       *  - If creating a new client would exceed the maximum, add the client to
       *    the wait list.
       */
      function dispense() {
        var obj = null,
            objWithTimeout = null,
            err = null,
            clientCb = null,
            waitingCount = waitingClients.size();
            
        log("dispense() clients=" + waitingCount + " available=" + availableObjects.length, 'info');
        if (waitingCount > 0) {
          while (availableObjects.length > 0) {
            log("dispense() - reusing obj", 'verbose');
            objWithTimeout = availableObjects[0];
            if (!factory.validate(objWithTimeout.obj)) {
              me.destroy(objWithTimeout.obj);
              continue;
            }
            availableObjects.shift();
            clientCb = waitingClients.dequeue();
            return clientCb(err, objWithTimeout.obj);
          }
          if (count < factory.max) {
            createResource();
          }
        }
      }
      
      function createResource() {
        count += 1;
        log("createResource() - creating obj - count=" + count + " min=" + factory.min + " max=" + factory.max, 'verbose');
        factory.create(function () {
          var err, obj;
          var clientCb = waitingClients.dequeue();
          if (arguments.length > 1) {
            err = arguments[0];
            obj = arguments[1];
          } else {
            err = (arguments[0] instanceof Error) ? arguments[0] : null;
            obj = (arguments[0] instanceof Error) ? null : arguments[0];
          }
          if (err) {
            count -= 1;
            if (clientCb) {
              clientCb(err, obj);
            }
            process.nextTick(function(){
              dispense();
            });
          } else {
            if (clientCb) {
              clientCb(err, obj);
            } else {
              me.release(obj);
            }
          }
        });
      }
      
      function ensureMinimum() {
        var i, diff;
        if (!draining && (count < factory.min)) {
          diff = factory.min - count;
          for (i = 0; i < diff; i++) {
            createResource();
          }
        }
      }
    
      /**
       * Request a new client. The callback will be called,
       * when a new client will be availabe, passing the client to it.
       *
       * @param {Function} callback
       *   Callback function to be called after the acquire is successful.
       *   The function will receive the acquired item as the first parameter.
       *
       * @param {Number} priority
       *   Optional.  Integer between 0 and (priorityRange - 1).  Specifies the priority
       *   of the caller if there are no available resources.  Lower numbers mean higher
       *   priority.
       *
       * @returns {Object} `true` if the pool is not fully utilized, `false` otherwise.
       */
      me.acquire = function (callback, priority) {
        if (draining) {
          throw new Error("pool is draining and cannot accept work");
        }
        waitingClients.enqueue(callback, priority);
        dispense();
        return (count < factory.max);
      };
    
      me.borrow = function (callback, priority) {
        log("borrow() is deprecated. use acquire() instead", 'warn');
        me.acquire(callback, priority);
      };
    
      /**
       * Return the client to the pool, in case it is no longer required.
       *
       * @param {Object} obj
       *   The acquired object to be put back to the pool.
       */
      me.release = function (obj) {
    	// check to see if this object has already been released (i.e., is back in the pool of availableObjects)
        if (availableObjects.some(function(objWithTimeout) { return (objWithTimeout.obj === obj); })) {
          log("release called twice for the same resource: " + (new Error().stack), 'error');
          return;
        }
        //log("return to pool");
        var objWithTimeout = { obj: obj, timeout: (new Date().getTime() + idleTimeoutMillis) };
        if(returnToHead){
          availableObjects.splice(0, 0, objWithTimeout);      
        }
        else{
          availableObjects.push(objWithTimeout);  
        }    
        log("timeout: " + objWithTimeout.timeout, 'verbose');
        dispense();
        scheduleRemoveIdle();
      };
    
      me.returnToPool = function (obj) {
        log("returnToPool() is deprecated. use release() instead", 'warn');
        me.release(obj);
      };
    
      /**
       * Disallow any new requests and let the request backlog dissapate.
       *
       * @param {Function} callback
       *   Optional. Callback invoked when all work is done and all clients have been
       *   released.
       */
      me.drain = function(callback) {
        log("draining", 'info');
    
        // disable the ability to put more work on the queue.
        draining = true;
    
        var check = function() {
          if (waitingClients.size() > 0) {
            // wait until all client requests have been satisfied.
            setTimeout(check, 100);
          } else if (availableObjects.length != count) {
            // wait until all objects have been released.
            setTimeout(check, 100);
          } else {
            if (callback) {
              callback();
            }
          }
        };
        check();
      };
    
      /**
       * Forcibly destroys all clients regardless of timeout.  Intended to be
       * invoked as part of a drain.  Does not prevent the creation of new
       * clients as a result of subsequent calls to acquire.
       *
       * Note that if factory.min > 0, the pool will destroy all idle resources
       * in the pool, but replace them with newly created resources up to the
       * specified factory.min value.  If this is not desired, set factory.min
       * to zero before calling destroyAllNow()
       *
       * @param {Function} callback
       *   Optional. Callback invoked after all existing clients are destroyed.
       */
      me.destroyAllNow = function(callback) {
        log("force destroying all objects", 'info');
        var willDie = availableObjects;
        availableObjects = [];
        var obj = willDie.shift();
        while (obj !== null && obj !== undefined) {
          me.destroy(obj.obj);
          obj = willDie.shift();
        }
        removeIdleScheduled = false;
        clearTimeout(removeIdleTimer);
        if (callback) {
          callback();
        }
      };
    
      /**
       * Decorates a function to use a acquired client from the object pool when called.
       *
       * @param {Function} decorated
       *   The decorated function, accepting a client as the first argument and 
       *   (optionally) a callback as the final argument.
       *
       * @param {Number} priority
       *   Optional.  Integer between 0 and (priorityRange - 1).  Specifies the priority
       *   of the caller if there are no available resources.  Lower numbers mean higher
       *   priority.
       */
      me.pooled = function(decorated, priority) {
        return function() {
          var callerArgs = arguments;
          var callerCallback = callerArgs[callerArgs.length - 1];
          var callerHasCallback = typeof callerCallback === 'function';
          me.acquire(function(err, client) {
            if(err) {
              if(callerHasCallback) {
                callerCallback(err);
              }
              return;
            }
    
            var args = [client].concat(Array.prototype.slice.call(callerArgs, 0, callerHasCallback ? -1 : undefined));
            args.push(function() {
              me.release(client);
              if(callerHasCallback) {
                callerCallback.apply(null, arguments);
              }
            });
            
            decorated.apply(null, args);
          }, priority);
        };
      };
    
      me.getPoolSize = function() {
        return count;
      };
    
      me.getName = function() {
        return factory.name;
      };
    
      me.availableObjectsCount = function() {
        return availableObjects.length;
      };
    
      me.waitingClientsCount = function() {
        return waitingClients.size();
      };
    
      me.getMaxPoolSize = function(){
        return factory.max;
      }
    
      // create initial resources (if factory.min > 0)
      ensureMinimum();
    
      return me;
    };
    
  provide("generic-pool", module.exports);
}(global));

// pakmanager:packet-reader
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var assert = require('assert')
    
    var Reader = module.exports = function(options) {
      //TODO - remove for version 1.0
      if(typeof options == 'number') {
        options = { headerSize: options }
      }
      options = options || {}
      this.offset = 0
      this.lastChunk = false
      this.chunk = null
      this.headerSize = options.headerSize || 0
      this.lengthPadding = options.lengthPadding || 0
      this.header = null
      assert(this.headerSize < 2, 'pre-length header of more than 1 byte length not currently supported')
    }
    
    Reader.prototype.addChunk = function(chunk) {
      this.offset = 0
      this.chunk = chunk
      if(this.lastChunk) {
        this.chunk = Buffer.concat([this.lastChunk, this.chunk])
        this.lastChunk = false
      }
    }
    
    Reader.prototype._save = function() {
      //save any unread chunks for next read
      if(this.offset < this.chunk.length) {
        this.lastChunk = this.chunk.slice(this.offset)
      }
      return false
    }
    
    Reader.prototype.read = function() {
      if(this.chunk.length < (this.headerSize + 4 + this.offset)) {
        return this._save()
      }
    
      if(this.headerSize) {
        this.header = this.chunk[this.offset]
      }
    
      //read length of next item
      var length = this.chunk.readUInt32BE(this.offset + this.headerSize) + this.lengthPadding
    
      //next item spans more chunks than we have
      var remaining = this.chunk.length - (this.offset + 4 + this.headerSize)
      if(length > remaining) {
        return this._save()
      }
    
      this.offset += (this.headerSize + 4)
      var result = this.chunk.slice(this.offset, this.offset + length)
      this.offset += length
      return result
    }
    
  provide("packet-reader", module.exports);
}(global));

// pakmanager:pg-connection-string
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict';
    
    var url = require('url');
    
    //Parse method copied from https://github.com/brianc/node-postgres
    //Copyright (c) 2010-2014 Brian Carlson (brian.m.carlson@gmail.com)
    //MIT License
    
    //parses a connection string
    function parse(str) {
      var config;
      //unix socket
      if(str.charAt(0) === '/') {
        config = str.split(' ');
        return { host: config[0], database: config[1] };
      }
      // url parse expects spaces encoded as %20
      if(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/\%25(\d\d)/g, "%$1");
      }
      var result = url.parse(str, true);
      config = {};
    
      if (result.query.application_name) {
        config.application_name = result.query.application_name;
      }
      if (result.query.fallback_application_name) {
        config.fallback_application_name = result.query.fallback_application_name;
      }
    
      config.port = result.port;
      if(result.protocol == 'socket:') {
        config.host = decodeURI(result.pathname);
        config.database = result.query.db;
        config.client_encoding = result.query.encoding;
        return config;
      }
      config.host = result.hostname;
    
      // result.pathname is not always guaranteed to have a '/' prefix (e.g. relative urls)
      // only strip the slash if it is present.
      var pathname = result.pathname;
      if (pathname && pathname.charAt(0) === '/') {
        pathname = result.pathname.slice(1) || null;
      }
      config.database = pathname && decodeURI(pathname);
    
      var auth = (result.auth || ':').split(':');
      config.user = auth[0];
      config.password = auth.splice(1).join(':');
    
      var ssl = result.query.ssl;
      if (ssl === 'true' || ssl === '1') {
        config.ssl = true;
      }
    
      return config;
    }
    
    module.exports = {
      parse: parse
    };
    
  provide("pg-connection-string", module.exports);
}(global));

// pakmanager:pg-types/lib/textParsers
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var array = require('postgres-array')
    var ap = require('ap')
    var arrayParser = require(__dirname + "/arrayParser.js");
    var parseDate = require('postgres-date');
    var parseInterval = require('postgres-interval');
    var parseByteA = require('postgres-bytea');
    
    function allowNull (fn) {
      return function nullAllowed (value) {
        if (value === null) return value
        return fn(value)
      }
    }
    
    function parseBool (value) {
      if (value === null) return value
      return value === 't';
    }
    
    function parseBoolArray (value) {
      if (!value) return null
      return array.parse(value, parseBool)
    }
    
    function parseIntegerArray (value) {
      if (!value) return null
      return array.parse(value, allowNull(ap.partialRight(parseInt, 10)))
    }
    
    function parseBigIntegerArray (value) {
      if (!value) return null
      return array.parse(value, allowNull(function (entry) {
        return parseBigInteger(entry).trim()
      }))
    }
    
    var parseFloatArray = function(value) {
      if(!value) { return null; }
      var p = arrayParser.create(value, function(entry) {
        if(entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
    
      return p.parse();
    };
    
    var parseStringArray = function(value) {
      if(!value) { return null; }
    
      var p = arrayParser.create(value);
      return p.parse();
    };
    
    var parseDateArray = function(value) {
      if (!value) { return null; }
    
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
    
      return p.parse();
    };
    
    var parseByteAArray = function(value) {
      var arr = parseStringArray(value);
      if (!arr) return arr;
    
      return arr.map(function(element) {
        return parseByteA(element);
      });
    };
    
    var parseInteger = function(value) {
      return parseInt(value, 10);
    };
    
    var parseBigInteger = function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) { return valStr; }
      return value;
    };
    
    var parseJsonArray = function(value) {
      var arr = parseStringArray(value);
    
      if (!arr) {
        return arr;
      }
    
      return arr.map(function(el) { return JSON.parse(el); });
    };
    
    var parsePoint = function(value) {
      if (value[0] !== '(') { return null; }
    
      value = value.substring( 1, value.length - 1 ).split(',');
    
      return {
        x: parseFloat(value[0])
      , y: parseFloat(value[1])
      };
    };
    
    var parseCircle = function(value) {
      if (value[0] !== '<' && value[1] !== '(') { return null; }
    
      var point = '(';
      var radius = '';
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++){
        if (!pointParsed) {
          point += value[i];
        }
    
        if (value[i] === ')') {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
    
        if (value[i] === ','){
          continue;
        }
    
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
    
      return result;
    };
    
    var init = function(register) {
      register(20, parseBigInteger); // int8
      register(21, parseInteger); // int2
      register(23, parseInteger); // int4
      register(26, parseInteger); // oid
      register(700, parseFloat); // float4/real
      register(701, parseFloat); // float8/double
      register(16, parseBool);
      register(1082, parseDate); // date
      register(1114, parseDate); // timestamp without timezone
      register(1184, parseDate); // timestamp
      register(600, parsePoint); // point
      register(718, parseCircle); // circle
      register(1000, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray); // _int2
      register(1007, parseIntegerArray); // _int4
      register(1016, parseBigIntegerArray); // _int8
      register(1021, parseFloatArray); // _float4
      register(1022, parseFloatArray); // _float8
      register(1231, parseFloatArray); // _numeric
      register(1014, parseStringArray); //char
      register(1015, parseStringArray); //varchar
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1115, parseDateArray); // timestamp without time zone[]
      register(1182, parseDateArray); // _date
      register(1185, parseDateArray); // timestamp with time zone[]
      register(1186, parseInterval);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON)); // json
      register(3802, JSON.parse.bind(JSON)); // jsonb
      register(199, parseJsonArray); // json[]
      register(3807, parseJsonArray); // jsonb[]
      register(2951, parseStringArray); // uuid[]
      register(791, parseStringArray); // money[]
      register(1183, parseStringArray); // time[]
    };
    
    module.exports = {
      init: init
    };
    
  provide("pg-types/lib/textParsers", module.exports);
}(global));

// pakmanager:pg-types/lib/binaryParsers
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits) { return (lastValue * Math.pow(2, bits)) + newValue; };
      var offsetBytes = offset >> 3;
    
      var inv = function(value) {
        if (invert) {
          return ~value & 0xff;
        }
    
        return value;
      };
    
      // read first (maybe partial) byte
      var mask = 0xff;
      var firstBits = 8 - (offset % 8);
      if (bits < firstBits) {
        mask = (0xff << (8 - bits)) & 0xff;
        firstBits = bits;
      }
    
      if (offset) {
        mask = mask >> (offset % 8);
      }
    
      var result = 0;
      if ((offset % 8) + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
    
      // read bytes
      var bytes = (bits + offset) >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
    
      // bits to read, that are not a complete byte
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> (8 - lastBits), lastBits);
      }
    
      return result;
    };
    
    var parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
    
      if (exponent === 0) {
        return 0;
      }
    
      // parse mantissa
      var precisionBitsCounter = 1;
      var parsePrecisionBits = function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
    
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & (0x1 << (bits - i))) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
    
        return lastValue;
      };
    
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
    
      // special cases
      if (exponent == (Math.pow(2, exponentBits + 1) - 1)) {
        if (mantissa === 0) {
          return (sign === 0) ? Infinity : -Infinity;
        }
    
        return NaN;
      }
    
      // normale number
      return ((sign === 0) ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    };
    
    var parseInt16 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
    
      return parseBits(value, 15, 1);
    };
    
    var parseInt32 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
    
      return parseBits(value, 31, 1);
    };
    
    var parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    };
    
    var parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    };
    
    var parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 0xc000) {
        return NaN;
      }
    
      var weight = Math.pow(10000, parseBits(value, 16, 16));
      var result = 0;
    
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + (16 * i)) * weight;
        weight /= 10000;
      }
    
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return ((sign === 0) ? 1 : -1) * Math.round(result * scale) / scale;
    };
    
    var parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
    
      // discard usecs and shift from 2000 to 1970
      var result = new Date((((sign === 0) ? 1 : -1) * rawValue / 1000) + 946684800000);
    
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 60000);
      }
    
      // add microseconds to the date
      result.usec = rawValue % 1000;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value) {
        this.usec = value;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
    
      return result;
    };
    
    var parseArray = function(value) {
      var dim = parseBits(value, 32);
    
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
    
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        // parse dimension
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
    
        // ignore lower bounds
        offset += 32;
      }
    
      var parseElement = function(elementType) {
        // parse content length
        var length = parseBits(value, 32, offset);
        offset += 32;
    
        // parse null values
        if (length == 0xffffffff) {
          return null;
        }
    
        var result;
        if ((elementType == 0x17) || (elementType == 0x14)) {
          // int/bigint
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        }
        else if (elementType == 0x19) {
          // string
          result = value.toString(this.encoding, offset >> 3, (offset += (length << 3)) >> 3);
          return result;
        }
        else {
          console.log("ERROR: ElementType not implemented: " + elementType);
        }
      };
    
      var parse = function(dimension, elementType) {
        var array = [];
        var i;
    
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i = 0; i < count; i++) {
            array[i] = parse(dimension, elementType);
          }
          dimension.unshift(count);
        }
        else {
          for (i = 0; i < dimension[0]; i++) {
            array[i] = parseElement(elementType);
          }
        }
    
        return array;
      };
    
      return parse(dims, elementType);
    };
    
    var parseText = function(value) {
      return value.toString('utf8');
    };
    
    var parseBool = function(value) {
      if(value === null) return null;
      return (parseBits(value, 8) > 0);
    };
    
    var init = function(register) {
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1000, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    };
    
    module.exports = {
      init: init
    };
    
  provide("pg-types/lib/binaryParsers", module.exports);
}(global));

// pakmanager:pg-types/lib/arrayParser
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var array = require('postgres-array');
    
    module.exports = {
      create: function (source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
    
  provide("pg-types/lib/arrayParser", module.exports);
}(global));

// pakmanager:pg-types
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var textParsers =  require('pg-types/lib/textParsers');
    var binaryParsers =  require('pg-types/lib/binaryParsers');
    var arrayParser =  require('pg-types/lib/arrayParser');
    
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    
    var typeParsers = {
      text: {},
      binary: {}
    };
    
    //the empty parse function
    function noParse (val) {
      return String(val);
    };
    
    //returns a function used to convert a specific type (specified by
    //oid) into a result javascript type
    //note: the oid can be obtained via the following sql query:
    //SELECT oid FROM pg_type WHERE typname = 'TYPE_NAME_HERE';
    function getTypeParser (oid, format) {
      format = format || 'text';
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    };
    
    function setTypeParser (oid, format, parseFn) {
      if(typeof format == 'function') {
        parseFn = format;
        format = 'text';
      }
      typeParsers[format][oid] = parseFn;
    };
    
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
    
  provide("pg-types", module.exports);
}(global));

// pakmanager:pgpass
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict';
    
    var path = require('path')
      , fs = require('fs')
      , helper = require( path.join(__dirname, 'helper.js') )
    ;
    
    
    module.exports.warnTo = helper.warnTo;
    
    module.exports = function(connInfo, cb) {
        var file = helper.getFileName();
        
        fs.stat(file, function(err, stat){
            if (err || !helper.usePgPass(stat, file)) {
                return cb(undefined);
            }
    
            var st = fs.createReadStream(file);
    
            helper.getPassword(connInfo, st, cb);
        });
    };
  provide("pgpass", module.exports);
}(global));

// pakmanager:semver
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  exports = module.exports = SemVer;
    
    // The debug function is excluded entirely from the minified version.
    /* nomin */ var debug;
    /* nomin */ if (typeof process === 'object' &&
        /* nomin */ process.env &&
        /* nomin */ process.env.NODE_DEBUG &&
        /* nomin */ /\bsemver\b/i.test(process.env.NODE_DEBUG))
      /* nomin */ debug = function() {
        /* nomin */ var args = Array.prototype.slice.call(arguments, 0);
        /* nomin */ args.unshift('SEMVER');
        /* nomin */ console.log.apply(console, args);
        /* nomin */ };
    /* nomin */ else
      /* nomin */ debug = function() {};
    
    // Note: this is the semver.org version of the spec that it implements
    // Not necessarily the package version of this code.
    exports.SEMVER_SPEC_VERSION = '2.0.0';
    
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
    
    // The actual regexps go on exports.re
    var re = exports.re = [];
    var src = exports.src = [];
    var R = 0;
    
    // The following Regular Expressions can be used for tokenizing,
    // validating, and parsing SemVer version strings.
    
    // ## Numeric Identifier
    // A single `0`, or a non-zero digit followed by zero or more digits.
    
    var NUMERICIDENTIFIER = R++;
    src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
    var NUMERICIDENTIFIERLOOSE = R++;
    src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';
    
    
    // ## Non-numeric Identifier
    // Zero or more digits, followed by a letter or hyphen, and then zero or
    // more letters, digits, or hyphens.
    
    var NONNUMERICIDENTIFIER = R++;
    src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';
    
    
    // ## Main Version
    // Three dot-separated numeric identifiers.
    
    var MAINVERSION = R++;
    src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                       '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                       '(' + src[NUMERICIDENTIFIER] + ')';
    
    var MAINVERSIONLOOSE = R++;
    src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                            '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                            '(' + src[NUMERICIDENTIFIERLOOSE] + ')';
    
    // ## Pre-release Version Identifier
    // A numeric identifier, or a non-numeric identifier.
    
    var PRERELEASEIDENTIFIER = R++;
    src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
                                '|' + src[NONNUMERICIDENTIFIER] + ')';
    
    var PRERELEASEIDENTIFIERLOOSE = R++;
    src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
                                     '|' + src[NONNUMERICIDENTIFIER] + ')';
    
    
    // ## Pre-release Version
    // Hyphen, followed by one or more dot-separated pre-release version
    // identifiers.
    
    var PRERELEASE = R++;
    src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
                      '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';
    
    var PRERELEASELOOSE = R++;
    src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
                           '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';
    
    // ## Build Metadata Identifier
    // Any combination of digits, letters, or hyphens.
    
    var BUILDIDENTIFIER = R++;
    src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';
    
    // ## Build Metadata
    // Plus sign, followed by one or more period-separated build metadata
    // identifiers.
    
    var BUILD = R++;
    src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
                 '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';
    
    
    // ## Full Version String
    // A main version, followed optionally by a pre-release version and
    // build metadata.
    
    // Note that the only major, minor, patch, and pre-release sections of
    // the version string are capturing groups.  The build metadata is not a
    // capturing group, because it should not ever be used in version
    // comparison.
    
    var FULL = R++;
    var FULLPLAIN = 'v?' + src[MAINVERSION] +
                    src[PRERELEASE] + '?' +
                    src[BUILD] + '?';
    
    src[FULL] = '^' + FULLPLAIN + '$';
    
    // like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
    // also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
    // common in the npm registry.
    var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
                     src[PRERELEASELOOSE] + '?' +
                     src[BUILD] + '?';
    
    var LOOSE = R++;
    src[LOOSE] = '^' + LOOSEPLAIN + '$';
    
    var GTLT = R++;
    src[GTLT] = '((?:<|>)?=?)';
    
    // Something like "2.*" or "1.2.x".
    // Note that "x.x" is a valid xRange identifer, meaning "any version"
    // Only the first item is strictly required.
    var XRANGEIDENTIFIERLOOSE = R++;
    src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
    var XRANGEIDENTIFIER = R++;
    src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';
    
    var XRANGEPLAIN = R++;
    src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
                       '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                       '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                       '(?:' + src[PRERELEASE] + ')?' +
                       src[BUILD] + '?' +
                       ')?)?';
    
    var XRANGEPLAINLOOSE = R++;
    src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                            '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                            '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                            '(?:' + src[PRERELEASELOOSE] + ')?' +
                            src[BUILD] + '?' +
                            ')?)?';
    
    var XRANGE = R++;
    src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
    var XRANGELOOSE = R++;
    src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';
    
    // Tilde ranges.
    // Meaning is "reasonably at or greater than"
    var LONETILDE = R++;
    src[LONETILDE] = '(?:~>?)';
    
    var TILDETRIM = R++;
    src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
    re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
    var tildeTrimReplace = '$1~';
    
    var TILDE = R++;
    src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
    var TILDELOOSE = R++;
    src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';
    
    // Caret ranges.
    // Meaning is "at least and backwards compatible with"
    var LONECARET = R++;
    src[LONECARET] = '(?:\\^)';
    
    var CARETTRIM = R++;
    src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
    re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
    var caretTrimReplace = '$1^';
    
    var CARET = R++;
    src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
    var CARETLOOSE = R++;
    src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';
    
    // A simple gt/lt/eq thing, or just "" to indicate "any version"
    var COMPARATORLOOSE = R++;
    src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
    var COMPARATOR = R++;
    src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';
    
    
    // An expression to strip any whitespace between the gtlt and the thing
    // it modifies, so that `> 1.2.3` ==> `>1.2.3`
    var COMPARATORTRIM = R++;
    src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
                          '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';
    
    // this one has to use the /g flag
    re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
    var comparatorTrimReplace = '$1$2$3';
    
    
    // Something like `1.2.3 - 1.2.4`
    // Note that these all use the loose form, because they'll be
    // checked against either the strict or loose comparator form
    // later.
    var HYPHENRANGE = R++;
    src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
                       '\\s+-\\s+' +
                       '(' + src[XRANGEPLAIN] + ')' +
                       '\\s*$';
    
    var HYPHENRANGELOOSE = R++;
    src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
                            '\\s+-\\s+' +
                            '(' + src[XRANGEPLAINLOOSE] + ')' +
                            '\\s*$';
    
    // Star ranges basically just allow anything at all.
    var STAR = R++;
    src[STAR] = '(<|>)?=?\\s*\\*';
    
    // Compile to actual regexp objects.
    // All are flag-free, unless they were created above with a flag.
    for (var i = 0; i < R; i++) {
      debug(i, src[i]);
      if (!re[i])
        re[i] = new RegExp(src[i]);
    }
    
    exports.parse = parse;
    function parse(version, loose) {
      if (version instanceof SemVer)
        return version;
    
      if (typeof version !== 'string')
        return null;
    
      if (version.length > MAX_LENGTH)
        return null;
    
      var r = loose ? re[LOOSE] : re[FULL];
      if (!r.test(version))
        return null;
    
      try {
        return new SemVer(version, loose);
      } catch (er) {
        return null;
      }
    }
    
    exports.valid = valid;
    function valid(version, loose) {
      var v = parse(version, loose);
      return v ? v.version : null;
    }
    
    
    exports.clean = clean;
    function clean(version, loose) {
      var s = parse(version.trim().replace(/^[=v]+/, ''), loose);
      return s ? s.version : null;
    }
    
    exports.SemVer = SemVer;
    
    function SemVer(version, loose) {
      if (version instanceof SemVer) {
        if (version.loose === loose)
          return version;
        else
          version = version.version;
      } else if (typeof version !== 'string') {
        throw new TypeError('Invalid Version: ' + version);
      }
    
      if (version.length > MAX_LENGTH)
        throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
    
      if (!(this instanceof SemVer))
        return new SemVer(version, loose);
    
      debug('SemVer', version, loose);
      this.loose = loose;
      var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);
    
      if (!m)
        throw new TypeError('Invalid Version: ' + version);
    
      this.raw = version;
    
      // these are actually numbers
      this.major = +m[1];
      this.minor = +m[2];
      this.patch = +m[3];
    
      if (this.major > MAX_SAFE_INTEGER || this.major < 0)
        throw new TypeError('Invalid major version')
    
      if (this.minor > MAX_SAFE_INTEGER || this.minor < 0)
        throw new TypeError('Invalid minor version')
    
      if (this.patch > MAX_SAFE_INTEGER || this.patch < 0)
        throw new TypeError('Invalid patch version')
    
      // numberify any prerelease numeric ids
      if (!m[4])
        this.prerelease = [];
      else
        this.prerelease = m[4].split('.').map(function(id) {
          if (/^[0-9]+$/.test(id)) {
            var num = +id
            if (num >= 0 && num < MAX_SAFE_INTEGER)
              return num
          }
          return id;
        });
    
      this.build = m[5] ? m[5].split('.') : [];
      this.format();
    }
    
    SemVer.prototype.format = function() {
      this.version = this.major + '.' + this.minor + '.' + this.patch;
      if (this.prerelease.length)
        this.version += '-' + this.prerelease.join('.');
      return this.version;
    };
    
    SemVer.prototype.inspect = function() {
      return '<SemVer "' + this + '">';
    };
    
    SemVer.prototype.toString = function() {
      return this.version;
    };
    
    SemVer.prototype.compare = function(other) {
      debug('SemVer.compare', this.version, this.loose, other);
      if (!(other instanceof SemVer))
        other = new SemVer(other, this.loose);
    
      return this.compareMain(other) || this.comparePre(other);
    };
    
    SemVer.prototype.compareMain = function(other) {
      if (!(other instanceof SemVer))
        other = new SemVer(other, this.loose);
    
      return compareIdentifiers(this.major, other.major) ||
             compareIdentifiers(this.minor, other.minor) ||
             compareIdentifiers(this.patch, other.patch);
    };
    
    SemVer.prototype.comparePre = function(other) {
      if (!(other instanceof SemVer))
        other = new SemVer(other, this.loose);
    
      // NOT having a prerelease is > having one
      if (this.prerelease.length && !other.prerelease.length)
        return -1;
      else if (!this.prerelease.length && other.prerelease.length)
        return 1;
      else if (!this.prerelease.length && !other.prerelease.length)
        return 0;
    
      var i = 0;
      do {
        var a = this.prerelease[i];
        var b = other.prerelease[i];
        debug('prerelease compare', i, a, b);
        if (a === undefined && b === undefined)
          return 0;
        else if (b === undefined)
          return 1;
        else if (a === undefined)
          return -1;
        else if (a === b)
          continue;
        else
          return compareIdentifiers(a, b);
      } while (++i);
    };
    
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    SemVer.prototype.inc = function(release, identifier) {
      switch (release) {
        case 'premajor':
          this.prerelease.length = 0;
          this.patch = 0;
          this.minor = 0;
          this.major++;
          this.inc('pre', identifier);
          break;
        case 'preminor':
          this.prerelease.length = 0;
          this.patch = 0;
          this.minor++;
          this.inc('pre', identifier);
          break;
        case 'prepatch':
          // If this is already a prerelease, it will bump to the next version
          // drop any prereleases that might already exist, since they are not
          // relevant at this point.
          this.prerelease.length = 0;
          this.inc('patch', identifier);
          this.inc('pre', identifier);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case 'prerelease':
          if (this.prerelease.length === 0)
            this.inc('patch', identifier);
          this.inc('pre', identifier);
          break;
    
        case 'major':
          // If this is a pre-major version, bump up to the same major version.
          // Otherwise increment major.
          // 1.0.0-5 bumps to 1.0.0
          // 1.1.0 bumps to 2.0.0
          if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0)
            this.major++;
          this.minor = 0;
          this.patch = 0;
          this.prerelease = [];
          break;
        case 'minor':
          // If this is a pre-minor version, bump up to the same minor version.
          // Otherwise increment minor.
          // 1.2.0-5 bumps to 1.2.0
          // 1.2.1 bumps to 1.3.0
          if (this.patch !== 0 || this.prerelease.length === 0)
            this.minor++;
          this.patch = 0;
          this.prerelease = [];
          break;
        case 'patch':
          // If this is not a pre-release version, it will increment the patch.
          // If it is a pre-release it will bump up to the same patch version.
          // 1.2.0-5 patches to 1.2.0
          // 1.2.0 patches to 1.2.1
          if (this.prerelease.length === 0)
            this.patch++;
          this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
        case 'pre':
          if (this.prerelease.length === 0)
            this.prerelease = [0];
          else {
            var i = this.prerelease.length;
            while (--i >= 0) {
              if (typeof this.prerelease[i] === 'number') {
                this.prerelease[i]++;
                i = -2;
              }
            }
            if (i === -1) // didn't increment anything
              this.prerelease.push(0);
          }
          if (identifier) {
            // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
            // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
            if (this.prerelease[0] === identifier) {
              if (isNaN(this.prerelease[1]))
                this.prerelease = [identifier, 0];
            } else
              this.prerelease = [identifier, 0];
          }
          break;
    
        default:
          throw new Error('invalid increment argument: ' + release);
      }
      this.format();
      return this;
    };
    
    exports.inc = inc;
    function inc(version, release, loose, identifier) {
      if (typeof(loose) === 'string') {
        identifier = loose;
        loose = undefined;
      }
    
      try {
        return new SemVer(version, loose).inc(release, identifier).version;
      } catch (er) {
        return null;
      }
    }
    
    exports.diff = diff;
    function diff(version1, version2) {
      if (eq(version1, version2)) {
        return null;
      } else {
        var v1 = parse(version1);
        var v2 = parse(version2);
        if (v1.prerelease.length || v2.prerelease.length) {
          for (var key in v1) {
            if (key === 'major' || key === 'minor' || key === 'patch') {
              if (v1[key] !== v2[key]) {
                return 'pre'+key;
              }
            }
          }
          return 'prerelease';
        }
        for (var key in v1) {
          if (key === 'major' || key === 'minor' || key === 'patch') {
            if (v1[key] !== v2[key]) {
              return key;
            }
          }
        }
      }
    }
    
    exports.compareIdentifiers = compareIdentifiers;
    
    var numeric = /^[0-9]+$/;
    function compareIdentifiers(a, b) {
      var anum = numeric.test(a);
      var bnum = numeric.test(b);
    
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
    
      return (anum && !bnum) ? -1 :
             (bnum && !anum) ? 1 :
             a < b ? -1 :
             a > b ? 1 :
             0;
    }
    
    exports.rcompareIdentifiers = rcompareIdentifiers;
    function rcompareIdentifiers(a, b) {
      return compareIdentifiers(b, a);
    }
    
    exports.major = major;
    function major(a, loose) {
      return new SemVer(a, loose).major;
    }
    
    exports.minor = minor;
    function minor(a, loose) {
      return new SemVer(a, loose).minor;
    }
    
    exports.patch = patch;
    function patch(a, loose) {
      return new SemVer(a, loose).patch;
    }
    
    exports.compare = compare;
    function compare(a, b, loose) {
      return new SemVer(a, loose).compare(b);
    }
    
    exports.compareLoose = compareLoose;
    function compareLoose(a, b) {
      return compare(a, b, true);
    }
    
    exports.rcompare = rcompare;
    function rcompare(a, b, loose) {
      return compare(b, a, loose);
    }
    
    exports.sort = sort;
    function sort(list, loose) {
      return list.sort(function(a, b) {
        return exports.compare(a, b, loose);
      });
    }
    
    exports.rsort = rsort;
    function rsort(list, loose) {
      return list.sort(function(a, b) {
        return exports.rcompare(a, b, loose);
      });
    }
    
    exports.gt = gt;
    function gt(a, b, loose) {
      return compare(a, b, loose) > 0;
    }
    
    exports.lt = lt;
    function lt(a, b, loose) {
      return compare(a, b, loose) < 0;
    }
    
    exports.eq = eq;
    function eq(a, b, loose) {
      return compare(a, b, loose) === 0;
    }
    
    exports.neq = neq;
    function neq(a, b, loose) {
      return compare(a, b, loose) !== 0;
    }
    
    exports.gte = gte;
    function gte(a, b, loose) {
      return compare(a, b, loose) >= 0;
    }
    
    exports.lte = lte;
    function lte(a, b, loose) {
      return compare(a, b, loose) <= 0;
    }
    
    exports.cmp = cmp;
    function cmp(a, op, b, loose) {
      var ret;
      switch (op) {
        case '===':
          if (typeof a === 'object') a = a.version;
          if (typeof b === 'object') b = b.version;
          ret = a === b;
          break;
        case '!==':
          if (typeof a === 'object') a = a.version;
          if (typeof b === 'object') b = b.version;
          ret = a !== b;
          break;
        case '': case '=': case '==': ret = eq(a, b, loose); break;
        case '!=': ret = neq(a, b, loose); break;
        case '>': ret = gt(a, b, loose); break;
        case '>=': ret = gte(a, b, loose); break;
        case '<': ret = lt(a, b, loose); break;
        case '<=': ret = lte(a, b, loose); break;
        default: throw new TypeError('Invalid operator: ' + op);
      }
      return ret;
    }
    
    exports.Comparator = Comparator;
    function Comparator(comp, loose) {
      if (comp instanceof Comparator) {
        if (comp.loose === loose)
          return comp;
        else
          comp = comp.value;
      }
    
      if (!(this instanceof Comparator))
        return new Comparator(comp, loose);
    
      debug('comparator', comp, loose);
      this.loose = loose;
      this.parse(comp);
    
      if (this.semver === ANY)
        this.value = '';
      else
        this.value = this.operator + this.semver.version;
    
      debug('comp', this);
    }
    
    var ANY = {};
    Comparator.prototype.parse = function(comp) {
      var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
      var m = comp.match(r);
    
      if (!m)
        throw new TypeError('Invalid comparator: ' + comp);
    
      this.operator = m[1];
      if (this.operator === '=')
        this.operator = '';
    
      // if it literally is just '>' or '' then allow anything.
      if (!m[2])
        this.semver = ANY;
      else
        this.semver = new SemVer(m[2], this.loose);
    };
    
    Comparator.prototype.inspect = function() {
      return '<SemVer Comparator "' + this + '">';
    };
    
    Comparator.prototype.toString = function() {
      return this.value;
    };
    
    Comparator.prototype.test = function(version) {
      debug('Comparator.test', version, this.loose);
    
      if (this.semver === ANY)
        return true;
    
      if (typeof version === 'string')
        version = new SemVer(version, this.loose);
    
      return cmp(version, this.operator, this.semver, this.loose);
    };
    
    
    exports.Range = Range;
    function Range(range, loose) {
      if ((range instanceof Range) && range.loose === loose)
        return range;
    
      if (!(this instanceof Range))
        return new Range(range, loose);
    
      this.loose = loose;
    
      // First, split based on boolean or ||
      this.raw = range;
      this.set = range.split(/\s*\|\|\s*/).map(function(range) {
        return this.parseRange(range.trim());
      }, this).filter(function(c) {
        // throw out any that are not relevant for whatever reason
        return c.length;
      });
    
      if (!this.set.length) {
        throw new TypeError('Invalid SemVer Range: ' + range);
      }
    
      this.format();
    }
    
    Range.prototype.inspect = function() {
      return '<SemVer Range "' + this.range + '">';
    };
    
    Range.prototype.format = function() {
      this.range = this.set.map(function(comps) {
        return comps.join(' ').trim();
      }).join('||').trim();
      return this.range;
    };
    
    Range.prototype.toString = function() {
      return this.range;
    };
    
    Range.prototype.parseRange = function(range) {
      var loose = this.loose;
      range = range.trim();
      debug('range', range, loose);
      // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
      var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
      range = range.replace(hr, hyphenReplace);
      debug('hyphen replace', range);
      // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
      range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
      debug('comparator trim', range, re[COMPARATORTRIM]);
    
      // `~ 1.2.3` => `~1.2.3`
      range = range.replace(re[TILDETRIM], tildeTrimReplace);
    
      // `^ 1.2.3` => `^1.2.3`
      range = range.replace(re[CARETTRIM], caretTrimReplace);
    
      // normalize spaces
      range = range.split(/\s+/).join(' ');
    
      // At this point, the range is completely trimmed and
      // ready to be split into comparators.
    
      var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
      var set = range.split(' ').map(function(comp) {
        return parseComparator(comp, loose);
      }).join(' ').split(/\s+/);
      if (this.loose) {
        // in loose mode, throw out any that are not valid comparators
        set = set.filter(function(comp) {
          return !!comp.match(compRe);
        });
      }
      set = set.map(function(comp) {
        return new Comparator(comp, loose);
      });
    
      return set;
    };
    
    // Mostly just for testing and legacy API reasons
    exports.toComparators = toComparators;
    function toComparators(range, loose) {
      return new Range(range, loose).set.map(function(comp) {
        return comp.map(function(c) {
          return c.value;
        }).join(' ').trim().split(' ');
      });
    }
    
    // comprised of xranges, tildes, stars, and gtlt's at this point.
    // already replaced the hyphen ranges
    // turn into a set of JUST comparators.
    function parseComparator(comp, loose) {
      debug('comp', comp);
      comp = replaceCarets(comp, loose);
      debug('caret', comp);
      comp = replaceTildes(comp, loose);
      debug('tildes', comp);
      comp = replaceXRanges(comp, loose);
      debug('xrange', comp);
      comp = replaceStars(comp, loose);
      debug('stars', comp);
      return comp;
    }
    
    function isX(id) {
      return !id || id.toLowerCase() === 'x' || id === '*';
    }
    
    // ~, ~> --> * (any, kinda silly)
    // ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
    // ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
    // ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
    // ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
    // ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
    function replaceTildes(comp, loose) {
      return comp.trim().split(/\s+/).map(function(comp) {
        return replaceTilde(comp, loose);
      }).join(' ');
    }
    
    function replaceTilde(comp, loose) {
      var r = loose ? re[TILDELOOSE] : re[TILDE];
      return comp.replace(r, function(_, M, m, p, pr) {
        debug('tilde', comp, _, M, m, p, pr);
        var ret;
    
        if (isX(M))
          ret = '';
        else if (isX(m))
          ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
        else if (isX(p))
          // ~1.2 == >=1.2.0- <1.3.0-
          ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
        else if (pr) {
          debug('replaceTilde pr', pr);
          if (pr.charAt(0) !== '-')
            pr = '-' + pr;
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + (+m + 1) + '.0';
        } else
          // ~1.2.3 == >=1.2.3 <1.3.0
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0';
    
        debug('tilde return', ret);
        return ret;
      });
    }
    
    // ^ --> * (any, kinda silly)
    // ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
    // ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
    // ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
    // ^1.2.3 --> >=1.2.3 <2.0.0
    // ^1.2.0 --> >=1.2.0 <2.0.0
    function replaceCarets(comp, loose) {
      return comp.trim().split(/\s+/).map(function(comp) {
        return replaceCaret(comp, loose);
      }).join(' ');
    }
    
    function replaceCaret(comp, loose) {
      debug('caret', comp, loose);
      var r = loose ? re[CARETLOOSE] : re[CARET];
      return comp.replace(r, function(_, M, m, p, pr) {
        debug('caret', comp, _, M, m, p, pr);
        var ret;
    
        if (isX(M))
          ret = '';
        else if (isX(m))
          ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
        else if (isX(p)) {
          if (M === '0')
            ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
          else
            ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
        } else if (pr) {
          debug('replaceCaret pr', pr);
          if (pr.charAt(0) !== '-')
            pr = '-' + pr;
          if (M === '0') {
            if (m === '0')
              ret = '>=' + M + '.' + m + '.' + p + pr +
                    ' <' + M + '.' + m + '.' + (+p + 1);
            else
              ret = '>=' + M + '.' + m + '.' + p + pr +
                    ' <' + M + '.' + (+m + 1) + '.0';
          } else
            ret = '>=' + M + '.' + m + '.' + p + pr +
                  ' <' + (+M + 1) + '.0.0';
        } else {
          debug('no pr');
          if (M === '0') {
            if (m === '0')
              ret = '>=' + M + '.' + m + '.' + p +
                    ' <' + M + '.' + m + '.' + (+p + 1);
            else
              ret = '>=' + M + '.' + m + '.' + p +
                    ' <' + M + '.' + (+m + 1) + '.0';
          } else
            ret = '>=' + M + '.' + m + '.' + p +
                  ' <' + (+M + 1) + '.0.0';
        }
    
        debug('caret return', ret);
        return ret;
      });
    }
    
    function replaceXRanges(comp, loose) {
      debug('replaceXRanges', comp, loose);
      return comp.split(/\s+/).map(function(comp) {
        return replaceXRange(comp, loose);
      }).join(' ');
    }
    
    function replaceXRange(comp, loose) {
      comp = comp.trim();
      var r = loose ? re[XRANGELOOSE] : re[XRANGE];
      return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
        debug('xRange', comp, ret, gtlt, M, m, p, pr);
        var xM = isX(M);
        var xm = xM || isX(m);
        var xp = xm || isX(p);
        var anyX = xp;
    
        if (gtlt === '=' && anyX)
          gtlt = '';
    
        if (xM) {
          if (gtlt === '>' || gtlt === '<') {
            // nothing is allowed
            ret = '<0.0.0';
          } else {
            // nothing is forbidden
            ret = '*';
          }
        } else if (gtlt && anyX) {
          // replace X with 0
          if (xm)
            m = 0;
          if (xp)
            p = 0;
    
          if (gtlt === '>') {
            // >1 => >=2.0.0
            // >1.2 => >=1.3.0
            // >1.2.3 => >= 1.2.4
            gtlt = '>=';
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else if (xp) {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === '<=') {
            // <=0.7.x is actually <0.8.0, since any 0.7.x should
            // pass.  Similarly, <=7.x is actually <8.0.0, etc.
            gtlt = '<'
            if (xm)
              M = +M + 1
            else
              m = +m + 1
          }
    
          ret = gtlt + M + '.' + m + '.' + p;
        } else if (xm) {
          ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
        } else if (xp) {
          ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
        }
    
        debug('xRange return', ret);
    
        return ret;
      });
    }
    
    // Because * is AND-ed with everything else in the comparator,
    // and '' means "any version", just remove the *s entirely.
    function replaceStars(comp, loose) {
      debug('replaceStars', comp, loose);
      // Looseness is ignored here.  star is always as loose as it gets!
      return comp.trim().replace(re[STAR], '');
    }
    
    // This function is passed to string.replace(re[HYPHENRANGE])
    // M, m, patch, prerelease, build
    // 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
    // 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
    // 1.2 - 3.4 => >=1.2.0 <3.5.0
    function hyphenReplace($0,
                           from, fM, fm, fp, fpr, fb,
                           to, tM, tm, tp, tpr, tb) {
    
      if (isX(fM))
        from = '';
      else if (isX(fm))
        from = '>=' + fM + '.0.0';
      else if (isX(fp))
        from = '>=' + fM + '.' + fm + '.0';
      else
        from = '>=' + from;
    
      if (isX(tM))
        to = '';
      else if (isX(tm))
        to = '<' + (+tM + 1) + '.0.0';
      else if (isX(tp))
        to = '<' + tM + '.' + (+tm + 1) + '.0';
      else if (tpr)
        to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
      else
        to = '<=' + to;
    
      return (from + ' ' + to).trim();
    }
    
    
    // if ANY of the sets match ALL of its comparators, then pass
    Range.prototype.test = function(version) {
      if (!version)
        return false;
    
      if (typeof version === 'string')
        version = new SemVer(version, this.loose);
    
      for (var i = 0; i < this.set.length; i++) {
        if (testSet(this.set[i], version))
          return true;
      }
      return false;
    };
    
    function testSet(set, version) {
      for (var i = 0; i < set.length; i++) {
        if (!set[i].test(version))
          return false;
      }
    
      if (version.prerelease.length) {
        // Find the set of versions that are allowed to have prereleases
        // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
        // That should allow `1.2.3-pr.2` to pass.
        // However, `1.2.4-alpha.notready` should NOT be allowed,
        // even though it's within the range set by the comparators.
        for (var i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === ANY)
            continue;
    
          if (set[i].semver.prerelease.length > 0) {
            var allowed = set[i].semver;
            if (allowed.major === version.major &&
                allowed.minor === version.minor &&
                allowed.patch === version.patch)
              return true;
          }
        }
    
        // Version has a -pre, but it's not one of the ones we like.
        return false;
      }
    
      return true;
    }
    
    exports.satisfies = satisfies;
    function satisfies(version, range, loose) {
      try {
        range = new Range(range, loose);
      } catch (er) {
        return false;
      }
      return range.test(version);
    }
    
    exports.maxSatisfying = maxSatisfying;
    function maxSatisfying(versions, range, loose) {
      return versions.filter(function(version) {
        return satisfies(version, range, loose);
      }).sort(function(a, b) {
        return rcompare(a, b, loose);
      })[0] || null;
    }
    
    exports.validRange = validRange;
    function validRange(range, loose) {
      try {
        // Return '*' instead of '' so that truthiness works.
        // This will throw if it's invalid anyway
        return new Range(range, loose).range || '*';
      } catch (er) {
        return null;
      }
    }
    
    // Determine if version is less than all the versions possible in the range
    exports.ltr = ltr;
    function ltr(version, range, loose) {
      return outside(version, range, '<', loose);
    }
    
    // Determine if version is greater than all the versions possible in the range.
    exports.gtr = gtr;
    function gtr(version, range, loose) {
      return outside(version, range, '>', loose);
    }
    
    exports.outside = outside;
    function outside(version, range, hilo, loose) {
      version = new SemVer(version, loose);
      range = new Range(range, loose);
    
      var gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case '>':
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = '>';
          ecomp = '>=';
          break;
        case '<':
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = '<';
          ecomp = '<=';
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
    
      // If it satisifes the range it is not outside
      if (satisfies(version, range, loose)) {
        return false;
      }
    
      // From now on, variable terms are as if we're in "gtr" mode.
      // but note that everything is flipped for the "ltr" function.
    
      for (var i = 0; i < range.set.length; ++i) {
        var comparators = range.set[i];
    
        var high = null;
        var low = null;
    
        comparators.forEach(function(comparator) {
          if (comparator.semver === ANY) {
            comparator = new Comparator('>=0.0.0')
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, loose)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, loose)) {
            low = comparator;
          }
        });
    
        // If the edge version comparator has a operator then our version
        // isn't outside it
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
    
        // If the lowest version comparator has an operator and our version
        // is less than it then it isn't higher than the range
        if ((!low.operator || low.operator === comp) &&
            ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    }
    
  provide("semver", module.exports);
}(global));

// pakmanager:ms
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /**
     * Helpers.
     */
    
    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var y = d * 365.25;
    
    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} options
     * @return {String|Number}
     * @api public
     */
    
    module.exports = function(val, options){
      options = options || {};
      if ('string' == typeof val) return parse(val);
      return options.long
        ? long(val)
        : short(val);
    };
    
    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */
    
    function parse(str) {
      str = '' + str;
      if (str.length > 10000) return;
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
      if (!match) return;
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
      }
    }
    
    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */
    
    function short(ms) {
      if (ms >= d) return Math.round(ms / d) + 'd';
      if (ms >= h) return Math.round(ms / h) + 'h';
      if (ms >= m) return Math.round(ms / m) + 'm';
      if (ms >= s) return Math.round(ms / s) + 's';
      return ms + 'ms';
    }
    
    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */
    
    function long(ms) {
      return plural(ms, d, 'day')
        || plural(ms, h, 'hour')
        || plural(ms, m, 'minute')
        || plural(ms, s, 'second')
        || ms + ' ms';
    }
    
    /**
     * Pluralization helper.
     */
    
    function plural(ms, n, name) {
      if (ms < n) return;
      if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
      return Math.ceil(ms / n) + ' ' + name + 's';
    }
    
  provide("ms", module.exports);
}(global));

// pakmanager:pg/lib/utils
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
    // convert a JS array to a postgres array literal
    // uses comma separator so won't work for types like box that use
    // a different array separator.
    function arrayString(val) {
      var result = '{';
      for (var i = 0 ; i < val.length; i++) {
        if(i > 0) {
          result = result + ',';
        }
        if(val[i] === null || typeof val[i] === 'undefined') {
          result = result + 'NULL';
        }
        else if(Array.isArray(val[i])) {
          result = result + arrayString(val[i]);
        }
        else
        {
          result = result + JSON.stringify(prepareValue(val[i]));
        }
      }
      result = result + '}';
      return result;
    }
    
    //converts values from javascript types
    //to their 'raw' counterparts for use as a postgres parameter
    //note: you can override this function to provide your own conversion mechanism
    //for complex types, etc...
    var prepareValue = function(val, seen) {
      if (val instanceof Buffer) {
        return val;
      }
      if(val instanceof Date) {
        return dateToString(val);
      }
      if(Array.isArray(val)) {
        return arrayString(val);
      }
      if(val === null || typeof val === 'undefined') {
        return null;
      }
      if(typeof val === 'object') {
        return prepareObject(val, seen);
      }
      return val.toString();
    };
    
    function prepareObject(val, seen) {
      if(val.toPostgres && typeof val.toPostgres === 'function') {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
    
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    
    function dateToString(date) {
      function pad(number, digits) {
        number = ""+number;
        while(number.length < digits)
          number = "0"+number;
        return number;
      }
    
      var offset = -date.getTimezoneOffset();
      var ret = pad(date.getFullYear(), 4) + '-' +
        pad(date.getMonth() + 1, 2) + '-' +
        pad(date.getDate(), 2) + 'T' +
        pad(date.getHours(), 2) + ':' +
        pad(date.getMinutes(), 2) + ':' +
        pad(date.getSeconds(), 2) + '.' +
        pad(date.getMilliseconds(), 3);
    
      if(offset < 0) {
        ret += "-";
        offset *= -1;
      }
      else
        ret += "+";
    
      return ret + pad(Math.floor(offset/60), 2) + ":" + pad(offset%60, 2);
    }
    
    function normalizeQueryConfig (config, values, callback) {
      //can take in strings or config objects
      config = (typeof(config) == 'string') ? { text: config } : config;
      if(values) {
        if(typeof values === 'function') {
          config.callback = values;
        } else {
          config.values = values;
        }
      }
      if(callback) {
        config.callback = callback;
      }
      return config;
    }
    
    module.exports = {
      prepareValue: prepareValue,
      normalizeQueryConfig: normalizeQueryConfig
    };
    
  provide("pg/lib/utils", module.exports);
}(global));

// pakmanager:pg/lib/native/result
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var NativeResult = module.exports = function(pq) {
      this.command = null;
      this.rowCount = 0;
      this.rows = null;
      this.fields = null;
    };
    
    NativeResult.prototype.addCommandComplete = function(pq) {
      this.command = pq.cmdStatus().split(' ')[0];
      this.rowCount = parseInt(pq.cmdTuples(), 10);
      var nfields = pq.nfields();
      if(nfields < 1) return;
    
      this.fields = [];
      for(var i = 0; i < nfields; i++) {
        this.fields.push({
          name: pq.fname(i),
          dataTypeID: pq.ftype(i)
        });
      }
    };
    
  provide("pg/lib/native/result", module.exports);
}(global));

// pakmanager:pg/lib/type-overrides
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var types = require('pg-types');
    
    function TypeOverrides(userTypes) {
      this._types = userTypes || types;
      this.text = {};
      this.binary = {};
    }
    
    TypeOverrides.prototype.getOverrides = function(format) {
      switch(format) {
        case 'text': return this.text;
        case 'binary': return this.binary;
        default: return {};
      }
    };
    
    TypeOverrides.prototype.setTypeParser = function(oid, format, parseFn) {
      if(typeof format == 'function') {
        parseFn = format;
        format = 'text';
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    
    TypeOverrides.prototype.getTypeParser = function(oid, format) {
      format = format || 'text';
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    
    module.exports = TypeOverrides;
    
  provide("pg/lib/type-overrides", module.exports);
}(global));

// pakmanager:pg/lib/native/query
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var utils =  require('pg/lib/utils');
    var NativeResult =  require('pg/lib/native/result');
    
    var NativeQuery = module.exports = function(native) {
      EventEmitter.call(this);
      this.native = native;
      this.text = null;
      this.values = null;
      this.name = null;
      this.callback = null;
      this.state = 'new';
      this._arrayMode = false;
    
      //if the 'row' event is listened for
      //then emit them as they come in
      //without setting singleRowMode to true
      //this has almost no meaning because libpq
      //reads all rows into memory befor returning any
      this._emitRowEvents = false;
      this.on('newListener', function(event) {
        if(event === 'row') this._emitRowEvents = true;
      }.bind(this));
    };
    
    util.inherits(NativeQuery, EventEmitter);
    
    NativeQuery.prototype.handleError = function(err) {
      var self = this;
      //copy pq error fields into the error object
      var fields = self.native.pq.resultErrorFields();
      if(fields) {
        for(var key in fields) {
          err[key] = fields[key];
        }
      }
      if(self.callback) {
        self.callback(err);
      } else {
        self.emit('error', err);
      }
      self.state = 'error';
    };
    
    NativeQuery.prototype.submit = function(client) {
      this.state = 'running';
      var self = this;
      client.native.arrayMode = this._arrayMode;
    
      var after = function(err, rows) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit('_done');
        });
    
        //handle possible query error
        if(err) {
          return self.handleError(err);
        }
    
        var result = new NativeResult();
        result.addCommandComplete(self.native.pq);
        result.rows = rows;
    
        //emit row events for each row in the result
        if(self._emitRowEvents) {
          rows.forEach(function(row) {
            self.emit('row', row, result);
          });
        }
    
    
        //handle successful result
        self.state = 'end';
        self.emit('end', result);
        if(self.callback) {
          self.callback(null, result);
        }
      };
    
      if(process.domain) {
        after = process.domain.bind(after);
      }
    
      //named query
      if(this.name) {
        if (this.name.length > 63) {
          console.error('Warning! Postgres only supports 63 characters for query names.');
          console.error('You supplied', this.name, '(', this.name.length, ')');
          console.error('This can cause conflicts and silent errors executing queries');
        }
        var values = (this.values||[]).map(utils.prepareValue);
    
        //check if the client has already executed this named query
        //if so...just execute it again - skip the planning phase
        if(client.namedQueries[this.name]) {
          return this.native.execute(this.name, values, after);
        }
        //plan the named query the first time, then execute it
        return this.native.prepare(this.name, this.text, values.length, function(err) {
          if(err) return after(err);
          client.namedQueries[self.name] = true;
          return self.native.execute(self.name, values, after);
        });
      }
      else if(this.values) {
        var vals = this.values.map(utils.prepareValue);
        this.native.query(this.text, vals, after);
      } else {
        this.native.query(this.text, after);
      }
    };
    
  provide("pg/lib/native/query", module.exports);
}(global));

// pakmanager:pg/lib/native
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var Native = require('pg-native');
    var TypeOverrides =  require('pg/lib/type-overrides');
    var semver = require('semver');
    var pkg = require('../../package.json');
    var assert = require('assert');
    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var ConnectionParameters = require(__dirname + '/../connection-parameters');
    
    var msg = 'Version >= ' + pkg.minNativeVersion + ' of pg-native required.';
    assert(semver.gte(Native.version, pkg.minNativeVersion), msg);
    
    var NativeQuery =  require('pg/lib/native/query');
    
    var Client = module.exports = function(config) {
      EventEmitter.call(this);
      config = config || {};
    
      this._types = new TypeOverrides(config.types);
    
      this.native = new Native({
        types: this._types
      });
    
      this._queryQueue = [];
      this._connected = false;
    
      //keep these on the object for legacy reasons
      //for the time being. TODO: deprecate all this jazz
      var cp = this.connectionParameters = new ConnectionParameters(config);
      this.user = cp.user;
      this.password = cp.password;
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
    
      //a hash to hold named queries
      this.namedQueries = {};
    };
    
    util.inherits(Client, EventEmitter);
    
    //connect to the backend
    //pass an optional callback to be called once connected
    //or with an error if there was a connection error
    //if no callback is passed and there is a connection error
    //the client will emit an error event.
    Client.prototype.connect = function(cb) {
      var self = this;
    
      var onError = function(err) {
        if(cb) return cb(err);
        return self.emit('error', err);
      };
    
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if(err) return onError(err);
        self.native.connect(conString, function(err) {
          if(err) return onError(err);
    
          //set internal states to connected
          self._connected = true;
    
          //handle connection errors from the native layer
          self.native.on('error', function(err) {
            //error will be handled by active query
            if(self._activeQuery && self._activeQuery.state != 'end') {
              return;
            }
            self.emit('error', err);
          });
    
          self.native.on('notification', function(msg) {
            self.emit('notification', {
              channel: msg.relname,
              payload: msg.extra
            });
          });
    
          //signal we are connected now
          self.emit('connect');
          self._pulseQueryQueue(true);
    
          //possibly call the optional callback
          if(cb) cb();
        });
      });
    };
    
    //send a query to the server
    //this method is highly overloaded to take
    //1) string query, optional array of parameters, optional function callback
    //2) object query with {
    //    string query
    //    optional array values,
    //    optional function callback instead of as a separate parameter
    //    optional string name to name & cache the query plan
    //    optional string rowMode = 'array' for an array of results
    //  }
    Client.prototype.query = function(config, values, callback) {
      var query = new NativeQuery(this.native);
    
      //support query('text', ...) style calls
      if(typeof config == 'string') {
        query.text = config;
      }
    
      //support passing everything in via a config object
      if(typeof config == 'object') {
        query.text = config.text;
        query.values = config.values;
        query.name = config.name;
        query.callback = config.callback;
        query._arrayMode = config.rowMode == 'array';
      }
    
      //support query({...}, function() {}) style calls
      //& support query(..., ['values'], ...) style calls
      if(typeof values == 'function') {
        query.callback = values;
      }
      else if(util.isArray(values)) {
        query.values = values;
      }
      if(typeof callback == 'function') {
        query.callback = callback;
      }
    
      this._queryQueue.push(query);
      this._pulseQueryQueue();
      return query;
    };
    
    //disconnect from the backend server
    Client.prototype.end = function(cb) {
      var self = this;
      if(!this._connected) {
        this.once('connect', this.end.bind(this, cb));
      }
      this.native.end(function() {
        //send an error to the active query
        if(self._hasActiveQuery()) {
          var msg = 'Connection terminated';
          self._queryQueue.length = 0;
          self._activeQuery.handleError(new Error(msg));
        }
        self.emit('end');
        if(cb) cb();
      });
    };
    
    Client.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state != 'error' && this._activeQuery.state != 'end';
    };
    
    Client.prototype._pulseQueryQueue = function(initialConnection) {
      if(!this._connected) {
        return;
      }
      if(this._hasActiveQuery()) {
        return;
      }
      var query = this._queryQueue.shift();
      if(!query) {
        if(!initialConnection) {
          this.emit('drain');
        }
        return;
      }
      this._activeQuery = query;
      query.submit(this);
      var self = this;
      query.once('_done', function() {
        self._pulseQueryQueue();
      });
    };
    
    //attempt to cancel an in-progress query
    Client.prototype.cancel = function(query) {
      if(this._activeQuery == query) {
        this.native.cancel(function() {});
      } else if (this._queryQueue.indexOf(query) != -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
      }
    };
    
    Client.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    
    Client.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
    
  provide("pg/lib/native", module.exports);
}(global));

// pakmanager:pg
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var Client = require(__dirname+'/client');
    var defaults =  require(__dirname + '/defaults');
    var pool = require(__dirname + '/pool');
    var Connection = require(__dirname + '/connection');
    
    var PG = function(clientConstructor) {
      EventEmitter.call(this);
      this.defaults = defaults;
      this.Client = pool.Client = clientConstructor;
      this.Query = this.Client.Query;
      this.pools = pool;
      this.Connection = Connection;
      this.types = require('pg-types');
    };
    
    util.inherits(PG, EventEmitter);
    
    PG.prototype.end = function() {
      var self = this;
      var keys = Object.keys(self.pools.all);
      var count = keys.length;
      if(count === 0) {
        self.emit('end');
      } else {
        keys.forEach(function(key) {
          var pool = self.pools.all[key];
          delete self.pools.all[key];
          pool.drain(function() {
            pool.destroyAllNow(function() {
              count--;
              if(count === 0) {
                self.emit('end');
              }
            });
          });
        });
      }
    };
    
    
    PG.prototype.connect = function(config, callback) {
      if(typeof config == "function") {
        callback = config;
        config = null;
      }
      var pool = this.pools.getOrCreate(config);
      pool.connect(callback);
      if(!pool.listeners('error').length) {
        //propagate errors up to pg object
        pool.on('error', this.emit.bind(this, 'error'));
      }
    };
    
    // cancel the query runned by the given client
    PG.prototype.cancel = function(config, client, query) {
      if(client.native) {
        return client.cancel(query);
      }
      var c = config;
      //allow for no config to be passed
      if(typeof c === 'function') {
        c = defaults;
      }
      var cancellingClient = new this.Client(c);
      cancellingClient.cancel(client, query);
    };
    
    if(typeof process.env.NODE_PG_FORCE_NATIVE != 'undefined') {
      module.exports = new PG( require('pg/lib/native'));
    } else {
      module.exports = new PG(Client);
    
      //lazy require native module...the native module may not have installed
      module.exports.__defineGetter__("native", function() {
        delete module.exports.native;
        module.exports.native = new PG( require('pg/lib/native'));
        return module.exports.native;
      });
    }
    
  provide("pg", module.exports);
}(global));

// pakmanager:debug
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
    /**
     * Module dependencies.
     */
    
    var tty = require('tty');
    var util = require('util');
    
    /**
     * This is the Node.js implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */
    
    exports = module.exports =   require('debug');
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    
    /**
     * Colors.
     */
    
    exports.colors = [6, 2, 3, 4, 5, 1];
    
    /**
     * The file descriptor to write the `debug()` calls to.
     * Set the `DEBUG_FD` env variable to override with another value. i.e.:
     *
     *   $ DEBUG_FD=3 node script.js 3>debug.log
     */
    
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    var stream = 1 === fd ? process.stdout :
                 2 === fd ? process.stderr :
                 createWritableStdioStream(fd);
    
    /**
     * Is stdout a TTY? Colored output is enabled when `true`.
     */
    
    function useColors() {
      var debugColors = (process.env.DEBUG_COLORS || '').trim().toLowerCase();
      if (0 === debugColors.length) {
        return tty.isatty(fd);
      } else {
        return '0' !== debugColors
            && 'no' !== debugColors
            && 'false' !== debugColors
            && 'disabled' !== debugColors;
      }
    }
    
    /**
     * Map %o to `util.inspect()`, since Node doesn't do that out of the box.
     */
    
    var inspect = (4 === util.inspect.length ?
      // node <= 0.8.x
      function (v, colors) {
        return util.inspect(v, void 0, void 0, colors);
      } :
      // node > 0.8.x
      function (v, colors) {
        return util.inspect(v, { colors: colors });
      }
    );
    
    exports.formatters.o = function(v) {
      return inspect(v, this.useColors)
        .replace(/\s*\n\s*/g, ' ');
    };
    
    /**
     * Adds ANSI color escape codes if enabled.
     *
     * @api public
     */
    
    function formatArgs() {
      var args = arguments;
      var useColors = this.useColors;
      var name = this.namespace;
    
      if (useColors) {
        var c = this.color;
    
        args[0] = '  \u001b[3' + c + ';1m' + name + ' '
          + '\u001b[0m'
          + args[0] + '\u001b[3' + c + 'm'
          + ' +' + exports.humanize(this.diff) + '\u001b[0m';
      } else {
        args[0] = new Date().toUTCString()
          + ' ' + name + ' ' + args[0];
      }
      return args;
    }
    
    /**
     * Invokes `console.error()` with the specified arguments.
     */
    
    function log() {
      return stream.write(util.format.apply(this, arguments) + '\n');
    }
    
    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    
    function save(namespaces) {
      if (null == namespaces) {
        // If you set a process.env field to null or undefined, it gets cast to the
        // string 'null' or 'undefined'. Just delete instead.
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }
    
    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    
    function load() {
      return process.env.DEBUG;
    }
    
    /**
     * Copied from `node/src/node.js`.
     *
     * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
     * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
     */
    
    function createWritableStdioStream (fd) {
      var stream;
      var tty_wrap = process.binding('tty_wrap');
    
      // Note stream._type is used for test-module-load-list.js
    
      switch (tty_wrap.guessHandleType(fd)) {
        case 'TTY':
          stream = new tty.WriteStream(fd);
          stream._type = 'tty';
    
          // Hack to have stream not keep the event loop alive.
          // See https://github.com/joyent/node/issues/1726
          if (stream._handle && stream._handle.unref) {
            stream._handle.unref();
          }
          break;
    
        case 'FILE':
          var fs = require('fs');
          stream = new fs.SyncWriteStream(fd, { autoClose: false });
          stream._type = 'fs';
          break;
    
        case 'PIPE':
        case 'TCP':
          var net = require('net');
          stream = new net.Socket({
            fd: fd,
            readable: false,
            writable: true
          });
    
          // FIXME Should probably have an option in net.Socket to create a
          // stream from an existing fd which is writable only. But for now
          // we'll just add this hack and set the `readable` member to false.
          // Test: ./node test/fixtures/echo.js < /etc/passwd
          stream.readable = false;
          stream.read = null;
          stream._type = 'pipe';
    
          // FIXME Hack to have stream not keep the event loop alive.
          // See https://github.com/joyent/node/issues/1726
          if (stream._handle && stream._handle.unref) {
            stream._handle.unref();
          }
          break;
    
        default:
          // Probably an error on in uv_guess_handle()
          throw new Error('Implement me. Unknown stream file type!');
      }
    
      // For supporting legacy API we put the FD here.
      stream.fd = fd;
    
      stream._isStdio = true;
    
      return stream;
    }
    
    /**
     * Enable namespaces listed in `process.env.DEBUG` initially.
     */
    
    exports.enable(load());
    
  provide("debug", module.exports);
}(global));

// pakmanager:sails-pg-session/lib/sails-pg-session
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /*!
     * sails-pg-session
     * @author Ravi Teja <ravi-tej@live.com>
     * @version 1.0.0
     */
    
    
    /* global sails, module */
    
    /**
     * Return the `PostSQLStore` extending `connect`'s session Store.
     *
     * @param {object} connect
     * @return {Function}
     * @api public
     */
    
    module.exports = function (connect) {
    
      /**
       * Connect's Store.
       */
    
      var Store = connect.session.Store;
    
      /**
       * Initialize PostSQLStore with the given `options`.
       *
       * @param {Object} options
       * @api public
       */
    
      function PostSQLStore(options) {
        var self = this;
    
        options = options || {};
        Store.call(this, options);
    
        var pg = require('pg');
    
        this.pg_client = new pg.Client(options);
        this.pg_client.connect(function (err, client, done) {
          if (err) {
            sails.log.error('sails-pg-session#PostSQLStore - ', err);
          } else {
            sails.log.info('sails-pg-session#PostSQLStore - Success - Postgres connection successfull');
          }
        });
      }
    
      /**
       * Inherit from `Store`.
       */
    
      PostSQLStore.prototype.__proto__ = Store.prototype;
    
      /**
       * Attempt to fetch session by the given `sid`.
       *
       * @param {String} sid
       * @param {Function} fn
       * @api public
       */
    
      PostSQLStore.prototype.get = function (sid, fn) {
        this.pg_client.query("SELECT data_out FROM sails_session_store_get($1)", [sid], function (err, result) {
          if (err) {
            sails.log.error('sails-pg-session#get - ', err);
            return fn(err);
          }
          sails.log.info('sails-pg-session#get - ',result);
          return fn(null, result.rows[0].data_out);
        });
      };
    
      /**
       * Commit the given `sess` object associated with the given `sid`.
       *
       * @param {String} sid
       * @param {Session} sess
       * @param {Function} fn
       * @api public
       */
    
      PostSQLStore.prototype.set = function (sid, sess, fn) {
        try {
          this.pg_client.query("SELECT sails_session_store_set($1,$2)", [sid, sess], function (err, result) {
            if (err) {
              sails.log.error('sails-pg-session#set - ', err);
              return fn && fn(err);
            }
            sails.log.info('sails-pg-session#set - ',result);
            fn && fn(null);
          });
        } catch (err) {
          sails.log.error('sails-pg-session#set - Catch - ',err);
          fn && fn(err);
        }
      };
    
      /**
       * Destroy the session associated with the given `sid`.
       *
       * @param {String} sid
       * @param {Callback} fn
       * @api public
       */
    
      PostSQLStore.prototype.destroy = function (sid, fn) {
        this.pg_client.query("SELECT sails_session_store_destroy($1)", [sid], function (err, result) {
          if (err) {
            sails.log.error('sails-pg-session#destroy - ',err);
            return fn && fn(err);
          }
          sails.log.info('sails-pg-session#destroy - ',result);
          fn && fn();
        });
      };
    
      PostSQLStore.prototype.length = function (callback) {
        try {
          this.pg_client.query("SELECT length FROM sails_session_store_length()", function (err, result) {
            if (err) {
              sails.log.error('sails-pg-session#length - ',err);
              return callback && callback(err);
            }
            sails.log.info('sails-pg-session#length - ',result);
            callback && callback(null, length);
          });
        } catch (err) {
          sails.log.error('sails-pg-session#length - Catch - ',err);
          callback && callback(err);
        }
      };
    
      PostSQLStore.prototype.clear = function (callback) {
        this.pg_client.query("SELECT sails_session_store_clear()", function (err, result) {
          if (err) {
            sails.log.error('sails-pg-session#clear ',err);
            return callback && callback(err);
          }
          sails.log.info('sails-pg-session#clear ',result);
          callback && callback();
        });
      };
    
      return PostSQLStore;
    };
    
  provide("sails-pg-session/lib/sails-pg-session", module.exports);
}(global));

// pakmanager:sails-pg-session
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  
    module.exports =  require('sails-pg-session/lib/sails-pg-session');
  provide("sails-pg-session", module.exports);
}(global));