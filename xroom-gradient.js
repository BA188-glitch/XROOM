javascript
(() => {
    const canvas = document.getElementById("xroom-gradient");

    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: true
    });

    if (!gl) {
        console.warn("WebGL não está disponível.");
        return;
    }

    const vertexSource = `
        attribute vec2 position;

        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentSource = `
        precision mediump float;

        uniform vec2 resolution;
        uniform float time;

        void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            uv.x *= resolution.x / resolution.y;

            vec3 color = vec3(0.025, 0.02, 0.055);

            vec3 purple = vec3(0.38, 0.08, 0.95);
            vec3 blue = vec3(0.0, 0.38, 1.0);
            vec3 cyan = vec3(0.0, 0.9, 1.0);
            vec3 pink = vec3(0.95, 0.08, 0.5);

            float glow1 = exp(
                -length(uv - vec2(0.35, 0.65)) * 2.5
            );

            float glow2 = exp(
                -length(uv - vec2(1.15, 0.3)) * 2.0
            );

            float glow3 = exp(
                -length(uv - vec2(0.8, 0.9)) * 3.0
            );

            color += purple * glow1 * 0.48;
            color += blue * glow2 * 0.35;
            color += pink * glow3 * 0.22;

            for (int i = 0; i < 7; i++) {
                float n = float(i);

                float wave = uv.y
                    - 0.48
                    - sin(uv.x * 3.0 + time * 0.35 + n * 0.45) * 0.10
                    - sin(uv.x * 6.0 - time * 0.22) * 0.035
                    - n * 0.055;

                float line = exp(-abs(wave) * 65.0);
                float halo = exp(-abs(wave) * 12.0);

                vec3 lineColor = mix(
                    purple,
                    cyan,
                    n / 6.0
                );

                color += lineColor * line * 0.22;
                color += lineColor * halo * 0.045;
            }

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function compileShader(type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    const vertexShader = compileShader(
        gl.VERTEX_SHADER,
        vertexSource
    );

    const fragmentShader = compileShader(
        gl.FRAGMENT_SHADER,
        fragmentSource
    );

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
        ]),
        gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "position");

    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "resolution");
    const time = gl.getUniformLocation(program, "time");

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

        const width = Math.floor(canvas.clientWidth * ratio);
        const height = Math.floor(canvas.clientHeight * ratio);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const start = performance.now();

    function draw(now) {
        resize();

        gl.uniform2f(resolution, canvas.width, canvas.height);
        gl.uniform1f(time, (now - start) / 1000);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
})();

