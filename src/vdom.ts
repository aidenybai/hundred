export const h = (tag, props = {}, ...children) => ({ tag, props, children });

export const createElement = (vnode) => {
  if (typeof vnode === 'string') return document.createTextNode(vnode);

  const el = document.createElement(vnode.tag);

  for (const prop in vnode.props) {
    el[prop] = vnode.props[prop];
  }

  for (const child of vnode.children) {
    el.appendChild(createElement(child));
  }

  return el;
};

export const patch = (el, newVNode, oldVNode) => {
  if (!newVNode) el.remove();
  if (typeof oldVNode === 'string' || typeof newVNode === 'string') {
    if (oldVNode !== newVNode) return el.replaceWith(createElement(newVNode));
  } else {
    if (oldVNode.tag !== newVNode.tag) {
      return el.replaceWith(createElement(newVNode));
    }

    for (const prop in { ...oldVNode.props, ...newVNode.props }) {
      if (newVNode.props[prop] === undefined) {
        delete el[prop];
      } else if (
        oldVNode.props[prop] === undefined ||
        oldVNode.props[prop] !== newVNode.props[prop]
      ) {
        el[prop] = newVNode.props[prop];
      }
    }
  }

  for (let i = oldVNode.children.length - 1; i >= 0; --i) {
    patch(el.childNodes[i], newVNode.children[i], oldVNode.children[i]);
  }
  for (let i = oldVNode.children.length; i < newVNode.children.length; i++) {
    el.appendChild(createElement(newVNode.children[i]));
  }
};
