<template>
    <div class="workflow-run-page">


        <div class="run-layout">
            <el-card class="run-list" shadow="never">
                <div class="run-list__header">
                    <div class="run-list__title">运行记录</div>
                    <div class="run-list__filters">
                        <el-input size="small" placeholder="按运行 ID / 参数" disabled />
                    </div>
                </div>

                <div class="run-list__items">
                    <div v-for="record in runRecords" :key="record.id" class="run-item"
                        :class="{ 'run-item--active': selectedInstanceId === record.id }"
                        @click="selectInstance(record)">
                        <div class="run-item__top">
                            <div class="run-item__id">{{ record.businessKey }}</div>
                            <el-tag size="small"
                                :type="record.status === 'SUCCESS' ? 'success' : record.status === 'FAILED' ? 'danger' : 'warning'">
                                {{ record.status }}
                            </el-tag>
                        </div>
                        <div class="run-item__meta">
                            <span>{{ record.startDateTime }}</span>
                            <span>耗时 {{ record.duration }}</span>
                        </div>
                        <div class="run-item__desc">完成{{ record.runNodeNumber }}个节点.</div>

                        <div class="run-item__actions">
                            <div v-if="record.errorMessage" class="run-item__error">
                                <el-button size="small" text type="danger"
                                    @click="openErrorDialog(record)">异常信息</el-button>
                            </div>
                            <!-- 查看详情通过选择运行记录触发 -->
                        </div>
                    </div>
                </div>
            </el-card>

            <div class="run-detail">
                <el-card class="detail-card detail-card--summary" shadow="never">
                    <div class="detail-card__header">
                        <span>{{ workflowInfo.name }}</span>
                        <div class="detail-card__actions">
                            <el-button v-if="!isEditingSummary" size="small" type="primary" plain @click="onNodeConfig">
                                节点配置
                            </el-button>
                            <el-button v-if="!isEditingSummary" size="small" type="primary" plain @click="onEditFlow">
                                修改属性
                            </el-button>
                            <el-button v-else size="small" type="primary" plain @click="onSaveSummary">
                                保存
                            </el-button>
                            <el-button v-if="isEditingSummary" size="small" plain @click="onCancelSummary">
                                取消
                            </el-button>
                        </div>
                    </div>
                    <div class="summary-grid">
                        <div v-for="item in summaryItems" :key="item.key" class="summary-item"
                            :class="{ 'summary-item--editable': isEditingSummary }" @dblclick="openSummaryDialog(item)">
                            <div class="summary-label">{{ item.label }}</div>
                            <div class="summary-value">{{ item.value }}</div>
                        </div>

                    </div>
                </el-card>

                <el-card class="detail-card detail-card--inputs" shadow="never">
                    <div class="detail-card__header">
                        <span>入参</span>

                        <div class="detail-card__actions">
                            <el-button size="small" plain disabled>导入模板</el-button>
                            <el-button size="small" type="primary" plain disabled>保存草稿</el-button>
                            <span v-if="inputParamsLoading || inputParamsLoaded" class="input-status">
                                <el-icon v-if="inputParamsLoading" class="input-status__icon is-loading">
                                    <Loading />
                                </el-icon>
                                <el-icon v-else class="input-status__icon is-success">
                                    <Check />
                                </el-icon>
                            </span>
                        </div>
                    </div>
                    <div class="input-grid">
                        <div v-for="item in inputParams" :key="item.key" class="input-item">
                            <div class="input-item__label">{{ item.label }}</div>
                            <el-input v-model="item.value" size="large" :readonly="inputParamsReadonly" />
                            <div class="input-item__note">{{ item.note }}</div>
                        </div>
                    </div>
                </el-card>

                <el-card class="detail-card detail-card--output" shadow="never">
                    <div class="detail-card__header">
                        <span>执行结果</span>
                        <div class="detail-card__actions">
                            <el-tag size="small" :type="outputSummary.status === '成功' ? 'success' : 'danger'">
                                {{ outputSummary.status }}
                            </el-tag>
                            <el-button size="small" plain disabled>复制结果</el-button>
                        </div>
                    </div>
                    <div class="output-grid">
                        <div class="output-block output-block--full">
                            <div class="output-block__header">
                                <div class="output-block__title">运行日志</div>
                                <el-button class="output-block__refresh" type="primary" link :icon="Refresh"
                                    @click="onRefreshLogs" />
                            </div>
                            <div class="log-list">
                                <div v-for="log in executionLogs" :key="log.time + log.message" class="log-item">
                                    <span class="log-item__time">{{ log.time }}</span>
                                    <span class="log-item__level log-item__level--link" @click="openLevelDialog(log)">{{
                                        log.level }}</span>
                                    <span class="log-item__message">{{ log.message }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="output-block output-block--json">
                            <div class="output-block__title">返回结果</div>
                            <pre class="json-preview">{{ outputJson }}</pre>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>

        <el-dialog v-model="errorDialogVisible" :title="errorDialogTitle" width="480px">
            <div class="error-dialog__content">{{ errorDialogMessage }}</div>
        </el-dialog>
        <el-dialog v-model="summaryDialogVisible" :title="summaryDialogTitle" width="480px">
            <JsonEditor v-if="summaryDialogKey === 'params'" v-model="summaryDialogValue" :rows="10"
                placeholder="请输入 JSON" :auto-format="true" />
            <el-input v-else v-model="summaryDialogValue" size="large" />
            <template #footer>
                <el-button @click="summaryDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmSummaryEdit">确定</el-button>
            </template>
        </el-dialog>
        <el-dialog v-model="detailDialogVisible" title="查看详情" width="560px">
            <div class="detail-dialog__content">
                <JsonEditor v-model="detailDialogValue" :rows="12" :auto-format="true" />
            </div>
            <template #footer>
                <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
        <el-dialog v-model="levelDialogVisible" class="level-dialog" title="运行日志详情" width="1200px">
            <div class="level-dialog__content">
                <div class="level-dialog__top">
                    <div v-for="item in levelDialogTopFields" :key="item.key" class="level-field">
                        <div class="level-field__label">{{ item.label }}</div>
                        <div class="level-field__value">{{ item.value }}</div>
                    </div>
                </div>
                <div class="level-dialog__bottom"
                    :class="{ 'level-dialog__bottom--empty': isLevelInputEmpty && isLevelOutputEmpty }">
                    <div class="level-dialog__column">
                        <div class="level-field-json">
                            <div class="level-field__label">input</div>
                            <div class="level-field__value level-field__value--pre"
                                :class="{ 'level-field__value--empty': isLevelInputEmpty }">
                                {{ formattedLevelInput }}
                            </div>
                        </div>
                    </div>
                    <div class="level-dialog__column">
                        <div class="level-field-json">
                            <div class="level-field__label">output</div>
                            <div class="level-field__value level-field__value--pre"
                                :class="{ 'level-field__value--empty': isLevelOutputEmpty }">
                                {{ formattedLevelOutput }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { getInstances, getFlowDetail, getInstanceDetail, getInstanceRecords, getInstanceRecordDetail } from '@/api/dashboard';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Check, Loading, Refresh } from '@element-plus/icons-vue';
const flowId = 4;

const runRecords = ref([]);
const workflowInfo = ref({})
const originalWorkflowInfo = ref({});
const isEditingSummary = ref(false);
const summaryDialogVisible = ref(false);
const summaryDialogTitle = ref('');
const summaryDialogValue = ref('');
const summaryDialogKey = ref('');
const detailDialogVisible = ref(false);
const detailDialogValue = ref('');
const levelDialogVisible = ref(false);
const levelDialogData = ref({
    nodeId: '无数据',
    nodeKey: '无数据',
    status: '无数据',
    startTime: '无数据',
    endTime: '无数据',
    input: '无数据',
    output: '无数据'
});
const inputParams = ref([]);
const inputParamsReadonly = ref(false);
const selectedInstanceId = ref(null);
const inputParamsLoading = ref(false);
const inputParamsLoaded = ref(false);
const errorDialogVisible = ref(false);
const errorDialogMessage = ref('');
const errorDialogTitle = ref('异常信息');
const outputJson = ref('无数据');
const executionLogs = ref([]);

onMounted(async () => {
    runRecords.value = await getInstances(flowId);
    console.log(runRecords.value);
    workflowInfo.value = await getFlowDetail(flowId);
})

const openErrorDialog = (record) => {
    errorDialogMessage.value = record?.errorMessage || '';
    errorDialogTitle.value = record?.businessKey ? `异常信息 - ${record.businessKey}` : '异常信息';
    errorDialogVisible.value = true;
}

const formatSummaryValue = (key, value) => {
    if (key === 'params' && value && typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch (err) {
            return String(value);
        }
    }
    return value ?? '';
};

const summaryItems = computed(() => [
    { key: 'code', label: '工作流编码', value: formatSummaryValue('code', workflowInfo.value?.code) },
    { key: 'description', label: '工作流说明', value: formatSummaryValue('description', workflowInfo.value?.description) },
    { key: 'params', label: '工作流启动参数', value: formatSummaryValue('params', workflowInfo.value?.params) }
]);

const onEditFlow = () => {
    isEditingSummary.value = true;
    originalWorkflowInfo.value = JSON.parse(JSON.stringify(workflowInfo.value || {}));
};

const onNodeConfig = () => {
    router.push({
        path: '/flow-canvas',
        query: { flowId: row.id }
    })
}

const onSaveSummary = () => {
    isEditingSummary.value = false;
};

const onCancelSummary = () => {
    workflowInfo.value = JSON.parse(JSON.stringify(originalWorkflowInfo.value || {}));
    isEditingSummary.value = false;
};

const openSummaryDialog = (item) => {
    if (!isEditingSummary.value) return;
    summaryDialogKey.value = item.key;
    summaryDialogTitle.value = `修改${item.label}`;
    summaryDialogValue.value = item.value ?? '';
    summaryDialogVisible.value = true;
};

const confirmSummaryEdit = () => {
    if (!summaryDialogKey.value) return;
    workflowInfo.value = {
        ...workflowInfo.value,
        [summaryDialogKey.value]: summaryDialogValue.value
    };
    summaryDialogVisible.value = false;
};

const selectInstance = (record) => {
    selectedInstanceId.value = record?.id ?? null;
    if (selectedInstanceId.value) {
        refreshExecutionLogs(selectedInstanceId.value);
    } else {
        executionLogs.value = [];
    }
    openDetailDialog(record);
};

const mapInputParams = (rawInput) => {
    if (!rawInput) return [];
    if (typeof rawInput === 'string') {
        try {
            const parsed = JSON.parse(rawInput);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return Object.entries(parsed).map(([key, value]) => ({
                    key,
                    label: key,
                    value: value ?? '',
                    note: ''
                }));
            }
            return [
                {
                    key: 'input',
                    label: 'input',
                    value: rawInput,
                    note: ''
                }
            ];
        } catch (err) {
            return [
                {
                    key: 'input',
                    label: 'input',
                    value: rawInput,
                    note: ''
                }
            ];
        }
    }
    if (rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput)) {
        return Object.entries(rawInput).map(([key, value]) => ({
            key,
            label: key,
            value: value ?? '',
            note: ''
        }));
    }
    return [];
};

