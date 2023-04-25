// Standard types for the virtual DOM
type Props = Record<string, any>;
interface VElement {
  type: string;
  props: Props;
  children: VNode[];
}
type VNode = VElement | string;

export const h = (
  type: string,
  props: Props = {},
  ...children: VNode[]
): VElement => ({
  type,
  props,
  children,
});

// Edits: these identify "holes" in the virutal dom at specific points.
// Later, can be used to patch the real dom.
interface EditAttribute {
  type: 'attribute';
  path: number[]; // walk path to the element / hole
  propName: string;
  hole: any; // prop key of the hole (e.g. prop.name => "name")
}

interface EditText {
  type: 'text';
  path: number[];
  index: number;
  hole: any;
}

type Edit = EditAttribute | EditText;

// contains the prop key of the hole
class Hole {
  key: string;
  constructor(key: string) {
    this.key = key;
  }
}

// Turns the virtual dom into a real dom, and collects edits along the way.
// Edits are used to patch the real dom later.
export const render = (
  vnode: VNode,
  edits: Edit[] = [],
  path: number[] = []
): HTMLElement | Text => {
  if (typeof vnode === 'string') return document.createTextNode(vnode);

  const el = document.createElement(vnode.type);

  if (vnode.props) {
    for (const prop in vnode.props) {
      const propValue = vnode.props[prop];
      if (propValue instanceof Hole) {
        edits.push({
          type: 'attribute',
          path,
          propName: prop,
          hole: propValue.key,
        });
        continue;
      }
      el[prop] = propValue;
    }
  }

  for (let i = 0; i < vnode.children?.length; i++) {
    const child = vnode.children[i];
    if (child instanceof Hole) {
      edits.push({
        type: 'text',
        path,
        index: i,
        hole: child.key,
      });
      continue;
    }
    // we use the path to keep track of where we are in the tree
    el.appendChild(render(child, edits, [...path, i]));
  }

  return el;
};

interface BlockInstance {
  props: Props;
  mount: (parent: HTMLElement) => void;
  patch: (newBlock: BlockInstance) => void;
}

export const block = (fn: (props: Props) => VNode) => {
  const proxy = new Proxy(
    {},
    {
      get(_, prop: string) {
        return new Hole(prop);
      },
    }
  );
  const edits: Edit[] = [];
  const vnode = fn(proxy);
  const root = render(vnode, edits);

  const Block = (props: Props): BlockInstance => {
    const cachedElements = new Map<number, Node>();
    const mount = (parent: HTMLElement) => {
      const el = root.cloneNode(true);
      parent.appendChild(el);

      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        // walk the tree to find the element / hole
        let currentEl = el;
        for (let i = 0; i < edit.path.length; i++) {
          currentEl = currentEl.childNodes[edit.path[i]];
        }
        cachedElements.set(i, currentEl);

        const value = props[edit.hole];

        if (edit.type === 'attribute') {
          currentEl[edit.propName] = value;
        } else if (edit.type === 'text') {
          const textNode = document.createTextNode(value);
          currentEl.insertBefore(textNode, currentEl.childNodes[edit.index]);
        }
      }
    };

    const patch = (newBlock: BlockInstance) => {
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        const value = props[edit.hole];
        const newValue = newBlock.props[edit.hole];

        if (value === newValue) continue;

        const currentEl = cachedElements.get(i)!;

        if (edit.type === 'attribute') {
          currentEl[edit.propName] = newValue;
        } else if (edit.type === 'text') {
          currentEl.childNodes[edit.index].textContent = newValue;
        }
      }
    };

    return { mount, patch, props };
  };

  return Block;
};
