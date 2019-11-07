/**
 * @typedef {import('./rule.js').Match} Match
 */

/**
 * タグ
 */
export class Tag {
  /**
   * @param {string} text タグ名
   */
  static for(text) {
    return new this(text);
  }

  /**
   * @param {string} text タグ名
   */
  constructor(text) {
    this.text = text;
    Object.freeze(this);
  }

  /**
   * @param {Tag} other
   */
  equals(other) {
    return other instanceof this.constructor && other.text === this.text;
  }

  /**
   * @param {Tag} other
   */
  notEquals(other) {
    return ! this.equals(other);
  }

  toString() {
    return this.text;
  }

  /**
   * 参照をマッチの結果で置き換える
   *
   * @param {Match} match
   */
  resolveReference(match) {
    const text = this.text.replace(/~(\d)/g, (_, idx) => match.at(+idx) || '');

    return Tag.for(text);
  }
}

/**
 * タグの集合
 */
export class Tags {
  /**
   * @param {...Tag} args
   */
  static fromArgs(...args) {
    return new this(args);
  }

  /**
   * @param {Iterable<Tag>} tags
   */
  static fromIterable(tags) {
    return new this(Array.from(tags));
  }

  /**
   * 空のタグ集合を返す
   */
  static empty() {
    return new this([]);
  }

  /**
   * @param {Tag[]} tags
   */
  constructor(tags) {
    this.map = new Map( tags.map(tag => [ tag.text, tag ]) );
  }

  /**
   * 引数のタグを自身が持っている時にtrueを返す
   *
   * @param {Tag} tag
   */
  has(tag) {
    return tag instanceof Tag &&
      this.map.has(tag.text);
  }

  /**
   * 引数のタグの集合と自身が一致するならば、trueを返す
   *
   * @param {Tags} other
   */
  equals(other) {
    return other.map.size === this.map.size &&
      other.toArray().every(tag => this.has(tag));
  }

  /**
   * 保持しているタグの配列を返す
   *
   * @return {Tag[]}
   */
  toArray() {
    return Array.from(this.map.values());
  }

  /**
   * 引数と自身の和集合を返す
   *
   * @param {Tags} other
   * @return {Tags}
   */
  union(other) {
    const thisArray = this.toArray();
    const otherArray = other.toArray();

    return new Tags(thisArray.concat(otherArray));
  }

  /**
   * 自身から引数を引いた差集合を返す
   *
   * @param {Tags} other
   */
  diff(other) {
    const tags = this.toArray().filter(key => !other.has(key));
    return new Tags(tags);
  }

  /**
   * 自身と引数の交差集合を返す
   *
   * @param {Tags} other
   */
  intersect(other) {
    const tags = this.toArray().filter(key => other.has(key));
    return new Tags(tags);
  }

  /**
   * 引数のタグを追加した新しいタグの集合を返す
   *
   * @param {Tag} tag
   */
  append(tag) {
    return new Tags(this.toArray().concat([tag]));
  }

  /**
   * 破壊的にタグを追加する
   *
   * @param {Tag} tag
   * @return {Tags} 自身を返す
   */
  $append(tag) {
    this.map.set(tag.text, tag);
    return this;
  }

  /**
   * タグを削除した新しいタグの集合を返す
   *
   * @param {Tag} tag
   * @return {Tags} 新しいタグ
   */
  remove(tag) {
    return new Tags(this.toArray().filter(e => e.notEquals(tag)));
  }

  /**
   * 破壊的にタグを削除する
   *
   * @param {Tag} tag
   * @return {Tags} 自身を返す
   */
  $remove(tag) {
    this.map.delete(tag.text);
    return this;
  }

  isEmpty() {
    return this.map.size === 0;
  }
}


