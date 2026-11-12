#!/usr/bin/env node
'use strict';
// Run on the developer's own PC. Reads one local token; GETs only Kakao token info.
// Does not log the token/user ID, call HobbyTree login, write files, or follow redirects.
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const EXPECTED_APP_ID = 1627160;
const VARIABLE = 'EXPO_PUBLIC_DEV_KAKAO_TOKEN';

function parseEnvToken(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const found = lines.filter(line => /^\s*(?:export\s+)?EXPO_PUBLIC_DEV_KAKAO_TOKEN\s*=/.test(line));
  if (found.length !== 1) throw new Error(found.length ? 'DUPLICATE_TOKEN_VARIABLE' : 'TOKEN_VARIABLE_MISSING');
  let value = found[0].replace(/^\s*(?:export\s+)?EXPO_PUBLIC_DEV_KAKAO_TOKEN\s*=\s*/, '');
  if (value.startsWith('"') || value.startsWith("'")) {
    const quote = value[0];
    const closing = value.indexOf(quote, 1);
    if (closing < 0 || !/^\s*(?:#.*)?$/.test(value.slice(closing + 1))) throw new Error('INVALID_ENV_QUOTING');
    value = value.slice(1, closing);
  } else {
    value = value.split('#')[0].trim();
  }
  if (!value || /\$\{|^\[삭제\]$|^<.*>$/.test(value)) throw new Error('TOKEN_VALUE_MISSING_OR_PLACEHOLDER');
  if (/^Bearer\s/i.test(value)) throw new Error('REMOVE_BEARER_PREFIX');
  if (!/^[\x21-\x7e]{1,16384}$/.test(value)) throw new Error('TOKEN_HAS_WHITESPACE_OR_INVALID_CHARACTERS');
  return value;
}

function kakaoInfo(token) {
  return new Promise((resolve, reject) => {
    const request = https.request('https://kapi.kakao.com/v1/user/access_token_info', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }, response => {
      let size = 0;
      const chunks = [];
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 65536) request.destroy(new Error('RESPONSE_TOO_LARGE'));
        else chunks.push(chunk);
      });
      response.on('error', () => reject(new Error('PROVIDER_CONNECTION_FAILED')));
      response.on('end', () => {
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { reject(new Error('PROVIDER_RESPONSE_NOT_JSON')); return; }
        resolve({ status: response.statusCode, body });
      });
    });
    const deadline = setTimeout(() => request.destroy(new Error('PROVIDER_TIMEOUT')), 10000);
    request.on('close', () => clearTimeout(deadline));
    request.on('error', () => reject(new Error('PROVIDER_CONNECTION_FAILED')));
    request.end();
  });
}

async function inspectToken(token, query = kakaoInfo) {
  const { status, body } = await query(token);
  const report = { expectedAppId: EXPECTED_APP_ID, providerHttpStatus: status };
  if (status !== 200) {
    return { ...report, result: status === 401 ? 'TOKEN_REJECTED' : 'PROVIDER_ERROR',
      providerErrorCode: Number.isFinite(body?.code) ? body.code : null };
  }
  const shapeValid = body != null && Number.isSafeInteger(body.app_id) && body.app_id > 0
    && Number.isSafeInteger(body.id) && body.id > 0
    && Number.isFinite(body.expires_in) && body.expires_in > 0;
  if (!shapeValid) return { ...report, result: 'INVALID_TOKEN_INFO' };
  return { ...report, result: body.app_id === EXPECTED_APP_ID ? 'TOKEN_INFO_MATCHES_BACKEND' : 'APP_ID_MISMATCH',
    tokenAppId: body.app_id, expiresInSeconds: body.expires_in };
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log('Run from hobbytree4: node diagnose-kakao-token.cjs [path-to-.env.local]\nThe token is sent only to Kakao over HTTPS; no HobbyTree login or DB write is performed.');
    return;
  }
  const filename = path.resolve(process.argv[2] || '.env.local');
  let token;
  try { token = parseEnvToken(fs.readFileSync(filename, 'utf8')); }
  catch (error) {
    const known = ['DUPLICATE_TOKEN_VARIABLE','TOKEN_VARIABLE_MISSING','INVALID_ENV_QUOTING',
      'TOKEN_VALUE_MISSING_OR_PLACEHOLDER','REMOVE_BEARER_PREFIX','TOKEN_HAS_WHITESPACE_OR_INVALID_CHARACTERS'];
    console.log(JSON.stringify({ result: 'LOCAL_CONFIG_ERROR', reason: known.includes(error.message) ? error.message : 'ENV_FILE_UNREADABLE' }, null, 2));
    process.exitCode = 1;
    return;
  }
  try {
    const report = await inspectToken(token);
    // Expo can take its value from a shell or another env file. Do not print either value.
    report.shellVariablePresent = typeof process.env[VARIABLE] === 'string';
    report.shellVariableDiffersFromFile = report.shellVariablePresent ? process.env[VARIABLE] !== token : null;
    report.checkedUtc = new Date().toISOString();
    report.scope = 'Kakao token info only; HobbyTree login success is not tested';
    console.log(JSON.stringify(report, null, 2));
    if (report.result !== 'TOKEN_INFO_MATCHES_BACKEND') process.exitCode = 1;
  } catch {
    console.log(JSON.stringify({ result: 'PROVIDER_CHECK_FAILED', tokenDisclosed: false }));
    process.exitCode = 1;
  }
}
module.exports = { parseEnvToken, inspectToken };
if (require.main === module) main();
