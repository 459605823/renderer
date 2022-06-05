import {unmount, lis, resolveProps, hasPropsChanged} from './utils';
import {reactive, effect, shallowReactive} from '@vue/reactivity';
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
    } else if (typeof type === 'object') {
      if (!n1) {
        this.mountComponent(n2, container, anchor);
      } else {
        this.patchComponent(n1, n2, anchor);
      }
    }
  }

  patchComponent(n1: VNODE, n2: VNODE, anchor: Node | null) {
    // 获取组件实例
    const instance = (n2.component = n1.component)!;
    const {props} = instance;
    if (hasPropsChanged(n1.props || {}, n2.props || {})) {
      const [nextProps] = resolveProps(
        (n2.type as ComponentOption).props || {},
        n2.props || {}
      );
      // 更新Props
      for (const k in nextProps) {
        props[k] = nextProps[k];
      }
      // 删除不存在的Props
      for (const k in props) {
        if (!(k in nextProps)) delete props[k];
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
      this.fastDiff(n1, n2, el);
    } else {
      // 此时说明新子节点不存在
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      } else if (typeof n1.children === 'string') {
        setElementText(el, '');
      }
    }
  }

  // chapter 11: 快速diff算法
  fastDiff(n1: VNODE, n2: VNODE, el: IContainer) {
    const {insert} = this.options;
    const newChildren = n2.children as VNODE[];
    const oldChildren = n1.children as VNODE[];
    // 处理相同的前置节点
    let j = 0;
    let oldVNode = oldChildren[j];
    let newVNode = newChildren[j];
    console.log(oldVNode, newVNode);
    while (oldVNode.key === newVNode.key) {
      this.patch(oldVNode, newVNode, el);
      j++;
      oldVNode = oldChildren[j];
      newVNode = newChildren[j];
    }
    // 处理相同的后置节点
    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
    while (oldVNode.key === newVNode.key) {
      this.patch(oldVNode, newVNode, el);
      oldEnd--;
      newEnd--;
      oldVNode = oldChildren[oldEnd];
      newVNode = newChildren[newEnd];
    }
    // 当旧节点被处理完后，新节点中j -> newEnd之间的节点应作为新节点插入
    if (j > oldEnd && j <= newEnd) {
      const anchorIndex = newEnd + 1;
      const anchor =
        anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
      while (j <= newEnd) {
        this.patch(null, newChildren[j++], el, anchor);
      }
    } else if (j > newEnd && j <= oldEnd) {
      // 当新节点被处理完后，旧节点中j -> oldEnd之间的节点应该被卸载
      while (j <= oldEnd) {
        unmount(oldChildren[j++]);
      }
    } else {
      const count = newEnd - j + 1;
      // source用来存储新节点在旧节点中的位置索引
      const source = new Array(count).fill(-1);
      const oldStart = j;
      const newStart = j;
      // 标志是否需要移动
      let moved = false;
      // 保存最大索引值
      let pos = 0;
      // keyIndex用来保存新节点key与位置index的映射
      const keyIndex: Record<any, number> = {};
      for (let i = newStart; i <= newEnd; i++) {
        keyIndex[newChildren[i].key!] = i;
      }
      // 保存更新过的节点数量
      let patched = 0;
      for (let i = oldStart; i <= oldEnd; i++) {
        oldVNode = oldChildren[i];
        if (patched <= count) {
          const k = keyIndex[oldVNode.key!];
          if (typeof k !== 'undefined') {
            newVNode = newChildren[k];
            this.patch(oldVNode, newVNode, el);
            patched++;
            source[k - newStart] = i;
            if (k < pos) {
              moved = true;
            } else {
              pos = k;
            }
          } else {
            unmount(oldVNode);
          }
        } else {
          // 如果更新过的节点大于需要更新的节点数量，则卸载多余的节点
          unmount(oldVNode);
        }
      }
      // 移动节点
      if (moved) {
        const seq = lis(source);
        // s 指向最长递增子序列中的最后一个值
        let s = seq.length - 1;
        // 对应source中的index
        let i = count - 1;
        for (i; i >= 0; i--) {
          if (source[i] === -1) {
            // 挂载新节点
            // 该节点在新的一组子节点中的真实位置索引
            const pos = i + newStart;
            const nextPos = pos + 1;
            const newVNode = newChildren[pos];
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            this.patch(null, newVNode, el, anchor);
          } else if (i !== seq[s]) {
            // 说明该节点需要移动
            // 该节点在新的一组子节点中的真实位置索引
            const pos = i + newStart;
            const nextPos = pos + 1;
            const newVNode = newChildren[pos];
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            insert(newVNode.el, el, anchor);
          } else {
            // 当 i === seq[j] 时，说明该位置的节点不需要移动
            // 并让 s 指向下一个位置
            s--;
          }
        }
      }
    }
  }

  // chapter 10: 双端diff算法
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
          // 如果在旧节点中找不到可复用的节点，说明该节点为新节点
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

  // chapter 9: 简单diff算法
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
    const el = (vnode.el = createElement(vnode.type as string));
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

  // 任务缓存队列
  queue = new Set<any>();
  // 标志是否正在刷新队列
  isFlushing = false;
  // 通过微任务异步执行副作用函数
  p = Promise.resolve();

  queueJob(job: () => void) {
    this.queue.add(job);
    if (!this.isFlushing) {
      this.isFlushing = true;
      this.p.then(() => {
        try {
          // 在微任务中执行任务队列中的任务
          this.queue.forEach((job) => job());
        } finally {
          // 重置状态
          this.isFlushing = false;
          this.queue.clear();
        }
      });
    }
  }

  mountComponent(vnode: VNODE, container: IContainer, anchor: Node | null) {
    const componentOptions = vnode.type as ComponentOption;
    // 获取组件的渲染函数、数据以及生命周期函数
    const {
      render,
      data,
      props: propsOption,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
    } = componentOptions;
    beforeCreate && beforeCreate();
    // 通过data函数得到原始数据，并调用reactive将其包装成响应式数据
    const state = reactive(data ? data() : {});
    const [props, attrs] = resolveProps(propsOption || {}, vnode.props || {});
    // 创建组件实例，包含与组件相关的状态信息
    const instance: ComponentInstance = {
      // 组件自身的状态数据
      state,
      props: shallowReactive(props),
      // 标志组件是否已被挂载
      isMounted: false,
      // 组件所渲染的内容
      subTree: null,
    };
    vnode.component = instance;
    // 创建渲染上下文对象， 本质是组件实例的代理
    const renderContext = new Proxy(instance, {
      get(t, k, r) {
        const {state, props} = t;
        if (state && k in state) {
          return state[k];
        } else if (k in props) {
          return props[k];
        } else {
          console.error(`${String(k)}属性不存在`);
        }
      },
      set(t, k, v, r) {
        const {state, props} = t;
        if (state && k in state) {
          state[k] = v;
          return true;
        } else if (k in props) {
          props[k] = v;
          return true;
        } else {
          console.error(`${String(k)}属性不存在`);
          return false;
        }
      },
    });
    // 将this绑定到state上
    created && created.call(renderContext);
    // 当组件状态发生改变时，触发组件更新
    effect(
      () => {
        console.log(instance);
        // 执行渲染函数，获取组件的虚拟DOM
        const subTree = render.call(renderContext);
        if (!instance.isMounted) {
          // 挂载
          beforeMount && beforeMount.call(renderContext);
          this.patch(null, subTree, container, anchor);
          instance.isMounted = true;
          mounted && mounted.call(renderContext);
        } else {
          // 更新
          beforeUpdate && beforeUpdate.call(renderContext);
          // 当组件已被挂载，使用新的子树与原子树进行patch
          this.patch(instance.subTree, subTree, container, anchor);
          updated && updated.call(renderContext);
        }
        // 更新组件实例的子树
        instance.subTree = subTree;
      },
      {
        scheduler: this.queueJob.bind(this),
      }
    );
  }
}
