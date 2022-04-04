import './style.css';
import Renderer from './core';
import domHanlers from './core/handler-dom';
const vnode = {
  type: 'h1',
  props: {
    class: ['test', {baz: true, foo: false}],
  },
  children: [
    {
      type: 'p',
      children: 'hello',
    },
  ],
};

const renderer = new Renderer(domHanlers);

renderer.render(vnode, document.body as IContainer);
