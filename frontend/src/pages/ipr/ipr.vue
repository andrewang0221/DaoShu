<template>
  <view class="page">
    <TaijiBackButton floating />
    <!-- ===================== 服务首页 ===================== -->
    <block v-if="view === 'home'">
      <view class="hero">
        <view class="hero-title">知识产权服务</view>
        <view class="hero-sub">个人沉淀知识库 · 原创成果确权 · 著作权代办与数字存证</view>
      </view>

      <!-- 服务卡片 -->
      <view v-for="s in services" :key="s.serviceType" class="svc-card">
        <view class="svc-head">
          <view class="svc-icon">{{ s.serviceType === 'copyright' ? '©️' : '🔏' }}</view>
          <view class="svc-titles">
            <view class="svc-name">{{ s.name }}</view>
            <view class="svc-tagline">{{ s.tagline }}</view>
          </view>
        </view>
        <view class="svc-desc">{{ s.desc }}</view>
        <view class="svc-tags">
          <text v-for="h in s.highlights" :key="h" class="svc-tag">✦ {{ h }}</text>
        </view>
        <view class="svc-meta">
          <view class="meta-line"><text class="meta-label">出证机构</text><text class="meta-val">{{ s.authority }}</text></view>
          <view class="meta-line"><text class="meta-label">办理周期</text><text class="meta-val">{{ s.duration }}</text></view>
          <view class="meta-line"><text class="meta-label">交付成果</text><text class="meta-val">{{ s.deliverable }}</text></view>
          <view class="meta-line"><text class="meta-label">平台服务费</text><text class="meta-val fee">{{ s.serviceFee }} 积分</text></view>
        </view>
        <view class="svc-btn" @tap="startApply(s.serviceType)">立即申请</view>
      </view>

      <!-- 流程说明 -->
      <view class="flow-card">
        <view class="flow-title">办理流程</view>
        <view class="flow-steps">
          <view class="flow-step"><text class="step-no">1</text><text class="step-txt">选择沉淀作品或填写作品信息</text></view>
          <view class="flow-step"><text class="step-no">2</text><text class="step-txt">提交著作权人实名信息</text></view>
          <view class="flow-step"><text class="step-no">3</text><text class="step-txt">平台审核材料并代办申报</text></view>
          <view class="flow-step"><text class="step-no">4</text><text class="step-txt">出证后下发电子/纸质证书</text></view>
        </view>
      </view>

      <view class="my-entry" @tap="view = 'mine'">
        <text>📋 我的申请与证书</text>
        <text class="entry-arrow">›</text>
      </view>
    </block>

    <!-- ===================== 申请表单 ===================== -->
    <block v-else-if="view === 'apply'">
      <view class="topbar">
        <view class="back-btn" @tap="view = 'home'">‹ 服务</view>
        <view class="topbar-title">{{ currentSvc ? currentSvc.name : '知识产权申请' }}</view>
        <view class="back-btn placeholder"></view>
      </view>

      <view v-if="!isLoggedIn" class="guest-tip">
        <view class="guest-title">登录后即可申请</view>
        <view class="guest-desc">著作权与存证证书需绑定实名账户，请先登录 / 注册</view>
        <view class="btn primary" @tap="goLogin">登录 / 注册</view>
      </view>

      <template v-else>
        <!-- 服务选择 -->
        <view class="form-card">
          <view class="form-label">服务类型 <text class="req">*</text></view>
          <view class="svc-pick-row">
            <view
              v-for="s in services"
              :key="s.serviceType"
              class="svc-pick"
              :class="{ active: form.serviceType === s.serviceType }"
              @tap="pickService(s.serviceType)"
            >
              <text class="pick-icon">{{ s.serviceType === 'copyright' ? '©️' : '🔏' }}</text>
              <text class="pick-name">{{ s.name }}</text>
              <text class="pick-fee">{{ s.serviceFee }} 积分</text>
            </view>
          </view>
        </view>

        <!-- 作品信息 -->
        <view class="form-card">
          <view class="form-label">作品来源</view>
          <view class="src-row">
            <view class="src-opt" :class="{ active: useMyWork }" @tap="toggleSource(true)">从我的沉淀选择</view>
            <view class="src-opt" :class="{ active: !useMyWork }" @tap="toggleSource(false)">手动填写作品</view>
          </view>

          <view v-if="useMyWork" class="works-box">
            <view v-if="!works.length" class="works-empty">
              暂无可确权的沉淀内容（研学笔记、求道问答、论道纪要等），可手动填写作品
            </view>
            <view
              v-for="w in works"
              :key="w.source + w.refId"
              class="work-item"
              :class="{ active: form.workRefId === w.refId }"
              @tap="pickWork(w)"
            >
              <view class="work-title">{{ w.title }}</view>
              <view class="work-excerpt">{{ w.excerpt }}</view>
              <view class="work-meta">{{ sourceLabel(w.source) }} · {{ w.words }} 字</view>
            </view>
          </view>

          <view class="form-label block">作品名称 <text class="req">*</text></view>
          <input v-model="form.workTitle" class="form-input" placeholder="如：道德经研学心得集（第1-10章）" placeholder-class="ph" />

          <view class="form-label block">作品类别 <text class="req">*</text></view>
          <picker :range="workTypeOptions" @change="onWorkTypeChange">
            <view class="picker-value">{{ form.workType || '请选择作品类别' }}</view>
          </picker>

          <view class="form-label block">作品简介 / 创作说明</view>
          <textarea
            v-model="form.workDesc"
            class="form-textarea"
            placeholder="简述作品内容、创作时间、独创性说明（将作为申报材料）…"
            placeholder-class="ph"
          />
          <view class="word-count">{{ form.workDesc.length }} / 2000</view>
        </view>

        <!-- 著作权人信息 -->
        <view class="form-card">
          <view class="form-label">著作权人 / 申请人信息 <text class="req">*</text></view>
          <view class="form-label block">真实姓名</view>
          <input v-model="form.appName" class="form-input" placeholder="与证件一致的姓名" placeholder-class="ph" />
          <view class="form-label block">联系电话</view>
          <input v-model="form.appPhone" class="form-input" type="number" placeholder="用于进度通知" placeholder-class="ph" />
          <view class="form-label block">电子邮箱</view>
          <input v-model="form.appEmail" class="form-input" placeholder="接收电子证书（选填）" placeholder-class="ph" />

          <template v-if="form.serviceType === 'copyright'">
            <view class="form-label block">证件类型</view>
            <picker :range="idTypes" @change="onIdTypeChange">
              <view class="picker-value">{{ form.appIdType || '请选择证件类型' }}</view>
            </picker>
            <view class="form-label block">证件号码</view>
            <input v-model="form.appIdNo" class="form-input" placeholder="身份证 / 护照等证件号" placeholder-class="ph" />
            <view class="form-label block">通讯地址（寄送纸质证书）</view>
            <textarea
              v-model="form.appAddress"
              class="form-textarea short"
              placeholder="省市区 + 详细地址 + 邮编"
              placeholder-class="ph"
            />
          </template>
        </view>

        <view class="fee-bar">
          <view>
            <view class="fee-label">平台服务费</view>
            <view class="fee-value">{{ currentSvc ? currentSvc.serviceFee : 0 }} 积分</view>
          </view>
          <view class="submit-btn" :class="{ disabled: submitting }" @tap="submit">
            {{ submitting ? '提交中…' : '确认提交申请' }}
          </view>
        </view>
        <view class="agree-tip">提交即表示同意《知识产权代办服务协议》，实名信息仅用于申报，平台予以保密。</view>
      </template>
    </block>

    <!-- ===================== 我的申请 ===================== -->
    <block v-else-if="view === 'mine'">
      <view class="topbar">
        <view class="back-btn" @tap="view = 'home'">‹ 服务</view>
        <view class="topbar-title">我的申请与证书</view>
        <view class="back-btn placeholder"></view>
      </view>

      <view v-if="!isLoggedIn" class="guest-tip">
        <view class="guest-title">登录后查看申请</view>
        <view class="btn primary" @tap="goLogin">登录 / 注册</view>
      </view>

      <template v-else>
        <view v-if="!applications.length" class="empty-tip">
          暂无申请记录，去为你的原创成果申请保护吧
        </view>

        <!-- 已发证：证书卡片 -->
        <view v-for="a in applications" :key="a.id" class="app-card">
          <view v-if="a.status === 'certified'" class="cert-card">
            <view class="cert-border">
              <view class="cert-seal">道枢</view>
              <view class="cert-title">{{ a.serviceType === 'copyright' ? '作品著作权登记证书' : '数字知识产权存证证书' }}</view>
              <view class="cert-sub">CERTIFICATE OF INTELLECTUAL PROPERTY</view>
              <view class="cert-row"><text class="cert-label">作品名称</text><text class="cert-val">{{ a.workTitle }}</text></view>
              <view class="cert-row"><text class="cert-label">著作权人</text><text class="cert-val">{{ applicantName(a) }}</text></view>
              <view class="cert-row"><text class="cert-label">证书编号</text><text class="cert-val strong">{{ a.certNo }}</text></view>
              <view class="cert-row"><text class="cert-label">出证日期</text><text class="cert-val">{{ fmtDate(a.certifiedAt) }}</text></view>
              <view class="cert-foot">本证书由道枢平台联合{{ a.serviceType === 'copyright' ? '版权登记代理机构' : '存证机构' }}核发，可凭编号核验</view>
            </view>
          </view>

          <view class="app-head">
            <view class="app-title">{{ a.workTitle }}</view>
            <view class="status-badge" :class="a.status">{{ statusLabel(a.status) }}</view>
          </view>
          <view class="app-line"><text class="app-k">服务类型</text><text class="app-v">{{ serviceLabel(a.serviceType) }}</text></view>
          <view class="app-line"><text class="app-k">作品类别</text><text class="app-v">{{ a.workType }}</text></view>
          <view class="app-line"><text class="app-k">申请单号</text><text class="app-v">{{ a.applicationNo }}</text></view>
          <view class="app-line"><text class="app-k">提交时间</text><text class="app-v">{{ fmtDate(a.submittedAt || a.createdAt) }}</text></view>
          <view v-if="a.status === 'rejected' && a.rejectReason" class="reject-box">
            驳回原因：{{ a.rejectReason }}
          </view>
          <view v-if="a.status === 'reviewing'" class="progress-tip">材料审核中，平台将代办申报，请保持电话畅通</view>
          <view v-if="a.status === 'submitted'" class="progress-tip">已提交，等待平台受理（1 个工作日内）</view>
        </view>
      </template>
    </block>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api, IprService, IprWork, IprApplication } from '../../api';
