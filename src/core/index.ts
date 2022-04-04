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
        container.innerHTML = '';
      }
    }
    container._vnode = vnode;
  }

  patch(n1: VNODE | null, n2: VNODE, container: IContainer) {
    // 如果n1不存在，则为挂载操作
    if (!n1) {
      this.mountElement(n2, container);
    } else {
    }
  }

  mountElement(vnode: VNODE, container: IContainer) {
    const {createElement, insert, setElementText, patchProps} = this.options;
    const el = createElement(vnode.type);
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        this.patch(null, child, el);
      });
    }
    if (vnode.props) {
      for (const [key, value] of Object.entries(vnode.props)) {
        patchProps(el, key, value);
      }
    }
    insert(el, container);
  }
}
