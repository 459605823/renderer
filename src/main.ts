import './style.css';
import Renderer, {Fragment} from './core';
import domHanlers from './core/handler-dom';

const renderer = new Renderer(domHanlers);
const container = document.querySelector('#app') as IContainer;

// const oldVnode: VNODE = {
//   type: 'div',
//   children: [
//     {type: 'p', children: '1', key: 1},
//     {type: 'p', children: '2', key: 2},
//     {type: 'p', children: '3', key: 3},
//     {type: 'p', children: '4', key: 4},
//     {type: 'p', children: '6', key: 6},
//     {type: 'p', children: '5', key: 5},
//   ],
//   key: 1,
// };

// const newVnode: VNODE = {
//   type: 'div',
//   children: [
//     {type: 'p', children: '1', key: 1},
//     {type: 'p', children: '3', key: 3},
//     {type: 'p', children: '4', key: 4},
//     {type: 'p', children: '2', key: 2},
//     {type: 'p', children: '7', key: 7},
//     {type: 'p', children: '5', key: 5},
//   ],
//   key: 1,
// };
const MyComp: ComponentOption = {
  name: 'MyComponent',
  props: {
    a: String,
  },
  data() {
    return {
      b: '1111',
    };
  },
  mounted() {
    console.log(this.b);
    console.log(this.c);
  },
  render() {
    const self = this as Record<string, any>;
    return {
      type: 'div',
      children: `我是文本内容${self.a}`,
    };
  },
};

const componentVNode = {
  type: MyComp,
  props: {
    a: 'props a',
  },
};

renderer.render(componentVNode, container);
