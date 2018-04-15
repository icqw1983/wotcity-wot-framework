/**
 *
 * WoT.City Open Source Project
 * 
 * Copyright 2015 Jollen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

 "use strict";

/**
 * Main WoT Framework
 */
var Framework = require('../lib/framework');

/**
 * Main Server Modules
 */
var CoapBroker = require("../lib/coapServer/server")
  , Router = require("../lib/coapServer/router")
  , RequestHandlers = require("../lib/coapServer/requestHandlers");

/**
 * Util Modules
 */
var merge = require('utils-merge');

/**
 * CoAP URL Router
 */
var coapHandlers = {
   "/object/([A-Za-z0-9-]+)/send": RequestHandlers.sendProxyingWebSocket,
   "/object/([A-Za-z0-9-]+)/viewer": RequestHandlers.viewer,
   "/object/([A-Za-z0-9-]+)/status": RequestHandlers.status
};

/*
 * Prototype and Class
 */
var Server = function () {
  this.server = null;  
  this.callbacks = {
    ondata: function() { return 0; },
    onnewthing: function() { return 0; },
    onstart: function() { return 0; }
  };
};

/**
 * Event Callback System
 */
Server.prototype.onNewThing = function(thing) {
  // Call framework APIs
  this.registerThing(thing);
  this.callbacks['onnewthing'](thing);  
};

/**
 * Event callback factory
 */
Server.prototype.onData = function(payload) {
  // Call framework APIs
  //console.log('<DATA> ' + payload.data);
  this.callbacks['ondata'](payload);
};

/**
 * Event callback factory
 */
Server.prototype.onStart = function(payload) {
  this.callbacks['onstart'](payload);
};

/**
 * Create an WoT server.
 *
 * @return {Object}
 * @api public
 */
function createServer(options) {
  var instance = new Server();
  return merge(instance, options);
}

/**
 * Start a CoAP server.
 *
 * @return {None}
 * @api public
 */
Server.prototype.start = function(options) {
  var port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
  var host = process.env.HOST ? String(process.env.HOST) : 'localhost';
  var endpoints = [];

  if (options && options.endpoints) {
    endpoints = options.endpoints;
  } else if (typeof process.env.ENDPOINT === 'string') {
    endpoints.push(process.env.ENDPOINT);
  }

  if (options && options.ondata && typeof options.ondata === 'function') 
    this.callbacks['ondata'] = options.ondata;

  if (options && options.onnewthing && typeof options.onnewthing === 'function')   
    this.callbacks['onnewthing'] = options.onnewthing;

  if (options && options.onstart && typeof options.onstart === 'function')   
    this.callbacks['onstart'] = options.onstart;

  var server = new CoapBroker({
    port: port,
    host: host,
    endpoints: endpoints
  });
  var router = new Router();

  // Events callback factory
  server.on('newThing', this.onNewThing.bind(this));
  server.on('data', this.onData.bind(this));
  server.on('start', this.onStart.bind(this));

  server.startAsProxy(router.route, coapHandlers);

  this.server = server;
};

/**
 * Shutdown the CoAP server.
 *
 * @param cb {Function} The complete callback
 * @return {}
 * @api public
 */
Server.prototype.shutdown = function(cb) {                                  
  if (this.server)
    this.server.shutdown(cb);
}

/**
 * Create the server instance.
 */
var coapBrokerImpl = createServer({});

/**
 * Combined server with framework instance.
 */
var coapServer = new Framework({
  server: coapBrokerImpl
});

if (typeof(module) != "undefined" && typeof(exports) != "undefined")
  module.exports = coapServer;

/**
 * Start the server.
 */
if (!module.parent)
  coapServer.start();
