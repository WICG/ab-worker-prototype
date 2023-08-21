# Client A/B testing
Testing change.
Client A/B testing refers to the method of performing experimentation related
changes to a web application at runtime, typically within a browser.
This method of experimentation is popular in the industry as it is easier to
deploy, requires minimal to no engineering bandwidth for creating experiments
and is accessible to non-engineering personnel as well.

This incubation's objective is to devise methods of conducting the same outcome
with all its benefits offered, but without the performance penalties.

##  Goals

 * Standardize A/B transformation operations to a spec.
 * Enable application of experimentation changes at the Origin,
   an intermediary CDN/Edge/Proxy or the Browser.
 * Minimize or eliminate performance metrics degradation caused by
   application of changes in the browser through performant methods and
   through exploration of browser-native implementations.

## Explainers and presentations

 * [Explainer and supported operations](specs/EXPLAINER.md)
 * [WICG: A/B testing: updates - March 2023](https://docs.google.com/presentation/d/1WX-E63jL7ZwGf_jNszhfkdxsvzlXLdJdPMSTxK3X0A0/edit?usp=sharing)
 * [PerfWG: Client-side A/B testing - March 2022](https://docs.google.com/presentation/d/1-cxHITwVtWJ5x3ev0__XzDtDtJn2cB9CAgN9Mkia3Ag/edit?usp=sharing)
 * [Incubation proposal](https://github.com/WICG/proposals/issues/54)

## Directory structure

 * `specs/` folder ontains the latest specification and explainers.
 * `sdks/` contains sdks, libraries, etc.
 * `prototypes/` hosts current prototypes, demos and sdks.

## Contributing

Please see [How to Contribute](CONTRIBUTING.md).
