# PixivAutoTag.user.js
Pixivでブックマークタグ付け自動化してくれるUserScriptを書いたぞ！！

インストール方法
-----
### Chrome系の場合
1. pixiv_auto_tag.user.jsをダウンロードしておく
2. 設定を開く Chromeの設定→設定(S) →拡張機能の一覧を開く
3. 拡張機能の画面にファイラからpixiv_auto_tag.user.jsをドラッグ・アンド・ドロップする
4. 確認画面でOKを押す

### Firefoxの場合
1. pixiv_auto_tag.user.jsをダウンロードしておく
2. [GreaseMonkey](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/)を導入しておく
3. <about:addons>を開き、ユーザスクリプトの項目を開く
4. ユーザスクリプトの画面にファイラからpixiv_auto_tag.user.jsをドラッグ・アンド・ドロップする
5. 確認画面でインストールを押す

使い方
-----
* Pixivの「ブックマークに追加/編集」の画面を開いたら、自動的にタグ付けがされる。
* この作品のタグの横にある「タグ自動化設定」ボタンを押すと、設定画面が出てくる。

仕組みと処理内容
-----
1. 作品タグに非公開設定タグが含まれていたら非公開に設定する。
2. 作品タグとタグクラウドで共通するタグを抽出する。
3. 作品タグに対して、タグ・正規表現が一致するかどうかを確認し、付加タグリストを作成する。
4. 共通タグと付加タグリストの和集合をブックマークタグとする。

設定画面の項目
-----
設定画面で利用できる項目の説明です。

### タグ付けルール
タグ付けのルールを簡単な記法の文を使って記述することができる。
非公開タグを設定するprivate、タグを付与するmatch、patternが利用できる。

#### ルールの記法
* private - 引数のタグが作品タグに含まれていたら非公開に設定する（記法：`private "タグ1" "タグ2" ...`）
* match   - 第二引数以降のタグに一致した作品タグがあれば付与タグを付加リストに追加する（記法：`match "付与タグ" "タグ1" ...`）
* pattern - 第二引数以降の正規表現に一致した作品タグがあれば付与タグを付加リストに追加する（記法：`pattern "付与タグ" "正規表現1" ...`）

#### ルールの記法詳細
* privateの規則
	* 作品タグに一致しなければならない。
* matchとpatternの規則
	* 一致すると、付与タグで指定したタグが、付与タグのリストに追加される。
	* 「-削除タグ」でタグを削除できる。タグクラウドに入っていようがなかろうが消される。元からない場合は特に何もしない。
	* ルールは上から順に実行されるが、正直今の所は順序は関係してこないようにしてある。
	* 付与したタグはタグクラウドに含まれていなくても反映される。
* patternの規則
	* 正規表現は、JavaScriptのRegExpの引数を指定する。
	* "~番号"を使って、正規表現でマッチした箇所を参照できる。
	* 参照されるデータには、初めてマッチに成功したときのものが使われる。

ライセンス
-----
MIT LICENSEで公開します。LICENSEファイルをご覧ください。
