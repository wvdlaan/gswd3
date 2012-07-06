var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4450__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4450 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4450__delegate.call(this, array, i, idxs)
    };
    G__4450.cljs$lang$maxFixedArity = 2;
    G__4450.cljs$lang$applyTo = function(arglist__4451) {
      var array = cljs.core.first(arglist__4451);
      var i = cljs.core.first(cljs.core.next(arglist__4451));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4451));
      return G__4450__delegate(array, i, idxs)
    };
    G__4450.cljs$lang$arity$variadic = G__4450__delegate;
    return G__4450
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____4452 = this$;
      if(and__3822__auto____4452) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____4452
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____4453 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4453) {
          return or__3824__auto____4453
        }else {
          var or__3824__auto____4454 = cljs.core._invoke["_"];
          if(or__3824__auto____4454) {
            return or__3824__auto____4454
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____4455 = this$;
      if(and__3822__auto____4455) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____4455
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____4456 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4456) {
          return or__3824__auto____4456
        }else {
          var or__3824__auto____4457 = cljs.core._invoke["_"];
          if(or__3824__auto____4457) {
            return or__3824__auto____4457
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____4458 = this$;
      if(and__3822__auto____4458) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____4458
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____4459 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4459) {
          return or__3824__auto____4459
        }else {
          var or__3824__auto____4460 = cljs.core._invoke["_"];
          if(or__3824__auto____4460) {
            return or__3824__auto____4460
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____4461 = this$;
      if(and__3822__auto____4461) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____4461
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____4462 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4462) {
          return or__3824__auto____4462
        }else {
          var or__3824__auto____4463 = cljs.core._invoke["_"];
          if(or__3824__auto____4463) {
            return or__3824__auto____4463
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____4464 = this$;
      if(and__3822__auto____4464) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____4464
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____4465 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4465) {
          return or__3824__auto____4465
        }else {
          var or__3824__auto____4466 = cljs.core._invoke["_"];
          if(or__3824__auto____4466) {
            return or__3824__auto____4466
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____4467 = this$;
      if(and__3822__auto____4467) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____4467
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____4468 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4468) {
          return or__3824__auto____4468
        }else {
          var or__3824__auto____4469 = cljs.core._invoke["_"];
          if(or__3824__auto____4469) {
            return or__3824__auto____4469
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____4470 = this$;
      if(and__3822__auto____4470) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____4470
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____4471 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4471) {
          return or__3824__auto____4471
        }else {
          var or__3824__auto____4472 = cljs.core._invoke["_"];
          if(or__3824__auto____4472) {
            return or__3824__auto____4472
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____4473 = this$;
      if(and__3822__auto____4473) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____4473
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____4474 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4474) {
          return or__3824__auto____4474
        }else {
          var or__3824__auto____4475 = cljs.core._invoke["_"];
          if(or__3824__auto____4475) {
            return or__3824__auto____4475
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____4476 = this$;
      if(and__3822__auto____4476) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____4476
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____4477 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4477) {
          return or__3824__auto____4477
        }else {
          var or__3824__auto____4478 = cljs.core._invoke["_"];
          if(or__3824__auto____4478) {
            return or__3824__auto____4478
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____4479 = this$;
      if(and__3822__auto____4479) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____4479
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____4480 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4480) {
          return or__3824__auto____4480
        }else {
          var or__3824__auto____4481 = cljs.core._invoke["_"];
          if(or__3824__auto____4481) {
            return or__3824__auto____4481
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____4482 = this$;
      if(and__3822__auto____4482) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____4482
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____4483 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4483) {
          return or__3824__auto____4483
        }else {
          var or__3824__auto____4484 = cljs.core._invoke["_"];
          if(or__3824__auto____4484) {
            return or__3824__auto____4484
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____4485 = this$;
      if(and__3822__auto____4485) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____4485
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____4486 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4486) {
          return or__3824__auto____4486
        }else {
          var or__3824__auto____4487 = cljs.core._invoke["_"];
          if(or__3824__auto____4487) {
            return or__3824__auto____4487
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____4488 = this$;
      if(and__3822__auto____4488) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____4488
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____4489 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4489) {
          return or__3824__auto____4489
        }else {
          var or__3824__auto____4490 = cljs.core._invoke["_"];
          if(or__3824__auto____4490) {
            return or__3824__auto____4490
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____4491 = this$;
      if(and__3822__auto____4491) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____4491
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____4492 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4492) {
          return or__3824__auto____4492
        }else {
          var or__3824__auto____4493 = cljs.core._invoke["_"];
          if(or__3824__auto____4493) {
            return or__3824__auto____4493
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____4494 = this$;
      if(and__3822__auto____4494) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____4494
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____4495 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4495) {
          return or__3824__auto____4495
        }else {
          var or__3824__auto____4496 = cljs.core._invoke["_"];
          if(or__3824__auto____4496) {
            return or__3824__auto____4496
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____4497 = this$;
      if(and__3822__auto____4497) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____4497
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____4498 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4498) {
          return or__3824__auto____4498
        }else {
          var or__3824__auto____4499 = cljs.core._invoke["_"];
          if(or__3824__auto____4499) {
            return or__3824__auto____4499
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____4500 = this$;
      if(and__3822__auto____4500) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____4500
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____4501 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4501) {
          return or__3824__auto____4501
        }else {
          var or__3824__auto____4502 = cljs.core._invoke["_"];
          if(or__3824__auto____4502) {
            return or__3824__auto____4502
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____4503 = this$;
      if(and__3822__auto____4503) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____4503
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____4504 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4504) {
          return or__3824__auto____4504
        }else {
          var or__3824__auto____4505 = cljs.core._invoke["_"];
          if(or__3824__auto____4505) {
            return or__3824__auto____4505
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____4506 = this$;
      if(and__3822__auto____4506) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____4506
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____4507 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4507) {
          return or__3824__auto____4507
        }else {
          var or__3824__auto____4508 = cljs.core._invoke["_"];
          if(or__3824__auto____4508) {
            return or__3824__auto____4508
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____4509 = this$;
      if(and__3822__auto____4509) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____4509
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____4510 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4510) {
          return or__3824__auto____4510
        }else {
          var or__3824__auto____4511 = cljs.core._invoke["_"];
          if(or__3824__auto____4511) {
            return or__3824__auto____4511
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____4512 = this$;
      if(and__3822__auto____4512) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____4512
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____4513 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4513) {
          return or__3824__auto____4513
        }else {
          var or__3824__auto____4514 = cljs.core._invoke["_"];
          if(or__3824__auto____4514) {
            return or__3824__auto____4514
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____4515 = coll;
    if(and__3822__auto____4515) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____4515
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4516 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4516) {
        return or__3824__auto____4516
      }else {
        var or__3824__auto____4517 = cljs.core._count["_"];
        if(or__3824__auto____4517) {
          return or__3824__auto____4517
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____4518 = coll;
    if(and__3822__auto____4518) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____4518
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4519 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4519) {
        return or__3824__auto____4519
      }else {
        var or__3824__auto____4520 = cljs.core._empty["_"];
        if(or__3824__auto____4520) {
          return or__3824__auto____4520
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____4521 = coll;
    if(and__3822__auto____4521) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____4521
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____4522 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4522) {
        return or__3824__auto____4522
      }else {
        var or__3824__auto____4523 = cljs.core._conj["_"];
        if(or__3824__auto____4523) {
          return or__3824__auto____4523
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____4524 = coll;
      if(and__3822__auto____4524) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____4524
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____4525 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4525) {
          return or__3824__auto____4525
        }else {
          var or__3824__auto____4526 = cljs.core._nth["_"];
          if(or__3824__auto____4526) {
            return or__3824__auto____4526
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____4527 = coll;
      if(and__3822__auto____4527) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____4527
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____4528 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4528) {
          return or__3824__auto____4528
        }else {
          var or__3824__auto____4529 = cljs.core._nth["_"];
          if(or__3824__auto____4529) {
            return or__3824__auto____4529
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____4530 = coll;
    if(and__3822__auto____4530) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____4530
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4531 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4531) {
        return or__3824__auto____4531
      }else {
        var or__3824__auto____4532 = cljs.core._first["_"];
        if(or__3824__auto____4532) {
          return or__3824__auto____4532
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____4533 = coll;
    if(and__3822__auto____4533) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____4533
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4534 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4534) {
        return or__3824__auto____4534
      }else {
        var or__3824__auto____4535 = cljs.core._rest["_"];
        if(or__3824__auto____4535) {
          return or__3824__auto____4535
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____4536 = o;
      if(and__3822__auto____4536) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____4536
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____4537 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4537) {
          return or__3824__auto____4537
        }else {
          var or__3824__auto____4538 = cljs.core._lookup["_"];
          if(or__3824__auto____4538) {
            return or__3824__auto____4538
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____4539 = o;
      if(and__3822__auto____4539) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____4539
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____4540 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4540) {
          return or__3824__auto____4540
        }else {
          var or__3824__auto____4541 = cljs.core._lookup["_"];
          if(or__3824__auto____4541) {
            return or__3824__auto____4541
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____4542 = coll;
    if(and__3822__auto____4542) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____4542
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4543 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4543) {
        return or__3824__auto____4543
      }else {
        var or__3824__auto____4544 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____4544) {
          return or__3824__auto____4544
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____4545 = coll;
    if(and__3822__auto____4545) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____4545
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____4546 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4546) {
        return or__3824__auto____4546
      }else {
        var or__3824__auto____4547 = cljs.core._assoc["_"];
        if(or__3824__auto____4547) {
          return or__3824__auto____4547
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____4548 = coll;
    if(and__3822__auto____4548) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____4548
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4549 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4549) {
        return or__3824__auto____4549
      }else {
        var or__3824__auto____4550 = cljs.core._dissoc["_"];
        if(or__3824__auto____4550) {
          return or__3824__auto____4550
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____4551 = coll;
    if(and__3822__auto____4551) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____4551
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4552 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4552) {
        return or__3824__auto____4552
      }else {
        var or__3824__auto____4553 = cljs.core._key["_"];
        if(or__3824__auto____4553) {
          return or__3824__auto____4553
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____4554 = coll;
    if(and__3822__auto____4554) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____4554
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4555 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4555) {
        return or__3824__auto____4555
      }else {
        var or__3824__auto____4556 = cljs.core._val["_"];
        if(or__3824__auto____4556) {
          return or__3824__auto____4556
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____4557 = coll;
    if(and__3822__auto____4557) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____4557
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____4558 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4558) {
        return or__3824__auto____4558
      }else {
        var or__3824__auto____4559 = cljs.core._disjoin["_"];
        if(or__3824__auto____4559) {
          return or__3824__auto____4559
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____4560 = coll;
    if(and__3822__auto____4560) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____4560
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4561 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4561) {
        return or__3824__auto____4561
      }else {
        var or__3824__auto____4562 = cljs.core._peek["_"];
        if(or__3824__auto____4562) {
          return or__3824__auto____4562
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____4563 = coll;
    if(and__3822__auto____4563) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____4563
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4564 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4564) {
        return or__3824__auto____4564
      }else {
        var or__3824__auto____4565 = cljs.core._pop["_"];
        if(or__3824__auto____4565) {
          return or__3824__auto____4565
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____4566 = coll;
    if(and__3822__auto____4566) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____4566
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____4567 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4567) {
        return or__3824__auto____4567
      }else {
        var or__3824__auto____4568 = cljs.core._assoc_n["_"];
        if(or__3824__auto____4568) {
          return or__3824__auto____4568
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____4569 = o;
    if(and__3822__auto____4569) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____4569
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4570 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____4570) {
        return or__3824__auto____4570
      }else {
        var or__3824__auto____4571 = cljs.core._deref["_"];
        if(or__3824__auto____4571) {
          return or__3824__auto____4571
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____4572 = o;
    if(and__3822__auto____4572) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____4572
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____4573 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____4573) {
        return or__3824__auto____4573
      }else {
        var or__3824__auto____4574 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____4574) {
          return or__3824__auto____4574
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____4575 = o;
    if(and__3822__auto____4575) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____4575
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4576 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4576) {
        return or__3824__auto____4576
      }else {
        var or__3824__auto____4577 = cljs.core._meta["_"];
        if(or__3824__auto____4577) {
          return or__3824__auto____4577
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____4578 = o;
    if(and__3822__auto____4578) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____4578
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____4579 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4579) {
        return or__3824__auto____4579
      }else {
        var or__3824__auto____4580 = cljs.core._with_meta["_"];
        if(or__3824__auto____4580) {
          return or__3824__auto____4580
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____4581 = coll;
      if(and__3822__auto____4581) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____4581
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____4582 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4582) {
          return or__3824__auto____4582
        }else {
          var or__3824__auto____4583 = cljs.core._reduce["_"];
          if(or__3824__auto____4583) {
            return or__3824__auto____4583
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____4584 = coll;
      if(and__3822__auto____4584) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____4584
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____4585 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4585) {
          return or__3824__auto____4585
        }else {
          var or__3824__auto____4586 = cljs.core._reduce["_"];
          if(or__3824__auto____4586) {
            return or__3824__auto____4586
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____4587 = coll;
    if(and__3822__auto____4587) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____4587
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____4588 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4588) {
        return or__3824__auto____4588
      }else {
        var or__3824__auto____4589 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____4589) {
          return or__3824__auto____4589
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____4590 = o;
    if(and__3822__auto____4590) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____4590
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____4591 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____4591) {
        return or__3824__auto____4591
      }else {
        var or__3824__auto____4592 = cljs.core._equiv["_"];
        if(or__3824__auto____4592) {
          return or__3824__auto____4592
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____4593 = o;
    if(and__3822__auto____4593) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____4593
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4594 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____4594) {
        return or__3824__auto____4594
      }else {
        var or__3824__auto____4595 = cljs.core._hash["_"];
        if(or__3824__auto____4595) {
          return or__3824__auto____4595
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____4596 = o;
    if(and__3822__auto____4596) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____4596
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4597 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4597) {
        return or__3824__auto____4597
      }else {
        var or__3824__auto____4598 = cljs.core._seq["_"];
        if(or__3824__auto____4598) {
          return or__3824__auto____4598
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____4599 = coll;
    if(and__3822__auto____4599) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____4599
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4600 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4600) {
        return or__3824__auto____4600
      }else {
        var or__3824__auto____4601 = cljs.core._rseq["_"];
        if(or__3824__auto____4601) {
          return or__3824__auto____4601
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4602 = coll;
    if(and__3822__auto____4602) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____4602
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4603 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4603) {
        return or__3824__auto____4603
      }else {
        var or__3824__auto____4604 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____4604) {
          return or__3824__auto____4604
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4605 = coll;
    if(and__3822__auto____4605) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____4605
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4606 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4606) {
        return or__3824__auto____4606
      }else {
        var or__3824__auto____4607 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____4607) {
          return or__3824__auto____4607
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____4608 = coll;
    if(and__3822__auto____4608) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____4608
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____4609 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4609) {
        return or__3824__auto____4609
      }else {
        var or__3824__auto____4610 = cljs.core._entry_key["_"];
        if(or__3824__auto____4610) {
          return or__3824__auto____4610
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____4611 = coll;
    if(and__3822__auto____4611) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____4611
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4612 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4612) {
        return or__3824__auto____4612
      }else {
        var or__3824__auto____4613 = cljs.core._comparator["_"];
        if(or__3824__auto____4613) {
          return or__3824__auto____4613
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____4614 = o;
    if(and__3822__auto____4614) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____4614
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____4615 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4615) {
        return or__3824__auto____4615
      }else {
        var or__3824__auto____4616 = cljs.core._pr_seq["_"];
        if(or__3824__auto____4616) {
          return or__3824__auto____4616
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____4617 = d;
    if(and__3822__auto____4617) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____4617
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____4618 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____4618) {
        return or__3824__auto____4618
      }else {
        var or__3824__auto____4619 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____4619) {
          return or__3824__auto____4619
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____4620 = this$;
    if(and__3822__auto____4620) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____4620
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____4621 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4621) {
        return or__3824__auto____4621
      }else {
        var or__3824__auto____4622 = cljs.core._notify_watches["_"];
        if(or__3824__auto____4622) {
          return or__3824__auto____4622
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____4623 = this$;
    if(and__3822__auto____4623) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____4623
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____4624 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4624) {
        return or__3824__auto____4624
      }else {
        var or__3824__auto____4625 = cljs.core._add_watch["_"];
        if(or__3824__auto____4625) {
          return or__3824__auto____4625
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____4626 = this$;
    if(and__3822__auto____4626) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____4626
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____4627 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4627) {
        return or__3824__auto____4627
      }else {
        var or__3824__auto____4628 = cljs.core._remove_watch["_"];
        if(or__3824__auto____4628) {
          return or__3824__auto____4628
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____4629 = coll;
    if(and__3822__auto____4629) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____4629
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4630 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4630) {
        return or__3824__auto____4630
      }else {
        var or__3824__auto____4631 = cljs.core._as_transient["_"];
        if(or__3824__auto____4631) {
          return or__3824__auto____4631
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____4632 = tcoll;
    if(and__3822__auto____4632) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____4632
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____4633 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4633) {
        return or__3824__auto____4633
      }else {
        var or__3824__auto____4634 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____4634) {
          return or__3824__auto____4634
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4635 = tcoll;
    if(and__3822__auto____4635) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____4635
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4636 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4636) {
        return or__3824__auto____4636
      }else {
        var or__3824__auto____4637 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____4637) {
          return or__3824__auto____4637
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____4638 = tcoll;
    if(and__3822__auto____4638) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____4638
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____4639 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4639) {
        return or__3824__auto____4639
      }else {
        var or__3824__auto____4640 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____4640) {
          return or__3824__auto____4640
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____4641 = tcoll;
    if(and__3822__auto____4641) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____4641
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____4642 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4642) {
        return or__3824__auto____4642
      }else {
        var or__3824__auto____4643 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____4643) {
          return or__3824__auto____4643
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____4644 = tcoll;
    if(and__3822__auto____4644) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____4644
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____4645 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4645) {
        return or__3824__auto____4645
      }else {
        var or__3824__auto____4646 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____4646) {
          return or__3824__auto____4646
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4647 = tcoll;
    if(and__3822__auto____4647) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____4647
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4648 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4648) {
        return or__3824__auto____4648
      }else {
        var or__3824__auto____4649 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____4649) {
          return or__3824__auto____4649
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____4650 = tcoll;
    if(and__3822__auto____4650) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____4650
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____4651 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4651) {
        return or__3824__auto____4651
      }else {
        var or__3824__auto____4652 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____4652) {
          return or__3824__auto____4652
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____4653 = x === y;
    if(or__3824__auto____4653) {
      return or__3824__auto____4653
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4654__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4655 = y;
            var G__4656 = cljs.core.first.call(null, more);
            var G__4657 = cljs.core.next.call(null, more);
            x = G__4655;
            y = G__4656;
            more = G__4657;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4654 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4654__delegate.call(this, x, y, more)
    };
    G__4654.cljs$lang$maxFixedArity = 2;
    G__4654.cljs$lang$applyTo = function(arglist__4658) {
      var x = cljs.core.first(arglist__4658);
      var y = cljs.core.first(cljs.core.next(arglist__4658));
      var more = cljs.core.rest(cljs.core.next(arglist__4658));
      return G__4654__delegate(x, y, more)
    };
    G__4654.cljs$lang$arity$variadic = G__4654__delegate;
    return G__4654
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3824__auto____4659 = x == null;
    if(or__3824__auto____4659) {
      return or__3824__auto____4659
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4660 = null;
  var G__4660__2 = function(o, k) {
    return null
  };
  var G__4660__3 = function(o, k, not_found) {
    return not_found
  };
  G__4660 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4660__2.call(this, o, k);
      case 3:
        return G__4660__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4660
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4661 = null;
  var G__4661__2 = function(_, f) {
    return f.call(null)
  };
  var G__4661__3 = function(_, f, start) {
    return start
  };
  G__4661 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4661__2.call(this, _, f);
      case 3:
        return G__4661__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4661
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__4662 = null;
  var G__4662__2 = function(_, n) {
    return null
  };
  var G__4662__3 = function(_, n, not_found) {
    return not_found
  };
  G__4662 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4662__2.call(this, _, n);
      case 3:
        return G__4662__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4662
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4663 = cljs.core._nth.call(null, cicoll, 0);
      var n__4664 = 1;
      while(true) {
        if(n__4664 < cljs.core._count.call(null, cicoll)) {
          var nval__4665 = f.call(null, val__4663, cljs.core._nth.call(null, cicoll, n__4664));
          if(cljs.core.reduced_QMARK_.call(null, nval__4665)) {
            return cljs.core.deref.call(null, nval__4665)
          }else {
            var G__4672 = nval__4665;
            var G__4673 = n__4664 + 1;
            val__4663 = G__4672;
            n__4664 = G__4673;
            continue
          }
        }else {
          return val__4663
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4666 = val;
    var n__4667 = 0;
    while(true) {
      if(n__4667 < cljs.core._count.call(null, cicoll)) {
        var nval__4668 = f.call(null, val__4666, cljs.core._nth.call(null, cicoll, n__4667));
        if(cljs.core.reduced_QMARK_.call(null, nval__4668)) {
          return cljs.core.deref.call(null, nval__4668)
        }else {
          var G__4674 = nval__4668;
          var G__4675 = n__4667 + 1;
          val__4666 = G__4674;
          n__4667 = G__4675;
          continue
        }
      }else {
        return val__4666
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4669 = val;
    var n__4670 = idx;
    while(true) {
      if(n__4670 < cljs.core._count.call(null, cicoll)) {
        var nval__4671 = f.call(null, val__4669, cljs.core._nth.call(null, cicoll, n__4670));
        if(cljs.core.reduced_QMARK_.call(null, nval__4671)) {
          return cljs.core.deref.call(null, nval__4671)
        }else {
          var G__4676 = nval__4671;
          var G__4677 = n__4670 + 1;
          val__4669 = G__4676;
          n__4670 = G__4677;
          continue
        }
      }else {
        return val__4669
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4678 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4679 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4680 = this;
  var this$__4681 = this;
  return cljs.core.pr_str.call(null, this$__4681)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4682 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4682.a)) {
    return cljs.core.ci_reduce.call(null, this__4682.a, f, this__4682.a[this__4682.i], this__4682.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4682.a[this__4682.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4683 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4683.a)) {
    return cljs.core.ci_reduce.call(null, this__4683.a, f, start, this__4683.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4684 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4685 = this;
  return this__4685.a.length - this__4685.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4686 = this;
  return this__4686.a[this__4686.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4687 = this;
  if(this__4687.i + 1 < this__4687.a.length) {
    return new cljs.core.IndexedSeq(this__4687.a, this__4687.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4688 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4689 = this;
  var i__4690 = n + this__4689.i;
  if(i__4690 < this__4689.a.length) {
    return this__4689.a[i__4690]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4691 = this;
  var i__4692 = n + this__4691.i;
  if(i__4692 < this__4691.a.length) {
    return this__4691.a[i__4692]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__4693 = null;
  var G__4693__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4693__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4693 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4693__2.call(this, array, f);
      case 3:
        return G__4693__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4693
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4694 = null;
  var G__4694__2 = function(array, k) {
    return array[k]
  };
  var G__4694__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4694 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4694__2.call(this, array, k);
      case 3:
        return G__4694__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4694
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4695 = null;
  var G__4695__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4695__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4695 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4695__2.call(this, array, n);
      case 3:
        return G__4695__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4695
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__4696__4697 = coll;
      if(G__4696__4697 != null) {
        if(function() {
          var or__3824__auto____4698 = G__4696__4697.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____4698) {
            return or__3824__auto____4698
          }else {
            return G__4696__4697.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4696__4697.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4696__4697)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4696__4697)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4699__4700 = coll;
      if(G__4699__4700 != null) {
        if(function() {
          var or__3824__auto____4701 = G__4699__4700.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4701) {
            return or__3824__auto____4701
          }else {
            return G__4699__4700.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4699__4700.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4699__4700)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4699__4700)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4702 = cljs.core.seq.call(null, coll);
      if(s__4702 != null) {
        return cljs.core._first.call(null, s__4702)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4703__4704 = coll;
      if(G__4703__4704 != null) {
        if(function() {
          var or__3824__auto____4705 = G__4703__4704.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4705) {
            return or__3824__auto____4705
          }else {
            return G__4703__4704.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4703__4704.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4703__4704)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4703__4704)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4706 = cljs.core.seq.call(null, coll);
      if(s__4706 != null) {
        return cljs.core._rest.call(null, s__4706)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4707__4708 = coll;
      if(G__4707__4708 != null) {
        if(function() {
          var or__3824__auto____4709 = G__4707__4708.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4709) {
            return or__3824__auto____4709
          }else {
            return G__4707__4708.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4707__4708.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4707__4708)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4707__4708)
      }
    }()) {
      var coll__4710 = cljs.core._rest.call(null, coll);
      if(coll__4710 != null) {
        if(function() {
          var G__4711__4712 = coll__4710;
          if(G__4711__4712 != null) {
            if(function() {
              var or__3824__auto____4713 = G__4711__4712.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____4713) {
                return or__3824__auto____4713
              }else {
                return G__4711__4712.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4711__4712.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4711__4712)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4711__4712)
          }
        }()) {
          return coll__4710
        }else {
          return cljs.core._seq.call(null, coll__4710)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4714 = cljs.core.next.call(null, s);
      s = G__4714;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4715__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4716 = conj.call(null, coll, x);
          var G__4717 = cljs.core.first.call(null, xs);
          var G__4718 = cljs.core.next.call(null, xs);
          coll = G__4716;
          x = G__4717;
          xs = G__4718;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4715 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4715__delegate.call(this, coll, x, xs)
    };
    G__4715.cljs$lang$maxFixedArity = 2;
    G__4715.cljs$lang$applyTo = function(arglist__4719) {
      var coll = cljs.core.first(arglist__4719);
      var x = cljs.core.first(cljs.core.next(arglist__4719));
      var xs = cljs.core.rest(cljs.core.next(arglist__4719));
      return G__4715__delegate(coll, x, xs)
    };
    G__4715.cljs$lang$arity$variadic = G__4715__delegate;
    return G__4715
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__4720 = cljs.core.seq.call(null, coll);
  var acc__4721 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__4720)) {
      return acc__4721 + cljs.core._count.call(null, s__4720)
    }else {
      var G__4722 = cljs.core.next.call(null, s__4720);
      var G__4723 = acc__4721 + 1;
      s__4720 = G__4722;
      acc__4721 = G__4723;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__4724__4725 = coll;
        if(G__4724__4725 != null) {
          if(function() {
            var or__3824__auto____4726 = G__4724__4725.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4726) {
              return or__3824__auto____4726
            }else {
              return G__4724__4725.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4724__4725.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4724__4725)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4724__4725)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__4727__4728 = coll;
        if(G__4727__4728 != null) {
          if(function() {
            var or__3824__auto____4729 = G__4727__4728.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4729) {
              return or__3824__auto____4729
            }else {
              return G__4727__4728.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4727__4728.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4727__4728)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4727__4728)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4731__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4730 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4732 = ret__4730;
          var G__4733 = cljs.core.first.call(null, kvs);
          var G__4734 = cljs.core.second.call(null, kvs);
          var G__4735 = cljs.core.nnext.call(null, kvs);
          coll = G__4732;
          k = G__4733;
          v = G__4734;
          kvs = G__4735;
          continue
        }else {
          return ret__4730
        }
        break
      }
    };
    var G__4731 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4731__delegate.call(this, coll, k, v, kvs)
    };
    G__4731.cljs$lang$maxFixedArity = 3;
    G__4731.cljs$lang$applyTo = function(arglist__4736) {
      var coll = cljs.core.first(arglist__4736);
      var k = cljs.core.first(cljs.core.next(arglist__4736));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4736)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4736)));
      return G__4731__delegate(coll, k, v, kvs)
    };
    G__4731.cljs$lang$arity$variadic = G__4731__delegate;
    return G__4731
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4738__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4737 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4739 = ret__4737;
          var G__4740 = cljs.core.first.call(null, ks);
          var G__4741 = cljs.core.next.call(null, ks);
          coll = G__4739;
          k = G__4740;
          ks = G__4741;
          continue
        }else {
          return ret__4737
        }
        break
      }
    };
    var G__4738 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4738__delegate.call(this, coll, k, ks)
    };
    G__4738.cljs$lang$maxFixedArity = 2;
    G__4738.cljs$lang$applyTo = function(arglist__4742) {
      var coll = cljs.core.first(arglist__4742);
      var k = cljs.core.first(cljs.core.next(arglist__4742));
      var ks = cljs.core.rest(cljs.core.next(arglist__4742));
      return G__4738__delegate(coll, k, ks)
    };
    G__4738.cljs$lang$arity$variadic = G__4738__delegate;
    return G__4738
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4743__4744 = o;
    if(G__4743__4744 != null) {
      if(function() {
        var or__3824__auto____4745 = G__4743__4744.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____4745) {
          return or__3824__auto____4745
        }else {
          return G__4743__4744.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4743__4744.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4743__4744)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4743__4744)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4747__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4746 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4748 = ret__4746;
          var G__4749 = cljs.core.first.call(null, ks);
          var G__4750 = cljs.core.next.call(null, ks);
          coll = G__4748;
          k = G__4749;
          ks = G__4750;
          continue
        }else {
          return ret__4746
        }
        break
      }
    };
    var G__4747 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4747__delegate.call(this, coll, k, ks)
    };
    G__4747.cljs$lang$maxFixedArity = 2;
    G__4747.cljs$lang$applyTo = function(arglist__4751) {
      var coll = cljs.core.first(arglist__4751);
      var k = cljs.core.first(cljs.core.next(arglist__4751));
      var ks = cljs.core.rest(cljs.core.next(arglist__4751));
      return G__4747__delegate(coll, k, ks)
    };
    G__4747.cljs$lang$arity$variadic = G__4747__delegate;
    return G__4747
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4752__4753 = x;
    if(G__4752__4753 != null) {
      if(function() {
        var or__3824__auto____4754 = G__4752__4753.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____4754) {
          return or__3824__auto____4754
        }else {
          return G__4752__4753.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4752__4753.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4752__4753)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4752__4753)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4755__4756 = x;
    if(G__4755__4756 != null) {
      if(function() {
        var or__3824__auto____4757 = G__4755__4756.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____4757) {
          return or__3824__auto____4757
        }else {
          return G__4755__4756.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4755__4756.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4755__4756)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4755__4756)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4758__4759 = x;
  if(G__4758__4759 != null) {
    if(function() {
      var or__3824__auto____4760 = G__4758__4759.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____4760) {
        return or__3824__auto____4760
      }else {
        return G__4758__4759.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4758__4759.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4758__4759)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4758__4759)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4761__4762 = x;
  if(G__4761__4762 != null) {
    if(function() {
      var or__3824__auto____4763 = G__4761__4762.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____4763) {
        return or__3824__auto____4763
      }else {
        return G__4761__4762.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4761__4762.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4761__4762)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4761__4762)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4764__4765 = x;
  if(G__4764__4765 != null) {
    if(function() {
      var or__3824__auto____4766 = G__4764__4765.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____4766) {
        return or__3824__auto____4766
      }else {
        return G__4764__4765.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4764__4765.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4764__4765)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4764__4765)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4767__4768 = x;
  if(G__4767__4768 != null) {
    if(function() {
      var or__3824__auto____4769 = G__4767__4768.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____4769) {
        return or__3824__auto____4769
      }else {
        return G__4767__4768.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4767__4768.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4767__4768)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4767__4768)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4770__4771 = x;
  if(G__4770__4771 != null) {
    if(function() {
      var or__3824__auto____4772 = G__4770__4771.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____4772) {
        return or__3824__auto____4772
      }else {
        return G__4770__4771.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4770__4771.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4770__4771)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4770__4771)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4773__4774 = x;
    if(G__4773__4774 != null) {
      if(function() {
        var or__3824__auto____4775 = G__4773__4774.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____4775) {
          return or__3824__auto____4775
        }else {
          return G__4773__4774.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4773__4774.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4773__4774)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4773__4774)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4776__4777 = x;
  if(G__4776__4777 != null) {
    if(function() {
      var or__3824__auto____4778 = G__4776__4777.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____4778) {
        return or__3824__auto____4778
      }else {
        return G__4776__4777.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4776__4777.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4776__4777)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4776__4777)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4779__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4779 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4779__delegate.call(this, keyvals)
    };
    G__4779.cljs$lang$maxFixedArity = 0;
    G__4779.cljs$lang$applyTo = function(arglist__4780) {
      var keyvals = cljs.core.seq(arglist__4780);
      return G__4779__delegate(keyvals)
    };
    G__4779.cljs$lang$arity$variadic = G__4779__delegate;
    return G__4779
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4781 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4781.push(key)
  });
  return keys__4781
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4782 = i;
  var j__4783 = j;
  var len__4784 = len;
  while(true) {
    if(len__4784 === 0) {
      return to
    }else {
      to[j__4783] = from[i__4782];
      var G__4785 = i__4782 + 1;
      var G__4786 = j__4783 + 1;
      var G__4787 = len__4784 - 1;
      i__4782 = G__4785;
      j__4783 = G__4786;
      len__4784 = G__4787;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4788 = i + (len - 1);
  var j__4789 = j + (len - 1);
  var len__4790 = len;
  while(true) {
    if(len__4790 === 0) {
      return to
    }else {
      to[j__4789] = from[i__4788];
      var G__4791 = i__4788 - 1;
      var G__4792 = j__4789 - 1;
      var G__4793 = len__4790 - 1;
      i__4788 = G__4791;
      j__4789 = G__4792;
      len__4790 = G__4793;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4794__4795 = s;
    if(G__4794__4795 != null) {
      if(function() {
        var or__3824__auto____4796 = G__4794__4795.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____4796) {
          return or__3824__auto____4796
        }else {
          return G__4794__4795.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4794__4795.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4794__4795)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4794__4795)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4797__4798 = s;
  if(G__4797__4798 != null) {
    if(function() {
      var or__3824__auto____4799 = G__4797__4798.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____4799) {
        return or__3824__auto____4799
      }else {
        return G__4797__4798.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4797__4798.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4797__4798)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4797__4798)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____4800 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4800)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____4801 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____4801) {
        return or__3824__auto____4801
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____4800
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____4802 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4802)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____4802
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____4803 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4803)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____4803
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____4804 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____4804) {
    return or__3824__auto____4804
  }else {
    var G__4805__4806 = f;
    if(G__4805__4806 != null) {
      if(function() {
        var or__3824__auto____4807 = G__4805__4806.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____4807) {
          return or__3824__auto____4807
        }else {
          return G__4805__4806.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4805__4806.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4805__4806)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4805__4806)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____4808 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____4808) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____4808
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____4809 = coll;
    if(cljs.core.truth_(and__3822__auto____4809)) {
      var and__3822__auto____4810 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____4810) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____4810
      }
    }else {
      return and__3822__auto____4809
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4815__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4811 = cljs.core.set([y, x]);
        var xs__4812 = more;
        while(true) {
          var x__4813 = cljs.core.first.call(null, xs__4812);
          var etc__4814 = cljs.core.next.call(null, xs__4812);
          if(cljs.core.truth_(xs__4812)) {
            if(cljs.core.contains_QMARK_.call(null, s__4811, x__4813)) {
              return false
            }else {
              var G__4816 = cljs.core.conj.call(null, s__4811, x__4813);
              var G__4817 = etc__4814;
              s__4811 = G__4816;
              xs__4812 = G__4817;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4815 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4815__delegate.call(this, x, y, more)
    };
    G__4815.cljs$lang$maxFixedArity = 2;
    G__4815.cljs$lang$applyTo = function(arglist__4818) {
      var x = cljs.core.first(arglist__4818);
      var y = cljs.core.first(cljs.core.next(arglist__4818));
      var more = cljs.core.rest(cljs.core.next(arglist__4818));
      return G__4815__delegate(x, y, more)
    };
    G__4815.cljs$lang$arity$variadic = G__4815__delegate;
    return G__4815
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4819 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4819)) {
        return r__4819
      }else {
        if(cljs.core.truth_(r__4819)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4820 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4820, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4820)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____4821 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____4821)) {
      var s__4822 = temp__3971__auto____4821;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4822), cljs.core.next.call(null, s__4822))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4823 = val;
    var coll__4824 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4824)) {
        var nval__4825 = f.call(null, val__4823, cljs.core.first.call(null, coll__4824));
        if(cljs.core.reduced_QMARK_.call(null, nval__4825)) {
          return cljs.core.deref.call(null, nval__4825)
        }else {
          var G__4826 = nval__4825;
          var G__4827 = cljs.core.next.call(null, coll__4824);
          val__4823 = G__4826;
          coll__4824 = G__4827;
          continue
        }
      }else {
        return val__4823
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4828__4829 = coll;
      if(G__4828__4829 != null) {
        if(function() {
          var or__3824__auto____4830 = G__4828__4829.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4830) {
            return or__3824__auto____4830
          }else {
            return G__4828__4829.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4828__4829.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4828__4829)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4828__4829)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4831__4832 = coll;
      if(G__4831__4832 != null) {
        if(function() {
          var or__3824__auto____4833 = G__4831__4832.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4833) {
            return or__3824__auto____4833
          }else {
            return G__4831__4832.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4831__4832.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4831__4832)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4831__4832)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4834 = this;
  return this__4834.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4835__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4835 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4835__delegate.call(this, x, y, more)
    };
    G__4835.cljs$lang$maxFixedArity = 2;
    G__4835.cljs$lang$applyTo = function(arglist__4836) {
      var x = cljs.core.first(arglist__4836);
      var y = cljs.core.first(cljs.core.next(arglist__4836));
      var more = cljs.core.rest(cljs.core.next(arglist__4836));
      return G__4835__delegate(x, y, more)
    };
    G__4835.cljs$lang$arity$variadic = G__4835__delegate;
    return G__4835
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4837__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4837 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4837__delegate.call(this, x, y, more)
    };
    G__4837.cljs$lang$maxFixedArity = 2;
    G__4837.cljs$lang$applyTo = function(arglist__4838) {
      var x = cljs.core.first(arglist__4838);
      var y = cljs.core.first(cljs.core.next(arglist__4838));
      var more = cljs.core.rest(cljs.core.next(arglist__4838));
      return G__4837__delegate(x, y, more)
    };
    G__4837.cljs$lang$arity$variadic = G__4837__delegate;
    return G__4837
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4839__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4839 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4839__delegate.call(this, x, y, more)
    };
    G__4839.cljs$lang$maxFixedArity = 2;
    G__4839.cljs$lang$applyTo = function(arglist__4840) {
      var x = cljs.core.first(arglist__4840);
      var y = cljs.core.first(cljs.core.next(arglist__4840));
      var more = cljs.core.rest(cljs.core.next(arglist__4840));
      return G__4839__delegate(x, y, more)
    };
    G__4839.cljs$lang$arity$variadic = G__4839__delegate;
    return G__4839
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4841__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4841 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4841__delegate.call(this, x, y, more)
    };
    G__4841.cljs$lang$maxFixedArity = 2;
    G__4841.cljs$lang$applyTo = function(arglist__4842) {
      var x = cljs.core.first(arglist__4842);
      var y = cljs.core.first(cljs.core.next(arglist__4842));
      var more = cljs.core.rest(cljs.core.next(arglist__4842));
      return G__4841__delegate(x, y, more)
    };
    G__4841.cljs$lang$arity$variadic = G__4841__delegate;
    return G__4841
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4843__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4844 = y;
            var G__4845 = cljs.core.first.call(null, more);
            var G__4846 = cljs.core.next.call(null, more);
            x = G__4844;
            y = G__4845;
            more = G__4846;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4843 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4843__delegate.call(this, x, y, more)
    };
    G__4843.cljs$lang$maxFixedArity = 2;
    G__4843.cljs$lang$applyTo = function(arglist__4847) {
      var x = cljs.core.first(arglist__4847);
      var y = cljs.core.first(cljs.core.next(arglist__4847));
      var more = cljs.core.rest(cljs.core.next(arglist__4847));
      return G__4843__delegate(x, y, more)
    };
    G__4843.cljs$lang$arity$variadic = G__4843__delegate;
    return G__4843
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4848__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4849 = y;
            var G__4850 = cljs.core.first.call(null, more);
            var G__4851 = cljs.core.next.call(null, more);
            x = G__4849;
            y = G__4850;
            more = G__4851;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4848 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4848__delegate.call(this, x, y, more)
    };
    G__4848.cljs$lang$maxFixedArity = 2;
    G__4848.cljs$lang$applyTo = function(arglist__4852) {
      var x = cljs.core.first(arglist__4852);
      var y = cljs.core.first(cljs.core.next(arglist__4852));
      var more = cljs.core.rest(cljs.core.next(arglist__4852));
      return G__4848__delegate(x, y, more)
    };
    G__4848.cljs$lang$arity$variadic = G__4848__delegate;
    return G__4848
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4853__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4854 = y;
            var G__4855 = cljs.core.first.call(null, more);
            var G__4856 = cljs.core.next.call(null, more);
            x = G__4854;
            y = G__4855;
            more = G__4856;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4853 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4853__delegate.call(this, x, y, more)
    };
    G__4853.cljs$lang$maxFixedArity = 2;
    G__4853.cljs$lang$applyTo = function(arglist__4857) {
      var x = cljs.core.first(arglist__4857);
      var y = cljs.core.first(cljs.core.next(arglist__4857));
      var more = cljs.core.rest(cljs.core.next(arglist__4857));
      return G__4853__delegate(x, y, more)
    };
    G__4853.cljs$lang$arity$variadic = G__4853__delegate;
    return G__4853
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4858__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4859 = y;
            var G__4860 = cljs.core.first.call(null, more);
            var G__4861 = cljs.core.next.call(null, more);
            x = G__4859;
            y = G__4860;
            more = G__4861;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4858 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4858__delegate.call(this, x, y, more)
    };
    G__4858.cljs$lang$maxFixedArity = 2;
    G__4858.cljs$lang$applyTo = function(arglist__4862) {
      var x = cljs.core.first(arglist__4862);
      var y = cljs.core.first(cljs.core.next(arglist__4862));
      var more = cljs.core.rest(cljs.core.next(arglist__4862));
      return G__4858__delegate(x, y, more)
    };
    G__4858.cljs$lang$arity$variadic = G__4858__delegate;
    return G__4858
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4863__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4863 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4863__delegate.call(this, x, y, more)
    };
    G__4863.cljs$lang$maxFixedArity = 2;
    G__4863.cljs$lang$applyTo = function(arglist__4864) {
      var x = cljs.core.first(arglist__4864);
      var y = cljs.core.first(cljs.core.next(arglist__4864));
      var more = cljs.core.rest(cljs.core.next(arglist__4864));
      return G__4863__delegate(x, y, more)
    };
    G__4863.cljs$lang$arity$variadic = G__4863__delegate;
    return G__4863
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4865__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4865 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4865__delegate.call(this, x, y, more)
    };
    G__4865.cljs$lang$maxFixedArity = 2;
    G__4865.cljs$lang$applyTo = function(arglist__4866) {
      var x = cljs.core.first(arglist__4866);
      var y = cljs.core.first(cljs.core.next(arglist__4866));
      var more = cljs.core.rest(cljs.core.next(arglist__4866));
      return G__4865__delegate(x, y, more)
    };
    G__4865.cljs$lang$arity$variadic = G__4865__delegate;
    return G__4865
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__4867 = n % d;
  return cljs.core.fix.call(null, (n - rem__4867) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__4868 = cljs.core.quot.call(null, n, d);
  return n - d * q__4868
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__4869 = 0;
  var n__4870 = n;
  while(true) {
    if(n__4870 === 0) {
      return c__4869
    }else {
      var G__4871 = c__4869 + 1;
      var G__4872 = n__4870 & n__4870 - 1;
      c__4869 = G__4871;
      n__4870 = G__4872;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4873__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4874 = y;
            var G__4875 = cljs.core.first.call(null, more);
            var G__4876 = cljs.core.next.call(null, more);
            x = G__4874;
            y = G__4875;
            more = G__4876;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4873 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4873__delegate.call(this, x, y, more)
    };
    G__4873.cljs$lang$maxFixedArity = 2;
    G__4873.cljs$lang$applyTo = function(arglist__4877) {
      var x = cljs.core.first(arglist__4877);
      var y = cljs.core.first(cljs.core.next(arglist__4877));
      var more = cljs.core.rest(cljs.core.next(arglist__4877));
      return G__4873__delegate(x, y, more)
    };
    G__4873.cljs$lang$arity$variadic = G__4873__delegate;
    return G__4873
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__4878 = n;
  var xs__4879 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____4880 = xs__4879;
      if(cljs.core.truth_(and__3822__auto____4880)) {
        return n__4878 > 0
      }else {
        return and__3822__auto____4880
      }
    }())) {
      var G__4881 = n__4878 - 1;
      var G__4882 = cljs.core.next.call(null, xs__4879);
      n__4878 = G__4881;
      xs__4879 = G__4882;
      continue
    }else {
      return xs__4879
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4883__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4884 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4885 = cljs.core.next.call(null, more);
            sb = G__4884;
            more = G__4885;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4883 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4883__delegate.call(this, x, ys)
    };
    G__4883.cljs$lang$maxFixedArity = 1;
    G__4883.cljs$lang$applyTo = function(arglist__4886) {
      var x = cljs.core.first(arglist__4886);
      var ys = cljs.core.rest(arglist__4886);
      return G__4883__delegate(x, ys)
    };
    G__4883.cljs$lang$arity$variadic = G__4883__delegate;
    return G__4883
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__4887__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4888 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4889 = cljs.core.next.call(null, more);
            sb = G__4888;
            more = G__4889;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4887 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4887__delegate.call(this, x, ys)
    };
    G__4887.cljs$lang$maxFixedArity = 1;
    G__4887.cljs$lang$applyTo = function(arglist__4890) {
      var x = cljs.core.first(arglist__4890);
      var ys = cljs.core.rest(arglist__4890);
      return G__4887__delegate(x, ys)
    };
    G__4887.cljs$lang$arity$variadic = G__4887__delegate;
    return G__4887
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__4891 = cljs.core.seq.call(null, x);
    var ys__4892 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__4891 == null) {
        return ys__4892 == null
      }else {
        if(ys__4892 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__4891), cljs.core.first.call(null, ys__4892))) {
            var G__4893 = cljs.core.next.call(null, xs__4891);
            var G__4894 = cljs.core.next.call(null, ys__4892);
            xs__4891 = G__4893;
            ys__4892 = G__4894;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__4895_SHARP_, p2__4896_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4895_SHARP_, cljs.core.hash.call(null, p2__4896_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__4897 = 0;
  var s__4898 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__4898)) {
      var e__4899 = cljs.core.first.call(null, s__4898);
      var G__4900 = (h__4897 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__4899)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__4899)))) % 4503599627370496;
      var G__4901 = cljs.core.next.call(null, s__4898);
      h__4897 = G__4900;
      s__4898 = G__4901;
      continue
    }else {
      return h__4897
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__4902 = 0;
  var s__4903 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__4903)) {
      var e__4904 = cljs.core.first.call(null, s__4903);
      var G__4905 = (h__4902 + cljs.core.hash.call(null, e__4904)) % 4503599627370496;
      var G__4906 = cljs.core.next.call(null, s__4903);
      h__4902 = G__4905;
      s__4903 = G__4906;
      continue
    }else {
      return h__4902
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__4907__4908 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__4907__4908)) {
    var G__4910__4912 = cljs.core.first.call(null, G__4907__4908);
    var vec__4911__4913 = G__4910__4912;
    var key_name__4914 = cljs.core.nth.call(null, vec__4911__4913, 0, null);
    var f__4915 = cljs.core.nth.call(null, vec__4911__4913, 1, null);
    var G__4907__4916 = G__4907__4908;
    var G__4910__4917 = G__4910__4912;
    var G__4907__4918 = G__4907__4916;
    while(true) {
      var vec__4919__4920 = G__4910__4917;
      var key_name__4921 = cljs.core.nth.call(null, vec__4919__4920, 0, null);
      var f__4922 = cljs.core.nth.call(null, vec__4919__4920, 1, null);
      var G__4907__4923 = G__4907__4918;
      var str_name__4924 = cljs.core.name.call(null, key_name__4921);
      obj[str_name__4924] = f__4922;
      var temp__3974__auto____4925 = cljs.core.next.call(null, G__4907__4923);
      if(cljs.core.truth_(temp__3974__auto____4925)) {
        var G__4907__4926 = temp__3974__auto____4925;
        var G__4927 = cljs.core.first.call(null, G__4907__4926);
        var G__4928 = G__4907__4926;
        G__4910__4917 = G__4927;
        G__4907__4918 = G__4928;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4929 = this;
  var h__364__auto____4930 = this__4929.__hash;
  if(h__364__auto____4930 != null) {
    return h__364__auto____4930
  }else {
    var h__364__auto____4931 = cljs.core.hash_coll.call(null, coll);
    this__4929.__hash = h__364__auto____4931;
    return h__364__auto____4931
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4932 = this;
  return new cljs.core.List(this__4932.meta, o, coll, this__4932.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__4933 = this;
  var this$__4934 = this;
  return cljs.core.pr_str.call(null, this$__4934)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4935 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4936 = this;
  return this__4936.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4937 = this;
  return this__4937.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4938 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4939 = this;
  return this__4939.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4940 = this;
  return this__4940.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4941 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4942 = this;
  return new cljs.core.List(meta, this__4942.first, this__4942.rest, this__4942.count, this__4942.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4943 = this;
  return this__4943.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4944 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4945 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4946 = this;
  return new cljs.core.List(this__4946.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__4947 = this;
  var this$__4948 = this;
  return cljs.core.pr_str.call(null, this$__4948)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4949 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__4950 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__4951 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__4952 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4953 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4954 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4955 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4956 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4957 = this;
  return this__4957.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4958 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4959__4960 = coll;
  if(G__4959__4960 != null) {
    if(function() {
      var or__3824__auto____4961 = G__4959__4960.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____4961) {
        return or__3824__auto____4961
      }else {
        return G__4959__4960.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4959__4960.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4959__4960)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__4959__4960)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4962) {
    var items = cljs.core.seq(arglist__4962);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4963 = this;
  var h__364__auto____4964 = this__4963.__hash;
  if(h__364__auto____4964 != null) {
    return h__364__auto____4964
  }else {
    var h__364__auto____4965 = cljs.core.hash_coll.call(null, coll);
    this__4963.__hash = h__364__auto____4965;
    return h__364__auto____4965
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4966 = this;
  return new cljs.core.Cons(null, o, coll, this__4966.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__4967 = this;
  var this$__4968 = this;
  return cljs.core.pr_str.call(null, this$__4968)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__4969 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__4970 = this;
  return this__4970.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__4971 = this;
  if(this__4971.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__4971.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4972 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__4973 = this;
  return new cljs.core.Cons(meta, this__4973.first, this__4973.rest, this__4973.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__4974 = this;
  return this__4974.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__4975 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4975.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____4976 = coll == null;
    if(or__3824__auto____4976) {
      return or__3824__auto____4976
    }else {
      var G__4977__4978 = coll;
      if(G__4977__4978 != null) {
        if(function() {
          var or__3824__auto____4979 = G__4977__4978.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4979) {
            return or__3824__auto____4979
          }else {
            return G__4977__4978.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4977__4978.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4977__4978)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4977__4978)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4980__4981 = x;
  if(G__4980__4981 != null) {
    if(function() {
      var or__3824__auto____4982 = G__4980__4981.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____4982) {
        return or__3824__auto____4982
      }else {
        return G__4980__4981.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4980__4981.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4980__4981)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__4980__4981)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__4983 = null;
  var G__4983__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__4983__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__4983 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4983__2.call(this, string, f);
      case 3:
        return G__4983__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4983
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__4984 = null;
  var G__4984__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__4984__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__4984 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4984__2.call(this, string, k);
      case 3:
        return G__4984__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4984
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__4985 = null;
  var G__4985__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__4985__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__4985 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4985__2.call(this, string, n);
      case 3:
        return G__4985__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4985
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4994 = null;
  var G__4994__2 = function(tsym4988, coll) {
    var tsym4988__4990 = this;
    var this$__4991 = tsym4988__4990;
    return cljs.core.get.call(null, coll, this$__4991.toString())
  };
  var G__4994__3 = function(tsym4989, coll, not_found) {
    var tsym4989__4992 = this;
    var this$__4993 = tsym4989__4992;
    return cljs.core.get.call(null, coll, this$__4993.toString(), not_found)
  };
  G__4994 = function(tsym4989, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4994__2.call(this, tsym4989, coll);
      case 3:
        return G__4994__3.call(this, tsym4989, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4994
}();
String.prototype.apply = function(tsym4986, args4987) {
  return tsym4986.call.apply(tsym4986, [tsym4986].concat(cljs.core.aclone.call(null, args4987)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__4995 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__4995
  }else {
    lazy_seq.x = x__4995.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4996 = this;
  var h__364__auto____4997 = this__4996.__hash;
  if(h__364__auto____4997 != null) {
    return h__364__auto____4997
  }else {
    var h__364__auto____4998 = cljs.core.hash_coll.call(null, coll);
    this__4996.__hash = h__364__auto____4998;
    return h__364__auto____4998
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4999 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5000 = this;
  var this$__5001 = this;
  return cljs.core.pr_str.call(null, this$__5001)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5002 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5003 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5004 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5005 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5006 = this;
  return new cljs.core.LazySeq(meta, this__5006.realized, this__5006.x, this__5006.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5007 = this;
  return this__5007.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5008 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5008.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5009 = [];
  var s__5010 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5010))) {
      ary__5009.push(cljs.core.first.call(null, s__5010));
      var G__5011 = cljs.core.next.call(null, s__5010);
      s__5010 = G__5011;
      continue
    }else {
      return ary__5009
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5012 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5013 = 0;
  var xs__5014 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5014)) {
      ret__5012[i__5013] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5014));
      var G__5015 = i__5013 + 1;
      var G__5016 = cljs.core.next.call(null, xs__5014);
      i__5013 = G__5015;
      xs__5014 = G__5016;
      continue
    }else {
    }
    break
  }
  return ret__5012
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__5017 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5018 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5019 = 0;
      var s__5020 = s__5018;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5021 = s__5020;
          if(cljs.core.truth_(and__3822__auto____5021)) {
            return i__5019 < size
          }else {
            return and__3822__auto____5021
          }
        }())) {
          a__5017[i__5019] = cljs.core.first.call(null, s__5020);
          var G__5024 = i__5019 + 1;
          var G__5025 = cljs.core.next.call(null, s__5020);
          i__5019 = G__5024;
          s__5020 = G__5025;
          continue
        }else {
          return a__5017
        }
        break
      }
    }else {
      var n__685__auto____5022 = size;
      var i__5023 = 0;
      while(true) {
        if(i__5023 < n__685__auto____5022) {
          a__5017[i__5023] = init_val_or_seq;
          var G__5026 = i__5023 + 1;
          i__5023 = G__5026;
          continue
        }else {
        }
        break
      }
      return a__5017
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__5027 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5028 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5029 = 0;
      var s__5030 = s__5028;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5031 = s__5030;
          if(cljs.core.truth_(and__3822__auto____5031)) {
            return i__5029 < size
          }else {
            return and__3822__auto____5031
          }
        }())) {
          a__5027[i__5029] = cljs.core.first.call(null, s__5030);
          var G__5034 = i__5029 + 1;
          var G__5035 = cljs.core.next.call(null, s__5030);
          i__5029 = G__5034;
          s__5030 = G__5035;
          continue
        }else {
          return a__5027
        }
        break
      }
    }else {
      var n__685__auto____5032 = size;
      var i__5033 = 0;
      while(true) {
        if(i__5033 < n__685__auto____5032) {
          a__5027[i__5033] = init_val_or_seq;
          var G__5036 = i__5033 + 1;
          i__5033 = G__5036;
          continue
        }else {
        }
        break
      }
      return a__5027
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__5037 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5038 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5039 = 0;
      var s__5040 = s__5038;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5041 = s__5040;
          if(cljs.core.truth_(and__3822__auto____5041)) {
            return i__5039 < size
          }else {
            return and__3822__auto____5041
          }
        }())) {
          a__5037[i__5039] = cljs.core.first.call(null, s__5040);
          var G__5044 = i__5039 + 1;
          var G__5045 = cljs.core.next.call(null, s__5040);
          i__5039 = G__5044;
          s__5040 = G__5045;
          continue
        }else {
          return a__5037
        }
        break
      }
    }else {
      var n__685__auto____5042 = size;
      var i__5043 = 0;
      while(true) {
        if(i__5043 < n__685__auto____5042) {
          a__5037[i__5043] = init_val_or_seq;
          var G__5046 = i__5043 + 1;
          i__5043 = G__5046;
          continue
        }else {
        }
        break
      }
      return a__5037
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__5047 = s;
    var i__5048 = n;
    var sum__5049 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____5050 = i__5048 > 0;
        if(and__3822__auto____5050) {
          return cljs.core.seq.call(null, s__5047)
        }else {
          return and__3822__auto____5050
        }
      }())) {
        var G__5051 = cljs.core.next.call(null, s__5047);
        var G__5052 = i__5048 - 1;
        var G__5053 = sum__5049 + 1;
        s__5047 = G__5051;
        i__5048 = G__5052;
        sum__5049 = G__5053;
        continue
      }else {
        return sum__5049
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5054 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5054)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5054), concat.call(null, cljs.core.rest.call(null, s__5054), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5057__delegate = function(x, y, zs) {
      var cat__5056 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5055 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5055)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5055), cat.call(null, cljs.core.rest.call(null, xys__5055), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5056.call(null, concat.call(null, x, y), zs)
    };
    var G__5057 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5057__delegate.call(this, x, y, zs)
    };
    G__5057.cljs$lang$maxFixedArity = 2;
    G__5057.cljs$lang$applyTo = function(arglist__5058) {
      var x = cljs.core.first(arglist__5058);
      var y = cljs.core.first(cljs.core.next(arglist__5058));
      var zs = cljs.core.rest(cljs.core.next(arglist__5058));
      return G__5057__delegate(x, y, zs)
    };
    G__5057.cljs$lang$arity$variadic = G__5057__delegate;
    return G__5057
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__5059__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5059 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5059__delegate.call(this, a, b, c, d, more)
    };
    G__5059.cljs$lang$maxFixedArity = 4;
    G__5059.cljs$lang$applyTo = function(arglist__5060) {
      var a = cljs.core.first(arglist__5060);
      var b = cljs.core.first(cljs.core.next(arglist__5060));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5060)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5060))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5060))));
      return G__5059__delegate(a, b, c, d, more)
    };
    G__5059.cljs$lang$arity$variadic = G__5059__delegate;
    return G__5059
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5061 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5062 = cljs.core._first.call(null, args__5061);
    var args__5063 = cljs.core._rest.call(null, args__5061);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5062)
      }else {
        return f.call(null, a__5062)
      }
    }else {
      var b__5064 = cljs.core._first.call(null, args__5063);
      var args__5065 = cljs.core._rest.call(null, args__5063);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5062, b__5064)
        }else {
          return f.call(null, a__5062, b__5064)
        }
      }else {
        var c__5066 = cljs.core._first.call(null, args__5065);
        var args__5067 = cljs.core._rest.call(null, args__5065);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5062, b__5064, c__5066)
          }else {
            return f.call(null, a__5062, b__5064, c__5066)
          }
        }else {
          var d__5068 = cljs.core._first.call(null, args__5067);
          var args__5069 = cljs.core._rest.call(null, args__5067);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5062, b__5064, c__5066, d__5068)
            }else {
              return f.call(null, a__5062, b__5064, c__5066, d__5068)
            }
          }else {
            var e__5070 = cljs.core._first.call(null, args__5069);
            var args__5071 = cljs.core._rest.call(null, args__5069);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5062, b__5064, c__5066, d__5068, e__5070)
              }else {
                return f.call(null, a__5062, b__5064, c__5066, d__5068, e__5070)
              }
            }else {
              var f__5072 = cljs.core._first.call(null, args__5071);
              var args__5073 = cljs.core._rest.call(null, args__5071);
              if(argc === 6) {
                if(f__5072.cljs$lang$arity$6) {
                  return f__5072.cljs$lang$arity$6(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072)
                }else {
                  return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072)
                }
              }else {
                var g__5074 = cljs.core._first.call(null, args__5073);
                var args__5075 = cljs.core._rest.call(null, args__5073);
                if(argc === 7) {
                  if(f__5072.cljs$lang$arity$7) {
                    return f__5072.cljs$lang$arity$7(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074)
                  }else {
                    return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074)
                  }
                }else {
                  var h__5076 = cljs.core._first.call(null, args__5075);
                  var args__5077 = cljs.core._rest.call(null, args__5075);
                  if(argc === 8) {
                    if(f__5072.cljs$lang$arity$8) {
                      return f__5072.cljs$lang$arity$8(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076)
                    }else {
                      return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076)
                    }
                  }else {
                    var i__5078 = cljs.core._first.call(null, args__5077);
                    var args__5079 = cljs.core._rest.call(null, args__5077);
                    if(argc === 9) {
                      if(f__5072.cljs$lang$arity$9) {
                        return f__5072.cljs$lang$arity$9(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078)
                      }else {
                        return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078)
                      }
                    }else {
                      var j__5080 = cljs.core._first.call(null, args__5079);
                      var args__5081 = cljs.core._rest.call(null, args__5079);
                      if(argc === 10) {
                        if(f__5072.cljs$lang$arity$10) {
                          return f__5072.cljs$lang$arity$10(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080)
                        }else {
                          return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080)
                        }
                      }else {
                        var k__5082 = cljs.core._first.call(null, args__5081);
                        var args__5083 = cljs.core._rest.call(null, args__5081);
                        if(argc === 11) {
                          if(f__5072.cljs$lang$arity$11) {
                            return f__5072.cljs$lang$arity$11(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082)
                          }else {
                            return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082)
                          }
                        }else {
                          var l__5084 = cljs.core._first.call(null, args__5083);
                          var args__5085 = cljs.core._rest.call(null, args__5083);
                          if(argc === 12) {
                            if(f__5072.cljs$lang$arity$12) {
                              return f__5072.cljs$lang$arity$12(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084)
                            }else {
                              return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084)
                            }
                          }else {
                            var m__5086 = cljs.core._first.call(null, args__5085);
                            var args__5087 = cljs.core._rest.call(null, args__5085);
                            if(argc === 13) {
                              if(f__5072.cljs$lang$arity$13) {
                                return f__5072.cljs$lang$arity$13(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086)
                              }else {
                                return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086)
                              }
                            }else {
                              var n__5088 = cljs.core._first.call(null, args__5087);
                              var args__5089 = cljs.core._rest.call(null, args__5087);
                              if(argc === 14) {
                                if(f__5072.cljs$lang$arity$14) {
                                  return f__5072.cljs$lang$arity$14(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088)
                                }else {
                                  return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088)
                                }
                              }else {
                                var o__5090 = cljs.core._first.call(null, args__5089);
                                var args__5091 = cljs.core._rest.call(null, args__5089);
                                if(argc === 15) {
                                  if(f__5072.cljs$lang$arity$15) {
                                    return f__5072.cljs$lang$arity$15(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090)
                                  }else {
                                    return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090)
                                  }
                                }else {
                                  var p__5092 = cljs.core._first.call(null, args__5091);
                                  var args__5093 = cljs.core._rest.call(null, args__5091);
                                  if(argc === 16) {
                                    if(f__5072.cljs$lang$arity$16) {
                                      return f__5072.cljs$lang$arity$16(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092)
                                    }else {
                                      return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092)
                                    }
                                  }else {
                                    var q__5094 = cljs.core._first.call(null, args__5093);
                                    var args__5095 = cljs.core._rest.call(null, args__5093);
                                    if(argc === 17) {
                                      if(f__5072.cljs$lang$arity$17) {
                                        return f__5072.cljs$lang$arity$17(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094)
                                      }else {
                                        return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094)
                                      }
                                    }else {
                                      var r__5096 = cljs.core._first.call(null, args__5095);
                                      var args__5097 = cljs.core._rest.call(null, args__5095);
                                      if(argc === 18) {
                                        if(f__5072.cljs$lang$arity$18) {
                                          return f__5072.cljs$lang$arity$18(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094, r__5096)
                                        }else {
                                          return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094, r__5096)
                                        }
                                      }else {
                                        var s__5098 = cljs.core._first.call(null, args__5097);
                                        var args__5099 = cljs.core._rest.call(null, args__5097);
                                        if(argc === 19) {
                                          if(f__5072.cljs$lang$arity$19) {
                                            return f__5072.cljs$lang$arity$19(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094, r__5096, s__5098)
                                          }else {
                                            return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094, r__5096, s__5098)
                                          }
                                        }else {
                                          var t__5100 = cljs.core._first.call(null, args__5099);
                                          var args__5101 = cljs.core._rest.call(null, args__5099);
                                          if(argc === 20) {
                                            if(f__5072.cljs$lang$arity$20) {
                                              return f__5072.cljs$lang$arity$20(a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094, r__5096, s__5098, t__5100)
                                            }else {
                                              return f__5072.call(null, a__5062, b__5064, c__5066, d__5068, e__5070, f__5072, g__5074, h__5076, i__5078, j__5080, k__5082, l__5084, m__5086, n__5088, o__5090, p__5092, q__5094, r__5096, s__5098, t__5100)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5102 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5103 = cljs.core.bounded_count.call(null, args, fixed_arity__5102 + 1);
      if(bc__5103 <= fixed_arity__5102) {
        return cljs.core.apply_to.call(null, f, bc__5103, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5104 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5105 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5106 = cljs.core.bounded_count.call(null, arglist__5104, fixed_arity__5105 + 1);
      if(bc__5106 <= fixed_arity__5105) {
        return cljs.core.apply_to.call(null, f, bc__5106, arglist__5104)
      }else {
        return f.cljs$lang$applyTo(arglist__5104)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5104))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5107 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5108 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5109 = cljs.core.bounded_count.call(null, arglist__5107, fixed_arity__5108 + 1);
      if(bc__5109 <= fixed_arity__5108) {
        return cljs.core.apply_to.call(null, f, bc__5109, arglist__5107)
      }else {
        return f.cljs$lang$applyTo(arglist__5107)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5107))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5110 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5111 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5112 = cljs.core.bounded_count.call(null, arglist__5110, fixed_arity__5111 + 1);
      if(bc__5112 <= fixed_arity__5111) {
        return cljs.core.apply_to.call(null, f, bc__5112, arglist__5110)
      }else {
        return f.cljs$lang$applyTo(arglist__5110)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5110))
    }
  };
  var apply__6 = function() {
    var G__5116__delegate = function(f, a, b, c, d, args) {
      var arglist__5113 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5114 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5115 = cljs.core.bounded_count.call(null, arglist__5113, fixed_arity__5114 + 1);
        if(bc__5115 <= fixed_arity__5114) {
          return cljs.core.apply_to.call(null, f, bc__5115, arglist__5113)
        }else {
          return f.cljs$lang$applyTo(arglist__5113)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5113))
      }
    };
    var G__5116 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5116__delegate.call(this, f, a, b, c, d, args)
    };
    G__5116.cljs$lang$maxFixedArity = 5;
    G__5116.cljs$lang$applyTo = function(arglist__5117) {
      var f = cljs.core.first(arglist__5117);
      var a = cljs.core.first(cljs.core.next(arglist__5117));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5117)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5117))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5117)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5117)))));
      return G__5116__delegate(f, a, b, c, d, args)
    };
    G__5116.cljs$lang$arity$variadic = G__5116__delegate;
    return G__5116
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__5118) {
    var obj = cljs.core.first(arglist__5118);
    var f = cljs.core.first(cljs.core.next(arglist__5118));
    var args = cljs.core.rest(cljs.core.next(arglist__5118));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5119__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5119 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5119__delegate.call(this, x, y, more)
    };
    G__5119.cljs$lang$maxFixedArity = 2;
    G__5119.cljs$lang$applyTo = function(arglist__5120) {
      var x = cljs.core.first(arglist__5120);
      var y = cljs.core.first(cljs.core.next(arglist__5120));
      var more = cljs.core.rest(cljs.core.next(arglist__5120));
      return G__5119__delegate(x, y, more)
    };
    G__5119.cljs$lang$arity$variadic = G__5119__delegate;
    return G__5119
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5121 = pred;
        var G__5122 = cljs.core.next.call(null, coll);
        pred = G__5121;
        coll = G__5122;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3824__auto____5123 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____5123)) {
        return or__3824__auto____5123
      }else {
        var G__5124 = pred;
        var G__5125 = cljs.core.next.call(null, coll);
        pred = G__5124;
        coll = G__5125;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5126 = null;
    var G__5126__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5126__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5126__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5126__3 = function() {
      var G__5127__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5127 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5127__delegate.call(this, x, y, zs)
      };
      G__5127.cljs$lang$maxFixedArity = 2;
      G__5127.cljs$lang$applyTo = function(arglist__5128) {
        var x = cljs.core.first(arglist__5128);
        var y = cljs.core.first(cljs.core.next(arglist__5128));
        var zs = cljs.core.rest(cljs.core.next(arglist__5128));
        return G__5127__delegate(x, y, zs)
      };
      G__5127.cljs$lang$arity$variadic = G__5127__delegate;
      return G__5127
    }();
    G__5126 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5126__0.call(this);
        case 1:
          return G__5126__1.call(this, x);
        case 2:
          return G__5126__2.call(this, x, y);
        default:
          return G__5126__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5126.cljs$lang$maxFixedArity = 2;
    G__5126.cljs$lang$applyTo = G__5126__3.cljs$lang$applyTo;
    return G__5126
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5129__delegate = function(args) {
      return x
    };
    var G__5129 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5129__delegate.call(this, args)
    };
    G__5129.cljs$lang$maxFixedArity = 0;
    G__5129.cljs$lang$applyTo = function(arglist__5130) {
      var args = cljs.core.seq(arglist__5130);
      return G__5129__delegate(args)
    };
    G__5129.cljs$lang$arity$variadic = G__5129__delegate;
    return G__5129
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5134 = null;
      var G__5134__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5134__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5134__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5134__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5134__4 = function() {
        var G__5135__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5135 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5135__delegate.call(this, x, y, z, args)
        };
        G__5135.cljs$lang$maxFixedArity = 3;
        G__5135.cljs$lang$applyTo = function(arglist__5136) {
          var x = cljs.core.first(arglist__5136);
          var y = cljs.core.first(cljs.core.next(arglist__5136));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5136)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5136)));
          return G__5135__delegate(x, y, z, args)
        };
        G__5135.cljs$lang$arity$variadic = G__5135__delegate;
        return G__5135
      }();
      G__5134 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5134__0.call(this);
          case 1:
            return G__5134__1.call(this, x);
          case 2:
            return G__5134__2.call(this, x, y);
          case 3:
            return G__5134__3.call(this, x, y, z);
          default:
            return G__5134__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5134.cljs$lang$maxFixedArity = 3;
      G__5134.cljs$lang$applyTo = G__5134__4.cljs$lang$applyTo;
      return G__5134
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5137 = null;
      var G__5137__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5137__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5137__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5137__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5137__4 = function() {
        var G__5138__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5138 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5138__delegate.call(this, x, y, z, args)
        };
        G__5138.cljs$lang$maxFixedArity = 3;
        G__5138.cljs$lang$applyTo = function(arglist__5139) {
          var x = cljs.core.first(arglist__5139);
          var y = cljs.core.first(cljs.core.next(arglist__5139));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5139)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5139)));
          return G__5138__delegate(x, y, z, args)
        };
        G__5138.cljs$lang$arity$variadic = G__5138__delegate;
        return G__5138
      }();
      G__5137 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5137__0.call(this);
          case 1:
            return G__5137__1.call(this, x);
          case 2:
            return G__5137__2.call(this, x, y);
          case 3:
            return G__5137__3.call(this, x, y, z);
          default:
            return G__5137__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5137.cljs$lang$maxFixedArity = 3;
      G__5137.cljs$lang$applyTo = G__5137__4.cljs$lang$applyTo;
      return G__5137
    }()
  };
  var comp__4 = function() {
    var G__5140__delegate = function(f1, f2, f3, fs) {
      var fs__5131 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5141__delegate = function(args) {
          var ret__5132 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5131), args);
          var fs__5133 = cljs.core.next.call(null, fs__5131);
          while(true) {
            if(cljs.core.truth_(fs__5133)) {
              var G__5142 = cljs.core.first.call(null, fs__5133).call(null, ret__5132);
              var G__5143 = cljs.core.next.call(null, fs__5133);
              ret__5132 = G__5142;
              fs__5133 = G__5143;
              continue
            }else {
              return ret__5132
            }
            break
          }
        };
        var G__5141 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5141__delegate.call(this, args)
        };
        G__5141.cljs$lang$maxFixedArity = 0;
        G__5141.cljs$lang$applyTo = function(arglist__5144) {
          var args = cljs.core.seq(arglist__5144);
          return G__5141__delegate(args)
        };
        G__5141.cljs$lang$arity$variadic = G__5141__delegate;
        return G__5141
      }()
    };
    var G__5140 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5140__delegate.call(this, f1, f2, f3, fs)
    };
    G__5140.cljs$lang$maxFixedArity = 3;
    G__5140.cljs$lang$applyTo = function(arglist__5145) {
      var f1 = cljs.core.first(arglist__5145);
      var f2 = cljs.core.first(cljs.core.next(arglist__5145));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5145)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5145)));
      return G__5140__delegate(f1, f2, f3, fs)
    };
    G__5140.cljs$lang$arity$variadic = G__5140__delegate;
    return G__5140
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5146__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5146 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5146__delegate.call(this, args)
      };
      G__5146.cljs$lang$maxFixedArity = 0;
      G__5146.cljs$lang$applyTo = function(arglist__5147) {
        var args = cljs.core.seq(arglist__5147);
        return G__5146__delegate(args)
      };
      G__5146.cljs$lang$arity$variadic = G__5146__delegate;
      return G__5146
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5148__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5148 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5148__delegate.call(this, args)
      };
      G__5148.cljs$lang$maxFixedArity = 0;
      G__5148.cljs$lang$applyTo = function(arglist__5149) {
        var args = cljs.core.seq(arglist__5149);
        return G__5148__delegate(args)
      };
      G__5148.cljs$lang$arity$variadic = G__5148__delegate;
      return G__5148
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5150__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5150 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5150__delegate.call(this, args)
      };
      G__5150.cljs$lang$maxFixedArity = 0;
      G__5150.cljs$lang$applyTo = function(arglist__5151) {
        var args = cljs.core.seq(arglist__5151);
        return G__5150__delegate(args)
      };
      G__5150.cljs$lang$arity$variadic = G__5150__delegate;
      return G__5150
    }()
  };
  var partial__5 = function() {
    var G__5152__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5153__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5153 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5153__delegate.call(this, args)
        };
        G__5153.cljs$lang$maxFixedArity = 0;
        G__5153.cljs$lang$applyTo = function(arglist__5154) {
          var args = cljs.core.seq(arglist__5154);
          return G__5153__delegate(args)
        };
        G__5153.cljs$lang$arity$variadic = G__5153__delegate;
        return G__5153
      }()
    };
    var G__5152 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5152__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5152.cljs$lang$maxFixedArity = 4;
    G__5152.cljs$lang$applyTo = function(arglist__5155) {
      var f = cljs.core.first(arglist__5155);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5155));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5155)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5155))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5155))));
      return G__5152__delegate(f, arg1, arg2, arg3, more)
    };
    G__5152.cljs$lang$arity$variadic = G__5152__delegate;
    return G__5152
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5156 = null;
      var G__5156__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5156__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5156__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5156__4 = function() {
        var G__5157__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5157 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5157__delegate.call(this, a, b, c, ds)
        };
        G__5157.cljs$lang$maxFixedArity = 3;
        G__5157.cljs$lang$applyTo = function(arglist__5158) {
          var a = cljs.core.first(arglist__5158);
          var b = cljs.core.first(cljs.core.next(arglist__5158));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5158)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5158)));
          return G__5157__delegate(a, b, c, ds)
        };
        G__5157.cljs$lang$arity$variadic = G__5157__delegate;
        return G__5157
      }();
      G__5156 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5156__1.call(this, a);
          case 2:
            return G__5156__2.call(this, a, b);
          case 3:
            return G__5156__3.call(this, a, b, c);
          default:
            return G__5156__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5156.cljs$lang$maxFixedArity = 3;
      G__5156.cljs$lang$applyTo = G__5156__4.cljs$lang$applyTo;
      return G__5156
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5159 = null;
      var G__5159__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5159__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5159__4 = function() {
        var G__5160__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5160 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5160__delegate.call(this, a, b, c, ds)
        };
        G__5160.cljs$lang$maxFixedArity = 3;
        G__5160.cljs$lang$applyTo = function(arglist__5161) {
          var a = cljs.core.first(arglist__5161);
          var b = cljs.core.first(cljs.core.next(arglist__5161));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5161)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5161)));
          return G__5160__delegate(a, b, c, ds)
        };
        G__5160.cljs$lang$arity$variadic = G__5160__delegate;
        return G__5160
      }();
      G__5159 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5159__2.call(this, a, b);
          case 3:
            return G__5159__3.call(this, a, b, c);
          default:
            return G__5159__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5159.cljs$lang$maxFixedArity = 3;
      G__5159.cljs$lang$applyTo = G__5159__4.cljs$lang$applyTo;
      return G__5159
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5162 = null;
      var G__5162__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5162__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5162__4 = function() {
        var G__5163__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5163 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5163__delegate.call(this, a, b, c, ds)
        };
        G__5163.cljs$lang$maxFixedArity = 3;
        G__5163.cljs$lang$applyTo = function(arglist__5164) {
          var a = cljs.core.first(arglist__5164);
          var b = cljs.core.first(cljs.core.next(arglist__5164));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5164)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5164)));
          return G__5163__delegate(a, b, c, ds)
        };
        G__5163.cljs$lang$arity$variadic = G__5163__delegate;
        return G__5163
      }();
      G__5162 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5162__2.call(this, a, b);
          case 3:
            return G__5162__3.call(this, a, b, c);
          default:
            return G__5162__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5162.cljs$lang$maxFixedArity = 3;
      G__5162.cljs$lang$applyTo = G__5162__4.cljs$lang$applyTo;
      return G__5162
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5167 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5165 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5165)) {
        var s__5166 = temp__3974__auto____5165;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5166)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5166)))
      }else {
        return null
      }
    })
  };
  return mapi__5167.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5168 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5168)) {
      var s__5169 = temp__3974__auto____5168;
      var x__5170 = f.call(null, cljs.core.first.call(null, s__5169));
      if(x__5170 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5169))
      }else {
        return cljs.core.cons.call(null, x__5170, keep.call(null, f, cljs.core.rest.call(null, s__5169)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5180 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5177 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5177)) {
        var s__5178 = temp__3974__auto____5177;
        var x__5179 = f.call(null, idx, cljs.core.first.call(null, s__5178));
        if(x__5179 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5178))
        }else {
          return cljs.core.cons.call(null, x__5179, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5178)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5180.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5187 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5187)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____5187
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5188 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5188)) {
            var and__3822__auto____5189 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5189)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____5189
            }
          }else {
            return and__3822__auto____5188
          }
        }())
      };
      var ep1__4 = function() {
        var G__5225__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5190 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5190)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____5190
            }
          }())
        };
        var G__5225 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5225__delegate.call(this, x, y, z, args)
        };
        G__5225.cljs$lang$maxFixedArity = 3;
        G__5225.cljs$lang$applyTo = function(arglist__5226) {
          var x = cljs.core.first(arglist__5226);
          var y = cljs.core.first(cljs.core.next(arglist__5226));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5226)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5226)));
          return G__5225__delegate(x, y, z, args)
        };
        G__5225.cljs$lang$arity$variadic = G__5225__delegate;
        return G__5225
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5191 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5191)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____5191
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5192 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5192)) {
            var and__3822__auto____5193 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5193)) {
              var and__3822__auto____5194 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5194)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____5194
              }
            }else {
              return and__3822__auto____5193
            }
          }else {
            return and__3822__auto____5192
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5195 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5195)) {
            var and__3822__auto____5196 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5196)) {
              var and__3822__auto____5197 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____5197)) {
                var and__3822__auto____5198 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____5198)) {
                  var and__3822__auto____5199 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5199)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____5199
                  }
                }else {
                  return and__3822__auto____5198
                }
              }else {
                return and__3822__auto____5197
              }
            }else {
              return and__3822__auto____5196
            }
          }else {
            return and__3822__auto____5195
          }
        }())
      };
      var ep2__4 = function() {
        var G__5227__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5200 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5200)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5171_SHARP_) {
                var and__3822__auto____5201 = p1.call(null, p1__5171_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5201)) {
                  return p2.call(null, p1__5171_SHARP_)
                }else {
                  return and__3822__auto____5201
                }
              }, args)
            }else {
              return and__3822__auto____5200
            }
          }())
        };
        var G__5227 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5227__delegate.call(this, x, y, z, args)
        };
        G__5227.cljs$lang$maxFixedArity = 3;
        G__5227.cljs$lang$applyTo = function(arglist__5228) {
          var x = cljs.core.first(arglist__5228);
          var y = cljs.core.first(cljs.core.next(arglist__5228));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5228)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5228)));
          return G__5227__delegate(x, y, z, args)
        };
        G__5227.cljs$lang$arity$variadic = G__5227__delegate;
        return G__5227
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5202 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5202)) {
            var and__3822__auto____5203 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5203)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____5203
            }
          }else {
            return and__3822__auto____5202
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5204 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5204)) {
            var and__3822__auto____5205 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5205)) {
              var and__3822__auto____5206 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5206)) {
                var and__3822__auto____5207 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5207)) {
                  var and__3822__auto____5208 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5208)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____5208
                  }
                }else {
                  return and__3822__auto____5207
                }
              }else {
                return and__3822__auto____5206
              }
            }else {
              return and__3822__auto____5205
            }
          }else {
            return and__3822__auto____5204
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5209 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5209)) {
            var and__3822__auto____5210 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5210)) {
              var and__3822__auto____5211 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5211)) {
                var and__3822__auto____5212 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5212)) {
                  var and__3822__auto____5213 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5213)) {
                    var and__3822__auto____5214 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____5214)) {
                      var and__3822__auto____5215 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____5215)) {
                        var and__3822__auto____5216 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____5216)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____5216
                        }
                      }else {
                        return and__3822__auto____5215
                      }
                    }else {
                      return and__3822__auto____5214
                    }
                  }else {
                    return and__3822__auto____5213
                  }
                }else {
                  return and__3822__auto____5212
                }
              }else {
                return and__3822__auto____5211
              }
            }else {
              return and__3822__auto____5210
            }
          }else {
            return and__3822__auto____5209
          }
        }())
      };
      var ep3__4 = function() {
        var G__5229__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5217 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5217)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5172_SHARP_) {
                var and__3822__auto____5218 = p1.call(null, p1__5172_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5218)) {
                  var and__3822__auto____5219 = p2.call(null, p1__5172_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____5219)) {
                    return p3.call(null, p1__5172_SHARP_)
                  }else {
                    return and__3822__auto____5219
                  }
                }else {
                  return and__3822__auto____5218
                }
              }, args)
            }else {
              return and__3822__auto____5217
            }
          }())
        };
        var G__5229 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5229__delegate.call(this, x, y, z, args)
        };
        G__5229.cljs$lang$maxFixedArity = 3;
        G__5229.cljs$lang$applyTo = function(arglist__5230) {
          var x = cljs.core.first(arglist__5230);
          var y = cljs.core.first(cljs.core.next(arglist__5230));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5230)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5230)));
          return G__5229__delegate(x, y, z, args)
        };
        G__5229.cljs$lang$arity$variadic = G__5229__delegate;
        return G__5229
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5231__delegate = function(p1, p2, p3, ps) {
      var ps__5220 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5173_SHARP_) {
            return p1__5173_SHARP_.call(null, x)
          }, ps__5220)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5174_SHARP_) {
            var and__3822__auto____5221 = p1__5174_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5221)) {
              return p1__5174_SHARP_.call(null, y)
            }else {
              return and__3822__auto____5221
            }
          }, ps__5220)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5175_SHARP_) {
            var and__3822__auto____5222 = p1__5175_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5222)) {
              var and__3822__auto____5223 = p1__5175_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____5223)) {
                return p1__5175_SHARP_.call(null, z)
              }else {
                return and__3822__auto____5223
              }
            }else {
              return and__3822__auto____5222
            }
          }, ps__5220)
        };
        var epn__4 = function() {
          var G__5232__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____5224 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____5224)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5176_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5176_SHARP_, args)
                }, ps__5220)
              }else {
                return and__3822__auto____5224
              }
            }())
          };
          var G__5232 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5232__delegate.call(this, x, y, z, args)
          };
          G__5232.cljs$lang$maxFixedArity = 3;
          G__5232.cljs$lang$applyTo = function(arglist__5233) {
            var x = cljs.core.first(arglist__5233);
            var y = cljs.core.first(cljs.core.next(arglist__5233));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5233)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5233)));
            return G__5232__delegate(x, y, z, args)
          };
          G__5232.cljs$lang$arity$variadic = G__5232__delegate;
          return G__5232
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__5231 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5231__delegate.call(this, p1, p2, p3, ps)
    };
    G__5231.cljs$lang$maxFixedArity = 3;
    G__5231.cljs$lang$applyTo = function(arglist__5234) {
      var p1 = cljs.core.first(arglist__5234);
      var p2 = cljs.core.first(cljs.core.next(arglist__5234));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5234)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5234)));
      return G__5231__delegate(p1, p2, p3, ps)
    };
    G__5231.cljs$lang$arity$variadic = G__5231__delegate;
    return G__5231
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____5236 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5236)) {
          return or__3824__auto____5236
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____5237 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5237)) {
          return or__3824__auto____5237
        }else {
          var or__3824__auto____5238 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5238)) {
            return or__3824__auto____5238
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5274__delegate = function(x, y, z, args) {
          var or__3824__auto____5239 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5239)) {
            return or__3824__auto____5239
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5274 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5274__delegate.call(this, x, y, z, args)
        };
        G__5274.cljs$lang$maxFixedArity = 3;
        G__5274.cljs$lang$applyTo = function(arglist__5275) {
          var x = cljs.core.first(arglist__5275);
          var y = cljs.core.first(cljs.core.next(arglist__5275));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5275)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5275)));
          return G__5274__delegate(x, y, z, args)
        };
        G__5274.cljs$lang$arity$variadic = G__5274__delegate;
        return G__5274
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____5240 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5240)) {
          return or__3824__auto____5240
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____5241 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5241)) {
          return or__3824__auto____5241
        }else {
          var or__3824__auto____5242 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5242)) {
            return or__3824__auto____5242
          }else {
            var or__3824__auto____5243 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5243)) {
              return or__3824__auto____5243
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____5244 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5244)) {
          return or__3824__auto____5244
        }else {
          var or__3824__auto____5245 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5245)) {
            return or__3824__auto____5245
          }else {
            var or__3824__auto____5246 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____5246)) {
              return or__3824__auto____5246
            }else {
              var or__3824__auto____5247 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____5247)) {
                return or__3824__auto____5247
              }else {
                var or__3824__auto____5248 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5248)) {
                  return or__3824__auto____5248
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5276__delegate = function(x, y, z, args) {
          var or__3824__auto____5249 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5249)) {
            return or__3824__auto____5249
          }else {
            return cljs.core.some.call(null, function(p1__5181_SHARP_) {
              var or__3824__auto____5250 = p1.call(null, p1__5181_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5250)) {
                return or__3824__auto____5250
              }else {
                return p2.call(null, p1__5181_SHARP_)
              }
            }, args)
          }
        };
        var G__5276 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5276__delegate.call(this, x, y, z, args)
        };
        G__5276.cljs$lang$maxFixedArity = 3;
        G__5276.cljs$lang$applyTo = function(arglist__5277) {
          var x = cljs.core.first(arglist__5277);
          var y = cljs.core.first(cljs.core.next(arglist__5277));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5277)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5277)));
          return G__5276__delegate(x, y, z, args)
        };
        G__5276.cljs$lang$arity$variadic = G__5276__delegate;
        return G__5276
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____5251 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5251)) {
          return or__3824__auto____5251
        }else {
          var or__3824__auto____5252 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5252)) {
            return or__3824__auto____5252
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____5253 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5253)) {
          return or__3824__auto____5253
        }else {
          var or__3824__auto____5254 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5254)) {
            return or__3824__auto____5254
          }else {
            var or__3824__auto____5255 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5255)) {
              return or__3824__auto____5255
            }else {
              var or__3824__auto____5256 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5256)) {
                return or__3824__auto____5256
              }else {
                var or__3824__auto____5257 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5257)) {
                  return or__3824__auto____5257
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____5258 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5258)) {
          return or__3824__auto____5258
        }else {
          var or__3824__auto____5259 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5259)) {
            return or__3824__auto____5259
          }else {
            var or__3824__auto____5260 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5260)) {
              return or__3824__auto____5260
            }else {
              var or__3824__auto____5261 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5261)) {
                return or__3824__auto____5261
              }else {
                var or__3824__auto____5262 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5262)) {
                  return or__3824__auto____5262
                }else {
                  var or__3824__auto____5263 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____5263)) {
                    return or__3824__auto____5263
                  }else {
                    var or__3824__auto____5264 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____5264)) {
                      return or__3824__auto____5264
                    }else {
                      var or__3824__auto____5265 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____5265)) {
                        return or__3824__auto____5265
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__5278__delegate = function(x, y, z, args) {
          var or__3824__auto____5266 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5266)) {
            return or__3824__auto____5266
          }else {
            return cljs.core.some.call(null, function(p1__5182_SHARP_) {
              var or__3824__auto____5267 = p1.call(null, p1__5182_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5267)) {
                return or__3824__auto____5267
              }else {
                var or__3824__auto____5268 = p2.call(null, p1__5182_SHARP_);
                if(cljs.core.truth_(or__3824__auto____5268)) {
                  return or__3824__auto____5268
                }else {
                  return p3.call(null, p1__5182_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5278 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5278__delegate.call(this, x, y, z, args)
        };
        G__5278.cljs$lang$maxFixedArity = 3;
        G__5278.cljs$lang$applyTo = function(arglist__5279) {
          var x = cljs.core.first(arglist__5279);
          var y = cljs.core.first(cljs.core.next(arglist__5279));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5279)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5279)));
          return G__5278__delegate(x, y, z, args)
        };
        G__5278.cljs$lang$arity$variadic = G__5278__delegate;
        return G__5278
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5280__delegate = function(p1, p2, p3, ps) {
      var ps__5269 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5183_SHARP_) {
            return p1__5183_SHARP_.call(null, x)
          }, ps__5269)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5184_SHARP_) {
            var or__3824__auto____5270 = p1__5184_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5270)) {
              return or__3824__auto____5270
            }else {
              return p1__5184_SHARP_.call(null, y)
            }
          }, ps__5269)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5185_SHARP_) {
            var or__3824__auto____5271 = p1__5185_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5271)) {
              return or__3824__auto____5271
            }else {
              var or__3824__auto____5272 = p1__5185_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5272)) {
                return or__3824__auto____5272
              }else {
                return p1__5185_SHARP_.call(null, z)
              }
            }
          }, ps__5269)
        };
        var spn__4 = function() {
          var G__5281__delegate = function(x, y, z, args) {
            var or__3824__auto____5273 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____5273)) {
              return or__3824__auto____5273
            }else {
              return cljs.core.some.call(null, function(p1__5186_SHARP_) {
                return cljs.core.some.call(null, p1__5186_SHARP_, args)
              }, ps__5269)
            }
          };
          var G__5281 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5281__delegate.call(this, x, y, z, args)
          };
          G__5281.cljs$lang$maxFixedArity = 3;
          G__5281.cljs$lang$applyTo = function(arglist__5282) {
            var x = cljs.core.first(arglist__5282);
            var y = cljs.core.first(cljs.core.next(arglist__5282));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5282)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5282)));
            return G__5281__delegate(x, y, z, args)
          };
          G__5281.cljs$lang$arity$variadic = G__5281__delegate;
          return G__5281
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__5280 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5280__delegate.call(this, p1, p2, p3, ps)
    };
    G__5280.cljs$lang$maxFixedArity = 3;
    G__5280.cljs$lang$applyTo = function(arglist__5283) {
      var p1 = cljs.core.first(arglist__5283);
      var p2 = cljs.core.first(cljs.core.next(arglist__5283));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5283)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5283)));
      return G__5280__delegate(p1, p2, p3, ps)
    };
    G__5280.cljs$lang$arity$variadic = G__5280__delegate;
    return G__5280
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5284 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5284)) {
        var s__5285 = temp__3974__auto____5284;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5285)), map.call(null, f, cljs.core.rest.call(null, s__5285)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5286 = cljs.core.seq.call(null, c1);
      var s2__5287 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5288 = s1__5286;
        if(cljs.core.truth_(and__3822__auto____5288)) {
          return s2__5287
        }else {
          return and__3822__auto____5288
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5286), cljs.core.first.call(null, s2__5287)), map.call(null, f, cljs.core.rest.call(null, s1__5286), cljs.core.rest.call(null, s2__5287)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5289 = cljs.core.seq.call(null, c1);
      var s2__5290 = cljs.core.seq.call(null, c2);
      var s3__5291 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5292 = s1__5289;
        if(cljs.core.truth_(and__3822__auto____5292)) {
          var and__3822__auto____5293 = s2__5290;
          if(cljs.core.truth_(and__3822__auto____5293)) {
            return s3__5291
          }else {
            return and__3822__auto____5293
          }
        }else {
          return and__3822__auto____5292
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5289), cljs.core.first.call(null, s2__5290), cljs.core.first.call(null, s3__5291)), map.call(null, f, cljs.core.rest.call(null, s1__5289), cljs.core.rest.call(null, s2__5290), cljs.core.rest.call(null, s3__5291)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5296__delegate = function(f, c1, c2, c3, colls) {
      var step__5295 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5294 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5294)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5294), step.call(null, map.call(null, cljs.core.rest, ss__5294)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5235_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5235_SHARP_)
      }, step__5295.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5296 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5296__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5296.cljs$lang$maxFixedArity = 4;
    G__5296.cljs$lang$applyTo = function(arglist__5297) {
      var f = cljs.core.first(arglist__5297);
      var c1 = cljs.core.first(cljs.core.next(arglist__5297));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5297)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5297))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5297))));
      return G__5296__delegate(f, c1, c2, c3, colls)
    };
    G__5296.cljs$lang$arity$variadic = G__5296__delegate;
    return G__5296
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____5298 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5298)) {
        var s__5299 = temp__3974__auto____5298;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5299), take.call(null, n - 1, cljs.core.rest.call(null, s__5299)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5302 = function(n, coll) {
    while(true) {
      var s__5300 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5301 = n > 0;
        if(and__3822__auto____5301) {
          return s__5300
        }else {
          return and__3822__auto____5301
        }
      }())) {
        var G__5303 = n - 1;
        var G__5304 = cljs.core.rest.call(null, s__5300);
        n = G__5303;
        coll = G__5304;
        continue
      }else {
        return s__5300
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5302.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5305 = cljs.core.seq.call(null, coll);
  var lead__5306 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5306)) {
      var G__5307 = cljs.core.next.call(null, s__5305);
      var G__5308 = cljs.core.next.call(null, lead__5306);
      s__5305 = G__5307;
      lead__5306 = G__5308;
      continue
    }else {
      return s__5305
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5311 = function(pred, coll) {
    while(true) {
      var s__5309 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5310 = s__5309;
        if(cljs.core.truth_(and__3822__auto____5310)) {
          return pred.call(null, cljs.core.first.call(null, s__5309))
        }else {
          return and__3822__auto____5310
        }
      }())) {
        var G__5312 = pred;
        var G__5313 = cljs.core.rest.call(null, s__5309);
        pred = G__5312;
        coll = G__5313;
        continue
      }else {
        return s__5309
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5311.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5314 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5314)) {
      var s__5315 = temp__3974__auto____5314;
      return cljs.core.concat.call(null, s__5315, cycle.call(null, s__5315))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5316 = cljs.core.seq.call(null, c1);
      var s2__5317 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5318 = s1__5316;
        if(cljs.core.truth_(and__3822__auto____5318)) {
          return s2__5317
        }else {
          return and__3822__auto____5318
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5316), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5317), interleave.call(null, cljs.core.rest.call(null, s1__5316), cljs.core.rest.call(null, s2__5317))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5320__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5319 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5319)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5319), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5319)))
        }else {
          return null
        }
      })
    };
    var G__5320 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5320__delegate.call(this, c1, c2, colls)
    };
    G__5320.cljs$lang$maxFixedArity = 2;
    G__5320.cljs$lang$applyTo = function(arglist__5321) {
      var c1 = cljs.core.first(arglist__5321);
      var c2 = cljs.core.first(cljs.core.next(arglist__5321));
      var colls = cljs.core.rest(cljs.core.next(arglist__5321));
      return G__5320__delegate(c1, c2, colls)
    };
    G__5320.cljs$lang$arity$variadic = G__5320__delegate;
    return G__5320
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5324 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____5322 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____5322)) {
        var coll__5323 = temp__3971__auto____5322;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5323), cat.call(null, cljs.core.rest.call(null, coll__5323), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5324.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5325__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5325 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5325__delegate.call(this, f, coll, colls)
    };
    G__5325.cljs$lang$maxFixedArity = 2;
    G__5325.cljs$lang$applyTo = function(arglist__5326) {
      var f = cljs.core.first(arglist__5326);
      var coll = cljs.core.first(cljs.core.next(arglist__5326));
      var colls = cljs.core.rest(cljs.core.next(arglist__5326));
      return G__5325__delegate(f, coll, colls)
    };
    G__5325.cljs$lang$arity$variadic = G__5325__delegate;
    return G__5325
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5327 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5327)) {
      var s__5328 = temp__3974__auto____5327;
      var f__5329 = cljs.core.first.call(null, s__5328);
      var r__5330 = cljs.core.rest.call(null, s__5328);
      if(cljs.core.truth_(pred.call(null, f__5329))) {
        return cljs.core.cons.call(null, f__5329, filter.call(null, pred, r__5330))
      }else {
        return filter.call(null, pred, r__5330)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5332 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5332.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5331_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5331_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5333__5334 = to;
    if(G__5333__5334 != null) {
      if(function() {
        var or__3824__auto____5335 = G__5333__5334.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____5335) {
          return or__3824__auto____5335
        }else {
          return G__5333__5334.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5333__5334.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5333__5334)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5333__5334)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5336__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5336 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5336__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5336.cljs$lang$maxFixedArity = 4;
    G__5336.cljs$lang$applyTo = function(arglist__5337) {
      var f = cljs.core.first(arglist__5337);
      var c1 = cljs.core.first(cljs.core.next(arglist__5337));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5337)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5337))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5337))));
      return G__5336__delegate(f, c1, c2, c3, colls)
    };
    G__5336.cljs$lang$arity$variadic = G__5336__delegate;
    return G__5336
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5338 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5338)) {
        var s__5339 = temp__3974__auto____5338;
        var p__5340 = cljs.core.take.call(null, n, s__5339);
        if(n === cljs.core.count.call(null, p__5340)) {
          return cljs.core.cons.call(null, p__5340, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5339)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5341 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5341)) {
        var s__5342 = temp__3974__auto____5341;
        var p__5343 = cljs.core.take.call(null, n, s__5342);
        if(n === cljs.core.count.call(null, p__5343)) {
          return cljs.core.cons.call(null, p__5343, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5342)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5343, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5344 = cljs.core.lookup_sentinel;
    var m__5345 = m;
    var ks__5346 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5346)) {
        var m__5347 = cljs.core.get.call(null, m__5345, cljs.core.first.call(null, ks__5346), sentinel__5344);
        if(sentinel__5344 === m__5347) {
          return not_found
        }else {
          var G__5348 = sentinel__5344;
          var G__5349 = m__5347;
          var G__5350 = cljs.core.next.call(null, ks__5346);
          sentinel__5344 = G__5348;
          m__5345 = G__5349;
          ks__5346 = G__5350;
          continue
        }
      }else {
        return m__5345
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5351, v) {
  var vec__5352__5353 = p__5351;
  var k__5354 = cljs.core.nth.call(null, vec__5352__5353, 0, null);
  var ks__5355 = cljs.core.nthnext.call(null, vec__5352__5353, 1);
  if(cljs.core.truth_(ks__5355)) {
    return cljs.core.assoc.call(null, m, k__5354, assoc_in.call(null, cljs.core.get.call(null, m, k__5354), ks__5355, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5354, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5356, f, args) {
    var vec__5357__5358 = p__5356;
    var k__5359 = cljs.core.nth.call(null, vec__5357__5358, 0, null);
    var ks__5360 = cljs.core.nthnext.call(null, vec__5357__5358, 1);
    if(cljs.core.truth_(ks__5360)) {
      return cljs.core.assoc.call(null, m, k__5359, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5359), ks__5360, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5359, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5359), args))
    }
  };
  var update_in = function(m, p__5356, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5356, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5361) {
    var m = cljs.core.first(arglist__5361);
    var p__5356 = cljs.core.first(cljs.core.next(arglist__5361));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5361)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5361)));
    return update_in__delegate(m, p__5356, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5366 = this;
  var h__364__auto____5367 = this__5366.__hash;
  if(h__364__auto____5367 != null) {
    return h__364__auto____5367
  }else {
    var h__364__auto____5368 = cljs.core.hash_coll.call(null, coll);
    this__5366.__hash = h__364__auto____5368;
    return h__364__auto____5368
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5369 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5370 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5371 = this;
  var new_array__5372 = cljs.core.aclone.call(null, this__5371.array);
  new_array__5372[k] = v;
  return new cljs.core.Vector(this__5371.meta, new_array__5372, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5401 = null;
  var G__5401__2 = function(tsym5364, k) {
    var this__5373 = this;
    var tsym5364__5374 = this;
    var coll__5375 = tsym5364__5374;
    return cljs.core._lookup.call(null, coll__5375, k)
  };
  var G__5401__3 = function(tsym5365, k, not_found) {
    var this__5376 = this;
    var tsym5365__5377 = this;
    var coll__5378 = tsym5365__5377;
    return cljs.core._lookup.call(null, coll__5378, k, not_found)
  };
  G__5401 = function(tsym5365, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5401__2.call(this, tsym5365, k);
      case 3:
        return G__5401__3.call(this, tsym5365, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5401
}();
cljs.core.Vector.prototype.apply = function(tsym5362, args5363) {
  return tsym5362.call.apply(tsym5362, [tsym5362].concat(cljs.core.aclone.call(null, args5363)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5379 = this;
  var new_array__5380 = cljs.core.aclone.call(null, this__5379.array);
  new_array__5380.push(o);
  return new cljs.core.Vector(this__5379.meta, new_array__5380, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5381 = this;
  var this$__5382 = this;
  return cljs.core.pr_str.call(null, this$__5382)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5383 = this;
  return cljs.core.ci_reduce.call(null, this__5383.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5384 = this;
  return cljs.core.ci_reduce.call(null, this__5384.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5385 = this;
  if(this__5385.array.length > 0) {
    var vector_seq__5386 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5385.array.length) {
          return cljs.core.cons.call(null, this__5385.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5386.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5387 = this;
  return this__5387.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5388 = this;
  var count__5389 = this__5388.array.length;
  if(count__5389 > 0) {
    return this__5388.array[count__5389 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5390 = this;
  if(this__5390.array.length > 0) {
    var new_array__5391 = cljs.core.aclone.call(null, this__5390.array);
    new_array__5391.pop();
    return new cljs.core.Vector(this__5390.meta, new_array__5391, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5392 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5393 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5394 = this;
  return new cljs.core.Vector(meta, this__5394.array, this__5394.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5395 = this;
  return this__5395.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5397 = this;
  if(function() {
    var and__3822__auto____5398 = 0 <= n;
    if(and__3822__auto____5398) {
      return n < this__5397.array.length
    }else {
      return and__3822__auto____5398
    }
  }()) {
    return this__5397.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5399 = this;
  if(function() {
    var and__3822__auto____5400 = 0 <= n;
    if(and__3822__auto____5400) {
      return n < this__5399.array.length
    }else {
      return and__3822__auto____5400
    }
  }()) {
    return this__5399.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5396 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5396.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5402 = pv.cnt;
  if(cnt__5402 < 32) {
    return 0
  }else {
    return cnt__5402 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5403 = level;
  var ret__5404 = node;
  while(true) {
    if(ll__5403 === 0) {
      return ret__5404
    }else {
      var embed__5405 = ret__5404;
      var r__5406 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5407 = cljs.core.pv_aset.call(null, r__5406, 0, embed__5405);
      var G__5408 = ll__5403 - 5;
      var G__5409 = r__5406;
      ll__5403 = G__5408;
      ret__5404 = G__5409;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5410 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5411 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5410, subidx__5411, tailnode);
    return ret__5410
  }else {
    var temp__3971__auto____5412 = cljs.core.pv_aget.call(null, parent, subidx__5411);
    if(cljs.core.truth_(temp__3971__auto____5412)) {
      var child__5413 = temp__3971__auto____5412;
      var node_to_insert__5414 = push_tail.call(null, pv, level - 5, child__5413, tailnode);
      cljs.core.pv_aset.call(null, ret__5410, subidx__5411, node_to_insert__5414);
      return ret__5410
    }else {
      var node_to_insert__5415 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5410, subidx__5411, node_to_insert__5415);
      return ret__5410
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____5416 = 0 <= i;
    if(and__3822__auto____5416) {
      return i < pv.cnt
    }else {
      return and__3822__auto____5416
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5417 = pv.root;
      var level__5418 = pv.shift;
      while(true) {
        if(level__5418 > 0) {
          var G__5419 = cljs.core.pv_aget.call(null, node__5417, i >>> level__5418 & 31);
          var G__5420 = level__5418 - 5;
          node__5417 = G__5419;
          level__5418 = G__5420;
          continue
        }else {
          return node__5417.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5421 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5421, i & 31, val);
    return ret__5421
  }else {
    var subidx__5422 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5421, subidx__5422, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5422), i, val));
    return ret__5421
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5423 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5424 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5423));
    if(function() {
      var and__3822__auto____5425 = new_child__5424 == null;
      if(and__3822__auto____5425) {
        return subidx__5423 === 0
      }else {
        return and__3822__auto____5425
      }
    }()) {
      return null
    }else {
      var ret__5426 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5426, subidx__5423, new_child__5424);
      return ret__5426
    }
  }else {
    if(subidx__5423 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5427 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5427, subidx__5423, null);
        return ret__5427
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5428 = cljs.core._count.call(null, v);
  if(c__5428 > 0) {
    if(void 0 === cljs.core.t5429) {
      cljs.core.t5429 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5429.cljs$lang$type = true;
      cljs.core.t5429.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5429")
      };
      cljs.core.t5429.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5429.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5430 = this;
        return vseq
      };
      cljs.core.t5429.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5429.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5431 = this;
        return cljs.core._nth.call(null, this__5431.v, this__5431.offset)
      };
      cljs.core.t5429.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5432 = this;
        var offset__5433 = this__5432.offset + 1;
        if(offset__5433 < this__5432.c) {
          return this__5432.vector_seq.call(null, this__5432.v, offset__5433)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5429.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5429.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5429.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5434 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5429.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5429.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5429.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5435 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5429.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5429.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5436 = this;
        return this__5436.__meta__389__auto__
      };
      cljs.core.t5429.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5429.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5437 = this;
        return new cljs.core.t5429(this__5437.c, this__5437.offset, this__5437.v, this__5437.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5429
    }else {
    }
    return new cljs.core.t5429(c__5428, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5442 = this;
  return new cljs.core.TransientVector(this__5442.cnt, this__5442.shift, cljs.core.tv_editable_root.call(null, this__5442.root), cljs.core.tv_editable_tail.call(null, this__5442.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5443 = this;
  var h__364__auto____5444 = this__5443.__hash;
  if(h__364__auto____5444 != null) {
    return h__364__auto____5444
  }else {
    var h__364__auto____5445 = cljs.core.hash_coll.call(null, coll);
    this__5443.__hash = h__364__auto____5445;
    return h__364__auto____5445
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5446 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5447 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5448 = this;
  if(function() {
    var and__3822__auto____5449 = 0 <= k;
    if(and__3822__auto____5449) {
      return k < this__5448.cnt
    }else {
      return and__3822__auto____5449
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5450 = cljs.core.aclone.call(null, this__5448.tail);
      new_tail__5450[k & 31] = v;
      return new cljs.core.PersistentVector(this__5448.meta, this__5448.cnt, this__5448.shift, this__5448.root, new_tail__5450, null)
    }else {
      return new cljs.core.PersistentVector(this__5448.meta, this__5448.cnt, this__5448.shift, cljs.core.do_assoc.call(null, coll, this__5448.shift, this__5448.root, k, v), this__5448.tail, null)
    }
  }else {
    if(k === this__5448.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5448.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5495 = null;
  var G__5495__2 = function(tsym5440, k) {
    var this__5451 = this;
    var tsym5440__5452 = this;
    var coll__5453 = tsym5440__5452;
    return cljs.core._lookup.call(null, coll__5453, k)
  };
  var G__5495__3 = function(tsym5441, k, not_found) {
    var this__5454 = this;
    var tsym5441__5455 = this;
    var coll__5456 = tsym5441__5455;
    return cljs.core._lookup.call(null, coll__5456, k, not_found)
  };
  G__5495 = function(tsym5441, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5495__2.call(this, tsym5441, k);
      case 3:
        return G__5495__3.call(this, tsym5441, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5495
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5438, args5439) {
  return tsym5438.call.apply(tsym5438, [tsym5438].concat(cljs.core.aclone.call(null, args5439)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5457 = this;
  var step_init__5458 = [0, init];
  var i__5459 = 0;
  while(true) {
    if(i__5459 < this__5457.cnt) {
      var arr__5460 = cljs.core.array_for.call(null, v, i__5459);
      var len__5461 = arr__5460.length;
      var init__5465 = function() {
        var j__5462 = 0;
        var init__5463 = step_init__5458[1];
        while(true) {
          if(j__5462 < len__5461) {
            var init__5464 = f.call(null, init__5463, j__5462 + i__5459, arr__5460[j__5462]);
            if(cljs.core.reduced_QMARK_.call(null, init__5464)) {
              return init__5464
            }else {
              var G__5496 = j__5462 + 1;
              var G__5497 = init__5464;
              j__5462 = G__5496;
              init__5463 = G__5497;
              continue
            }
          }else {
            step_init__5458[0] = len__5461;
            step_init__5458[1] = init__5463;
            return init__5463
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5465)) {
        return cljs.core.deref.call(null, init__5465)
      }else {
        var G__5498 = i__5459 + step_init__5458[0];
        i__5459 = G__5498;
        continue
      }
    }else {
      return step_init__5458[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5466 = this;
  if(this__5466.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5467 = cljs.core.aclone.call(null, this__5466.tail);
    new_tail__5467.push(o);
    return new cljs.core.PersistentVector(this__5466.meta, this__5466.cnt + 1, this__5466.shift, this__5466.root, new_tail__5467, null)
  }else {
    var root_overflow_QMARK___5468 = this__5466.cnt >>> 5 > 1 << this__5466.shift;
    var new_shift__5469 = root_overflow_QMARK___5468 ? this__5466.shift + 5 : this__5466.shift;
    var new_root__5471 = root_overflow_QMARK___5468 ? function() {
      var n_r__5470 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5470, 0, this__5466.root);
      cljs.core.pv_aset.call(null, n_r__5470, 1, cljs.core.new_path.call(null, null, this__5466.shift, new cljs.core.VectorNode(null, this__5466.tail)));
      return n_r__5470
    }() : cljs.core.push_tail.call(null, coll, this__5466.shift, this__5466.root, new cljs.core.VectorNode(null, this__5466.tail));
    return new cljs.core.PersistentVector(this__5466.meta, this__5466.cnt + 1, new_shift__5469, new_root__5471, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5472 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5473 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5474 = this;
  var this$__5475 = this;
  return cljs.core.pr_str.call(null, this$__5475)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5476 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5477 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5478 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5479 = this;
  return this__5479.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5480 = this;
  if(this__5480.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5480.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5481 = this;
  if(this__5481.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5481.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5481.meta)
    }else {
      if(1 < this__5481.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5481.meta, this__5481.cnt - 1, this__5481.shift, this__5481.root, this__5481.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5482 = cljs.core.array_for.call(null, coll, this__5481.cnt - 2);
          var nr__5483 = cljs.core.pop_tail.call(null, coll, this__5481.shift, this__5481.root);
          var new_root__5484 = nr__5483 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5483;
          var cnt_1__5485 = this__5481.cnt - 1;
          if(function() {
            var and__3822__auto____5486 = 5 < this__5481.shift;
            if(and__3822__auto____5486) {
              return cljs.core.pv_aget.call(null, new_root__5484, 1) == null
            }else {
              return and__3822__auto____5486
            }
          }()) {
            return new cljs.core.PersistentVector(this__5481.meta, cnt_1__5485, this__5481.shift - 5, cljs.core.pv_aget.call(null, new_root__5484, 0), new_tail__5482, null)
          }else {
            return new cljs.core.PersistentVector(this__5481.meta, cnt_1__5485, this__5481.shift, new_root__5484, new_tail__5482, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5488 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5489 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5490 = this;
  return new cljs.core.PersistentVector(meta, this__5490.cnt, this__5490.shift, this__5490.root, this__5490.tail, this__5490.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5491 = this;
  return this__5491.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5492 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5493 = this;
  if(function() {
    var and__3822__auto____5494 = 0 <= n;
    if(and__3822__auto____5494) {
      return n < this__5493.cnt
    }else {
      return and__3822__auto____5494
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5487 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5487.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5499 = cljs.core.seq.call(null, xs);
  var out__5500 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5499)) {
      var G__5501 = cljs.core.next.call(null, xs__5499);
      var G__5502 = cljs.core.conj_BANG_.call(null, out__5500, cljs.core.first.call(null, xs__5499));
      xs__5499 = G__5501;
      out__5500 = G__5502;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5500)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__5503) {
    var args = cljs.core.seq(arglist__5503);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5508 = this;
  var h__364__auto____5509 = this__5508.__hash;
  if(h__364__auto____5509 != null) {
    return h__364__auto____5509
  }else {
    var h__364__auto____5510 = cljs.core.hash_coll.call(null, coll);
    this__5508.__hash = h__364__auto____5510;
    return h__364__auto____5510
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5511 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5512 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5513 = this;
  var v_pos__5514 = this__5513.start + key;
  return new cljs.core.Subvec(this__5513.meta, cljs.core._assoc.call(null, this__5513.v, v_pos__5514, val), this__5513.start, this__5513.end > v_pos__5514 + 1 ? this__5513.end : v_pos__5514 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5538 = null;
  var G__5538__2 = function(tsym5506, k) {
    var this__5515 = this;
    var tsym5506__5516 = this;
    var coll__5517 = tsym5506__5516;
    return cljs.core._lookup.call(null, coll__5517, k)
  };
  var G__5538__3 = function(tsym5507, k, not_found) {
    var this__5518 = this;
    var tsym5507__5519 = this;
    var coll__5520 = tsym5507__5519;
    return cljs.core._lookup.call(null, coll__5520, k, not_found)
  };
  G__5538 = function(tsym5507, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5538__2.call(this, tsym5507, k);
      case 3:
        return G__5538__3.call(this, tsym5507, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5538
}();
cljs.core.Subvec.prototype.apply = function(tsym5504, args5505) {
  return tsym5504.call.apply(tsym5504, [tsym5504].concat(cljs.core.aclone.call(null, args5505)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5521 = this;
  return new cljs.core.Subvec(this__5521.meta, cljs.core._assoc_n.call(null, this__5521.v, this__5521.end, o), this__5521.start, this__5521.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5522 = this;
  var this$__5523 = this;
  return cljs.core.pr_str.call(null, this$__5523)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5524 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5525 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5526 = this;
  var subvec_seq__5527 = function subvec_seq(i) {
    if(i === this__5526.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5526.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5527.call(null, this__5526.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5528 = this;
  return this__5528.end - this__5528.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5529 = this;
  return cljs.core._nth.call(null, this__5529.v, this__5529.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5530 = this;
  if(this__5530.start === this__5530.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5530.meta, this__5530.v, this__5530.start, this__5530.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5531 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5532 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5533 = this;
  return new cljs.core.Subvec(meta, this__5533.v, this__5533.start, this__5533.end, this__5533.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5534 = this;
  return this__5534.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5536 = this;
  return cljs.core._nth.call(null, this__5536.v, this__5536.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5537 = this;
  return cljs.core._nth.call(null, this__5537.v, this__5537.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5535 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5535.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5539 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5539, 0, tl.length);
  return ret__5539
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5540 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5541 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5540, subidx__5541, level === 5 ? tail_node : function() {
    var child__5542 = cljs.core.pv_aget.call(null, ret__5540, subidx__5541);
    if(child__5542 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5542, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5540
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5543 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5544 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5545 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5543, subidx__5544));
    if(function() {
      var and__3822__auto____5546 = new_child__5545 == null;
      if(and__3822__auto____5546) {
        return subidx__5544 === 0
      }else {
        return and__3822__auto____5546
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5543, subidx__5544, new_child__5545);
      return node__5543
    }
  }else {
    if(subidx__5544 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5543, subidx__5544, null);
        return node__5543
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____5547 = 0 <= i;
    if(and__3822__auto____5547) {
      return i < tv.cnt
    }else {
      return and__3822__auto____5547
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5548 = tv.root;
      var node__5549 = root__5548;
      var level__5550 = tv.shift;
      while(true) {
        if(level__5550 > 0) {
          var G__5551 = cljs.core.tv_ensure_editable.call(null, root__5548.edit, cljs.core.pv_aget.call(null, node__5549, i >>> level__5550 & 31));
          var G__5552 = level__5550 - 5;
          node__5549 = G__5551;
          level__5550 = G__5552;
          continue
        }else {
          return node__5549.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5590 = null;
  var G__5590__2 = function(tsym5555, k) {
    var this__5557 = this;
    var tsym5555__5558 = this;
    var coll__5559 = tsym5555__5558;
    return cljs.core._lookup.call(null, coll__5559, k)
  };
  var G__5590__3 = function(tsym5556, k, not_found) {
    var this__5560 = this;
    var tsym5556__5561 = this;
    var coll__5562 = tsym5556__5561;
    return cljs.core._lookup.call(null, coll__5562, k, not_found)
  };
  G__5590 = function(tsym5556, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5590__2.call(this, tsym5556, k);
      case 3:
        return G__5590__3.call(this, tsym5556, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5590
}();
cljs.core.TransientVector.prototype.apply = function(tsym5553, args5554) {
  return tsym5553.call.apply(tsym5553, [tsym5553].concat(cljs.core.aclone.call(null, args5554)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5563 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5564 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5565 = this;
  if(cljs.core.truth_(this__5565.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5566 = this;
  if(function() {
    var and__3822__auto____5567 = 0 <= n;
    if(and__3822__auto____5567) {
      return n < this__5566.cnt
    }else {
      return and__3822__auto____5567
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5568 = this;
  if(cljs.core.truth_(this__5568.root.edit)) {
    return this__5568.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5569 = this;
  if(cljs.core.truth_(this__5569.root.edit)) {
    if(function() {
      var and__3822__auto____5570 = 0 <= n;
      if(and__3822__auto____5570) {
        return n < this__5569.cnt
      }else {
        return and__3822__auto____5570
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5569.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5573 = function go(level, node) {
          var node__5571 = cljs.core.tv_ensure_editable.call(null, this__5569.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5571, n & 31, val);
            return node__5571
          }else {
            var subidx__5572 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5571, subidx__5572, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5571, subidx__5572)));
            return node__5571
          }
        }.call(null, this__5569.shift, this__5569.root);
        this__5569.root = new_root__5573;
        return tcoll
      }
    }else {
      if(n === this__5569.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5569.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5574 = this;
  if(cljs.core.truth_(this__5574.root.edit)) {
    if(this__5574.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5574.cnt) {
        this__5574.cnt = 0;
        return tcoll
      }else {
        if((this__5574.cnt - 1 & 31) > 0) {
          this__5574.cnt = this__5574.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5575 = cljs.core.editable_array_for.call(null, tcoll, this__5574.cnt - 2);
            var new_root__5577 = function() {
              var nr__5576 = cljs.core.tv_pop_tail.call(null, tcoll, this__5574.shift, this__5574.root);
              if(nr__5576 != null) {
                return nr__5576
              }else {
                return new cljs.core.VectorNode(this__5574.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____5578 = 5 < this__5574.shift;
              if(and__3822__auto____5578) {
                return cljs.core.pv_aget.call(null, new_root__5577, 1) == null
              }else {
                return and__3822__auto____5578
              }
            }()) {
              var new_root__5579 = cljs.core.tv_ensure_editable.call(null, this__5574.root.edit, cljs.core.pv_aget.call(null, new_root__5577, 0));
              this__5574.root = new_root__5579;
              this__5574.shift = this__5574.shift - 5;
              this__5574.cnt = this__5574.cnt - 1;
              this__5574.tail = new_tail__5575;
              return tcoll
            }else {
              this__5574.root = new_root__5577;
              this__5574.cnt = this__5574.cnt - 1;
              this__5574.tail = new_tail__5575;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5580 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5581 = this;
  if(cljs.core.truth_(this__5581.root.edit)) {
    if(this__5581.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5581.tail[this__5581.cnt & 31] = o;
      this__5581.cnt = this__5581.cnt + 1;
      return tcoll
    }else {
      var tail_node__5582 = new cljs.core.VectorNode(this__5581.root.edit, this__5581.tail);
      var new_tail__5583 = cljs.core.make_array.call(null, 32);
      new_tail__5583[0] = o;
      this__5581.tail = new_tail__5583;
      if(this__5581.cnt >>> 5 > 1 << this__5581.shift) {
        var new_root_array__5584 = cljs.core.make_array.call(null, 32);
        var new_shift__5585 = this__5581.shift + 5;
        new_root_array__5584[0] = this__5581.root;
        new_root_array__5584[1] = cljs.core.new_path.call(null, this__5581.root.edit, this__5581.shift, tail_node__5582);
        this__5581.root = new cljs.core.VectorNode(this__5581.root.edit, new_root_array__5584);
        this__5581.shift = new_shift__5585;
        this__5581.cnt = this__5581.cnt + 1;
        return tcoll
      }else {
        var new_root__5586 = cljs.core.tv_push_tail.call(null, tcoll, this__5581.shift, this__5581.root, tail_node__5582);
        this__5581.root = new_root__5586;
        this__5581.cnt = this__5581.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5587 = this;
  if(cljs.core.truth_(this__5587.root.edit)) {
    this__5587.root.edit = null;
    var len__5588 = this__5587.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5589 = cljs.core.make_array.call(null, len__5588);
    cljs.core.array_copy.call(null, this__5587.tail, 0, trimmed_tail__5589, 0, len__5588);
    return new cljs.core.PersistentVector(null, this__5587.cnt, this__5587.shift, this__5587.root, trimmed_tail__5589, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5591 = this;
  var h__364__auto____5592 = this__5591.__hash;
  if(h__364__auto____5592 != null) {
    return h__364__auto____5592
  }else {
    var h__364__auto____5593 = cljs.core.hash_coll.call(null, coll);
    this__5591.__hash = h__364__auto____5593;
    return h__364__auto____5593
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5594 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5595 = this;
  var this$__5596 = this;
  return cljs.core.pr_str.call(null, this$__5596)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5597 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5598 = this;
  return cljs.core._first.call(null, this__5598.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5599 = this;
  var temp__3971__auto____5600 = cljs.core.next.call(null, this__5599.front);
  if(cljs.core.truth_(temp__3971__auto____5600)) {
    var f1__5601 = temp__3971__auto____5600;
    return new cljs.core.PersistentQueueSeq(this__5599.meta, f1__5601, this__5599.rear, null)
  }else {
    if(this__5599.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5599.meta, this__5599.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5602 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5603 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5603.front, this__5603.rear, this__5603.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5604 = this;
  return this__5604.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5605 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5605.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5606 = this;
  var h__364__auto____5607 = this__5606.__hash;
  if(h__364__auto____5607 != null) {
    return h__364__auto____5607
  }else {
    var h__364__auto____5608 = cljs.core.hash_coll.call(null, coll);
    this__5606.__hash = h__364__auto____5608;
    return h__364__auto____5608
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5609 = this;
  if(cljs.core.truth_(this__5609.front)) {
    return new cljs.core.PersistentQueue(this__5609.meta, this__5609.count + 1, this__5609.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____5610 = this__5609.rear;
      if(cljs.core.truth_(or__3824__auto____5610)) {
        return or__3824__auto____5610
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5609.meta, this__5609.count + 1, cljs.core.conj.call(null, this__5609.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5611 = this;
  var this$__5612 = this;
  return cljs.core.pr_str.call(null, this$__5612)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5613 = this;
  var rear__5614 = cljs.core.seq.call(null, this__5613.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____5615 = this__5613.front;
    if(cljs.core.truth_(or__3824__auto____5615)) {
      return or__3824__auto____5615
    }else {
      return rear__5614
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5613.front, cljs.core.seq.call(null, rear__5614), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5616 = this;
  return this__5616.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5617 = this;
  return cljs.core._first.call(null, this__5617.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5618 = this;
  if(cljs.core.truth_(this__5618.front)) {
    var temp__3971__auto____5619 = cljs.core.next.call(null, this__5618.front);
    if(cljs.core.truth_(temp__3971__auto____5619)) {
      var f1__5620 = temp__3971__auto____5619;
      return new cljs.core.PersistentQueue(this__5618.meta, this__5618.count - 1, f1__5620, this__5618.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5618.meta, this__5618.count - 1, cljs.core.seq.call(null, this__5618.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5621 = this;
  return cljs.core.first.call(null, this__5621.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5622 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5623 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5624 = this;
  return new cljs.core.PersistentQueue(meta, this__5624.count, this__5624.front, this__5624.rear, this__5624.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5625 = this;
  return this__5625.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5626 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5627 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5628 = array.length;
  var i__5629 = 0;
  while(true) {
    if(i__5629 < len__5628) {
      if(cljs.core._EQ_.call(null, k, array[i__5629])) {
        return i__5629
      }else {
        var G__5630 = i__5629 + incr;
        i__5629 = G__5630;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____5631 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____5631)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____5631
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5632 = cljs.core.hash.call(null, a);
  var b__5633 = cljs.core.hash.call(null, b);
  if(a__5632 < b__5633) {
    return-1
  }else {
    if(a__5632 > b__5633) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5635 = m.keys;
  var len__5636 = ks__5635.length;
  var so__5637 = m.strobj;
  var out__5638 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5639 = 0;
  var out__5640 = cljs.core.transient$.call(null, out__5638);
  while(true) {
    if(i__5639 < len__5636) {
      var k__5641 = ks__5635[i__5639];
      var G__5642 = i__5639 + 1;
      var G__5643 = cljs.core.assoc_BANG_.call(null, out__5640, k__5641, so__5637[k__5641]);
      i__5639 = G__5642;
      out__5640 = G__5643;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5640, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5648 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5649 = this;
  var h__364__auto____5650 = this__5649.__hash;
  if(h__364__auto____5650 != null) {
    return h__364__auto____5650
  }else {
    var h__364__auto____5651 = cljs.core.hash_imap.call(null, coll);
    this__5649.__hash = h__364__auto____5651;
    return h__364__auto____5651
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5652 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5653 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5653.strobj, this__5653.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5654 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5655 = this__5654.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5655)) {
      var new_strobj__5656 = goog.object.clone.call(null, this__5654.strobj);
      new_strobj__5656[k] = v;
      return new cljs.core.ObjMap(this__5654.meta, this__5654.keys, new_strobj__5656, this__5654.update_count + 1, null)
    }else {
      if(this__5654.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5657 = goog.object.clone.call(null, this__5654.strobj);
        var new_keys__5658 = cljs.core.aclone.call(null, this__5654.keys);
        new_strobj__5657[k] = v;
        new_keys__5658.push(k);
        return new cljs.core.ObjMap(this__5654.meta, new_keys__5658, new_strobj__5657, this__5654.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5659 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5659.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5679 = null;
  var G__5679__2 = function(tsym5646, k) {
    var this__5660 = this;
    var tsym5646__5661 = this;
    var coll__5662 = tsym5646__5661;
    return cljs.core._lookup.call(null, coll__5662, k)
  };
  var G__5679__3 = function(tsym5647, k, not_found) {
    var this__5663 = this;
    var tsym5647__5664 = this;
    var coll__5665 = tsym5647__5664;
    return cljs.core._lookup.call(null, coll__5665, k, not_found)
  };
  G__5679 = function(tsym5647, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5679__2.call(this, tsym5647, k);
      case 3:
        return G__5679__3.call(this, tsym5647, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5679
}();
cljs.core.ObjMap.prototype.apply = function(tsym5644, args5645) {
  return tsym5644.call.apply(tsym5644, [tsym5644].concat(cljs.core.aclone.call(null, args5645)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5666 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5667 = this;
  var this$__5668 = this;
  return cljs.core.pr_str.call(null, this$__5668)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5669 = this;
  if(this__5669.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5634_SHARP_) {
      return cljs.core.vector.call(null, p1__5634_SHARP_, this__5669.strobj[p1__5634_SHARP_])
    }, this__5669.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5670 = this;
  return this__5670.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5671 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5672 = this;
  return new cljs.core.ObjMap(meta, this__5672.keys, this__5672.strobj, this__5672.update_count, this__5672.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5673 = this;
  return this__5673.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5674 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5674.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5675 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____5676 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____5676)) {
      return this__5675.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____5676
    }
  }())) {
    var new_keys__5677 = cljs.core.aclone.call(null, this__5675.keys);
    var new_strobj__5678 = goog.object.clone.call(null, this__5675.strobj);
    new_keys__5677.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5677), 1);
    cljs.core.js_delete.call(null, new_strobj__5678, k);
    return new cljs.core.ObjMap(this__5675.meta, new_keys__5677, new_strobj__5678, this__5675.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5685 = this;
  var h__364__auto____5686 = this__5685.__hash;
  if(h__364__auto____5686 != null) {
    return h__364__auto____5686
  }else {
    var h__364__auto____5687 = cljs.core.hash_imap.call(null, coll);
    this__5685.__hash = h__364__auto____5687;
    return h__364__auto____5687
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5688 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5689 = this;
  var bucket__5690 = this__5689.hashobj[cljs.core.hash.call(null, k)];
  var i__5691 = cljs.core.truth_(bucket__5690) ? cljs.core.scan_array.call(null, 2, k, bucket__5690) : null;
  if(cljs.core.truth_(i__5691)) {
    return bucket__5690[i__5691 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5692 = this;
  var h__5693 = cljs.core.hash.call(null, k);
  var bucket__5694 = this__5692.hashobj[h__5693];
  if(cljs.core.truth_(bucket__5694)) {
    var new_bucket__5695 = cljs.core.aclone.call(null, bucket__5694);
    var new_hashobj__5696 = goog.object.clone.call(null, this__5692.hashobj);
    new_hashobj__5696[h__5693] = new_bucket__5695;
    var temp__3971__auto____5697 = cljs.core.scan_array.call(null, 2, k, new_bucket__5695);
    if(cljs.core.truth_(temp__3971__auto____5697)) {
      var i__5698 = temp__3971__auto____5697;
      new_bucket__5695[i__5698 + 1] = v;
      return new cljs.core.HashMap(this__5692.meta, this__5692.count, new_hashobj__5696, null)
    }else {
      new_bucket__5695.push(k, v);
      return new cljs.core.HashMap(this__5692.meta, this__5692.count + 1, new_hashobj__5696, null)
    }
  }else {
    var new_hashobj__5699 = goog.object.clone.call(null, this__5692.hashobj);
    new_hashobj__5699[h__5693] = [k, v];
    return new cljs.core.HashMap(this__5692.meta, this__5692.count + 1, new_hashobj__5699, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5700 = this;
  var bucket__5701 = this__5700.hashobj[cljs.core.hash.call(null, k)];
  var i__5702 = cljs.core.truth_(bucket__5701) ? cljs.core.scan_array.call(null, 2, k, bucket__5701) : null;
  if(cljs.core.truth_(i__5702)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5725 = null;
  var G__5725__2 = function(tsym5683, k) {
    var this__5703 = this;
    var tsym5683__5704 = this;
    var coll__5705 = tsym5683__5704;
    return cljs.core._lookup.call(null, coll__5705, k)
  };
  var G__5725__3 = function(tsym5684, k, not_found) {
    var this__5706 = this;
    var tsym5684__5707 = this;
    var coll__5708 = tsym5684__5707;
    return cljs.core._lookup.call(null, coll__5708, k, not_found)
  };
  G__5725 = function(tsym5684, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5725__2.call(this, tsym5684, k);
      case 3:
        return G__5725__3.call(this, tsym5684, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5725
}();
cljs.core.HashMap.prototype.apply = function(tsym5681, args5682) {
  return tsym5681.call.apply(tsym5681, [tsym5681].concat(cljs.core.aclone.call(null, args5682)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5709 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5710 = this;
  var this$__5711 = this;
  return cljs.core.pr_str.call(null, this$__5711)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5712 = this;
  if(this__5712.count > 0) {
    var hashes__5713 = cljs.core.js_keys.call(null, this__5712.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5680_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5712.hashobj[p1__5680_SHARP_]))
    }, hashes__5713)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5714 = this;
  return this__5714.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5715 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5716 = this;
  return new cljs.core.HashMap(meta, this__5716.count, this__5716.hashobj, this__5716.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5717 = this;
  return this__5717.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5718 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5718.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5719 = this;
  var h__5720 = cljs.core.hash.call(null, k);
  var bucket__5721 = this__5719.hashobj[h__5720];
  var i__5722 = cljs.core.truth_(bucket__5721) ? cljs.core.scan_array.call(null, 2, k, bucket__5721) : null;
  if(cljs.core.not.call(null, i__5722)) {
    return coll
  }else {
    var new_hashobj__5723 = goog.object.clone.call(null, this__5719.hashobj);
    if(3 > bucket__5721.length) {
      cljs.core.js_delete.call(null, new_hashobj__5723, h__5720)
    }else {
      var new_bucket__5724 = cljs.core.aclone.call(null, bucket__5721);
      new_bucket__5724.splice(i__5722, 2);
      new_hashobj__5723[h__5720] = new_bucket__5724
    }
    return new cljs.core.HashMap(this__5719.meta, this__5719.count - 1, new_hashobj__5723, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5726 = ks.length;
  var i__5727 = 0;
  var out__5728 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5727 < len__5726) {
      var G__5729 = i__5727 + 1;
      var G__5730 = cljs.core.assoc.call(null, out__5728, ks[i__5727], vs[i__5727]);
      i__5727 = G__5729;
      out__5728 = G__5730;
      continue
    }else {
      return out__5728
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5731 = m.arr;
  var len__5732 = arr__5731.length;
  var i__5733 = 0;
  while(true) {
    if(len__5732 <= i__5733) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5731[i__5733], k)) {
        return i__5733
      }else {
        if("\ufdd0'else") {
          var G__5734 = i__5733 + 2;
          i__5733 = G__5734;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5739 = this;
  return new cljs.core.TransientArrayMap({}, this__5739.arr.length, cljs.core.aclone.call(null, this__5739.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5740 = this;
  var h__364__auto____5741 = this__5740.__hash;
  if(h__364__auto____5741 != null) {
    return h__364__auto____5741
  }else {
    var h__364__auto____5742 = cljs.core.hash_imap.call(null, coll);
    this__5740.__hash = h__364__auto____5742;
    return h__364__auto____5742
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5743 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5744 = this;
  var idx__5745 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5745 === -1) {
    return not_found
  }else {
    return this__5744.arr[idx__5745 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5746 = this;
  var idx__5747 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5747 === -1) {
    if(this__5746.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5746.meta, this__5746.cnt + 1, function() {
        var G__5748__5749 = cljs.core.aclone.call(null, this__5746.arr);
        G__5748__5749.push(k);
        G__5748__5749.push(v);
        return G__5748__5749
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5746.arr[idx__5747 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5746.meta, this__5746.cnt, function() {
          var G__5750__5751 = cljs.core.aclone.call(null, this__5746.arr);
          G__5750__5751[idx__5747 + 1] = v;
          return G__5750__5751
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5752 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5782 = null;
  var G__5782__2 = function(tsym5737, k) {
    var this__5753 = this;
    var tsym5737__5754 = this;
    var coll__5755 = tsym5737__5754;
    return cljs.core._lookup.call(null, coll__5755, k)
  };
  var G__5782__3 = function(tsym5738, k, not_found) {
    var this__5756 = this;
    var tsym5738__5757 = this;
    var coll__5758 = tsym5738__5757;
    return cljs.core._lookup.call(null, coll__5758, k, not_found)
  };
  G__5782 = function(tsym5738, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5782__2.call(this, tsym5738, k);
      case 3:
        return G__5782__3.call(this, tsym5738, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5782
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5735, args5736) {
  return tsym5735.call.apply(tsym5735, [tsym5735].concat(cljs.core.aclone.call(null, args5736)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5759 = this;
  var len__5760 = this__5759.arr.length;
  var i__5761 = 0;
  var init__5762 = init;
  while(true) {
    if(i__5761 < len__5760) {
      var init__5763 = f.call(null, init__5762, this__5759.arr[i__5761], this__5759.arr[i__5761 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5763)) {
        return cljs.core.deref.call(null, init__5763)
      }else {
        var G__5783 = i__5761 + 2;
        var G__5784 = init__5763;
        i__5761 = G__5783;
        init__5762 = G__5784;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5764 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5765 = this;
  var this$__5766 = this;
  return cljs.core.pr_str.call(null, this$__5766)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5767 = this;
  if(this__5767.cnt > 0) {
    var len__5768 = this__5767.arr.length;
    var array_map_seq__5769 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5768) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5767.arr[i], this__5767.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5769.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5770 = this;
  return this__5770.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5771 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5772 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5772.cnt, this__5772.arr, this__5772.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5773 = this;
  return this__5773.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5774 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5774.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5775 = this;
  var idx__5776 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5776 >= 0) {
    var len__5777 = this__5775.arr.length;
    var new_len__5778 = len__5777 - 2;
    if(new_len__5778 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5779 = cljs.core.make_array.call(null, new_len__5778);
      var s__5780 = 0;
      var d__5781 = 0;
      while(true) {
        if(s__5780 >= len__5777) {
          return new cljs.core.PersistentArrayMap(this__5775.meta, this__5775.cnt - 1, new_arr__5779, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5775.arr[s__5780])) {
            var G__5785 = s__5780 + 2;
            var G__5786 = d__5781;
            s__5780 = G__5785;
            d__5781 = G__5786;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5779[d__5781] = this__5775.arr[s__5780];
              new_arr__5779[d__5781 + 1] = this__5775.arr[s__5780 + 1];
              var G__5787 = s__5780 + 2;
              var G__5788 = d__5781 + 2;
              s__5780 = G__5787;
              d__5781 = G__5788;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5789 = cljs.core.count.call(null, ks);
  var i__5790 = 0;
  var out__5791 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5790 < len__5789) {
      var G__5792 = i__5790 + 1;
      var G__5793 = cljs.core.assoc_BANG_.call(null, out__5791, ks[i__5790], vs[i__5790]);
      i__5790 = G__5792;
      out__5791 = G__5793;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5791)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5794 = this;
  if(cljs.core.truth_(this__5794.editable_QMARK_)) {
    var idx__5795 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5795 >= 0) {
      this__5794.arr[idx__5795] = this__5794.arr[this__5794.len - 2];
      this__5794.arr[idx__5795 + 1] = this__5794.arr[this__5794.len - 1];
      var G__5796__5797 = this__5794.arr;
      G__5796__5797.pop();
      G__5796__5797.pop();
      G__5796__5797;
      this__5794.len = this__5794.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5798 = this;
  if(cljs.core.truth_(this__5798.editable_QMARK_)) {
    var idx__5799 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5799 === -1) {
      if(this__5798.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5798.len = this__5798.len + 2;
        this__5798.arr.push(key);
        this__5798.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5798.len, this__5798.arr), key, val)
      }
    }else {
      if(val === this__5798.arr[idx__5799 + 1]) {
        return tcoll
      }else {
        this__5798.arr[idx__5799 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5800 = this;
  if(cljs.core.truth_(this__5800.editable_QMARK_)) {
    if(function() {
      var G__5801__5802 = o;
      if(G__5801__5802 != null) {
        if(function() {
          var or__3824__auto____5803 = G__5801__5802.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____5803) {
            return or__3824__auto____5803
          }else {
            return G__5801__5802.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5801__5802.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5801__5802)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5801__5802)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5804 = cljs.core.seq.call(null, o);
      var tcoll__5805 = tcoll;
      while(true) {
        var temp__3971__auto____5806 = cljs.core.first.call(null, es__5804);
        if(cljs.core.truth_(temp__3971__auto____5806)) {
          var e__5807 = temp__3971__auto____5806;
          var G__5813 = cljs.core.next.call(null, es__5804);
          var G__5814 = cljs.core._assoc_BANG_.call(null, tcoll__5805, cljs.core.key.call(null, e__5807), cljs.core.val.call(null, e__5807));
          es__5804 = G__5813;
          tcoll__5805 = G__5814;
          continue
        }else {
          return tcoll__5805
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5808 = this;
  if(cljs.core.truth_(this__5808.editable_QMARK_)) {
    this__5808.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5808.len, 2), this__5808.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5809 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5810 = this;
  if(cljs.core.truth_(this__5810.editable_QMARK_)) {
    var idx__5811 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5811 === -1) {
      return not_found
    }else {
      return this__5810.arr[idx__5811 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5812 = this;
  if(cljs.core.truth_(this__5812.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5812.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5815 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5816 = 0;
  while(true) {
    if(i__5816 < len) {
      var G__5817 = cljs.core.assoc_BANG_.call(null, out__5815, arr[i__5816], arr[i__5816 + 1]);
      var G__5818 = i__5816 + 2;
      out__5815 = G__5817;
      i__5816 = G__5818;
      continue
    }else {
      return out__5815
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5819__5820 = cljs.core.aclone.call(null, arr);
    G__5819__5820[i] = a;
    return G__5819__5820
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5821__5822 = cljs.core.aclone.call(null, arr);
    G__5821__5822[i] = a;
    G__5821__5822[j] = b;
    return G__5821__5822
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5823 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5823, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5823, 2 * i, new_arr__5823.length - 2 * i);
  return new_arr__5823
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5824 = inode.ensure_editable(edit);
    editable__5824.arr[i] = a;
    return editable__5824
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5825 = inode.ensure_editable(edit);
    editable__5825.arr[i] = a;
    editable__5825.arr[j] = b;
    return editable__5825
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5826 = arr.length;
  var i__5827 = 0;
  var init__5828 = init;
  while(true) {
    if(i__5827 < len__5826) {
      var init__5831 = function() {
        var k__5829 = arr[i__5827];
        if(k__5829 != null) {
          return f.call(null, init__5828, k__5829, arr[i__5827 + 1])
        }else {
          var node__5830 = arr[i__5827 + 1];
          if(node__5830 != null) {
            return node__5830.kv_reduce(f, init__5828)
          }else {
            return init__5828
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5831)) {
        return cljs.core.deref.call(null, init__5831)
      }else {
        var G__5832 = i__5827 + 2;
        var G__5833 = init__5831;
        i__5827 = G__5832;
        init__5828 = G__5833;
        continue
      }
    }else {
      return init__5828
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5834 = this;
  var inode__5835 = this;
  if(this__5834.bitmap === bit) {
    return null
  }else {
    var editable__5836 = inode__5835.ensure_editable(e);
    var earr__5837 = editable__5836.arr;
    var len__5838 = earr__5837.length;
    editable__5836.bitmap = bit ^ editable__5836.bitmap;
    cljs.core.array_copy.call(null, earr__5837, 2 * (i + 1), earr__5837, 2 * i, len__5838 - 2 * (i + 1));
    earr__5837[len__5838 - 2] = null;
    earr__5837[len__5838 - 1] = null;
    return editable__5836
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5839 = this;
  var inode__5840 = this;
  var bit__5841 = 1 << (hash >>> shift & 31);
  var idx__5842 = cljs.core.bitmap_indexed_node_index.call(null, this__5839.bitmap, bit__5841);
  if((this__5839.bitmap & bit__5841) === 0) {
    var n__5843 = cljs.core.bit_count.call(null, this__5839.bitmap);
    if(2 * n__5843 < this__5839.arr.length) {
      var editable__5844 = inode__5840.ensure_editable(edit);
      var earr__5845 = editable__5844.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5845, 2 * idx__5842, earr__5845, 2 * (idx__5842 + 1), 2 * (n__5843 - idx__5842));
      earr__5845[2 * idx__5842] = key;
      earr__5845[2 * idx__5842 + 1] = val;
      editable__5844.bitmap = editable__5844.bitmap | bit__5841;
      return editable__5844
    }else {
      if(n__5843 >= 16) {
        var nodes__5846 = cljs.core.make_array.call(null, 32);
        var jdx__5847 = hash >>> shift & 31;
        nodes__5846[jdx__5847] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5848 = 0;
        var j__5849 = 0;
        while(true) {
          if(i__5848 < 32) {
            if((this__5839.bitmap >>> i__5848 & 1) === 0) {
              var G__5902 = i__5848 + 1;
              var G__5903 = j__5849;
              i__5848 = G__5902;
              j__5849 = G__5903;
              continue
            }else {
              nodes__5846[i__5848] = null != this__5839.arr[j__5849] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5839.arr[j__5849]), this__5839.arr[j__5849], this__5839.arr[j__5849 + 1], added_leaf_QMARK_) : this__5839.arr[j__5849 + 1];
              var G__5904 = i__5848 + 1;
              var G__5905 = j__5849 + 2;
              i__5848 = G__5904;
              j__5849 = G__5905;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5843 + 1, nodes__5846)
      }else {
        if("\ufdd0'else") {
          var new_arr__5850 = cljs.core.make_array.call(null, 2 * (n__5843 + 4));
          cljs.core.array_copy.call(null, this__5839.arr, 0, new_arr__5850, 0, 2 * idx__5842);
          new_arr__5850[2 * idx__5842] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5850[2 * idx__5842 + 1] = val;
          cljs.core.array_copy.call(null, this__5839.arr, 2 * idx__5842, new_arr__5850, 2 * (idx__5842 + 1), 2 * (n__5843 - idx__5842));
          var editable__5851 = inode__5840.ensure_editable(edit);
          editable__5851.arr = new_arr__5850;
          editable__5851.bitmap = editable__5851.bitmap | bit__5841;
          return editable__5851
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5852 = this__5839.arr[2 * idx__5842];
    var val_or_node__5853 = this__5839.arr[2 * idx__5842 + 1];
    if(null == key_or_nil__5852) {
      var n__5854 = val_or_node__5853.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5854 === val_or_node__5853) {
        return inode__5840
      }else {
        return cljs.core.edit_and_set.call(null, inode__5840, edit, 2 * idx__5842 + 1, n__5854)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5852)) {
        if(val === val_or_node__5853) {
          return inode__5840
        }else {
          return cljs.core.edit_and_set.call(null, inode__5840, edit, 2 * idx__5842 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5840, edit, 2 * idx__5842, null, 2 * idx__5842 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5852, val_or_node__5853, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5855 = this;
  var inode__5856 = this;
  return cljs.core.create_inode_seq.call(null, this__5855.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5857 = this;
  var inode__5858 = this;
  var bit__5859 = 1 << (hash >>> shift & 31);
  if((this__5857.bitmap & bit__5859) === 0) {
    return inode__5858
  }else {
    var idx__5860 = cljs.core.bitmap_indexed_node_index.call(null, this__5857.bitmap, bit__5859);
    var key_or_nil__5861 = this__5857.arr[2 * idx__5860];
    var val_or_node__5862 = this__5857.arr[2 * idx__5860 + 1];
    if(null == key_or_nil__5861) {
      var n__5863 = val_or_node__5862.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5863 === val_or_node__5862) {
        return inode__5858
      }else {
        if(null != n__5863) {
          return cljs.core.edit_and_set.call(null, inode__5858, edit, 2 * idx__5860 + 1, n__5863)
        }else {
          if(this__5857.bitmap === bit__5859) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5858.edit_and_remove_pair(edit, bit__5859, idx__5860)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5861)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5858.edit_and_remove_pair(edit, bit__5859, idx__5860)
      }else {
        if("\ufdd0'else") {
          return inode__5858
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5864 = this;
  var inode__5865 = this;
  if(e === this__5864.edit) {
    return inode__5865
  }else {
    var n__5866 = cljs.core.bit_count.call(null, this__5864.bitmap);
    var new_arr__5867 = cljs.core.make_array.call(null, n__5866 < 0 ? 4 : 2 * (n__5866 + 1));
    cljs.core.array_copy.call(null, this__5864.arr, 0, new_arr__5867, 0, 2 * n__5866);
    return new cljs.core.BitmapIndexedNode(e, this__5864.bitmap, new_arr__5867)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__5868 = this;
  var inode__5869 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5868.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__5906 = null;
  var G__5906__3 = function(shift, hash, key) {
    var this__5870 = this;
    var inode__5871 = this;
    var bit__5872 = 1 << (hash >>> shift & 31);
    if((this__5870.bitmap & bit__5872) === 0) {
      return null
    }else {
      var idx__5873 = cljs.core.bitmap_indexed_node_index.call(null, this__5870.bitmap, bit__5872);
      var key_or_nil__5874 = this__5870.arr[2 * idx__5873];
      var val_or_node__5875 = this__5870.arr[2 * idx__5873 + 1];
      if(null == key_or_nil__5874) {
        return val_or_node__5875.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5874)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5874, val_or_node__5875])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__5906__4 = function(shift, hash, key, not_found) {
    var this__5876 = this;
    var inode__5877 = this;
    var bit__5878 = 1 << (hash >>> shift & 31);
    if((this__5876.bitmap & bit__5878) === 0) {
      return not_found
    }else {
      var idx__5879 = cljs.core.bitmap_indexed_node_index.call(null, this__5876.bitmap, bit__5878);
      var key_or_nil__5880 = this__5876.arr[2 * idx__5879];
      var val_or_node__5881 = this__5876.arr[2 * idx__5879 + 1];
      if(null == key_or_nil__5880) {
        return val_or_node__5881.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5880)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5880, val_or_node__5881])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__5906 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5906__3.call(this, shift, hash, key);
      case 4:
        return G__5906__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5906
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__5882 = this;
  var inode__5883 = this;
  var bit__5884 = 1 << (hash >>> shift & 31);
  if((this__5882.bitmap & bit__5884) === 0) {
    return inode__5883
  }else {
    var idx__5885 = cljs.core.bitmap_indexed_node_index.call(null, this__5882.bitmap, bit__5884);
    var key_or_nil__5886 = this__5882.arr[2 * idx__5885];
    var val_or_node__5887 = this__5882.arr[2 * idx__5885 + 1];
    if(null == key_or_nil__5886) {
      var n__5888 = val_or_node__5887.inode_without(shift + 5, hash, key);
      if(n__5888 === val_or_node__5887) {
        return inode__5883
      }else {
        if(null != n__5888) {
          return new cljs.core.BitmapIndexedNode(null, this__5882.bitmap, cljs.core.clone_and_set.call(null, this__5882.arr, 2 * idx__5885 + 1, n__5888))
        }else {
          if(this__5882.bitmap === bit__5884) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__5882.bitmap ^ bit__5884, cljs.core.remove_pair.call(null, this__5882.arr, idx__5885))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5886)) {
        return new cljs.core.BitmapIndexedNode(null, this__5882.bitmap ^ bit__5884, cljs.core.remove_pair.call(null, this__5882.arr, idx__5885))
      }else {
        if("\ufdd0'else") {
          return inode__5883
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5889 = this;
  var inode__5890 = this;
  var bit__5891 = 1 << (hash >>> shift & 31);
  var idx__5892 = cljs.core.bitmap_indexed_node_index.call(null, this__5889.bitmap, bit__5891);
  if((this__5889.bitmap & bit__5891) === 0) {
    var n__5893 = cljs.core.bit_count.call(null, this__5889.bitmap);
    if(n__5893 >= 16) {
      var nodes__5894 = cljs.core.make_array.call(null, 32);
      var jdx__5895 = hash >>> shift & 31;
      nodes__5894[jdx__5895] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__5896 = 0;
      var j__5897 = 0;
      while(true) {
        if(i__5896 < 32) {
          if((this__5889.bitmap >>> i__5896 & 1) === 0) {
            var G__5907 = i__5896 + 1;
            var G__5908 = j__5897;
            i__5896 = G__5907;
            j__5897 = G__5908;
            continue
          }else {
            nodes__5894[i__5896] = null != this__5889.arr[j__5897] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__5889.arr[j__5897]), this__5889.arr[j__5897], this__5889.arr[j__5897 + 1], added_leaf_QMARK_) : this__5889.arr[j__5897 + 1];
            var G__5909 = i__5896 + 1;
            var G__5910 = j__5897 + 2;
            i__5896 = G__5909;
            j__5897 = G__5910;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__5893 + 1, nodes__5894)
    }else {
      var new_arr__5898 = cljs.core.make_array.call(null, 2 * (n__5893 + 1));
      cljs.core.array_copy.call(null, this__5889.arr, 0, new_arr__5898, 0, 2 * idx__5892);
      new_arr__5898[2 * idx__5892] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__5898[2 * idx__5892 + 1] = val;
      cljs.core.array_copy.call(null, this__5889.arr, 2 * idx__5892, new_arr__5898, 2 * (idx__5892 + 1), 2 * (n__5893 - idx__5892));
      return new cljs.core.BitmapIndexedNode(null, this__5889.bitmap | bit__5891, new_arr__5898)
    }
  }else {
    var key_or_nil__5899 = this__5889.arr[2 * idx__5892];
    var val_or_node__5900 = this__5889.arr[2 * idx__5892 + 1];
    if(null == key_or_nil__5899) {
      var n__5901 = val_or_node__5900.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5901 === val_or_node__5900) {
        return inode__5890
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__5889.bitmap, cljs.core.clone_and_set.call(null, this__5889.arr, 2 * idx__5892 + 1, n__5901))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5899)) {
        if(val === val_or_node__5900) {
          return inode__5890
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__5889.bitmap, cljs.core.clone_and_set.call(null, this__5889.arr, 2 * idx__5892 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__5889.bitmap, cljs.core.clone_and_set.call(null, this__5889.arr, 2 * idx__5892, null, 2 * idx__5892 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__5899, val_or_node__5900, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__5911 = array_node.arr;
  var len__5912 = 2 * (array_node.cnt - 1);
  var new_arr__5913 = cljs.core.make_array.call(null, len__5912);
  var i__5914 = 0;
  var j__5915 = 1;
  var bitmap__5916 = 0;
  while(true) {
    if(i__5914 < len__5912) {
      if(function() {
        var and__3822__auto____5917 = i__5914 != idx;
        if(and__3822__auto____5917) {
          return null != arr__5911[i__5914]
        }else {
          return and__3822__auto____5917
        }
      }()) {
        new_arr__5913[j__5915] = arr__5911[i__5914];
        var G__5918 = i__5914 + 1;
        var G__5919 = j__5915 + 2;
        var G__5920 = bitmap__5916 | 1 << i__5914;
        i__5914 = G__5918;
        j__5915 = G__5919;
        bitmap__5916 = G__5920;
        continue
      }else {
        var G__5921 = i__5914 + 1;
        var G__5922 = j__5915;
        var G__5923 = bitmap__5916;
        i__5914 = G__5921;
        j__5915 = G__5922;
        bitmap__5916 = G__5923;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__5916, new_arr__5913)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5924 = this;
  var inode__5925 = this;
  var idx__5926 = hash >>> shift & 31;
  var node__5927 = this__5924.arr[idx__5926];
  if(null == node__5927) {
    return new cljs.core.ArrayNode(null, this__5924.cnt + 1, cljs.core.clone_and_set.call(null, this__5924.arr, idx__5926, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__5928 = node__5927.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5928 === node__5927) {
      return inode__5925
    }else {
      return new cljs.core.ArrayNode(null, this__5924.cnt, cljs.core.clone_and_set.call(null, this__5924.arr, idx__5926, n__5928))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__5929 = this;
  var inode__5930 = this;
  var idx__5931 = hash >>> shift & 31;
  var node__5932 = this__5929.arr[idx__5931];
  if(null != node__5932) {
    var n__5933 = node__5932.inode_without(shift + 5, hash, key);
    if(n__5933 === node__5932) {
      return inode__5930
    }else {
      if(n__5933 == null) {
        if(this__5929.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5930, null, idx__5931)
        }else {
          return new cljs.core.ArrayNode(null, this__5929.cnt - 1, cljs.core.clone_and_set.call(null, this__5929.arr, idx__5931, n__5933))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__5929.cnt, cljs.core.clone_and_set.call(null, this__5929.arr, idx__5931, n__5933))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__5930
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__5965 = null;
  var G__5965__3 = function(shift, hash, key) {
    var this__5934 = this;
    var inode__5935 = this;
    var idx__5936 = hash >>> shift & 31;
    var node__5937 = this__5934.arr[idx__5936];
    if(null != node__5937) {
      return node__5937.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__5965__4 = function(shift, hash, key, not_found) {
    var this__5938 = this;
    var inode__5939 = this;
    var idx__5940 = hash >>> shift & 31;
    var node__5941 = this__5938.arr[idx__5940];
    if(null != node__5941) {
      return node__5941.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__5965 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5965__3.call(this, shift, hash, key);
      case 4:
        return G__5965__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5965
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__5942 = this;
  var inode__5943 = this;
  return cljs.core.create_array_node_seq.call(null, this__5942.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__5944 = this;
  var inode__5945 = this;
  if(e === this__5944.edit) {
    return inode__5945
  }else {
    return new cljs.core.ArrayNode(e, this__5944.cnt, cljs.core.aclone.call(null, this__5944.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5946 = this;
  var inode__5947 = this;
  var idx__5948 = hash >>> shift & 31;
  var node__5949 = this__5946.arr[idx__5948];
  if(null == node__5949) {
    var editable__5950 = cljs.core.edit_and_set.call(null, inode__5947, edit, idx__5948, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__5950.cnt = editable__5950.cnt + 1;
    return editable__5950
  }else {
    var n__5951 = node__5949.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__5951 === node__5949) {
      return inode__5947
    }else {
      return cljs.core.edit_and_set.call(null, inode__5947, edit, idx__5948, n__5951)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5952 = this;
  var inode__5953 = this;
  var idx__5954 = hash >>> shift & 31;
  var node__5955 = this__5952.arr[idx__5954];
  if(null == node__5955) {
    return inode__5953
  }else {
    var n__5956 = node__5955.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__5956 === node__5955) {
      return inode__5953
    }else {
      if(null == n__5956) {
        if(this__5952.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__5953, edit, idx__5954)
        }else {
          var editable__5957 = cljs.core.edit_and_set.call(null, inode__5953, edit, idx__5954, n__5956);
          editable__5957.cnt = editable__5957.cnt - 1;
          return editable__5957
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__5953, edit, idx__5954, n__5956)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__5958 = this;
  var inode__5959 = this;
  var len__5960 = this__5958.arr.length;
  var i__5961 = 0;
  var init__5962 = init;
  while(true) {
    if(i__5961 < len__5960) {
      var node__5963 = this__5958.arr[i__5961];
      if(node__5963 != null) {
        var init__5964 = node__5963.kv_reduce(f, init__5962);
        if(cljs.core.reduced_QMARK_.call(null, init__5964)) {
          return cljs.core.deref.call(null, init__5964)
        }else {
          var G__5966 = i__5961 + 1;
          var G__5967 = init__5964;
          i__5961 = G__5966;
          init__5962 = G__5967;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__5962
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__5968 = 2 * cnt;
  var i__5969 = 0;
  while(true) {
    if(i__5969 < lim__5968) {
      if(cljs.core._EQ_.call(null, key, arr[i__5969])) {
        return i__5969
      }else {
        var G__5970 = i__5969 + 2;
        i__5969 = G__5970;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5971 = this;
  var inode__5972 = this;
  if(hash === this__5971.collision_hash) {
    var idx__5973 = cljs.core.hash_collision_node_find_index.call(null, this__5971.arr, this__5971.cnt, key);
    if(idx__5973 === -1) {
      var len__5974 = this__5971.arr.length;
      var new_arr__5975 = cljs.core.make_array.call(null, len__5974 + 2);
      cljs.core.array_copy.call(null, this__5971.arr, 0, new_arr__5975, 0, len__5974);
      new_arr__5975[len__5974] = key;
      new_arr__5975[len__5974 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__5971.collision_hash, this__5971.cnt + 1, new_arr__5975)
    }else {
      if(cljs.core._EQ_.call(null, this__5971.arr[idx__5973], val)) {
        return inode__5972
      }else {
        return new cljs.core.HashCollisionNode(null, this__5971.collision_hash, this__5971.cnt, cljs.core.clone_and_set.call(null, this__5971.arr, idx__5973 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__5971.collision_hash >>> shift & 31), [null, inode__5972])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__5976 = this;
  var inode__5977 = this;
  var idx__5978 = cljs.core.hash_collision_node_find_index.call(null, this__5976.arr, this__5976.cnt, key);
  if(idx__5978 === -1) {
    return inode__5977
  }else {
    if(this__5976.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__5976.collision_hash, this__5976.cnt - 1, cljs.core.remove_pair.call(null, this__5976.arr, cljs.core.quot.call(null, idx__5978, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6005 = null;
  var G__6005__3 = function(shift, hash, key) {
    var this__5979 = this;
    var inode__5980 = this;
    var idx__5981 = cljs.core.hash_collision_node_find_index.call(null, this__5979.arr, this__5979.cnt, key);
    if(idx__5981 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__5979.arr[idx__5981])) {
        return cljs.core.PersistentVector.fromArray([this__5979.arr[idx__5981], this__5979.arr[idx__5981 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6005__4 = function(shift, hash, key, not_found) {
    var this__5982 = this;
    var inode__5983 = this;
    var idx__5984 = cljs.core.hash_collision_node_find_index.call(null, this__5982.arr, this__5982.cnt, key);
    if(idx__5984 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__5982.arr[idx__5984])) {
        return cljs.core.PersistentVector.fromArray([this__5982.arr[idx__5984], this__5982.arr[idx__5984 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6005 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6005__3.call(this, shift, hash, key);
      case 4:
        return G__6005__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6005
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__5985 = this;
  var inode__5986 = this;
  return cljs.core.create_inode_seq.call(null, this__5985.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6006 = null;
  var G__6006__1 = function(e) {
    var this__5987 = this;
    var inode__5988 = this;
    if(e === this__5987.edit) {
      return inode__5988
    }else {
      var new_arr__5989 = cljs.core.make_array.call(null, 2 * (this__5987.cnt + 1));
      cljs.core.array_copy.call(null, this__5987.arr, 0, new_arr__5989, 0, 2 * this__5987.cnt);
      return new cljs.core.HashCollisionNode(e, this__5987.collision_hash, this__5987.cnt, new_arr__5989)
    }
  };
  var G__6006__3 = function(e, count, array) {
    var this__5990 = this;
    var inode__5991 = this;
    if(e === this__5990.edit) {
      this__5990.arr = array;
      this__5990.cnt = count;
      return inode__5991
    }else {
      return new cljs.core.HashCollisionNode(this__5990.edit, this__5990.collision_hash, count, array)
    }
  };
  G__6006 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6006__1.call(this, e);
      case 3:
        return G__6006__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6006
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5992 = this;
  var inode__5993 = this;
  if(hash === this__5992.collision_hash) {
    var idx__5994 = cljs.core.hash_collision_node_find_index.call(null, this__5992.arr, this__5992.cnt, key);
    if(idx__5994 === -1) {
      if(this__5992.arr.length > 2 * this__5992.cnt) {
        var editable__5995 = cljs.core.edit_and_set.call(null, inode__5993, edit, 2 * this__5992.cnt, key, 2 * this__5992.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__5995.cnt = editable__5995.cnt + 1;
        return editable__5995
      }else {
        var len__5996 = this__5992.arr.length;
        var new_arr__5997 = cljs.core.make_array.call(null, len__5996 + 2);
        cljs.core.array_copy.call(null, this__5992.arr, 0, new_arr__5997, 0, len__5996);
        new_arr__5997[len__5996] = key;
        new_arr__5997[len__5996 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__5993.ensure_editable(edit, this__5992.cnt + 1, new_arr__5997)
      }
    }else {
      if(this__5992.arr[idx__5994 + 1] === val) {
        return inode__5993
      }else {
        return cljs.core.edit_and_set.call(null, inode__5993, edit, idx__5994 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__5992.collision_hash >>> shift & 31), [null, inode__5993, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5998 = this;
  var inode__5999 = this;
  var idx__6000 = cljs.core.hash_collision_node_find_index.call(null, this__5998.arr, this__5998.cnt, key);
  if(idx__6000 === -1) {
    return inode__5999
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__5998.cnt === 1) {
      return null
    }else {
      var editable__6001 = inode__5999.ensure_editable(edit);
      var earr__6002 = editable__6001.arr;
      earr__6002[idx__6000] = earr__6002[2 * this__5998.cnt - 2];
      earr__6002[idx__6000 + 1] = earr__6002[2 * this__5998.cnt - 1];
      earr__6002[2 * this__5998.cnt - 1] = null;
      earr__6002[2 * this__5998.cnt - 2] = null;
      editable__6001.cnt = editable__6001.cnt - 1;
      return editable__6001
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6003 = this;
  var inode__6004 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6003.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6007 = cljs.core.hash.call(null, key1);
    if(key1hash__6007 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6007, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6008 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6007, key1, val1, added_leaf_QMARK___6008).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6008)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6009 = cljs.core.hash.call(null, key1);
    if(key1hash__6009 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6009, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6010 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6009, key1, val1, added_leaf_QMARK___6010).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6010)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6011 = this;
  var h__364__auto____6012 = this__6011.__hash;
  if(h__364__auto____6012 != null) {
    return h__364__auto____6012
  }else {
    var h__364__auto____6013 = cljs.core.hash_coll.call(null, coll);
    this__6011.__hash = h__364__auto____6013;
    return h__364__auto____6013
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6014 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6015 = this;
  var this$__6016 = this;
  return cljs.core.pr_str.call(null, this$__6016)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6017 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6018 = this;
  if(this__6018.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6018.nodes[this__6018.i], this__6018.nodes[this__6018.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6018.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6019 = this;
  if(this__6019.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6019.nodes, this__6019.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6019.nodes, this__6019.i, cljs.core.next.call(null, this__6019.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6020 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6021 = this;
  return new cljs.core.NodeSeq(meta, this__6021.nodes, this__6021.i, this__6021.s, this__6021.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6022 = this;
  return this__6022.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6023 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6023.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6024 = nodes.length;
      var j__6025 = i;
      while(true) {
        if(j__6025 < len__6024) {
          if(null != nodes[j__6025]) {
            return new cljs.core.NodeSeq(null, nodes, j__6025, null, null)
          }else {
            var temp__3971__auto____6026 = nodes[j__6025 + 1];
            if(cljs.core.truth_(temp__3971__auto____6026)) {
              var node__6027 = temp__3971__auto____6026;
              var temp__3971__auto____6028 = node__6027.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____6028)) {
                var node_seq__6029 = temp__3971__auto____6028;
                return new cljs.core.NodeSeq(null, nodes, j__6025 + 2, node_seq__6029, null)
              }else {
                var G__6030 = j__6025 + 2;
                j__6025 = G__6030;
                continue
              }
            }else {
              var G__6031 = j__6025 + 2;
              j__6025 = G__6031;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6032 = this;
  var h__364__auto____6033 = this__6032.__hash;
  if(h__364__auto____6033 != null) {
    return h__364__auto____6033
  }else {
    var h__364__auto____6034 = cljs.core.hash_coll.call(null, coll);
    this__6032.__hash = h__364__auto____6034;
    return h__364__auto____6034
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6035 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6036 = this;
  var this$__6037 = this;
  return cljs.core.pr_str.call(null, this$__6037)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6038 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6039 = this;
  return cljs.core.first.call(null, this__6039.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6040 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6040.nodes, this__6040.i, cljs.core.next.call(null, this__6040.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6041 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6042 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6042.nodes, this__6042.i, this__6042.s, this__6042.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6043 = this;
  return this__6043.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6044 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6044.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6045 = nodes.length;
      var j__6046 = i;
      while(true) {
        if(j__6046 < len__6045) {
          var temp__3971__auto____6047 = nodes[j__6046];
          if(cljs.core.truth_(temp__3971__auto____6047)) {
            var nj__6048 = temp__3971__auto____6047;
            var temp__3971__auto____6049 = nj__6048.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____6049)) {
              var ns__6050 = temp__3971__auto____6049;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6046 + 1, ns__6050, null)
            }else {
              var G__6051 = j__6046 + 1;
              j__6046 = G__6051;
              continue
            }
          }else {
            var G__6052 = j__6046 + 1;
            j__6046 = G__6052;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6057 = this;
  return new cljs.core.TransientHashMap({}, this__6057.root, this__6057.cnt, this__6057.has_nil_QMARK_, this__6057.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6058 = this;
  var h__364__auto____6059 = this__6058.__hash;
  if(h__364__auto____6059 != null) {
    return h__364__auto____6059
  }else {
    var h__364__auto____6060 = cljs.core.hash_imap.call(null, coll);
    this__6058.__hash = h__364__auto____6060;
    return h__364__auto____6060
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6061 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6062 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6062.has_nil_QMARK_)) {
      return this__6062.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6062.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6062.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6063 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6064 = this__6063.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____6064)) {
        return v === this__6063.nil_val
      }else {
        return and__3822__auto____6064
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6063.meta, cljs.core.truth_(this__6063.has_nil_QMARK_) ? this__6063.cnt : this__6063.cnt + 1, this__6063.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6065 = [false];
    var new_root__6066 = (this__6063.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6063.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6065);
    if(new_root__6066 === this__6063.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6063.meta, cljs.core.truth_(added_leaf_QMARK___6065[0]) ? this__6063.cnt + 1 : this__6063.cnt, new_root__6066, this__6063.has_nil_QMARK_, this__6063.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6067 = this;
  if(k == null) {
    return this__6067.has_nil_QMARK_
  }else {
    if(this__6067.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6067.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6088 = null;
  var G__6088__2 = function(tsym6055, k) {
    var this__6068 = this;
    var tsym6055__6069 = this;
    var coll__6070 = tsym6055__6069;
    return cljs.core._lookup.call(null, coll__6070, k)
  };
  var G__6088__3 = function(tsym6056, k, not_found) {
    var this__6071 = this;
    var tsym6056__6072 = this;
    var coll__6073 = tsym6056__6072;
    return cljs.core._lookup.call(null, coll__6073, k, not_found)
  };
  G__6088 = function(tsym6056, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6088__2.call(this, tsym6056, k);
      case 3:
        return G__6088__3.call(this, tsym6056, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6088
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6053, args6054) {
  return tsym6053.call.apply(tsym6053, [tsym6053].concat(cljs.core.aclone.call(null, args6054)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6074 = this;
  var init__6075 = cljs.core.truth_(this__6074.has_nil_QMARK_) ? f.call(null, init, null, this__6074.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6075)) {
    return cljs.core.deref.call(null, init__6075)
  }else {
    if(null != this__6074.root) {
      return this__6074.root.kv_reduce(f, init__6075)
    }else {
      if("\ufdd0'else") {
        return init__6075
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6076 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6077 = this;
  var this$__6078 = this;
  return cljs.core.pr_str.call(null, this$__6078)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6079 = this;
  if(this__6079.cnt > 0) {
    var s__6080 = null != this__6079.root ? this__6079.root.inode_seq() : null;
    if(cljs.core.truth_(this__6079.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6079.nil_val]), s__6080)
    }else {
      return s__6080
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6081 = this;
  return this__6081.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6082 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6083 = this;
  return new cljs.core.PersistentHashMap(meta, this__6083.cnt, this__6083.root, this__6083.has_nil_QMARK_, this__6083.nil_val, this__6083.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6084 = this;
  return this__6084.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6085 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6085.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6086 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6086.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6086.meta, this__6086.cnt - 1, this__6086.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6086.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6087 = this__6086.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6087 === this__6086.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6086.meta, this__6086.cnt - 1, new_root__6087, this__6086.has_nil_QMARK_, this__6086.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__6089 = ks.length;
  var i__6090 = 0;
  var out__6091 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6090 < len__6089) {
      var G__6092 = i__6090 + 1;
      var G__6093 = cljs.core.assoc_BANG_.call(null, out__6091, ks[i__6090], vs[i__6090]);
      i__6090 = G__6092;
      out__6091 = G__6093;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6091)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6094 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6095 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6096 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6097 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6098 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6098.has_nil_QMARK_)) {
      return this__6098.nil_val
    }else {
      return null
    }
  }else {
    if(this__6098.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6098.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6099 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6099.has_nil_QMARK_)) {
      return this__6099.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6099.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6099.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6100 = this;
  if(cljs.core.truth_(this__6100.edit)) {
    return this__6100.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6101 = this;
  var tcoll__6102 = this;
  if(cljs.core.truth_(this__6101.edit)) {
    if(function() {
      var G__6103__6104 = o;
      if(G__6103__6104 != null) {
        if(function() {
          var or__3824__auto____6105 = G__6103__6104.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____6105) {
            return or__3824__auto____6105
          }else {
            return G__6103__6104.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6103__6104.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6103__6104)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6103__6104)
      }
    }()) {
      return tcoll__6102.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6106 = cljs.core.seq.call(null, o);
      var tcoll__6107 = tcoll__6102;
      while(true) {
        var temp__3971__auto____6108 = cljs.core.first.call(null, es__6106);
        if(cljs.core.truth_(temp__3971__auto____6108)) {
          var e__6109 = temp__3971__auto____6108;
          var G__6120 = cljs.core.next.call(null, es__6106);
          var G__6121 = tcoll__6107.assoc_BANG_(cljs.core.key.call(null, e__6109), cljs.core.val.call(null, e__6109));
          es__6106 = G__6120;
          tcoll__6107 = G__6121;
          continue
        }else {
          return tcoll__6107
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6110 = this;
  var tcoll__6111 = this;
  if(cljs.core.truth_(this__6110.edit)) {
    if(k == null) {
      if(this__6110.nil_val === v) {
      }else {
        this__6110.nil_val = v
      }
      if(cljs.core.truth_(this__6110.has_nil_QMARK_)) {
      }else {
        this__6110.count = this__6110.count + 1;
        this__6110.has_nil_QMARK_ = true
      }
      return tcoll__6111
    }else {
      var added_leaf_QMARK___6112 = [false];
      var node__6113 = (this__6110.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6110.root).inode_assoc_BANG_(this__6110.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6112);
      if(node__6113 === this__6110.root) {
      }else {
        this__6110.root = node__6113
      }
      if(cljs.core.truth_(added_leaf_QMARK___6112[0])) {
        this__6110.count = this__6110.count + 1
      }else {
      }
      return tcoll__6111
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6114 = this;
  var tcoll__6115 = this;
  if(cljs.core.truth_(this__6114.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6114.has_nil_QMARK_)) {
        this__6114.has_nil_QMARK_ = false;
        this__6114.nil_val = null;
        this__6114.count = this__6114.count - 1;
        return tcoll__6115
      }else {
        return tcoll__6115
      }
    }else {
      if(this__6114.root == null) {
        return tcoll__6115
      }else {
        var removed_leaf_QMARK___6116 = [false];
        var node__6117 = this__6114.root.inode_without_BANG_(this__6114.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6116);
        if(node__6117 === this__6114.root) {
        }else {
          this__6114.root = node__6117
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6116[0])) {
          this__6114.count = this__6114.count - 1
        }else {
        }
        return tcoll__6115
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6118 = this;
  var tcoll__6119 = this;
  if(cljs.core.truth_(this__6118.edit)) {
    this__6118.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6118.count, this__6118.root, this__6118.has_nil_QMARK_, this__6118.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6122 = node;
  var stack__6123 = stack;
  while(true) {
    if(t__6122 != null) {
      var G__6124 = cljs.core.truth_(ascending_QMARK_) ? t__6122.left : t__6122.right;
      var G__6125 = cljs.core.conj.call(null, stack__6123, t__6122);
      t__6122 = G__6124;
      stack__6123 = G__6125;
      continue
    }else {
      return stack__6123
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6126 = this;
  var h__364__auto____6127 = this__6126.__hash;
  if(h__364__auto____6127 != null) {
    return h__364__auto____6127
  }else {
    var h__364__auto____6128 = cljs.core.hash_coll.call(null, coll);
    this__6126.__hash = h__364__auto____6128;
    return h__364__auto____6128
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6129 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6130 = this;
  var this$__6131 = this;
  return cljs.core.pr_str.call(null, this$__6131)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6132 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6133 = this;
  if(this__6133.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6133.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6134 = this;
  return cljs.core.peek.call(null, this__6134.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6135 = this;
  var t__6136 = cljs.core.peek.call(null, this__6135.stack);
  var next_stack__6137 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6135.ascending_QMARK_) ? t__6136.right : t__6136.left, cljs.core.pop.call(null, this__6135.stack), this__6135.ascending_QMARK_);
  if(next_stack__6137 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6137, this__6135.ascending_QMARK_, this__6135.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6138 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6139 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6139.stack, this__6139.ascending_QMARK_, this__6139.cnt, this__6139.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6140 = this;
  return this__6140.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____6141 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____6141) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____6141
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____6142 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____6142) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____6142
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6143 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6143)) {
    return cljs.core.deref.call(null, init__6143)
  }else {
    var init__6144 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6143) : init__6143;
    if(cljs.core.reduced_QMARK_.call(null, init__6144)) {
      return cljs.core.deref.call(null, init__6144)
    }else {
      var init__6145 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6144) : init__6144;
      if(cljs.core.reduced_QMARK_.call(null, init__6145)) {
        return cljs.core.deref.call(null, init__6145)
      }else {
        return init__6145
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6150 = this;
  var h__364__auto____6151 = this__6150.__hash;
  if(h__364__auto____6151 != null) {
    return h__364__auto____6151
  }else {
    var h__364__auto____6152 = cljs.core.hash_coll.call(null, coll);
    this__6150.__hash = h__364__auto____6152;
    return h__364__auto____6152
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6153 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6154 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6155 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6155.key, this__6155.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6202 = null;
  var G__6202__2 = function(tsym6148, k) {
    var this__6156 = this;
    var tsym6148__6157 = this;
    var node__6158 = tsym6148__6157;
    return cljs.core._lookup.call(null, node__6158, k)
  };
  var G__6202__3 = function(tsym6149, k, not_found) {
    var this__6159 = this;
    var tsym6149__6160 = this;
    var node__6161 = tsym6149__6160;
    return cljs.core._lookup.call(null, node__6161, k, not_found)
  };
  G__6202 = function(tsym6149, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6202__2.call(this, tsym6149, k);
      case 3:
        return G__6202__3.call(this, tsym6149, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6202
}();
cljs.core.BlackNode.prototype.apply = function(tsym6146, args6147) {
  return tsym6146.call.apply(tsym6146, [tsym6146].concat(cljs.core.aclone.call(null, args6147)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6162 = this;
  return cljs.core.PersistentVector.fromArray([this__6162.key, this__6162.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6163 = this;
  return this__6163.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6164 = this;
  return this__6164.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6165 = this;
  var node__6166 = this;
  return ins.balance_right(node__6166)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6167 = this;
  var node__6168 = this;
  return new cljs.core.RedNode(this__6167.key, this__6167.val, this__6167.left, this__6167.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6169 = this;
  var node__6170 = this;
  return cljs.core.balance_right_del.call(null, this__6169.key, this__6169.val, this__6169.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6171 = this;
  var node__6172 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6173 = this;
  var node__6174 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6174, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6175 = this;
  var node__6176 = this;
  return cljs.core.balance_left_del.call(null, this__6175.key, this__6175.val, del, this__6175.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6177 = this;
  var node__6178 = this;
  return ins.balance_left(node__6178)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6179 = this;
  var node__6180 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6180, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6203 = null;
  var G__6203__0 = function() {
    var this__6183 = this;
    var this$__6184 = this;
    return cljs.core.pr_str.call(null, this$__6184)
  };
  G__6203 = function() {
    switch(arguments.length) {
      case 0:
        return G__6203__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6203
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6185 = this;
  var node__6186 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6186, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6187 = this;
  var node__6188 = this;
  return node__6188
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6189 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6190 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6191 = this;
  return cljs.core.list.call(null, this__6191.key, this__6191.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6193 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6194 = this;
  return this__6194.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6195 = this;
  return cljs.core.PersistentVector.fromArray([this__6195.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6196 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6196.key, this__6196.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6197 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6198 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6198.key, this__6198.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6199 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6200 = this;
  if(n === 0) {
    return this__6200.key
  }else {
    if(n === 1) {
      return this__6200.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6201 = this;
  if(n === 0) {
    return this__6201.key
  }else {
    if(n === 1) {
      return this__6201.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6192 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6208 = this;
  var h__364__auto____6209 = this__6208.__hash;
  if(h__364__auto____6209 != null) {
    return h__364__auto____6209
  }else {
    var h__364__auto____6210 = cljs.core.hash_coll.call(null, coll);
    this__6208.__hash = h__364__auto____6210;
    return h__364__auto____6210
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6211 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6212 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6213 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6213.key, this__6213.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6260 = null;
  var G__6260__2 = function(tsym6206, k) {
    var this__6214 = this;
    var tsym6206__6215 = this;
    var node__6216 = tsym6206__6215;
    return cljs.core._lookup.call(null, node__6216, k)
  };
  var G__6260__3 = function(tsym6207, k, not_found) {
    var this__6217 = this;
    var tsym6207__6218 = this;
    var node__6219 = tsym6207__6218;
    return cljs.core._lookup.call(null, node__6219, k, not_found)
  };
  G__6260 = function(tsym6207, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6260__2.call(this, tsym6207, k);
      case 3:
        return G__6260__3.call(this, tsym6207, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6260
}();
cljs.core.RedNode.prototype.apply = function(tsym6204, args6205) {
  return tsym6204.call.apply(tsym6204, [tsym6204].concat(cljs.core.aclone.call(null, args6205)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6220 = this;
  return cljs.core.PersistentVector.fromArray([this__6220.key, this__6220.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6221 = this;
  return this__6221.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6222 = this;
  return this__6222.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6223 = this;
  var node__6224 = this;
  return new cljs.core.RedNode(this__6223.key, this__6223.val, this__6223.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6225 = this;
  var node__6226 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6227 = this;
  var node__6228 = this;
  return new cljs.core.RedNode(this__6227.key, this__6227.val, this__6227.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6229 = this;
  var node__6230 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6231 = this;
  var node__6232 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6232, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6233 = this;
  var node__6234 = this;
  return new cljs.core.RedNode(this__6233.key, this__6233.val, del, this__6233.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6235 = this;
  var node__6236 = this;
  return new cljs.core.RedNode(this__6235.key, this__6235.val, ins, this__6235.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6237 = this;
  var node__6238 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6237.left)) {
    return new cljs.core.RedNode(this__6237.key, this__6237.val, this__6237.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6237.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6237.right)) {
      return new cljs.core.RedNode(this__6237.right.key, this__6237.right.val, new cljs.core.BlackNode(this__6237.key, this__6237.val, this__6237.left, this__6237.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6237.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6238, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6261 = null;
  var G__6261__0 = function() {
    var this__6241 = this;
    var this$__6242 = this;
    return cljs.core.pr_str.call(null, this$__6242)
  };
  G__6261 = function() {
    switch(arguments.length) {
      case 0:
        return G__6261__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6261
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6243 = this;
  var node__6244 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6243.right)) {
    return new cljs.core.RedNode(this__6243.key, this__6243.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6243.left, null), this__6243.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6243.left)) {
      return new cljs.core.RedNode(this__6243.left.key, this__6243.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6243.left.left, null), new cljs.core.BlackNode(this__6243.key, this__6243.val, this__6243.left.right, this__6243.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6244, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6245 = this;
  var node__6246 = this;
  return new cljs.core.BlackNode(this__6245.key, this__6245.val, this__6245.left, this__6245.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6247 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6248 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6249 = this;
  return cljs.core.list.call(null, this__6249.key, this__6249.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6251 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6252 = this;
  return this__6252.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6253 = this;
  return cljs.core.PersistentVector.fromArray([this__6253.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6254 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6254.key, this__6254.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6255 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6256 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6256.key, this__6256.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6257 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6258 = this;
  if(n === 0) {
    return this__6258.key
  }else {
    if(n === 1) {
      return this__6258.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6259 = this;
  if(n === 0) {
    return this__6259.key
  }else {
    if(n === 1) {
      return this__6259.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6250 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6262 = comp.call(null, k, tree.key);
    if(c__6262 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6262 < 0) {
        var ins__6263 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6263 != null) {
          return tree.add_left(ins__6263)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6264 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6264 != null) {
            return tree.add_right(ins__6264)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6265 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6265)) {
            return new cljs.core.RedNode(app__6265.key, app__6265.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6265.left), new cljs.core.RedNode(right.key, right.val, app__6265.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6265, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6266 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6266)) {
              return new cljs.core.RedNode(app__6266.key, app__6266.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6266.left, null), new cljs.core.BlackNode(right.key, right.val, app__6266.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6266, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6267 = comp.call(null, k, tree.key);
    if(c__6267 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6267 < 0) {
        var del__6268 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____6269 = del__6268 != null;
          if(or__3824__auto____6269) {
            return or__3824__auto____6269
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6268, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6268, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6270 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____6271 = del__6270 != null;
            if(or__3824__auto____6271) {
              return or__3824__auto____6271
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6270)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6270, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6272 = tree.key;
  var c__6273 = comp.call(null, k, tk__6272);
  if(c__6273 === 0) {
    return tree.replace(tk__6272, v, tree.left, tree.right)
  }else {
    if(c__6273 < 0) {
      return tree.replace(tk__6272, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6272, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6278 = this;
  var h__364__auto____6279 = this__6278.__hash;
  if(h__364__auto____6279 != null) {
    return h__364__auto____6279
  }else {
    var h__364__auto____6280 = cljs.core.hash_imap.call(null, coll);
    this__6278.__hash = h__364__auto____6280;
    return h__364__auto____6280
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6281 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6282 = this;
  var n__6283 = coll.entry_at(k);
  if(n__6283 != null) {
    return n__6283.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6284 = this;
  var found__6285 = [null];
  var t__6286 = cljs.core.tree_map_add.call(null, this__6284.comp, this__6284.tree, k, v, found__6285);
  if(t__6286 == null) {
    var found_node__6287 = cljs.core.nth.call(null, found__6285, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6287.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6284.comp, cljs.core.tree_map_replace.call(null, this__6284.comp, this__6284.tree, k, v), this__6284.cnt, this__6284.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6284.comp, t__6286.blacken(), this__6284.cnt + 1, this__6284.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6288 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6320 = null;
  var G__6320__2 = function(tsym6276, k) {
    var this__6289 = this;
    var tsym6276__6290 = this;
    var coll__6291 = tsym6276__6290;
    return cljs.core._lookup.call(null, coll__6291, k)
  };
  var G__6320__3 = function(tsym6277, k, not_found) {
    var this__6292 = this;
    var tsym6277__6293 = this;
    var coll__6294 = tsym6277__6293;
    return cljs.core._lookup.call(null, coll__6294, k, not_found)
  };
  G__6320 = function(tsym6277, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6320__2.call(this, tsym6277, k);
      case 3:
        return G__6320__3.call(this, tsym6277, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6320
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6274, args6275) {
  return tsym6274.call.apply(tsym6274, [tsym6274].concat(cljs.core.aclone.call(null, args6275)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6295 = this;
  if(this__6295.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6295.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6296 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6297 = this;
  if(this__6297.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6297.tree, false, this__6297.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6298 = this;
  var this$__6299 = this;
  return cljs.core.pr_str.call(null, this$__6299)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6300 = this;
  var coll__6301 = this;
  var t__6302 = this__6300.tree;
  while(true) {
    if(t__6302 != null) {
      var c__6303 = this__6300.comp.call(null, k, t__6302.key);
      if(c__6303 === 0) {
        return t__6302
      }else {
        if(c__6303 < 0) {
          var G__6321 = t__6302.left;
          t__6302 = G__6321;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6322 = t__6302.right;
            t__6302 = G__6322;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6304 = this;
  if(this__6304.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6304.tree, ascending_QMARK_, this__6304.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6305 = this;
  if(this__6305.cnt > 0) {
    var stack__6306 = null;
    var t__6307 = this__6305.tree;
    while(true) {
      if(t__6307 != null) {
        var c__6308 = this__6305.comp.call(null, k, t__6307.key);
        if(c__6308 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6306, t__6307), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6308 < 0) {
              var G__6323 = cljs.core.conj.call(null, stack__6306, t__6307);
              var G__6324 = t__6307.left;
              stack__6306 = G__6323;
              t__6307 = G__6324;
              continue
            }else {
              var G__6325 = stack__6306;
              var G__6326 = t__6307.right;
              stack__6306 = G__6325;
              t__6307 = G__6326;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6308 > 0) {
                var G__6327 = cljs.core.conj.call(null, stack__6306, t__6307);
                var G__6328 = t__6307.right;
                stack__6306 = G__6327;
                t__6307 = G__6328;
                continue
              }else {
                var G__6329 = stack__6306;
                var G__6330 = t__6307.left;
                stack__6306 = G__6329;
                t__6307 = G__6330;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6306 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6306, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6309 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6310 = this;
  return this__6310.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6311 = this;
  if(this__6311.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6311.tree, true, this__6311.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6312 = this;
  return this__6312.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6313 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6314 = this;
  return new cljs.core.PersistentTreeMap(this__6314.comp, this__6314.tree, this__6314.cnt, meta, this__6314.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6318 = this;
  return this__6318.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6319 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6319.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6315 = this;
  var found__6316 = [null];
  var t__6317 = cljs.core.tree_map_remove.call(null, this__6315.comp, this__6315.tree, k, found__6316);
  if(t__6317 == null) {
    if(cljs.core.nth.call(null, found__6316, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6315.comp, null, 0, this__6315.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6315.comp, t__6317.blacken(), this__6315.cnt - 1, this__6315.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6331 = cljs.core.seq.call(null, keyvals);
    var out__6332 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6331)) {
        var G__6333 = cljs.core.nnext.call(null, in$__6331);
        var G__6334 = cljs.core.assoc_BANG_.call(null, out__6332, cljs.core.first.call(null, in$__6331), cljs.core.second.call(null, in$__6331));
        in$__6331 = G__6333;
        out__6332 = G__6334;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6332)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6335) {
    var keyvals = cljs.core.seq(arglist__6335);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6336) {
    var keyvals = cljs.core.seq(arglist__6336);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6337 = cljs.core.seq.call(null, keyvals);
    var out__6338 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6337)) {
        var G__6339 = cljs.core.nnext.call(null, in$__6337);
        var G__6340 = cljs.core.assoc.call(null, out__6338, cljs.core.first.call(null, in$__6337), cljs.core.second.call(null, in$__6337));
        in$__6337 = G__6339;
        out__6338 = G__6340;
        continue
      }else {
        return out__6338
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6341) {
    var keyvals = cljs.core.seq(arglist__6341);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6342 = cljs.core.seq.call(null, keyvals);
    var out__6343 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6342)) {
        var G__6344 = cljs.core.nnext.call(null, in$__6342);
        var G__6345 = cljs.core.assoc.call(null, out__6343, cljs.core.first.call(null, in$__6342), cljs.core.second.call(null, in$__6342));
        in$__6342 = G__6344;
        out__6343 = G__6345;
        continue
      }else {
        return out__6343
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6346) {
    var comparator = cljs.core.first(arglist__6346);
    var keyvals = cljs.core.rest(arglist__6346);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6347_SHARP_, p2__6348_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____6349 = p1__6347_SHARP_;
          if(cljs.core.truth_(or__3824__auto____6349)) {
            return or__3824__auto____6349
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6348_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6350) {
    var maps = cljs.core.seq(arglist__6350);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6353 = function(m, e) {
        var k__6351 = cljs.core.first.call(null, e);
        var v__6352 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6351)) {
          return cljs.core.assoc.call(null, m, k__6351, f.call(null, cljs.core.get.call(null, m, k__6351), v__6352))
        }else {
          return cljs.core.assoc.call(null, m, k__6351, v__6352)
        }
      };
      var merge2__6355 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6353, function() {
          var or__3824__auto____6354 = m1;
          if(cljs.core.truth_(or__3824__auto____6354)) {
            return or__3824__auto____6354
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6355, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6356) {
    var f = cljs.core.first(arglist__6356);
    var maps = cljs.core.rest(arglist__6356);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6357 = cljs.core.ObjMap.fromObject([], {});
  var keys__6358 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6358)) {
      var key__6359 = cljs.core.first.call(null, keys__6358);
      var entry__6360 = cljs.core.get.call(null, map, key__6359, "\ufdd0'user/not-found");
      var G__6361 = cljs.core.not_EQ_.call(null, entry__6360, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6357, key__6359, entry__6360) : ret__6357;
      var G__6362 = cljs.core.next.call(null, keys__6358);
      ret__6357 = G__6361;
      keys__6358 = G__6362;
      continue
    }else {
      return ret__6357
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6368 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6368.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6369 = this;
  var h__364__auto____6370 = this__6369.__hash;
  if(h__364__auto____6370 != null) {
    return h__364__auto____6370
  }else {
    var h__364__auto____6371 = cljs.core.hash_iset.call(null, coll);
    this__6369.__hash = h__364__auto____6371;
    return h__364__auto____6371
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6372 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6373 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6373.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6392 = null;
  var G__6392__2 = function(tsym6366, k) {
    var this__6374 = this;
    var tsym6366__6375 = this;
    var coll__6376 = tsym6366__6375;
    return cljs.core._lookup.call(null, coll__6376, k)
  };
  var G__6392__3 = function(tsym6367, k, not_found) {
    var this__6377 = this;
    var tsym6367__6378 = this;
    var coll__6379 = tsym6367__6378;
    return cljs.core._lookup.call(null, coll__6379, k, not_found)
  };
  G__6392 = function(tsym6367, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6392__2.call(this, tsym6367, k);
      case 3:
        return G__6392__3.call(this, tsym6367, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6392
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6364, args6365) {
  return tsym6364.call.apply(tsym6364, [tsym6364].concat(cljs.core.aclone.call(null, args6365)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6380 = this;
  return new cljs.core.PersistentHashSet(this__6380.meta, cljs.core.assoc.call(null, this__6380.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6381 = this;
  var this$__6382 = this;
  return cljs.core.pr_str.call(null, this$__6382)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6383 = this;
  return cljs.core.keys.call(null, this__6383.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6384 = this;
  return new cljs.core.PersistentHashSet(this__6384.meta, cljs.core.dissoc.call(null, this__6384.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6385 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6386 = this;
  var and__3822__auto____6387 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6387) {
    var and__3822__auto____6388 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6388) {
      return cljs.core.every_QMARK_.call(null, function(p1__6363_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6363_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6388
    }
  }else {
    return and__3822__auto____6387
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6389 = this;
  return new cljs.core.PersistentHashSet(meta, this__6389.hash_map, this__6389.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6390 = this;
  return this__6390.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6391 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6391.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6410 = null;
  var G__6410__2 = function(tsym6396, k) {
    var this__6398 = this;
    var tsym6396__6399 = this;
    var tcoll__6400 = tsym6396__6399;
    if(cljs.core._lookup.call(null, this__6398.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6410__3 = function(tsym6397, k, not_found) {
    var this__6401 = this;
    var tsym6397__6402 = this;
    var tcoll__6403 = tsym6397__6402;
    if(cljs.core._lookup.call(null, this__6401.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6410 = function(tsym6397, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6410__2.call(this, tsym6397, k);
      case 3:
        return G__6410__3.call(this, tsym6397, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6410
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6394, args6395) {
  return tsym6394.call.apply(tsym6394, [tsym6394].concat(cljs.core.aclone.call(null, args6395)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6404 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6405 = this;
  if(cljs.core._lookup.call(null, this__6405.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6406 = this;
  return cljs.core.count.call(null, this__6406.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6407 = this;
  this__6407.transient_map = cljs.core.dissoc_BANG_.call(null, this__6407.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6408 = this;
  this__6408.transient_map = cljs.core.assoc_BANG_.call(null, this__6408.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6409 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6409.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6415 = this;
  var h__364__auto____6416 = this__6415.__hash;
  if(h__364__auto____6416 != null) {
    return h__364__auto____6416
  }else {
    var h__364__auto____6417 = cljs.core.hash_iset.call(null, coll);
    this__6415.__hash = h__364__auto____6417;
    return h__364__auto____6417
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6418 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6419 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6419.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6443 = null;
  var G__6443__2 = function(tsym6413, k) {
    var this__6420 = this;
    var tsym6413__6421 = this;
    var coll__6422 = tsym6413__6421;
    return cljs.core._lookup.call(null, coll__6422, k)
  };
  var G__6443__3 = function(tsym6414, k, not_found) {
    var this__6423 = this;
    var tsym6414__6424 = this;
    var coll__6425 = tsym6414__6424;
    return cljs.core._lookup.call(null, coll__6425, k, not_found)
  };
  G__6443 = function(tsym6414, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6443__2.call(this, tsym6414, k);
      case 3:
        return G__6443__3.call(this, tsym6414, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6443
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6411, args6412) {
  return tsym6411.call.apply(tsym6411, [tsym6411].concat(cljs.core.aclone.call(null, args6412)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6426 = this;
  return new cljs.core.PersistentTreeSet(this__6426.meta, cljs.core.assoc.call(null, this__6426.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6427 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6427.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6428 = this;
  var this$__6429 = this;
  return cljs.core.pr_str.call(null, this$__6429)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6430 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6430.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6431 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6431.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6432 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6433 = this;
  return cljs.core._comparator.call(null, this__6433.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6434 = this;
  return cljs.core.keys.call(null, this__6434.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6435 = this;
  return new cljs.core.PersistentTreeSet(this__6435.meta, cljs.core.dissoc.call(null, this__6435.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6436 = this;
  return cljs.core.count.call(null, this__6436.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6437 = this;
  var and__3822__auto____6438 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6438) {
    var and__3822__auto____6439 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6439) {
      return cljs.core.every_QMARK_.call(null, function(p1__6393_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6393_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6439
    }
  }else {
    return and__3822__auto____6438
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6440 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6440.tree_map, this__6440.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6441 = this;
  return this__6441.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6442 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6442.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6444 = cljs.core.seq.call(null, coll);
  var out__6445 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6444))) {
      var G__6446 = cljs.core.next.call(null, in$__6444);
      var G__6447 = cljs.core.conj_BANG_.call(null, out__6445, cljs.core.first.call(null, in$__6444));
      in$__6444 = G__6446;
      out__6445 = G__6447;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6445)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6448) {
    var keys = cljs.core.seq(arglist__6448);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6450) {
    var comparator = cljs.core.first(arglist__6450);
    var keys = cljs.core.rest(arglist__6450);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6451 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____6452 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____6452)) {
        var e__6453 = temp__3971__auto____6452;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6453))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6451, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6449_SHARP_) {
      var temp__3971__auto____6454 = cljs.core.find.call(null, smap, p1__6449_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____6454)) {
        var e__6455 = temp__3971__auto____6454;
        return cljs.core.second.call(null, e__6455)
      }else {
        return p1__6449_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6463 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6456, seen) {
        while(true) {
          var vec__6457__6458 = p__6456;
          var f__6459 = cljs.core.nth.call(null, vec__6457__6458, 0, null);
          var xs__6460 = vec__6457__6458;
          var temp__3974__auto____6461 = cljs.core.seq.call(null, xs__6460);
          if(cljs.core.truth_(temp__3974__auto____6461)) {
            var s__6462 = temp__3974__auto____6461;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6459)) {
              var G__6464 = cljs.core.rest.call(null, s__6462);
              var G__6465 = seen;
              p__6456 = G__6464;
              seen = G__6465;
              continue
            }else {
              return cljs.core.cons.call(null, f__6459, step.call(null, cljs.core.rest.call(null, s__6462), cljs.core.conj.call(null, seen, f__6459)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6463.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6466 = cljs.core.PersistentVector.fromArray([]);
  var s__6467 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6467))) {
      var G__6468 = cljs.core.conj.call(null, ret__6466, cljs.core.first.call(null, s__6467));
      var G__6469 = cljs.core.next.call(null, s__6467);
      ret__6466 = G__6468;
      s__6467 = G__6469;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6466)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____6470 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____6470) {
        return or__3824__auto____6470
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6471 = x.lastIndexOf("/");
      if(i__6471 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6471 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____6472 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____6472) {
      return or__3824__auto____6472
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6473 = x.lastIndexOf("/");
    if(i__6473 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6473)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6476 = cljs.core.ObjMap.fromObject([], {});
  var ks__6477 = cljs.core.seq.call(null, keys);
  var vs__6478 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6479 = ks__6477;
      if(cljs.core.truth_(and__3822__auto____6479)) {
        return vs__6478
      }else {
        return and__3822__auto____6479
      }
    }())) {
      var G__6480 = cljs.core.assoc.call(null, map__6476, cljs.core.first.call(null, ks__6477), cljs.core.first.call(null, vs__6478));
      var G__6481 = cljs.core.next.call(null, ks__6477);
      var G__6482 = cljs.core.next.call(null, vs__6478);
      map__6476 = G__6480;
      ks__6477 = G__6481;
      vs__6478 = G__6482;
      continue
    }else {
      return map__6476
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6485__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6474_SHARP_, p2__6475_SHARP_) {
        return max_key.call(null, k, p1__6474_SHARP_, p2__6475_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6485 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6485__delegate.call(this, k, x, y, more)
    };
    G__6485.cljs$lang$maxFixedArity = 3;
    G__6485.cljs$lang$applyTo = function(arglist__6486) {
      var k = cljs.core.first(arglist__6486);
      var x = cljs.core.first(cljs.core.next(arglist__6486));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6486)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6486)));
      return G__6485__delegate(k, x, y, more)
    };
    G__6485.cljs$lang$arity$variadic = G__6485__delegate;
    return G__6485
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6487__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6483_SHARP_, p2__6484_SHARP_) {
        return min_key.call(null, k, p1__6483_SHARP_, p2__6484_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6487 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6487__delegate.call(this, k, x, y, more)
    };
    G__6487.cljs$lang$maxFixedArity = 3;
    G__6487.cljs$lang$applyTo = function(arglist__6488) {
      var k = cljs.core.first(arglist__6488);
      var x = cljs.core.first(cljs.core.next(arglist__6488));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6488)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6488)));
      return G__6487__delegate(k, x, y, more)
    };
    G__6487.cljs$lang$arity$variadic = G__6487__delegate;
    return G__6487
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6489 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6489)) {
        var s__6490 = temp__3974__auto____6489;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6490), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6490)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6491 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6491)) {
      var s__6492 = temp__3974__auto____6491;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6492)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6492), take_while.call(null, pred, cljs.core.rest.call(null, s__6492)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6493 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6493.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6494 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____6495 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____6495)) {
        var vec__6496__6497 = temp__3974__auto____6495;
        var e__6498 = cljs.core.nth.call(null, vec__6496__6497, 0, null);
        var s__6499 = vec__6496__6497;
        if(cljs.core.truth_(include__6494.call(null, e__6498))) {
          return s__6499
        }else {
          return cljs.core.next.call(null, s__6499)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6494, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6500 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____6500)) {
      var vec__6501__6502 = temp__3974__auto____6500;
      var e__6503 = cljs.core.nth.call(null, vec__6501__6502, 0, null);
      var s__6504 = vec__6501__6502;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6503)) ? s__6504 : cljs.core.next.call(null, s__6504))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6505 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____6506 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____6506)) {
        var vec__6507__6508 = temp__3974__auto____6506;
        var e__6509 = cljs.core.nth.call(null, vec__6507__6508, 0, null);
        var s__6510 = vec__6507__6508;
        if(cljs.core.truth_(include__6505.call(null, e__6509))) {
          return s__6510
        }else {
          return cljs.core.next.call(null, s__6510)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6505, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6511 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____6511)) {
      var vec__6512__6513 = temp__3974__auto____6511;
      var e__6514 = cljs.core.nth.call(null, vec__6512__6513, 0, null);
      var s__6515 = vec__6512__6513;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6514)) ? s__6515 : cljs.core.next.call(null, s__6515))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6516 = this;
  var h__364__auto____6517 = this__6516.__hash;
  if(h__364__auto____6517 != null) {
    return h__364__auto____6517
  }else {
    var h__364__auto____6518 = cljs.core.hash_coll.call(null, rng);
    this__6516.__hash = h__364__auto____6518;
    return h__364__auto____6518
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6519 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6520 = this;
  var this$__6521 = this;
  return cljs.core.pr_str.call(null, this$__6521)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6522 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6523 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6524 = this;
  var comp__6525 = this__6524.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6525.call(null, this__6524.start, this__6524.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6526 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6526.end - this__6526.start) / this__6526.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6527 = this;
  return this__6527.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6528 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6528.meta, this__6528.start + this__6528.step, this__6528.end, this__6528.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6529 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6530 = this;
  return new cljs.core.Range(meta, this__6530.start, this__6530.end, this__6530.step, this__6530.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6531 = this;
  return this__6531.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6532 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6532.start + n * this__6532.step
  }else {
    if(function() {
      var and__3822__auto____6533 = this__6532.start > this__6532.end;
      if(and__3822__auto____6533) {
        return this__6532.step === 0
      }else {
        return and__3822__auto____6533
      }
    }()) {
      return this__6532.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6534 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6534.start + n * this__6534.step
  }else {
    if(function() {
      var and__3822__auto____6535 = this__6534.start > this__6534.end;
      if(and__3822__auto____6535) {
        return this__6534.step === 0
      }else {
        return and__3822__auto____6535
      }
    }()) {
      return this__6534.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6536 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6536.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6537 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6537)) {
      var s__6538 = temp__3974__auto____6537;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6538), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6538)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6540 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6540)) {
      var s__6541 = temp__3974__auto____6540;
      var fst__6542 = cljs.core.first.call(null, s__6541);
      var fv__6543 = f.call(null, fst__6542);
      var run__6544 = cljs.core.cons.call(null, fst__6542, cljs.core.take_while.call(null, function(p1__6539_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6543, f.call(null, p1__6539_SHARP_))
      }, cljs.core.next.call(null, s__6541)));
      return cljs.core.cons.call(null, run__6544, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6544), s__6541))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____6555 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____6555)) {
        var s__6556 = temp__3971__auto____6555;
        return reductions.call(null, f, cljs.core.first.call(null, s__6556), cljs.core.rest.call(null, s__6556))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6557 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6557)) {
        var s__6558 = temp__3974__auto____6557;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6558)), cljs.core.rest.call(null, s__6558))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6560 = null;
      var G__6560__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6560__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6560__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6560__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6560__4 = function() {
        var G__6561__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6561 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6561__delegate.call(this, x, y, z, args)
        };
        G__6561.cljs$lang$maxFixedArity = 3;
        G__6561.cljs$lang$applyTo = function(arglist__6562) {
          var x = cljs.core.first(arglist__6562);
          var y = cljs.core.first(cljs.core.next(arglist__6562));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6562)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6562)));
          return G__6561__delegate(x, y, z, args)
        };
        G__6561.cljs$lang$arity$variadic = G__6561__delegate;
        return G__6561
      }();
      G__6560 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6560__0.call(this);
          case 1:
            return G__6560__1.call(this, x);
          case 2:
            return G__6560__2.call(this, x, y);
          case 3:
            return G__6560__3.call(this, x, y, z);
          default:
            return G__6560__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6560.cljs$lang$maxFixedArity = 3;
      G__6560.cljs$lang$applyTo = G__6560__4.cljs$lang$applyTo;
      return G__6560
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6563 = null;
      var G__6563__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6563__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6563__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6563__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6563__4 = function() {
        var G__6564__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6564 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6564__delegate.call(this, x, y, z, args)
        };
        G__6564.cljs$lang$maxFixedArity = 3;
        G__6564.cljs$lang$applyTo = function(arglist__6565) {
          var x = cljs.core.first(arglist__6565);
          var y = cljs.core.first(cljs.core.next(arglist__6565));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6565)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6565)));
          return G__6564__delegate(x, y, z, args)
        };
        G__6564.cljs$lang$arity$variadic = G__6564__delegate;
        return G__6564
      }();
      G__6563 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6563__0.call(this);
          case 1:
            return G__6563__1.call(this, x);
          case 2:
            return G__6563__2.call(this, x, y);
          case 3:
            return G__6563__3.call(this, x, y, z);
          default:
            return G__6563__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6563.cljs$lang$maxFixedArity = 3;
      G__6563.cljs$lang$applyTo = G__6563__4.cljs$lang$applyTo;
      return G__6563
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6566 = null;
      var G__6566__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6566__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6566__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6566__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6566__4 = function() {
        var G__6567__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6567 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6567__delegate.call(this, x, y, z, args)
        };
        G__6567.cljs$lang$maxFixedArity = 3;
        G__6567.cljs$lang$applyTo = function(arglist__6568) {
          var x = cljs.core.first(arglist__6568);
          var y = cljs.core.first(cljs.core.next(arglist__6568));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6568)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6568)));
          return G__6567__delegate(x, y, z, args)
        };
        G__6567.cljs$lang$arity$variadic = G__6567__delegate;
        return G__6567
      }();
      G__6566 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6566__0.call(this);
          case 1:
            return G__6566__1.call(this, x);
          case 2:
            return G__6566__2.call(this, x, y);
          case 3:
            return G__6566__3.call(this, x, y, z);
          default:
            return G__6566__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6566.cljs$lang$maxFixedArity = 3;
      G__6566.cljs$lang$applyTo = G__6566__4.cljs$lang$applyTo;
      return G__6566
    }()
  };
  var juxt__4 = function() {
    var G__6569__delegate = function(f, g, h, fs) {
      var fs__6559 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6570 = null;
        var G__6570__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6545_SHARP_, p2__6546_SHARP_) {
            return cljs.core.conj.call(null, p1__6545_SHARP_, p2__6546_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6559)
        };
        var G__6570__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6547_SHARP_, p2__6548_SHARP_) {
            return cljs.core.conj.call(null, p1__6547_SHARP_, p2__6548_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6559)
        };
        var G__6570__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6549_SHARP_, p2__6550_SHARP_) {
            return cljs.core.conj.call(null, p1__6549_SHARP_, p2__6550_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6559)
        };
        var G__6570__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6551_SHARP_, p2__6552_SHARP_) {
            return cljs.core.conj.call(null, p1__6551_SHARP_, p2__6552_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6559)
        };
        var G__6570__4 = function() {
          var G__6571__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6553_SHARP_, p2__6554_SHARP_) {
              return cljs.core.conj.call(null, p1__6553_SHARP_, cljs.core.apply.call(null, p2__6554_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6559)
          };
          var G__6571 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6571__delegate.call(this, x, y, z, args)
          };
          G__6571.cljs$lang$maxFixedArity = 3;
          G__6571.cljs$lang$applyTo = function(arglist__6572) {
            var x = cljs.core.first(arglist__6572);
            var y = cljs.core.first(cljs.core.next(arglist__6572));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6572)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6572)));
            return G__6571__delegate(x, y, z, args)
          };
          G__6571.cljs$lang$arity$variadic = G__6571__delegate;
          return G__6571
        }();
        G__6570 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6570__0.call(this);
            case 1:
              return G__6570__1.call(this, x);
            case 2:
              return G__6570__2.call(this, x, y);
            case 3:
              return G__6570__3.call(this, x, y, z);
            default:
              return G__6570__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6570.cljs$lang$maxFixedArity = 3;
        G__6570.cljs$lang$applyTo = G__6570__4.cljs$lang$applyTo;
        return G__6570
      }()
    };
    var G__6569 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6569__delegate.call(this, f, g, h, fs)
    };
    G__6569.cljs$lang$maxFixedArity = 3;
    G__6569.cljs$lang$applyTo = function(arglist__6573) {
      var f = cljs.core.first(arglist__6573);
      var g = cljs.core.first(cljs.core.next(arglist__6573));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6573)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6573)));
      return G__6569__delegate(f, g, h, fs)
    };
    G__6569.cljs$lang$arity$variadic = G__6569__delegate;
    return G__6569
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6575 = cljs.core.next.call(null, coll);
        coll = G__6575;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____6574 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____6574)) {
          return n > 0
        }else {
          return and__3822__auto____6574
        }
      }())) {
        var G__6576 = n - 1;
        var G__6577 = cljs.core.next.call(null, coll);
        n = G__6576;
        coll = G__6577;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6578 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6578), s)) {
    if(cljs.core.count.call(null, matches__6578) === 1) {
      return cljs.core.first.call(null, matches__6578)
    }else {
      return cljs.core.vec.call(null, matches__6578)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6579 = re.exec(s);
  if(matches__6579 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6579) === 1) {
      return cljs.core.first.call(null, matches__6579)
    }else {
      return cljs.core.vec.call(null, matches__6579)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6580 = cljs.core.re_find.call(null, re, s);
  var match_idx__6581 = s.search(re);
  var match_str__6582 = cljs.core.coll_QMARK_.call(null, match_data__6580) ? cljs.core.first.call(null, match_data__6580) : match_data__6580;
  var post_match__6583 = cljs.core.subs.call(null, s, match_idx__6581 + cljs.core.count.call(null, match_str__6582));
  if(cljs.core.truth_(match_data__6580)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6580, re_seq.call(null, re, post_match__6583))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6585__6586 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6587 = cljs.core.nth.call(null, vec__6585__6586, 0, null);
  var flags__6588 = cljs.core.nth.call(null, vec__6585__6586, 1, null);
  var pattern__6589 = cljs.core.nth.call(null, vec__6585__6586, 2, null);
  return new RegExp(pattern__6589, flags__6588)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6584_SHARP_) {
    return print_one.call(null, p1__6584_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____6590 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____6590)) {
            var and__3822__auto____6594 = function() {
              var G__6591__6592 = obj;
              if(G__6591__6592 != null) {
                if(function() {
                  var or__3824__auto____6593 = G__6591__6592.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____6593) {
                    return or__3824__auto____6593
                  }else {
                    return G__6591__6592.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6591__6592.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6591__6592)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6591__6592)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____6594)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____6594
            }
          }else {
            return and__3822__auto____6590
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____6595 = obj != null;
          if(and__3822__auto____6595) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____6595
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6596__6597 = obj;
          if(G__6596__6597 != null) {
            if(function() {
              var or__3824__auto____6598 = G__6596__6597.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____6598) {
                return or__3824__auto____6598
              }else {
                return G__6596__6597.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6596__6597.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6596__6597)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6596__6597)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6599 = cljs.core.first.call(null, objs);
  var sb__6600 = new goog.string.StringBuffer;
  var G__6601__6602 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6601__6602)) {
    var obj__6603 = cljs.core.first.call(null, G__6601__6602);
    var G__6601__6604 = G__6601__6602;
    while(true) {
      if(obj__6603 === first_obj__6599) {
      }else {
        sb__6600.append(" ")
      }
      var G__6605__6606 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6603, opts));
      if(cljs.core.truth_(G__6605__6606)) {
        var string__6607 = cljs.core.first.call(null, G__6605__6606);
        var G__6605__6608 = G__6605__6606;
        while(true) {
          sb__6600.append(string__6607);
          var temp__3974__auto____6609 = cljs.core.next.call(null, G__6605__6608);
          if(cljs.core.truth_(temp__3974__auto____6609)) {
            var G__6605__6610 = temp__3974__auto____6609;
            var G__6613 = cljs.core.first.call(null, G__6605__6610);
            var G__6614 = G__6605__6610;
            string__6607 = G__6613;
            G__6605__6608 = G__6614;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6611 = cljs.core.next.call(null, G__6601__6604);
      if(cljs.core.truth_(temp__3974__auto____6611)) {
        var G__6601__6612 = temp__3974__auto____6611;
        var G__6615 = cljs.core.first.call(null, G__6601__6612);
        var G__6616 = G__6601__6612;
        obj__6603 = G__6615;
        G__6601__6604 = G__6616;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6600
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6617 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6617.append("\n");
  return[cljs.core.str(sb__6617)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6618 = cljs.core.first.call(null, objs);
  var G__6619__6620 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6619__6620)) {
    var obj__6621 = cljs.core.first.call(null, G__6619__6620);
    var G__6619__6622 = G__6619__6620;
    while(true) {
      if(obj__6621 === first_obj__6618) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6623__6624 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6621, opts));
      if(cljs.core.truth_(G__6623__6624)) {
        var string__6625 = cljs.core.first.call(null, G__6623__6624);
        var G__6623__6626 = G__6623__6624;
        while(true) {
          cljs.core.string_print.call(null, string__6625);
          var temp__3974__auto____6627 = cljs.core.next.call(null, G__6623__6626);
          if(cljs.core.truth_(temp__3974__auto____6627)) {
            var G__6623__6628 = temp__3974__auto____6627;
            var G__6631 = cljs.core.first.call(null, G__6623__6628);
            var G__6632 = G__6623__6628;
            string__6625 = G__6631;
            G__6623__6626 = G__6632;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6629 = cljs.core.next.call(null, G__6619__6622);
      if(cljs.core.truth_(temp__3974__auto____6629)) {
        var G__6619__6630 = temp__3974__auto____6629;
        var G__6633 = cljs.core.first.call(null, G__6619__6630);
        var G__6634 = G__6619__6630;
        obj__6621 = G__6633;
        G__6619__6622 = G__6634;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6635) {
    var objs = cljs.core.seq(arglist__6635);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6636) {
    var objs = cljs.core.seq(arglist__6636);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6637) {
    var objs = cljs.core.seq(arglist__6637);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6638) {
    var objs = cljs.core.seq(arglist__6638);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6639) {
    var objs = cljs.core.seq(arglist__6639);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6640) {
    var objs = cljs.core.seq(arglist__6640);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6641) {
    var objs = cljs.core.seq(arglist__6641);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6642) {
    var objs = cljs.core.seq(arglist__6642);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6643 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6643, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6644 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6644, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6645 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6645, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____6646 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____6646)) {
        var nspc__6647 = temp__3974__auto____6646;
        return[cljs.core.str(nspc__6647), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____6648 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____6648)) {
          var nspc__6649 = temp__3974__auto____6648;
          return[cljs.core.str(nspc__6649), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6650 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6650, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6651 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6651, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6652 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6653 = this;
  var G__6654__6655 = cljs.core.seq.call(null, this__6653.watches);
  if(cljs.core.truth_(G__6654__6655)) {
    var G__6657__6659 = cljs.core.first.call(null, G__6654__6655);
    var vec__6658__6660 = G__6657__6659;
    var key__6661 = cljs.core.nth.call(null, vec__6658__6660, 0, null);
    var f__6662 = cljs.core.nth.call(null, vec__6658__6660, 1, null);
    var G__6654__6663 = G__6654__6655;
    var G__6657__6664 = G__6657__6659;
    var G__6654__6665 = G__6654__6663;
    while(true) {
      var vec__6666__6667 = G__6657__6664;
      var key__6668 = cljs.core.nth.call(null, vec__6666__6667, 0, null);
      var f__6669 = cljs.core.nth.call(null, vec__6666__6667, 1, null);
      var G__6654__6670 = G__6654__6665;
      f__6669.call(null, key__6668, this$, oldval, newval);
      var temp__3974__auto____6671 = cljs.core.next.call(null, G__6654__6670);
      if(cljs.core.truth_(temp__3974__auto____6671)) {
        var G__6654__6672 = temp__3974__auto____6671;
        var G__6679 = cljs.core.first.call(null, G__6654__6672);
        var G__6680 = G__6654__6672;
        G__6657__6664 = G__6679;
        G__6654__6665 = G__6680;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6673 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6673.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6674 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6674.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6675 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6675.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6676 = this;
  return this__6676.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6677 = this;
  return this__6677.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6678 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6687__delegate = function(x, p__6681) {
      var map__6682__6683 = p__6681;
      var map__6682__6684 = cljs.core.seq_QMARK_.call(null, map__6682__6683) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6682__6683) : map__6682__6683;
      var validator__6685 = cljs.core.get.call(null, map__6682__6684, "\ufdd0'validator");
      var meta__6686 = cljs.core.get.call(null, map__6682__6684, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6686, validator__6685, null)
    };
    var G__6687 = function(x, var_args) {
      var p__6681 = null;
      if(goog.isDef(var_args)) {
        p__6681 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6687__delegate.call(this, x, p__6681)
    };
    G__6687.cljs$lang$maxFixedArity = 1;
    G__6687.cljs$lang$applyTo = function(arglist__6688) {
      var x = cljs.core.first(arglist__6688);
      var p__6681 = cljs.core.rest(arglist__6688);
      return G__6687__delegate(x, p__6681)
    };
    G__6687.cljs$lang$arity$variadic = G__6687__delegate;
    return G__6687
  }();
  atom = function(x, var_args) {
    var p__6681 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____6689 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____6689)) {
    var validate__6690 = temp__3974__auto____6689;
    if(cljs.core.truth_(validate__6690.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6691 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6691, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6692__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6692 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6692__delegate.call(this, a, f, x, y, z, more)
    };
    G__6692.cljs$lang$maxFixedArity = 5;
    G__6692.cljs$lang$applyTo = function(arglist__6693) {
      var a = cljs.core.first(arglist__6693);
      var f = cljs.core.first(cljs.core.next(arglist__6693));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6693)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6693))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6693)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6693)))));
      return G__6692__delegate(a, f, x, y, z, more)
    };
    G__6692.cljs$lang$arity$variadic = G__6692__delegate;
    return G__6692
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6694) {
    var iref = cljs.core.first(arglist__6694);
    var f = cljs.core.first(cljs.core.next(arglist__6694));
    var args = cljs.core.rest(cljs.core.next(arglist__6694));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6695 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6695.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6696 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6696.state, function(p__6697) {
    var curr_state__6698 = p__6697;
    var curr_state__6699 = cljs.core.seq_QMARK_.call(null, curr_state__6698) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6698) : curr_state__6698;
    var done__6700 = cljs.core.get.call(null, curr_state__6699, "\ufdd0'done");
    if(cljs.core.truth_(done__6700)) {
      return curr_state__6699
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6696.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__6701__6702 = options;
    var map__6701__6703 = cljs.core.seq_QMARK_.call(null, map__6701__6702) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6701__6702) : map__6701__6702;
    var keywordize_keys__6704 = cljs.core.get.call(null, map__6701__6703, "\ufdd0'keywordize-keys");
    var keyfn__6705 = cljs.core.truth_(keywordize_keys__6704) ? cljs.core.keyword : cljs.core.str;
    var f__6711 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____6710 = function iter__6706(s__6707) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6707__6708 = s__6707;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6707__6708))) {
                        var k__6709 = cljs.core.first.call(null, s__6707__6708);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6705.call(null, k__6709), thisfn.call(null, x[k__6709])]), iter__6706.call(null, cljs.core.rest.call(null, s__6707__6708)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____6710.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6711.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6712) {
    var x = cljs.core.first(arglist__6712);
    var options = cljs.core.rest(arglist__6712);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6713 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6717__delegate = function(args) {
      var temp__3971__auto____6714 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6713), args);
      if(cljs.core.truth_(temp__3971__auto____6714)) {
        var v__6715 = temp__3971__auto____6714;
        return v__6715
      }else {
        var ret__6716 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6713, cljs.core.assoc, args, ret__6716);
        return ret__6716
      }
    };
    var G__6717 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6717__delegate.call(this, args)
    };
    G__6717.cljs$lang$maxFixedArity = 0;
    G__6717.cljs$lang$applyTo = function(arglist__6718) {
      var args = cljs.core.seq(arglist__6718);
      return G__6717__delegate(args)
    };
    G__6717.cljs$lang$arity$variadic = G__6717__delegate;
    return G__6717
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6719 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6719)) {
        var G__6720 = ret__6719;
        f = G__6720;
        continue
      }else {
        return ret__6719
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6721__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6721 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6721__delegate.call(this, f, args)
    };
    G__6721.cljs$lang$maxFixedArity = 1;
    G__6721.cljs$lang$applyTo = function(arglist__6722) {
      var f = cljs.core.first(arglist__6722);
      var args = cljs.core.rest(arglist__6722);
      return G__6721__delegate(f, args)
    };
    G__6721.cljs$lang$arity$variadic = G__6721__delegate;
    return G__6721
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6723 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6723, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6723, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____6724 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____6724) {
      return or__3824__auto____6724
    }else {
      var or__3824__auto____6725 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____6725) {
        return or__3824__auto____6725
      }else {
        var and__3822__auto____6726 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____6726) {
          var and__3822__auto____6727 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____6727) {
            var and__3822__auto____6728 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____6728) {
              var ret__6729 = true;
              var i__6730 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____6731 = cljs.core.not.call(null, ret__6729);
                  if(or__3824__auto____6731) {
                    return or__3824__auto____6731
                  }else {
                    return i__6730 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6729
                }else {
                  var G__6732 = isa_QMARK_.call(null, h, child.call(null, i__6730), parent.call(null, i__6730));
                  var G__6733 = i__6730 + 1;
                  ret__6729 = G__6732;
                  i__6730 = G__6733;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____6728
            }
          }else {
            return and__3822__auto____6727
          }
        }else {
          return and__3822__auto____6726
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__6737 = "\ufdd0'parents".call(null, h);
    var td__6738 = "\ufdd0'descendants".call(null, h);
    var ta__6739 = "\ufdd0'ancestors".call(null, h);
    var tf__6740 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____6741 = cljs.core.contains_QMARK_.call(null, tp__6737.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6739.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6739.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6737, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6740.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6738, parent, ta__6739), "\ufdd0'descendants":tf__6740.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6739, tag, td__6738)})
    }();
    if(cljs.core.truth_(or__3824__auto____6741)) {
      return or__3824__auto____6741
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6742 = "\ufdd0'parents".call(null, h);
    var childsParents__6743 = cljs.core.truth_(parentMap__6742.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6742.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6744 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6743)) ? cljs.core.assoc.call(null, parentMap__6742, tag, childsParents__6743) : cljs.core.dissoc.call(null, parentMap__6742, tag);
    var deriv_seq__6745 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6734_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6734_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6734_SHARP_), cljs.core.second.call(null, p1__6734_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6744)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6742.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6735_SHARP_, p2__6736_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6735_SHARP_, p2__6736_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6745))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__6746 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____6748 = cljs.core.truth_(function() {
    var and__3822__auto____6747 = xprefs__6746;
    if(cljs.core.truth_(and__3822__auto____6747)) {
      return xprefs__6746.call(null, y)
    }else {
      return and__3822__auto____6747
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____6748)) {
    return or__3824__auto____6748
  }else {
    var or__3824__auto____6750 = function() {
      var ps__6749 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6749) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6749), prefer_table))) {
          }else {
          }
          var G__6753 = cljs.core.rest.call(null, ps__6749);
          ps__6749 = G__6753;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____6750)) {
      return or__3824__auto____6750
    }else {
      var or__3824__auto____6752 = function() {
        var ps__6751 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6751) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6751), y, prefer_table))) {
            }else {
            }
            var G__6754 = cljs.core.rest.call(null, ps__6751);
            ps__6751 = G__6754;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____6752)) {
        return or__3824__auto____6752
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____6755 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____6755)) {
    return or__3824__auto____6755
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6764 = cljs.core.reduce.call(null, function(be, p__6756) {
    var vec__6757__6758 = p__6756;
    var k__6759 = cljs.core.nth.call(null, vec__6757__6758, 0, null);
    var ___6760 = cljs.core.nth.call(null, vec__6757__6758, 1, null);
    var e__6761 = vec__6757__6758;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6759)) {
      var be2__6763 = cljs.core.truth_(function() {
        var or__3824__auto____6762 = be == null;
        if(or__3824__auto____6762) {
          return or__3824__auto____6762
        }else {
          return cljs.core.dominates.call(null, k__6759, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6761 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6763), k__6759, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6759), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6763)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6763
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6764)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6764));
      return cljs.core.second.call(null, best_entry__6764)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____6765 = mf;
    if(and__3822__auto____6765) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____6765
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6766 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6766) {
        return or__3824__auto____6766
      }else {
        var or__3824__auto____6767 = cljs.core._reset["_"];
        if(or__3824__auto____6767) {
          return or__3824__auto____6767
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____6768 = mf;
    if(and__3822__auto____6768) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____6768
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____6769 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6769) {
        return or__3824__auto____6769
      }else {
        var or__3824__auto____6770 = cljs.core._add_method["_"];
        if(or__3824__auto____6770) {
          return or__3824__auto____6770
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6771 = mf;
    if(and__3822__auto____6771) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____6771
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6772 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6772) {
        return or__3824__auto____6772
      }else {
        var or__3824__auto____6773 = cljs.core._remove_method["_"];
        if(or__3824__auto____6773) {
          return or__3824__auto____6773
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____6774 = mf;
    if(and__3822__auto____6774) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____6774
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____6775 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6775) {
        return or__3824__auto____6775
      }else {
        var or__3824__auto____6776 = cljs.core._prefer_method["_"];
        if(or__3824__auto____6776) {
          return or__3824__auto____6776
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6777 = mf;
    if(and__3822__auto____6777) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____6777
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6778 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6778) {
        return or__3824__auto____6778
      }else {
        var or__3824__auto____6779 = cljs.core._get_method["_"];
        if(or__3824__auto____6779) {
          return or__3824__auto____6779
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____6780 = mf;
    if(and__3822__auto____6780) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____6780
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6781 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6781) {
        return or__3824__auto____6781
      }else {
        var or__3824__auto____6782 = cljs.core._methods["_"];
        if(or__3824__auto____6782) {
          return or__3824__auto____6782
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____6783 = mf;
    if(and__3822__auto____6783) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____6783
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6784 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6784) {
        return or__3824__auto____6784
      }else {
        var or__3824__auto____6785 = cljs.core._prefers["_"];
        if(or__3824__auto____6785) {
          return or__3824__auto____6785
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____6786 = mf;
    if(and__3822__auto____6786) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____6786
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____6787 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6787) {
        return or__3824__auto____6787
      }else {
        var or__3824__auto____6788 = cljs.core._dispatch["_"];
        if(or__3824__auto____6788) {
          return or__3824__auto____6788
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6789 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6790 = cljs.core._get_method.call(null, mf, dispatch_val__6789);
  if(cljs.core.truth_(target_fn__6790)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6789)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6790, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6791 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6792 = this;
  cljs.core.swap_BANG_.call(null, this__6792.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6792.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6792.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6792.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6793 = this;
  cljs.core.swap_BANG_.call(null, this__6793.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6793.method_cache, this__6793.method_table, this__6793.cached_hierarchy, this__6793.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6794 = this;
  cljs.core.swap_BANG_.call(null, this__6794.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6794.method_cache, this__6794.method_table, this__6794.cached_hierarchy, this__6794.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6795 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6795.cached_hierarchy), cljs.core.deref.call(null, this__6795.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6795.method_cache, this__6795.method_table, this__6795.cached_hierarchy, this__6795.hierarchy)
  }
  var temp__3971__auto____6796 = cljs.core.deref.call(null, this__6795.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____6796)) {
    var target_fn__6797 = temp__3971__auto____6796;
    return target_fn__6797
  }else {
    var temp__3971__auto____6798 = cljs.core.find_and_cache_best_method.call(null, this__6795.name, dispatch_val, this__6795.hierarchy, this__6795.method_table, this__6795.prefer_table, this__6795.method_cache, this__6795.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____6798)) {
      var target_fn__6799 = temp__3971__auto____6798;
      return target_fn__6799
    }else {
      return cljs.core.deref.call(null, this__6795.method_table).call(null, this__6795.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6800 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6800.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6800.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6800.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6800.method_cache, this__6800.method_table, this__6800.cached_hierarchy, this__6800.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6801 = this;
  return cljs.core.deref.call(null, this__6801.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6802 = this;
  return cljs.core.deref.call(null, this__6802.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6803 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6803.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6804__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6804 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6804__delegate.call(this, _, args)
  };
  G__6804.cljs$lang$maxFixedArity = 1;
  G__6804.cljs$lang$applyTo = function(arglist__6805) {
    var _ = cljs.core.first(arglist__6805);
    var args = cljs.core.rest(arglist__6805);
    return G__6804__delegate(_, args)
  };
  G__6804.cljs$lang$arity$variadic = G__6804__delegate;
  return G__6804
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("gswd3.client.main");
goog.require("cljs.core");
gswd3.client.main.d3 = d3;
gswd3.client.main.log = function() {
  var log__delegate = function(args) {
    var s__8771 = cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, "', '", args));
    return console.log([cljs.core.str("log: '"), cljs.core.str(s__8771), cljs.core.str("'")].join(""))
  };
  var log = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, args)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__8772) {
    var args = cljs.core.seq(arglist__8772);
    return log__delegate(args)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
gswd3.client.main.service_status = function service_status(jd) {
  gswd3.client.main.d3.select("body").append("ul").selectAll("li").data(jd).enter().append("li").text(function(d) {
    return[cljs.core.str(d.name), cljs.core.str(": "), cljs.core.str(d.status)].join("")
  });
  return gswd3.client.main.d3.selectAll("li").style("font-weight", function(d) {
    if(cljs.core._EQ_.call(null, [cljs.core.str(d.status)].join(""), "GOOD SERVICE")) {
      return"normal"
    }else {
      return"bold"
    }
  })
};
goog.exportSymbol("gswd3.client.main.service_status", gswd3.client.main.service_status);
