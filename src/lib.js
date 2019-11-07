/**
 * @template T
 */
export class Copyable {
  /**
   * オブジェクトをコピーする
   *
   * 引数にオブジェクトが渡されたら、
   * そのオブジェクトの持つプロパティでコンストラクタへの引数が上書きされる。
   *
   * Scalaのcase classに生えるcopyメソッドを参考にしている。
   *
   * @param {Object} obj
   * @return {T}
   */
  copy(obj) {
    const merged = {};
    Object.assign(merged, this);
    Object.assign(merged, obj || {});

    const copied = Object.create(this.constructor.prototype);
    Object.assign(copied, merged);

    return copied;
  }
}
