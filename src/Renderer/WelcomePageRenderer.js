
import {mat4, degree2radian as d2r} from "../utils/gmath.js";
import Render from "./Render.js";
import Camera from "./Camera.js";
import * as glsl from "./glsl.js";
import {waitResource} from "../utils/loadResources.js";

let texImg = null;
waitResource("welcomePage/texture").then(img => texImg = img);

class WelcomeRenderer extends Render {
    constructor(canvas) {
        super(canvas);
        this.fitScreen();
        new ResizeObserver(async e => {
            await new Promise(s => setTimeout(s, 0));
            this.fitScreen();
        }).observe(canvas);
        const {ctx} = this;
        ctx.disable(ctx.CULL_FACE);
        this.prg = this.createProgram("startGamePage", glsl.startGamePage.vert, glsl.startGamePage.frag)
                    .use().bindTex("texture", this.createTexture(texImg));
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
        let mainCamera = this.mainCamera = new Camera(this.aspectRatio, {
            viewType: Camera.viewType.lookAt,
            fovy: 120, position: [0, 0, 0],
            lookAt: [-1, 0, 0], up: [0, 1, 0],
            far: 10,
        });
        this.addCamera(mainCamera);
        let vertexPosition = [
                -1, 1,-1, -1,-1,-1, -1,-1, 1, -1, 1, 1,
                -1, 1, 1, -1,-1, 1,  1,-1, 1,  1, 1, 1,
                 1, 1, 1,  1,-1, 1,  1,-1,-1,  1, 1,-1,
                 1, 1,-1,  1,-1,-1, -1,-1,-1, -1, 1,-1,
                 1, 1,-1, -1, 1,-1, -1, 1, 1,  1, 1, 1,
                -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,
            ],
            element = (len => {
                let base = [0,1,2, 0,2,3], out = [];
                for (let i = 0, j = 0; i <= len; j = i++ * 4)
                    out.push(...base.map(x => x + j));
                return out;
            })(vertexPosition.length / 12),
            textureCoord = (_ => {
                let out = [], min = 0.001;
                for (let i = 0; i < 6; i++)
                    out.push(
                        0.125 * i + min,       0 + min,
                        0.125 * i + min,       1 - min,
                        0.125 * (i + 1) - min, 1 - min,
                        0.125 * (i + 1) - min, 0 + min);
                return out;
            })();
        this.bos = {
            ver: this.createVbo(vertexPosition),
            tex: this.createVbo(textureCoord),
            ele: this.createIbo(element),
        };
        this.mM = mat4.identity();
        this.mvpM = mat4.identity();
    };
    get vpM() { return this.mainCamera.projview; };
    onRender() {
        const {ctx, prg, mM, vpM, mvpM, bos} = this;
        mat4.rotate(mM, d2r(1 / 70), [0, 1, 0], mM);
        mat4.multiply(vpM, mM, mvpM);
        prg.use()
        .setUni("mvpMatrix", mvpM)
        .setAtt("position", bos.ver)
        .setAtt("textureCoord", bos.tex);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
        ctx.bindBuffer(bos.ele.type, bos.ele);
        ctx.drawElements(ctx.TRIANGLES, bos.ele.length, ctx.UNSIGNED_SHORT, 0);
        ctx.flush();
    };
}

export {
    WelcomeRenderer,
};
