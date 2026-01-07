import { type Directive, type DirectiveBinding } from 'vue'

const opacity: Directive = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
        el.style.opacity = binding.value ? '1' : '0'
        el.style.visibility = binding.value ? 'visible' : 'hidden'
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
        el.style.opacity = binding.value ? '1' : '0'
        el.style.visibility = binding.value ? 'visible' : 'hidden'
    }
}

export default opacity
