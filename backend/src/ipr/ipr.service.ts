import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PointsService } from '../points/points.service';
import { IS_DEMO } from '../common';

/** 服务类型：著作权登记代办 / 数字知识产权存证认证 */
export type IprServiceType = 'copyright' | 'digital_cert';

/** 申请状态机 */
export type IprStatus = 'draft' | 'submitted' | 'reviewing' | 'certified' | 'rejected';

/** 服务目录（前端展示 + 服务费积分） */
const SERVICE_CATALOG = [
  {
    serviceType: 'copyright' as IprServiceType,
    name: '著作权登记代办',
    tagline: '个人原创作品 · 著作权全流程代办',
    desc: '面向个人沉淀知识库中的文字、美术、口述、软件等原创作品，由平台合作代理机构代为准备材料、向中国版权保护中心提交作品著作权登记申请，全程线上跟进，下证后寄送纸质登记证书并同步电子证书。',
    serviceFee: 500,
    duration: '30-60 个工作日（加急可咨询）',
    authority: '中国版权保护中心（CPCC）',
    deliverable: '作品著作权登记证书（纸质 + 电子）',
    workTypes: ['文字作品', '美术作品', '口述作品', '软件作品', '摄影作品', '其他'],
    requiresApplicant: true,
    highlights: ['官方登记号可查', '权属证明强', '维权与商用必备', '平台全程代办'],
  },
  {
    serviceType: 'digital_cert' as IprServiceType,
    name: '数字知识产权存证认证',
    tagline: '原创内容 · 快速区块链存证',
    desc: '对平台沉淀的原创内容（研学心得、问答记录、论道纪要、行业案例等）做哈希上链存证与可信时间戳，第一时间固定创作时间与内容完整性，快速出具数字存证证书，适合日常沉淀内容的轻量级权属保护。',
    serviceFee: 50,
    duration: '1-3 个工作日',
    authority: '联合存证机构（区块链 + 可信时间戳）',
    deliverable: '数字知识产权存证证书（电子，含存证哈希）',
    workTypes: ['文字作品', '图文内容', '口述转写', '数字内容'],
    requiresApplicant: true,
    highlights: ['快速出证', '哈希防篡改', '时间戳固定', '费用低廉'],
  },
];

/** 作品来源白名单 */
const WORK_SOURCES = ['notes', 'dao', 'symposium', 'industry', 'dh_works', 'custom'] as const;

export interface IprApplicationRow {
  id: string;
  applicationNo: string | null;
  userId: string;
  serviceType: IprServiceType;
  workTitle: string;
  workType: string;
  workSource: string;
  workRefId: string | null;
  workMeta: Record<string, unknown>;
  applicant: Record<string, unknown>;
  serviceFee: number;
  status: IprStatus;
  rejectReason: string | null;
  certNo: string | null;
  certUrl: string | null;
  certifiedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 演示模式内存账本 */
export type DemoApp = IprApplicationRow & { reviewedBy?: string | null };

@Injectable()
export class IprService {
  private readonly demoApps: DemoApp[] = [];
  private demoSeq = 1;

  constructor(
    private readonly db: DatabaseService,
    private readonly points: PointsService,
  ) {}

  // ---------- 服务目录 ----------

  catalog() {
    return { services: SERVICE_CATALOG };
  }

  // ---------- 个人沉淀资产（可申请保护的原创内容候选） ----------