import { useAppStore } from '../../store';
import TaijiBackButton from '../../components/TaijiBackButton.vue';

const store = useAppStore();
store.restore();
const isLoggedIn = computed(() => store.isLoggedIn);

const view = ref<'home' | 'apply' | 'mine'>('home');
const services = ref<IprService[]>([]);
const works = ref<IprWork[]>([]);
const applications = ref<IprApplication[]>([]);
const useMyWork = ref(false);
const submitting = ref(false);

const form = reactive({
  serviceType: 'copyright' as 'copyright' | 'digital_cert',
  workTitle: '',
  workType: '',
  workDesc: '',
  workSource: 'custom',
  workRefId: '' as string | null,
  appName: '',
  appPhone: '',
  appEmail: '',
  appIdType: '',
  appIdNo: '',
  appAddress: '',
});

const idTypes = ['居民身份证', '护照', '港澳居民来往内地通行证', '台湾居民来往大陆通行证', '其他'];
const workTypeOptions = computed(() => currentSvc.value?.workTypes ?? ['文字作品']);
const currentSvc = computed(() => services.value.find((s) => s.serviceType === form.serviceType));

onShow(() => {
  loadCatalog();
  if (isLoggedIn.value) {
    loadWorks();
    loadApplications();
  }
});

async function loadCatalog() {
  try {
    const r = await api.iprCatalog();
    services.value = r.services;
  } catch {
    services.value = [];
  }
}
async function loadWorks() {
  try {
    const r = await api.iprWorks();
    works.value = r.works;
  } catch {
    works.value = [];
  }
}
async function loadApplications() {
  try {
    const r = await api.iprApplications();
    applications.value = r.applications;
  } catch {
    applications.value = [];
  }
}

