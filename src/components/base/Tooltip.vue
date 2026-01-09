<script lang="tsx">
import { defineComponent, ref, nextTick, Teleport, Transition, cloneVNode, Comment } from 'vue'

export default defineComponent({
  name: "Tooltip",
  props: {
    title: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots }) {
    const show = ref(false)
    const tipRef = ref<HTMLElement | null>(null)

    const showPop = (e: MouseEvent) => {
      if (props.disabled) return
      // Type safe check for slots
      const hasReferenceSlot = !!slots.reference
      if (!props.title && !hasReferenceSlot) return
      
      e.stopPropagation()
      const target = e.target as HTMLElement
      const rect = target.getBoundingClientRect()
      
      show.value = true
      
      nextTick(() => {
        const tipEl = tipRef.value
        if (!tipEl) return
        
        const tipRect = tipEl.getBoundingClientRect()
        
        if (rect.top < 50) {
          // Show below
          tipEl.style.top = `${rect.top + rect.height + 10}px`
        } else {
          // Show above
          tipEl.style.top = `${rect.top - tipRect.height - 10}px`
        }
        
        const tipWidth = tipRect.width
        const rectWidth = rect.width
        // Center horizontally
        tipEl.style.left = `${rect.left - (tipWidth - rectWidth) / 2}px`
      })
    }

    return () => {
      const defaultNodes = slots.default ? slots.default() : []
      // Find the first non-comment node to ensure we don't try to attach events to a comment
      // which happens if the parent component has comments in the slot (like BaseIcon.vue)
      const triggerNode = defaultNodes.find(node => node.type !== Comment)
      
      const Trigger = triggerNode ? cloneVNode(triggerNode, {
        onClick: () => { show.value = false },
        onMouseenter: (e: MouseEvent) => showPop(e),
        onMouseleave: () => { show.value = false }
      }) : null

      const referenceNodes = slots.reference ? slots.reference() : []
      const ReferenceNode = referenceNodes[0]

      return (
        <>
          <Transition name="fade">
            <Teleport to="body">
              {show.value && (
                <div ref={tipRef} class="tip">
                  {ReferenceNode ? ReferenceNode : props.title}
                </div>
              )}
            </Teleport>
          </Transition>
          {Trigger}
        </>
      )
    }
  }
})
</script>

<style lang="scss" scoped>
.tip { 
  position: fixed; 
  font-size: 1rem; 
  z-index: 9999; 
  border-radius: .3rem; 
  padding: 0.4rem .8rem; 
  color: var(--color-tooltip-text); 
  background: var(--color-tooltip-bg); 
  max-width: 22rem; 
  box-shadow: 0 0 6px 1px var(--color-tooltip-shadow); 
}
</style>

