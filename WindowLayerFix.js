//=============================================================================
// WindowLayer Fix
// WindowLayerFix.js
// Version: 1.00
//=============================================================================
var Imported = Imported || {};
Imported.Kien_WindowLayerFix = true;

var Kien = Kien || {};
Kien.WLF = {};
//=============================================================================
/*:
 * @plugindesc Fix WindowLayer's position problem
 * @author Kien
 * @help
 *
 * @param Force Canvas
 * @desc for debug manner.
 * @default false
 * @type boolean
*/



Kien.WLF.parameters = Kien.lib.getParameters("WindowLayerFix");
Kien.WLF.canvas = Kien.WLF.parameters["Force Canvas"];

WindowLayer.prototype.localToCanvasX = function(x) {
    var node = this;
    while (node) {
        x += node.x;
        node = node.parent;
    }
    return x;
};

WindowLayer.prototype.localToCanvasY = function(y) {
    var node = this;
    while (node) {
        y += node.y;
        node = node.parent;
    }
    return y;
};

/**
 * @method _renderCanvas
 * @param {Object} renderSession
 * @private
 */
WindowLayer.prototype.renderCanvas = function(renderer) {
    if (!this.visible || !this.renderable) {
        return;
    }

    if (!this._tempCanvas) {
        this._tempCanvas = document.createElement('canvas');
    }

    this._tempCanvas.width = Graphics.width;
    this._tempCanvas.height = Graphics.height;

    var realCanvasContext = renderer.context;
    var context = this._tempCanvas.getContext('2d');

    context.save();
    context.clearRect(0, 0, Graphics.width, Graphics.height);
    context.beginPath();
    context.rect(this.localToCanvasX(this.x), this.localToCanvasY(this.y), this.width, this.height);
    context.closePath();
    context.clip();

    renderer.context = context;

    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child._isWindow && child.visible && child.openness > 0) {
            //this._canvasClearWindowRect(renderer, child);
            context.save();
            child.renderCanvas(renderer);
            context.restore();
        }
    }

    context.restore();

    renderer.context = realCanvasContext;
    renderer.context.setTransform(1, 0, 0, 1, 0, 0);
    renderer.context.globalCompositeOperation = 'source-over';
    renderer.context.globalAlpha = 1;
    renderer.context.drawImage(this._tempCanvas, 0, 0);

    for (var j = 0; j < this.children.length; j++) {
        if (!this.children[j]._isWindow) {
            this.children[j].renderCanvas(renderer);
        }
    }
};

WindowLayer.prototype.updateFilterArea = function() {
    this.filterArea.x = this.localToCanvasX(this.x);
    this.filterArea.y = this.localToCanvasY(this.y);
    this.filterArea.width = this.width;
    this.filterArea.height = this.height;
}

WindowLayer.prototype.renderWebGL = function(renderer) {
    if (!this.visible || !this.renderable) {
        return;
    }

    if (this.children.length==0) {
        return;
    }

    renderer.flush();
    this.updateFilterArea();
    renderer.filterManager.pushFilter(this, this.filters);
    renderer.currentRenderer.start();

    var shift = new PIXI.Point();
    var rt = renderer._activeRenderTarget;
    var projectionMatrix = rt.projectionMatrix;
    shift.x = Math.round((projectionMatrix.tx + 1) / 2 * rt.sourceFrame.width);
    shift.y = Math.round((projectionMatrix.ty + 1) / 2 * rt.sourceFrame.height);

    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child._isWindow && child.visible && child.openness > 0) {
            this._maskWindow(child, shift);
            //renderer.maskManager.pushScissorMask(this, this._windowMask);
            //renderer.clear();
            //renderer.maskManager.popScissorMask();
            renderer.currentRenderer.start();
            child.renderWebGL(renderer);
            renderer.currentRenderer.flush();
        }
    }

    renderer.flush();
    renderer.filterManager.popFilter();
    renderer.maskManager.popScissorMask();

    for (var j = 0; j < this.children.length; j++) {
        if (!this.children[j]._isWindow) {
            this.children[j].renderWebGL(renderer);
        }
    }
};

Kien.WLF.SceneManager_preferableRendererType = SceneManager.preferableRendererType;
SceneManager.preferableRendererType = function() {
    if (Utils.isOptionValid('test') && Kien.WLF.canvas) {
        return 'canvas';
    } else {
        return Kien.WLF.SceneManager_preferableRendererType.apply(this, arguments);
    }
};
