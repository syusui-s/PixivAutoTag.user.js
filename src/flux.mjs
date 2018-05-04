/** @module flux */

/**
 * アクションのハンドラの管理機能や発火処理を提供するクラス
 *
 * FluxアーキテクチャにおけるStoreの実装クラスのスーパークラスと成ることを想定して作られている。
 */
export class Emitter {
  /**
   */
  constructor() {
    this.handlers = new Map();
  }

  /**
   * アクションのハンドラを登録する
   *
   * 同一のアクション種別に対して、複数のハンドラを登録してもよい。
   *
   * @param {object} type アクションの種別を表すオブジェクト
   * @param {function} handler アクションの発生時に呼び出されるオブジェクト
   */
  on(type, handler) {
    const handlers = this.getHandlersByType(type);
    handlers.push(handler);

    return;
  }

  /**
   * ハンドラを発火する
   *
   * アクション種別に対するハンドラが一つも登録されていない場合は、何もしない。
   *
   * @param {Action} action アクション
   */
  emit(action) {
    this.getHandlersByType(action.type)
      .forEach(handler => handler(action));
  }

  /**
   * 種別に紐付けられたイベントハンドラの配列を返す
   *
   * @param {object} type アクションの種別を表すオブジェクト
   * @return {array} イベントハンドラの配列
   */
  getHandlersByType(type) {
    if (! this.handlers.has(type)) {
      this.handlers.set(type, []);
    }

    return this.handlers.get(type);
  }
}

/**
 * コンポーネント
 *
 * Fluxにおけるビューに該当するクラス。
 */
export class Component {
  /**
   * コンストラクタ
   *
   * @param {object} actions Componentから使用されるActionを保持するオブジェクト
   */
  constructor(actions) {
    this.actions = actions;
  }

  /**
   * Store の change イベントを購読する
   *
   * ストアに変更があった場合、onChangeメソッドを呼び出す。
   *
   * @param {store} store ストアのオブジェクト
   */
  subscribes(store) {
    const self = this;
    store.on('change', () => self.onChange(store.getState()));
  }

  /**
   * 描画したHTMLをページ上に反映する
   *
   * 以前に描画したHTMLElementがあれば、それを新しく描画したHTMLElementで置換する処理を行う。
   * もし、以前に描画したHTMLElementが存在しない場合は、
   * 戻り値のHTMLElementをページのDOM構造に挿入することで、次回以降のDOM描画時に置換されるようになる（はず）。
   *
   * この関数は、temlpate関数の実装を必要とする。
   *
   * @returns {HTMLElement} 描画されたHTMLElement
   */
  render(props) {
    const element = this.template(props);

    if (this.element) {
      this.element.replaceWith(element);
    }

    this.element = element;

    return this.element;
  }

  /**
   * 引数のテンプレート文字列をエスケープした状態のDOMを返す。
   *
   * @param {Array} callSites テンプレート文字列の
   * @param {Array} substitutions 置換に使われる値の配列
   */
  html(callSites, ...substitutions) {
    const escapedSubstitutions = substitutions.map(value =>
      value.toString().replace(/[&'`"<>]/g, match => ({
        '&':  '&amp;',
        '\'': '&#x27;',
        '`':  '&#x60;',
        '"':  '&quot;',
        '<':  '&lt;',
        '>':  '&gt;',
      })[match])
    );

    const htmlString = String.raw(callSites, ...escapedSubstitutions);

    const domParser = new DOMParser();
    const doc = domParser.parseFromString(htmlString, 'text/html');

    return doc.body.firstChild;
  }
}

/**
 * 画面上で発生した何らかのイベントを
 * アクションオブジェクトに変換し、それをEmitterに通知するクラス
 *
 * イベントからアクションオブジェクトへの変換は、子クラスで実装されることを想定している。
 * このクラスでは、通知先のEmitterを保持する処理のみを提供する。
 */
export class Action {
  /**
   * コンストラクタ
   *
   * @param {Emitter} dispatcher アクション発生の通知先のEmitter
   */
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }
}

export default { Emitter, Component, Action };
