import {unmount} from './utils';

interface Options {
  createElement: (tag: string) => any;
}

export default class Renderer {
  options: Options & Record<string, any>;

  constructor(options: Options & Record<string, any>) {
    this.options = options;
  }

  render(vnode: VNODE, container: IContainer) {
    if (vnode) {
      this.patch(container._vnode, vnode, container);
    } else {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode);
      }
    }
    container._vnode = vnode;
  }

  patch(n1: VNODE | null, n2: VNODE, container: IContainer) {
    if (n1 && n1.type !== n2.type) {
      // 如果新旧vnode的类型不同，则先将旧vnode卸载
      unmount(n1);
      n1 = null;
    }
    const {type} = n2;
    if (typeof type === 'string') {
      // 如果n1不存在，则为挂载操作
      if (!n1) {
        this.mountElement(n2, container);
      } else {
        this.patchElement(n1, n2);
      }
    } else if (typeof type === 'object') {
    }
  }

  patchElement(n1: VNODE, n2: VNODE) {}

  mountElement(vnode: VNODE, container: IContainer) {
    const {createElement, insert, setElementText, patchProps} = this.options;
    // 让vnode.el引用真实DOM元素
    const el = (vnode.el = createElement(vnode.type));
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        this.patch(null, child, el);
      });
    }
    // 处理元素属性
    if (vnode.props) {
      for (const [key, value] of Object.entries(vnode.props)) {
        patchProps(el, key, value);
      }
    }
    insert(el, container);
  }
}
