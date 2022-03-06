# 💯 Hundred

### Hyper-lightweight Virtual DOM

`hundred` is intended to be the most lightweight virtual DOM implementation, and is a proof-of-concept and a learning resource more than a tool you should actually use in production.

Additionally, just because `hundred` is lightweight doesn't mean it's performant by any means. It is faster and smaller than [`simple-virtual-dom`](https://github.com/livoras/simple-virtual-dom), but ranks behind [production-ready Virtual DOM libraries](https://million.js.org/benchmarks/official-benchmarks)

> Note: If you're looking for something a bit more comprehensive, check out [Million](https://github.com/aidenybai/million)

## Installation

```sh
npm install hundred
```

## Usage

```js
import { h, createElement, patch } from 'hundred';

const el = createElement(h('div'));

patch(el, h('div', null, 'Hello World!'), h('div'));
```

`patch()` function has a standard interface that is used in many Virtual DOM libraries. First argument is a DOM node that will be used as the live DOM reference, and the second one is a Virtual DOM to render.

`h()` function will instantiate a "Virtual DOM" node for an element.

## License

`hundred` is [MIT-licensed](LICENSE) open-source software by [Aiden Bai](https://github.com/aidenybai).
