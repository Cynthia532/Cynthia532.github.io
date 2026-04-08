/**
 * Module: Particle Background — "Cynthia" 文字粒子效果
 * 粒子组成文字形状，鼠标靠近时粒子放大并散开
 */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  const MOUSE_RADIUS = 45;       // 鼠标影响半径（放大镜大小）
  const RETURN_SPEED = 0.06;      // 粒子回归速度
  const TEXT = 'Cynthia';
  const GAP = 12;                 // 采样间距（越小粒子越密）
  const BASE_RADIUS = 1.2;        // 粒子基础半径
  const MAX_RADIUS = 4.5;         // 放大镜中心最大半径
  const LENS_RING_INNER = 0.3;    // 放大镜内环比例（0~1，粒子开始向外推的位置）
  const LENS_RING_OUTER = 0.8;    // 放大镜外环比例
  const LENS_PUSH = 18;           // 环上粒子向外推的距离
  const LENS_MAGNIFY = 1.6;       // 放大镜中心区域的位移放大倍率
  let ambientParticles = [];      // 环境装饰粒子
  const AMBIENT_COUNT_DESKTOP = 45;
  const AMBIENT_COUNT_MOBILE = 18;

  // 获取主题色
  function getAccentColor(alpha) {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
      return 'rgba(60, 232, 178, ' + alpha + ')';
    } else {
      return 'rgba(46, 196, 160, ' + alpha + ')';
    }
  }

  // 从 canvas 文字中采样粒子坐标
  function sampleTextParticles() {
    const isMobile = width < 768;
    const fontSize = isMobile ? Math.floor(width / 5) : Math.floor(Math.min(width / 7, 180));
    const gap = isMobile ? 24 : GAP;

    // 用离屏 canvas 渲染文字
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');

    offCtx.fillStyle = '#000';
    offCtx.font = 'bold ' + fontSize + 'px "Orbitron", monospace';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(TEXT, width / 2, height * 0.78);

    // 采样像素
    const imageData = offCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newParticles = [];

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 128) {
          newParticles.push({
            // 目标位置（文字形状）
            tx: x,
            ty: y,
            // 当前位置（初始随机散布）
            x: x + (Math.random() - 0.5) * 200,
            y: y + (Math.random() - 0.5) * 200,
            // 半径
            r: BASE_RADIUS,
            baseR: BASE_RADIUS + Math.random() * 0.5,
            // 透明度
            opacity: 0.5 + Math.random() * 0.5,
            // 微小浮动
            floatPhase: Math.random() * Math.PI * 2,
            floatSpeed: 0.005 + Math.random() * 0.01,
            floatAmp: 0.5 + Math.random() * 1.0
          });
        }
      }
    }

    return newParticles;
  }

  // 创建环境装饰粒子
  function createAmbientParticles() {
    const count = width < 768 ? AMBIENT_COUNT_MOBILE : AMBIENT_COUNT_DESKTOP;
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1
      });
    }
    return arr;
  }

  function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = sampleTextParticles();
    ambientParticles = createAmbientParticles();
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // 重新采样文字粒子
      const newParticles = sampleTextParticles();
      // 尽量复用旧粒子的当前位置，实现平滑过渡
      for (let i = 0; i < newParticles.length; i++) {
        if (i < particles.length) {
          newParticles[i].x = particles[i].x;
          newParticles[i].y = particles[i].y;
        }
      }
      particles = newParticles;
      ambientParticles = createAmbientParticles();
    }, 200);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const time = Date.now() * 0.001;

    // ===== 绘制文字粒子 =====
    particles.forEach(p => {
      // 浮动效果
      const floatX = Math.sin(time * p.floatSpeed * 60 + p.floatPhase) * p.floatAmp;
      const floatY = Math.cos(time * p.floatSpeed * 60 + p.floatPhase * 1.3) * p.floatAmp * 0.6;

      const targetX = p.tx + floatX;
      const targetY = p.ty + floatY;

      // 放大镜效果
      const dx = p.tx - mouse.x;
      const dy = p.ty - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_RADIUS && dist > 0) {
        const ratio = dist / MOUSE_RADIUS; // 0（中心）~ 1（边缘）
        const angle = Math.atan2(dy, dx);

        if (ratio < LENS_RING_INNER) {
          // === 放大镜中心区域：粒子从中心向外放大位移 ===
          const magnifyFactor = LENS_MAGNIFY * (1 - ratio / LENS_RING_INNER);
          const offsetX = dx * magnifyFactor * 0.3;
          const offsetY = dy * magnifyFactor * 0.3;
          // 目标位置加上放大偏移
          const lensTargetX = targetX + offsetX;
          const lensTargetY = targetY + offsetY;
          p.x += (lensTargetX - p.x) * 0.15;
          p.y += (lensTargetY - p.y) * 0.15;
          // 中心粒子放大
          const sizeBoost = MAX_RADIUS * (1 - ratio / LENS_RING_INNER);
          p.r += (p.baseR + sizeBoost - p.r) * 0.15;
        } else {
          // === 放大镜环区域：粒子向外推开形成圆环边框 ===
          const ringRatio = (ratio - LENS_RING_INNER) / (LENS_RING_OUTER - LENS_RING_INNER);
          // 推力在环中间最强，两端衰减
          const pushStrength = Math.sin(ringRatio * Math.PI) * LENS_PUSH;
          const pushX = Math.cos(angle) * pushStrength;
          const pushY = Math.sin(angle) * pushStrength;
          const lensTargetX = targetX + pushX;
          const lensTargetY = targetY + pushY;
          p.x += (lensTargetX - p.x) * 0.12;
          p.y += (lensTargetY - p.y) * 0.12;
          // 环上粒子略微放大
          const ringSize = p.baseR + (MAX_RADIUS * 0.4) * Math.sin(ringRatio * Math.PI);
          p.r += (ringSize - p.r) * 0.12;
        }
      } else {
        // 半径恢复
        p.r += (p.baseR - p.r) * 0.1;
        // 缓动回归目标位置
        p.x += (targetX - p.x) * RETURN_SPEED;
        p.y += (targetY - p.y) * RETURN_SPEED;
      }

      // 绘制粒子
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = getAccentColor(p.opacity * (0.6 + p.r / MAX_RADIUS * 0.4));
      ctx.fill();
    });

    // ===== 绘制放大镜边框光圈 =====
    if (mouse.x > -9000 && mouse.y > -9000) {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = getAccentColor(0.12);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 内圈
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS * LENS_RING_INNER, 0, Math.PI * 2);
      ctx.strokeStyle = getAccentColor(0.06);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ===== 绘制环境装饰粒子 =====
    ambientParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = getAccentColor(p.opacity);
      ctx.fill();
    });

    // ===== 环境粒子之间的连线 =====
    const MAX_LINE_DIST = 150;
    for (let i = 0; i < ambientParticles.length; i++) {
      for (let j = i + 1; j < ambientParticles.length; j++) {
        const dx = ambientParticles[i].x - ambientParticles[j].x;
        const dy = ambientParticles[i].y - ambientParticles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_LINE_DIST) {
          const alpha = (1 - dist / MAX_LINE_DIST) * 0.1;
          ctx.beginPath();
          ctx.moveTo(ambientParticles[i].x, ambientParticles[i].y);
          ctx.lineTo(ambientParticles[j].x, ambientParticles[j].y);
          ctx.strokeStyle = getAccentColor(alpha);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  // 鼠标/触摸事件 — 监听 document 以免 canvas 阻挡页面交互
  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function onMouseLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }

  function onTouchEnd() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onTouchEnd);
  window.addEventListener('resize', onResize);

  // 等待字体加载完成后再初始化粒子
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      init();
      draw();
    });
  } else {
    // 降级：延迟 500ms 等待字体
    setTimeout(() => {
      init();
      draw();
    }, 500);
  }
}
