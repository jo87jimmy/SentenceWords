<script lang="tsx">
import { defineComponent, inject, onMounted, ref, useSlots, computed, type Ref } from 'vue'

export default defineComponent({
  name: 'FormItem',
  props: {
    prop: String,
    label: String,
  },
  setup(props) {
    const slots = useSlots()
    const value = ref('')
    const error = ref('')

    // 取得 form 的 model 和註冊函數
    const formModel = inject<Ref<Record<string, any>>>('formModel')
    const registerField = inject<Function>('registerField')
    const formRules = inject<Record<string, any>>('formRules', {})

    const myRules = computed(() => {
      return formRules?.[props.prop!] || []
    })

    // 校驗函數
    const validate = (rules: any[], isBlur = false) => {
      error.value = ''
      if (!formModel || !formModel.value || !props.prop) return true
      const val = formModel.value[props.prop]
      
      // 為空並且是非主動觸發檢驗的情況下，不檢驗
      if (isBlur && (!val || (typeof val === 'string' && val.trim() === ''))) {
        return true
      }
      for (const rule of rules) {
        if (rule.required && (!val || !val.toString().trim())) {
          error.value = rule.message
          return false
        }
        if (rule.max && val && val.toString().length > rule.max) {
          error.value = rule.message
          return false
        }
        if (rule.min && val && val.toString().length < rule.min) {
          error.value = rule.message
          return false
        }
        if (rule.validator) {
          try {
            rule.validator(rule, val, (e: Error) => {
               if (e) throw e;
            })
          } catch (e: any) {
            error.value = e.message
            return false
          }
        }
      }
      return true
    }

    // 自動觸發 blur 校驗
    function handleBlur() {
      const blurRules = myRules.value.filter((r: any) => r.trigger === 'blur')
      if (blurRules.length) validate(blurRules, true)
    }

    function handChange() {
      error.value = ''
    }

    // 註冊到 Form
    onMounted(() => {
      registerField && registerField({prop: props.prop, modelValue: value, validate})
    })

    function patchVNode(vnode: any, patchFn: (v: any) => any): any {
      if (!vnode) return vnode

      // 如果當前節點就是我們要找的 BaseInput (這裡假設有 type.name 或其他識別方式，暫時寬鬆判斷)
      if (vnode.type) {
         // 注意：這裡直接修改可能會影響原 vnode，但在渲染函數中通常是新建的。
         // 我們對這一層進行 patch
         const patched = patchFn(vnode)
         // 如果 patched 返回了新對象，則使用它
         if(patched !== vnode) return patched
      }

      // 如果有子節點，則遞歸修改
      if (Array.isArray(vnode.children)) {
        // 這裡需要複製 children 數組，避免直接變異
        const newChildren = vnode.children.map((child: any) => patchVNode(child, patchFn))
        // 返回新的 vnode 克隆
        return { ...vnode, children: newChildren }
      }
      
      // 如果是 slot 內容比較複雜，這裡的簡單遞歸可能不夠，但針對本案例先 maintaining logic
      return vnode
    }

    return () => {
      let defaultNodes = slots.default ? slots.default() : []
      if (defaultNodes.length > 0) {
          // 對 DefaultNodes 深度查找 BaseInput 並加上 onBlur / error
          // 由於 defaultNodes 是一個數組，我們需要遍歷處理
          defaultNodes = defaultNodes.map(node => patchVNode(node, (vnode) => {
            // 這裡可以加更嚴格的判斷，比如檢查 vnode.type.name === 'BaseInput'
            // 但原代碼是全部 patch，我們加個簡單檢查避免 patch 到原生標籤引起問題? 
            // 原代碼: if (vnode.type && vnode.type.name) -> return patchFn(vnode)
            // 讓我們保持原意：如果有 type.name (通常是組件), 則注入 props
            if (vnode.type && (vnode.type.name || (typeof vnode.type === 'object'))) {
                return {
                  ...vnode,
                  props: {
                    ...vnode.props,
                    error: !!error.value,
                    invalid: !!error.value,
                    onBlur: handleBlur,
                    onChange: handChange
                  },
                }
            }
            return vnode
          }))
      }

      return <div class="form-item flex gap-space">
        {props.label &&
          <label class="w-20 flex items-start mt-1 justify-end">
            {myRules.value.length ? <span class="form-error">*</span> : null} {props.label}
          </label>}
        <div class="flex-1 relative">
          { defaultNodes }
          <div class="form-error my-0.5 anim" style={{opacity: error.value ? 1 : 0}}>{error.value} &nbsp;</div>
        </div>
      </div>
    }
  }
})
</script>

<style scoped lang="scss">
.form-error {
  color: #f56c6c;
  font-size: 0.8rem;
}
</style>
