import { ConfigRepository } from './repository.mjs';
import { Bookmark, BookmarkScope, Work, Tag, Tags, Config, } from './domain.mjs';
import { Enum } from './lib.mjs';
import view from './view.mjs';

{

  const ActionType = new Enum(
    'EXECUTE',
    'CONFIG_TOGGLE',
    'CONFIG_SAVE',
    'CONFIG_RESET',
    'CONFIG_CHANGED',
    'CONFIG_DISCARD_CHANGE',
    'CONFIG_KEEP_CHANGE',
    'CONFIG_DOWNLOAD',
  );

  class ActionCreator {
    /**
     * 関数型風に言うと、dispatch -> data -> newState というのを実現したい
     * dispatchを部分適用してdata -> newStateにして、それをviewに渡したい。
     *
     * @param {function} dispatcher 提案値を受け取るコールバック関数。paxos風に言うと、learnerに当たるはず。
     */
    constructor(dispatcher, configRepository) {
      this.dispatcher = dispatcher;
      this.configRepository = configRepository;
    }

    executeAutotag(workObj, tagCloudObj, bookmarkObj) {
      const work = new Work(
        workObj.title,
        workObj.description,
        workObj.tags,
      );

      const bookmark = Bookmark.fromObject({
        comment: bookmarkObj.comment,
        tags:    Tags.fromIterable(bookmarkObj.tags.map(e => Tag.for(e))),
        scope:   BookmarkScope[bookmarkObj.scope] || BookmarkScope.Public,
      });

      this.dispatcher({
        type: ActionType.EXECUTE,
        payload: { bookmark, work, }
      });
    }
  };

  /**
   * モデルに値を提案する関数群を定義する
   *
   * モデルをこの値を受理して新しい状態を生成するか、
   * 拒否して新しい状態を生成しないことを選択する。
   */
  class ActionCreator {

    configToggle() {
      this.present({ type: ActionType.CONFIG_TOGGLE });
    }

    configSave({ ruleRaw }) {
      this.present({ type: ActionType.CONFIG_SAVE, payload: { ruleRaw } });
    }

    configUpdate() {
      this.present({ type: ActionType.CONFIG_UPDATE });
    }

    configDownload() {
      this.present({ type: ActionType.CONFIG_DOWNLOAD });
    }

  }

  /**
   * 設定に関する状態遷移
   */
  class ConfigState {
    constructor(overrides) {
      Object.assign(this, overrides);
    }

    toggle()  { return this; }
    change()  { return this; }
    save()    { return this; }
    reset()   { return this; }
    discard() { return this; }
    keep()    { return this; }
  }

  Object.assign(ConfigState, {

    Closed: new ConfigState({
      toggle() { return ConfigState.NoChange; },
    }),

    NoChange: new ConfigState({
      toggle() { return ConfigState.Closed;  },
      change() { return ConfigState.Changed; },
    }),

    Changed: new ConfigState({
      toggle() { return ConfigState.AskClose; },
      save()   { return ConfigState.NoChange; },
      reset()  { return ConfigState.NoChange; },
    }),

    AskClose: new ConfigState({
      discard() { return ConfigState.NoChange; },
      keep()    { return ConfigState.Changed;  },
    }),

  });

  /**
   * 自動タグ付けに関するStore
   */
  class AutotagStore {
    constructor({ configRepository }) {
      Object.assign(this, { configRepository });
    }

    /**
     * @param {Work}     work
     * @param {Tags}     tagCloud  
     * @param {Bookmark} bookmark
     */
    execute(work, tagCloud, bookmark) {
      const rules = this.configRepository.load().rules;

      const commonTags = work.tags.intersect(tagCloud);

      const bookmarkWithCommonTags =
        bookmark.withTags(commonTags);

      return rules.process(work, bookmarkWithCommonTags);
    }
  }

  /**
   * 設定に関する情報をやります
   */
  class ConfigStore {

    static initialState() {
      return new this(ConfigState.Closed);
    }

    constructor(configRepository, configState) {
      this.configState = configState;
    }

    update(action) {
      switch (action.type) {
      case ActionType.CONFIG_TOGGLE:
        this.configState = this.configState.toggle();
        break;

      case ActionType.CONFIG_CHANGED:
        this.configState = this.configState.change();
        break;

      case ActionType.CONFIG_SAVE:
        this.configState = this.configState.save();
        break;

      case ActionType.CONFIG_RESET:
        this.configState = this.configState.reset();
        break;

      case ActionType.CONFIG_DISCARD_CHANGE:
        this.configState = this.configState.discard();
        break;

      case ActionType.CONFIG_KEEP_CHANGE:
        this.configState = this.configState.keep();
        break;

      case ActionType.CONFIG_DOWNLOAD:
        window.console.log(`実装されていません: ${action.type}`);
        break;

      }

      return this;
    }

  }

  /**
   * アプリケーションの状態と状態の変化を管理する
   * ここでは、自身を破壊的に変更しても良いものとする
   */
  class Store {
    /**
     * アプリケーションの初期状態
     */
    static initialState() {
      return new this(
        null,
        ConfigState.Closed,
      );
    }

    /**
     * @param {ConfigStore} configRepository
     * @param {Bookmark}    bookmark
     * @param {ConfigState} configState
     */
    constructor(onfigRepository, bookmark, configState) {
      Object.assign(this, {
        configRepository,
        bookmark,
      });
    }

    /**
     * 提案された値を受け取り、
     * 受理して新しい状態を生成するか、拒否してnullを返す
     */
    update(action) {
      switch (action.type) {

      case ActionType.EXECUTE:
        {
          const { work, bookmark } = action.payload;

        }
        break;
      }

    }

  }

  /**
   * 状態遷移に関する処理を行う
   */
  class State {
    /**
     * @param {object} view
     */
    constructor(view, actionCreators) {
      this.view = view;
      this.actionCreators = actionCreators;
    }

    bookmarkInitialized(model) {
      return model.bookmark !== undefined;
    }

    render(model) {
    }

  }

  const dispatcher = {
    on(handler) {
      this.handler = handler;
    },

    dispatch(event) {
      this.handler(event);
    }
  };

  const store   = Store.initialState(state => dispatcher.dispatch(state), new ConfigStore());
  const actions = new ActionCreator(action => model.update(action));
  const state   = new State(view, actions);

  dispatcher.on(() => state.render(store));

  state.render(model);

}
