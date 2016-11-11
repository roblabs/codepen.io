function prettyDate(now, time){
	var date = new Date(time || ""),
		diff = (((new Date(now)).getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400);

	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
		return;

	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) +
				" minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) +
				" hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) +
			" weeks ago";
}


	QUnit.test("prettydate basics", function( assert ) {
		var now = "2008/01/28 22:25:00";
		assert.equal(prettyDate(now, "2008/01/28 22:24:30"), "just now");
		assert.equal(prettyDate(now, "2008/01/28 22:23:30"), "1 minute ago");
		assert.equal(prettyDate(now, "2008/01/28 21:23:30"), "1 hour ago");
		assert.equal(prettyDate(now, "2008/01/27 22:23:30"), "Yesterday");
		assert.equal(prettyDate(now, "2008/01/26 22:23:30"), "2 days ago");
		assert.equal(prettyDate(now, "2007/01/26 22:23:30"), undefined);
	});