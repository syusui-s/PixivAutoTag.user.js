import { Copyable } from '../lib.js';
import { Tags } from './tag.js';

/**
 * ブックマークの公開範囲
 *
 * Public: 公開
 * Private: 非公開
 *
 * @enum {number}
 */
export const BookmarkScope = {
  Public: 0,
  Private: 1,
};

/**
 * ブックマーク
 *
 * @extends Copyable<Bookmark>
 */
export class Bookmark extends Copyable {
  /**
   * 空のブックマークを返す
   */
  static empty() {
    return new this('', Tags.empty(), BookmarkScope.Public);
  }

  /**
   * @param {string}        comment ブックマークコメント
   * @param {Tags}          tags    タグリスト
   * @param {BookmarkScope} scope   公開／非公開
   */
  constructor(comment, tags, scope) {
    super();
    this.comment = comment;
    this.tags = tags;
    this.scope = scope;
  }

  /**
   * @param {string} comment
   */
  withComment(comment) {
    return this.copy({ comment });
  }

  /**
   * @param {Tags} tags タグリスト
   */
  withTags(tags) {
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
