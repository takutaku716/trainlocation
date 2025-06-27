
// location.js 修正済み - 自動更新対応

let _param_rosen = get_param("rosen");
let _typeData = null;
let _ekiData = null;
let autoUpdateIntervalId = null;
let documentVisible = true;

$(function () {
  // 初期描画処理
  loadInitialData();

  // 自動更新開始（10秒おき）
  startAutoUpdate();

  // ページの表示・非表示を検知
  document.addEventListener("visibilitychange", function () {
    documentVisible = document.visibilityState === "visible";
  });
});

function loadInitialData() {
  $.when(
    $.getJSON("https://www3.jrhokkaido.co.jp/trainlocation/json/location/type/type_" + _param_rosen + ".json"),
    $.getJSON("https://www3.jrhokkaido.co.jp/trainlocation/json/location/eki/eki_" + _param_rosen + ".json"),
    $.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_" + _param_rosen + "_now.json")
  ).done(function (typeData, ekiData, nowData) {
    _typeData = typeData[0];
    _ekiData = ekiData[0];
    $(".ressha-icon").remove();
    create_ressha_icon(_param_rosen, nowData[0], _typeData, _ekiData);
    ressha_pos_sort();
    updateTimestampDisplay();
  });
}

function startAutoUpdate() {
  if (autoUpdateIntervalId) clearInterval(autoUpdateIntervalId);
  autoUpdateIntervalId = setInterval(function () {
    if (!documentVisible) return;
    updateTrainPositions();
  }, 10000); // 10秒ごと
}

function updateTrainPositions() {
  const now = Date.now() >>> 16;
  $.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_" + _param_rosen + "_now.json?" + now)
    .done(function (nowData) {
      $(".ressha-icon").remove();
      create_ressha_icon(_param_rosen, nowData[0], _typeData, _ekiData);
      ressha_pos_sort();
      updateTimestampDisplay();
    })
    .fail(function () {
      console.warn("位置情報の取得に失敗しました");
    });
}

function updateTimestampDisplay() {
  const now = new Date();
  const timestampText =
    now.getFullYear() + "年" +
    (now.getMonth() + 1) + "月" +
    now.getDate() + "日" +
    now.getHours().toString().padStart(2, "0") + "時" +
    now.getMinutes().toString().padStart(2, "0") + "分" +
    now.getSeconds().toString().padStart(2, "0") + "秒現在";

  $("#timestamp").text(timestampText);
}

// 以下 create_ressha_icon, ressah_pos_sort などの定義は既存のlocation.jsから引き継いでください
