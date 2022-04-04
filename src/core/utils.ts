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
  if (!vnode.el) return;
  const parent = vnode.el?.parentNode;
  if (parent) {
    parent.removeChild(vnode.el);
  }
}
