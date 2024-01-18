// SCRIPTタグの生成
var el = document.createElement("script");

//オプションasyncを指定
el.async = !0

// SCRIPTタグのSRC属性に読み込みたいファイルを指定
el.src = "https://www.googletagmanager.com/gtag/js?id=G-F159N7E8SP";

// head要素の最初に追加
document.head.prepend(el);

//GA4収集用
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-F159N7E8SP');
gtag('config','UA-88761526-1');
