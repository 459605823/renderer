type Children = string | VNODE[] | Array<string | VNODE>;

interface ComponentOption {
  name: string;
  props?: Record<string, any>;
  data?: () => Record<string, any>;
  render: () => VNODE;
  beforeCreate?: () => void;
  created?: () => void;
  beforeMount?: () => void;
  mounted?: () => void;
  beforeUpdate?: () => void;
  updated?: () => void;
}

interface ComponentInstance {
  [key: string]: any;
}

interface VNODE {
  type: string | symbol | ComponentOption;
  children?: string | VNODE[];
  props?: Record<string, any>;
  el?: IContainer;
  key?: any;
  component?: ComponentInstance;
}

interface IContainer extends HTMLElement {
  _vnode: VNODE;
}