const continueDetail = async (record) => {
    // TODO: 继续后的逻辑（暂留空）
    const instanceId = record?.id ?? selectedInstanceId.value;
    if (!instanceId) {
        ElMessage.error('缺少运行实例ID');
        return;
    }
    refreshExecutionLogs(instanceId);
    inputParamsLoading.value = true;
    inputParamsLoaded.value = false;
    try {
        const detail = await getInstanceDetail(instanceId);
        const input = detail?.input ?? '';
        inputParams.value = mapInputParams(input);
        outputJson.value = formatJsonDisplay(detail?.output);
        inputParamsReadonly.value = true;
        inputParamsLoaded.value = true;
    } catch (err) {
        inputParamsLoaded.value = false;
    } finally {
        inputParamsLoading.value = false;
    }
};

const openDetailDialog = async (record) => {
    const filledParams = inputParams.value.filter(
        (item) => item.value !== null && item.value !== undefined && String(item.value).trim() !== ''
    );
    if (!filledParams.length || selectedInstanceId.value) {
        continueDetail(record);
        return;
    }
    try {
        await ElMessageBox.confirm('已检查到有参数填写，是否继续?', '提示', {
            confirmButtonText: '继续',
            cancelButtonText: '不继续',
            type: 'warning'
        });
        continueDetail(record);
    } catch (err) {
        // 用户取消，直接退出
    }
};

