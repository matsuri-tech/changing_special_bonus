function addSpecialBonus() {
  // スプレッドシートとシートの取得
  let ss = SpreadsheetApp.openById("1h8VKc3r5WSp05hEHeKyEfNNk62f2SNkGOaUpYlpQxcQ");
  let sheet = ss.getSheetByName("test");

  // シートのA3からcleaning_id、B3からspecial_bonusを取得
  let cleaning_id = sheet.getRange("A3").getValue();
  let special_bonus = sheet.getRange("B3").getValue();

  // getApiToken関数からトークンを取得
  const token = getApiToken();
  
  // トークンが正しく取得できていない場合、処理を終了
  if (!token) {
    Logger.log("トークンの取得に失敗しました");
    return;
  }
  
  const api_url = "https://api-cleaning.m2msystems.cloud/v4/cleanings/special_bonus";

  // リクエストのペイロード
  const payload = {
    cleaningId: cleaning_id,
    specialBonus: special_bonus
  };

  // HTTPリクエストのオプション
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + token
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };

  // APIリクエストを送信し、レスポンスを取得
  let response = UrlFetchApp.fetch(api_url, options);
  const responseText = response.getContentText();
  Logger.log(responseText);

  let result;
  if (responseText.includes('error')) {
    result = 'error';
  } else {
    result = 'ok';
  }

  Logger.log('result: ' + result);
}


function getApiToken() {
  const url = 'https://api.m2msystems.cloud/login';
  
  // スクリプトプロパティからメールアドレスとパスワードを取得
  const mail = PropertiesService.getScriptProperties().getProperty("mail_address");
  const pass = PropertiesService.getScriptProperties().getProperty("pass");

  // APIリクエストのペイロード
  const payload = {
    email: mail,
    password: pass
  };

  // HTTPリクエストのオプション
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  // APIリクエストを送信し、レスポンスを取得
  const response = UrlFetchApp.fetch(url, options);
  
  // ステータスコードが200の場合はトークンを返す
  if (response.getResponseCode() == 200) {
    const json = JSON.parse(response.getContentText());
    const token = json.accessToken;
    return token;
  } else {
    Logger.log("トークン取得エラー: ステータスコード " + response.getResponseCode());
    return null;
  }
}
