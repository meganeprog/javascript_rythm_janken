
import * as fw from "./framework.js";

const LEVEL_OF_DIFFICULTY_TABLE = [
    {time:  7, interval: 3, speed:  3, win:1, draw:0, lose:0},
    {time:  14, interval: 3, speed:  4, win:0, draw:0, lose:1},
    {time:  21, interval: 3, speed:  5, win:0, draw:1, lose:0},
    {time:  30, interval: 2, speed:  5, win:1, draw:1, lose:1},
    {time:  40, interval: 2, speed:  7, win:1, draw:1, lose:1},
    {time:  50, interval: 1.5, speed: 8, win:1, draw:0, lose:0},
    {time:  60, interval: 1.5, speed: 8, win:0, draw:0, lose:1},
    {time:  70, interval: 1.5, speed: 8, win:0, draw:1, lose:0},
    {time:  80, interval: 1.7, speed: 10, win:1, draw:1, lose:1},
    {time:  90, interval: 1.2, speed: 3, win:1, draw:1, lose:1},
    {time: 100, interval: 1.4, speed: 8, win:1, draw:1, lose:1},
    {time:   0, interval: 1.2, speed: 10, win:1, draw:1, lose:1},
];

const Rule = {
    win: "かって",
    lose: "まけて",
    draw: "あいこ"
};

const Hand = {
    rock: "✊",
    scissors: "✌️",
    paper: "✋"
}

class Ball extends fw.GameObject {
    constructor(rule, hand, speed, radius, lineWidth) {
        super();
        this.#rule = rule;
        this.#hand = hand;
        this.#speed = speed;
        this.#radius = radius;
        this.#lineWidth = lineWidth;
        if (rule == Rule.win) {
            this.#color = "indianred";
        }
        else if (rule == Rule.lose) {
            this.#color = "royalblue";
        }
        else {
            this.#color = "mediumseagreen";
        }
        this.#y = -radius;
    }

    onUpdate(context) {
        this.#y += context.deltaTime * this.#speed;
    }

