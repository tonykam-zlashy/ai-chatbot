<!-- 消息发送组件，支持富文本编辑、图片上传、文件上传、语音输入 -->
<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { MessagePlugin, Tooltip as TTooltip } from "tdesign-vue-next";
import type { FileProps } from "../../model/file";
import {
  ALLOWED_IMAGE_TYPES,
  FILE_SIZE_LIMITS,
  FILE_COUNT_LIMIT,
  getFileCategory,
  formatFileSize,
} from "../../model/file";
import { MessageCode, getMessage } from "../../model/messages";
import type { ChatRelatedProps, SenderI18n } from "../../model/type";
import {
  chatRelatedPropsDefaults,
  defaultSenderI18n,
  defaultSenderI18nEn,
} from "../../model/type";
import RecordIcon from "../Common/RecordIcon.vue";
import FileList from "../Common/FileList.vue";
import CustomizedIcon from "../CustomizedIcon.vue";
import WebRecorder, { pcmToWav } from "../../utils/webRecorder";
import { httpService } from "../../service/httpService";
import QaEditor from "../QaEditor/index.vue";

export interface Props extends ChatRelatedProps {
  /** 是否正在流式加载 */
  isStreamLoad?: boolean;
  /** 是否使用内部录音处理（API 模式） */
  useInternalRecord?: boolean;
  /** ASR URL API 路径 */
  asrUrlApi?: string;
  /** ASR 文件识别 API 路径 */
  asrFileApi?: string;
  /** 是否启用语音输入 */
  enableVoiceInput?: boolean;
  /** 是否启用文件上传入口 */
  enableFileUpload?: boolean;
  /** 是否正在上传/解析文件（禁止发送和继续上传） */
  isUploading?: boolean;
  /** 是否禁用输入 */
  disabled?: boolean;
  /** 禁用时 placeholder */
  disabledPlaceholder?: string;
  /** 国际化文本 */
  i18n?: SenderI18n;
}

const props = withDefaults(defineProps<Props>(), {
  ...chatRelatedPropsDefaults,
  isStreamLoad: false,
  useInternalRecord: false,
  asrUrlApi: "",
  asrFileApi: "/helper/asr/file",
  enableVoiceInput: true,
  enableFileUpload: true,
  isUploading: false,
  disabled: false,
  disabledPlaceholder: "",
  i18n: () => ({}),
});

const i18n = computed(() => {
  const defaults = props.language?.startsWith("en")
    ? defaultSenderI18nEn
    : defaultSenderI18n;
  return { ...defaults, ...props.i18n };
});

/**
 * 是否禁止发送和上传（上传/解析中或流式加载中）
 */
const sendDisabled = computed(
  () => props.disabled || props.isUploading || props.isStreamLoad,
);

/**
 * 是否有可发送内容
 */
const hasContent = computed(() => {
  const textContent = editorHtml.value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u200b\s]/g, "")
    .trim();
  const hasImages = editorHtml.value.includes("<img");
  return !!(textContent || hasImages || fileList.value.length > 0);
});

const emit = defineEmits<{
  (e: "stop"): void;
  (e: "send", value: string, fileList: FileProps[]): void;
  (e: "recordAudio", file: FileProps): void;
  (e: "uploadFile", files: File[]): void;
  (e: "startRecord"): void;
  (e: "stopRecord"): void;
  (e: "message", code: MessageCode, message: string): void;
}>();

const editorHtml = ref("");
const inputFocus = ref(false);
const recording = ref(false);
const fileList = ref<FileProps[]>([]);
const recorder = ref<WebRecorder | null>(null);
const recordMaxTime = 10;
const recordRef = ref<ReturnType<typeof setTimeout> | null>(null);
const qaEditorRef = ref<InstanceType<typeof QaEditor> | null>(null);
const inputValueBefore = ref("");

const imageInputRef = ref<HTMLInputElement | null>(null);
const imageUploadIconUrl =
  "https://carers-webchat.aienchat.com/add-photo-alternate.svg";
const voiceInputIconUrl = "https://carers-webchat.aienchat.com/microphone.svg";

/**
 * 图片 accept 属性
 */
const imageAccept = ALLOWED_IMAGE_TYPES.map((t) => {
  const ext = t.split("/")[1];
  return `.${ext === "jpeg" ? "jpg,.jpeg" : ext}`;
}).join(",");

