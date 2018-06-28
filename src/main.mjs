import { ConfigRepository } from './repository.mjs';
import { Bookmark, Tags, Tag, Work, AutoTagService, BookmarkScope } from './domain.mjs';
import * as ui from './ui.mjs';
import { app } from 'hyperapp';

{
  const configRepository = new ConfigRepository();
  const autoTagService   = new AutoTagService(configRepository);

  /**
   * 自動タグ付けを実行する
   */
  function autoTag() {
    if (! findBookmark().isEmpty())
      return;

    const tagCloud = findTagCloud();
    const work     = findWork();

    const bookmark = autoTagService.execute(tagCloud, work);

    const form = document.querySelector('form[action^="bookmark_add.php"]');

    form.comment.value  = bookmark.comment;
    form.tag.value      = bookmark.tags.toArray().join(' ');
    form.restrict.value = bookmark.scope === BookmarkScope.Public ? 0 : 1;

    return;

    function tagsFromNodes(nodeList) {
      const tags = Array.from(nodeList).map(tagNode => {
        const tagRaw = tagNode.textContent;
        const tag    = tagRaw.replace(/^\*/, '');

        return Tag.for(tag);
      });

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

    function findBookmark() {
      const form = document.querySelector('.bookmark-detail-unit > form');

      return Bookmark.fromObject({
        comment: form.comment.value,
        tags:    Tags.fromIterable(form.tag.value.split(/\s*/).map(tagName => Tag.for(tagName))),
        scope:   form.restrict.value === '0' ? BookmarkScope.Public : BookmarkScope.Private,
      });
    }

  }


  function render() {
    const container = document.createElement('span');
    app(ui.state(configRepository), ui.actions(autoTag, configRepository), ui.view, container);

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

    const observer = new MutationObserver(records => {
      const isReady = records.some(record => record.type === 'childList' && record.addedNodes.length > 0);

      if (isReady)
        execute();
    });

    if (isIllustPage(location.href)) {
      const tagsNode = document.querySelector('section.list-container.tag-container.work-tags-container > div > ul');
      observer.observe(tagsNode, { childList: true });

    } else if (isBookmarkPage(location.href)) {
      const tagCloud = document.querySelector('ul.list-items.tag-cloud.loading-indicator');
      observer.observe(tagCloud, { childList: true });

    }
  }

  onLoad();

}
