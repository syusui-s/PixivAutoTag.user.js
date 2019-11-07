import { Config } from './config.js';

/**
 * 設定の保存
 */
export class ConfigStore {

  /** 設定の保存に用いるキー */
  static get ConfigKey() { return 'PixivAutoTagConfig'; }

  static get OldConfigKey() { return 'pixivAutoTag_taggingRule'; }

  /**
   * 設定を保存する
   *
   * @param {Config} config
   */
  save(config) {
    window.localStorage.setItem(ConfigStore.ConfigKey, config.toJson());
  }

  /**
   * 設定を取得する
   *
   * @return {Config?}
   */
  load() {
    const json = window.localStorage.getItem(ConfigStore.ConfigKey);
    const config = json && Config.fromJson(json);
    if (config) {
      return config;
    }

    const oldRuleRaw = window.localStorage.getItem(ConfigStore.OldConfigKey);
    const configFromOldRule = oldRuleRaw && Config.fromRuleRaw(oldRuleRaw);
    if (configFromOldRule) {
      return configFromOldRule; 
    }

    return null;
  }
}
