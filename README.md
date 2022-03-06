# 💯 Hundred <img src="https://badgen.net/badgesize/brotli/https/unpkg.com/hundred?color=000000&labelColor=00000&label=bundle%20size" alt="Code Size" /> <a href="https://www.npmjs.com/package/hundred" target="_blank"><img src="https://img.shields.io/npm/v/hundred?style=flat&colorA=000000&colorB=000000" alt="NPM Version" /></a>

### `<1kb` Hyper-lightweight Virtual DOM

Hundred is intended to be the **most lightweight (`<1kb`) virtual DOM** implementation, and is a proof-of-concept and a learning resource more than a tool you should actually use in production.

Additionally, just because Hundred is lightweight doesn't mean it's performant by any means. It is **faster and smaller** than [`simple-virtual-dom`](https://github.com/livoras/simple-virtual-dom), but ranks behind [production-ready Virtual DOM libraries](https://million.js.org/benchmarks/official-benchmarks).

> If you're looking for something a bit more comprehensive, check out [**Million**](https://github.com/aidenybai/million) — Virtual DOM into the future! 💥🦁✨
>
> -Aiden ([@aidenybai](https://github.com/aidenybai))

## Install Hundred

Inside your project directory, run the following command:

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
