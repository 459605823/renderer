type Children = string | VNODE[] | Array<string | VNODE>;

interface VNODE {
  type: any;
  children: string | VNODE[];
  props?: Record<string, any>;
  el?: IContainer;
}

interface IContainer extends HTMLElement {
  _vnode: VNODE;
}
