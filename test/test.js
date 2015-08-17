'use strict'

var ok = require('assert')
var es = require('event-stream')
var lazyMap = require('../index.js')

describe('stream-lazy-map', function() {
    it('basically works like mapAsync for really fast functions', function(done) {
        es.readArray([1,2,3,4])
            .pipe(lazyMap(function(chunk, cb) {
                cb(null, chunk + 1)
            }, { objectMode: true, limit: 2 }))
            .pipe(es.writeArray(function(err, arr) {
                ok(!err)
                ok.deepEqual(arr, [2,3,4,5])
                done()
            }))
    })
    it('also works for slower functions', function(done) {
        es.readArray([1,2,3,4])
            .pipe(lazyMap(function(chunk, cb) {
                setTimeout(function() {
                    cb(null, chunk + 1)
                }, 100)
            }, { objectMode: true, limit: 2 }))
            .pipe(es.writeArray(function(err, arr) {
                ok(!err)
                ok.deepEqual(arr, [2,3,4,5])
                done()
            }))
    })
    it('limits the concurrency to `limit`', function(done) {
        var concurrency = 0
        es.readArray([1,2,1,2])
            .pipe(lazyMap(function(chunk, cb) {
                concurrency++
                ok.equal(concurrency, chunk)
                setTimeout(function() {
                    concurrency--
                    cb(null, null)
                }, 100)
            }, { objectMode: true, limit: 2 }))
            .on('end', done)
            .resume()  // make it flow
    })
    it('keeps stream order by default', function(done) {
        es.readArray([1,2,3,4,5,6])
            .pipe(lazyMap(function(chunk, cb) {
                setTimeout(function() {
                    cb(null, chunk)
                }, (7 - chunk) * 40)
            }, { objectMode: true, limit: 4 }))
            .pipe(es.writeArray(function(err, arr) {
                ok(!err)
                ok.deepEqual(arr, [1,2,3,4,5,6])
                done()
            }))
    })
    it('can ditch order when it doesn\'t matter', function(done) {
        es.readArray([1,2,3,4,5,6])
            .pipe(lazyMap(function(chunk, cb) {
                setTimeout(function() {
                    cb(null, chunk)
                }, (7 - chunk) * 40)
            }, { objectMode: true, limit: 2, preserveOrder: false }))
            .pipe(es.writeArray(function(err, arr) {
                ok(!err)
                ok.deepEqual(arr, [2,1,3,5,4,6])
                done()
            }))
    })
})

