function getPointCloudShaderMaterial()
{
    const vertShaderSrc = `
        attribute float vertexIdx;
        
        varying float vVertexIdx;
        varying vec2 vPtPos;
        
        uniform ivec2 texSize;
        uniform sampler2D texImg;
        uniform vec4 iK;
        uniform float scale;
        uniform float ptSize;
        
        // Filtering constants
        const int filterSize = 1;
        const float depthThresholdFilter = 0.05; // In meters. Smaller values = more aggressive filtering
        const vec2 absoluteDepthRangeFilter = vec2(0.1, 2.8);
        
        
        // Modified "rgb2hsv()" from this source: https://stackoverflow.com/a/17897228
        float rgb2hue(vec3 c)
        {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return abs(q.z + (q.w - q.y) / (6.0 * d + e));
        }
        
        float getPixelDepth(ivec2 pixel)
        {
            vec2 lookupPt = ( vec2(pixel) + vec2(0.5) ) / vec2(texSize);
            float hue = rgb2hue( texture2D(texImg, lookupPt).rgb );
            float pixelDepth = 3.0 * hue;
            return pixelDepth;
        }
        
        bool shouldDiscard(ivec2 currPixel)
        {
            float centerPixelDepth = getPixelDepth(currPixel);
        
            for ( int i = -filterSize; i <= filterSize; i++ )
                for ( int j = -filterSize; j <= filterSize; j++ )
                {
                    if ( i == 0 && j == 0 )
                        continue;

                    float currDepth = getPixelDepth(currPixel + ivec2(j, i));
                    
                    if ( currDepth < absoluteDepthRangeFilter.x
                         || currDepth >= absoluteDepthRangeFilter.y
                         || abs(centerPixelDepth - currDepth) > depthThresholdFilter )
                    {
                        return true;
                    }
                }
                
            return false;
        }

        void main()
        {
            ivec2 frameSize = ivec2(texSize.x / 2, texSize.y);
            int vertIdx = int(vertexIdx);
      
            int actualNumPts = frameSize.x * frameSize.y;
            if ( vertIdx >= actualNumPts )
            {
                gl_Position = vec4(0.0);
                return;
            }
            
            int ptY = vertIdx / int(frameSize.x);
            int ptX = vertIdx - ptY * int(frameSize.x);
            ivec2 pt = ivec2(ptX, ptY);
            
            if ( shouldDiscard( pt ) )
            {
                gl_Position = vec4(0.0);
                return;
            }
            
            float currDepth = getPixelDepth(pt);

            vec3 ptPos = scale * vec3(
                (iK.x * float(ptX) + iK.z) * currDepth,
                (iK.y * float(ptY) + iK.w) * currDepth,
                -currDepth
            );
            
            vec4 mvPos = modelViewMatrix * vec4(ptPos, 1.0);
            gl_Position = projectionMatrix * mvPos;
            
            vPtPos = vec2( float(ptX), float(ptY) );
            vVertexIdx = vertexIdx;
            gl_PointSize = ptSize;
        }
    `;

    const fragShaderSrc = `
        varying float vVertexIdx;
        varying vec2 vPtPos;

        uniform ivec2 texSize;
        uniform sampler2D texImg;
        
        void main()
        {
            vec2 frameSizeF = vec2(texSize.x / 2, texSize.y);
            ivec2 frameSize = ivec2(frameSizeF);
            
            int vertIdx = int(vVertexIdx);
            int actualNumPts = frameSize.x * frameSize.y;
            if ( vertIdx >= actualNumPts )
            {
                discard;
            }
            
            vec2 lookupPt = ( vec2(vPtPos.x + frameSizeF.x, vPtPos.y) + vec2(0.5) ) / vec2(texSize); 
            vec3 currColor = texture2D(texImg, lookupPt).rgb;
        
            gl_FragColor = vec4(currColor, 1.0);
        }
    `;

    return new THREE.ShaderMaterial({
        uniforms: {
            texImg: { type: 't', value: new THREE.Texture() },
            texSize: { type: 'i2', value: [0, 0] },
            iK: { type: 'f4', value: [0, 0, 0, 0] },
            scale: { type: 'f', value: 1.0 },
            ptSize: { type: 'f', value: 1.0 },
        },
        side: THREE.DoubleSide,
        transparent: false,
        vertexShader: vertShaderSrc,
        fragmentShader: fragShaderSrc
    });
}