<script setup lang="ts">import { ref, reactive, computed, watch } from 'vue';
import { useUIStore } from '@/stores/ui';
import { useSampleStore } from '@/stores/sample';
import type { SampleFormData, Batch, ValidationError, SampleStatus } from '@/types';
import { MATERIAL_OPTIONS, STATUS_OPTIONS } from '@/types';
import { X, Plus, Trash2, Upload, AlertCircle, AlertTriangle, CheckCircle2, FileImage, Save, Tag as TagIcon } from 'lucide-vue-next';
import { generateId, nowISO, formatDate } from '@/utils/date';
const ui = useUIStore();
const store = useSampleStore();
const shakeForm = ref(false);
const errors = ref<ValidationError[]>([]);
const form = reactive<SampleFormData>({
 sampleNo: '',
 version: 'V1.0',
 materialType: MATERIAL_OPTIONS[0],
 specification: '',
 manufacturer: '',
 manufacturerContact: '',
 manufacturerPhone: '',
 sealPhoto: '',
 sealDate: formatDate(new Date()),
 sealConfirmer: '',
 remark: '',
 status: 'pending',
 batches: [],
});
const isEdit = computed(() => !!ui.editingSample);
watch(() => ui.isFormDrawerOpen, (open) => {
 if (!open)
 return;
 errors.value = [];
 if (ui.editingSample) {
 const e = ui.editingSample;
 form.sampleNo = e.sampleNo;
 form.version = e.version;
 form.materialType = e.materialType;
 form.specification = e.specification;
 form.manufacturer = e.manufacturer;
 form.manufacturerContact = e.manufacturerContact;
 form.manufacturerPhone = e.manufacturerPhone;
 form.sealPhoto = e.sealPhoto;
 form.sealDate = e.sealDate;
 form.sealConfirmer = e.sealConfirmer;
 form.remark = e.remark;
 form.status = e.status;
 form.batches = JSON.parse(JSON.stringify(e.batches));
 }
 else {
 form.sampleNo = '';
 form.version = 'V1.0';
 form.materialType = MATERIAL_OPTIONS[0];
 form.specification = '';
 form.manufacturer = '';
 form.manufacturerContact = '';
 form.manufacturerPhone = '';
 form.sealPhoto = '';
 form.sealDate = formatDate(new Date());
 form.sealConfirmer = '';
 form.remark = '';
 form.status = 'pending';
 form.batches = [];
 }
}, { immediate: true });
const statusOptionsOnly = computed(() => STATUS_OPTIONS.filter(o => o.value !== 'all'));
function addBatch() {
 const nb: Batch = {
 id: generateId('batch'),
 sampleId: '',
 batchNo: '',
 entryBatchNo: '',
 entryPhoto: '',
 entryDate: '',
 quantity: '',
 remark: '',
 };
 form.batches.push(nb);
}
function removeBatch(idx: number) {
 form.batches.splice(idx, 1);
 runValidation();
}
function runValidation() {
 const editingId = ui.editingSample?.id || null;
 errors.value = store.validateSampleForm(form as any, editingId);
}
watch(() => ({ ...form, batches: [...form.batches] }), () => runValidation(), { deep: true });
function getFieldErrors(field: string): ValidationError[] {
 return errors.value.filter(e => e.field === field);
}
function hasAnyError(): boolean {
 return errors.value.some(e => e.type === 'error');
}
function onSealPhotoChange(e: Event) {
 const input = e.target as HTMLInputElement;
 const f = input.files?.[0];
 if (!f)
 return;
 const reader = new FileReader();
 reader.onload = ev => {
 form.sealPhoto = (ev.target?.result as string) || '';
 };
 reader.readAsDataURL(f);
}
function onEntryPhotoChange(idx: number, e: Event) {
 const input = e.target as HTMLInputElement;
 const f = input.files?.[0];
 if (!f)
 return;
 const reader = new FileReader();
 reader.onload = ev => {
 form.batches[idx].entryPhoto = (ev.target?.result as string) || '';
 };
 reader.readAsDataURL(f);
}
function close() {
 ui.closeForm();
}
function submit() {
 runValidation();
 if (hasAnyError()) {
 shakeForm.value = true;
 setTimeout(() => { shakeForm.value = false; }, 500);
 return;
 }
 if (isEdit.value && ui.editingSample) {
 store.updateSample(ui.editingSample.id, JSON.parse(JSON.stringify(form)));
 }
 else {
 store.createSample(JSON.parse(JSON.stringify(form)));
 }
 ui.closeForm();
}
function clsForField(field: string) {
 const errs = getFieldErrors(field);
 if (errs.length === 0)
 return 'border-cool-gray-300 focus:border-industrial-500 focus:ring-industrial-500/20';
 const hasErr = errs.some(e => e.type === 'error');
 return hasErr
 ? 'border-alert-red-400 focus:border-alert-red-500 focus:ring-alert-red-500/20 bg-alert-red-50/50'
 : 'border-warn-orange-400 focus:border-warn-orange-500 focus:ring-warn-orange-500/20 bg-warn-orange-50/50';
}
const errorSummary = computed(() => errors.value.filter(e => e.type === 'error'));
const warningSummary = computed(() => errors.value.filter(e => e.type === 'warning'));
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="ui.isFormDrawerOpen"
        class="fixed inset-0 z-50 flex"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>

        <div
          class="ml-auto relative w-full max-w-3xl h-full bg-cool-gray-50 shadow-2xl flex flex-col animate-slide-in overflow-hidden"
          :class="{ 'animate-shake': shakeForm }"
        >
          <div class="px-6 py-4 bg-industrial-800 text-white flex items-center justify-between shrink-0">
            <div>
              <h3 class="font-serif font-bold text-lg">{{ isEdit ? '编辑样板' : '新增样板封样' }}</h3>
              <p class="text-xs text-industrial-300 mt-0.5">
                {{ isEdit ? '修改已有封样记录，保留历史确认信息' : '填写样板基本信息、色板照片和厂家批次' }}
              </p>
            </div>
            <button class="p-2 rounded hover:bg-white/10 transition-colors" @click="close">
              <X :size="18" />
            </button>
          </div>

          <div v-if="errors.length > 0" class="px-6 py-3 bg-white border-b shrink-0 space-y-2">
            <div v-if="errorSummary.length" class="flex items-start gap-2 text-xs text-alert-red-700 bg-alert-red-50 border border-alert-red-200 rounded p-2.5">
              <AlertCircle :size="14" class="shrink-0 mt-0.5" />
              <div>
                <div class="font-bold mb-1">存在 {{ errorSummary.length }} 项必须修正的错误：</div>
                <ul class="list-disc list-inside space-y-0.5">
                  <li v-for="(e, i) in errorSummary" :key="i">{{ e.message }}</li>
                </ul>
              </div>
            </div>
            <div v-if="warningSummary.length" class="flex items-start gap-2 text-xs text-warn-orange-700 bg-warn-orange-50 border border-warn-orange-200 rounded p-2.5">
              <AlertTriangle :size="14" class="shrink-0 mt-0.5" />
              <div>
                <div class="font-bold mb-1">{{ warningSummary.length }} 项警告（可继续保存，建议处理）：</div>
                <ul class="list-disc list-inside space-y-0.5">
                  <li v-for="(e, i) in warningSummary" :key="i">{{ e.message }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <section class="space-y-4">
              <h4 class="text-sm font-serif font-bold text-industrial-800 pb-2 border-b border-cool-gray-200 flex items-center gap-2">
                <TagIcon :size="15" />基本信息
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">样板编号 <span class="text-alert-red-500">*</span></label>
                  <input
                    v-model="form.sampleNo"
                    type="text"
                    placeholder="如 CW-AL-2025-001"
                    class="w-full h-9 px-3 rounded border text-sm focus:outline-none focus:ring-2 transition-colors"
                    :class="clsForField('sampleNo')"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">版本号</label>
                  <input
                    v-model="form.version"
                    type="text"
                    placeholder="V1.0"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">材料类型</label>
                  <select
                    v-model="form.materialType"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                  >
                    <option v-for="m in MATERIAL_OPTIONS" :key="m" :value="m">{{ m }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">当前状态</label>
                  <select
                    v-model="form.status"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                  >
                    <option v-for="o in statusOptionsOnly" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">规格型号</label>
                  <input
                    v-model="form.specification"
                    type="text"
                    placeholder="如 3mm 银灰色 氟碳三涂 PVDF"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">生产厂家</label>
                  <input
                    v-model="form.manufacturer"
                    type="text"
                    placeholder="厂家全称"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">厂家联系人</label>
                  <input
                    v-model="form.manufacturerContact"
                    type="text"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">厂家联系电话</label>
                  <input
                    v-model="form.manufacturerPhone"
                    type="tel"
                    placeholder="手机号"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">封样确认人</label>
                  <input
                    v-model="form.sealConfirmer"
                    type="text"
                    placeholder="业主/设计/工程师"
                    class="w-full h-9 px-3 rounded border border-cool-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-cool-gray-700 mb-1">封样日期 <span class="text-alert-red-500">*</span></label>
                  <input
                    v-model="form.sealDate"
                    type="date"
                    class="w-full h-9 px-3 rounded text-sm focus:outline-none focus:ring-2"
                    :class="clsForField('sealDate')"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-cool-gray-700 mb-1">
                  封样色板照片 <span class="text-alert-red-500">*</span>
                </label>
                <div class="grid grid-cols-3 gap-3">
                  <label
                    class="relative aspect-square rounded-md border-2 border-dashed cursor-pointer transition-colors overflow-hidden flex flex-col items-center justify-center gap-2"
                    :class="form.sealPhoto ? 'border-cool-gray-200' : clsForField('sealPhoto') + ' hover:bg-cool-gray-50'"
                  >
                    <img v-if="form.sealPhoto" :src="form.sealPhoto" class="absolute inset-0 w-full h-full object-cover" />
                    <template v-else>
                      <Upload :size="24" class="text-cool-gray-400" />
                      <span class="text-xs text-cool-gray-500">点击上传色板</span>
                    </template>
                    <input type="file" accept="image/*" class="hidden" @change="onSealPhotoChange" />
                  </label>
                  <div class="col-span-2 flex flex-col justify-center text-xs text-cool-gray-500 space-y-1 px-2">
                    <div>· 建议上传标准色板与样板对比照</div>
                    <div>· JPG / PNG 格式，文件小于 5MB</div>
                    <div>· 请确保拍摄光线充足、颜色准确</div>
                    <div v-if="form.sealPhoto" class="text-emerald-600 font-medium flex items-center gap-1 pt-1">
                      <CheckCircle2 :size="14" /> 照片已上传
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-cool-gray-700 mb-1">备注说明</label>
                <textarea
                  v-model="form.remark"
                  rows="2"
                  placeholder="使用部位、颜色编号、特殊要求等"
                  class="w-full px-3 py-2 rounded border border-cool-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20 resize-none"
                ></textarea>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-cool-gray-200">
                <h4 class="text-sm font-serif font-bold text-industrial-800 flex items-center gap-2">
                  <FileImage :size="15" />厂家批次对照
                </h4>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-industrial-50 border border-industrial-200 text-industrial-700 text-xs font-medium hover:bg-industrial-100 transition-colors"
                  @click="addBatch"
                >
                  <Plus :size="13" /> 添加入场批次
                </button>
              </div>

              <div v-if="form.batches.length === 0" class="text-xs text-cool-gray-500 italic py-6 px-4 rounded bg-cool-gray-50 border border-cool-gray-100 text-center border-dashed">
                暂无批次记录，点击右上角按钮添加进场批次
              </div>

              <div
                v-for="(b, idx) in form.batches"
                :key="b.id"
                class="rounded-md border p-4 space-y-3 relative"
                :class="[
                  (getFieldErrors(`batch_${b.id}_batchNo`).length ||
                  getFieldErrors(`batch_${b.id}_entryDate`).length ||
                  getFieldErrors(`batch_${b.id}_entryPhoto`).length)
                    ? 'border-warn-orange-300 bg-warn-orange-50/30'
                    : 'border-cool-gray-200 bg-white',
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="text-xs font-bold text-industrial-700 bg-industrial-50 px-2 py-0.5 rounded">
                    批次 #{{ idx + 1 }}
                  </div>
                  <button
                    type="button"
                    class="p-1.5 rounded text-alert-red-500 hover:bg-alert-red-50 transition-colors"
                    @click="removeBatch(idx)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">厂家批次号 <span class="text-alert-red-500">*</span></label>
                    <input
                      v-model="b.batchNo"
                      type="text"
                      placeholder="出厂编号"
                      class="w-full h-8 px-2.5 rounded border text-xs focus:outline-none focus:ring-2"
                      :class="clsForField(`batch_${b.id}_batchNo`)"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">进场批次号</label>
                    <input
                      v-model="b.entryBatchNo"
                      type="text"
                      placeholder="内部编号"
                      class="w-full h-8 px-2.5 rounded border border-cool-gray-300 text-xs focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">进场日期</label>
                    <input
                      v-model="b.entryDate"
                      type="date"
                      class="w-full h-8 px-2.5 rounded border text-xs focus:outline-none focus:ring-2"
                      :class="clsForField(`batch_${b.id}_entryDate`)"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">进场数量</label>
                    <input
                      v-model="b.quantity"
                      type="text"
                      placeholder="如 200片 / 800㎡"
                      class="w-full h-8 px-2.5 rounded border border-cool-gray-300 text-xs focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">进场材料照片</label>
                  <div class="flex items-center gap-3">
                    <label
                      class="relative w-24 h-24 rounded border-2 border-dashed cursor-pointer transition-colors overflow-hidden flex flex-col items-center justify-center gap-1 shrink-0"
                      :class="b.entryPhoto ? 'border-cool-gray-200' : clsForField(`batch_${b.id}_entryPhoto`) + ' hover:bg-cool-gray-50'"
                    >
                      <img v-if="b.entryPhoto" :src="b.entryPhoto" class="absolute inset-0 w-full h-full object-cover" />
                      <template v-else>
                        <Upload :size="16" class="text-cool-gray-400" />
                        <span class="text-[10px] text-cool-gray-500">上传照片</span>
                      </template>
                      <input type="file" accept="image/*" class="hidden" @change="(e) => onEntryPhotoChange(idx, e)" />
                    </label>
                    <input
                      v-model="b.remark"
                      type="text"
                      placeholder="批次说明（如：颜色情况、质量问题等）"
                      class="flex-1 h-24 px-3 py-2 rounded border border-cool-gray-300 text-xs focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20 resize-none align-top"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div class="px-6 py-4 bg-white border-t border-cool-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              class="px-4 py-2 rounded border border-cool-gray-300 text-cool-gray-700 text-sm hover:bg-cool-gray-50 transition-colors"
              @click="close"
            >
              取消
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-industrial-800 hover:bg-industrial-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              @click="submit"
            >
              <Save :size="15" />
              {{ isEdit ? '保存修改' : '保存样板' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
