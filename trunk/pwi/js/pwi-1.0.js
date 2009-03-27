/**
 * Picasa Webalbum Integration Library
 * This library was inspired and based on pwa by Dieter Raber (http://www.gnu.org/copyleft/lesser.html)
 * @name pwi-1.0.js
 * @author Jeroen Diderik - http://www.multiprof.nl/
 * @version 1.0
 * @date March 27, 2009
 * @copyright (c) 2008 Jeroen Diderik(www.multiprof.nl)
 * @license Creative Commons Attribution-Share Alike 3.0 Netherlands License - http://creativecommons.org/licenses/by-sa/3.0/nl/
 * @example Visit http://pwi.googlecode.com/ for more informations, duscussions etc about this library
 */


//Global user variables to set (CHANGE TO WHAT YOU WANT IT TO BE)
var pwi_username = "YOUR_PICASA_NAME"; 			//Your username at Picasa WebAlbums
var pwi_container_div = "container"; 	//Specifiy the id of the div in which the albums should be loaded inside your html/template/...
var pwi_album_only = "";				//setup with ONE specific album only, choose an album and take the name from the url between "#" and the last "/1"
var pwi_album_thumbsize = 160;			//supported sizes: 32, 48, 64, 72, 144, 160 (http://code.google.com/apis/picasaweb/reference.html#Parameters)
var pwi_album_crop = 1;					// 1 = crop to thumbsize, making them square, or 0 = keep original aspect ratio making the thumbsize the max width and height
var pwi_photosize = 800; 				//Supported sizes: 200, 288, 320, 400, 512, 576, 640, 720, 800 (http://code.google.com/apis/picasaweb/reference.html#Parameters)
var pwi_thumbsize = 72; 				//supported sizes: 32, 48, 64, 72, 144, 160 (http://code.google.com/apis/picasaweb/reference.html#Parameters)
var pwi_photo_crop = 0; 				// 1 = crop to thumbsize, making them square, or 0 = keep original aspect ratio making the thumbsize the max width and height
var pwi_maxresults = 999; 				//pictures per page

//Album and Photo details to show or not
var pwi_show_albumtitles = true;
var pwi_show_albumdate = true;
var pwi_show_albumphotocount = true;
var pwi_show_albumdescription = true;
var pwi_show_albumlocation = true;
var pwi_show_slideshowlink = true;
var pwi_show_photocaption = true;
var pwi_show_photodate = true;

// LABELS, translate ON THE RIGHT SIDE OF THE = if you want
var pwi_labels = new Array();
pwi_labels["photo"] 	= "photo";
pwi_labels["photos"] 	= "photos";
pwi_labels["albums"] 	= "Back to albums";
pwi_labels["slideshow"] = "Display slideshow";
pwi_labels["loading"] 	= "PWI fetching data...";
pwi_labels["page"] 		= "Page";
pwi_labels["prev"] 		= "Previous";
pwi_labels["next"] 		= "Next";
pwi_labels["devider"] 	= "|";

//SLIMBOX settings, making the single photo view personal to your likings (http://www.digitalia.be/software/slimbox2)
var pwi_slimbox_config = {
	loop: false,
	overlayOpacity: 0.6,
	overlayFadeDuration: 400,
	resizeDuration: 400,
	resizeEasing: "swing",
	initialWidth: 250,
	initlaHeight: 250,
	imageFadeDuration: 400,
	captionAnimationDuration: 400,
	counterText: "Photo {x} of {y}",
	closeKeys: [27, 88, 67, 70],
	nextKeys: [37, 80],
	nextKeys: [39, 83]
}




// ****  DONT CHANGE BELOW UNLESS YOU KNOW WHAT YOU ARE DOING ****
//preset globals
//Mainly for testing, set to 0 to disable
var pwi_maxalbums = 0; //maximum of pictures on albumphotos page

var pwi_currAlbum = "";
var pwi_currAlbumTitle = "";
var pwi_currPhoto = "";
var pwi_page = "";
var pwi_si = 1;
var pwi_storage_albums;
var pwi_storage_photos;
var pwi_storage_photo;
var pwi_history = "";

//fast string concat function ( var.push(x), var.toString() )
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
}

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
}

function formatDateTime(dt) {
	var today = new Date(Number(dt));
	var year = today.getYear();
	if (year < 1000) {
		year += 1900
	};
	return (today.getDate() + "-" + (today.getMonth() + 1) + "-" + year + " " + today.getHours() + ":" + (today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes()));
}

var photoids = new Array();

