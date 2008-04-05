/**
 * Picasa Webalbum Integration Library
 * This library was inspired and based on pwa  by Dieter Raber (http://www.gnu.org/copyleft/lesser.html)
 * @name pwi.js
 * @author Jeroen Diderik - http://www.multiprof.nl
 * @version 0.2
 * @date March 27, 2008
 * @copyright (c) 2008 Jeroen Diderik(www.multiprof.nl)
 * @license Creative Commons Attribution-Share Alike 3.0 Netherlands License - http://creativecommons.org/licenses/by-sa/3.0/nl/
 * @example Visit http://www.multiprof.nl/ for more informations about this library
 */
 
//Global user variables to set (CHANGE TO WHAT YOU WANT IT TO BE)
var pwi_username = "your_picasa_username";
var pwi_photosize = 512; //return maximum size picture (see for supported format:  http://code.google.com/apis/picasaweb/reference.html#Parameters)
var pwi_thumbsize = 64; //size thumb /cropped(see for supported format:  http://code.google.com/apis/picasaweb/reference.html#Parameters)
var pwi_albumcols = 3; // distribute thumbs on main page over x collums
var pwi_cols = 6; // distribute thumbs on albumphotos page over x collums
var pwi_maxresults = 24; //maximum of pictures on albumphotos page
var pwi_maxalbums = 6; //maximum of pictures on albumphotos page
var pwi_container_div = "#container";


// ****  DONT CHANGE BELOW UNLESS YOU KNOW WHAT YOU ARE DOING ****
//preset globals
var pwi_currAlbum = "";
var pwi_currAlbumTitle = "";
var pwi_currPhoto = "";
var pwi_page = "";
var pwi_si = 1;
var pwi_storage_albums;
var pwi_storage_photos;
var pwi_storage_photo;
var pwi_history = "";

// various functions
//get querytring (for later use to make deeplinks)
function readGet() {
	var _GET = new Array();
	var uriStr = window.location.href.replace(/&amp;/g, '&');
	var paraArr,
	paraSplit;
	if (uriStr.indexOf('?') > -1) {
		var uriArr = uriStr.split('?');
		var paraStr = uriArr[1];
	} else {
		return _GET;
	}
	if (paraStr.indexOf('&') > -1) {
		paraArr = paraStr.split('&');
	} else {
		paraArr = new Array(paraStr);
	}
	for (var i = 0; i < paraArr.length; i++) {
		paraArr[i] = paraArr[i].indexOf('=') > -1 ? paraArr[i] : paraArr[i] + '=';
		paraSplit = paraArr[i].split('=');
		_GET[paraSplit[0]] = decodeURI(paraSplit[1].replace(/\+/g, ' '));
	}
	return _GET;
};
var _GET = readGet();

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
	scAlbums.push("<center><table><tr><td colspan='" + pwi_albumcols + "'><H3>Albums</H3></td></tr><tr>");
	for (var i = 0; i < j.feed.entry.length; i++) {
		var id_base = j.feed.entry[i].gphoto$id.$t;
		var album_date = formatDate(j.feed.entry[i].gphoto$timestamp.$t);
		scAlbums.push("<td valign=top align=center><a class='standard' href='javascript:void(0)' onclick='javascript:$.historyLoad(\"" + id_base + "/1\")'><img src='" + j.feed.entry[i].media$group.media$thumbnail[0].url + "?imgmax=" + pwi_thumbsize + "&crop=1' class='pwimages' /></a>");
		scAlbums.push("<br><a class='standard' href='javascript:void(0)' onclick='javascript:$.historyLoad(\"" + id_base + "/1\")'>" + j.feed.entry[i].title.$t + "</a><br/>" + album_date + "&nbsp;&nbsp;&nbsp;&nbsp;" + j.feed.entry[i].gphoto$numphotos.$t + " photos</center></td>");
		if (i % pwi_albumcols == (pwi_albumcols - 1)) {
			scAlbums.push("</tr><tr><td colspan='" + pwi_albumcols + "'><hr/></td></tr><tr>");
		}
	}
	scAlbums.push("</tr></table></center>");
	pwi_storage_albums = scAlbums.toString();
	show(false, pwi_storage_albums);
}