    onRender(context) {
        const x = Math.floor(context.canvas.width / 2);
        const y = Math.floor(this.#y);
        this.#x = x;
        context.beginPath();
        context.arc(x, y, this.#radius, 0 * Math.PI / 180, 360 * Math.PI / 180, false);
        context.fillStyle = this.#color;
        context.fill();
        context.fillStyle = "rgb(255, 255, 255)";
        context.fillRect(x-this.#radius, y - this.#lineWidth / 2, this.#radius*2, this.#lineWidth);
        context.font = `${Math.floor(this.#radius/3)}pt sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.#rule, x,  y - this.#radius / 2);
        context.font = `${Math.floor(this.#radius/2)}pt sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.#hand, x,  y + this.#radius / 2);
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    get radius() {
        return this.#radius;
    }

    get hand() {
        return this.#hand;
    }

    get rule() {
        return this.#rule;
    }

    #x = 100;
    #y = 100;
    #radius;
    #lineWidth;
    #rule;
    #hand;
    #color;
    #speed;
}

class ButtonBase extends fw.GameObject {
    constructor() {
        super();
    }

    onUpdate(context) {
    }

    onRender(context) {
        context.fillStyle = "rgb(192, 192, 192)";
        context.fillRect(0, context.canvas.height / 5 * 4, context.canvas.width, context.canvas.height/5);
    }
}

class Button extends fw.GameObject {
    constructor(x, y, radius, hand, callback = (hand) => {}) {
        super();
        this.#x = x;
        this.#y = y;
        this.#radius = radius;
        this.#hand = hand;
        this.#callback = callback;
    }

    onUpdate(context) {
        for (let i = 0; i < context.inputReciever.getTouchCount(); i++) {
            const touchPoint = context.inputReciever.getTouchPoint(i);
            const dx = this.#x - touchPoint.x;
            const dy = this.#y - touchPoint.y;
            if (dx * dx + dy * dy < this.#radius * this.#radius) {
                // ヒット
                this.#callback(this.#hand);
                this.#animationTime = 0.3;
                this.#animationElpsed = 0;
                break;
            }
        }

        this.#animationElpsed = Math.min(this.#animationElpsed + context.deltaTime, this.#animationTime);
    }

    onRender(context) {
        const x = this.#x;
        const y = this.#y;
        context.beginPath () ;
        context.arc(x, y, this.#radius, 0 * Math.PI / 180, 360 * Math.PI / 180, false);
        context.fillStyle = "rgb(128, 128, 128)";
        context.fill() ;
        context.font = `${Math.floor(this.#radius)}pt sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.#hand, x,  y);

        if (this.#animationElpsed < this.#animationTime) {
            context.globalAlpha = 0.7 - (this.#animationElpsed / this.#animationTime) * 0.7;
            context.arc(x, y, this.#radius, 0 * Math.PI / 180, 360 * Math.PI / 180, false);
            context.fillStyle = "white";
            context.fill();
            context.globalAlpha = 1;
        }
    }

    #x;
    #y;
    #radius;
    #hand;
    #animationTime = 0;
    #animationElpsed = 0;
    #callback;
}

class Particle extends fw.GameObject {
    constructor(x, y, radius, color) {
        super();
        this.#x = x;
        this.#y = y;
        this.#radius = radius;
        this.#color = color;
        this.#alpha = 0.7;
        this.#lifeTime = 0.2;
    }

    onUpdate(context) {
        this.#radius += this.#radius * 2 * context.deltaTime * 4;
        this.#alpha -= 0.7 * context.deltaTime * 4;

        this.#lifeTime -= context.deltaTime;
        if (this.#lifeTime <= 0) {
            this.removeSelf();
        }
    }

    onRender(context) {
        context.beginPath () ;
        context.arc(this.#x, this.#y, this.#radius, 0 * Math.PI / 180, 360 * Math.PI / 180, false);
        context.fillStyle = this.#color;
        context.globalAlpha = this.#alpha;
        context.fill() ;
        context.globalAlpha = 1;
    }

    #x;
    #y;
    #radius;
    #color;
    #alpha;
    #lifeTime;
}

class ExcellentEffect extends fw.GameObject {
    constructor()  {
        super();
    }

    onUpdate(context) {
        this.#elpsed += context.deltaTime;
        if (this.#elpsed > this.#time) {
            this.removeSelf();
        }
    }

    onRender(context) {
        const x = context.canvas.width / 2;
        const y = context.canvas.height / 2;
        context.font = `${Math.floor(context.canvas.width/32)}pt sans-serif`;
        context.strokeStyle = "goldenrod";
        context.lineWidth = "4";
        context.lineJoin = "miter";
        context.miterLimit = "5"
        context.strokeText("エクセレント", x, y);
        context.fillStyle = "gold";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("エクセレント", x,  y);
    }

    #elpsed = 0;
    #time = 0.5;
}

class GreateEffect extends fw.GameObject {
    constructor()  {
        super();
    }

    onUpdate(context) {
        this.#elpsed += context.deltaTime;
        if (this.#elpsed > this.#time) {
            this.removeSelf();
        }
    }

    onRender(context) {
        const x = context.canvas.width / 2;
        const y = context.canvas.height / 2;
        context.font = `${Math.floor(context.canvas.width/32)}pt sans-serif`;
        context.strokeStyle = "lightslategray";
        context.lineWidth = "4";
        context.lineJoin = "miter";
        context.miterLimit = "5"
        context.strokeText("グレート", x, y);
        context.fillStyle = "silver";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("グレート", x,  y);
    }

    #elpsed = 0;
    #time = 0.5;
}

class GoodEffect extends fw.GameObject {
    constructor()  {
        super();
    }

    onUpdate(context) {
        this.#elpsed += context.deltaTime;
        if (this.#elpsed > this.#time) {
            this.removeSelf();
        }
    }

    onRender(context) {
        const x = context.canvas.width / 2;
        const y = context.canvas.height / 2;
        context.font = `${Math.floor(context.canvas.width/32)}pt sans-serif`;
        context.fillStyle = "cadetblue";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("グッド", x,  y);
    }

    #elpsed = 0;
    #time = 0.5;
}

class MissEffect extends fw.GameObject {
    constructor()  {
        super();
    }

    onUpdate(context) {
        this.#elpsed += context.deltaTime;
        if (this.#elpsed > this.#time) {
            this.removeSelf();
        }
    }

    onRender(context) {
        const x = context.canvas.width / 2;
        const y = context.canvas.height / 2;
        context.font = `${Math.floor(context.canvas.width/32)}pt sans-serif`;
        context.fillStyle = "crimson";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("ミス", x,  y);
    }

    #elpsed = 0;
    #time = 0.5;
}

class TitleScene extends fw.Scene {
    constructor(controller) {
        super(controller);
    }

    onUpdate(context) {
        this.#time += context.deltaTime;
        if (context.inputReciever.getTouchCount() > 0) {
            this.controller.changeScene(new GameScene(this.controller));
        }
    }

    onRender(context) {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "rgba(64, 64, 64)";
        context.font = `${Math.floor(context.canvas.width/16)}pt sans-serif`;
        context.fillText("リズムじゃんけん", context.canvas.width/2, context.canvas.height/3);
        context.font = `${Math.floor(context.canvas.width/32)}pt sans-serif`;
        const FLASHING_SPEED = 8;
        context.globalAlpha = (1 + Math.sin(this.#time * FLASHING_SPEED)) / 2;
        context.fillText("press start", context.canvas.width/2, context.canvas.height/3*2);
        context.globalAlpha = 1.0;
    }

    #time = 0;
}

class GameOverScene extends fw.Scene {
    constructor(controller) {
        super(controller);
    }

    onUpdate(context) {
        if (this.#waitTime > 0) {
            this.#waitTime -= context.deltaTime;
        }
        else {
            if (context.inputReciever.getTouchCount() > 0) {
                this.controller.changeScene(new TitleScene(this.controller));
            }
        }
    }

    onRender(context) {
        context.font = `${Math.floor(context.canvas.width/16)}pt sans-serif`;
        context.fillStyle = "crimson";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("ゲームオーバー", context.canvas.width / 2,  context.canvas.height / 2);
    }

    #waitTime = 1;
}

class GameScene extends fw.Scene {
    constructor(controller) {
        super(controller);
        const minSize = this.controller.canvasHeight/150;
        this.#judgementSizes = {
            excellent: Math.floor(minSize),  // 185
            greate: Math.floor(minSize * 3),      // 48
            good: Math.floor(minSize * 9)         // 16
        };
        this.#judgementLine = this.controller.canvasHeight/5*4 - this.#judgementSizes.good - this.#judgementSizes.excellent / 2;

        this.addChild(this.#balls);
        this.addChild(new ButtonBase());
        this.addChild(new Button(this.controller.canvasWidth/4, this.controller.canvasHeight/10*9, this.#judgementSizes.good, Hand.rock, (hand) => { this.#judgement(hand); }));
        this.addChild(new Button(this.controller.canvasWidth/4*2, this.controller.canvasHeight/10*9, this.#judgementSizes.good, Hand.scissors, (hand) => { this.#judgement(hand); }));
        this.addChild(new Button(this.controller.canvasWidth/4*3, this.controller.canvasHeight/10*9, this.#judgementSizes.good, Hand.paper, (hand) => { this.#judgement(hand); }));
    }

    onUpdate(context) {
        // 新しい手を出現させる
        this.#spawnBall(context);

        // 行き過ぎたものを削除する
        this.#balls.childForEach((ball) => {
            if (ball.y > this.controller.canvasHeight/5*4 + this.#judgementSizes.good) {
                this.addChild(new MissEffect());
                ball.removeSelf();
                if (--this.#life == 0) {
                    // ゲームオーバー
                    this.controller.pushScene(new GameOverScene(this.controller));
                }
            }
        });
    }

    onRender(context) {
        // 判定用のラインを描画
        context.fillStyle = "rgb(128, 128, 128)";
        context.fillRect(0, this.#judgementLine, context.canvas.width, this.#judgementSizes.excellent);

        // ライフ
        context.font = `${Math.floor(context.canvas.width/32)}pt sans-serif`;
        context.fillStyle = "rgb(64, 64, 64)";
        context.textAlign = "left";
        context.textBaseline = "top";
        let life = "";
        for (let i = 0; i < this.#life; i++) {
            life += "❤️";
        }
        context.fillText(`ライフ：${life}`, 4,  4);

        // スコア
        context.font = `${Math.floor(context.canvas.width/32)}pt sans-serif`;
        context.fillStyle = "rgb(64, 64, 64)";
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillText("スコア：" + this.#score, context.canvas.width/3*2,  0);
    }

    #balls = new fw.GameObject();
    #nextBallTimer = 0;

    #judgementLine;
    #judgementSizes;
    #points = {excellent: 5, greate:3, good:1};

    #level = 0;
    #time = 0;
    #life = 3;
    #score = 0;

    #judgement(hand) {
        if (this.#balls.getChildCount() > 0) {
            let ball = this.#balls.getChild(0);
            const dy = this.#judgementLine - ball.y;

            if (dy > this.#judgementSizes.good) {
                // 判定距離よりも遠いので無視
            }
            else {
                const success = this.#checkHand(ball.rule, hand, ball.hand);

                if (success && dy >= -this.#judgementSizes.excellent && dy <= this.#judgementSizes.excellent) {
                    // エクセレント
                    this.addChild(new Particle(ball.x, ball.y, ball.radius, "gold"));
                    this.addChild(new ExcellentEffect());
                    ball.removeSelf();
                    this.#score += this.#points.excellent;
                }
                else if (success && dy >= -this.#judgementSizes.greate && dy <= this.#judgementSizes.greate) {
                    // グレート
                    this.addChild(new Particle(ball.x, ball.y, ball.radius, "silver"));
                    this.addChild(new GreateEffect());
                    ball.removeSelf();
                    this.#score += this.#points.greate;
                }
                else if (success && dy >= -this.#judgementSizes.good && dy <= this.#judgementSizes.good ) {
                    // グッド
                    this.addChild(new Particle(ball.x, ball.y, ball.radius, "cadetblue"));
                    this.addChild(new GoodEffect());
                    ball.removeSelf();
                    this.#score += this.#points.good;
                }
                else {
                    // ミス
                    ball.removeSelf();
                    this.addChild(new MissEffect());
                    if (--this.#life == 0) {
                        // ゲームオーバー
                        this.controller.pushScene(new GameOverScene(this.controller));
                    }
                }
            }
        }
    }

    #checkHand(rule, playerHand, ballHand) {
        let success = false;
        if (rule == Rule.win) {
            if (playerHand == Hand.paper && ballHand == Hand.rock ||
                playerHand == Hand.rock && ballHand == Hand.scissors ||
                playerHand == Hand.scissors && ballHand == Hand.paper) {
                success = true;
            }
        }
        else if (rule == Rule.lose) {
            if (playerHand == Hand.paper && ballHand == Hand.scissors ||
                playerHand == Hand.rock && ballHand == Hand.paper ||
                playerHand == Hand.scissors && ballHand == Hand.rock) {
                success = true;
            }
        }
        else {
            if (playerHand == ballHand) {
                success = true;
            }
        }
        return success;
    }

    #spawnBall(context) {
        this.#time += context.deltaTime;
        this.#nextBallTimer -= context.deltaTime;
        if (this.#nextBallTimer < 0) {
            this.#nextBallTimer = 0;
            if (LEVEL_OF_DIFFICULTY_TABLE[this.#level].time != 0) {
                if (this.#time > LEVEL_OF_DIFFICULTY_TABLE[this.#level].time) {
                    if (this.#balls.getChildCount() == 0) {
                        this.#time = LEVEL_OF_DIFFICULTY_TABLE[this.#level].time;
                        ++this.#level;
                    }
                    else {
                        return;
                    }
                }
            }

            const level = LEVEL_OF_DIFFICULTY_TABLE[this.#level];
            const hands = [Hand.rock, Hand.scissors, Hand.paper];
            const rand = Math.random() * (level.win + level.lose + level.draw);
            const rule = rand < level.win ? Rule.win : (rand < level.win + level.lose ? Rule.lose : Rule.draw);
            const hand = hands[Math.floor(Math.random() * 3)];
            const speed = this.#judgementSizes.good * level.speed;
            this.#balls.addChild(new Ball(rule, hand, speed, this.#judgementSizes.good, this.#judgementSizes.excellent));
            this.#nextBallTimer = level.interval;
        }
    }
}

/**
 * このゲームのエントリーポイントです。
 * ページのロード後に処理を開始します。
 */
window.addEventListener('load', () => {
    // スクリーンサイズに応じてキャンバスのサイズを決める
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let canvasWidth = screenWidth;
    let canvasHeight = screenHeight;
    if (canvasWidth / 10 > canvasHeight / 16) {
        // 幅が大きすぎる場合は 16:10 に合わる
        canvasWidth = Math.floor(canvasHeight / 16 * 10);
    }

    let canvas = document.createElement('canvas');
    canvas.style.width = canvasWidth;
    canvas.style.height = canvasHeight;
    const left = Math.floor((screenWidth - canvasWidth) / 2);
    canvas.style.marginLeft = `${left}px`;
    // メモリ上における実際のサイズを設定（ピクセル密度の分だけ倍増させます）。
    const scale = window.devicePixelRatio;  // Retina でこの値を 1 にするとぼやけた canvas になります
    canvas.width = Math.floor(canvasWidth * scale);
    canvas.height = Math.floor(canvasHeight * scale);
    document.body.appendChild(canvas);

    // シーンコントローラーを作成し、最初のシーンを設定
    let sceneController = new fw.SceneController(canvas.width, canvas.height);
    sceneController.changeScene(new TitleScene(sceneController));

    // 入力管理クラスを作成
    let inputReciever = new fw.InputReciever(canvas);

    // アプリケーションを作成
    let app = new fw.Application(sceneController, inputReciever, canvas);
    
    // メインループ
    app.mainLoop();
});
