<template>
  <div class="json-editor" @click="focusTextarea">
    <textarea
      ref="textareaRef"
      v-model="localValue"
      class="json-editor__textarea"
      :rows="rows"
      :placeholder="placeholder"
      @input="handleInput"
      @blur="handleBlur"
      @change="handleChange"
    
    />
   
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 8
  },
  placeholder: {
    type: String,
    default: ''
  },
  autoFormat: {
    type: Boolean,
    default: true
  },
  showFormatButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'change'])

const textareaRef = ref(null)
const localValue = ref(props.modelValue || '')

watch(
  () => props.modelValue,
  (val) => {
    if (val !== localValue.value) {
      localValue.value = val || ''
    }
  }
)

const formatValue = (showMessage = false) => {
  if (!localValue.value) return
  try {
    const parsed = JSON.parse(localValue.value)
    const formatted = JSON.stringify(parsed, null, 2)
    localValue.value = formatted
    emit('update:modelValue', formatted)
    if (showMessage) {
      ElMessage.success('已格式化')
    }
  } catch (error) {
    if (showMessage) {
      ElMessage.error('JSON 格式有误，请检查')
    }
  }
}

const handleInput = (event) => {
  localValue.value = event.target.value
  emit('update:modelValue', localValue.value)
}

const handleBlur = () => {
  if (props.autoFormat) {
    formatValue(false)
  }
  emit('blur')
}

const handleChange = () => {
  emit('change', localValue.value)
}

const focusTextarea = () => {
  textareaRef.value?.focus()
}

onMounted(() => {
  if (props.autoFormat && localValue.value) {
    formatValue(false)
  }
})
</script>

<style scoped>
.json-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.json-editor__textarea {
  width: 100%;
  min-width: 100%;
  resize: vertical;
  padding: 12px;
  box-sizing: border-box;
}

.json-editor__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
