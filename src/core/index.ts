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

  patch(
    n1: VNODE | null,
    n2: VNODE,
    container: IContainer,
    anchor: Node | null = null
  ) {
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
        this.mountElement(n2, container, anchor);
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
      // diff
      this.keyedDiff(n1, n2, el);
    } else {
      // 此时说明新子节点不存在
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      } else if (typeof n1.children === 'string') {
        setElementText(el, '');
      }
    }
  }

  keyedDiff(n1: VNODE, n2: VNODE, el: IContainer) {
    const {insert} = this.options;
    const oldChildren = n1.children as VNODE[];
    const newChildren = n2.children as VNODE[];

    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;

    let oldStartVNode = oldChildren[oldStartIdx];
    let oldEndVNode = oldChildren[oldEndIdx];
    let newStartVNode = newChildren[newStartIdx];
    let newEndVNode = newChildren[newEndIdx];
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVNode) {
        oldStartVNode = oldChildren[++oldStartIdx];
      } else if (!oldEndVNode) {
        oldEndVNode = oldChildren[--oldEndIdx];
      } else if (oldStartVNode.key === newStartVNode.key) {
        this.patch(oldStartVNode, newStartVNode, el);
        oldStartVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (oldEndVNode.key === newEndVNode.key) {
        this.patch(oldEndVNode, newEndVNode, el);
        oldEndVNode = oldChildren[--oldEndIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (oldStartVNode.key === newEndVNode.key) {
        this.patch(oldStartVNode, newEndVNode, el);
        insert(oldStartVNode.el, el, oldEndVNode.el?.nextSibling);
        oldStartVNode = oldChildren[++oldStartIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (oldEndVNode.key === newStartVNode.key) {
        this.patch(oldEndVNode, newStartVNode, el);
        insert(oldEndVNode.el, el, oldStartVNode.el);
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else {
        // 遍历旧 children，试图寻找与 newStartVNode 拥有相同 key 值的元素
        const idxInOld = oldChildren.findIndex(
          (node) => node.key === newStartVNode.key
        );
        if (idxInOld > 0) {
          const vnodeToMove = oldChildren[idxInOld];
          this.patch(vnodeToMove, newStartVNode, el);
          // 将该节点移到头部
          insert(vnodeToMove.el, el, oldStartVNode.el);
          //@ts-ignore
          oldChildren[idxInOld] = undefined;
        } else {
          // 如果在找不到旧节点中找不到可复用的节点，说明该节点为新节点
          // 由于该节点为头节点，所以将其作为新的头部节点进行挂载
          this.patch(null, newStartVNode, el, oldStartVNode.el);
        }
      }
    }
    // 处理遗漏的节点
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
      // 添加新节点
      for (let i = newStartIdx; i <= newEndIdx; i++) {
        this.patch(null, newChildren[i], el, oldStartVNode.el);
      }
    } else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
      // 移除操作
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        unmount(oldChildren[i]);
      }
    }
  }

  easyDiff(n1: VNODE, n2: VNODE, el: IContainer) {
    const {insert} = this.options;
    const oldChildren = n1.children as VNODE[];
    const newChildren = n2.children as VNODE[];
    // 保存查找到的最大索引值
    let lastIndex = 0;

    for (let i = 0; i < newChildren.length; i++) {
      const newVNode = newChildren[i];
      let j = 0;
      // 标志是否在旧节点中找到可以复用的节点
      let find = false;
      // 遍历旧的 children
      for (j; j < oldChildren.length; j++) {
        const oldVNode = oldChildren[j] as VNODE;
        // 如果找到了具有相同 key 值的两个节点，则调用 `patch` 函数更新之
        if (newVNode.key === oldVNode.key) {
          find = true;
          this.patch(oldVNode, newVNode, el);
          // 如果当前找到的节点在旧childern中的索引小于最大索引值，说明需要移动
          if (j < lastIndex) {
            // 先找到当前节点在新childern中的前一个节点
            const prevVNode = newChildren[i - 1];
            // 如果prevVNode为null，则说明该节点为第一个节点，不需要移动
            if (prevVNode) {
              const anchor = prevVNode.el!.nextSibling;
              insert(newVNode.el, el, anchor);
            }
          } else {
            // 更新 lastIndex
            lastIndex = j;
          }
          break; // 这里需要 break
        }
      }
      // 如果没有找到可复用的节点，则该节点为新增节点，需要挂载
      if (!find) {
        const prevVNode = newChildren[i - 1];
        let anchor = null;
        if (prevVNode) {
          anchor = prevVNode.el!.nextSibling;
        } else {
          anchor = el.firstChild;
        }
        this.patch(null, newVNode, el, anchor);
      }
    }
    // 更新结束后再遍历一次旧节点，如果在新节点中没找到相同key值的节点，则说明需要删除该节点
    for (let i = 0; i < oldChildren.length; i++) {
      const oldVNode = oldChildren[i] as VNODE;
      const has = newChildren.find((vnode) => vnode.key === oldVNode.key);
      if (!has) {
        unmount(oldVNode);
      }
    }
  }

  mountElement(vnode: VNODE, container: IContainer, anchor: Node | null) {
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
    insert(el, container, anchor);
  }
}