function startApply(t: 'copyright' | 'digital_cert') {
  if (!isLoggedIn.value) {
    view.value = 'apply';
    return;
  }
  form.serviceType = t;
  view.value = 'apply';
  loadWorks();
}

function pickService(t: 'copyright' | 'digital_cert') {
  form.serviceType = t;
  form.workType = '';
}

function toggleSource(useMine: boolean) {
  useMyWork.value = useMine;
  if (useMine) loadWorks();
}

function pickWork(w: IprWork) {
  form.workRefId = w.refId;
  form.workSource = w.source;
  if (!form.workTitle) form.workTitle = w.title;
  if (!form.workDesc) form.workDesc = w.excerpt;
}

function onWorkTypeChange(e: { detail: { value: number } }) {
  form.workType = workTypeOptions.value[e.detail.value];
}
function onIdTypeChange(e: { detail: { value: number } }) {
  form.appIdType = idTypes[e.detail.value];
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' });
}

function sourceLabel(s: string): string {
  const map: Record<string, string> = {
    notes: '研学笔记',
    dao: '求道问答',
    symposium: '论道纪要',
    industry: '行业案例',
    custom: '自定义',
  };
  return map[s] ?? '原创内容';
}
function serviceLabel(t: string): string {
  return t === 'copyright' ? '著作权登记代办' : '数字知识产权存证认证';
}
function statusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '待受理',
    reviewing: '办理中',
    certified: '已发证',
    rejected: '已驳回',
  };
  return map[s] ?? s;
}
function applicantName(a: IprApplication): string {
  return String((a.applicant as { name?: string })?.name ?? '—');
}
function fmtDate(d: string | null): string {
  if (!d) return '—';
  return String(d).slice(0, 10).replace(/-/g, ' . ');
}

