/**
 * This is a test script I use (with small changes) with all my drivers.
 * 
 * It sets up a fake 'mini-client' that starts the driver with just enough of what client 
 * provides so that it can run.
 *
 * Driver settings(opts) are not persisted between runs, but it can be altered to do that
 * relatively easy using :
 * 
 * require('config.json') 
 * 
 * and 
 * 
 * fs.writeFileSync('config.json', JSON.stringify(opts))
 */

var EventEmitter = require('events').EventEmitter;

var opts = require('./package.json').config;

/* 
 * "app" is the application wide event emitter, that is... it's a channel the different parts of client
 * can use to communicate. Most system-wide events (like connect, disconnect, new device etc.) come through here.
 */
var app = new EventEmitter();

/* In client, the log is provided by log4js, but to save the dependency, I just map console log :) */
app.log = {
    debug: console.log,
    info: console.log,
    warn: console.log,
    error: console.log
};

/* Here we require(aka import) our driver, and instantiate it with it's settings and a reference to the app */
var driver = new (require('./index'))(opts, app);

/* 
 * All driver must be EventEmitters, therefore we can call 'on' to listen to its 'register' event,
 * where the driver provides a new device to be registered in the system. In the real client, we would
 * then be telling the cloud service and the local rest API, but in this case we'll just print out a log message 
 */
driver.on('register', function(device) {
  console.log('Driver.register', device);
  device.on('data', function(value) {
      console.log('Device.emit ', device.name, ' data:', value);
  });
 
  // "D" is the device id, you can see a list of device ids here : http://ninjablocks.com/pages/device-ids
  if (device.D == 238 || device.D == 1009) { // It's a relay
    var x = false;

    // When we see a relay device, write alternating true/false values to it every 5 seconds
    setInterval(function() {
       device.write(x=!x);
    }, 5000);
  }

});

driver.save = function() {
  console.log('Saved opts', opts);
};

/*
 * After 500ms (enough time for a driver to get ready, they are used to having some time!) we send the 'client::up'
 * event, which is usually emitted when the client has successfully connected to the cloud, and drivers
 * are free to start providing devices.
 */
setTimeout(function() {
  app.emit('client::up');
}, 500);
