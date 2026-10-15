import { Color, InstancedBufferAttribute, InstancedBufferGeometry, MeshPhysicalMaterial, Vector3 } from 'three'

// Số lớp vỏ lông: càng nhiều lông càng dày, mượt (luôn dùng mức cao nhất theo yêu cầu)
export const FUR_LAYERS = 32

/**
 * Hình học vỏ lông: vẽ lưới thân nhiều lần bằng instancing, mỗi bản nhận một giá trị layer từ 0 (da) tới gần 1 (ngọn lông).
 * Dùng chung thuộc tính với lưới gốc nên không tốn thêm bộ nhớ cho đỉnh.
 */
export function furGeometry(base, layers = FUR_LAYERS) {
  const geometry = new InstancedBufferGeometry()
  geometry.setIndex(base.index)
  for (const [name, attribute] of Object.entries(base.attributes)) geometry.setAttribute(name, attribute)
  geometry.setAttribute('furLayer', new InstancedBufferAttribute(Float32Array.from({ length: layers }, (_, i) => i / layers), 1))
  geometry.instanceCount = layers
  return geometry
}

const VERTEX_HEAD = /* glsl */ `
#include <common>
attribute float furLayer;
attribute float furLength;
attribute vec3 furComb;
attribute float furAo;
attribute float furStiff;
uniform vec3 uGravity;
uniform vec3 uDrag;
varying float vLayer;
varying float vStiff;
varying vec3 vRest;
varying vec3 vRestNormal;
varying float vAo;
varying float vFur;
`

// Phồng lớp lông theo pháp tuyến và chải theo hướng lông ở tư thế nghỉ (trước khi skin), nên lông đi theo cơ thể.
// Lông mềm cong dần theo hướng chải; gai (furStiff = 1) mọc thẳng, chếch hẳn về phía sau
const VERTEX_BEGIN = /* glsl */ `
#include <begin_vertex>
vLayer = furLayer;
vRest = position;
vRestNormal = normal;
vAo = furAo;
vFur = furLength;
vStiff = furStiff;
vec3 softFur = normal * furLength * furLayer + furComb * furLength * furLayer * furLayer * 0.9;
vec3 spike = (normal * 0.55 + furComb * 0.85) * furLength * furLayer;
transformed += mix(softFur, spike, furStiff);
`

// Sau khi skin: ngọn lông rủ theo trọng lực và lay ngược hướng di chuyển (quán tính); gai cứng thì không
const VERTEX_SKIN = /* glsl */ `
#include <skinning_vertex>
transformed += (uGravity * 0.35 + uDrag) * furLength * furLayer * furLayer * (1.0 - furStiff);
`

const FRAGMENT_HEAD = /* glsl */ `
#include <common>
uniform float uDensity;
uniform float uSpineDensity;
uniform float uTipDark;
uniform float uCurl;
varying float vLayer;
varying float vStiff;
varying vec3 vRest;
varying vec3 vRestNormal;
varying float vAo;
varying float vFur;

float furHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

// Xoay lưới ô thứ hai (quanh trục (1,1,1) góc 0,9 rad) để hai lưới không trùng hàng, sợi không thành ô kẻ
vec3 furRotate(vec3 p) {
  return vec3(dot(vec3(0.7477, -0.3262, 0.5784), p), dot(vec3(0.5784, 0.7477, -0.3262), p), dot(vec3(-0.3262, 0.5784, 0.7477), p));
}
`

