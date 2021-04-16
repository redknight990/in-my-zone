export function colorBrightness(c) {
    let color = '' + c, isHEX = c.indexOf('#') === 0, isRGB = c.indexOf('rgb') === 0;
    let r, g, b;
    if (isHEX) {
        const hasFullSpec = color.length === 7;
        let m = color.substr(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);
        if (m) {
            r = parseInt(m[0] + (hasFullSpec ? '' : m[0]), 16);
            g = parseInt(m[1] + (hasFullSpec ? '' : m[1]), 16);
            b = parseInt(m[2] + (hasFullSpec ? '' : m[2]), 16);
        }
    }
    if (isRGB) {
        let m = color.match(/(\d+)/g);
        if (m) {
            r = m[0];
            g = m[1];
            b = m[2];
        }
    }
    if (typeof r != 'undefined')
        return ((r * 299) + (g * 587) + (b * 114)) / 2550;
}

export function deepCopy(obj) {
    if (!obj)
        return null;
    return JSON.parse(JSON.stringify(obj));
}

export function shallowCopy(obj) {
    return { ...obj };
}

export function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        let x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

export function setFirstItem(arr, predicate) {
    if (typeof predicate !== 'function')
        return arr;

    let index = arr.findIndex(predicate);
    if (index < 0)
        return arr;

    let start = arr.splice(0, index);
    arr.push(...start);
    return arr;
}

export function setLastItem(arr, predicate) {
    if (typeof predicate !== 'function')
        return arr;

    let index = arr.findIndex(predicate);
    if (index < 0)
        return arr;

    let start = arr.splice(0, index + 1);
    arr.push(...start);
    return arr;
}

export function uuid4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function isUUID(str) {
    return /^\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b$/.test(str.toLowerCase());
}

export function isAlbumID(str) {
    return String(str).startsWith('MPREb');
}

export function toDataURL(url, withProxy = true) {
    if (withProxy)
        url = `${process.env.VUE_APP_API_URL}/cors/${url}`;

    return fetch(url)
        .then(response => response.blob())
        .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        }));
}

export function isSearchMatch(search, object, ...keysOrFunctions) {
    search = cleanForSearch(search);
    const words = search.split(/\s+/);
    return words.every(word => {
        for (let keyOrFunc of keysOrFunctions) {
            // Key
            if (typeof keyOrFunc === 'string' && object[keyOrFunc] && cleanForSearch(object[keyOrFunc]).includes(word))
                return true;
            // Function
            else if (typeof keyOrFunc === 'function') {
                const field = cleanForSearch(keyOrFunc(object));
                if (field.includes(word))
                    return true;
            }
        }
        return false;
    });
}

export function cleanString(str) {
    return String(str)
        .replace(/\(.*\)/g, '')
        .replace(/\[.*]/g, '')
        .trim();
}

export function cleanForSearch(str) {
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,;:\-'"&]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

export function hasThumbnailHD(song) {
    return Array.isArray(song.thumbnails) && song.thumbnails.length > 0 &&
        (!song.thumbnails[song.thumbnails.length - 1].height ||
            (!!song.thumbnails[song.thumbnails.length - 1].height &&
                song.thumbnails[song.thumbnails.length - 1].height > 300));
}

export function isLocalUrl(url) {
    return (typeof url === 'string') && (url.startsWith('http://localhost') || !url.startsWith('http'));
}
