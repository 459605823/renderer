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
  setElementText(el: HTMLElement, text: string) {
    el.textContent = text;
  },
  insert(el: HTMLElement, parent: HTMLElement, anchor = null) {
    parent.insertBefore(el, anchor);
  },
  patchProps(el: any, key: string, value: any) {
    if (key === 'class') {
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
