import './style.css'
import {effect, ref} from '@vue/reactivity'

const a = ref('sb')
effect(() => {
  document.title = a.value
})
setTimeout(() => {
  a.value = 'bs'
}, 2000)