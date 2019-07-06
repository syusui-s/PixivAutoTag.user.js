export { Rule } from './domain/rule.mjs';
export { Bookmark } from './domain/bookmark.mjs';

export class AutoTagService {
  /*::
  configStore: ConfigStore,
  */
  constructor(configStore) {
    Object.assign(this, { configStore });
  }

  /**
   * @param {Work}     work
   * @param {Tags}     tagCloud  
   * @param {Bookmark} bookmark
   */
  execute(tagCloud, work) {
    const config = this.configStore.load() || Config.default();

    const rule = config.rule;
    const commonTags = work.tags.intersect(tagCloud);

    const bookmark = Bookmark.empty().withTags(commonTags);

    return rule.process(work, bookmark);
  }
}
