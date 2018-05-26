import { ConfigRepository } from './repository.mjs';
import { Tags, Tag, Work, Config, AutoTagService, BookmarkScope } from './domain.mjs';
import views from './view.mjs';
import { h, app } from 'hyperapp';
import hyperx from 'hyperx';

{
  const hx = hyperx(h);

  const configRepository = new ConfigRepository();
  const autoTagService   = new AutoTagService(configRepository);

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
   * 自動タグ付けを実行する
   */
  function autoTag() {
    const tagCloud = findTagCloud();
    const work     = findWork();

    const bookmark = autoTagService.execute(tagCloud, work);

    const form = document.querySelector('form[action^="bookmark_add.php"]');

    form.comment.value  = bookmark.comment;
    form.tag.value      = bookmark.tags.toArray().join(' ');
    form.restrict.value = bookmark.scope === BookmarkScope.Public ? 0 : 1;

    return;
    
    function tagsFromNodes(nodeList) {
      const tags = Array.from(nodeList).map(tagNode => Tag.for(tagNode.textContent));

      return Tags.fromIterable(tags);
    }

    function findTagCloud() {
      const tagListNodes = document.querySelectorAll('section.tag-cloud-container > ul.tag-cloud > li');

      return tagsFromNodes(tagListNodes);
    }

    function findWork() {
      const title = document.querySelector('.bookmark-detail-unit h1.title').textContent;

      const workTagNodes = Array.from(document.querySelectorAll('div.recommend-tag > ul span.tag'));
      const tags = tagsFromNodes(workTagNodes);

      return new Work(title, tags);
    }

  }

  function render() {
    const state = {
      configState: ConfigState.Closed,
      ruleRaw: (configRepository.load() || Config.default()).ruleRaw,
    };

    const actions = {
      executeAutoTag: () => state => {
        autoTag();
        return state;
      },

      configToggle: () => state => {
        const newState = { ...state, configState: state.configState.toggle() };

        if (newState.configState === ConfigState.AskClose) {
          const message = '設定が変更されています。破棄してもよろしいですか？';
          const result = window.confirm(message);

          if (result) {
            return actions.configDiscardChange()(newState);
          } else {
            return actions.configKeepChange()(newState);
          }
        }

        return newState;
      },

      configSave: ({ ruleRaw }) => state => {
        const config = Config.create(ruleRaw);
        configRepository.save(config);

        return { ...state, configState: state.configState.save() };
      },

      configUpdate: () => state => (
        { ...state, configState: state.configState.change() }
      ),

      configDownload: () => state => state,
    };

    const view = (state, actions) => {
      const open = state.configState !== ConfigState.Closed;
      const h = hx`
        <span>
          ${views.buttons(actions, state)}
          ${open ? views.config(actions, state) : ''}
        </span>
      `;

      return h;
    };

    const container = document.createElement('span');
    app(state, actions, view, container);

    const prevElem = document.querySelector('.recommend-tag > h1.title');
    prevElem.parentNode.insertBefore(container, prevElem.nextSibiling);

  }

  function execute() {
    render();
    autoTag();
  }

  function onLoad() {
    const isIllustPage   = url => /member_illust.php/.test(url);
    const isBookmarkPage = url => /bookmark_add/.test(url);

    if (isIllustPage(location.href)) {
      const tagsNode = document.querySelector('section.list-container.tag-container.work-tags-container > div > ul');

      const observer = new MutationObserver(records => {
        const isReady = records.some(record => record.type === 'childList' && record.addedNodes.length > 0);

        if (isReady)
          execute();
      });

      observer.observe(tagsNode, { childList: true });
    } else if (isBookmarkPage(location.href)) {
      execute();
    }
  }

  onLoad();

}