  /**
   * 聚合用户在平台沉淀的可确权内容：研学笔记、求道问答、论道纪要、行业调用案例。
   * 演示模式（无库）返回空列表，提示用户直接自定义填写作品。
   */
  async myWorks(userId: string) {
    if (IS_DEMO()) {
      return { works: [] as Record<string, unknown>[] };
    }
    // 研学笔记（书斋批注/心得，content 非空）
    const notes = await this.db.query(
      `SELECT id, chapter_no AS "chapterNo", content, quote, created_at AS "createdAt"
       FROM study_notes
       WHERE user_id = $1 AND COALESCE(TRIM(content), '') <> ''
       ORDER BY created_at DESC LIMIT 50`,
      [userId],
    );
    // 求道：用户发起的提问 + 被采纳的回答
    const inquiries = await this.db.query(
      `SELECT id, content, created_at AS "createdAt", 'inquiry' AS kind
       FROM dao_inquiries WHERE asker_user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [userId],
    );
    const answers = await this.db.query(
      `SELECT a.id, a.content, a.created_at AS "createdAt", a.inquiry_id AS "inquiryId"
       FROM dao_answers a
       WHERE a.answerer_user_id = $1 AND a.is_accepted = true
       ORDER BY a.created_at DESC LIMIT 30`,
      [userId],
    );
    // 论道纪要（用户主持的研讨记录）
    const symposia = await this.db.query(
      `SELECT id, topic, rounds, created_at AS "createdAt"
       FROM symposium_records WHERE owner_user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [userId],
    ).catch(() => [] as Record<string, unknown>[]);

    const works: Record<string, unknown>[] = [
      ...notes.map((n) => ({
        source: 'notes',
        refId: String(n.id),
        title: `《道德经》研学心得 · 第 ${n.chapterNo} 章`,
        excerpt: String(n.content ?? '').slice(0, 60),
        words: String(n.content ?? '').length,
        createdAt: n.createdAt,
      })),
      ...inquiries.map((q) => ({
        source: 'dao',
        refId: String(q.id),
        title: `求道提问 · ${String(q.content ?? '').slice(0, 20)}`,
        excerpt: String(q.content ?? '').slice(0, 60),
        words: String(q.content ?? '').length,
        createdAt: q.createdAt,
      })),
      ...answers.map((a) => ({
        source: 'dao',
        refId: String(a.id),
        title: `求道精答（已采纳）`,
        excerpt: String(a.content ?? '').slice(0, 60),
        words: String(a.content ?? '').length,
        createdAt: a.createdAt,
      })),
      ...(Array.isArray(symposia) ? symposia : []).map((s) => ({
        source: 'symposium',
        refId: String((s as { id: string }).id),
        title: `论道纪要 · ${String((s as { topic: string }).topic ?? '')}`.slice(0, 40),
        excerpt: `三方对谈 ${(s as { rounds: number }).rounds ?? 0} 轮研讨纪要`,
        words: 0,
        createdAt: (s as { createdAt: string }).createdAt,
      })),
    ];
    return { works };
  }

  // ---------- 申请 ----------

  private genApplicationNo(): string {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `DSIP-${ymd}-${rand}`;
  }

  private genCertNo(serviceType: IprServiceType): string {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    return serviceType === 'copyright' ? `CPCC-DS-${ymd}-${rand}` : `DSCERT-${ymd}-${rand}`;
  }

  private validateInput(input: {
    serviceType?: string;
    workTitle?: string;
    workType?: string;
    workSource?: string;
    applicant?: Record<string, unknown>;
  }): { serviceType: IprServiceType; workTitle: string; workType: string; workSource: string } {
    const serviceType = input.serviceType as IprServiceType;
    if (!SERVICE_CATALOG.some((s) => s.serviceType === serviceType)) {
      throw new BadRequestException('服务类型需为 copyright（著作权代办）或 digital_cert（数字存证）');
    }
    const workTitle = (input.workTitle ?? '').trim();
    if (!workTitle) throw new BadRequestException('请填写作品名称');
    if (workTitle.length > 120) throw new BadRequestException('作品名称过长（≤120 字）');
    const workType = (input.workType ?? '文字作品').trim().slice(0, 40) || '文字作品';
    const workSource = WORK_SOURCES.includes(input.workSource as (typeof WORK_SOURCES)[number])
      ? (input.workSource as string)
      : 'custom';
    return { serviceType, workTitle, workType, workSource };
  }

  /** 校验申请人实名信息（著作权代办必需；数字存证至少需姓名/联系方式） */
  private validateApplicant(serviceType: IprServiceType, applicant?: Record<string, unknown>) {
    const a = applicant ?? {};
    const name = String(a.name ?? '').trim();
    const phone = String(a.phone ?? '').trim();
    if (!name) throw new BadRequestException('请填写著作权人/申请人真实姓名');
    if (!phone) throw new BadRequestException('请填写联系电话');
    if (serviceType === 'copyright') {
      if (!String(a.idType ?? '').trim()) throw new BadRequestException('请选择证件类型');
      if (!String(a.idNo ?? '').trim()) throw new BadRequestException('请填写证件号码');
      if (!String(a.address ?? '').trim()) throw new BadRequestException('请填写通讯地址（用于寄送证书）');
    }
  }

