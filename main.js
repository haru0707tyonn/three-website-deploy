import { lerp } from "three/src/math/MathUtils";
import "./style.css";
import * as THREE from "three";
import bg from "./bg/scene-bg.jpg"; // 117 Verceにてデプロイの際に画像指定が適切に行われなかったため
 
// canvas
const canvas = document.querySelector("#webgl");
 
// シーン
const scene = new THREE.Scene();

// 背景用のテクスチャ
const textureLoader = new THREE.TextureLoader();
// const bgTexture = textureLoader.load("bg/scene-bg.jpg");
const bgTexture = textureLoader.load(bg);
scene.background = bgTexture; // 背景を挿入する場合はscene.addではなく.backgroundを使う
 
// サイズ
const sizes = {
  width: innerWidth,
  height: innerHeight,
};
 
// カメラ
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
 
// レンダラー
const renderer = new THREE.WebGLRenderer({
  canvas: canvas, // キャンバスの中に描画するという設定
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio); // 粗さ軽減

// オブジェクトを作成
const boxGeometry = new THREE.BoxGeometry(5, 5, 5, 10);
const boxMaterial = new THREE.MeshNormalMaterial(); // 光源を必要としないマテリアル
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(0, 0.5, -15); // カメラの初期値も原点z軸も0のため、カメラを後ろに引くか、物体を奥にするかをしないと表示されない
box.rotation.set(1, 1, 0);

const torusGeometry = new THREE.TorusGeometry(8, 2, 16, 100);
const torusMaterial = new THREE.MeshNormalMaterial();
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.set(0, 1, 10); // 手前方向（z軸＋10）にいるため最初は見えない

scene.add(box, torus);


// 線形補完で滑らかに移動させる 114 
function larp(x, y, a) { 
  return (1-a) * x + a * y;
}

function scalePercent(start, end) { // 115
  return (scrollParcent - start) / (end - start);
}


// スクロールアニメーション
const animationScripts = []; // スクロールに応じて切り替わる4つのアニメーションを追加するための配列

animationScripts.push({ // 配列に追加
  start: 0, // アニメーションの開始位置（％）
  end: 40,  // アニメーションの終了位置（％）
  function() { // boxの位置を変える
    camera.lookAt(box.position); // カメラはboxオブジェクトを見続ける
    camera.position.set(0, 1, 10); // 少し手前に動かしておく
    box.position.z = larp(-15, 2, scalePercent(0, 40)) // 115 引数は初期地点、最終地点、滑らかさ加減（（自作）関数）
    torus.position.z = larp(10, -20, scalePercent(0, 40)) // 115 引数は初期地点、最終地点、滑らかさ加減（（自作）関数）
  },
});

animationScripts.push({ // 配列に追加
  start: 40, // アニメーションの開始位置（％）
  end: 60,  // アニメーションの終了位置（％）
  function() { // boxを回転させる
    camera.lookAt(box.position); // カメラはboxオブジェクトを見続ける
    camera.position.set(0, 1, 10); // 少し手前に動かしておく
    box.rotation.z = lerp(1,Math.PI, scalePercent(40, 60)); // 半回転する 116
  },
});

animationScripts.push({ // 配列に追加
  start: 60, // アニメーションの開始位置（％）
  end: 80,  // アニメーションの終了位置（％）
  function() { // カメラのポジションを変える
    camera.lookAt(box.position); // カメラはboxオブジェクトを見続ける
    camera.position.x = lerp(0, -15, scalePercent(60, 80));
    camera.position.y = lerp(1, 15, scalePercent(60, 80));
    camera.position.z = lerp(10, 25, scalePercent(60, 80));
  },
});

animationScripts.push({ // 配列に追加
  start: 80, // アニメーションの開始位置（％）
  end: 100,  // アニメーションの終了位置（％）
  function() { // boxを横回転させる
    camera.lookAt(box.position); // カメラはboxオブジェクトを見続ける
    box.rotation.x += 0.02;
  },
});

// アニメーションを開始
function playScrollAnimation() { // tick関数の中にこちらを記述する
  animationScripts.forEach((animation)=> { // forEachで配列の要素を一つ一つ取り出し、animationとして扱う
    if(scrollParcent >= animation.start && scrollParcent <= animation.end) // 現在のスクロール率がアニメーションスタート（今回は0）よりも大きい　かつ　アニメーションエンド（今回は40）よりも小さい場合
    animation.function();
  });
};

// ブラウザのスクロール率を取得

let scrollParcent = 0;

document.body.onscroll = () => {
  scrollParcent = // 112 スクロール率取得に必要な要素: 一番上からブラウザの上の部分までの距離（x）、上から下までの長さ（L）、見ているブラウザの大きさ（y） 数式は：L - y 分の x 掛ける100
    (document.documentElement.scrollTop / (document.scrollingElement.scrollHeight - document.documentElement.clientHeight)) * 100; // 112
  console.log(scrollParcent);
};
 
// アニメーション
const tick = () => {
  window.requestAnimationFrame(tick);
  playScrollAnimation();

  renderer.render(scene, camera);
};
 
tick();
 
// ブラウザのリサイズ操作
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
 
  camera.aspect = sizes.width / sizes.height; // アスペクト比も変わるので注意
  camera.updateProjectionMatrix(); // 適用させるために必要
 
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});