async function submit() {
  if (submitting.value) return;
  if (!form.workTitle.trim()) return uni.showToast({ title: '请填写作品名称', icon: 'none' });
  if (!form.workType) return uni.showToast({ title: '请选择作品类别', icon: 'none' });
  if (!form.appName.trim()) return uni.showToast({ title: '请填写著作权人姓名', icon: 'none' });
  if (!form.appPhone.trim()) return uni.showToast({ title: '请填写联系电话', icon: 'none' });
  if (form.serviceType === 'copyright') {
    if (!form.appIdType) return uni.showToast({ title: '请选择证件类型', icon: 'none' });
    if (!form.appIdNo.trim()) return uni.showToast({ title: '请填写证件号码', icon: 'none' });
    if (!form.appAddress.trim()) return uni.showToast({ title: '请填写通讯地址', icon: 'none' });
  }
  const fee = currentSvc.value?.serviceFee ?? 0;
  const confirm = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '确认提交申请',
      content: `将扣减 ${fee} 积分服务费，提交后平台开始代办申报，是否继续？`,
      confirmText: '确认提交',
      success: (r) => resolve(!!r.confirm),
      fail: () => resolve(false),
    });
  });
  if (!confirm) return;

  submitting.value = true;
  try {
    await api.iprSubmit({
      serviceType: form.serviceType,
      workTitle: form.workTitle.trim(),
      workType: form.workType,
      workSource: form.workSource,
      workRefId: form.workRefId ?? undefined,
      workMeta: {
        desc: form.workDesc.trim(),
        words: form.workDesc.length,
        sourceLabel: sourceLabel(form.workSource),
      },
      applicant: {
        name: form.appName.trim(),
        phone: form.appPhone.trim(),
        email: form.appEmail.trim(),
        idType: form.appIdType,
        idNo: form.appIdNo.trim(),
        address: form.appAddress.trim(),
      },
    });
    uni.showToast({ title: '申请已提交', icon: 'success' });
    await loadApplications();
    view.value = 'mine';
  } catch {
    // 错误已统一提示
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page {
  padding: 30rpx;
  padding-bottom: 60rpx;
}

/* ---------- 首页 ---------- */
.hero {
  text-align: center;
  padding: 30rpx 0 20rpx;
}
.hero-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #3a3226;
  letter-spacing: 6rpx;
}
.hero-sub {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8a7f6a;
  letter-spacing: 2rpx;
}

