//=============================================================================
// Event Passable Override
// EventPassableOverride.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_EventPassableOverride = true;

var Kien = Kien || {};
Kien.EPO = {};

//=============================================================================
/*:
 * @plugindesc Allow to override map passage by events with specified comments.
 * @author Kien
 * @help
  ============================================================================
 * * Event Passable Override (English Document)
 * ============================================================================
 * Allow using events to override the passage settign of map.
 * ============================================================================
 * * How to Use
 * ============================================================================
 * Add a comment to the first command of a event page, and add following line in it:
 * <Passage Override [dir]>
 * This will set the event to override the passage to dir.
 * Dir is a set of number representing directions, includes: 0,2,4,6,8. where 0 
 * means not allowed to pass.
 * For example:
 * <Passage Override 2,8> will set the event to override the tile as a tile allow
 * to pass up down, and
 * <Passage Override 0> will set set the event to override the tile as a tile
 * not allow to pass.
 * ============================================================================
 * * End of Document (English Document)
 * ============================================================================
 * ============================================================================
 * * イベントで通行可能設定（Japanese Document）
 * ============================================================================
 * イベントを利用して通行可能かどうかを設定できるようにします。
 * ============================================================================
 * * 使い方
 * ============================================================================
 * イベントの最初のコマンドをコメントにし、その中に以下の行を入れます：
 * <Passage Override [dir]>
 * 　これが存在するイベントは、そのタイルの通行設定を[dir]に入れてある数字に変
 * 更します。[dir]に入れられる数字は0,2,4,6,8で、0は通行不能、それ以外はその方
 * 向に可能を意味します。
 * ============================================================================
 * * ドキュメント終了 (Japanese Document)
 * ============================================================================
 * ============================================================================
 * * 事件重定义通行设置（Chinese Document）
 * ============================================================================
 * 使用事件来设置特定位置的通行设置
 * ============================================================================
 * * 用法
 * ============================================================================
 * 在想要设置的事件页的第一个指令设置注释，并在注释内添加以下一行：
 * <Passage Override [dir]>
 *     有这个注释的事件将会被定义为通行设置重定义事件，将事件存在的位置的通行度
 * 更改为[dir]指定的通行设置。dir为以下数字的组合：0,2,4,6,8，其中0为不可同行，
 * 剩下的数字分别代表对应的方向可以通行。
 * ============================================================================
 * * 文档结束 (Chinese Document)
 * ============================================================================
*/


Game_Event.prototype.passableOverride = function() {
	if(this.page()){
		var list = this.list();
		if (list && list.length > 0){
			var n = 0;
			while([108,408].indexOf(list[n].code) >= 0){
				if(list[n].parameters[0].match(/\<Passage Override (0|[2468]+)\>/i)){
					return RegExp.$1;
				}
				n++;
			}
		}
	}
	return [];
}

Kien.EPO.Game_Event_posNt = Game_Event.prototype.posNt;
Game_Event.prototype.posNt = function(x,y) {
	if (this.passableOverride().length > 0) {
		return false;
	}
	return Kien.EPO.Game_Event_posNt.apply(this, arguments);
}

Kien.EPO.Game_Map_checkPassage = Game_Map.prototype.checkPassage;
Game_Map.prototype.checkPassage = function(x, y, bit) {
	var dir = (Math.log2(bit) + 1)*2;
	var dirs = this.eventsXy(x,y).map(function(event){return event.passableOverride()});
	if(dirs.length > 0){
		for (var n = 0 ; n < dirs.length ; n++ ){
			if(dirs[n].length>0){
				var d = dirs[n];
				if(d.indexOf("0") >= 0){
					return false;
				}
				if (d.indexOf(dir.toString()) >= 0){
					return true;
				}
			}
		}
	}
	return Kien.EPO.Game_Map_checkPassage.apply(this,arguments);
};