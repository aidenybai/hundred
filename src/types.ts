export interface VElement {
  type: string;
  props: Props;
  children: VNode[];
}
export type VNode = VElement | string;
export type Props = Record<string, any>;

export interface EditAttribute {
  type: 'attribute';
  path: number[];
  attribute: string;
  hole: string;
}

export interface EditText {
  type: 'child';
  path: number[];
  index: number;
  hole: string;
}

export type Edit = EditAttribute | EditText;

export interface Block {
  props: Props;
  edits: Edit[];
  mount: (parent: HTMLElement) => void;
  patch: (newBlock: Block) => void;
}
