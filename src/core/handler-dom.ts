import {normalizeClass} from './utils';

function shouldSetAsProps(el: HTMLElement, key: string) {
  // 需要排除只读属性
  // input.form特殊处理
  if (key === 'form' && el.tagName === 'INPUT') return;
  return key in el;
}

export default {
  createElement(tag: string) {
    return document.createElement(tag) as IContainer;
  },
  createText(text: string) {
    return document.createTextNode(text);
  },
  setText(el: HTMLElement, text: string) {
    el.nodeValue = text;
  },
  setElementText(el: HTMLElement, text: string) {
    el.textContent = text;
  },
  insert(el: HTMLElement, parent: HTMLElement, anchor = null) {
    parent.insertBefore(el, anchor);
  },
  patchProps(el: any, key: string, value: any) {
    if (/^on/.test(key)) {
      const invokers = el._vei || (el._vei = {});
      let invoker = invokers[key];
      const name = key.slice(2).toLowerCase();
      if (value) {
        // 当不存在该事件绑定时
        if (!invoker) {
          invoker = el._vei[key] = (e: any) => {
            // 如果事件发生时间早于事件处理函数绑定的时间，则不执行事件处理函数
            if (e.timeStamp < invoker.attached) return;
            // 调用invoker.value中保存的真正的事件回调函数
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach((fn: any) => fn(e));
            } else {
              invoker.value(e);
            }
          };
          // 将真正的事件函数保存到invoker.value中
          invoker.value = value;
          // 存储事件处理函数绑定的时间
          invoker.attached = performance.now();
          el.addEventListener(name, invoker);
        } else {
          // 如果存在事件绑定，则只需要更新invoker.value即可
          invoker.value = value;
        }
      } else if (invoker) {
        // 如果新的事件绑定函数不存在，且之前绑定的invoker存在，则移除绑定
        el.removeEventListener(name, invoker);
      }
    } else if (key === 'class') {
      el.className = normalizeClass(value) || '';
    } else if (shouldSetAsProps(el, key)) {
      if (typeof el[key] === 'boolean' && value === '') {
        el[key] = true;
      } else {
        el[key] = value;
      }
    } else {
      // 如果要设置的属性没有对应的DOM Properties，则使用setAttribute设置属性
      el.setAttribute(key, value);
    }
  },
};
