//=============================================================================
// Change Animation Frame Rate
// ChangeAnimationFrameRate.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_CAFR = true;

var Kien = Kien || {};
Kien.CAFR = {};
/*:
 * @plugindesc アニメーションのフレームレートをIDごとに設定する。
 * @author kien
 * @help
 * 
 * @param setting
 * @type struct<set>[]
 * @text 設定
 * @desc ここでアニメーションIDとフレームレートの組み合わせを設定する。
 *
 * @param defaultFrameRate
 * @text デフォルトのフレームレート
 * @desc　設定されていないアニメーションのフレームレート。ツクールデフォルトは15。
 * @default 15

 */
 /*~struct~set:
 * @param animationId
 * @text アニメーションID
 * @type animation
 * @decimals 0
 *
 * @param frameRate
 * @text フレームレート
 * @type number
 * @default 15
 * @decimals 0
 */

Kien.CAFR.parameters = Kien.lib.getParameters("ChangeAnimationFrameRate");
Kien.CAFR.cache = {};

Kien.CAFR.getFrameRate = function(animationId) {
	if (!!Kien.CAFR.cache[animationId]) {
		return Kien.CAFR.cache[animationId];
	}
	while (Kien.CAFR.parameters.setting.length > 0) {
		var set = Kien.CAFR.parameters.setting.shift();
		if (set.animationId == animationId) {
			Kien.CAFR.cache[animationId] = set.frameRate;
			return set.frameRate;
		} else {
			Kien.CAFR.cache[set.animationId] = set.frameRate;	
		}
	}
	return Kien.CAFR.parameters.defaultFrameRate;
}

Sprite_Animation.prototype.setupRate = function() {
    this._rate = Math.round(60 / Kien.CAFR.getFrameRate(this._animation.id));
};
