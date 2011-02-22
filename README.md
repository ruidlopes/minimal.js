# minimal.js: HTML+JSON template engine

(skip directly to [Usage](#Usage), [a complex example usage](#Complex-example), and learn [how to extend with new features](#Extending))

* version 0.1.2
  * `npm` compatibility (installable via `npm install minimal`)

* version 0.1.1
  * Fixed SERIOUS bug on `minimal-node` that prevented multiple templates to coexist
  * Performance improvements

* version 0.1.0
  * Initial version


# Why?

Yes, the current landscape for HTML templating is very rich. However, there are severe problems that create impedance on their usage, including:

* Complex or proprietary/alien DSL syntax (e.g., almost all template engines listed as [Node.js modules](https://github.com/ry/node/wiki/modules#templating));
* Complex data binding for non-trivial scenarios (e.g., [PURE](http://beebole.com/pure/), [Chain.js](https://github.com/raid-ox/chain.js));
* Dependent on specific Javascript libraries (e.g., [jQuery template](http://api.jquery.com/jQuery.template/), [Chain.js](https://github.com/raid-ox/chain.js));
* Difficult (or impossible) to be extended.

# Design goals

[Developers deserve a good UX, too](http://ruidlopes.posterous.com/developers-deserve-a-good-ux-too). Libraries and APIs should be rich, yet simple to use. Hence, `minimal.js` is designed to achieve the following goals:

* **No proprietary/alien DSL syntax.** HTML *is* the template, JSON *is* the data. There's no need to reinvent the wheel, nor to complicate when there's no need to;
* **Minimal syntax** in both HTML and JSON counterparts. Extra fluff should be present only when it is *strictly impossible* to infer the bindings, and this fluff must be **minimal** as well;
* **Independent** from Javascript libraries, but friendly to any of them;
* **Dynamic.** Afford reapplication of new data into an existing template (e.g., for AJAX re-binding of JSON data);
* **Fast.** Examples: support caching; no `eval`-style directives;
* **Extendable** to new functionality;
* **Small.** Currently clocking 133 lines + 13 for [node.js](http://nodejs.org) support, including comments and whitespace, *vs* 440 lines for this documentation.

<a name="Usage"></a>

# Usage

`minimal.js` relies on two core functionalities, *rendering* and *iterations*, and an auxiliary functionality, *modes*. A description of these functionalities is provided below. For further information and examples, check the `test` directory in this project.

## Setup

### Browser

Simplest of the setups, just add `minimal.js` to your HTML document:

	<script src="minimal.js" type="text/javascript" charset="utf-8"></script>

Afterwards, an object named `$m` is available at the `window` scope (and its alias `window.minimal` as well). This object provides two functions:

* `$m.render`, to support rendering (including `iterations` and `modes` functionalities).
> **Note:** Since it's the most common task to be done with this library, `$m` is also a `function` alias to `$m.render`.

* `$m.custom`, to extend `minimal.js` with new renderers (discussed [further below](#Extending)).

<a name="Node.js"></a>

### Node.js

`minimal.js` is now available via `npm`. To install it (and dependencies), execute the following command:

	npm install jsdom minimal

Now `minimal.js` is ready to be used, by importing the `minimal` module, as follows:

	var minimal = require("minimal");

Since we're outside a browser's context, the actual HTML template has to be loaded. For that, the `minimal-node.js` library provides the `template` function to load a `string`-based template, which returns the `$m` object:

	var $m = minimal.template("<html>...</html>");

Afterwards, the `$m` object is available to be used just like in the browser. Additionally, the rendering of the HTML template can be accessed through the special function `$m.html()` available at this object:

	var html = $m.html();

### Custom CSS Selector

`minimal.js` comes bundled with a predefined CSS selector (basically, a wrapper on Element.querySelector). Since several JS libraries, such as jQuery, provide their own custom CSS selector, `minimal.js` can be configured to use appropriate implementations. To accomplish this, override the `$m.querySelector` function with a function that takes a `base` and a `selector` parameters. Example implementations for some well-known libraries follow:

#### jQuery

	$m.querySelector = function(base, selector) { return $(selector, base)[0]; };

#### Dojo

	$m.querySelector = function(base, selector) { return dojo.query(base).query(selector)[0]; };

#### Prototype

	$m.querySelector = function(base, selector) { return base.select(selector)[0]; };

#### Sizzle

	$m.querySelector = function(base, selector) { return Sizzle(selector, base)[0]; };

## Rendering

The function signature to render JSON data is:

	$m(json)

`json` is a hashmap of key/value pairs. Each *key* must represent a valid reference to an HTML element, in the following way:

* if *key* is a valid *id* (i.e., analogous to `document.getElementById`), it defines the scope of applicability of its *value* counterpart;
* if it is a valid *class* (i.e., analogous to `document.getElementsByClassName`), it applies the *value* to the first matched element;
* otherwise, the *key* is interpreted as a *CSS selector* (i.e., analogous to `document.querySelector`).

Afterwards, the *value* is applied to the corresponding HTML element.

> **Note:** due to the way `minimal.js` is implemented, this function can only be executed after the DOM tree is fully loaded (e.g., `DOMContentLoaded` event in Opera and Gecko-based browsers).

### Example

Consider the following HTML template snippet:

	<h1></h1>
	<p></p>
	<p id="footer"></p>

and the following Javascript:

	$m({
		h1: "this is a title",
		p: "this is a paragraph",
		footer: "this is a footer"
	});

will result in the following transformed HTML:

	<h1>this is a title</h1>
	<p>this is a paragraph</p>
	<p id="footer">this is a footer</p>

`h1` and `p` are interpreted as *CSS selectors*, whereas `footer` is interpreted as an *id*.

## Iteration

Iterations extend the *value* counterpart of the core rendering functionality. This is achieved by specifying a child HTML element as the template, and an `Array` instance as its JSON data.

### Example

Consider the following HTML template snippet:

	<ul>
		<li></li>
	</ul>

and the following Javascript:

	$m({
		ul: ["foo", "bar", "baz"]
	});

will result in the following transformed HTML:

	<ul>
		<li>foo</li>
		<li>bar</li>
		<li>baz</li>
	</ul>


## Modes

`minimal.js` provides several *modes* to modify template processing behaviour: `replace`, `append`, and `prepend`. These modes are detected through the `data-mode` attribute. If this attribute is not found, the `replace` behaviour is assumed.

> **Note:** `minimal.js` supports all *modes* on both *rendering* and *iteration* core functionalities.

### Replace (default)

The `replace` mode is the default behaviour for template processing, where templates always reflect the binding to the latest corresponding JSON data.

#### Example

Consider the following HTML template snippet:

	<ul>
		<li></li>
	</ul>

and the following Javascript:

	$m({
		ul: ["foo", "bar"]
	});
	
	$m({
		ul: ["baz"]
	});

will result in the following transformed HTML:

	<ul>
		<li>baz</li>
	</ul>

### Append

The `append` mode allows for the attachment of new JSON data to the *end* of a given HTML template.

#### Example

Consider the following HTML template snippet:

	<ul data-mode="append">
		<li></li>
	</ul>

and the following Javascript:

	$m({
		ul: ["foo", "bar"]
	});
	
	$m({
		ul: ["baz"]
	});

will result in the following transformed HTML:

	<ul>
		<li>foo</li>
		<li>bar</li>
		<li>baz</li>
	</ul>

### Prepend

The `prepend` mode allows for the attachment of new JSON data to the *beginning* of a given HTML template.

#### Example

Consider the following HTML template snippet:

	<ul data-mode="prepend">
		<li></li>
	</ul>

and the following Javascript:

	$m({
		ul: ["foo", "bar"]
	});
	
	$m({
		ul: ["baz"]
	});

will result in the following transformed HTML:

	<ul>
		<li>baz</li>
		<li>foo</li>
		<li>bar</li>
	</ul>

# Builtin custom renderers

`minimal.js` comes with three custom renderers in addition to its core functionality: `attr`, `children`, and `nano`. These are provided to cover more complex (*real*) template scenarios. Custom renderers are identified by the `data-render` attribute on HTML elements.

## Attr

The `attr` renderer provides binding facilities to element attributes. Example:

Consider the following HTML template snippet:

	<a data-render="attr"></a>

and the following Javascript:

	$m({
		a: { href: "http://foo.com", content: "foo" }
	});

will result in the following transformed HTML:

	<a data-render="attr" href="http://foo.com">foo</a>

> **Note:** this renderer applies the `content` directive to the HTML element's content.


## Children

The `children` renderer provides delegation of JSON data to a given HTML element's child elements. The JSON data can be either an `Array` (as exemplified below), an `Object` (where *keys* can be *id*, *class*, or *CSS selector* based), or atomic values.

Consider the following HTML template snippet:

	<div data-render="children">
		<h2></h2>
		<p></p>
	</div>

and the following Javascript:

	$m({
		div: ["header", "content"]
	});

will result in the following transformed HTML:

	<div data-render="children">
		<h2>header</h2>
		<p>content</p>
	</div>

## Nano

The `nano` renderer provides [nanotemplate.js](https://github.com/ruidlopes/nanotemplatejs) capabilities to `minimal.js`. Example:

Consider the following HTML template snippet:

	<p data-render="nano">$placeholder : $stuff</p>

and the following Javascript:

	$m({
		p: {
			placeholder: "this is some text",
			stuff: "some more text follows"
		}
	});

will result in the following transformed HTML:

	<p data-render="nano">this is some text : some more text follows</p>

For more information on how to use `nanotemplate.js`, please consult [its documentation](https://github.com/ruidlopes/nanotemplatejs).

<a name="Complex-example"></a>

# A more complex example

For reference purposes, please find below a more complex example usage of the `minimal.js` template engine, simulating a blog posts page.

Consider the following HTML template snippet:

	<h1 id="page-title"></h1>
	<ul id="posts">
		<li data-render="children">
			<h2 class="title" data-render="children"><a class="link" data-render="attr"></a></h2>
			<h3 class="date"></h3>
			<p class="content"></p>
		</li>
	</ul>

and the following Javascript:

	$m({
		"page-title": "A minimal.js blog",
		"posts": [
			{
				"title"  : { "link": { href: "/posts/2", content: "second post" } },
				"date"   : "Today",
				"content":  "Second post content"
			},
			{
				"title"  : { "link": { href: "/posts/1", content: "first post" } },
				"date"   : "Yesterday",
				"content":  "First post content"
			}
		]
	});

will result in the following transformed HTML:

	<h1 id="page-title">A minimal.js blog</h1>
	<ul id="posts">
		<li data-render="children">
			<h2 class="title" data-render="children"><a class="link" data-render="attr" href="/posts/2">second post</a></h2>
			<h3 class="date">Today</h3>
			<p class="content">Second post content</p>
		</li>
		<li data-render="children">
			<h2 class="title" data-render="children"><a class="link" data-render="attr" href="/posts/1">first post</a></h2>
			<h3 class="date">Yesterday</h3>
			<p class="content">First post content</p>
		</li>
	</ul>
	
<a name="Extending"></a>

# Extending with custom renderers

If the supplied functionality is limiting what you want to do with HTML templates and/or JSON data binding, you can extend `minimal.js` with your own renderers (or tailor existing ones to `minimal.js`'s *personality*). The `$m.custom` hashmap provides this functionality, as follows:

	$m.custom.name = function(json, element) { ... };

where `name` is a `string` to be matched at `data-render` attributes, which maps to a function that provides the custom templating functionality with the following parameters: `json` corresponds to JSON data to be bound, and `element` is a DOM element contextualising the custom renderer.

> **Note:** authors may delegate DOM elements to other renderers by invoking the `$m(json, element)` function where appropriate (yes, `$m` can take an additional `element` as the rendering context - please tell this to nobody).

Also, authors are *advised* to check for the presence of the `data-*` attributes (such as `data-mode`), and have their renderers act accordingly. An auxiliary function is provided for this feature, with the following signature:

 	$m.dataset(element, namespace)

Example to get the `mode` of a given element:

 	var mode = $m.dataset(document.getElementById("some-element"), "mode")

## Example

Consider the following HTML template snippet:

	<p data-render="foobar"></p>

and the following Javascript:

	$m.custom.foobar = function(json, element) {
		element.innerHTML = json + " foobar";
	};
	
	$m({ p: "this is" });

will result in the following transformed HTML:

	<p>this is foobar</p>

# Coming soon

(in no particular order)

* Further simplify the template language (there's some room for this on the `children` mode);
* Make `minimal.js` available via [npm](http://npmjs.org/);
* Template composition (*includes*, *partials*, etc.);
* Extendable `modes`;
* Conditionals (probably as extendable modes);
* Filters (probably as extendable modes);
* Sorting (probably as extendable modes).


# License

(The MIT License)

Copyright © 2011 Rui Lopes

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the ‘Software’), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


# Credits

These concepts were initially envisioned and proposed by [Mário Valente](http://mvalente.eu/), synthesised in a blog post entitled [Requirements for a Modern Web Development Framework](http://mvalente.eu/2009/11/25/requirements-for-a-modern-web-development-framework/), and further discussed and improved several times since. `minimal.js` is an attempt to provide one of the key pieces (another piece is [jassid](https://github.com/tarpipe/jassid)).

Parts of the templating strategy are inspired on [PURE](http://beebole.com/pure/) and [Chain.js](https://github.com/raid-ox/chain.js) template engines.