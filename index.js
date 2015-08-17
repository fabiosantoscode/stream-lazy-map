'use strict'

var assert = require('assert')
var stream = require('stream')

module.exports =
function lazyMap(mapFn, options) {
    options = options || {}

    assert(options.limit && options.limit > 0, 'Options.limit should be a number greater than 0!')

    var limit = options.limit
    var preserveOrder = options.preserveOrder !== false

    var self = new stream.Transform(options || {})

    var chunkCount = 0
    var latestMappedChunk = undefined

    var sortBuffer = []
    function drainSortBuffer() {
        if (chunkCount > 0 && sortBuffer.length) {
            var from = latestMappedChunk + 1 || 0
            var to = chunkCount
            for (var i = from; i < to; i++) {
                var found = false;
                for (var j = 0; j < sortBuffer.length; j++) {
                    if (sortBuffer[j] && sortBuffer[j][0] === i) {
                        sortBuffer.splice(j, 1)[0][1]()
                        found = true;
                    }
                }
                if (!found) {
                    // Must find and push adjacent chunkIds
                    break;
                }
            }
        }
    }

    var endFlushing = null  // We get this when the stream is flushing, and call it when there's nothing else to execute.
    var currentlyExecuting = 0
    self._transform = function(chunk, _, callback) {
        var thisChunkId = chunkCount++
        currentlyExecuting++

        var calledBack = false
        if (currentlyExecuting < limit) {
            calledBack = true
            callback()
        }

        mapFn(chunk, function(err, data) {
            currentlyExecuting--

            function pushThisChunk() {
                latestMappedChunk = thisChunkId
                if (calledBack) {
                    self.push(data)
                } else {
                    callback(err || null, data)
                }
            }

            if (preserveOrder && !(thisChunkId === 0 || latestMappedChunk === thisChunkId - 1)) {
                sortBuffer.push([thisChunkId, pushThisChunk])
            } else {
                pushThisChunk()
            }

            drainSortBuffer()

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

