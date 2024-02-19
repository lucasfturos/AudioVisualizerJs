export class Spectrum {
    constructor(sampleBuffer, bufferSize, analyzer) {
        this.sampleBuffer = sampleBuffer;
        this.bufferSize = bufferSize;
        this.analyzer = analyzer;
        this.bitReversedBuffer = new Float32Array(bufferSize);

        this.canvas = document.querySelector("canvas");
        this.canvas.width = 800;
        this.canvas.height = 400;
        this.ctx = this.canvas.getContext("2d");

        this.setup();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setup() {
        this.bottomY = this.canvas.height;
        this.sliceWidth = (this.canvas.width - 10) / this.bufferSize;
        this.rectWidth = this.sliceWidth * 0.9;
        this.rectGap = this.sliceWidth * 0.2;
        this.hammingWindow = this.createHammingWindow(this.bufferSize);
        this.clock = 0;
        this.interval = 80;
    }

    bitReverse(k, n) {
        let reversed = 0;
        for (let i = 0; i < n; i++) {
            reversed = (reversed << 1) | (k & 1);
            k >>= 1;
        }
        return reversed;
    }

    createHammingWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            const t = i / (size - 1);
            window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * t);
        }
        return window;
    }

    applyHammingWindow(buffer) {
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] *= this.hammingWindow[i];
        }
    }

    renderOscillation() {
        requestAnimationFrame(() => {
            this.renderOscillation();
        });

        this.analyzer.getByteFrequencyData(this.sampleBuffer);
        for (let i = 0; i < this.bufferSize; i++) {
            const reversedIndex = this.bitReverse(
                i,
                Math.log2(this.bufferSize)
            );
            this.bitReversedBuffer[reversedIndex] = this.sampleBuffer[i];
        }

        this.clearCanvas();
        const { ctx, sliceWidth, bottomY, rectGap } = this;
        ctx.beginPath();

        const frequency = 0.1;
        this.bitReversedBuffer.forEach((sample, i) => {
            const amplitude = ((sample / 255) * bottomY) / 2;
            const x = i * (sliceWidth + rectGap) - 10;
            const y = bottomY / 2 + amplitude * Math.sin(frequency * i);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.shadowBlur = 7;
        ctx.shadowColor = "#000";
        ctx.strokeStyle = "#fff";

        ctx.stroke();
        ctx.closePath();
    }

    renderSpectrum() {
        requestAnimationFrame(() => {
            this.renderSpectrum();
        });

        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = "transparent";

        this.analyzer.getByteFrequencyData(this.sampleBuffer);
        for (let i = 0; i < this.bufferSize; i++) {
            const reversedIndex = this.bitReverse(
                i,
                Math.log2(this.bufferSize)
            );
            this.bitReversedBuffer[reversedIndex] = this.sampleBuffer[i];
        }
        this.applyHammingWindow(this.bitReversedBuffer);

        const { ctx, sliceWidth, rectGap, rectWidth, bottomY } = this;
        this.clearCanvas();

        this.bitReversedBuffer.forEach((sample, i) => {
            const x = i * (sliceWidth + rectGap) + 10;
            const amplitude = (sample / 255) * bottomY;
            const hue = (sample / 255) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(x, bottomY - amplitude, rectWidth, amplitude);
        });

        this.clock++;
    }
}
