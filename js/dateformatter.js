/*
 * Viktor's Roam default date format POC
 * version: 0.3
 * author: @ViktorTabori
 *
 * How to install it:
 *  - go to page [[roam/js]]
 *  - create a node with: { {[[roam/js]]}}
 *  - create a clode block pulled under it, and change its type from clojure to javascript
 *  - allow the running of the javascript on the {{[[roam/js]]}} node
 *  - reload roam
 * 
 * How to modify it?
 *  - edit the dateformat variable, default is: dateformat = 'Month Dth, YYYY';
 */
if (window.ViktorDateformatter && typeof window.ViktorDateformatter.stop === 'function') window.ViktorDateformatter.stop();
window.ViktorDateformatter = (function(){

	var dateformat = window.ViktorOpts && window.ViktorOpts.dateformat || 'YYYY.MM.DD EEE';
	// formats dates, roam default is `Month Dth, YYYY`
	/*
	 * YYYY - year, 2020
	 * YY - year, 20
	 * Month - month, January
	 * Mon - month, Jan
	 * MM - month, 01
	 * M - month 1
	 * DD - day, 07
	 * D - day, 7
	 * th - after any number: 5th
	 * (s) - plural form decoder: 5 day(s) -> 5 days
	 * WW - week of year, 09
	 * W - week of year, 9
	 * EEE - day of week, Tuesday
	 * EE - day of week, Tue
	 * E - day of week 1-7
	*/
	var observer,
		started = false,
		lookfor = [
			'title',
			'.level2',
			'.rm-title-display',
			'.rm-ref-page-view-title span', 
			'.rm-page-ref',
			'.rm-search-title',
			'.bp3-text-overflow-ellipsis > div', 
			'.rm-autocomplete-result', 
			'.rm-zoom span',
			'.bp3-popover button.bp3-button' // filters
		].join(', '),
		months = window.ViktorOpts && window.ViktorOpts.nameMonths || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		monthsShort = window.ViktorOpts && window.ViktorOpts.nameMonthsShort || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		days = window.ViktorOpts && window.ViktorOpts.nameDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
		daysShort = window.ViktorOpts && window.ViktorOpts.nameDaysShort || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	// start date change
	setTimeout(start, 1000);

	return {
		start: start,
		stop: stop,
		isStarted: ()=>started,
		observer: observer,
		callback: callback,
		dateformat: dateformat,
		changeDate: changeDate,
	}

	function start() {
		if (started) return;
		started = true;

		// change current dates
		changeDate(document); 

		// subscribe to changes
		observer = new MutationObserver(callback);
		observer.observe(document, { childList: true, subtree: true });

		// log
		console.log('looking for mutations for date change');

		return true;
	}

	function stop() {
		if (!started) return;
		started = false;

		observer.disconnect();

		// rollback
		changeDate(document, true);

		// log
		console.log('stopped looking for date replaces');

		return true;
	}

	function callback(mutationsList, observer) {
		for(var mutation of mutationsList) {
	    	if (mutation.addedNodes && mutation.addedNodes.length) {
				processMutation(mutation);
	    	}
	    }
	}

	function processMutation(mutation) {
		for (var i=0; i<mutation.addedNodes.length; i++) {
			changeDate(mutation.addedNodes[i]);
		}
	}

	function changeDate(dom, remove) {
		if (!dom) return;
		var mutations = [];

		// filter changed elements
		if (dom.querySelectorAll)
			mutations = Array.from(dom.querySelectorAll(remove? '[data-original-text]' : lookfor));
		else
		// ignore textareas
		if (dom.parentNode && dom.parentNode.closest && dom.parentNode.closest('textarea'))
			return;
		else
		// add text nodes
		if (dom.textContent)
			mutations.push(dom);

		mutations = mutations.filter(function(_e){ 
			if (!_e.textContent || !_e.parentNode) return; // return if no text content

			// get date match
			var search = remove && _e.dataset && _e.dataset.originalText || _e.textContent;
			var date = (search.match(/#?(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(st|nd|rd|th), \d{4}/i)||[''])[0];
			if (!date) return;

			// roll back if we are in remove mode
			if (remove) {
				_e.textContent = date;
				delete _e.dataset.originalText;
				return;
			}

			// get exact matching text nodes
			var result = document.evaluate(".//text()[.='"+ date.replace(/'/g,"\\'") +"']", _e, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
			var nodes = Array.from({ length: result.snapshotLength }, (_, index) => result.snapshotItem(index));
			if (!nodes.length) return;
			_e = nodes[0];

			// replace dates
			var changed = _e.textContent.replace(date, function(_v){
				return (_v && _v[0]=='#' ? '#' : '') + dateFormat(_v.replace(/^#/,'').replace(/(\d)(st|nd|rd|th)/g,'$1'), dateformat);
			});

			// only change textContent when the content should be changed, otherwise assigning value to textContent can mess up the DOM
			if (changed != _e.textContent) {
				// save original content
				if (_e.parentNode && _e.parentNode.dataset) _e.parentNode.dataset.originalText = _e.textContent;

				// change format
				_e.textContent = changed;
				return true;
			}

			return;
		});	

		if (mutations.length) {
			//console.log('date replaced:',mutations);
			window._tmp = mutations;
		}
	}

	// formats dates
	/*
	 * dY - delta years between date and today
	 * dM - delta month between date and today
	 * dW - delta week between date and today
	 * dD - delta day between date and today
	 * YYYY - year, 2020
	 * YY - year, 20
	 * Month - month, January
	 * Mon - month, Jan
	 * MM - month, 01
	 * M - month 1
	 * DD - day, 07
	 * D - day, 7
	 * th - after any number: 5th
	 * (s) - plural form decoder: day(s)
	 * WW - week of year, 09
	 * W - week of year, 9
	 * EEE - day of week, Tuesday
	 * EE - day of week, Tue
	 * E - day of week 1-7
	*/
	function dateFormat(date, format){
		var text = format || '[[Month Dth, YYYY]]'; // default format
		var date = new Date(date);
			date.setHours(12,0,0,0);
		var today = new Date();
			today.setHours(12,0,0,0);

		// dD
		text = text.replace(/dD/g, function(){
			return Math.floor(Math.abs(date.getTime()-today.getTime())/1000/60/60/24);
		});

		// dW
		text = text.replace(/dW/g, function(){
			return Math.floor(Math.abs(date.getTime()-today.getTime())/1000/60/60/24/7);
		});

		// dM
		text = text.replace(/dM/g, function(){
			var d1 = new Date(compareDates(date, today) > 0 ? date : today);
			var d2 = new Date(compareDates(date, today) > 0 ? today : date);
			return (d1.getFullYear()-d2.getFullYear())*12+d1.getMonth()-d2.getMonth()+(d1.getDate()>=d2.getDate()?1:0)-1;
		});

		// dY
		text = text.replace(/dY/g, function(){
			var d1 = new Date(compareDates(date, today) > 0 ? date : today);
			var d2 = new Date(compareDates(date, today) > 0 ? today : date);
			var ret = (d1.getFullYear()-d2.getFullYear())-1;
			d2.setFullYear(d1.getFullYear());
			return ret + (compareDates(d1,d2) >= 0 ? 1 : 0);
			//return Math.floor(Math.abs(date.getTime()-today.getTime())/1000/60/60/24/365);
		});

		// YYYY
		text = text.replace(/YYYY/g, function(){
			return date.getFullYear();
		});

		// YY
		text = text.replace(/YY/g, function(){
			return date.getFullYear().toString().substr(-2);
		});

		// Month
		text = text.replace(/Month/g, function(){
			return months[ date.getMonth() ];
		});

		// Mon
		text = text.replace(/Mon/g, function(){
			return monthsShort[ date.getMonth() ];
		});

		// MM
		text = text.replace(/MM/g, function(){
			var month = date.getMonth() + 1;
			return month < 10 ? '0'+month : month;
		});

		// M
		text = text.replace(/M(?![ao])/g, function(){
			return date.getMonth() + 1;
		});

		// DD
		text = text.replace(/DD/g, function(){
			var day = date.getDate();
			return day < 10 ? '0'+day : day;
		});

		// D
		text = text.replace(/D(?!e)/g, function(){
			return date.getDate();
		});

		// WW
		text = text.replace(/WW/g, function(){
			var week = getWeekOfYear(date);
			return week < 10 ? '0'+week : week;
		});

		// W
		text = text.replace(/W(?!e)/g, function(){
			return getWeekOfYear(date);
		});

		// EEE
		text = text.replace(/EEE/g, function(){
			return days[getDayOfWeek(date)];
		});

		// EE
		text = text.replace(/EE/g, function(){
			return daysShort[getDayOfWeek(date)];
		});

		// E
		text = text.replace(/E/g, function(){
			return getDayOfWeek(date)+1;
		});

		// th
		text = text.replace(/(\d+)\s*(th|st|nd|rd)/g, function(_,number){
			var str = number.substr(-2);
			var suffix;
			switch (str.substr(-1)) {
				case '1':
					suffix = 'st';
					break;
				case '2':
					suffix = 'nd';
					break;
				case '3':
					suffix = 'rd';
					break;
				default:
					suffix = 'th';
			}
			// th for all `1X` numbers
			if (str.length > 1 && str[0] == 1) {
				suffix = 'th';
			}
			return number+suffix;
		});

		// (s)
		text = text.replace(/([\s\d\.\,]+)([\w\s]+\(s\))/g, function(_, _n, _w){
			_w = parseFloat(_n.replace(/[\s,]/g,'')) > 1 ? _w.replace('(s)','s') : _w.replace('(s)','');
			return _n+_w;
		});

		return text;
	}

	// add `days` days to date
	function addDay(days, date) {
		date = new Date(date);

		date.setDate(date.getDate()+days);
		return date;
	}

	// return Ceil + 1 for integers, otherwise the Ceil
	function upperCeil(num) {
		return Math.ceil(num%1 === 0 ? num+1 : num);
	}

	// get day of week: 0 - Monday, 6 - Sunday
	function getDayOfWeek(date) {
		date = new Date(date);
		return (date.getDay()+6)%7;	// week begins with monday
	}

	// week number of the year
	function getWeekOfYear(date) {
		date = new Date(date);
		// get first Monday of the year
		var week1 = new Date(date.getFullYear(), 0, 1);
		week1 = addDay(-getDayOfWeek(week1), week1);
		// calculate the difference in weeks
		var diff = (date.getTime()-week1.getTime())/(60*60*24*7*1000);
		return upperCeil(diff);
	}

	// compares two dates
	function compareDates(date1,date2) {
		date1 = (new Date(date1)).toISOString().substr(0,10);
		date2 = (new Date(date2)).toISOString().substr(0,10);

		if (date1 < date2) return -1;
		if (date1 > date2) return 1;
		return 0;
	}

})();
