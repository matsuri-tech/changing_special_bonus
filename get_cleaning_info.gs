function runBigQueryQuery() {
  // ロックを取得
  const lock = LockService.getScriptLock();
  
  // ロックを5分間（300秒）保持
  try {
    lock.waitLock(300000); // 5分間のロック

    // Google Sheets から work_date を取得
    const ss = SpreadsheetApp.openById("1h8VKc3r5WSp05hEHeKyEfNNk62f2SNkGOaUpYlpQxcQ");
    const sheet = ss.getSheetByName('bonus変更'); // シート名を指定
    const workDate = sheet.getRange('G2').getValue(); // E2セルからwork_dateを取得

    // work_dateが空でないか確認
    if (!workDate) {
      Logger.log("work_date is not available in E2.");
      return;
    }

    // work_dateをフォーマット (例: yyyy-MM-dd)
    const formattedWorkDate = Utilities.formatDate(workDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // BigQuery サービスを有効化
    const projectId = 'm2m-core'; // プロジェクトIDを指定してください
    const query = `
      SELECT
        wo_cleaning_tour.work_date,
        wo_cleaning_tour.work_name,
        wo_cleaning_tour.cleaning_id,
        wo_cleaning_tour.worker_name,
        wo_cleaning_tour.cleaning_cost
      FROM
        \`m2m-core.su_wo.wo_cleaning_tour\` AS wo_cleaning_tour
      WHERE
        wo_cleaning_tour.work_date = '${formattedWorkDate}'
      AND
        wo_cleaning_tour.work_name = "通常清掃"
      AND
        wo_cleaning_tour.cleaning_company_name = "matsuritech"
    `;

    // BigQuery 実行オプション
    const request = {
      query: query,
      useLegacySql: false // 標準SQLを使用
    };

    // BigQuery クエリの実行
    const queryResults = BigQuery.Jobs.query(request, projectId);

    // 結果の処理
    if (queryResults.jobComplete) {
      const rows = queryResults.rows;

      if (rows) {
        // A、B、C列のみをクリア
        sheet.getRange('A2:E').clear();

        // ヘッダーを追加
        sheet.getRange(1, 1).setValue('work_date');
        sheet.getRange(1, 2).setValue('work_name');
        sheet.getRange(1, 3).setValue('cleaning_id');
        sheet.getRange(1, 4).setValue('worker_name');
        sheet.getRange(1, 5).setValue('cleaning_cost');

        // データを書き込む
        rows.forEach(function (row, index) {
          const rowIndex = index + 2; // 2行目からデータを書き込み
          sheet.getRange(rowIndex, 1).setValue(row.f[0].v); // work_date
          sheet.getRange(rowIndex, 2).setValue(row.f[1].v); // work_name
          sheet.getRange(rowIndex, 3).setValue(row.f[2].v); // cleaning_id
          sheet.getRange(rowIndex, 4).setValue(row.f[3].v); // cleaning_company_name
          sheet.getRange(rowIndex, 5).setValue(row.f[4].v); // cleaning_cost
        });

        Logger.log("Data written to sheet.");
      } else {
        Logger.log("No results found.");
      }
    } else {
      Logger.log("Query is still running...");
    }
  } catch (e) {
    Logger.log('Error: ' + e);
  } finally {
    // 処理が終了したらロックを解放
    lock.releaseLock();
  }
}