// Sợi lông: mỗi ô nhỏ trong không gian (tính từ vị trí gốc) có một sợi tròn, thon dần, đặt lệch ngẫu nhiên trong ô;
// hai lưới ô xoay lệch nhau chồng lên cho dày và không lộ hàng lối. Sợi dài ngắn khác nhau, mép sợi mịn (alpha-to-coverage)
const FRAGMENT_STRAND = /* glsl */ `
vec4 diffuseColor = vec4( diffuse, opacity );
if (vLayer > 0.0) {
  if (vFur < 0.0004) discard;
  float best = 1e9;
  for (int g = 0; g < 2; g++) {
    vec3 base = g == 0 ? vRest : furRotate(vRest) + 0.37;
    vec3 n = normalize(g == 0 ? vRestNormal : furRotate(vRestNormal));
    vec3 cell = base * mix(uDensity, uSpineDensity, vStiff); // gai thưa và to hơn lông
    // Lông xoăn: tâm sợi xoay quanh pháp tuyến theo độ cao
    cell += vec3(sin(vLayer * 11.0 + cell.y), cos(vLayer * 11.0 + cell.z), sin(vLayer * 9.0 + cell.x)) * uCurl * 0.4 * vLayer;
    vec3 id = floor(cell) + float(g) * 31.0;
    vec3 jitter = vec3(furHash(id + 1.7), furHash(id + 3.1), furHash(id + 5.3)) - 0.5;
    vec3 local = fract(cell) - 0.5 - jitter * 0.45;
    local -= n * dot(local, n);
    float height = mix(0.5 + 0.5 * furHash(id), 0.85 + 0.15 * furHash(id), vStiff);
    float radius = mix(0.62, 0.45, vStiff) * (1.0 - vLayer / height);
    if (vLayer < height) best = min(best, length(local) / max(radius, 1e-3));
  }
  if (best > 1.0) discard;
  diffuseColor.a = smoothstep(1.0, 0.6, best);
}
`

// Màu: gốc lông tối (bị che), ngọn sáng; mỗi sợi đậm nhạt khác nhau; chỗ hõm (nách, kẽ chân) tối hơn
const FRAGMENT_COLOR = /* glsl */ `
#include <color_fragment>
float hasFur = step(0.0004, vFur);
diffuseColor.rgb *= mix(1.0, mix(0.86, 1.12, furHash(floor(vRest * uDensity) + 17.0)), hasFur);
diffuseColor.rgb *= mix(1.0, mix(0.72, 1.05, pow(vLayer, 0.6)), hasFur) * mix(0.6, 1.0, vAo);
// Lông agouti (thỏ): đầu sợi sẫm
diffuseColor.rgb *= 1.0 - uTipDark * smoothstep(0.55, 0.95, vLayer) * (1.0 - vStiff);
// Gai nhím có vằn: gốc kem, khúc giữa nâu sẫm, ngọn trắng ngà
float band = smoothstep(0.25, 0.35, vLayer) * (1.0 - smoothstep(0.62, 0.72, vLayer));
vec3 quill = mix(vec3(0.86, 0.8, 0.68), diffuseColor.rgb * 0.6, band);
diffuseColor.rgb = mix(diffuseColor.rgb, quill, vStiff * step(0.001, vLayer));
`

/**
 * Vật liệu lông (lưới có xương): màu theo đỉnh, ánh "sheen" mềm như lông thật, mép sợi mịn nhờ alpha-to-coverage.
 * spineDensity: mật độ gai (nhím) ở vùng có thuộc tính furStiff; sheen: độ bóng mềm của lông (lông thô thì thấp);
 * tipDark: đầu sợi lông sẫm (lông agouti của thỏ).
 * uniforms.uGravity / uDrag được PetBody cập nhật mỗi khung hình (theo không gian của lưới).
 */
export function furMaterial({ density, curl = 0, glow = null, spineDensity = density, sheen = 0.45, tipDark = 0 }) {
  const material = new MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.78,
    metalness: 0,
    sheen,
    sheenRoughness: 0.5,
    sheenColor: new Color('#bfbfbf'),
    alphaToCoverage: true,
  })
  if (glow) {
    material.emissive = new Color(glow)
    material.emissiveIntensity = 0.12
  }
  const uniforms = {
    uDensity: { value: density },
    uSpineDensity: { value: spineDensity },
    uTipDark: { value: tipDark },
    uCurl: { value: curl },
    uGravity: { value: new Vector3(0, -1, 0) },
    uDrag: { value: new Vector3() },
  }
  material.userData.uniforms = uniforms
  material.customProgramCacheKey = () => 'pet-fur'
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', VERTEX_HEAD)
      .replace('#include <begin_vertex>', VERTEX_BEGIN)
      .replace('#include <skinning_vertex>', VERTEX_SKIN)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', FRAGMENT_HEAD)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', FRAGMENT_STRAND)
      .replace('#include <color_fragment>', FRAGMENT_COLOR)
  }
  return material
}
