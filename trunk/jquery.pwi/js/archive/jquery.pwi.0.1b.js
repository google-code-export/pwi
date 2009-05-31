(function($){
	// jQuery Picasa Webalbum Integrator plugin
	$.fn.pwi = function(options) {

		var o = $.extend(true,{},{
			mode: 'albums',
			username: '',
			album: "",
			albums: [],
			albumCrop: 1,
			albumTitle: "",
			albumThumbSize: 160,
			albumMaxResults: 999,
			page: 1,
			photoSize: 800,
			maxResults: 10,
			thumbSize: 72,
			thumbCrop: 0,
			thumbCss: {padding: '5px'},
			thumbClick: "",
			showAlbumTitles: true,
			showAlbumdate: true,
			showAlbumPhotoCount: true,
			showAlbumDescription: true,
			showAlbumLocation: true,
			showSlideshowLink: true,
			showPhotoCaption: true,
			showPhotoDate: true,
			labels: {photo:"photo",
					photos: "photos",
					albums: "Back to albums",
					slideshow: "Display slideshow",
					loading: "PWI fetching data...",
					page: "Page",
					prev: "Previous",
					next: "Next",
					devider: "|"
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
				nextKeys: [37, 80],
				nextKeys: [39, 83]
			},
			albumstore: "",
			photostore: ""
		}, options);
		
		return this.each(function(){
			var $this = $(this);
			if(o.username == ''){
				alert('Make sure you specify at least your username.'+'\n'+'See http://pwi.googlecode.com for more info');
				return;
			}
			switch (o.mode){
				case 'latest':
					getLatest();
				break;

				default:
					$.historyInit(fromHistory);
				break;
			};

			function StringCat() {
				var sp,ep,l = 0;
				this.push = function(what) {
					if (typeof(sp) == 'undefined') {
						ep = new Array();
						sp = ep;
					} else {
						var oep = ep;
						ep = new Array();
						oep[1] = ep;
					}
					ep[0] = what; ++l;
				};
				this.toString = function() {
					if (l == 0) return;
					while (l > 1) {
						var ptr = sp,
							nsp = new Array(),
							nep = nsp,
							nl = 0;
						while (typeof(ptr) != 'undefined') {
							if (typeof(nep[0]) == 'undefined') {
								nep[0] = ptr[0]; ++nl;
							} else {
								if (typeof(ptr[0]) != 'undefined') nep[0] += ptr[0];
								nep[1] = new Array();
								nep = nep[1];
							};
							ptr = ptr[1];
						};
						sp = nsp;
						ep = nep;
						l = nl;
					};
					return sp[0];
				};
			};

			function formatDate(dt) {
				var months = new Array(12),
					today = new Date(Number(dt)),
					year = today.getYear();
				months[0] = "January";
				months[1] = "February";
				months[2] = "March";
				months[3] = "April";
				months[4] = "May";
				months[5] = "June";
				months[6] = "July";
				months[7] = "August";
				months[8] = "September";
				months[9] = "October";
				months[10] = "November";
				months[11] = "December";
				if (year < 1000) {
					year += 1900;
				};
				return (months[(today.getMonth())] + " " + today.getDate() + ", " + year);
			};

			function formatDateTime(dt) {
				var today = new Date(Number(dt)),
					year = today.getYear();
				if (year < 1000) {
					year += 1900
				};
				return (today.getDate() + "-" + (today.getMonth() + 1) + "-" + year + " " + today.getHours() + ":" + (today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes()));
			};
			
			function albums(j) {
				var scAlbums = new StringCat();
				for (var i = 0; i < j.feed.entry.length; i++) {
					var id_base = j.feed.entry[i].gphoto$name.$t,
						album_date = formatDate(j.feed.entry[i].gphoto$timestamp.$t),
						thumb = j.feed.entry[i].media$group.media$thumbnail[0].url.replace(new RegExp("/s160-c/", "g"), "/");
					scAlbums.push("<div class='pwi_album'><a class='standard' href='#' onclick='javascript:$.historyLoad(\"" + id_base + "/1\");return false;' title='"+j.feed.entry[i].title.$t+"'>");
					scAlbums.push("<img src='" + thumb + "?imgmax=" + o.albumThumbSize + "&crop=" + o.albumCrop + "'/><br>");
					o.showAlbumTitles ? scAlbums.push("<a href='#' onclick='javascript:$.historyLoad(\"" + id_base + "/1\");return false;'>" + j.feed.entry[i].title.$t + "</a><br/>" + (o.showAlbumdate ? album_date : "") + ( o.showAlbumPhotoCount ? "&nbsp;&nbsp;&nbsp;&nbsp;" + j.feed.entry[i].gphoto$numphotos.$t + " "+ o.labels.photos : "")) : false;
					scAlbums.push("</div>");
					o.albums[i] = id_base;
				};
				scAlbums.push("<div style='clear: both;height:0px;'> </div>");
				o.albumstore = scAlbums.toString();
				show(false, o.albumstore);
			}
			
			function album(j) {
				var scPhotos = new StringCat(),
					np = j.feed.openSearch$totalResults.$t,
					loc = j.feed.gphoto$location.$t == "undefined" ? "" : j.feed.gphoto$location.$t,
					ad = j.feed.subtitle.$t == "undefined" ? "" : j.feed.subtitle.$t,
					album_date = formatDate(j.feed.gphoto$timestamp.$t),
					item_plural = (np == "1") ? false : true,
					len = j.feed.entry.length;
				o.albumTitle = j.feed.title.$t == "undefined" ? o.albumTitle : j.feed.title.$t;
				scPhotos.push("<div class='pwi_album_description'>");
				if (o.mode != 'album') {
					scPhotos.push("<a href='#' onclick='$.historyLoad(\"\");return false;'>" + o.labels.albums + "</a> &gt; " + o.albumTitle + "<br/>");
				};
				if (o.showAlbumDescription) {
					scPhotos.push("<div class='title'>" + o.albumTitle + "</div>");
					scPhotos.push("<div class='details'>" + np + " " + (item_plural ? o.labels.photos : o.labels.photo) + (o.showAlbumdate ? ", " + album_date: "") + (o.showAlbumLocation && loc ? ", " + loc: "") + "</div>");
					scPhotos.push("<div class='description'>" + ad + "</div>");
					if (o.showSlideshowLink) scPhotos.push("<a href='http://picasaweb.google.com/" + o.username + "/" + j.feed.gphoto$name.$t + "/photo#s" + j.feed.entry[0].gphoto$id.$t + "' rel='gb_page_fs[]' target='_new' class='sslink'>" + o.labels.slideshow + "</a>");
				};
				scPhotos.push("</div>");
				if (np > o.maxResults) {
					pageCount = (np / o.maxResults);
					var ppage = o.labels.prev + " " + o.labels.devider + " ",
						npage = o.labels.devider + " " + o.labels.next,
						navRow = new StringCat();
					if (o.page > 1) {
						ppage = "<a href='#' onclick='$.historyLoad(\"" + o.album + "/" + (parseInt(o.page) - 1) + "\");return false;'>" + o.labels.prev + "</a> | "
					};
					if (o.page < pageCount) {
						npage = "| <a href='#' onclick='$.historyLoad(\"" + o.album + "/" + (parseInt(o.page) + 1) + "\");return false;'>" + o.labels.next + "</a>"
					};
					navRow.push("<div class='pwi_pager'>" + ppage + o.labels.page + " ");
					for (var i = 1; i < pageCount + 1; i++) {
						if (i == o.page) {
							navRow.push("<span class='pwi_pager_current'>" + i + "</span> ");
						} else {
							navRow.push("<a href='#' onclick='$.historyLoad(\"" + o.album + "/" + i + "\");return false;'>" + i + "</a> ");
						};
					};
					navRow.push(npage + "</div>");
					scPhotos.push(navRow.toString());
				};
				for (var i = 0; i < len; i++) {
					var img_base = j.feed.entry[i].content.src,
						id_base = j.feed.entry[i].gphoto$id.$t,
						c = o.showPhotoCaption ? (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t: "") : "",
						dt = o.showPhotoDate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : j.feed.entry[i].published.$t) : "",
						d = dt + " " + c.replace(new RegExp("'", "g"), "&#39;");
					scPhotos.push("<div class='pwi_photo' style='height:" + o.thumbSize + "px;'>");
					scPhotos.push("<a href='" + img_base + "?imgmax=" + o.photoSize + "' rel='lightbox-photo' title='" + d + "'>");
					scPhotos.push("<img src='" + img_base + "?imgmax=" + o.thumbSize + "&crop=" + o.thumbCrop + "'/></a>");
					scPhotos.push("</div>");
				};
				scPhotos.push(navRow);
				scPhotos.push("<div style='clear: both;height:0px;'> </div>"); 
				o.photostore = scPhotos.toString();
				show(false, o.photostore);

				var s = $("div.pwi_photo").css(o.thumbCss);
				if(typeof(o.onclickThumb) != "function" && $.slimbox){
					s.find("a").slimbox(o.slimbox_config);
				}else{
					s.find("a").bind('click',clickThumb);
				}
			};
			
			function latest(j) {
				var scPhotos = new StringCat();
				var len = j.feed.entry.length ? j.feed.entry.length  : 0;
				for (var i = 0; i < len; i++) {
					var img_base = j.feed.entry[i].content.src,
						id_base = j.feed.entry[i].gphoto$id.$t,
						c = o.showPhotoCaption ? (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t: "") : "",
						dt = o.showPhotoDate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : j.feed.entry[i].published.$t) : "",
						d = dt + " " + c.replace(new RegExp("'", "g"), "&#39;");
					
					scPhotos.push("<div class='pwi_photo' style='height:" + o.latest_thumbSize + "px;'>");
					scPhotos.push("<a href='" + img_base + "?imgmax=" + o.photoSize + "' rel='lightbox-photo' title='" + d + "'>");
					scPhotos.push("<img src='" + img_base + "?imgmax=" + o.thumbSize + "&crop=" + o.thumbCrop + "'/></a>");
					scPhotos.push("</div>");
				}
				show(false, scPhotos.toString());
				var s = $("div.pwi_photo").css(o.thumbCss);
				if(typeof(o.onclickThumb) != "function" && $.slimbox){
					s.find("a").slimbox(o.slimbox_config);
				}else{
					s.find("a").bind('click',clickThumb);
				}
			};
			
			function clickThumb(){
				o.onclickThumb.call(this);
				return false;
			}
			function getAlbums() {
				if (o.albumstore!="") {
					show(false, o.albumstore);
				} else {
					show(true, '');
					var url = 'http://picasaweb.google.com/data/feed/api/user/' + o.username + '?category=album&max-results=' + o.albumMaxResults + '&access=public&alt=json';
					$.getJSON(url, 'callback=?', albums);
				};
			};

			function getAlbum() {
					var si = ((o.page - 1) * o.maxResults) + 1,
						url = 'http://picasaweb.google.com/data/feed/api/user/' + o.username + '/album/' + o.album + '?category=photo&max-results=' + o.maxResults + '&start-index=' + si + '&alt=json';
					show(true, '');
					$.getJSON(url, 'callback=?', album);
			};

			function getLatest() {
				show(true, '');
				var url = 'http://picasaweb.google.com/data/feed/api/user/' + o.username + (o.album!="" ? '/album/'+o.album : '') + '?kind=photo&max-results=' + o.maxResults + '&alt=json&q=';
				$.getJSON(url, 'callback=?', latest);
			};

			function fromHistory(hash) {
				if (hash) {
					if (hash.indexOf("/") > 0) {
						o.album = hash.split("/")[0];
						o.page = hash.split("/")[1];
						getAlbum();
					};
				}else if(o.album != '' && o.mode == 'album'){
					getAlbum();
				}else{
					getAlbums();
				};
			};

			function show(loading, data) {
				if (loading) {
					//$("#"+$this_div).fadeOut('slow');
					$this.block({
						message: "<div class='lbLoading pwi_loader'>" + o.labels.loading + "</div>",
						css: "pwi_loader"
					});
				} else {
					$this.unblock().html(data); //.fadeIn('fast');
					//$("a[rel^='lightbox']").slimbox(o.slimbox_config, null,function(el) {return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));});
				};
			};
		});
	};
})(jQuery);
