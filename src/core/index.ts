interface VNODE {
    type: string | VNODE,
    children: any
}

interface IContainer extends HTMLElement{
    _vnode: VNODE
}

class Renderer {
    options: Record<string, any>

    constructor(options: Record<string, any>) {
        this.options = options
    }

    render(vnode: VNODE, container: IContainer) {
        if (vnode) {
            this.patch(container._vnode, vnode, container)
        } else {
            // 卸载
            if (container._vnode) {
                container.innerHTML = ''
            }
        }
        container._vnode = vnode
    }

    patch(n1: VNODE, n2: VNODE, container: IContainer) {
        // 如果n1不存在，则为挂载操作
        if (!n1) {
            this.mountElement(n2, container)
        } else {

        }

    }

    mountElement(vnode: VNODE, container: IContainer) {


    }

}