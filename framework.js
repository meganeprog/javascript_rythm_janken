/**
 * 単純な点情報をあらわすクラスです。
 */
export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * x座標です。
     * @type {number}
     */
    x = 0;

    /**
     * y座標です。
     * @type {number}
     */
    y = 0;
}

/**
 * 入力を監視するクラスです。
 */
export class InputReciever {
    /**
     * コンストラクタ
     * @param {canvas} Canvas   キャンバス
     */
    constructor(canvas) {
        const scale = window.devicePixelRatio;
        const canvasLeft = canvas.getBoundingClientRect().left;
        const canvasTop = canvas.getBoundingClientRect().top;
        
        // マウスが押されたときのイベントをキャッチ
        document.addEventListener("mousedown", (event) => {
            const x = (event.clientX - canvasLeft) * scale;
            const y = (event.clientY - canvasTop) * scale;
            this.#touches.push(new Point(x, y));
            event.preventDefault(); // ブラウザのデフォルト動作を防ぐ
        }, { passive: false });

        // タッチされたときのイベントをキャッチ
        document.addEventListener("touchstart", (event) => {
            // changedTouchesを使うことで、新たにタッチされた位置を取得できる
            const x = (event.changedTouches[0].clientX - canvasLeft) * scale;
            const y = (event.changedTouches[0].clientY - canvasTop) * scale;
            this.#touches.push(new Point(x, y));
            event.preventDefault(); // ブラウザのデフォルト動作を防ぐ
        }, { passive: false });

        // スクロールを禁止する
        document.addEventListener('touchmove', (event) => {
            event.preventDefault(); // ブラウザのデフォルト動作を防ぐ
        }, { passive: false });

        document.addEventListener('mousewheel', (event) => {
            event.preventDefault(); // ブラウザのデフォルト動作を防ぐ
        }, { passive: false });
    }

    /**
     * 入力情報をリフレッシュします。
     * リフレッシュレートが低速なモニターで、一瞬でタッチして離すとタッチしなかったことになるかもしれないので、
     * 確実にタッチ情報を読み取るために利用します。
     */
    reflesh() {
        this.#touches = [];
    }

    /**
     * マウスが押された、またはタッチされた数を取得します。
     * @return {number} タッチされている数です。1以上でタッチされています。
     */
    getTouchCount() {
        return this.#touches.length;
    }

    /**
     * マウスまたはタッチされている位置を取得します。
     * @param {number} index 複数点タッチを確認するために、0 以上 getTouchCount() 未満のインデックスを指定します。
     * @return {Point} タッチ位置を返します。
     */
    getTouchPoint(index) {
        if (index >= 0 && index < this.getTouchCount()) {
            return this.#touches[index];
        }
        return new Point();
    }

    /**
     * タッチ座標の配列です。
     * @type {Array}
     */
    #touches = [];
}

/**
 * 更新処理で受け渡す情報です。
 */
export class UpdateContext {
    /**
     * @type {number}   1回の描画で経過した時間です（単位は秒）。
     */
    deltaTime;

    /**
     * @type {InputReciever}    入力監視クラスです。
     */
    inputReciever;

    constructor(deltaTime, inputReciever) {
        this.deltaTime = deltaTime;
        this.inputReciever = inputReciever;
    }
}

/**
 * ゲームオブジェクトの基底クラスです。
 */
export class GameObject {
    /**
     * 子どもを追加します。
     * @param {GameObject} child 追加する子どもを指定します。
     */
    addChild(child) {
        // update の最中に追加してしまうと、実行タイミングがずれることがあるので予約だけしておく
        this.#reserveToAddChildren.push(child);
    }

    /**
     * 子どもを削除します。
     * @param {GameObject} child 削除する子どもを指定します。
     */
    removeChild(child) {
        // update の最中に削除すると forEach が壊れてしまうので、予約だけしておく
        this.#reserveToRemoveChildren.push(child);
    }

    /**
     * 自身を削除します。
     */
    removeSelf() {
        this.#parent.removeChild(this);
    }

    /**
     * 子どもの数を取得します。
     * @return {number} 子どもの数です。
     */
    getChildCount() {
        return this.#children.length;
    }

    /**
     * 子どもを取得します。
     * @param {number} index 子どものインデックスを指定します。
     * @return {GameObject} 子どもを返します。不正なインデックスが指定された場合は null を返します。
     */
    getChild(index) {
        if (index >= 0 && index < this.getChildCount()) {
            return this.#children[index];
        }
        return null;
    }

    /**
     * 子どもに一括処理を行います。
     * @param {function} func 一括処理を行う関数です。
     */
    childForEach(func) {
        this.#children.forEach((child) => { func(child); });
    }

