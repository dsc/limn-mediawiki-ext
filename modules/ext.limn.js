;
require.define('/node_modules/limn/config.js', function(require, module, exports, __dirname, __filename, undefined){

var ref$, _, root, Config, out$ = typeof exports != 'undefined' && exports || this;
ref$ = require('./util'), _ = ref$._, root = ref$.root;
/**
 * @class Limn configuration. On initialization, two globals are searched:
 *  - `limn_config`, an object that can hold any configuration.
 *  - `limn_render`, an array of "<graph_id> <selector>", instructing limn to render that graph into the first element matching the given selector.
 * 
 */
out$.Config = Config = (function(){
  Config.displayName = 'Config';
  var prototype = Config.prototype, constructor = Config;
  /**
   * Configuration defaults.
   */
  prototype.DEFAULT_CONFIG = {
    mode: 'lib',
    DOMReady: false,
    server: {
      base: '/',
      remoteMode: 'error'
    },
    data: {
      lazy: false
    },
    render: {
      lazy: true,
      markup: true
    }
  };
  prototype._userConfig = null;
  prototype._fullConfig = null;
  function Config(conf){
    conf == null && (conf = {});
    this._userConfig = {};
    this._fullConfig = _.merge({}, this.DEFAULT_CONFIG);
    this.update(conf);
  }
  prototype.canonicalize = function(conf){
    if (conf.render.lazyLoad) {
      conf.render.lazyRender = true;
    }
    return conf;
  };
  prototype.update = function(conf){
    var k;
    conf == null && (conf = {});
    this._userConfig = _.merge({}, this._userConfig, conf);
    this._fullConfig = this.canonicalize(_.merge({}, this._fullConfig, this._userConfig));
    for (k in this.DEFAULT_CONFIG) {
      this[k] = this._fullConfig[k];
    }
    return this;
  };
  /**
   * Prefix a path with the server mount point.
   */
  prototype.mount = function(path){
    var mnt;
    path == null && (path = '');
    mnt = this.server.base || '/';
    if ('/' == mnt[mnt.length - 1]) {
      mnt = mnt.slice(0, -1);
    }
    if ('/' == path[0]) {
      path = path.slice(1);
    }
    return mnt + "/" + path;
  };
  prototype.toJSON = function(){
    return _.merge({}, this._fullConfig);
  };
  return Config;
}());

});

;
require.define('/node_modules/limn/hosted-app.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * @fileOverview App logic for Limn when hosted on a Limn server.
 */
var limn, ko, page, LimnHostedApp;
limn = require('limn');
ko = require('knockout');
page = require('page');
/**
 * @class Sets up root application, automatically attaching to an existing element
 *  found at `appSelector` and delegating to the appropriate view.
 */
limn.LimnHostedApp = LimnHostedApp = (function(){
  LimnHostedApp.displayName = 'LimnHostedApp';
  var prototype = LimnHostedApp.prototype, constructor = LimnHostedApp;
  prototype.VIEWS = {
    'dashboards': limn.dashboard.DashboardView,
    'graphs': limn.graph.GraphView,
    'datasources': limn.data.datasource.DataSourceView,
    '404': limn.base.NotFoundView,
    'loading': limn.base.LoadingView
  };
  prototype.CREATE_VIEWS = {
    'graphs': limn.graph.GraphCreateView
  };
  /**
   * Current view.
   * @type ko.observable<View>
   */
  prototype.currentView = null;
  /**
   * @constructor
   */;
  function LimnHostedApp(){
    var this$ = this;
    this.currentView = ko.observable();
    ko.computed(function(){
      var obs, view, model, ref$, prev;
      obs = this$.currentView;
      view = limn.view = obs();
      model = limn.model = view != null ? typeof view.model == 'function' ? view.model() : void 8 : void 8;
      ref$ = [obs.prev, view], prev = ref$[0], obs.prev = ref$[1];
      if (view) {
        return limn.trigger('app-view-changed', view, prev, this$);
      }
    });
    this.currentView(new limn.base.LoadingView());
    window.addEventListener('click', function(evt){
      if (!$(evt.target).is('.graph-raw-data-row a,.not-client-side')) {
        return;
      }
      evt.stopPropagation();
      return false;
    }, true);
    ko.applyBindings(this, limn.$('#content')[0]);
    this.setupRoutes();
  }
  prototype.setupRoutes = function(){
    var this$ = this;
    page('/:view?/:id?/:action?', function(context, next){
      var ref$, view, id, action, views, ViewType;
      ref$ = context.params, view = ref$.view, id = ref$.id, action = ref$.action;
      if (!view) {
        view = 'dashboards';
        id = 'reportcard';
      }
      if (_(['create', 'list']).contains(id)) {
        action = id;
        id = null;
      }
      switch (action) {
      case 'create':
        views = this$.CREATE_VIEWS;
        break;
      default:
        views = this$.VIEWS;
      }
      if (ViewType = views[view]) {
        this$.currentView(new ViewType(id, action));
        return this$.scrollTo(0, 0);
      } else {
        return next();
      }
    });
    page('*', function(){
      this$.currentView(new this$.VIEWS['404']());
      return this$.scrollTo(0, 0);
    });
    return this.route();
  };
  prototype.route = function(){
    return page();
  };
  prototype.scrollTo = function(x, y){
    x == null && (x = 0);
    y == null && (y = 0);
    if (window.scrollX === x && window.scrollY === y) {
      return false;
    }
    window.scrollTo(x, y);
    return true;
  };
  return LimnHostedApp;
}());
limn.hosted = new LimnHostedApp();

});

;
require.define('/node_modules/limn/message.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, limn, ref$, Model, View, Message, messages, message, info, success, error, container, fadeIn, out$ = typeof exports != 'undefined' && exports || this;
ko = require('knockout');
limn = require('limn');
ref$ = require('./base'), Model = ref$.Model, View = ref$.View;
out$.Message = Message = (function(superclass){
  Message.displayName = 'Message';
  var prototype = extend$(Message, superclass).prototype, constructor = Message;
  function Message(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      type: null,
      icon: null,
      title: null,
      msg: ''
    };
  };
  return Message;
}(Model));
out$.messages = messages = ko.observableArray();
/**
 * Displays a message.
 */
out$.message = message = function(msg, title, icon, type){
  var m;
  if (!(msg || title)) {
    return;
  }
  messages.push(m = new Message({
    msg: msg,
    title: title,
    type: type,
    icon: icon
  }));
  return m;
};
/**
 * Displays an info message.
 */
out$.info = info = function(msg, title, icon){
  return message(msg, title, icon, 'info');
};
/**
 * Displays a success message.
 */
out$.success = success = function(msg, title, icon){
  return message(msg, title, icon, 'success');
};
/**
 * Displays an error message.
 */
out$.error = error = function(msg, title, icon){
  return message(msg, title, icon, 'error');
};
container = limn.$('<section id="limn-messages" data-bind="template: { name:\'message\', foreach:messages, afterAdd:fadeIn }" />').appendTo(limn.$('body')).on('closed', '.alert', function(){
  var that;
  if (that = ko.dataFor(this)) {
    return messages.remove(that);
  }
});
fadeIn = function(el){
  if (el.nodeType === 1) {
    return limn.$(el).show('slow');
  }
};
ko.applyBindings({
  messages: messages,
  fadeIn: fadeIn
}, container[0]);
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/version.js', function(require, module, exports, __dirname, __filename, undefined){

exports.version = '0.1.0';

});

;
require.define('/node_modules/limn/index.js', function(require, module, exports, __dirname, __filename, undefined){

var limn, ref$, _, op, emitters, guidFor, compareIds, root, ref1$, ko, emitter, i$, ref2$, len$, k;
limn = exports;
limn.require = require;
import$(limn, require('./version'));
ref1$ = (ref$ = limn.util = require('./util'), _ = ref$._, op = ref$.op, emitters = ref$.emitters, guidFor = ref$.guidFor, compareIds = ref$.compareIds, root = ref$.root, ref$), limn._ = ref1$._, limn.op = ref1$.op, limn.emitters = ref1$.emitters, limn.guidFor = ref1$.guidFor, limn.compareIds = ref1$.compareIds;
ko = require('knockout');
limn.domReady = ko.observable(false);
if (root.jQuery) {
  limn.$ = root.jQuery || root.Zepto || root.ender;
  limn.$(function(){
    return limn.domReady(true);
  });
}
emitter = limn.__emitter__ = new emitters.ReadyEmitter();
for (i$ = 0, len$ = (ref2$ = ['on', 'addListener', 'off', 'removeListener', 'emit', 'trigger', 'once', 'removeAllListeners']).length; i$ < len$; ++i$) {
  k = ref2$[i$];
  limn[k] = emitter[k].bind(emitter);
}
limn.Config = require('./config').Config;
limn.config = new limn.Config(root.limn_config);
limn.message = require('./message');
limn.base = require('./base');
limn.template = require('./template');
limn.data = require('./data');
limn.graph = require('./graph');
limn.dashboard = require('./dashboard');
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/base/attributes-base.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ref$, unwrap, peek, _, Base, AttributesMixin, AttributesBase;
ko = require('knockout');
ref$ = ko.utils, unwrap = ref$.unwrapObservable, peek = ref$.peekObservable;
_ = require('../util/underscore');
Base = require('./base').Base;
AttributesMixin = require('./attributes-mixin').AttributesMixin;
/**
 * @class Root-class for classes using knockout for computed attributes.
 * @extends Base
 * @mixes AttributesMixin
 */
exports.AttributesBase = AttributesBase = (function(superclass){
  AttributesBase.displayName = 'AttributesBase';
  var prototype = extend$(AttributesBase, superclass).prototype, constructor = AttributesBase;
  AttributesMixin.mix(AttributesBase);
  /**
   * Attribute data-members of the class. Individual properties are also aliased
   * onto the instance itself if no property already exists.
   * 
   * @protected
   * @type Map<Key, ko.observable>
   */
  prototype.attributes = null;
  /**
   * Whether we've been signaled to start watchers.
   * @type Boolean
   */
  prototype.isWatching = false;
  /**
   * @constructor
   */;
  function AttributesBase(attributes){
    var values, attrTypes;
    attributes == null && (attributes = {});
    this.attributes = {};
    superclass.call(this);
    values = this._startingAttributes(attributes);
    attrTypes = _.collapseAllSuper(this, 'attributeTypes') || {};
    this.attributes = this._generateAttributes(values, attrTypes);
    _.defaults(this, this.attributes);
    this._setupObservables();
    this._setupSubscriptions();
    this.set(values);
    this;
  }
  /* * * *  Initialization  * * * {{{ */
  /**
   * Gets the value of the id attribute.
   * @returns {String} Instance's id.
   */
  prototype.getId = function(){
    return this.__id__;
  };
  /**
   * Invoked to acquire default attribute values.
   * 
   * Note that *all* known attributes of the Class should be included -- even
   * if simply as `null` keys (even the `id` attribute, if the object has a concept
   * of server-side global uniqueness!) -- so we can create the observables
   * fields.
   * 
   * @returns {Object} Map of default attribute values.
   */
  prototype.defaults = function(){
    return {};
  };
  /**
   * Invoked to acquire map of attribute keys to their types. Plain objects
   * are allowed for typing nested attributes. Coercion of new values will
   * be performed automatically by the attribute observables via
   * `ko.coerciveObservable()`.
   * 
   * @returns Map<Key, Class> Map of attribute keys to types.
   */
  prototype.attributeTypes = function(){
    return {};
  };
  /**
   * Invoked to transform raw attribute data into its "proper" form for
   * this object, whatever that might be.
   * 
   * @param {Object} data Raw attributes to canonicalize.
   * @returns {Object} Converted raw data.
   */
  prototype.canonicalize = function(data){
    return data;
  };
  /**
   * Inform sub-objects its safe to begin their watchers.
   * 
   * Note that this function **must** be invoked by the object creator once
   * construction is finished. It cannot be called automatically by the
   * constructor without causing a loop, potentially triggering updates
   * before anyone else can get a reference to the object.
   * 
   * This method must be idempotent; it should always be safe to call
   * it multiple times.
   */
  prototype.watching = function(){
    this.isWatching = true;
    return this;
  };
  /**
   * Merges the supplied attribute data with the class defaults, and then
   * canonicalizes the resulting data.
   * 
   * @protected
   * @param {Object} [attributes={}] Hash of nascent attributes.
   */
  prototype._startingAttributes = function(attributes){
    var defs;
    attributes == null && (attributes = {});
    defs = _.collapseAllSuper(this, 'defaults');
    return this.canonicalize(_.merge(defs, attributes));
  };
  /* * * *  Knockout-Aware Accessors  * * * {{{ */
  /**
   * Retrieves the attribute value at `key`.
   * 
   * If called by a computed observable, this function creates a dependency
   * on the accessed attribute (provided it exists).
   * 
   * @param {String} key Key to get.
   * @returns {*} Value at `key`.
   */
  prototype.get = function(key){
    var ref$;
    return unwrap((ref$ = this.attributes) != null ? ref$[key] : void 8);
  };
  /**
   * Retrieves the attribute value at `key`.
   * 
   * Even if called by a computed observable, this function does **not**
   * create a dependency on the accessed attribute.
   * 
   * @param {String} key Key to peek.
   * @returns {*} Value at `key`.
   */
  prototype.peek = function(key){
    var ref$;
    return peek((ref$ = this.attributes) != null ? ref$[key] : void 8);
  };
  /**
   * Puts a single attribute value to `key`.
   * 
   * @protected
   * @param {String} key Key to set.
   * @param {*} val Value to set at `key`.
   * @returns {this}
   */
  prototype._set = function(key, val){
    var obs;
    if (key == null) {
      return this;
    }
    if (this.attributes == null) {
      throw new Error("Attributes hash does not exist!");
    }
    if (!ko.isObservable(obs = this.attributes[key])) {
      obs = this.attributes[key] = this._generateAttribute(val, this.attributeTypes[key], key);
      this[key] == null && (this[key] = obs);
    }
    obs(val);
    return this;
  };
  /**
   * Sets attribute values, taking either a single (key, value)-pair, or
   * a map of them.
   * 
   * @param {String|Object} key The key to set. If an object is supplied here,
   *  each key will be set with its value on the target object.
   * @param {*} [value] Value to set at `key`. Omit this if an object of
   *  KV-pairs was passed as `key`.
   * @returns {this}
   */
  prototype.set = function(key, val){
    var values, ref$, value;
    if (key == null) {
      return this;
    }
    if (key && _.isObject(key)) {
      values = key;
    } else {
      values = (ref$ = {}, ref$[key + ""] = val, ref$);
    }
    for (key in values) {
      value = values[key];
      this._set(key, value);
    }
    return this;
  };
  /**
   * Sets the attribute value at `key` to `undefined`.
   * 
   * @param {String} key Key to unset.
   * @returns {this}
   */
  prototype.unset = function(key){
    return this._set(key, undefined);
  };
  /**
   * Sets the attribute value at `key` to `undefined`, and then removes
   * the observable from both the attributes hash and the instance (if attached).
   * 
   * @param {String} key Key to remove.
   * @returns {this}
   */
  prototype.remove = function(key){
    var obs;
    if (key == null) {
      return this;
    }
    if (this.attributes == null) {
      throw new Error("Attributes hash does not exist!");
    }
    if (ko.isObservable(obs = this.attributes[key])) {
      obs(undefined);
      if (typeof obs.dispose == 'function') {
        obs.dispose();
      }
      if (obs === this[key]) {
        delete this[key];
      }
    }
    delete this.attributes[key];
    return this;
  };
  /**
   * Updates object with new data such that it will only contain keys
   * found in the new attributes (and existing attributes will be unset).
   * 
   * @param {Object} values Key-value pairs to update.
   * @returns {this}
   */
  prototype.update = function(values){
    var i$, ref$, len$, k;
    if (this.attributes == null) {
      throw new Error("Attributes hash does not exist!");
    }
    this.set(values);
    for (i$ = 0, len$ = (ref$ = _.keys(this.attributes)).length; i$ < len$; ++i$) {
      k = ref$[i$];
      if (k in values) {
        continue;
      }
      this.remove(k);
    }
    return this;
  };
  /**
   * Delete all attributes from the object.
   * @returns {this}
   */
  prototype.clear = function(){
    return this.update({});
  };
  /**
   * Clone this object.
   * @returns {? extends AttributesBase} A new instance of this object, bearing the same attributes.
   */
  prototype.clone = function(){
    var json, Class;
    json = this.toJS(this.attributes);
    Class = this.constructor;
    return new Class(json);
  };
  /* * * *  Serialization  * * * {{{ */
  /**
   * Recursively unwrap any observables in the given attributes hash.
   * Called by `toJSON()`.
   * 
   * @returns {Object} A plain JS object, suitable for serialization.
   */
  prototype.toJS = function(attributes){
    var this$ = this;
    attributes == null && (attributes = this.attributes);
    return _.reduce(attributes, function(json, obs, key){
      var val, ref$, ref1$;
      val = peek(obs);
      if (typeof (val != null ? val.toJS : void 8) === 'function') {
        val = (ref$ = val.toJS()) != null ? ref$ : val;
      } else if (typeof (val != null ? val.toJSON : void 8) === 'function') {
        val = (ref1$ = val.toJSON()) != null ? ref1$ : val;
      } else if (_.isPlainObject(val)) {
        val = this$.toJS(val);
      }
      if (!(val == null || (_.isObject(val) && _.isEmpty(val)))) {
        json[key] = val;
      }
      return json;
    }, {});
  };
  prototype.toJSON = function(){
    return this.toJS(this.attributes);
  };
  prototype.toString = function(){
    var cid, Class, className;
    cid = this.__id__;
    Class = this.constructor;
    className = Class.displayName || Class.name;
    return className + "(cid=" + cid + ")";
  };
  /* * * *  Class Methods  * * * {{{ */
  /**
   * @static
   * @param {Object} [attributes] Starting attribute values.
   * @returns {? extends AttributesBase} A new instance of this class.
   */;
  AttributesBase.create = function(attributes){
    var ClassType;
    ClassType = this;
    return new ClassType(attributes);
  };
  /**
   * @static
   * @returns {Function} A factory function that creates new instances of this Model
   *  without requiring the accursed `new` keyword.
   */
  AttributesBase.factory = function(){
    return this.create.bind(this);
  };
  return AttributesBase;
}(Base));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/base/attributes-mixin.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ref$, unwrap, peek, ref1$, _, op, Mixin, AttributesMixin, slice$ = [].slice;
ko = require('knockout');
ref$ = ko.utils, unwrap = ref$.unwrapObservable, peek = ref$.peekObservable;
ref1$ = require('../util'), _ = ref1$._, op = ref1$.op, Mixin = ref1$.Mixin;
/**
 * @class Adds machinery that performs the heavy-lifting for setting up
 *  instance-level observers and computed properties, intended to be run
 *  during the constructor.
 * @extends Mixin
 */
exports.AttributesMixin = AttributesMixin = (function(superclass){
  AttributesMixin.displayName = 'AttributesMixin';
  var prototype = extend$(AttributesMixin, superclass).prototype, constructor = AttributesMixin;
  /**
   * Wraps the properties found in the `attributes` map with observables,
   * applying types as specified in `attrTypes`.
   * 
   * @protected
   * @param {Map} data Hash of nascent attributes.
   * @param {Map<String, Class|Function>} [attrTypes={}] Types coercion functions by key.
   * @param {Object} [target={}] Hash to which nascent attributes shall be attached.
   * @returns {Map<String, ko.observable} Map from attribute names to observables.
   */
  prototype._generateAttributes = function(data, attrTypes, target){
    var this$ = this;
    attrTypes == null && (attrTypes = {});
    target == null && (target = {});
    if (!data) {
      return target;
    }
    return _.reduce_(data, target, function(attributes, val, key){
      attributes[key] = this$._generateAttribute(val, attrTypes[key], key);
      return attributes;
    });
  };
  /**
   * Wraps a single attribute value with the appropriate observable machinery,
   * auto-coercing incoming data to `ClassType` if provided.
   * 
   * @protected
   * @param {*} val Initial value.
   * @param {Function|Class|Object} [coerceFn] Function invoked to coerce incoming data into
   *  the appropriate type. If the function appears to be a class constructor, it will
   *  be wrapped to perform an instanceof check to prevent double-wrapping, and otherwise
   *  invoke the class with `new`. If an object, it will be used for sub-lookups
   *  of attrTypes.
   * @param {String} [name] Attribute name.
   * @returns {ko.observable} The new observable attribute. You should assign
   *  this to the right place on `attributes`, bro.
   */
  prototype._generateAttribute = function(val, coerceFn, name){
    var isArray, obs;
    if (isArray = _.isArray(val)) {
      obs = ko.observableArray();
    } else {
      obs = ko.observable();
      if (typeof coerceFn !== 'function' && _.isPlainObject(val)) {
        coerceFn = this.constructor.plainSubclass(coerceFn || {});
      }
    }
    if (typeof coerceFn === 'function') {
      obs = obs.coerce(coerceFn, this, {
        isArray: isArray
      });
    }
    obs.displayName = name;
    obs.__owner__ = this;
    return obs;
  };
  /**
   * Build observables and computed property instances.
   * 
   * @protected
   * @param {Object} [target=this] Target object for processed properties.
   * @param {Object} [source=this] Source object to process.
   * @returns {Object} Target object.
   */
  prototype._setupObservables = function(target, source){
    var name, fn, obs;
    target == null && (target = this);
    source == null && (source = this);
    for (name in source) {
      fn = source[name];
      if (typeof fn !== 'function') {
        continue;
      }
      if (fn === this.attributes[name]) {
        continue;
      }
      obs = this._setupObservable(fn, name, target);
      if (obs !== fn) {
        target[name] = obs;
      }
    }
    return target;
  };
  /**
   * Build observable or computed property instance for a
   * given (methodName, method) pair.
   * 
   * @protected
   * @param {Function|T} fn Value at `name`, though we ignore non-functions.
   * @param {String} name Property name.
   * @param {Object} [owner=this] Owner-object for `ko.computed`.
   * @returns {ko.computed|ko.observable|T} New property value.
   */
  prototype._setupObservable = function(fn, name, owner){
    var info, decor, base, extender, options, wrapped, obs, val;
    owner == null && (owner = this);
    if (typeof fn !== 'function') {
      return fn;
    }
    if (fn === this.attributes[name]) {
      return fn;
    }
    info = {
      name: name,
      displayName: name,
      __owner__: this
    };
    if (decor = fn.__decorate__) {
      base = decor.base, extender = decor.extender, options = decor.options, wrapped = decor.wrapped;
      options = (import$({
        read: fn,
        owner: owner
      }, options));
      if (wrapped) {
        fn = fn();
      }
      if (base === 'computed') {
        obs = ko.computed(_.extend({}, options));
      } else {
        obs = ko[base]();
      }
      import$(obs, info);
      if (typeof obs[extender] !== 'function') {
        return obs;
      }
      if (_(['typed', 'model', 'coerce']).contains(extender)) {
        obs = obs[extender](fn, owner, options);
      } else {
        obs = obs[extender](options);
      }
      import$(obs, info);
      return obs;
    }
    if (ko.isObservable(fn)) {
      val = fn.peek();
      if (typeof (val != null ? val.clone : void 8) === 'function') {
        val = val.clone();
      } else if (_.isArray(val)) {
        val = val.slice();
      } else if (_.isObject(val)) {
        val = _.merge({}, val);
      }
      obs = ko.utils.toObservable(val);
      import$(obs, info);
      return obs;
    }
    return fn;
  };
  /**
   * Register subscriptions.
   * 
   * @protected
   * @param {Object} [target=this] Target object for processed properties.
   * @param {Object} [source=this] Source object to process.
   * @returns {Object} Target object.
   */
  prototype._setupSubscriptions = function(target, source){
    var name, fn, obs;
    target == null && (target = this);
    source == null && (source = this);
    for (name in source) {
      fn = source[name];
      if (typeof fn !== 'function') {
        continue;
      }
      if (fn === this.attributes[name]) {
        continue;
      }
      obs = this._setupSubscription(fn, name, target);
      if (obs !== fn) {
        target[name] = obs;
      }
    }
    return target;
  };
  /**
   * Register subscriptions for a given `(methodName, method)` pair.
   * 
   * @protected
   * @param {Function|T} fn Value at `name`, though we ignore non-functions.
   * @param {String} name Property name.
   * @returns {ko.subscription|T} New property value.
   */
  prototype._setupSubscription = function(fn, name, owner){
    var prop, obs;
    owner == null && (owner = this);
    if (typeof fn !== 'function') {
      return fn;
    }
    if (prop = fn.__onChange__) {
      obs = _.getNested(this, prop, null, {
        ensure: false,
        getter: '\0'
      });
      if (!ko.isObservable(obs)) {
        return fn;
      }
      return obs.onChange(fn, owner);
    }
    if (fn.__onBuild__) {
      owner.once('watch-build', fn.bind(owner));
    }
    return fn;
  };
  /* * * *  Class Definition Helpers  * * * {{{ */
  /**
   * @section Class Definition Helpers
   * 
   * Knockout was not designed for a declarative, class-oriented programming style.
   * Observers are objects; this means attaching an observer to a class's prototype
   * results in that observer being shared among all instances of the class!
   * 
   * The `AttributesMixin` provides several class methods (for convenience with `@`)
   * to avoid this, for use when declaring instance methods on a new class. Instead of
   * wrapping the method as a computed property immediately, they annotate it for
   * processing later, when a new instance of the class is created. This allows us
   * to declare observers and computed properties almost exactly as we would normally,
   * but avoid sharing state.
   * 
   * @example
   *  class Person
   *      AttributesMixin.mix this
   *      
   *      defaults : ->
   *          firstName : 'Bob'
   *          lastName  : 'Smith'
   *      
   *      fullName : @computed ->
   *          @firstName() + ' ' + @lastName()
   *      
   *      -> super ...
   * 
   */
  /**
   * Create a computed decorator function.
   * 
   * @private
   * @static
   * @param {String} decorator Name for the decorator we're creating.
   * @param {String} [extender] Name of an extender to apply to the base.
   * @param {String} [base='observable'] Base subscribable type;
   *  usually 'observable' or 'computed'.
   * @param {Boolean} [wrap=false] When true, wrap the method in an anonymous
   *  function. This allows functions (like class constructors) to be passed to
   *  the decorator without resulting in a mess of shared state.
   */;
  AttributesMixin.computedDecorator = function(decorator, extender, base, wrap){
    var Class, eagerName;
    base == null && (base = 'observable');
    Class = this;
    eagerName = _.camelize("eager_" + decorator);
    Class[decorator] = function(options, method){
      var ref$;
      if (typeof options === 'function') {
        ref$ = [options, {}], method = ref$[0], options = ref$[1];
      }
      if (wrap) {
        method = op.K(method);
      }
      options = import$({
        deferEvaluation: true
      }, options);
      method.__decorate__ = {
        decorator: decorator,
        base: base,
        extender: extender,
        options: options,
        wrapped: !!wrap
      };
      return method;
    };
    Class[eagerName] = function(options, method){
      var ref$;
      if (typeof options === 'function') {
        ref$ = [options, {}], method = ref$[0], options = ref$[1];
      }
      return this[decorator](import$({
        deferEvaluation: false
      }, options), method);
    };
    return Class;
  };
  /**
   * Decorates a method when attached to the class prototype so that it
   * becomes a computed property of the right type when the class is
   * instantiated. By default, such properties are lazy, deferring evaluation
   * until first read.
   * 
   * @static
   * @name computed
   * @param {Object} [options] Options to pass to the `ko.computed` type.
   * @param {Boolean} [options.deferEvaluation=true] Whether to defer
   *  calculation until first read.
   * @param {Function} method Method to decorate.
   * @returns {Function} Decorated method.
   */
  /**
   * Identical to `@computed`, excepting that the property's value is
   * immediately calculated upon instantiation (most likely in the class
   * constructor).
   * 
   * @static
   * @name eagerComputed
   * @param {Object} [options] Options to pass to the `ko.computed` type.
   * @param {Boolean} [options.deferEvaluation=false] Whether to defer
   *  calculation until first read.
   * @param {Function} method Method to decorate.
   * @returns {Function} Decorated method.
   * @see AttributesMixin.computed()
   */
  AttributesMixin.computedDecorator('computed', null, 'computed');
  AttributesMixin.computedDecorator('asyncComputed', 'async', 'computed');
  AttributesMixin.computedDecorator('typedObservable', 'typed', 'observable');
  AttributesMixin.computedDecorator('modeledObservable', 'model', 'observable', true);
  AttributesMixin.computedDecorator('coerciveObservable', 'coerce', 'observable', true);
  /**
   * Decorate a method to be notified of change events for the given
   * property.
   * 
   * @param {String} prop Property to observe; attributes may be observed
   *  unambiguously by using the dotted path into the attributes object
   *  (ex. `attributes.parent`).
   * @param {Function} method Method to decorate.
   * @returns {Function} 
   */
  AttributesMixin.onChange = function(prop, method){
    method.__onChange__ = prop;
    return method;
  };
  AttributesMixin.onBuild = function(method){
    method.__onBuild__ = true;
    return method;
  };
  /**
   * A computed wrapper that gets the given keys -- invoking observables
   * found -- and uses those values as the arguments to invoke `method`
   * so long as none of the values are `null` or `undefined`. Keys are
   * inspected in the supplied order, but inspection short-circuits on
   * the first `null` seen.
   * 
   * @param {String} ...keys Keys on the instance on which to depend.
   * @param {Function} method Method to wrap.
   * @returns {Function} Wrapped method.
   * 
   * @example
   *  class Client
   *      AttributesMixin.mix this
   *      ->
   *          super ...
   *          # pretend there's async setup for @connection()
   *      defaults: ->
   *          connection: null
   *      bytesSent : @computedRequires 'connection', (connection) ->
   *          connection.bytesSent
   */
  AttributesMixin.computedRequires = function(){
    var i$, keys, method, wrapper;
    keys = 0 < (i$ = arguments.length - 1) ? slice$.call(arguments, 0, i$) : (i$ = 0, []), method = arguments[i$];
    wrapper = this.computed(function(){
      var args, i$, ref$, len$, key, val, j$, ref1$, len1$, yet$, k;
      args = [];
      for (i$ = 0, len$ = (ref$ = keys).length; i$ < len$; ++i$) {
        key = ref$[i$];
        val = this;
        for (yet$ = true, j$ = 0, len1$ = (ref1$ = key.split('.')).length; j$ < len1$; ++j$) {
          k = ref1$[j$];
          yet$ = false;
          val = unwrap(val[k]);
          if (val == null) {
            return;
          }
          if (_.isArray(val) && !val.length) {
            return;
          }
        } if (yet$) {
          return;
        }
        args.push(val);
      }
      return method.apply(this, args);
    });
    wrapper.__compReq__ = {
      keys: keys,
      method: method
    };
    return wrapper;
  };
  /**
   * Decorates the given method to prevent its actions from registering
   * dependencies upward while it executes.
   * 
   * @param {Function} method 
   * @returns {Function} Wrapped method.
   */
  AttributesMixin.ignoreDeps = function(method){
    return function(){
      return ko.dependencyDetection.ignore(method, this, arguments);
    };
  };
  /* * * *  Class Methods  * * * {{{ */
  /**
   * Class used to create "plain" object containers via `@plainSubclass()`.
   * @type Class<? extends AttributesMixin>
   * @see AttributesMixin.plainSubclass()
   */
  AttributesMixin.PlainObjectClass = null;
  /**
   * Creates an instance of an anonymous subclass of the class found at the property
   * `PlainObjectClass` on this class's constructor. If provided, the subclass's
   * `attributeTypes` will be merged and overridden.
   * 
   * Note that this process triggers Coco's `@extended()` hook for the `PlainObjectClass`.
   * 
   * @param {Object} [attributeTypes={}] Attribute type overrides.
   * @returns {T extends @PlainObjectClass} 
   */
  AttributesMixin.plainSubclass = function(attributeTypes){
    var PlainObjectClass;
    attributeTypes == null && (attributeTypes = {});
    PlainObjectClass = this.PlainObjectClass || this;
    attributeTypes = _.merge({}, PlainObjectClass.prototype.attributeTypes, attributeTypes);
    return _.subclass(this.PlainObjectClass, [], {
      attributeTypes: attributeTypes
    });
  };
  /**
   * When mixed into a new class, fill in default for `TargetClass.PlainObjectClass`
   * (with the target class itself) if the mixin's target doesn't define it.
   */
  AttributesMixin.on('mix', function(TargetClass, MixinClass){
    var ref$;
    if (typeof TargetClass !== 'function') {
      return;
    }
    return (ref$ = TargetClass.PlainObjectClass) != null
      ? ref$
      : TargetClass.PlainObjectClass = TargetClass;
  });
  function AttributesMixin(){}
  return AttributesMixin;
}(Mixin));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/base/base.js', function(require, module, exports, __dirname, __filename, undefined){

var EventEmitter, _, ref$, guidFor, generateId, compareIds, extended, Base, slice$ = [].slice;
EventEmitter = require('emitters').EventEmitter;
_ = require('../util/underscore');
ref$ = require('../util/guid'), guidFor = ref$.guidFor, generateId = ref$.generateId, compareIds = ref$.compareIds;
/**
 * Propagates class properties and methods from super- to sub- class. Usually
 * invoked as via the Coco metaprogramming hook `extended` on the class object.
 * 
 * @param {Class} SubClass
 * @param {Class} SuperClass
 * @returns {Class} The Subclass.
 */
extended = exports.extended = function(SubClass, SuperClass){
  var k, v, own$ = {}.hasOwnProperty;
  SubClass.__id__ = guidFor(this);
  for (k in SuperClass) if (own$.call(SuperClass, k)) {
    v = SuperClass[k];
    if (!SubClass[k]) {
      SubClass[k] = v;
    }
  }
  SubClass.__class__ = SubClass;
  SubClass.__super__ = SuperClass.prototype;
  SubClass.__superclass__ = SuperClass;
  if (typeof SuperClass.trigger == 'function') {
    SuperClass.trigger('extended', SubClass, SuperClass);
  }
  return SubClass;
};
/**
 * @class Root-class for classes.
 * @extends EventEmitter
 */
exports.Base = Base = (function(superclass){
  /**
   * Function used by `ko.modeledObservable` as the equality comparator.
   * 
   * @type Function
   */
  Base.displayName = 'Base';
  var prototype = extend$(Base, superclass).prototype, constructor = Base;
  Base.comparator = compareIds;
  /**
   * Unique identifier for this object. Uniqueness is only guaranteed for this
   * pageload session; this value is safe to use in circumstances requiring numeric identity
   * (such as calculating a hashkey for a Map, or for DOM id attributes) but not when
   * global uniqueness is required.
   * 
   * @protected
   * @type String
   */
  prototype.__id__ = null;
  /**
   * A list of method-names to bind on `initialize`; set this on a subclass to override.
   * @type Array<String>
   */
  prototype.__bind__ = [];
  /**
   * Applies the contents of `__bind__`.
   */
  prototype.__apply_bind__ = function(){
    var names;
    names = _(this).chain().pluckSuperAndSelf('__bind__').flatten().compact().unique().value();
    if (names.length) {
      return _.bindAll.apply(_, [this].concat(slice$.call(names)));
    }
  };
  /**
   * @constructor
   */;
  function Base(){
    var Class;
    this.__id__ || (this.__id__ = guidFor(this));
    this.__apply_bind__();
    Class = this.constructor;
    if (typeof Class.trigger == 'function') {
      Class.trigger('new', this, Class);
    }
  }
  /**
   * The class-object itself is an event emitter, allowing it to publish global
   * notifications when extended. Note that sub-classes inherit these class-methods.
   * 
   * @borrows EventEmitter.prototype
   */
  import$(Base, EventEmitter.prototype);
  /**
   * @returns {String} Name of this object's Class.
   */
  prototype.getClassName = function(){
    var x0$;
    x0$ = this.constructor;
    (x0$.displayName || x0$.name) + "";
    return x0$;
  };
  /**
   * Invoked when Base is extended; copies over all class methods to the Subclass (including this).
   * @protected
   * @static
   */;
  Base.extended = function(SubClass){
    return extended(SubClass, this);
  };
  extended(Base, EventEmitter);
  return Base;
}(EventEmitter));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/base/model-cache.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ref$, EventEmitter, ReadyEmitter, Deferred, ModelCache;
_ = require('underscore');
ref$ = require('emitters'), EventEmitter = ref$.EventEmitter, ReadyEmitter = ref$.ReadyEmitter;
Deferred = jQuery.Deferred;
/**
 * @class Caches models and provides static lookups by ID.
 */
exports.ModelCache = ModelCache = (function(superclass){
  ModelCache.displayName = 'ModelCache';
  var prototype = extend$(ModelCache, superclass).prototype, constructor = ModelCache;
  /**
   * @see ReadyEmitter#readyEventName
   * @private
   * @constant
   * @type String
   */
  prototype.__ready_event__ = 'cache-ready';
  /**
   * Default options.
   * @private
   * @constant
   * @type Object
   */
  prototype.DEFAULT_OPTIONS = {
    ready: true,
    cache: null,
    create: null,
    ModelType: null
  };
  /**
   * @private
   * @type Object
   */
  prototype.options = null;
  /**
   * Type we're caching (presumably extending `Model`), used to create new
   * instances unless a `create` function was provided in options.
   * @private
   * @type Class<Model>
   */
  prototype.ModelType = null;
  /**
   * Map holding the cached Models.
   * @private
   * @type Map<id, Model>
   */
  prototype.cache = null;
  /**
   * Holds promises for fetch requests: Map from id to Deferred
   * @private
   * @type Object
   */
  prototype.promises = null;
  /**
   * @constructor
   * @param {Class<Model>} [ModelType] Type of cached object (presumably extending
   *  `Model`), used to create new instances unless `options.create`
   *  is provided.
   * @param {Object} [options] Options:
   * @param {Boolean} [options.ready=true] Starting `ready` state. If false,
   *  the cache will queue lookup calls until `triggerReady()` is called.
   * @param {Object} [options.cache={}] The backing data-structure for the cache.
   * @param {Function} [options.create] A function called when a new Model
   *  object is needed, being passed the new model ID.
   * @param {Class<Model>} [options.ModelType] Type of cached object
   *  (presumably extending `Model`), used to create new instances
   *  unless `options.create` is provided.
   */;
  function ModelCache(ModelType, options){
    var ref$, ref1$, that;
    if (!_.isFunction(ModelType)) {
      ref$ = [ModelType || {}, null], options = ref$[0], ModelType = ref$[1];
    }
    this.options = (ref1$ = {}, import$(ref1$, this.DEFAULT_OPTIONS), import$(ref1$, options));
    this.promises = {};
    this.cache = this.options.cache || {};
    this.ModelType = ModelType || this.options.ModelType;
    if (that = this.options.create) {
      this.createModel = that;
    }
    this._ready = !!this.options.ready;
    if (this.ModelType) {
      this.decorate(this.ModelType);
    }
  }
  /**
   * Called when a new Model object is needed, being passed the new model ID.
   * Uses the supplied `ModelType`; overriden by `options.create` if provided.
   * 
   * @param {String} id The model ID to create.
   * @returns {Model} Created model.
   */
  prototype.createModel = function(id){
    return new this.ModelType({
      id: id
    });
  };
  /**
   * Synchronously check if a model is in the cache, returning it if so.
   * 
   * @param {String} id The model ID to get.
   * @returns {Model}
   */
  prototype.get = function(id){
    return this.cache[id];
  };
  /**
   * Looks up a model, requesting it from the server if it is not already
   * known to the cache.
   *
   * @param {String|Array<String>} id Model ID to lookup.
   * @param {Function} [cb] Callback of the form `(err, model)`,
   *  where `err` will be null on success and `model` will be the
   *  model object.
   * @param {Object} [cxt=this] Callback context.
   * @returns {this}
   */
  prototype.lookup = function(id, cb, cxt){
    var model, deferred, ref$, xhr, this$ = this;
    if (!id) {
      throw new Error("A model ID must be specified!");
    }
    model = this.get(id);
    if (model) {
      deferred = (ref$ = this.promises)[id] || (ref$[id] = new Deferred().resolve(model));
    } else {
      deferred = this.promises[id] = new Deferred();
      model = this.add(this.createModel(id));
      xhr = model.fetch();
      deferred.xhr = xhr.xhr;
      xhr.then(function(){
        return deferred.resolveWith(this, arguments);
      }, function(){
        return deferred.rejectWith(this, arguments);
      });
    }
    if (typeof cb === 'function') {
      _.defer(function(){
        return deferred.then(function(model){
          return cb.call(cxt || this$, null, model);
        }, function(model, err){
          return cb.call(cxt || this$, err, model);
        });
      });
    }
    return deferred;
  };
  /**
   * Registers a model with the cache. If a model by this ID already exists
   * in the cache, it will be removed and this one will take its place.
   *
   * Fires an `add` event.
   * 
   * @param {Model} model The model.
   * @returns {Model} The model.
   */
  prototype.add = function(model){
    var id, className;
    if (!model) {
      throw new Error("You must supply a model! (model=" + model + ")");
    }
    id = model.getId();
    if (!id) {
      throw new Error("Supplied model has no id! (model=" + model + ", id=" + id + ")");
    }
    if (this.cache[id] && this.cache[id] !== model) {
      className = this.ModelType.displayName || this.ModelType.name;
      throw new Error("Model of type " + className + " already exists at " + id + ".");
    }
    this.cache[id] = model;
    this.trigger('add', this, model);
    return model;
  };
  /**
   * Invalidate a model, removing it from the cache.
   * 
   * @param {String} id ID of the model to invalidate.
   * @returns {this}
   */
  prototype.invalidate = function(id){
    if (id == null) {
      return this;
    }
    delete this.cache[id];
    delete this.promises[id];
    return this;
  };
  /**
   * Invalidates all cache entries.
   * @returns {this}
   */
  prototype.purge = function(){
    _.each(_.keys(this.cache), this.invalidate, this);
    return this;
  };
  /**
   * Decorate an object with the cache methods:
   *  - get
   *  - lookup
   *  - invalidate
   *  - purge
   * 
   * This is automatically called on `ModelType` if supplied.
   * 
   * @param {Object} obj Object to decorate.
   * @returns {obj} The supplied object.
   */
  prototype.decorate = function(obj){
    var i$, ref$, len$, m;
    obj.__cache__ = this;
    for (i$ = 0, len$ = (ref$ = ['get', 'lookup', 'invalidate', 'purge']).length; i$ < len$; ++i$) {
      m = ref$[i$];
      obj[m] = this[m].bind(this);
    }
    return obj;
  };
  prototype.toString = function(){
    return (this.constructor.displayName || this.constructor.name) + "(cache=" + this.cache + ")";
  };
  return ModelCache;
}(ReadyEmitter));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/base/model.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ref$, unwrapObservable, peekObservable, _, AttributesBase, Model;
ko = require('knockout');
ref$ = ko.utils, unwrapObservable = ref$.unwrapObservable, peekObservable = ref$.peekObservable;
_ = require('../util')._;
AttributesBase = require('./attributes-base').AttributesBase;
/**
 * @class Root-class for all Models.
 * @extends AttributesBase
 */
exports.Model = Model = (function(superclass){
  Model.displayName = 'Model';
  var prototype = extend$(Model, superclass).prototype, constructor = Model;
  function Model(){
    superclass.apply(this, arguments);
  }
  /* * * *  Knockout-Aware Accessors (with Nesting)  * * * {{{ */
  /**
   * Retrieves the attribute value at `key`, also accepting a dotted keypath
   * to perform a nested lookup.
   * 
   * If called by a computed observable, this function creates a dependency
   * on the accessed attribute (provided it exists) unless `peek=true`
   * is passed.
   * 
   * @protected
   * @param {String} key Key to get (including dotted keypaths).
   * @param {Boolean} [peek=false] If true, use `ko.utils.peekObservable()`
   *  to access the value, circumventing dependency tracking.
   * @returns {*} Value at `key`.
   */
  prototype._get = function(key, peek){
    var getterKey, unwrapper, val, parts;
    peek == null && (peek = false);
    if (!(key && this.attributes != null)) {
      return;
    }
    getterKey = peek ? 'peek' : 'get';
    unwrapper = peek ? peekObservable : unwrapObservable;
    val = this.attributes;
    parts = key.split('.');
    while (parts.length) {
      if (val instanceof Model) {
        return val[getterKey](parts.join('.'));
      }
      val = unwrapper(val[parts.shift()]);
      if (val == null) {
        return;
      }
    }
    return val;
  };
  /**
   * Retrieves the attribute value at `key`, also accepting a dotted
   * keypath to perform a nested lookup.
   * 
   * If called by a computed observable, this function creates a dependency
   * on the accessed attribute (provided it exists).
   * 
   * @param {String} key Key to get (including dotted keypaths).
   * @returns {*} Value at `key`.
   */
  prototype.get = function(key){
    return this._get(key, false);
  };
  /**
   * Retrieves the attribute value at `key`, also accepting a dotted
   * keypath to perform a nested lookup.
   * 
   * Even if called by a computed observable, this function does **not**
   * create a dependency on the accessed attribute.
   * 
   * @param {String} key Key to peek (including dotted keypaths).
   * @returns {*} Value at `key`.
   */
  prototype.peek = function(key){
    return this._get(key, true);
  };
  /**
   * Puts a single attribute value to `key`.
   * 
   * If the current value is a Model and the value to set is an object, a
   * recursive set is instead performed on the current value; a recursive
   * set in this way does not create a dependency on the observable at `key`.
   * This behavior is disabled by setting `force`.
   * 
   * @protected
   * @param {String} key Key to set.
   * @param {*} val Value to set at `key`.
   * @param {Boolean} [force=false] Whether to force-put the key.
   * @returns {this}
   */
  prototype._set = function(key, val, force){
    var obs, current;
    force == null && (force = false);
    if (key == null) {
      return this;
    }
    if (this.attributes == null) {
      throw new Error("Attributes hash does not exist!");
    }
    if (!ko.isObservable(obs = this.attributes[key])) {
      obs = this.attributes[key] = this._generateAttribute(val, this.attributeTypes[key], key);
      this[key] == null && (this[key] = obs);
    }
    if (!force && (current = obs.peek()) instanceof Model && _.isPlainObject(val)) {
      current.set(val);
    } else {
      obs(val);
    }
    return this;
  };
  /**
   * Sets attribute values, taking either a single (key, value)-pair, or
   * a map of them. Unlike `set()`, existing sub-Models will not have values
   * merged into them.
   * 
   * @param {String|Object} key The key to set. If an object is supplied here,
   *  each key will be set with its value on the target object.
   * @param {*} [value] Value to set at `key`. Omit this if an object of
   *  KV-pairs was passed as `key`.
   * @returns {this}
   */
  prototype.put = function(key, val){
    var values, ref$, value;
    if (key == null) {
      return this;
    }
    if (key && _.isObject(key)) {
      values = key;
    } else {
      values = (ref$ = {}, ref$[key + ""] = val, ref$);
    }
    for (key in values) {
      value = values[key];
      this._set(key, value, true);
    }
    return this;
  };
  /* * * *  Class Methods  * * * */
  /**
   * @static
   * @returns {Function} Factory function that creates new instances of this Model.
   */;
  Model.factory = function(){
    var ClassType;
    ClassType = this;
    return function(attributes){
      return new ClassType(attributes);
    };
  };
  /**
   * Class used to create "plain" object containers via `@plainSubclass()`.
   * @type Class<Model>
   * @see AttributesBase#plainSubclass
   */
  Model.PlainObjectClass = Model;
  return Model;
}(AttributesBase));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/base/resource.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * @fileOverview RESTful Resource Mixin. Mostly adapted from Backbone.
 */
var ref$, _, op, root, generateId, guidFor, Mixin, EventEmitter, Deferred, ACTION_TO_METHOD, DEFAULT_OPTIONS, Resource, slice$ = [].slice;
ref$ = require('../util'), _ = ref$._, op = ref$.op, root = ref$.root, generateId = ref$.generateId, guidFor = ref$.guidFor, Mixin = ref$.Mixin;
EventEmitter = require('emitters').EventEmitter;
Deferred = jQuery.Deferred;
ACTION_TO_METHOD = {
  create: 'POST',
  update: 'PUT',
  'delete': 'DELETE',
  read: 'GET'
};
DEFAULT_OPTIONS = {
  /**
   * Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
   * will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
   * set a `X-Http-Method-Override` header.
   * @name emulateHTTP
   * @type Boolean
   */
  emulateHTTP: false
  /**
   * Turn on `emulateJSON` to support legacy servers that can't deal with direct
   * `application/json` requests ... will encode the body as
   * `application/x-www-form-urlencoded` instead and will send the model in a
   * form param named `model`.
   * @name emulateJSON
   * @type Boolean
   */,
  emulateJSON: false
};
/**
 * @class Mixin which represents a remote resource following the REST pattern:
 * 
 * POST    /<RESOURCE>              ->  create
 * GET     /<RESOURCE>/:id          ->  show
 * PUT     /<RESOURCE>/:id          ->  update
 * DELETE  /<RESOURCE>/:id          ->  destroy
 * 
 */
exports.Resource = Resource = (function(superclass){
  Resource.displayName = 'Resource';
  var prototype = extend$(Resource, superclass).prototype, constructor = Resource;
  /* * * *  Instance Methods  * * * {{{ */
  /**
   * The name of the resource -- by convention, resources are named with plural nouns.
   * @type {String|Function}
   */
  prototype.resource = '';
  /**
   * When set, this overrides the result of `isNew()`, allowing formerly saved
   * models to become new again.
   * 
   * @protected
   * @type Boolean
   */
  prototype._isNew = null;
  /**
   * @returns {Boolean} Whether the resource has been saved to the server.
   */
  prototype.isNew = function(){
    var r;
    r = _.result(this, '_isNew');
    if (typeof r === 'boolean') {
      return r;
    } else {
      return this.getId() == null;
    }
  };
  /**
   * Root prepended to all resource requests.
   * @type {String|Function}
   */
  prototype.resourceURLRoot = function(){
    return '/';
  };
  /**
   * @returns {String} URL to this resource.
   */
  prototype.resourceURL = function(){
    var root, id;
    if (!this.resource) {
      throw new Error("No Resource name found! (@resource=" + this.resource + ", model=" + this + ")");
    }
    root = _.result(this, 'resourceURLRoot');
    id = encodeURIComponent(this.getId() || '');
    if (id) {
      id += '.json';
    }
    return _.compact([root, this.resource, id]).map(function(it){
      return _.rtrim(it, '/');
    }).join('/');
  };
  /**
   * Fetch the model from the server.
   * 
   * Fires a "before-fetch" event prior to execution, and a "fetch" event upon completion.
   * 
   * @protected
   * @param {Function} [cb] Called on fetch success: `cb(model)`
   * @param {Boolean} [force=false] Whether a successful fetch should force-override,
   *  rather than merge in, new values.
   * @param {Object} [options={}] Options passed to `sync()`.
   * @returns {Promise} Promise for the result of the Ajax request. Note that callbacks can
   *  still be attached with no chance of missing events.
   */
  prototype._fetch = function(cb, force, options){
    var ref$, promise, this$ = this;
    force == null && (force = false);
    options == null && (options = {});
    if (typeof cb !== 'function') {
      ref$ = [cb, null], options = ref$[0], cb = ref$[1];
    }
    promise = this.fetch.promise = this.sync('read', 'fetch', options);
    promise.done(function(model, data){
      var updater;
      updater = force ? 'update' : 'set';
      return this$[updater](this$.canonicalize(data));
    });
    if (cb) {
      promise.done(function(){
        return cb.apply(this$, arguments);
      });
    }
    return promise;
  };
  /**
   * Fetch the model from the server. Values are merged into the existing data,
   * overriding any extant keys, but preserving additions.
   * 
   * Fires a "before-fetch" event prior to execution, and a "fetch" event upon completion.
   * 
   * @param {Function} [cb] Called on fetch success: `cb(model)`
   * @param {Object} [options={}] Options passed to `sync()`.
   * @returns {Promise} Promise for the result of the Ajax request. Note that callbacks can
   *  still be attached with no chance of missing events.
   */
  prototype.fetch = function(cb, options){
    options == null && (options = {});
    return this._fetch(cb, false, options);
  };
  /**
   * Fetch the model from the server. Values completely replace the existing
   * data, overriding extant keys and removing any local additions.
   * 
   * Fires a "before-fetch" event prior to execution, and a "fetch" event upon completion.
   * 
   * @param {Function} [cb] Called on fetch success: `cb(model)`
   * @param {Object} [options={}] Options passed to `sync()`.
   * @returns {Promise} Promise for the result of the Ajax request. Note that callbacks can
   *  still be attached with no chance of missing events.
   */
  prototype.reload = function(cb, options){
    options == null && (options = {});
    return this._fetch(cb, true, options);
  };
  /**
   * Save the model to the server.
   * 
   * Fires a "before-save" event prior to execution, and a "save" event upon completion.
   * 
   * @param {Function} [cb] Called on save success: `cb(model)`
   * @param {Object} [options={}] Options passed to `sync()`.
   * @returns {Promise} Promise for the Ajax request. Note that callbacks can
   *  still be attached with no chance of missing events.
   */
  prototype.save = function(cb, options){
    var ref$, action, promise, this$ = this;
    options == null && (options = {});
    if (typeof cb !== 'function') {
      ref$ = [cb, null], options = ref$[0], cb = ref$[1];
    }
    action = this.isNew() ? 'create' : 'update';
    promise = this.save.promise = this.sync(action, 'save', options);
    if (cb) {
      promise.done(function(){
        return cb.apply(this$, arguments);
      });
    }
    return promise;
  };
  /**
   * Destroy the model.
   * 
   * Fires a `before-destroy` event prior to execution, and a `destroy` event upon completion.
   * 
   * No network request is made if it has not been persisted to the server. In this case, only
   * the `before-destroy` and `destroy` events will still fire (additionally passing `false`
   * as the second parameter to the callback) -- `sync` events will not.
   * 
   * @param {Function} [cb] Called on save success: `cb(model)`
   * @param {Object} [options={}] Options passed to `sync()`.
   * @returns {Promise} Promise for the Ajax request. Note that callbacks can
   *  still be attached with no chance of missing events.
   */
  prototype.destroy = function(cb, options){
    var ref$, model, payload, xhr, syncEvent, ref1$, deferred, promise, this$ = this;
    options == null && (options = {});
    if (typeof cb !== 'function') {
      ref$ = [cb, null], options = ref$[0], cb = ref$[1];
    }
    if (this.isNew()) {
      model = this;
      payload = null;
      xhr = false;
      syncEvent = 'before-sync';
      this.trigger('before-destroy', model, payload, xhr, options);
      this.trigger(syncEvent, model, payload, xhr, options);
      if (typeof (ref1$ = this.constructor).trigger == 'function') {
        ref1$.trigger(syncEvent, model, payload, xhr, options);
      }
      Resource.trigger(syncEvent, model, payload, xhr, options);
      deferred = new Deferred();
      deferred.done(function(){
        var syncEvent, ref$;
        syncEvent = 'sync';
        this$.trigger('destroy', model, payload, xhr, options);
        this$.trigger(syncEvent, model, payload, xhr, options);
        if (typeof (ref$ = this$.constructor).trigger == 'function') {
          ref$.trigger(syncEvent, model, payload, xhr, options);
        }
        return Resource.trigger(syncEvent, model, payload, xhr, options);
      });
      if (cb) {
        deferred.done(function(){
          return cb.apply(this$, arguments);
        });
      }
      _.defer(function(){
        return deferred.resolve(model, payload, xhr, options);
      });
      return this.destroy.promise = deferred.promise();
    }
    promise = this.destroy.promise = this.sync('delete', 'destroy', options);
    promise.done(function(){
      return this$._isNew = true;
    });
    if (cb) {
      promise.done(function(){
        return cb.apply(this$, arguments);
      });
    }
    return promise;
  };
  /**
   * Executes the ajax call to perform a REST action.
   * 
   * This method fires a large number of events from both the originating object
   * and several central places, so that responding to persistence actions does not
   * require wrapping the methods or subclassing model objects.
   * 
   * `sync()` fires events from three places (in this order):
   * - The model instance
   * - The model's class object
   * - The Resource class object
   * 
   * The events fired are:
   * - `before-sync`: This is always fired, and fires from all locations.
   * - One of `fetch`, `save`, `destroy`, depending on the method that triggered this
   *  `sync` call. This is only fired from the model instance, and only on success.
   * - One of `fetch-error`, `save-error`, `destroy-error`, depending on the method
   *  that triggered this `sync` call. This is only fired from the model instance,
   *  and only on failure.
   * - `sync`: Fired on success from all locations.
   * - `sync-error`: Fired on failure from all locations.
   * 
   * All events fire with the arguments `cb(model, result, xhr, options)` where
   * result is either the data response or the error thrown.
   * 
   * @protected
   * @param {String} action REST action to be applied.
   * @param {String} event Event to fire on success ("-error" appended on failure).
   * @param {Object} [options=DEFAULT_OPTIONS] Options passed to the ajax call,
   *  overriding what `sync` would set in the case of conflict.
   * @returns {Promise} Promise for the Ajax request. Note that callbacks can
   *  still be attached with no chance of missing events.
   */
  prototype.sync = function(action, event, options){
    var model, type, params, loading, that, setOverride, xhr, requestId, deferred, triggerAll, this$ = this;
    options == null && (options = {});
    model = this;
    type = ACTION_TO_METHOD[action];
    params = {
      type: type,
      dataType: 'json'
    };
    options = _.extend({}, DEFAULT_OPTIONS, options);
    params.url = options.url || _.result(model, 'resourceURL');
    if (!params.url) {
      throw new Error("A 'url'/'resourceURL' property or function must be specified!");
    }
    loading = this.loading || (this.loading = {});
    if (!options.data && model && (action === 'create' || action === 'update')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(model);
    }
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = (that = params.data)
        ? {
          model: that
        }
        : {};
    }
    if (setOverride = options.emulateHTTP && (type === 'PUT' || type === 'DELETE')) {
      params.type = 'POST';
      if (options.emulateJSON) {
        params.data._method = type;
      }
    }
    if (type === 'DELETE') {
      params.contentType = 'application/json';
      params.data = JSON.stringify(model);
    }
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }
    params = _.extend(params, options);
    xhr = Resource.ajax(params);
    requestId = guidFor(xhr);
    if (setOverride) {
      xhr.setRequestHeader('X-HTTP-Method-Override', type);
    }
    deferred = new Deferred();
    xhr.then(function(result, status, _xhr){
      return deferred.resolveWith(model, [model, result, xhr, params]);
    }, function(_xhr, status, result){
      return deferred.rejectWith(model, [model, result, xhr, params]);
    }, function(){
      var args;
      args = slice$.call(arguments);
      return deferred.notifyWith(model, [model].concat(args));
    });
    triggerAll = function(modelEvent, syncEvent, payload){
      var ref$;
      if (modelEvent) {
        model.trigger(modelEvent, model, payload, xhr, params);
      }
      model.trigger(syncEvent, model, payload, xhr, params);
      if (typeof (ref$ = model.constructor).trigger == 'function') {
        ref$.trigger(syncEvent, model, payload, xhr, params);
      }
      return Resource.trigger(syncEvent, model, payload, xhr, params);
    };
    triggerAll("before-" + event, "before-sync", xhr);
    xhr.always(function(){
      var result, status, _xhr, resultEvent, syncEvent;
      if (arguments[1] === 'success') {
        result = arguments[0], status = arguments[1], _xhr = arguments[2];
        resultEvent = event;
        syncEvent = "sync";
      } else {
        _xhr = arguments[0], status = arguments[1], result = arguments[2];
        resultEvent = event + "-error";
        syncEvent = "sync-error";
      }
      triggerAll(resultEvent, syncEvent, result);
      return triggerAll(null, "sync-complete", result);
    });
    deferred.xhr = xhr;
    return deferred;
  };
  /* * * *  Class Methods  * * * {{{ */;
  import$(Resource, EventEmitter.prototype);
  /**
   * $.ajax() provider.
   */
  Resource.$ = root.jQuery || root.Zepto || root.ender;
  /**
   * Issue an ajax request.
   */
  Resource.ajax = function(){
    return Resource.$.ajax.apply(Resource.$, arguments);
  };
  function Resource(){}
  return Resource;
}(Mixin));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/base/stored-model.js', function(require, module, exports, __dirname, __filename, undefined){

var _, Resource, Model, StoredModel;
_ = require('underscore');
Resource = require('./resource').Resource;
Model = require('./model').Model;
/**
 * @class Root-class for all Models which sync with the server.
 * @extends Model
 * @mixes Resource
 */
exports.StoredModel = StoredModel = (function(superclass){
  StoredModel.displayName = 'StoredModel';
  var prototype = extend$(StoredModel, superclass).prototype, constructor = StoredModel;
  Resource.mix(StoredModel);
  /**
   * @constructor
   */
  function StoredModel(){
    superclass.apply(this, arguments);
  }
  /**
   * Root prepended to all resource requests
   * @type {String|Function}
   */
  prototype.resourceURLRoot = function(){
    return require('limn').config.mount();
  };
  prototype.link = StoredModel.computed(function(){
    return this.resourceURLRoot() + "" + this.resource + "/" + (this.slug() || this.id());
  });
  prototype.toString = function(){
    return this.getClassName() + "(id=" + this.getId() + ")";
  };
  /**
   * Create a new instance of the model with the given id, and then instruct
   * it to fetch itself from the server.
   * 
   * @param {String|Object} id Id of the model to create and load. May be
   *  omitted in favor of passing an attributes object containing `id`.
   * @param {Object} [attributes] Attribute values to instantiate the model
   *  with prior to fetch.
   * @param {Function} [cb] Callback to be invoked when the model is done
   *  loading.
   * @returns {StoredModel} The new model instance.
   */;
  StoredModel.load = function(id, attrs, cb){
    var ModelClass, ref$, ref1$, model;
    attrs == null && (attrs = {});
    ModelClass = this;
    if (_.isObject(id)) {
      ref$ = [attrs, id, null], cb = ref$[0], attrs = ref$[1], id = ref$[2];
    }
    if (typeof attrs === 'function' && typeof cb !== 'function') {
      ref1$ = [attrs, {}], cb = ref1$[0], attrs = ref1$[1];
    }
    attrs = import$({
      id: id
    }, attrs);
    if (attrs.id == null) {
      throw new Error("Cannot load a StoredModel without an id!");
    }
    model = new ModelClass(attrs);
    model.fetch(cb);
    return model;
  };
  return StoredModel;
}(Model));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/base/view.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, AttributesBase, View, NotFoundView, LoadingView, out$ = typeof exports != 'undefined' && exports || this;
_ = require('underscore');
ko = require('knockout');
AttributesBase = require('./attributes-base').AttributesBase;
out$.View = View = (function(superclass){
  View.displayName = 'View';
  var prototype = extend$(View, superclass).prototype, constructor = View;
  /**
   * @type ko.observable<Model>
   */
  prototype.model = null;
  /**
   * Identifier of the template.
   * @type String
   */
  prototype.template = '';
  prototype.defaults = function(){
    return {
      model: null,
      isDisposed: false,
      isReady: false
    };
  };
  /**
   * DOM Element for this view. jQuery objects and d3 Selections
   * will be automatically stripped of their wrappers.
   * @type ko.observable<Element>
   */
  prototype.el = View.eagerCoerciveObservable(function(el){
    this.$el = null;
    if (el instanceof jQuery) {
      el = el[0];
    }
    if (el instanceof d3.selection) {
      el = el.node();
    }
    if (!_.isElement(el)) {
      return el;
    }
    this.$el = $(el);
    return el;
  });
  /**
   * jQuery-wrapped root element.
   * @type jQuery
   */
  prototype.$el = null;
  /**
   * @constructor
   */;
  function View(model){
    superclass.call(this);
    this.model(model);
  }
  /**
   * Inform sub-objects its safe to begin watchers.
   */
  prototype.watching = View.computed(function(){
    var this$ = this;
    this.isWatching = true;
    this.model();
    this.watchDeps();
    return ko.dependencyDetection.ignore(function(){
      var others, model, ref$;
      others = this$.watchOthers();
      model = typeof (ref$ = this$.model).watching == 'function' ? ref$.watching() : void 8;
      return [model, others];
    });
  });
  /**
   * Stub to allow you to hook into @watching() without overriding everything.
   * Called to generate dependencies prior to `watching` recursion.
   * 
   * @abstract
   * @protected
   */
  prototype.watchDeps = function(){};
  /**
   * Stub to allow you to hook into @watching() without overriding everything.
   * Called to recursively notify of deps.
   * 
   * @abstract
   * @protected
   */
  prototype.watchOthers = function(){};
  /**
   * Call when disposing of this view.
   * @returns {this}
   */
  prototype.dispose = function(){
    if (this.isDisposed()) {
      return this;
    }
    this.isDisposed(true);
    this.trigger('dispose', this);
    return this;
  };
  /**
   * Create a template binding on `targetEl` and render it using `view`.
   * 
   * @protected
   * @param {Element} targetEl Container element for the rendered template.
   * @param {Object} [view=this] View instance (with a `template` property).
   * @returns {Element} The target element.
   */
  prototype.renderView = function(targetEl, view){
    var el;
    view == null && (view = this);
    el = _.toElement(targetEl);
    $(el).attr('data-bind', 'subview: $data');
    ko.applyBindings(view, el);
    return targetEl;
  };
  /**
   * Called by Knockout once the template has finished rendering.
   */
  prototype.afterRender = function(element){
    this.el(element);
    return this.trigger('render', this, element);
  };
  /**
   * Called by Knockout once the template has updated rendering.
   */
  prototype.afterAdd = function(element){
    this.el(element);
    return this.trigger('render-add', this, element);
  };
  prototype.$ = function(){
    var ref$;
    return (ref$ = this.$el) != null ? ref$.find.apply(this.$el, arguments) : void 8;
  };
  prototype.toString = function(){
    var cid, Class, className, model, ref$;
    cid = this.__id__;
    Class = this.constructor;
    className = Class.displayName || Class.name;
    model = (ref$ = this.model) != null ? ref$.peek() : void 8;
    return className + "(cid=" + cid + ", model=" + model + ")";
  };
  return View;
}(AttributesBase));
out$.NotFoundView = NotFoundView = (function(superclass){
  NotFoundView.displayName = 'NotFoundView';
  var prototype = extend$(NotFoundView, superclass).prototype, constructor = NotFoundView;
  prototype.template = 'notFound';
  prototype.message = ko.observable('This does not exist');
  function NotFoundView(){
    superclass.apply(this, arguments);
  }
  return NotFoundView;
}(View));
out$.LoadingView = LoadingView = (function(superclass){
  LoadingView.displayName = 'LoadingView';
  var prototype = extend$(LoadingView, superclass).prototype, constructor = LoadingView;
  prototype.template = 'loading';
  function LoadingView(){
    superclass.apply(this, arguments);
  }
  return LoadingView;
}(View));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/base/index.js', function(require, module, exports, __dirname, __filename, undefined){

var base, attributes_mixin, attributes_base, model, model_cache, resource, stored_model, view;
base = require('./base');
attributes_mixin = require('./attributes-mixin');
attributes_base = require('./attributes-base');
model = require('./model');
model_cache = require('./model-cache');
resource = require('./resource');
stored_model = require('./stored-model');
view = require('./view');
import$(import$(import$(import$(import$(import$(import$(import$(exports, base), attributes_mixin), attributes_base), model), model_cache), resource), stored_model), view);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/dashboard/dashboard-model.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, compareIds, OrderedSet, formatters, StoredModel, Graph, DashboardTab, Dashboard;
_ = require('underscore');
ko = require('knockout');
ref$ = require('../util'), compareIds = ref$.compareIds, OrderedSet = ref$.OrderedSet, formatters = ref$.formatters;
StoredModel = require('../base').StoredModel;
Graph = require('../graph/graph-model').Graph;
DashboardTab = require('./dashboard-tab-model').DashboardTab;
exports.Dashboard = Dashboard = (function(superclass){
  Dashboard.displayName = 'Dashboard';
  var prototype = extend$(Dashboard, superclass).prototype, constructor = Dashboard;
  prototype.resource = 'dashboards';
  prototype.getId = function(){
    return this.get('id');
  };
  /**
   * @constructor
   */;
  function Dashboard(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      id: null,
      headline: '',
      subhead: '',
      tabs: []
    };
  };
  prototype.attributeTypes = function(){
    return {
      tabs: DashboardTab
    };
  };
  /**
   * Inform sub-objects its safe to begin their watchers.
   */
  prototype.watching = Dashboard.computed(function(){
    var this$ = this;
    this.isWatching = true;
    this.tabs();
    return ko.dependencyDetection.ignore(function(){
      return _.invoke(this$.tabs(), 'watching');
    });
  });
  return Dashboard;
}(StoredModel));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/dashboard/dashboard-tab-model.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, compareIds, OrderedSet, formatters, Model, Graph, DashboardTab;
_ = require('underscore');
ko = require('knockout');
ref$ = require('../util'), compareIds = ref$.compareIds, OrderedSet = ref$.OrderedSet, formatters = ref$.formatters;
Model = require('../base').Model;
Graph = require('../graph/graph-model').Graph;
exports.DashboardTab = DashboardTab = (function(superclass){
  /**
   * @constructor
   */
  DashboardTab.displayName = 'DashboardTab';
  var prototype = extend$(DashboardTab, superclass).prototype, constructor = DashboardTab;
  function DashboardTab(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      name: '',
      graphs: []
    };
  };
  prototype.attributeTypes = function(){
    return {
      graphs: Graph
    };
  };
  prototype.canonicalize = function(data){
    data.graphs = _.map(data.graph_ids, function(id){
      return {
        id: id
      };
    });
    delete data.graph_ids;
    return data;
  };
  /**
   * Inform sub-objects its safe to begin their watchers.
   */
  prototype.watching = DashboardTab.computed(function(){
    var this$ = this;
    this.isWatching = true;
    this.graphs();
    return ko.dependencyDetection.ignore(function(){
      return _.invoke(this$.graphs(), 'watching');
    });
  });
  prototype.toJSON = function(){
    var attrs;
    attrs = this.toJS(_.omit(this.attributes, 'graphs'));
    attrs.graph_ids = _.map(this.attributes.graphs.peek(), function(it){
      return it.id.peek();
    });
    return attrs;
  };
  return DashboardTab;
}(Model));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/dashboard/dashboard-tab-view.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, compareIds, OrderedSet, formatters, View, GraphView, DashboardTabView;
_ = require('underscore');
ko = require('knockout');
ref$ = require('../util'), compareIds = ref$.compareIds, OrderedSet = ref$.OrderedSet, formatters = ref$.formatters;
View = require('../base/view').View;
GraphView = require('../graph/graph-view').GraphView;
exports.DashboardTabView = DashboardTabView = (function(superclass){
  DashboardTabView.displayName = 'DashboardTabView';
  var prototype = extend$(DashboardTabView, superclass).prototype, constructor = DashboardTabView;
  prototype.template = 'dashboard-tab';
  function DashboardTabView(dashboard, model){
    var this$ = this;
    this.dashboard = dashboard;
    superclass.call(this, model);
    this.everActivated = ko.observable(false);
    this.okToShow = ko.computed(function(){
      return this$.everActivated();
    }).throttle(50);
  }
  prototype.defaults = function(){
    return {
      model: null,
      isDisposed: false,
      graphs: []
    };
  };
  prototype.attributeTypes = function(){
    return {
      graphs: GraphView
    };
  };
  prototype.tabId = DashboardTabView.computed(function(){
    return _.underscored(this.model().name()).toLowerCase();
  });
  prototype.tabButtonCss = DashboardTabView.computed(function(){
    return this.tabId() + '-button';
  });
  prototype.tabPaneCss = DashboardTabView.computed(function(){
    return this.tabId() + '-graphs-pane';
  });
  prototype.watchDeps = function(){
    this.model().graphs();
    return this.graphs();
  };
  prototype.watchOthers = function(){
    var graphs;
    graphs = this.watchModels();
    _.invoke(this.graphs(), 'watching');
    return graphs;
  };
  prototype.watchModels = DashboardTabView.computed(function(){
    var newModels;
    this.graphs(newModels = this.model().graphs().slice());
    return newModels;
  });
  prototype.resize = function(){
    return _.invoke(this.graphs(), 'resize');
  };
  return DashboardTabView;
}(View));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/dashboard/dashboard-view.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, unwrap, peek, ref1$, compareIds, OrderedSet, formatters, View, Dashboard, DashboardTabView, DashboardView;
_ = require('underscore');
ko = require('knockout');
ref$ = ko.utils, unwrap = ref$.unwrapObservable, peek = ref$.peekObservable;
ref1$ = require('../util'), compareIds = ref1$.compareIds, OrderedSet = ref1$.OrderedSet, formatters = ref1$.formatters;
View = require('../base/view').View;
Dashboard = require('./dashboard-model').Dashboard;
DashboardTabView = require('./dashboard-tab-view').DashboardTabView;
exports.DashboardView = DashboardView = (function(superclass){
  DashboardView.displayName = 'DashboardView';
  var prototype = extend$(DashboardView, superclass).prototype, constructor = DashboardView;
  prototype.template = 'dashboard';
  prototype.defaults = function(){
    return {
      model: null,
      action: null,
      isDisposed: false,
      tabs: []
    };
  };
  prototype.attributeTypes = function(){
    return {
      tabs: function(tab){
        return new DashboardTabView(this, tab);
      }
    };
  };
  function DashboardView(model, action){
    var this$ = this;
    superclass.call(this);
    this.tabs = this.attributes.tabs = this.tabs.history({
      includeInitial: false
    });
    this.tabs.equalityComparer = compareIds;
    this.tabs.subscribe(function(){
      if (this$.tabs().length) {
        return this$.tabs()[0].el.subscribe(function(){
          return this$.$('div.graphs.tabbable nav li.tab-button:first a').click();
        });
      }
    });
    if (model instanceof Dashboard) {
      model.fetch();
    } else if (typeof model === 'string') {
      model = Dashboard.load({
        id: model
      });
    } else {
      model = new Dashboard(model);
    }
    this.action(action);
    this.model(model);
    this.watching();
  }
  prototype.watchDeps = function(){
    this.model().tabs();
    return this.tabs();
  };
  prototype.watchOthers = function(){
    var tabs;
    tabs = this.watchModels();
    _.invoke(this.tabs(), 'watching');
    return tabs;
  };
  prototype.watchModels = DashboardView.computed(function(){
    var newModels;
    this.tabs(newModels = this.model().tabs().slice());
    return newModels;
  });
  prototype.updateActiveTab = function(){
    return this.everActivated(true);
  };
  /**
   * Scroll to the specified graph.
   * 
   * @param {String|Number|Graph} graph The Graph to scroll to; can be specified as a
   *  Graph id, an index into the Graphs list, or a Graph object.
   * @returns {this} 
   */
  prototype.scrollToGraph = function(graph){
    var view;
    if (typeof graph === 'string') {
      graph = this.graphs.get(graph);
    } else if (typeof graph === 'number') {
      graph = this.graphs.at(graph);
    }
    if (!(graph instanceof Graph)) {
      console.error(this + ".scrollToGraph() Unknown graph " + graph + "!");
      return this;
    }
    if (!(view = _.find(this.subviews, function(it){
      return it.model === graph;
    }))) {
      return this;
    }
    if (view.$el.is(':visible')) {
      $('body').scrollTop(view.$el.offset().top);
    }
    return this;
  };
  prototype.findClosestGraph = function(scroll){
    var views;
    scroll || (scroll = $('body').scrollTop());
    views = this.subviews.filter(function(it){
      return it.$el.is(':visible');
    }).map(function(it){
      return [it.$el.offset().top, it];
    }).filter(function(it){
      return it[0] >= scroll;
    }).sort(function(a, b){
      return op.cmp(a[0], b[0]);
    });
    if (views.length) {
      return views[0][1];
    }
  };
  return DashboardView;
}(View));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/dashboard/index.js', function(require, module, exports, __dirname, __filename, undefined){

var dashboard_model, dashboard_tab_model, dashboard_view, dashboard_tab_view;
dashboard_model = require('./dashboard-model');
dashboard_tab_model = require('./dashboard-tab-model');
dashboard_view = require('./dashboard-view');
dashboard_tab_view = require('./dashboard-tab-view');
import$(import$(import$(import$(exports, dashboard_model), dashboard_tab_model), dashboard_view), dashboard_tab_view);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/data/graph-json-converter.js', function(require, module, exports, __dirname, __filename, undefined){

var ref$, _, op, Version, GraphJSONConverter;
ref$ = require('../util'), _ = ref$._, op = ref$.op;
/**
 * @class
 */
exports.Version = Version = (function(){
  Version.displayName = 'Version';
  var prototype = Version.prototype, constructor = Version;
  function Version(major, minor, patch, suffix){
    this.major = major != null ? major : 0;
    this.minor = minor != null ? minor : 0;
    this.patch = patch != null ? patch : 0;
    this.suffix = suffix;
  }
  prototype.compare = function(other){
    if (typeof other === 'string') {
      other = Version.fromString(other);
    }
    return op.cmp(this.major, other.major) || op.cmp(this.minor, other.minor) || op.cmp(this.patch, other.patch) || op.cmp(this.suffix, other.suffix);
  };
  prototype.toJSON = function(){
    return this.toString();
  };
  prototype.toString = function(){
    return this.major + "." + this.minor + "." + this.patch + (this.suffix || '');
  };
  Version.fromString = function(s){
    var parts, suffix, ref$, major, minor, patch, VersionClass;
    parts = s.split('.');
    if (parts.length > 3) {
      suffix = parts.slice(3).join('.');
      parts = parts.slice(0, 3);
    }
    ref$ = parts.map(op.toInt), major = ref$[0], minor = ref$[1], patch = ref$[2];
    VersionClass = this;
    return new VersionClass(major, minor, patch, suffix);
  };
  return Version;
}());
/**
 * @class
 */
exports.GraphJSONConverter = GraphJSONConverter = (function(){
  GraphJSONConverter.displayName = 'GraphJSONConverter';
  var prototype = GraphJSONConverter.prototype, constructor = GraphJSONConverter;
  prototype.CURRENT_VERSION = '0.6.0';
  function GraphJSONConverter(data){
    this.data = data;
  }
  prototype.determineVersion = function(data){
    if ('graph_version' in data) {
      return data.graph_version;
    }
    if ('root' in data && 'nodeType' in (data != null ? data.root : void 8)) {
      return '0.6.0';
    }
    if ('chartType' in data && 'data' in data) {
      return '0.5.0';
    }
    if ('chartType' in data && 'dataset' in data) {
      return '0.1.0';
    }
    throw new Error('Unknown Graph Version!');
  };
  prototype.canonicalize = function(versionString){
    var version, converter, ref$;
    version = Version.fromString(versionString || this.determineVersion(this.data));
    converter = (ref$ = this.converters[version.major]) != null ? ref$[version.minor] : void 8;
    if (!converter) {
      throw new Error("Unable to convert Graph v" + this.version + " to " + this.CURRENT_VERSION + "!");
    }
    return converter.call(this, this.data, this.version);
  };
  prototype.converters = {
    0: {
      6: op.I,
      5: function(graph, version){
        var out, ref$, children, x0$, ref1$, ref2$, lines, ref3$, this$ = this;
        if (graph.chartType !== 'dygraphs') {
          throw new Error("Unknown ChartType '" + graph.chartType + "'!");
        }
        out = _.pick(graph, 'id', 'slug', 'name', 'shortName', 'desc', 'notes');
        out.root = {
          nodeType: 'canvas',
          width: graph.width,
          height: Math.max(graph.height, 500),
          y: {
            scaleType: (ref$ = graph.options) != null && ref$.logscale ? 'log' : 'linear'
          },
          children: children = []
        };
        x0$ = graph.options;
        children.push({
          nodeType: 'axis',
          enabled: x0$.drawXAxis,
          options: {
            dimension: 'x',
            orient: 'bottom',
            label: x0$.xlabel,
            labelSize: x0$.axisLabelFontSize,
            labelColor: x0$.axisLabelColor,
            stroke: {
              width: x0$.axisLineWidth,
              color: x0$.axisLineColor
            }
          }
        });
        children.push({
          nodeType: 'axis',
          enabled: x0$.drawYAxis,
          options: {
            dimension: 'y',
            orient: 'left',
            label: x0$.ylabel,
            labelSize: x0$.axisLabelFontSize,
            labelColor: x0$.axisLabelColor,
            stroke: {
              width: x0$.axisLineWidth,
              color: x0$.axisLineColor
            }
          }
        });
        children.push({
          nodeType: 'grid',
          enabled: x0$.drawXGrid,
          options: {
            dimension: 'x',
            stroke: {
              width: x0$.gridLineWidth,
              color: x0$.gridLineColor
            }
          }
        });
        children.push({
          nodeType: 'grid',
          enabled: x0$.drawYGrid,
          options: {
            dimension: 'y',
            stroke: {
              width: x0$.gridLineWidth,
              color: x0$.gridLineColor
            }
          }
        });
        children.push({
          nodeType: 'zoom-brush'
        });
        children.push({
          nodeType: 'callout',
          metricRef: 0,
          options: {
            dateFormat: 'MMM YYYY',
            valueFormat: ",." + ((ref1$ = x0$.digitsAfterDecimal) != null ? ref1$ : 2) + "s",
            deltaFormat: "+,." + ((ref2$ = x0$.digitsAfterDecimal) != null ? ref2$ : 2) + "%"
          }
        });
        children.push({
          nodeType: 'legend',
          enabled: x0$.legend && x0$.legend !== 'none',
          options: {
            dateFormat: 'MMM YYYY',
            valueFormat: ',.2s'
          }
        });
        out.root.children.push(lines = {
          nodeType: 'line-group',
          options: {
            palette: 'wmf_projects',
            dateFormat: 'MMM YYYY',
            valueFormat: ",." + ((ref3$ = x0$.digitsAfterDecimal) != null ? ref3$ : 2) + "s",
            stroke: {
              width: x0$.strokeWidth,
              pattern: x0$.strokePattern
            }
          }
        });
        x0$.colors || (x0$.colors = []);
        lines.children = graph.data.metrics.map(function(metric, idx){
          var node, ref$;
          return node = _.merge(this$.makeLineNode(), {
            nodeType: 'line',
            metric: _.pick(metric, 'source_id', 'source_col', 'timespan', 'type'),
            options: {
              label: metric.label || null,
              dateFormat: 'MMM YYYY',
              valueFormat: ",." + ((ref$ = x0$.digitsAfterDecimal) != null ? ref$ : 2) + "s",
              stroke: {
                color: metric.color || x0$.colors[idx],
                width: x0$.strokeWidth,
                pattern: x0$.strokePattern
              }
            }
          });
        });
        return out;
      },
      1: function(graph, version){
        throw Error('unimplemented');
      }
    }
  };
  prototype.defaultChildren = function(){
    return [
      {
        nodeType: 'axis',
        options: {
          dimension: 'x',
          orient: 'bottom'
        }
      }, {
        nodeType: 'axis',
        options: {
          dimension: 'y',
          orient: 'left'
        }
      }, {
        nodeType: 'grid',
        options: {
          dimension: 'x'
        }
      }, {
        nodeType: 'grid',
        options: {
          dimension: 'y'
        }
      }, {
        nodeType: 'zoom-brush'
      }, {
        nodeType: 'callout',
        metricRef: 0,
        options: {
          precision: 2,
          dateFormat: 'MMM YY'
        }
      }, {
        nodeType: 'legend',
        options: {
          dateFormat: 'DD MMM YYYY'
        }
      }, {
        nodeType: 'line-group',
        options: {
          palette: 'wmf_projects'
        },
        children: []
      }
    ];
  };
  prototype.makeLineNode = function(){
    return {
      nodeType: 'line',
      metric: {
        type: 'int',
        timespan: {
          start: null,
          end: null,
          step: null
        }
      },
      options: {}
    };
  };
  return GraphJSONConverter;
}());

});

;
require.define('/node_modules/limn/data/index.js', function(require, module, exports, __dirname, __filename, undefined){

var graph_json_converter, dataset, datasource, metric, out$ = typeof exports != 'undefined' && exports || this;
import$(exports, out$.graph_json_converter = graph_json_converter = require('./graph-json-converter'));
import$(exports, out$.dataset = dataset = require('./dataset'));
import$(exports, out$.datasource = datasource = require('./datasource'));
import$(exports, out$.metric = metric = require('./metric'));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/data/dataset/dataset.js', function(require, module, exports, __dirname, __filename, undefined){

var _, moment, CSVData, AttributesBase, TypeCache, Dataset;
_ = require('underscore');
moment = require('moment');
CSVData = require('timeseries').CSVData;
AttributesBase = require('../../base').AttributesBase;
TypeCache = require('../../util').TypeCache;
CSVData.prototype.parseDate = function(s){
  return moment(s, "YYYY.MM.DD.HH.mm.ss").toDate();
};
/**
 * @class Parses a dataset type and exports data under a common interface.
 * @extends PlainBase
 */
exports.Dataset = Dataset = (function(superclass){
  Dataset.displayName = 'Dataset';
  var prototype = extend$(Dataset, superclass).prototype, constructor = Dataset;
  /**
   * Type of the contents of the dataset.
   * 
   * Register a new type by creating a subclass:
   * 
   *      class LOLDataset extends Dataset
   *          @registerType 'lol'
   *          -> super ...
   * 
   * @type String
   */
  prototype.type = null;
  /**
   * Encoding of the data.
   * @type String
   */
  prototype.format = 'json';
  prototype.formatParsers = {
    csv: function(rawData){
      return new CSVData(rawData);
    },
    tsv: function(rawData){
      return new CSVData(rawData, {
        colSep: '\t'
      });
    },
    json: function(rawData){
      return rawData;
    },
    jsonp: function(rawData){
      return rawData;
    },
    xml: function(rawData){
      return rawData;
    },
    log: function(rawData){
      return rawData;
    }
  };
  /**
   * @constructor
   */;
  function Dataset(source, rawData){
    this.source = source;
    this.rawData = rawData;
    superclass.call(this);
    this.format = this.source.dataFormat();
    this.data = this.canonicalize(this.parse(rawData, this.format));
  }
  /**
   * Parses the raw data into an object representation.
   * 
   * @param {*} rawData Raw data.
   * @param {String} format Data format.
   * @returns {Object} Parsed data.
   */
  prototype.parse = function(rawData, format){
    var ref$, data, colIds;
    if (!(format in this.formatParsers)) {
      throw new Error("Unknown format '" + format + "'!");
    }
    this.parsedData = this.formatParsers[format](rawData);
    if (typeof ((ref$ = this.parsedData) != null ? ref$.getData : void 8) === 'function') {
      data = this.parsedData.getData();
      colIds = _.invoke(this.source.columns(), 'id');
      _.each(data, function(row){
        var idx, ref$, len$, id, results$ = [];
        for (idx = 0, len$ = (ref$ = colIds).length; idx < len$; ++idx) {
          id = ref$[idx];
          results$.push(row[id] = row[idx]);
        }
        return results$;
      });
      return data;
    } else {
      return this.parsedData;
    }
  };
  /**
   * Invoked to transform parsed data into its "proper" form for this dataset,
   * whatever that might be.
   * 
   * @param {Object} data Parsed data to canonicalize.
   * @returns {Object} Converted data.
   */
  prototype.canonicalize = function(data){
    return data;
  };
  /**
   * @returns {Object} The parsed and transformed data.
   */
  prototype.getData = function(){
    return this.data;
  };
  /**
   * @returns {Array<String>} List of column labels.
   */
  prototype.getLabels = function(){
    return this.labels;
  };
  /**
   * Map of known sub-types, keyed by type-name. Decorates this class to
   * provide static methods for interacting with the cache:
   *  - hasType
   *  - lookupType
   *  - registerType
   *  - invalidateType
   *  - purgeCache
   * 
   * @static
   * @type TypeCache
   */;
  Dataset.__cache__ = TypeCache.createFor(Dataset, 'type');
  return Dataset;
}(AttributesBase));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/dataset/geo-json-dataset.js', function(require, module, exports, __dirname, __filename, undefined){

var _, d3, Dataset, GeoJSONDataset;
_ = require('underscore');
d3 = require('d3');
Dataset = require('./dataset').Dataset;
/**
 * @class
 * @extends Dataset
 */
exports.GeoJSONDataset = GeoJSONDataset = (function(superclass){
  GeoJSONDataset.displayName = 'GeoJSONDataset';
  var prototype = extend$(GeoJSONDataset, superclass).prototype, constructor = GeoJSONDataset;
  GeoJSONDataset.registerType('geojson');
  function GeoJSONDataset(){
    superclass.apply(this, arguments);
  }
  return GeoJSONDataset;
}(Dataset));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/dataset/mobile-device-by-geo-dataset.js', function(require, module, exports, __dirname, __filename, undefined){

var Dataset, MobileDeviceByGeoDataset, countriesByTwoLetterCode;
Dataset = require('./dataset').Dataset;
/**
 * @class Giant hack to handle Mobile Device by Geo.
 * @extends Dataset
 */
exports.MobileDeviceByGeoDataset = MobileDeviceByGeoDataset = (function(superclass){
  MobileDeviceByGeoDataset.displayName = 'MobileDeviceByGeoDataset';
  var prototype = extend$(MobileDeviceByGeoDataset, superclass).prototype, constructor = MobileDeviceByGeoDataset;
  MobileDeviceByGeoDataset.registerType('mobile_device_by_geo');
  function MobileDeviceByGeoDataset(){
    superclass.apply(this, arguments);
    this.format = 'json';
  }
  /**
   * @returns {Array<String>} List of column labels.
   */
  prototype.getLabels = function(){
    var labels, ref$, key;
    labels = [];
    if ((ref$ = this.data) != null && ref$.length) {
      for (key in this.data[0]) {
        labels.push(key);
      }
    }
    return labels;
  };
  prototype.parse = function(rawData){
    var regex, rawDataPivoted, match, country, manufacturer, count, countryData, ref$, ref1$, results, v;
    if (typeof rawData !== 'string') {
      return rawData;
    }
    console.warn('INFO: PIG format, pre-parsing it into JSON');
    regex = /([^\t]*)\t([^\t]*)\t([^\t]*)\t([^\t]*)\t([^\t]*)\n/g;
    rawDataPivoted = {};
    while (match = regex.exec(rawData)) {
      country = match[2];
      manufacturer = match[3].toLowerCase();
      count = parseInt(match[5]) || 0;
      if (!rawDataPivoted[country]) {
        countryData = countriesByTwoLetterCode[country] || {
          id: 'unknown',
          name: 'Unknown'
        };
        rawDataPivoted[country] = {
          id: countryData.id,
          name: countryData.name
        };
      }
      (ref$ = rawDataPivoted[country])[manufacturer] == null && (ref$[manufacturer] = 0);
      rawDataPivoted[country][manufacturer] += count;
      (ref1$ = rawDataPivoted[country])['Total'] == null && (ref1$['Total'] = 0);
      rawDataPivoted[country]['Total'] += count;
    }
    return results = (function(){
      var ref$, results$ = [];
      for (country in ref$ = rawDataPivoted) {
        v = ref$[country];
        results$.push(v);
      }
      return results$;
    }());
  };
  return MobileDeviceByGeoDataset;
}(Dataset));
countriesByTwoLetterCode = JSON.parse('{"AF":{"id":"AFG","name":"Afghanistan","a2":"AF","a3":"AFG","num":4,"itu":"AFG","ioc":"AF","fifa":"AFG"},"AX":{"id":"ALA","name":"Åland","a2":"AX","a3":"ALA","num":248,"itu":" ","ioc":" ","fifa":" "},"AL":{"id":"ALB","name":"Albania","a2":"AL","a3":"ALB","num":8,"itu":"ALB","ioc":"AL","fifa":"ALB"},"DZ":{"id":"DZA","name":"Algeria","a2":"DZ","a3":"DZA","num":12,"itu":"ALG","ioc":"AG","fifa":"ALG"},"AS":{"id":"ASM","name":"American Samoa","a2":"AS","a3":"ASM","num":16,"itu":"SMA","ioc":"AQ","fifa":"ASA"},"AD":{"id":"AND","name":"Andorra","a2":"AD","a3":"AND","num":20,"itu":"AND","ioc":"AN","fifa":"AND"},"AO":{"id":"AGO","name":"Angola","a2":"AO","a3":"AGO","num":24,"itu":"AGL","ioc":"AO","fifa":"ANG"},"AI":{"id":"AIA","name":"Anguilla","a2":"AI","a3":"AIA","num":660,"itu":"AIA","ioc":"AV","fifa":"AIA"},"AQ":{"id":"ATA","name":"Antarctica","a2":"AQ","a3":"ATA","num":10,"itu":" ","ioc":"AY","fifa":" "},"AG":{"id":"ATG","name":"Antigua and Barbuda","a2":"AG","a3":"ATG","num":28,"itu":"ATG","ioc":"AC","fifa":"ANT"},"AR":{"id":"ARG","name":"Argentina","a2":"AR","a3":"ARG","num":32,"itu":"ARG","ioc":"AR","fifa":"ARG"},"AM":{"id":"ARM","name":"Armenia","a2":"AM","a3":"ARM","num":51,"itu":"ARM","ioc":"AM","fifa":"ARM"},"AW":{"id":"ABW","name":"Aruba","a2":"AW","a3":"ABW","num":533,"itu":"ABW","ioc":"AA","fifa":"ARU"},"AU":{"id":"AUS","name":"Australia","a2":"AU","a3":"AUS","num":36,"itu":"AUS","ioc":"AS","fifa":"AUS"},"AT":{"id":"AUT","name":"Austria","a2":"AT","a3":"AUT","num":40,"itu":"AUT","ioc":"AU","fifa":"AUT"},"AZ":{"id":"AZE","name":"Azerbaijan","a2":"AZ","a3":"AZE","num":31,"itu":"AZE","ioc":"AJ","fifa":"AZE"},"BS":{"id":"BHS","name":"Bahamas","a2":"BS","a3":"BHS","num":44,"itu":"BAH","ioc":"BF","fifa":"BAH"},"BH":{"id":"BHR","name":"Bahrain","a2":"BH","a3":"BHR","num":48,"itu":"BHR","ioc":"BA","fifa":"BRN"},"BD":{"id":"BGD","name":"Bangladesh","a2":"BD","a3":"BGD","num":50,"itu":"BGD","ioc":"BG","fifa":"BAN"},"BB":{"id":"BRB","name":"Barbados","a2":"BB","a3":"BRB","num":52,"itu":"BRB","ioc":"BB","fifa":"BAR"},"BY":{"id":"BLR","name":"Belarus","a2":"BY","a3":"BLR","num":112,"itu":"BLR","ioc":"BO","fifa":"BLR"},"BE":{"id":"BEL","name":"Belgium","a2":"BE","a3":"BEL","num":56,"itu":"BEL","ioc":"BE","fifa":"BEL"},"BZ":{"id":"BLZ","name":"Belize","a2":"BZ","a3":"BLZ","num":84,"itu":"BLZ","ioc":"BH","fifa":"BIZ"},"BJ":{"id":"BEN","name":"Benin","a2":"BJ","a3":"BEN","num":204,"itu":"BEN","ioc":"BN","fifa":"BEN"},"BM":{"id":"BMU","name":"Bermuda","a2":"BM","a3":"BMU","num":60,"itu":"BER","ioc":"BD","fifa":"BER"},"BT":{"id":"BTN","name":"Bhutan","a2":"BT","a3":"BTN","num":64,"itu":"BTN","ioc":"BT","fifa":"BHU"},"BO":{"id":"BOL","name":"Bolivia","a2":"BO","a3":"BOL","num":68,"itu":"BOL","ioc":"BL","fifa":"BOL"},"BQ":{"id":"BES","name":"Bonaire, Sint Eustatiusand Saba","a2":"BQ","a3":"BES","num":535,"itu":"ATN","ioc":"NL","fifa":"AHO"},"BA":{"id":"BIH","name":"Bosnia and Herzegovina","a2":"BA","a3":"BIH","num":70,"itu":"BIH","ioc":"BK","fifa":"BIH"},"BW":{"id":"BWA","name":"Botswana","a2":"BW","a3":"BWA","num":72,"itu":"BOT","ioc":"BC","fifa":"BOT"},"BV":{"id":"BVT","name":"Bouvet Island","a2":"BV","a3":"BVT","num":74,"itu":" ","ioc":"BV","fifa":" "},"BR":{"id":"BRA","name":"Brazil","a2":"BR","a3":"BRA","num":76,"itu":"B","ioc":"BR","fifa":"BRA"},"IO":{"id":"IOT","name":"British Indian Ocean Territory","a2":"IO","a3":"IOT","num":86,"itu":"BIO","ioc":"IO","fifa":" "},"BN":{"id":"BRN","name":"Brunei Darussalam","a2":"BN","a3":"BRN","num":96,"itu":"BRU","ioc":"BX","fifa":"BRU"},"BG":{"id":"BGR","name":"Bulgaria","a2":"BG","a3":"BGR","num":100,"itu":"BUL","ioc":"BU","fifa":"BUL"},"BF":{"id":"BFA","name":"Burkina Faso","a2":"BF","a3":"BFA","num":854,"itu":"BFA","ioc":"UV","fifa":"BUR"},"BI":{"id":"BDI","name":"Burundi","a2":"BI","a3":"BDI","num":108,"itu":"BDI","ioc":"BY","fifa":"BDI"},"KH":{"id":"KHM","name":"Cambodia","a2":"KH","a3":"KHM","num":116,"itu":"CBG","ioc":"CB","fifa":"CAM"},"CM":{"id":"CMR","name":"Cameroon","a2":"CM","a3":"CMR","num":120,"itu":"CME","ioc":"CM","fifa":"CMR"},"CA":{"id":"CAN","name":"Canada","a2":"CA","a3":"CAN","num":124,"itu":"CAN","ioc":"CA","fifa":"CAN"},"CV":{"id":"CPV","name":"Cape Verde","a2":"CV","a3":"CPV","num":132,"itu":"CPV","ioc":"CV","fifa":"CPV"},"KY":{"id":"CYM","name":"Cayman Islands","a2":"KY","a3":"CYM","num":136,"itu":"CYM","ioc":"CJ","fifa":"CAY"},"CF":{"id":"CAF","name":"Central African Republic","a2":"CF","a3":"CAF","num":140,"itu":"CAF","ioc":"CT","fifa":"CAF"},"TD":{"id":"TCD","name":"Chad","a2":"TD","a3":"TCD","num":148,"itu":"TCD","ioc":"CD","fifa":"CHA"},"CL":{"id":"CHL","name":"Chile","a2":"CL","a3":"CHL","num":152,"itu":"CHL","ioc":"CI","fifa":"CHI"},"CN":{"id":"CHN","name":"China","a2":"CN","a3":"CHN","num":156,"itu":"CHN","ioc":"CH","fifa":"CHN"},"CX":{"id":"CXR","name":"Christmas Island","a2":"CX","a3":"CXR","num":162,"itu":"CHR","ioc":"KT","fifa":" "},"CC":{"id":"CCK","name":"Cocos (Keeling) Islands","a2":"CC","a3":"CCK","num":166,"itu":"ICO","ioc":"CK","fifa":" "},"CO":{"id":"COL","name":"Colombia","a2":"CO","a3":"COL","num":170,"itu":"CLM","ioc":"CO","fifa":"COL"},"KM":{"id":"COM","name":"Comoros","a2":"KM","a3":"COM","num":174,"itu":"COM","ioc":"CN","fifa":"COM"},"CG":{"id":"COG","name":"Congo (Brazzaville)","a2":"CG","a3":"COG","num":178,"itu":"COG","ioc":"CF","fifa":"CGO"},"CD":{"id":"COD","name":"Congo (Kinshasa)","a2":"CD","a3":"COD","num":180,"itu":"COD","ioc":"CG","fifa":"COD"},"CK":{"id":"COK","name":"Cook Islands","a2":"CK","a3":"COK","num":184,"itu":"CKH","ioc":"CW","fifa":"COK"},"CR":{"id":"CRI","name":"Costa Rica","a2":"CR","a3":"CRI","num":188,"itu":"CTR","ioc":"CS","fifa":"CRC"},"CI":{"id":"CIV","name":"Côte d\'Ivoire","a2":"CI","a3":"CIV","num":384,"itu":"CTI","ioc":"IV","fifa":"CIV"},"HR":{"id":"HRV","name":"Croatia","a2":"HR","a3":"HRV","num":191,"itu":"HRV","ioc":"HR","fifa":"CRO"},"CU":{"id":"CUB","name":"Cuba","a2":"CU","a3":"CUB","num":192,"itu":"CUB","ioc":"CU","fifa":"CUB"},"CW":{"id":"CUW","name":"Curaçao","a2":"CW","a3":"CUW","num":531,"itu":"","ioc":"UC","fifa":""},"CY":{"id":"CYP","name":"Cyprus","a2":"CY","a3":"CYP","num":196,"itu":"CYP","ioc":"CY","fifa":"CYP"},"CZ":{"id":"CZE","name":"Czech Republic","a2":"CZ","a3":"CZE","num":203,"itu":"CZE","ioc":"EZ","fifa":"CZE"},"DK":{"id":"DNK","name":"Denmark","a2":"DK","a3":"DNK","num":208,"itu":"DNK","ioc":"DA","fifa":"DEN"},"DJ":{"id":"DJI","name":"Djibouti","a2":"DJ","a3":"DJI","num":262,"itu":"DJI","ioc":"DJ","fifa":"DJI"},"DM":{"id":"DMA","name":"Dominica","a2":"DM","a3":"DMA","num":212,"itu":"DMA","ioc":"DO","fifa":"DMA"},"DO":{"id":"DOM","name":"Dominican Republic","a2":"DO","a3":"DOM","num":214,"itu":"DOM","ioc":"DR","fifa":"DOM"},"EC":{"id":"ECU","name":"Ecuador","a2":"EC","a3":"ECU","num":218,"itu":"EQA","ioc":"EC","fifa":"ECU"},"EG":{"id":"EGY","name":"Egypt","a2":"EG","a3":"EGY","num":818,"itu":"EGY","ioc":"EG","fifa":"EGY"},"SV":{"id":"SLV","name":"El Salvador","a2":"SV","a3":"SLV","num":222,"itu":"SLV","ioc":"ES","fifa":"ESA"},"GQ":{"id":"GNQ","name":"Equatorial Guinea","a2":"GQ","a3":"GNQ","num":226,"itu":"GNE","ioc":"EK","fifa":"GEQ"},"ER":{"id":"ERI","name":"Eritrea","a2":"ER","a3":"ERI","num":232,"itu":"ERI","ioc":"ER","fifa":"ERI"},"EE":{"id":"EST","name":"Estonia","a2":"EE","a3":"EST","num":233,"itu":"EST","ioc":"EN","fifa":"EST"},"ET":{"id":"ETH","name":"Ethiopia","a2":"ET","a3":"ETH","num":231,"itu":"ETH","ioc":"ET","fifa":"ETH"},"FK":{"id":"FLK","name":"Falkland Islands","a2":"FK","a3":"FLK","num":238,"itu":"FLK","ioc":"FK","fifa":"FLK"},"FO":{"id":"FRO","name":"Faroe Islands","a2":"FO","a3":"FRO","num":234,"itu":"FRO","ioc":"FO","fifa":"FAR"},"FJ":{"id":"FJI","name":"Fiji","a2":"FJ","a3":"FJI","num":242,"itu":"FJI","ioc":"FJ","fifa":"FIJ"},"FI":{"id":"FIN","name":"Finland","a2":"FI","a3":"FIN","num":246,"itu":"FIN","ioc":"FI","fifa":"FIN"},"FR":{"id":"FRA","name":"France","a2":"FR","a3":"FRA","num":250,"itu":"F","ioc":"FR","fifa":"FRA"},"GF":{"id":"GUF","name":"French Guiana","a2":"GF","a3":"GUF","num":254,"itu":"GUF","ioc":"FG","fifa":"FGU"},"PF":{"id":"PYF","name":"French Polynesia","a2":"PF","a3":"PYF","num":258,"itu":"OCE","ioc":"FP","fifa":"FPO"},"TF":{"id":"ATF","name":"French Southern Lands","a2":"TF","a3":"ATF","num":260,"itu":" ","ioc":"FS","fifa":" "},"GA":{"id":"GAB","name":"Gabon","a2":"GA","a3":"GAB","num":266,"itu":"GAB","ioc":"GB","fifa":"GAB"},"GM":{"id":"GMB","name":"Gambia","a2":"GM","a3":"GMB","num":270,"itu":"GMB","ioc":"GA","fifa":"GAM"},"GE":{"id":"GEO","name":"Georgia","a2":"GE","a3":"GEO","num":268,"itu":"GEO","ioc":"GG","fifa":"GEO"},"DE":{"id":"DEU","name":"Germany","a2":"DE","a3":"DEU","num":276,"itu":"D","ioc":"GM","fifa":"GER"},"GH":{"id":"GHA","name":"Ghana","a2":"GH","a3":"GHA","num":288,"itu":"GHA","ioc":"GH","fifa":"GHA"},"GI":{"id":"GIB","name":"Gibraltar","a2":"GI","a3":"GIB","num":292,"itu":"GIB","ioc":"GI","fifa":"GIB"},"GR":{"id":"GRC","name":"Greece","a2":"GR","a3":"GRC","num":300,"itu":"GRC","ioc":"GR","fifa":"GRE"},"GL":{"id":"GRL","name":"Greenland","a2":"GL","a3":"GRL","num":304,"itu":"GRL","ioc":"GL","fifa":"GRL"},"GD":{"id":"GRD","name":"Grenada","a2":"GD","a3":"GRD","num":308,"itu":"GRD","ioc":"GJ","fifa":"GRN"},"GP":{"id":"GLP","name":"Guadeloupe","a2":"GP","a3":"GLP","num":312,"itu":"GDL","ioc":"GP","fifa":"GUD"},"GU":{"id":"GUM","name":"Guam","a2":"GU","a3":"GUM","num":316,"itu":"GUM","ioc":"GQ","fifa":"GUM"},"GT":{"id":"GTM","name":"Guatemala","a2":"GT","a3":"GTM","num":320,"itu":"GTM","ioc":"GT","fifa":"GUA"},"GG":{"id":"GGY","name":"Guernsey","a2":"GG","a3":"GGY","num":831,"itu":" ","ioc":"GK","fifa":" "},"GN":{"id":"GIN","name":"Guinea","a2":"GN","a3":"GIN","num":324,"itu":"GUI","ioc":"GV","fifa":"GUI"},"GW":{"id":"GNB","name":"Guinea-Bissau","a2":"GW","a3":"GNB","num":624,"itu":"GNB","ioc":"PU","fifa":"GBS"},"GY":{"id":"GUY","name":"Guyana","a2":"GY","a3":"GUY","num":328,"itu":"GUY","ioc":"GY","fifa":"GUY"},"HT":{"id":"HTI","name":"Haiti","a2":"HT","a3":"HTI","num":332,"itu":"HTI","ioc":"HA","fifa":"HAI"},"HM":{"id":"HMD","name":"Heard and McDonald Islands","a2":"HM","a3":"HMD","num":334,"itu":" ","ioc":"HM","fifa":" "},"HN":{"id":"HND","name":"Honduras","a2":"HN","a3":"HND","num":340,"itu":"HND","ioc":"HO","fifa":"HON"},"HK":{"id":"HKG","name":"Hong Kong","a2":"HK","a3":"HKG","num":344,"itu":"HKG","ioc":"HK","fifa":"HKG"},"HU":{"id":"HUN","name":"Hungary","a2":"HU","a3":"HUN","num":348,"itu":"HNG","ioc":"HU","fifa":"HUN"},"IS":{"id":"ISL","name":"Iceland","a2":"IS","a3":"ISL","num":352,"itu":"ISL","ioc":"IC","fifa":"ISL"},"IN":{"id":"IND","name":"India","a2":"IN","a3":"IND","num":356,"itu":"IND","ioc":"IN","fifa":"IND"},"ID":{"id":"IDN","name":"Indonesia","a2":"ID","a3":"IDN","num":360,"itu":"INS","ioc":"ID","fifa":"INA"},"IR":{"id":"IRN","name":"Iran","a2":"IR","a3":"IRN","num":364,"itu":"IRN","ioc":"IR","fifa":"IRI"},"IQ":{"id":"IRQ","name":"Iraq","a2":"IQ","a3":"IRQ","num":368,"itu":"IRQ","ioc":"IZ","fifa":"IRQ"},"IE":{"id":"IRL","name":"Ireland","a2":"IE","a3":"IRL","num":372,"itu":"IRL","ioc":"EI","fifa":"IRL"},"IM":{"id":"IMN","name":"Isle of Man","a2":"IM","a3":"IMN","num":833,"itu":" ","ioc":"IM","fifa":" "},"IL":{"id":"ISR","name":"Israel","a2":"IL","a3":"ISR","num":376,"itu":"ISR","ioc":"IS","fifa":"ISR"},"IT":{"id":"ITA","name":"Italy","a2":"IT","a3":"ITA","num":380,"itu":"I","ioc":"IT","fifa":"ITA"},"JM":{"id":"JAM","name":"Jamaica","a2":"JM","a3":"JAM","num":388,"itu":"JMC","ioc":"JM","fifa":"JAM"},"JP":{"id":"JPN","name":"Japan","a2":"JP","a3":"JPN","num":392,"itu":"J","ioc":"JA","fifa":"JPN"},"JE":{"id":"JEY","name":"Jersey","a2":"JE","a3":"JEY","num":832,"itu":" ","ioc":"JE","fifa":" "},"JO":{"id":"JOR","name":"Jordan","a2":"JO","a3":"JOR","num":400,"itu":"JOR","ioc":"JO","fifa":"JOR"},"KZ":{"id":"KAZ","name":"Kazakhstan","a2":"KZ","a3":"KAZ","num":398,"itu":"KAZ","ioc":"KZ","fifa":"KAZ"},"KE":{"id":"KEN","name":"Kenya","a2":"KE","a3":"KEN","num":404,"itu":"KEN","ioc":"KE","fifa":"KEN"},"KI":{"id":"KIR","name":"Kiribati","a2":"KI","a3":"KIR","num":296,"itu":"KIR","ioc":"KR","fifa":"KIR"},"KP":{"id":"PRK","name":"Korea, North","a2":"KP","a3":"PRK","num":408,"itu":"KRE","ioc":"KN","fifa":"PRK"},"KR":{"id":"KOR","name":"Korea, South","a2":"KR","a3":"KOR","num":410,"itu":"KOR","ioc":"KS","fifa":"KOR"},"KW":{"id":"KWT","name":"Kuwait","a2":"KW","a3":"KWT","num":414,"itu":"KWT","ioc":"KU","fifa":"KUW"},"KG":{"id":"KGZ","name":"Kyrgyzstan","a2":"KG","a3":"KGZ","num":417,"itu":"KGZ","ioc":"KG","fifa":"KGZ"},"LA":{"id":"LAO","name":"Laos","a2":"LA","a3":"LAO","num":418,"itu":"LAO","ioc":"LA","fifa":"LAO"},"LV":{"id":"LVA","name":"Latvia","a2":"LV","a3":"LVA","num":428,"itu":"LVA","ioc":"LG","fifa":"LAT"},"LB":{"id":"LBN","name":"Lebanon","a2":"LB","a3":"LBN","num":422,"itu":"LBN","ioc":"LE","fifa":"LIB"},"LS":{"id":"LSO","name":"Lesotho","a2":"LS","a3":"LSO","num":426,"itu":"LSO","ioc":"LT","fifa":"LES"},"LR":{"id":"LBR","name":"Liberia","a2":"LR","a3":"LBR","num":430,"itu":"LBR","ioc":"LI","fifa":"LBR"},"LY":{"id":"LBY","name":"Libya","a2":"LY","a3":"LBY","num":434,"itu":"LBY","ioc":"LY","fifa":"LBA"},"LI":{"id":"LIE","name":"Liechtenstein","a2":"LI","a3":"LIE","num":438,"itu":"LIE","ioc":"LS","fifa":"LIE"},"LT":{"id":"LTU","name":"Lithuania","a2":"LT","a3":"LTU","num":440,"itu":"LTU","ioc":"LH","fifa":"LTU"},"LU":{"id":"LUX","name":"Luxembourg","a2":"LU","a3":"LUX","num":442,"itu":"LUX","ioc":"LU","fifa":"LUX"},"MO":{"id":"MAC","name":"Macau","a2":"MO","a3":"MAC","num":446,"itu":"MAC","ioc":"MC","fifa":"MAC"},"MK":{"id":"MKD","name":"Macedonia","a2":"MK","a3":"MKD","num":807,"itu":"MKD","ioc":"MK","fifa":"MKD"},"MG":{"id":"MDG","name":"Madagascar","a2":"MG","a3":"MDG","num":450,"itu":"MDG","ioc":"MA","fifa":"MAD"},"MW":{"id":"MWI","name":"Malawi","a2":"MW","a3":"MWI","num":454,"itu":"MWI","ioc":"MI","fifa":"MAW"},"MY":{"id":"MYS","name":"Malaysia","a2":"MY","a3":"MYS","num":458,"itu":"MLA","ioc":"MY","fifa":"MAS"},"MV":{"id":"MDV","name":"Maldives","a2":"MV","a3":"MDV","num":462,"itu":"MLD","ioc":"MV","fifa":"MDV"},"ML":{"id":"MLI","name":"Mali","a2":"ML","a3":"MLI","num":466,"itu":"MLI","ioc":"ML","fifa":"MLI"},"MT":{"id":"MLT","name":"Malta","a2":"MT","a3":"MLT","num":470,"itu":"MLT","ioc":"MT","fifa":"MLT"},"MH":{"id":"MHL","name":"Marshall Islands","a2":"MH","a3":"MHL","num":584,"itu":"MHL","ioc":"RM","fifa":"MSH"},"MQ":{"id":"MTQ","name":"Martinique","a2":"MQ","a3":"MTQ","num":474,"itu":"MRT","ioc":"MB","fifa":"MRT"},"MR":{"id":"MRT","name":"Mauritania","a2":"MR","a3":"MRT","num":478,"itu":"MTN","ioc":"MR","fifa":"MTN"},"MU":{"id":"MUS","name":"Mauritius","a2":"MU","a3":"MUS","num":480,"itu":"MAU","ioc":"MP","fifa":"MRI"},"YT":{"id":"MYT","name":"Mayotte","a2":"YT","a3":"MYT","num":175,"itu":"MYT","ioc":"MF","fifa":"MAY"},"MX":{"id":"MEX","name":"Mexico","a2":"MX","a3":"MEX","num":484,"itu":"MEX","ioc":"MX","fifa":"MEX"},"FM":{"id":"FSM","name":"Micronesia","a2":"FM","a3":"FSM","num":583,"itu":"FSM","ioc":"FM","fifa":"FSM"},"MD":{"id":"MDA","name":"Moldova","a2":"MD","a3":"MDA","num":498,"itu":"MDA","ioc":"MD","fifa":"MDA"},"MC":{"id":"MCO","name":"Monaco","a2":"MC","a3":"MCO","num":492,"itu":"MCO","ioc":"MN","fifa":"MON"},"MN":{"id":"MNG","name":"Mongolia","a2":"MN","a3":"MNG","num":496,"itu":"MNG","ioc":"MG","fifa":"MGL"},"ME":{"id":"MNE","name":"Montenegro","a2":"ME","a3":"MNE","num":499,"itu":"MNE","ioc":"MJ","fifa":"MGO"},"MS":{"id":"MSR","name":"Montserrat","a2":"MS","a3":"MSR","num":500,"itu":"MSR","ioc":"MH","fifa":"MNT"},"MA":{"id":"MAR","name":"Morocco","a2":"MA","a3":"MAR","num":504,"itu":"MRC","ioc":"MO","fifa":"MAR"},"MZ":{"id":"MOZ","name":"Mozambique","a2":"MZ","a3":"MOZ","num":508,"itu":"MOZ","ioc":"MZ","fifa":"MOZ"},"MM":{"id":"MMR","name":"Myanmar","a2":"MM","a3":"MMR","num":104,"itu":"MYA","ioc":"BM","fifa":"MYA"},"NA":{"id":"NAM","name":"Namibia","a2":"NA","a3":"NAM","num":516,"itu":"NMB","ioc":"WA","fifa":"NAM"},"NR":{"id":"NRU","name":"Nauru","a2":"NR","a3":"NRU","num":520,"itu":"NRU","ioc":"NR","fifa":"NRU"},"NP":{"id":"NPL","name":"Nepal","a2":"NP","a3":"NPL","num":524,"itu":"NPL","ioc":"NP","fifa":"NEP"},"NL":{"id":"NLD","name":"Netherlands","a2":"NL","a3":"NLD","num":528,"itu":"HOL","ioc":"NL","fifa":"NED"},"NC":{"id":"NCL","name":"New Caledonia","a2":"NC","a3":"NCL","num":540,"itu":"NCL","ioc":"NC","fifa":"NCD"},"NZ":{"id":"NZL","name":"New Zealand","a2":"NZ","a3":"NZL","num":554,"itu":"NZL","ioc":"NZ","fifa":"NZL"},"NI":{"id":"NIC","name":"Nicaragua","a2":"NI","a3":"NIC","num":558,"itu":"NCG","ioc":"NU","fifa":"NCA"},"NE":{"id":"NER","name":"Niger","a2":"NE","a3":"NER","num":562,"itu":"NGR","ioc":"NG","fifa":"NIG"},"NG":{"id":"NGA","name":"Nigeria","a2":"NG","a3":"NGA","num":566,"itu":"NIG","ioc":"NI","fifa":"NGR"},"NU":{"id":"NIU","name":"Niue","a2":"NU","a3":"NIU","num":570,"itu":"NIU","ioc":"NE","fifa":"NIU"},"NF":{"id":"NFK","name":"Norfolk Island","a2":"NF","a3":"NFK","num":574,"itu":"NFK","ioc":"NF","fifa":"NFI"},"MP":{"id":"MNP","name":"Northern Mariana Islands","a2":"MP","a3":"MNP","num":580,"itu":"MRA","ioc":"CQ","fifa":"NMA"},"NO":{"id":"NOR","name":"Norway","a2":"NO","a3":"NOR","num":578,"itu":"NOR","ioc":"NO","fifa":"NOR"},"OM":{"id":"OMN","name":"Oman","a2":"OM","a3":"OMN","num":512,"itu":"OMA","ioc":"MU","fifa":"OMA"},"PK":{"id":"PAK","name":"Pakistan","a2":"PK","a3":"PAK","num":586,"itu":"PAK","ioc":"PK","fifa":"PAK"},"PW":{"id":"PLW","name":"Palau","a2":"PW","a3":"PLW","num":585,"itu":"PLW","ioc":"PS","fifa":"PLW"},"PS":{"id":"PSE","name":"Palestine","a2":"PS","a3":"PSE","num":275,"itu":" ","ioc":"GZWE","fifa":"PLE"},"PA":{"id":"PAN","name":"Panama","a2":"PA","a3":"PAN","num":591,"itu":"PNR","ioc":"PM","fifa":"PAN"},"PG":{"id":"PNG","name":"Papua New Guinea","a2":"PG","a3":"PNG","num":598,"itu":"PNG","ioc":"PP","fifa":"PNG"},"PY":{"id":"PRY","name":"Paraguay","a2":"PY","a3":"PRY","num":600,"itu":"PRG","ioc":"PA","fifa":"PAR"},"PE":{"id":"PER","name":"Peru","a2":"PE","a3":"PER","num":604,"itu":"PRU","ioc":"PE","fifa":"PER"},"PH":{"id":"PHL","name":"Philippines","a2":"PH","a3":"PHL","num":608,"itu":"PHL","ioc":"RP","fifa":"PHI"},"PN":{"id":"PCN","name":"Pitcairn","a2":"PN","a3":"PCN","num":612,"itu":"PTC","ioc":"PC","fifa":" "},"PL":{"id":"POL","name":"Poland","a2":"PL","a3":"POL","num":616,"itu":"POL","ioc":"PL","fifa":"POL"},"PT":{"id":"PRT","name":"Portugal","a2":"PT","a3":"PRT","num":620,"itu":"POR","ioc":"PO","fifa":"POR"},"PR":{"id":"PRI","name":"Puerto Rico","a2":"PR","a3":"PRI","num":630,"itu":"PTR","ioc":"RQ","fifa":"PUR"},"QA":{"id":"QAT","name":"Qatar","a2":"QA","a3":"QAT","num":634,"itu":"QAT","ioc":"QA","fifa":"QAT"},"RE":{"id":"REU","name":"Reunion","a2":"RE","a3":"REU","num":638,"itu":"REU","ioc":"RE","fifa":"REU"},"RO":{"id":"ROU","name":"Romania","a2":"RO","a3":"ROU","num":642,"itu":"ROU","ioc":"RO","fifa":"ROU"},"RU":{"id":"RUS","name":"Russian Federation","a2":"RU","a3":"RUS","num":643,"itu":"RUS","ioc":"RS","fifa":"RUS"},"RW":{"id":"RWA","name":"Rwanda","a2":"RW","a3":"RWA","num":646,"itu":"RRW","ioc":"RW","fifa":"RWA"},"BL":{"id":"BLM","name":"Saint Barthélemy","a2":"BL","a3":"BLM","num":652,"itu":" ","ioc":"TB","fifa":" "},"SH":{"id":"SHN","name":"Saint Helena","a2":"SH","a3":"SHN","num":654,"itu":"SHN","ioc":"SH","fifa":"HEL"},"KN":{"id":"KNA","name":"Saint Kitts and Nevis","a2":"KN","a3":"KNA","num":659,"itu":"KNA","ioc":"SC","fifa":"SKN"},"LC":{"id":"LCA","name":"Saint Lucia","a2":"LC","a3":"LCA","num":662,"itu":"LCA","ioc":"ST","fifa":"LCA"},"MF":{"id":"MAF","name":"Saint Martin (French part)","a2":"MF","a3":"MAF","num":663,"itu":" ","ioc":"RN","fifa":" "},"PM":{"id":"SPM","name":"Saint Pierre and Miquelon","a2":"PM","a3":"SPM","num":666,"itu":"SPM","ioc":"SB","fifa":"SPM"},"VC":{"id":"VCT","name":"Saint Vincent and the Grenadines","a2":"VC","a3":"VCT","num":670,"itu":"VCT","ioc":"VC","fifa":"VIN"},"WS":{"id":"WSM","name":"Samoa","a2":"WS","a3":"WSM","num":882,"itu":"SMO","ioc":"WS","fifa":"SAM"},"SM":{"id":"SMR","name":"San Marino","a2":"SM","a3":"SMR","num":674,"itu":"SMR","ioc":"SM","fifa":"SMR"},"ST":{"id":"STP","name":"Sao Tome and Principe","a2":"ST","a3":"STP","num":678,"itu":"STP","ioc":"TP","fifa":"STP"},"SA":{"id":"SAU","name":"Saudi Arabia","a2":"SA","a3":"SAU","num":682,"itu":"ARS","ioc":"SA","fifa":"KSA"},"SN":{"id":"SEN","name":"Senegal","a2":"SN","a3":"SEN","num":686,"itu":"SEN","ioc":"SG","fifa":"SEN"},"RS":{"id":"SRB","name":"Serbia","a2":"RS","a3":"SRB","num":688,"itu":"SRB","ioc":"RIKV","fifa":"SRB"},"SC":{"id":"SYC","name":"Seychelles","a2":"SC","a3":"SYC","num":690,"itu":"SEY","ioc":"SE","fifa":"SEY"},"SL":{"id":"SLE","name":"Sierra Leone","a2":"SL","a3":"SLE","num":694,"itu":"SRL","ioc":"SL","fifa":"SLE"},"SG":{"id":"SGP","name":"Singapore","a2":"SG","a3":"SGP","num":702,"itu":"SNG","ioc":"SN","fifa":"SIN"},"SX":{"id":"SXM","name":"Sint Maarten","a2":"SX","a3":"SXM","num":534,"itu":"","ioc":"NN","fifa":""},"SK":{"id":"SVK","name":"Slovakia","a2":"SK","a3":"SVK","num":703,"itu":"SVK","ioc":"LO","fifa":"SVK"},"SI":{"id":"SVN","name":"Slovenia","a2":"SI","a3":"SVN","num":705,"itu":"SVN","ioc":"SI","fifa":"SLO"},"SB":{"id":"SLB","name":"Solomon Islands","a2":"SB","a3":"SLB","num":90,"itu":"SLM","ioc":"BP","fifa":"SOL"},"SO":{"id":"SOM","name":"Somalia","a2":"SO","a3":"SOM","num":706,"itu":"SOM","ioc":"SO","fifa":"SOM"},"ZA":{"id":"ZAF","name":"South Africa","a2":"ZA","a3":"ZAF","num":710,"itu":"AFS","ioc":"SF","fifa":"RSA"},"GS":{"id":"SGS","name":"South Georgia and South Sandwich Islands","a2":"GS","a3":"SGS","num":239,"itu":" ","ioc":"SX","fifa":" "},"SS":{"id":"SSD","name":"South Sudan","a2":"SS","a3":"SSD","num":728,"itu":"SSD","ioc":"OD","fifa":""},"ES":{"id":"ESP","name":"Spain","a2":"ES","a3":"ESP","num":724,"itu":"E","ioc":"SP","fifa":"ESP"},"LK":{"id":"LKA","name":"Sri Lanka","a2":"LK","a3":"LKA","num":144,"itu":"CLN","ioc":"CE","fifa":"SRI"},"SD":{"id":"SDN","name":"Sudan","a2":"SD","a3":"SDN","num":729,"itu":"SDN","ioc":"SU","fifa":"SUD"},"SR":{"id":"SUR","name":"Suriname","a2":"SR","a3":"SUR","num":740,"itu":"SUR","ioc":"NS","fifa":"SUR"},"SJ":{"id":"SJM","name":"Svalbard and Jan Mayen Islands","a2":"SJ","a3":"SJM","num":744,"itu":"NOR","ioc":"SVJN","fifa":" "},"SZ":{"id":"SWZ","name":"Swaziland","a2":"SZ","a3":"SWZ","num":748,"itu":"SWZ","ioc":"WZ","fifa":"SWZ"},"SE":{"id":"SWE","name":"Sweden","a2":"SE","a3":"SWE","num":752,"itu":"S","ioc":"SW","fifa":"SWE"},"CH":{"id":"CHE","name":"Switzerland","a2":"CH","a3":"CHE","num":756,"itu":"SUI","ioc":"SZ","fifa":"SUI"},"SY":{"id":"SYR","name":"Syria","a2":"SY","a3":"SYR","num":760,"itu":"SYR","ioc":"SY","fifa":"SYR"},"TW":{"id":"TWN","name":"Taiwan","a2":"TW","a3":"TWN","num":158,"itu":" ","ioc":"TW","fifa":"TPE"},"TJ":{"id":"TJK","name":"Tajikistan","a2":"TJ","a3":"TJK","num":762,"itu":"TJK","ioc":"TI","fifa":"TJK"},"TZ":{"id":"TZA","name":"Tanzania","a2":"TZ","a3":"TZA","num":834,"itu":"TZA","ioc":"TZ","fifa":"TAN"},"TH":{"id":"THA","name":"Thailand","a2":"TH","a3":"THA","num":764,"itu":"THA","ioc":"TH","fifa":"THA"},"TL":{"id":"TLS","name":"Timor-Leste","a2":"TL","a3":"TLS","num":626,"itu":"TLS","ioc":"TT","fifa":"TLS"},"TG":{"id":"TGO","name":"Togo","a2":"TG","a3":"TGO","num":768,"itu":"TGO","ioc":"TO","fifa":"TOG"},"TK":{"id":"TKL","name":"Tokelau","a2":"TK","a3":"TKL","num":772,"itu":"TKL","ioc":"TL","fifa":" "},"TO":{"id":"TON","name":"Tonga","a2":"TO","a3":"TON","num":776,"itu":"TON","ioc":"TN","fifa":"TGA"},"TT":{"id":"TTO","name":"Trinidad and Tobago","a2":"TT","a3":"TTO","num":780,"itu":"TRD","ioc":"TD","fifa":"TRI"},"TN":{"id":"TUN","name":"Tunisia","a2":"TN","a3":"TUN","num":788,"itu":"TUN","ioc":"TS","fifa":"TUN"},"TR":{"id":"TUR","name":"Turkey","a2":"TR","a3":"TUR","num":792,"itu":"TUR","ioc":"TU","fifa":"TUR"},"TM":{"id":"TKM","name":"Turkmenistan","a2":"TM","a3":"TKM","num":795,"itu":"TKM","ioc":"TX","fifa":"TKM"},"TC":{"id":"TCA","name":"Turks and Caicos Islands","a2":"TC","a3":"TCA","num":796,"itu":"TCA","ioc":"TK","fifa":"TKS"},"TV":{"id":"TUV","name":"Tuvalu","a2":"TV","a3":"TUV","num":798,"itu":"TUV","ioc":"TV","fifa":"TUV"},"UG":{"id":"UGA","name":"Uganda","a2":"UG","a3":"UGA","num":800,"itu":"UGA","ioc":"UG","fifa":"UGA"},"UA":{"id":"UKR","name":"Ukraine","a2":"UA","a3":"UKR","num":804,"itu":"UKR","ioc":"UP","fifa":"UKR"},"AE":{"id":"ARE","name":"United Arab Emirates","a2":"AE","a3":"ARE","num":784,"itu":"UAE","ioc":"AE","fifa":"UAE"},"GB":{"id":"GBR","name":"United Kingdom","a2":"GB","a3":"GBR","num":826,"itu":"G","ioc":"UK","fifa":"GBR"},"UM":{"id":"UMI","name":"United States Minor Outlying Islands","a2":"UM","a3":"UMI","num":581,"itu":" ","ioc":"a","fifa":" "},"US":{"id":"USA","name":"United States of America","a2":"US","a3":"USA","num":840,"itu":"USA","ioc":"US","fifa":"USA"},"UY":{"id":"URY","name":"Uruguay","a2":"UY","a3":"URY","num":858,"itu":"URG","ioc":"UY","fifa":"URU"},"UZ":{"id":"UZB","name":"Uzbekistan","a2":"UZ","a3":"UZB","num":860,"itu":"UZB","ioc":"UZ","fifa":"UZB"},"VU":{"id":"VUT","name":"Vanuatu","a2":"VU","a3":"VUT","num":548,"itu":"VUT","ioc":"NH","fifa":"VAN"},"VA":{"id":"VAT","name":"Vatican City","a2":"VA","a3":"VAT","num":336,"itu":"CVA","ioc":"VT","fifa":" "},"VE":{"id":"VEN","name":"Venezuela","a2":"VE","a3":"VEN","num":862,"itu":"VEN","ioc":"VE","fifa":"VEN"},"VN":{"id":"VNM","name":"Vietnam","a2":"VN","a3":"VNM","num":704,"itu":"VTN","ioc":"VM","fifa":"VIE"},"VG":{"id":"VGB","name":"Virgin Islands, British","a2":"VG","a3":"VGB","num":92,"itu":"VRG","ioc":"VI","fifa":"IVB"},"VI":{"id":"VIR","name":"Virgin Islands, U.S.","a2":"VI","a3":"VIR","num":850,"itu":"VIR","ioc":"VQ","fifa":"ISV"},"WF":{"id":"WLF","name":"Wallis and Futuna Islands","a2":"WF","a3":"WLF","num":876,"itu":"WAL","ioc":"WF","fifa":"WAF"},"EH":{"id":"ESH","name":"Western Sahara","a2":"EH","a3":"ESH","num":732,"itu":"AOE","ioc":"WI","fifa":" "},"YE":{"id":"YEM","name":"Yemen","a2":"YE","a3":"YEM","num":887,"itu":"YEM","ioc":"YM","fifa":"YEM"},"ZM":{"id":"ZMB","name":"Zambia","a2":"ZM","a3":"ZMB","num":894,"itu":"ZMB","ioc":"ZA","fifa":"ZAM"},"ZW":{"id":"ZWE","name":"Zimbabwe","a2":"ZW","a3":"ZWE","num":716,"itu":"ZWE","ioc":"ZI","fifa":"ZIM"}}');
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/dataset/series-dataset.js', function(require, module, exports, __dirname, __filename, undefined){

var _, d3, Dataset, SeriesDataset;
_ = require('underscore');
d3 = require('d3');
Dataset = require('./dataset').Dataset;
/**
 * @class
 * @extends Dataset
 */
exports.SeriesDataset = SeriesDataset = (function(superclass){
  SeriesDataset.displayName = 'SeriesDataset';
  var prototype = extend$(SeriesDataset, superclass).prototype, constructor = SeriesDataset;
  SeriesDataset.registerType('series');
  function SeriesDataset(source, rawData){
    superclass.apply(this, arguments);
    if (_.isArray(this.data) && _.isArray(this.data[0])) {
      this.columns = _.zip.apply(_, this.data);
    }
  }
  /**
   * @returns {Array<Array>} List of rows, each of which includes all columns.
   */
  prototype.getData = function(){
    return this.data;
  };
  /**
   * @returns {Array<Array>} List of all columns (including ID column).
   */
  prototype.getColumns = function(){
    return this.columns;
  };
  /**
   * @param {Number} idx Index of column.
   * @returns {Array} Column at `idx`.
   */
  prototype.getColumn = function(idx){
    return this.columns[idx];
  };
  /**
   * @returns {Array<String>} List of column labels.
   */
  prototype.getLabels = function(){
    return this.labels;
  };
  return SeriesDataset;
}(Dataset));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/dataset/timeseries-dataset.js', function(require, module, exports, __dirname, __filename, undefined){

var Dataset, TimeseriesDataset;
Dataset = require('./dataset').Dataset;
/**
 * @class
 * @extends Dataset
 */
exports.TimeseriesDataset = TimeseriesDataset = (function(superclass){
  TimeseriesDataset.displayName = 'TimeseriesDataset';
  var prototype = extend$(TimeseriesDataset, superclass).prototype, constructor = TimeseriesDataset;
  TimeseriesDataset.registerType('timeseries');
  function TimeseriesDataset(source, rawData){
    superclass.apply(this, arguments);
  }
  /**
   * @returns {Array<Array>} List of rows, each of which includes all columns.
   */
  prototype.getData = function(){
    return this.data;
  };
  /**
   * @returns {Array<Array>} List of all columns (including date column).
   */
  prototype.getColumns = function(){
    return this.parsedData.getColumns();
  };
  /**
   * @returns {Array<Date>} The date column.
   */
  prototype.getDateColumn = function(){
    return this.parsedData.getDateColumn();
  };
  /**
   * @returns {Array<Array>} List of all columns except the date column.
   */
  prototype.getDataColumns = function(){
    return this.parsedData.getDataColumns();
  };
  /**
   * @returns {Array<String>} List of column labels.
   */
  prototype.getLabels = function(){
    return this.parsedData.getLabels();
  };
  return TimeseriesDataset;
}(Dataset));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/dataset/topo-json-dataset.js', function(require, module, exports, __dirname, __filename, undefined){

var Dataset, TopoJSONDataset;
Dataset = require('./dataset').Dataset;
/**
 * @class
 * @extends Dataset
 */
exports.TopoJSONDataset = TopoJSONDataset = (function(superclass){
  TopoJSONDataset.displayName = 'TopoJSONDataset';
  var prototype = extend$(TopoJSONDataset, superclass).prototype, constructor = TopoJSONDataset;
  TopoJSONDataset.registerType('topojson');
  function TopoJSONDataset(source, rawData){
    superclass.apply(this, arguments);
  }
  /**
   * @returns {Array<Array>} List of rows, each of which includes all columns.
   */
  return TopoJSONDataset;
}(Dataset));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/dataset/umapi-timeseries-dataset.js', function(require, module, exports, __dirname, __filename, undefined){

var Dataset, UMAPITimeseriesDataset;
Dataset = require('./dataset').Dataset;
/**
 * @class Hack to handle User Metrics JSON structure
 * @extends Dataset
 */
exports.UMAPITimeseriesDataset = UMAPITimeseriesDataset = (function(superclass){
  UMAPITimeseriesDataset.displayName = 'UMAPITimeseriesDataset';
  var prototype = extend$(UMAPITimeseriesDataset, superclass).prototype, constructor = UMAPITimeseriesDataset;
  UMAPITimeseriesDataset.registerType('umapi_timeseries');
  function UMAPITimeseriesDataset(){
    superclass.apply(this, arguments);
    this.format = 'json';
  }
  /**
   * @returns {Array<String>} List of column labels.
   */
  prototype.getLabels = function(){
    var labels, ref$, key;
    labels = [];
    if ((ref$ = this.parsedData) != null && ref$.length) {
      for (key in this.parsedData[0]) {
        labels.push(key);
      }
    }
    return labels;
  };
  prototype.parse = function(rawData){
    var normalized, headers, date, newRow, i, index;
    if (typeof rawData === 'string') {
      return rawData;
    }
    console.warn('INFO: UMAPI format, parsing it into standard JSON');
    normalized = [];
    headers = rawData.header.slice(1);
    for (date in rawData.metric) {
      newRow = [];
      newRow[0] = new Date(date);
      for (i in headers) {
        index = parseInt(i);
        newRow[index + 1] = rawData.metric[date][index];
      }
      normalized.push(newRow);
    }
    return normalized;
  };
  return UMAPITimeseriesDataset;
}(Dataset));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/dataset/index.js', function(require, module, exports, __dirname, __filename, undefined){

var dataset, series_dataset, timeseries_dataset, geo_json_dataset, topo_json_dataset, mobile_device_by_geo, umapi_timeseries;
dataset = require('./dataset');
series_dataset = require('./series-dataset');
timeseries_dataset = require('./timeseries-dataset');
geo_json_dataset = require('./geo-json-dataset');
topo_json_dataset = require('./topo-json-dataset');
mobile_device_by_geo = require('./mobile-device-by-geo-dataset');
umapi_timeseries = require('./umapi-timeseries-dataset');
import$(import$(import$(import$(import$(import$(import$(exports, dataset), series_dataset), timeseries_dataset), geo_json_dataset), topo_json_dataset), mobile_device_by_geo), umapi_timeseries);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/data/datasource/datasource-cache.js', function(require, module, exports, __dirname, __filename, undefined){

var _, op, ReadyEmitter, ModelCache, DataSource, ALL_SOURCES, DataSourceCache;
_ = require('underscore');
op = require('operator');
ReadyEmitter = require('emitters').ReadyEmitter;
ModelCache = require('../../base').ModelCache;
DataSource = require('./datasource').DataSource;
ReadyEmitter.decorate(DataSource);
ALL_SOURCES = exports.ALL_SOURCES = {};
DataSourceCache = exports.DataSourceCache = new ModelCache(DataSource, {
  ready: false,
  cache: ALL_SOURCES
});
DataSource.fetchAll = exports.fetchAll = function(){
  var limn, allDataURL;
  limn = require('../../index');
  allDataURL = limn.config.mount('datasources/all');
  return $.getJSON(allDataURL, function(models){
    _.each(models, function(data){
      if (!DataSourceCache.get(data.id)) {
        return DataSourceCache.add(new DataSource(data));
      }
    });
    DataSourceCache.ready(true);
    return DataSource.ready(true);
  });
};
DataSource.getAllSources = exports.getAllSources = function(){
  return _.map(ALL_SOURCES, op.I);
};

});

;
require.define('/node_modules/limn/data/datasource/datasource-view.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, View, ref$, DataSource, ColumnDef, ParsingMixin, ref1$, GraphView, Graph, ref2$, CanvasNodeData, CanvasSeriesNodeData, ViewportNodeData, GraphNodeData, DataSourceView;
_ = require('underscore');
ko = require('knockout');
View = require('../../base/view').View;
ref$ = require('./datasource'), DataSource = ref$.DataSource, ColumnDef = ref$.ColumnDef;
ParsingMixin = require('../../util').ParsingMixin;
ref1$ = require('../../graph'), GraphView = ref1$.GraphView, Graph = ref1$.Graph;
ref2$ = require('../../graph/node'), CanvasNodeData = ref2$.CanvasNodeData, CanvasSeriesNodeData = ref2$.CanvasSeriesNodeData, ViewportNodeData = ref2$.ViewportNodeData, GraphNodeData = ref2$.GraphNodeData;
exports.DataSourceView = DataSourceView = (function(superclass){
  DataSourceView.displayName = 'DataSourceView';
  var prototype = extend$(DataSourceView, superclass).prototype, constructor = DataSourceView;
  prototype.template = 'datasources';
  prototype.defaults = function(){
    return {
      model: null,
      action: null,
      isDisposed: false
    };
  };
  ParsingMixin.mix(DataSourceView);
  /**
   * @constructor
   * @param {DataSource} model DataSource model for this view.
   * @param {string} action the action this view was created to respond to
   */
  function DataSourceView(model, action){
    var this$ = this;
    superclass.call(this);
    this.model = ko.observableArray();
    if (model && model instanceof DataSource) {
      this.model.push(model);
    } else {
      DataSource.fetchAll().done(function(){
        this$.model(_.sortBy(DataSource.getAllSources(), function(d){
          return d.name();
        }));
        return this$.$('.datasourceSearch').typeahead({
          source: this$.model().map(function(it){
            return it.name();
          })
        });
      });
      this.blankDataSource = ko.observable();
      this.showAddForm = ko.computed(function(){
        var ref$, ref1$;
        return (typeof this$.blankDataSource == 'function' ? (ref$ = this$.blankDataSource()) != null ? typeof ref$.url == 'function' ? (ref1$ = ref$.url()) != null ? ref1$.length : void 8 : void 8 : void 8 : void 8) > 0;
      });
      this.hideAddForm = ko.computed(function(){
        return !this$.showAddForm();
      });
    }
    this.action(action);
    this.message = ko.observable();
    this.visualizeDialog = ko.observable();
    this.filter = ko.observable();
    this.filteredModel = ko.computed(function(){
      var ref$, filter;
      if ((ref$ = this$.filter()) != null && ref$.length) {
        filter = this$.filter().toLowerCase();
        return this$.model().filter(function(it){
          var id, name;
          id = it.id().toLowerCase();
          name = it.name().toLowerCase();
          return id.indexOf(filter) >= 0 || name.indexOf(filter) >= 0;
        });
      } else {
        return this$.model();
      }
    });
  }
  prototype.initializeAddForm = function(){
    var saveButton, enableButton, this$ = this;
    this.blankDataSource(new DataSource());
    saveButton = this.$el.find('button.save');
    enableButton = function(){
      return saveButton.attr('disabled', false);
    };
    this.blankDataSource().url.subscribe(function(it){
      if (it === null || it.indexOf('?') === 0) {
        return;
      }
      this$.message("Attempting to analyze that Datafile");
      this$.blankDataSource().determineFormat();
      return saveButton.attr('disabled', true);
    });
    this.blankDataSource().data.subscribe(function(){
      var dataset, e;
      if (this$.blankDataSource().url() === '') {
        return;
      }
      dataset = this$.blankDataSource().data();
      this$.blankDataSource().columns([]);
      try {
        dataset.getLabels().map(function(label, i){
          var id, type, newColumn, capitalizedLabel;
          id = _.str.underscored((label || i + "").toLowerCase());
          type = this$.getTypeNameFromExample(dataset.data[0][i]);
          newColumn = new ColumnDef({
            id: id,
            label: label,
            type: type
          }, this$.blankDataSource());
          if (dataset.type === 'mobile_device_by_geo') {
            if (!label) {
              label = 'unknown';
            }
            switch (label) {
            case 'name':
              capitalizedLabel = 'Name';
              newColumn.type('string');
              break;
            case 'id':
              capitalizedLabel = 'ID';
              newColumn.type('string');
              break;
            default:
              capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
            }
            newColumn.id(label);
            newColumn.label(capitalizedLabel);
          }
          return this$.blankDataSource().columns.push(newColumn);
        });
        return this$.message("Metrics detected, please verify");
      } catch (e$) {
        e = e$;
        return this$.message("Failed to analyze metrics (check file format)");
      }
    });
    return this.blankDataSource().data();
  };
  /**
   * Called by Knockout once the DataSource template has finished rendering.
   */
  prototype.afterRender = function(element){
    if (this.el()) {
      return;
    }
    this.el(element);
    if (this.action() === 'edit') {
      new EditView(this);
    }
    return this.initializeAddForm();
  };
  prototype.addMetric = function(){
    return this.columns.push(new ColumnDef({
      label: '',
      type: ''
    }, this));
  };
  prototype.removeMetricFrom = function(datasource){
    return function(column){
      return datasource.columns.remove(column);
    };
  };
  prototype.newDataSource = function(form){
    var i, ref$, len$, column, ds, options, this$ = this;
    for (i = 0, len$ = (ref$ = this.blankDataSource().columns()).length; i < len$; ++i) {
      column = ref$[i];
      column.index(i);
    }
    ds = _.clone(this.blankDataSource());
    if (ds.slug()) {
      return ds.save(options = {
        url: '/datasources'
      }).done(function(){
        ds.id(ds.slug());
        this$.model.insert(ds, 0);
        this$.initializeAddForm();
        return this$.message("Saved");
      }).fail(function(obj, msg, res){
        return this$.message("Failed to Save: " + res.responseText);
      });
    } else {
      return this.message("Failed to Save: Invalid");
    }
  };
  /**
   * Invoked via Knockout in the context of a datasource
   * Creates a new GraphView and loads all the metrics from the datasource as Line nodes
   */
  prototype.visualizeLineGraph = function(){
    return limn.view.visualize(this, 'line');
  };
  /**
   * Invoked via Knockout in the context of a datasource
   * Creates a new GraphView and loads all the metrics from the datasource as Geo Feature nodes
   */
  prototype.visualizeWorldMap = function(){
    return limn.view.visualize(this, 'geo-feature');
  };
  prototype.visualize = function(datasource, metricType){
    var this$ = this;
    return datasource.fetch().done(function(){
      limn.view.visualizeDialog(new GraphView(this$.buildGraphModel(datasource, metricType)));
      limn.view.$('> .visualizeDialog').modal();
      return limn.view.visualizeDialog().resize();
    });
  };
  prototype.buildGraphModel = function(datasource, metricType){
    var columns, graph;
    columns = _.clone(datasource.columns());
    switch (metricType) {
    case 'line':
      columns = columns.slice(1);
      graph = this.buildLineGraph(datasource, columns, metricType);
      break;
    case 'geo-feature':
      columns = columns.filter(function(it){
        return it.id() !== 'id' && it.id() !== 'name';
      });
      graph = this.buildWorldMapGraph(datasource, columns, metricType);
    }
    return graph;
  };
  prototype.buildWorldMapGraph = function(datasource, columns, metricType){
    var worldMapChildren;
    worldMapChildren = columns.map(function(it){
      return {
        nodeType: 'geo-feature',
        metric: {
          source_id: datasource.id(),
          source_col: it.id()
        },
        options: {
          label: it.label(),
          scale: 'log',
          fill: ['#D4E7ED', '#0A3A4B']
        },
        stroke: {
          width: 3.0,
          color: '#FFFFFF',
          opacity: [0, 1.0]
        }
      };
    });
    worldMapChildren.push({
      nodeType: 'zoom-pan'
    });
    worldMapChildren.push({
      nodeType: 'infobox'
    });
    return {
      name: "All Metrics in " + datasource.name(),
      root: {
        nodeType: 'canvas',
        width: 'auto',
        height: 750,
        children: [{
          nodeType: 'geo-map',
          metric: {
            source_id: 'map-world_countries'
          },
          options: {
            projection: 'mercator',
            backgroundColor: 'white',
            featuresColor: '#EEEEEE'
          },
          children: worldMapChildren
        }]
      }
    };
  };
  prototype.buildLineGraph = function(datasource, columns, metricType){
    return {
      name: "All Metrics in " + datasource.name(),
      root: {
        nodeType: 'canvas',
        y: {
          scaleType: 'linear'
        },
        width: 900,
        height: 350,
        children: [
          {
            nodeType: 'axis',
            options: {
              dimension: 'x',
              orient: 'bottom'
            }
          }, {
            nodeType: 'axis',
            options: {
              dimension: 'y',
              orient: 'left'
            }
          }, {
            nodeType: 'grid',
            options: {
              dimension: 'x'
            }
          }, {
            nodeType: 'grid',
            options: {
              dimension: 'y'
            }
          }, {
            nodeType: 'legend',
            options: {
              dateFormat: 'HH:mm on MMM DD, YYYY'
            }
          }, {
            nodeType: 'zoom-brush'
          }, {
            nodeType: 'tweaks',
            children: [
              {
                nodeType: 'smooth'
              }, {
                nodeType: 'scaling'
              }
            ]
          }, {
            nodeType: metricType + "-group",
            options: {
              palette: 'category10'
            },
            children: columns.map(function(it){
              return {
                nodeType: metricType,
                metric: {
                  source_id: datasource.id(),
                  source_col: it.index(),
                  type: it.type()
                },
                options: {
                  label: it.label()
                }
              };
            })
          }
        ]
      }
    };
  };
  return DataSourceView;
}(View));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/datasource/datasource.js', function(require, module, exports, __dirname, __filename, undefined){

var _, op, ko, ReadyEmitter, ref$, Model, StoredModel, ModelCache, ParsingMixin, Dataset, MetricDef, ColumnDef, DataSource, out$ = typeof exports != 'undefined' && exports || this;
_ = require('underscore');
op = require('operator');
ko = require('knockout');
ReadyEmitter = require('emitters').ReadyEmitter;
ref$ = require('../../base'), Model = ref$.Model, StoredModel = ref$.StoredModel, ModelCache = ref$.ModelCache;
ParsingMixin = require('../../util').ParsingMixin;
Dataset = require('../dataset').Dataset;
MetricDef = require('../metric/metric-def').MetricDef;
/**
 * @class Encapsulates the definition of a column in a DataSource.
 */
out$.ColumnDef = ColumnDef = (function(superclass){
  ColumnDef.displayName = 'ColumnDef';
  var prototype = extend$(ColumnDef, superclass).prototype, constructor = ColumnDef;
  ParsingMixin.mix(ColumnDef);
  function ColumnDef(attributes, source){
    this.source = source;
    superclass.apply(this, arguments);
  }
  prototype.getId = function(){
    return this.get('id');
  };
  prototype.defaults = function(){
    return {
      id: null,
      label: '',
      type: 'int',
      index: -1,
      metricDefs: null
    };
  };
  prototype.attributeTypes = function(){
    return {
      metricDefs: MetricDef.get
    };
  };
  prototype.canonicalize = function(data){
    var defs;
    data == null && (data = {});
    defs = data.metricDefs || (data.metricDefs = []);
    if (!_.isArray(defs)) {
      data.metricDefs = [defs];
    }
    return data;
  };
  prototype.toJSON = function(){
    var attrs;
    attrs = this.toJS(_.omit(this.attributes, 'metricDefs'));
    attrs.metricDefs = _.map(this.attributes.metricDefs.peek(), function(it){
      if (it) {
        return it.id.peek();
      } else {
        return '';
      }
    });
    return attrs;
  };
  /**
   * Convert the string representation of a value from this Column to
   * its real type.
   * 
   * @param {String} value A serialized value.
   * @returns {*} The value parsed into the appropriate type.
   */
  prototype.parse = function(value){
    return this.parseValue(value, this.get('type'));
  };
  return ColumnDef;
}(Model));
/**
 * @class Metadata representing a source of data, such as a CSV file or
 * a web service endpoint.
 */
out$.DataSource = DataSource = (function(superclass){
  DataSource.displayName = 'DataSource';
  var prototype = extend$(DataSource, superclass).prototype, constructor = DataSource;
  function DataSource(){
    superclass.apply(this, arguments);
  }
  prototype.resource = 'datasources';
  prototype.getId = function(){
    return this.get('id');
  };
  prototype.formatContentTypes = {
    csv: 'text',
    tsv: 'text',
    json: 'json',
    jsonp: 'jsonp',
    xml: 'xml'
  };
  prototype.defaults = function(){
    return {
      id: null,
      slug: null,
      format: 'json',
      type: 'timeseries',
      url: '',
      name: '',
      shortName: '',
      desc: '',
      notes: '',
      columns: [],
      timespan: {
        start: null,
        end: null,
        step: null
      }
    };
  };
  prototype.attributeTypes = function(){
    return {
      columns: function(it){
        if (it instanceof ColumnDef) {
          return it;
        }
        return new ColumnDef(it, this);
      }
    };
  };
  /**
   * Whether this DataSource is valid, and thus ready to load data.
   * @type ko.computed<Boolean>
   */
  prototype.isValid = DataSource.computed(function(){
    return !!this.dataUrl() && this.get('format') in this.formatContentTypes;
  });
  /**
   * Generates a random number of length around 10
   */
  prototype.generateRandom = function(){
    return 999999999 + Math.floor(Math.random() * 999999999);
  };
  /**
   * URL for the data.
   * @type ko.computed<String>
   */
  prototype.dataUrl = DataSource.computedRequires('url', function(url){
    var cacheBuster;
    if (!url) {
      return url;
    }
    if (url.indexOf('http') == 0) {
      url = "/x/" + url;
    } else {
      cacheBuster = this.generateRandom();
      url = url + "?" + cacheBuster;
    }
    if (url[0] === '/') {
      return url = require('limn').config.mount(url);
    }
  });
  /**
   * Encoding of the dataset response.
   * @type ko.computed<String>
   */
  prototype.dataFormat = DataSource.computed(function(){
    var format;
    format = this.format();
    if (!format) {
      if (!this.url()) {
        return this.defaults.format;
      }
      this.determineFormat();
    }
    return format;
  });
  prototype.determineFormat = function(){
    var url;
    url = this.url();
    if (_.endsWith(url, '.csv')) {
      return this.format('csv');
    } else if (_.endsWith(url, '.json')) {
      return this.format('json');
    } else if (_.endsWith(url, '.tsv')) {
      return this.format('tsv');
    } else if (_.endsWith(url, '.xml')) {
      return this.format('xml');
    } else {
      throw new Error("Unknown DataSource format for '" + url + "'!");
    }
  };
  /**
   * Dataset class wrapping the data.
   * @type ko.computed<Class<Dataset>>
   */
  prototype.datasetType = DataSource.computedRequires('type', function(type){
    return Dataset.lookupType(type);
  });
  /**
   * The content-type of the datafile, as sent by the server; null before load.
   * @type ko.observable<String>
   */
  prototype.dataContentType = ko.observable(null);
  /**
   * The reified dataset associated with this DataSource.
   * @type ko.asyncComputed<TimeSeriesData|CSVData>
   * @depends url, format
   */
  prototype.data = DataSource.asyncComputed(function(){
    var format, DatasetType, xhr, promise, this$ = this;
    if (!this.isValid()) {
      return;
    }
    if (!(format = this.dataFormat())) {
      return;
    }
    if (!(DatasetType = this.datasetType())) {
      return;
    }
    xhr = $.ajax({
      url: this.dataUrl(),
      dataType: this.formatContentTypes[format]
    });
    promise = xhr.pipe(function(data){
      return new DatasetType(this$, data);
    });
    promise.then(function(data){
      this$.dataContentType(xhr.getResponseHeader('Content-Type'));
      return this$.trigger('data-load', this$, data);
    }, function(err){
      this$.dataContentType(null);
      return this$.trigger('data-error', this$);
    });
    promise.xhr = xhr;
    return promise;
  });
  /**
   * Enforces backwards compatibility at runtime by converting a DataSource from
   * one of many of the historical "formats" we've used to whatever the modern
   * format looks like.
   * 
   * @param {Object} data Raw DataSource attributes to canonicalize.
   * @returns {Object} Converted raw data.
   */
  prototype.canonicalize = function(data){
    var cols;
    data.slug || (data.slug = data.id);
    data.shortName || (data.shortName = data.name);
    cols = data.columns;
    if (_.isArray(cols)) {
      data.columns = _.map(cols, function(col, idx){
        var label, type, id;
        if (_.isArray(col)) {
          label = col[0], type = col[1];
          id = _.str.underscored(label.toLowerCase());
          return {
            id: id,
            index: idx,
            label: label,
            type: type || 'int'
          };
        } else {
          col.type || (col.type = 'int');
          col.index || (col.index = idx);
          return col;
        }
      });
    } else {
      cols = _.merge({
        ids: [],
        types: []
      }, cols);
      data.columns = _.map(cols.labels, function(label, idx){
        var id, type;
        label = String(label);
        id = cols.ids[idx] || _.str.underscored(label.toLowerCase());
        type = cols.types[idx] || 'int';
        return {
          id: id,
          index: idx,
          label: label,
          type: type
        };
      });
    }
    return data;
  };
  /**
   * Looks up a column definition.
   * 
   * @param {Number|String} id Identifier of the column, by index or id.
   * @returns {ColumnDef}
   */
  prototype.getColumnDef = function(id){
    var ref$;
    if (typeof id === 'number') {
      return (ref$ = this.columns()) != null ? ref$[id] : void 8;
    } else {
      return _.find(this.columns(), function(it){
        return it.id.peek() === id;
      });
    }
  };
  return DataSource;
}(StoredModel));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/datasource/index.js', function(require, module, exports, __dirname, __filename, undefined){

var datasource, datasource_cache, datasource_view;
import$(exports, datasource = require('./datasource'));
import$(exports, datasource_cache = require('./datasource-cache'));
import$(exports, datasource_view = require('./datasource-view'));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/data/metric/geo-feature-metric.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ref$, _, Query, ParsingMixin, DataSource, Metric, GeoFeatureMetric;
ko = require('knockout');
ref$ = require('../../util'), _ = ref$._, Query = ref$.Query, ParsingMixin = ref$.ParsingMixin;
DataSource = require('../datasource').DataSource;
Metric = require('./metric').Metric;
/**
 * @class 
 */
exports.GeoFeatureMetric = GeoFeatureMetric = (function(superclass){
  GeoFeatureMetric.displayName = 'GeoFeatureMetric';
  var prototype = extend$(GeoFeatureMetric, superclass).prototype, constructor = GeoFeatureMetric;
  function GeoFeatureMetric(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      xColumn: 'id'
    };
  };
  /**
   * Reindexes the tabular data by row ID.
   */
  prototype.dataById = GeoFeatureMetric.computed(function(){
    var data;
    if ((data = this.data()) == null) {
      return;
    }
    return _.generate(data);
  });
  return GeoFeatureMetric;
}(Metric));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/metric/geo-map-metric.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, DataSource, Metric, GeoMapMetric;
_ = require('underscore');
ko = require('knockout');
DataSource = require('../datasource').DataSource;
Metric = require('./metric').Metric;
/**
 * @class 
 */
exports.GeoMapMetric = GeoMapMetric = (function(superclass){
  GeoMapMetric.displayName = 'GeoMapMetric';
  var prototype = extend$(GeoMapMetric, superclass).prototype, constructor = GeoMapMetric;
  function GeoMapMetric(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      source_id: null
    };
  };
  /**
   * The GeoJSON dataset associated with this Metric.
   * @type ko.computed<Object>
   * @depends source
   */
  prototype.data = GeoMapMetric.computed(function(){
    var geojson, ref$;
    if (!(geojson = (ref$ = this.source()) != null ? ref$.data() : void 8)) {
      return;
    }
    return geojson.getData();
  });
  return GeoMapMetric;
}(Metric));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/metric/metric-def.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ref$, Model, ModelCache, MetricDef, out$ = typeof exports != 'undefined' && exports || this;
_ = require('underscore');
ref$ = require('../../base'), Model = ref$.Model, ModelCache = ref$.ModelCache;
/**
 * @class Explains the definition/derivation/calculation of a metric used across graphs.
 * @extends Model
 */
out$.MetricDef = MetricDef = (function(superclass){
  MetricDef.displayName = 'MetricDef';
  var METRIC_DEF_CACHE, prototype = extend$(MetricDef, superclass).prototype, constructor = MetricDef;
  prototype.getId = function(){
    return this.get('id');
  };
  prototype.defaults = function(){
    return {
      id: null,
      name: null,
      desc: null,
      url: null
    };
  };
  function MetricDef(){
    superclass.apply(this, arguments);
    METRIC_DEF_CACHE.add(this);
  }
  prototype.cssClass = MetricDef.computed(function(){
    return "graph-metric-def-" + this.id();
  });
  MetricDef.__cache__ = METRIC_DEF_CACHE = new ModelCache(MetricDef);
  return MetricDef;
}(Model));
[
  {
    id: 'edit',
    name: 'Edit',
    desc: 'Updates to [countable pages](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Countable_pages) in [countable namespaces](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Content_namespaces) (aka, the "mainspace", namespace 0).  Monthly totals are not normalized to 30 day months.',
    url: 'https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Edits'
  }, {
    id: 'active_editor',
    name: 'Active Editor',
    desc: 'A registered and logged-in person (not known as a [bot](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Bot)) who makes 5 or more edits in any month in [mainspace](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Content_namespaces) on [countable pages](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Countable_pages).  Monthly totals are not normalized to 30 day months.',
    url: 'https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Active_editor'
  }, {
    id: 'very_active_editor',
    name: 'Very Active Editor',
    desc: 'A registered and logged-in person (not known as a [bot](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Bot)) who makes 100 or more edits per month in [mainspace](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Content_namespaces) on [countable pages](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Countable_pages).  Monthly totals are not normalized to 30 day months.',
    url: 'https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Very_active_editor'
  }, {
    id: 'new_editor',
    name: 'New Editor',
    desc: 'A registered and logged-in person (not known as a [bot](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Bot)) who has made their 10th edit during the time-period under consideration. Number of edits is a cumulative count across all of time on one wiki.  Monthly totals are not normalized to 30 day months.',
    url: 'https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Contributor'
  }, {
    id: 'upload',
    name: 'Upload',
    desc: 'File uploads create a new page in namespace 6; the first revision for this page describes the original upload. For Commons uploader activity is based on this first revision per namespace 6 page only. The metric *Uploads via [Upload Wizard](https://commons.wikimedia.org/wiki/Commons:Upload_Wizard)* for Commons can only be collected from full archive dumps (from the category tag in page content).',
    url: 'https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Uploads'
  }, {
    id: 'article',
    name: 'Article',
    desc: 'Wiki pages which contain an [internal link](https://www.mediawiki.org/wiki/Help:Links) (aka wikilink) or category link, and are not a [redirect](https://www.mediawiki.org/wiki/Help:Redirects) page. This conforms to the traditional definition of an "article" within the Wikimedia community -- different Wikimedia projects can have different [definitions of what constitutes an article](https://www.mediawiki.org/wiki/Manual:Article_count).  Monthly totals are not normalized to 30 day months.',
    url: 'https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Countable_pages'
  }, {
    id: 'pageview',
    name: 'Pageview',
    desc: 'A subset of requests such that:\n\n- The url in a logline contains `/wiki/`. This excludes `/w/index.php?` and `SpecialPages`.\n- Not all public Wikimedia projects are counted (e.g. foundation wiki).\n- Any article namespace qualifies (unlike the [dump-based reports](https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Content)).\n- Counts for all months are normalized to 30 days (Jan\\*30/31, Feb\\*30/28, Mar\\*30/31, etc).  This mainly shows from January to February and February to March.\n\nPageviews reported by Wikistats are derived via webstatscollector from incoming squid logs.',
    url: 'https://www.mediawiki.org/wiki/Analytics/Metric_definitions#Page_views'
  }, {
    id: 'unique_visitor_comscore',
    name: 'Unique Visitor',
    desc: 'The number of [unique visitors](http://en.wikipedia.org/wiki/Unique_visitor) to any page in any wiki under the Wikimedia family, as measured by comScore.  These monthly totals are not normalized to 30 day months.',
    url: 'http://en.wikipedia.org/wiki/Comscore#Data_collection_and_reporting'
  }
].forEach(function(it){
  return new MetricDef(it);
});
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/metric/metric.js', function(require, module, exports, __dirname, __filename, undefined){

var _, Model, ref$, ParsingMixin, Query, DataSource, Metric;
_ = require('underscore');
Model = require('../../base').Model;
ref$ = require('../../util'), ParsingMixin = ref$.ParsingMixin, Query = ref$.Query;
DataSource = require('../datasource').DataSource;
/**
 * @class Specifies the coordinates for a column of data in a DataSource,
 * and provides accessors to materialize that data within its bounds.
 */
exports.Metric = Metric = (function(superclass){
  Metric.displayName = 'Metric';
  var prototype = extend$(Metric, superclass).prototype, constructor = Metric;
  ParsingMixin.mix(Metric);
  function Metric(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      source_id: null,
      source_col: null,
      xColumn: 0
    };
  };
  prototype.canonicalize = function(data){
    data.source_id == null && (data.source_id = data.sourceId);
    data.source_col == null && (data.source_col = data.sourceCol);
    data.source_col == null && (data.source_col = data.yColumn);
    return data;
  };
  /**
   * Array of data-transformation functions.
   * @type ko.observableArray<Function>
   */
  prototype.transforms = ko.observableArray([]);
  /**
   * Data source of the Metric.
   * @type ko.computed<DataSource>
   * @depends source_id
   */
  prototype.source = Metric.asyncComputed(function(){
    var id;
    if (id = this.get('source_id')) {
      return DataSource.lookup(id);
    }
  });
  /**
   * Query object for the parameters of this Metric.
   * @type ko.computed<Query>
   * @depends source_col
   */
  prototype.query = Metric.computed(function(){
    var source_col, xColumn;
    source_col = this.get('source_col');
    xColumn = this.get('xColumn');
    if (!(source_col != null && xColumn != null)) {
      return;
    }
    return Query().columns(xColumn, source_col);
  });
  /**
   * The reified dataset (as (date, value) pairs) associated with this Metric.
   * @protected
   * @type ko.computed<{rows, columns}>
   * @depends source, query, transforms
   */
  prototype.materialized = Metric.computed(function(){
    var source, source_col, query, csv, ref$, rows, columns;
    source = this.source();
    source_col = this.get('source_col');
    if (!(source && source_col != null)) {
      return;
    }
    if (!(query = this.query())) {
      return;
    }
    if (!(csv = source.data())) {
      return;
    }
    ref$ = query.materialize('both').transforms(this.transforms()).process(csv.getData()), rows = ref$.rows, columns = ref$.columns;
    return {
      rows: rows,
      columns: columns
    };
  });
  /**
   * The reified dataset (as [x, y] pairs) associated with this Metric.
   * @type ko.computed<[xType, yType]>
   * @depends materialized
   */
  prototype.data = Metric.computed(function(){
    var ref$;
    return (ref$ = this.materialized()) != null ? ref$.rows : void 8;
  });
  /**
   * The reified dataset X-values associated with this Metric.
   * @type ko.computed<Array<xType>>
   * @depends materialized
   */
  prototype.xValues = Metric.computed(function(){
    var ref$;
    return (ref$ = this.materialized()) != null ? ref$.columns[0] : void 8;
  });
  /**
   * The reified dataset Y-values associated with this Metric.
   * @type ko.computed<Array<yType>>
   * @depends materialized
   */
  prototype.yValues = Metric.computed(function(){
    var ref$;
    return (ref$ = this.materialized()) != null ? ref$.columns[1] : void 8;
  });
  /**
   * The column definition for the X-dimension of this Metric.
   * @type ko.computed<ColumnDef>
   * @depends source, xColumn
   */
  prototype.xColumnDef = Metric.computed(function(){
    var source, xColumn;
    source = this.source();
    xColumn = this.get('xColumn');
    if (!(source && xColumn != null)) {
      return;
    }
    return source.getColumnDef(xColumn);
  });
  /**
   * The column definition for the Y-dimension of this Metric.
   * @type ko.computed<ColumnDef>
   * @depends source, source_col
   */
  prototype.yColumnDef = Metric.computed(function(){
    var source, source_col;
    source = this.source();
    source_col = this.get('source_col');
    if (!(source && source_col != null)) {
      return;
    }
    return source.getColumnDef(source_col);
  });
  /**
   * Type of the X-values.
   * @type ko.computed<String>
   * @depends xColumnDef
   */
  prototype.xType = Metric.computed(function(){
    var ref$;
    return (ref$ = this.xColumnDef()) != null ? ref$.type() : void 8;
  });
  /**
   * Type of the Y-values.
   * @type ko.computed<String>
   * @depends xColumnDef
   */
  prototype.yType = Metric.computed(function(){
    var ref$;
    return (ref$ = this.yColumnDef()) != null ? ref$.type() : void 8;
  });
  /**
   * A short label of just the column name
   * @type ko.computed<String>
   * @depends yColumnDef
   */
  prototype.defaultLabel = Metric.computedRequires('yColumnDef', function(col){
    return col.label();
  });
  /**
   * A long label including the datasource name
   * @type ko.computed<String>
   * @depends defaultLabel
   */
  prototype.defaultLongLabel = Metric.computedRequires('defaultLabel', function(defaultLabel){
    return this.source().name() + ", " + defaultLabel;
  });
  prototype.toString = function(){
    var id, col;
    id = this.source_id.peek();
    col = this.source_col.peek();
    return this.getClassName() + "(source_id=" + id + ", source_col=" + col + ")";
  };
  return Metric;
}(Model));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/metric/timeseries-metric.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, Query, DataSource, Metric, TimeseriesMetric;
_ = require('underscore');
ko = require('knockout');
Query = require('../../util').Query;
DataSource = require('../datasource').DataSource;
Metric = require('./metric').Metric;
exports.TimeseriesMetric = TimeseriesMetric = (function(superclass){
  TimeseriesMetric.displayName = 'TimeseriesMetric';
  var prototype = extend$(TimeseriesMetric, superclass).prototype, constructor = TimeseriesMetric;
  function TimeseriesMetric(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      source_id: null,
      source_col: null,
      timespan: {
        start: null,
        end: null,
        step: null
      }
    };
  };
  /**
   * Query object for the parameters of this Metric.
   * @type ko.computed<Query>
   * @depends source_col, timespan
   */
  prototype.query = TimeseriesMetric.computed(function(){
    var source_col, timespan;
    source_col = this.get('source_col');
    timespan = this.get('timespan');
    if (!(source_col != null && timespan)) {
      return;
    }
    return Query().step(timespan.step()).timespan(timespan.start(), timespan.end()).columns(0, source_col);
  });
  /**
   * The reified dates for the dataset associated with this Metric.
   * @type ko.computed<Array<Date>>
   * @depends materialized
   */
  prototype.dates = TimeseriesMetric.computed(function(){
    var ref$;
    return (ref$ = this.materialized()) != null ? ref$.columns[0] : void 8;
  });
  /**
   * The reified dataset values associated with this Metric.
   * @type ko.computed<Array<Value>>
   * @depends materialized
   */
  prototype.values = TimeseriesMetric.computed(function(){
    var ref$;
    return (ref$ = this.materialized()) != null ? ref$.columns[1] : void 8;
  });
  /**
   * Find the entry with a date closest to the date specified
   * @param {Date} closestTo
   * @returns {numeric} the closest entry
   */
  prototype.findClosest = function(closestTo){
    var closest, closestDateDifference, i$, ref$, len$, ref1$, date, value, dateDifference;
    closest = null;
    closestDateDifference = 9007199254740992;
    for (i$ = 0, len$ = (ref$ = this.data()).length; i$ < len$; ++i$) {
      ref1$ = ref$[i$], date = ref1$[0], value = ref1$[1];
      dateDifference = Math.abs(closestTo.getTime() - date.getTime());
      if (dateDifference < closestDateDifference) {
        closestDateDifference = dateDifference;
        closest = {
          date: date,
          value: value || NaN
        };
      }
    }
    return closest;
  };
  return TimeseriesMetric;
}(Metric));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/data/metric/index.js', function(require, module, exports, __dirname, __filename, undefined){

var metric, metric_def, geo_feature_metric, geo_map_metric, timeseries_metric;
import$(exports, metric = require('./metric'));
import$(exports, metric_def = require('./metric-def'));
import$(exports, geo_feature_metric = require('./geo-feature-metric'));
import$(exports, geo_map_metric = require('./geo-map-metric'));
import$(exports, timeseries_metric = require('./timeseries-metric'));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/edit/edit-view.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, EditView;
ko = require('knockout');
exports.EditView = EditView = (function(){
  /**
   * @constructor
   * @param {View} view The view this object is watching and editing
   */
  EditView.displayName = 'EditView';
  var prototype = EditView.prototype, constructor = EditView;
  function EditView(view){
    this.view = view;
    $(this.view.el()).addClass('edit');
    this.editable = "edit-" + this.__id__;
    this.isEditable = "." + this.editable;
    this.editing = "editing";
    this.isEditing = "." + this.editing;
    this.makeEditable();
    this.registerEvents();
  }
  /**
   * Declares what elements this editor will be watching for by adding a class unique among editors
   * TODO: figure out how to not apply this class to subviews
   */
  prototype.makeEditable = function(){
    $('.editable', this.view.el()).addClass(this.editable);
    $('.hide-during-edit').hide();
    return $('.show-during-edit').show();
  };
  /**
   * registers events in the scope of the view this is editing
   */
  prototype.registerEvents = function(){
    var scope, self;
    scope = this.view.el();
    self = this;
    $(scope).on('click', this.isEditable, function(event){
      var el;
      event.preventDefault();
      event.stopPropagation();
      el = this;
      if (!$(el).next().is(self.isEditing)) {
        $(el).after($($(el).data('editor')).addClass(self.editing));
        ko.applyBindings(ko.dataFor(el), $(el).next()[0]);
      }
      $(el).hide();
      return $(el).next().show().focus();
    });
    return $(scope).on('blur', this.isEditing, function(event){
      var el, display;
      event.stopPropagation();
      el = this;
      display = $(el).prev();
      $(el).hide();
      return display.show();
    });
  };
  prototype.save = function(){
    return console.log('saving', this);
  };
  return EditView;
}());

});

;
require.define('/node_modules/limn/edit/index.js', function(require, module, exports, __dirname, __filename, undefined){

var edit_view;
edit_view = require('./edit-view');
import$(exports, edit_view);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/graph-create-view.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, View, Graph, GraphView, ref$, DataSource, ColumnDef, GraphCreateView;
_ = require('underscore');
ko = require('knockout');
View = require('../base/view').View;
Graph = require('./graph-model').Graph;
GraphView = require('./graph-view').GraphView;
ref$ = require('../data/datasource'), DataSource = ref$.DataSource, ColumnDef = ref$.ColumnDef;
exports.GraphCreateView = GraphCreateView = (function(superclass){
  GraphCreateView.displayName = 'GraphCreateView';
  var prototype = extend$(GraphCreateView, superclass).prototype, constructor = GraphCreateView;
  prototype.template = 'graph-create';
  /**
   * @constructor
   */;
  function GraphCreateView(){
    var this$ = this;
    superclass.call(this);
    this.blankGraph = ko.observable();
    this.metrics = ko.observableArray();
    this.previewDialog = ko.observable();
    this.recentGraphs = ko.observableArray();
    this.datasources = ko.observableArray();
    this.filter = ko.observable();
    this.datasourceType = ko.observable('timeseries');
    this.filteredDatasources = ko.computed(function(){
      var filter, typeFilter;
      filter = (this$.filter() || '').toLowerCase();
      typeFilter = this$.datasourceType().toLowerCase();
      return this$.datasources().filter(function(it){
        var id, name, type;
        id = it.id().toLowerCase();
        name = it.name().toLowerCase();
        type = it.type().toLowerCase();
        return type === typeFilter && (!filter.length || id.indexOf(filter) >= 0 || name.indexOf(filter) >= 0);
      });
    });
  }
  prototype.newGraph = function(){
    return console.log('submitted');
  };
  prototype.afterRender = function(element){
    var this$ = this;
    if (this.el()) {
      return;
    }
    this.el(element);
    this.initializeAddForm();
    return DataSource.fetchAll().done(function(){
      this$.datasources(_.sortBy(DataSource.getAllSources(), function(d){
        return d.name();
      }));
      return this$.$('.datasourceSearch').typeahead({
        source: this$.datasources().map(function(it){
          return it.name();
        })
      });
    });
  };
  prototype.initializeAddForm = function(){
    var blankGraph;
    blankGraph = new Graph({
      root: {
        nodeType: 'canvas',
        y: {
          scaleType: 'linear'
        },
        width: 900,
        height: 350,
        children: [
          {
            nodeType: 'axis',
            options: {
              dimension: 'x',
              orient: 'bottom'
            }
          }, {
            nodeType: 'axis',
            options: {
              dimension: 'y',
              orient: 'left'
            }
          }, {
            nodeType: 'grid',
            options: {
              dimension: 'x'
            }
          }, {
            nodeType: 'grid',
            options: {
              dimension: 'y'
            }
          }, {
            nodeType: 'legend',
            options: {
              dateFormat: 'MMM DD, YYYY'
            }
          }, {
            nodeType: 'zoom-brush'
          }, {
            nodeType: "line-group",
            options: {
              palette: 'category10'
            },
            children: []
          }
        ]
      }
    });
    if (this.blankGraph()) {
      blankGraph.name(this.blankGraph().name());
      blankGraph.slug(this.blankGraph().slug());
      blankGraph.desc(this.blankGraph().desc());
      blankGraph.notes(this.blankGraph().notes());
    }
    return this.blankGraph(blankGraph);
  };
  prototype.refreshMetrics = function(){
    var lineNodes, lineGroup;
    lineNodes = this.metrics().map(function(it){
      return {
        nodeType: 'line',
        metric: {
          sourceId: it.source.id(),
          yColumn: it.id() || it.index(),
          type: it.type()
        }
      };
    });
    lineGroup = _.find(this.blankGraph().root().children(), function(it){
      return it.nodeType === 'line-group';
    });
    return lineGroup.children(lineNodes);
  };
  prototype.addDatasource = function(datasource){
    var this$ = this;
    return function(){
      var metrics, i$, ref$, len$, column;
      metrics = this$.metrics.peek();
      for (i$ = 0, len$ = (ref$ = datasource.columns()).length; i$ < len$; ++i$) {
        column = ref$[i$];
        if (column.type() !== 'date') {
          metrics.push(column);
        }
      }
      this$.metrics(_.sortBy(metrics, function(c){
        return c.source.name();
      }));
      return this$.refreshMetrics();
    };
  };
  prototype.removeMetric = function(metric){
    var this$ = this;
    return function(){
      this$.metrics.remove(metric);
      return this$.refreshMetrics();
    };
  };
  prototype.keepOnlyThisMetric = function(metric){
    var this$ = this;
    return function(){
      var metrics;
      metrics = _.filter(this$.metrics.peek(), function(m){
        return m.source.id() != metric.source.id() || m === metric;
      });
      this$.metrics(metrics);
      return this$.refreshMetrics();
    };
  };
  prototype.preview = function(){
    limn.view.previewDialog(new GraphView(this));
    limn.view.$('> .previewDialog').modal();
    return limn.view.previewDialog().resize();
  };
  prototype.cleanUpPreview = function(){
    this.initializeAddForm();
    return this.refreshMetrics();
  };
  prototype.newGraph = function(){
    var this$ = this;
    return this.blankGraph().save().done(function(){
      this$.blankGraph().id(this$.blankGraph().slug());
      limn.message.info("Saved Successfully with id " + this$.blankGraph().id());
      this$.recentGraphs.push(this$.blankGraph());
      return this$.cleanUpPreview();
    }).fail(function(data, message, response){
      switch (response.status) {
      case 403:
        return limn.message.error("Not Saved.  Please sign in (top right of this page)");
      case 409:
        return limn.message.error("Not Saved.  Graph '" + this.slug() + "' already exists");
      default:
        return limn.message.error('Not Saved.  There was a problem');
      }
    });
  };
  prototype.deleteGraph = function(graph, event){
    return graph.destroy().done(function(){
      limn.message.info("Deleted Graph " + graph.id());
      return ko.contextFor(event.target).$parents[1].recentGraphs.remove(graph);
    }).fail(function(){
      return limn.message.error('Not Deleted.  There was a problem');
    });
  };
  return GraphCreateView;
}(View));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/graph-display-view.js', function(require, module, exports, __dirname, __filename, undefined){



});

;
require.define('/node_modules/limn/graph/graph-edit-view.js', function(require, module, exports, __dirname, __filename, undefined){



});

;
require.define('/node_modules/limn/graph/graph-model.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, StoredModel, GraphJSONConverter, GraphNodeData, Graph;
_ = require('underscore');
ko = require('knockout');
StoredModel = require('../base').StoredModel;
GraphJSONConverter = require('../data/graph-json-converter').GraphJSONConverter;
GraphNodeData = require('./node/graph-node-data').GraphNodeData;
exports.Graph = Graph = (function(superclass){
  Graph.displayName = 'Graph';
  var prototype = extend$(Graph, superclass).prototype, constructor = Graph;
  prototype.resource = 'graphs';
  function Graph(){
    superclass.apply(this, arguments);
  }
  prototype.getId = function(){
    return this.get('id');
  };
  prototype.defaults = function(){
    return {
      graph_version: '0.6.0',
      id: null,
      slug: '',
      name: '',
      shortName: '',
      desc: '',
      notes: '',
      tags: [],
      root: {
        nodeType: 'canvas',
        width: 750,
        height: 500
      }
    };
  };
  prototype.attributeTypes = function(){
    return {
      root: GraphNodeData.create
    };
  };
  /**
   * Inform sub-objects its safe to begin their watchers.
   */
  prototype.watching = Graph.computed(function(){
    this.isWatching = true;
    return this.root().watching();
  });
  /**
   * Invoked to transform raw attribute data into its "proper" form for
   * this object, whatever that might be.
   * 
   * @param {Object} data Raw attributes to canonicalize.
   * @returns {Object} Converted raw data.
   */
  prototype.canonicalize = function(data){
    var converter;
    converter = new GraphJSONConverter(data);
    return converter.canonicalize();
  };
  /**
   * All metrics in the Graph.
   * @type ko.computed<Array<Metric>>
   */
  prototype.metrics = Graph.computed(function(){
    return _.compact(this.root().invoke('metric'));
  });
  return Graph;
}(StoredModel));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/graph-view.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, limn, View, OrderedMap, Graph, TableView, GraphNode, EditView, Trait, GraphView, GraphChartOnlyView, out$ = typeof exports != 'undefined' && exports || this;
_ = require('underscore');
ko = require('knockout');
limn = require('../');
View = require('../base/view').View;
OrderedMap = require('../util').OrderedMap;
Graph = require('./graph-model').Graph;
TableView = require('./table-view').TableView;
GraphNode = require('./node/graph-node').GraphNode;
EditView = require('../edit/edit-view').EditView;
Trait = require('./node/graph-node-trait');
out$.GraphView = GraphView = (function(superclass){
  GraphView.displayName = 'GraphView';
  var prototype = extend$(GraphView, superclass).prototype, constructor = GraphView;
  prototype.template = 'graph';
  prototype.defaults = function(){
    return {
      model: null,
      action: null,
      isDisposed: false
    };
  };
  /**
   * @constructor
   * @param {Graph} model Graph model for this view.
   * @param {string} action the action this view was created to respond to
   */;
  function GraphView(model, action){
    this.nodeCache = new OrderedMap();
    superclass.call(this);
    this.graphId = 'graph-' + this.__id__;
    if (model instanceof Graph) {
      model.fetch();
    } else if (typeof model === 'string') {
      model = Graph.load({
        id: model
      });
    } else {
      model = new Graph(model);
    }
    this.action(action);
    this.model(model);
    this.tabularizeDialog = ko.observable();
    this.watching();
  }
  /**
   * The `GraphNode` cache.
   * @protected
   * @type OrderedMap<GraphNodeData, GraphNode>
   */
  prototype.nodeCache = null;
  /**
   * root to the tree of GraphNode(s)
   * @type GraphNode
   */
  prototype.rootNode = GraphView.eagerComputed(function(){
    var graph;
    if (!(graph = this.model())) {
      return null;
    }
    return this.lookupNode(graph.root());
  });
  /**
   * DOM Element for this view. jQuery objects and d3 Selections
   * will be automatically stripped of their wrappers.
   * @type ko.observable<Element>
   */
  prototype.el = GraphView.eagerCoerciveObservable(function(el){
    this.$el = null;
    if (el instanceof jQuery) {
      el = el[0];
    }
    if (el instanceof d3.selection) {
      el = el.node();
    }
    if (!_.isElement(el)) {
      return el;
    }
    this.$el = $(el);
    return el;
  });
  /**
   * jQuery-wrapped root element.
   * @type jQuery
   */
  prototype.$el = null;
  /**
   * 
   */
  prototype.watchDOM = GraphView.computed(function(){
    var root, el, rootParentEl;
    root = this.rootNode();
    el = this.el();
    if (!((limn != null && limn.domReady()) && root && el)) {
      return null;
    }
    if (!(rootParentEl = this.$('.graph-chart-row > .inner')[0])) {
      return null;
    }
    root.build(rootParentEl);
    return rootParentEl;
  });
  /**
   * Inform sub-objects its safe to begin their watchers.
   */
  prototype.watchOthers = function(){
    var rootNode, rootBuilt;
    rootNode = this.rootNode().watching();
    rootBuilt = this.watchDOM();
    return [rootNode, rootBuilt];
  };
  /**
   * Looks up a `GraphNode` by an instance of `GraphNodeData`. On cache-miss,
   * creates a new GraphNode for the data and registers it with the cache.
   * 
   * @protected
   * @param {GraphNodeData} nodeData
   * @returns {GraphNode} The node corresponding to this data.
   */
  prototype.lookupNode = function(nodeData){
    var that, node, destroySub, this$ = this;
    if (nodeData == null) {
      return null;
    }
    if (nodeData instanceof GraphNode) {
      return nodeData;
    }
    if (that = this.nodeCache.get(nodeData)) {
      return that;
    }
    node = GraphNode.fromNodeData(this, nodeData);
    this.nodeCache.set(nodeData, node);
    destroySub = node.isDisposed.subscribe(function(isDisposed){
      var currentNode;
      if (!isDisposed) {
        throw new Error("WTF! node.isDisposed false for " + node + "!");
      }
      currentNode = this$.nodeCache.get(nodeData);
      if (currentNode === node) {
        this$.nodeCache.remove(nodeData);
      }
      return destroySub.dispose();
    });
    if (this.isWatching) {
      node.watching();
    }
    return node;
  };
  prototype.resize = function(){
    var ref$, ref1$;
    return (ref$ = this.rootNode) != null ? (ref1$ = ref$.peek()) != null ? ref1$.resize() : void 8 : void 8;
  };
  /**
   * Called by Knockout once the Graph template has finished rendering.
   */
  prototype.afterRender = function(element){
    superclass.prototype.afterRender.apply(this, arguments);
    if (this.action() === 'edit') {
      return new EditView(this);
    }
  };
  prototype.metricDefs = GraphView.computed(function(){
    var defs, ref$;
    defs = (ref$ = this.rootNode()) != null ? ref$.walk([], function(defs, node){
      var metric, ref$, yDefs, ref1$, xDefs, ref2$;
      if (node.hasTrait(Trait.METRIC_CONTENT_DATA) && (metric = (ref$ = node.model()) != null ? ref$.metric() : void 8)) {
        if (yDefs = (ref1$ = metric.yColumnDef()) != null ? ref1$.metricDefs() : void 8) {
          defs.push.apply(defs, yDefs);
        }
        if (xDefs = (ref2$ = metric.xColumnDef()) != null ? ref2$.metricDefs() : void 8) {
          defs.push.apply(defs, xDefs);
        }
      }
      return defs;
    }) : void 8;
    defs = _.uniq(_.compact(defs), false);
    if (defs.length) {
      return defs;
    } else {
      return null;
    }
  });
  prototype.uniqueMetricDataLinks = GraphView.computed(function(){
    var links, ref$;
    links = (ref$ = this.rootNode()) != null ? ref$.walk([], function(links, node){
      var url, ref$, ref1$, ref2$;
      if (node.hasTrait(Trait.METRIC_CONTENT_DATA) && (url = (ref$ = node.model()) != null ? (ref1$ = ref$.metric()) != null ? (ref2$ = ref1$.source()) != null ? ref2$.url() : void 8 : void 8 : void 8)) {
        links.push(url);
      }
      return links;
    }) : void 8;
    return _.uniq(links, false);
  });
  prototype.tabularize = function(){
    this.tabularizeDialog(new TableView(this.model(), this.rootNode()));
    return this.$el.find('.tabularizeDialog').modal('show');
  };
  prototype.save = function(){
    var graph;
    graph = ko.utils.unwrapObservable(this.model);
    return graph.save().done(function(){
      return limn.message.info('Saved Successfully');
    }).fail(function(data, message, response){
      switch (response.status) {
      case 403:
        return limn.message.error("Not Saved.  " + message);
      default:
        return limn.message.error('Not Saved.  There was a problem');
      }
    });
  };
  /* * * *  UI Feedback  * * * {{{ */
  prototype.configurationError = function(message){};
  return GraphView;
}(View));
out$.GraphChartOnlyView = GraphChartOnlyView = (function(superclass){
  GraphChartOnlyView.displayName = 'GraphChartOnlyView';
  var prototype = extend$(GraphChartOnlyView, superclass).prototype, constructor = GraphChartOnlyView;
  prototype.template = 'graph-chart';
  function GraphChartOnlyView(model, action){
    superclass.apply(this, arguments);
  }
  return GraphChartOnlyView;
}(GraphView));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/markup-api-view.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ref$, _, op, View, ref1$, GraphView, GraphChartOnlyView, limn, MarkupAPIView, out$ = typeof exports != 'undefined' && exports || this;
ko = require('knockout');
ref$ = require('../util'), _ = ref$._, op = ref$.op;
View = require('../base/view').View;
ref1$ = require('./graph-view'), GraphView = ref1$.GraphView, GraphChartOnlyView = ref1$.GraphChartOnlyView;
limn = require('limn');
/**
 * @class
 * @extends View
 */
out$.MarkupAPIView = MarkupAPIView = (function(superclass){
  MarkupAPIView.displayName = 'MarkupAPIView';
  var prototype = extend$(MarkupAPIView, superclass).prototype, constructor = MarkupAPIView;
  prototype.OPTION_DEFAULTS = {
    template: null
  };
  prototype.id = null;
  prototype.el = null;
  prototype.view = null;
  prototype.options = null;
  function MarkupAPIView(id, el, opts){
    var that;
    this.id = id;
    opts == null && (opts = {});
    superclass.call(this);
    this.el = _.toElement(el);
    this.options = opts = _.merge({}, this.OPTION_DEFAULTS, opts);
    this.view = new GraphView(id);
    if (that = opts.template) {
      this.view.template = that;
    }
    limn.$(el).data('view', this);
    this.render();
  }
  prototype.render = MarkupAPIView.computed(function(){
    if (!limn.domReady()) {
      return;
    }
    return this.view.renderView(this.el);
  });
  MarkupAPIView.fromDataMarkup = function(el){
    var $el, data, id, options, that;
    $el = limn.$(_.toElement(el));
    data = $el.data();
    id = data.limnGraph || null;
    options = data.options || {};
    if (that = data.template) {
      options.template || (options.template = that);
    }
    return new MarkupAPIView(id, $el[0], options);
  };
  MarkupAPIView.autodetect = function(){
    return limn.$('[data-limn-graph]').toArray().map(function(el){
      return MarkupAPIView.fromDataMarkup(el);
    });
  };
  return MarkupAPIView;
}(View));
ko.computed(function(){
  if (!limn.domReady()) {
    return;
  }
  return MarkupAPIView.autodetect();
});
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/project-colors.js', function(require, module, exports, __dirname, __filename, undefined){

var d3, PROJECT_COLORS, PROJECT_TESTS, res$, project, color, paletteScales, lookupColor;
d3 = require('d3');
/**
 * @fileOverview Applies consistent coloring to language/project Metrics with a null `color` field.
 */
PROJECT_COLORS = exports.PROJECT_COLORS = {
  'target': '#cccccc',
  'projected': '#3c57a8',
  'total': '#182B53',
  'all projects': '#182B53',
  'world': '#182B53',
  'commons': '#d73027',
  'north america': '#4596FF',
  'english': '#4596FF',
  'asia pacific': '#83BB32',
  'japanese': '#83BB32',
  'china': '#AD3238',
  'chinese': '#AD3238',
  'europe': '#FF0097',
  'german': '#FF0097',
  'germany': '#FF0097',
  'dutch': '#EF8158',
  'french': '#1A9380',
  'italian': '#FF87FF',
  'portuguese': '#B64926',
  'swedish': '#5DD2A4',
  'russian': '#FA0000',
  'polish': '#74c476',
  'latin america': '#FFB719',
  'spanish': '#FFB719',
  'middle east': '#00675B',
  'india': '#553DC9',
  'jpg': '#3182bd',
  'png': '#6baed6',
  'svg': '#9ecae1',
  'ogg': '#c6dbef',
  'gif': '#e6550d',
  'tif': '#fd8d3c',
  'pdf': '#fdae6b',
  'djvu': '#fdd0a2',
  'ogv': '#31a354',
  'mid': '#74c476',
  'very active editors': '#C00000',
  'active editors': '#FF0000',
  'new editors': '#0043B6'
};
res$ = [];
for (project in PROJECT_COLORS) {
  color = PROJECT_COLORS[project];
  res$.push({
    pat: RegExp('\\b' + project.replace(/ /g, '[ _-]') + '\\b', 'i'),
    project: project,
    color: color
  });
}
PROJECT_TESTS = res$;
paletteScales = {
  category10: d3.scale.category10(),
  category20: d3.scale.category20(),
  category20b: d3.scale.category20b(),
  category20c: d3.scale.category20c(),
  'default': d3.scale.category10()
};
/**
 * Provides consistent color lookup accross projects and/or instances
 * @param {string} label is the label of the object to be colored
 * @param {string} [palette] is the palette of colors that will do the coloring
 * @returns a color if one is found in the specified palette, a color from the default palette otherwise
 */
lookupColor = exports.lookup = function(label, palette){
  var project, ref$, ref1$, pat, color, scale;
  palette == null && (palette = null);
  if (palette === 'wmf_projects') {
    for (project in ref$ = PROJECT_TESTS) {
      ref1$ = ref$[project], pat = ref1$.pat, color = ref1$.color;
      if (pat.test(label)) {
        return color;
      }
    }
  }
  if (scale = paletteScales[palette]) {
    return scale(label);
  }
  scale = paletteScales['default'];
  return scale(label);
};

});

;
require.define('/node_modules/limn/graph/table-view.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, moment, View, ColumnDef, Trait, TableView;
_ = require('underscore');
ko = require('knockout');
moment = require('moment');
View = require('../base/view').View;
ColumnDef = require('../data/datasource').ColumnDef;
Trait = require('./node/graph-node-trait');
exports.TableView = TableView = (function(superclass){
  TableView.displayName = 'TableView';
  var prototype = extend$(TableView, superclass).prototype, constructor = TableView;
  prototype.template = 'table';
  prototype.defaults = function(){
    return {
      model: null,
      rootNode: null,
      columnDefs: [],
      columns: [],
      rows: [],
      tableColumns: null,
      tableRows: null
    };
  };
  /**
   * @constructor
   * @param {Graph} model Graph model for this view.
   * @param {GraphNode} rootNode The root node that was rendering the Graph model
   */;
  function TableView(model, rootNode){
    var distinctRows, firstColumn, value, i$, ref$, len$, row, i, ref1$, len1$, column, this$ = this;
    superclass.apply(this, arguments);
    this.rootNode(rootNode);
    this.model(model);
    distinctRows = {};
    this.rootNode().walk([], function(columns, node){
      var columnDef, ref$, ref1$, column, i$, ref2$, len$, row;
      if (node.hasTrait(Trait.METRIC_CONTENT_DATA) && (columnDef = (ref$ = node.model()) != null ? (ref1$ = ref$.metric()) != null ? ref1$.yColumnDef() : void 8 : void 8)) {
        column = {};
        column.label = node.label();
        for (i$ = 0, len$ = (ref2$ = node.model().metric().materialized().rows).length; i$ < len$; ++i$) {
          row = ref2$[i$];
          column[row[0]] = row[1];
          distinctRows[row[0]] = true;
        }
        return this$.columns.push(column);
      }
    });
    firstColumn = [];
    for (value in distinctRows) {
      if (moment(value).isValid()) {
        firstColumn.push(new Date(value));
      } else {
        firstColumn.push(value);
      }
    }
    for (i$ = 0, len$ = (ref$ = firstColumn.sort(fn$)).length; i$ < len$; ++i$) {
      value = ref$[i$];
      row = [];
      if (moment(value).isValid()) {
        row.push(moment(value).format('YYYY-MM-DD HH:mm'));
      } else {
        row.push(value);
      }
      for (i = 0, len1$ = (ref1$ = this.columns()).length; i < len1$; ++i) {
        column = ref1$[i];
        row.push(column[value]);
      }
      this.rows.push(row);
    }
    this.columns.insert([], 0);
    this.columns()[0].label = firstColumn[0] instanceof Date ? 'Date' : '';
    this.tableColumns(this.columns());
    this.tableRows(this.rows());
    function fn$(a, b){
      if (a > b) {
        return -1;
      }
      if (a < b) {
        return 1;
      }
      return 0;
    }
  }
  return TableView;
}(View));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/index.js', function(require, module, exports, __dirname, __filename, undefined){

var graph_display_view, graph_edit_view, graph_model, graph_view, graph_create_view, table_view, project_colors, markup_api_view;
graph_display_view = require('./graph-display-view');
graph_edit_view = require('./graph-edit-view');
graph_model = require('./graph-model');
graph_view = require('./graph-view');
graph_create_view = require('./graph-create-view');
table_view = require('./table-view');
project_colors = require('./project-colors');
markup_api_view = require('./markup-api-view');
import$(import$(import$(import$(import$(import$(import$(import$(import$(exports, graph_display_view), graph_edit_view), graph_model), graph_view), graph_create_view), graph_display_view), table_view), project_colors), markup_api_view);
exports.node = require('./node');
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/node/canvas-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, d3, ko, op, ref$, ViewportNodeData, ViewportNode, Trait, toNumeric, cmpNumeric, tuplesEqual, CanvasNodeData, CanvasNode;
_ = require('underscore');
d3 = require('d3');
ko = require('knockout');
op = require('operator');
ref$ = require('./viewport-node'), ViewportNodeData = ref$.ViewportNodeData, ViewportNode = ref$.ViewportNode;
Trait = require('./graph-node-trait');
toNumeric = function(it){
  return +it;
};
cmpNumeric = function(a, b){
  return op.cmp(+a, +b);
};
tuplesEqual = function(a, b){
  return cmpNumeric(a[0], b[0]) === 0 && cmpNumeric(a[1], b[1]) === 0;
};
/**
 * @class
 * @extends ViewportNodeData
 */
exports.CanvasNodeData = CanvasNodeData = (function(superclass){
  CanvasNodeData.displayName = 'CanvasNodeData';
  var prototype = extend$(CanvasNodeData, superclass).prototype, constructor = CanvasNodeData;
  CanvasNodeData.registerType('canvas');
  prototype.defaults = function(){
    return {};
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function CanvasNodeData(){
    superclass.apply(this, arguments);
  }
  return CanvasNodeData;
}(ViewportNodeData));
/**
 * @class
 * @extends ViewportNode
 */
exports.CanvasNode = CanvasNode = (function(superclass){
  CanvasNode.displayName = 'CanvasNode';
  var prototype = extend$(CanvasNode, superclass).prototype, constructor = CanvasNode;
  CanvasNode.registerType('canvas');
  prototype.traits = [Trait.VIEWPORT];
  prototype.tagName = 'section';
  prototype.template = 'canvas-node';
  function CanvasNode(){
    superclass.apply(this, arguments);
    this.on('child-built', this.resize, this);
    $(window).resize(_.debounce(this.resize.bind(this), 50));
  }
  prototype.margin = {
    top: 30,
    right: 60,
    bottom: 30,
    left: 60
  };
  prototype.buildElement = function(parentElement){
    var el;
    this.renderView(parentElement);
    this.el(el = $(parentElement).find('.canvas-node.graph-node')[0]);
    this.trackCursor();
    return el;
  };
  /**
   * Element representing the frame where the content is held.
   * @type ko.observable<d3.selection>
   */
  prototype.contentFrameEl = CanvasNode.computed(function(){
    if (this.el()) {
      return d3.select(this.$('.content-frame')[0]);
    }
  });
  /**
   * Determine the DOM node to act as the parent for a direct child of the root node.
   * 
   * @protected
   * @param {GraphNode} node
   * @returns {Element}
   */
  prototype.determineDOMParentForChildNode = function(node){
    if (node.hasTrait(Trait.SVG)) {
      if (node.hasTrait(Trait.FG_LAYER)) {
        return this.$('svg .frame > .fg')[0];
      } else if (node.hasTrait(Trait.BG_LAYER)) {
        return this.$('svg .content-frame > .bg')[0];
      } else {
        return this.$('svg .content-frame > .viewport')[0];
      }
    } else {
      if (node.hasTrait(Trait.CALLOUT_NODE)) {
        return this.graph.$('.graph-name-row > .callout')[0];
      } else if (node.hasTrait(Trait.SECTION)) {
        return this.$el.parent()[0];
      } else if (node.hasTrait(Trait.FG_LAYER)) {
        return this.$('.meta.fg')[0];
      } else {
        return this.$('.meta.bg')[0];
      }
    }
  };
  prototype.background = function(color){
    var bg;
    if (!(bg = this.$('.content-frame > .bg > .bgcolor')).length) {
      return;
    }
    if (arguments.length) {
      bg.css('fill', color);
      return this;
    } else {
      return bg.css('fill');
    }
  };
  /**
   * Current location of the cursor in the viewport.
   * @type ko.observable<Object>
   */
  prototype.cursor = ko.observable(null);
  prototype.trackCursor = function(){
    var el, svg, this$ = this;
    if (this.cursor.peek()) {
      return;
    }
    if (!(el = _.toElement(this.contentViewportEl()))) {
      return;
    }
    if (!(svg = _.toElement(this.graph.$('svg')))) {
      return;
    }
    svg = d3.select(svg);
    svg.on('mouseover', function(){
      var ref$, x, y, cursor;
      ref$ = d3.mouse(el), x = ref$[0], y = ref$[1];
      cursor = {
        hovering: true,
        x: x,
        y: y
      };
      return this$.trigger('mouseover', cursor, this$);
    });
    svg.on('mousemove', function(){
      var ref$, x, y, cursor, x0$;
      ref$ = d3.mouse(el), x = ref$[0], y = ref$[1];
      cursor = {
        hovering: true,
        x: x,
        y: y
      };
      this$.trigger('mousemove', cursor, this$);
      x0$ = this$.cursor.peek();
      if (!(x0$ != null && x0$.hovering) || x0$.x != x || x0$.y != y) {
        this$.cursor(cursor);
      }
      return x0$;
    });
    svg.on('mouseout', function(){
      var ref$, x, y, cursor;
      ref$ = d3.mouse(el), x = ref$[0], y = ref$[1];
      this$.cursor(cursor = {
        hovering: false,
        x: x,
        y: y
      });
      return this$.trigger('mouseout', cursor, this$);
    });
    return this;
  };
  return CanvasNode;
}(ViewportNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/child-node.js', function(require, module, exports, __dirname, __filename, undefined){

var GraphNode, ChildNode;
GraphNode = require('./graph-node').GraphNode;
/**
 * @class
 * @extends GraphNode
 */
exports.ChildNode = ChildNode = (function(superclass){
  ChildNode.displayName = 'ChildNode';
  var prototype = extend$(ChildNode, superclass).prototype, constructor = ChildNode;
  ChildNode.registerType('child');
  function ChildNode(){
    superclass.apply(this, arguments);
  }
  prototype.buildElement = function(parentElement){
    var el;
    el = superclass.prototype.buildElement.apply(this, arguments);
    $(parentElement).find('section.children').append(el);
    return this.renderView(el);
  };
  return ChildNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/graph-node-data.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, Model, TypeCache, Metric, NodeMixin, NodeOptions, GraphNodeData;
_ = require('underscore');
ko = require('knockout');
Model = require('../../base').Model;
TypeCache = require('../../util').TypeCache;
Metric = require('../../data/metric').Metric;
NodeMixin = require('./node-mixin').NodeMixin;
NodeOptions = require('./node-options').NodeOptions;
/**
 * @class Model for GraphNodes.
 * @extends Model
 * @mixes NodeMixin
 * @mixes TypeCache .hasType, .registerType, .lookupType, .invalidateType, .purgeCache
 */
exports.GraphNodeData = GraphNodeData = (function(superclass){
  GraphNodeData.displayName = 'GraphNodeData';
  var prototype = extend$(GraphNodeData, superclass).prototype, constructor = GraphNodeData;
  NodeMixin.mix(GraphNodeData);
  prototype.nodeType = 'node';
  prototype.defaults = function(){
    return {
      nodeType: this.nodeType,
      disabled: false,
      label: null,
      metric: null,
      options: {},
      children: []
    };
  };
  prototype.attributeTypes = function(){
    return {
      metric: Metric,
      children: GraphNodeData.create,
      options: function(options){
        return new NodeOptions(this, options);
      }
    };
  };
  /**
   * Parent of this node.
   * @type ko.observable<GraphNodeData>
   */
  prototype.parent = GraphNodeData.eagerCoerciveObservable(GraphNodeData);
  /**
   * Ensure children Arrays are properly updated when parent changes.
   * 
   * Note: Knockout ignores cycles in deps, so the circular modification
   * trigger between `parent` and `children` is benign.
   */
  prototype.watchParent = GraphNodeData.computed(function(){
    var oldParent, newParent;
    oldParent = this.parent.prev();
    if (oldParent != null) {
      oldParent.children.remove(this);
    }
    newParent = this.parent();
    if (!_.contains(newParent != null ? newParent.children.peek() : void 8, this)) {
      if (newParent != null) {
        newParent.children.push(this);
      }
    }
    return newParent;
  });
  /**
   * Ensure parents are properly set when child-nodes are added or removed.
   * 
   * Note: Knockout ignores cycles in deps, so the circular modification
   * trigger between `parent` and `children` is benign.
   */
  prototype.watchChildren = GraphNodeData.computed(function(){
    var oldChildren, newChildren, this$ = this;
    oldChildren = this.children.prev();
    newChildren = this.children();
    _.each(oldChildren, function(child){
      if (child.parent.peek() === this$ && !_.contains(newChildren, child)) {
        return child.parent(null);
      }
    });
    _.invoke(newChildren, 'parent', this);
    return newChildren;
  });
  /**
   * @constructor
   */;
  function GraphNodeData(attributes){
    attributes == null && (attributes = {});
    superclass.call(this);
    this.initMixin();
    this.set(attributes);
  }
  /**
   * Starts watching relevant properties and informs sub-objects its safe to
   * begin their watchers.
   * 
   * Note that this function **must** be invoked by the object creator once
   * construction is finished. It cannot be called automatically by the
   * constructor without causing a loop, potentially triggering updates
   * before anyone else can get a reference to the object.
   * 
   * This method must be idempotent; it should always be safe to call
   * it multiple times. (Using a `@computed` ensures this.)
   * @protected
   */
  prototype.watching = GraphNodeData.computed(function(){
    var this$ = this;
    this.isWatching = true;
    this.children();
    this.watchDeps();
    return ko.dependencyDetection.ignore(function(){
      var _parent, _children, _others;
      _parent = this$.watchParent();
      _children = this$.watchChildren();
      _others = this$.watchOthers();
      _.invoke(this$.children(), 'watching');
      return [_parent, _children, _others];
    });
  });
  /**
   * Stub to allow you to hook into @watching() without overriding everything.
   * Called to generate dependencies prior to `watching` recursion.
   * 
   * @abstract
   * @protected
   */
  prototype.watchDeps = function(){};
  /**
   * Stub to allow you to hook into @watching() without overriding everything.
   * Called to recursively notify of deps.
   * 
   * @abstract
   * @protected
   */
  prototype.watchOthers = function(){};
  /* * * *  Property Cascading  * * * {{{ */
  prototype.toString = function(){
    var id, Class, className, nChildren;
    id = this.__id__;
    Class = this.constructor;
    className = Class.displayName || Class.name;
    nChildren = this.children.peek().length;
    return className + "(id=" + id + ", #children=" + nChildren + ")";
  };
  /* * * *  Class Methods  * * * {{{ */
  /**
   * @static
   * @param {Object} attributes Starting attribute values, requiring
   *  a `nodeType` to be present.
   * @returns {? extends GraphNodeData} A new instance of the appropriate
   *  GraphNodeData type.
   */;
  GraphNodeData.create = function(attributes){
    var nodeType, GraphNodeDataType;
    if (!attributes) {
      return null;
    }
    if (!(nodeType = attributes != null ? attributes.nodeType : void 8)) {
      throw new Error("Cannot create GraphNodeData without a nodeType!");
    }
    GraphNodeDataType = GraphNodeData.lookupType(nodeType);
    return new GraphNodeDataType(attributes);
  };
  /**
   * Map of known sub-types, keyed by type-name. Decorates this class to
   * provide static methods for interacting with the cache:
   *  - hasType
   *  - lookupType
   *  - registerType
   *  - invalidateType
   *  - purgeCache
   * 
   * @static
   * @type TypeCache
   */
  GraphNodeData.__cache__ = TypeCache.createFor(GraphNodeData, 'nodeType');
  return GraphNodeData;
}(Model));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/graph-node-trait.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * @namespace Describes values of `GraphNode::traits` utilized elsewhere in Limn.
 */
import$(exports, {
  /**
   * Node needs an HTML parent element.
   * @constant
   */
  HTML: 'html-element'
  /**
   * Node needs an SVG parent element.
   * @constant
   */,
  SVG: 'svg-element'
  /**
   * Node should render above others.
   * @constant
   */,
  FG_LAYER: 'fg-layer'
  /**
   * Node should render behind others.
   * @constant
   */,
  BG_LAYER: 'bg-layer'
  /**
   * Node participates in visualizing data.
   * @constant
   */,
  VIS_NODE: 'visualization-node'
  /**
   * Node serves some purpose other than visualizing data.
   * @constant
   */,
  META_NODE: 'meta-node'
  /**
   * Associated GraphNodeData must define a valid Metric as a prerequisite to render.
   * @constant
   */,
  REQUIRES_METRIC: 'metric'
  /**
   * Associated GraphNodeData must define a pointer to another Metric as a prerequisite to render.
   * @constant
   */,
  REQUIRES_METRIC_POINTER: 'metric-pointer'
  /**
   * Metric for associated GraphNodeData is content-data if defined, not
   * scaffolding (like a geojson definition).
   * @constant
   */,
  METRIC_CONTENT_DATA: 'metric-content-data'
  /**
   * Metric for associated GraphNodeData is timeseries data if defined.
   * @constant
   */,
  METRIC_TIMESERIES: 'metric-timeseries'
  /**
   * Metric for associated GraphNodeData is geographic map data if defined.
   * @constant
   */,
  METRIC_GEO_MAP: 'metric-geo-map'
  /**
   * Metric for associated GraphNodeData is geographic content data if defined.
   * @constant
   */,
  METRIC_GEO_FEATURE: 'metric-geo-feature'
  /**
   * Node cannot have children.
   * @constant
   */,
  LEAF: 'leaf'
  /**
   * Node has an associated edit UI.
   * @constant
   */,
  EDITABLE: 'editable'
  /**
   * Node is a top-level section in the canvas, likely altering the flow of other elements.
   * @constant
   */,
  SECTION: 'section'
  /**
   * Node defines a viewing window for other nodes to render in.
   * @constant
   */,
  VIEWPORT: 'viewport'
  /**
   * CalloutNode renders in the graph's title row.
   * @constant
   */,
  CALLOUT_NODE: 'callout-node'
});
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/node/graph-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, d3, ko, ref$, formatters, TypeCache, AttributesBase, NodeMixin, Trait, GraphNode;
_ = require('underscore');
d3 = require('d3');
ko = require('knockout');
ref$ = require('../../util'), _ = ref$._, formatters = ref$.formatters, TypeCache = ref$.TypeCache;
AttributesBase = require('../../base/attributes-base').AttributesBase;
NodeMixin = require('./node-mixin').NodeMixin;
Trait = require('./graph-node-trait');
/**
 * @class Handles the presentation of a specific type of visualization element in a Graph.
 * @extends AttributesBase
 * @mixes NodeMixin
 * @mixes TypeCache .hasType, .registerType, .lookupType, .invalidateType, .purgeCache
 */
exports.GraphNode = GraphNode = (function(superclass){
  GraphNode.displayName = 'GraphNode';
  var prototype = extend$(GraphNode, superclass).prototype, constructor = GraphNode;
  importAll$(prototype, arguments[1]);
  NodeMixin.mix(GraphNode);
  /**
   * @section Class Properties
   * Properties shared across all instances by virtue of the prototype;
   * it is expected instances will not [need to] modify these values.
   */
  /**
   * Unique id for this GraphNode type, as referenced by `GraphNodeData::nodeType`.
   * 
   * Required to be set by all subclasses; afterward, notify the GraphNode registry
   * to provide the type for rendering:
   * 
   *  class AnotherGraphNode extends GraphNode
   *      @registerType('another')
   *      -> ...
   * 
   * @type String
   */
  prototype.nodeType = 'graph';
  /**
   * Characteristics of this node-type; utilized by the Graph's Display and Edit views
   * to customize default behavior of nodes, as well as filter, group, and order their
   * DOM nodes.
   * 
   * @see limn.graph.NodeTraits
   * @type Array<String>
   */
  prototype.traits = [];
  /**
   * HTML or SVG tag name for the DOM node that represents this GraphNode.
   * @type String
   */
  prototype.tagName = 'svg:g';
  /**
   * Calculates the CSS class for the DOM node that represents this GraphNode.
   * @returns {String}
   */
  prototype.cssClass = function(){
    return _(this).chain().pluckSuperAndSelf('nodeType').compact().map(function(it){
      return it + "-node";
    }).value().join(' ');
  };
  /* * * *  Instance Properties  * * * {{{ */
  /**
   * The GraphView for this node tree.
   * @type GraphView
   */
  prototype.graph = null;
  /**
   * Observable properties and their defaults.
   * 
   * Recall these properties are attached directly to the instance so long
   * as there is no conflict; the fact that they are also stored
   * in `@attributes` is not important to GraphNode.
   */
  prototype.defaults = function(){
    return {
      model: null,
      parent: null,
      children: [],
      isDisposed: false,
      isRendered: false
    };
  };
  prototype.attributeTypes = function(){
    return {
      parent: function(nodeData){
        return this.graph.lookupNode(nodeData);
      },
      children: function(nodeData){
        return this.graph.lookupNode(nodeData);
      }
    };
  };
  /**
   * @returns {GraphNode} Node at the root of the GraphNode tree.
   */
  prototype.root = function(){
    return this.graph.rootNode();
  };
  /**
   * @returns {GraphNode} Viewport for this node (i.e., the closest
   * parent-node that is a viewport).
   */
  prototype.viewport = function(){
    return this.findUpTraits(Trait.VIEWPORT);
  };
  /**
   * DOM Element at the root of this Node. jQuery objects and d3 Selections
   * will be automatically stripped of their wrappers.
   * @type ko.observable<Element>
   */
  prototype.el = GraphNode.eagerCoerciveObservable(function(el){
    this.$el = this.sel = null;
    el = _.toElement(el);
    if (!_.isElement(el)) {
      return el;
    }
    this.$el = $(el);
    this.sel = d3.select(el);
    return el;
  });
  /**
   * jQuery-wrapped root element.
   * @type jQuery
   */
  prototype.$el = null;
  /**
   * Selection of the element for this view, used by @select() and @selectAll().
   * Defaults to `d3.select(this.el)`.
   * @type d3.selection
   */
  prototype.sel = null;
  /**
   * @constructor
   * @param {GraphView} graph
   * @param {GraphNodeData} model
   */;
  function GraphNode(graph, model){
    var this$ = this;
    this.graph = graph;
    superclass.call(this);
    this.initMixin();
    this.graphId = 'graph-' + this.graph.__id__;
    this.nodeId = 'graph-node-' + this.__id__;
    if (model != null && model.attributes) {
      _.defaults(this, model.attributes);
    }
    this.set({
      model: model
    });
    if (typeof this.render === 'function') {
      this.render = this.render.bind(this);
      this.renderWrap = ko.computed({
        owner: this,
        deferEvaluation: true,
        read: function(){
          var ref$;
          if (!(this.el() && this.sel)) {
            return;
          }
          if (!this.model().options()) {
            return;
          }
          if (_.contains(this.traits, Trait.REQUIRES_METRIC) && !((ref$ = this.model().metric()) != null && ref$.data())) {
            return;
          }
          this.trigger('before-render', this);
          this.render();
          this.isRendered(true);
          return this.trigger('render', this);
        }
      });
      this.once('watch-build', function(){
        return _.defer(this$.renderWrap);
      });
    }
  }
  /* * * *  Tree Traversal Methods  * * * {{{ */
  /**
   * @param {String} trait Trait to test for membership.
   * @returns {Boolean} Whether this node possesses the trait.
   */
  prototype.hasTrait = function(trait){
    return _.contains(this.traits, trait);
  };
  /**
   * Walk the GraphNode tree and filter out all nodes that do not have
   * all the given traits.
   * 
   * @param {Trait|Array<Trait>} traits List of trait(s) which must
   *  be present to keep a node.
   * @returns {Array<GraphNode>} List of matching nodes.
   */
  prototype.filterTraits = function(traits){
    if (!_.isArray(traits)) {
      traits = [traits];
    }
    return this.filter(function(node){
      return _.all(traits, node.hasTrait, node);
    });
  };
  /**
   * Walk the GraphNode tree and return the first node matching all the given
   * traits.
   * 
   * @param {Trait|Array<Trait>} traits List of trait(s) to match.
   * @returns {GraphNode|null} First matching node, or null if none match.
   */
  prototype.findTraits = function(traits){
    if (!_.isArray(traits)) {
      traits = [traits];
    }
    return this.find(function(node){
      return _.all(traits, node.hasTrait, node);
    });
  };
  /**
   * Walk up the tree through this node's parents (NOT including this node),
   * returning the first node matching all the given traits.
   * 
   * @param {Trait|Array<Trait>} traits List of trait(s) to match.
   * @returns {GraphNode|null} First matching node, or null if none match.
   */
  prototype.findUpTraits = function(traits){
    var this$ = this;
    if (!_.isArray(traits)) {
      traits = [traits];
    }
    return this.findUp(function(node){
      return node !== this$ && _.all(traits, node.hasTrait, node);
    });
  };
  /* * * *  Rendering API  * * * {{{ */
  /**
   * Implement to completely customize the process of building and attaching
   * the DOM nodes for the presentation of this GraphNode.
   * 
   * Note that overrides to this method in a subclass should be decorated
   * with `@ignoreDeps`, or else you will probably end up crying later.
   * 
   * @param {Element} parentElement Parent DOM element (and can be either
   *  an HTML or an SVG element).
   * @returns {Element} Newly constructed root element for this GraphNode.
   */
  prototype.build = GraphNode.ignoreDeps(function(parentElement){
    var origEl, el, i$, ref$, len$, node, nodeParentEl;
    parentElement = _.toElement(parentElement);
    origEl = el = this.el.peek();
    if (!_.isElement(origEl)) {
      el = _.toElement(this.buildElement(parentElement));
      if (_.isElement(el)) {
        this.trigger('build', el, parentElement, this);
        this.trigger('watch-build');
      }
    }
    if (!_.isElement(el)) {
      return el;
    }
    if (origEl !== el) {
      this.el(el);
    }
    if (!_.isElement(el.parentNode)) {
      this.el(parentElement.appendChild(el));
    }
    for (i$ = 0, len$ = (ref$ = this.children()).length; i$ < len$; ++i$) {
      node = ref$[i$];
      nodeParentEl = this.determineDOMParentForChildNode(node);
      if (!(nodeParentEl && node.build(nodeParentEl))) {
        continue;
      }
      this.trigger('child-built', node, this);
    }
    return el;
  });
  /**
   * Override to customize the creation of this node's root DOM element.
   * 
   * @protected
   * @param {Element} parentElement
   * @returns {Element}
   */
  prototype.buildElement = function(parentElement){
    var tagName, cssClass, el;
    tagName = _.result(this, 'tagName');
    cssClass = _.result(this, 'cssClass');
    this.el(el = _.createElement(tagName, cssClass));
    return el;
  };
  /**
   * Override to choose the DOM node to act as the parent the given node.
   * 
   * @abstract
   * @protected
   * @param {GraphNode} node
   * @returns {Element}
   */
  prototype.determineDOMParentForChildNode = function(node){
    var elementType, parent;
    elementType = _.contains(node.traits, Trait.SVG)
      ? Trait.SVG
      : Trait.HTML;
    if (_.contains(this.traits, elementType)) {
      return this.el();
    }
    if (!(parent = this.parent())) {
      throw new Error("Unable to determine DOM parent for child node! " + node);
    }
    return parent.determineDOMParentForChildNode(node);
  };
  /**
   * Create a template binding on `targetEl` and render it using `view`.
   * 
   * @protected
   * @param {Element} targetEl Container element for the rendered template.
   * @param {Object} [view=this] View instance (with a `template` property).
   * @returns {Element} The target element.
   */
  prototype.renderView = function(targetEl, view){
    var el;
    view == null && (view = this);
    el = _.toElement(targetEl);
    $(el).attr('data-bind', 'template: { name:template, data:$data }');
    ko.applyBindings(view, el);
    return targetEl;
  };
  /* * * *  Watchers  * * * {{{ */
  /**
   * Starts watching relevant properties and informs sub-objects its safe to
   * begin their watchers.
   * 
   * Note that this function **must** be invoked by the object creator once
   * construction is finished. It cannot be called automatically by the
   * constructor without causing a loop, potentially triggering updates
   * before anyone else can get a reference to the object.
   * 
   * This method must be idempotent; it should always be safe to call
   * it multiple times. (Using a `@computed` ensures this.)
   * @protected
   */
  prototype.watching = GraphNode.computed(function(){
    var this$ = this;
    this.isWatching = true;
    this.children();
    this.watchDeps();
    return ko.dependencyDetection.ignore(function(){
      var _parent, _children, _childModels, _others;
      _parent = this$.watchParent();
      _children = this$.watchChildren();
      _childModels = this$.watchModelChildren();
      _others = this$.watchOthers();
      this$.model().watching();
      _.invoke(this$.children(), 'watching');
      return [_parent, _children, _childModels, _others];
    });
  });
  /**
   * Stub to allow you to hook into @watching() without overriding everything.
   * Called to generate dependencies prior to `watching` recursion.
   * 
   * @abstract
   * @protected
   */
  prototype.watchDeps = function(){};
  /**
   * Stub to allow you to hook into @watching() without overriding everything.
   * Called to recursively notify of deps.
   * 
   * @abstract
   * @protected
   */
  prototype.watchOthers = function(){};
  /**
   * Update parent GraphNode to match when model's parent GraphNodeData
   * changes.
   */
  prototype.parentFromModel = GraphNode.eagerComputed(function(){
    var parentModel, ref$;
    if (!(parentModel = (ref$ = this.model()) != null ? ref$.parent() : void 8)) {
      return null;
    }
    this.parent(parentModel);
    return this.parent.peek();
  });
  /**
   * Ensure children Arrays are properly updated when parent changes.
   * 
   * Note: Knockout ignores cycles in deps, so the circular modification
   * trigger between `parent` and `children` is benign.
   */
  prototype.watchParent = GraphNode.computed(function(){
    var oldParent, newParent, newSiblings;
    oldParent = this.parent.prev();
    if (oldParent != null) {
      oldParent.children.remove(this);
    }
    newParent = this.parent();
    if (newSiblings = newParent != null ? newParent.children() : void 8) {
      if (!_.contains(newSiblings, this)) {
        newParent.children.push(this);
      }
    }
    return newParent;
  });
  /**
   * Ensure parents are properly set when child-nodes are added or removed.
   * 
   * Note: Knockout ignores cycles in deps, so the circular modification
   * trigger between `parent` and `children` is benign.
   */
  prototype.watchChildren = GraphNode.computed(function(){
    var oldNodes, childNodes, this$ = this;
    oldNodes = this.children.prev();
    childNodes = this.children();
    _.each(oldNodes, function(node){
      if (node.parent.peek() === this$ && !_.contains(childNodes, node)) {
        return node.parent(null);
      }
    });
    _.invoke(childNodes, 'parent', this);
    return childNodes;
  });
  prototype.watchModelChildren = GraphNode.computed(function(){
    var oldNodes, newModels, this$ = this;
    oldNodes = this.children.prev();
    newModels = this.model().children().slice();
    _.each(oldNodes, function(node){
      var data;
      data = node.model.peek();
      if (node.parent.peek() === this$ && !_.contains(newModels, data)) {
        return node.parent(null);
      }
    });
    this.children(newModels);
    return newModels;
  });
  /* * * *  Property Cascading  * * * {{{ */
  /**
   * `jQuery(el).find(...)`, using the element for this node.
   */
  prototype.$ = function(){
    var ref$;
    return (ref$ = this.$el) != null ? ref$.find.apply(this.$el, arguments) : void 8;
  };
  /**
   * `d3.select(el).select(...)`, using the element for this node.
   */
  prototype.select = function(selector){
    var ref$;
    return (ref$ = this.sel) != null ? ref$.select(selector) : void 8;
  };
  /**
   * `d3.select(el).selectAll(...)`, using the element for this node.
   */
  prototype.selectAll = function(selector){
    var ref$;
    return (ref$ = this.sel) != null ? ref$.selectAll(selector) : void 8;
  };
  prototype.toString = function(){
    var model, ref$, nChildren, ref1$, ref2$;
    model = (ref$ = this.model) != null ? ref$.peek() : void 8;
    nChildren = ((ref1$ = this.children) != null ? (ref2$ = ref1$.peek()) != null ? ref2$.length : void 8 : void 8) || 0;
    return this.getClassName() + "(model=" + model + ", #children=" + nChildren + ")";
  };
  /* * * *  Class Methods  * * * {{{ */
  /**
   * Constructs a new `GraphNode` of this class's type without regard
   * for the `nodeType` specified by the `GraphNodeData`.
   * 
   * If omitted, the `GraphView` for the new node will be inherited
   * from the parent node.
   * 
   * @static
   * @param {GraphView} graph
   * @param {GraphNodeData} model
   * @returns {? extends GraphNode} A new GraphNode instance.
   */;
  GraphNode.create = function(graph, model){
    var GraphNodeType;
    GraphNodeType = this;
    return new GraphNodeType(graph, model);
  };
  /**
   * Constructs a new `GraphNode` of the appropriate type for the
   * given `GraphNodeData`; the `GraphView` for the new node will
   * be inherited from the parent node.
   * 
   * @static
   * @param {GraphView} graph
   * @param {GraphNodeData} model
   * @returns {? extends GraphNode} The GraphNode instance.
   */
  GraphNode.fromNodeData = function(graph, model){
    var GraphNodeType;
    if (model == null) {
      return null;
    }
    if (model instanceof GraphNode) {
      return model;
    }
    GraphNodeType = GraphNode.lookupType(model);
    return new GraphNodeType(graph, model);
  };
  /**
   * Map of known sub-types, keyed by type-name. Decorates this class to
   * provide static methods for interacting with the cache:
   *  - hasType
   *  - lookupType
   *  - registerType
   *  - invalidateType
   *  - purgeCache
   * 
   * @static
   * @type TypeCache
   */
  GraphNode.__cache__ = TypeCache.createFor(GraphNode, 'nodeType');
  return GraphNode;
}(AttributesBase, formatters));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/node/group-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, GraphNodeData, GraphNode, Trait, GroupNodeData, GroupNode;
_ = require('underscore');
ko = require('knockout');
GraphNodeData = require('./graph-node-data').GraphNodeData;
GraphNode = require('./graph-node').GraphNode;
Trait = require('./graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.GroupNodeData = GroupNodeData = (function(superclass){
  GroupNodeData.displayName = 'GroupNodeData';
  var prototype = extend$(GroupNodeData, superclass).prototype, constructor = GroupNodeData;
  GroupNodeData.registerType('group');
  prototype.defaults = function(){
    return {};
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function GroupNodeData(){
    superclass.apply(this, arguments);
  }
  return GroupNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.GroupNode = GroupNode = (function(superclass){
  GroupNode.displayName = 'GroupNode';
  var prototype = extend$(GroupNode, superclass).prototype, constructor = GroupNode;
  GroupNode.registerType('group');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG];
  function GroupNode(){
    superclass.apply(this, arguments);
  }
  return GroupNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/node-mixin.js', function(require, module, exports, __dirname, __filename, undefined){

var op, ko, ref$, _, compareIds, Mixin, NodeMixin, slice$ = [].slice;
op = require('operator');
ko = require('knockout');
ref$ = require('../../util'), _ = ref$._, compareIds = ref$.compareIds, Mixin = ref$.Mixin;
/**
 * @class Functionality common to both GraphNode and GraphNodeData.
 * @extends Mixin
 */
exports.NodeMixin = NodeMixin = (function(superclass){
  NodeMixin.displayName = 'NodeMixin';
  var prototype = extend$(NodeMixin, superclass).prototype, constructor = NodeMixin;
  /**
   * Whether this node is alive or has been marked for deletion.
   * @type ko.observable<Boolean>
   */
  prototype.isDisposed = ko.observable(false);
  /**
   * Called by GraphNode and GraphNodeData in the constructor to allow the
   * mixin to perform initialization.
   * 
   * @protected
   * @returns {this}
   */
  prototype.initMixin = function(){
    this.parent = this.parent.history({
      includeInitial: false
    });
    this.children = this.attributes.children = this.children.history({
      includeInitial: false
    });
    this.parent.equalityComparer = this.children.equalityComparer = compareIds;
    return this;
  };
  /**
   * Call when disposing of this node.
   * @returns {this}
   */
  prototype.dispose = function(){
    if (this.isDisposed.peek()) {
      return this;
    }
    this.isDisposed(true);
    this.trigger('dispose', this);
    return this;
  };
  /* * * *  Tree Operations  * * * {{{ */
  /**
   * Performs a depth-first walk across the tree of nodes, invoking an
   * iteration function much like  `Array.reduce`, passing a custom "accumulator"
   * value along with the current node:
   * 
   *  `newAcc = fn.call(context || node, currentAcc, node, childIndex)`
   * 
   * The function's return becomes the new accumulator. If not specified, the
   * function will be invoked with the node as the context.
   * 
   * @param {*} acc Starting accumulator value.
   * @param {Object} [context] Execution context for the iteration function.
   * @param {Function} fn Iteration function passed the current accumulator and current node.
   * @returns {*} Final accumulator value.
   */
  prototype.walk = function(acc, cxt, fn, idx){
    var ref$, childIdx, ref1$, len$, childNode;
    idx == null && (idx = null);
    if (typeof fn !== 'function') {
      ref$ = [cxt, null], fn = ref$[0], cxt = ref$[1];
    }
    acc = fn.call(cxt || this, acc, this, idx);
    for (childIdx = 0, len$ = (ref1$ = this.children().slice()).length; childIdx < len$; ++childIdx) {
      childNode = ref1$[childIdx];
      acc = childNode.walk(acc, cxt, fn, childIdx);
    }
    return acc;
  };
  /**
   * Performs a walk up the tree through this node's parents (but including
   * this node), invoking an iteration function much like  `Array.reduce`,
   * passing a custom "accumulator" value along with the current node:
   * 
   *  `newAcc = fn.call(context || node, currentAcc, node, distanceFromStart)`
   * 
   * Where `distanceFromStart` is the equivalent to the parent "index",
   * starting at 0 and incrementing each step up the tree. The function's
   * return becomes the new accumulator. If not specified, the function
   * will be invoked with the node as the context.
   * 
   * @param {*} acc Starting accumulator value.
   * @param {Object} [context] Execution context for the iteration function.
   * @param {Function} fn Iteration function passed the current accumulator and current node.
   * @returns {*} Final accumulator value.
   */
  prototype.walkUp = function(acc, cxt, fn, idx){
    var ref$, parent;
    idx == null && (idx = 0);
    if (typeof fn !== 'function') {
      ref$ = [cxt, null], fn = ref$[0], cxt = ref$[1];
    }
    acc = fn.call(cxt || this, acc, this, idx);
    if (!(parent = this.parent())) {
      return acc;
    }
    return parent.walkUp(acc, cxt, fn, idx + 1);
  };
  /**
   * As `Array.map()` but walking the tree of nodes.
   * Mapping function invoked with:
   * 
   *  `fn.call(context || node, node, childIndex) -> newValue`
   * 
   * @param {Object} [context] Execution context for the mapping function.
   * @param {Function} fn Mapping function.
   * @returns {Array} Mapped children.
   */
  prototype.map = function(cxt, fn){
    var ref$;
    if (typeof fn !== 'function') {
      ref$ = [cxt, null], fn = ref$[0], cxt = ref$[1];
    }
    return this.walk([], cxt, function(acc, node, childIdx){
      acc.push(fn.call(this, node, childIdx));
      return acc;
    });
  };
  /**
   * As `Array.filter()` but walking the tree of nodes.
   * Filter function invoked with:
   * 
   *  `fn.call(context || node, node, childIndex) -> Boolean`
   * 
   * @param {Object} [context] Execution context for the filter function.
   * @param {Function} fn Filter function.
   * @returns {Array<Node>} Matching children.
   */
  prototype.filter = function(cxt, fn){
    var ref$;
    if (typeof fn !== 'function') {
      ref$ = [cxt, null], fn = ref$[0], cxt = ref$[1];
    }
    return this.walk([], cxt, function(acc, node, childIdx){
      if (fn.call(this, node, childIdx)) {
        acc.push(node);
      }
      return acc;
    });
  };
  /**
   * Performs a depth-first walk across the tree of nodes, returning the first
   * node for which the predicate function is truthy. Predicate will be invoked
   * with:
   * 
   *  `fn.call(context || node, node, childIndex) -> Boolean`
   * 
   * @param {Object} [context] Execution context for the predicate function.
   * @param {Function} fn Predicate function.
   * @returns {Node|null} First matching node, or `null` if none match.
   */
  prototype.find = function(cxt, fn, idx){
    var ref$, childIdx, ref1$, len$, childNode, that;
    idx == null && (idx = null);
    if (typeof fn !== 'function') {
      ref$ = [cxt, null], fn = ref$[0], cxt = ref$[1];
    }
    if (fn.call(cxt || this, this, idx)) {
      return this;
    }
    for (childIdx = 0, len$ = (ref1$ = this.children().slice()).length; childIdx < len$; ++childIdx) {
      childNode = ref1$[childIdx];
      if (that = childNode.find(cxt, fn, childIdx)) {
        return that;
      }
    }
    return null;
  };
  /**
   * Performs a walk up the tree through this node's parents (but including
   * this node), returning the first node for which the predicate function
   * is truthy. Predicate will be invoked with:
   * 
   *  `fn.call(context || node, node, distanceFromStart) -> Boolean`
   * 
   * Where `distanceFromStart` is the equivalent to the parent "index",
   * starting at 0 and incrementing each step up the tree.
   * 
   * @param {Object} [context] Execution context for the predicate function.
   * @param {Function} fn Predicate function.
   * @returns {Node|null} First matching parent, or `null` if none match.
   */
  prototype.findUp = function(cxt, fn, idx){
    var ref$, parent;
    idx == null && (idx = 0);
    if (typeof fn !== 'function') {
      ref$ = [cxt, null], fn = ref$[0], cxt = ref$[1];
    }
    if (fn.call(cxt || this, this, idx)) {
      return this;
    }
    if (!(parent = this.parent())) {
      return null;
    }
    return parent.findUp(cxt, fn, idx + 1);
  };
  prototype.pluck = function(prop, peek){
    var unwrap;
    unwrap = peek
      ? ko.utils.peekObservable
      : op.I;
    return this.map(function(node){
      return unwrap(node[prop]);
    });
  };
  prototype.invoke = function(method){
    var args;
    args = slice$.call(arguments, 1);
    return this.map(function(node){
      var ref$;
      return (ref$ = node[method]) != null ? ref$.apply(node, args) : void 8;
    });
  };
  function NodeMixin(){}
  return NodeMixin;
}(Mixin));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/node-options.js', function(require, module, exports, __dirname, __filename, undefined){

var _, Model, NodeOptions;
_ = require('underscore');
Model = require('../../base').Model;
/**
 * @class
 * @extends Model
 */
exports.NodeOptions = NodeOptions = (function(superclass){
  NodeOptions.displayName = 'NodeOptions';
  var prototype = extend$(NodeOptions, superclass).prototype, constructor = NodeOptions;
  /**
   * Object to which these options belong; usually a GraphNodeData,
   * but accepts any Model with a parent() property.
   * @type GraphNodeData|Model
   */
  prototype.owner = null;
  prototype.attributeTypes = function(){
    return {};
  };
  /**
   * @constructor
   * @param {GraphNodeData} owner GraphNodeData to which these options belong.
   * @param {Object} [attributes={}] Option values.
   */;
  function NodeOptions(owner, attributes){
    var parent, ref$;
    this.owner = owner;
    parent = (ref$ = this.owner) != null ? ref$.parent : void 8;
    if (!(parent && (typeof parent === 'function' || parent instanceof Model))) {
      throw new Error("Owner of NodeOptions must have a parent observer or Model! (got owner=" + this.owner + ", parent=" + parent + ")");
    }
    superclass.call(this, attributes);
  }
  /* * * *  Knockout-Aware Accessors (with Nesting and Cascading)  * * * {{{ */
  /**
   * Retrieves the attribute value at `key`, also accepting a dotted
   * keypath to perform a nested lookup. If the key is not found on this
   * object, it will be recursively looked up in the parent's options.
   * 
   * If called by a computed observable, this function creates a dependency
   * on the accessed attribute (provided it exists).
   * 
   * @param {String} key Key to get (including dotted keypaths).
   * @returns {*} Value at `key`.
   */
  prototype.get = function(key){
    var val, ref$, ref1$;
    val = superclass.prototype.get.call(this, key);
    if (val != null) {
      return val;
    }
    return (ref$ = this.owner.parent()) != null ? (ref1$ = ref$.get('options')) != null ? ref1$.get(key) : void 8 : void 8;
  };
  /**
   * Retrieves the attribute value at `key`, also accepting a dotted keypath
   * to perform a nested lookup. Unlike `get()`, if the key is not found on
   * this object, it will **not** be recursively looked up in the parent's
   * options.
   * 
   * If called by a computed observable, this function creates a dependency
   * on the accessed attribute (provided it exists).
   * 
   * @param {String} key Key to get (including dotted keypaths).
   * @returns {*} The value at `key` (ignoring parent lookup).
   */
  prototype.getOwn = function(key){
    return Model.prototype.get.call(this, key);
  };
  /**
   * Retrieves the attribute value at `key`, also accepting a dotted
   * keypath to perform a nested lookup. If the key is not found on this
   * object, it will be recursively looked up in the parent's options.
   * 
   * Even if called by a computed observable, this function does **not**
   * create a dependency on the accessed attribute.
   * 
   * @param {String} key Key to peek (including dotted keypaths).
   * @returns {*} Value at `key`.
   */
  prototype.peek = function(key){
    var val, ref$, ref1$;
    val = superclass.prototype.peek.call(this, key);
    if (val != null) {
      return val;
    }
    return (ref$ = this.owner.parent()) != null ? (ref1$ = ref$.peek('options')) != null ? ref1$.peek(key) : void 8 : void 8;
  };
  /**
   * Retrieves the attribute value at `key`, also accepting a dotted keypath
   * to perform a nested lookup. Unlike `peek()`, if the key is not found on
   * this object, it will **not** be recursively looked up in the parent's
   * options.
   * 
   * Even if called by a computed observable, this function does **not**
   * create a dependency on the accessed attribute.
   * 
   * @param {String} key Key to peek (including dotted keypaths).
   * @returns {*} The value at `key` (ignoring parent lookup).
   */
  prototype.peekOwn = function(key){
    return Model.prototype.peek.call(this, key);
  };
  /**
   * Tests whether `key` is defined on this object (and thus not inherited
   * from a parent).
   * 
   * @param {String} key Key to test (including dotted keypaths).
   * @param {Boolean} [peek=false] If true, uses `peekOwn()` (instead of
   *  `getOwn`) to access the value, circumventing dependency tracking.
   * @returns {Boolean} True if `key` is defined on this object (and thus not
   * inherited from a parent).
   */
  prototype.isOwn = function(key, peek){
    var own;
    peek == null && (peek = false);
    own = peek
      ? this.peekOwn(key)
      : this.getOwn(key);
    return own != null;
  };
  /**
   * Tests whether the value at `key` is the same as that inherited from a parent.
   * 
   * @param {String} key Key to test (including dotted keypaths).
   * @param {Boolean} [peek=false] If true, uses `peek()` and `peekOwn()`
   *  (instead of `get` and `getOwn`) to access the values, circumventing
   *  dependency tracking.
   * @param {Function} [isEqual=_.isEqual] Equality comparator; defaults to
   *  a deep structural comparison via <a href="http://underscorejs.org/#isEqual" target="_blank">Underscore's `isEqual`</a>.
   * @returns {Boolean} True if the value at `key` is the same as that
   *  inherited from a parent.
   */
  prototype.isInherited = function(key, peek, isEqual){
    var own, val;
    peek == null && (peek = false);
    isEqual == null && (isEqual = _.isEqual);
    if (peek) {
      own = this.peekOwn(key);
      val = this.peek(key);
    } else {
      own = this.getOwn(key);
      val = this.get(key);
    }
    return isEqual(own, val);
  };
  /* * * *  Rendering Helpers  * * * {{{ */
  /**
   * Applies options to their corresponding CSS style properties,
   * appropriately mapping things like `stroke.color` to `stroke`,
   * etc.
   * 
   * @param {d3.selection} sel Selection to style.
   * @param {Array<String>|String} optKeys Option keys to apply.
   * @param {String} [prefix=''] Option prefix to prepend to all key lookups.
   * @returns {this}
   */
  prototype.applyStyles = function(sel, optKeys, prefix){
    var this$ = this;
    prefix == null && (prefix = '');
    if (typeof optKeys === 'string') {
      optKeys = optKeys.split(/\s+/g);
    }
    if (!_.isArray(optKeys)) {
      optKeys = [optKeys];
    }
    if (!(sel && optKeys.length)) {
      return this;
    }
    optKeys.forEach(function(opt){
      var val, style;
      if ((val = this$.get(prefix + opt)) == null) {
        return;
      }
      style = _.str.dasherize(opt.replace(/\./g, '-'));
      if (style === 'stroke-color') {
        style = 'stroke';
      }
      return sel.style(style, val);
    });
    return this;
  };
  prototype.applyStroke = function(sel, prefix){
    return this.applyStyles(sel, ['stroke.width', 'stroke.color', 'stroke.opacity', 'stroke.dashed'], prefix);
  };
  prototype.applyFill = function(sel, prefix){
    return this.applyStyles(sel, ['fill', 'fillOpacity'], prefix);
  };
  prototype.applyShapeStyles = function(sel, prefix){
    return this.applyStroke(sel, prefix).applyFill(sel, prefix);
  };
  /**
   * @static
   * @param {GraphNodeData} owner GraphNodeData to which these options belong.
   * @param {Object} [attributes={}] Option values.
   * @returns {NodeOptions} A new instance.
   */;
  NodeOptions.create = function(owner, attributes){
    var ClassType;
    ClassType = this;
    return new ClassType(owner, attributes);
  };
  /**
   * @static
   * @returns {Function} Factory function that creates new instances of this Model.
   */
  NodeOptions.factory = function(){
    var ClassType;
    ClassType = this;
    return function(owner, attributes){
      return new ClassType(owner, attributes);
    };
  };
  return NodeOptions;
}(Model));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/viewport-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, d3, ko, op, GraphNodeData, GraphNode, Trait, toNumeric, cmpNumeric, tuplesEqual, fmt2f, fmtpair, ppExtents, SCALE_DEFAULTS, ViewportNodeData, ViewportNode;
_ = require('underscore');
d3 = require('d3');
ko = require('knockout');
op = require('operator');
GraphNodeData = require('./graph-node-data').GraphNodeData;
GraphNode = require('./graph-node').GraphNode;
Trait = require('./graph-node-trait');
toNumeric = function(it){
  return +it;
};
cmpNumeric = function(a, b){
  return op.cmp(+a, +b);
};
tuplesEqual = function(a, b){
  return cmpNumeric(a[0], b[0]) === 0 && cmpNumeric(a[1], b[1]) === 0;
};
fmt2f = d3.format('.2f');
fmtpair = function(it){
  return "(" + it.map(fmt2f).join(',') + ")";
};
ppExtents = function(it){
  return "[" + it.map(fmtpair).join(', ') + "]";
};
/**
 * @namespace Default options for various scale types
 */
SCALE_DEFAULTS = {
  ALL: {
    clamp: false,
    nice: false
  },
  time: {
    interval: null
  },
  pow: {
    exponent: 1
  },
  ordinal: {
    round: true,
    spacing: 0,
    outerSpacing: 0
  }
};
/**
 * @class
 * @extends GraphNodeData
 */
exports.ViewportNodeData = ViewportNodeData = (function(superclass){
  ViewportNodeData.displayName = 'ViewportNodeData';
  var prototype = extend$(ViewportNodeData, superclass).prototype, constructor = ViewportNodeData;
  ViewportNodeData.registerType('viewport');
  prototype.defaults = function(){
    return {
      width: 'auto',
      minWidth: 750,
      maxWidth: null,
      height: 500,
      minHeight: 500,
      maxHeight: null,
      x: {
        scaleType: null,
        padding: 0,
        domain: null
      },
      y: {
        scaleType: null,
        padding: 0.1,
        domain: null
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function ViewportNodeData(){
    superclass.apply(this, arguments);
  }
  return ViewportNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.ViewportNode = ViewportNode = (function(superclass){
  ViewportNode.displayName = 'ViewportNode';
  var prototype = extend$(ViewportNode, superclass).prototype, constructor = ViewportNode;
  prototype.__bind__ = ['resize'];
  ViewportNode.registerType('viewport');
  prototype.traits = [Trait.VIEWPORT, Trait.SVG];
  prototype.tagName = 'svg:g';
  function ViewportNode(){
    superclass.apply(this, arguments);
  }
  /* * * *  Viewport Sizing  * * * {{{ */
  prototype.defaultWidth = ViewportNode.computed(function(){
    return 750;
  });
  prototype.defaultMinWidth = ViewportNode.computed(function(){
    return 750;
  });
  prototype.defaultMaxWidth = ViewportNode.computed(function(){
    return Infinity;
  });
  prototype.defaultHeight = ViewportNode.computed(function(){
    return 500;
  });
  prototype.defaultMinHeight = ViewportNode.computed(function(){
    return 500;
  });
  prototype.defaultMaxHeight = ViewportNode.computed(function(){
    return Infinity;
  });
  prototype.fullWidth = ViewportNode.computed(function(){
    var w;
    if (this.el() && this._resizeProxy() && (w = this.$el.innerWidth()) > 0) {
      return w;
    } else {
      return this.defaultWidth();
    }
  });
  prototype.fullHeight = ViewportNode.computed(function(){
    var h;
    if (this.el() && this._resizeProxy() && (h = this.$el.innerHeight()) > 0) {
      return h;
    } else {
      return this.defaultHeight();
    }
  });
  prototype.frameWidth = ViewportNode.computed(function(){
    var model, v, min, ref$, max, ref1$, ref2$, ref3$;
    if (!(model = this.model())) {
      return;
    }
    v = model.width();
    if (v == null || v === 'auto') {
      min = (ref$ = model.minWidth()) != null
        ? ref$
        : this.defaultMinWidth();
      max = (ref1$ = model.maxWidth()) != null
        ? ref1$
        : this.defaultMaxWidth();
      v = (ref2$ = min > (ref3$ = this.fullWidth()) ? min : ref3$) < max ? ref2$ : max;
    }
    return v;
  });
  prototype.frameHeight = ViewportNode.computed(function(){
    var model, v, min, ref$, max, ref1$, ref2$, ref3$;
    if (!(model = this.model())) {
      return;
    }
    v = model.height();
    if (v == null || v === 'auto') {
      min = (ref$ = model.minHeight()) != null
        ? ref$
        : this.defaultMinHeight();
      max = (ref1$ = model.maxHeight()) != null
        ? ref1$
        : this.defaultMaxHeight();
      v = (ref2$ = min > (ref3$ = this.fullHeight()) ? min : ref3$) < max ? ref2$ : max;
    }
    return v;
  });
  prototype.margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
  prototype.viewportWidth = ViewportNode.computed(function(){
    return this.frameWidth() - this.margin.left - this.margin.right;
  });
  prototype.viewportHeight = ViewportNode.computed(function(){
    return this.frameHeight() - this.margin.top - this.margin.bottom;
  });
  prototype.clipWidth = ViewportNode.computed(function(){
    var v;
    if ((v = this.viewportWidth()) > 0) {
      return v;
    } else {
      return this.defaultWidth();
    }
  });
  prototype.clipHeight = ViewportNode.computed(function(){
    var v;
    if ((v = this.viewportHeight()) > 0) {
      return v;
    } else {
      return this.defaultHeight();
    }
  });
  prototype.width = ViewportNode.computed(function(){
    return this.clipWidth();
  });
  prototype.height = ViewportNode.computed(function(){
    return this.clipHeight();
  });
  prototype.center = ViewportNode.computed(function(){
    return [this.width() / 2, this.height() / 2];
  });
  /* * * *  Metrics  * * * {{{ */
  /**
   * Child nodes that are not children of another viewport node.
   * @type ko.computed<GraphNode>
   */
  prototype.viewportChildren = ViewportNode.computed(function(){
    var children, unvisited, node;
    children = [];
    unvisited = this.children().slice();
    while (node = unvisited.shift()) {
      children.push(node);
      if (node.hasTrait(Trait.VIEWPORT)) {
        continue;
      }
      unvisited = unvisited.concat(node.children());
    }
    return children;
  });
  /**
   * @protected
   * @param {Array<GraphNode>} nodes
   * @returns {Array<Metric>} Metrics of valid, enabled nodes.
   */
  prototype._metricsFrom = function(nodes){
    var metrics;
    metrics = _.reduce_(nodes, [], function(metrics, node){
      var metric, ref$;
      if (node.hasTrait(Trait.REQUIRES_METRIC) && node.hasTrait(Trait.METRIC_CONTENT_DATA) && !node.disabled() && (metric = (ref$ = node.model()) != null ? ref$.metric() : void 8)) {
        metrics.push(metric);
      }
      return metrics;
    });
    return metrics.length ? metrics : null;
  };
  /**
   * All content-data metrics under this viewport.
   * @type ko.computed<Array<Metric>>
   */
  prototype.allMetrics = ViewportNode.computed(function(){
    return this._metricsFrom(this.map(op.I));
  });
  /**
   * Content-data metrics under this viewport not under another viewport.
   * @type ko.computed<Array<Metric>>
   */
  prototype.viewportMetrics = ViewportNode.computed(function(){
    return this._metricsFrom(this.viewportChildren());
  });
  prototype.xValues = ViewportNode.computed(function(){
    var metrics;
    if (!(metrics = this.allMetrics())) {
      return;
    }
    return _.flatten(_.compact(_.invoke(metrics, 'xValues')));
  });
  prototype.yValues = ViewportNode.computed(function(){
    var metrics;
    if (!(metrics = this.allMetrics())) {
      return;
    }
    return _.flatten(_.compact(_.invoke(metrics, 'yValues')));
  });
  /* * * *  Scales  * * * {{{ */
  prototype.xScale = ViewportNode.computed(function(){
    var xScale, that;
    if (!(xScale = this.createScale(this.xScaleType()))) {
      return null;
    }
    if (that = this.xDomain()) {
      xScale.domain(that);
    }
    return xScale.range([0, this.viewportWidth()]);
  });
  prototype.yScale = ViewportNode.computed(function(){
    var yScale, that;
    if (!(yScale = this.createScale(this.yScaleType()))) {
      return null;
    }
    if (that = this.yDomain()) {
      yScale.domain(that);
    }
    return yScale.range([this.viewportHeight(), 0]);
  });
  prototype.xDomain = ViewportNode.computed(function(){
    return this._domainFor('x');
  });
  prototype.yDomain = ViewportNode.computed(function(){
    var yDomain;
    if (!(yDomain = this._domainFor('y'))) {
      return;
    }
    if (this.yScaleType() === 'log' && yDomain[0] < 1) {
      yDomain[0] = 0.01;
    }
    return yDomain;
  });
  prototype._domainFor = function(dim){
    var values, domain;
    values = this[dim + "Values"]();
    domain = this.model().get(dim + ".domain");
    if (!(_.isArray(domain) && domain.length === 2 && _.every(domain, isFinite))) {
      if (!(values != null && values.length)) {
        return;
      }
      domain = this.applyPadding(d3.extent(values), this.model().get(dim + ".padding"));
    }
    return domain;
  };
  /**
   * @type ko.computed<String := time | linear | log | sqrt | pow | ordinal>
   */
  prototype.xScaleType = ViewportNode.computed(function(){
    return this.model().get('x.scaleType') || this._scaleTypeFor('xType');
  });
  /**
   * @type ko.computed<String := time | linear | log | sqrt | pow | ordinal>
   */
  prototype.yScaleType = ViewportNode.computed(function(){
    return this.model().get('y.scaleType') || this._scaleTypeFor('yType');
  });
  /**
   * @private
   * @param {String} typeDimension 'xType' or 'yType'
   * @returns {String := time | linear | log | sqrt | pow | ordinal}
   */
  prototype._scaleTypeFor = function(typeDimension){
    var metrics, types;
    if (!(metrics = this.viewportMetrics())) {
      return null;
    }
    types = _(metrics).chain().invoke(typeDimension).compact().map(function(it){
      switch (it = it.toLowerCase()) {
      case 'linear':
      case 'log':
      case 'sqrt':
      case 'pow':
        return it;
      case 'int':
      case 'float':
      case 'number':
        return 'linear';
      case 'time':
      case 'date':
        return 'time';
      default:
        return 'ordinal';
      }
    }).uniq().value();
    if (types.length > 1) {
      throw new Error("Invalid Graph: Multiple scale types specified by children for " + typeDimension + "! " + JSON.stringify(types));
    }
    return types[0];
  };
  prototype.createScale = function(type, props){
    var scale, that, k, v;
    props == null && (props = {});
    if (!type) {
      return null;
    }
    props = _.extend({}, SCALE_DEFAULTS.ALL, SCALE_DEFAULTS[type] || {}, props);
    scale = (function(){
      switch (type) {
      case 'time':
        if (that = d3.time[props.interval]) {
          props.nice = that;
        }
        return d3.time.scale();
      case 'linear':
      case 'log':
      case 'sqrt':
      case 'pow':
        return d3.scale[type]();
      case 'ordinal':
        return d3.scale.ordinal();
      default:
        throw new Error("Unknown scale type " + type + "!");
      }
    }());
    for (k in props) {
      v = props[k];
      if (v != null) {
        if (typeof scale[k] == 'function') {
          scale[k](v);
        }
      }
    }
    return scale;
  };
  prototype.makeScaleShape = function(shape){
    var xScale, yScale, this$ = this;
    xScale = this.xScale();
    yScale = this.yScale();
    if (!(xScale && yScale)) {
      throw new Error("Cannot make scale shape '" + shape + "'! xScale=" + typeof xScale + "; yScale=" + typeof yScale);
    }
    switch (shape) {
    case 'area':
      return d3.svg.area().x(function(arg$, i){
        var date, val;
        date = arg$[0], val = arg$[1];
        return xScale(date);
      }).y1(function(arg$, i){
        var date, val;
        date = arg$[0], val = arg$[1];
        return yScale(val);
      }).y0(yScale.range()[0]).defined(function(arg$){
        var x, y;
        x = arg$[0], y = arg$[1];
        return isFinite(yScale(y));
      }).interpolate('linear');
    default:
      return d3.svg.line().x(function(arg$, i){
        var date, val;
        date = arg$[0], val = arg$[1];
        return xScale(date);
      }).y(function(arg$, i){
        var date, val;
        date = arg$[0], val = arg$[1];
        return yScale(val);
      }).defined(function(arg$){
        var x, y;
        x = arg$[0], y = arg$[1];
        return isFinite(yScale(y));
      }).interpolate('linear');
    }
  };
  prototype.isDataInView = function(arg$){
    var x, y, ref$, xMin, xMax, ref1$;
    x = arg$[0], y = arg$[1];
    ref$ = this.xDomain().map(toNumeric), xMin = ref$[0], xMax = ref$[1];
    return (xMin <= (ref1$ = +x) && ref1$ <= xMax) && isFinite(this.yScale()(y));
  };
  prototype.applyPadding = function(ext, p){
    var isDate, ref$, min, max;
    isDate = ext.map(function(it){
      return it instanceof Date;
    });
    ref$ = ext.map(toNumeric), min = ref$[0], max = ref$[1];
    min -= min * p;
    max += max * p;
    return [min, max].map(function(v, i){
      if (isDate[i]) {
        return new Date(v);
      } else {
        return v;
      }
    });
  };
  /* * * *  Rendering  * * * {{{ */
  /**
   * Element representing the frame where the content is held.
   * @type ko.observable<d3.selection>
   */
  prototype.contentFrameEl = ViewportNode.computed(function(){
    var el;
    if (!(el = this.el())) {
      return;
    }
    return d3.select(el);
  });
  /**
   * Element holding the content itself.
   * @type ko.observable<d3.selection>
   */
  prototype.contentViewportEl = ViewportNode.computed(function(){
    var frame;
    if (!(frame = this.contentFrameEl())) {
      return;
    }
    return d3.select($(frame.node()).find('.viewport:first')[0]);
  });
  /* * * *  Viewport Events  * * * {{{ */
  /**
   * Trigger recalculation of values that depend on window size.
   */
  prototype.resize = function(){
    if (this.el.peek()) {
      this._resizeProxy({});
      return true;
    } else {
      return false;
    }
  };
  /**
   * Observable used to recalculate on changes to window size.
   * 
   * @protected
   * @type ko.observable<Object>
   */
  prototype._resizeProxy = ko.observable({});
  /**
   * Zoom state.
   * @type ko.observable<Object>
   */
  prototype.zoomTransform = ko.observable({
    scale: [1.0, 1.0],
    sx: 1.0,
    sy: 1.0,
    translate: [0.0, 0.0],
    tx: 0.0,
    ty: 0.0
  });
  /**
   * @protected
   */
  prototype.updateZoomDomainsFromTransform = function(sx, sy, tx, ty){
    var xScale, yScale, ref$, xMin, xMax, x1, ref1$, yMin, yMax, y1;
    xScale = this.xScale.peek();
    yScale = this.yScale.peek();
    if (!(xScale && yScale)) {
      return;
    }
    ref$ = xScale.domain(), xMin = ref$[0], xMax = ref$[1];
    x1 = xScale.invert(-tx);
    this.xZoomScale.peek().domain([x1 - (xMax - xMin) / sx, x1]);
    ref1$ = yScale.domain(), yMin = ref1$[0], yMax = ref1$[1];
    y1 = yScale.invert(-ty);
    return this.yZoomScale.peek().domain([y1 - (yMax - yMin) / sy, y1]);
  };
  /**
   * @protected
   */
  prototype.updateZoomDomains = function(x0, y0, x1, y1){
    var xScale, yScale;
    xScale = this.xScale.peek();
    yScale = this.yScale.peek();
    if (!(xScale && yScale)) {
      return;
    }
    this.xZoomScale.peek().domain([xScale.invert(x0), xScale.invert(x1)]);
    return this.yZoomScale.peek().domain([yScale.invert(y0), yScale.invert(y1)]);
  };
  /**
   * Set the viewport zoom level.
   * 
   * @param {Number|Array<Number, Number>} scale Scaling transform `[sx, sy]`.
   * @param {Array<Number, Number>} [translate] Position transform, `[tx, ty]`.
   * @returns {ZoomTransform} Object of `{ scale, sx, sy, translate, tx, ty }`
   */
  prototype.zoom = function(scale, translate, noUpdateDomain){
    var oldZoom, tx, ty, sx, sy, newZoom;
    if (!_.isArray(scale)) {
      scale = [scale, scale];
    }
    oldZoom = this.zoomTransform.peek();
    tx = translate[0], ty = translate[1];
    sx = scale[0], sy = scale[1];
    newZoom = {
      scale: scale,
      sx: sx,
      sy: sy,
      translate: translate,
      tx: tx,
      ty: ty
    };
    if (!_.isEqual(oldZoom, newZoom)) {
      if (!noUpdateDomain) {
        this.updateZoomDomainsFromTransform(sx, sy, tx, ty);
      }
      this.zoomTransform(newZoom);
      this.trigger('zoom-graph', (import$({}, newZoom)), this);
    }
    return this.zoomTransform.peek();
  };
  /**
   * Zoom the viewport into a particular screen region. Arguments are pixels.
   * 
   * Also accepts a 2D "extent" Array `[[x0,y0], [x1,y1]]` like the ones
   * supplied by `d3.svg.brush`.
   * 
   * @param {Number} x0
   * @param {Number} y0
   * @param {Number} x1
   * @param {Number} y1
   * @returns {ZoomTransform}
   */
  prototype.zoomToRegion = function(x0, y0, x1, y1, noUpdateDomain){
    var xScale, yScale, ref$, ref1$, ref2$, ref3$, ref4$, xMax, yMax, sx, sy;
    xScale = this.xScale.peek();
    yScale = this.yScale.peek();
    if (!(xScale && yScale)) {
      return;
    }
    if (_.isArray(x0)) {
      ref$ = x0, ref1$ = ref$[0], x0 = ref1$[0], y0 = ref1$[1], ref2$ = ref$[1], x1 = ref2$[0], y1 = ref2$[1];
    }
    if (x0 > x1) {
      ref3$ = [x1, x0], x0 = ref3$[0], x1 = ref3$[1];
    }
    if (y0 > y1) {
      ref4$ = [y1, y0], y0 = ref4$[0], y1 = ref4$[1];
    }
    if (!noUpdateDomain) {
      this.updateZoomDomains(x0, y0, x1, y1);
    }
    xMax = d3.max(xScale.range());
    yMax = d3.max(yScale.range());
    sx = xMax / (x1 - x0);
    sy = yMax / (y1 - y0);
    return this.zoom([sx, sy], [-x0, -y0], true);
  };
  /**
   * Zoom the viewport into a particular subset of data. Arguments should
   * be typed as per the data columns.
   * 
   * Also accepts a 2D "extent" Array `[[x0,y0], [x1,y1]]` like the ones
   * supplied by `d3.svg.brush`.
   * 
   * @param {xType} x0
   * @param {yType} y0
   * @param {xType} x1
   * @param {yType} y1
   * @returns {ZoomTransform}
   */
  prototype.zoomToData = function(x0, y0, x1, y1, noUpdateDomain){
    var ref$, ref1$, ref2$, ref3$, ref4$, xS, yS;
    if (_.isArray(x0)) {
      ref$ = x0, ref1$ = ref$[0], x0 = ref1$[0], y0 = ref1$[1], ref2$ = ref$[1], x1 = ref2$[0], y1 = ref2$[1];
    }
    if (x0 > x1) {
      ref3$ = [x1, x0], x0 = ref3$[0], x1 = ref3$[1];
    }
    if (y0 > y1) {
      ref4$ = [y1, y0], y0 = ref4$[0], y1 = ref4$[1];
    }
    xS = this.xScale.peek();
    yS = this.yScale.peek();
    if (!(xS && yS)) {
      return;
    }
    if (!noUpdateDomain) {
      this.xZoomScale.peek().domain([x0, x1]);
      this.yZoomScale.peek().domain([y0, y1]);
    }
    return this.zoomToRegion(xS(x0), yS(y0), xS(x1), yS(y1), true);
  };
  /**
   * Reset the viewport zoom to normal (`1.0`) scaling, and 
   * no (`(0,0)`) translation.
   * 
   * @returns {ZoomTransform}
   */
  prototype.resetZoom = function(){
    this.xZoomScale.peek().domain(this.xScale.peek().domain());
    this.yZoomScale.peek().domain(this.yScale.peek().domain());
    return this.zoom([1.0, 1.0], [0, 0], true);
  };
  /**
   * Copies of the scales with domains updated to match the zoom level.
   * @type ko.observable<d3.scale>
   */
  prototype.xZoomScale = ViewportNode.computed(function(){
    var ref$;
    return (ref$ = this.xScale()) != null ? ref$.copy() : void 8;
  });
  prototype.yZoomScale = ViewportNode.computed(function(){
    var ref$;
    return (ref$ = this.yScale()) != null ? ref$.copy() : void 8;
  });
  /**
   * Update the content viewport's transform to match the zoom level.
   * @protected
   */
  prototype.watchZoom = ViewportNode.computed(function(){
    var ref$, sx, sy, tx, ty, el;
    ref$ = this.zoomTransform(), sx = ref$.sx, sy = ref$.sy, tx = ref$.tx, ty = ref$.ty;
    if (!(el = this.contentViewportEl())) {
      return;
    }
    return el.transition().attr('transform', "scale(" + sx + ", " + sy + "), translate(" + tx + ", " + ty + ")");
  });
  /* * * *  Watchers  * * * {{{ */
  prototype.watchDeps = function(){
    return this.allMetrics();
  };
  prototype.watchOthers = function(){
    this.xValues();
    this.xDomain();
    this.xScale();
    this.xZoomScale();
    this.yValues();
    this.yDomain();
    this.yScale();
    this.yZoomScale();
    return this.watchZoom();
  };
  /* * * *  Debugging Helpers  * * * {{{ */
  /**
   * Add a debugging dot to the viewport.
   * @private
   */
  prototype.dot = function(x, y, label, opts){
    opts == null && (opts = {});
    (this._dots || (this._dots = [])).push({
      x: x,
      y: y,
      label: label,
      opts: opts,
      r: opts.r || 3
    });
    return this.renderDots();
  };
  /**
   * Redraw the debugging dots.
   * @private
   */
  prototype.renderDots = function(){
    var colors, gDots, circles;
    colors = d3.scale.category10().range();
    gDots = d3.select(this.$('.frame > .fg')[0]).selectAll('g.dots');
    gDots.data([this]).enter().append('g').classed('dots', true);
    circles = gDots.selectAll('circle').data(this._dots, function(d, i){
      return i;
    }).enter().append('circle').attr({
      r: function(d){
        return d.r;
      },
      cx: function(d){
        return d.x;
      },
      cy: function(d){
        return d.y;
      }
    }).style('fill', function(d, i){
      return colors[i];
    }).append('title').text(function(arg$, i){
      var x, y, label;
      x = arg$.x, y = arg$.y, label = arg$.label;
      return ("[" + i + "] " + label + ": ") + fmtpair([x, y]);
    });
    return this._dots;
  };
  /**
   * Clear the debugging dots.
   * @private
   */
  prototype.clearDots = function(){
    this._dots = [];
    return this.renderDots();
  };
  return ViewportNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/node/index.js', function(require, module, exports, __dirname, __filename, undefined){

var node_mixin, graph_node, graph_node_data, group_node, canvas_node, child_node;
node_mixin = require('./node-mixin');
graph_node = require('./graph-node');
graph_node_data = require('./graph-node-data');
group_node = require('./group-node');
canvas_node = require('./canvas-node');
child_node = require('./child-node');
import$(import$(import$(import$(import$(import$(exports, node_mixin), graph_node), graph_node_data), group_node), canvas_node), child_node);
exports.Trait = require('./graph-node-trait');
exports.meta = require('./meta');
exports.vis = require('./vis');
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/node/meta/axis-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, moment, GraphNodeData, GraphNode, CanvasNode, Trait, timeFormat, multiTimeFormatter, log10, AxisNodeData, AxisNode;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
moment = require('moment');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
CanvasNode = require('../canvas-node').CanvasNode;
Trait = require('../graph-node-trait');
timeFormat = function(formats){
  return function(date){
    var i, f;
    i = formats.length - 1;
    f = formats[i];
    while (!f[1](date)) {
      f = formats[--i];
    }
    return f[0](date);
  };
};
multiTimeFormatter = timeFormat([
  [
    d3.time.format("%Y"), function(){
      return true;
    }
  ], [
    function(it){
      return moment(it).format('MMM');
    }, function(it){
      return it.getMonth();
    }
  ], [
    d3.time.format("%b %d"), function(it){
      return it.getDate() != 1;
    }
  ], [
    d3.time.format("%a %d"), function(it){
      return it.getDay() && it.getDate() != 1;
    }
  ], [
    d3.time.format("%I %p"), function(it){
      return it.getHours();
    }
  ], [
    d3.time.format("%I:%M"), function(it){
      return it.getMinutes();
    }
  ], [
    d3.time.format(":%S"), function(it){
      return it.getSeconds();
    }
  ], [
    d3.time.format(".%L"), function(it){
      return it.getMilliseconds();
    }
  ]
]);
log10 = function(x){
  var v, r;
  v = Math.log(x) / Math.LN10;
  if (Math.abs((r = Math.round(v)) - v) < 1e-6) {
    return r;
  } else {
    return v;
  }
};
/**
 * @class
 * @extends GraphNodeData
 */
exports.AxisNodeData = AxisNodeData = (function(superclass){
  AxisNodeData.displayName = 'AxisNodeData';
  var prototype = extend$(AxisNodeData, superclass).prototype, constructor = AxisNodeData;
  AxisNodeData.registerType('axis');
  prototype.defaults = function(){
    return {
      dimension: null,
      orient: null,
      options: {
        ticks: null,
        tickFormat: 'MMM YY',
        label: null,
        labelSize: 10,
        labelColor: '#666666',
        stroke: {
          width: 2,
          color: '#CACACA'
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function AxisNodeData(){
    superclass.apply(this, arguments);
  }
  return AxisNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.AxisNode = AxisNode = (function(superclass){
  AxisNode.displayName = 'AxisNode';
  var prototype = extend$(AxisNode, superclass).prototype, constructor = AxisNode;
  AxisNode.registerType('axis');
  prototype.traits = [Trait.META_NODE, Trait.FG_LAYER, Trait.SVG, Trait.LEAF];
  function AxisNode(){
    superclass.apply(this, arguments);
  }
  prototype.render = function(){
    var viewport, options, dim, scale, orient, ticks, label, axis, labelElement, tickValues, ref$;
    viewport = this.viewport();
    options = this.model().options();
    if (!viewport.zoomTransform()) {
      return;
    }
    if (!(dim = options.get('dimension'))) {
      return;
    }
    if (!(scale = viewport[dim + 'ZoomScale']())) {
      return;
    }
    this.sel.classed(dim + '-axis axis', true);
    orient = options.get('orient');
    ticks = options.get('ticks');
    label = options.get('label');
    axis = d3.svg.axis().scale(scale);
    this.$el.find('text.label').remove();
    if (label) {
      labelElement = this.sel.append('text').classed('label', true).attr('text-anchor', 'end').attr('dy', '.75em').text(label);
    }
    switch (dim) {
    case 'x':
      axis.orient(orient || (orient = 'bottom'));
      ticks == null && (ticks = 10);
      if (viewport.xScaleType() === 'time') {
        axis.tickFormat(multiTimeFormatter).ticks(ticks);
      } else {
        axis.ticks(scale.domain());
      }
      if (labelElement != null) {
        labelElement.attr('x', viewport.viewportWidth() - 6).attr('y', -18);
      }
      break;
    case 'y':
      axis.tickFormat(this.numberFormatterFor(2)).orient(orient || (orient = 'left'));
      ticks == null && (ticks = 10);
      if (viewport.yScaleType() === 'log') {
        tickValues = scale.ticks();
        while (5 < (ref$ = tickValues.length) && ref$ > ticks + 2) {
          tickValues = tickValues.filter(fn$);
        }
      } else {
        tickValues = scale.ticks(ticks);
      }
      axis.tickValues(tickValues);
      if (labelElement != null) {
        labelElement.attr('transform', 'rotate(-90)').attr('y', 6);
      }
    }
    this.sel.call(axis);
    this.moveAxis();
    return axis;
    function fn$(v, i){
      var L, mod;
      L = tickValues.length;
      mod = Math.max(2, Math.round((L - 2) / (L - 2 - ticks)));
      return i == 0 || i == L - 1 || i % mod != 0;
    }
  };
  prototype.moveAxis = AxisNode.computed(function(){
    var el, height;
    if (!(el = this.el() && this.sel)) {
      return;
    }
    this.sel.attr('transform', '');
    if (this.model().get('options.dimension') !== 'x') {
      return;
    }
    height = this.viewport().viewportHeight();
    this.sel.attr('transform', "translate(0, " + height + ")");
    return height;
  });
  return AxisNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/callout-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, moment, GraphNodeData, GraphNode, Trait, CalloutNodeData, CalloutNode;
_ = require('underscore');
ko = require('knockout');
moment = require('moment');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.CalloutNodeData = CalloutNodeData = (function(superclass){
  CalloutNodeData.displayName = 'CalloutNodeData';
  var prototype = extend$(CalloutNodeData, superclass).prototype, constructor = CalloutNodeData;
  CalloutNodeData.registerType('callout');
  prototype.defaults = function(){
    return {
      metricRef: 0,
      target: 'latest',
      steps: ['1y', '1M'],
      options: {
        dateFormat: 'MMM YYYY',
        valueFormat: ',.2s',
        deltaPercent: true,
        colorDelta: true
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function CalloutNodeData(){
    superclass.apply(this, arguments);
  }
  return CalloutNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.CalloutNode = CalloutNode = (function(superclass){
  CalloutNode.displayName = 'CalloutNode';
  var prototype = extend$(CalloutNode, superclass).prototype, constructor = CalloutNode;
  CalloutNode.registerType('callout');
  prototype.traits = [Trait.CALLOUT_NODE, Trait.META_NODE, Trait.REQUIRES_METRIC_POINTER, Trait.METRIC_TIMESERIES, Trait.HTML, Trait.LEAF];
  prototype.tagName = 'section';
  prototype.template = 'callout-node';
  function CalloutNode(){
    superclass.apply(this, arguments);
  }
  prototype.buildElement = function(parentElement){
    this.el(parentElement);
    return this.renderView(parentElement);
  };
  prototype.metric = CalloutNode.computed(function(){
    var metrics, ref$, ref, ref1$;
    if (!(metrics = (ref$ = this.viewport()) != null ? ref$.allMetrics() : void 8)) {
      return;
    }
    if (typeof (ref = (ref1$ = this.model()) != null ? ref1$.metricRef() : void 8) !== 'number') {
      return;
    }
    return metrics[ref];
  });
  prototype.data = CalloutNode.computed(function(){
    var metric, ref$, data, i, ref1$, date, value, yet$, last_year, last_month;
    if (!(metric = this.metric())) {
      return;
    }
    if (!((ref$ = data = metric.data()) != null && ref$.length)) {
      return;
    }
    i = data.length;
    for (yet$ = true; --i > 0 && (ref1$ = data[i], date = ref1$[0], value = ref1$[1], ref1$);) {
      yet$ = false;
      if (value != null && isFinite(value)) {
        break;
      }
    } if (yet$) {
      return;
    }
    if (i < 12) {
      return;
    }
    last_year = data[i - 12];
    last_month = data[i - 1];
    return {
      step: '1mo',
      latest: {
        date: date,
        value: value
      },
      year: {
        dates: [last_year[0], date],
        value: [last_year[1], value],
        delta: value - last_year[1]
      },
      month: {
        dates: [last_month[0], date],
        value: [last_month[1], value],
        delta: value - last_month[1]
      }
    };
  });
  prototype.latestValue = CalloutNode.computed(function(){
    var data, ref$;
    if (!(data = (ref$ = this.data()) != null ? ref$.latest : void 8)) {
      return '';
    }
    return this.numberFormatter(data.value, 2, false).toString();
  });
  prototype.datesFor = function(span){
    var data, ref$;
    if (!(data = (ref$ = this.data()) != null ? ref$[span] : void 8)) {
      return '';
    }
    return _.map(data.dates, function(it){
      return moment(it).format('MMM YY');
    }).join(' &mdash; ');
  };
  prototype.valueFor = function(span){
    var data, ref$, frac;
    if (!(data = (ref$ = this.data()) != null ? ref$[span] : void 8)) {
      return '';
    }
    frac = 100 * data.delta / data.value[0];
    return frac.toFixed(2) + '%';
  };
  prototype.cssClassFor = function(span){
    var data, ref$;
    if (!(data = (ref$ = this.data()) != null ? ref$[span] : void 8)) {
      return '';
    }
    if (data.delta < 0) {
      return 'delta-negative';
    } else {
      return 'delta-positive';
    }
  };
  prototype.yearDates = CalloutNode.computed(function(){
    return this.datesFor('year');
  });
  prototype.yearValue = CalloutNode.computed(function(){
    return this.valueFor('year');
  });
  prototype.yearCssClass = CalloutNode.computed(function(){
    return this.cssClassFor('year');
  });
  prototype.monthDates = CalloutNode.computed(function(){
    return this.datesFor('month');
  });
  prototype.monthValue = CalloutNode.computed(function(){
    return this.valueFor('month');
  });
  prototype.monthCssClass = CalloutNode.computed(function(){
    return this.cssClassFor('month');
  });
  return CalloutNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/grid-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, GraphNodeData, GraphNode, CanvasNode, Trait, GridNodeData, GridNode;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
CanvasNode = require('../canvas-node').CanvasNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.GridNodeData = GridNodeData = (function(superclass){
  GridNodeData.displayName = 'GridNodeData';
  var prototype = extend$(GridNodeData, superclass).prototype, constructor = GridNodeData;
  GridNodeData.registerType('grid');
  prototype.defaults = function(){
    return {
      dimension: null,
      options: {
        ticks: 10,
        stroke: {
          width: 1,
          color: '#CACACA'
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function GridNodeData(){
    superclass.apply(this, arguments);
  }
  return GridNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.GridNode = GridNode = (function(superclass){
  GridNode.displayName = 'GridNode';
  var prototype = extend$(GridNode, superclass).prototype, constructor = GridNode;
  GridNode.registerType('grid');
  prototype.traits = [Trait.META_NODE, Trait.BG_LAYER, Trait.SVG, Trait.LEAF];
  function GridNode(){
    superclass.apply(this, arguments);
  }
  prototype.render = function(){
    var viewport, options, dim, scale, tickCount, ticks, size, enter, transition, gridLinesData;
    viewport = this.viewport();
    options = this.model().options();
    if (!viewport.zoomTransform()) {
      return;
    }
    if (!(dim = options.get('dimension'))) {
      return;
    }
    if (!(scale = viewport[dim + 'ZoomScale']())) {
      return;
    }
    if (!(tickCount = options.get('ticks'))) {
      return;
    }
    this.sel.classed(dim + '-grid', true);
    switch (dim) {
    case 'x':
      ticks = viewport.xScaleType() === 'time'
        ? scale.ticks(tickCount)
        : scale.domain();
      size = viewport.height();
      enter = {
        y1: -1 * size,
        y2: 2 * size
      };
      transition = {
        x1: scale,
        x2: scale
      };
      break;
    case 'y':
      ticks = scale.ticks(tickCount);
      size = viewport.width();
      enter = {
        x1: -1 * size,
        x2: 2 * size
      };
      transition = {
        y1: scale,
        y2: scale
      };
    }
    gridLinesData = this.sel.selectAll('line').data(ticks);
    gridLinesData.exit().remove();
    gridLinesData.enter().append('line').attr({
      'vector-effect': 'non-scaling-stroke'
    }).attr(enter);
    return gridLinesData.transition().attr(transition);
  };
  return GridNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/guide-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, moment, GraphNodeData, GraphNode, Trait, GuideNodeData, GuideNode;
_ = require('underscore');
ko = require('knockout');
moment = require('moment');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.GuideNodeData = GuideNodeData = (function(superclass){
  GuideNodeData.displayName = 'GuideNodeData';
  var prototype = extend$(GuideNodeData, superclass).prototype, constructor = GuideNodeData;
  GuideNodeData.registerType('guide');
  prototype.defaults = function(){
    return {
      dimension: null,
      options: {
        stroke: {
          width: 1,
          color: '#CACACA',
          opacity: 1
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function GuideNodeData(){
    superclass.apply(this, arguments);
  }
  return GuideNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.GuideNode = GuideNode = (function(superclass){
  GuideNode.displayName = 'GuideNode';
  var prototype = extend$(GuideNode, superclass).prototype, constructor = GuideNode;
  GuideNode.registerType('guide');
  prototype.traits = [Trait.META_NODE, Trait.BG_LAYER, Trait.SVG, Trait.LEAF];
  function GuideNode(){
    superclass.apply(this, arguments);
  }
  prototype.render = function(){
    var options, scales, dimension, this$ = this;
    options = this.model().options();
    if (!(scales = this.root().scalesIfValid())) {
      return;
    }
    if (!(dimension = options.get('dimension'))) {
      return;
    }
    if (this.line) {
      return;
    }
    this.line = this.sparent.append('line').attr({
      'pointer-events': 'none'
    });
    switch (dimension) {
    case 'x':
      this.line.classed('verticalGuide', true).attr({
        y1: 0,
        y2: this.root().height()
      });
      this.root().handle('hover-graph', this, function(xOffset){
        return this$.line.attr({
          x1: xOffset,
          x2: xOffset
        });
      });
      return this.root().handle('hover-out-graph', this, function(){
        return this$.line.attr({
          x1: 0,
          x2: 0
        });
      });
    }
  };
  return GuideNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/infobox-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, guidFor, OrderedMap, AttributesBase, GraphNodeData, GraphNode, Trait, InfoboxNodeData, InfoboxNode, InfoboxEntry;
_ = require('underscore');
ko = require('knockout');
ref$ = require('../../../util'), guidFor = ref$.guidFor, OrderedMap = ref$.OrderedMap;
AttributesBase = require('../../../base').AttributesBase;
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.InfoboxNodeData = InfoboxNodeData = (function(superclass){
  InfoboxNodeData.displayName = 'InfoboxNodeData';
  var prototype = extend$(InfoboxNodeData, superclass).prototype, constructor = InfoboxNodeData;
  InfoboxNodeData.registerType('infobox');
  prototype.defaults = function(){
    return {
      options: {}
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function InfoboxNodeData(){
    superclass.apply(this, arguments);
  }
  return InfoboxNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.InfoboxNode = InfoboxNode = (function(superclass){
  InfoboxNode.displayName = 'InfoboxNode';
  var prototype = extend$(InfoboxNode, superclass).prototype, constructor = InfoboxNode;
  InfoboxNode.registerType('infobox');
  prototype.traits = [Trait.META_NODE, Trait.FG_LAYER, Trait.REQUIRES_METRIC_POINTER, Trait.METRIC_GEO_FEATURE, Trait.HTML, Trait.LEAF];
  prototype.tagName = 'section';
  prototype.cssClass = function(){
    return superclass.prototype.cssClass.apply(this, arguments) + ' well span4';
  };
  prototype.template = 'infobox-node';
  /**
   * The `InfoboxEntry` cache.
   * @protected
   * @type OrderedMap<GraphNode, InfoboxEntry>
   */
  prototype.entryCache = null;
  /**
   * ID of the feature currently being hovered over.
   * @type ko.observable<String>
   */
  prototype.featureId = ko.observable(null);
  /**
   * @type ko.observable<String>
   */
  prototype.label = ko.observable(null);
  function InfoboxNode(){
    this.entryCache = new OrderedMap();
    superclass.apply(this, arguments);
    this.trackHover();
  }
  prototype.buildElement = function(parentElement){
    var el;
    el = superclass.prototype.buildElement.apply(this, arguments);
    return this.renderView(el);
  };
  prototype.mapNode = InfoboxNode.computed(function(){
    return this.findUpTraits(Trait.METRIC_GEO_MAP);
  });
  prototype.featureNodes = InfoboxNode.computedRequires('mapNode', function(mapNode){
    return mapNode.filterTraits([Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_GEO_FEATURE]);
  });
  prototype.entries = InfoboxNode.computedRequires('featureNodes', function(featureNodes){
    return featureNodes.filter(function(node){
      var ref$;
      return !(node.get('disabled') || ((ref$ = node.options()) != null && ref$.get('noLegend')));
    }).map(this.lookupEntry, this);
  });
  prototype.lookupEntry = function(node){
    var that, entry, destroySub, this$ = this;
    if (node == null) {
      return null;
    }
    if (that = this.entryCache.get(node)) {
      return that;
    }
    entry = new InfoboxEntry(this, node);
    this.entryCache.set(node, entry);
    destroySub = node.isDisposed.subscribe(function(isDisposed){
      var currentEntry;
      if (!isDisposed) {
        throw new Error("WTF! node.isDisposed false for " + node + "!");
      }
      currentEntry = this$.entryCache.get(node);
      if (currentEntry === entry) {
        this$.entryCache.remove(node);
      }
      return destroySub.dispose();
    });
    return entry;
  };
  prototype.trackHover = InfoboxNode.computedRequires('mapNode.features', function(features){
    var this$ = this;
    features.on('mouseover.infobox', function(d){
      var currentId, root, ref$, x, y, xMax, yMax, left, ref1$, top, ref2$;
      currentId = this$.featureId.peek();
      if (currentId === d.id) {
        return;
      }
      root = this$.root();
      ref$ = d3.mouse(root.el()), x = ref$[0], y = ref$[1];
      this$.label(d.properties.name);
      this$.featureId(d.id);
      xMax = root.width() - this$.$el.width() - 10;
      yMax = root.height() - this$.$el.height() - 10;
      left = (ref1$ = 0 > x ? 0 : x) < xMax ? ref1$ : xMax;
      top = (ref2$ = 0 > y ? 0 : y) < yMax ? ref2$ : yMax;
      return this$.$el.css({
        display: 'block',
        top: top,
        left: left
      });
    });
    return this.root().$el.on('mouseout', function(){
      this$.$el.hide();
      return this$.featureId(null);
    });
  });
  return InfoboxNode;
}(GraphNode));
/**
 * @class A row in the infobox, tracking a particular GeoFeautreNode's metric.
 * @extends AttributesBase
 */
exports.InfoboxEntry = InfoboxEntry = (function(superclass){
  InfoboxEntry.displayName = 'InfoboxEntry';
  var prototype = extend$(InfoboxEntry, superclass).prototype, constructor = InfoboxEntry;
  prototype.defaults = function(){
    return {
      value: null
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function InfoboxEntry(infobox, node){
    this.infobox = infobox;
    this.node = node;
    superclass.call(this, {});
    this.infoboxOptions = this.infobox.options;
    this.nodeOptions = this.node.options;
    this.valueFormatter();
    this.valueReady();
  }
  prototype.nodeId = InfoboxEntry.computed(function(){
    return guidFor(this.node);
  });
  prototype.dataById = InfoboxEntry.computedRequires('node.model.metric.dataById', function(it){
    return it;
  });
  prototype.label = InfoboxEntry.computedRequires('nodeOptions', function(nodeOptions){
    var ref$, ref1$, ref2$;
    return nodeOptions.get('label') || ((ref$ = this.node.model()) != null ? (ref1$ = ref$.metric()) != null ? (ref2$ = ref1$.yColumnDef()) != null ? ref2$.label() : void 8 : void 8 : void 8);
  });
  prototype.valueFormatter = InfoboxEntry.computedRequires('infoboxOptions', 'nodeOptions', function(infoboxOptions, nodeOptions){
    var valueFormat;
    valueFormat = infoboxOptions.get('valueFormat') || nodeOptions.get('valueFormat');
    return d3.format(valueFormat);
  });
  prototype.valueReady = InfoboxEntry.computed(function(){
    var featureId, dataById, valueFormatter, val;
    featureId = this.infobox.featureId();
    dataById = this.dataById();
    valueFormatter = this.valueFormatter();
    if (!(featureId != null && dataById != null && valueFormatter)) {
      return;
    }
    val = dataById[featureId];
    return this.value(val != null ? valueFormatter(val) : '-');
  });
  return InfoboxEntry;
}(AttributesBase));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/legend-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, moment, ref$, guidFor, formatters, OrderedMap, AttributesBase, GraphNodeData, GraphNode, Trait, LegendNodeData, LegendNode, LegendEntry;
_ = require('underscore');
ko = require('knockout');
moment = require('moment');
ref$ = require('../../../util'), guidFor = ref$.guidFor, formatters = ref$.formatters, OrderedMap = ref$.OrderedMap;
AttributesBase = require('../../../base').AttributesBase;
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.LegendNodeData = LegendNodeData = (function(superclass){
  LegendNodeData.displayName = 'LegendNodeData';
  var prototype = extend$(LegendNodeData, superclass).prototype, constructor = LegendNodeData;
  LegendNodeData.registerType('legend');
  prototype.defaults = function(){
    return {
      label: null,
      options: {
        dateFormat: 'MMM YYYY',
        valueFormat: ',.2s'
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function LegendNodeData(){
    superclass.apply(this, arguments);
  }
  return LegendNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.LegendNode = LegendNode = (function(superclass){
  LegendNode.displayName = 'LegendNode';
  var prototype = extend$(LegendNode, superclass).prototype, constructor = LegendNode;
  LegendNode.registerType('legend');
  prototype.traits = [Trait.SECTION, Trait.META_NODE, Trait.REQUIRES_METRIC_POINTER, Trait.METRIC_TIMESERIES, Trait.HTML, Trait.LEAF];
  prototype.tagName = 'section';
  prototype.template = 'legend-node';
  /**
   * The `LegendEntry` cache.
   * @protected
   * @type OrderedMap<GraphNode, LegendEntry>
   */
  prototype.entryCache = null;
  function LegendNode(){
    this.entryCache = new OrderedMap();
    superclass.apply(this, arguments);
    this.date = ko.observable();
  }
  prototype.buildElement = function(parentElement){
    var el;
    el = superclass.prototype.buildElement.apply(this, arguments);
    $(parentElement).prepend(el);
    return this.renderView(el);
  };
  prototype.nodes = LegendNode.computed(function(){
    return this.viewport().filterTraits([Trait.VIS_NODE, Trait.REQUIRES_METRIC]);
  });
  prototype.entries = LegendNode.computedRequires('nodes', function(nodes){
    var this$ = this;
    return nodes.filter(function(node){
      var ref$;
      return !((ref$ = node.options()) != null && ref$.get('noLegend'));
    }).map(function(node){
      return this$.lookupEntry(node);
    });
  });
  prototype.lookupEntry = function(node){
    var that, entry, destroySub, this$ = this;
    if (node == null) {
      return null;
    }
    if (that = this.entryCache.get(node)) {
      return that;
    }
    entry = new LegendEntry(this, node);
    this.entryCache.set(node, entry);
    destroySub = node.isDisposed.subscribe(function(isDisposed){
      var currentEntry;
      if (!isDisposed) {
        throw new Error("WTF! node.isDisposed false for " + node + "!");
      }
      currentEntry = this$.entryCache.get(node);
      if (currentEntry === entry) {
        this$.entryCache.remove(node);
      }
      return destroySub.dispose();
    });
    return entry;
  };
  prototype.dateFormatter = LegendNode.computedRequires('options', function(options){
    return this.dateFormatterFor(options.get('dateFormat'));
  });
  prototype.watchOthers = function(){
    return this.trackHover();
  };
  /**
   * Track hover events and change the legend date.  This can be used by legend entries.
   */
  prototype.trackHover = LegendNode.computed(function(){
    var viewport, invert, ref$, cursor;
    if (!(viewport = this.viewport())) {
      return;
    }
    if (!(invert = (ref$ = viewport.xScale()) != null ? ref$.invert : void 8)) {
      return;
    }
    if (!(cursor = this.root().cursor())) {
      return;
    }
    if (cursor.hovering) {
      return this.date(invert(cursor.x));
    }
  });
  return LegendNode;
}(GraphNode));
/**
 * @class
 * @extends AttributesBase
 */
exports.LegendEntry = LegendEntry = (function(superclass){
  LegendEntry.displayName = 'LegendEntry';
  var prototype = extend$(LegendEntry, superclass).prototype, constructor = LegendEntry;
  importAll$(prototype, arguments[1]);
  prototype.defaults = function(){
    return {
      value: null,
      date: null
    };
  };
  function LegendEntry(legend, node){
    this.legend = legend;
    this.node = node;
    superclass.call(this, {});
    this.legendOptions = this.legend.options;
    this.options = node.options, this.label = node.label, this.disabled = node.disabled;
    this.legend.date.subscribe(this.trackLegendDate, this);
  }
  /**
   * handle toggling of legend entries, bound with knockout
   */
  prototype.toggleVisibility = function(){
    if (!(this.node.disabled() || _.countBy(this.legend.entries(), function(it){
      return it.node.disabled();
    })['false'] > 1)) {
      return;
    }
    return this.node.options().set('disabled', !this.node.disabled());
  };
  prototype.trackLegendDate = function(newDate){
    var ref$, ref1$, ref2$, closest;
    if (!((ref$ = this.node) != null && ((ref1$ = ref$.metric()) != null && ((ref2$ = ref1$.data()) != null && ref2$.length)))) {
      return;
    }
    if (newDate) {
      closest = this.node.metric().findClosest(newDate);
      this.date(closest.date);
      this.value(this.valueFormatter()(closest.value));
      return this.legend.label(this.dateFormatter()(this.date()));
    }
  };
  prototype.nodeId = LegendEntry.computed(function(){
    return guidFor(this.node);
  });
  prototype.color = LegendEntry.computed(function(){
    if (this.disabled()) {
      return '#ddd';
    } else {
      return this.node.strokeColor();
    }
  });
  prototype.dateFormatter = LegendEntry.computedRequires('legendOptions', 'options', function(legendOptions, options){
    var dateFormat;
    dateFormat = legendOptions.get('dateFormat') || options.get('dateFormat');
    return this.dateFormatterFor(dateFormat);
  });
  prototype.valueFormatter = LegendEntry.computedRequires('legendOptions', 'options', function(legendOptions, options){
    var digits, abbrev, addWrapper;
    return this.numberFormatterHTMLFor(digits = 2, abbrev = true, addWrapper = false);
  });
  prototype.dateReady = LegendEntry.computedRequires('node.timeseriesData', 'dateFormatter', function(data, dateFormatter){
    var ref$, date, val;
    ref$ = _.last(data), date = ref$[0], val = ref$[1];
    return this.date(dateFormatter(date));
  });
  prototype.valueReady = LegendEntry.computedRequires('node.timeseriesData', 'valueFormatter', function(data, valueFormatter){
    var ref$, date, val;
    ref$ = _.last(data), date = ref$[0], val = ref$[1];
    return this.value(valueFormatter(val));
  });
  return LegendEntry;
}(AttributesBase, formatters));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/node/meta/scaling-node.js', function(require, module, exports, __dirname, __filename, undefined){

var GraphNodeData, ChildNode, Trait, ScalingNodeData, ScalingNode;
GraphNodeData = require('../graph-node-data').GraphNodeData;
ChildNode = require('../child-node').ChildNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.ScalingNodeData = ScalingNodeData = (function(superclass){
  ScalingNodeData.displayName = 'ScalingNodeData';
  var prototype = extend$(ScalingNodeData, superclass).prototype, constructor = ScalingNodeData;
  ScalingNodeData.registerType('scaling');
  prototype.defaults = function(){
    return {
      factor: 1
    };
  };
  prototype.attributeTypes = function(){};
  function ScalingNodeData(){
    superclass.apply(this, arguments);
  }
  return ScalingNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.ScalingNode = ScalingNode = (function(superclass){
  ScalingNode.displayName = 'ScalingNode';
  var prototype = extend$(ScalingNode, superclass).prototype, constructor = ScalingNode;
  ScalingNode.registerType('scaling');
  prototype.traits = [Trait.SECTION, Trait.META_NODE, Trait.HTML, Trait.LEAF];
  prototype.tagName = 'section';
  prototype.template = 'scaling-node';
  function ScalingNode(){
    superclass.apply(this, arguments);
  }
  return ScalingNode;
}(ChildNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/smooth-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, op, ko, moment, ref$, AggregationIterator, STOP_ITERATION, CONTINUE, GraphNodeData, ChildNode, Trait, SmoothNodeData, SmoothNode, SmoothingIterator;
_ = require('underscore');
op = require('operator');
ko = require('knockout');
moment = require('moment');
ref$ = require('../../../util/iterator'), AggregationIterator = ref$.AggregationIterator, STOP_ITERATION = ref$.STOP_ITERATION, CONTINUE = ref$.CONTINUE;
GraphNodeData = require('../graph-node-data').GraphNodeData;
ChildNode = require('../child-node').ChildNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.SmoothNodeData = SmoothNodeData = (function(superclass){
  SmoothNodeData.displayName = 'SmoothNodeData';
  var prototype = extend$(SmoothNodeData, superclass).prototype, constructor = SmoothNodeData;
  SmoothNodeData.registerType('smooth');
  prototype.defaults = function(){
    return {
      factor: 1
    };
  };
  prototype.attributeTypes = function(){};
  function SmoothNodeData(){
    superclass.apply(this, arguments);
  }
  return SmoothNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.SmoothNode = SmoothNode = (function(superclass){
  SmoothNode.displayName = 'SmoothNode';
  var prototype = extend$(SmoothNode, superclass).prototype, constructor = SmoothNode;
  SmoothNode.registerType('smooth');
  prototype.traits = [Trait.SECTION, Trait.META_NODE, Trait.HTML, Trait.LEAF];
  prototype.tagName = 'section';
  prototype.template = 'smooth-node';
  /**
   * @type SmoothingIterator
   */
  prototype.transform = null;
  function SmoothNode(){
    superclass.apply(this, arguments);
    this.transform = new SmoothingIterator(null, this.factor);
    this.smoothedNodes();
  }
  prototype.nodes = SmoothNode.computed(function(){
    return this.root().filterTraits([Trait.VIS_NODE, Trait.REQUIRES_METRIC]);
  });
  prototype.smoothedNodes = SmoothNode.computedRequires('nodes', function(nodes){
    var this$ = this;
    return nodes.filter(function(node){
      var ref$;
      return !(node.get('disabled') || ((ref$ = node.options()) != null && ref$.get('noLegend')));
    }).map(function(node){
      var transforms;
      transforms = node.metric().transforms();
      if (!_.contains(transforms, this$.transform)) {
        node.metric().transforms.push(this$.transform);
      }
      return node;
    });
  });
  return SmoothNode;
}(ChildNode));
/**
 * @class Iterator transform which aggregates values into `factor`-sized averages.
 * @extends AggregationIterator
 */
exports.SmoothingIterator = SmoothingIterator = (function(superclass){
  /**
   * @constructor
   * @param {ko.observable<Number>} factor Observable for the smoothing factor.
   */
  SmoothingIterator.displayName = 'SmoothingIterator';
  var prototype = extend$(SmoothingIterator, superclass).prototype, constructor = SmoothingIterator;
  function SmoothingIterator(iter, factor){
    var options, ref$;
    this.chunk = [];
    if (typeof factor === 'function') {
      options = {
        factor: factor
      };
    } else {
      ref$ = [factor.factor, factor], factor = ref$[0], options = ref$[1];
    }
    this.factor = factor;
    superclass.call(this, iter, options);
  }
  prototype.hasNext = function(){
    return this.iter.hasNext() || this.chunk.length > 0;
  };
  /**
   * Consume rows, queuing until we have enough to generate an average.
   */
  prototype.offer = function(row){
    if (row === STOP_ITERATION) {
      return this.flush();
    }
    this.chunk.push(row);
    this.isDate == null && (this.isDate = row.map(function(it){
      return it instanceof Date;
    }));
    if (this.chunk.length >= this.factor()) {
      return this.flush();
    }
    return CONTINUE;
  };
  /**
   * Consume up to `@factor` of the buffer.
   */
  prototype.flush = function(){
    var rows, avgs, i$, len$, row, idx, len1$, v;
    if (!(this.chunk.length > 0)) {
      return STOP_ITERATION;
    }
    rows = this.chunk.splice(0, this.factor());
    avgs = repeatArray$([0], rows[0].length);
    for (i$ = 0, len$ = rows.length; i$ < len$; ++i$) {
      row = rows[i$];
      for (idx = 0, len1$ = row.length; idx < len1$; ++idx) {
        v = row[idx];
        avgs[idx] += (+v) / rows.length;
      }
    }
    return avgs.map(this.coerce, this);
  };
  /**
   * Restore Date-type to data after interpolation.
   */
  prototype.coerce = function(v, idx){
    var ref$;
    if ((ref$ = this.isDate) != null && ref$[idx]) {
      return new Date(v);
    } else {
      return v;
    }
  };
  return SmoothingIterator;
}(AggregationIterator));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function repeatArray$(arr, n){
  for (var r = []; n > 0; (n >>= 1) && (arr = arr.concat(arr)))
    if (n & 1) r.push.apply(r, arr);
  return r;
}

});

;
require.define('/node_modules/limn/graph/node/meta/tweaks-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, op, ko, moment, ref$, GroupNode, GroupNodeData, Trait, TweaksNodeData, TweaksNode;
_ = require('underscore');
op = require('operator');
ko = require('knockout');
moment = require('moment');
ref$ = require('../group-node'), GroupNode = ref$.GroupNode, GroupNodeData = ref$.GroupNodeData;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GroupNodeData
 */
exports.TweaksNodeData = TweaksNodeData = (function(superclass){
  TweaksNodeData.displayName = 'TweaksNodeData';
  var prototype = extend$(TweaksNodeData, superclass).prototype, constructor = TweaksNodeData;
  TweaksNodeData.registerType('tweaks');
  prototype.defaults = function(){};
  prototype.attributeTypes = function(){};
  function TweaksNodeData(){
    superclass.apply(this, arguments);
  }
  return TweaksNodeData;
}(GroupNodeData));
/**
 * @class
 * @extends GroupNode
 */
exports.TweaksNode = TweaksNode = (function(superclass){
  TweaksNode.displayName = 'TweaksNode';
  var prototype = extend$(TweaksNode, superclass).prototype, constructor = TweaksNode;
  TweaksNode.registerType('tweaks');
  prototype.traits = [Trait.SECTION, Trait.META_NODE, Trait.HTML];
  prototype.tagName = 'section';
  prototype.template = 'tweaks-node';
  function TweaksNode(){
    superclass.apply(this, arguments);
  }
  prototype.toggleChildren = function(){
    return this.$el.find('.toggle-children').collapse('toggle');
  };
  prototype.buildElement = function(parentElement){
    var el;
    el = superclass.prototype.buildElement.apply(this, arguments);
    $(parentElement).prepend(el);
    return this.renderView(el);
  };
  return TweaksNode;
}(GroupNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/zoom-brush-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, moment, GraphNodeData, GraphNode, Trait, ZoomBrushNodeData, ZoomBrushNode, out$ = typeof exports != 'undefined' && exports || this;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
moment = require('moment');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
out$.ZoomBrushNodeData = ZoomBrushNodeData = (function(superclass){
  ZoomBrushNodeData.displayName = 'ZoomBrushNodeData';
  var prototype = extend$(ZoomBrushNodeData, superclass).prototype, constructor = ZoomBrushNodeData;
  ZoomBrushNodeData.registerType('zoom-brush');
  prototype.defaults = function(){
    return {
      options: {
        zoom: {
          allow: 'both',
          max: null
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function ZoomBrushNodeData(){
    superclass.apply(this, arguments);
  }
  return ZoomBrushNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
out$.ZoomBrushNode = ZoomBrushNode = (function(superclass){
  ZoomBrushNode.displayName = 'ZoomBrushNode';
  var prototype = extend$(ZoomBrushNode, superclass).prototype, constructor = ZoomBrushNode;
  prototype.__bind__ = ['onBrushEnd', 'onDoubleClick'];
  ZoomBrushNode.registerType('zoom-brush');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG, Trait.LEAF, Trait.FG_LAYER];
  function ZoomBrushNode(){
    superclass.apply(this, arguments);
  }
  prototype.render = function(){
    var viewport, xZoomScale, yZoomScale;
    if (!(viewport = this.viewport())) {
      return;
    }
    if (!(xZoomScale = viewport.xZoomScale())) {
      return;
    }
    if (!(yZoomScale = viewport.yZoomScale())) {
      return;
    }
    if (this.brush) {
      this.brush.x(xZoomScale).y(yZoomScale);
      this.sel.call(this.brush);
      return;
    }
    this.brush = d3.svg.brush().x(xZoomScale).y(yZoomScale).on('brushend', this.onBrushEnd);
    this.sel.call(this.brush);
    return this.sel.select('rect.background').attr('pointer-events', 'all').on('dblclick', this.onDoubleClick);
  };
  prototype.onBrushEnd = function(){
    var extent;
    extent = this.brush.extent();
    this.hideTrackingCircles();
    if (this.extentIsSignificant(extent)) {
      this.viewport().zoomToData(extent);
    }
    this.brush.clear();
    return this.sel.call(this.brush);
  };
  prototype.onDoubleClick = function(){
    var ref$;
    this.hideTrackingCircles();
    this.viewport().resetZoom();
    if (typeof window.getSelection == 'function') {
      window.getSelection().removeAllRanges();
    }
    return (ref$ = document.selection) != null ? ref$.empty() : void 8;
  };
  prototype.hideTrackingCircles = function(){
    return this.viewport().sel.selectAll('circle.tracking').attr({
      cx: -1000,
      cy: -1000
    });
  };
  prototype.extentIsSignificant = function(extent){
    var ref$, x0, y0, ref1$, x1, y1;
    ref$ = extent[0], x0 = ref$[0], y0 = ref$[1], ref1$ = extent[1], x1 = ref1$[0], y1 = ref1$[1];
    return x1 - x0 > 1000;
  };
  return ZoomBrushNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/zoom-pan-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, GraphNodeData, GraphNode, Trait, ZoomPanNodeData, ZoomPanNode, out$ = typeof exports != 'undefined' && exports || this;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
out$.ZoomPanNodeData = ZoomPanNodeData = (function(superclass){
  ZoomPanNodeData.displayName = 'ZoomPanNodeData';
  var prototype = extend$(ZoomPanNodeData, superclass).prototype, constructor = ZoomPanNodeData;
  ZoomPanNodeData.registerType('zoom-pan');
  prototype.defaults = function(){
    return {
      options: {
        zoom: {
          min: 1,
          max: 10
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function ZoomPanNodeData(){
    superclass.apply(this, arguments);
  }
  return ZoomPanNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
out$.ZoomPanNode = ZoomPanNode = (function(superclass){
  ZoomPanNode.displayName = 'ZoomPanNode';
  var prototype = extend$(ZoomPanNode, superclass).prototype, constructor = ZoomPanNode;
  prototype.__bind__ = ['onZoom'];
  ZoomPanNode.registerType('zoom-pan');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG, Trait.LEAF, Trait.BG_LAYER];
  prototype.tagName = 'svg:rect';
  function ZoomPanNode(){
    superclass.apply(this, arguments);
  }
  prototype.buildElement = function(){
    var el;
    el = superclass.prototype.buildElement.apply(this, arguments);
    this.sel.attr({
      width: '100%',
      height: '100%'
    }).style('fill-opacity', 0);
    return el;
  };
  prototype.render = function(){
    var viewport, xZoomScale, yZoomScale, frame, options;
    viewport = this.viewport();
    if (!(xZoomScale = viewport.xZoomScale())) {
      return;
    }
    if (!(yZoomScale = viewport.yZoomScale())) {
      return;
    }
    if (!(frame = viewport.contentFrameEl())) {
      return;
    }
    if (!(options = this.model().options())) {
      return;
    }
    this.behavior == null && (this.behavior = d3.behavior.zoom().on('zoom', this.onZoom));
    this.behavior.x(xZoomScale).y(yZoomScale).scaleExtent([options.get('zoom.min'), options.get('zoom.max')]);
    return frame.call(this.behavior);
  };
  prototype.onZoom = function(){
    var b, viewport, options, minZoom, maxZoom, scale;
    b = this.behavior;
    viewport = this.viewport();
    if (!viewport.contentViewportEl()) {
      return;
    }
    if (!(options = this.model().options())) {
      return;
    }
    minZoom = options.get('zoom.min');
    maxZoom = options.get('zoom.max');
    scale = b.scale();
    if (scale > maxZoom) {
      b.scale(maxZoom);
    }
    if (scale <= minZoom) {
      b.scale(minZoom);
      b.translate([0, 0]);
    }
    return viewport.zoom(b.scale(), b.translate());
  };
  return ZoomPanNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/meta/index.js', function(require, module, exports, __dirname, __filename, undefined){

var axis_node, callout_node, grid_node, guide_node, infobox_node, legend_node, tweaks_node, smooth_node, scaling_node, zoom_brush_node, zoom_pan_node;
axis_node = require('./axis-node');
callout_node = require('./callout-node');
grid_node = require('./grid-node');
guide_node = require('./guide-node');
infobox_node = require('./infobox-node');
legend_node = require('./legend-node');
tweaks_node = require('./tweaks-node');
smooth_node = require('./smooth-node');
scaling_node = require('./scaling-node');
zoom_brush_node = require('./zoom-brush-node');
zoom_pan_node = require('./zoom-pan-node');
import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(exports, axis_node), callout_node), grid_node), guide_node), infobox_node), legend_node), smooth_node), scaling_node), tweaks_node), zoom_brush_node), zoom_pan_node);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/graph/node/vis/annotation-group-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, GroupNode, GroupNodeData, Trait, AnnotationGroupNodeData, AnnotationGroupNode;
_ = require('underscore');
ko = require('knockout');
ref$ = require('../group-node'), GroupNode = ref$.GroupNode, GroupNodeData = ref$.GroupNodeData;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.AnnotationGroupNodeData = AnnotationGroupNodeData = (function(superclass){
  AnnotationGroupNodeData.displayName = 'AnnotationGroupNodeData';
  var prototype = extend$(AnnotationGroupNodeData, superclass).prototype, constructor = AnnotationGroupNodeData;
  AnnotationGroupNodeData.registerType('annotation-group');
  prototype.defaults = function(){};
  prototype.attributeTypes = function(){};
  function AnnotationGroupNodeData(){
    superclass.apply(this, arguments);
  }
  return AnnotationGroupNodeData;
}(GroupNodeData));
/**
 * @class
 * @extends GroupNode
 */
exports.AnnotationGroupNode = AnnotationGroupNode = (function(superclass){
  AnnotationGroupNode.displayName = 'AnnotationGroupNode';
  var prototype = extend$(AnnotationGroupNode, superclass).prototype, constructor = AnnotationGroupNode;
  AnnotationGroupNode.registerType('annotation-group');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG];
  function AnnotationGroupNode(){
    superclass.apply(this, arguments);
  }
  return AnnotationGroupNode;
}(GroupNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/annotation-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, GraphNodeData, GraphNode, Trait, AnnotationNodeData, AnnotationNode;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends GraphNodeData
 */
exports.AnnotationNodeData = AnnotationNodeData = (function(superclass){
  AnnotationNodeData.displayName = 'AnnotationNodeData';
  var prototype = extend$(AnnotationNodeData, superclass).prototype, constructor = AnnotationNodeData;
  AnnotationNodeData.registerType('annotation');
  prototype.defaults = function(){
    return {
      x: 0,
      y: 0,
      options: {
        label: null,
        desc: null,
        width: 16,
        height: 16
      }
    };
  };
  prototype.attributeTypes = function(){
    return {
      x: function(x){
        var ret;
        ret = new Date(x);
        if (ret == 'Invalid Date') {
          ret = x;
        }
        return ret;
      },
      y: parseInt
    };
  };
  function AnnotationNodeData(){
    superclass.apply(this, arguments);
  }
  return AnnotationNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.AnnotationNode = AnnotationNode = (function(superclass){
  AnnotationNode.displayName = 'AnnotationNode';
  var prototype = extend$(AnnotationNode, superclass).prototype, constructor = AnnotationNode;
  AnnotationNode.registerType('annotation');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG, Trait.LEAF];
  function AnnotationNode(){
    superclass.apply(this, arguments);
    this.trackHover();
  }
  prototype.trackHover = AnnotationNode.computed(function(){
    var cursor, dx, dy;
    if (!(cursor = this.root().cursor())) {
      return;
    }
    if (!(this.rect && this.popup)) {
      return;
    }
    if (cursor.hovering) {
      dx = Math.abs(cursor.x - this.rect.attr('x'));
      dy = Math.abs(cursor.y - this.rect.attr('y'));
      if (dx < this.options().width() && dy < this.options().height()) {
        this.rect.style('fill', 'black');
        return this.popup.style('visibility', 'visible');
      } else {
        this.rect.style('fill', 'white');
        return this.popup.style('visibility', 'hidden');
      }
    }
  });
  prototype.disabled = function(){
    return false;
  };
  /**
   * Update selection representing the SVG path element for the annotation.
   * @type ko.computed<d3.selection.update>
   */
  prototype.render = function(){
    var viewport, model, xScale, yScale, width, height, x, y, textLines, rectSize, this$ = this;
    viewport = this.viewport();
    if (!(model = this.model())) {
      return null;
    }
    if (!(xScale = viewport.xScale())) {
      return null;
    }
    if (!(yScale = viewport.yScale())) {
      return null;
    }
    if (this.disabled()) {
      return null;
    }
    width = model.options().width();
    height = model.options().height();
    if (!this.rect) {
      this.rect = this.sel.append('rect').classed('metric-annotation', true).style('fill', 'white').style('stroke', 'black').attr('width', width).attr('height', height);
      this.popup = this.sel.append('g').classed('metric-annotation-box', true).style('visibility', 'hidden');
      this.popup.append('rect').style('fill', '#fee').style('stroke', 'black');
      this.popup.append('text').style('text-anchor', 'left');
    }
    x = xScale(model.x()) - width / 2;
    y = yScale(model.y()) - height / 2;
    this.rect.transition().attr('x', x).attr('y', y);
    this.popup.selectAll('text').remove();
    textLines = this.note().split('\n');
    _.each(textLines, function(text, index){
      return this$.popup.append('text').text(text).transition().attr('x', x + width).attr('y', y + height + index * 16);
    });
    rectSize = this.popup.node().getBBox();
    return this.popup.select('rect').transition().attr('x', x).attr('y', y).attr('width', rectSize.width + width * 2).attr('height', textLines.length * 16 + height);
  };
  return AnnotationNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/bar-group-node.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ref$, SeriesGroupNode, SeriesGroupNodeData, Trait, BarGroupNodeData, BarGroupNode;
ko = require('knockout');
ref$ = require('./series-group-node'), SeriesGroupNode = ref$.SeriesGroupNode, SeriesGroupNodeData = ref$.SeriesGroupNodeData;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends SeriesGroupData
 */
exports.BarGroupNodeData = BarGroupNodeData = (function(superclass){
  BarGroupNodeData.displayName = 'BarGroupNodeData';
  var prototype = extend$(BarGroupNodeData, superclass).prototype, constructor = BarGroupNodeData;
  BarGroupNodeData.registerType('bar-group');
  prototype.defaults = function(){
    return {
      options: {
        palette: 'wmf_projects',
        scale: 'log',
        dateFormat: 'MMM YYYY',
        valueFormat: ',.2s',
        fill: null,
        fillOpacity: 1.0,
        stroke: {
          color: null,
          width: 0,
          pattern: 'solid',
          opacity: 1.0
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function BarGroupNodeData(){
    superclass.apply(this, arguments);
  }
  return BarGroupNodeData;
}(SeriesGroupNodeData));
/**
 * @class
 * @extends SeriesGroupNode
 */
exports.BarGroupNode = BarGroupNode = (function(superclass){
  BarGroupNode.displayName = 'BarGroupNode';
  var prototype = extend$(BarGroupNode, superclass).prototype, constructor = BarGroupNode;
  BarGroupNode.registerType('bar-group');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG];
  function BarGroupNode(){
    superclass.apply(this, arguments);
  }
  return BarGroupNode;
}(SeriesGroupNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/bar-node.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, d3, ref$, TimeseriesNode, TimeseriesNodeData, Trait, ProjectColors, validOr, BarNodeData, BarNode;
ko = require('knockout');
d3 = require('d3');
ref$ = require('./timeseries-node'), TimeseriesNode = ref$.TimeseriesNode, TimeseriesNodeData = ref$.TimeseriesNodeData;
Trait = require('../graph-node-trait');
ProjectColors = require('../../project-colors');
validOr = function(v, def){
  if (isFinite(v)) {
    return v;
  } else {
    return def;
  }
};
/**
 * @class
 * @extends TimeseriesNodeData
 */
exports.BarNodeData = BarNodeData = (function(superclass){
  BarNodeData.displayName = 'BarNodeData';
  var prototype = extend$(BarNodeData, superclass).prototype, constructor = BarNodeData;
  BarNodeData.registerType('bar');
  prototype.defaults = function(){
    return {
      options: {
        disabled: false,
        label: null,
        color: null,
        stroke: null,
        noLegend: false
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function BarNodeData(){
    superclass.apply(this, arguments);
  }
  return BarNodeData;
}(TimeseriesNodeData));
/**
 * @class
 * @extends TimeseriesNode
 */
exports.BarNode = BarNode = (function(superclass){
  BarNode.displayName = 'BarNode';
  var prototype = extend$(BarNode, superclass).prototype, constructor = BarNode;
  BarNode.registerType('bar');
  prototype.traits = [Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_CONTENT_DATA, Trait.SVG, Trait.LEAF];
  function BarNode(){
    superclass.apply(this, arguments);
  }
  prototype.paletteColor = BarNode.computedRequires('model.options', function(options){
    return ProjectColors.lookup(this.shortLabel(), options.get('palette'));
  });
  prototype.strokeColor = BarNode.computed(function(){
    return this.fillColor();
  });
  prototype.fillColor = BarNode.computedRequires('model.options', function(options){
    return (typeof options.fill == 'function' ? options.fill() : void 8) || this.paletteColor() || 'black';
  });
  prototype.color = BarNode.computed(function(){
    return this.fillColor();
  });
  prototype.disabled = BarNode.computedRequires('model.options', function(options){
    return (typeof options.disabled == 'function' ? options.disabled() : void 8) || false;
  });
  /**
   * Represent the data as the bar (SVG rectangle) height
   * @type ko.computed<d3.selection.update>
   */
  prototype.render = function(){
    var data, viewport, xScale, yScale, options, disabled, bar, barWidth, rect;
    data = this.timeseriesData();
    viewport = this.viewport();
    if (!(xScale = viewport.xScale())) {
      return;
    }
    if (!(yScale = viewport.yScale())) {
      return;
    }
    if (!(options = this.model().options())) {
      return;
    }
    disabled = this.disabled();
    this.parent().stack();
    bar = this.selectAll('rect.metric-bar').data(data);
    barWidth = this.parent().xBands().rangeBand();
    bar.exit().remove();
    rect = bar.enter().append('rect').classed('metric-bar', true).attr('vector-effect', 'non-scaling-stroke').style('stroke', this.strokeColor()).style('fill', this.fillColor()).style('visibility', disabled ? 'hidden' : 'visible').attr('width', barWidth);
    options.applyStyles(rect, ['fillOpacity', 'stroke.width', 'stroke.opacity', 'stroke.dashed']);
    bar.transition().attr('x', function(arg$){
      var x, y;
      x = arg$[0], y = arg$[1];
      return xScale(x) - barWidth / 2;
    }).attr('y', function(arg$){
      var x, y, y0;
      x = arg$[0], y = arg$[1], y0 = arg$[2] || 0;
      return yScale(y0 + validOr(y, 0));
    }).attr('height', function(arg$){
      var x, y, y0;
      x = arg$[0], y = arg$[1], y0 = arg$[2] || 0;
      if (disabled) {
        return 0;
      } else {
        return yScale(y0) - yScale(y0 + validOr(y, 0));
      }
    });
    return bar;
  };
  return BarNode;
}(TimeseriesNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/geo-feature-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, GraphNodeData, GraphNode, GeoFeatureMetric, Trait, ProjectColors, GeoFeatureNodeData, GeoFeatureNode;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
GeoFeatureMetric = require('../../../data/metric').GeoFeatureMetric;
Trait = require('../graph-node-trait');
ProjectColors = require('../../project-colors');
/**
 * @class
 * @extends GraphNodeData
 */
exports.GeoFeatureNodeData = GeoFeatureNodeData = (function(superclass){
  GeoFeatureNodeData.displayName = 'GeoFeatureNodeData';
  var prototype = extend$(GeoFeatureNodeData, superclass).prototype, constructor = GeoFeatureNodeData;
  GeoFeatureNodeData.registerType('geo-feature');
  /**
   * A GeoFeatureNode binds data to presentation options, like `fill` or
   * `stroke`, on each feature in the dataset. Option values should be an
   * Array, interpreted as the range for a scale used to transform the data
   * before setting the style property. The scale type can be controlled with
   * the `scale` option. If an option value is not an array, it is simply
   * set on every feature node.
   * 
   * Valid Bindable Options:
   *  - fill
   *  - fillOpacity
   *  - stroke
   *      - width
   *      - color
   *      - opacity
   * 
   */
  prototype.defaults = function(){
    return {
      options: {
        label: null,
        scale: 'linear',
        valueFormat: ',.2s'
      }
    };
  };
  prototype.attributeTypes = function(){
    return {
      metric: GeoFeatureMetric
    };
  };
  function GeoFeatureNodeData(){
    superclass.apply(this, arguments);
  }
  return GeoFeatureNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.GeoFeatureNode = GeoFeatureNode = (function(superclass){
  GeoFeatureNode.displayName = 'GeoFeatureNode';
  var prototype = extend$(GeoFeatureNode, superclass).prototype, constructor = GeoFeatureNode;
  GeoFeatureNode.registerType('geo-feature');
  prototype.traits = [Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_CONTENT_DATA, Trait.METRIC_GEO_FEATURE, Trait.SVG, Trait.LEAF];
  function GeoFeatureNode(){
    superclass.apply(this, arguments);
  }
  prototype.label = GeoFeatureNode.computedRequires('model.metric.yColumnDef', function(yColumnDef){
    return yColumnDef.label() || '(no label)';
  });
  prototype.render = function(){
    var metric, featureData, map, features, ref$, dataById, options, scaleType, extent, this$ = this;
    metric = this.model().metric();
    featureData = metric != null ? metric.data() : void 8;
    map = this.parent();
    features = map.features();
    map.featurePath();
    if (!(metric && featureData && (features != null && ((ref$ = features[0]) != null && ref$.length)))) {
      return;
    }
    if (!(dataById = metric.dataById())) {
      return;
    }
    options = this.options();
    scaleType = options.get('scale');
    if (!d3.scale[scaleType]) {
      throw Error("Unknown scale type '" + scaleType + "'!");
    }
    extent = d3.extent(_.pluck(featureData, 1));
    if (scaleType === 'log') {
      extent[0] = Math.max(1e-4, extent[0]);
    }
    return ['fill', 'fillOpacity', 'stroke.width', 'stroke.color', 'stroke.opacity'].forEach(function(opt){
      var val, style, optScale;
      if ((val = options.get(opt)) == null) {
        return;
      }
      style = _.str.dasherize(opt.replace(/\./g, '-'));
      if (style === 'stroke-color') {
        style = 'stroke';
      }
      if (!_.isArray(val)) {
        return features.style(style, val);
      } else {
        if (!(val.length > 1)) {
          return;
        }
        optScale = d3.scale[scaleType]().domain(extent).range(val);
        if (scaleType === 'pow') {
          optScale.exponent(options.get('scaleExponent') || 2);
        }
        return features.style(style, function(d){
          if (d.id in dataById) {
            return optScale(dataById[d.id]);
          } else {
            return d3.select(this).style(style);
          }
        });
      }
    });
  };
  return GeoFeatureNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/geo-map-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, ref$, GroupNode, GroupNodeData, ref1$, ViewportNodeData, ViewportNode, GeoMapMetric, Trait, ProjectColors, VALID_PROJECTIONS, GeoMapNodeData, GeoMapNode, out$ = typeof exports != 'undefined' && exports || this;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
ref$ = require('../group-node'), GroupNode = ref$.GroupNode, GroupNodeData = ref$.GroupNodeData;
ref1$ = require('../viewport-node'), ViewportNodeData = ref1$.ViewportNodeData, ViewportNode = ref1$.ViewportNode;
GeoMapMetric = require('../../../data/metric').GeoMapMetric;
Trait = require('../graph-node-trait');
ProjectColors = require('../../project-colors');
VALID_PROJECTIONS = ['albers', 'albersUsa', 'azimuthal', 'azimuthalEqualArea', 'azimuthalEquidistant', 'equirectangular', 'gnomonic', 'mercator', 'orthographic', 'stereographic'];
/**
 * @class
 * @extends ViewportNodeData
 */
out$.GeoMapNodeData = GeoMapNodeData = (function(superclass){
  GeoMapNodeData.displayName = 'GeoMapNodeData';
  var prototype = extend$(GeoMapNodeData, superclass).prototype, constructor = GeoMapNodeData;
  GeoMapNodeData.registerType('geo-map');
  function GeoMapNodeData(){
    superclass.apply(this, arguments);
  }
  prototype.defaults = function(){
    return {
      width: null,
      height: null,
      options: {
        projection: 'mercator',
        featuresColor: '#FFFFFF',
        backgroundColor: '#BFBFBF'
      },
      x: {
        scaleType: 'linear',
        padding: 0
      },
      y: {
        scaleType: 'linear',
        padding: 0
      }
    };
  };
  prototype.attributeTypes = function(){
    return {
      metric: GeoMapMetric
    };
  };
  /**
   * The d3 projection operator for this map.
   * @type ko.computed<d3.geo.projection>
   */
  prototype.projectionOp = GeoMapNodeData.computedRequires('options.projection', function(proj){
    var projection;
    if (_.contains(VALID_PROJECTIONS, proj) && (projection = d3.geo[proj])) {
      return projection;
    }
    return null;
  });
  return GeoMapNodeData;
}(ViewportNodeData));
/**
 * @class
 * @extends ViewportNode
 */
out$.GeoMapNode = GeoMapNode = (function(superclass){
  GeoMapNode.displayName = 'GeoMapNode';
  var prototype = extend$(GeoMapNode, superclass).prototype, constructor = GeoMapNode;
  GeoMapNode.registerType('geo-map');
  prototype.traits = [Trait.VIEWPORT, Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_GEO_MAP, Trait.SVG];
  function GeoMapNode(){
    superclass.apply(this, arguments);
  }
  prototype.fullWidth = GeoMapNode.computed(function(){
    return this.root().fullWidth();
  });
  prototype.fullHeight = GeoMapNode.computed(function(){
    return this.root().fullHeight();
  });
  prototype.margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
  /**
   * Map features.
   * @type ko.observable<d3.selection>
   */
  prototype.features = ko.observable(null);
  /**
   * Observable used to recalculate feature properties (as the array's membership won't change).
   * @type ko.observable<Object>
   */
  prototype.featurePath = ko.observable({});
  prototype.buildElement = function(parentElement){
    var el;
    el = superclass.prototype.buildElement.apply(this, arguments);
    this.sel.append('svg:g').classed('viewport', true);
    return el;
  };
  prototype.determineDOMParentForChildNode = function(node){
    var nodeParentEl;
    nodeParentEl = superclass.prototype.determineDOMParentForChildNode.apply(this, arguments);
    if (this.el() === nodeParentEl) {
      nodeParentEl = this.contentViewportEl();
    }
    return nodeParentEl;
  };
  prototype.render = function(){
    var viewport, width, height, mapData, ref$, ref1$, el, options, d3Proj, bgColor, g, features, this$ = this;
    viewport = this.viewport();
    width = viewport.width();
    height = viewport.height();
    mapData = (ref$ = this.model()) != null ? (ref1$ = ref$.metric()) != null ? ref1$.data() : void 8 : void 8;
    el = this.contentViewportEl();
    if (!(width && mapData && el)) {
      return;
    }
    if (!(options = this.model().options())) {
      return;
    }
    if (!(d3Proj = this.model().projectionOp())) {
      return;
    }
    if (bgColor = options.get('backgroundColor')) {
      viewport.background(bgColor);
    }
    this.projection == null && (this.projection = d3Proj().scale(width).translate(viewport.center()));
    this.path == null && (this.path = d3.geo.path().projection(this.projection));
    g = el.selectAll('g.features').data([this]);
    g.enter().append('g').classed('features', true);
    features = g.selectAll('.feature').data(mapData.features);
    features.enter().append('path').classed('feature', true).attr('id', function(it){
      return this$.nodeId + "_" + it.id;
    }).attr('d', this.path).style('fill', options.get('featuresColor'));
    this.features(features);
    return this.featurePath({});
  };
  /**
   * Handle zooming the map projection instead of the viewport SVG node.
   */
  prototype.watchZoom = GeoMapNode.computed(function(){
    var viewport, features, ref$, scale, sx, sy, tx, ty, width, ref1$, cx, cy;
    viewport = this.viewport();
    features = this.features();
    ref$ = this.zoomTransform(), scale = ref$.scale, sx = ref$.sx, sy = ref$.sy, tx = ref$.tx, ty = ref$.ty;
    if (!(viewport && (features != null && features.length) && this.projection && this.path)) {
      return;
    }
    width = viewport.width();
    ref1$ = viewport.center(), cx = ref1$[0], cy = ref1$[1];
    this.projection.scale(width * d3.max(scale)).translate([cx * sx + tx, cy * sy + ty]);
    features.attr('d', this.path).style('fill', this.model().options().get('featuresColor'));
    return this.featurePath({});
  });
  return GeoMapNode;
}(ViewportNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/line-group-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, SeriesGroupNode, SeriesGroupNodeData, Trait, LineGroupNodeData, LineGroupNode;
_ = require('underscore');
ko = require('knockout');
ref$ = require('./series-group-node'), SeriesGroupNode = ref$.SeriesGroupNode, SeriesGroupNodeData = ref$.SeriesGroupNodeData;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends SeriesGroupNodeData
 */
exports.LineGroupNodeData = LineGroupNodeData = (function(superclass){
  LineGroupNodeData.displayName = 'LineGroupNodeData';
  var prototype = extend$(LineGroupNodeData, superclass).prototype, constructor = LineGroupNodeData;
  LineGroupNodeData.registerType('line-group');
  prototype.defaults = function(){
    return {
      options: {
        palette: 'wmf_projects',
        dateFormat: 'MMM YYYY',
        valueFormat: ',.2s',
        stroke: {
          color: null,
          width: 3,
          pattern: 'solid',
          opacity: 1
        },
        hoverPoints: {
          enabled: true,
          radius: 5,
          fill: null,
          fillOpacity: 1,
          stroke: {
            color: null,
            width: 0,
            pattern: 'solid',
            opacity: 1
          }
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function LineGroupNodeData(){
    superclass.apply(this, arguments);
  }
  return LineGroupNodeData;
}(SeriesGroupNodeData));
/**
 * @class
 * @extends SeriesGroupNode
 */
exports.LineGroupNode = LineGroupNode = (function(superclass){
  LineGroupNode.displayName = 'LineGroupNode';
  var prototype = extend$(LineGroupNode, superclass).prototype, constructor = LineGroupNode;
  LineGroupNode.registerType('line-group');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG];
  function LineGroupNode(){
    superclass.apply(this, arguments);
  }
  return LineGroupNode;
}(SeriesGroupNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/line-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, ref$, TimeseriesNode, TimeseriesNodeData, Trait, ProjectColors, LineNodeData, LineNode;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
ref$ = require('./timeseries-node'), TimeseriesNode = ref$.TimeseriesNode, TimeseriesNodeData = ref$.TimeseriesNodeData;
Trait = require('../graph-node-trait');
ProjectColors = require('../../project-colors');
/**
 * @class
 * @extends TimeseriesNodeData
 */
exports.LineNodeData = LineNodeData = (function(superclass){
  LineNodeData.displayName = 'LineNodeData';
  var prototype = extend$(LineNodeData, superclass).prototype, constructor = LineNodeData;
  LineNodeData.registerType('line');
  prototype.defaults = function(){
    return {
      options: {
        disabled: false,
        label: null,
        stroke: null,
        noLegend: false
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function LineNodeData(){
    superclass.apply(this, arguments);
  }
  return LineNodeData;
}(TimeseriesNodeData));
/**
 * @class
 * @extends TimeseriesNode
 */
exports.LineNode = LineNode = (function(superclass){
  LineNode.displayName = 'LineNode';
  var prototype = extend$(LineNode, superclass).prototype, constructor = LineNode;
  LineNode.registerType('line');
  prototype.traits = [Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_CONTENT_DATA, Trait.METRIC_TIMESERIES, Trait.SVG, Trait.LEAF];
  function LineNode(){
    superclass.apply(this, arguments);
    this.tooManyDataPoints = ko.observable(false);
    this.trackHover();
  }
  prototype.trackHover = LineNode.computed(function(){
    var viewport, cursor, metric, ref$, zoom, xScale, yScale, opts, rx, ry, cx, cy, color, date, closest;
    viewport = this.viewport();
    if (this.tooManyDataPoints()) {
      return;
    }
    if (!(cursor = this.root().cursor())) {
      return;
    }
    if (!(metric = this.model().metric())) {
      return;
    }
    if (!(((ref$ = metric.data()) != null && ref$.length) && this.el())) {
      return;
    }
    if (!(zoom = viewport.zoomTransform())) {
      return;
    }
    if (!(xScale = viewport.xScale())) {
      return;
    }
    if (!(yScale = viewport.yScale())) {
      return;
    }
    if (!(opts = this.model().options())) {
      return;
    }
    if (!opts.get('hoverPoints.enabled')) {
      return;
    }
    if (typeof xScale.invert !== 'function') {
      if (!(xScale.warned || (xScale.warned = {})).noInvert) {
        xScale.warned.noInvert = true;
        console.warn("[" + this.graph + "] Invalid Configuration: x-scale type '" + this.viewport().xScaleType() + "' is not compatible with 'options.hoverPoints.enabled'!");
      }
      return;
    }
    rx = opts.get('hoverPoints.radius') / zoom.scale[0];
    ry = opts.get('hoverPoints.radius') / zoom.scale[1];
    cx = cy = -1000;
    color = this.strokeColor();
    this.trackingCircle == null && (this.trackingCircle = this.sel.append('ellipse').classed('tracking', true));
    opts.applyShapeStyles(this.trackingCircle, 'hoverPoints.');
    this.trackingCircle.style({
      fill: opts.get('hoverPoints.fill') || color,
      stroke: opts.get('hoverPoints.stroke.color') || color
    });
    if (cursor.hovering && !this.disabled()) {
      date = xScale.invert(cursor.x);
      closest = metric.findClosest(date);
      cx = xScale(closest.date);
      cy = yScale(closest.value);
      if (!(isFinite(cx) && isFinite(cy))) {
        cx = cy = -1000;
      }
    }
    return this.trackingCircle.attr({
      rx: rx,
      ry: ry,
      cx: cx,
      cy: cy
    });
  });
  prototype.paletteColor = LineNode.computedRequires('model.options', function(options){
    return ProjectColors.lookup(this.shortLabel(), options.get('palette'));
  });
  prototype.strokeColor = LineNode.computedRequires('model.options', function(options){
    var ref$;
    return (typeof options.stroke == 'function' ? (ref$ = options.stroke()) != null ? ref$.color : void 8 : void 8) || this.paletteColor() || 'black';
  });
  prototype.width = LineNode.computedRequires('model.options', function(options){
    var stroke;
    stroke = options.get('stroke');
    return (typeof stroke.width == 'function' ? stroke.width() : void 8) || 3;
  });
  prototype.dasharray = LineNode.computedRequires('model.options', function(options){
    var ref$;
    return (typeof options.stroke == 'function' ? (ref$ = options.stroke()) != null ? typeof ref$.dashed == 'function' ? ref$.dashed() : void 8 : void 8 : void 8) || 'none';
  });
  prototype.disabled = LineNode.computedRequires('model.options', function(options){
    return (typeof options.disabled == 'function' ? options.disabled() : void 8) || false;
  });
  prototype.shape = LineNode.computedRequires('model.options', function(options){
    return options.get('shape') || 'line';
  });
  /**
   * Update selection representing the SVG path element for the line.
   * @type ko.computed<d3.selection.update>
   */
  prototype.render = function(){
    var viewport, data, that, model, xScale, color, line, xRange, path;
    viewport = this.viewport();
    data = (that = this.timeseriesData())
      ? [that]
      : [];
    if (!data.length) {
      return;
    }
    if (!(model = this.model())) {
      return;
    }
    if (!(xScale = viewport.xScale())) {
      return;
    }
    color = this.strokeColor();
    line = this.selectAll('path.metric-line').data(data);
    xRange = xScale.range();
    this.tooManyDataPoints(data[0].length > 2 * Math.abs(xRange[0] - xRange[1]));
    line.exit().remove();
    this.parent().stack();
    path = line.enter().append('path').classed('metric-line', true).attr('vector-effect', 'non-scaling-stroke').style('fill', 'none').style('stroke-dasharray', this.dasharray()).style('stroke-width', this.width()).style('stroke', color);
    if (this.shape() === 'area') {
      path.style('fill', color).style('opacity', 0.4);
    }
    line.style('visibility', this.disabled() ? "hidden" : "visible");
    line.transition().attr('d', viewport.makeScaleShape(this.shape()));
    return line;
  };
  return LineNode;
}(TimeseriesNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/ordinal-bar-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, d3, ref$, SeriesNode, SeriesNodeData, Metric, Trait, ProjectColors, OrdinalBarNodeData, OrdinalBarNode;
_ = require('underscore');
ko = require('knockout');
d3 = require('d3');
ref$ = require('./series-node'), SeriesNode = ref$.SeriesNode, SeriesNodeData = ref$.SeriesNodeData;
Metric = require('../../../data/metric').Metric;
Trait = require('../graph-node-trait');
ProjectColors = require('../../project-colors');
/**
 * @class
 * @extends SeriesNodeData
 */
exports.OrdinalBarNodeData = OrdinalBarNodeData = (function(superclass){
  OrdinalBarNodeData.displayName = 'OrdinalBarNodeData';
  var prototype = extend$(OrdinalBarNodeData, superclass).prototype, constructor = OrdinalBarNodeData;
  OrdinalBarNodeData.registerType('ordinal-bar');
  prototype.defaults = function(){
    return {
      options: {
        label: null,
        color: null,
        stroke: null,
        noLegend: false
      }
    };
  };
  prototype.attributeTypes = function(){
    return {
      metric: Metric
    };
  };
  function OrdinalBarNodeData(){
    superclass.apply(this, arguments);
  }
  return OrdinalBarNodeData;
}(SeriesNodeData));
/**
 * @class
 * @extends SeriesNode
 */
exports.OrdinalBarNode = OrdinalBarNode = (function(superclass){
  OrdinalBarNode.displayName = 'OrdinalBarNode';
  var prototype = extend$(OrdinalBarNode, superclass).prototype, constructor = OrdinalBarNode;
  OrdinalBarNode.registerType('ordinal-bar');
  prototype.traits = [Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_CONTENT_DATA, Trait.SVG, Trait.LEAF];
  function OrdinalBarNode(){
    superclass.apply(this, arguments);
  }
  prototype.color = OrdinalBarNode.computedRequires('model.options', function(options){
    var ref$;
    return ProjectColors.lookup(this.shortLabel(), this.palette()) || (typeof options.stroke == 'function' ? (ref$ = options.stroke()) != null ? ref$.color : void 8 : void 8) || 'black';
  });
  prototype.strokeColor = OrdinalBarNode.computedRequires('model.options', function(options){
    var ref$;
    return (typeof options.stroke == 'function' ? (ref$ = options.stroke()) != null ? ref$.color : void 8 : void 8) || this.paletteColor() || 'black';
  });
  prototype.width = OrdinalBarNode.computedRequires('model.options', function(options){
    var ref$;
    return (typeof options.stroke == 'function' ? (ref$ = options.stroke()) != null ? typeof ref$.width == 'function' ? ref$.width() : void 8 : void 8 : void 8) || 40;
  });
  /**
   * Represent the data as the bar (SVG rectangle) height
   * @type ko.computed<d3.selection.update>
   */
  prototype.render = function(){
    var viewport, data, that, bar, model, xScale, yScale, disabled;
    viewport = this.viewport();
    data = (that = this.seriesData())
      ? that[0]
      : [];
    bar = this.selectAll('rect.metric-bar').data(data);
    bar.exit().remove();
    if (!data.length) {
      return bar;
    }
    if (!(model = this.model())) {
      return null;
    }
    if (!(xScale = viewport.xScale())) {
      return;
    }
    if (!(yScale = viewport.yScale())) {
      return;
    }
    disabled = this.disabled();
    bar.enter().append('rect').classed('metric-bar', true).style('fill', this.color()).style('stroke', this.color()).attr('width', this.width());
    bar.style('visibility', disabled ? "hidden" : "visible");
    bar.transition().attr('height', function(d){
      if (disabled) {
        return 0;
      } else {
        return yScale.range()[0] - yScale(d);
      }
    }).attr('x', xScale(this.label()) - this.width() / 2).attr('y', yScale);
    return bar;
  };
  return OrdinalBarNode;
}(SeriesNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/scatterplot-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ref$, TimeseriesNode, TimeseriesNodeData, Trait, datumValid, validOr, ScatterplotNodeData, ScatterplotNode;
_ = require('underscore');
ref$ = require('./timeseries-node'), TimeseriesNode = ref$.TimeseriesNode, TimeseriesNodeData = ref$.TimeseriesNodeData;
Trait = require('../graph-node-trait');
datumValid = function(it){
  return _.every(it, isFinite);
};
validOr = function(v, def){
  if (isFinite(+v)) {
    return v;
  } else {
    return def;
  }
};
/**
 * @class
 * @extends TimeseriesNodeData
 */
exports.ScatterplotNodeData = ScatterplotNodeData = (function(superclass){
  ScatterplotNodeData.displayName = 'ScatterplotNodeData';
  var prototype = extend$(ScatterplotNodeData, superclass).prototype, constructor = ScatterplotNodeData;
  ScatterplotNodeData.registerType('scatterplot');
  prototype.defaults = function(){
    return {
      options: {
        label: null,
        noLegend: false,
        radius: 5.0,
        fill: null,
        fillOpacity: 1,
        stroke: {
          color: null,
          width: 0,
          pattern: 'solid',
          opacity: 1
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  function ScatterplotNodeData(){
    superclass.apply(this, arguments);
  }
  return ScatterplotNodeData;
}(TimeseriesNodeData));
/**
 * @class
 * @extends TimeseriesNode
 */
exports.ScatterplotNode = ScatterplotNode = (function(superclass){
  ScatterplotNode.displayName = 'ScatterplotNode';
  var prototype = extend$(ScatterplotNode, superclass).prototype, constructor = ScatterplotNode;
  ScatterplotNode.registerType('scatterplot');
  prototype.traits = [Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_CONTENT_DATA, Trait.SVG, Trait.LEAF];
  function ScatterplotNode(){
    superclass.apply(this, arguments);
  }
  prototype.fillColor = ScatterplotNode.computedRequires('model.options', function(options){
    return (typeof options.fill == 'function' ? options.fill() : void 8) || this.paletteColor() || 'black';
  });
  prototype.strokeColor = ScatterplotNode.computedRequires('model.options', function(options){
    var ref$;
    return (typeof options.stroke == 'function' ? (ref$ = options.stroke()) != null ? ref$.color : void 8 : void 8) || this.paletteColor() || 'black';
  });
  prototype.color = ScatterplotNode.computed(function(){
    return this.fillColor();
  });
  prototype.render = function(){
    var viewport, data, xScale, yScale, options, zoom, disabled, point, circle;
    viewport = this.viewport();
    if (!(data = this.seriesData()).length) {
      return;
    }
    if (!(xScale = viewport.xScale())) {
      return;
    }
    if (!(yScale = viewport.yScale())) {
      return;
    }
    if (!(options = this.model().options())) {
      return;
    }
    if (!(zoom = viewport.zoomTransform())) {
      return;
    }
    data = data.filter(datumValid);
    disabled = this.disabled();
    point = this.selectAll('ellipse.metric-point').data(data);
    point.exit().remove();
    circle = point.enter().append('ellipse').classed('metric-point', true).attr('vector-effect', 'non-scaling-stroke').style({
      stroke: this.strokeColor(),
      fill: this.fillColor(),
      visibility: disabled ? 'hidden' : 'visible'
    });
    options.applyStyles(circle, ['fillOpacity', 'stroke.width', 'stroke.opacity', 'stroke.dashed']);
    point.transition().attr({
      rx: options.get('radius') / zoom.scale[0],
      ry: options.get('radius') / zoom.scale[1],
      cx: function(arg$){
        var x, y;
        x = arg$[0], y = arg$[1];
        return xScale(x);
      },
      cy: function(arg$){
        var x, y;
        x = arg$[0], y = arg$[1];
        return yScale(y);
      }
    });
    return point;
  };
  return ScatterplotNode;
}(TimeseriesNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/series-group-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, op, ko, d3, ref$, GroupNode, GroupNodeData, Trait, getX, getY, setY0, SeriesGroupNodeData, SeriesGroupNode;
_ = require('underscore');
op = require('operator');
ko = require('knockout');
d3 = require('d3');
ref$ = require('../group-node'), GroupNode = ref$.GroupNode, GroupNodeData = ref$.GroupNodeData;
Trait = require('../graph-node-trait');
getX = function(it){
  return it[0];
};
getY = function(it){
  return it[1];
};
setY0 = function(d, y0, y){
  return d[2] = y0;
};
/**
 * @class
 * @extends GroupNodeData
 */
exports.SeriesGroupNodeData = SeriesGroupNodeData = (function(superclass){
  SeriesGroupNodeData.displayName = 'SeriesGroupNodeData';
  var prototype = extend$(SeriesGroupNodeData, superclass).prototype, constructor = SeriesGroupNodeData;
  SeriesGroupNodeData.registerType('series-group');
  prototype.defaults = function(){
    return {
      options: {
        palette: 'wmf_projects',
        stack: false,
        bands: {
          padding: 0.2,
          outerPadding: null
        }
      }
    };
  };
  prototype.attributeTypes = function(){
    return {};
  };
  prototype.canonicalize = function(data){
    var enabled, ref$, stackOpts;
    data == null && (data = {});
    enabled = (ref$ = data.options) != null ? ref$.stack : void 8;
    if (enabled == null || typeof enabled === 'boolean') {
      stackOpts = {
        enabled: enabled,
        offset: 'zero',
        order: 'default'
      };
      _.setNested(data, 'options.stack', stackOpts, {
        ensure: true
      });
    }
    return data;
  };
  function SeriesGroupNodeData(){
    superclass.apply(this, arguments);
  }
  return SeriesGroupNodeData;
}(GroupNodeData));
/**
 * @class
 * @extends GroupNode
 */
exports.SeriesGroupNode = SeriesGroupNode = (function(superclass){
  SeriesGroupNode.displayName = 'SeriesGroupNode';
  var prototype = extend$(SeriesGroupNode, superclass).prototype, constructor = SeriesGroupNode;
  SeriesGroupNode.registerType('series-group');
  prototype.traits = [Trait.VIS_NODE, Trait.SVG];
  function SeriesGroupNode(){
    superclass.apply(this, arguments);
  }
  prototype.stack = SeriesGroupNode.computed(function(){
    var stackOpts, children, stack;
    if (!(stackOpts = this.options().stack())) {
      return;
    }
    if (!(children = this.children()).length) {
      return;
    }
    if (!children.map(function(it){
      var ref$;
      return (ref$ = it.metric()) != null ? ref$.data() : void 8;
    }).reduce(op.and, true)) {
      return;
    }
    if (!stackOpts.enabled()) {
      return;
    }
    stack = d3.layout.stack().offset(stackOpts.offset()).order(stackOpts.order()).values(function(node){
      return node.metric().data();
    }).x(getX).y(getY).out(setY0);
    stack(children);
    return stack;
  });
  prototype.xBands = SeriesGroupNode.computed(function(){
    var viewport, bandOpts, xValues, xScale, pad, outerPad, ref$;
    if (!(viewport = this.viewport())) {
      return;
    }
    bandOpts = this.options().bands();
    xValues = viewport.xValues();
    xScale = viewport.xScale();
    if (!(xScale && xValues && bandOpts)) {
      return;
    }
    pad = bandOpts.padding();
    outerPad = (ref$ = bandOpts.outerPadding()) != null ? ref$ : pad;
    return d3.scale.ordinal().domain(xValues).rangeRoundBands(xScale.range(), pad, outerPad);
  });
  return SeriesGroupNode;
}(GroupNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/series-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, GraphNodeData, GraphNode, Metric, Trait, ProjectColors, SeriesNodeData, SeriesNode;
_ = require('underscore');
ko = require('knockout');
GraphNodeData = require('../graph-node-data').GraphNodeData;
GraphNode = require('../graph-node').GraphNode;
Metric = require('../../../data/metric').Metric;
Trait = require('../graph-node-trait');
ProjectColors = require('../../project-colors');
/**
 * @class
 * @extends GraphNodeData
 */
exports.SeriesNodeData = SeriesNodeData = (function(superclass){
  SeriesNodeData.displayName = 'SeriesNodeData';
  var prototype = extend$(SeriesNodeData, superclass).prototype, constructor = SeriesNodeData;
  SeriesNodeData.registerType('series');
  prototype.defaults = function(){
    return {
      metric: null
    };
  };
  prototype.attributeTypes = function(){
    return {
      metric: Metric
    };
  };
  function SeriesNodeData(){
    superclass.apply(this, arguments);
  }
  return SeriesNodeData;
}(GraphNodeData));
/**
 * @class
 * @extends GraphNode
 */
exports.SeriesNode = SeriesNode = (function(superclass){
  SeriesNode.displayName = 'SeriesNode';
  var prototype = extend$(SeriesNode, superclass).prototype, constructor = SeriesNode;
  SeriesNode.registerType('series');
  prototype.traits = [Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_CONTENT_DATA, Trait.SVG, Trait.LEAF];
  function SeriesNode(){
    superclass.apply(this, arguments);
  }
  /**
   * Materialized series data.
   * @type ko.computed<Array<[Index, Value]>>
   */
  prototype.seriesData = SeriesNode.computedRequires('model.metric', function(metric){
    return metric.data();
  });
  /**
   * Label determined from the following, in order
   *   options.label
   *   metric.defaultLabel
   *   '(no label)'
   * @type ko.computed<String>
   */
  prototype.shortLabel = SeriesNode.computedRequires('model.options', function(options){
    var ref$;
    return (typeof options.label == 'function' ? options.label() : void 8) || ((ref$ = this.model().metric()) != null ? ref$.defaultLabel() : void 8) || '(no label)';
  });
  /**
   * Label determined from the following, in order
   *   options.label
   *   metric.defaultLongLabel
   *   '(no label)'
   * @type ko.computed<String>
   */
  prototype.label = SeriesNode.computedRequires('model.options', function(options){
    var ref$;
    return (typeof options.label == 'function' ? options.label() : void 8) || ((ref$ = this.model().metric()) != null ? ref$.defaultLongLabel() : void 8) || '(no label)';
  });
  /**
   * Palette using defaults
   */
  prototype.palette = SeriesNode.computedRequires('model.options', function(options){
    return options.get('palette');
  });
  /**
   * @type ko.computed<String := hex color | rgb() color>
   */
  prototype.paletteColor = SeriesNode.computedRequires('model.options', function(options){
    return ProjectColors.lookup(this.shortLabel(), options.get('palette'));
  });
  return SeriesNode;
}(GraphNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/timeseries-node.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, SeriesNodeData, SeriesNode, TimeseriesMetric, Trait, TimeseriesNodeData, TimeseriesNode;
_ = require('underscore');
ko = require('knockout');
ref$ = require('./series-node'), SeriesNodeData = ref$.SeriesNodeData, SeriesNode = ref$.SeriesNode;
TimeseriesMetric = require('../../../data/metric').TimeseriesMetric;
Trait = require('../graph-node-trait');
/**
 * @class
 * @extends SeriesNodeData
 */
exports.TimeseriesNodeData = TimeseriesNodeData = (function(superclass){
  TimeseriesNodeData.displayName = 'TimeseriesNodeData';
  var prototype = extend$(TimeseriesNodeData, superclass).prototype, constructor = TimeseriesNodeData;
  TimeseriesNodeData.registerType('timeseries');
  prototype.defaults = function(){
    return {
      metric: null
    };
  };
  prototype.attributeTypes = function(){
    return {
      metric: TimeseriesMetric
    };
  };
  function TimeseriesNodeData(){
    superclass.apply(this, arguments);
  }
  return TimeseriesNodeData;
}(SeriesNodeData));
/**
 * @class
 * @extends SeriesNode
 */
exports.TimeseriesNode = TimeseriesNode = (function(superclass){
  TimeseriesNode.displayName = 'TimeseriesNode';
  var prototype = extend$(TimeseriesNode, superclass).prototype, constructor = TimeseriesNode;
  TimeseriesNode.registerType('timeseries');
  prototype.traits = [Trait.VIS_NODE, Trait.REQUIRES_METRIC, Trait.METRIC_CONTENT_DATA, Trait.METRIC_TIMESERIES, Trait.SVG, Trait.LEAF];
  function TimeseriesNode(){
    superclass.apply(this, arguments);
  }
  /**
   * Materialized timeseries data.
   * @type ko.computed<Array<[Date, Value]>>
   */
  prototype.timeseriesData = TimeseriesNode.computedRequires('model.metric', function(metric){
    return metric.data();
  });
  return TimeseriesNode;
}(SeriesNode));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/graph/node/vis/index.js', function(require, module, exports, __dirname, __filename, undefined){

var annotation_group_node, annotation_node, bar_group_node, bar_node, geo_feature_node, geo_map_node, line_group_node, line_node, ordinal_bar_node, scatterplot_node, series_group_node, series_node, timeseries_node;
annotation_group_node = require('./annotation-group-node');
annotation_node = require('./annotation-node');
bar_group_node = require('./bar-group-node');
bar_node = require('./bar-node');
geo_feature_node = require('./geo-feature-node');
geo_map_node = require('./geo-map-node');
line_group_node = require('./line-group-node');
line_node = require('./line-node');
ordinal_bar_node = require('./ordinal-bar-node');
scatterplot_node = require('./scatterplot-node');
series_group_node = require('./series-group-node');
series_node = require('./series-node');
timeseries_node = require('./timeseries-node');
import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(exports, annotation_group_node), annotation_node), bar_group_node), bar_node), geo_feature_node), geo_map_node), line_group_node), line_node), ordinal_bar_node), scatterplot_node), series_group_node), series_node), timeseries_node);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/template/templates.js', function(require, module, exports, __dirname, __filename, undefined){

var templates = exports = module.exports = [
	{"id":"dashboard-tab","path":"src/template/dashboard/dashboard-tab","text":"\n<section data-bind=\"if: okToShow\" class=\"dashboard-tab\">\n  <ol data-bind=\"foreach: { data:graphs, as:'graph' }\">\n    <li data-bind=\"subview: graph\">\n    </li>\n  </ol>\n</section>"},
	{"id":"dashboard","path":"src/template/dashboard/dashboard","text":"\n<section class=\"dashboard\">\n  <div class=\"page-header\">\n    <h1><span data-bind=\"text: model().headline\"></span> \n<small data-bind=\"visible: model().subhead, text: model().subhead\"></small>\n    </h1>\n  </div>\n  <div class=\"row\">\n    <div class=\"graphs tabbable\">\n      <nav>\n        <ul class=\"nav subnav nav-pills\">\n          <li>\n            <h3>Graphs\n            </h3>\n          </li>\n          <!-- ko foreach: { data:tabs, as:'tab' }-->\n          <li data-bind=\"css: tab.tabButtonCss\" class=\"tab-button\"><a data-toggle=\"tab\" data-bind=\"attr: { href:'#' + tabId() + '-graphs-tab' }, text: tab.model().name, click: $parent.updateActiveTab\"></a>\n          </li>\n          <!-- /ko-->\n        </ul>\n      </nav>\n      <div data-bind=\"foreach: { data:tabs, as:'tab' }\" class=\"tab-content\">\n        <div data-bind=\"attr: { id: tabId() + '-graphs-tab' }, css: tabPaneCss, subview: tab\" class=\"tab-pane\">\n        </div>\n      </div>\n    </div>\n  </div>\n</section>"},
	{"id":"datasources","path":"src/template/datasources","text":"\n<fieldset class=\"controlGroup\">\n  <legend data-toggle=\"collapse\" data-target=\"form.form-horizontal\" class=\"accordion-toggle\">Add New Data Source\n  </legend>\n  <form data-bind=\"submit: newDataSource, with: blankDataSource, css: { 'in': showAddForm, 'out': hideAddForm }\" class=\"form-horizontal collapse\">\n    <div class=\"control-group\">\n      <label for=\"type\" class=\"control-label\">Type of File\n      </label>\n      <div class=\"controls\">\n        <select id=\"type\" data-bind=\"value: type\" required=\"required\">\n          <option value=\"timeseries\">Timeseries\n          </option>\n          <option value=\"series\">Series\n          </option>\n          <option value=\"mobile_device_by_geo\">Special: Pivoted Geographical\n          </option>\n          <option value=\"umapi_timeseries\">Special: User Metrics API Timeseries\n          </option>\n        </select>\n      </div>\n      <div class=\"control-group\">\n        <label for=\"format\" class=\"control-label\">Format of Data\n        </label>\n        <div class=\"controls\">\n          <select id=\"format\" data-bind=\"value: format\" required=\"required\">\n            <option value=\"csv\">Comma Separated Values\n            </option>\n            <option value=\"tsv\">Tab Separated Values\n            </option>\n            <option value=\"json\">JSON\n            </option>\n            <option value=\"jsonp\">JSONp\n            </option>\n            <option value=\"xml\">XML\n            </option>\n          </select>\n        </div>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <label for=\"url\" class=\"control-label\">Datafile URL\n      </label>\n      <div class=\"controls\">\n        <input type=\"text\" id=\"url\" placeholder=\"relative or absolute url\" data-bind=\"value: url\" required=\"required\"/>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <label for=\"slug\" class=\"control-label\">Unique Id\n      </label>\n      <div class=\"controls\">\n        <input type=\"text\" id=\"slug\" placeholder=\"unique id: must_look_like_this\" data-bind=\"value: slug\" required=\"required\" pattern=\"^[a-z0-9_]+$\"/>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <label for=\"name\" class=\"control-label\">Name\n      </label>\n      <div class=\"controls\">\n        <input type=\"text\" id=\"name\" placeholder=\"name\" data-bind=\"value: name\" required=\"required\"/>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <label for=\"shortName\" class=\"control-label\">Short Name\n      </label>\n      <div class=\"controls\">\n        <input type=\"text\" id=\"shortName\" placeholder=\"short name\" data-bind=\"value: shortName\"/>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <h4>Metrics in Datafile\n      </h4><a data-bind=\"click: $parent.addMetric\" class=\"btn\">Add Metric</a>\n      <div data-bind=\"foreach: columns\" class=\"control-group\">\n        <div class=\"controls controls-row\"><span data-bind=\"text: $index\"></span>\n          <input type=\"text\" required=\"required\" placeholder=\"id\" data-bind=\"value: id()\" class=\"span1\"/>\n          <input type=\"text\" required=\"required\" placeholder=\"column heading\" data-bind=\"value: label()\" class=\"span3\"/>\n          <input type=\"text\" required=\"required\" placeholder=\"data type (int, Date, float)\" data-bind=\"value: type()\" class=\"span2\"/><a data-bind=\"click: $parents[1].removeMetricFrom($parent)\" class=\"btn\">Remove</a>\n        </div>\n      </div>\n    </div>\n    <div class=\"form-actions\">\n      <button type=\"submit\" class=\"btn btn-primary save\">Save\n      </button><span data-bind=\"text: $parent.message\" class=\"pull-right\"></span>\n    </div>\n  </form>\n</fieldset>\n<h3>Search Datasources\n</h3>\n<div class=\"navbar\">\n  <div class=\"navbar-inner\">\n    <div class=\"navbar-search\">\n      <input data-bind=\"value: filter\" placeholder=\"filter by id or name\" class=\"search-query datasourceSearch\"/>\n    </div>\n  </div>\n</div>\n<table class=\"table table-striped\">\n  <thead data-bind=\"if: model().length == 0\">\n    <tr>\n      <th>Loading all the datasources...\n      </th>\n    </tr>\n  </thead>\n  <tbody data-bind=\"foreach: filteredModel\">\n    <tr>\n      <td>\n        <div class=\"btn-group\">\n          <button data-bind=\"click: $parent.visualizeLineGraph\" class=\"btn\">Visualize\n          </button>\n          <button data-toggle=\"dropdown\" class=\"btn dropdown-toggle\"><span class=\"caret\"></span>\n          </button>\n          <ul class=\"dropdown-menu\">\n            <li><a href=\"#\" data-bind=\"click: $parent.visualizeLineGraph\">as Line Graph</a>\n            </li>\n            <li><a href=\"#\" data-bind=\"click: $parent.visualizeWorldMap\">as World Map</a>\n            </li>\n          </ul>\n        </div>\n      </td>\n      <td><span data-bind=\"text: id\"></span>\n      </td>\n      <td><span data-bind=\"text: name\"></span>\n      </td>\n    </tr>\n  </tbody>\n</table>\n<div data-backdrop=\"false\" data-bind=\"if: visualizeDialog\" class=\"limn-modal modal hide visualizeDialog\">\n  <div class=\"modal-header\">\n    <button data-dismiss=\"modal\" aria-hidden=\"true\" class=\"close\">&times;\n    </button>\n    <h3>Quick Peek\n    </h3>\n  </div>\n  <div class=\"modal-body\">\n    <section data-bind=\"subview: visualizeDialog\">\n    </section>\n  </div>\n  <div class=\"modal-footer\"><a data-dismiss=\"modal\" class=\"btn btn-primary\">Close</a>\n  </div>\n</div>"},
	{"id":"edit","path":"src/template/edit","text":"\n<fieldset>\n  <legend>\n  </legend>\n  <ol data-bind=\"foreach: editable\">\n    <li class=\"row-fluid\">\n      <label data-bind=\"text: text\" class=\"span4\">\n      </label>\n      <input data-bind=\"value: value\" class=\"span8\"/>\n    </li>\n  </ol>\n</fieldset>"},
	{"id":"graph-chart-only","path":"src/template/graph-chart-only","text":"\n<section data-bind=\"attr: { id:graphId }\" class=\"graph graph-display graph-display-chart-only\">\n  <div class=\"graph-chart-row row-fluid\">\n    <div class=\"inner\">\n    </div>\n  </div>\n</section>"},
	{"id":"graph-create","path":"src/template/graph-create","text":"\n<fieldset class=\"graph graph-create controlGroup\">\n  <legend>Create a Graph\n  </legend>\n  <form data-bind=\"submit: newGraph, with: blankGraph\" class=\"form-horizontal\">\n    <div class=\"control-group\">\n      <label for=\"slug\" class=\"control-label\">Unique Id\n      </label>\n      <div class=\"controls\">\n        <input type=\"text\" id=\"slug\" placeholder=\"unique id: must_look_like_this\" data-bind=\"value: slug\" required=\"required\" pattern=\"^[a-z0-9_]+$\"/>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <label for=\"name\" class=\"control-label\">Name\n      </label>\n      <div class=\"controls\">\n        <input type=\"text\" id=\"name\" placeholder=\"name\" data-bind=\"value: name\" required=\"required\"/>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <label for=\"desc\" class=\"control-label\">Description\n      </label>\n      <div class=\"controls\">\n        <textarea rows=\"3\" cols=\"50\" id=\"desc\" placeholder=\"description\" data-bind=\"value: desc\">\n        </textarea>\n      </div>\n    </div>\n    <div class=\"control-group\">\n      <label for=\"notes\" class=\"control-label\">Notes\n      </label>\n      <div class=\"controls\">\n        <textarea rows=\"3\" cols=\"50\" id=\"notes\" placeholder=\"notes\" data-bind=\"value: notes\">\n        </textarea>\n      </div>\n    </div>\n    <h4>Metrics in Graph\n    </h4>\n    <table data-bind=\"foreach: $parent.metrics\" class=\"table table-hover\">\n      <tr>\n        <td><span data-bind=\"text: ' ' + source.name() + ' - ' + label()\"></span>\n        </td>\n        <td><a data-bind=\"click: $parents[1].removeMetric($data)\" href=\"#\">(remove)</a>\n        </td>\n        <td><a data-bind=\"click: $parents[1].keepOnlyThisMetric($data)\" href=\"#\">(only)</a>\n        </td>\n      </tr>\n    </table>\n    <div class=\"form-actions\">\n      <button type=\"button\" data-bind=\"click: $parent.preview\" class=\"btn\">Preview\n      </button>\n      <button type=\"submit\" class=\"btn btn-primary save\">Save\n      </button><span data-bind=\"text: $parent.message\" class=\"pull-right\"></span>\n    </div>\n    <div data-bind=\"if: $parent.recentGraphs().length &gt; 0\" class=\"recent-graphs\">\n      <h4>Graphs Created in this Session\n      </h4>\n      <div data-bind=\"foreach: $parent.recentGraphs\" class=\"recent-graphs\">\n        <div><a data-bind=\"attr: {href: link}, text: name\" target=\"_blank\" class=\"not-client-side\"></a>\n          <button data-bind=\"click: $parents[1].deleteGraph\" class=\"btn btn-primary btn-mini\">delete\n          </button>\n        </div>\n      </div>\n    </div>\n  </form>\n  <div class=\"pick-datasources\">\n    <h3>Pick Datasources\n    </h3>\n    <div class=\"navbar\">\n      <div class=\"navbar-inner\">\n        <div class=\"navbar-search\">\n          <input data-bind=\"value: filter\" placeholder=\"filter by id or name\" class=\"search-query datasourceSearch\"/>\n          <select data-bind=\"value: datasourceType\" class=\"offset2\">\n            <option value=\"timeseries\">Timeseries\n            </option>\n            <option value=\"series\">Series\n            </option>\n          </select>\n        </div>\n      </div>\n    </div>\n    <table class=\"table table-striped\">\n      <thead data-bind=\"if: datasources().length == 0\">\n        <tr>\n          <th>Loading all the datasources...\n          </th>\n        </tr>\n      </thead>\n      <tbody data-bind=\"foreach: filteredDatasources\">\n        <tr>\n          <td>\n            <button data-bind=\"click: $parent.addDatasource($data), text: 'Add '+ (columns().length - 1) +' metrics'\" class=\"btn\">\n            </button>\n          </td>\n          <td><span data-bind=\"text: id\"></span>\n          </td>\n          <td><span data-bind=\"text: name\"></span>\n          </td>\n        </tr>\n      </tbody>\n    </table>\n  </div>\n</fieldset>\n<div data-backdrop=\"false\" data-bind=\"if: previewDialog\" class=\"limn-modal modal hide previewDialog\">\n  <div class=\"modal-header\">\n    <button data-dismiss=\"modal\" data-bind=\"click: cleanUpPreview\" aria-hidden=\"true\" class=\"close\">&times;\n    </button>\n  </div>\n  <div class=\"modal-body\">\n    <section data-bind=\"subview: previewDialog\">\n    </section>\n  </div>\n  <div class=\"modal-footer\"><a data-dismiss=\"modal\" data-bind=\"click: cleanUpPreview\" class=\"btn btn-primary\">Close</a>\n  </div>\n</div>"},
	{"id":"graph","path":"src/template/graph","text":"\n<section data-bind=\"attr: { id:graphId }\" class=\"graph graph-display\">\n  <div class=\"graph-name-row row-fluid\">\n    <section class=\"callout\">\n    </section>\n    <h2><a data-bind=\"text: model().name, attr: { href:model().link }, editable: 'input'\" class=\"graph-name\"></a>\n    </h2>\n  </div>\n  <div class=\"graph-chart-row row-fluid\">\n    <div class=\"inner\">\n    </div>\n  </div>\n  <div class=\"graph-details-row row\">\n    <div data-bind=\"markdown: model().desc, editable: 'textarea'\" class=\"span7 offset3 ug graph-desc\">\n    </div>\n  </div>\n  <div data-bind=\"if: model().permalink\" class=\"graph-links-row row\">\n    <div class=\"span6 offset3 ug graph-permalink\">\n      <input data-bind=\"attr: { value:model().permalink }\" readonly=\"readonly\" class=\"span6\"/>\n    </div>\n  </div>\n  <div class=\"graph-notes-row row\">\n    <div data-bind=\"markdown: model().notes, editable: 'textarea'\" class=\"span7 offset3 ug graph-notes\">\n    </div>\n  </div>\n  <div class=\"graph-raw-data-row row\">\n    <div class=\"span7 offset3 ug\">\n      <h4>Raw Data\n      </h4>\n      <ul data-bind=\"foreach: uniqueMetricDataLinks()\">\n        <li><a data-bind=\"text: $data, attr: {href: $data}\" target=\"_blank\"></a>\n        </li>\n      </ul>\n    </div>\n    <button data-bind=\"click: tabularize\" class=\"btn\">View Data as Table\n    </button><span class=\"hide-during-edit\">&nbsp;<a data-bind=\"attr: { href:model().link() + '/edit' }\" class=\"btn btn-primary\">Edit</a></span>\n    <button data-bind=\"click: save\" class=\"btn btn-primary hide show-during-edit\">Save\n    </button>\n  </div>\n  <div data-bind=\"if: metricDefs\" class=\"graph-metric-defs-row row\">\n    <div class=\"offset3 ug\">\n      <h4>Metric Definitions\n      </h4>\n      <dl data-bind=\"foreach: { data:metricDefs, as:&quot;ref&quot; }\" class=\"graph-metric-defs\">\n        <div data-bind=\"css: ref.cssClass\" class=\"graph-metric-def\">\n          <dt><a data-bind=\"text: ref.name, attr: { href:ref.url }\" class=\"metric-ref-name\"></a>\n          </dt>\n          <dd data-bind=\"markdown: ref.desc\" class=\"metric-ref-desc\">\n          </dd>\n        </div>\n      </dl>\n    </div>\n  </div>\n</section>\n<div data-backdrop=\"false\" data-bind=\"if: tabularizeDialog\" class=\"limn-modal modal hide tabularizeDialog\">\n  <div class=\"modal-header\">\n    <button data-dismiss=\"modal\" aria-hidden=\"true\" class=\"close\">&times;\n    </button>\n    <h2 data-bind=\"text: &quot;Data for &quot; + model().name()\">\n    </h2>\n  </div>\n  <div class=\"modal-body\">\n    <section data-bind=\"subview: tabularizeDialog\">\n    </section>\n  </div>\n  <div class=\"modal-footer\"><a data-dismiss=\"modal\" class=\"btn btn-primary\">Close</a>\n  </div>\n</div>"},
	{"id":"loading","path":"src/template/loading","text":"\n<div class=\"limn-loading\">\n</div>"},
	{"id":"message","path":"src/template/message","text":"\n<div data-bind=\"css: type() ? 'alert-' + type() : null\" class=\"alert\">\n  <button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;\n  </button>\n  <!-- ko if: icon--><i data-bind=\"css: icon\"></i>  \n\n  <!-- /ko-->\n  <!-- ko if: title--><strong data-bind=\"text: title\"></strong>  \n\n  <!-- /ko--><span data-bind=\"text: msg\" class=\"message\"></span>\n</div>"},
	{"id":"callout-node","path":"src/template/node/callout-node","text":"\n<div data-bind=\"text: latestValue\" class=\"latest-metric\">\n</div>\n<div class=\"metric-change year-over-year\"><span data-bind=\"html: yearDates\" class=\"dates\"></span><span data-bind=\"text: yearValue, css:yearCssClass\" class=\"value\"></span>\n</div>\n<div class=\"metric-change month-over-month\"><span data-bind=\"html: monthDates\" class=\"dates\"></span><span data-bind=\"text: monthValue, css:monthCssClass\" class=\"value\"></span>\n</div>"},
	{"id":"canvas-node","path":"src/template/node/canvas-node","text":"\n<section class=\"canvas-node viewport-node graph-node\">\n  <section class=\"meta fg\">\n  </section>\n  <section class=\"chart\">\n    <svg pointer-events=\"all\" data-bind=\"attr: { width:frameWidth, height:frameHeight }\">\n      <defs>\n        <clipPath data-bind=\"attr: { id:&quot;clip-&quot;+graphId }\">\n          <rect data-bind=\"attr: { width: clipWidth, height:clipHeight }\">\n          </rect>\n        </clipPath>\n        <g class=\"metricDefs\">\n        </g>\n      </defs>\n      <g data-bind=\"attr: { transform:&quot;translate(&quot;+margin.left+&quot;,&quot;+margin.top+&quot;)&quot; }\" class=\"margin-frame\">\n        <g class=\"frame\">\n          <g data-bind=\"attr: { &quot;clip-path&quot;:&quot;url(#clip-&quot;+graphId+&quot;)&quot; }\" class=\"content-frame\">\n            <g class=\"bg\">\n              <rect data-bind=\"attr: { width: clipWidth, height:clipHeight }\" class=\"bgcolor\">\n              </rect>\n            </g>\n            <g class=\"viewport\">\n            </g>\n          </g>\n          <g class=\"fg\">\n          </g>\n        </g>\n      </g>\n    </svg>\n  </section>\n  <section class=\"meta bg\">\n  </section>\n</section>"},
	{"id":"infobox-node","path":"src/template/node/infobox-node","text":"\n<h3 data-bind=\"visible: label, text: label\" class=\"infobox-label\">\n</h3>\n<table class=\"table\">\n  <tbody data-bind=\"foreach: { data:entries, as:'entry' }\">\n    <tr data-bind=\"attr: { id: 'infobox-entry-' + entry.nodeId() }\" class=\"infobox-entry\">\n      <td data-bind=\"text: entry.label\" class=\"entry-label\">\n      </td>\n      <td data-bind=\"text: entry.value\" class=\"entry-value\">\n      </td>\n    </tr>\n  </tbody>\n</table>"},
	{"id":"legend-node","path":"src/template/node/legend-node","text":"\n<fieldset>\n  <legend data-bind=\"visible: label, text: label\">\n  </legend>\n  <ul data-bind=\"foreach: { data:entries, as:'entry' }\">\n    <li data-bind=\"attr: { id:entry.nodeId }, click: toggleVisibility\" class=\"legend-entry\"><span data-bind=\"text: entry.label, style: { color: entry.color }\" class=\"entry-label\"></span><span data-bind=\"html: entry.value\" class=\"entry-value\"></span>\n    </li>\n  </ul>\n</fieldset>"},
	{"id":"scaling-node","path":"src/template/node/scaling-node","text":"\n<fieldset>\n  <legend>Change Scales\n  </legend>\n  <label for=\"scaling\" class=\"control-label\">Y Scale\n  </label>\n  <select id=\"scaling\" data-bind=\"value: root().model().y().scaleType\">\n    <option value=\"log\">Logarithmic\n    </option>\n    <option value=\"linear\">Linear\n    </option>\n  </select>\n</fieldset>"},
	{"id":"smooth-node","path":"src/template/node/smooth-node","text":"\n<fieldset>\n  <legend>Smooth\n  </legend><span>average&nbsp;</span>\n  <input type=\"number\" data-bind=\"value: factor\" min=\"1\" max=\"1000\"/><span>&nbsp;datapoint</span><span data-bind=\"if: factor() &gt; 1\">s</span>\n</fieldset>"},
	{"id":"tweaks-node","path":"src/template/node/tweaks-node","text":"<a data-toggle=\"collapse\" data-bind=\"click: toggleChildren\" title=\"tweak\" alt=\"tweak\" class=\"btn accordion-toggle\"><i class=\"icon-wrench\"></i></a>\n<div class=\"toggle-children collapse\">\n  <section class=\"children\">\n  </section>\n</div>"},
	{"id":"notFound","path":"src/template/notFound","text":"\n<p data-bind=\"text: message\">\n</p>"},
	{"id":"table","path":"src/template/table","text":"\n<section class=\"table-view\">\n  <div class=\"graph-chart-row row-fluid\">\n    <div class=\"inner\">\n      <table class=\"table table-striped\">\n        <thead>\n          <tr data-bind=\"foreach: tableColumns\">\n            <th data-bind=\"text: label\">\n            </th>\n          </tr>\n        </thead>\n        <tbody data-bind=\"foreach: { data:tableRows, as:'row' }\">\n          <tr data-bind=\"foreach: { data:row, as:'col' }\">\n            <td data-bind=\"html: col\">\n            </td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div>\n  <div class=\"graph-details-row row\">\n    <div data-bind=\"markdown: model().desc\" class=\"span7 offset3 ug graph-desc\">\n    </div>\n  </div>\n  <div class=\"graph-notes-row row\">\n    <div data-bind=\"markdown: model().notes\" class=\"span7 offset3 ug graph-notes\">\n    </div>\n  </div>\n</section>"}
];

});

;
require.define('/node_modules/limn/template/index.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, limn, insertTemplates, loadTemplate, onDomReady, out$ = typeof exports != 'undefined' && exports || this;
ko = require('knockout');
limn = require('limn');
/**
 * Create container and insert all known templates
 */
out$.insertTemplates = insertTemplates = function(){
  var $, templates, ex, container, i$, len$, ref$, id, text;
  $ = limn.$;
  if (!(limn.domReady() || $('#limn-templates')[0])) {
    return;
  }
  try {
    templates = require('./templates');
  } catch (e$) {
    ex = e$;
    console.error("Unable to load Limn templates!");
    return;
  }
  container = $('<div id="limn-templates" style="display: none;" />').appendTo($('body'));
  for (i$ = 0, len$ = templates.length; i$ < len$; ++i$) {
    ref$ = templates[i$], id = ref$.id, text = ref$.text;
    container.append($("<script class='limn-template' id='" + id + "' data-template-name='" + id + "' type='text/html'>\n" + text + "\n</script>"));
  }
  return container;
};
/**
 * Load a template on-demand.
 */
out$.loadTemplate = loadTemplate = function(id){};
onDomReady = ko.computed(function(){
  if (!limn.domReady()) {
    return;
  }
  insertTemplates();
  return onDomReady.dispose();
});

});

;
require.define('/node_modules/limn/util/crc.js', function(require, module, exports, __dirname, __filename, undefined){

var exports, utf8Encode, TABLE;
exports = module.exports = crc32;
function crc32(s, last_crc){
  var crc, i, to$, y, x;
  last_crc == null && (last_crc = 0);
  s = utf8Encode(s);
  crc = last_crc ^ -1;
  for (i = 0, to$ = s.length; i < to$; ++i) {
    y = (crc ^ s.charCodeAt(i)) & 0xFF;
    x = "0x" + TABLE.substr(y * 9, 8);
    crc = crc >>> 8 ^ x;
  }
  return crc ^ -1;
}
exports.crc32 = crc32;
utf8Encode = exports.utf8Encode = function(s){
  var u, n, to$, c;
  s = s.replace(/\r\n/g, '\n');
  u = '';
  for (n = 0, to$ = s.length; n < to$; ++n) {
    c = s.charCodeAt(n);
    if (c < 128) {
      u += String.fromCharCode(c);
    } else if (127 < c && c < 2048) {
      u += String.fromCharCode(c >> 6 | 192);
      u += String.fromCharCode((c & 63) | 128);
    } else {
      u += String.fromCharCode(c >> 12 | 224);
      u += String.fromCharCode((c >> 6 & 63) | 128);
      u += String.fromCharCode((c & 63) | 128);
    }
  }
  return u;
};
TABLE = '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 \nE0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE \n1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 \nFA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B \n35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A \nC8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 \n2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F \n9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 \n6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 \n8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 \n4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 \nAA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F \n5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 \n03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 \nE40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB \n196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 \nD6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C \n36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 \nCC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 \n2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 \n95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 \n68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C \n8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 \n4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 \nBDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 \n5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D';

});

;
require.define('/node_modules/limn/util/emitters.js', function(require, module, exports, __dirname, __filename, undefined){

var emitters, ref$, EventEmitter, ReadyEmitter, WaitingEmitter;
ref$ = emitters = require('emitters'), EventEmitter = ref$.EventEmitter, ReadyEmitter = ref$.ReadyEmitter, WaitingEmitter = ref$.WaitingEmitter;
EventEmitter.displayName || (EventEmitter.displayName = 'EventEmitter');
EventEmitter.decorate = function(target, methods){
  var EmitterClass, i$, len$, k;
  methods == null && (methods = []);
  EmitterClass = this;
  methods = methods.concat(['emit', 'trigger', 'on', 'off', 'addListener', 'removeListener', 'removeAllListeners', 'once', 'listeners']);
  for (i$ = 0, len$ = methods.length; i$ < len$; ++i$) {
    k = methods[i$];
    target[k] = EmitterClass.prototype[k];
  }
  return target;
};
ReadyEmitter.decorate = function(target){
  return EventEmitter.decorate.call(ReadyEmitter, target, ['__ready_event__', 'ready']);
};
WaitingEmitter.decorate = function(target){
  return EventEmitter.decorate.call(WaitingEmitter, target, ['waitingOn', 'wait', 'unwait', 'unwaitAnd']);
};
module.exports = emitters;

});

;
require.define('/node_modules/limn/util/formatters.js', function(require, module, exports, __dirname, __filename, undefined){

var moment, _, _fmt, exports;
moment = require('moment');
_ = require('./underscore');
_fmt = {
  /**
   * @param {String} pattern Date formatting pattern.
   * @returns {Function} Function that formats a date into the supplied pattern.
   */
  dateFormatterFor: function(pattern){
    return function(it){
      return moment(it).format(pattern);
    };
  }
  /**
   * Formats a number for display, first dividing by the greatest suffix
   *  of {B = Billions, M = Millions, K = Thousands} that results in a
   *  absolute value greater than 0, and then rounding to `digits` using
   *  `result.toFixed(digits)`.
   * 
   * @param {Number} n Number to format.
   * @param {Number} [digits=2] Number of digits after the decimal to always display.
   * @param {Boolean} [abbrev=true] Expand number suffixes if false.
   * @returns {Object} Formatted number parts.
   */,
  numberFormatter: function(n, digits, abbrev){
    var suffixes, i$, len$, ref$, suffix, d, s, parts, whole, fraction;
    digits == null && (digits = 2);
    abbrev == null && (abbrev = true);
    suffixes = abbrev
      ? [['B', 1000000000], ['M', 1000000], ['K', 1000], ['', NaN]]
      : [['Billion', 1000000000], ['Million', 1000000], ['', NaN]];
    for (i$ = 0, len$ = suffixes.length; i$ < len$; ++i$) {
      ref$ = suffixes[i$], suffix = ref$[0], d = ref$[1];
      if (isNaN(d)) {
        break;
      }
      if (n >= d) {
        n = n / d;
        break;
      }
    }
    s = n.toFixed(digits);
    parts = s.split('.');
    whole = _.rchop(parts[0], 3).join(',');
    fraction = parts[1];
    return {
      n: n,
      digits: digits,
      whole: whole,
      fraction: fraction,
      suffix: suffix,
      toString: function(){
        var fractionString;
        fractionString = this.fraction && parseInt(this.fraction) !== 0 ? "." + this.fraction : '';
        return this.whole + "" + fractionString + (abbrev ? '' : ' ') + this.suffix;
      }
    };
  },
  numberFormatterHTML: function(n, digits, addWrapper){
    var ref$, whole, fraction, suffix, value;
    digits == null && (digits = 2);
    addWrapper == null && (addWrapper = true);
    ref$ = this.numberFormatter(n, digits), whole = ref$.whole, fraction = ref$.fraction, suffix = ref$.suffix;
    value = "<span class='whole'>" + whole + "</span>";
    if (fraction) {
      value += ".<span class='fraction'>" + fraction + "</span>";
    }
    value += "<span class='suffix'>" + suffix + "</span>";
    if (addWrapper) {
      value = "<span class='value'>" + value + "</span>";
    }
    return value;
  },
  numberFormatterFor: function(digits, abbrev){
    var this$ = this;
    return function(it){
      return this$.numberFormatter(it, digits, abbrev);
    };
  },
  numberFormatterHTMLFor: function(digits, abbrev, addWrapper){
    var this$ = this;
    return function(it){
      return this$.numberFormatterHTML(it, digits, abbrev, addWrapper);
    };
  }
};
module.exports = exports = _fmt;

});

;
require.define('/node_modules/limn/util/guid.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * Generate unique IDs.
 * TODO: generateId, guidFor, and compareIds do not deal with *Globally* unique identifiers, they should be moved elsewhere
 */
var UUID, GUID_KEY, OBJ_PREFIX, NUMBER_CACHE, STRING_CACHE, generateId, guidFor, compareIds, out$ = typeof exports != 'undefined' && exports || this;
UUID = 0;
GUID_KEY = '__id__';
OBJ_PREFIX = 'limn';
NUMBER_CACHE = {};
STRING_CACHE = {};
out$.generateId = generateId = function(prefix){
  var id;
  prefix == null && (prefix = OBJ_PREFIX);
  id = UUID++;
  return prefix + "" + id;
};
out$.guidFor = guidFor = function(obj){
  if (obj === void 8) {
    return '(undefined)';
  }
  if (obj === null) {
    return '(null)';
  }
  switch (typeof obj) {
  case 'number':
    return NUMBER_CACHE[obj] || (NUMBER_CACHE[obj] = "nu" + obj);
  case 'string':
    return STRING_CACHE[obj] || (STRING_CACHE[obj] = "st" + UUID++);
  case 'boolean':
    return obj ? '(true)' : '(false)';
  }
  if (obj[GUID_KEY]) {
    return obj[GUID_KEY];
  }
  if (obj === Object) {
    return '(Object)';
  }
  if (obj === Array) {
    return '(Array)';
  }
  return obj[GUID_KEY] = OBJ_PREFIX + "" + UUID++;
};
out$.compareIds = compareIds = function(a, b){
  return guidFor(a) === guidFor(b);
};

});

;
require.define('/node_modules/limn/util/iterator.js', function(require, module, exports, __dirname, __filename, undefined){

var _, op, STOP_ITERATION, CONTINUE, Iterator, IndexIterator, ZipIterator, ComposableIterator, PipeIterator, AggregationIterator;
_ = require('underscore');
op = require('operator');
STOP_ITERATION = exports.STOP_ITERATION = {
  toString: function(){
    return 'STOP_ITERATION';
  }
};
CONTINUE = exports.CONTINUE = {
  toString: function(){
    return 'CONTINUE';
  }
};
/**
 * @class A stream Iterator, providing a typical iteration interface (`hasNext`, `next`).
 */
exports.Iterator = Iterator = (function(){
  Iterator.displayName = 'Iterator';
  var prototype = Iterator.prototype, constructor = Iterator;
  /**
   * Whether the stream is exhausted.
   * @type Boolean
   */
  prototype.exhausted = false;
  /**
   * Number of values returned.
   * @type Number
   */
  prototype.count = 0;
  /**
   * @constructor
   * @see Iterator#getNext
   * @see Iterator#hasNext
   * @param {Function} getNext Overrides Iterator#getNext()
   * @param {Function} [hasNext] Overrides Iterator#hasNext()
   */
  /**
   * @constructor
   * @see Iterator#getNext
   * @see Iterator#hasNext
   * @param {Object} [options={}] Options:
   * @param {Function} [options.getNext] Overrides Iterator#getNext()
   * @param {Function} [options.hasNext] Overrides Iterator#hasNext()
   */;
  function Iterator(options){
    var x0$, getNext, hasNext;
    options == null && (options = {});
    if (typeof options === 'function') {
      x0$ = arguments;
      options = {
        getNext: x0$[0],
        hasNext: x0$[1]
      };
    }
    this.options == null && (this.options = options);
    getNext = options.getNext, hasNext = options.hasNext;
    if (typeof getNext === 'function') {
      this.getNext = getNext;
    }
    if (typeof hasNext === 'function') {
      this.hasNext = hasNext;
    }
  }
  /**
   * Called to advance the iterator and fetch the next value, or
   * `STOP_ITERATION` to indicate the end of the stream.
   * 
   * @abstract
   * @protected
   * @returns {STOP_ITERATION|*}
   */
  prototype.getNext = function(){
    throw Error('unimplemented');
  };
  /**
   * Called to check whether the iterator is exhausted. Calls should not
   * mutate the iterator's state.
   * 
   * @returns {Boolean}
   */
  prototype.hasNext = function(){
    return !this.exhausted;
  };
  /**
   * Advance the iterator and return either `STOP_ITERATION` or the next
   * value.
   * 
   * Most implementers will not find it necessary to override this method;
   * see @{link getNext} and @{link hasNext} instead.
   * 
   * @see Iterator#getNext
   * @see Iterator#hasNext
   * @returns {STOP_ITERATION|*}
   */
  prototype.next = function(){
    var val;
    if (this.exhausted || (this.exhausted = !this.hasNext())) {
      return STOP_ITERATION;
    }
    if (!(this.exhausted = (val = this.getNext()) === STOP_ITERATION)) {
      this.count++;
    }
    return val;
  };
  /**
   * @abstract
   * @returns {Iterator} A copy of this iterator, with independent state.
   */
  prototype.clone = function(it){
    var IteratorClass;
    IteratorClass = this.constructor;
    it = new IteratorClass(import$({}, this.options));
    it.exhausted = this.exhausted;
    it.count = this.count;
    return it;
  };
  /**
   * Wrap this iterator in a `PipeIterator`, filtering and/or transforming each value with
   * the given `map` function before it is returned.
   * 
   * @param {Object} [options] Options:
   * @param {Function} [options.map] Function invoked to transform values.
   * @param {Function} [options.filter] Function invoked to filter values.
   * @returns {PipeIterator} Wrap this iterator in a `PipeIterator`,
   *  transforming each value before it is returned.
   */
  /**
   * Wrap this iterator in a `PipeIterator`, filtering and/or transforming each value with
   * the given `map` function before it is returned.
   * 
   * @param {Function} [map] Function invoked to transform values.
   * @param {Function} [filter] Function invoked to filter values.
   * @returns {PipeIterator} Wrap this iterator in a `PipeIterator`,
   *  transforming each value before it is returned.
   */
  prototype.pipe = function(options){
    var x0$;
    if (typeof options === 'function') {
      x0$ = arguments;
      options = {
        map: x0$[0],
        filter: x0$[1]
      };
    }
    return new PipeIterator(this, options);
  };
  /**
   * Connects the output of this iterator to the input of the given composable iterator.
   * 
   * @param {ComposableIterator} sink
   * @returns {ComposableIterator} The supplied composable iterator.
   */
  prototype.compose = function(sink){
    sink.iter = this;
    return sink;
  };
  /**
   * Exhausts the Iterator from its current position, returning an array of its values.
   * @returns {Array} The values.
   */
  prototype.toArray = function(){
    var out, val;
    out = [];
    while ((val = this.next()) !== STOP_ITERATION) {
      out.push(val);
    }
    return out;
  };
  prototype.toJSON = function(){
    return this.toArray();
  };
  prototype.toString = function(){
    var className, count, exhausted;
    className = this.constructor.displayName || this.constructor.name || 'Iterator';
    count = this.count, exhausted = this.exhausted;
    return className + "(exhausted=" + exhausted + ", count=" + count + ")";
  };
  return Iterator;
}());
/**
 * @class Iterator which sequentially walks an Indexable -- an object with numeric
 * properties and a `length` attribute -- including Arrays, but also Array-likes 
 * such as the Arguments object, or HTML NodeLists.
 * @extends Iterator
 */
exports.IndexIterator = IndexIterator = (function(superclass){
  IndexIterator.displayName = 'IndexIterator';
  var prototype = extend$(IndexIterator, superclass).prototype, constructor = IndexIterator;
  prototype.index = 0;
  prototype.start = 0;
  prototype.end = null;
  prototype.step = 1;
  /**
   * @constructor
   * @param {Array|Array-like} data Indexable data.
   * @param {Object} [options={}] Options:
   * @param {Number} [options.start=0]
   * @param {Number} [options.end=data.length]
   * @param {Number} [options.step=1]
   */;
  function IndexIterator(data, options){
    var ref$, ref1$, ref2$;
    this.data = data;
    this.options = options != null
      ? options
      : {};
    this.index = this.start;
    ref$ = this.options, this.start = (ref1$ = ref$.start) != null ? ref1$ : 0, this.end = ref$.end, this.step = (ref2$ = ref$.step) != null ? ref2$ : 1;
    superclass.call(this);
  }
  /**
   * Advances the iterator's index.
   * @returns {Number} Current index.
   */
  prototype.nextIndex = function(){
    var idx;
    idx = this.index;
    this.index += this.step;
    return idx;
  };
  prototype.getNext = function(){
    return this.data[this.nextIndex()];
  };
  prototype.hasNext = function(){
    var ref$;
    return this.index <= ((ref$ = this.end) != null
      ? ref$
      : this.data.length) - 1;
  };
  /**
   * @returns {Number} Iterator's length normalized against index iteration.
   */
  prototype.size = function(){
    var ref$;
    return (((ref$ = this.end) != null
      ? ref$
      : this.data.length) - 1 - this.start) / this.step | 0;
  };
  prototype.clone = function(it){
    var IteratorClass;
    IteratorClass = this.constructor;
    it = new IteratorClass(this.data, import$({}, this.options));
    it.exhausted = this.exhausted;
    it.index = this.index;
    it.count = this.count;
    return it;
  };
  prototype.toString = function(){
    var className, index, exhausted, start, end, step, count;
    className = this.constructor.displayName || this.constructor.name;
    index = this.index, exhausted = this.exhausted, start = this.start, end = this.end, step = this.step, count = this.count;
    return className + "(@" + index + ", exhausted=" + exhausted + ", start=" + start + ", end=" + end + ", step=" + step + ", count=" + count + ")";
  };
  return IndexIterator;
}(Iterator));
/**
 * @class IndexIterator that takes an array of many columns and zips
 * together the same index from each column to produce each value.
 * @extends IndexIterator
 */
exports.ZipIterator = ZipIterator = (function(superclass){
  ZipIterator.displayName = 'ZipIterator';
  var prototype = extend$(ZipIterator, superclass).prototype, constructor = ZipIterator;
  function ZipIterator(data){
    var end;
    end = _.max(_.pluck(data, 'length'));
    superclass.call(this, data, {
      start: 0,
      end: end,
      step: 1
    });
  }
  prototype.getNext = function(){
    return _.pluck(this.data, this.nextIndex());
  };
  return ZipIterator;
}(IndexIterator));
/**
 * @abstract
 * @class Wraps another Iterator.
 * @extends Iterator
 */
exports.ComposableIterator = ComposableIterator = (function(superclass){
  ComposableIterator.displayName = 'ComposableIterator';
  var prototype = extend$(ComposableIterator, superclass).prototype, constructor = ComposableIterator;
  function ComposableIterator(iter, options){
    var ref$;
    if (arguments.length < 2 && !(iter instanceof Iterator)) {
      ref$ = [iter || {}, null], options = ref$[0], iter = ref$[1];
    }
    this.iter = iter;
    this.options = options || {};
    superclass.call(this);
  }
  prototype.clone = function(it){
    var IteratorClass;
    IteratorClass = this.constructor;
    it = new IteratorClass(this.iter, import$({}, this.options));
    it.exhausted = this.exhausted;
    it.count = this.count;
    return it;
  };
  prototype.toString = function(){
    var className, exhausted, count, iter;
    className = this.constructor.displayName || this.constructor.name;
    exhausted = this.exhausted, count = this.count, iter = this.iter;
    return iter + "\n\t| " + className + "(exhausted=" + exhausted + ", count=" + count + ")";
  };
  return ComposableIterator;
}(Iterator));
/**
 * @class Iterator which wraps another, transforming each value with
 * the given `map` function before it is returned.
 * @extends Iterator
 */
exports.PipeIterator = PipeIterator = (function(superclass){
  PipeIterator.displayName = 'PipeIterator';
  var prototype = extend$(PipeIterator, superclass).prototype, constructor = PipeIterator;
  function PipeIterator(iter, options){
    var ref$, map, filter, context;
    superclass.apply(this, arguments);
    ref$ = this.options, map = ref$.map, filter = ref$.filter, context = ref$.context;
    if (typeof map === 'function') {
      this.map = map;
    }
    if (typeof filter === 'function') {
      this.filter = filter;
    }
    this.context = context || this;
  }
  /**
   * Override to transform values emitted by the underlying iterator before
   * passing them upstream.
   * 
   * Note this function will not be passed `STOP_ITERATION`, even when sent
   * by the backing iterator, however you may still return it to terminate
   * iteration.
   * 
   * @abstract
   * @param {*} val
   * @returns {STOP_ITERATION|*} Signal or transformed value.
   */
  prototype.map = function(val){
    return val;
  };
  /**
   * Invoked prior to transform to test whether a value should be
   * transformed and then included in the output stream.
   * 
   * @param {STOP_ITERATION|*} val Value provided by `getNext()`.
   * @returns {Boolean} Whether to include the value in the stream.
   */
  prototype.filter = function(val){
    return true;
  };
  prototype.getNext = function(){
    var val;
    val = STOP_ITERATION;
    while (this.hasNext()) {
      val = this.iter.next();
      if (val === STOP_ITERATION) {
        break;
      }
      if (this.filter.call(this.context, val)) {
        val = this.map.call(this.context, val);
        break;
      }
      val = STOP_ITERATION;
    }
    return val;
  };
  return PipeIterator;
}(ComposableIterator));
/**
 * @class Iterator which wraps another, offering values from the backing
 * stream until an aggregated value is produced. This allows streams to be
 * transformed into non-isometric forms.
 * @extends ComposableIterator
 */
exports.AggregationIterator = AggregationIterator = (function(superclass){
  /**
   * @constructor
   * @param {Iterator} iter Backing iterator.
   * @param {Object} [options={}] Options:
   * @param {Function} [options.offer] See AggregationIterator#offer()
   * @param {Object} [options.context=this] Function context for `offer`.
   */
  AggregationIterator.displayName = 'AggregationIterator';
  var prototype = extend$(AggregationIterator, superclass).prototype, constructor = AggregationIterator;
  function AggregationIterator(iter, options){
    var ref$, offer, context;
    superclass.apply(this, arguments);
    ref$ = this.options, offer = ref$.offer, context = ref$.context;
    if (typeof offer === 'function') {
      this.offer = offer;
    }
    this.context = context || this;
  }
  /**
   * Override to consider each value for aggregation, returning an aggregated
   * value or a signal to continue without emitting a value upstream (via
   * `CONTINUE`), or to indicate no further values (via `STOP_ITERATION`).
   * 
   * `HAS_NEXT` will be sent so the function may control the injection of
   * synthetic elements into the stream even once the backing iterator is
   * exhausted.
   * 
   * @abstract
   * @param {STOP_ITERATION|*} val
   * @param {Object} state State object for optionally tracking progress.
   * @returns {CONTINUE|STOP_ITERATION|*} An aggregated value, or a signal.
   */
  prototype.offer = function(val){
    return val;
  };
  prototype.getNext = function(){
    var val;
    val = STOP_ITERATION;
    while (this.hasNext()) {
      val = this.offer.call(this.context, this.iter.next());
      if (val !== CONTINUE) {
        break;
      }
    }
    return val;
  };
  return AggregationIterator;
}(ComposableIterator));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/util/markdown.js', function(require, module, exports, __dirname, __filename, undefined){

var Showdown, Markdown, render, exports, root, ref$;
Showdown = require('showdown');
Markdown = new Showdown.converter();
render = Markdown.render = function(s){
  return s && Markdown.makeHtml(s);
};
module.exports = exports = render;
exports.Markdown = Markdown;
exports.Showdown = Showdown;
root = function(){
  return this || eval('this');
}();
if ((ref$ = root.jQuery) != null) {
  ref$.fn.markdown = function(s){
    return $(this).append(render(s));
  };
}

});

;
require.define('/node_modules/limn/util/mixin.js', function(require, module, exports, __dirname, __filename, undefined){

var EventEmitter, ref$, generateId, guidFor, Mixin;
EventEmitter = require('emitters').EventEmitter;
ref$ = require('./guid'), generateId = ref$.generateId, guidFor = ref$.guidFor;
/**
 * @class Mixin base-class. Extend this to create a new mixin, attaching the
 *  donor methods as you would instance methods.
 *  
 *  To mingle your mixin with another class or object:
 *  
 *  class MyMixin extends Mixin
 *      foo: -> "foo!"
 *  
 *  # Mix into an object...
 *  o = MyMixin.mix { bar:1 }
 *  
 *  # Mix into a Coco class...
 *  class Bar
 *      MyMixin.mix this
 *      bar : 1
 *  
 */
exports.Mixin = Mixin = (function(){
  Mixin.displayName = 'Mixin';
  var prototype = Mixin.prototype, constructor = Mixin;
  import$(Mixin, EventEmitter.prototype);
  Mixin.__id__ = generateId();
  Mixin.__class__ = Mixin;
  Mixin.__super__ = null;
  Mixin.__superclass__ = null;
  /**
   * Mixes this mixin into the target. If `target` is not a class, a new
   * object will be returned which inherits from the mixin.
   * 
   * @static
   * @param {Class|Object} target Target for the mixin.
   * @returns {*} The target.
   */
  Mixin.mix = function(target){
    var MixinClass, TargetClass, k, ref$, v, ref1$, own$ = {}.hasOwnProperty;
    if (!target) {
      return that;
    }
    MixinClass = Mixin;
    if (this instanceof Mixin) {
      MixinClass = this.constructor;
    }
    if (this instanceof Function) {
      MixinClass = this;
    }
    MixinClass.trigger('before-mix', target, MixinClass);
    if (typeof target === 'function') {
      TargetClass = target;
      for (k in ref$ = MixinClass.prototype) {
        v = ref$[k];
        (ref1$ = TargetClass.prototype)[k] == null && (ref1$[k] = v);
      }
      for (k in MixinClass) if (own$.call(MixinClass, k)) {
        v = MixinClass[k];
        if (TargetClass[k] != null || EventEmitter.prototype[k] === v || ['mix', 'extended'].indexOf(k) >= 0) {
          continue;
        }
        TargetClass[k] = v;
      }
    } else {
      target = import$(new MixinClass(), target);
    }
    (target.__mixins__ || (target.__mixins__ = [])).push(MixinClass);
    MixinClass.trigger('mix', target, MixinClass);
    return target;
  };
  /**
   * Coco metaprogramming hook to propagate class properties and methods.
   */
  Mixin.extended = function(SubClass){
    var SuperClass, k, v, own$ = {}.hasOwnProperty;
    SuperClass = this;
    SubClass.__id__ = guidFor(this);
    for (k in SuperClass) if (own$.call(SuperClass, k)) {
      v = SuperClass[k];
      if (!SubClass[k]) {
        SubClass[k] = v;
      }
    }
    SubClass.__class__ = SubClass;
    SubClass.__super__ = SuperClass.prototype;
    SubClass.__superclass__ = SuperClass;
    if (typeof SuperClass.trigger == 'function') {
      SuperClass.trigger('extended', SubClass, SuperClass);
    }
    return SubClass;
  };
  function Mixin(){}
  return Mixin;
}());
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/query.js', function(require, module, exports, __dirname, __filename, undefined){

var _, op, moment, ref$, IndexIterator, ZipIterator, PipeIterator, DEFAULT_OPTIONS, Query, slice$ = [].slice;
_ = require('underscore');
op = require('operator');
moment = require('moment');
ref$ = require('./iterator'), IndexIterator = ref$.IndexIterator, ZipIterator = ref$.ZipIterator, PipeIterator = ref$.PipeIterator;
DEFAULT_OPTIONS = {
  materialize: 'rows',
  columns: null,
  timeStart: null,
  timeEnd: null,
  timeStep: null,
  timeCol: 0,
  transforms: null
};
exports.Query = Query = (function(){
  /* * * *  Fluent Options  * * * {{{ */
  /**
   * Generate fluent accessors for the query object.
   * @private
   */
  Query.displayName = 'Query';
  var prototype = Query.prototype, constructor = Query;
  Query.option = function(name, key, fn){
    var ref$;
    if (typeof key === 'function') {
      ref$ = [key, name], fn = ref$[0], key = ref$[1];
    }
    if (typeof fn !== 'function') {
      fn = op.I;
    }
    key == null && (key = name);
    return this.prototype[name] = function(){
      if (arguments.length === 0) {
        return this.options[key];
      }
      this.options[key] = fn.apply(this, arguments);
      return this;
    };
  };
  Query.option('materialize');
  Query.option('columns', function(){
    var indexes;
    indexes = slice$.call(arguments);
    return indexes;
  });
  Query.option('timeCol');
  Query.option('step', 'timeStep');
  prototype.timespan = function(start, end){
    if (arguments.length === 0) {
      return [this.options.timeStart, this.options.timeEnd];
    }
    if (start != null) {
      this.options.timeStart = moment(start).toDate();
    }
    if (end != null) {
      this.options.timeEnd = moment(end).toDate();
    }
    return this;
  };
  Query.option('transforms', function(it){
    return it.slice();
  });
  /**
   * Adds a single transform.
   * @returns {this}
   */
  prototype.transform = function(it){
    this.options.transforms.push(it);
    return this;
  };
  function Query(){
    var ref$;
    if (!(this instanceof Query)) {
      return new Query();
    }
    this.options = (ref$ = import$({}, DEFAULT_OPTIONS), ref$.transforms = [], ref$);
  }
  /**
   * Apply this query to the given data in column-major format.
   */
  prototype.processCols = function(){
    var cols;
    cols = slice$.call(arguments);
    return this._process(new ZipIterator(cols));
  };
  /**
   * Apply this query to the given data in row-major format.
   */
  prototype.process = function(rows){
    return this._process(new IndexIterator(rows));
  };
  /**
   * Executes the query on an iterator stream.
   * 
   * @private
   * @param {Iterator} iter Data iterator, formatting all items like rows.
   * @returns {Array<Array>} Processed data.
   */
  prototype._process = function(iter){
    var opts, timeCol, timeStart, ref$, timeEnd, ref1$, filterTime, pickCols, i$, ref2$, len$, tr, columns, materializeCols, rows;
    opts = import$({}, this.options);
    if (!(opts.timeStart == null && null == opts.timeEnd)) {
      timeCol = opts.timeCol || 0;
      timeStart = (ref$ = opts.timeStart) != null
        ? ref$
        : -Infinity;
      timeEnd = (ref1$ = opts.timeEnd) != null ? ref1$ : Infinity;
      timeStart = +timeStart;
      timeEnd = +timeEnd;
      filterTime = function(row){
        var v;
        v = +(row != null ? row[timeCol] : void 8);
        return timeStart <= v && v <= timeEnd;
      };
      iter = iter.pipe({
        filter: filterTime
      });
    }
    if (_.isArray(opts.columns)) {
      pickCols = function(row){
        return _.reduce(opts.columns, function(acc, col){
          var val;
          acc.push(val = row[col]);
          if (typeof col === 'string') {
            acc[col] = val;
          }
          return acc;
        }, []);
      };
      iter = iter.pipe({
        map: pickCols
      });
    }
    for (i$ = 0, len$ = (ref2$ = opts.transforms).length; i$ < len$; ++i$) {
      tr = ref2$[i$];
      iter = iter.compose(tr.clone());
    }
    if (opts.materialize !== 'rows') {
      columns = [];
      materializeCols = function(row){
        var idx, len$, val, col;
        for (idx = 0, len$ = row.length; idx < len$; ++idx) {
          val = row[idx];
          col = columns[idx] || (columns[idx] = []);
          col.push(val);
        }
        return row;
      };
      iter = iter.pipe({
        map: materializeCols
      });
    }
    if (opts.materialize === 'iter') {
      return iter;
    }
    rows = iter.toArray();
    switch (opts.materialize) {
    case 'both':
      return {
        rows: rows,
        columns: columns
      };
    case 'columns':
      return columns;
    default:
      return rows;
    }
  };
  return Query;
}());
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/type-cache.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, unwrap, peek, TypeCache;
_ = require('underscore');
ko = require('knockout');
ref$ = ko.utils, unwrap = ref$.unwrapObservable, peek = ref$.peekObservable;
/**
 * @class Tracks classes by some identifier, useful for mapping known subtypes.
 */
exports.TypeCache = TypeCache = (function(){
  TypeCache.displayName = 'TypeCache';
  var prototype = TypeCache.prototype, constructor = TypeCache;
  /**
   * Map holding the cached values.
   * @private
   * @type Map<id, Model>
   */
  prototype.cache = null;
  /**
   * @constructor
   * @param {String} [typeKey='type'] Key of the ID property to lookup on
   *  instances when an ID is not supplied.
   * @param {Object} [cache={}] Cache object to use.
   */;
  function TypeCache(typeKey, cache){
    this.typeKey = typeKey != null ? typeKey : 'type';
    this.cache = cache != null
      ? cache
      : {};
  }
  /**
   * @param {String|Class} id ID to test, or a class to extract an ID from.
   * @returns {Boolean} Whether the cache has an object at this ID.
   */
  prototype.has = function(id){
    var Subclass;
    if (typeof id === 'function') {
      Subclass = id;
      if (_.has(Subclass != null ? Subclass.prototype : void 8, this.typeKey)) {
        id = Subclass.prototype[this.typeKey];
      }
    }
    return id && this.cache[id];
  };
  /**
   * Register a new type. On subclasses of a root type, call this
   * method *after* setting their `typeKey`:
   * 
   *  cache = new TypeCache 'nodeType'
   *  class AnotherGraphNode extends GraphNode
   *      cache.add 'another', this
   *      -> super ...
   * 
   * @param {String|Class} [id] ID to cache Subclass under. If omitted, it
   *  will be inferred from the Subclass using `typeKey`.
   * @param {Class} Subclass Subclass to register.
   * @returns {Class} The Subclass.
   */
  prototype.add = function(id, Subclass){
    var ref$, ref1$;
    if (!Subclass && typeof id === 'function') {
      ref$ = [id, null], Subclass = ref$[0], id = ref$[1];
    }
    if (!(id || (_.has(Subclass != null ? Subclass.prototype : void 8, this.typeKey) && (id = Subclass.prototype[this.typeKey])))) {
      throw new Error("Sub-types must declare a new, unique " + this.typeKey + " on the prototype! (got " + (id || (Subclass != null ? (ref1$ = Subclass.prototype) != null ? ref1$[this.typeKey] : void 8 : void 8)) + ")");
    }
    if (this.cache[id] && this.cache[id] !== Subclass) {
      throw new Error("Duplicate " + this.typeKey + "! (got " + id + ")");
    }
    if (!(_.has(Subclass != null ? Subclass.prototype : void 8, this.typeKey) && Subclass.prototype[this.typeKey])) {
      Subclass.prototype[this.typeKey] = id;
    }
    return this.cache[id] = Subclass;
  };
  /**
   * Synchronously check if a model is in the cache, returning it if so.
   * 
   * @param {String} id The type ID to get.
   * @returns {Class}
   */
  prototype.get = function(id){
    return this.cache[id];
  };
  /**
   * Look up type by `id`.
   * 
   * @param {Object} obj 
   * @returns {this} 
   */
  prototype.lookup = function(obj){
    var id, Type;
    id = obj;
    if (typeof id !== 'string') {
      id = _.get(obj, this.typeKey);
    }
    id = peek(id);
    if (!(Type = this.cache[id])) {
      throw new Error("No type registered for " + this.typeKey + "='" + id + "'!");
    }
    return Type;
  };
  /**
   * Invalidate a model, removing it from the cache.
   * 
   * @param {String} id ID of the model to invalidate.
   * @returns {this}
   */
  prototype.invalidate = function(id){
    if (id == null) {
      return this;
    }
    delete this.cache[id];
    return this;
  };
  /**
   * Invalidates all cache entries.
   * @returns {this}
   */
  prototype.purge = function(){
    _.each(_.keys(this.cache), this.invalidate, this);
    return this;
  };
  /**
   * Decorate an object with the cache methods:
   *  - hasType        -> TypeCache::has
   *  - registerType   -> TypeCache::add
   *  - lookupType     -> TypeCache::lookup
   *  - invalidateType -> TypeCache::invalidate
   *  - purgeCache     -> TypeCache::purge
   * 
   * @param {Object} obj Object to decorate.
   * @param {Object} [mapping] Object mapping dest->src names for cache methods.
   * @returns {obj} The supplied object.
   */
  prototype.decorate = function(target, mapping){
    var cache, dest, src;
    mapping == null && (mapping = {});
    cache = this;
    target.__cache__ || (target.__cache__ = cache);
    mapping = import$({
      hasType: 'has',
      registerType: 'add',
      lookupType: 'lookup',
      invalidateType: 'invalidate',
      purgeCache: 'purge'
    }, mapping);
    for (dest in mapping) {
      src = mapping[dest];
      if (dest === 'registerType' && typeof target === 'function') {
        target.registerType || (target.registerType = fn$);
      } else {
        target[dest] || (target[dest] = this[src].bind(cache));
      }
    }
    return target;
    function fn$(id, Subclass){
      Subclass == null && (Subclass = this);
      return cache.add(id, Subclass);
    }
  };
  /**
   * Creates a new TypeCache for a given class `Type`, and decorates it
   * with cache methods as statics.
   * 
   * @see TypeCache#decorate
   * @param {Class} Type Class to decorate.
   * @param {String} typeKey Key used to infer missing IDs.
   * @param {Object} [opts={}] Options:
   * @param {Object} [opts.cache] Starting cache storage object. {@see TypeCache#constructor}
   * @param {Object} [opts.mapping] Decoration mapping. {@see TypeCache#decorate}
   * @returns {TypeCache} The new cache.
   */;
  TypeCache.createFor = function(Type, typeKey, opts){
    var cache;
    opts == null && (opts = {});
    cache = new TypeCache(typeKey, opts.cache);
    cache.decorate(Type, opts.mapping);
    return cache;
  };
  return TypeCache;
}());
/**
 * @name SubtypeCacheMixin
 * @namespace Static methods for interacting with a TypeCache for this class hierarchy.
 */
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/index.js', function(require, module, exports, __dirname, __filename, undefined){

var root, moduleShim, ex, _, op, guid, ref$, ref1$, ref2$, emitters, mixin, iterator, query, type_cache, collections, parse, formatters, crc, markdown, slice$ = [].slice;
root = exports.root = function(){
  return this || eval('this');
}();
root.requestAnimationFrame || (root.requestAnimationFrame = root.webkitRequestAnimationFrame || root.mozRequestAnimationFrame || root.oRequestAnimationFrame || root.msRequestAnimationFrame || function(it){
  return setTimeout(it, 17);
});
moduleShim = function(name, mod){
  if (!mod) {
    return;
  }
  if (require.define != null) {
    return require.define(name, function(require, module, exports){
      return module.exports = mod;
    });
  } else if (typeof define != 'undefined' && define !== null) {
    return define(name, function(require, exports, module){
      return module.exports = mod;
    });
  }
};
try {
  require('d3');
} catch (e$) {
  ex = e$;
  moduleShim('d3', root.d3);
}
try {
  require('knockout');
} catch (e$) {
  ex = e$;
  moduleShim('knockout', root.ko);
}
try {
  require('page');
} catch (e$) {
  ex = e$;
  moduleShim('page', root.page);
}
_ = exports._ = require('./underscore');
op = exports.op = require('operator');
guid = exports.guid = require('./guid');
import$(exports, guid);
root.console || (root.console = _(['log', 'info', 'warn', 'error', 'dir', 'table', 'group', 'groupCollapsed', 'groupEnd']).synthesize(function(it){
  return [it, op.nop];
}));
exports.knockout = require('./knockout');
if (((ref$ = root.livecss) != null ? ref$.watch : void 8) != null) {
  if (typeof root.jQuery == 'function') {
    root.jQuery('head link.livecss').each(function(i, el){
      return root.livecss.watch(el);
    });
  }
}
/**
 * @returns {Object} Object of the data from the form, via `.serializeArray()`.
 */
if ((ref1$ = root.jQuery) != null) {
  ref1$.fn.formData = function(){
    return _.synthesize(this.serializeArray(), function(it){
      return [it.name, it.value];
    });
  };
}
/**
 * Invokes a jQuery method on each element, returning the array of the result.
 * @returns {Array} Results.
 */
if ((ref2$ = root.jQuery) != null) {
  ref2$.fn.invoke = function(method){
    var args, idx, len$, el, ref$, results$ = [];
    args = slice$.call(arguments, 1);
    for (idx = 0, len$ = this.length; idx < len$; ++idx) {
      el = this[idx];
      results$.push((ref$ = jQuery(el))[method].apply(ref$, args));
    }
    return results$;
  };
}
emitters = exports.emitters = require('./emitters');
import$(exports, emitters);
mixin = exports.mixin = require('./mixin');
import$(exports, mixin);
iterator = exports.iterator = require('./iterator');
import$(exports, iterator);
query = exports.query = require('./query');
import$(exports, query);
type_cache = exports.type_cache = require('./type-cache');
import$(exports, type_cache);
collections = exports.collections = require('./collections');
import$(exports, collections);
parse = exports.parse = require('./parse');
import$(exports, parse);
formatters = exports.formatters = require('./formatters');
crc = exports.crc = require('./crc');
markdown = exports.markdown = require('./markdown');
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/collections/aliasdict.js', function(require, module, exports, __dirname, __filename, undefined){

var _, AliasDict, slice$ = [].slice;
_ = require('../underscore');
/**
 * @class A mapping of key-value pairs supporting key-aliases.
 */
exports.AliasDict = AliasDict = (function(){
  AliasDict.displayName = 'AliasDict';
  var prototype = AliasDict.prototype, constructor = AliasDict;
  /**
   * Data store.
   * @type Object
   * @private
   */
  prototype._data = null;
  /**
   * Mapping from keys to an array of [potentially nested] alias-keys.
   * @type Object<String, Array<String>>
   * @private
   */
  prototype._aliases = null;
  /**
   * @constructor
   */;
  function AliasDict(){
    this._data = {};
    this._aliases = {};
    this.extend.apply(this, arguments);
  }
  /**
   * @returns {Number} Number of real keys in the Dict.
   */
  prototype.size = function(){
    return _.keys(this._data).length;
  };
  /**
   * @returns {AliasDict} A copy of the AliasDict, including aliases as well as data.
   */
  prototype.clone = function(){
    var d;
    d = new AliasDict(this._data);
    _.each(this._aliases, function(v, k){
      return d.setAlias(k, v.slice());
    });
    return d;
  };
  /**
   * @returns {Boolean} Whether there is a value at the given key.
   */
  prototype.has = function(key){
    return this.get(key) != null;
  };
  /**
   * @returns {*} Ignores aliases, returning the value at key or `undefined`.
   */
  prototype.getValue = function(key){
    var prop;
    prop = _.getNested(this._data, key);
    if (prop != null) {
      return prop.value;
    }
  };
  prototype.get = function(key, def){
    var aliases, val;
    aliases = this._aliases[key] || [key];
    val = aliases.reduce(function(val, alias){
      var prop;
      if ((val != null) !== undefined) {
        return val;
      }
      prop = _.getNested(this._data, alias);
      if (prop != null) {
        return prop.value;
      }
    }, undefined);
    return val != null ? val : def;
  };
  prototype.set = function(key, val){
    _.setNested(this._data, key, val, {
      ensure: true
    });
    return val;
  };
  prototype.unset = function(key){
    var prop;
    prop = _.getNestedMeta(key);
    if (prop) {
      delete prop.obj[prop.key];
      return prop.value;
    }
  };
  prototype.hasAlias = function(key){
    return this._aliases[key] != null;
  };
  prototype.getAlias = function(key, def){
    def == null && (def = []);
    return this._aliases[key] || def;
  };
  prototype.setAlias = function(key, aliases){
    this._aliases[key] = _.isArray(aliases)
      ? aliases
      : [aliases];
    return this;
  };
  prototype.addAlias = function(key){
    var aliases;
    aliases = slice$.call(arguments, 1);
    this._aliases[key] = _.flatten(this.getAlias(key, [key]).concat(aliases));
    return this;
  };
  prototype.unsetAlias = function(key){
    var ref$, ref1$;
    return ref1$ = (ref$ = this._aliases)[key], delete ref$[key], ref1$;
  };
  prototype.toObject = function(){
    return _.clone(this._data);
  };
  prototype.keys = function(){
    return _.keys(this._data);
  };
  prototype.values = function(){
    return _.values(this._data);
  };
  prototype.extend = function(){
    var args, i$, len$, o, k, v;
    args = slice$.call(arguments);
    for (i$ = 0, len$ = args.length; i$ < len$; ++i$) {
      o = args[i$];
      for (k in o) {
        v = o[k];
        this.set(k, v);
      }
    }
    return this;
  };
  prototype.reduce = function(fn, acc, context){
    context == null && (context = this);
    return _.reduce(this._data, fn, acc, context);
  };
  prototype.map = function(fn, context){
    context == null && (context = this);
    return _.map(this._data, fn, context);
  };
  prototype.filter = function(fn, context){
    context == null && (context = this);
    return _.filter(this._data, fn, context);
  };
  prototype.each = function(fn, context){
    context == null && (context = this);
    _.each(this._data, fn, context);
    return this;
  };
  prototype.invoke = function(name){
    var args;
    args = slice$.call(arguments, 1);
    return _.invoke.apply(_, [this._data, name].concat(slice$.call(args)));
  };
  prototype.pluck = function(attr){
    return _.pluck(this._data, attr);
  };
  prototype.find = function(fn, context){
    context == null && (context = this);
    return _.find(this._data, fn, context);
  };
  prototype.toString = function(){
    var Cls;
    Cls = this.constructor;
    return (Cls.displayName || Cls.name) + "()";
  };
  return AliasDict;
}());

});

;
require.define('/node_modules/limn/util/collections/cascade.js', function(require, module, exports, __dirname, __filename, undefined){

var _, hasOwn, MISSING, TOMBSTONE, Cascade, slice$ = [].slice;
_ = require('../underscore');
hasOwn = {}.hasOwnProperty;
/**
 * Sentinel for missing values.
 */
MISSING = undefined;
/**
 * Tombstone for deleted, non-passthrough keys.
 */
TOMBSTONE = {};
/**
 * @class A mapping of key-value pairs supporting lookup fallback across multiple objects.
 */
exports.Cascade = Cascade = (function(){
  /**
   * Sentinel tombstone for deleted, non-passthrough keys.
   * @type TOMBSTONE
   * @readonly
   */
  Cascade.displayName = 'Cascade';
  var prototype = Cascade.prototype, constructor = Cascade;
  Cascade.TOMBSTONE = TOMBSTONE;
  /**
   * Map holding the object's KV-pairs; always the second element of the
   * cascade lookup.
   * @type Object
   * @private
   */
  prototype._data = null;
  /**
   * Map of tombstones, marking intentionally unset keys in the object's
   * KV-pairs; always the first element of the cascade lookup.
   * @type Object<String, TOMBSTONE>
   * @private
   */
  prototype._tombstones = null;
  /**
   * List of objects for lookups.
   * @type Array
   * @private
   */
  prototype._lookups = null;
  /**
   * @constructor
   */;
  function Cascade(data, lookups, tombstones){
    data == null && (data = {});
    lookups == null && (lookups = []);
    tombstones == null && (tombstones = {});
    this._data = data;
    this._tombstones = tombstones;
    this._lookups = [this._data].concat(lookups);
  }
  /**
   * @returns {Cascade} A shallow copy of the data and lookup chain.
   */
  prototype.clone = function(){
    return new Cascade(import$({}, this._data), this._lookups.slice(), import$({}, this._tombstones));
  };
  prototype.getData = function(){
    return this._data;
  };
  prototype.setData = function(data){
    this._data = this._lookups[0] = data;
    return this;
  };
  prototype.getTombstones = function(){
    return this._tombstones;
  };
  /**
   * @returns {Number} Number of lookup dictionaries.
   */
  prototype.size = function(){
    return this._lookups.length - 1;
  };
  /**
   * @returns {Array<Object>} The array of lookup dictionaries.
   */
  prototype.getLookups = function(){
    return this._lookups;
  };
  /**
   * Adds a new lookup dictionary to the chain.
   * @returns {this}
   */
  prototype.addLookup = function(dict){
    if (dict == null) {
      return this;
    }
    if (!_.isObject(dict)) {
      throw new Error("Lookup dictionary must be an object! dict=" + dict);
    }
    this._lookups.push(dict);
    return this;
  };
  /**
   * Removes a lookup dictionary from the chain (but will not remove the data object).
   * @returns {this}
   */
  prototype.removeLookup = function(dict){
    if (dict && dict !== this._data) {
      _.remove(this._lookups, dict);
    }
    return this;
  };
  /**
   * Pops the last dictionary off the lookup chain and returns it.
   * @returns {*} The last dictionary, or `undefined` if there are no additional lookups.
   */
  prototype.popLookup = function(){
    if (this.size() <= 1) {
      return;
    }
    return this._lookups.pop();
  };
  /**
   * Shifts the first additional lookup dictionary off the chain and returns it.
   * @returns {*} The first dictionary, or `undefined` if there are no additional lookups.
   */
  prototype.shiftLookup = function(){
    if (this.size() <= 1) {
      return;
    }
    return this._lookups.splice(1, 1)[0];
  };
  /**
   * Adds a lookup dictionary to the front of the chain, just after the Cascade's own data
   * object.
   * @returns {this}
   */
  prototype.unshiftLookup = function(dict){
    if (dict == null) {
      return this;
    }
    if (!_.isObject(dict)) {
      throw new Error("Lookup dictionary must be an object! dict=" + dict);
    }
    this._lookups.splice(1, 0, dict);
    return this;
  };
  /**
   * @returns {Boolean} Whether there is a tombstone set for `key`.
   */
  prototype.hasTombstone = function(key){
    var o, i$, ref$, len$, part;
    o = this._tombstones;
    for (i$ = 0, len$ = (ref$ = key.split('.')).length; i$ < len$; ++i$) {
      part = ref$[i$];
      o = o[part];
      if (o === TOMBSTONE) {
        return true;
      }
      if (!o) {
        return false;
      }
    }
    return false;
  };
  /**
   * @returns {Boolean} Whether `key` belongs to this object (not inherited
   *  from the cascade).
   */
  prototype.isOwnProperty = function(key){
    var meta;
    if (this.hasTombstone(key)) {
      return true;
    }
    meta = _.getNestedMeta(this._data, key);
    return (meta != null ? meta.obj : void 8) && hasOwn.call(meta.obj, key);
  };
  /**
   * @returns {Boolean} Whether `key` belongs to this object (not inherited
   *  from the cascade) and is defined.
   */
  prototype.isOwnValue = function(key){
    return !this.hasTombstone(key) && this.isOwnProperty(key) && _.getNested(this._data, key, MISSING) !== MISSING;
  };
  /**
   * @returns {Boolean} Whether the value at `key` is the same as that
   *  inherited by from the cascade.
   */
  prototype.isInheritedValue = function(key, strict){
    var val, cVal;
    strict == null && (strict = false);
    if (this.hasTombstone(key)) {
      return false;
    }
    val = this.get(key);
    cVal = this._getInCascade(key, MISSING, 2);
    if (strict) {
      return val === cVal;
    } else {
      return _.isEqual(val, cVal);
    }
  };
  /**
   * @returns {Boolean} Whether the value at `key` is different from that
   *  inherited by from the cascade.
   */
  prototype.isModifiedValue = function(key, strict){
    strict == null && (strict = false);
    return !this.isInheritedValue(key, strict);
  };
  /**
   * @private
   * @param {String} key Key to look up.
   * @param {*} [def=undefined] Value to return if lookup fails.
   * @param {Number} [idx=0] Index into lookup list to begin search.
   * @returns {*} First value for `key` found in the lookup chain starting at `idx`,
   *  and `def` otherwise.
   */
  prototype._getInCascade = function(key, def, idx){
    var lookups, i$, len$, data, val;
    idx == null && (idx = 0);
    if (this.hasTombstone(key)) {
      return def;
    }
    lookups = idx
      ? this._lookups.slice(idx)
      : this._lookups;
    for (i$ = 0, len$ = lookups.length; i$ < len$; ++i$) {
      data = lookups[i$];
      val = _.getNested(data, key, MISSING, {
        tombstone: TOMBSTONE
      });
      if (val === TOMBSTONE) {
        return def;
      }
      if (val !== MISSING) {
        return val;
      }
    }
    return def;
  };
  /**
   * @returns {Boolean} Whether there is a value at the given key.
   */
  prototype.has = function(key){
    return this.get(key, MISSING) !== MISSING;
  };
  /**
   * @param {String} key Key to look up.
   * @param {*} [def=undefined] Value to return if lookup fails.
   * @returns {*} First value for `key` found in the lookup chain,
   *  and `def` otherwise.
   */
  prototype.get = function(key, def){
    return this._getInCascade(key, def);
  };
  /**
   * Sets a key to a value, accepting nested keys and creating intermediary objects as necessary.
   * @public
   * @name set
   * @param {String} key Key to set.
   * @param {*} value Non-`undefined` value to set.
   * @returns {this}
   */
  /**
   * @public
   * @name set
   * @param {Object} values Map of key-value pairs to set. No value may be `undefined`.
   * @returns {this}
   */
  prototype.set = function(values){
    var key, val, ref$;
    if (arguments.length > 1 && typeof values === 'string') {
      key = arguments[0], val = arguments[1];
      if (!key || val === void 8) {
        throw new Error('Cannot set() an undefined key or value!');
      }
      values = (ref$ = {}, ref$[key + ""] = val, ref$);
    }
    for (key in values) {
      val = values[key];
      _.unsetNested(this._tombstones, key, {
        ensure: true
      });
      _.setNested(this._data, key, val, {
        ensure: true
      });
    }
    return this;
  };
  /**
   * Delete the given key from this object's data dictionary and set a tombstone
   * which ensures that future lookups do not cascade and thus see the key as
   * `undefined`.
   * 
   * If the key is missing from the data dictionary the delete does not cascade,
   * but the tombstone is still set.
   * 
   * @param {String} key Key to unset.
   * @returns {undefined|*} If found, returns the old value, and otherwise `undefined`.
   */
  prototype.unset = function(key){
    var old;
    old = this.get(key);
    _.unsetNested(this._data, key);
    _.setNested(this._tombstones, key, TOMBSTONE, {
      ensure: true
    });
    return old;
  };
  /**
   * Unsets the key in the data dictionary, but ensures future lookups also
   * see the key as `undefined`, as opposed.
   * 
   * @param {String} key Key to unset.
   * @returns {this} 
   */
  prototype.inherit = function(key){
    _.unsetNested(this._tombstones, key, {
      ensure: true
    });
    return _.unsetNested(this._data, key);
  };
  /**
   * Updates the Cascade's data with all key-value pairs found in the supplied
   * objects in first-in-last-out order. No pair's value may be `undefined`, but
   * non-object arguments are skipped.
   * 
   * @param {Object} ...values Any number of objects containing key-value pairs.
   * @returns {this}
   */
  prototype.update = function(){
    var i$, len$, o;
    for (i$ = 0, len$ = arguments.length; i$ < len$; ++i$) {
      o = arguments[i$];
      if (_.isObject(o)) {
        this.set(o);
      }
    }
    return this;
  };
  /**
   * Recursively collapses the Cascade to a plain object by recursively merging the
   * lookups (in reverse order) into the data.
   * @returns {Object}
   */
  prototype.collapse = function(){
    var o, k;
    o = _.merge.apply(_, [{}].concat(slice$.call(this._lookups.slice(1).reverse())));
    for (k in this._tombstones) {
      delete o[k];
    }
    return _.merge(o, this._data);
  };
  /**
   * Returns a plain object for JSON serialization via {@link Cascade#collapse()}.
   * The name of this method is a bit confusing, as it doesn't actually return a 
   * JSON string -- but I'm afraid that it's the way that the JavaScript API for 
   * `JSON.stringify()` works.
   * 
   * @see https://developer.mozilla.org/en/JSON#toJSON()_method
   * @return {Object} Plain object for JSON serialization.
   */
  prototype.toJSON = function(){
    return this.collapse();
  };
  prototype.keys = function(){
    return _.flatten(_.map(this._lookups, function(it){
      return _.keys(it);
    }));
  };
  prototype.values = function(){
    return _.flatten(_.map(this._lookups, function(it){
      return _.values(it);
    }));
  };
  prototype.reduce = function(fn, acc, context){
    context == null && (context = this);
    return _.reduce(this._lookups, fn, acc, context);
  };
  prototype.map = function(fn, context){
    context == null && (context = this);
    return _.map(this._lookups, fn, context);
  };
  prototype.filter = function(fn, context){
    context == null && (context = this);
    return _.filter(this._lookups, fn, context);
  };
  prototype.each = function(fn, context){
    context == null && (context = this);
    _.each(this._lookups, fn, context);
    return this;
  };
  prototype.invoke = function(name){
    var args;
    args = slice$.call(arguments, 1);
    return _.invoke.apply(_, [this._lookups, name].concat(slice$.call(args)));
  };
  prototype.pluck = function(attr){
    return _.pluck(this._lookups, attr);
  };
  prototype.find = function(fn, context){
    context == null && (context = this);
    return _.find(this._lookups, fn, context);
  };
  prototype.toString = function(){
    var Cls;
    Cls = this.constructor;
    return (Cls.displayName || Cls.name) + "()";
  };
  return Cascade;
}());
_.alias(Cascade.prototype, {
  unset: 'setTombstone',
  collapse: 'toObject',
  each: 'forEach'
});
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/collections/change.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * Action type constants.
 * @const
 */
var ACTIONS, Change;
ACTIONS = exports.ACTIONS = {
  'NONE': 'NONE',
  'ADD': 'ADD',
  'REMOVE': 'REMOVE',
  'MOVE': 'MOVE',
  'CHANGE': 'CHANGE'
};
import$(exports, ACTIONS);
/**
 * @class Represents a mutation to an indexable collection.
 */
exports.Change = Change = (function(){
  /**
   * @constructor
   * @param {*} value
   * @param {*} collection
   * @param {Number} oldIndex
   * @param {Number} [newIndex=oldIndex]
   * @param {String} action
   */
  Change.displayName = 'Change';
  var prototype = Change.prototype, constructor = Change;
  importAll$(prototype, arguments[0]);
  function Change(value, collection, oldIndex, newIndex, action){
    this.value = value;
    this.collection = collection;
    this.oldIndex = oldIndex;
    this.newIndex = newIndex != null ? newIndex : oldIndex;
    this.action = action;
    switch (this.action) {
    case ADD:
      this.oldIndex = -1;
      break;
    case REMOVE:
      this.newIndex = -1;
      break;
    case NONE:
    case CHANGE:
      this.oldIndex = this.newIndex;
      break;
    case MOVE:
      if (this.oldIndex === this.newIndex) {
        throw new Error('Change.MOVE to the same index!');
      }
    }
  }
  prototype.toString = function(){
    var action, oldIndex, newIndex, value;
    action = this.action, oldIndex = this.oldIndex, newIndex = this.newIndex, value = this.value;
    switch (action) {
    case MOVE:
      action += "[" + oldIndex + " -> " + newIndex + "]";
      break;
    case ADD:
      action += "[" + newIndex + "]";
      break;
    case REMOVE:
    case CHANGE:
      action += "[" + oldIndex + "]";
    }
    return "Change(" + action + ", " + value + ")";
  };
  /**
   * Create a new Change, inferring the action from the given indices.
   *
   * @param {*} value
   * @param {*} collection
   * @param {Number} oldIndex
   * @param {Number} [newIndex=oldIndex]
   * @returns {Change}
   */;
  Change.fromIndices = function(value, collection, oldIndex, newIndex){
    var action, ChangeClass;
    newIndex == null && (newIndex = oldIndex);
    if (oldIndex === newIndex) {
      action = CHANGE;
    } else if (oldIndex === -1) {
      action = ADD;
    } else if (newIndex === -1) {
      action = REMOVE;
    } else {
      action = MOVE;
    }
    ChangeClass = this;
    return new ChangeClass(value, collection, oldIndex, newIndex, action);
  };
  return Change;
}(ACTIONS));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/collections/ordered-map.js', function(require, module, exports, __dirname, __filename, undefined){

var _, guidFor, OrderedSet, OrderedMap, slice$ = [].slice;
_ = require('../underscore');
guidFor = require('../guid').guidFor;
OrderedSet = require('./ordered-set').OrderedSet;
/**
 * A Map which keeps pairs in insertion order; keys may be of any type,
 * with uniqueness ensured via `guid.guidFor()`.
 * 
 * @class
 */
exports.OrderedMap = OrderedMap = (function(){
  /**
   * Class guid.
   * @type String
   */
  OrderedMap.displayName = 'OrderedMap';
  var prototype = OrderedMap.prototype, constructor = OrderedMap;
  OrderedMap.__id__ = guidFor(OrderedMap);
  /**
   * Instance guid.
   * @type String
   */
  prototype.__id__ = null;
  /**
   * Set of keys in this map.
   * @protected
   * @type OrderedSet
   */
  prototype._keys = null;
  /**
   * Map from key-id to their values.
   * @protected
   * @type Object<Id, *>
   */
  prototype._values = null;
  /**
   * @constructor
   */;
  function OrderedMap(){
    this.__id__ = guidFor(this);
    this.clear();
    if (arguments.length) {
      this.update.apply(this, arguments);
    }
  }
  /**
   * Determine a unique identifier for the given value.
   * @protected
   * @returns {String} Id for this value.
   */
  prototype._getId = function(v){
    return guidFor(v);
  };
  /**
   * Removes all elements from the set.
   * @returns {this}
   */
  prototype.clear = function(){
    this._values = {};
    this._keys = new OrderedSet();
    this._keys._getId = this._getId.bind(this);
    return this;
  };
  /**
   * Clones the set, returning a new object.
   * @returns {OrderedMap}
   */
  prototype.clone = function(){
    return this.constructor.create().update(this.items());
  };
  /**
   * @returns {Number} Number of elements in the set.
   */
  prototype.size = function(){
    return this._keys.size();
  };
  /**
   * @return {Boolean}
   */
  prototype.isEmpty = function(){
    return this._keys.size() === 0;
  };
  /**
   * @protected
   * @param {*} key
   * @returns {Boolean} Whether the map contains `key`.
   */
  prototype._hasOne = function(key){
    return this._keys.has(key);
  };
  /**
   * Tests whether the map contains all given keys.
   * @aliases OrderedMap#contains
   * 
   * @param {*} key...
   * @returns {Boolean} Whether the map contains all given values.
   */
  prototype.has = function(key){
    return _.all(arguments, this._hasOne, this);
  };
  /**
   * Retrieves the value stored at `key`.
   * 
   * @param {*} key Key to get; keys may be of any value.
   * @returns {*} Value at `key`.
   */
  prototype.get = function(key){
    return this._values[this._getId(key)];
  };
  /**
   * Retrieves the `[key, value]` pair stored for `key`.
   * 
   * @param {*} key Key to get; keys may be of any value.
   * @returns {*} The `[key, value]` pair stored for `key`.
   */
  prototype.pair = function(key){
    return [key, this._values[this._getId(key)]];
  };
  /**
   * @param {String} key
   * @returns {Number} Index of `key` if found, otherwise `-1`.
   */
  prototype.indexOf = function(key){
    return this._keys.indexOf(key);
  };
  /**
   * Retrieve the pair stored at the given index.
   * 
   * @param {Number} idx Index to retrieve.
   * @returns {[Key, Value]} An array of `[key, value]` as found at the given
   *  index.
   */
  prototype.at = function(idx){
    return this.pair(this._keys.at(idx));
  };
  /**
   * Retrieve the key stored at the given index.
   * 
   * @param {Number} idx Index to retrieve.
   * @returns {*} Key as found at the given index.
   */
  prototype.keyAt = function(idx){
    return this._keys.at(idx);
  };
  /**
   * Retrieve the key stored at the given index.
   * 
   * @param {Number} idx Index to retrieve.
   * @returns {*} Key as found at the given index.
   */
  prototype.valueAt = function(idx){
    return this.get(this._keys.at(idx));
  };
  /**
   * @returns {*|Array} An array of the first `n` pairs if `n` was given;
   *  otherwise just the first pair in the map.
   */
  prototype.first = function(n){
    if (n != null) {
      return _.map(this._keys.first(n), this.pair, this);
    } else {
      return this.pair(this._keys.first());
    }
  };
  /**
   * @returns {*|Array} An array of the last `n` pairs if `n` was given;
   *  otherwise just the last pair in the map.
   */
  prototype.last = function(n){
    if (n != null) {
      return _.map(this._keys.last(n), this.pair, this);
    } else {
      return this.pair(this._keys.last());
    }
  };
  /**
   * Puts a single value to `key`.
   * 
   * @param {*} key Key to get; keys may be of any value.
   * @param {*} val Value to set at `key`.
   * @returns {this}
   */
  prototype.set = function(key, val){
    this._keys.add(key);
    this._values[this._getId(key)] = val;
    return this;
  };
  /**
   * @protected
   * @param {*} key Key to remove.
   * @returns {Boolean} Whether the key was removed.
   */
  prototype._removeKey = function(key){
    var id;
    id = this._getId(key);
    delete this._values[id];
    if (!this._keys.has(key)) {
      return false;
    }
    this._keys.remove(key);
    return true;
  };
  /**
   * @protected
   * @param {Number} idx
   * @returns {Boolean} Whether the value at that index was removed.
   */
  prototype._removeIndex = function(idx){
    if (0 > idx && idx >= this._keys.size()) {
      return false;
    }
    this._removeKey(this.keyAt(idx));
    return true;
  };
  /**
   * Remove given key(s) from the OrderedMap.
   * @param {*} keys... Keys to remove.
   * @returns {this}
   */
  prototype.remove = function(key){
    _.each(arguments, this._removeKey, this);
    return this;
  };
  /**
   * @returns {*} Removes and returns the last (most recently added) pair in the map.
   */
  prototype.pop = function(){
    var key, id, val, ref$, ref1$;
    if (!this._keys.size()) {
      return;
    }
    key = this._keys.pop();
    id = this._getId(key);
    val = (ref1$ = (ref$ = this._values)[id], delete ref$[id], ref1$);
    return [key, val];
  };
  /**
   * @returns {*} Removes and returns the first pair in the map.
   */
  prototype.shift = function(){
    var key, id, val, ref$, ref1$;
    if (!this._keys.size()) {
      return;
    }
    key = this._keys.shift();
    id = this._getId(key);
    val = (ref1$ = (ref$ = this._values)[id], delete ref$[id], ref1$);
    return [key, val];
  };
  /**
   * Update this OrderedMap with values from [any number of] other collections.
   * Arrays are treated as a list of `[key, value]` pairs; all other objects are
   * imported using their native keys and values.
   * 
   * @param {Array|Object} pairs... Collection to add.
   * @returns {this}
   */
  prototype.update = function(vs){
    var this$ = this;
    _.each(arguments, function(collection){
      if (_.isArray(collection)) {
        return _.each(collection, function(arg$){
          var k, v;
          k = arg$[0], v = arg$[1];
          return this$.set(k, v);
        });
      } else {
        return _.each(collection, this$.set, this$);
      }
    });
    return this;
  };
  /* * * *  Iteration/Collection Methods  * * * {{{ */
  /**
   * @returns {Array} Ordered list of keys in the map.
   */
  prototype.keys = function(){
    return this._keys.toArray();
  };
  /**
   * @returns {Array} Ordered list of values in the map.
   */
  prototype.values = function(){
    return this._keys.map(this.get, this);
  };
  /**
   * @aliases OrderedMap#pairs, OrderedMap#toArray
   * @returns {Array<[Key, Value]>} Ordered list of key-value pairs in the map.
   */
  prototype.items = function(){
    return this._keys.map(this.pair, this);
  };
  /**
   * Transforms the collection into a single value, front-to-back.
   * @param {Function} fn Reducer function.
   * @param {*} [acc] Starting accumulator value.
   * @param {Object} [cxt=this] Context; defaults to this OrderedMap.
   * @returns {*}
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
   */
  prototype.reduce = function(fn, acc, cxt){
    cxt == null && (cxt = this);
    return this._keys.reduce(function(acc, key){
      return fn.call(cxt, acc, this.get(key), key, this);
    }, acc, this);
  };
  /**
   * Applies a function to each element.
   * @aliases OrderedMap#each
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
   * @returns {this}
   */
  prototype.forEach = function(fn, cxt){
    var this$ = this;
    cxt == null && (cxt = this);
    this._keys.forEach(function(key){
      return fn.call(cxt, this$.get(key), key, this$);
    });
    return this;
  };
  /**
   * @returns {Array} Ordered list of the value of the property `prop` on
   *  each value in the map.
   */
  prototype.pluck = function(prop){
    return _.pluck(this._values, prop);
  };
  /**
   * Invokes the named method on each value in the map, returning an ordered
   * list of the results.
   * 
   * @param {String} methodName Name of the method on each value to invoke.
   * @param {Any...} [args...] Optional arguments to call pass to method call.
   * @returns {Array} List of results.
   */
  prototype.invoke = function(methodName){
    return _.invoke.apply(_, [this._values].concat(slice$.call(arguments)));
  };
  prototype.toString = function(){
    return "OrderedMap(size=" + this._keys.size() + ")";
  };
  /* * * *  Class Methods  * * * {{{ */
  /**
   * Map factory.
   * @static
   * @returns {? extends OrderedMap} A new map.
   */;
  OrderedMap.create = function(){
    var Class;
    Class = this;
    return new Class();
  };
  /**
   * @static
   * @returns {Function} A factory function that creates new instances
   *  without requiring the accursed `new` keyword.
   */
  OrderedMap.factory = function(){
    return this.create.bind(this);
  };
  /**
   * Invoked when extended; copies over all class methods to the Subclass (including this).
   * @protected
   * @static
   */
  OrderedMap.extended = function(SubClass){
    var SuperClass, k, v, own$ = {}.hasOwnProperty;
    SuperClass = this;
    for (k in SuperClass) if (own$.call(SuperClass, k)) {
      v = SuperClass[k];
      if (!SubClass[k]) {
        SubClass[k] = v;
      }
    }
    SubClass.__id__ = guidFor(SubClass);
    SubClass.__class__ = SubClass;
    SubClass.__super__ = SuperClass.prototype;
    SubClass.__superclass__ = SuperClass;
    return SubClass;
  };
  return OrderedMap;
}());
_.each(['map', 'some', 'every'], function(methodName){
  return OrderedMap.prototype[methodName] = function(fn, cxt){
    var this$ = this;
    cxt == null && (cxt = this);
    return this._keys[methodName](function(key){
      return fn.call(cxt, this$.get(key), key, this$);
    });
  };
});
_.each(['filter', 'reject', 'find'], function(methodName){
  return OrderedMap.prototype[methodName] = function(fn, cxt){
    var this$ = this;
    cxt == null && (cxt = this);
    return _[methodName](this.items(), function(arg$){
      var key, val;
      key = arg$[0], val = arg$[1];
      return fn.call(cxt, val, key, this$);
    });
  };
});
_.alias(OrderedMap.prototype, {
  has: 'contains',
  items: 'pairs toArray',
  forEach: 'each',
  every: 'all',
  some: 'any',
  find: 'detect'
});

});

;
require.define('/node_modules/limn/util/collections/ordered-set.js', function(require, module, exports, __dirname, __filename, undefined){

var _, guidFor, OrderedSet, slice$ = [].slice;
_ = require('../underscore');
guidFor = require('../guid').guidFor;
/**
 * A Set class, implemented using `guid.guidFor()`, which keeps values in insertion order.
 * 
 * @class
 */
exports.OrderedSet = OrderedSet = (function(){
  /**
   * Class guid.
   * @type String
   */
  OrderedSet.displayName = 'OrderedSet';
  var prototype = OrderedSet.prototype, constructor = OrderedSet;
  OrderedSet.__id__ = guidFor(OrderedSet);
  /**
   * Instance guid.
   * @type String
   */
  prototype.__id__ = null;
  /**
   * Set contents.
   * @protected
   * @type Array
   */
  prototype._items = null;
  /**
   * Map from Id to Objects in the set.
   * @protected
   * @type Object<Id, *>
   */
  prototype._byId = null;
  /**
   * @constructor
   * Invokes `@clear()` to initialize state tracking objects.
   */;
  function OrderedSet(){
    this.__id__ = guidFor(this);
    this.clear();
    if (arguments.length) {
      this.update.apply(this, arguments);
    }
  }
  /**
   * Determine a unique identifier for the given value.
   * @protected
   * @returns {String} Id for this value.
   */
  prototype._getId = function(v){
    return guidFor(v);
  };
  /**
   * All of OrderedSet's methods assume an Array (`_items` by default) stores
   * the set contents. If you've changed this in a subclass by overriding
   * `@clear()`, also override this method to wrap or transform your backing
   * store so it is presented as an Array.
   * 
   * @protected
   * @returns {Array} Array backing the set's contents.
   */
  prototype._getItems = function(){
    return this._items;
  };
  /**
   * Removes all elements from the set.
   * @returns {this}
   */
  prototype.clear = function(){
    this._byId = {};
    this._items = [];
    return this;
  };
  /**
   * Clones the set, returning a new object.
   * @returns {OrderedSet}
   */
  prototype.clone = function(){
    return this.constructor.create().update(this._getItems());
  };
  /**
   * @returns {Number} Number of elements in the set.
   */
  prototype.size = function(){
    return this._getItems().length;
  };
  /**
   * @return {Boolean}
   */
  prototype.isEmpty = function(){
    return this.size() === 0;
  };
  /**
   * @protected
   * @param {*} value
   * @returns {Boolean} Whether the set contains `value`.
   */
  prototype._hasOne = function(value){
    return this._getId(value) in this._byId;
  };
  /**
   * Tests whether the set contains all given values.
   * @aliases OrderedSet#contains
   * 
   * @param {*} value...
   * @returns {Boolean} Whether the set contains all given values.
   */
  prototype.has = function(value){
    return _.all(arguments, this._hasOne, this);
  };
  /**
   * @protected
   * @returns {this}
   */
  prototype._appendOne = function(v){
    var id;
    id = this._getId(v);
    if (id in this._byId) {
      return this;
    }
    this._byId[id] = v;
    this._getItems().push(v);
    return this;
  };
  /**
   * @protected
   * @returns {this}
   */
  prototype._prependOne = function(v){
    var id;
    id = this._getId(v);
    if (id in this._byId) {
      return this;
    }
    this._byId[id] = v;
    this._getItems().unshift(v);
    return this;
  };
  /**
   * Add values to the OrderedSet.
   * @aliases OrderedSet#push OrderedSet#append
   * @param {*} values... Values to add.
   * @returns {this}
   */
  prototype.add = function(){
    var values;
    values = slice$.call(arguments);
    _.each(arguments, this._appendOne, this);
    return this;
  };
  /**
   * Add values to the beginning of the OrderedSet.
   * @aliases OrderedSet#unshift
   * @param {*} values... Values to add.
   * @returns {this}
   */
  prototype.prepend = function(){
    var values;
    values = slice$.call(arguments);
    _.each(values.reverse(), this._prependOne, this);
    return this;
  };
  /**
   * @protected
   * @param {*} v Value to remove.
   * @returns {Boolean} Whether the value was removed.
   */
  prototype._removeOne = function(v){
    var id, idx;
    id = this._getId(v);
    if (!(id in this._byId)) {
      return false;
    }
    delete this._byId[id];
    idx = this.indexOf(v);
    if (idx > -1) {
      this._getItems().splice(idx, 1);
    }
    return true;
  };
  /**
   * Remove values from the OrderedSet.
   * @param {*} values... Values to remove.
   * @returns {this}
   */
  prototype.remove = function(){
    var values;
    values = slice$.call(arguments);
    _.each(arguments, this._removeOne, this);
    return this;
  };
  /**
   * @param {*} value
   * @returns {Number} Index of `value` if found, otherwise `-1`.
   */
  prototype.indexOf = function(value){
    return _.indexOf(this._getItems(), value);
  };
  /**
   * Retrieve the value stored at the given index.
   * 
   * @param {Number} idx Index to retrieve.
   * @returns {*} The value stored at the given index.
   */
  prototype.at = function(idx){
    return this._getItems()[idx];
  };
  /**
   * @returns {*|Array} An array of the first `n` elements if `n` was given;
   *  otherwise just the first element of the set.
   */
  prototype.first = function(n){
    return _.first(this._getItems(), n);
  };
  /**
   * @returns {*|Array} An array of the last `n` elements if `n` was given;
   *  otherwise just the last element of the set.
   */
  prototype.last = function(n){
    return _.last(this._getItems(), n);
  };
  /**
   * @returns {*} Removes and returns the last (most recently added) element in the set.
   */
  prototype.pop = function(){
    var v, id;
    if (this.isEmpty()) {
      return;
    }
    v = this._getItems().pop();
    id = this._getId(v);
    delete this._byId[id];
    return v;
  };
  /**
   * @returns {*} Removes and returns the first element in the set.
   */
  prototype.shift = function(){
    var v, id;
    if (this.isEmpty()) {
      return;
    }
    v = this._getItems().shift();
    id = this._getId(v);
    delete this._byId[id];
    return v;
  };
  /**
   * Update this OrderedSet (in-place) with other collections.
   * @param {Array|Object} it... Collection to add.
   * @returns {this}
   */
  prototype.update = function(vs){
    _.each(arguments, function(it){
      return _.each(it, this._appendOne, this);
    }, this);
    return this;
  };
  /**
   * Converts this OrderedSet to an Array.
   * @returns {Array}
   */
  prototype.slice = function(start, stop){
    var items;
    items = this._getItems();
    return items.slice.apply(items, arguments);
  };
  /* * * *  Iteration/Collection Methods  * * * {{{ */
  /**
   * @returns {Array} List of the unique identifiers for each element of the set.
   */
  prototype.keys = function(){
    return _.keys(this._byId);
  };
  /**
   * Converts this OrderedSet to an Array.
   * @aliases OrderedSet#toArray
   * @returns {Array}
   */
  prototype.values = function(){
    return this._getItems().slice();
  };
  /**
   * @returns {Array<[Key, Value]>} Key-value pairs of set contents.
   */
  prototype.items = function(){
    var this$ = this;
    return _.map(this._getItems(), function(it){
      return [this$._getId(it), it];
    });
  };
  /**
   * Transforms the collection into a single value, front-to-back.
   * @param {Function} fn Reducer function.
   * @param {*} [acc] Starting accumulator value.
   * @param {Object} [cxt=this] Context; defaults to this OrderedSet.
   * @returns {*}
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
   */
  prototype.reduce = function(fn, acc, cxt){
    cxt == null && (cxt = this);
    return _.reduce(this._getItems(), fn, acc, cxt);
  };
  /**
   * Applies a function to each element.
   * @aliases OrderedSet#each
   * @returns {this}
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
   */
  prototype.forEach = function(fn, cxt){
    cxt == null && (cxt = this);
    _.forEach(this._getItems(), fn, cxt);
    return this;
  };
  /**
   * @returns {Array} List of all values at property `prop`.
   */
  prototype.pluck = function(prop){
    return _.pluck(this._getItems(), prop);
  };
  /**
   * Invokes the named method on each element in the set, returning a list of the results.
   * @param {String} methodName Name of the method on each element to call.
   * @param {Any...} [args...] Optional arguments to call pass to method call.
   * @returns {Array} List of results.
   */
  prototype.invoke = function(methodName){
    return _.invoke.apply(_, [this._getItems()].concat(slice$.call(arguments)));
  };
  /* * * *  Comparators and Set Operations  * * * {{{ */
  /**
   * Tests if `a` is a Collection and has all elements in common with the set.
   * Sets are equal if and only if their intersection has the same size as both sets.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.isEqual = function(a){
    var L;
    if (!a) {
      return false;
    }
    L = this.size();
    return L === _.values(a).length && L === this.intersect(a).length;
  };
  /**
   * Tests if the set has no elements in common with `a`.
   * Sets are disjoint if and only if their intersection is the empty set.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.isDisjoint = function(a){
    if (!a) {
      return true;
    }
    return !_.some(a, this._hasOne, this);
  };
  /**
   * Test whether every element in the set is in `a`.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.isSubset = function(a){
    var A;
    if (!a) {
      return false;
    }
    A = _(a);
    return this.every(A.contains, A);
  };
  /**
   * Test whether every element in `a` is in the set.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.isSuperset = function(a){
    if (!a) {
      return false;
    }
    return _.every(a, this._hasOne, this);
  };
  /**
   * Test whether any elements in `a` are in the set.
   * @param {Collection} a
   * @returns {Boolean}
   */
  prototype.isOverlapping = function(a){
    if (!a) {
      return false;
    }
    return _.any(a, this._hasOne, this);
  };
  /**
   * OrderedSet Intersection (A ^ B)
   * Intersects the set with another collection, returning a new set. The
   * membership test uses `_(other).contains()`, so it is possible to intersect
   * collections of different types. Set membership is tested with `_getId()`, but
   * membership in `other` will use strict equality via `.indexOf()`.
   * 
   * @param {Array|Object} other Comparison collection.
   * @returns {OrderedSet} A new set of all elements of `this` found in the supplied collection.
   * 
   * @example
   *      foo = /foo/
   *      A = [foo, 'A', 1, 2, 3, 'C', /foo/]
   *      B = [foo, 'B', 3, 'A', 1, /foo/]
   *      ins = _(A).intersect(B)
   *      ins.toString() is "OrderedSet([/foo/,A,1,3])" # true
   *      ins.get(0) is foo # true
   */
  prototype.intersect = function(a){
    return this.constructor.create().update(_.intersect(this._getItems(), _.map(arguments, _.values)));
  };
  /**
   * OrderedSet Union (A v B)
   * @aliases OrderedSet#concat
   * @param {Array|Object} a Other collection(s).
   * @returns {OrderedSet} A new set of all elements of both collections, without duplicates.
   */
  prototype.union = function(a){
    return _.reduce_(arguments, this.clone(), function(out, it){
      return out.update(it);
    });
  };
  /**
   * OrderedSet Difference (A - B)
   * @param {Array|Object} a Comparison collection(s).
   * @returns {OrderedSet} A new set of only elements of this OrderedSet not in supplied collection(s).
   */
  prototype.difference = function(a){
    return this.constructor.create().update(_.difference(this._getItems(), _.map(arguments, _.values)));
  };
  /**
   * Symmetric Difference (A - B) v (B - A)
   * @returns {OrderedSet} 
   */
  prototype.xor = function(a){
    a = _.values(a);
    return this.difference(a).union(_.difference(a, this._getItems()));
  };
  prototype.toString = function(){
    var Class, className;
    Class = this.constructor;
    className = Class.displayName || Class.name;
    return "OrderedSet(size=" + this.size() + ")";
  };
  /* * * *  Class Methods  * * * {{{ */
  /**
   * Set factory.
   * @static
   * @returns {? extends OrderedSet} A new set.
   */;
  OrderedSet.create = function(){
    var Class;
    Class = this;
    return new Class();
  };
  /**
   * @static
   * @returns {Function} A factory function that creates new instances
   *  without requiring the accursed `new` keyword.
   */
  OrderedSet.factory = function(){
    return this.create.bind(this);
  };
  /**
   * Invoked when extended; copies over all class methods to the Subclass (including this).
   * @protected
   * @static
   */
  OrderedSet.extended = function(SubClass){
    var SuperClass, k, v, own$ = {}.hasOwnProperty;
    SuperClass = this;
    for (k in SuperClass) if (own$.call(SuperClass, k)) {
      v = SuperClass[k];
      if (!SubClass[k]) {
        SubClass[k] = v;
      }
    }
    SubClass.__id__ = guidFor(SubClass);
    SubClass.__class__ = SubClass;
    SubClass.__super__ = SuperClass.prototype;
    SubClass.__superclass__ = SuperClass;
    return SubClass;
  };
  return OrderedSet;
}());
_.each(['map', 'filter', 'reject', 'some', 'every', 'find'], function(name){
  return OrderedSet.prototype[name] = function(fn, cxt){
    cxt == null && (cxt = this);
    return _[name](this._getItems(), fn, cxt);
  };
});
_.alias(OrderedSet.prototype, {
  has: 'contains',
  add: 'push append',
  prepend: 'unshift',
  forEach: 'each',
  every: 'all',
  some: 'any',
  find: 'detect',
  values: 'toArray',
  union: 'concat'
});

});

;
require.define('/node_modules/limn/util/collections/index.js', function(require, module, exports, __dirname, __filename, undefined){

var aliasdict, cascade, change, ordered_map, ordered_set;
aliasdict = require('./aliasdict');
cascade = require('./cascade');
change = require('./change');
ordered_map = require('./ordered-map');
ordered_set = require('./ordered-set');
import$(import$(import$(import$(import$(exports, aliasdict), cascade), change), ordered_map), ordered_set);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/add-extender.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, own, slice$ = [].slice;
_ = require('underscore');
ko = require('knockout');
own = Object.prototype.hasOwnProperty;
/**
 * Attaches a new extender to `ko.extenders` and augments the `ko.subscribable` 
 * prototype with a method of the same name, which invokes the extender with the supplied data.
 * 
 * @param {String} name Name of the extender.
 * @param {Function} extender Handler function which implements the extender.
 * @returns {Function} The extender.
 */
exports.addExtender = ko.addExtender = function(name, extender){
  if (!name) {
    throw new Error("Extender name required!");
  }
  if (typeof extender !== 'function') {
    throw new Error("Extender handler for '" + name + "' must be a function!");
  }
  if (ko.extenders[name]) {
    throw new Error("An extender named '" + name + "' already exists!");
  }
  if (ko.subscribable.fn[name]) {
    throw new Error("A subscribable method named '" + name + "' already exists!");
  }
  ko.extenders[name] = extender;
  ko.subscribable.fn[name] = function(){
    var options;
    options = slice$.call(arguments);
    return ko.extenders[name].apply(this, [this].concat(options));
  };
  return extender;
};
_.each(ko.extenders, function(extender, name){
  if (!own.call(ko.extenders, name)) {
    return;
  }
  delete ko.extenders[name];
  return ko.addExtender(name, extender);
});

});

;
require.define('/node_modules/limn/util/knockout/async-computed-observable.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, _, asyncDependentObservable, isAsyncComputed;
ko = require('knockout');
require('./add-extender');
_ = require('underscore');
/**
 * `asyncDependentObservable` functions similar to `ko.dependentObservable`,
 * except that the function invoked to compute a new value for the observable may
 * instead return a Promise, indicating asynchronous computation is still pending.
 * The value will not be set, and instead the `asyncDependentObservable` will await
 * Promise resolution, setting the value with the eventual result.
 * 
 * The returned observable provides a number of properties for accessing the 
 * asynchronous task's state:
 * - {ko.observable} inProgress Observable property indicating whether an update is
 *  active and pending.
 * - {Promise} promise Promise for the current in-flight task, available when `inProgress`.
 * - {Function} task The task function.
 * 
 * @param {Function} task Function invoked to recalculate the value of the underlying
 * @param {Object} [owner=this] Object used as context when invoking `task`.
 * @param {Array} [args=[]] Arguments used when invoking `task`.
 * @param {Class<Model>} ModelType Model type to ensure.
 * @returns {ko.observable} Value-bearing observable.
 */
exports.asyncDependentObservable = exports.asyncComputed = asyncDependentObservable = function(task, options){
  var deferred, result, inProgress, updater, evaluated, lazyResult;
  options == null && (options = {});
  if (typeof task != 'function') {
    throw new Error('ko.asyncDependentObservable requires a task function!');
  }
  deferred = null;
  result = ko.observable();
  inProgress = ko.observable(false);
  updater = ko.computed(_.extend({}, options, {
    read: function(){
      var val, ref$;
      if (deferred) {
        deferred.reject();
      }
      val = task.call(options.owner);
      if (typeof (val != null ? val.done : void 8) == "function") {
        inProgress(true);
        deferred = $.Deferred().always(function(){
          var ref$;
          delete result.promise;
          if ((ref$ = result.lazy) != null) {
            delete ref$.promise;
          }
          return inProgress(false);
        }).done(function(data){
          return result(data);
        });
        val.done(deferred.resolve);
        result.promise = deferred.promise();
        return (ref$ = result.lazy) != null ? ref$.promise = result.promise : void 8;
      } else {
        return result(val);
      }
    }
  }));
  evaluated = false;
  lazyResult = result.lazy = ko.computed(_.extend({}, options, {
    read: function(){
      if (!evaluated) {
        evaluated = true;
        ko.dependencyDetection.ignore(function(){
          return updater.peek();
        });
      }
      return result();
    }
  }));
  result.lazy.promise = result.promise;
  lazyResult.task = task;
  lazyResult.inProgress = inProgress;
  return lazyResult;
};
isAsyncComputed = exports.isAsyncComputed = function(obs){
  return !!obs && ko.isObservable(obs) && ko.isObservable(obs.inProgress);
};
ko.addExtender('async', asyncDependentObservable);
import$(ko, exports);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/editable-binding.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, editableDomDataKey;
ko = require('knockout');
editableDomDataKey = '__ko_editableBindingData';
/**
 * Custom binding that is used as follows:
 * `<p data-bind="value: observableProperty, editable: true"></p>`
 * And works as follows:
 *   This element will get some hooks to make it easy to find and make it editable
 */
ko.bindingHandlers.editable = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
    var unwrapped, dataBindPlaceholder, sameClasses, style, editor, editBinding;
    ({
      controlsDescendantBindings: false
    });
    $(element).addClass('editable');
    unwrapped = ko.utils.unwrapObservable(valueAccessor());
    dataBindPlaceholder = '###';
    sameClasses = $(element).attr('class');
    style = '';
    switch (unwrapped) {
    case 'input':
      editor = "<input " + dataBindPlaceholder + " type=text/>";
      break;
    case 'textarea':
      editor = "<textarea " + dataBindPlaceholder + " rows=3 cols=40></textarea>";
      if (sameClasses.indexOf('offset3') >= 0) {
        style = 'margin-left: 260px';
      }
      break;
    default:
      return;
    }
    editBinding = ko.bindingHandlers.editable.getEditBindText($(element).data().bind.split(','));
    editor = editor.replace(dataBindPlaceholder, "data-bind=\"" + editBinding + "\" class=\"" + sameClasses + "\" style=\"" + style + "\"");
    return $(element).data('editor', editor);
  },
  getEditBindText: function(bindings){
    var i$, len$, binding, j$, ref$, len1$, type;
    for (i$ = 0, len$ = bindings.length; i$ < len$; ++i$) {
      binding = bindings[i$];
      for (j$ = 0, len1$ = (ref$ = ['text', 'markdown']).length; j$ < len1$; ++j$) {
        type = ref$[j$];
        if (binding.indexOf(type) === 0) {
          return binding.replace(type, 'value');
        }
      }
    }
  }
};

});

;
require.define('/node_modules/limn/util/knockout/markdown-binding.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, unwrapObservable, ref$, Markdown, Showdown;
ko = require('knockout');
unwrapObservable = ko.utils.unwrapObservable;
ref$ = require('../markdown'), Markdown = ref$.Markdown, Showdown = ref$.Showdown;
ko.bindingHandlers.markdown = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
    return {
      controlsDescendantBindings: true
    };
  },
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
    var md;
    md = unwrapObservable(valueAccessor());
    $(element).html(Markdown.render(md));
    return ko.applyBindingsToDescendants(bindingContext, element);
  }
};

});

;
require.define('/node_modules/limn/util/knockout/markdown-extender.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, Showdown, DEFAULT_OPTIONS, markdownExtender;
ko = require('knockout');
Showdown = require('showdown');
require('./add-extender');
DEFAULT_OPTIONS = {
  doubleNL: false
};
markdownExtender = exports.markdownExtender = function(obs, options){
  var Markdown, ref$, wrapper;
  options == null && (options = {});
  Markdown = new Showdown.converter();
  options = (ref$ = {}, import$(ref$, DEFAULT_OPTIONS), import$(ref$, options));
  wrapper = ko.computed({
    deferEvaluation: true,
    read: function(){
      var s;
      s = obs();
      if (options.doubleNL) {
        s = s.replace(/\n/g, '\n\n');
      }
      return Markdown.makeHtml(s);
    },
    write: obs
  });
  return wrapper;
};
ko.addExtender('markdown', markdownExtender);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/observable-array.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * @fileOverview Extensions to the `ko.observableArray` prototype.
 */
var ko, extensions;
ko = require('knockout');
extensions = {
  /**
   * Patch `valueHasMutated()` to update proxy's length property. Maybe?
   */
  /**
   * Insert `value` at `index`, shifting following elements to accommodate.
   * 
   * @param {*} value Value to insert.
   * @param {Number} idx Index at which to insert value.
   * @returns {this} The observable.
   */
  insert: function(value, idx){
    var array;
    array = this.peek();
    if (!(typeof idx === 'number' && (-1 < idx && idx < array.length))) {
      throw new Error("Index out of bounds");
    }
    this.splice(idx, 0, value);
    return this;
  }
  /**
   * Atomically moves an element from one index to another. No mutuation
   * occurs if indices are the same or if either index is out of
   * bounds (0 > idx >= length).
   * 
   * @param {Number} fromIdx
   * @param {Number} toIdx
   * @returns {this} The observable.
   */,
  move: function(fromIdx, toIdx){
    var array, len, val;
    array = this.peek();
    len = array.length;
    if (!(typeof fromIdx === 'number' && (-1 < fromIdx && fromIdx < len) && typeof toIdx === 'number' && (-1 < toIdx && toIdx < len) && fromIdx !== toIdx)) {
      return this;
    }
    val = array[fromIdx];
    this.valueWillMutate();
    array.splice(fromIdx, 1);
    array.splice(toIdx, 0, val);
    this.valueHasMutated();
    return this;
  }
};
import$(ko.observableArray.fn, extensions);
import$(exports, extensions);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/observable-history.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, _, DEFAULT_OPTIONS, observableHistory;
ko = require('knockout');
require('./add-extender');
_ = require('underscore');
/**
 * Default options for observableHistory.
 */
DEFAULT_OPTIONS = {
  limit: 1,
  includeInitial: true
};
/**
 * Tracks the history of an observable.
 * 
 * @param {ko.observable} obs An observable to turn into a stack.
 * @param {Object} [options={}] Options:
 * @param {Number} [options.limit=1] Limit to the number of previous values to keep.
 * @param {Boolean} [options.includeInitial=true] Whether to count the initial
 *  value in the history.
 * @returns {ko.computed} 
 */
observableHistory = exports.observableHistory = function(obs, options){
  var stack, current, isInitialValue, wrapper, prev, size, clear, compDispose, dispose;
  options = _.extend({}, DEFAULT_OPTIONS, options);
  stack = [];
  current = options.includeInitial ? obs.peek() : void 8;
  isInitialValue = true;
  wrapper = ko.computed(_.extend({}, options, {
    read: function(){
      if (!(isInitialValue && !options.includeInitial)) {
        stack.unshift(current);
      }
      current = obs();
      stack = stack.slice(0, options.limit);
      return current;
    },
    write: obs
  }));
  _.defaults(wrapper, obs);
  /**
   * Gets the previous value; if `n` is supplied, instead return an array
   * of the `n` most recent previous values (arranged from most-recent to
   * oldest). Note that the current value is never returned.
   * 
   * @param {Number} [n]
   * @returns {*|Array}
   */
  wrapper.prev = prev = function(n){
    return _.first(stack, n);
  };
  /**
   * @returns {Number} Number of items in the history.
   */
  wrapper.historySize = size = function(){
    return stack.length;
  };
  /**
   * Clears the history, returning its former values.
   * @returns {Array}
   */
  wrapper.clear = clear = function(){
    var _stack;
    _stack = stack;
    stack = [];
    return _stack;
  };
  compDispose = wrapper.dispose;
  dispose = wrapper.dispose = function(){
    clear();
    return compDispose();
  };
  return wrapper;
};
ko.addExtender('history', observableHistory);
import$(ko, exports);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/observable-map.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, ref$, OrderedSet, OrderedMap, ObservableMap;
_ = require('underscore');
ko = require('knockout');
ref$ = require('../collections'), OrderedSet = ref$.OrderedSet, OrderedMap = ref$.OrderedMap;
/**
 * @class
 * @extends OrderedMap
 */
exports.ObservableMap = ObservableMap = (function(superclass){
  ObservableMap.displayName = 'ObservableMap';
  var prototype = extend$(ObservableMap, superclass).prototype, constructor = ObservableMap;
  function ObservableMap(){
    superclass.apply(this, arguments);
  }
  return ObservableMap;
}(OrderedMap));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/util/knockout/observable-set.js', function(require, module, exports, __dirname, __filename, undefined){

var _, ko, OrderedSet, ObservableSet;
_ = require('underscore');
ko = require('knockout');
OrderedSet = require('../collections').OrderedSet;
/**
 * @class An observable OrderedSet, publishing changes via events as well as
 * providing observables for each mutation type (add, remove, move).
 * @extends OrderedSet
 */
exports.ObservableSet = ObservableSet = (function(superclass){
  ObservableSet.displayName = 'ObservableSet';
  var prototype = extend$(ObservableSet, superclass).prototype, constructor = ObservableSet;
  function ObservableSet(){
    superclass.apply(this, arguments);
  }
  /**
   * Back the set with an observableArray to notify others of changes.
   * @returns {this}
   */
  prototype.clear = function(){
    this._byId = {};
    this._items = ko.observableArray();
    return this;
  };
  /**
   * Get the underlying value from the observable, adding a dependency if
   * anyone is dependent.
   * @protected
   * @returns {Array} Backing array.
   */
  prototype._getItems = function(){
    return this._items();
  };
  /**
   * Get the backing array wihtout adding a dependency.
   * @returns {Array}
   */
  prototype.peek = function(){
    return this._items.peek();
  };
  /**
   * @returns {ko.observableArray} The backing observable.
   */
  prototype.getObservable = function(){
    return this._items;
  };
  /* * * *  Subscribable API  * * * {{{ */
  /**
   * Apply extenders to the underlying observable, and then re-set the property.
   * @returns {this}
   */
  prototype.extend = function(){
    var ref$;
    this._items = (ref$ = this._items).extend.apply(ref$, arguments);
    return this;
  };
  _.each(['subscribe', 'notifySubscribers', 'getSubscriptionsCount'], function(methodName){
    return ObservableSet.prototype[methodName] = function(){
      var ref$;
      return (ref$ = this._getItems())[methodName].apply(ref$, arguments);
    };
  });
  return ObservableSet;
}(OrderedSet));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}

});

;
require.define('/node_modules/limn/util/knockout/observables-array-ext.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ref$, unwrap, peek, _, observablesArray, slice$ = [].slice;
ko = require('knockout');
ref$ = ko.utils, unwrap = ref$.unwrapObservable, peek = ref$.peekObservable;
_ = require('../underscore');
observablesArray = require('./observables-array').observablesArray;
_.each(['forEach', 'map', 'filter', 'reject', 'some', 'every', 'find'], function(methodName){
  return observablesArray.fn[methodName] = function(fn, cxt){
    var this$ = this;
    cxt == null && (cxt = this);
    return _[methodName](this(), function(obs, idx){
      return fn.call(cxt, peek(obs), idx, this$);
    });
  };
});
import$(observablesArray.fn, {
  reduce: function(fn, acc, cxt){
    var this$ = this;
    cxt == null && (cxt = this);
    return _.reduce_(this(), acc, function(acc, obs, idx){
      return fn.call(cxt, acc, peek(obs), idx, this$);
    });
  },
  pluck: function(prop){
    return this.map(function(it){
      return it[prop];
    });
  },
  invoke: function(methodName){
    var args;
    args = slice$.call(arguments, 1);
    return this.map(function(it){
      return it[methodName].apply(it, args);
    });
  }
});
_.alias(observablesArray.fn, {
  forEach: 'each',
  every: 'all',
  some: 'any',
  find: 'detect'
});
exports.observablesArray = observablesArray;
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/observables-array.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, ACTIONS, objToString, ref$, slice, nativeLastIndexOf, ref1$, arrayMap, indexOf, unwrap, peek, kTrue, kFalse, isArray, isArrayLike, lastIndexOf, toObservable, observablesArray, enforceStructure, privateMethods, slice$ = [].slice;
ko = require('knockout');
ACTIONS = {
  'CREATED': 'CREATED',
  'ADD': 'ADD',
  'REMOVE': 'REMOVE',
  'CHANGE': 'CHANGE',
  'MOVE': 'MOVE'
};
objToString = {}.toString;
ref$ = [], slice = ref$.slice, nativeLastIndexOf = ref$.lastIndexOf;
ref1$ = ko.utils, arrayMap = ref1$.arrayMap, indexOf = ref1$.arrayIndexOf, unwrap = ref1$.unwrapObservable, peek = ref1$.peekObservable;
kTrue = function(){
  return true;
};
kFalse = function(){
  return false;
};
isArray = Array.isArray || function(it){
  return '[object Array]' == objToString.call(it);
};
isArrayLike = function(it){
  return isArray(it) || ('length' in it && typeof it !== 'function');
};
lastIndexOf = function(array, item, fromIndex){
  var i;
  if (!array) {
    return -1;
  }
  if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
    return nativeLastIndexOf.apply(array, slice.call(arguments, 1));
  }
  i = fromIndex != null
    ? fromIndex
    : array.length;
  while (i--) {
    if (array[i] === item) {
      return i;
    }
  }
  return -1;
};
toObservable = function(val){
  if (ko.isObservable(val)) {
    return val;
  }
  if (isArray(val)) {
    return ko.observableArray(val);
  } else {
    return ko.observable(val);
  }
};
/**
 * An array of ko.observable items. Keeps a mirror metadata array to track subscriptions to these items.
 */
observablesArray = exports.observablesArray = function(initialValues){
  var result, originalValueHasMutated;
  initialValues == null && (initialValues = []);
  if (!isArray(initialValues)) {
    throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");
  }
  result = ko.observable();
  result.shouldEnforce = true;
  result.ACTIONS = ACTIONS;
  ko.utils.extend(result, privateMethods);
  ko.utils.extend(result, ko.observablesArray.fn);
  originalValueHasMutated = result.valueHasMutated;
  result.valueHasMutated = function(enforce){
    if (enforce != null) {
      result.shouldEnforce = enforce;
    }
    return originalValueHasMutated.call(result);
  };
  result._reportAction(ACTIONS.CREATED, initialValues, -1, 0);
  result.subscribe(function(){
    if (result.shouldEnforce) {
      enforceStructure.call(result);
    }
    return result.shouldEnforce = true;
  });
  result(initialValues);
  return result;
};
observablesArray.ACTIONS = ACTIONS;
enforceStructure = function(){
  var values, index, len$, value;
  values = this.peek();
  if (!isArray(values)) {
    this(values != null
      ? [values]
      : []);
    return;
  }
  for (index = 0, len$ = values.length; index < len$; ++index) {
    value = values[index];
    values[index] = toObservable(value);
  }
  return this._refreshMetadata();
};
privateMethods = {
  /**
   * Changes the observable `this.lastAction` and the array `this.lastChange` so subscribers can know what's going on with the array
   * @param {String} action A string representation of the action, can be:
   *      CREATED     : the array was created
   *      ADD         : a value was inserted into the array
   *      REMOVE      : a value was removed from the array
   *      CHANGE      : a value in the array has changed
   * @param {*} value The value for the change.
   * @param {Number} oldIndex
   * @param {Number} newIndex
   */
  _reportAction: function(action, value, oldIndex, newIndex){
    this.oldIndex = oldIndex;
    this.newIndex = newIndex;
    if (!this.lastAction) {
      this.lastAction = ko.observable();
      this.lastAction.equalityComparer = kFalse;
    }
    this.lastChange = peek(value);
    this.lastAction(action);
    return this;
  }
  /**
   * Set an entry in the internal subscriptions array.
   * 
   * @param {Number} index
   * @param {ko.observable} obs
   * @returns {this}
   */,
  _setMetadata: function(index, obs){
    var ref$, this$ = this;
    this._meta || (this._meta = new Array(index + 1));
    if ((ref$ = this._meta[index]) != null) {
      ref$.dispose();
    }
    this._meta[index] = obs.subscribe(function(newValue){
      this$.valueWillMutate();
      this$._reportAction(ACTIONS.CHANGE, newValue, index, index);
      return this$.valueHasMutated(false);
    });
    return this;
  }
  /**
   * Insert a metadata entry at `index` in the internal subscriptions array.
   * 
   * @param {Number} index
   * @param {ko.observable} obs
   * @returns {this}
   */,
  _insertMetadata: function(index, obs){
    this._meta || (this._meta = new Array(index + 1));
    this._meta.splice(index, 0, null);
    this._setMetadata(index, obs);
    return this;
  }
  /**
   * Disposes and removes the subscription entry.
   * 
   * @param {Number} index
   * @returns {this}
   */,
  _removeMetadata: function(index){
    var ref$;
    if (!this._meta) {
      return this;
    }
    if ((ref$ = this._meta[index]) != null) {
      ref$.dispose();
    }
    this._meta.splice(index, 1);
    return this;
  }
  /**
   * Disposes all the old subscriptions and creates new ones for every item in the underlying array.
   * 
   * @returns {this}
   */,
  _refreshMetadata: function(){
    var i$, ref$, len$, s, values, index, len1$, obs;
    this._meta || (this._meta = []);
    for (i$ = 0, len$ = (ref$ = this._meta).length; i$ < len$; ++i$) {
      s = ref$[i$];
      s.dispose();
    }
    values = this.peek();
    this._meta = new Array(values.length);
    for (index = 0, len1$ = values.length; index < len1$; ++index) {
      obs = values[index];
      this._setMetadata(index, obs);
    }
    return this;
  }
};
observablesArray.fn = {
  /**
   * Passthrough to Array.slice() which *does* create a dependency.
   * @returns {Array}
   */
  slice: function(startIndex, stopIndex){
    var ref$;
    return arrayMap((ref$ = this()).slice.apply(ref$, arguments), peek);
  },
  indexOf: function(item){
    var values;
    values = arrayMap(this(), peek);
    return indexOf(values, peek(item));
  },
  lastIndexOf: function(item, fromIndex){
    var values;
    values = arrayMap(this(), peek);
    return lastIndexOf(values, peek(item), fromIndex);
  },
  contains: function(item){
    return this.indexOf(item) > -1;
  }
  /**
   * Insert `value` at `index`.
   * 
   * @param {Number} index
   * @param {*} value
   * @returns {this}
   */,
  insert: function(index, value){
    var obs;
    obs = toObservable(value);
    this.valueWillMutate();
    this.peek().splice(index, 0, obs);
    this._insertMetadata(index, obs);
    this._reportAction(ACTIONS.ADD, value, -1, index);
    this.valueHasMutated(false);
    return this;
  },
  push: function(value){
    var i$, len$;
    for (i$ = 0, len$ = arguments.length; i$ < len$; ++i$) {
      value = arguments[i$];
      this.insert(this.peek().length, value);
    }
    return this.peek().length;
  },
  unshift: function(value){
    var i$, len$;
    for (i$ = 0, len$ = arguments.length; i$ < len$; ++i$) {
      value = arguments[i$];
      this.insert(0, value);
    }
    return this.peek().length;
  }
  /**
   * Remove the value at `index`.
   * 
   * @param {Number} index
   * @returns {*} Removed value.
   */,
  removeIndex: function(index){
    var values, obs, value;
    values = this.peek();
    if (!(values.length > index)) {
      return;
    }
    this.valueWillMutate();
    obs = values[index];
    value = obs.peek();
    values.splice(index, 1);
    this._removeMetadata(index);
    this._reportAction(ACTIONS.REMOVE, value, index, -1);
    this.valueHasMutated(false);
    return value;
  },
  pop: function(){
    return this.removeIndex(this.peek().length - 1);
  },
  shift: function(){
    return this.removeIndex(0);
  },
  remove: function(toRemove){
    var predicate, removedValues, index, ref$, len$, obs, value;
    toRemove = peek(toRemove);
    if (typeof toRemove == "function") {
      predicate = toRemove;
    } else {
      predicate = function(value, index){
        return this.equalityComparer(value, toRemove);
      };
    }
    removedValues = [];
    for (index = 0, len$ = (ref$ = this.peek().slice()).length; index < len$; ++index) {
      obs = ref$[index];
      value = peek(obs);
      if (!predicate.call(this, value, index, this)) {
        continue;
      }
      removedValues.push(value);
      this.removeIndex(index);
    }
    return removedValues;
  },
  removeAll: function(values){
    if (values === undefined) {
      return this.remove(kTrue);
    }
    if (!isArray(values)) {
      return [];
    }
    return this.remove(function(it){
      return indexOf(values, peek(it)) >= 0;
    });
  },
  replace: function(oldItem, newItem){
    var index, obs;
    index = this.indexOf(oldItem);
    if (!(index >= 0)) {
      return this;
    }
    obs = this.peek()[index];
    obs(newItem);
    return this;
  },
  splice: function(startIndex, numToRemove){
    var values, endIndex, removedValues, index, i$, len$, value;
    values = slice$.call(arguments, 2);
    endIndex = startIndex + numToRemove;
    removedValues = arrayMap(this.peek().slice(startIndex, endIndex), peek);
    for (index = startIndex; index < endIndex; ++index) {
      this.removeIndex(index);
    }
    for (i$ = 0, len$ = values.length; i$ < len$; ++i$) {
      value = values[i$];
      this.insert(startIndex++, value);
    }
    return removedValues;
  }
};
/* TODO: destroy methods don't work ... look into why / how they are used
    destroy: (valueOrPredicate) ->
        values = @peek()
        if typeof valueOrPredicate == "function"
            predicate = valueOrPredicate
        else
            predicate = (value) -> value() is valueOrPredicate
        
        @valueWillMutate()
        
        for i from values.length - 1 to 0 by -1
            value = values[i]
            if predicate(value)
                values[i]["_destroy"] = true
                @_removeMetadata i
        
        @valueHasMutated false
    
    destroyAll: (values) ->
        # If you passed zero args, we destroy everything
        if values is undefined
            return @['destroy'](-> true)
        
        # If you passed an arg, we interpret it as an values of entries to destroy
        return [] unless values
        @['destroy'] (value) ->
            indexOf(values, value) >= 0
*/
import$(ko, exports);
ko.exportSymbol('observablesArray', observablesArray);
ko.exportSymbol('observablesArray.ACTIONS', observablesArray.ACTIONS);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/observables.js', function(require, module, exports, __dirname, __filename, undefined){

/**
 * @fileOverview Observable utilities.
 */
var _, ko, toObservable, logObservedChanges, observeFluentMethod;
_ = require('underscore');
ko = require('knockout');
/**
 * Creates a `ko.observableArray` if appropriate for the type of the input,
 * and a `ko.observable` otherwise.
 * 
 * @param {*} val Value to wrap.
 * @returns {ko.observable|ko.observableArray} The observable.
 */
toObservable = exports.toObservable = function(val){
  if (ko.isObservable(val)) {
    return val;
  }
  if (_.isArray(val)) {
    return ko.observableArray(val);
  } else {
    return ko.observable(val);
  }
};
/**
 * Log all changes to the given observable.
 */
logObservedChanges = exports.logObservedChanges = function(obs, key){
  var oldValue;
  key == null && (key = '');
  oldValue = obs.peek();
  return obs.subscribe(function(newValue){
    return oldValue = newValue;
  });
};
/**
 * Wrap a fluent method of a given object with an observer to publish changes,
 * still invoking the underlying method.
 * 
 * @param {Object} target Object with the method to wrap.
 * @param {String} methodName Name of the method to wrap.
 * @returns {Function} Wrapped method.
 */
observeFluentMethod = exports.observeFluentMethod = function(target, methodName){
  var method, observer, wrapper;
  method = target[methodName];
  observer = ko.observable();
  wrapper = ko.computed({
    read: observer,
    write: function(){
      var val;
      method.apply(target, arguments);
      val = method.call(target);
      observer(val);
      return val;
    }
  });
  wrapper.target = target;
  wrapper.methodName = methodName;
  wrapper.method = method;
  wrapper.observer = observer;
  return target[methodName] = wrapper;
};
import$(ko.utils, exports);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/subscribable.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, extensions;
ko = require('knockout');
extensions = {
  /**
   * Registers a callback to be notified with both the old and
   * new value -- unlike `.subscribe()` -- when this observable changes:
   * 
   *  `callback.call(cxt or subscription, oldValue, newValue, observable)`
   * 
   * @param {Function} callback
   * @param {Object} [cxt] Context for the callback; defaults to the subscription.
   * @returns {Object} Subscription for this registration.
   */
  onChange: function(callback, cxt){
    var target, lastValue, beforeSub, changeSub, dispose, subs;
    target = this;
    lastValue = null;
    beforeSub = this.subscribe(function(oldValue){
      return lastValue = oldValue;
    }, 'beforeChange');
    changeSub = this.subscribe(function(newValue){
      return callback.call(cxt || subscription, lastValue, newValue, target);
    }, 'change');
    dispose = function(){
      subs.isDisposed = true;
      beforeSub.dispose();
      return changeSub.dispose();
    };
    return subs = {
      target: target,
      callback: callback,
      dispose: dispose,
      beforeSub: beforeSub,
      changeSub: changeSub
    };
  }
};
import$(ko.subscribable.fn, extensions);
import$(exports, extensions);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/knockout/subview-binding.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, subviewDomDataKey;
ko = require('knockout');
subviewDomDataKey = '__ko_subviewBindingData';
/**
 * Custom binding that is used as follows:
 * `<section data-bind="subview: observableProperty"></section>`
 * And works as follows:
 *   In the example above, observableProperty is a ko.observable whose value is an object that has a `template` property
 *   The binding finds the template with id `observableProperty().template` and fills it as the innerHTML of the section element
 *   The binding then sets the context for the section's child elements as the observableProperty (like with: observableProperty)
 */
ko.bindingHandlers.subview = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
    return {
      controlsDescendantBindings: true
    };
  },
  update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
    var unwrapped, childContext;
    unwrapped = ko.utils.unwrapObservable(valueAccessor());
    if (unwrapped != null && unwrapped.template) {
      $(element).html($("#" + unwrapped.template).html());
      childContext = bindingContext.createChildContext(unwrapped);
      ko.applyBindingsToDescendants(childContext, element);
      return typeof unwrapped.afterRender == 'function' ? unwrapped.afterRender(element) : void 8;
    }
  }
};

});

;
require.define('/node_modules/limn/util/knockout/typed-observable.js', function(require, module, exports, __dirname, __filename, undefined){

var ko, _, toObs, slice$ = [].slice;
ko = require('knockout');
_ = require('../underscore');
require('./observables');
require('./add-extender');
toObs = ko.utils.toObservable;
/**
 * Coerces input to this observable using the supplied function before it the
 * value is set, implying subscribers will only see the converted values. If the
 * underlying observable is a `ko.observableArray`, coercion will be applied to
 * each element before being added.
 * 
 * @param {ko.observable} obs Observable to decorate.
 * @param {Function} coerce Function invoked to coerce values before they are
 *  written to the underlying observable.
 * @param {Object} [owner=obs] Context for calls to coerce.
 * @returns {ko.dependentObservable} Wrapped observable.
 */
exports.typedExtender = ko.addExtender('typed', function(obs, coerce, owner, options){
  var current, wrapper;
  owner == null && (owner = obs);
  options == null && (options = {});
  if (typeof coerce !== 'function') {
    throw new Error("ko.typedObservable requires a coercion function! Got a " + typeof coerce + " instead: " + coerce);
  }
  current = obs.peek();
  options = (options.owner = owner, options.read = obs, options.write = function(value){
    if (_.isArray(value)) {
      _.each(value, function(val, i){
        return value[i] = coerce.call(owner, val);
      });
    } else {
      value = coerce.call(owner, value);
    }
    obs(value);
    return value;
  }, options);
  wrapper = ko.computed(options);
  options.isArray == null && (options.isArray = _.isArray(current));
  if (options.isArray) {
    _.each(['push', 'unshift', 'splice', 'replace'], function(methodName){
      var origMethod;
      origMethod = obs[methodName];
      switch (methodName) {
      case 'splice':
        return obs.splice = function(start, drop){
          var args;
          args = slice$.call(arguments, 2);
          return origMethod.apply(this, [start, drop].concat(_.map(args, coerce, owner)));
        };
      case 'replace':
        return obs.replace = function(oldItem, newItem){
          return origMethod.call(this, oldItem, coerce.call(owner, newItem));
        };
      default:
        return obs[methodName] = function(arg){
          return origMethod.apply(this, _.map(arguments, coerce, owner));
        };
      }
    });
  }
  delete wrapper.equalityComparer;
  _.defaults(wrapper, obs);
  wrapper(current);
  return wrapper;
});
/**
 * Convenience for wrapping a value in both an observable and the type coercion wrapper.
 * @returns {ko.dependentObservable}
 */
exports.typedObservable = ko.typedObservable = function(coerce, val, owner, options){
  return toObs(val).typed(coerce, owner, options);
};
/**
 * Coerces input to this observable using the supplied Model before it the
 * value is set, implying subscribers will only see the converted values. If the
 * underlying observable is a `ko.observableArray`, coercion will be applied to
 * each element before being added.
 * 
 * @param {ko.observable} obs Property to decorate.
 * @param {Class<Model>} ModelType Model to ensure.
 * @returns {ko.dependentObservable} Wrapped observable.
 */
exports.modelExtender = ko.addExtender('model', function(obs, ModelType, owner, options){
  var coerce;
  coerce = function(value){
    if (value instanceof ModelType) {
      return value;
    }
    if (value == null) {
      return value;
    }
    return new ModelType(value);
  };
  if (typeof ModelType.comparator === 'function') {
    obs.equalityComparer = ModelType.comparator;
  }
  return obs.typed(coerce, owner, options);
});
/**
 * Convenience for wrapping a value in both an observable and the model coercion wrapper.
 * @returns {ko.dependentObservable}
 */
exports.modeledObservable = ko.modeledObservable = function(ModelType, val, owner, options){
  return toObs(val).model(ModelType, owner, options);
};
/**
 * Coerces input to this observable using the supplied function before it the
 * value is set, implying subscribers will only see the converted values. If the
 * underlying observable is a `ko.observableArray`, coercion will be applied to
 * each element before being added.
 * 
 * @param {ko.observable} obs Property to decorate.
 * @param {Function|Class} coerce Function invoked to coerce incoming data into
 *  the appropriate type. If the function appears to be a class constructor, it will
 *  be wrapped to perform an instanceof check to prevent double-wrapping, and otherwise
 *  invoke the class with `new`.
 * @returns {ko.dependentObservable} Wrapped observable.
 */
exports.coerciveExtender = ko.addExtender('coerce', function(obs, coerce, owner, options){
  if (_.isClass(coerce)) {
    return obs.model(coerce, owner, options);
  } else {
    return obs.typed(coerce, owner, options);
  }
});
/**
 * Convenience for wrapping a value in both an observable and the "smart" coercion wrapper.
 * @returns {ko.dependentObservable}
 */
exports.coerciveObservable = ko.coerciveObservable = function(coerce, val, owner, options){
  return toObs(val).coerce(coerce, owner, options);
};

});

;
require.define('/node_modules/limn/util/knockout/index.js', function(require, module, exports, __dirname, __filename, undefined){

var add_extender, async_computed_observable, editable_binding, markdown_binding, markdown_extender, observable_array, observable_history, observable_map, observable_set, observables, observables_array, observables_array_ext, subscribable, subview_binding, typed_observable;
add_extender = require('./add-extender');
async_computed_observable = require('./async-computed-observable');
editable_binding = require('./editable-binding');
markdown_binding = require('./markdown-binding');
markdown_extender = require('./markdown-extender');
observable_array = require('./observable-array');
observable_history = require('./observable-history');
observable_map = require('./observable-map');
observable_set = require('./observable-set');
observables = require('./observables');
observables_array = require('./observables-array');
observables_array_ext = require('./observables-array-ext');
subscribable = require('./subscribable');
subview_binding = require('./subview-binding');
typed_observable = require('./typed-observable');
import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(import$(exports, add_extender), async_computed_observable), editable_binding), markdown_binding), markdown_extender), observable_array), observable_history), observable_map), observable_set), observables), observables_array), observables_array_ext), subscribable), subview_binding), typed_observable);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/parse/parsers.js', function(require, module, exports, __dirname, __filename, undefined){

var op, parsers;
op = require('operator');
/**
 * @namespace Parsers by type.
 */
parsers = {
  parseBoolean: function(v){
    return op.toBool(v);
  },
  parseNumber: function(v){
    var r;
    r = Number(v);
    if (!isNaN(r)) {
      return r;
    } else {
      return null;
    }
  },
  parseInteger: function(v){
    var r;
    r = op.toInt(v);
    if (!isNaN(r)) {
      return r;
    } else {
      return null;
    }
  },
  parseFloat: function(v){
    var r;
    r = op.toFloat(v);
    if (!isNaN(r)) {
      return r;
    } else {
      return null;
    }
  },
  parseString: function(v){
    if (v != null) {
      return op.toStr(v);
    } else {
      return null;
    }
  },
  parseDate: function(v){
    if (v) {
      return op.toDate(v);
    } else {
      return null;
    }
  },
  parseRegExp: function(v){
    if (v) {
      return op.toRegExp(v);
    } else {
      return null;
    }
  },
  parseArray: function(v){
    if (v) {
      return op.toObject(v);
    } else {
      return null;
    }
  },
  parseObject: function(v){
    if (v) {
      return op.toObject(v);
    } else {
      return null;
    }
  },
  parseFunction: function(v){
    var e;
    if (v && String(v).slice(0, 8) === 'function') {
      try {
        return eval("(" + v + ")");
      } catch (e$) {
        e = e$;
        return null;
      }
    } else {
      return null;
    }
  }
};
import$(exports, parsers);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/parse/parsing-mixin.js', function(require, module, exports, __dirname, __filename, undefined){

var _, Mixin, parsers, ParsingMixin;
_ = require('../underscore');
Mixin = require('../mixin').Mixin;
parsers = require('./parsers');
/**
 * @class Methods for a class to select parsers by type reflection.
 * @mixin
 */
exports.ParsingMixin = ParsingMixin = (function(superclass){
  ParsingMixin.displayName = 'ParsingMixin';
  var prototype = extend$(ParsingMixin, superclass).prototype, constructor = ParsingMixin;
  importAll$(prototype, arguments[1]);
  prototype.parseValue = function(v, type){
    return this.getParser(type)(v);
  };
  prototype.getParser = function(type){
    var fn, i$, ref$, len$, t;
    type == null && (type = 'String');
    fn = this["parse" + type];
    if (typeof fn === 'function') {
      return fn;
    }
    type = _(String(type).toLowerCase());
    for (i$ = 0, len$ = (ref$ = ['Integer', 'Float', 'Number', 'Boolean', 'RegExp', 'Date', 'Object', 'Array', 'Function']).length; i$ < len$; ++i$) {
      t = ref$[i$];
      if (type.startsWith(t.toLowerCase())) {
        return this["parse" + t];
      }
    }
    return this.defaultParser || this.parseString;
  };
  prototype.getParserFromExample = function(v){
    var typeName;
    if (v == null) {
      return null;
    }
    typeName = _.typeName(v);
    if (typeName === 'Class') {
      typeName = 'Object';
    }
    return this.getParser(typeName);
  };
  prototype.getTypeNameFromExample = function(v){
    var typeName;
    typeName = _.typeName(v);
    switch (typeName) {
    case 'Class':
      typeName = 'Object';
      break;
    case 'Integer':
    case 'Float':
      typeName = 'Number';
    }
    return typeName;
  };
  function ParsingMixin(){}
  return ParsingMixin;
}(Mixin, parsers));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/parse/index.js', function(require, module, exports, __dirname, __filename, undefined){

var parsers, parsing_mixin;
parsers = require('./parsers');
parsing_mixin = require('./parsing-mixin');
import$(import$(exports, parsers), parsing_mixin);
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/array.js', function(require, module, exports, __dirname, __filename, undefined){

var _, I, defined, _array;
_ = require('underscore');
I = function(it){
  return it;
};
defined = function(o){
  return o != null;
};
_array = {
  /**
   * Create an array of size `n` filled with the values derived from n invocations
   * of the iterator function.
   * 
   * @param {Number} n Target length for the new array.
   * @param {Function} fn Iterator function called to generate values: `fn.call(cxt, i) -> value`
   * @param {Object} [cxt] Context
   * @returns {Array}
   */
  fill: function(n, fn, cxt){
    var i, results$ = [];
    for (i = 0; i < n; ++i) {
      results$.push(fn.call(cxt, i));
    }
    return results$;
  }
  /**
   * Transforms an Array of tuples (two-element Arrays) into an Object, such that for each
   * tuple [k, v]:
   *      result[k] = v if filter(v)
   * @param {Array} o A collection.
   * @param {Function} [filter=defined] Optional filter function. If omitted, will 
   *  exclude `undefined` and `null` values.
   * @return {Object} Transformed result.
   */,
  generate: function(o, filter){
    filter == null && (filter = defined);
    return _.reduce(o, function(acc, arg$, idx){
      var k, v;
      k = arg$[0], v = arg$[1];
      if (k && (!filter || filter(v, k))) {
        acc[k] = v;
      }
      return acc;
    }, {});
  }
  /**
   * As {@link _.generate}, but first transforms the collection using `fn`; useful
   * for constructing keys out of values (or vice-versa) to build an object.
   * 
   * @param {Array} o A collection.
   * @param {Function} [fn=I] Transformation function. Defaults to the identity transform.
   * @param {Function} [filter=defined] Optional filter function. If omitted, will 
   *  exclude `undefined` and `null` values.
   * @param {Object} [context=o] Function context.
   * @return {Object} Transformed result.
   */,
  synthesize: function(o, fn, filter, context){
    fn == null && (fn = I);
    filter == null && (filter = defined);
    return _.generate(_.map(o, fn, context), filter);
  }
  /**
   * Symmetric Difference
   */,
  xor: function(a, b){
    a = _.values(a);
    b = _.values(b);
    return _.union(_.difference(a, b), _.difference(b, a));
  }
  /**
   * Whitespace-friendly version of reduce, taking the iteration function last.
   */,
  reduce_: function(it, acc, cxt, fn){
    var len, ref$, ref1$;
    switch (len = arguments.length) {
    case 2:
      ref$ = [acc, void 8], fn = ref$[0], acc = ref$[1];
      break;
    case 3:
      ref1$ = [cxt, void 8], fn = ref1$[0], cxt = ref1$[1];
      break;
    default:
      if (len < 2) {
        throw new Error("You must supply (at least!) a collection and an iteration function");
      }
    }
    return _.reduce(it, fn, acc, cxt);
  }
};
_.mixin(import$(exports, _array));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/class.js', function(require, module, exports, __dirname, __filename, undefined){

var _, _arr, root, ref$, objToString, hasOwn, getProto, x0$, STR_TO_TYPENAME, STR_TO_TYPE, NATIVE_TYPES, TRICKY_TYPES, _cls, slice$ = [].slice;
_ = require('underscore');
_arr = require('./array');
root = function(){
  return this || eval('this');
}();
ref$ = {}, objToString = ref$.toString, hasOwn = ref$.hasOwnProperty;
getProto = Object.getPrototypeOf;
x0$ = ['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object'];
STR_TO_TYPENAME = _arr.synthesize(x0$, function(it){
  return ["[object " + it + "]", it];
});
STR_TO_TYPE = _arr.synthesize(x0$, function(it){
  return [it, root[it]];
});
NATIVE_TYPES = _.map(x0$, function(it){
  return root[it];
});
TRICKY_TYPES = {
  Object: true,
  Function: true
};
_cls = {
  /**
   * @returns {Boolean} Whether the given function is a class constructor.
   */
  isClass: function(fn){
    var proto;
    if (of$(fn, NATIVE_TYPES)) {
      return true;
    }
    return typeof fn === 'function' && _.isObject(proto = fn.prototype) && (fn.__class__ === fn || !_.isEmpty(proto) || !_.isPlainObject(proto));
  }
  /**
   * @param {Object} o An object.
   * @returns {String} Name of the type given object, one of:
   *  null, undefined, Boolean, Number, String, Function, Array, Date, RegExp, Object.
   */,
  nativeTypeName: function(o){
    if (o == null) {
      return String(o);
    }
    return STR_TO_TYPENAME[objToString.call(o)] || 'Object';
  }
  /**
   * @returns {String} The name of the type of the thing you passed me.
   */,
  typeName: function(o){
    var name, x1$;
    if (o == null) {
      return String(o);
    }
    if (!TRICKY_TYPES[name = _.nativeTypeName(o)]) {
      return name;
    }
    if (_.isClass(o)) {
      return (typeof o.getClassName == 'function' ? o.getClassName() : void 8) || 'Class';
    }
    if (typeof o === 'function') {
      return 'Function';
    }
    if (!hasOwn.call(o, 'constructor')) {
      return x1$ = o.constructor, x1$.displayName || x1$.name;
    }
    return 'Object';
  }
  /**
   * Creates a new instance of the given class without running its constructor.
   * 
   * @param {Class<T>} Class Class to instantiate.
   * @returns {T} New instance of the given class, created without running
   *  its constructor.
   */,
  fabricate: function(Class){
    var AnonymousInnerClass, instance;
    AnonymousInnerClass = function(){};
    AnonymousInnerClass.prototype = Class.prototype;
    instance = new AnonymousInnerClass();
    instance.constructor = Class;
    return instance;
  }
  /**
   * Creates a new instance of the given class, applying the given arguments
   * array to the constructor.
   * 
   * @param {Class<T>} Class Class to instantiate.
   * @param {Array} [args=[]] Arguments to pass to the class constructor.
   * @returns {T} New instance of the given class.
   */,
  instantiate: function(Class, args){
    var instance;
    args == null && (args = []);
    instance = _.fabricate(Class);
    Class.apply(instance, args);
    return instance;
  }
  /**
   * Create an instance of an anonymous subclass of the given class, allowing
   * you to provide prototype overrides prior to the invocation of the constructor.
   * 
   * Note that this process triggers Coco's `@extended()` hook.
   * 
   * @param {Class<T>} Class Class to subclass.
   * @param {Array} [args] Partial constructor arguments which will be prepended
   *  to whatever is actually supplied to the constructor. if omitted, prototype
   *  overrides may still be supplied.
   * @param {Object} [overrides={}] Prototype overrides.
   * @returns {? extends T>} An instance of the new anonymous subclass of this class.
   */,
  subclass: function(Class, args, overrides){
    var ref$, AnonymousInnerClass;
    args == null && (args = []);
    overrides == null && (overrides = {});
    if (!_.isArray(args)) {
      ref$ = [args, []], overrides = ref$[0], args = ref$[1];
    }
    AnonymousInnerClass = (function(superclass){
      AnonymousInnerClass.displayName = 'AnonymousInnerClass';
      var prototype = extend$(AnonymousInnerClass, superclass).prototype, constructor = AnonymousInnerClass;
      importAll$(prototype, arguments[1]);
      function AnonymousInnerClass(){
        var _args;
        _args = slice$.call(arguments);
        superclass.apply(this, args.concat(_args));
      }
      return AnonymousInnerClass;
    }(Class, overrides));
    return AnonymousInnerClass;
  }
  /**
   * Create an instance of an anonymous subclass of the given class, allowing
   * you to provide prototype overrides prior to the invocation of the constructor.
   * 
   * Note that this process triggers Coco's `@extended()` hook.
   * 
   * @param {Class<T>} Class Class to subclass.
   * @param {Array} [args] Constructor arguments; if omitted, overrides may still be supplied.
   * @param {Object} [overrides={}] Prototype overrides.
   * @returns {? extends T>} An instance of the new anonymous subclass of this class.
   */,
  subclassInstance: function(Class, args, overrides){
    var AnonymousInnerClass;
    args == null && (args = []);
    overrides == null && (overrides = {});
    AnonymousInnerClass = _.subclass(Class, args, overrides);
    return new AnonymousInnerClass();
  }
  /**
   * Determines the superclass for the given class/object, and `undefined`
   * otherwise.
   * 
   * Note this typically will not return `Object` or `Function` due to
   * the prototype's constructor being set by the subclass.
   * 
   * @param {Class|Object} obj Class constructor or object to reflect upon.
   * @returns {Class} Superclass for the given class/object.
   */,
  getSuperClass: (function(){
    function getSuperClass(obj){
      var that, ref$;
      if (!obj) {
        return;
      }
      if (that = obj.__superclass__ || obj.superclass || ((ref$ = obj.__super__) != null ? ref$.constructor : void 8)) {
        if (that !== obj) {
          return that;
        }
      }
      if (typeof obj !== 'function') {
        return getSuperClass(obj.constructor);
      }
    }
    return getSuperClass;
  }())
  /**
   * @param {Class|Object} obj Class constructor or object to reflect upon.
   * @returns {Array<Class>} The list of all superclasses for this class
   *  or object. Typically does not include Object or Function due to
   *  the prototype's constructor being set by the subclass.
   */,
  getSuperClasses: (function(){
    function getSuperClasses(Cls){
      var superclass;
      if (!(superclass = _.getSuperClass(Cls))) {
        return [];
      }
      return [superclass].concat(getSuperClasses(superclass));
    }
    return getSuperClasses;
  }())
  /**
   * Looks up an attribute on the prototype of each class in the class
   * hierarchy. Values from Object or Function are not typically included --
   * see the note at `getSuperClass()`.
   * 
   * @param {Object} obj Object on which to reflect.
   * @param {String} prop Property to nab.
   * @returns {Array} List of the values, from closest parent to furthest.
   */,
  pluckSuper: function(obj, prop){
    if (!obj) {
      return [];
    }
    return _(_.getSuperClasses(obj)).chain().pluck('prototype').pluck(prop).value();
  }
  /**
   * As `.pluckSuper()` but includes value of `prop` on passed `obj`. Values
   *  from Object or Function are not typically included -- see the note
   *  at `getSuperClasses()`.
   * 
   * @returns {Array} List of the values, starting with the object's own
   *  value, and then moving from closest parent to furthest.
   */,
  pluckSuperAndSelf: function(obj, prop){
    if (!obj) {
      return [];
    }
    return [obj[prop]].concat(_.pluckSuper(obj, prop));
  }
  /**
   * Invokes the method found at `methodName` on the given object and each
   * of its superclasses. The resulting objects' properties are collapsed
   * into a single object, such that the properties from the most-super class
   * are overridden by each newer result. Any non-methods at `methodName`
   * are skipped, and non-object return values are not collapsed into the
   * resulting object.
   * 
   * @param {Object} obj Object on which to perform the method-collapse.
   * @param {String} methodName Name of the method to invoke.
   * @param {*} ...args Arguments to pass to the method.
   * @returns {Object} Results collapsed into a single object.
   */,
  collapseAllSuper: function(obj, methodName){
    var args;
    args = slice$.call(arguments, 2);
    if (!(obj && methodName)) {
      return {};
    }
    return _.reduceRight(_.pluckSuperAndSelf(obj, methodName), function(acc, method){
      var res;
      if (typeof method === 'function') {
        res = method.apply(obj, args);
        if (_.isObject(res)) {
          _.merge(acc, res);
        }
      }
      return acc;
    }, {});
  }
};
_.mixin(import$(exports, _cls));
function of$(x, arr){
  var i = 0, l = arr.length >>> 0;
  while (i < l) if (x === arr[i++]) return true;
  return false;
}
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/dom.js', function(require, module, exports, __dirname, __filename, undefined){

var _, d3, _dom;
_ = require('underscore');
d3 = require('d3');
_dom = {
  /**
   * Unwrap an Element wrapped by jQuery or d3.
   * 
   * @param {jQuery|d3.selection|*} el A potentially wrapped element.
   * @returns {Element|*} The unwrapped element if it was wrapped;
   *  otherwise whatever we got.
   */
  toElement: function(el){
    if (el instanceof jQuery) {
      el = el[0];
    }
    if (el instanceof d3.selection) {
      el = el.node();
    }
    return el;
  }
  /**
   * Creates elements with the correct namespace for both HTML and SVG tags.
   */,
  createElement: function(tagName, cssClass, attributes){
    var ref$, name, el;
    if (_.isObject(cssClass)) {
      ref$ = [cssClass, null], attributes = ref$[0], cssClass = ref$[1];
    }
    if (typeof cssClass === 'string') {
      (attributes || (attributes = {}))['class'] = cssClass;
    }
    name = d3.ns.qualify(tagName);
    if (name.local) {
      el = document.createElementNS(name.space, name.local);
    } else {
      el = document.createElement(name);
    }
    if (attributes) {
      jQuery(el).attr(attributes);
    }
    return el;
  }
};
_.mixin(import$(exports, _dom));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/function.js', function(require, module, exports, __dirname, __filename, undefined){

var _, _fn, slice$ = [].slice;
_ = require('underscore');
_fn = {
  /**
   * Decorates a function so that its receiver (`this`) is always added as the
   * first argument, followed by the call arguments.
   * @returns {Function}
   */
  methodize: function(fn){
    var m, g, that;
    m = fn.__methodized__;
    if (m) {
      return m;
    }
    g = fn.__genericized__;
    if (that = g != null ? g.__wraps__ : void 8) {
      return that;
    }
    m = fn.__methodized__ = function(){
      var args;
      args = slice$.call(arguments);
      args.unshift(this);
      return fn.apply(this, args);
    };
    m.__wraps__ = fn;
    return m;
  }
  /**
   * Tests whether `val` is a function, calling it with the supplied context
   * and/or arguments if so, and returning it unchanged otherwise.
   * 
   * @param {Function|*} val Value to test.
   * @param {Object} [context=this] Execution context for `val` if it is a function.
   * @param {*} ...args Arguments to pass if `val` is a function.
   * @returns {*} Value or result.
   */,
  resulting: function(val, context){
    var args;
    context == null && (context = this);
    args = slice$.call(arguments, 2);
    if (typeof val !== 'function') {
      return val;
    }
    return val.apply(context, args);
  }
};
_.mixin(import$(exports, _fn));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/knockout.js', function(require, module, exports, __dirname, __filename, undefined){

var root, _, _ko_obj, getProto, OBJ_PROTO, ref$, hasOwn, objToString, DEFAULT_DELEGATE_OPTIONS, TOMBSTONE, DEFAULT_NESTED_OPTIONS, slice$ = [].slice;
root = function(){
  return this;
}();
_ = (typeof require == 'function' ? require('underscore') : void 8) || root._;
if (!(_ko_obj = (typeof module != 'undefined' && module !== null ? module.exports : void 8) || (typeof exports != 'undefined' && exports !== null))) {
  root.UnderscoreNested = _ko_obj = {};
}
getProto = Object.getPrototypeOf;
OBJ_PROTO = Object.prototype;
ref$ = {}, hasOwn = ref$.hasOwnProperty, objToString = ref$.toString;
/**
 * Default options for delegate-accessor functions.
 */
DEFAULT_DELEGATE_OPTIONS = _ko_obj.DEFAULT_DELEGATE_OPTIONS = {
  getter: 'get',
  setter: 'set',
  deleter: 'unset'
  /**
   * Performs any `get`s required inside a ignore block, temporarily 
   * circumventing dependency tracking.
   */,
  ignore: false
  /**
   * Unwrap observables to perform a get, rather than invoking them.
   * This both circumvents dependency tracking and squlches events.
   */,
  unwrap: false
};
/**
 * Tombstone for deleted, non-passthrough keys.
 */
TOMBSTONE = _ko_obj.TOMBSTONE = {};
/**
 * Default options for nested-accessor functions.
 */
DEFAULT_NESTED_OPTIONS = _ko_obj.DEFAULT_NESTED_OPTIONS = import$({
  ensure: false,
  tombstone: TOMBSTONE
}, DEFAULT_DELEGATE_OPTIONS);
/**
 * @namespace Functions for working with objects and object graphs.
 */
/**
 * Gets the value at `key` from the object if present, returning `def` otherwise.
 * 
 * @param {Object} object Object on which to perform lookup.
 * @param {String} key Key to get.
 * @param {*} [def=undefined] Default value.
 * @param {Object} [opts] Options.
 * @returns {*} Value or default.
 */
_ko_obj.get = function(obj, key, def, opts){
  var getter, val, v;
  if (obj == null) {
    return;
  }
  getter = (opts != null ? opts.getter : void 8) || 'get';
  if (typeof obj[getter] === 'function') {
    return obj[getter](key, def, opts);
  }
  val = obj[key];
  if (ko.isObservable(val)) {
    if ((v = val()) !== void 8) {
      return v;
    } else {
      return def;
    }
  } else {
    if (val !== void 8) {
      return val;
    } else {
      return def;
    }
  }
};
/**
 * Puts the given value to `key` on the given target object.
 * 
 * @param {Object} target Target object for the set.
 * @param {String|Object} key The key to set. If an object is supplied here, each key will be set with its value on the target object.
 * @param {*} [value] Value to set at `key`. Omit this if an object of KV-pairs was passed as `key`.
 * @param {Object} [opts] Options.
 * @returns {Object} The target object.
 */
_ko_obj.set = function(obj, key, value, opts){
  var ref$, values, ref1$, setter, current;
  if (obj == null) {
    return;
  }
  if (key != null && _.isObject(key)) {
    ref$ = [key, value], values = ref$[0], opts = ref$[1];
  } else {
    values = (ref1$ = {}, ref1$[key + ""] = value, ref1$);
  }
  setter = (opts != null ? opts.setter : void 8) || 'set';
  if (typeof obj[setter] === 'function') {
    for (key in values) {
      value = values[key];
      obj[setter](key, value, opts);
    }
  } else {
    for (key in values) {
      value = values[key];
      current = obj[key];
      if (ko.isObservable(current)) {
        current(value);
      } else {
        obj[key] = value;
      }
    }
  }
  return obj;
};
/**
 * Deletes `key` from the target object.
 * 
 * @param {Object} target Target object.
 * @param {String} key Key to be deleted.
 * @param {Object} [opts] Options.
 * @returns {*} Value at `key` prior to being removed from the target.
 */
_ko_obj.unset = function(obj, key, opts){
  var deleter, val, ref$;
  if (obj == null) {
    return;
  }
  deleter = (opts != null ? opts.deleter : void 8) || 'unset';
  if (typeof obj[deleter] === 'function') {
    return obj[deleter](key, opts);
  } else {
    val = obj[key];
    if (ko.isObservable(val)) {
      return val(null);
    } else {
      return ref$ = obj[key], delete obj[key], ref$;
    }
  }
};
/**
 * Searches a hierarchical object for a given subkey specified in dotted-property syntax,
 * respecting sub-object accessor-methods (e.g., 'get', 'set') if they exist.
 * 
 * @param {Object} base The object to serve as the root of the property-chain.
 * @param {Array|String} chain The property-chain to lookup.
 * @param {Object} [opts] Options:
 * @param {Boolean} [opts.ensure=false] If true, intermediate keys that are `null` or
 *  `undefined` will be filled in with a new empty object `{}`, ensuring the get will
 *   return valid metadata.
 * @param {String} [opts.getter="get"] Name of the sub-object getter method use if it exists.
 * @param {String} [opts.setter="set"] Name of the sub-object setter method use if it exists.
 * @param {String} [opts.deleter="unset"] Name of the sub-object deleter method use if it exists.
 * @param {Object} [opts.tombstone=TOMBSTONE] Sentinel value to be interpreted as no-passthrough,
 *  forcing the lookup to fail and return `undefined`. TODO: opts.returnTombstone
 * @returns {undefined|Object} If found, the object is of the form 
 *  `{ key: Qualified key name, obj: Parent object of key, val: Value at obj[key], opts: Options }`. 
 *  Otherwise `undefined`.
 */
_ko_obj.getNestedMeta = function(obj, chain, opts){
  var len;
  if (typeof chain === 'string') {
    chain = chain.split('.');
  }
  len = chain.length - 1;
  opts = import$(_.clone(DEFAULT_NESTED_OPTIONS), opts || {});
  return _.reduce(chain, function(obj, key, idx){
    var val;
    if (obj == null) {
      return;
    }
    val = _ko_obj.get(obj, key, void 8, opts);
    if (val === opts.tombstone) {
      if (!ops.ensure) {
        return;
      }
      val = void 8;
    }
    if (idx === len) {
      return {
        key: key,
        val: val,
        obj: obj,
        opts: opts
      };
    }
    if (val == null && opts.ensure) {
      val = {};
      _ko_obj.set(obj, key, val, opts);
    }
    return val;
  }, obj);
};
/**
 * Searches a hierarchical object for a given subkey specified in dotted-property syntax.
 * 
 * @param {Object} obj The object to serve as the root of the property-chain.
 * @param {Array|String} chain The property-chain to lookup.
 * @param {Any} [def=undefined] Value to return if lookup fails.
 * @param {Object} [opts] Options to pass to `{@link #getNestedMeta}`.
 * @returns {null|Object} If found, returns the value, and otherwise `default`.
 */
_ko_obj.getNested = function(obj, chain, def, opts){
  var meta;
  meta = _ko_obj.getNestedMeta(obj, chain, opts);
  if ((meta != null ? meta.val : void 8) === void 8) {
    return def;
  }
  return meta.val;
};
/**
 * Searches a hierarchical object for a given subkey specified in
 * dotted-property syntax, setting it with the provided value if found.
 * 
 * @param {Object} root The object to serve as the root of the property-chain.
 * @param {Array|String} chain The property-chain to lookup.
 * @param {Any} value The value to set.
 * @param {Object} [opts] Options to pass to `{@link #getNestedMeta}`.
 * @returns {undefined|Any} If found, returns the old value, and otherwise `undefined`.
 */
_ko_obj.setNested = function(root, chain, value, opts){
  var meta, obj, key, val;
  if (!(meta = _ko_obj.getNestedMeta(root, chain, opts))) {
    return;
  }
  obj = meta.obj, key = meta.key, val = meta.val, opts = meta.opts;
  _ko_obj.set(obj, key, value, opts);
  return val;
};
/**
 * Searches a hierarchical object for a potentially-nested key and removes it.
 * 
 * @param {Object} obj The root of the lookup chain.
 * @param {String|Array<String>} chain The chain of property-keys to navigate.
 *  Nested keys can be supplied as a dot-delimited string (e.g., `_.unsetNested(obj, 'user.name')`),
 *  or an array of strings, allowing for keys with dots (eg.,
 *  `_.unsetNested(obj, ['products', 'by_price', '0.99'])`).
 * @param {Object} [opts] Options to pass to `{@link #getNestedMeta}`.
 * @returns {undefined|Any} The old value if found; otherwise `undefined`.
 */
_ko_obj.unsetNested = function(obj, chain, opts){
  var meta, key, val;
  if (!(meta = _ko_obj.getNestedMeta(obj, chain, opts))) {
    return;
  }
  obj = meta.obj, key = meta.key, val = meta.val, opts = meta.opts;
  _ko_obj.unset(obj, key, opts);
  return val;
};
/**
 * @returns {Boolean} Whether value is a plain object or not.
 */
_ko_obj.isPlainObject = function(obj){
  var key;
  if (!obj || objToString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval) {
    return false;
  }
  if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
    return false;
  }
  for (key in obj) {}
  return key === void 8 || hasOwn.call(obj, key);
};
/**
 * In-place removal of a value from an Array or Object.
 * 
 * @param {Object} obj The object.
 * @param {*} v Value to remove.
 * @returns {Object} The object, `obj`.
 */
_ko_obj.remove = function(obj, v){
  var values, i$, len$, idx, k;
  values = [].slice.call(arguments, 1);
  if (_.isArray(obj) || obj instanceof Array) {
    for (i$ = 0, len$ = values.length; i$ < len$; ++i$) {
      v = values[i$];
      idx = obj.indexOf(v);
      if (idx !== -1) {
        obj.splice(idx, 1);
      }
    }
  } else {
    for (k in obj) {
      v = obj[k];
      if (-1 !== values.indexOf(v)) {
        delete obj[k];
      }
    }
  }
  return obj;
};
/**
 * Converts the collection to a list of its items:
 * - Objects become a list of `[key, value]` pairs.
 * - Strings become a list of characters.
 * - Arguments objects become an array.
 * - Arrays are copied.
 */
_ko_obj.items = function(obj){
  if (_.isObject(obj) && !_.isArguments(obj)) {
    return _.map(obj, function(v, k){
      return [k, v];
    });
  } else {
    return [].slice.call(obj);
  }
};
/**
 * Recursively merges together any number of donor objects into the target object.
 * Modified from `jQuery.extend()`.
 * 
 * @param {Object} target Target object of the merge.
 * @param {Object} ...donors Donor objects.
 * @returns {Object} 
 */
_ko_obj.merge = function(target){
  var donors, i$, len$, donor;
  target == null && (target = {});
  donors = slice$.call(arguments, 1);
  if (!(typeof target === "object" || _.isFunction(target))) {
    target = _.isArray(donors[0])
      ? []
      : {};
  }
  for (i$ = 0, len$ = donors.length; i$ < len$; ++i$) {
    donor = donors[i$];
    if (donor == null) {
      continue;
    }
    _.each(donor, fn$);
  }
  return target;
  function fn$(value, key){
    var current, valueIsArray;
    current = target[key];
    if (target === value) {
      return;
    }
    if (value && (_ko_obj.isPlainObject(value) || (valueIsArray = _.isArray(value)))) {
      if (valueIsArray) {
        if (!_.isArray(current)) {
          current = [];
        }
      } else {
        if (!(current && typeof current === 'object')) {
          current = {};
        }
      }
      return _ko_obj.set(target, key, _ko_obj.merge(current, value));
    } else if (value !== void 8) {
      return _ko_obj.set(target, key, value);
    }
  }
};
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/object.js', function(require, module, exports, __dirname, __filename, undefined){

var _, _pick, _obj;
_ = require('underscore');
_pick = _.pick;
_obj = {
  /**
   * Aliases properties. Takes a hash of `src` -> `dest` pairs of property names
   * and copies the value found at `src` to the key `dest`. Destination properties
   * will be split on whitespace (and may even be an array), and the value will be
   * copied to each.
   * 
   * @param {Object} obj The target object.
   * @param {Map<String, String|Array>} names Hash of `src-dest` property pairs.
   * @returns {obj} The target object.
   */
  alias: function(obj, names){
    _.each(names, function(dests, src){
      var this$ = this;
      if (!_.isArray(dests)) {
        dests = dests.split(/\s+/g);
      }
      return _.each(dests, function(dest){
        return obj[dest] = obj[src];
      });
    });
    return obj;
  }
  /**
   * As `_.pick()`, but also accepts a function to filter the object:
   * 
   *      `fn.call(obj, value, key, obj) -> Boolean`
   * 
   * ...in addition to a list of Strings whitelisting keys acceptable in the
   * resulting object.
   * 
   * @param {Object} obj Object to filter.
   * @param {Function|String} fn Function to filter by; otherwise
   *  normal `_.pick()` behavior.
   * @param {Object} [cxt=obj] Context object for the filter function.
   * @returns {Object} Resulting filtered object.
   */,
  pick: function(obj, fn, cxt){
    cxt == null && (cxt = obj);
    if (typeof fn === 'function') {
      return _.reduce_({}, function(acc, v, k){
        if (fn.call(cxt, v, k, obj)) {
          acc[k] = v;
        }
        return acc;
      });
    } else {
      return _pick.apply(this, arguments);
    }
  }
};
_.mixin(import$(exports, _obj));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/string.js', function(require, module, exports, __dirname, __filename, undefined){

var _, _str, _string, slice$ = [].slice;
_ = require('underscore');
_str = require('underscore.string');
_string = {
  /**
   * As _.str.chop but from the right.
   */
  rchop: function(s, step){
    var i, out;
    s = String(s);
    i = s.length;
    step = Number(step);
    out = [];
    if (step <= 0) {
      return [s];
    }
    while (i > 0) {
      out.unshift(s.slice(Math.max(0, i - step), i));
      i -= step;
    }
    return out;
  },
  drop: function(s){
    var parts, starting, i$, len$, part;
    parts = slice$.call(arguments, 1);
    do {
      starting = s;
      for (i$ = 0, len$ = parts.length; i$ < len$; ++i$) {
        part = parts[i$];
        if (_str.startsWith(s, part)) {
          s = s.slice(part.length);
        }
        if (_str.endsWith(s, part)) {
          s = s.slice(0, s.lengthPart.length);
        }
      }
    } while (s && s !== starting);
    return s;
  },
  ldrop: function(s){
    var parts, starting, i$, len$, part;
    parts = slice$.call(arguments, 1);
    do {
      starting = s;
      for (i$ = 0, len$ = parts.length; i$ < len$; ++i$) {
        part = parts[i$];
        if (_str.startsWith(s, part)) {
          s = s.slice(part.length);
        }
      }
    } while (s && s !== starting);
    return s;
  },
  rdrop: function(s){
    var parts, starting, i$, len$, part;
    parts = slice$.call(arguments, 1);
    do {
      starting = s;
      for (i$ = 0, len$ = parts.length; i$ < len$; ++i$) {
        part = parts[i$];
        if (_str.endsWith(s, part)) {
          s = s.slice(0, s.lengthPart.length);
        }
      }
    } while (s && s !== starting);
    return s;
  }
  /**
   * Converts to snake_case, concatenates the key-value pair (with '_'), normalizing _'s.
   * If only a key is given, domize auto-curries and waits for a second argument.
   */,
  domize: function(key, value){
    key == null && (key = '');
    value == null && (value = '');
    key = _str.trim(_str.underscored(key), '_');
    if (arguments.length <= 1) {
      return arguments.callee.bind(this, key);
    } else {
      return key + "_" + _str.trim(_str.underscored(value), '_');
    }
  },
  shortname: function(s){
    var parts;
    if (s.length <= 6) {
      return s;
    }
    parts = _(s).chain().underscored().trim('_').value().replace(/_+/g, '_').split('_').map(function(it){
      return _.capitalize(it.slice(0, 2));
    });
    if (parts.length === 1) {
      return s;
    }
    return parts.shift().toLowerCase() + parts.join('');
  }
};
import$(_string, {
  dropLeft: _string.ldrop,
  dropRight: _string.rdrop
});
_.mixin(import$(exports, _string));
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

});

;
require.define('/node_modules/limn/util/underscore/index.js', function(require, module, exports, __dirname, __filename, undefined){

var _, exports;
_ = require('underscore');
_.mixin(require('underscore.nested'));
_.mixin(require('underscore.kv'));
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.mixin(require('./function'));
_.mixin(require('./array'));
_.mixin(require('./object'));
_.mixin(require('./class'));
_.mixin(require('./string'));
if (process.title === 'browser') {
  _.mixin(require('./dom'));
}
/**
 * Dumps a pleasantly formatted version of an object to the console.
 */
_.dump = function(o, label, expanded){
  var k, v;
  label == null && (label = 'dump');
  expanded == null && (expanded = true);
  if (!_.isArray(o) && _.isObject(o)) {
    if (expanded) {
      console.group(label);
    } else {
      console.groupCollapsed(label);
    }
    for (k in o) {
      v = o[k];
      console.log(k + ":", v);
    }
    console.groupEnd();
  } else {
    console.log(label, o);
  }
  return o;
};
module.exports = exports = _;

});

