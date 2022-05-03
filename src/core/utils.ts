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
