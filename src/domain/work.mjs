import { shouldBe } from './lib.mjs';

/**
 * 作品
 */
export class Work {
  static fromObject({ title, tags }) {
    return new this(title, tags);
  }

  /**
   * @param {string} title       タイトル
   * @param {Tags}   tags        作品タグ
   */
  constructor(title, tags) {
    shouldBe(title,       'string', 'title');
    shouldBe(tags,        Tags,     'tags');

    Object.assign(this, { title, tags });
    Object.freeze(this);
  }
}