.svc-card {
  background: #fffdf7;
  border: 1rpx solid #e8dcc3;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-top: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(90, 74, 40, 0.06);
}
.svc-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.svc-icon {
  font-size: 52rpx;
}
.svc-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #3a3226;
}
.svc-tagline {
  font-size: 22rpx;
  color: #a08f6c;
  margin-top: 4rpx;
}
.svc-desc {
  font-size: 26rpx;
  color: #6b5f49;
  line-height: 1.7;
  margin: 20rpx 0;
}
.svc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.svc-tag {
  font-size: 22rpx;
  color: #5b6b52;
  background: #eef1e8;
  border-radius: 8rpx;
  padding: 6rpx 16rpx;
}
.svc-meta {
  background: #faf5e9;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}
.meta-line {
  display: flex;
  padding: 6rpx 0;
  font-size: 24rpx;
}
.meta-label {
  width: 140rpx;
  color: #a08f6c;
  flex-shrink: 0;
}
.meta-val {
  color: #4a4030;
  flex: 1;
}
.meta-val.fee {
  color: #b8860b;
  font-weight: 700;
}
.svc-btn {
  margin-top: 24rpx;
  background: linear-gradient(135deg, #5b6b52, #435140);
  color: #f6f1e6;
  text-align: center;
  padding: 22rpx;
  border-radius: 14rpx;
  font-size: 28rpx;
  letter-spacing: 4rpx;
}

.flow-card {
  background: #fffdf7;
  border: 1rpx solid #e8dcc3;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-top: 24rpx;
}
.flow-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #3a3226;
  margin-bottom: 20rpx;
  text-align: center;
  letter-spacing: 4rpx;
}
.flow-step {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 12rpx 0;
}
.step-no {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #5b6b52;
  color: #f6f1e6;
  text-align: center;
  line-height: 44rpx;
  font-size: 24rpx;
  flex-shrink: 0;
}
.step-txt {
  font-size: 26rpx;
  color: #5a5040;
}
.my-entry {
  margin-top: 28rpx;
  background: #fffdf7;
  border: 1rpx solid #e8dcc3;
  border-radius: 16rpx;
  padding: 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #3a3226;
  font-weight: 600;
}
.entry-arrow {
  color: #c9a96e;
  font-size: 36rpx;
}

/* ---------- 通用顶栏 ---------- */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0 24rpx;
}
.back-btn {
  font-size: 28rpx;
  color: #5b6b52;
  width: 120rpx;
}
.back-btn.placeholder {
  visibility: hidden;
}
.topbar-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #3a3226;
  letter-spacing: 2rpx;
}

