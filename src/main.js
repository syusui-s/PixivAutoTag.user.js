import { ConfigStore } from './config_store.js';
import { Config } from './config.js';
import { Bookmark, BookmarkScope } from './domain/bookmark.js';
import { Work } from './domain/work.js';
import { Tags, Tag } from './domain/tag.js';
import * as ui from './ui.js';
import { app } from 'hyperapp';

export class AutoTagService {
  /**
   * @param {ConfigStore} configStore
   */
  constructor(configStore) {
    this.configStore = configStore;
  }

  /**
   * @param {Work}     work
   * @param {Tags}     tagCloud  
   * @return {Bookmark?}
   */
  execute(tagCloud, work) {
    const config = this.configStore.load() || Config.default();

    const ruleResult = config.rule();
    if (ruleResult.errors) {
      alert(ruleResult.errors.map(({ message, lineNumber}) => `${lineNumber}: ${message}`).join('\n'));
      return null;
    }

    const rule = ruleResult.success;

    if (! rule) {
      return null;
    }

    const commonTags = work.tags.intersect(tagCloud);

    const bookmark = Bookmark.empty().withTags(commonTags);

    return rule.process(work, bookmark);
  }
}

{
  const configStore = new ConfigStore();
  const autoTagService = new AutoTagService(configStore);

  /**
   * 自動タグ付けを実行する
   */
  function autoTag() {
    const tagCloud = findTagCloud();
    const work     = findWork();

    const bookmark = autoTagService.execute(tagCloud, work);
    if (! bookmark) {
      return;
    }

    const form = bookmarkForm();

    setValueForReact(form.comment, 'value', bookmark.comment);
    setValueForReact(form.tag, 'value', bookmark.tags.toArray().join(' '));
    setValueForReact(form.restrict, 'value', bookmark.scope === BookmarkScope.Public ? '0' : '1');

    return;

    /** @param {NodeList} nodeList */
    function tagsFromNodes(nodeList) {
      const tags = Array.from(nodeList).map(tagNode => {
        const tagRaw = tagNode.textContent || '';
        const tag    = tagRaw.replace(/^\*/, '');

        return Tag.for(tag);
      });

      return Tags.fromIterable(tags);
    }

    /** @return {Tags} */
    function findTagCloud() {
      const tagListNodes = document.querySelectorAll('section.tag-cloud-container > ul.tag-cloud > li');

      return tagsFromNodes(tagListNodes);
    }

    function findWork() {
      const titleNode = document.querySelector('.bookmark-detail-unit h1.title');
      const title = titleNode && titleNode.textContent || ''; 

      const workTagNodes = document.querySelectorAll('div.recommend-tag > ul span.tag');
      const tags = tagsFromNodes(workTagNodes);

      return new Work(title, tags);
    }

    /**
     * @param {HTMLInputElement} input
     * @param {string} key
     * @param {string} value
     */
    function setValueForReact(input, key, value) {
      const valueSetterDescriptor = Object.getOwnPropertyDescriptor(input, key);

      if (! valueSetterDescriptor) {
        input.setAttribute(key, value);
        return;
      }

      const valueSetter             = valueSetterDescriptor.set;
      const proto                   = Object.getPrototypeOf(input);
      const prototypeValueSetterOpt = Object.getOwnPropertyDescriptor(proto, key);
      const prototypeValueSetter    = prototypeValueSetterOpt && prototypeValueSetterOpt.set;

      if (valueSetter && prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(input, value);
      } else if (valueSetter) {
        valueSetter.call(input, value);
      } else {
        throw new Error('入力欄に値を設定できませんでした。');
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * @return {{comment: HTMLInputElement, tag: HTMLInputElement, restrict: HTMLInputElement}}
   */
  function bookmarkForm() {
    const form = document.querySelector('.bookmark-detail-unit > form');

    if (! form) {
      throw new Error('ブックマークの入力欄が見つけられませんでした。プログラムの修正が必要なため、作者に連絡してください。');
    }

    return form;
  }

  function findBookmark() {
    const form = bookmarkForm();

    return new Bookmark(
      form.comment.value,
      Tags.fromIterable(form.tag.value.split(/\s*/).map(Tag.for)),
      form.restrict.value === '0' ? BookmarkScope.Public : BookmarkScope.Private,
    );
  }

  function render() {
    const container = document.createElement('span');
    app(ui.state(configStore), ui.actions(autoTag, configStore), ui.view, container);

    const prevElem = document.querySelector('.recommend-tag > h1.title');
    if (prevElem && prevElem.parentNode) {
      prevElem.parentNode.insertBefore(container, prevElem.nextSibling);
    } else {
      window.alert('UIの描画に失敗しました。pixivのUIが変更されていると思われます。プログラムの修正が必要なため、作者に連絡してください。');
    }
  }

  function execute() {
    render();
    if (! findBookmark().isEmpty())
      return;
    autoTag();
  }

  function onLoad() {
    /** @param {string} url */
    const isIllustPage   = url => /member_illust.php/.test(url);
    /** @param {string} url */
    const isBookmarkPage = url => /bookmark_add/.test(url);

    const observer = new MutationObserver(records => {
      const isReady =
        records.some(record => record.type === 'childList' && record.addedNodes.length > 0);
 
      if (isReady)
        setTimeout(execute, 999);
    });

    let target;
    if (isIllustPage(location.href)) {
      target = document.querySelector('section.list-container.tag-container.work-tags-container > div > ul');
    } else if (isBookmarkPage(location.href)) {
      target = document.querySelector('ul.list-items.tag-cloud.loading-indicator');
    }

    if (target) {
      observer.observe(target, { childList: true });
    } else {
      // window.alert('タグリストを見つけられませんでした。修正が必要なため、作者に連絡してください。');
      return;
    }
  }

  onLoad();

}
