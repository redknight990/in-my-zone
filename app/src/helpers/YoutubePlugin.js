import querystring from 'querystring';
import '@capacitor-community/http';
import { Plugins } from '@capacitor/core';

async function getVideoInfo(videoId) {
    try {
        const { Http } = Plugins;

        const res = await Http.request({
            method: 'GET',
            url: `https://www.youtube.com/get_video_info?html5=1&video_id=${videoId}&el=detailpage&hl=en_EN`
            // url: `https://www.youtube.com/get_video_info?html5=1&video_id=${videoId}&el=detailpage&hl=en_EN&cbr=Chrome&c=WEB_REMIX&cver=0.1&cplayer=UNIPLAYER&cos=Windows&cosver=10.0&cplatform=DESKTOP&living_room_app_mode=LIVING_ROOM_APP_MODE_UNSPECIFIED`
        });

        // const info = decodeURIComponent(res.data);
        const params = new URLSearchParams(res.data);
        const playerResponse = JSON.parse(params.get('player_response'));

        if (playerResponse)
            return playerResponse.streamingData;
        else
            return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function getVideoFormat(videoId) {

    // Get streaming data from video page
    const streamingData = await getVideoInfo(videoId);

    if (!streamingData)
        throw new Error('streaming data not found');

    const { Http } = Plugins;

    const res = await Http.request({
        method: 'GET',
        url: `https://music.youtube.com/watch?v=${videoId}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            'x-youtube-client-version': 0.1
        }
    });

    // const res = await Http.request({
    //     method: 'GET',
    //     url: `https://www.youtube.com/watch?v=${videoId}`
    // });
    // let streamingData = res.data.split('"streamingData":').pop();
    // const pos = findClosingBracketIndex(streamingData, 0);
    // streamingData = JSON.parse(decodeURIComponent(streamingData.substring(0, pos + 1)).replace('\b', ''));

    // Collect audio formats
    let audioFormats = [];
    if (Array.isArray(streamingData.formats))
        audioFormats = audioFormats.concat(streamingData.formats.filter(f => f.mimeType.includes('audio')));
    if (Array.isArray(streamingData.adaptiveFormats))
        audioFormats = audioFormats.concat(streamingData.adaptiveFormats.filter(f => f.mimeType.includes('audio')));

    // No format found
    if (audioFormats.length === 0) {
        throw new Error('No audio format found');
    }

    // Select highest bitrate format
    let selectedFormat = null;
    audioFormats.forEach(f => {
        if (!selectedFormat || selectedFormat.bitrate < f.bitrate)
            selectedFormat = f;
    });

    // Parse selected format streaming URL
    await parseFormatURL(selectedFormat, res.data);

    return selectedFormat;
}

async function parseFormatURL(format, body) {
    // Format already has url, no need to decipher
    if (format.url)
        return;

    // Get format cipher string
    const cipher = format.cipher || format.signatureCipher;
    if (!cipher)
        return;

    // Get base format url
    format.url = cipher.split('url=').pop();

    // Get html5player js source and decipher format signature
    const html5player = getHTML5player(body);
    const { Http } = Plugins;
    const res = await Http.request({
        method: 'GET',
        url: `https://youtube.com${html5player}`
    });
    const tokens = extractActions(res.data);
    const cipherQuery = querystring.parse(cipher);
    const sig = tokens && cipherQuery.s ? decipher(tokens, cipherQuery.s) : null;

    // Add format signature to url
    format.url = `${format.url}&${cipherQuery.sp || 'signature'}=${sig}`;
    format.url = decodeURIComponent(format.url);
}

// eslint-disable-next-line no-unused-vars
function findClosingBracketIndex(str, pos) {
    if (str[pos] !== '{') {
        throw new Error('The position must contain an opening bracket');
    }
    let level = 1;
    for (let index = pos + 1; index < str.length; index++) {
        if (str[index] === '{') {
            level++;
        } else if (str[index] === '}') {
            level--;
        }

        if (level === 0) {
            return index;
        }
    }
    return -1;
}

function getHTML5player(body) {
    let html5playerRes =
        /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/
            .exec(body);
    return html5playerRes ? html5playerRes[1] || html5playerRes[2] : null;
}

const jsVarStr = '[a-zA-Z_\\$][a-zA-Z_0-9]*';
const jsSingleQuoteStr = `'[^'\\\\]*(:?\\\\[\\s\\S][^'\\\\]*)*'`;
const jsDoubleQuoteStr = `"[^"\\\\]*(:?\\\\[\\s\\S][^"\\\\]*)*"`;
const jsQuoteStr = `(?:${jsSingleQuoteStr}|${jsDoubleQuoteStr})`;
const jsKeyStr = `(?:${jsVarStr}|${jsQuoteStr})`;
const jsPropStr = `(?:\\.${jsVarStr}|\\[${jsQuoteStr}\\])`;
const jsEmptyStr = `(?:''|"")`;
const reverseStr = ':function\\(a\\)\\{' +
    '(?:return )?a\\.reverse\\(\\)' +
    '\\}';
const sliceStr = ':function\\(a,b\\)\\{' +
    'return a\\.slice\\(b\\)' +
    '\\}';
const spliceStr = ':function\\(a,b\\)\\{' +
    'a\\.splice\\(0,b\\)' +
    '\\}';
const swapStr = ':function\\(a,b\\)\\{' +
    'var c=a\\[0\\];a\\[0\\]=a\\[b(?:%a\\.length)?\\];a\\[b(?:%a\\.length)?\\]=c(?:;return a)?' +
    '\\}';
const actionsObjRegexp = new RegExp(
    `var (${jsVarStr})={((?:(?:${
        jsKeyStr}${reverseStr}|${
        jsKeyStr}${sliceStr}|${
        jsKeyStr}${spliceStr}|${
        jsKeyStr}${swapStr
    }),?\\r?\\n?)+)};`);
const actionsFuncRegexp = new RegExp(`${`function(?: ${jsVarStr})?\\(a\\)\\{` +
    `a=a\\.split\\(${jsEmptyStr}\\);\\s*` +
    `((?:(?:a=)?${jsVarStr}`}${
        jsPropStr
    }\\(a,\\d+\\);)+)` +
    `return a\\.join\\(${jsEmptyStr}\\)` +
    `\\}`);
const reverseRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${reverseStr}`, 'm');
const sliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${sliceStr}`, 'm');
const spliceRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${spliceStr}`, 'm');
const swapRegexp = new RegExp(`(?:^|,)(${jsKeyStr})${swapStr}`, 'm');

function extractActions(body) {
    const objResult = actionsObjRegexp.exec(body);
    const funcResult = actionsFuncRegexp.exec(body);
    if (!objResult || !funcResult) {
        return null;
    }

    const obj = objResult[1].replace(/\$/g, '\\$');
    const objBody = objResult[2].replace(/\$/g, '\\$');
    const funcBody = funcResult[1].replace(/\$/g, '\\$');

    let result = reverseRegexp.exec(objBody);
    const reverseKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');
    result = sliceRegexp.exec(objBody);
    const sliceKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');
    result = spliceRegexp.exec(objBody);
    const spliceKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');
    result = swapRegexp.exec(objBody);
    const swapKey = result && result[1]
        .replace(/\$/g, '\\$')
        .replace(/\$|^'|^"|'$|"$/g, '');

    const keys = `(${[reverseKey, sliceKey, spliceKey, swapKey].join('|')})`;
    const myreg = `(?:a=)?${obj
        }(?:\\.${keys}|\\['${keys}'\\]|\\["${keys}"\\])` +
        `\\(a,(\\d+)\\)`;
    const tokenizeRegexp = new RegExp(myreg, 'g');
    const tokens = [];
    while ((result = tokenizeRegexp.exec(funcBody)) !== null) {
        let key = result[1] || result[2] || result[3];
        switch (key) {
            case swapKey:
                tokens.push(`w${result[4]}`);
                break;
            case reverseKey:
                tokens.push('r');
                break;
            case sliceKey:
                tokens.push(`s${result[4]}`);
                break;
            case spliceKey:
                tokens.push(`p${result[4]}`);
                break;
        }
    }
    return tokens;
}

function decipher(tokens, sig) {
    sig = sig.split('');
    for (let i = 0, len = tokens.length; i < len; i++) {
        let token = tokens[i], pos;
        switch (token[0]) {
            case 'r':
                sig = sig.reverse();
                break;
            case 'w':
                pos = ~~token.slice(1);
                sig = swapHeadAndPosition(sig, pos);
                break;
            case 's':
                pos = ~~token.slice(1);
                sig = sig.slice(pos);
                break;
            case 'p':
                pos = ~~token.slice(1);
                sig.splice(0, pos);
                break;
        }
    }
    return sig.join('');
}

function swapHeadAndPosition(arr, position) {
    const first = arr[0];
    arr[0] = arr[position % arr.length];
    arr[position] = first;
    return arr;
}