const formatDetailDate = (value) => {
    if (!value) return '无数据';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '无数据';
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

const formatDetailValue = (value) => {
    if (value === null || value === undefined || value === '') return '无数据';
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch (err) {
        return String(value);
    }
};

const buildLevelDialogData = (detail, log) => ({
    nodeId: formatDetailValue(detail?.nodeId),
    nodeKey: formatDetailValue(detail?.nodeKey ?? log?.nodeKey),
    status: formatDetailValue(detail?.status ?? log?.status),
    startTime: formatDetailDate(detail?.startTime ?? log?.startTime),
    endTime: formatDetailDate(detail?.endTime),
    input: formatDetailValue(detail?.input),
    output: formatDetailValue(detail?.output)
});

const openLevelDialog = async (log) => {
    levelDialogData.value = buildLevelDialogData(null, log);
    levelDialogVisible.value = true;
    if (!log?.id) {
        return;
    }
    try {
        const detail = await getInstanceRecordDetail(log.id);
        levelDialogData.value = buildLevelDialogData(detail, log);
    } catch (err) {
        levelDialogData.value = buildLevelDialogData(null, log);
    }
};

const formatLogTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

const mapStatusToLevel = (status) => {
    if (!status) return 'INFO';
    const normalized = String(status).toUpperCase();
    if (normalized === 'FAILED') return 'ERROR';
    if (normalized === 'RUNNING' || normalized === 'WAITING') return 'INFO';
    return 'SUCCESS';
};

const refreshExecutionLogs = async (instanceId) => {
    try {
        const records = await getInstanceRecords(instanceId);
        executionLogs.value = (records || []).map((record) => ({
            id: record?.id,
            time: formatLogTime(record?.startTime),
            level: mapStatusToLevel(record?.status),
            message: record?.nodeKey || '',
            nodeKey: record?.nodeKey,
            status: record?.status,
            startTime: record?.startTime
        }));
    } catch (err) {
        executionLogs.value = [];
    }
};

const onRefreshLogs = () => {
    if (!selectedInstanceId.value) {
        ElMessage.warning('请先选择运行实例');
        return;
    }
    refreshExecutionLogs(selectedInstanceId.value);
};

const levelDialogTopFields = computed(() => [
    { key: 'nodeId', label: 'nodeId', value: levelDialogData.value.nodeId },
    { key: 'nodeKey', label: 'nodeKey', value: levelDialogData.value.nodeKey },
    { key: 'status', label: 'status', value: levelDialogData.value.status },
    { key: 'startTime', label: 'startTime', value: levelDialogData.value.startTime },
    { key: 'endTime', label: 'endTime', value: levelDialogData.value.endTime }
]);

const formatJsonDisplay = (value) => {
    if (value === '无数据') return value;
    if (value === null || value === undefined) return '无数据';
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '无数据';
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
                return JSON.stringify(parsed, null, 2);
            }
        } catch (err) {
            return value;
        }
        return value;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch (err) {
        return String(value);
    }
};