function album(j) { //returns all photos in a specific album
	var scPhotos = new StringCat();
	 //get the number of photos in the album
	var np = j.feed.openSearch$totalResults.$t;
	var loc = j.feed.gphoto$location.$t;
	var desc = j.feed.subtitle.$t;
	var album_date = formatDate(j.feed.gphoto$timestamp.$t);
	var item_plural = "s";
	if (np == "1") {
		item_plural = "";
	}
	var len = j.feed.entry.length;
	pwi_currAlbumTitle = j.feed.title.$t;

	scPhotos.push("<center><table border=0><tr>");
	scPhotos.push("<tr><td colspan='" + pwi_cols + "'><a class='standard' href='#'><<< Albums</a> &gt; " + j.feed.title.$t + "<br/>");
	scPhotos.push("<blockquote><div style='margin-left:3px'><h4>" + j.feed.title.$t + "</h4></div>");
	scPhotos.push("<div style='margin-left:3px'><i>" + np + " photo" + item_plural + ", " + album_date + ", " + loc + "</i></div>");
	scPhotos.push("<div style='margin-left:3px'><b>" + desc + "</b></div>");
	scPhotos.push("<div style='margin-left:3px'><a href='http://picasaweb.google.com/" + pwi_username + "/" + j.feed.gphoto$name.$t + "/photo#s" + j.feed.entry[0].gphoto$id.$t + "' rel='gb_page_fs[]' target='_new'>View as slideshow</a></div></blockquote><br/>");
	scPhotos.push("</td></tr><tr>");

	 //create paging navigation
	pageCount = (np / pwi_maxresults);
	var ppage = "previous | ",
	npage = "| next";
	if (pwi_page > 1) {
		ppage = "<a href='javascript:void(0)' onclick='$.historyLoad(\"" + pwi_currAlbum + "/" + (parseInt(pwi_page) - 1) + "\")'>previous</a> | "
	};
	if (pwi_page < pageCount) {
		npage = "| <a href='javascript:void(0)' onclick='$.historyLoad(\"" + pwi_currAlbum + "/" + (parseInt(pwi_page) + 1) + "\")'>next</a>"
	};

	var navRow = new StringCat();
	navRow.push("<tr><td colspan='" + pwi_cols + "'>" + ppage + "Page ");
	for (var i = 1; i <= pageCount + 1; i++) {
		if (i == pwi_page) {
			navRow.push("<b>[" + (i) + "]</b> ");
		} else {
			navRow.push("<a href='javascript:void(0)' onclick='$.historyLoad(\"" + pwi_currAlbum + "/" + i + "\")'>" + (i) + "</a> ");
		};
	};
	navRow.push(npage + "</td></tr>");
	scPhotos.push(navRow.toString());
	for (var i = 0; i < len; i++) {
		var img_base = j.feed.entry[i].content.src;
		var id_base = j.feed.entry[i].gphoto$id.$t;
		var desc = j.feed.entry[i].summary.$t;
		var photoDate = j.feed.entry[i].exif$tags.exif$time ? formatDateTime(j.feed.entry[i].exif$tags.exif$time.$t) : j.feed.entry[i].published.$t;
		desc = photoDate + " - " + desc;
		scPhotos.push("<td valign=top><center><a href='" + img_base + "?imgmax=" + pwi_photosize + "&crop=0' class='lightbox' title='" + desc + "'><img src='" + img_base + "?imgmax=" + pwi_thumbsize + "&crop=1' class='pwimages'/></a><br/>");
		scPhotos.push("<small>" + photoDate + "</small></center></td>");
		if (i % pwi_cols == (pwi_cols - 1)) {
			scPhotos.push("</tr><tr><td colspan=" + pwi_cols + "><hr size='1'/></td></tr><tr>");
		}
	}
	scPhotos.push("</tr>"+navRow+"</table></center>");
	pwi_storage_photos = scPhotos.toString();
	show(false, pwi_storage_photos);
}

function getAlbums() {
	if (pwi_storage_albums) {
		show(false, pwi_storage_albums);
	} else {
		show(true, '');
		var url = 'http://picasaweb.google.com/data/feed/api/user/' + pwi_username + '?category=album&max-results=' + pwi_maxalbums + '&access=public&alt=json';
		$.getJSON(url, 'callback=?', albums);
	}
}

function getAlbum(albumid, newPage) {
	if (albumid != pwi_currAlbum || pwi_page != newPage) {
		pwi_page = newPage;
		pwi_currAlbum = albumid;
		pwi_si = ((pwi_page - 1) * pwi_maxresults) + 1;
		var url = 'http://picasaweb.google.com/data/feed/api/user/' + pwi_username + '/albumid/' + albumid + '?category=photo&max-results=' + pwi_maxresults + '&start-index=' + pwi_si + '&alt=json';
		show(true, '');
		$.getJSON(url, 'callback=?', album);
	} else {
		show(false, pwi_storage_photos);
	}
}

function fromHistory(hash) {
	if (hash) {
		var a,p;
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
		$(pwi_container_div).fadeOut('slow');
		$("#maincontent").block("<img src=\"images/lightbox-ico-loading.gif\"> Loading ...", {
			border: '3px solid #a00'
		});
	} else {
		$("#maincontent").unblock();
		$(pwi_container_div).html(data).fadeIn('fast');
		$('a.lightbox').lightBox();
	}
}

$(document).ready(function() {
	if(pwi_username == "your_picasa_username"){
		alert('Open the pwi.js and change content \nof the variable pwi_username in the top of the file\nto your Picasa Webalbum name');
	}else{
		$.extend($.blockUI.defaults.overlayCSS, {
			backgroundColor: '#000'
		});
		$.ajaxSetup({
			cache: true
		});
		$.historyInit(fromHistory);
	}
});


//$Update: May 10, 2007$
//$Update: July 31, 2007, Jeroen Diderik$
//$Update: September 23, 2007, Jeroen Diderik, Mootools conversion$
//$Update: November 19, 2007, Jeroen Diderik, PWI vars update$
//$Update: March 25, 2008, Jeroen Diderik, rewrite to replace MOOTools with  jQuery$
//$Update: April 05, 2008, Jeroen Diderik, rewrite for early release$

/*
TOD0: photo details
function getPhoto(photoid){
	pwi_currPhoto = photoid;
	url = 'http://picasaweb.google.com/data/entry/api/user/'+pwi_username+'/albumid/'+pwi_currAlbum+'/photoid/'+photoid+'?alt=json';
	show(true,'');
	$.getJSON(url, 'callback=?',photo);
}
*/