  /** 提交申请（含服务费积分扣减） */
  async submit(
    userId: string,
    input: {
      serviceType: string;
      workTitle: string;
      workType?: string;
      workSource?: string;
      workRefId?: string;
      workMeta?: Record<string, unknown>;
      applicant?: Record<string, unknown>;
    },
  ) {
    const { serviceType, workTitle, workType, workSource } = this.validateInput(input);
    this.validateApplicant(serviceType, input.applicant);
    const svc = SERVICE_CATALOG.find((s) => s.serviceType === serviceType)!;
    const workMeta = input.workMeta ?? {};
    const applicant = input.applicant ?? {};
    const applicationNo = this.genApplicationNo();

    if (IS_DEMO()) {
      const app: DemoApp = {
        id: `demo-ipr-${this.demoSeq++}`,
        applicationNo,
        userId,
        serviceType,
        workTitle,
        workType,
        workSource,
        workRefId: input.workRefId ?? null,
        workMeta,
        applicant,
        serviceFee: svc.serviceFee,
        status: 'submitted',
        rejectReason: null,
        certNo: null,
        certUrl: null,
        certifiedAt: null,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviewedBy: null,
      };
      this.demoApps.unshift(app);
      return { ok: true, application: app, serviceFee: svc.serviceFee, pointsCharged: false };
    }

    // 先扣服务费（积分不足直接抛错，不产生申请单）
    let pointsCharged = false;
    let balanceAfter: number | undefined;
    if (svc.serviceFee > 0) {
      const r = await this.points.spend(userId, svc.serviceFee, 'ipr_fee');
      pointsCharged = true;
      balanceAfter = r.balance;
    }

    const rows = await this.db.query<IprApplicationRow>(
      `INSERT INTO ip_applications
         (application_no, user_id, service_type, work_title, work_type, work_source,
          work_ref_id, work_meta, applicant, service_fee, status, submitted_at)
       VALUES ($1, $2, $3::ipr_service_type, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, 'submitted', now())
       RETURNING *`,
      [
        applicationNo,
        userId,
        serviceType,
        workTitle,
        workType,
        workSource,
        input.workRefId ?? null,
        JSON.stringify(workMeta),
        JSON.stringify(applicant),
        svc.serviceFee,
      ],
    );
    const application = this.hydrate(rows[0]);
    return { ok: true, application, serviceFee: svc.serviceFee, pointsCharged, balanceAfter };
  }