const formattedLevelInput = computed(() => formatJsonDisplay(levelDialogData.value.input));
const formattedLevelOutput = computed(() => formatJsonDisplay(levelDialogData.value.output));
const isLevelInputEmpty = computed(() => formattedLevelInput.value === '无数据');
const isLevelOutputEmpty = computed(() => formattedLevelOutput.value === '无数据');

// const workflowInfo = {
//   name: '智能外呼编排流程',
//   code: 'WF-OUTBOUND-CALL',
//   version: 'v2.3.1',
//   owner: '运营增长组',
//   updatedAt: '2026-01-22 18:40',
//   description: '根据营销标签分群并触达客户，联动风控、短信与外呼通道。',
//   window: '每日 09:00 - 20:00',
//   environment: '生产环境 / 华东二区',
//   concurrency: '300 并发'
// }
/* 
runRecords = [
  {
    id: 'RUN-20260128-0935',
    status: '成功',
    startedAt: '2026-01-28 09:35:12',
    duration: '3.2s',
    trigger: '手动触发',
    operator: 'Zhang Lizhong',
    summary: '完成 24 个节点，未触发异常。'
  },
  {
    id: 'RUN-20260127-2150',
    status: '成功',
    startedAt: '2026-01-27 21:50:03',
    duration: '4.1s',
    trigger: '定时触发',
    operator: 'Scheduler',
    summary: '20 个节点执行完成，短信通道命中 3 个。'
  },
  {
    id: 'RUN-20260127-1630',
    status: '失败',
    startedAt: '2026-01-27 16:30:44',
    duration: '2.7s',
    trigger: '手动触发',
    operator: 'Zhang Lizhong',
    summary: '外呼供应商返回 500，流程中断。'
  },
  {
    id: 'RUN-20260126-1015',
    status: '警告',
    startedAt: '2026-01-26 10:15:09',
    duration: '5.5s',
    trigger: '定时触发',
    operator: 'Scheduler',
    summary: '风控节点超时 1 次，自动降级成功。'
  }
] */