    /**
     * 更新処理です。
     * この関数は SceneController から呼び出します。
     * 他の用途には使用しないでください。
     * @param {UpdateContext} context 更新用の情報です。
     */
    update(context) {
        // 削除予約を削除
        this.#reserveToRemoveChildren.forEach((child) => {            
            this.#children.forEach((obj, index, children) => {
                if (child == obj) {
                    children.splice(index, 1);
                    return;
                }
            });
        });
        this.#reserveToRemoveChildren = [];

        // 追加予約を追加
        this.#reserveToAddChildren.forEach((child) => {
            child.#parent = this;
            this.#children.push(child);            
        });
        this.#reserveToAddChildren = [];

        // 更新
        this.onUpdate(context);
        this.#children.forEach((obj) => {
            obj.update(context);
        });
    }

    /**
     * 描画処理です。
     * この関数は SceneController から呼び出します。
     * 他の用途には使用しないでください。
     * @param {CanvasRenderingContext2D} context 2D描画用のコンテキストです。
     */
    render(context) {
        this.onRender(context);
        this.#children.forEach((obj) => {
            obj.render(context);
        });
    }

    /**
     * 更新処理です。
     * サブクラスで継承して使用します。
     * @param {UpdateContext} context 更新用の情報です。
     */
    onUpdate(context) {}

    /**
     * 描画処理です。
     * サブクラスで継承して使用します。
     * @param {CanvasRenderingContext2D} context 2D描画用のコンテキストです。
     */
    onRender(context) {}

    /**
     * @type {GameObject}   親 GameObject です。
     */
    #parent = null;

    /**
     * @type {Array}   子 GameObject の配列です。
     */
    #children = [];

    /**
     * @type {Array}    追加予約された子 GameObject の配列です。
     */
    #reserveToAddChildren = [];

    /**
     * @type {Array}    削除予約された子 GameObject の配列です。
     */
    #reserveToRemoveChildren = [];  // 削除予約されたGameObject
}

/**
 * フェードインやフェードアウトを制御するクラスです。
 */
export class Fader {

    /**
     * フェードカラーを指定します。"white" や "rgb(100, 50, 0)" などと指定します。 
     */
    set color(value) {
        this.#color = value;
    }

    /**
     * フェード時間を指定します（単位は秒）。
     */
    set time(value) {
        this.#time = time;
    }

    /**
     * フェードインを開始します。
     */
    fadeIn() {
        this.#fadeType = this.FadeType.In;
        this.#elpsed = 0;
    }

    /**
     * フェードアウトを開始します。
     */
    fadeOut() {
        this.#fadeType = this.FadeType.Out;
        this.#elpsed = 0;
    }

    /**
     * フェードが完了したかどうかを取得します。
     * @return {boolean}    フェードが完了していたら true を返します。
     */
    isDone() {
        return this.#elpsed >= this.#time;
    }

    /**
     * フェードの更新処理です。
     * @param {UpdateContext} context 更新用の情報です。
     */
    update(context) {
        this.#elpsed = Math.min(this.#elpsed + context.deltaTime, this.#time);
    }

    /**
     * フェードの描画処理です。
     * @param {CanvasRenderingContext2D} context 2D描画用のコンテキストです。
     */
    render(context) {
        let alpha = 0;
        if (this.#fadeType == this.FadeType.In) {
            alpha = 1 - this.#elpsed / this.#time;
        }
        else if (this.#fadeType == this.FadeType.Out) {
            alpha = this.#elpsed / this.#time;
        }
        if (alpha > 0) {
            context.globalAlpha = alpha;
            context.fillStyle = this.#color;
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            context.globalAlpha = 1.0;
        }
    }

    /**
     * フェードタイプをあらわす enum です。
     */
    FadeType = {
        None: 0,
        In: 1,      // フェードインをあらわします。
        Out: 2,     // フェードアウトをあらわします。
    }

    /**
     * @type {string}   フェードカラーです。
     */
    #color = "white";

    /**
     * @type {number}   フェード時間です（単位は秒）。
     */
    #time = 0.5;

    /**
     * @type {number}   経過時間です（単位は秒）。
     */
    #elpsed = 0.5;

    /**
     * @type {FadeType}  フェードインなのかフェードアウトなのかの情報です。
     */
    #fadeType = this.FadeType.None;
}

// シーンの基底クラスです。
export class Scene extends GameObject {
    /**
     * コンストラクタです。
     * @param {SceneController} controller シーンコントローラーを設定します。
     */
    constructor(controller) {
        super();
        this.#controller = controller;
    }

    /**
     * コントローラーを取得します。
     */
    get controller() {
        return this.#controller;
    }

    /**
     * @type {SceneController}  シーンのコントローラーです。
     */
    #controller;
}

/**
 * シーンコントローラークラスです。
 */
export class SceneController {
    /**
     * コンストラクタです。
     * @param {number} canvasWidth      キャンバスの幅を指定します。
     * @param {number} canvasHeight     キャンバスの高さを指定します。
     */
    constructor(canvasWidth, canvasHeight) {
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;
    }

