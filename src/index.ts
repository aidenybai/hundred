import { Block, Edit, Props, VElement, VNode } from './types';

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

// Represents a property access on `props`
// this.key is used to identify the property
// Imagine an instance of Hole as a placeholder for a value
class Hole {
  key: string;
  constructor(key: string) {
    this.key = key;
  }
}

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


  for (let i = 0; i < vnode.children.length; i++) {
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
