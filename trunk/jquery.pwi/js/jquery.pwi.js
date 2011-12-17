/**
 * Picasa Webalbum Integration jQuery plugin
 * This library was inspired aon pwa by Dieter Raber
 * @name jquery.pwi.js
 * @author Jeroen Diderik - http://www.jdee.nl/
 * @author Johan Borkhuis - http://www.borkhuis.com/
 * @revision 2.0.0 Beta
 * @date December 18, 2011
 * @copyright (c) 2010-2011 Jeroen Diderik(www.jdee.nl)
 * @license Creative Commons Attribution-Share Alike 3.0 Netherlands License - http://creativecommons.org/licenses/by-sa/3.0/nl/
 * @Visit http://pwi.googlecode.com/ for more informations, duscussions etc about this library
 */
(function ($) {
    var elem, opts = {};
    $.fn.pwi = function (opts) {
        var $self, settings = {};
        opts = $.extend(true,{}, $.fn.pwi.defaults, opts);
        if (opts.popupPlugin == "") {
            // Detect the popup plugin type
            if ($.fn.fancybox) {
                opts.popupPlugin = "fancybox";
            }
            else if($.fn.colorbox) {
                opts.popupPlugin = "colorbox";
            }
            else if($.fn.slimbox) {
                opts.popupPlugin = "slimbox";
            }
        }

        if (opts.popupExt == "") {
            if (opts.popupPlugin === "fancybox")
            {
                opts.popupExt = function(photos, rel){
                    rel = typeof(rel) != "undefined" ? rel : "lb";
                    if (rel === "lb") {     // Settings for normal photos
                        photos.fancybox(opts.fancybox_config.config_photos);
                    }
                    else if (rel === "yt") {     // Settings for youtube videos
                        photos.fancybox(opts.fancybox_config.config_youtube);
                    }
                    else if (rel === "sl") {     // Settings for slideshows
                        photos.fancybox(opts.fancybox_config.config_slideshow);
                    }
                    else if (rel === "map") {    // Settings for maps
                        photos.fancybox(opts.fancybox_config.config_maps);
                    }
                };
            }
            else if(opts.popupPlugin === "colorbox")
            {
                opts.popupExt = function(photos, rel){
                    rel = typeof(rel) != "undefined" ? rel : "lb";
                    if (rel === "lb") {     // Settings for normal photos
                        photos.colorbox(opts.colorbox_config.config_photos);
                    }
                    else if (rel === "yt") {     // Settings for youtube videos
                        photos.colorbox(opts.colorbox_config.config_youtube);
                    }
                    else if (rel === "sl") {     // Settings for slideshows
                        photos.colorbox(opts.colorbox_config.config_slideshow);
                    }
                    else if (rel === "map") {    // Settings for maps
                        photos.colorbox(opts.colorbox_config.config_maps);
                    }
                };
            }
        }

        elem = this;
        function _initialize() {
            settings = opts;
            ts = new Date().getTime();
            settings.id = ts;
            $self = $("<div id='pwi_" + ts + "'/>").appendTo(elem);
            $self.addClass('pwi_container');
            _start();
            return false;
        }
        function _start() {
            if (settings.username === '') {
                alert('Make sure you specify at least your username.' + '\n' +
                        'See http://pwi.googlecode.com for more info');
                return;
            }
            if (settings.useQueryParameters) {
                var $url=document.URL.split("?", 2);
                if ($url.length == 2) {
                    var $queryParams = $url[1].split("&");
                    var $queryActive = false;
                    var $page = 1;
                    for ($queryParam in $queryParams) {
                        var $split = $queryParams[$queryParam].split("=", 2);
                        if ($split.length == 2) {
                            if ($split[0] == 'pwi_album_selected') {
                                settings.mode = 'album';
                                settings.album = $split[1];
                                $queryActive = true;
                            }
                            if ($split[0] == 'pwi_albumpage') {
                                $page = $split[1];
                            }
                            if ($split[0] == 'pwi_showpermalink') {
                                settings.showPermaLink = true;
                            }
                        }
                    }
                    if ($queryActive) {
                        settings.page = $page;
                        settings.showPermaLink = false;
                    }
                }
            }

            switch (settings.mode) {
                case 'latest':
                    getLatest();
                    break;
                case 'album':
                    getAlbum();
                    break;
                case 'keyword':
                    getAlbum();
                    break;
                default:
                    getAlbums();
                    break;
            }
        }

        // Function:        formatDate
        // Description:     Format date to <day>-<month>-<year>
        // Parameters:      $dt: String containing a numeric date/time
        // Return:          Date string
        function formatDate($dt) {
            var $today = new Date(Number($dt)),
            $year = $today.getUTCFullYear();
            if ($year < 1000) {
                $year += 1900;
            }
            return ($today.getUTCDate() + "-" + ($today.getUTCMonth() + 1) + "-" + $year);
        }

        // Function:        formatDateTime
        // Description:     Format date to <day>-<month>-<year> <hours>:<minutes>
        //                  Time is only shown when not equal to 00:00
        // Parameters:      $dt: String containing a numeric date/time
        // Return:          Date/Time string
        function formatDateTime($dt) {
            var $today = new Date(Number($dt));
            $year = $today.getUTCFullYear();
            if ($year < 1000) {
                $year += 1900;
            }
            if ($today == "Invalid Date") {
                return $dt;
            } else {
                if (($today.getUTCHours() == 0) && ($today.getUTCMinutes() == 0) &&
                    ($today.getUTCSeconds() == 0)) {
                    return ($today.getUTCDate() + "-" + ($today.getUTCMonth() + 1) + "-" + $year);
                } else {
                    return ($today.getUTCDate() + "-" + ($today.getUTCMonth() + 1) + "-" + $year +
                            " " + $today.getUTCHours() + ":" + ($today.getUTCMinutes() < 10 ? "0" +
                                $today.getUTCMinutes() : $today.getUTCMinutes()));
                }
            }
        }

        // Function:        sortData
        // Description:     Sort array according to sortMode
        // Parameters:      j: array containing all photo or album records
        //                  sortMode: mode to sort; name or date; ascending or descending
        // Return:          Sorted array
        function sortData(entries, sortMode) {
            if (sortMode === "none")
                return;

            function ascDateSort(a, b) {
                return Number(a.gphoto$timestamp.$t) > Number(b.gphoto$timestamp.$t);
            }
            function descDateSort(a, b) {
                return Number(a.gphoto$timestamp.$t) < Number(b.gphoto$timestamp.$t);
            }
            function ascNameSort(a, b) {
                var nameA = a.title.$t.toLowerCase( );
                var nameB = b.title.$t.toLowerCase( );
                if (nameA < nameB) {return -1}
                if (nameA > nameB) {return 1}
                return 0;
            }
            function descNameSort(a, b) {
                var nameA = a.title.$t.toLowerCase( );
                var nameB = b.title.$t.toLowerCase( );
                if (nameA > nameB) {return -1}
                if (nameA < nameB) {return 1}
                return 0;
            }

            if (sortMode === "ASC_DATE") {
                entries.sort(ascDateSort);
            } else if (sortMode === "DESC_DATE") {
                entries.sort(descDateSort);
            } else if (sortMode === "ASC_NAME") {
                entries.sort(ascNameSort);
            } else if (sortMode === "DESC_NAME") {
                entries.sort(descNameSort);
            }
        }


        // Function:        alignPictures
        // Description:     Align all pictures horizontally and vertically
        // Parameters:      divName: Name of the div containing the pictures
        // Return:          none
        function alignPictures(divName) {
            // Now make sure all divs have the same width and heigth
            var divHeigth = 0;
            var divWidth = 0;
            $(divName).each(function(index, element) {
                if (element.clientHeight > divHeigth)
                    divHeigth = element.clientHeight;
                if (element.clientWidth > divWidth)
                    divWidth = element.clientWidth;
            });
            $(divName).css('height', (divHeigth+2)+'px');
            if (settings.thumbAlign == 1) {
                $(divName).css('width', (divWidth+2)+'px');
            }
        }


        // Function:        photo
        // Description:     Create a photo-div
        // Parameters:      j: array containing all photo or album records
        //                  sortMode: mode to sort; name or date; ascending or descending
        // Return:          Sorted array
        function photo(j, hidden, username) {
            var $html, $d = "", $c = "", $youtubeId = "";
            if (j.summary) {
                var $matched = j.summary.$t.match(/\[youtube\s*:\s*(.*)\s*\](.*)/);
                if ($matched) { // Found youtube video entry
                    $youtubeId = $matched[1];
                    $c = $matched[2].replace(/\n/g, '<br />\n');
                } else {
                    $c = j.summary.$t.replace(/\n/g, '<br />\n');
                }
            }
            if (settings.showPhotoDate) {
                if ((j.exif$tags) && (j.exif$tags.exif$time)) {
                    $d = formatDateTime(j.exif$tags.exif$time.$t);
                } else if (j.gphoto$timestamp) {
                    $d = formatDateTime(j.gphoto$timestamp.$t);
                } else {
                    $d = formatDateTime(j.published.$t);
                }
                $d += " ";
            }
            if (hidden)
            {
                $html = $("<div class='pwi_photo' style='display: none'/>");
                if ($youtubeId == "") {
                    $html.append("<a href='" + j.media$group.media$thumbnail[1].url + "' rel='lb-" +
                            username + "' title='" + $d + "'></a>");
                }
                else if (settings.popupPlugin !== "slimbox") {
                    $html.append("<a class='iframe' href='http://www.youtube.com/embed/" +
                            $youtubeId + "?autoplay=1&rel=0&hd=1' rel='yt-" + username +
                            "' title='" + $d + "'></a>");
                } else {
                    $html.append("<a href='" + j.media$group.media$thumbnail[1].url +
                            "' rel='lb-" + username + "' title='" + $d  + " (" +
                            settings.labels.videoNotSupported + ")'></a>");
                }
                if(settings.showPhotoDownloadPopup) {
                    var $downloadDiv = $("<div style='display: none'/>");
                    $downloadDiv.append("<a class='downloadlink' href='" +
                            j.media$group.media$content[0].url + "'/>");
                    $html.append($downloadDiv);
                }
                return $html;
            }
            else
            {
                $d += $c.replace(new RegExp("'", "g"), "&#39;");
                $html = $("<div class='pwi_photo' style='cursor: pointer;'/>");
                if ($youtubeId == "") {
                    $html.append("<a href='" + j.media$group.media$thumbnail[1].url + "' rel='lb-" +
                            username + "' title='" + $d + "'><img src='" + j.media$group.media$thumbnail[0].url +
                            "' height='" + j.media$group.media$thumbnail[0].height +
                            "' width='" + j.media$group.media$thumbnail[0].width + "'/></a>");
                }
                else {
                    if (settings.popupPlugin !== "slimbox") {
                        $html.append("<a class='" + (settings.popupPlugin === "fancybox" ?
                                    "fancybox.iframe" : "iframe") +
                                "' href='http://www.youtube.com/embed/" + $youtubeId +
                                "?autoplay=1&rel=0&hd=1&autohide=1' rel='yt-" + username +
                                "' title='" + $d + "'><img id='main' src='" + j.media$group.media$thumbnail[0].url  +
                                "' height='" + j.media$group.media$thumbnail[0].height +
                                "' width='" + j.media$group.media$thumbnail[0].width + "'/>" +
                                "<img id='video' src='" + settings.videoBorder +
                                "' height='" + j.media$group.media$thumbnail[0].height + "' /></a>");
                    }
                    else {
                        $html.append("<a href='" + j.media$group.media$thumbnail[1].url +
                                "' rel='lb-" + username + "' title='" + $d + " (" +
                                settings.labels.videoNotSupported + ")'>" +
                                "<img src='" + j.media$group.media$thumbnail[0].url +
                                "' height='" + j.media$group.media$thumbnail[0].height +
                                "' width='" + j.media$group.media$thumbnail[0].width + "'/></a>");
                    }
                }
                if(settings.showPhotoDownloadPopup) {
                    var $downloadDiv = $("<div style='display: none'/>");
                    $downloadDiv.append("<a class='downloadlink' href='" +
                            j.media$group.media$content[0].url + "'/>");
                    $html.append($downloadDiv);
                }
                if((settings.showPhotoLocation) || (settings.showPhotoCaption)) {
                    $html.append("<br/>");
                    if((settings.popupPlugin !== "slimbox") && (settings.showPhotoLocation) &&
                       (settings.mapIconLocation != "")) {
                        if((j.georss$where) && (j.georss$where.gml$Point) &&
                           (j.georss$where.gml$Point.gml$pos)) {
                            var $locationLink = $("<a class='" +
                                    (settings.popupPlugin === "fancybox" ? "fancybox.iframe" : "iframe") +
                                    "' href='http://maps.google.com/?output=embed&t=h&z=15&q=" +
                                    j.georss$where.gml$Point.gml$pos.$t +
                                    "' rel='map-" + settings.username + "'>" +
                                    "<img src='" + settings.mapIconLocation + "'></a>");
                            $html.append($locationLink);
                        }
                    }
                    if (settings.showPhotoCaption) {
                        if (settings.showPhotoCaptionDate && settings.showPhotoDate) { $c = $d; }
                        if(settings.showPhotoDownload) {
                            $c += '<a href="' + j.media$group.media$content[0].url + '">' +
                                settings.labels.downloadphotos + '</a>';
                        }
                        if ($c.length > settings.showCaptionLength) {
                            $c = $c.substring(0, settings.showCaptionLength);
                        }
                        $html.append($c);
                    }
                }
                if (typeof (settings.onclickThumb) === "function") {
                    var obj = j; $html.bind('click.pwi', obj, clickThumb);
                }

                return $html;
            }
        }

        function albums(j) {
            var $scAlbums = $("<div/>"), i = 0;
            var $startDate, $endDate;
            if (navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)/i) == null) {
                $startDate = new Date(settings.albumStartDateTime);
                if (isNaN($startDate)) {
                    $startDate = new Date(settings.albumStartDateTime.replace(/-/g, "/"));
                }
                $endDate = new Date(settings.albumEndDateTime);
                if (isNaN($endDate)) {
                    $endDate = new Date(settings.albumEndDateTime.replace(/-/g, "/"));
                }
            } else {
                $startDate = new Date(settings.albumStartDateTime.replace(/-/g, "/"));
                $endDate = new Date(settings.albumEndDateTime.replace(/-/g, "/"));
            }

            sortData(j.feed.entry, settings.sortAlbums);

            // Select albums to show
            var $albumCounter = 0;
            var $albumsToShow = $.grep(j.feed.entry, function(n, i) {
                if (i >= settings.albumMaxResults) return false;
                var $albumDate = new Date(Number(n.gphoto$timestamp.$t));
                if ((($.inArray(n.gphoto$name.$t, settings.albums) > -1) || 
                     (settings.albums.length === 0)) &&
                    ($.inArray(n.gphoto$name.$t, settings.removeAlbums) == -1) && 
                    ((n.gphoto$albumType === undefined) ||
                     ($.inArray(n.gphoto$albumType.$t, settings.removeAlbumTypes) == -1)) &&
                    ((settings.albumStartDateTime == "" || $albumDate >= $startDate) &&
                     (settings.albumEndDateTime == "" || $albumDate <= $endDate))) {

                    var $keywordMatch = true;
                    if (settings.albumKeywords.length > 0) {
                        $keywordMatch = false;
                        var $matched = n.summary.$t.match(/\[keywords\s*:\s*(.*)\s*\]/);
                        if ($matched) {
                            var $keywordArray = new Array();
                            var $keywords= $matched[1].split(/,/);
                            for (var p in $keywords) {
                                var $newmatch = $keywords[p].match(/\s*['"](.*)['"]\s*/);
                                if ($newmatch) {
                                    $keywordArray.push($newmatch[1]);
                                }
                            }
                            if ($keywordArray.length > 0) {
                                $keywordMatch = true;
                                for (var p in settings.albumKeywords) {
                                    if ($.inArray(settings.albumKeywords[p], $keywordArray) < 0) {
                                        $keywordMatch = false;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if ($keywordMatch == false) 
                        return false;

                    $albumCounter++;
                    if (($albumCounter >  (settings.albumsPerPage * settings.albumPage)) ||
                        ($albumCounter <= (settings.albumsPerPage * (settings.albumPage - 1))))
                        return false;
                    else
                        return true;
                }
                return false;
            });

            if ($albumsToShow.length == 0) {
                $scAlbums = $("<div class='pwi_album_description'/>");
                $scAlbums.append("<div class='title'>" + settings.labels.noalbums + "</div>");
                show(false, $scAlbums);
                return;
            }

            // Show the selected albums
            $.each($albumsToShow, function(i, n) {
                var $scAlbum = $("<div class='pwi_album' style='cursor: pointer;'/>");
                $scAlbum.bind('click.pwi', n, function (e) {
                    e.stopPropagation();
                    settings.page = 1;
                    settings.album = e.data.gphoto$name.$t;
                    if (typeof (settings.onclickAlbumThumb) === "function") {
                        settings.onclickAlbumThumb(e);
                        return false;
                    } else {
                        getAlbum();
                        return false;
                    }
                });
                if (settings.showAlbumThumbs) {
                    $scAlbum.append("<img src='" + n.media$group.media$thumbnail[0].url +
                            "' height='" + n.media$group.media$thumbnail[0].height +
                            "' width='" + n.media$group.media$thumbnail[0].width + "'/>");
                }
                if (settings.showAlbumTitles) {
                    $scAlbum.append("<br/>" +
                            ((n.title.$t.length > settings.showAlbumTitlesLength) ?
                             n.title.$t.substring(0, settings.showCaptionLength) :
                             n.title.$t) + "<br/>" +
                            (settings.showAlbumdate ? formatDate(n.gphoto$timestamp.$t) : "") +
                            (settings.showAlbumPhotoCount ? "&nbsp;&nbsp;&nbsp;&nbsp;" +
                             n.gphoto$numphotos.$t + " " +
                             ((n.gphoto$numphotos.$t == "1") ? settings.labels.photo :  settings.labels.photos) : ""));
                }
                $scAlbums.append($scAlbum);
            });

            $scAlbums.append("<div style='clear: both;height:0px;'/>");

            // less albums-per-page then max so paging
            if ($albumCounter > settings.albumsPerPage) {
                var $pageCount = ($albumCounter / settings.albumsPerPage);
                var $ppage = $("<div class='pwi_prevpage'/>").text(settings.labels.prev),
                $npage = $("<div class='pwi_nextpage'/>").text(settings.labels.next);
                $navRow = $("<div class='pwi_pager'/>");
                if (settings.albumPage > 1) {
                    $ppage.addClass('link').bind('click.pwi', function (e) {
                        e.stopPropagation();
                        settings.albumPage = (parseInt(settings.albumPage, 10) - 1);
                        albums(j);
                        return false;
                    });
                }
                $navRow.append($ppage);
                for (var p = 1; p < $pageCount + 1; p++) {
                    if (p == settings.albumPage) {
                        tmp = "<div class='pwi_pager_current'>" + p + "</div> ";
                    } else {
                        tmp = $("<div class='pwi_pager_page'>" + p + "</div>").bind('click.pwi', p, function (e) {
                            e.stopPropagation();
                            settings.albumPage = e.data;
                            albums(j);
                            return false;
                        });
                    }
                    $navRow.append(tmp);
                }
                if (settings.albumPage < $pageCount) {
                    $npage.addClass('link').bind('click.pwi', function (e) {
                        e.stopPropagation();
                        settings.albumPage = (parseInt(settings.albumPage, 10) + 1);
                        albums(j);
                        return false;
                    });
                }
                $navRow.append($npage);
                $navRow.append("<div style='clear: both;height:0px;'/>");

                if ($navRow.length > 0 && (settings.showPager === 'both' || settings.showPager === 'top')) {
                    $scAlbums.prepend($navRow.clone(true));
                }
                if ($navRow.length > 0 && (settings.showPager === 'both' || settings.showPager === 'bottom')) {
                    $scAlbums.append($navRow);
                }
            }

            // end paging

            settings.albumstore = j;
            show(false, $scAlbums);

            alignPictures('div.pwi_album');
        }

        function album(j) {
            var $scPhotos, $scPhotosDesc, tmp = "",
                $np = j.feed.openSearch$totalResults.$t,
                $at = "", $navRow = "",
                $loc = j.feed.gphoto$location === undefined ? "" : j.feed.gphoto$location.$t,
                $ad,
                $album_date = formatDate(j.feed.gphoto$timestamp === undefined ? '' : j.feed.gphoto$timestamp.$t),
                $item_plural = ($np == "1") ? false : true;
            var $relUsername = settings.username.replace(/[@\.]/g, "_");

            if (j.feed.subtitle === undefined) {
                $ad = "";
            } else {
                var $matched = j.feed.subtitle.$t.match(/\[keywords\s*:\s*.*\s*\](.*)/);
                if ($matched) {
                    $ad = $matched[1];
                } else {
                    $ad = j.feed.subtitle.$t;
                }
            }

            $at = (j.feed.title === "undefined" || settings.albumTitle.length > 0) ? settings.albumTitle : j.feed.title.$t;
            $scPhotos = $("<div/>");
            if (settings.mode != 'album' && settings.mode != 'keyword') {
                tmp = $("<div class='pwi_album_backlink'>" + settings.labels.albums + "</div>").bind('click.pwi', function (e) {
                    e.stopPropagation();
                    getAlbums();
                    return false;
                });
                $scPhotos.append(tmp);
            }
            if (settings.showAlbumDescription) {
                $scPhotosDesc = $("<div class='pwi_album_description'/>");
                $scPhotosDesc.append("<div class='title'>" + $at + "</div>");
                $scPhotosDesc.append("<div class='details'>" + $np + " " +
                        ($item_plural ? settings.labels.photos : settings.labels.photo) +
                        (settings.showAlbumdate ? ", " + $album_date : "") +
                        (settings.showAlbumLocation && $loc ? ", " + $loc : "") + "</div>");
                $scPhotosDesc.append("<div class='description'>" + $ad + "</div>");
                $scPhotos.append($scPhotosDesc);
            }

            if ((settings.showSlideshowLink) || (settings.showSlideshow)) {
                if (settings.mode === 'keyword' || settings.keyword !== "") {
                    //alert("currently not supported");
                } else if (settings.popupPlugin === "slimbox") {
                    $scPhotos.append("<div><a href='http://picasaweb.google.com/" +
                            settings.username + "/" + j.feed.gphoto$name.$t + "" +
                            ((settings.authKey !== "") ? "?authkey=" + settings.authKey : "") +
                            "#slideshow/" + j.feed.entry[0].gphoto$id.$t +
                            "' rel='gb_page_fs[]' target='_new' class='sslink'>" +
                            settings.labels.slideshow + "</a></div>");
                } else {
                    var $isIE6 = !$.support.opacity && !window.XMLHttpRequest;
                    var $slideShow = $("<div class='pwi_slideshow'/>");
                    if ((settings.popupPlugin === "colorbox") || ($isIE6) ||
                        (navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)/i) != null)) {
                        for (var i = 0; i < j.feed.link.length; i++) {
                            if ((j.feed.link[i].type == "text/html") &&
                                (j.feed.link[i].rel == "alternate")) {
                                $slideShow.append("<a class='iframe' href='" + j.feed.link[i].href +
                                        "#slideshow/' rel='sl-" + $relUsername + "'>" +
                                        settings.labels.slideshow + "</a><br>");
                                break;
                            }
                        }
                    } else {
                        for (var i = 0; i < j.feed.link.length; i++) {
                            if (j.feed.link[i].type == "application/x-shockwave-flash") {
                                $slideShow.append("<a class='iframe' href='" + j.feed.link[i].href +
                                        "' rel='sl-" + $relUsername + "'>" +
                                        settings.labels.slideshow + "</a><br>");
                                break;
                            }
                        }
                    }
                    $scPhotos.append($slideShow);
                    $scPhotos.append("<div style='clear: both;height:0px;'/>");
                }
            }

            if ($np > settings.maxResults) {
                $pageCount = ($np / settings.maxResults);
                var $ppage = $("<div class='pwi_prevpage'/>").text(settings.labels.prev),
                $npage = $("<div class='pwi_nextpage'/>").text(settings.labels.next);
                $navRow = $("<div class='pwi_pager'/>");
                if (settings.page > 1) {
                    $ppage.addClass('link').bind('click.pwi', function (e) {
                        e.stopPropagation();
                        settings.page = (parseInt(settings.page, 10) - 1);
                        getAlbum();
                        return false;
                    });
                }
                $navRow.append($ppage);
                for (var p = 1; p < $pageCount + 1; p++) {
                    if (p == settings.page) {
                        tmp = "<div class='pwi_pager_current'>" + p + "</div> ";
                    } else {
                        tmp = $("<div class='pwi_pager_page'>" + p + "</div>").bind('click.pwi', p, function (e) {
                            e.stopPropagation();
                            settings.page = e.data;
                            getAlbum();
                            return false;
                        });
                    }
                    $navRow.append(tmp);
                }
                if (settings.page < $pageCount) {
                    $npage.addClass('link').bind('click.pwi', function (e) {
                        e.stopPropagation();
                        settings.page = (parseInt(settings.page,10) + 1);
                        getAlbum();
                        return false;
                    });
                }
                $navRow.append($npage);
                $navRow.append("<div style='clear: both;height:0px;'/>");
            }

            if ($navRow.length > 0 && (settings.showPager === 'both' || settings.showPager === 'top')) {
                $scPhotos.append($navRow);
            }

            sortData(j.feed.entry, settings.sortPhotos);

            var startShow = ((settings.page - 1) * settings.maxResults);
            var endShow = settings.maxResults * settings.page;
            for (var i = 0; i < $np; i++)
            {
                var $scPhoto = photo(j.feed.entry[i], !((i >= startShow) && (i < endShow)), $relUsername);
                $scPhotos.append($scPhoto);
            }

            if ($navRow.length > 0 && (settings.showPager === 'both' || settings.showPager === 'bottom')) {
                $scPhotos.append($navRow.clone(true));
            }

            if (settings.showPermaLink) {
                $scPhotos.append("<div style='clear: both;height:0px;'/>");
                var $permaLinkEnable = $("<div id='permalinkenable' class='pwi_nextpage'/>").text(settings.labels.showPermaLink).bind('click.pwi', p, function (e) {
                            e.stopPropagation();
                            var ele = document.getElementById("permalinkbox");
                            if (ele) {ele.style.display = "block";}
                            ele = document.getElementById("permalinkenable");
                            if (ele) {ele.style.display = "none";}
                            return false;
                        });
;
                var $url=document.URL.split("?", 2);
                var $permalinkUrl = $url[0] + "?pwi_album_selected=" + j.feed.gphoto$name.$t +
                        "&pwi_albumpage=" + settings.page;

                $scPhotos.append($permaLinkEnable);
                var $permaShowBox = $("<div style='display:none;' id='permalinkbox' />");
                var $permaShowBoxForm = $("<form />");
                var $permalinkInputBox = $("<input type='text' size='40' name='PermaLink' readonly />").val($permalinkUrl);
                $permaShowBoxForm.append($permalinkInputBox);
                $permaShowBox.append($permaShowBoxForm);
                $scPhotos.append($permaShowBox);
            }


            settings.photostore[settings.album] = j;
            var $s = $(".pwi_photo", $scPhotos).css(settings.thumbCss);
            if ((settings.popupPlugin === "fancybox") || (settings.popupPlugin === "colorbox")) {
                settings.popupExt($s.find("a[rel='lb-" + $relUsername + "']"));
                settings.popupExt($s.find("a[rel='yt-" + $relUsername + "']"), "yt");
                settings.popupExt($s.find("a[rel='sl-" + $relUsername + "']"), "sl");
                settings.popupExt($s.find("a[rel='map-" + $relUsername + "']"), "map");
            } else if (settings.popupPlugin === "slimbox") {
                $s.find("a[rel='lb-" + $relUsername + "']").slimbox(settings.slimbox_config,
                    function(el) {
                        var $newTitle = el.title;
                        if (el.parentNode.childElementCount > 1) {
                            var $links = $(".downloadlink", el.parentNode);
                            if ($links.length > 0) {
                                var downloadLink = '<a href="' + $links[0].href + '">Download</a>';
                                $newTitle = el.title + "&nbsp;&nbsp;" + downloadLink;
                            }
                        }
                        return [el.href, $newTitle];
                    }
                );
            }

            $scPhotos.append("<div style='clear: both;height:0px;'/>");

            show(false, $scPhotos);

            alignPictures('div.pwi_photo');
        }

        function latest(j) {
            var $scPhotos = $("<div/>"),
            $len = j.feed ? j.feed.entry.length : 0,
            i = 0;
            var $relUsername = settings.username.replace(/[@\.]/g, "_");

            sortData(j.feed.entry, settings.sortPhotos);

            while (i < settings.maxResults && i < $len) {
                var $scPhoto = photo(j.feed.entry[i], false, $relUsername);
                $scPhotos.append($scPhoto);
                i++;
            }
            $scPhotos.append("<div style='clear: both;height:0px;'> </div>");
            var $s = $("div.pwi_photo", $scPhotos).css(settings.thumbCss);
            if ((settings.popupPlugin === "fancybox") || (settings.popupPlugin === "colorbox")) {
                settings.popupExt($s.find("a[rel='lb-" + $relUsername + "']"));
                settings.popupExt($s.find("a[rel='yt-" + $relUsername + "']"), "yt");
                settings.popupExt($s.find("a[rel='sl-" + $relUsername + "']"), "sl");
                settings.popupExt($s.find("a[rel='map-" + $relUsername + "']"), "map");
            } else if (settings.popupPlugin === "slimbox") {
                $s.find("a[rel='lb-" + $relUsername + "']").slimbox(settings.slimbox_config,
                    function(el) {
                        var $newTitle = el.title;
                        if (el.parentNode.childElementCount > 1) {
                            var $links = $(".downloadlink", el.parentNode);
                            if ($links.length > 0) {
                                var downloadLink = '<a href="' + $links[0].href + '">Download</a>';
                                $newTitle = el.title + "&nbsp;&nbsp;" + downloadLink;
                            }
                        }
                        return [el.href, $newTitle];
                    }
                );
            }
            show(false, $scPhotos);

            alignPictures('div.pwi_photo');
        }

        function clickAlbumThumb(event) {
            event.stopPropagation();
            event.preventDefault();
            settings.onclickAlbumThumb(event);
        }

        function clickThumb(event) {
            event.stopPropagation();
            event.preventDefault();
            settings.onclickThumb(event);
        }

        function getAlbums() {
            if (settings.albumstore.feed) {
                albums(settings.albumstore);
            } else {
                show(true, '');
                var $u = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username +
                    '?kind=album&access=' + settings.albumTypes + '&alt=json&thumbsize=' +
                    settings.albumThumbSize + ((settings.albumCrop == 1) ? "c" : "u");
                $.getJSON($u, 'callback=?', albums);
            }
            return $self;
        }

        function checkPhotoSize(photoSize) {
            var $allowedSizes = [94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600];
            if (settings.photoSize === "auto") {
                var $windowHeight = $(window).height();
                var $windowWidth = $(window).width();
                var $minSize = ($windowHeight > $windowWidth) ? $windowWidth : $windowHeight;
                for (var i = 1; i < $allowedSizes.length; i++) {
                    if ($minSize < $allowedSizes[i]) {
                        return $allowedSizes[i-1];
                    }
                }
            }
            else {
                return photoSize;
            }
        }

        function getAlbum() {
            if (settings.photostore[settings.album]) {
                album(settings.photostore[settings.album]);
            } else {
                var $u = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username +
                    ((settings.album !== "") ? '/album/' + settings.album : "") + '?kind=photo&alt=json' +
                    ((settings.authKey !== "") ? "&authkey=" + settings.authKey : "") +
                    ((settings.keyword !== "") ? "&tag=" + settings.keyword : "") +
                    '&imgmax=d&thumbsize=' + settings.thumbSize +
                    ((settings.thumbCrop == 1) ? "c" : "u") + "," + checkPhotoSize(settings.photoSize);
                show(true, '');
                $.getJSON($u, 'callback=?', album);
            }
            return $self;
        }

        function getLatest() {
            show(true, '');
            var $u = 'http://picasaweb.google.com/data/feed/api/user/' + settings.username +
                (settings.album !== "" ? '/album/' + settings.album : '') +
                '?kind=photo&max-results=' + settings.maxResults + '&alt=json&q=' +
                ((settings.authKey !== "") ? "&authkey=" + settings.authKey : "") +
                ((settings.keyword !== "") ? "&tag=" + settings.keyword : "") +
                '&imgmax=d&thumbsize=' + settings.thumbSize +
                ((settings.thumbCrop == 1) ? "c" : "u") + "," + checkPhotoSize(settings.photoSize);
            $.getJSON($u, 'callback=?', latest);
            return $self;
        }

        function show(loading, data) {
            if (loading) {
                if (settings.loadingImage.length > 0) {
                    var ele = document.getElementById(settings.loadingImage);
                    if (ele) {ele.style.display = "block";}
                }
                document.body.style.cursor = "wait";
                if ($.blockUI){ $self.block(settings.blockUIConfig);}
            } else {
                if (settings.loadingImage.length > 0) {
                    var ele = document.getElementById(settings.loadingImage);
                    if (ele) {ele.style.display = "none";}
                }
                document.body.style.cursor = "default";
                if ($.blockUI){ $self.unblock(); }
                $self.html(data);
            }
        }
        _initialize();
    };

    $.fn.pwi.defaults = {
        mode: 'albums', //-- can be: album, albums, latest (keyword = obsolete but backwards compatible, now just fill in a keyword in the settings to enable keyword-photos)
        username: '', //-- Must be explicitly set!!!
        album: "", //-- For loading a single album
        authKey: "", //-- for loading a single album that is private (use in 'album' mode only)
        albums: [], //-- use to load specific albums only: ["MyAlbum", "TheSecondAlbumName", "OtherAlbum"]
        keyword: "", 
        albumKeywords: [], //-- Only show albums containing one of these keywords in the description. Use [keywords: "kw1", "kw2"] within the description
        albumStartDateTime: "", //-- Albums on or after this date will be shown. Format: YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD for date only
        albumEndDateTime: "", //-- Albums before or on this date will be shown
        albumCrop: 1, //-- crop thumbs on albumpage to have all albums in square thumbs (see albumThumbSize for supported sizes)
        albumTitle: "", //-- overrule album title in 'album' mode
        albumThumbSize: 160, //-- specify thumbnail size of albumthumbs (default: 72, supported cropped/uncropped: 32, 48, 64, 72, 104, 144, 150, 160 and uncropped only: 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600)
        albumThumbAlign: 1, //-- Allign thumbs vertically between rows
        albumMaxResults: 999, //-- load only the first X albums
        albumsPerPage: 999, //-- show X albums per page (activates paging on albums when this amount is less then the available albums)
        albumPage: 1, //-- force load on specific album
        albumTypes: "public", //-- load public albums, not used for now
        page: 1, //-- initial page for an photo page
        photoSize: "auto", //-- size of large photo loaded in slimbox, fancybox or other. Allowed sizes: auto, 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600
        maxResults: 50, //-- photos per page
        showPager: 'bottom', //'top', 'bottom', 'both' (for both albums and album paging)
        thumbSize: 72,  //-- specify thumbnail size of photos (default: 72, cropped not supported, supported cropped/uncropped: 32, 48, 64, 72, 104, 144, 150, 160 and uncropped only: 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600)
        thumbCrop: 0, //-- force crop on photo thumbnails (see thumbSize for supported sized)
        thumbAlign: 0, //-- Allign thumbs vertically between rows
        thumbCss: {
            'margin': '5px'
        },
        onclickThumb: "",       //-- overload the function when clicked on a photo thumbnail
        onclickAlbumThumb: "",  //-- overload the function when clicked on a album thumbnail
        sortAlbums: "none",     // Can be none, ASC_DATE, DESC_DATE, ASC_NAME, DESC_NAME
        sortPhotos: "none",     // Can be none, ASC_DATE, DESC_DATE, ASC_NAME, DESC_NAME
        removeAlbums: [],       //-- Albums with this type in the gphoto$albumType will not be shown. Known types are Blogger, ScrapBook, ProfilePhotos, Buzz, CameraSync
        removeAlbumTypes: [],   //-- Albums with this type in the gphoto$albumType will not be shown. Known types are Blogger, ScrapBook, ProfilePhotos, Buzz, CameraSync
        showAlbumTitles: true,  //--following settings should be self-explanatory
        showAlbumTitlesLength: 9999,
        showAlbumThumbs: true,
        showAlbumdate: true,
        showAlbumPhotoCount: true,
        showAlbumDescription: true,
        showAlbumLocation: true,
        showSlideshow: true, //-- Set to true to show slideshow in popup
        showSlideshowLink: false,   //-- Identical to showSlideshow
        showPhotoCaption: false,
        showPhotoCaptionDate: false,
        showCaptionLength: 9999,
        showPhotoDownload: false,
        showPhotoDownloadPopup: false,
        showPhotoDate: true,
        showPermaLink: false,
        showPhotoLocation: false,
        mapIconLocation: "",
        useQueryParameters: true,
        loadingImage: "",
        videoBorder: "images/video.jpg",
        labels: {
            photo: "photo",
            photos: "photos",
            downloadphotos: "Download photos",
            albums: "Back to albums",
            slideshow: "Display slideshow",
            noalbums: "No albums available",
            loading: "PWI fetching data...",
            page: "Page",
            prev: "Previous",
            next: "Next",
            showPermaLink: "Show PermaLink",
            videoNotSupported: "Video not supported",
            devider: "|"
        }, //-- translate if needed
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        fancybox_config: {
            config_photos: {
                closeClick : false,
                nextEffect : 'none',
                loop       : false,
                beforeLoad : formatPhotoTitleFancyBox
            },
            config_youtube: {
                arrows      : false,
                fitToView   : false,
                width       : '90%',
                height      : '90%',
                autoSize    : false,
                closeClick  : false,
                openEffect  : 'none',
                closeEffect : 'none'
            },
            config_slideshow: {
                arrows      : false,
                closeClick  : false
            },
            config_maps: {
                arrows      : false
            }

        },
        colorbox_config: {
            config_photos: {
                title       : formatPhotoTitleColorBox,
                loop : false
            },
            config_youtube: {
                iframe : true, 
                innerWidth : '80%',
                innerHeight : '80%',
                rel : 'nofollow'
            },
            config_slideshow: {
                iframe : true, 
                innerWidth : '80%',
                innerHeight : '80%',
                loop : false,
                rel : 'nofollow'
            },
            config_maps: {
                iframe : true, 
                innerWidth : '80%',
                innerHeight : '80%',
                rel : 'nofollow'
            }
        },
        slimbox_config: {
            loop: false,
            overlayOpacity: 0.6,
            overlayFadeDuration: 400,
            resizeDuration: 400,
            resizeEasing: "swing",
            initialWidth: 250,
            initlaHeight: 250,
            imageFadeDuration: 400,
            captionAnimationDuration: 400,
            counterText: "{x}/{y}",
            closeKeys: [27, 88, 67, 70],
            prevKeys: [37, 80],
            nextKeys: [39, 83]
        }, //-- overrule defaults is needed
        blockUIConfig: {
            message: "<div class='lbLoading pwi_loader'>loading...</div>",
            css: "pwi_loader"
        }, //-- overrule defaults if needed
        albumstore: {}, //-- don't touch
        photostore: {}, //-- don't touch
        popupPlugin: "", // If empty the name will be determined automatically
        popupExt: "", //--  don't touch. Configure using other options
        token: ""
    };
})(jQuery);

// This function is called by FancyBox to format the title of a picture
function formatPhotoTitleFancyBox() {
    this.title = this.element.title;
    if (this.element.parentNode.childElementCount > 1) {
        var $links = $(".downloadlink", this.element.parentNode);
        if ($links.length > 0) {
            var downloadLink = '<a style="color: #FFF;" href="' + $links[0].href + '">Download</a>';
            this.title = this.title + '&nbsp;&nbsp;' + downloadLink;
        }
    }
}

function formatPhotoTitleColorBox() {
    if (this.parentNode.childElementCount > 1) {
        var $links = $(".downloadlink", this.parentNode);
        if ($links.length > 0) {
            return this.title +  '&nbsp;&nbsp;' + "Download".link($links[0].href);
        }
    }
    return this.title;
}