const placeholder = computed(() => {
  if (props.disabled) {
    return (
      props.disabledPlaceholder ||
      (props.language?.startsWith("en")
        ? "Please accept T&C"
        : "請先接受條款與細則後繼續")
    );
  }
  return props.isMobile
    ? i18n.value.placeholderMobile || ""
    : i18n.value.placeholder || "";
});

/**
 * 选择图片
 */
const handleSelectImage = () => {
  if (props.disabled || props.isUploading) return;
  imageInputRef.value?.click();
};

/**
 * 编辑器内容变更
 */
const handleEditorInput = (html: string) => {
  editorHtml.value = html;
};

/**
 * 编辑器聚焦
 */
const handleEditorFocus = () => {
  if (props.disabled) return;
  inputFocus.value = true;
};

/**
 * 编辑器失焦
 */
const handleEditorBlur = () => {
  inputFocus.value = false;
};

/**
 * 键盘事件：Enter 发送，Ctrl/Meta+Enter 换行
 * 通过 isComposing 判断是否处于 IME 组合输入状态，避免输入法确认时误触发送
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    event.preventDefault();
    return;
  }
  if (event.key !== "Enter") return;
  if (event.isComposing || event.keyCode === 229) return;
  if (event.metaKey || event.ctrlKey) {
    qaEditorRef.value?.insertHtml("<br/>");
  } else if (!event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
};

/**
 * 统一文件选择校验逻辑
 */
const handleFilesSelected = (event: Event, allowedTypes: string[]) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  const currentCount = fileList.value.length;
  if (currentCount + files.length > FILE_COUNT_LIMIT) {
    MessagePlugin.warning(
      i18n.value.fileLimitExceeded.replace("{count}", String(FILE_COUNT_LIMIT)),
    );
    return;
  }

  const validFiles: File[] = [];
  Array.from(files).forEach((file) => {
    if (
      !allowedTypes.includes(file.type) &&
      !isExtensionAllowed(file.name, allowedTypes)
    ) {
      const text =
        i18n.value.notSupport ||
        getMessage(MessageCode.FILE_FORMAT_NOT_SUPPORT).message;
      MessagePlugin.error(text);
      emit("message", MessageCode.FILE_FORMAT_NOT_SUPPORT, text);
      return;
    }

    const category = getFileCategory(file.type);
    const sizeLimit = FILE_SIZE_LIMITS[category];
    if (file.size > sizeLimit) {
      MessagePlugin.error(
        i18n.value.fileSizeExceeded.replace(
          "{size}",
          formatFileSize(sizeLimit),
        ),
      );
      return;
    }

    validFiles.push(file);
  });

  if (validFiles.length > 0) {
    emit("uploadFile", validFiles);
  }

  input.value = "";
};

/**
 * 通过扩展名检查文件类型（兜底）
 */
const isExtensionAllowed = (
  fileName: string,
  allowedTypes: string[],
): boolean => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  const extToMime: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    bmp: "image/bmp",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    json: "application/json",
  };
  const mime = extToMime[ext];
  return mime ? allowedTypes.includes(mime) : false;
};

const handleImageInputChange = (event: Event) => {
  handleFilesSelected(event, ALLOWED_IMAGE_TYPES);
};

const handleDeleteFile = (index: number) => {
  fileList.value.splice(index, 1);
  fileList.value = [...fileList.value];
};

/**
 * 将编辑器中的内联图片转为 Markdown 格式
 */
function htmlImgToMarkdown(html: string): string {
  return html.replace(/<img[^>]+src="([^"]*)"[^>]*>/g, (_, src) => {
    return `![](${src})`;
  });
}

/**
 * 提取编辑器中纯文本内容（去除HTML标签）
 */
function getPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

