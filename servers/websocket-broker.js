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
var WebsocketBroker = require("../lib/websocketBrokerServer/server")
  , WebsocketRouter = require("../lib/websocketBrokerServer/router")
  , RequestHandlers = require("../lib/websocketBrokerServer/requestHandlers");

/**
 * Util Modules
 */
var merge = require('utils-merge');

/**
 * Websocket URL Router
 */
var wsHandlers = {
   "/object/([A-Za-z0-9-]+)/send": RequestHandlers.send,
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
 * Event callback factory
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
 * Start a Websocket server.
 *
 * @param options {Object} The event callbacks
 * @return {None}
 * @api public
 */
Server.prototype.start = function(options) {
  var port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
  var host = process.env.HOST ? process.env.HOST : 'localhost';
  var endpoints = options.endpoints || [];

  if (typeof process.env.ENDPOINT === 'string')
    endpoints.push(process.env.ENDPOINT);
  
  if (options && options.ondata && typeof options.ondata === 'function') 
    this.callbacks['ondata'] = options.ondata;

  if (options && options.onnewthing && typeof options.onnewthing === 'function')   
    this.callbacks['onnewthing'] = options.onnewthing;

  if (options && options.onstart && typeof options.onstart === 'function')   
    this.callbacks['onstart'] = options.onstart;

  var server = new WebsocketBroker({
    port: port,
    host: host,
    endpoints: endpoints
  });
  var router = new WebsocketRouter();

  // Events callback factory
  server.on('newThing', this.onNewThing.bind(this));
  server.on('data', this.onData.bind(this));
  server.on('start', this.onStart.bind(this));

  server.start(router.route, wsHandlers);

  this.server = server;
};

/**
 * Shutdown the Websocket server.
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
var wsBrokerImpl = createServer({});

/**
 * Combined server with framework instance.
 */
var wsServer = new Framework({
	server: wsBrokerImpl
});

if (typeof(module) != "undefined" && typeof(exports) != "undefined")
  module.exports = wsServer;

/**
 * Start the server.
 */
if (!module.parent)
  wsServer.start();