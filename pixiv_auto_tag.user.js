// ==UserScript==
// @name              PixivAutoTag.user.js
// @description       Pixivのブックマークタグ付けを半自動化してくれます https://github.com/syusui-s/PixivAutoTag.user.js
// @match             https://www.pixiv.net/bookmark_add.php?type=illust&illust_id=*
// @match             https://www.pixiv.net/member_illust.php?mode=medium&illust_id=*
// @match             https://www.pixiv.net/bookmark.php*
// @run-at            document-end
// @version           0.3.1
// ==/UserScript==
'use strict';

// デフォルトルール
var defaultRuleStr = 'private R-18';

// アップデート確認用URI
var updateCheckURI = 'https://api.github.com/repos/syusui-s/PixivAutoTag.user.js/git/refs/heads/master';

// 設定テキストを解析し、連想配列で返す
var parseRules = function(ruleStr) {
	var patternRule     = [];
	var patternAllRule  = [];
	var additionRule    = [];
	var additionAllRule = [];
	var privateRule     = [];
	var errors          = [];

	// 正規表現を表す文字列のリストから、正規表現のリストを作成
	var createRegExpFromStrAry = function(regexpStrAry, lineNumber) {
		var regexps = [];
		regexpStrAry.forEach(function(regexpStr) {
			try { regexps.push(new RegExp(regexpStr)); }
			catch (e) { errors.push({ lineNumber: lineNumber, message: ('正規表現のエラーです（' + e.name + ':' + e.message + '）。内容: ' + regexpStr) }); }
		});
		return regexps;
	};

	// strに完全一致する正規表現を生成
	var createRegExpPerfectMatch = function(str) {
		return new RegExp('^' + str.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&') + '$');
	};

	// タグ、正規表現リスト、追加先を受け取り、追加する
	var addRule = function(tag, regexps, rules) {
		var rule = { tag: tag, regexps: regexps };
		Array.prototype.push.call(rules, rule);
	};

	ruleStr.split('\n').forEach(function(line, num) {
		var parsed = line.split(/\s+/);
		var matchData;

		var matchPattern = /^(pattern|match|addition_pattern)(|_all)$/i;

		if ( parsed.length >= 3 && (matchData = parsed[0].match(matchPattern)) ) {
			var tag = parsed[1];
			var type = matchData[1];
			var isSome = matchData[2].length === 0;
			var regexps;

			if ( type === 'match' ) {  // 一致
 				var rules = isSome ? patternRule : patternAllRule;
				var match_tags = parsed.slice(2);
				regexps = match_tags.map(createRegExpPerfectMatch);

				addRule(tag, regexps, rules);
			} else if ( type === 'pattern' ) { // 正規表現
 				var rules = isSome ? patternRule : patternAllRule;
				var str_regexps = parsed.slice(2);
				regexps = createRegExpFromStrAry(str_regexps, num + 1);

				addRule(tag, regexps, rules);
			} else if ( type === 'addition_pattern' ) { // 追加タグ
 				var rules = isSome ? additionRule : additionAllRule
				var str_regexps = parsed.slice(2);
				regexps = createRegExpFromStrAry(str_regexps, num + 1);

				addRule(tag, regexps, rules);
			} else {
				errors.push({
					lineNumber: (num+1),
					message: ('予期しないエラーが発生しました。作者にお知らせください。内容: ' + line)
				});
				return;
			}
		} else if ( parsed.length >= 2 && parsed[0].match(/^private$/i) ) { // 非公開タグ
			var rules = parsed.slice(1);
			privateRule.push.apply(privateRule, rules);
		} else if ( line.match(/^\s*$|^\s*#/) ) { // 空行 or コメント行
			// nothing to do
		} else {
			errors.push({
				lineNumber: (num+1),
				message: ('不正なコマンドを使用しているか、引数が少なすぎます。内容: ' + line)
			});
			return false;
		}
	});
	return {
		privateRule:     privateRule,
		patternRule:     patternRule,
		patternAllRule:  patternAllRule,
		additionRule:    additionRule,
		additionAllRule: additionAllRule,
		errors:          errors
	};
};

// matchDataの配列を渡すと文中の~数字をそれで置き換える
var replaceWithMatch = function(input, matchData) {
	return input.split(/(~\d)/).map(function(str) {
		var match = str.match(/^~(\d)/);
		if ( match ) { return matchData[parseInt(match[1])] || ''; }
		return str;
	}).join('');
};

// 設定画面の生成・消去
var toggleSettingsView = function() {
	// すでに存在していたなら消去
	var settingsView = document.querySelector('#autotag-settings-view');
	if (settingsView) { settingsView.remove(); return; }

	// 保存済みデータの取得
	var ruleStr = window.localStorage.pixivAutoTag_taggingRule || defaultRuleStr;

	// フォームの作成
	settingsView = document.createElement('form');
	settingsView.id = 'autotag-settings-view';
	settingsView.style.backgroundColor = '#FFFFFF';
	settingsView.style.marginTop    = '5px';
	settingsView.style.padding      = '10px 9px';
	settingsView.style.borderRadius = '5px';

	var paragraph = document.createElement('p');
	var label = document.createElement('lavel');
	label.textContent = 'タグ付けルール';
	var br = document.createElement('br');
	var textarea = document.createElement('textarea');
	textarea.id = 'autotag-settings-tagging-rule';
	textarea.cols = '80';
	textarea.rows = '10';
	textarea.style.height = 'auto';
	textarea.defaultValue = ruleStr;
	
	paragraph.appendChild(label);
	paragraph.appendChild(br);
	paragraph.appendChild(textarea);
	settingsView.appendChild(paragraph);

	var buttonsParagraph = document.createElement('p');

	var saveButton = document.createElement('input');
	saveButton.type = 'submit';
	saveButton.className = '_button';
	saveButton.value = '保存';

	settingsView.addEventListener('submit', function(ev) {
		var ruleStr = document.querySelector('#autotag-settings-tagging-rule').value;
		var rule = parseRules(ruleStr);
		if (rule.errors.length === 0) {
			window.localStorage.pixivAutoTag_taggingRule = ruleStr;
			alert('保存しました');
		} else {
			alert(rule.errors.map(function(err) { return '[Error] line: ' + err.lineNumber + ', message: ' + err.message; }).join('\n'));
		}
		ev.preventDefault();
	});
	buttonsParagraph.appendChild(saveButton);

	var cancelButton = document.createElement('input');
	cancelButton.className = '_button';
	cancelButton.type = 'reset';
	cancelButton.value = 'キャンセル';
	buttonsParagraph.appendChild(cancelButton);

	var downloadButton = document.createElement('input');
	downloadButton.className = '_button';
	downloadButton.type = 'button';
	downloadButton.value = '設定のダウンロード';
	downloadButton.addEventListener('click', function(ev) {
		var a = document.createElement('a');
		var date = new Date();
		a.href = textarea.value;
		a.download = 'pixiv_auto_tag-' + date.getTime() + '.txt';
		a.click();
	});
	buttonsParagraph.appendChild(downloadButton);

	settingsView.appendChild(buttonsParagraph);

	var settingsButton = document.querySelector('#autotag-settings-button');
	settingsButton.parentElement.insertBefore(settingsView, settingsButton.nextSibling);
};

// タグの自動追加関数
var autoTag = function() {
	var ruleText = window.localStorage.pixivAutoTag_taggingRule || defaultRuleStr;
	var rule = parseRules(ruleText);

	// 作品タグとタグクラウドの取得
	var tagCloud = Array.prototype.slice.call(
		document.querySelectorAll('section.tag-cloud-container > ul.tag-cloud > li'))
			.map(function(item) { return item.textContent; }
	);
	var tagsExist = Array.prototype.concat.apply(
		[],
		Array.prototype.slice.call(
			document.querySelectorAll('div.recommend-tag > ul span.tag')
		).map(function(item) { return item.textContent.replace(/^\*/, '').split('/'); })
	);

	// 非公開タグが含まれていた場合、自動で非公開に設定
	var privateButton = document.querySelector('ul.privacy input[value="1"]');
	if (tagsExist.some(function(tag){ return rule.privateRule.indexOf(tag) !== -1; })) {
		privateButton.checked = true;
	}

	// tags: タグ配列, rules: ルール配列, tags: 出力先タグ配列
	var applySomeRule = function(tags, rules, array) {
		tags.forEach(function(tag) { // それぞれのタグに対して
			rules.forEach(function(rule) { // それぞれのルールの
				var matchData = [];
				var foundMatchFlag = rule.regexps.some(function(pattern) { // いずれかの正規表現が一致するか？
					return (matchData = tag.match(pattern));
				});
				if (foundMatchFlag) { array.push(replaceWithMatch(rule.tag, matchData)); }
			});
		});
	};

	var applyAllRule = function(tags, rules, array) {
		rules.forEach(function(rule) { // それぞれのルール文の
			var matchData = [];
			var foundMatchFlag = rule.regexps.every(function(pattern) { // すべてのパターンが
				return tags.some(function(tag) { return (matchData = tag.match(pattern)); }); // いずれかの作品タグに一致するか？
			});
			if (foundMatchFlag) { array.push(replaceWithMatch(rule.tag, matchData)); }
		});
	};

	// タグ入力欄
	var input = document.querySelector('#input_tag');

	// ブックマークタグリストの生成
	if (input && input.value.length === 0) {
		// 作品タグに追加
		applySomeRule(tagsExist, rule.additionRule, tagsExist);
		applyAllRule(tagsExist, rule.additionAllRule, tagsExist);

		// 作品タグとタグクラウドの共通タグを抽出
		var tagsFound = tagsExist.filter(function(existTag) {
			return tagCloud.some(function(cloudTag){
				return existTag === cloudTag;
			});
		});

		// 付与タグリストの生成
		var tagsAdded = [];
		applySomeRule(tagsExist, rule.patternRule, tagsAdded);
		applyAllRule(tagsExist, rule.patternAllRule, tagsAdded);

		// タグを消去する
		tagsFound = tagsFound.filter(function(foundTag) { return tagsAdded.indexOf('-'+foundTag) === -1; });
		tagsAdded = tagsAdded.filter(function(tag) { return !tag.match(/^-/); });

		// 重複の削除
		var uniqueAry = tagsFound.concat(tagsAdded).filter(function(elem, i, ary) { return ary.indexOf(elem) === i; }).join(' ');

		// ブックマークタグを設定する
		input.value = uniqueAry;

		// タグのハイライトを表示させる
		var keyupEvent = document.createEvent('HTMLEvents');
		keyupEvent.initEvent('keyup', true, true);
		input.dispatchEvent(keyupEvent);

		// タグ付けが終わったら、背景を緑色にして補完がされたことを示す
		input.parentNode.style.backgroundColor = '#76B6E0';
		// それと入力欄にフォーカスする
		input.focus();
	}
};

var generateButtons = function() {
	// 設定ボタンの生成
	var settingsButton = document.createElement('button');
	settingsButton.className = '_button';
	settingsButton.style.marginLeft = '1em';
	settingsButton.id = 'autotag-settings-button';
	settingsButton.textContent = 'タグ自動化設定';
	settingsButton.addEventListener('click', toggleSettingsView, false);

	// タグ付けボタンの生成
	var autoTagButton = document.createElement('button');
	autoTagButton.className = '_button';
	autoTagButton.style.marginLeft = '0.25em';
	autoTagButton.id = 'autotag-button';
	autoTagButton.textContent = '上書きタグ付け';
	autoTagButton.addEventListener('click', function() {
		var input = document.querySelector('#input_tag');
		input.value = '';
		autoTag();
	}, false);

	var target = document.querySelector('div.recommend-tag > h1');
	target.parentElement.insertBefore(settingsButton, target.nextSibling);
	target.parentElement.insertBefore(autoTagButton, settingsButton.nextSibling);
};

(function() {
	window.addEventListener('PixivAutoTag.autoTag', function () { autoTag(); });
	window.addEventListener('PixivAutoTag.generateButtons', function () { generateButtons(); });

	// 自動タグ付けの実行
	if (/member_illust.php/.test(location.href)) {
		var ul = document.querySelector('section.list-container.tag-container.work-tags-container > div > ul');
		var checkTagGenerated = function(fn) { (ul.childNodes.length > 0) ? window.setTimeout(autoTag, 750) : window.setTimeout(fn, 750, fn); };
		window.setTimeout(checkTagGenerated, 1250, checkTagGenerated);
		generateButtons();
	} else if (/bookmark_add/.test(location.href)) {
		window.setTimeout(autoTag, 750);
		generateButtons();
	}

})();