const handleSend = async function () {
  if (props.disabled) {
    return;
  }
  if (props.isUploading) {
    MessagePlugin.warning(i18n.value.uploadingWait);
    return;
  }
  if (props.isStreamLoad) {
    const text =
      i18n.value.answering || getMessage(MessageCode.ANSWERING).message;
    MessagePlugin.warning(text);
    emit("message", MessageCode.ANSWERING, text);
    return;
  }
  handleStopRecord();

  if (!hasContent.value) return;

  let _query = "";
  for (const file of fileList.value) {
    if (file.status === "done" && file.url) {
      if (props.mode === "claw") {
        _query += `[${file.name || ""}](${file.url})`;
      } else if (file.category === "image") {
        _query += `![](${file.url})`;
      }
    }
  }

  // 将编辑器中的内联图片转成 Markdown 格式后附加到消息中
  const editorContent = editorHtml.value;
  const processedContent = htmlImgToMarkdown(editorContent);
  const plainContent = getPlainText(processedContent);
  _query += plainContent || processedContent;

  emit("send", _query, fileList.value);
  editorHtml.value = "";
  qaEditorRef.value?.clear();
  fileList.value = [];
};

/**
 * 处理开始录音事件
 */
const handleStartRecord = async () => {
  if (props.disabled || props.isUploading || props.isStreamLoad) {
    return;
  }
  recording.value = true;

  if (props.useInternalRecord) {
    inputValueBefore.value = getPlainText(editorHtml.value);
    startRecording();
    recordRef.value = setTimeout(() => {
      if (recording.value) {
        const text =
          i18n.value.recordTooLong ||
          getMessage(MessageCode.RECORD_TOO_LONG).message;
        MessagePlugin.warning(text);
        emit("message", MessageCode.RECORD_TOO_LONG, text);
        handleStopRecord();
      }
    }, recordMaxTime * 1000);
  }

  emit("startRecord");
};

/**
 * 开始录音（内部方法）
 */