    /**
     * 現在のシーンを破棄して指定したシーンに遷移します。
     * @param {Scene} scene     遷移先のシーン
     */
    changeScene(scene) {
        this.#reserveScenes = [scene];
        this.#state = this.Status.change;
        this.#fader.fadeOut();
    }

    /**
     * 現在のシーンを残したまま指定したシーンを上乗せします。
     * @param {Scene} scene 上乗せするシーン
     */
    pushScene(scene) {
        this.#reserveScenes.push(scene);
        this.#state = this.Status.push;
    }

    /**
     * 最後に pushScene したシーンを削除します。
     * @param {Scene} scene 削除するシーン
     */
    popScene(scene) {
        this.#state = this.Status.pop;
    }

    /**
     * シーンを更新します。
     * @param {UpdateContext} context 更新用の情報
     */
    update(context) {
        // フェード
        this.fader.update(context);

        if (this.#state == this.Status.change) {
            if (this.#fader.isDone()) {
                // シーンを変更
                this.#scenes = this.#reserveScenes;
                this.#reserveScenes = [];
                this.#fader.fadeIn();
                this.#state  = this.Status.transition;
            }
            return;
        }
        else if (this.#state == this.Status.transition) {
            if (!this.#fader.isDone()) {
                return;
            }
        }
        else if (this.#state == this.Status.push) {
            // シーンを上乗せ
            this.#scenes = this.#scenes.concat(this.#reserveScenes);
            this.#reserveScenes = [];
        }
        else if (this.#state == this.Status.pop) {
            // シーンを削除
            this.#scenes.pop();
        }
        this.#state = this.Status.none;

        // シーンを更新
        if (this.#scenes.length > 0) {
            this.#scenes[this.#scenes.length - 1].update(context);
        }
    }

    /**
     * シーンを描画します。
     * @param {CanvasRenderingContext2D} cntext 2D描画用のコンテキストです。
     */
    render(cntext) {
        this.#scenes.forEach((scene) => {
            scene.render(cntext);
        });
        this.fader.render(cntext);
    }

    /**
     * フェード制御クラスを取得します。
     */
    get fader() {
        return this.#fader;
    }

    /**
     * キャンバスの幅を取得します。
     */
    get canvasWidth() {
        return this.#canvasWidth;
    }

    /**
     * キャンバスの高さを取得します。
     */
    get canvasHeight() {
        return this.#canvasHeight;
    }

    /**
     * 遷移ステータスです。
     */
    Status = {
        none: 0,
        change: 1,     // シーンを変更
        transition: 2, // シーンの変更演出中
        push: 3,       // シーンを上乗せ
        pop: 4,        // 最後のシーンを削除
    };

    /**
     * @type {number}   キャンバスの幅です。
     */
    #canvasWidth = 0;

    /**
     * @type {number}   キャンバスの高さです。
     */
    #canvasHeight = 0;

    /**
     * @type {Map}  シーン遷移のステータスです。
     */
    #state = this.Status.none;

    /**
     * @type {Array}    現在実行中のシーン配列です。
     */
    #scenes = [];

    /**
     * @type {Array}    予約されたシーンの配列です。
     */
    #reserveScenes = [];

    /**
     * @type {Fader}    フェード制御クラスです。
     */
    #fader = new Fader();
}

/**
 * アプリケーションクラスです。
 */
export class Application {
    /**
     * コンストラクタです。
     * @param {SceneController} sceneController シーン管理クラスです。必ず最初のシーンを設定しておきます。
     * @param {InputReciever} inputReciever 入力管理クラスです。
     * @param {Canvas} canvas Canvasです。
     */
    constructor(sceneController, inputReciever, canvas) {
        this.#sceneController = sceneController;
        this.#inputReciever = inputReciever;
        this.#canvas = canvas;
        this.#lastTime = performance.now();
    }

    /**
     * アプリケーションの更新処理です。
     */
    update() {
        // 前回からの経過時間を計算
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.#lastTime) / 1000;
        this.#lastTime = currentTime;

        // シーンの更新
        this.#sceneController.update(new UpdateContext(deltaTime, this.#inputReciever));

        // 入力情報のリフレッシュ
        this.#inputReciever.reflesh();
    }

    /**
     * アプリケーションの描画処理です。
     */
    render() {
        let context = this.#canvas.getContext("2d");

        // 背景をクリア
        context.fillStyle = "rgb(224, 224, 224)";
        context.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        // シーンの描画
        this.#sceneController.render(context);
    }

    /**
     * メインループです。
     */
    mainLoop() {
        this.update();
        this.render();
        window.requestAnimationFrame(() => { this.mainLoop(); });
    }
    
    /**
     * @type {number} 前回の時間です。
     */
    #lastTime = 0;
    /**
     * @type {SceneController} シーンコントローラーです。
     */
    #sceneController;
    /**
     * @type {InputReciever} 入力管理クラスです。
     */
    #inputReciever;
    /**
     * @type {Canvas} キャンバスです。
     */
    #canvas;
};
