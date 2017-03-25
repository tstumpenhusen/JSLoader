define(function() {
  "use strict";

  /**
   * IE8 fix for indexOf
   * @type {number}
   */
  Array.prototype.indexOf = Array.prototype.indexOf || function(value) {
    for (var i in this) {
      if (this[i] === value) {
        return i;
      }
    }
    return -1;
  };

  /**
   * IE8 fix for bind
   * @type {Function}
   */
  Function.prototype.bind = Function.prototype.bind || function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP    = function() {},
      fBound  = function() {
        return fToBind.apply(this instanceof fNOP && oThis
            ? this
            : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
  
  var _JS = {
    getType: function(variable) {
      return Object.prototype.toString.call(variable);
    },
    Eventer: {
      windowLoad: function(callback) {
        if (typeof callback === "function") {
          if (document.readyState !== "complete") {
            window.addEventListener("load", callback);
          } else {
            return callback();
          }
        } else {
          return false;
        }
      }
    },
    Creater: {
      createInstance: function(obj, arg) {
        // Create array out of arguments
        arg = Array.prototype.slice.call(arg);

        // add empty value at position 0 to make sure all parameters pass correctly
        arg.splice(0, 0, undefined);

        // This adds all parameters from getInstance to the constructor
        return new (obj.bind.apply(obj, arg))();
      }
    },
    Ajax: {
      Request: function() {
        var _request = null,
          _callback = null,
          _errorback = null,
          _data = "";

        /**
         * Creates new XMLHttpRequest and sets Defaults by method
         *
         * @param method
         * @param url
         * @param data
         * @constructor
         */
        function Request(method, url, data) {
          method = method.toUpperCase();
          _request = new XMLHttpRequest();
          _request.open(method, url, true);
          _data = data;

          if (method === "POST") {
            this.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
          }

          _request.onload = function() {
            if (_request.status >= 200 && _request.status < 400) {
              var data = null;
              if (method === "JSON") {
                data = JSON.parse(_request.responseText);
              } else {
                data = _request.responseText;
              }

              if (typeof _callback === "function") {
                _callback(data);
              }

            } else {
              if (typeof _errorback === "function") {
                _errorback(_request.status);
              }
            }
          }
        }

        Request.prototype = {
          /**
           * Sets Header of Request
           * @param header
           * @param value
           * @chainable
           * @returns {Request}
           */
          setRequestHeader: function(header, value) {
            _request.setRequestHeader(header, value);
            return this;
          },

          /**
           * Sets Callback for successful ajax-request
           * @param callback
           * @returns {Request}
           */
          setCallback: function(callback) {
            if (typeof callback === "function") {
              _callback = callback;
            }
            return this;
          },

          /**
           * Sets Errorback for failed ajax-request
           * @param errorback
           * @returns {Request}
           */
          setErrorback: function(errorback) {
            if (typeof errorback === "function") {
              _request.onerror = errorback;
            }
            return this;
          },

          /**
           * Sets the data sent by the request
           * @param data
           * @returns {Request}
           */
          setData: function(data) {
            _data = data;
            return this;
          },

          /**
           * Triggers Request to send
           */
          send: function() {
            _request.send(_data);
          }
        };

        return _JS.Creater.createInstance(Request, arguments);
      }
    },
    Loader: function() {
      return new (function() {
        var _config = {},
            _cssLoaded = [],
            _head = undefined,
            _firstLoad = true;

        /**
         * Splits Selectors from Configurations
         * @param {object} config
         * @private
         */
        function _parseConfig(config) {
          for (var selector in config) {
            _parseConfigNode(selector, config[selector]);
          }
        }

        /**
         * Validate Configuration and Call Config Save
         * @param {string} selector
         * @param {object} config
         * @private
         */
        function _parseConfigNode(selector, config) {
          var configType = _JS.getType(config);

          if (configType === "[object Array]") {
            for (var index = 0; index < config.length; index++) {
              _parseConfigNode(selector, config[index]);
            }
          } else if (configType === "[object Object]") {
            // Validate Callback
            var functionDefaults = {
              callback: undefined,
              errback: undefined
            };

            for (var i in functionDefaults) {
              config[i] = typeof config[i] === "function" ? config[i] : functionDefaults[i];
            }

            // Default value for extensions if not set, to identify later
            if (!config.hasOwnProperty("extensions") || _JS.getType(config.extensions) !== "[object Array]") {
              config.extensions = null;
            }

            config.styles = _getParsedCssConfigArray(config.styles);

            _addConfigToSelector(selector, config);
          } else {
            console.error("Invalid Configuration given for " + selector + "!", config);
          }
        }

        /**
         *
         * @param styleConfigs
         * @returns {*}
         * @private
         */
        function _getParsedCssConfigArray(styleConfigs) {
          var result = [];
          switch (_JS.getType(styleConfigs)) {
            case "[object String]":
              result = [{href: styleConfigs}];
              break;

            case "[object Array]":
              var configArray = [];
              for (var i = 0; i < styleConfigs.length; i++) {
                var styleConfig = _getParsedCssConfig(styleConfigs[i]);
                styleConfig = _setCssDefaultValues(styleConfig);

                if (styleConfig !== undefined) {
                  configArray.push(styleConfig);
                }
              }
              result = configArray;
              break;
          }
          return result;
        }

        /**
         *
         * @param styleConfig
         * @returns {undefined|{}}
         * @private
         */
        function _getParsedCssConfig(styleConfig) {
          if (typeof styleConfig !== "string" && styleConfig.href === undefined) {
            return undefined;
          }

          // If array of strings is configured, parse it
          if (typeof styleConfig === "string") {
            return _getParsedCssConfig({href: styleConfig});
          }

          // If href is a string
          if (typeof styleConfig.href === "string") {

            // Get Position of Fileending
            var fileEndingIndex = styleConfig.href.indexOf(".css");

            // If Fileending exists, everythings fine
            if (fileEndingIndex === styleConfig.href.length - 4) {
              return styleConfig;

              // If Fileending missing, add .css
            } else if (fileEndingIndex == -1) {
              styleConfig.href += ".css";
              return styleConfig;
            }
            // If nothing happened before, its clearly broken and should not be executed
            return undefined;
          }
          return undefined;
        }

        function _setCssDefaultValues(config) {
          if (typeof config !== "object" || config.href === undefined) {
            return undefined;
          }

          var cssDefaults = {
            rel: "stylesheet",
            media: "all",
            type: "text/css"
          };

          for (var attr in cssDefaults) {
            config[attr] = config[attr] ? config[attr] : cssDefaults[attr];
          }
          return config;
        }

        /**
         * Saves Configuration in Config-Array for Selector
         * @param {string} selector
         * @param {object} config
         * @private
         */
        function _addConfigToSelector(selector, config) {
          if (!_config.hasOwnProperty(selector)) {
            _config[selector] = [];
          }
          _config[selector].push(config);
        }

        /**
         * Calls load for all Selectors
         * @private
         */
        function _loadAll(requireInstance) {
          if (requireInstance === undefined) {
            requireInstance = requireBase;
          }
          for (var index in _config) {
            _load(requireInstance, index, _config[index]);
          }
        }

        /**
         * Call loading of extensions for each configuration in selector
         * @param {function} requireInstance - Instance of requireJS
         * @param {string} selector
         * @param {...object} configArray
         * @private
         */
        function _load(requireInstance, selector, configArray) {
          var result = false;
          for (var index = 0; index < configArray.length; index++) {
            result = _loadIfElementExists(requireInstance, selector, configArray[index], result);
            if (!result) {
              break;
            }
          }
        }

        /**
         * Saves hrefs of loaded css to prevent loading these file again
         * Only executed once
         * @private
         */
        function _findLoadedCss() {
          if (_firstLoad) {
            _firstLoad = false;
            for (var i = 0; i < document.styleSheets.length; i++) {
              var useIE = document.styleSheets[i].ownerNode === undefined;
              var owner = document.styleSheets[i].ownerNode || document.styleSheets[i].owningElement;
              if (useIE) {
                for (var j = 0; i < owner.length; j++) {
                  if (owner[j].name === "href") {
                    owner = owner[j];
                    break;
                  }
                }
                _cssLoaded.push(owner.value);
              } else {
                owner.getAttribute("href");
              }
            }
          }
        }

        /**
         * Uses RequireJs to load Extensions if element exists
         * @param {function} requireInstance - Instance of requireJS
         * @param {string} selector
         * @param {object} config
         * @param {boolean} [elementAlreadyFound]
         * @returns {boolean} true = success | false = element not found, load aborted
         * @private
         */
        function _loadIfElementExists(requireInstance, selector, config, elementAlreadyFound) {
          if (!!elementAlreadyFound || _checkElementExistence(selector)) {
            _loadCSS(config.styles);
            if (config.extensions !== null) {
              requireInstance(config.extensions, config.callback, config.errback);
            }
            return true;
          }
          return false;
        }

        /**
         * Creates new Link-Elements and adds them to head, if css file hasn't been loaded yet
         * @param cssConfigs[]
         * @private
         */
        function _loadCSS(cssConfigs) {
          if (cssConfigs.length > 0 && _head === undefined) {
            _head = document.querySelector("head")
          }
          // for each configuration
          for (var i = 0; i < cssConfigs.length; i++) {
            var cssConfig = cssConfigs[i];

            // Only Create Element, if css not already loaded
            if (_cssLoaded.indexOf(cssConfig.href) === -1) {
              var link = document.createElement("link");

              // Apply attributes to link element
              for (var attribute in cssConfig) {
                var value = cssConfig[attribute];
                link.setAttribute(attribute, value);
              }

              // Add link element and
              _head.appendChild(link);
              _cssLoaded.push(cssConfig.href);
            }
          }
        }

        /**
         * Starts Parsing for ||, && and !
         * @param {string} selector
         * @returns {boolean}
         * @private
         */
        function _checkElementExistence(selector) {
          return _parseOr(selector);
        }

        /**
         * Parses OR in selector
         * @param {string} selector
         * @returns {boolean}
         * @private
         */
        function _parseOr(selector) {
          // Or aborts, when first true-value occurs
          var result,
            selectors = selector.split("||");

          for (var i = 0; i < selectors.length; i++) {
            result = _parseAnd(selectors[i]);
            if (result) {
              break;
            }
          }
          return result;
        }

        /**
         * Parses AND in selector
         * @param {string} selector
         * @returns {boolean}
         * @private
         */
        function _parseAnd(selector) {
          // And aborts, when first false-value occurs
          var result,
            selectors = selector.split("&&");

          for (var i = 0; i < selectors.length; i++) {
            result = _parseNot(selectors[i]);
            if (!result) {
              break;
            }
          }
          return result;
        }

        /**
         * Checks element existence or non-existence
         * @param {string} selector - valid CSS-Selector with or without ! before
         * @returns {boolean}
         * @private
         */
        function _parseNot(selector) {
          var negate = selector.indexOf("!") > -1;

          if (negate) {
            selector = selector.split("!").pop();
          }

          var element = !document.querySelector(selector);

          if (negate && element) {
            return element;
          }
          return !element;
        }

        var Loader = function() {};

        Loader.prototype = {
          getConfig: function() {
            return _config;
          },
          /**
           * Parses and saved Configuration for later loading
           * @param {object} config
           * @returns {object}
           */
          addConfig: function(config) {
            _parseConfig(config);
            return this;
          },

          /**
           * Loads all Extensions when Dom is loaded
           * @param {object} [requireInstance] - Instance of requireJS
           * @see _loadAll
           */
          load: function(requireInstance) {
            _JS.Eventer.windowLoad(function() {
              _findLoadedCss();
              _loadAll(requireInstance);
            });
          }
        };

        return new Loader();
      })();
    }
  };

  return {
    getLoader: function() {
      return _JS.Loader();
    },
    getEventer: function() {
      return _JS.Eventer;
    },
    getCreater: function() {
      return _JS.Creater;
    },
    Ajax: {
      json: function(url, data) {
        return new _JS.Ajax.Request("JSON", url, data);
      },
      post: function(url, data) {
        return new _JS.Ajax.Request("POST", url, data);
      },
      get: function(url, data) {
        return new _JS.Ajax.Request("GET", url, data);
      }
    }
  };
});