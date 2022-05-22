import './style.css';
import Renderer, {Fragment} from './core';
import domHanlers from './core/handler-dom';

const renderer = new Renderer(domHanlers);
const container = document.querySelector('#app') as IContainer;

const oldVnode: VNODE = {
  type: 'div',
  children: [
    {
      type: Fragment,
      children: [
        {type: 'p', children: 'text 1', key: '1'},
        {type: 'p', children: 'text 2', key: '2'},
        {type: 'p', children: 'text 3', key: '3'},
      ],
    },
  ],
};

const newVnode = {
  type: 'div',
  children: [
    {
      type: Fragment,
      children: [
        // {type: 'p', children: 'text 10', key: '4'},
        {type: 'p', children: 'text 3', key: '3'},
        {type: 'p', children: 'text 2', key: '2'},
        {type: 'p', children: 'text 1', key: '1'},
      ],
    },
  ],
};
renderer.render(oldVnode, container);
setTimeout(() => {
  console.log('update');
  renderer.render(newVnode, container);
}, 3000);
