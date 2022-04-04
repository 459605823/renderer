interface VNODE {
  type: any;
  children: string | VNODE[];
  props?: Record<string, any>;
  el?: HTMLElement;
}

interface IContainer extends HTMLElement {
  _vnode: VNODE;
}
