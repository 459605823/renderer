interface VNODE {
  type: string;
  props?: Record<string, any>;
  children: string | VNODE[];
}

interface IContainer extends HTMLElement {
  _vnode: VNODE;
}
