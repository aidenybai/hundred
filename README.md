# 💯 Hundred <img src="https://badgen.net/badgesize/brotli/https/unpkg.com/hundred?color=000000&labelColor=00000&label=bundle%20size" alt="Code Size" /> <a href="https://www.npmjs.com/package/hundred" target="_blank"><img src="https://img.shields.io/npm/v/hundred?style=flat&colorA=000000&colorB=000000" alt="NPM Version" /></a>

Hundred is intended to be a toy block virtual DOM based off of [Million.js](https://github.com/aidenybai/million), and is a proof-of-concept and a learning resource more than a tool you should actually use in production.

## Install Hundred

Inside your project directory, run the following command:

```sh
npm install hundred
```

## Usage

```js
import { h, block } from 'hundred';

const Button = block(({ number }) => {
  return h('button', null, number);
});

const button = Button({ number: 0 });

button.mount(document.getElementById('root'));

setInterval(() => {
  button.patch(Button({ number: Math.random() }));
}, 100);
```

## License

`hundred` is [MIT-licensed](LICENSE) open-source software by [Aiden Bai](https://github.com/aidenybai).
