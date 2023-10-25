# Client-Side A/B testing

Client side A/B testing refers to the method of performing experimentation related changes to a web application in the browser — sometimes without integrating code changes to the actual application source code. This is popular in the industry as the method usually helps to cut down resources required for experimentation. Our objective is to explore ways of conducting the same outcome, without the performance penalties it comes with today.

## Overview

The key to the approach being outlined here is considering **_control_** as the base document, and expressing each **_variant_** as a series of transformations being applied onto control.

This is analogous to how client side A/B testing is conducted today — except we want to improve it further and make it more performant. How do we do that?

1.  Standardize the serialization of changes to a common schema.

2.  Whenever possible, optimize for applying a transformation where it makes the best sense (pre-UA, or on-UA). This helps to:

    a. reduce the bytes transferred,
    b. potentially improve cache hit rates at serving
    c. reduce computation needs on each client.

3.  Apply transformations in a performant way, without blocking rendering of the page — ideally without any performance metric degradation.

## Standardizing the representation of transformations

We could represent the transformations required for reaching a variant as a serialization of an ordered set of operations as follows:

```javascript
[
  [flags, selector, operation, ...payload],
  [flags, selector, operation, ...payload],
  ...
]
```

where each field can be defined as follows

<table>
  <tr>
   <td><code>flags</code>
   </td>
   <td>A bit field that indicates the type of transformation.
   For an initial version, we can support the following flags:
    <table style="width: auto;">
      <tr>
      <td><code>0x1</code>
      </td>
      <td><code>PRE_UA</code>
      </td>
      <td>Transform can be applied on the server, or prior to UA parsing.
      <br>It could be done at a CDN/Edge, or at the Origin server itself.
    <br>
    <br>
    Most of the static document transformations would use this flag.
      </td>
      </tr>
      <tr>
      <td><code>0x2</code>
      </td>
      <td><code>ON_UA</code>
      </td>
      <td>Transform can be applied on the User Agent/the browser. <br>
      Unless combined with the <code>ONCE</code> flag below, the transformation is <br>
      expected to be continuous — i.e., it is applicable any time during the <br>
      web application lifecycle within the UA.<br>
      </td>
      </tr>
      <tr>
      <td><code>0x4</code>
      </td>
      <td><code>ONCE</code>
      </td>
      <td>Transform needs to be applied only once, after which it can be <br>
      discarded to free up memory and computational resources. <br>
      </td>
      </tr>
    </table>
   </td>
  </tr>
  <tr>
   <td><code>selector</code></td>
   <td>A CSS selector that targets the `HTMLElement` for transformation.
   Depending on the target platform and capability, only a subset of
   CSS selectors might be applicable here (and that needs to be
   documented and revisioned as the support changes).
   </td>
  </tr>
  <tr>
   <td><code>operation<code></td>
   <td>A numeric value indicating the operation to be performed.
   For a list of operations and their supported parameters, see the section
   "Operations" below.

   <br>
   The operations are expected to be idempotent, i.e., repeated
   applications of the operations should be possible and not have
   unintended side effects.
   </td>
  </tr>
  <tr>
   <td><code>payload</code></td>
   <td>A variable number of arguments to support the operation.
   Should follow the specification of the operation used.
   </td>
  </tr>
</table>

# Operations

<table>
  <tr>
   <td style="background-color: #d9d9d9">Operation</td>
   <td style="background-color: #d9d9d9">Code</td>
   <td style="background-color: #d9d9d9">Description</td>
  </tr>
  <tr>
   <td>OP_CUSTOM_JS</td>
   <td>0</td>
   <td>Executes a custom Javascript block of code against the element.
<p>

Arguments:

`code`: Javascript code serialized as a string. The applicator code will call this code as a function ($) => code, $ referring to the element selected.
   </td>
  </tr>
  <tr>
   <td>OP_INSERT_BEFORE</td>
   <td>1</td>
   <td>Inserts content right before the element.
<p>

Arguments:

`content`: HTML markup
   </td>
  </tr>
  <tr>
   <td>OP_INSERT_AFTER</td>
   <td>2</td>
   <td>Inserts content right after the element.
<p>

Arguments:

<p>
`content`: HTML markup
   </td>
  </tr>
  <tr>
   <td>OP_PREPEND</td>
   <td>3</td>
   <td>Inserts content right after the start tag of the element.
<p>

Arguments:

<p>
`content`: HTML markup
   </td>
  </tr>
  <tr>
   <td>OP_APPEND</td>
   <td>4</td>
   <td>Inserts content right before the end tag of the element.
<p>

Arguments:

<p>
`content`: HTML markup
   </td>
  </tr>
  <tr>
   <td>OP_REPLACE</td>
   <td>5</td>
   <td>Replaces the element with the provided content.
<p>

Arguments:

