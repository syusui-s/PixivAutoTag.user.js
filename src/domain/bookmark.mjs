import { shouldBe, Enum, Copyable } from '../lib.mjs';
import { Tags } from './tag.mjs';

/**
 * ブックマークの公開範囲
 *
 * Public: 公開
 * Private: 非公開
 */
export const BookmarkScope = new Enum([ 'Public', 'Private' ]);

/**
 * ブックマーク
 */
export class Bookmark extends Copyable {
  static fromObject({ comment, tags, scope }) {
    return new this(comment, tags, scope);
  }


  /**
   * 空のブックマークを返す
   */
  static empty() {
    return new this('', Tags.empty(), BookmarkScope.Public);
  }

  /**
   * @param {string} comment ブックマークコメント
   * @param {Tags}   tags    タグ
   * @param {symbol} scope   公開／非公開
   */
  constructor(comment, tags, scope) {
    super();
    Object.assign(this, { comment, tags, scope });
  }

  withComment(comment) {
    shouldBe(comment, 'string', 'comment');

    return this.copy({ comment });
  }

  withTags(tags) {
    shouldBe(tags, Tags, 'tags');

    return this.copy({ tags });
  }

  toPrivate() {
    return this.copy({ scope: BookmarkScope.Private });
  }

  toPublic() {
    return this.copy({ scope: BookmarkScope.Public });
  }

  isEmpty() {
    return this.comment.length === 0 && this.tags.isEmpty();
  }
}
