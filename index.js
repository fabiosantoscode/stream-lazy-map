'use strict'

var assert = require('assert')
var stream = require('stream')

module.exports =
function lazyMap(mapFn, options) {
    options = options || {}

    assert(options.limit && options.limit > 0, 'Options.limit should be a number greater than 0!')

    var limit = options.limit

    var self = new stream.Transform(options || {})

    var endFlushing = null  // We get this when the stream is flushing, and call it when there's nothing else to execute.
    var currentlyExecuting = 0
    self._transform = function(chunk, _, callback) {
        currentlyExecuting++

        var calledBack = false
        if (currentlyExecuting < limit) {
            calledBack = true
            callback()
        }

        mapFn(chunk, function(err, data) {
            currentlyExecuting--
            if (calledBack)
                self.push(data)
            else
                callback(err || null, data)
            if (currentlyExecuting === 0 && endFlushing) {
                endFlushing()
                self.emit('end')
            }
        })
    }

    self._flush = function(flushBack) {
        if (currentlyExecuting == 0) {
            flushBack()
        } else {
            endFlushing = flushBack
        }
    }

    return self
}