<p>
`content`: HTML markup
   </td>
  </tr>
  <tr>
   <td>OP_SET_INNERHTML</td>
   <td>6</td>
   <td>Replaces the content of the element with provided content.
<p>

Arguments:

<p>
`content`: HTML markup
   </td>
  </tr>
  <tr>
   <td>OP_REMOVE</td>
   <td>7</td>
   <td>Removes the element and its children
<p>

Arguments:

<p>
none.
   </td>
  </tr>
  <tr>
   <td>OP_SET_ATTRIBUTE</td>
   <td>8</td>
   <td>Sets an attribute’s value on the element.
<p>

Arguments:

<p>
`name`: Name of the attribute
<p>
`value`: Value to be set on the attribute.
   </td>
  </tr>
  <tr>
   <td>OP_REDIRECT</td>
   <td>9</td>
   <td>Redirect the user to a different page or URL. During `PRE_UA` phase, this will perform an HTTP redirect and during `ON_UA`, this will result in client side redirection. Additional arguments supplied can select the response code during PRE_UA phase.
<p>

Arguments:

<p>
`URL`: URL to redirect the page to.
`code`: HTTP code to use for redirection during PRE_UA phase.
   </td>
  </tr>
</table>


# Components of a solution, and their roles

1. A `PRE_UA` component — responsible for applying static markup transformations, and injecting the necessary `ON_UA` components into the document.
2. An `ON_UA` component — responsible for client-side transformations.
3. The set serialized transformations.

## `PRE_UA` components

A `PRE_UA` component is responsible for applying the transformations flagged as `PRE_UA`, i.e., the transforms that make best sense to be applied before User-Agent. This could be done at:
1. the Origin itself, or
2. an Edge component at the Origin (like a web server plugin, or a proxy), or
3. a CDN compute node that fronts the Origin as a proxy, or
4. an implementation inside the UA/Browser prior to parsing the document (this has a latency impact).

The important aspect is that the `PRE_UA` transformations are best done at a step prior to UA’s parsing.

`PRE_UA` component has the following responsibilities:

*   Apply all of the `PRE_UA` transformations for the selected experiment, onto the response.
*   Collect the remaining `ON_UA` transformations if any, and serialize them along with the client-side transform applicator code. Inject this into the `HEAD` of the document.

# `ON_UA` components

The client-side/`ON_UA` components are responsible for applying `ON_UA` transformations as necessary, and consists of two parts:

1. The remaining `ON_UA` transformations from the experiment configuration.
2. The client side transformation applicator code.

## Client-side transform applicator

The applicator component injected into the `HEAD` of the document has the following parts to it:

*   A `MutationObserver` client code that listens for DOM changes.
*   The listening code looks for DOM changes that match the `ON_UA` selectors, as (1) the browser is parsing the document, or (2) the client side Javascript is making changes to the DOM.
*   One or more identified DOM mutations that match the selectors are queued and deferred for processing until the next repaint, via a `requestAnimationFrame` callback.
*   The queue is processed, applying each `ON_UA` transformation as needed — via running the matching `DOMElement` through the supplied transformation function.


### An example client-side transform applicator

A simple implementation could be as follows:

```
(function applyTransformations(transformations) {
  const transform = (target) => {
    if (target.nodeType !== 1) return;
    for (const [flags, selector, transform] of transformations) {
      if (!(flags & ON_UA) || !transform) continue;
      const node = target.querySelector(selector);
      if (!node) continue;
      try {
        transform(node);
      } catch (e) { /* report back transform error */ }
    }
  }

  const queue = new Set();
  const processMutationsOnPaint = () => {
    for (const target of queue) {
      transform(target);
      queue.delete(target);
    }
  }

  var observer = new MutationObserver(function(mutations){
    for (const {target} of mutations) {
      if (!queue.size) requestAnimationFrame(processMutationsOnPaint);
      queue.add(target);
    }
  });

  return observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})([ /* Array of transformations */ ]);
```

The code example above doesn’t account for any selector performance optimizations, or error reporting.

This block results in approximately 365 bytes of minified code when processed via terser, and forms the _Client-side Transform Applicator_.

# References

*   [WebPerfWG Open meeting notes 2021-02-04](https://w3c.github.io/web-performance/meetings/2021/2021-02-04/index.html)
*   [A/B Testing at the Edge with Servers Workers](https://www.filamentgroup.com/lab/servers-workers.html)
*   [Performant A/B Testing with Cloudflare Workers](https://philipwalton.com/articles/performant-a-b-testing-with-cloudflare-workers/)
*   [A History of HTML Parsing at Cloudflare: Part 1](https://blog.cloudflare.com/html-parsing-1/)
*   [The Case Against Anti-Flicker Snippets](https://andydavies.me/blog/2020/11/16/the-case-against-anti-flicker-snippets/)
*   [How CSS opacity animations can delay the Largest Contentful Paint](https://www.debugbear.com/blog/opacity-animation-poor-lcp)