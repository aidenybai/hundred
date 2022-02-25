# 🪶 `tiny-vdom`

### Hyper-lightweight Virtual DOM

`tiny-vdom` is intended to be the most lightweight virtual DOM implementation, and is a proof-of-concept and a learning resource more than a tool you should actually use in production.

> Note: If you're looking for something a bit more comprehensive, check out [Million](https://github.com/aidenybai/million)

## Installation

```sh
npm install tiny-vdom
```

## Usage

`index.js`

```js
import { h, createElement, patch } from 'tiny-vdom';

const el = createElement(h('div'));

patch(el, h('div', null, 'Hello World!'), h('div'));
```

## License

`tiny-vdom` is [MIT-licensed](LICENSE) open-source software by [Aiden Bai](https://github.com/aidenybai).