  /** 我的申请列表 */
  async myApplications(userId: string) {
    if (IS_DEMO()) {
      return { applications: this.demoApps.filter((a) => a.userId === userId) };
    }
    const rows = await this.db.query(`SELECT * FROM ip_applications WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return { applications: rows.map((r) => this.hydrate(r)) };
  }

  /** 申请详情（本人或管理员） */
  async detail(id: string, userId: string, isAdmin = false) {
    if (IS_DEMO()) {
      const app = this.demoApps.find((a) => a.id === id);
      if (!app || (!isAdmin && app.userId !== userId)) throw new NotFoundException('申请不存在');
      return { application: app };
    }
    const rows = await this.db.query(`SELECT * FROM ip_applications WHERE id = $1`, [id]);
    if (!rows.length) throw new NotFoundException('申请不存在');
    const app = this.hydrate(rows[0]);
    if (!isAdmin && app.userId !== userId) throw new NotFoundException('申请不存在');
    return { application: app };
  }

  // ---------- 管理端 ----------

  async adminList(status?: string) {
    if (IS_DEMO()) {
      const list = status ? this.demoApps.filter((a) => a.status === status) : this.demoApps;
      return { applications: list, total: list.length };
    }
    const sql = status
      ? `SELECT a.*, u.username AS "userName", u.phone AS "userPhone", u.email AS "userEmail"
         FROM ip_applications a LEFT JOIN users u ON u.id = a.user_id
         WHERE a.status = $1::ipr_status ORDER BY a.created_at DESC`
      : `SELECT a.*, u.username AS "userName", u.phone AS "userPhone", u.email AS "userEmail"
         FROM ip_applications a LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC`;
    const rows = await this.db.query(sql, status ? [status] : []);
    return {
      applications: rows.map((r) => ({
        ...this.hydrate(r),
        userName: (r as { userName?: string }).userName ?? null,
        userPhone: (r as { userPhone?: string }).userPhone ?? null,
        userEmail: (r as { userEmail?: string }).userEmail ?? null,
      })),
      total: rows.length,
    };
  }

  /** 状态流转：受理（submitted→reviewing）/ 发证（→certified）/ 驳回（→rejected） */
  async adminReview(
    adminId: string,
    id: string,
    action: 'accept' | 'certify' | 'reject',
    extra?: { reason?: string; certNo?: string; certUrl?: string },
  ) {
    if (IS_DEMO()) {
      const app = this.demoApps.find((a) => a.id === id);
      if (!app) throw new NotFoundException('申请不存在');
      if (action === 'accept') {
        app.status = 'reviewing';
      } else if (action === 'certify') {
        app.status = 'certified';
        app.certNo = extra?.certNo?.trim() || this.genCertNo(app.serviceType);
        app.certUrl = extra?.certUrl?.trim() || null;
        app.certifiedAt = new Date().toISOString();
      } else {
        app.status = 'rejected';
        app.rejectReason = extra?.reason?.trim() || '材料不符合要求';
      }
      app.reviewedBy = adminId;
      app.updatedAt = new Date().toISOString();
      return { ok: true, application: app };
    }

    if (action === 'accept') {
      const rows = await this.db.query(
        `UPDATE ip_applications SET status = 'reviewing', reviewed_by = $2, updated_at = now()
         WHERE id = $1 RETURNING *`,
        [id, adminId],
      );
      if (!rows.length) throw new NotFoundException('申请不存在');
      return { ok: true, application: this.hydrate(rows[0]) };
    }
    if (action === 'reject') {
      const reason = (extra?.reason ?? '').trim();
      if (!reason) throw new BadRequestException('请填写驳回原因');
      const rows = await this.db.query(
        `UPDATE ip_applications SET status = 'rejected', reject_reason = $2, reviewed_by = $3, updated_at = now()
         WHERE id = $1 RETURNING *`,
        [id, reason, adminId],
      );
      if (!rows.length) throw new NotFoundException('申请不存在');
      return { ok: true, application: this.hydrate(rows[0]) };
    }
    // certify：发证（证书号留空时按服务类型自动生成）
    const existing = await this.db.query<{ service_type: string }>(
      `SELECT service_type FROM ip_applications WHERE id = $1`,
      [id],
    );
    if (!existing.length) throw new NotFoundException('申请不存在');
    const fallbackCertNo = this.genCertNo(existing[0].service_type as IprServiceType);
    const rows = await this.db.query(
      `UPDATE ip_applications
       SET status = 'certified',
           cert_no = COALESCE(NULLIF(TRIM($2), ''), cert_no, $4),
           cert_url = NULLIF(TRIM($3), ''),
           certified_at = now(), reviewed_by = $5, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id, extra?.certNo ?? '', extra?.certUrl ?? '', fallbackCertNo, adminId],
    );
    if (!rows.length) throw new NotFoundException('申请不存在');
    return { ok: true, application: this.hydrate(rows[0]) };
  }

  /** 统计（看板用） */
  async adminStats() {
    if (IS_DEMO()) {
      const by = (s: IprStatus) => this.demoApps.filter((a) => a.status === s).length;
      return {
        total: this.demoApps.length,
        submitted: by('submitted'),
        reviewing: by('reviewing'),
        certified: by('certified'),
        rejected: by('rejected'),
      };
    }
    const rows = await this.db.query<{ status: string; cnt: string }>(
      `SELECT status::text AS status, COUNT(*)::text AS cnt FROM ip_applications GROUP BY status`,
    );
    const stats = { total: 0, submitted: 0, reviewing: 0, certified: 0, rejected: 0 };
    for (const r of rows) {
      const n = Number(r.cnt);
      stats.total += n;
      if (r.status in stats) (stats as Record<string, number>)[r.status] = n;
    }
    return stats;
  }

  /** 行映射：snake_case → camelCase，jsonb 解析 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private hydrate(row: any): IprApplicationRow {
    const json = (v: unknown): Record<string, unknown> =>
      v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
    return {
      id: String(row.id),
      applicationNo: (row.application_no as string) ?? null,
      userId: String(row.user_id),
      serviceType: row.service_type as IprServiceType,
      workTitle: row.work_title as string,
      workType: row.work_type as string,
      workSource: row.work_source as string,
      workRefId: (row.work_ref_id as string) ?? null,
      workMeta: json(row.work_meta),
      applicant: json(row.applicant),
      serviceFee: Number(row.service_fee ?? 0),
      status: row.status as IprStatus,
      rejectReason: (row.reject_reason as string) ?? null,
      certNo: (row.cert_no as string) ?? null,
      certUrl: (row.cert_url as string) ?? null,
      certifiedAt: (row.certified_at as string) ?? null,
      submittedAt: (row.submitted_at as string) ?? null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
