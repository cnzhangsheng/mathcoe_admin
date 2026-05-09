<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  height?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = shallowRef<IDomEditor>()
const valueHtml = ref(props.modelValue || '<p><br></p>')

const showSource = ref(false)
const sourceCode = ref('')

watch(
  () => props.modelValue,
  (val) => {
    if (val !== valueHtml.value && !showSource.value) {
      valueHtml.value = val || '<p><br></p>'
    }
  }
)

const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder || '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/v1/upload/image',
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024,
      onSuccess(file: File, res: any) {
        console.log('上传成功', file, res)
      },
      onFailed(file: File, res: any) {
        console.error('上传失败', file, res)
      },
      onError(file: File, err: Error, res: any) {
        console.error('上传出错', file, err, res)
      },
      customInsert(res: any, insertFn: (url: string, alt?: string, href?: string) => void) {
        if (res && res.url) {
          insertFn(res.url, res.filename)
        }
      }
    }
  }
}

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video', 'fullScreen']
}

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

const handleChange = (editor: IDomEditor) => {
  const html = editor.getHtml()
  valueHtml.value = html
  emit('update:modelValue', html)
}

const toggleSource = () => {
  if (!showSource.value) {
    // Switch to source mode — copy current HTML
    sourceCode.value = valueHtml.value
    showSource.value = true
  } else {
    // Switch back — apply edited source to editor
    showSource.value = false
    const newHtml = sourceCode.value || '<p><br></p>'
    valueHtml.value = newHtml
    emit('update:modelValue', newHtml)
  }
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})
</script>

<template>
  <div style="border: 1px solid #ccc; width: 100%">
    <div style="border-bottom: 1px solid #ccc; display: flex; align-items: center;">
      <Toolbar
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        mode="simple"
        style="flex: 1; border-bottom: none;"
      />
      <el-button
        size="small"
        :type="showSource ? 'primary' : 'default'"
        @click="toggleSource"
        style="margin: 4px 6px; flex-shrink: 0;"
      >
        源码
      </el-button>
    </div>
    <Editor
      v-show="!showSource"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :style="{ height: height || '200px', overflowY: 'hidden' }"
      mode="simple"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
    <textarea
      v-show="showSource"
      v-model="sourceCode"
      :style="{ height: height || '200px', width: '100%', border: 'none', padding: '8px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical', outline: 'none' }"
      placeholder="HTML 源码"
    ></textarea>
  </div>
</template>