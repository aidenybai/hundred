import { createElement, m, patch } from './vdom';

const el = createElement(m('div'));

document.body.appendChild(el);

setTimeout(() => {
  patch(el, m('div', null, ['Hello']), m('div'));
}, 1000);
