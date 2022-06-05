import {Fragment} from './index';

export function normalizeClass(
  className:
    | string
    | Record<string, boolean>
    | Array<string | Record<string, boolean>>
) {
  const classArr = Array.isArray(className) ? className : [className];
  let res = '';
  classArr.forEach((cls) => {
    if (typeof cls === 'string') {
      res += ` ${cls}`;
    } else {
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          res += ` ${key}`;
        }
      }
    }
  });
  return res.trim();
}

export function unmount(vnode: VNODE) {
  if (vnode.type === Fragment) {
    // 当卸载的节点为Fragment时，只需要卸载其子节点
    (vnode.children as VNODE[]).forEach((c) => unmount(c));
    return;
  }
  if (!vnode.el) return;
  const parent = vnode.el?.parentNode;
  if (parent) {
    parent.removeChild(vnode.el);
  }
}

// 获取给定序列的最长递增子序列
export function lis(arr: any[]) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = ((u + v) / 2) | 0;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

export function resolveProps(
  options: Record<string, any>,
  propsData: Record<string, any>
) {
  const props: Record<string, any> = {};
  const attrs: Record<string, any> = {};
  for (const key in propsData) {
    // 如果为组件传递的props数据在组件自身的props选项中有定义，则为合法的props
    if (key in options) {
      props[key] = propsData[key];
    } else {
      // vue3中没有在props选项中定义的props数据将存储在attrs对象中
      attrs[key] = propsData[key];
    }
  }
  return [props, attrs];
}

export function hasPropsChanged(
  prevProps: Record<string, any>,
  nextProps: Record<string, any>
) {
  const nextKeys = Object.keys(nextProps);
  const nextLength = nextKeys.length;
  // 如果数量不一致，说明发生变化
  if (nextLength !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextLength; i++) {
    const key = nextKeys[i];
    // 有不相等的props，说明有变化
    if (nextProps[key] !== prevProps[key]) return true;
  }
  return false;
}