watch(
    () => workflowInfo.value?.params,
    (params) => {
        if (!params) {
            inputParams.value = [];
            return;
        }
        let parsed = params;
        if (typeof params === 'string') {
            try {
                parsed = JSON.parse(params);
            } catch (err) {
                console.warn('workflowInfo.params 不是合法 JSON', err);
                inputParams.value = [];
                return;
            }
        }
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            inputParams.value = Object.entries(parsed).map(([key, value]) => ({
                key,
                label: key,
                value: value ?? '',
                note: ''
            }));
            return;
        }
        inputParams.value = [];
    },
    { immediate: true }
);

const outputSummary = {
    status: '成功',
    duration: '3.2s',
    totalNodes: 24,
    successNodes: 24,
    errorNode: '无'
}
</script>

<style scoped>
.workflow-run-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

.page-hero :deep(.el-card__body) {
    padding: 16px 18px;
}

.page-hero__main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.page-hero__title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 6px;
}

.page-hero__subtitle {
    color: #666;
    font-size: 13px;
    margin-bottom: 10px;
}

.page-hero__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.page-hero__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.run-layout {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 12px;
    min-height: 0;
    height: 100%;
    flex: 1 1 auto;
    align-items: start;
    overflow: hidden;
}

.run-list {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.run-list :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
}

.run-list__header {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.run-list__title {
    font-size: 16px;
    font-weight: 600;
}

.run-list__filters :deep(.el-input__wrapper) {
    background: #f6f7f9;
}

.run-list__items {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: auto;
    padding-right: 4px;
}

.run-item {
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #fff;
}

.run-item--active {
    border-color: #9cc6ff;
    box-shadow: 0 0 0 1px rgba(31, 122, 224, 0.2);
}

.run-item__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.run-item__id {
    font-weight: 600;
    font-size: 14px;
}

.run-item__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 12px;
    color: #777;
}

.run-item__desc {
    font-size: 13px;
    color: #444;
}

.run-item__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #666;
}

.run-item__detail {
    margin-left: auto;
    white-space: nowrap;
}

.run-item__error :deep(.el-button) {
    padding: 0;
}

.error-dialog__content {
    font-size: 13px;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
}

.run-detail {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow: auto;
    min-height: 0;
    overscroll-behavior: contain;
}

.detail-card {
    display: flex;
    flex-direction: column;
    height: auto;

}

.detail-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: auto;
}

.detail-card--summary {
    flex: 0 0 auto;
    min-height: 140px;
}

.detail-card--inputs {
    flex: 0 0 auto;
    min-height: 260px;
}

.detail-card--output {
    flex: 0 0 auto;
    min-height: 260px;
}

.detail-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.detail-card__actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.input-status {
    display: inline-flex;
    align-items: center;
    margin-left: 6px;
}

.input-status__icon {
    font-size: 14px;
}