const startRecording = () => {
  const requestId = "0";
  recorder.value = new WebRecorder({ requestId });
  recorder.value.OnReceivedData = () => {};
  recorder.value.OnError = (err: any) => {
    let errMsg: string;
    let errCode: MessageCode = MessageCode.RECORD_FAILED;
    if (err && typeof err === "object" && "code" in err) {
      const errorCodeMap: Record<
        string,
        { i18nKey: keyof SenderI18n; messageCode: MessageCode }
      > = {
        CHROME_SECURITY_ERROR: {
          i18nKey: "chromeSecurityError",
          messageCode: MessageCode.CHROME_SECURITY_ERROR,
        },
        BROWSER_NOT_SUPPORT: {
          i18nKey: "browserNotSupport",
          messageCode: MessageCode.BROWSER_NOT_SUPPORT,
        },
        AUDIO_CONTEXT_NOT_SUPPORT: {
          i18nKey: "audioContextNotSupport",
          messageCode: MessageCode.AUDIO_CONTEXT_NOT_SUPPORT,
        },
        WEB_AUDIO_API_NOT_SUPPORT: {
          i18nKey: "webAudioApiNotSupport",
          messageCode: MessageCode.WEB_AUDIO_API_NOT_SUPPORT,
        },
        MEDIA_STREAM_SOURCE_NOT_SUPPORT: {
          i18nKey: "mediaStreamSourceNotSupport",
          messageCode: MessageCode.MEDIA_STREAM_SOURCE_NOT_SUPPORT,
        },
      };
      const mapping = errorCodeMap[err.code as string];
      if (mapping) {
        errMsg =
          i18n.value[mapping.i18nKey] ||
          getMessage(mapping.messageCode).message;
        errCode = mapping.messageCode;
      } else {
        errMsg =
          i18n.value.recordFailed ||
          getMessage(MessageCode.RECORD_FAILED).message;
      }
    } else {
      errMsg =
        typeof err === "string"
          ? err
          : i18n.value.recordFailed ||
            getMessage(MessageCode.RECORD_FAILED).message;
    }
    MessagePlugin.error(errMsg);
    emit("message", errCode, errMsg);
    recording.value = false;
  };
  recorder.value.OnStop = async (data: number[]) => {
    if (data.length === 0) {
      return;
    }
    let audioUrl = "";
    let audioCommitted = false;
    try {
      const wavBlob = pcmToWav(data, 16000);
      const fileName = `recording_${Date.now()}.wav`;
      const audioFile = new File([wavBlob], fileName, { type: "audio/wav" });
      audioUrl = URL.createObjectURL(wavBlob);
      const audioAttachment: FileProps = {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2)}-audio`,
        name: fileName,
        url: audioUrl,
        size: audioFile.size,
        type: audioFile.type,
        status: "done",
        category: "audio",
        localOnly: true,
      };
      emit("recordAudio", audioAttachment);
      audioCommitted = true;
      const formData = new FormData();
      formData.append("audio", audioFile);
      const response = await httpService.post(
        props.asrFileApi || "/helper/asr/file",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      const result =
        (response as any)?.Result || (response as any)?.data?.Result || "";
      if (result) {
        const prefix = inputValueBefore.value;
        const newText = prefix ? `${prefix} ${result}` : result;
        emit("send", newText, [audioAttachment]);
      } else {
        const text =
          i18n.value.asrServiceFailed ||
          getMessage(MessageCode.ASR_SERVICE_FAILED).message;
        MessagePlugin.error(text);
        emit("message", MessageCode.ASR_SERVICE_FAILED, text);
      }
    } catch (err) {
      if (audioUrl && !audioCommitted) {
        URL.revokeObjectURL(audioUrl);
      }
      const text =
        i18n.value.asrServiceFailed ||
        getMessage(MessageCode.ASR_SERVICE_FAILED).message;
      MessagePlugin.error(text);
      emit("message", MessageCode.ASR_SERVICE_FAILED, text);
    }
  };
  recorder.value.start();
};

/**
 * 处理停止录音事件
 */
const handleStopRecord = () => {
  if (!recording.value) return;
  recording.value = false;

  if (props.useInternalRecord) {
    recorder.value?.stop();
    recorder.value = null;
    if (recordRef.value) {
      clearTimeout(recordRef.value);
      recordRef.value = null;
    }
  }

  emit("stopRecord");
};

/**
 * 修改输入框内容（供外部调用）
 */
const changeSenderVal = (value: string, files: FileProps[]) => {
  editorHtml.value = value;
  if (qaEditorRef.value) {
    qaEditorRef.value.clear();
    if (value) {
      nextTick(() => {
        qaEditorRef.value?.insertHtml(value);
      });
    }
  }
  fileList.value = files;
};

/**
 * 添加文件到列表（供外部调用）
 */
const addFile = (file: FileProps) => {
  fileList.value.push(file);
};

/**
 * 根据 uid 更新文件属性（供外部调用）
 */
const updateFile = (uid: string, updates: Partial<FileProps>) => {
  const index = fileList.value.findIndex((f) => f.uid === uid);
  if (index !== -1) {
    fileList.value[index] = {
      ...fileList.value[index],
      ...updates,
    } as FileProps;
    fileList.value = [...fileList.value];
  }
};

/**
 * 根据 uid 删除文件（供外部调用）
 */
const removeFile = (uid: string) => {
  const index = fileList.value.findIndex((f) => f.uid === uid);
  if (index !== -1) {
    fileList.value.splice(index, 1);
    fileList.value = [...fileList.value];
  }
};

/**
 * 设置录音状态（供外部调用）
 */
const setRecording = (value: boolean) => {
  recording.value = value;
};

/**
 * 更新输入值（供外部调用）
 */
const updateInputValue = (value: string) => {
  editorHtml.value = value;
  if (qaEditorRef.value) {
    qaEditorRef.value.clear();
    if (value) {
      nextTick(() => {
        qaEditorRef.value?.insertText(value);
      });
    }
  }
};

/**
 * 暴露给父组件的方法
 */
defineExpose({
  changeSenderVal,
  addFile,
  updateFile,
  removeFile,
  setRecording,
  updateInputValue,
});
</script>

<template>
  <div
    class="sender-container"
    :class="{
      'is-uploading': isUploading,
      'is-focused': inputFocus,
      'is-disabled': disabled,
    }"
  >
    <!-- 文件预览区域 -->
    <div v-if="fileList.length > 0" class="sender-files">
      <FileList
        :fileList="fileList"
        :theme="theme"
        :mode="mode"
        @delete="handleDeleteFile"
      />
    </div>

    <!-- 编辑器区域 -->
    <div class="sender-editor-area" @keydown="handleKeydown">
      <QaEditor
        :key="disabled ? 'sender-disabled' : 'sender-enabled'"
        ref="qaEditorRef"
        :value="editorHtml"
        :placeholder="placeholder"
        :readOnly="isUploading || disabled"
        :disabled="disabled"
        :hideToolBar="true"
        :allowPasteImage="true"
        :theme="theme"
        @input="handleEditorInput"
        @focus="handleEditorFocus"
        @blur="handleEditorBlur"
      />
    </div>

    <!-- 底部工具栏 -->
    <div class="sender-toolbar">
      <div class="sender-toolbar__right">
        <span
          class="sender-action-icon send-icon"
          :class="{ disabled: sendDisabled }"
          v-if="!isStreamLoad && hasContent"
          @click="handleSend"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="M3.402 6.673c-.26-2.334 2.143-4.048 4.266-3.042l11.944 5.658c2.288 1.083 2.288 4.339 0 5.422L7.668 20.37c-2.123 1.006-4.525-.708-4.266-3.042L3.882 13H12a1 1 0 1 0 0-2H3.883z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <CustomizedIcon
          class="sender-action-icon send-icon stop"
          v-if="isStreamLoad"
          nativeIcon
          :showHoverBg="false"
          :name="theme === 'dark' ? 'pause_dark' : 'pause'"
          @click="emit('stop')"
        />

        <TTooltip
          v-if="enableFileUpload && !hasContent"
          :content="i18n.uploadImage"
        >
          <span
            class="sender-action-icon image-upload-icon"
            :class="{ disabled: isUploading || disabled }"
            @click="handleSelectImage"
          >
            <img
              class="sender-action-icon__img"
              :src="imageUploadIconUrl"
              alt=""
            />
          </span>
        </TTooltip>

        <TTooltip
          v-if="enableVoiceInput && !recording && !hasContent"
          :content="i18n.startRecord"
        >
          <span
            class="sender-action-icon recording-icon"
            :class="{ isMobile: isMobile, disabled: sendDisabled }"
            @click="handleStartRecord"
          >
            <img
              class="sender-action-icon__img"
              :src="voiceInputIconUrl"
              alt=""
            />
          </span>
        </TTooltip>

        <TTooltip
          v-if="enableVoiceInput && recording"
          :content="i18n.stopRecord"
        >
          <span
            class="sender-action-icon recording-icon stop-icon"
            :class="{ isMobile: isMobile }"
            @click="handleStopRecord"
          >
            <RecordIcon />
          </span>
        </TTooltip>

        <!-- 隐藏的文件选择 input -->
        <input
          ref="imageInputRef"
          type="file"
          :accept="imageAccept"
          multiple
          hidden
          @change="handleImageInputChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sender-container {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  border: 0;
  border-radius: 18px;
  margin-left: 12px;
  margin-right: 12px;
  margin-top: 4px;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  overflow: visible;
}

.sender-container.is-focused {
  box-shadow: 0 0 0 2px
    color-mix(
      in srgb,
      var(--adp-chat-footer-icon-color, #ff7833) 18%,
      transparent
    );
}

.sender-container.is-uploading {
  opacity: 0.7;
  pointer-events: auto;
}

.sender-container.is-disabled {
  background: #fff;
  opacity: 1;
}

/* 文件区域 */
.sender-files {
  padding: 8px 12px 0;
}

/* 编辑器区域 */
.sender-editor-area {
  max-height: 72px;
  min-height: 48px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 底部工具栏 */
.sender-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 10px 0;
  background: transparent;
}

.sender-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 图片上传和录音按钮 */
.sender-action-icon:hover {
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.04);
  color: var(--adp-chat-footer-icon-color, #ff7833);
  opacity: 1;
}

.sender-action-icon {
  position: relative;
  width: 40px;
  height: 40px;
  opacity: 0.8;
  color: var(--adp-chat-footer-icon-color, #ff7833);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--td-radius-default, 4px);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}

.sender-action-icon__img {
  width: 24px;
  height: 24px;
  display: block;
}

.image-upload-icon .sender-action-icon__img {
  width: 28px;
  height: 28px;
}

.recording-icon.isMobile {
  margin-right: 0;
}

.sender-action-icon.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* 发送按钮 */
.send-icon {
  margin-left: 12px;
  width: 48px;
  height: 48px;
}

.send-icon svg {
  display: block;
  color: var(--adp-chat-footer-icon-color, #ff7833);
  width: 24px;
  height: 24px;
}

.send-icon.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
