# 💯 Hundred <img src="https://badgen.net/badgesize/brotli/https/unpkg.com/hundred?color=000000&labelColor=00000&label=bundle%20size" alt="Code Size" /> <a href="https://www.npmjs.com/package/hundred" target="_blank"><img src="https://img.shields.io/npm/v/hundred?style=flat&colorA=000000&colorB=000000" alt="NPM Version" /></a>

Hundred is intended to be a toy block virtual DOM based off of [Million.js](https://github.com/aidenybai/million), and is a proof-of-concept and a learning resource more than a tool you should actually use in production.

## How do I make a block virtual DOM?

Let's go through a tutorial on how to create Hundred!

**Recommended prerequisites**:

- [Read "How Million.js works"](https://millionjs.org/docs#how-does-it-work)
- [Add these types to your TypeScript file](https://github.com/aidenybai/hundred/blob/main/src/types.ts)

### Step 1: Create a `h` function

The `h` function allows us to create virtual nodes. It takes in a tag name, an object of attributes, and an array of children. It returns a virtual DOM node.

```typescript
// Helper function to create virtual dom nodes
// e.g. h('div', { id: 'foo' }, 'hello') => <div id="foo">hello</div>
export const h = (
  type: string,
  props: Props = {},
  ...children: VNode[]
): VElement => ({
  type,
  props,
  children,
});

console.log(h('div', { id: 'foo' }, 'hello'));
// gives us { type: 'div', props: { id: 'foo' }, children: ['hello'] }

console.log(h('div', { id: 'foo' }, h('span', null, 'hello')));
// gives us { type: 'div', props: { id: 'foo' }, children: [{ type: 'span', props: null, children: ['hello'] }] }
```

Essentially, the virtual nodes are just plain JavaScript objects that represent the DOM nodes we want to create.

### Step 2: Create a `block` function

Let's assume that the user will provide some function `fn` that takes in some props and returns a virtual node. Basically, the props represent the data, and the virtual node represents the view (establishes a one-way data flow).

```typescript
export const block = (fn: (props: Props) => VNode) => {
  // ...
};
```

One thing about block virtual DOM is that we can create a "mapping." Essentially, we need to figure out which props correspond to which virtual nodes. We can do this by passing a "getter" `Proxy` that will return a `Hole` (temporary placeholder for a future value) when we access a property.

```typescript
// Represents a property access on `props`
// this.key is used to identify the property
// Imagine an instance of Hole as a placeholder for a value
class Hole {
  key: string;
  constructor(key: string) {
    this.key = key;
  }
}

export const block = (fn: (props: Props) => VNode) => {
  // by using a proxy, we can intercept ANY property access on
  // the object and return a Hole instance instead.
  // e.g. props.any_prop => new Hole('any_prop')
  const proxy = new Proxy(
    {},
    {
      get(_, prop: string) {
        return new Hole(prop);
      },
    }
  );
  // we pass the proxy to the function, so that it can
  // replace property accesses with Hole placeholders
  const vnode = fn(proxy);

  // allows us to see instances of Hole inside the virtual node tree!
  console.log(vnode);

  // ...
};
```

## Step 3: Implementing a `render` function

Our barebones layout is effectively done, but now we need to implement static analysis to deal with those `Hole` placeholders. We can do this by creating a `render` function that takes in a virtual node and returns a real DOM node.

Let's start by just creating the base function that turns virtual nodes into real DOM nodes:

```typescript
// Converts a virtual dom node into a real dom node.
// It also tracks the edits that need to be made to the dom
export const render = (
  // represents a virtual dom node, built w/ `h` function
  vnode: VNode
): HTMLElement | Text => {
  if (typeof vnode === 'string') return document.createTextNode(vnode);

  const el = document.createElement(vnode.type);

  if (vnode.props) {
    for (const name in vnode.props) {
      const value = vnode.props[name];
      el[name] = value;
    }
  }

  for (let i = 0; i < vnode.children?.length; i++) {
    const child = vnode.children[i];
    el.appendChild(render(child));
  }

  return el;
};

console.log(render(h('div', { id: 'foo' }, 'hello')));
// gives us <div id="foo">hello</div>
```

Now, we need to add the static analysis part. We can do this by adding two new parameters: `edits` and `path`. `edits` is an array of `Edit`, which represents our "mapping." Each edit has data where the relevant DOM node is within the tree (via `path`), the key used to access `props` (via `hole`), the property name that we need to update (via `name`) if it is an attribute edit, and the index of the child (via `child`) if it is a child edit.

```typescript
// Converts a virtual dom node into a real dom node.
// It also tracks the edits that need to be made to the dom
export const render = (
  // represents a virtual dom node, built w/ `h` function
  vnode: VNode,
  // represents a list of edits to be made to the dom,
  // processed by identifying `Hole` placeholder values
  // in attributes and children.
  //    NOTE: this is a mutable array, and we assume the user
  //    passes in an empty array and uses that as a reference
  //    for the edits.
  edits: Edit[] = [],
  // Path is used to keep track of where we are in the tree
  // as we traverse it.
  // e.g. [0, 1, 2] would mean:
  //    el1 = 1st child of el
  //    el2 = 2nd child of el1
  //    el3 = 3rd child of el2
  path: number[] = []
): HTMLElement | Text => {
  if (typeof vnode === 'string') return document.createTextNode(vnode);

  const el = document.createElement(vnode.type);

  if (vnode.props) {
    for (const name in vnode.props) {
      const value = vnode.props[name];
      if (value instanceof Hole) {
        edits.push({
          type: 'attribute',
          path, // the path we need to traverse to get to the element
          attribute: name, // to set the value during mount/patch
          hole: value.key, // to get the value from props during mount/patch
        });
        continue;
      }
      el[name] = value;
    }
  }

  for (let i = 0; i < vnode.children?.length; i++) {
    const child = vnode.children[i];
    if (child instanceof Hole) {
      edits.push({
        type: 'child',
        path, // the path we need to traverse to get to the parent element
        index: i, // index represents the position of the child in the parent used to insert/update the child during mount/patch
        hole: child.key, // to get the value from props during mount/patch
      });
      continue;
    }
    // we respread the path to avoid mutating the original array
    el.appendChild(render(child, edits, [...path, i]));
  }

  return el;
};
```

## Step 4: Implementing a `mount` and `patch` function for blocks

Now that we have a `render` function that can handle `Hole` placeholders, we can implement a `mount` function that takes in a virtual node and mounts it to the DOM. We can also implement a `patch` function that takes in a new virtual node and patches the DOM with the new changes.

There are some notable differences between `mount` and `patch`:

Within `mount`, we will create a copy of the DOM node that `render` produces. This is because we want to keep the original DOM node around so that we can use it to patch the DOM later. Also, we need to track element references for each Edit so that we can use them to patch the DOM later.

Within `patch`, we will use the original DOM node that we created in `mount` to patch the DOM. This is different because `mount` will insert or create new nodes, while `patch` will only update existing nodes.

```typescript
// block is a factory function that returns a function that
// can be used to create a block. Imagine it as a live instance
// you can use to patch it against instances of itself.
export const block = (fn: (props: Props) => VNode) => {
  // by using a proxy, we can intercept ANY property access on
  // the object and return a Hole instance instead.
  // e.g. props.any_prop => new Hole('any_prop')
  const proxy = new Proxy(
    {},
    {
      get(_, prop: string) {
        return new Hole(prop);
      },
    }
  );
  // we pass the proxy to the function, so that it can
  // replace property accesses with Hole placeholders
  const vnode = fn(proxy);

  // edits is a mutable array, so we pass it by reference
  const edits: Edit[] = [];
  // by rendering the vnode, we also populate the edits array
  // by parsing the vnode for Hole placeholders
  const root = render(vnode, edits);

  // factory function to create instances of this block
  return (props: Props): Block => {
    // elements stores the element references for each edit
    // during mount, which can be used during patch later
    const elements = new Array(edits.length);

    // mount puts the element for the block on some parent element
    const mount = (parent: HTMLElement) => {
      // cloneNode saves memory by not reconstrcuting the dom tree
      const el = root.cloneNode(true);
      // we assume our rendering scope is just one block
      parent.textContent = '';
      parent.appendChild(el);

      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        // walk the tree to find the element / hole
        let thisEl = el;
        // If path = [1, 2, 3]
        // thisEl = el.childNodes[1].childNodes[2].childNodes[3]
        for (let i = 0; i < edit.path.length; i++) {
          thisEl = thisEl.childNodes[edit.path[i]];
        }

        // make sure we save the element reference
        elements[i] = thisEl;

        // this time, we can get the value from props
        const value = props[edit.hole];

        if (edit.type === 'attribute') {
          thisEl[edit.attribute] = value;
        } else if (edit.type === 'child') {
          const textNode = document.createTextNode(value);
          thisEl.insertBefore(textNode, thisEl.childNodes[edit.index]);
        }
      }
    };

    // patch updates the element references with new values
    const patch = (newBlock: Block) => {
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        const value = props[edit.hole];
        const newValue = newBlock.props[edit.hole];

        // dirty check
        if (value === newValue) continue;

        const thisEl = elements[i];

        if (edit.type === 'attribute') {
          thisEl[edit.attribute] = newValue;
        } else if (edit.type === 'child') {
          thisEl.childNodes[edit.index].textContent = newValue;
        }
      }
    };

    return { mount, patch, props, edits };
  };
};
```

This is great, but it's not really a virtual DOM–it only allows us to create one block and patch it against itself. Oftentimes, we want to construct these blocks into trees.

So, let's add a special case for block values in props.

```typescript
// block is a factory function that returns a function that
// can be used to create a block. Imagine it as a live instance
// you can use to patch it against instances of itself.
export const block = (fn: (props: Props) => VNode) => {
  // by using a proxy, we can intercept ANY property access on
  // the object and return a Hole instance instead.
  // e.g. props.any_prop => new Hole('any_prop')
  const proxy = new Proxy(
    {},
    {
      get(_, prop: string) {
        return new Hole(prop);
      },
    }
  );
  // we pass the proxy to the function, so that it can
  // replace property accesses with Hole placeholders
  const vnode = fn(proxy);

  // edits is a mutable array, so we pass it by reference
  const edits: Edit[] = [];
  // by rendering the vnode, we also populate the edits array
  // by parsing the vnode for Hole placeholders
  const root = render(vnode, edits);

  // factory function to create instances of this block
  return (props: Props): Block => {
    // elements stores the element references for each edit
    // during mount, which can be used during patch later
    const elements = new Array(edits.length);

    // mount puts the element for the block on some parent element
    const mount = (parent: HTMLElement) => {
      // cloneNode saves memory by not reconstrcuting the dom tree
      const el = root.cloneNode(true);
      // we assume our rendering scope is just one block
      parent.textContent = '';
      parent.appendChild(el);

      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        // walk the tree to find the element / hole
        let thisEl = el;
        // If path = [1, 2, 3]
        // thisEl = el.childNodes[1].childNodes[2].childNodes[3]
        for (let i = 0; i < edit.path.length; i++) {
          thisEl = thisEl.childNodes[edit.path[i]];
        }

        // make sure we save the element reference
        elements[i] = thisEl;

        // this time, we can get the value from props
        const value = props[edit.hole];

        if (edit.type === 'attribute') {
          thisEl[edit.attribute] = value;
        } else if (edit.type === 'child') {
          // handle nested blocks if the value is a block
          if (value.mount && typeof value.mount === 'function') {
            value.mount(thisEl);
            continue;
          }

          const textNode = document.createTextNode(value);
          thisEl.insertBefore(textNode, thisEl.childNodes[edit.index]);
        }
      }
    };

    // patch updates the element references with new values
    const patch = (newBlock: Block) => {
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        const value = props[edit.hole];
        const newValue = newBlock.props[edit.hole];

        // dirty check
        if (value === newValue) continue;

        const thisEl = elements[i];

        if (edit.type === 'attribute') {
          thisEl[edit.attribute] = newValue;
        } else if (edit.type === 'child') {
          // handle nested blocks if the value is a block
          if (value.patch && typeof value.patch === 'function') {
            // patch cooresponding child blocks
            value.patch(newBlock.edits[i].hole);
            continue;
          }
          thisEl.childNodes[edit.index].textContent = newValue;
        }
      }
    };

    return { mount, patch, props, edits };
  };
};
```

If you want to view the full source code, check out [src/index.ts](https://github.com/aidenybai/hundred/blob/main/src/index.ts).

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
