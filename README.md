# stream-lazy-map

When you want to perform an async map functions on a stream, but don't want to fire off 1000 async operations.

You may like to use this if you're reading from a file with, say, ten thousand URLs and firing a request for each of them. Unless you limit how many requests you can have in the air at any time, you're going to end up firing ten thousand URLs in the time it takes your operating system to read a small file, waste your entire RAM, and totally jam your network card.

This uses node's backpressure algorithm to tell upstream to just chill out while you do your thing.

And keeping the chunks in the same order of arrival is on by default, in case you're worried that sometimes your async operation can take a while.


## Example

In the example below, no matter how many objects the `reallyFastStream` can throw at us, there will be at most 10 `doSomethingAsync` operations running at any moment in time.

```
var streamLazyMap = require('stream-lazy-map')
var inStream = reallyFastStream()
var outStream = inStream.pipe(streamLazyMap(function(data, callback) {
    doSomethingAsync(data, function(err, result) {
        if (err) { return callback(err) }
        callback(null, result)
    })
}, { objectMode: true, limit: 10 }))
```

*No matter what happens, be sure to make the mapper function call back!*


## Options

The first argument is the map function`(function mapper(data, callback) { callback(error, transformedData) })`. The second argument is a hash of options.

 * `limit` *mandatory*: How many of these map functions do you want to run at any time? Must be more than 0!
 * `preserveOrder` (default: `true`): If you don't care about the order that things come out of this stream, save yourself some RAM and turn this off.

Other stream options, such as `objectMode`, are passed as arguments to the `stream.Transform` constructor.

