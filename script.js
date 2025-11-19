// =========================
// QUIZ DATA
// =========================
const quizList = [
    { q: "Ibu kota Indonesia?", a: "jakarta" },
    { q: "Planet terbesar?", a: "jupiter" },
    { q: "Benua terbesar?", a: "asia" },
    { q: "Gunung tertinggi?", a: "everest" },
    { q: "Lambang kimia air?", a: "h2o" },
    { q: "Presiden pertama Indonesia?", a: "soekarno" },
    { q: "Negara mata uang Yen?", a: "jepang" },
    { q: "Hewan tercepat di darat?", a: "cheetah" }
];

let currentQuestion = null;
let hasKey = false;
let currentLevel = 1;

function showQuiz(callback) {
    const rand = quizList[Math.floor(Math.random() * quizList.length)];
    currentQuestion = rand;

    document.getElementById("quiz-question").innerText = rand.q;
    document.getElementById("quiz-answer").value = "";
    document.getElementById("quiz-box").classList.remove("hidden");

    window.quizCallback = callback;
}

function submitAnswer() {
    const user = document.getElementById("quiz-answer").value.toLowerCase();
    if (user === currentQuestion.a) {
        quizBox.classList.add("hidden");
        quizCallback(true);
    } else {
        alert("Jawaban salah!");
    }
}

// =========================
// START & RESTART
// =========================
function startGame() {
    document.getElementById("start-screen").classList.add("hidden");
    game.scene.start("GameScene");
}

function restart() {
    location.reload();
}

// =========================
// PHASER CONFIG
// =========================
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 500,
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 900 }, debug: false }
    },
    scene: [GameScene]
};

let game = new Phaser.Game(config);

// =========================
// MAIN GAME SCENE
// =========================
function GameScene() {}

GameScene.prototype.preload = function () {
    this.load.image("tiles", "assets/tiles.png");

    this.load.tilemapTiledJSON("level1", "assets/level1.json");
    this.load.tilemapTiledJSON("level2", "assets/level2.json");
    this.load.tilemapTiledJSON("level3", "assets/level3.json");

    this.load.spritesheet("player", "assets/player.png", { frameWidth: 32, frameHeight: 48 });
    this.load.image("enemy", "assets/enemy.png");

    this.load.image("key", "assets/key.png");
    this.load.image("door", "assets/door.png");

    this.load.audio("bgm", "assets/bgm.mp3");
    this.load.audio("keySound", "assets/key.wav");
};

GameScene.prototype.create = function () {
    this.bgm = this.sound.add("bgm", { loop: true, volume: 0.3 });
    this.bgm.play();

    this.loadLevel(currentLevel);

    cursors = this.input.keyboard.createCursorKeys();
};

GameScene.prototype.loadLevel = function (level) {

    // clear world
    this.physics.world.clear();
    this.children.removeAll();

    hasKey = false;

    let map = this.make.tilemap({ key: "level" + level });
    let tileset = map.addTilesetImage("tileset", "tiles");

    let ground = map.createLayer("Ground", tileset, 0, 0);
    ground.setCollisionByProperty({ collides: true });

    // player spawn
    let spawn = map.findObject("Objects", obj => obj.name === "Player");
    player = this.physics.add.sprite(spawn.x, spawn.y, "player");

    this.physics.add.collider(player, ground);

    // Animations
    this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("player", { start: 1, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: "idle",
        frames: [{ key: "player", frame: 0 }],
        frameRate: 10
    });

    // Key
    let keyPos = map.findObject("Objects", o => o.name === "Key");
    keySprite = this.physics.add.sprite(keyPos.x, keyPos.y, "key");

    this.physics.add.overlap(player, keySprite, () => {
        if (!hasKey) {
            this.physics.pause();
            showQuiz((correct) => {
                this.physics.resume();
                if (correct) {
                    hasKey = true;
                    keySprite.destroy();
                    this.sound.play("keySound");
                }
            });
        }
    });

    // Door
    let doorPos = map.findObject("Objects", o => o.name === "Door");
    doorSprite = this.physics.add.staticSprite(doorPos.x, doorPos.y, "door");

    this.physics.add.overlap(player, doorSprite, () => {
        if (hasKey) {

            if (currentLevel === 3) {
                alert("Game Completed!");
            } else {
                currentLevel++;
                this.loadLevel(currentLevel);
            }

        } else {
            alert("Butuh kunci!");
        }
    });

    // Enemy
    enemies = this.physics.add.group();

    map.getObjectLayer("Enemies").objects.forEach(e => {
        let enemy = enemies.create(e.x, e.y, "enemy");
        enemy.setVelocityX(80);
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
    });

    this.physics.add.collider(enemies, ground);

    this.physics.add.overlap(player, enemies, () => {
        document.getElementById("game-over").classList.remove("hidden");
        this.bgm.stop();
        this.scene.pause();
    });
};

GameScene.prototype.update = function () {

    if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.anims.play("run", true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.anims.play("run", true);
    } else {
        player.setVelocityX(0);
        player.anims.play("idle");
    }

    if (cursors.up.isDown && player.body.blocked.down) {
        player.setVelocityY(-500);
    }
};
