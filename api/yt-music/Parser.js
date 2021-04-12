class Parser {

    static parseSuggestions(data) {
        if (data.contents)
            return data.contents[0].searchSuggestionsSectionRenderer.contents.map(s => s.searchSuggestionRenderer.navigationEndpoint.searchEndpoint.query);
        else
            return [];
    }

    static parseSearch(data, categoryName = null) {
        let results = [];
        const sections = data.contents.sectionListRenderer.contents;

        sections.forEach(section => {
            try {
                const items = section.musicShelfRenderer.contents;
                let type = categoryName ? String(categoryName).toLowerCase() : items[0].musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text.toLowerCase();

                // Translations
                if (type === 'titre')
                    type = 'song';
                else if (type === 'artiste')
                    type = 'artist';
                else if (type === 'vidéo')
                    type = 'video';

                if (['song', 'video'].includes(type)) {
                    items.forEach(item => {
                        try {
                            const info0 = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
                            let index = categoryName ? 0 : 2;
                            const authorInfo = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[index];

                            index = categoryName ? 2 : 4;
                            const moreInfo = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[index];

                            const song = {
                                type,
                                id: this.idFromNavigationEndPoint(info0.navigationEndpoint),
                                playlistId: info0.navigationEndpoint ? info0.navigationEndpoint.watchEndpoint.playlistId : null,
                                name: info0.text,
                                author: {
                                    id: this.idFromNavigationEndPoint(authorInfo.navigationEndpoint),
                                    name: authorInfo.text
                                },
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            }

                            if (type === 'song') {
                                song.album = {
                                    id: this.idFromNavigationEndPoint(moreInfo.navigationEndpoint),
                                    name: moreInfo.text
                                };
                            }

                            results.push(song);
                        } catch {}
                    });
                } else if (type === 'playlist') {
                    items.forEach(item => {
                        try {
                            const info0 = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text;
                            const info1 = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text;

                            results.push({
                                type: 'playlist',
                                id: item.musicResponsiveListItemRenderer.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchPlaylistEndpoint.playlistId,
                                name: info0.runs[0].text,
                                trackCount: parseInt(info1.runs[info1.runs.length - 1].text.split(' ')[0]),
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            });
                        } catch {}
                    });
                } else if (type === 'album') {
                    items.forEach(item => {
                        try {
                            const info0 = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text;
                            const info1 = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text;
                            const typeName = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text.toLowerCase();

                            results.push({
                                type: typeName,
                                id: this.idFromNavigationEndPoint(item.musicResponsiveListItemRenderer.navigationEndpoint),
                                name: info0.runs[0].text,
                                author: {
                                    id: info1.runs[2].navigationEndpoint.browseEndpoint.browseId,
                                    name: info1.runs[2].text
                                },
                                year: parseInt(info1.runs[info1.runs.length - 1].text),
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            });
                        } catch {}
                    });
                } else if (type === 'artist') {
                    items.forEach(item => {
                        try {
                            const info = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text;

                            results.push({
                                type: 'artist',
                                id: this.idFromNavigationEndPoint(item.musicResponsiveListItemRenderer.navigationEndpoint),
                                name: info.runs[0].text,
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            });
                        } catch {}
                    });
                }
            } catch {}
        });

        return results;
    }

    static parseTrends(data) {
        const trends = data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;

        return trends.filter(trend => {
                const trendRenderer = trend[Object.keys(trend)[0]];
                return !!trendRenderer.contents;
            })
            .map(trend => {
                const trendRenderer = trend[Object.keys(trend)[0]];
                const items = trendRenderer.contents.map(s => {
                    const item = s[Object.keys(s)[0]];
                    const type = this.pageTypeFromNavigationEndpoint(item.navigationEndpoint);

                    switch (type) {
                        case 'playlist':
                            return {
                                id: this.idFromNavigationEndPoint(item.navigationEndpoint),
                                type,
                                name: item.title.runs[0].text,
                                artistNames: item.subtitle.runs.map(r => r.text).join(''),
                                thumbnails: item.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
                            };

                        case 'album':
                            return {
                                id: this.idFromNavigationEndPoint(item.navigationEndpoint),
                                type,
                                name: item.title.runs[0].text,
                                author: {
                                    id: null,
                                    name: item.subtitle.runs[2].text
                                },
                                thumbnails: item.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
                            };
                    }
                    return null;
                }).filter(i => !!i);

                return {
                    title: trendRenderer.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text,
                    type: items[0] ? items[0].type + 's' : 'playlists',
                    items
                };
            });
    }

    static parseSong(data) {
        const info = data.contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer.tabs[0].tabRenderer.content.musicQueueRenderer.content.playlistPanelRenderer;
        const authorInfo = info.contents[0].playlistPanelVideoRenderer.longBylineText.runs[0];
        const albumInfo = info.contents[0].playlistPanelVideoRenderer.longBylineText.runs[2];

        const song = {
            name: info.title,
            author: {
                id: this.idFromNavigationEndPoint(authorInfo.navigationEndpoint),
                name: authorInfo.text
            },
            thumbnails: info.contents[0].playlistPanelVideoRenderer.thumbnail.thumbnails
        };

        if (albumInfo.navigationEndpoint) {
            song.type = 'song';
            song.album = {
                id: this.idFromNavigationEndPoint(albumInfo.navigationEndpoint),
                name: albumInfo.text
            };
        } else {
            song.type = 'video';
        }

        return song;
    }

    static parseArtist(data) {
        try {
            let songs = [], albums = [], featuredOn = [], fansAlsoLike = [];

            const sections = data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;
            sections.forEach(section => {
                try {
                    // Only parse relevant sections (exclude description section)
                    if (!section.hasOwnProperty('musicShelfRenderer') && !section.hasOwnProperty('musicCarouselShelfRenderer'))
                        return;

                    // 'musicShelfRenderer' = songs section
                    let type = section.hasOwnProperty('musicShelfRenderer') ? 'song' : null;

                    // If not song, find section type
                    const contents = section[Object.keys(section)[0]].contents;
                    if (type !== 'song')
                        type = this.pageTypeFromNavigationEndpoint(contents[0][Object.keys(contents[0])[0]].navigationEndpoint);

                    // Only parse section with known type
                    if (!type)
                        return;

                    switch (type) {
                        case 'song':
                            songs = contents.map(s => {
                                const info = s.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
                                const authorInfo = s.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
                                const albumInfo = s.musicResponsiveListItemRenderer.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0];

                                return {
                                    type: 'song',
                                    id: this.idFromNavigationEndPoint(info.navigationEndpoint),
                                    name: info.text,
                                    author: {
                                        id: this.idFromNavigationEndPoint(s.navigationEndpoint),
                                        name: authorInfo.text
                                    },
                                    album: {
                                        id: albumInfo.navigationEndpoint.browseEndpoint.browseId,
                                        name: albumInfo.text
                                    },
                                    thumbnails: s.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                                };
                            });
                            break;

                        case 'video':
                            songs = songs.concat(contents.map(v => {
                                const authorInfo = v.musicTwoRowItemRenderer.subtitle.runs[0];

                                const video = {
                                    type: 'video',
                                    id: this.idFromNavigationEndPoint(v.musicTwoRowItemRenderer.navigationEndpoint),
                                    name: v.musicTwoRowItemRenderer.title.runs[0].text,
                                    thumbnails: v.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
                                };

                                if (authorInfo.navigationEndpoint) {
                                    video.author = {
                                        id: this.idFromNavigationEndPoint(authorInfo.navigationEndpoint),
                                        name: authorInfo.text
                                    };
                                } else if (authorInfo.text) {
                                    video.author = {
                                        name: authorInfo.text
                                    };
                                }

                                return video;
                            }));
                            break;

                        case 'album':
                            albums = albums.concat(contents.map(a => {
                                const info = a.musicTwoRowItemRenderer.title.runs[0];

                                return {
                                    type: 'album',
                                    id: this.idFromNavigationEndPoint(a.musicTwoRowItemRenderer.navigationEndpoint),
                                    name: info.text,
                                    year: parseInt(a.musicTwoRowItemRenderer.subtitle.runs[a.musicTwoRowItemRenderer.subtitle.runs.length - 1].text),
                                    thumbnails: a.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
                                }
                            }));
                            break;

                        case 'playlist':
                            featuredOn = contents.map(f => {
                                const info = f.musicTwoRowItemRenderer.title.runs[0];

                                const item = {
                                    type: 'playlist',
                                    id: this.idFromNavigationEndPoint(info.navigationEndpoint),
                                    name: info.text,
                                    thumbnails: f.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
                                };

                                if (f.musicTwoRowItemRenderer.subtitle.runs[2]) {
                                    item.author = {
                                        name: f.musicTwoRowItemRenderer.subtitle.runs[2].text
                                    };
                                }

                                return item;
                            });
                            break;

                        case 'artist':
                            fansAlsoLike = contents.map(f => {
                                const info = f.musicTwoRowItemRenderer.title.runs[0];

                                return {
                                    type: 'artist',
                                    id: this.idFromNavigationEndPoint(info.navigationEndpoint),
                                    name: info.text,
                                    thumbnails: f.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
                                }
                            });
                            break;
                    }
                } catch (err) {}
            });

            const artist = {
                songs,
                albums,
                featuredOn,
                fansAlsoLike
            };

            if (data.header.musicImmersiveHeaderRenderer) {
                artist.name = data.header.musicImmersiveHeaderRenderer.title.runs[0].text;
                artist.thumbnails = data.header.musicImmersiveHeaderRenderer.thumbnail ? data.header.musicImmersiveHeaderRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails : [];
            } else if (data.header.musicVisualHeaderRenderer) {
                artist.name = data.header.musicVisualHeaderRenderer.title.runs[0].text;
                artist.thumbnails = data.header.musicVisualHeaderRenderer.foregroundThumbnail.musicThumbnailRenderer.thumbnail.thumbnails;
            }

            return artist;
        } catch (err) {
            return {};
        }
    }

    static parseAlbum(data) {
        let artists = data.frameworkUpdates.entityBatchUpdate.mutations.filter(m => !!m.payload.musicArtist).map(a => {
            const info = a.payload.musicArtist;

            return {
                linkId: info.id,
                id: info.externalChannelId,
                name: info.name,
                thumbnails: info.thumbnailDetails.thumbnails
            }
        });

        let songs = data.frameworkUpdates.entityBatchUpdate.mutations.filter(m => !!m.payload.musicTrack).map(s => {
            const info = s.payload.musicTrack;

            const song = {
                id: info.videoId,
                name: info.title,
                thumbnails: info.thumbnailDetails.thumbnails
            };

            if (info.artists) {
                song.type = 'song';
                song.author = artists.filter(a => info.artists.includes(a.linkId));
            }
            else if (info.artistNames) {
                song.type = 'video';
                song.author = {
                    name: info.artistNames
                }
            }

            return song;
        });

        const info = data.frameworkUpdates.entityBatchUpdate.mutations.find(m => !!m.payload.musicAlbumRelease).payload.musicAlbumRelease;

        const authors = info.primaryArtists ? artists.filter(a => info.primaryArtists.includes(a.linkId)) : artists;

        return {
            name: info.title,
            type: 'album',
            thumbnails: info.thumbnailDetails.thumbnails,
            author: authors,
            year: parseInt(info.releaseDate.year),
            songs
        };
    }

    static parsePlaylist(data) {
        const musicDetail = data.header.musicDetailHeaderRenderer;

        return {
            type: 'playlist',
            name: musicDetail.title.runs[0].text,
            trackCount: data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.collapsedItemCount,
            thumbnails: musicDetail.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails,
            songs: this.parsePlaylistContents(data)
        };
    }

    static parsePlaylistContents(data) {
        let playlistContents;
        if (Object.keys(data).includes('continuationContents'))
            playlistContents = data.continuationContents.musicPlaylistShelfContinuation.contents;
        else
            playlistContents = data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.contents;

        playlistContents = playlistContents
            .map(s => this.parsePlaylistSong(s.musicResponsiveListItemRenderer))
            .filter(s => !!s);

        return playlistContents;
    }

    static parsePlaylistSong(item) {
        try {
            const videoInfo = item.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
            const authorInfo = item.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
            const albumInfo = Array.isArray(item.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs) ?
                item.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0] : null;

            const song = {
                type: albumInfo ? 'song' : 'video',
                id: this.idFromNavigationEndPoint(videoInfo.navigationEndpoint),
                name: videoInfo.text,
                author: {
                    id: authorInfo.navigationEndpoint.browseEndpoint.browseId,
                    name: authorInfo.text
                },
                thumbnails: item.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
            };

            if (albumInfo) {
                song.album = {
                    id: this.idFromNavigationEndPoint(albumInfo.navigationEndpoint),
                    name: albumInfo.text
                }
            }

            return song;
        } catch(err) {
            return null;
        }
    }

    static getPlaylistContinuation(data) {
        try {
            let continuations;
            if (Object.keys(data).includes('continuationContents'))
                continuations = data.continuationContents.musicPlaylistShelfContinuation.continuations;
            else
                continuations = data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.continuations;
            return continuations.find(c => typeof c.nextContinuationData === 'object').nextContinuationData;
        } catch (err) {
            return null;
        }

    }

    static idFromNavigationEndPoint(nav) {
        if (!nav)
            return null;
        const endpoint = nav.watchEndpoint || nav.browseEndpoint;
        return endpoint.browseId || endpoint.videoId;
    }

    static pageTypeFromNavigationEndpoint(navigationEndpoint) {
        if (navigationEndpoint.watchEndpoint)
            return 'video'
        else if (navigationEndpoint.browseEndpoint) {
            const pageType = navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType.toLowerCase();
            if (pageType.includes('playlist'))
                return 'playlist';
            else if (pageType.includes('artist'))
                return 'artist';
            else if (pageType.includes('album'))
                return 'album';
        }
        return null;
    }

}

module.exports = Parser;
