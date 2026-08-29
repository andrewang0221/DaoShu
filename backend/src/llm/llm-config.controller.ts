/**
 * 大模型配置接口（V2.3）
 *
 * 用户端（/llm）：
 * - GET  /llm/models          系统可用模型列表（脱敏，不含 Key）
 * - GET  /llm/settings        我的自定义大模型设置（Key 脱敏）
 * - PUT  /llm/settings        保存自定义设置（启用后对话等功能优先走自有 Key）
 * - POST /llm/settings/test   测试自定义配置连通性
 *
 * 管理端（/admin/models，需 admin 角色）：
 * - GET    /admin/models      全部模型配置（含 Key）
 * - POST   /admin/models      新增模型
 * - PUT    /admin/models/:id  编辑模型（apiKey 缺省沿用原值）
 * - DELETE /admin/models/:id  删除模型
 * - POST   /admin/models/test 测试指定配置连通性（可传 id 或直接传配置）
 */

import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AuthUser, CurrentUser, Roles } from '../common';
import { LLMConfigService, ModelConfigInput, UserSettingsInput } from './llm-config.service';

@Controller('llm')
export class LLMController {
  constructor(private readonly config: LLMConfigService) {}

  /** 系统可用模型列表（脱敏） */
  @Get('models')
  models() {
    return this.config.listEnabledModels();
  }

  /** 我的自定义大模型设置 */
  @Get('settings')
  settings(@CurrentUser() user: AuthUser) {
    return this.config.getUserSettings(user.id);
  }

  /** 保存自定义大模型设置 */
  @Put('settings')
  async saveSettings(@CurrentUser() user: AuthUser, @Body() dto: UserSettingsInput) {
    if (!dto?.apiBaseUrl || !dto?.modelName) {
      throw new BadRequestException('Base URL 与模型名不能为空');
    }
    await this.config.saveUserSettings(user.id, dto);
    return this.config.getUserSettings(user.id);
  }

  /** 测试自定义配置连通性（apiKey 缺省时用已保存的 Key） */
  @Post('settings/test')
  async testSettings(@CurrentUser() user: AuthUser, @Body() dto: UserSettingsInput) {
    let apiKey = dto?.apiKey ?? '';
    if (!apiKey) {
      const s = await this.config.getUserSettings(user.id);
      apiKey = s.configured ? (await this.resolveStoredKey(user.id)) ?? '' : '';
    }
    if (!dto?.apiBaseUrl || !dto?.modelName || !apiKey) {
      throw new BadRequestException('请先填写完整的 Base URL / API Key / 模型名');
    }
    return LLMConfigService.testConnection(dto.apiBaseUrl, apiKey, dto.modelName);
  }

  private async resolveStoredKey(userId: string): Promise<string | undefined> {
    // 通过保存接口校验过的配置才允许用已存 Key 测试；此处直接读取原始设置
    const runtime = await this.config.getUserRuntimeConfig(userId);
    return runtime?.apiKey;
  }
}

@Controller('admin/models')
@Roles('admin')
export class AdminModelController {
  constructor(private readonly config: LLMConfigService) {}

  @Get()
  list() {
    return this.config.listModels();
  }

  @Post()
  create(@Body() dto: ModelConfigInput) {
    if (!dto?.modelKey || !dto?.displayName || !dto?.apiBaseUrl || !dto?.modelName) {
      throw new BadRequestException('模型标识、展示名、Base URL、模型名不能为空');
    }
    return this.config.upsertModel(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: ModelConfigInput) {
    if (!dto?.modelKey || !dto?.displayName || !dto?.apiBaseUrl || !dto?.modelName) {
      throw new BadRequestException('模型标识、展示名、Base URL、模型名不能为空');
    }
    return this.config.upsertModel(dto, id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.config.deleteModel(id);
    return { ok: true };
  }

  /** 连通性测试：传 id 用已存配置（可覆盖 apiKey），或直接传完整配置 */
  @Post('test')
  async test(@Body() dto: { id?: string } & ModelConfigInput) {
    let { apiBaseUrl, apiKey, modelName } = dto;
    if (dto.id && (!apiKey || !apiBaseUrl)) {
      const models = await this.config.listModels();
      const m = models.find((x) => x.id === dto.id);
      if (!m) throw new BadRequestException('模型配置不存在');
      apiBaseUrl = apiBaseUrl || m.apiBaseUrl;
      apiKey = apiKey || m.apiKey;
      modelName = modelName || m.modelName;
    }
    if (!apiBaseUrl || !apiKey) throw new BadRequestException('Base URL 与 API Key 不能为空');
    return LLMConfigService.testConnection(apiBaseUrl, apiKey, modelName);
  }
}
