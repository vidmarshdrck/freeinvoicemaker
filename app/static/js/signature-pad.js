/**
 * Free Invoice Maker - HTML5 Canvas Signature Pad
 */
class SmoothSignaturePad {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.points = [];
    this.isEmpty = true;

    this.resizeCanvas();
    this.initEvents();

    window.addEventListener('resize', () => {
      // Preserve drawing on resize if needed
      const data = this.toDataURL();
      this.resizeCanvas();
      if (!this.isEmpty) {
        this.fromDataURL(data);
      }
    });
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.ctx.scale(ratio, ratio);
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#0f172a';
  }

  initEvents() {
    // Mouse Events
    this.canvas.addEventListener('mousedown', (e) => this.startStroke(e));
    this.canvas.addEventListener('mousemove', (e) => this.drawStroke(e));
    window.addEventListener('mouseup', () => this.endStroke());

    // Touch Events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startStroke(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.drawStroke(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.endStroke();
    }, { passive: false });
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  startStroke(e) {
    this.isDrawing = true;
    this.isEmpty = false;
    const pos = this.getCanvasPos(e);
    this.points = [pos];
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  drawStroke(e) {
    if (!this.isDrawing) return;
    const pos = this.getCanvasPos(e);
    this.points.push(pos);

    if (this.points.length >= 3) {
      const len = this.points.length;
      const p1 = this.points[len - 2];
      const p2 = this.points[len - 1];
      const midPoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      this.ctx.stroke();
    }
  }

  endStroke() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.points = [];
  }

  clear() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.ctx.clearRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
    this.isEmpty = true;
  }

  toDataURL(type = 'image/png') {
    return this.canvas.toDataURL(type);
  }

  fromDataURL(dataUrl) {
    const img = new Image();
    img.onload = () => {
      this.clear();
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      this.isEmpty = false;
    };
    img.src = dataUrl;
  }
}
