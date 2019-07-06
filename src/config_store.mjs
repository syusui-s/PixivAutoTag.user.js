import { Config } from './config.mjs';

/**
 * 設定の保存
 */
export class ConfigStore {

  /** 設定の保存に用いるキー */
  static get ConfigKey() { return 'PixivAutoTagConfig'; }

  static get OldConfigKey() { return 'pixivAutoTag_taggingRule'; }

  /**
   * 設定を保存する
   */
  save(config) {
    window.localStorage.setItem(this.constructor.ConfigKey, config.toJson());
  }

  /**
   * 設定を取得する
   */
  load() {
    const json = window.localStorage.getItem(this.constructor.ConfigKey);
    const config = Config.fromJson(json);
    if (config) {
      return config;
    }

    const oldRuleRaw = window.localStorage.getItem(this.constructor.OldConfigKey);
    const configFromOldRule = Config.fromRuleRaw(oldRuleRaw);
    if (configFromOldRule) {
      return configFromOldRule; 
    }

    return null;
  }

}
