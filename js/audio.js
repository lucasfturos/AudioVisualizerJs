import { Spectrum } from "./spectrum.js";

export class AudioVisualizer {
    constructor(fileInputId, audioOutputId) {
        this.fileInput = document.getElementById(fileInputId);
        this.audioOutput = document.getElementById(audioOutputId);
        this.setup();
    }

    init() {
        this.ctx = this.ctx || new AudioContext();
        this.analyzer = this.ctx.createAnalyser();
    }

    setup() {
        this.fileInput.addEventListener("change", () => {
            const file = this.fileInput.files[0];
            if (file) {
                this.init();
                this.setupAudio(file);
                this.setupBuffer();
                this.spectrum = new Spectrum(
                    this.sampleBuffer,
                    this.bufferSize,
                    this.analyzer
                );
            }
        });
        this.audioOutput.addEventListener("play", () => {
            this.spectrum.clearCanvas();
            if (document.getElementById("oscillation").checked) {
                this.spectrum.renderOscillation();
            } else if (document.getElementById("spectrum").checked) {
                this.spectrum.renderSpectrum();
            }
        });
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach((radio) => {
            radio.addEventListener("change", () => {
                this.spectrum.clearCanvas();
                if (radio.id === "oscillation") {
                    this.spectrum.renderOscillation();
                } else if (radio.id === "spectrum") {
                    this.spectrum.renderSpectrum();
                }
            });
        });

        this.spectrum = new Spectrum(null, null, null);
        this.spectrum.clearCanvas();
    }

    setupAudio(file) {
        const url = URL.createObjectURL(file);
        this.audioOutput.src = url;
        this.audioSrc =
            this.audioSrc ||
            this.ctx.createMediaElementSource(this.audioOutput);
        this.audioSrc.connect(this.analyzer);
        this.analyzer.connect(this.ctx.destination);
    }

    setupBuffer() {
        this.analyzer.fftSize = 256;
        this.bufferSize = this.analyzer.frequencyBinCount;
        this.sampleBuffer = new Uint8Array(this.bufferSize);
    }
}
