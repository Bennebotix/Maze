class Maze {
    constructor(w, h, pw, ww, ow, pc, wc, s, et, rt) {
        this.width = Math.max(w, 10);
        this.height = Math.max(h, 10);
        this.pathWidth = pw;
        this.wallWidth = ww;
        this.outerWidth = ow * (((this.width + this.height / 2)) / 100);
        this.pathColor = pc;
        this.wallColor = wc;
        this.seed = s;
        this.offset = this.pathWidth / 2 + this.outerWidth;
        this.elitisticTendency = et;
        this.rectilinearTendency = rt;

        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d', {
            alpha: false
        });

        this.canvas.width = this.outerWidth * 2 + this.width * (this.pathWidth + this.wallWidth) - this.wallWidth;
        this.canvas.height = this.outerWidth * 2 + this.height * (this.pathWidth + this.wallWidth) - this.wallWidth;

        this.dpr = window.devicePixelRatio;

        this.map = [];

        this.delay = -Infinity;
    }

    init() {

        this.canvas.width *= this.dpr;
        this.canvas.height *= this.dpr;

        this.ctx.scale(this.dpr, this.dpr);


        this.ctx.fillStyle = this.wallColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = this.pathColor;
        this.ctx.lineCap = 'square';
        this.ctx.lineWidth = this.pathWidth;
        this.ctx.beginPath();

        for (var i = 0; i < this.height * 2; i++) {
            this.map[i] = [];
            for (var j = 0; j < this.width * 2; j++) {
                this.map[i][j] = false;
            }
        }

        this.map[0][0] = true;
        this.route = [
            [0, 0]
        ];
        this.ctx.moveTo(this.offset, this.offset);
    }

    random() {
        this.seed = ((this.seed * 9301 + 49297) % 233280);
        return this.seed / 233280;
    }

    drawRoute(s = false, c = '#82a') {
        this.ctx.fillStyle = '#2a3';
        this.ctx.fillRect(this.outerWidth, this.outerWidth, this.pathWidth, this.pathWidth);

        // Calculate endX and endY based on the maze dimensions
        let endX = this.width * (this.pathWidth + this.wallWidth) - this.wallWidth;
        let endY = this.height * (this.pathWidth + this.wallWidth) - this.wallWidth;

        this.ctx.fillStyle = '#a32';
        this.ctx.fillRect(endX, endY, this.pathWidth, this.pathWidth);

        this.ctx.lineWidth = this.pathWidth / 5;

        if (this.solution && s) {
            this.ctx.strokeStyle = '#4169c1';
            this.ctx.moveTo(this.offset, this.offset);
            this.ctx.beginPath();

            var i = 0;
            var solutionInterval = setInterval(() => {
                if (i < this.solution.length) {
                    this.ctx.lineTo(this.solution[i][0] * (this.pathWidth + this.wallWidth) + this.offset, this.solution[i][1] * (this.pathWidth + this.wallWidth) + this.offset);
                    this.ctx.stroke();
                    i++;
                } else {
                    clearInterval(solutionInterval);
                }
            }, 20000 / (this.width * this.height));
        } else {
            this.ctx.strokeStyle = c;
            this.ctx.moveTo(this.offset, this.offset);
            this.ctx.beginPath();

            for (var i = 0; i < this.route.length; i++) {
                this.ctx.lineTo(this.route[i][0] * (this.pathWidth + this.wallWidth) + this.offset, this.route[i][1] * (this.pathWidth + this.wallWidth) + this.offset);
            }

            this.ctx.stroke();
        }
    }

    loop() {

        this.x = this.route[this.route.length - 1][0] | 0;
        this.y = this.route[this.route.length - 1][1] | 0;

        this.drawRoute(false, this.pathColor);

        var directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];
        var alternatives = [];

        for (var i = 0; i < directions.length; i++) {
            var nx = directions[i][0] + this.x;
            var ny = directions[i][1] + this.y;
            if (ny * 2 >= 0 && ny * 2 < this.height * 2 && nx * 2 >= 0 && nx * 2 < this.width * 2 && !this.map[ny * 2][nx * 2]) {
                alternatives.push(directions[i]);
            }
        }

        if (this.x == (this.map[this.map.length - 1].length - 2) / 2 && this.y == (this.map.length - 2) / 2) {
            this.solution = [...this.route];
            alternatives = [];
        }

        if (alternatives.length === 0) {
            this.route.pop();
            if (this.route.length > 0) {
                this.ctx.moveTo(this.route[this.route.length - 1][0] * (this.pathWidth + this.wallWidth) + this.offset, this.route[this.route.length - 1][1] * (this.pathWidth + this.wallWidth) + this.offset);
                this.drawRoute();
                window.requestAnimationFrame(() => this.loop(this));
            } else {
                this.drawRoute(true);
            }
            return;
        }

        if (!(this.random() * 100 >= Math.abs(this.elitisticTendency)) && !this.solution) {
            if (this.random() * 10 >= 5) {
                var direction = JSON.stringify(alternatives).includes(JSON.stringify([Math.sign(this.elitisticTendency), 0])) ? [Math.sign(this.elitisticTendency), 0] : JSON.stringify(alternatives).includes(JSON.stringify([0, Math.sign(this.elitisticTendency)])) ? [0, Math.sign(this.elitisticTendency)] : alternatives[this.random() * alternatives.length | 0];
            } else {
                var direction = JSON.stringify(alternatives).includes(JSON.stringify([0, Math.sign(this.elitisticTendency)])) ? [0, Math.sign(this.elitisticTendency)] : JSON.stringify(alternatives).includes(JSON.stringify([Math.sign(this.elitisticTendency), 0])) ? [Math.sign(this.elitisticTendency), 0] : alternatives[this.random() * alternatives.length | 0];
            }
        } else if (!(this.random() * 100 >= this.rectilinearTendency)) {
            var direction = JSON.stringify(alternatives).includes(JSON.stringify(this.oldDirection)) ? this.oldDirection : alternatives[this.random() * alternatives.that | 0];
        } else {
            var direction = alternatives[this.random() * alternatives.length | 0];
        }

        this.oldDirection = direction;

        this.route.push([direction[0] + this.x, direction[1] + this.y]);
        this.ctx.strokeStyle = this.pathColor;
        this.ctx.lineWidth = this.pathWidth;
        this.ctx.moveTo(this.x * (this.pathWidth + this.wallWidth) + this.offset, this.y * (this.pathWidth + this.wallWidth) + this.offset);
        this.ctx.lineTo((direction[0] + this.x) * (this.pathWidth + this.wallWidth) + this.offset, (direction[1] + this.y) * (this.pathWidth + this.wallWidth) + this.offset);
        this.map[direction[1] + this.y * 2][direction[0] + this.x * 2] = true;
        this.map[(direction[1] + this.y) * 2][(direction[0] + this.x) * 2] = true;
        this.ctx.stroke();
        this.drawRoute();

        window.requestAnimationFrame(() => this.loop(this));
    }
}

var maze = new Maze(100, 100, 10, 4, 20, '#ddd', '#222', Math.floor(Math.random() * 100000), 0, 0);

maze.init();

maze.loop();

var video = document.querySelector('video');
video.srcObject = document.querySelector('canvas').captureStream();
document.querySelector('button').onclick = () => {
    video.play();
    video.requestPictureInPicture();
}
