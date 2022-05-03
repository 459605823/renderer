import {unmount} from './utils';
interface Options {
  createElement: (tag: string) => any;
}

// 文本节点类型标记
export const Text = Symbol();
// Fragment节点类型标记
export const Fragment = Symbol();
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
    const {createText, setText, insert} = this.options;
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
    } else if (type === Text) {
      // 文本节点没有标签，所以type使用symbol进行标记
      if (!n1) {
        const el = (n2.el = createText(n2.children));
        insert(el, container);
      } else {
        const el = (n2.el = n1.el);
        if (n2.children !== n1.children) {
          // 更新文本节点内容
          setText(el, n2.children);
        }
      }
    } else if (type === Fragment) {
      // 片段节点本身不渲染任何内容，只需要处理他的子节点即可
      if (!n1) {
        (n2.children as VNODE[]).forEach((c) => this.patch(null, c, container));
      } else {
        this.patchChildren(n1, n2, container);
      }
    }
  }

  patchElement(n1: VNODE, n2: VNODE) {
    const {patchProps} = this.options;
    const el = (n2.el = n1.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    for (const key in newProps) {
      if (newProps[key] !== oldProps![key]) {
        patchProps(el, key, newProps[key]);
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps!)) {
        patchProps(el, key, null);
      }
    }

    this.patchChildren(n1, n2, el!);
  }

  patchChildren(n1: VNODE, n2: VNODE, el: IContainer) {
    const {setElementText} = this.options;
    // 判断新子节点类型是否为文本节点
    if (typeof n2.children === 'string') {
      // 此时需要先卸载旧的子节点
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      }
      setElementText(el, n2.children);
    } else if (Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        // diff
        n1.children.forEach((c) => unmount(c));
        n2.children.forEach((c) => this.patch(null, c, el));
      } else {
        // 此时说明旧的子节点为文本节点或者不存在
        // 都需要先将容器清空，然后将新的子节点一一挂载
        setElementText(el, '');
        n2.children.forEach((c) => this.patch(null, c, el));
      }
    } else {
      // 此时说明新子节点不存在
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      } else if (typeof n1.children === 'string') {
        setElementText(el, '');
      }
    }
  }

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
