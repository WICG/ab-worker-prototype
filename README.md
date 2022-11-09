# ab-worker-prototype

A proof of concept implementation of the performant client-side A/B testing specification [as outlined in `EXPLAINER.md`](/EXPLAINER.md), using a CloudFlare Edge Worker.

## Architecture

![architecture-diagram](/assets/images/arch.png)

To implement a proof of concept, we will use a CloudFlare Worker to apply the `PRE_UA` transforms. Alternatively, this could be any compute node that can act as a proxy — a connect middleware for an Express.js frontend application, a proxy or an Edge at the boundaries of an Origin, or a CDN with compute capabilities (like CF workers). The proxy should be able to intercept a request to the origin, minimally parse and modify the HTML and apply the transformations. 

Internally, CloudFlare production is [said to](https://blog.cloudflare.com/html-parsing-1/) use [lol-html](https://github.com/cloudflare/lol-html), a low-latency HTML parser that supports streaming. A non-CloudFlare version of this prototype will have to employ a similar mechanism with same performance characteristics for this to function at scale. 

For the A/B configuration provider, we will make a pseudo-API out of GitHub gists — this would allow us to test multiple sites and variations without redeploying the CloudFlare worker. This will also mimic the real world dependency of an API call federation off the Edge/CDN/Server. We will use stale-while-revalidate (SWR) policy for the configuration fetch, which should be acceptable for most websites’ real A/B tests. 

In addition to that, the prototype edge also implements the following essential A/B testing functions:
 * Figure out if an A/B test configuration is in place for the requested URI, via consulting the pseudo API.
 * Randomly select the request into an experiment based on the configuration, and set a cookie to make the selection sticky.

## Sequence diagram

![Sequence diagram](/assets/images/sequence.svg)

## Demo

For a demo, we're going to A/B test ToDoMVC, that is built using React as a client-side SPA. 

The following A/B test configuration consists of transformations that create a randomized experiment for 50% of the traffic:
  * Change background-color of the page to _`beige`_. Since this is best done on the static markup, we'd like to do have this transformation applied before UA.
  * Change heading (H1) to "_a/b test h1_".
  * Change the placeholder text of the text box to "_What would you like to do today?_"
  * Color the first todo item _`red`_.

In addition, we'll also inject correct `<base>` tag to make relative URLs work, and `<link rel=canonical>` tag to avoid getting our prototype indexed as a duplicate.

```javascript
const experimentConfigJson = {
  "control": {
    "url": "https://todomvc.com/examples/react", 
    "cache": {
    }
  },
  "variants": [
    {
      "weight": 0.5,
      "url": "https://todomvc.com/examples/react", 
      "transformations": [
        [1 /* PRE_UA */, "head", 3 /* OP_PREPEND */, 
          "<base href=\"https://todomvc.com/examples/react/\" target=\"_blank\">"],
        [1 /* PRE_UA */, "head", 3 /* OP_PREPEND */, 
          "<link rel=\"canonical\" href=\"https://todomvc.com/examples/react/\" />"]
      ]
    },    
    {
      "weight": 0.5,
      "url": "https://todomvc.com/examples/react", 
      "transformations": [
        [1 /* PRE_UA */, "head", 3 /* OP_PREPEND */, 
          "<base href=\"https://todomvc.com/examples/react/\" target=\"_blank\">"],
        [1 /* PRE_UA */, "head", 3 /* OP_PREPEND */, 
          "<link rel=\"canonical\" href=\"https://todomvc.com/examples/react/\" />"],
        [1 /* PRE_UA */, "head", 4 /* OP_APPEND */, 
          "<style>body{background:beige!important}</style>"],
        [2 /* ON_UA */, "h1", 0 /* OP_CUSTOM_JS */,  
          "$.innerHTML=\"a/b test h1\";"],
        [2 /* ON_UA */, ".new-todo", 0 /* OP_CUSTOM_JS */, 
          "$.placeholder=\"What would you like to do today?\""],
        [2 /* ON_UA */, ".todo-list>li", 0 /* OP_CUSTOM_JS */, 
          "$.style.color=\"red\""]
      ]
    }
  ]
}
```

The prototype deployed on CloudFlare Edge can be accessed at:
  * [Control](https://ab-worker.alexnj.workers.dev/?experiment=todomvc-v01.json&force=0)
  * [Experiment](https://ab-worker.alexnj.workers.dev/?experiment=todomvc-v01.json&force=1)
  * [Select one of them at random](https://ab-worker.alexnj.workers.dev/?experiment=todomvc-v01.json)

Configuration for running this experiment is [hosted as a gist](https://gist.github.com/alexnj/4c8d9198d16b238e4c7040250f052284#file-todomvc-v01-json).

### Performance comparison

#### WebPageTest

![Filmstrip](/assets/images/filmstrip.png)

[Comparison with more stats here](https://webpagetest.org/video/compare.php?tests=220128_AiDcKT_e71a33f6dd31af1157630f95377bbb4c,220128_BiDcH4_8af7080f26f4bc2f030ccce7e2695045).