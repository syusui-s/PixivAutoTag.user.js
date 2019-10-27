import { shouldBe } from '../lib.mjs';

/**
 * タグ
 */
export class Tag {
  /*::
  text: string,
  */
  static for(text) {
    return new this(text);
  }

  constructor(text) {
    this.text = text;
    Object.freeze(this);
  }

  equals(tag) {
    return tag instanceof this.constructor && tag.text === this.text;
  }

  notEquals(tag) {
    return ! this.equals(tag);
  }

  toString() {
    return this.text;
  }

  /**
   * 参照をマッチの結果で置き換える
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
   *
   */
  static fromArgs(...args) {
    return new this(args);
  }

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
    tags.every(tag => shouldBe(tag, Tag));

    this.map = new Map( tags.map(tag => [ tag.text, tag ]) );
  }

  /**
   * 引数のタグを自身が持っている時にtrueを返す
   */
  has(tag) {
    return tag instanceof Tag &&
      this.map.has(tag.text);
  }

  /**
   * 引数のタグの集合と自身が一致するならば、trueを返す
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
    return Object.freeze(Array.from(this.map.values()));
  }

  /**
   * 引数と自身の和集合を返す
   */
  union(other) {
    const thisArray = this.toArray();
    const otherArray = other.toArray();

    return new this.constructor( thisArray.concat(otherArray) );
  }

  /**
   * 自身から引数を引いた差集合を返す
   */
  diff(other) {
    const tags = this.toArray().filter(key => ! other.has(key));
    return new this.constructor(tags);
  }

  /**
   * 自身と引数の交差集合を返す
   */
  intersect(other) {
    const tags = this.toArray().filter(key => other.has(key));
    return new this.constructor(tags);
  }

  /**
   * タグを追加した新しいタグの集合を返す
   *
   * @param {Tag} tag
   * @return {Tags} 新しいタグ
   */
  append(tag) {
    shouldBe(tag, Tag, 'tag');

    return new this.constructor(this.toArray().concat([tag]));
  }

  /**
   * 破壊的にタグを追加する
   *
   * @param {Tag} tag
   * @return {Tags} 自身を返す
   */
  $append(tag) {
    shouldBe(tag, Tag, 'tag');

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
    shouldBe(tag, Tag, 'tag');

    return new this.constructor(this.toArray().filter(e => e.notEquals(tag)));
  }

  /**
   * 破壊的にタグを削除する
   *
   * @param {Tag} tag
   * @return {Tags} 自身を返す
   */
  $remove(tag) {
    shouldBe(tag, Tag, 'tag');

    this.map.delete(tag.text, tag);

    return this;
  }

  isEmpty() {
    return this.map.size === 0;
  }
}


