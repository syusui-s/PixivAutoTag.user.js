// ==UserScript==
// @name              Pixiv自動ブックマークタグ付け
// @description       Pixivのブックマークタグ付けを半自動化してくれる
// @include           http://www.pixiv.net/bookmark_add.php?type=illust&illust_id=*
// @include           http://www.pixiv.net/member_illust.php?mode=medium&illust_id=*
// @run-at            document-end
// @version           0.2.1
// ==/UserScript==

// デフォルトルール
var defaultRuleStr = 'private R-18';

// タグ入力欄
var input = document.querySelector('#input_tag');

// 設定テキストを解析し、連想配列で返す
var parseRules = function(ruleStr) {
	var patternRule    = [];
	var patternAllRule = [];
	var privateRule    = [];
	var errors         = [];

	// 正規表現を表す文字列のリストから、正規表現のリストを作成
	var createRegExpFromStrAry = function(regexpStrAry, lineNumber) {
		var regexps = [];
		regexpStrAry.forEach(function(regexpStr) {
			try { regexps.push(new RegExp(regexpStr)); }
			catch (e) { errors.push({ lineNumber: lineNumber, message: ('RegularExpression Error:' + e.name + ':' + e.massage + ', Str:' + regexpStr) }); }
		});
		return regexps;
	};

	// strに完全一致する正規表現を生成
	var createRegExpPerfectMatch = function(str) {
		return new RegExp('^' + str.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&') + '$');
	};

	ruleStr.split('\n').forEach(function(line, i) {
		var parsed = line.split(/\s+/);
		var matchData;
		var rule;
		if ( parsed.length >= 3 && (matchData = parsed[0].match(/^match(|_all)$/i)) ) {  // 一致
			rule = { tag: parsed[1], regexps: parsed.slice(2).map(createRegExpPerfectMatch) };
		} else if ( parsed.length >= 3 && (matchData = parsed[0].match(/^pattern(|_all)$/i)) ) { // 正規表現
			var regexps = createRegExpFromStrAry(parsed.slice(2), i + 1);
			rule = { tag: parsed[1], regexps: regexps };
		} else if ( parsed.length >= 2 && parsed[0].match(/^private$/i) ) {                     // 非公開タグ
			privateRule.push.apply(privateRule, parsed.slice(1));
			return;
		} else if ( line.match(/^\s*$|^\s*#/) ) {                                               // 空行 or コメント行
			return;
		} else {
			errors.push({ lineNumber: (i+1), message: ('CommandError:Invalid Command or Too Few Arguments, Str:' + line) });
			return;
		}

		Array.prototype.push.call(matchData[1].length === 0 ? patternRule : patternAllRule, rule);
	});
	return { privateRule: privateRule, patternRule: patternRule, patternAllRule: patternAllRule, errors: errors };
};

// matchDataの配列を渡すと文中の~数字をそれで置き換える
var replaceWithMatch = function(input, matchData) {
	return input.split(/(~\d)/).map(function(str) {
		var match = str.match(/^~(\d)/);
		if(match) { return matchData[parseInt(match[1])] || ''; }
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

	var templateStr  = '<p><label>タグ付けルール<br><textarea id="autotag-settings-tagging-rule" cols="80" rows="10" style="height:auto;">{{:rule}}</textarea></label></p>';
	settingsView.innerHTML = templateStr.replace('{{:rule}}', ruleStr);

	var buttonsParagraph = document.createElement('p');

	var saveButton = document.createElement('input');
	saveButton.type = 'submit';
	saveButton.className = '_button';
	saveButton.value = '保存';
	settingsView.onsubmit = function() {
		var ruleStr = document.querySelector('#autotag-settings-tagging-rule').value;
		var rule = parseRules(ruleStr);
		if (rule.errors.length === 0) {
			window.localStorage.pixivAutoTag_taggingRule = ruleStr;
			alert('保存しました');
		} else {
			alert(rule.errors.map(function(err) { return '[Error] line: ' + err.lineNumber + ', message: ' + err.message; }).join('\n'));
		}
		return false;
	};
	buttonsParagraph.appendChild(saveButton);

	var cancelButton = document.createElement('input');
	cancelButton.className = '_button';
	cancelButton.type = 'reset';
	cancelButton.value = 'キャンセル';
	// cancelButton.onclick = function() { document.querySelector('#autotag-settings-view').remove(); };
	buttonsParagraph.appendChild(cancelButton);

	settingsView.appendChild(buttonsParagraph);

	var settingsButton = document.querySelector('#autotag-settings-button');
	settingsButton.parentElement.insertBefore(settingsView, settingsButton.nextSibling);
};

// タグの自動追加関数
var autoTag = function() {
	var ruleText = window.localStorage.pixivAutoTag_taggingRule || defaultRuleStr;
	var rule = parseRules(ruleText);

	// 作品タグとタグクラウドの取得
	var tagCloud = Array.prototype.slice.call(document.querySelectorAll('section.list-container.tag-container.tag-cloud-container > ul.list-items.tag-cloud > li')).map(function(item) { return item.textContent; });
	var tagsExist = Array.prototype.concat.apply([], Array.prototype.slice.call(document.querySelectorAll('section.list-container.tag-container.work-tags-container > div > ul span.tag')).map(function(item) { return item.textContent.replace(/^\*/, '').split('/'); }));

	// 非公開タグが含まれていた場合、自動で非公開に設定
	var privateButton = document.querySelector('div.submit-container > ul > li:nth-child(2) > label > input[type="radio"]');
	if (tagsExist.some(function(tag){ return rule.privateRule.indexOf(tag) !== -1; })) {
		privateButton.checked = true;
	}

	// ブックマークタグリストの生成
	if (input.value.length === 0) {
		// 作品タグとタグクラウドの共通タグを抽出
		var tagsFound = tagsExist.filter(function(existTag) { return tagCloud.some(function(cloudTag){ return existTag === cloudTag; }); });

		// 付与タグリストの生成
		var tagsAdded = [];
		tagsExist.forEach(function(tag) { // それぞれの作品タグが
			rule.patternRule.forEach(function(patternRule) { // それぞれのルール文に対し
				var matchData = [];
				var foundMatchFlag = patternRule.regexps.some(function(pattern) { // いずれかのパターンに一致するか
					return (matchData = tag.match(pattern));
				});
				if (foundMatchFlag) { tagsAdded.push(replaceWithMatch(patternRule.tag, matchData)); }
			});
		});

		rule.patternAllRule.forEach(function(patternRule) { // それぞれのルール文の
			var matchData = [];
			var foundMatchFlag = patternRule.regexps.every(function(pattern) { // すべてのパターンが
				return tagsExist.some(function(tag) { return (matchData = tag.match(pattern)); }); // いずれかの作品タグに一致するか？
			});
			if (foundMatchFlag) { tagsAdded.push(replaceWithMatch(patternRule.tag, matchData)); }
		});

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

(function() {
	// 自動タグ付けの実行
	if (window.location.href.match(/member_illust/)) {
		var ul = document.querySelector('section.list-container.tag-container.work-tags-container > div > ul');
		var func = function(fn) { (ul.childNodes.length > 0) ? window.setTimeout(autoTag, 750) : window.setTimeout(fn, 750, fn); };
		window.setTimeout(func, 1250, func);
	} else {
		window.setTimeout(autoTag, 750);
	}

	// 設定ボタンの生成
	var settingsButton = document.createElement('button');
	settingsButton.className = '_button';
	settingsButton.style.marginLeft = '1em';
	settingsButton.id = 'autotag-settings-button';
	settingsButton.textContent = 'タグ自動化設定';
	settingsButton.addEventListener('click', toggleSettingsView, false);

	var target = document.querySelector('section.list-container.tag-container.work-tags-container > div > h1');
	target.parentElement.insertBefore(settingsButton, target.nextSibling);

	// タグ付けボタンの生成
	var autoTagButton = document.createElement('button');
	autoTagButton.className = '_button';
	autoTagButton.style.marginLeft = '0.25em';
	autoTagButton.id = 'autotag-button';
	autoTagButton.textContent = '上書きタグ付け';
	autoTagButton.addEventListener('click', function() { input.value = ''; autoTag(); }, false);
	target.parentElement.insertBefore(autoTagButton, settingsButton.nextSibling);
})();
