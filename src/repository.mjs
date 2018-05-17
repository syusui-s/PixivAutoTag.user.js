import { Config } from './domain.mjs';

/**
 * 設定の保存
 */
export class ConfigRepository {

  /** 設定の保存に用いるキー */
  static get ConfigKey() { return 'PixivAutoTagConfig'; }

  /**
   * 設定を保存する
   */
  async save(config) {
    return window.localStorage.setItem(this.constructor.ConfigKey, config.toJson);
  }

  /**
   * 設定を取得する
   */
  async load() {
    const json = window.localStorage.getItem(this.constructor.ConfigKey);
    return Config.fromJson(json);
  }

}
