(function(global) {
	global.minimal = global.$m = global.minimal || (function() {
		// fix for browsers that don't support the dataset property
		var dataset = function(element, ds, value) {
			if (element !== undefined && value !== undefined) {
				if (element.dataset) element.dataset[ds] = value;
				else element.setAttribute("data-" + ds, value);
			}

			return !element ? undefined : element.dataset ?
				element.dataset[ds] :
				element.getAttribute("data-" + ds);
		};

		// custom template renderers
		var custom = {};

		// delegate to custom renderer if found, else call render with f
		var customOrElse = function(json, element, f) {
			(element && dataset(element, "render") in custom ? custom[dataset(element, "render")] : f)(json, element);
		};

		// custom filters
		var filters = { pre: {}, post: {} };

		// generic function to process filters (either pre or post)
		var processFilters = function(filtersSubset, json, element) {
			for (var i in filtersSubset)
				if (filtersSubset[i](json, element) === false) return false;
		};

		// default querySelector function, to be overridden by JS libs
		var querySelector = function(base, selector) { return base.querySelector(selector); };

		// default exception handler, to be overriden
		var exceptionHandler = function() {};

		// clone node and attach it to the same parent
		var cloneAndAttach = function(element, parent, first) {
			parent = parent || element.parentNode;

			return first && dataset(parent, "mode") === "prepend" ?
				parent.insertBefore(element.cloneNode(true), first) :
				parent.appendChild(element.cloneNode(true));
		};

		// builtin renderer for hashmaps
		var renderObject = function(json, element) {
			customOrElse(json, element, function(j, e) {
				for (var i in j) render(json[i], i);
			});
		};

		// builtin renderer for arrays
		var renderArray = function(json, element) {
			element._cache = element._cache || element.removeChild(element.children[0]);

			// if we're not appending nor prepending, remove children
			if (!dataset(element, "mode")) element.innerHTML = "";

			var first = element.children[0];

			// let cloneAndAttach handle modes, eh!
			for (var i in json)
				customOrElse(json[i], cloneAndAttach(element._cache, element, first), render);
		};

		// builtin renderer for textual data (strings, numbers & booleans)
		var renderText = function(json, element) {
			switch (dataset(element, "mode")) {
				case "append":  element.innerHTML += json;                     break;
				case "prepend": element.innerHTML  = json + element.innerHTML; break;
				default:        element.innerHTML  = json;                     break;
			}
		};

		// main renderer
		var render = function(json, element) {
			var hasElement = (element !== undefined);
			var base = element && element.parentNode ? element.parentNode : document;

			element = element === undefined ? document.documentElement : typeof element === "string" ?
				document.getElementById(element) || base.getElementsByClassName(element)[0] || base.getElementsByTagName(element)[0] || querySelector(base, element) : // by default, an id, then a class, otherwise a CSS selector
				element; // otherwise just assume it's any sort of DOM element

			// ensure we have a real DOM element
			if ((typeof Element === "function" || typeof Element === "object") && !(element instanceof Element)) {
				render.exceptionHandler();
				return;
			}

			// apply pre-processing filters
			if (processFilters(filters.pre, json, element) === false) return base.removeChild(element);

			customOrElse(json, element, function(j, e) {
				switch (Object.prototype.toString.call(j)) {
					case "[object Object]": if (hasElement && !dataset(element, "render"))
												dataset(element, "render", "children");
											renderObject(j, e); break;
					case "[object Array]":  renderArray(j, e);  break;
					default:                renderText(j, e);   break;
				}
			});

			// apply post-processing filters
			if (processFilters(filters.post, json, element) === false) return base.removeChild(element);
		};

		render.dataset          = dataset;
		render.custom           = custom;
		render.querySelector    = querySelector;
		render.exceptionHandler = exceptionHandler;
		render.render           = render;
		render.filters          = filters;

		return render;
	})();

	// attr custom renderer
	global.$m.custom.attr = function(json, element) {
		for (var i in json)
			if (i === "content") {
				if (typeof json[i] === "object")
					global.$m.render(json[i], element);
				else
					element.innerHTML = json[i];
			}
			else
				element.setAttribute(i, json[i]);
	};

	// children custom renderer
	global.$m.custom.children = function(json, element) {
		var iterable = Object.prototype.toString.call(json) === "[object Object]" ? json : [].concat(json);

		for (var item in iterable)
			global.$m.render(
				iterable[item],
				element.children[item] || element.getElementsByClassName(item)[0] || element.getElementsByTagName(item)[0] || global.$m.querySelector(element, item)
			);
	};

	// embedded nanotemplate.js, available at https://github.com/ruidlopes/nanotemplatejs
	(function() {
		var _tregex = /(\$\w+)/g;

		String.prototype.template = String.prototype.t = String.prototype.template || function() {
			if (arguments[0] instanceof Array)
				return arguments[0].map(this.t, this).join("");
			else {
				var args = typeof arguments[0] === "object" ? arguments[0] : arguments;
				return this.replace(_tregex, function(match) { return args[match.substr(1)]; });
			}
		};

		if (typeof Element === "function" || typeof Element === "object")
			Element.prototype.template = Element.prototype.t = Element.prototype.template || function() {
				this._tcache = this._tcache || this.innerHTML;
				this.innerHTML = this._tcache.t.apply(this._tcache, arguments);
			};
	})();

	// nanotemplate.js custom renderer
	global.$m.custom.nano = function(json, element) {
		element.template(json);
	};
})(typeof exports !== "undefined" ? exports : window);