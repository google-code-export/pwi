(function($){
	
	// jQuery Picasa Webalbum Integrator plugin

	// based on http://nettuts.com/tutorials/javascript-ajax/the-definitive-guide-to-creating-a-practical-jquery-plugin/

	$.fn.pwi = function(options) {
		
		var o = $.extend(true,{},{
			mode: 'albums',
			username: "jdiderik",
			album_crop: 1,
			photosize: 800,
			thumbsize: 72,
			album_thumbsize: 160,
			photo_crop: 0,
			maxresults: 10,
			maxalbums: 3,
			album: "",
			albums: [],
			page: 1,
			albumTitle: "",
			show_albumtitles: true,
			show_albumdate: true,
			show_albumphotocount: true,
			show_albumdescription: true,
			show_albumlocation: true,
			show_slideshowlink: true,
			show_photocaption: true,
			show_photodate: true,
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
			var currentAlbum,si,page;
			
			//alert(config.album);
			switch (o.mode){
				case 'latest':
					getLatest();
				break;

				default:
					$.historyInit(fromHistory);
				break;
			};

			function StringCat() {
				var sp;
				var ep;
				var l = 0;
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
						var ptr = sp;
						var nsp = new Array();
						var nep = nsp;
						var nl = 0;
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
				var months = new Array(12);
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
				var today = new Date(Number(dt));
				var year = today.getYear();
				if (year < 1000) {
					year += 1900;
				};
				return (months[(today.getMonth())] + " " + today.getDate() + ", " + year);
			};

			function formatDateTime(dt) {
				var today = new Date(Number(dt));
				var year = today.getYear();
				if (year < 1000) {
					year += 1900
				};
				return (today.getDate() + "-" + (today.getMonth() + 1) + "-" + year + " " + today.getHours() + ":" + (today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes()));
			};
			
			function albums(j) { //returns the list of all albums for the user
				var scAlbums = new StringCat();
				//scAlbums.push("<div class='pwi_albums'>Albums</div>");
				for (var i = 0; i < j.feed.entry.length; i++) {
					var id_base = j.feed.entry[i].gphoto$name.$t;
					var album_date = formatDate(j.feed.entry[i].gphoto$timestamp.$t);
					var thumb = j.feed.entry[i].media$group.media$thumbnail[0].url.replace(new RegExp("/s160-c/", "g"), "/");
					scAlbums.push("<div class='pwi_album'><a class='standard' href='#' onclick='javascript:$.historyLoad(\"" + id_base + "/1\");return false;' title='"+j.feed.entry[i].title.$t+"'>");
					scAlbums.push("<img src='" + thumb + "?imgmax=" + o.album_thumbsize + "&crop=" + o.album_crop + "'/><br>");
					//album.appendTo($this);
					o.show_albumtitles ? scAlbums.push("<a href='#' onclick='javascript:$.historyLoad(\"" + id_base + "/1\");return false;'>" + j.feed.entry[i].title.$t + "</a><br/>" + (o.show_albumdate ? album_date : "") + ( o.show_albumphotocount ? "&nbsp;&nbsp;&nbsp;&nbsp;" + j.feed.entry[i].gphoto$numphotos.$t + " "+ o.labels.photos : "")) : false;
					scAlbums.push("</div>");
					o.albums[i] = id_base;
				};
				scAlbums.push("<div style='clear: both;height:0px;'> </div>");
				o.albumstore = scAlbums.toString();
				//if (o.album > 0) {
				//	getAlbum(pwi_album_only, 1);
				//} else {
					show(false, o.albumstore);
				//}
			}
			
			function album(j) { //returns all photos in a specific album
				var scPhotos = new StringCat();
				//get the number of photos in the album
				var np = j.feed.openSearch$totalResults.$t;
				var loc = j.feed.gphoto$location.$t == "undefined" ? "" : j.feed.gphoto$location.$t;
				var ad = j.feed.subtitle.$t == "undefined" ? "" : j.feed.subtitle.$t;
				var album_date = formatDate(j.feed.gphoto$timestamp.$t);
				var item_plural = true;
				if (np == "1") item_plural = false;
				var len = j.feed.entry.length;
				o.albumTitle = j.feed.title.$t == "undefined" ? o.albumTitle : j.feed.title.$t;
				scPhotos.push("<div class='pwi_album_description'>");
				if (o.albums.length > 1) {
					scPhotos.push("<a href='#' onclick='$.historyLoad(\"\");return false;'>" + o.labels.albums + "</a> &gt; " + o.albumTitle + "<br/>");
				};
				if (o.show_albumdescription) {
					scPhotos.push("<div class='title'>" + o.albumTitle + "</div>");
					scPhotos.push("<div class='details'>" + np + " " + (item_plural ? o.labels.photos : o.labels.photo) + (o.show_albumdate ? ", " + album_date: "") + (o.show_albumlocation && loc ? ", " + loc: "") + "</div>");
					scPhotos.push("<div class='description'>" + ad + "</div>");
					if (o.show_slideshowlink) scPhotos.push("<a href='http://picasaweb.google.com/" + o.username + "/" + j.feed.gphoto$name.$t + "/photo#s" + j.feed.entry[0].gphoto$id.$t + "' rel='gb_page_fs[]' target='_new' class='sslink'>" + o.labels.slideshow + "</a>");
				};
				scPhotos.push("</div>");
				//create paging navigation
				if (np > o.maxresults) {
					pageCount = (np / o.maxresults);
					var ppage = o.labels.prev + " " + o.labels.devider + " ", npage = o.labels.devider + " " + o.labels.next;
					if (o.page > 1) {
						ppage = "<a href='#' onclick='$.historyLoad(\"" + o.album + "/" + (parseInt(o.page) - 1) + "\");return false;'>" + o.labels.prev + "</a> | "
					};
					if (o.page < pageCount) {
						npage = "| <a href='#' onclick='$.historyLoad(\"" + o.album + "/" + (parseInt(o.page) + 1) + "\");return false;'>" + o.labels.next + "</a>"
					};
					var navRow = new StringCat();
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
					var img_base = j.feed.entry[i].content.src;
					var id_base = j.feed.entry[i].gphoto$id.$t;
					var c = o.show_photocaption ? (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t: "") : "";
					var dt = o.show_photodate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : j.feed.entry[i].published.$t) : "";
					var d = dt + " " + c.replace(new RegExp("'", "g"), "&#39;");
					scPhotos.push("<div class='pwi_photo' style='height:" + o.thumbsize + "px;'>");
					scPhotos.push("<a href='" + img_base + "?imgmax=" + o.photosize + "' rel='lightbox-photo' title='" + d + "'>");
					scPhotos.push("<img src='" + img_base + "?imgmax=" + o.thumbsize + "&crop=" + o.photo_crop + "'/></a>");
					scPhotos.push("</div>");
				};
				scPhotos.push(navRow);
				scPhotos.push("<div style='clear: both;height:0px;'> </div>"); 
				o.photostore = scPhotos.toString();
				show(false, o.photostore);
			};
			
			function latest(j) { //returns all recent photos
				var scPhotos = new StringCat();
				var len = j.feed.entry.length;
				for (var i = 0; i < len; i++) {
					var img_base = j.feed.entry[i].content.src;
					var id_base = j.feed.entry[i].gphoto$id.$t;
					var c = o.show_photocaption ? (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t: "") : "";
					var dt = o.show_photodate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : j.feed.entry[i].published.$t) : "";
					var d = dt + " " + c.replace(new RegExp("'", "g"), "&#39;");
					scPhotos.push("<div class='pwi_photo' style='height:" + o.latest_thumbsize + "px;'>");
					scPhotos.push("<a href='" + img_base + "?imgmax=" + o.photosize + "' rel='lightbox-photo' title='" + d + "'>");
					scPhotos.push("<img src='" + img_base + "?imgmax=" + o.thumbsize + "&crop=" + o.photo_crop + "'/></a>");
					scPhotos.push("</div>");
				}
				//o.lateststore = scPhotos.toString();
				show(false, scPhotos.toString());
			}

			function getAlbums() {
				if (o.albumstore!="") {
					show(false, o.albumstore);
				} else {
					show(true, '');
					var url = 'http://picasaweb.google.com/data/feed/api/user/' + o.username + '?category=album' + (o.maxalbums > 0 ? '&max-results=' + o.maxalbums: "") + '&access=public&alt=json';
					$.getJSON(url, 'callback=?', albums);
				};
			};

			function getAlbum() {
					var si = ((o.page - 1) * o.maxresults) + 1;
					var url = 'http://picasaweb.google.com/data/feed/api/user/' + o.username + '/album/' + o.album + '?category=photo&max-results=' + o.maxresults + '&start-index=' + si + '&alt=json';
					show(true, '');
					$.getJSON(url, 'callback=?', album);
			};

			function getLatest() {
				show(true, '');
				var url = 'http://picasaweb.google.com/data/feed/api/user/' + o.username + '?kind=photo&max-results=' + (o.maxresults > 0 ? o.maxresults : "3") + '&alt=json&q=';
				$.getJSON(url, 'callback=?', latest);
			};

			function fromHistory(hash) {
				if (hash) {
					if (hash.indexOf("/") > 0) {
						o.album = hash.split("/")[0];
						o.page = hash.split("/")[1];
						getAlbum();
					};
				//}else if(o.album != ""){
				//	getAlbum();
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
					$("a[rel^='lightbox']").slimbox(o.slimbox_config, null,
					function(el) {
						return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
					});
				};
			};
		});
	};
})(jQuery);
