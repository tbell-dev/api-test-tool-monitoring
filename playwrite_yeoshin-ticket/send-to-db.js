const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const axios = require('axios');
const envPath = path.resolve(__dirname, ".env");
const { exit } = require('process');
const dotenv = require('dotenv');
const { start } = require('repl');
// .env 파일 경로를 명시적으로 지정해서 로드
dotenv.config({ path: './.env.js' });
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET

const influxWriteUrl = `http://localhost:8086/api/v2/write?org=${org}&bucket=${bucket}&precision=s`;
const influxToken = process.env.INFLUX_TOKEN;
const report_file = 'playwright-report/results.json';

// PostgreSQL 클라이언트
const pgClient = new Client({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PW,
  port: 5432,
});
function formatTimestampToDateTime(timestamp) {
  const date = new Date(timestamp * 1000);  // 초 단위 → 밀리초
  const YYYY = date.getFullYear().toString().slice(2); // 2자리 연도로 변환
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

async function storeTestResult(result) {
  const timestamp = result.startTime ? Math.floor(Date.now() / 1000)  : Math.floor(Date.now() / 1000);

  // 1. InfluxDB용 필드
  const line = `playwright_result,test_name=${escape(result.testName)},project=${escape(result.project)},status=${escape(result.status)} duration=${result.duration} ${timestamp}`;
  console.log("전송할 InfluxDB 데이터:", line);
  try {
    // 1. InfluxDB 전송
    const a = await axios.post(influxWriteUrl, line, {
      headers: { Authorization: `Token ${influxToken}`, 'Content-Type': 'text/plain' },
    });
    console.log("✅ [InfluxDB] 테스트 결과 저장 성공 ",a.status);
    
    // 2. PostgreSQL 에러로그 저장 (있는 경우에만)
    if (result.error && result.error.trim()) {
      const query = `
        INSERT INTO test_results (test_name, project, status, duration, error, start_time)
        VALUES ($1, $2, $3, $4, $5, to_timestamp($6))
      `;
      const values = [
        result.testName,
        result.project,
        result.status,
        result.duration,
        result.error,
        timestamp
      ];
      await pgClient.query(query, values);
      console.log(`💾 PostgreSQL 저장 성공: ${result.testName} (${result.project})`);

      // 👉 에러로그 파일 저장 추가
      const safeTestName = result.testName.replace(/[^a-zA-Z0-9_-]/g, '_'); // 파일명 안전 처리
      const safeProject = result.project.replace(/[^a-zA-Z0-9_-]/g, '_');
      const logFileName = `${formatTimestampToDateTime(timestamp)}-${safeProject}-${safeTestName}.log`;
      const logDir = path.join(__dirname, 'error_logs');
      const logFilePath = path.join(logDir, logFileName);
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logContent = `
        [Time] ${new Date(timestamp * 1000).toISOString()} 
[Project] ${result.project}
[Test Name] ${result.testName}
[Status] ${result.status}
[Duration] ${result.duration}
[Error]
${result.error}
      `;

      await fs.writeFileSync(logFilePath, logContent.trim());
      console.log(`📝 에러 로그 파일 저장 성공: ${logFilePath}`);
    }
      
  } catch (err) {
    console.error("❌ [InfluxDB] 테스트 결과 저장 실패: ", err.message || err);
  }
}

// 이스케이프 함수
function escape(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/ /g, '\\ ');;
}
// 전체 실행
(async () => {
  try {
    // PostgreSQL 연결
    await pgClient.connect();

    // JSON 파일 읽기
    const data = fs.readFileSync(report_file, 'utf8');
    const json = JSON.parse(data);

    // 테스트 결과 펼치기
    const flatResults = [];
    for (const suite of json.suites) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          for (const result of test.results) {
            flatResults.push({
              startTime: result.startTime,
              testName: spec.title,
              project: test.projectName,
              status: result.status,
              duration: result.duration,
              error: result.error?.message || ''
            });
          }
        }
      }
    }

    // 모든 결과 저장
    for (const r of flatResults) {
      console.log(`\n처리 중: ${r.testName} (${r.project} ${r.startTime})`);
      await storeTestResult(r);
    }

  } catch (err) {
    console.error('❌ 전체 처리 실패:', err.message || err);
  } finally {
    await pgClient.end();
  }
})();