/* ---------- 表单 ---------- */
.guest-tip {
  background: #faf5e9;
  border: 1rpx dashed #d9c9a3;
  border-radius: 16rpx;
  padding: 50rpx 30rpx;
  text-align: center;
  margin-top: 20rpx;
}
.guest-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #3a3226;
}
.guest-desc {
  font-size: 24rpx;
  color: #8a7f6a;
  margin: 16rpx 0 28rpx;
}
.btn.primary {
  display: inline-block;
  background: linear-gradient(135deg, #5b6b52, #435140);
  color: #f6f1e6;
  padding: 18rpx 60rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.form-card {
  background: #fffdf7;
  border: 1rpx solid #e8dcc3;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 20rpx;
}
.form-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #3a3226;
  margin-bottom: 14rpx;
}
.form-label.block {
  margin-top: 22rpx;
}
.req {
  color: #c03c3b;
}
.form-input {
  background: #faf7ef;
  border: 1rpx solid #e8dcc3;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #3a3226;
}
.form-textarea {
  background: #faf7ef;
  border: 1rpx solid #e8dcc3;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #3a3226;
  width: auto;
  height: 200rpx;
}
.form-textarea.short {
  height: 120rpx;
}
.ph {
  color: #bdb098;
}
.word-count {
  text-align: right;
  font-size: 22rpx;
  color: #b3a88f;
  margin-top: 6rpx;
}
.picker-value {
  background: #faf7ef;
  border: 1rpx solid #e8dcc3;
  border-radius: 10rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: #3a3226;
}

.svc-pick-row {
  display: flex;
  gap: 16rpx;
}
.svc-pick {
  flex: 1;
  border: 2rpx solid #e8dcc3;
  border-radius: 14rpx;
  padding: 20rpx 10rpx;
  text-align: center;
  background: #faf7ef;
}
.svc-pick.active {
  border-color: #5b6b52;
  background: #eef1e8;
}
.pick-icon {
  font-size: 40rpx;
}
.pick-name {
  display: block;
  font-size: 24rpx;
  color: #3a3226;
  margin-top: 8rpx;
  font-weight: 600;
}
.pick-fee {
  display: block;
  font-size: 22rpx;
  color: #b8860b;
  margin-top: 4rpx;
}

.src-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.src-opt {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
  background: #faf7ef;
  border: 1rpx solid #e8dcc3;
  color: #8a7f6a;
}
.src-opt.active {
  background: #eef1e8;
  border-color: #5b6b52;
  color: #435140;
  font-weight: 600;
}
.works-box {
  max-height: 480rpx;
  overflow-y: auto;
  margin-bottom: 10rpx;
}
.works-empty {
  font-size: 24rpx;
  color: #b3a88f;
  background: #faf7ef;
  border-radius: 10rpx;
  padding: 24rpx;
  line-height: 1.6;
}
.work-item {
  border: 1rpx solid #e8dcc3;
  border-radius: 12rpx;
  padding: 18rpx;
  margin-bottom: 14rpx;
  background: #faf7ef;
}
.work-item.active {
  border-color: #c9a96e;
  background: #fdf6e3;
}
.work-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #3a3226;
}
.work-excerpt {
  font-size: 23rpx;
  color: #7a6f58;
  margin: 8rpx 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.work-meta {
  font-size: 22rpx;
  color: #a08f6c;
}

.fee-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffdf7;
  border: 1rpx solid #e8dcc3;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-top: 24rpx;
}
.fee-label {
  font-size: 22rpx;
  color: #8a7f6a;
}
.fee-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #b8860b;
}
.submit-btn {
  background: linear-gradient(135deg, #c9a96e, #b8934f);
  color: #fff;
  padding: 22rpx 50rpx;
  border-radius: 14rpx;
  font-size: 28rpx;
  letter-spacing: 2rpx;
}
.submit-btn.disabled {
  opacity: 0.6;
}
.agree-tip {
  font-size: 21rpx;
  color: #b3a88f;
  margin-top: 16rpx;
  line-height: 1.6;
  text-align: center;
}

/* ---------- 我的申请 ---------- */
.empty-tip {
  text-align: center;
  color: #b3a88f;
  font-size: 26rpx;
  padding: 80rpx 40rpx;
  line-height: 1.8;
}
.app-card {
  background: #fffdf7;
  border: 1rpx solid #e8dcc3;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 20rpx;
}
.app-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}
.app-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #3a3226;
  flex: 1;
  margin-right: 16rpx;
}
.status-badge {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}
.status-badge.submitted {
  background: #fdf6e3;
  color: #b8860b;
}
.status-badge.reviewing {
  background: #e8eef5;
  color: #3a6ea5;
}
.status-badge.certified {
  background: #eef1e8;
  color: #5b6b52;
}
.status-badge.rejected {
  background: #f7e8e7;
  color: #c03c3b;
}
.app-line {
  display: flex;
  font-size: 24rpx;
  padding: 6rpx 0;
}
.app-k {
  width: 140rpx;
  color: #a08f6c;
  flex-shrink: 0;
}
.app-v {
  color: #4a4030;
  flex: 1;
}
.reject-box {
  margin-top: 14rpx;
  background: #f7e8e7;
  color: #c03c3b;
  font-size: 23rpx;
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
  line-height: 1.6;
}
.progress-tip {
  margin-top: 14rpx;
  background: #faf5e9;
  color: #8a7f6a;
  font-size: 23rpx;
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
}

/* ---------- 证书 ---------- */
.cert-card {
  margin-bottom: 20rpx;
}
.cert-border {
  position: relative;
  border: 4rpx double #c9a96e;
  border-radius: 12rpx;
  padding: 36rpx 28rpx 28rpx;
  background:
    radial-gradient(circle at 50% 0%, rgba(201, 169, 110, 0.08), transparent 60%),
    #fffdf5;
  text-align: center;
}
.cert-seal {
  position: absolute;
  right: 30rpx;
  bottom: 30rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 3rpx solid #c03c3b;
  color: #c03c3b;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 96rpx;
  text-align: center;
  opacity: 0.85;
  transform: rotate(-12deg);
}
.cert-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #8a6d2f;
  letter-spacing: 4rpx;
}
.cert-sub {
  font-size: 18rpx;
  color: #b3a06a;
  letter-spacing: 2rpx;
  margin: 8rpx 0 24rpx;
}
.cert-row {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 16rpx;
  padding: 8rpx 0;
  font-size: 25rpx;
}
.cert-label {
  color: #a08f6c;
  flex-shrink: 0;
}
.cert-val {
  color: #3a3226;
  font-weight: 600;
  text-align: left;
}
.cert-val.strong {
  color: #8a6d2f;
  letter-spacing: 1rpx;
}
.cert-foot {
  margin-top: 20rpx;
  font-size: 20rpx;
  color: #b3a06a;
  line-height: 1.6;
}
</style>