.input-status__icon.is-loading {
    color: #1f7ae0;
    animation: spin 1s linear infinite;
}

.input-status__icon.is-success {
    color: #33b56b;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
}

.summary-item {
    background: #f8f9fb;
    border-radius: 10px;
    padding: 10px 12px;
}

.summary-label {
    font-size: 12px;
    color: #777;
    margin-bottom: 4px;
}

.summary-value {
    display: block;
    font-size: 13px;
    color: #2f2f2f;
    min-height: 18px;
}

.summary-item--editable .summary-value {
    background: #fff;
    border-bottom: 2px solid #1f7ae0;
    padding: 4px 0;
}

.input-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
}

.input-item {
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 12px 14px;
    background: #fff;
}

.input-item :deep(.el-input) {
    width: 100%;
}

.input-item__label {
    font-size: 12px;
    color: #777;
    margin-bottom: 4px;
}

.input-item__note {
    font-size: 12px;
    color: #999;
}

.output-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto 1fr;
    gap: 12px;
    height: auto;
}

.output-block {
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 10px 12px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.output-block--json {
    grid-column: 1 / -1;
}

.output-block--full {
    grid-column: 1 / -1;
}

.output-block__title {
    font-size: 13px;
    font-weight: 600;
}

.output-block__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.output-block__refresh {
    padding: 0;
    height: auto;
}

.output-metrics {
    display: flex;
    flex-wrap: nowrap;
    gap: 16px;
    align-items: center;
}

.output-metric {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    white-space: nowrap;
}

.output-metric__label {
    font-size: 12px;
    color: #777;
}

.output-metric__value {
    font-size: 14px;
    font-weight: 600;
    color: #2f2f2f;
}

.log-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 12px;
    color: #555;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 4px;
    min-height: 0;
}

.log-item {
    display: grid;
    grid-template-columns: 120px 60px 1fr;
    gap: 8px;
    align-items: center;
}

.log-item__time {
    color: #666;
}

.log-item__level {
    font-weight: 600;
    color: #1f7ae0;
}

.log-item__level--link {
    cursor: pointer;
}

.level-dialog :deep(.el-dialog) {
    background: #f2f3f5;
    height: 800px;
    max-height: 800px;
}

.level-dialog :deep(.el-dialog__header),
.level-dialog :deep(.el-dialog__body),
.level-dialog :deep(.el-dialog__footer) {
    background: #f2f3f5;
}

.level-dialog__content {
    display: grid;
    gap: 10px;
    grid-template-rows: auto 1fr;
    height: 100%;
}

.level-dialog__top {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.level-dialog__bottom {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    height: 350px;
    min-height: 0;
}

.level-dialog__bottom--empty {
    height: auto;
}

.level-dialog__column {
    min-height: 0;
}

.level-field {
    display: grid;
    gap: 6px;
}

.level-field-json {
    display: grid;
    gap: 6px;
    height: 300px;
}

.level-field__label {
    font-size: 16px;
    font-weight: 600;
    height: 24px;
    color: #1f7ae0;
}

.level-field-json .level-field__value {
    height: 300px;
}

.level-field__value {
    background: #ffffff;
    color: #222;
    border-radius: 6px;
    border: 1px solid #eaeaea;
    padding: 8px 10px;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-all;
    max-height: 100%;
    overflow: auto;
}

.level-field__value--pre {
    white-space: pre-wrap;
    font-family: "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.level-field-json .level-field__value {
    height: 300px;
}

.level-field-json .level-field__value--empty {
    height: 24px;
}

.level-field-json {
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
}

.level-field-json .level-field__value {
    max-height: 100%;
}

.log-item__message {
    color: #444;
}

.json-preview {
    white-space: pre-wrap;
    font-size: 12px;
    color: #333;
    background: #f8f9fb;
    border-radius: 8px;
    padding: 10px;
    margin: 0;
}

@media (max-width: 1200px) {
    .run-layout {
        grid-template-columns: 1fr;
        height: auto;
    }

    .detail-card--summary,
    .detail-card--inputs,
    .detail-card--output {
        min-height: auto;
    }

    .summary-grid,
    .input-grid,
    .output-grid {
        grid-template-columns: 1fr;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
