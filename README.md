# ab-worker-prototype

A proof of concept implementation of the performant client-side A/B testing specification [as outlined in EXPLAINER.md](/EXPLAINER.md), using a CloudFlare Edge Worker.

## Proof-of-concept architecture

![architecture-diagram](/assets/images/arch.png)

To implement a proof of concept, we will use a CloudFlare Worker to apply the PRE_UA transforms. This could be any compute node — a connect middleware for an Express application, a proxy or an Edge at the boundaries of an Origin, or a CDN with compute capabilities (like CF workers) that can intercept a request to the origin, minimally parse and modify the HTML and apply the transformations. 

Internally, CloudFlare production is [said to](https://blog.cloudflare.com/html-parsing-1/) use [lol-html](https://github.com/cloudflare/lol-html), a low-latency HTML parser that supports streaming. A non-CloudFlare version of this prototype will have to employ a similar mechanism with same performance characteristics for this to function at scale. 

For the A/B configuration provider, we will make a pseudo-API out of GitHub gists — this would allow us to test multiple sites and variations without redeploying the CloudFlare worker. This will also mimic the real world dependency of an API call federation off the Edge/CDN/Server. We will use stale-while-revalidate (SWR) policy for the configuration fetch, which should be acceptable for most websites’ real A/B tests. 

In addition to that, the prototype edge also implements the following essential A/B testing functions:
 * Figure out if an A/B test configuration is in place for the requested URI, via consulting the pseudo API.
 * Randomly select the request into an experiment based on the configuration, and set a cookie to make the selection sticky.

## Sequence diagram

![Sequence diagram](/assets/images/sequence.svg)
