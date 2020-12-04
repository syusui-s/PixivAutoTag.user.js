/**
 * @typedef {import('./tag.js').Tags} Tags
 */

/**
 * 作品
 */
export class Work {
  /**
   * @param {string} title       タイトル
   * @param {Tags}   tags        作品タグ
   */
  constructor(title, tags) {
    this.title = title;
    this.tags = tags;
  }
}