function albums(j) { //returns the list of all albums for the user
	var scAlbums = new StringCat();
	//scAlbums.push("<div class='pwi_albums'>Albums</div>");
	for (var i = 0; i < j.feed.entry.length; i++) {
		var id_base = j.feed.entry[i].gphoto$name.$t;
		var album_date = formatDate(j.feed.entry[i].gphoto$timestamp.$t);
		var thumb = j.feed.entry[i].media$group.media$thumbnail[0].url.replace(new RegExp("/s160-c/", "g"), "/");
		scAlbums.push("<div class='pwi_album' style='height:"+pwi_album_thumbsize+"px;'><a class='standard' href='javascript:void(0)' onclick='javascript:$.historyLoad(\"" + id_base + "/1\")' title='"+j.feed.entry[i].title.$t+"'>");
		scAlbums.push("<img src='" + thumb + "?imgmax=" + pwi_album_thumbsize + "&crop=" + pwi_album_crop + "'/></a><br>");
		pwi_show_albumtitles ? scAlbums.push("<a href='javascript:void(0)' onclick='javascript:$.historyLoad(\"" + id_base + "/1\")'>" + j.feed.entry[i].title.$t + "</a><br/>" + (pwi_show_albumdate ? album_date : "") + ( pwi_show_albumphotocount ? "&nbsp;&nbsp;&nbsp;&nbsp;" + j.feed.entry[i].gphoto$numphotos.$t + " "+ pwi_labels["photos"] : "")) : false;
		scAlbums.push("</div>");
	}
	scAlbums.push("<div style='clear: both;height:0px;'> </div>");
	pwi_storage_albums = scAlbums.toString();

	if (pwi_album_only.length > 0) {
		getAlbum(pwi_album_only, 1);
	} else {
		show(false, pwi_storage_albums);
	}
}

function album(j) { //returns all photos in a specific album
	var scPhotos = new StringCat();
	//get the number of photos in the album
	var np = j.feed.openSearch$totalResults.$t;
	var loc = j.feed.gphoto$location.$t;
	var ad = j.feed.subtitle.$t;
	var album_date = formatDate(j.feed.gphoto$timestamp.$t);
	var item_plural = true;
	if (np == "1") item_plural = false;
	var len = j.feed.entry.length;
	pwi_currAlbumTitle = j.feed.title.$t;
	scPhotos.push("<div class='pwi_album_description'>");
	if (!pwi_album_only.length > 0) {
		scPhotos.push("<a href='javascript:void(0)' onclick='$.historyLoad(\"\");'>" + pwi_labels["albums"] + "</a> &gt; " + j.feed.title.$t + "<br/>");
	};
	if (pwi_show_albumdescription) {
		scPhotos.push("<div class='title'>" + j.feed.title.$t + "</div>");
		scPhotos.push("<div class='details'>" + np + " " + (item_plural ? pwi_labels["photos"] : pwi_labels["photo"]) + (pwi_show_albumdate ? ", " + album_date: "") + (pwi_show_albumlocation && loc ? ", " + loc: "") + "</div>");
		scPhotos.push("<div class='description'>" + (ad ? ad: "") + "</div>");
		if (pwi_show_slideshowlink) scPhotos.push("<a href='http://picasaweb.google.com/" + pwi_username + "/" + j.feed.gphoto$name.$t + "/photo#s" + j.feed.entry[0].gphoto$id.$t + "' rel='gb_page_fs[]' target='_new' class='sslink'>" + pwi_labels["slideshow"] + "</a>");
	}
	scPhotos.push("</div>");
	//create paging navigation
	if (np > pwi_maxresults) {
		pageCount = (np / pwi_maxresults);
		var ppage = pwi_labels["prev"] + " " + pwi_labels["devider"] + " ",
		npage = pwi_labels["devider"] + " " + pwi_labels["next"];
		if (pwi_page > 1) {
			ppage = "<a href='javascript:void(0)' onclick='$.historyLoad(\"" + pwi_currAlbum + "/" + (parseInt(pwi_page) - 1) + "\")'>previous</a> | "
		};
		if (pwi_page < pageCount) {
			npage = "| <a href='javascript:void(0)' onclick='$.historyLoad(\"" + pwi_currAlbum + "/" + (parseInt(pwi_page) + 1) + "\")'>next</a>"
		};
		var navRow = new StringCat();
		navRow.push("<div class='pwi_pager'>" + ppage + pwi_labels["page"] + " ");
		for (var i = 1; i < pageCount + 1; i++) {
			if (i == pwi_page) {
				navRow.push("<span class='pwi_pager_current'>" + i + "</span> ");
			} else {
				navRow.push("<a href='javascript:void(0)' onclick='$.historyLoad(\"" + pwi_currAlbum + "/" + i + "\")'>" + i + "</a> ");
			};
		};
		navRow.push(npage + "</div>");
		scPhotos.push(navRow.toString());
	}
	for (var i = 0; i < len; i++) {
		var img_base = j.feed.entry[i].content.src;
		var id_base = j.feed.entry[i].gphoto$id.$t;
		var c = pwi_show_photocaption ? (j.feed.entry[i].summary.$t ? j.feed.entry[i].summary.$t: "") : "";
		var dt = pwi_show_photodate ? (j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : j.feed.entry[i].published.$t) : "";
		var d = dt + " " + c.replace(new RegExp("'", "g"), "&#39;");
		scPhotos.push("<div class='pwi_photo' style='height:" + pwi_thumbsize + "px;'>");
		scPhotos.push("<a href='" + img_base + "?imgmax=" + pwi_photosize + "' rel='lightbox-photo' title='" + d + "'>");
		scPhotos.push("<img src='" + img_base + "?imgmax=" + pwi_thumbsize + "&crop=" + pwi_photo_crop + "'/></a>");
		scPhotos.push("</div>");
	}
	scPhotos.push(navRow);
	pwi_storage_photos = scPhotos.toString();
	show(false, pwi_storage_photos);
}

