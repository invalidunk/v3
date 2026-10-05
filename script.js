document.addEventListener("DOMContentLoaded", function() {
    const textContainer = document.getElementById("text-container");
    const heartTarget   = document.getElementById("heartTapTarget");
    const burstContainer= document.getElementById("heart-burst");
    const heroSection   = document.querySelector(".hero");
    const letterSection = document.querySelector(".letter");
    const letterCard    = document.querySelector(".letter-card");
    const html = document.documentElement;
    const body = document.body;

    var prefersReducedMotionUI = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    html.classList.add('scroll-locked');
    body.classList.add('scroll-locked');

    var hintTimer = setTimeout(function() {
        if (!textContainer) return;
        textContainer.textContent = "Cham vao trai tim nhe";
        textContainer.classList.add("show");
    }, 1500);

    var hasTapped = false;

    function spawnHeartBurst() {
        if (!burstContainer || !heartTarget || !heroSection) return;
        if (prefersReducedMotionUI) return;

        var originRect = heartTarget.getBoundingClientRect();
        var heroRect   = heroSection.getBoundingClientRect();
        var centerX    = originRect.left + originRect.width  / 2 - heroRect.left;
        var centerY    = originRect.top  + originRect.height / 2 - heroRect.top;
        var heartScale = (originRect.width / 2) / 165;

        // Phuong trinh tim giong pinkboard
        function heartPt(t) {
            return {
                x:  160 * Math.pow(Math.sin(t), 3),
                y: -(130 * Math.cos(t) - 50 * Math.cos(2*t) - 20 * Math.cos(3*t) - 10 * Math.cos(4*t) + 25)
            };
        }

        // Buoc 1: Lam mo tim goc ngay lap tuc (CSS transition)
        heartTarget.classList.add('dissolving');

        // Buoc 2: Doi 32ms (2 frame) de browser VE xong frame "tim dang mo"
        // ROI moi tao DOM -> loai bo lag hoan toan, an toan ca tren dien thoai
        setTimeout(function() {
            // So luong tim theo kich thuoc man hinh
            var isMobile = window.innerWidth <= 768;
            var count    = isMobile ? 80 : 140;
            var fallBase = heroRect.height - centerY + 80;
            var vh       = window.innerHeight; // cache 1 lan

            // Pre-compute tat ca gia tri TRUOC khi cham vao DOM
            var data = [];
            for (var i = 0; i < count; i++) {
                var isBorder = Math.random() < 0.35;
                var t = (Math.random() * 2 - 1) * Math.PI;
                var p = heartPt(t);

                if (!isBorder) {
                    var d = Math.sqrt(Math.random());
                    p.x *= d;
                    p.y *= d;
                }

                var size   = isMobile ? (5 + Math.random() * 10) : (7 + Math.random() * 15);
                var spawnX = centerX + p.x * heartScale - size / 2;
                var spawnY = centerY + p.y * heartScale - size / 2;
                var driftX = (Math.random() - 0.5) * originRect.width * 0.9;
                var fallY  = fallBase + Math.random() * vh * 0.6;
                var rot    = (Math.random() - 0.5) * 360;
                var delay  = (isBorder ? 0 : 0.2) + Math.random() * 0.55;
                var dur    = 2.8 + Math.random() * 1.7;

                data.push({ spawnX: spawnX, spawnY: spawnY, size: size,
                            driftX: driftX, fallY: fallY, rot: rot,
                            delay: delay, dur: dur });
            }

            // Tao tat ca element trong DocumentFragment (1 lan ghi DOM duy nhat)
            var frag = document.createDocumentFragment();
            for (var j = 0; j < data.length; j++) {
                var d2  = data[j];
                var el = document.createElement("span");
                el.className = "burst-heart";
                el.textContent = "\u2764\uFE0E"; // \uFE0E ep render chu, khong phai emoji
                // Dung setAttribute style string -> 1 lan style recalc duy nhat moi element
                el.setAttribute("style",
                    "left:" + d2.spawnX + "px;" +
                    "top:"  + d2.spawnY + "px;" +
                    "font-size:" + d2.size + "px;" +
                    "--dx:" + d2.driftX + "px;" +
                    "--dy:" + d2.fallY  + "px;" +
                    "--rot:" + d2.rot   + "deg;" +
                    "animation-duration:" + d2.dur   + "s;" +
                    "animation-delay:"    + d2.delay + "s;"
                );
                frag.appendChild(el);
            }
            burstContainer.appendChild(frag);

        }, 32); // 2 frame @ 60fps

        // Don dep sau 7s
        setTimeout(function() { burstContainer.innerHTML = ""; }, 7000);
    }

    function handleHeartTap() {
        if (hasTapped) return;
        hasTapped = true;
        clearTimeout(hintTimer);

        if (textContainer) {
            textContainer.classList.remove("show");
            textContainer.classList.add("fade-out");
        }

        spawnHeartBurst();

        // Tim roi het sau toi da ~5.25s.
        // Scroll xay ra luc 2000ms -> letter hien ngay khi scroll.
        var burstWaitTime = prefersReducedMotionUI ? 200 : 2000;

        setTimeout(function() {
            html.classList.remove('scroll-locked');
            body.classList.remove('scroll-locked');

            if (letterSection && letterSection.scrollIntoView) {
                letterSection.scrollIntoView({ behavior: "smooth" });
            }

            // Kich hoat ngung tu text ngay khi scroll (khong delay them)
            if (letterCard) letterCard.classList.add("visible");
        }, burstWaitTime);
    }

    if (heartTarget) {
        heartTarget.addEventListener("click", handleHeartTap);
        heartTarget.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleHeartTap();
            }
        });
  
    // === KHI CUON NGUOC LEN TRANG 1: RESET TIM ===
    // Dung IntersectionObserver de phat hien hero section hien tro lai
    if (heroSection && heartTarget) {
        var heroObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && hasTapped) {
                    setTimeout(function() {
                        // Tim fade-in tro lai (CSS transition tren .box)
                        heartTarget.classList.remove('dissolving');
                        // Xoa goi cu
                        if (textContainer) {
                            textContainer.classList.remove('show');
                            textContainer.classList.remove('fade-out');
                            textContainer.textContent = '';
                        }
                        // Reset letter de co the xem lai
                        if (letterCard) letterCard.classList.remove('visible');
                        // Sau khi tim hien xong (1.5s) moi cho bam lai
                        setTimeout(function() {
                            hasTapped = false;
                            if (textContainer) {
                                textContainer.textContent = 'B\u1ea5m l\u1ea1i nh\u00e9 \u2764\uFE0E';
                                textContainer.classList.add('show');
                            }
                        }, 1500);
                    }, 400);
                }
            });
        }, { threshold: 0.6 });
        heroObserver.observe(heroSection);
    }
  }

    /* ==========================================
       2. HIỆU ỨNG TRÁI TIM HẠT
    ========================================== */
    var prefersReducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Giảm số lượng hạt theo thiết bị để đỡ giật lag, và giảm mạnh hơn
    // nếu người dùng bật chế độ hạn chế chuyển động
    var deviceParticleScale = 1;
    if (window.innerWidth <= 400) deviceParticleScale = 0.4;
    else if (window.innerWidth <= 768) deviceParticleScale = 0.55;
    if (prefersReducedMotion) deviceParticleScale *= 0.25;

    var settings = {
        particles: {
            length:   Math.round(8000 * deviceParticleScale), 
            duration:   2.5, 
            velocity: 100, 
            effect: -1.2, 
            size:      25, 
        },
    };

    (function(){var b=0;var c=["ms","moz","webkit","o"];for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f)},f);b=d+f;return g}}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d)}}}());

    var Point = (function() {
        function Point(x, y) { this.x = x || 0; this.y = y || 0; }
        Point.prototype.clone = function() { return new Point(this.x, this.y); };
        Point.prototype.length = function(length) {
            if (typeof length == 'undefined') return Math.sqrt(this.x * this.x + this.y * this.y);
            this.normalize(); this.x *= length; this.y *= length; return this;
        };
        Point.prototype.normalize = function() {
            var length = this.length(); this.x /= length; this.y /= length; return this;
        };
        return Point;
    })();

    var Particle = (function() {
        function Particle() {
            this.position = new Point();
            this.velocity = new Point();
            this.acceleration = new Point();
            this.age = 0;
        }
        Particle.prototype.initialize = function(x, y, dx, dy) {
            this.position.x = x; this.position.y = y;
            this.velocity.x = dx; this.velocity.y = dy;
            this.acceleration.x = dx * settings.particles.effect;
            this.acceleration.y = dy * settings.particles.effect;
            this.age = 0;
        };
        Particle.prototype.update = function(deltaTime) {
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            this.velocity.x += this.acceleration.x * deltaTime;
            this.velocity.y += this.acceleration.y * deltaTime;
            this.age += deltaTime;
        };
        Particle.prototype.draw = function(context, image) {
            function ease(t) { return (--t) * t * t + 1; }
            var size = image.width * ease(this.age / settings.particles.duration);
            context.globalAlpha = 1 - this.age / settings.particles.duration;
            context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
        };
        return Particle;
    })();

    var ParticlePool = (function() {
        var particles, firstActive = 0, firstFree = 0, duration = settings.particles.duration;
        function ParticlePool(length) {
            particles = new Array(length);
            for (var i = 0; i < particles.length; i++) particles[i] = new Particle();
        }
        ParticlePool.prototype.add = function(x, y, dx, dy) {
            particles[firstFree].initialize(x, y, dx, dy);
            firstFree++;
            if (firstFree == particles.length) firstFree = 0;
            if (firstActive == firstFree) firstActive++;
            if (firstActive == particles.length) firstActive = 0;
        };
        ParticlePool.prototype.update = function(deltaTime) {
            var i;
            if (firstActive < firstFree) { 
                for (i = firstActive; i < firstFree; i++) particles[i].update(deltaTime); 
            } else if (firstFree < firstActive) {
                for (i = firstActive; i < particles.length; i++) particles[i].update(deltaTime);
                for (i = 0; i < firstFree; i++) particles[i].update(deltaTime);
            }
            while (particles[firstActive].age >= duration && firstActive != firstFree) {
                firstActive++;
                if (firstActive == particles.length) firstActive = 0;
            }
        };
        ParticlePool.prototype.draw = function(context, image) {
            if (firstActive < firstFree) { 
                for (let i = firstActive; i < firstFree; i++) particles[i].draw(context, image); 
            } else if (firstFree < firstActive) {
                for (let i = firstActive; i < particles.length; i++) particles[i].draw(context, image);
                for (let i = 0; i < firstFree; i++) particles[i].draw(context, image);
            }
        };
        return ParticlePool;
    })();

    var pinkboardCanvas = document.getElementById('pinkboard');
    if (pinkboardCanvas) {
        (function(canvas) {
            var context = canvas.getContext('2d'),
                particles = new ParticlePool(settings.particles.length),
                particleRate = settings.particles.length / settings.particles.duration, 
                cssWidth = canvas.clientWidth,
                cssHeight = canvas.clientHeight,
                visualScale = 1,
                heartPath = null,
                heartGradient = null,
                time;

            function computeVisualScale() {
                if (window.innerWidth <= 400) return 0.5;
                if (window.innerWidth <= 768) return 0.6;
                return 1;
            }

            // Tách riêng logic lấy tọa độ gốc của toán học để xử lý scale
            function basePointOnHeart(t) {
                return new Point(
                    160 * Math.pow(Math.sin(t), 3),
                    130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
                );
            }

            // Bảng độ dài cung: giúp lấy mẫu t sao cho hạt trải ĐỀU theo
            // chiều dài đường viền tim, thay vì tụ dày ở những đoạn
            // đường cong "chạy chậm" (ví dụ khe giữa 2 múi tim).
            function buildArcLengthTable(steps) {
                var table = [{ t: -Math.PI, len: 0 }];
                var prev = basePointOnHeart(-Math.PI);
                var total = 0;
                for (var i = 1; i <= steps; i++) {
                    var t = -Math.PI + (2 * Math.PI * i) / steps;
                    var p = basePointOnHeart(t);
                    var dx = p.x - prev.x, dy = p.y - prev.y;
                    total += Math.sqrt(dx * dx + dy * dy);
                    table.push({ t: t, len: total });
                    prev = p;
                }
                return { table: table, total: total };
            }

            function sampleTByArcLength(arc) {
                var target = Math.random() * arc.total;
                var table = arc.table;
                var lo = 0, hi = table.length - 1;
                while (lo < hi) {
                    var mid = (lo + hi) >> 1;
                    if (table[mid].len < target) lo = mid + 1; else hi = mid;
                }
                if (lo === 0) return table[0].t;
                var a = table[lo - 1], b = table[lo];
                var ratio = (target - a.len) / (b.len - a.len || 1);
                return a.t + (b.t - a.t) * ratio;
            }

            var arcTable = buildArcLengthTable(400);

            // Vẽ 1 khối tim ĐẶC (fill vector) làm lớp nền, đảm bảo
            // không bao giờ bị lủng/hở dù hạt lấp lánh có thưa đến đâu.
            // Path đóng kín từ đường cong tim nên fill luôn kín tuyệt đối.
            function buildHeartVisuals() {
                var path = new Path2D();
                var first = basePointOnHeart(-Math.PI);
                path.moveTo(
                    cssWidth / 2 + first.x * visualScale,
                    cssHeight / 2 - first.y * visualScale
                );
                for (var t = -Math.PI; t <= Math.PI; t += 0.015) {
                    var p = basePointOnHeart(t);
                    path.lineTo(
                        cssWidth / 2 + p.x * visualScale,
                        cssHeight / 2 - p.y * visualScale
                    );
                }
                path.closePath();
                heartPath = path;

                var g = context.createRadialGradient(
                    cssWidth / 2, cssHeight / 2 - 40 * visualScale, 10,
                    cssWidth / 2, cssHeight / 2, 170 * visualScale
                );
                g.addColorStop(0, 'rgba(255, 154, 179, 0.95)');
                g.addColorStop(0.6, 'rgba(255, 0, 85, 0.75)');
                g.addColorStop(1, 'rgba(200, 0, 70, 0.55)');
                heartGradient = g;
            }

            var image = (function() {
                var tempCanvas = document.createElement('canvas'),
                    tempContext = tempCanvas.getContext('2d');
                tempCanvas.width = settings.particles.size;
                tempCanvas.height = settings.particles.size;
                
                function to(t) {
                    var point = basePointOnHeart(t);
                    point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
                    point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
                    return point;
                }

                tempContext.beginPath();
                var t = -Math.PI;
                var point = to(t);
                tempContext.moveTo(point.x, point.y);
                while (t < Math.PI) {
                    t += 0.01; 
                    point = to(t);
                    tempContext.lineTo(point.x, point.y);
                }
                tempContext.closePath();
                
                var gradient = tempContext.createLinearGradient(0, 0, settings.particles.size, settings.particles.size);
                gradient.addColorStop(0, '#ff0055'); 
                gradient.addColorStop(1, '#ff758c'); 
                tempContext.fillStyle = gradient;
                
                tempContext.fill();
                var img = new Image();
                img.src = tempCanvas.toDataURL();
                return img;
            })();

            function render() {
                requestAnimationFrame(render);
                var newTime = new Date().getTime() / 1000,
                    deltaTime = newTime - (time || newTime);
                time = newTime;
                
                var amount = particleRate * deltaTime;

                context.clearRect(0, 0, cssWidth, cssHeight);

                // Vẽ lớp tim đặc làm nền trước — đảm bảo tim luôn kín,
                // không phụ thuộc vào việc hạt có rải đủ dày hay không.
                if (heartPath) {
                    context.save();
                    context.fillStyle = heartGradient;
                    context.fill(heartPath);
                    context.restore();
                }
                
                for (var i = 0; i < amount; i++) {
    var t = sampleTByArcLength(arcTable);
    var pos = basePointOnHeart(t);
    
    // 1. Phân chia 20% làm vỏ sắc nét, 80% lấp đầy lõi
    var isBorder = Math.random() < 0.2; 
    if (!isBorder) {
        // Rải đều 80% hạt từ tâm ra đến viền
        var distance = Math.sqrt(Math.random()); 
        pos.x *= distance;
        pos.y *= distance;
    }

    // Áp dụng scale thiết bị
    pos.x *= visualScale;
    pos.y *= visualScale;

    // 2. MẤU CHỐT SỬA LỖI: Nhịp đập đồng bộ
    // Vận tốc bay (dx, dy) được nhân trực tiếp với tọa độ (pos.x, pos.y).
    // Giúp cả khối lõi và vỏ cùng nở ra và co lại đồng đều, không bị rỗng hay tách rời.
    var beatStrength = 0.5; 
    var dx = pos.x * beatStrength; 
    var dy = pos.y * beatStrength;

    // 3. Thêm nhiễu: Vỏ ít nhiễu để giữ nét, lõi nhiều nhiễu để tơi xốp lấp đầy khoảng trống
    var noise = isBorder ? 2 : 10; 
    dx += (Math.random() - 0.5) * noise * visualScale;
    dy += (Math.random() - 0.5) * noise * visualScale;

    // 4. Đưa hạt vào màn hình
    particles.add(
        cssWidth / 2 + pos.x, 
        cssHeight / 2 - pos.y, 
        dx, 
        -dy
    );
}
                particles.update(deltaTime);
                particles.draw(context, image);
            }

            function onResize() {
                var dpr = window.devicePixelRatio || 1;
                cssWidth = canvas.clientWidth;
                cssHeight = canvas.clientHeight;
                visualScale = computeVisualScale();
                canvas.width = cssWidth * dpr;
                canvas.height = cssHeight * dpr;
                context.setTransform(dpr, 0, 0, dpr, 0, 0);
                buildHeartVisuals();
            }
            window.addEventListener('resize', onResize);

            setTimeout(function() {
                onResize();
                render();
            }, 10);
        })(pinkboardCanvas);
    }

    /* ==========================================
       3. HIỆU ỨNG SAO RƠI PHÔNG NỀN
    ========================================== */
    const starCanvas = document.getElementById("stars");
    if (starCanvas) {
        const ctxStar = starCanvas.getContext("2d");
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;

        const stars = [];
        for(let i = 0; i < 150; i++) {
            stars.push({
                x: Math.random() * starCanvas.width,
                y: Math.random() * starCanvas.height,
                radius: Math.random() * 1.8 + 0.3,
                speed: Math.random() * 0.5 + 0.1,
                color: Math.random() > 0.8 ? "#ffc9ce" : "#fff" 
            });
        }

        function drawStars() {
            ctxStar.clearRect(0, 0, starCanvas.width, starCanvas.height);
            for(let star of stars) {
                ctxStar.fillStyle = star.color;
                ctxStar.beginPath();
                ctxStar.moveTo(star.x, star.y);
                ctxStar.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctxStar.fill();
                star.y += star.speed;
                if(star.y > starCanvas.height) {
                    star.y = 0;
                    star.x = Math.random() * starCanvas.width;
                }
            }
            requestAnimationFrame(drawStars);
        }
        drawStars();

        window.addEventListener('resize', () => {
            starCanvas.width = window.innerWidth;
            starCanvas.height = window.innerHeight;
        });
    }
});
