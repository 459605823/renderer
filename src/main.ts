import './style.css';
import Renderer, {Fragment} from './core';
import domHanlers from './core/handler-dom';

const renderer = new Renderer(domHanlers);
const container = document.querySelector('#app') as IContainer;

const newVnode = {
  type: 'div',
  children: [
    {
      type: Fragment,
      children: [
        {type: 'p', children: 'text 1'},
        {type: 'p', children: 'text 2'},
        {type: 'p', children: 'text 3'},
      ],
    },
    {type: 'section', children: '分割线'},
  ],
};

const oldVnode = {
  type: 'div',
  children: [
    {
      type: Fragment,
      children: [
        {type: 'p', children: 'text 1'},
        {type: 'p', children: 'text 2'},
        {type: 'p', children: 'text 3'},
        {type: 'p', children: 'text 4'},
      ],
    },
  ],
};
renderer.render(oldVnode, container);
setTimeout(() => {
  console.log('update');
  renderer.render(newVnode, container);
}, 3000);
