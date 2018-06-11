//=============================================================================
// Jump Gap
// Jump Gap.js
// Version: 1.01
// Changes: 1.01
//          - Added a detection to prevent jumping into non-movable tile or
//            tile that is occupied by events.
//          - Added Config option to decide SE played when jumping.
//          1.00
//          - First Published.
//=============================================================================

var Imported = Imported || {};
Imported.Kien_JumpGap = true;

var Kien = Kien || {};
Kien.JumpGap = {};


//=============================================================================
/*:
 * @plugindesc Add the feature of auto jumping through gaps
 * @author Kien

 * @param SE Name
 * @desc Name of SE played when jumping. Left Empty to not play SE.
 * @default 

 * @param SE Volume
 * @desc Volume of SE.
 * @default 90

 * @param SE Pitch
 * @desc Pitch of SE.
 * @default 100

 * @param SE Pan
 * @desc Pan of SE.
 * @default 100

 * @help
 * ============================================================================
 * * Jump Gap (English Document)
 * ============================================================================
 * Add a easy way to perform jumping at 1 tile space gaps, similar to the game Golden Sun Series.
 * ============================================================================
 * * How to Use
 * ============================================================================
 * Add following notes to the maps you want this feature enables:
 * <Jump Region *rid,*dir>
 * This will set region ID *id as marker of a jump action, allowing to jump to *dir directions.
 * For example:
 * <Jump Region 63,2468> will set region 63 as a marker to allow player jump from all direction, and
 * <Jump Region 62,2> will set region 62 as a marker to allow player jump from up to down.
 * allowed directions are 2=down, 4=left, 6=right and 8=up.
 * The marker is use to mark the map tile that is not passable normally, and at 1 tile further there have a passable tile.
 * ============================================================================
 * * End of Document (English Document)
 * ============================================================================
 * ============================================================================
 * * 自動ジャンプ（Japanese Document）
 * ============================================================================
 * 黄金の太陽シリーズに似たコントロール可能な自動ジャンプ機能を追加します。
 * ============================================================================
 * * 使い方
 * ============================================================================
 * 次のような内容を適用したいマップのメモ欄に追加します：
 * <Jump Region *rid,*dir>
 * これはrid番のリージョンIDを、*dir方向に向かってジャンプできるように設定するマーカーとして機能させます
 * 例として、<Jump Region 63,2468>はリージョンID63が設定された通行不能タイルをすべての方向に向かってジャンプ可能なタイルとして設定し、
 * <Jump Region 62,2>はリージョンID62が設定された通行不能タイルを下方向に向かってジャンプ可能なタイルとして設定します。
 * 方向として指定可能な数字は2=下方向、4=左方向、6=右方向、8=上方向です。
 * 通行不能タイルに指定したリージョンIDを設定し、さらにジャンプ方向に通行可能タイルが存在する場合にのみジャンプします
 * ============================================================================
 * * ドキュメント終了 (Japanese Document)
 * ============================================================================
 * ============================================================================
 * * 自动跳跃（Chinese Document）
 * ============================================================================
 * 添加类似黄金太阳系列的自动跳跃功能。需要用户自己设置可跳跃区域
 * ============================================================================
 * * 用法
 * ============================================================================
 * 添加以下内容到地图的备注栏
 * <Jump Region *rid,*dir>
 * 这将把rid号区域ID设置为可以向dir方向跳跃的标记。
 * 比如说，<Jump Region 63,2468>会将区域63设置为允许向全方向跳跃的标记，
 * <Jump Region 62,2>会将区域62设置为允许向下方跳跃的标记。
 * 可以设置的方向为2=下方，4=左方，6=右方，8=上方。
 * 标记不可通行的图块。当不可通行图块的前方（玩家移动的方向&你设置的方向）有可通行图块时执行跳跃。
 * ============================================================================
 * * 文档结束 (Chinese Document)
 * ============================================================================
*/

Kien.JumpGap.parameters = PluginManager.parameters("JumpGap");
Kien.JumpGap.SE = { name:   Kien.JumpGap.parameters["SE Name"],
                    pitch:  Kien.JumpGap.parameters["SE Pitch"],
                    volume: Kien.JumpGap.parameters["SE Volume"],
                    pan:    Kien.JumpGap.parameters["SE Pan"]}

Kien.JumpGap.Game_Player_moveStraight = Game_Player.prototype.moveStraight;
Game_Player.prototype.moveStraight = function (d) {
    Kien.JumpGap.Game_Player_moveStraight.apply(this, arguments);
    if (!this.isMovementSucceeded() && !$gameMap.isEventRunning()) {
        var x2 = $gameMap.roundXWithDirection(this._x, d);
        var y2 = $gameMap.roundYWithDirection(this._y, d);
        var rid = $gameMap.regionId(x2, y2);
        if ($gameMap.jumpDirFromRegion(rid).contains(d)) {
            var x3 = $gameMap.roundXWithDirection(x2, d);
            var y3 = $gameMap.roundYWithDirection(y2, d);
            if (this.canPassByJump(x3,y3)){
                this.jump(x3 - this._x,y3  - this._y);
                if (!Kien.JumpGap.SE.name.length == 0){
                    AudioManager.playSe(Kien.JumpGap.SE);
                }
                this.setMovementSuccess(true);
            }
        }
    }
};

Game_Player.prototype.canPassByJump = function(x, y) {
    if (!$gameMap.isValid(x, y)) {
        return false;
    }
    if (this.isThrough() || this.isDebugThrough()) {
        return true;
    }
    if ([2,4,6,8].filter(function(d){return $gameMap.isPassable(x, y, d)}).length == 0){
        return false;
    }
    if (this.isCollidedWithCharacters(x,y)) {
        return false;
    }
    return true;
};

Game_Map.prototype.jumpDirFromRegion = function (rid) {
	var reg = RegExp('\<Jump Region '+rid+',([2468]+)\>',"i")
	if ($dataMap.note.match(reg)!= null){
		return (RegExp.$1.toString().split("").map(function(v) {return parseInt(v) } ));
	}
    return [];
}