function getAlbums() {
	if (pwi_storage_albums) {
		show(false, pwi_storage_albums);
	} else {
		show(true, '');
		var url = 'http://picasaweb.google.com/data/feed/api/user/' + pwi_username + '?category=album' + (pwi_maxalbums > 0 ? '&max-results=' + pwi_maxalbums: "") + '&access=public&alt=json';
		$.getJSON(url, 'callback=?', albums);
	}
}

function getAlbum(albumid, newPage) {
	if (albumid != pwi_currAlbum || pwi_page != newPage) {
		pwi_page = newPage;
		pwi_currAlbum = albumid;
		pwi_si = ((pwi_page - 1) * pwi_maxresults) + 1;
		var url = 'http://picasaweb.google.com/data/feed/api/user/' + pwi_username + '/album/' + albumid + '?category=photo&max-results=' + pwi_maxresults + '&start-index=' + pwi_si + '&alt=json';
		show(true, '');
		$.getJSON(url, 'callback=?', album);
	} else {
		show(false, pwi_storage_photos);
	}
}

function fromHistory(hash) {
	if (hash) {
		var a, p;
		if (hash.indexOf("/") > 0) {
			a = hash.split("/")[0];
			p = hash.split("/")[1];
			getAlbum(a, p);
		}
	} else {
		getAlbums();
	}
}

function show(loading, data) {
	if (loading) {
		//$("#"+pwi_container_div).fadeOut('slow');
		$("#" + pwi_container_div).block({
			message: "<div class='lbLoading pwi_loader'>" + pwi_labels["loading"] + "</div>",
			css: "pwi_loader"
		});
	} else {
		$("#" + pwi_container_div).unblock();
		$("#" + pwi_container_div).html(data); //.fadeIn('fast');
		$("a[rel^='lightbox']").slimbox(pwi_slimbox_config, null,
		function(el) {
			return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
		});
	}
}

$(document).ready(function() {
	if (pwi_username == "YOUR_PICASA_NAME") {
		alert('Open the pwi js-file and change content \nof the variable pwi_username in the top of the file\nto your Picasa Webalbum username');
	} else {
		$.extend($.blockUI.defaults.overlayCSS, {
			backgroundColor: '#000'
		});
		$.ajaxSetup({
			cache: true
		});
		$("#" + pwi_container_div).addClass("pwi_container");
		$.historyInit(fromHistory);
	}
});

//$Update: May 10, 2007$
//$Update: July 31, 2007, Jeroen Diderik$
//$Update: September 23, 2007, Jeroen Diderik, Mootools conversion$
//$Update: November 19, 2007, Jeroen Diderik, PWI vars update$
//$Update: March 25, 2008, Jeroen Diderik, rewrite to replace MOOTools with  jQuery$
//$Update: April 05, 2008, Jeroen Diderik, rewrite for early release$
//$update: October 21, 2008, Jeroen Diderik, added ALBUM_ONLY option
//$update: March 27, 2009, Jeroen Diderik, added many option and rewrote to using DIVs
