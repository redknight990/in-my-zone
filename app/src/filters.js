import Vue from 'vue';
import { isLocalUrl } from './assets/plugins/utils.js';

export function artist(value) {
    if (!value)
        return '';
    else if (Array.isArray(value.author))
        return value.author.map(a => a.name).join(', ');
    else if (typeof value.author === 'object')
        return value.author.name;
    else
        return '';
}

Vue.filter('artist', artist);

const proxy = `${process.env.VUE_APP_API_URL}/cors/`;

export function thumbnailHD(value, withProxy = true) {
    if (!value)
        return require('./assets/img/playlist.png');
    else if (Array.isArray(value.thumbnails) && value.thumbnails.length > 0) {
        withProxy = withProxy && !isLocalUrl(value.thumbnails[value.thumbnails.length - 1].url);
        return (withProxy ? proxy : '') + value.thumbnails[value.thumbnails.length - 1].url;
    }
    else if (value.thumbnails && value.thumbnails.url) {
        withProxy = withProxy && !isLocalUrl(value.thumbnails.url);
        return (withProxy ? proxy : '') + value.thumbnails.url;
    }
    else
        return null;
}

Vue.filter('thumbnailHD', thumbnailHD);

export function thumbnail(value, withProxy = true) {
    if (!value)
        return require('./assets/img/playlist.png');
    else if (Array.isArray(value.thumbnails) && value.thumbnails.length > 0) {
        withProxy = withProxy && !isLocalUrl(value.thumbnails[0].url);
        return (withProxy ? proxy : '') + value.thumbnails[0].url;
    }
    else if (value.thumbnails && value.thumbnails.url) {
        withProxy = withProxy && !isLocalUrl(value.thumbnails.url);
        return (withProxy ? proxy : '') + value.thumbnails.url;
    }
    else
        return null;
}

Vue.filter('thumbnail', thumbnail);
