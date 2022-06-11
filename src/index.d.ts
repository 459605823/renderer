type Children = string | VNODE[] | Array<string | VNODE>;

interface setupContext {
  slots: any;
  emit: Function;
  attrs: Record<string, any>;
  expose: Function;
}

interface ComponentOption {
  name: string;
  props?: Record<string, any>;
  data?: () => Record<string, any>;
  // steup函数接收props和context两个参数，context包含slots、emit、attrs和expose
  // 可以返回一个函数作为组件的render函数或者返回一个对象，其中包含的数据将暴露给模板使用
  setup: (
    props?: Record<string, any>,
    context?: setupContext
  ) => (() => VNODE) | Record<string, any>;
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
